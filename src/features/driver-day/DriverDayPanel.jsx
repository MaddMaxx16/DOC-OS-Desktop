import { useState } from 'react'
import { formatClock } from '../../domain/manifest/driverDayModel.js'
import {
  canEditDispatchPlan,
  dispatchPlanStatusLabel,
} from '../../domain/planning/dispatchPlan.js'
import { isSelection, SELECTION_TYPES } from '../../domain/selection/selectionModel.js'
import './driverDay.css'

function formatWeight(value) {
  return `${Math.round(Number(value || 0) / 1000)}k lb`
}

function eventCode(item) {
  if (item.kind === 'shift-start') return 'START'
  if (item.kind === 'lunch') return 'LUNCH'
  if (item.kind === 'staging') return 'STAGE'
  const prefix = item.role === 'pickup' ? 'P' : 'D'
  return `${prefix}${item.loadOrdinal}`
}

function FreightMeta({ item, capacityPallets }) {
  const capacity = item.capacityAfter
  return (
    <>
      <div className="day-row-meta">
        <span>{item.role.toUpperCase()}</span>
        <b>{item.loadRef}</b>
        <em>{formatClock(item.appointmentStartMinutes)}–{formatClock(item.appointmentEndMinutes)}</em>
      </div>
      <div className="capacity-after">
        <span>{capacity.palletsUsed}/{capacityPallets} pallets</span>
        <span>{formatWeight(capacity.weightUsedLbs)}</span>
        <span>{capacity.onboardLoadIds.length} onboard</span>
      </div>
    </>
  )
}

function PlanHealth({ health }) {
  if (!health) return null

  const primary = health.blockers?.[0] ?? health.warnings?.[0] ?? 'Appointments, capacity, and HOS are clear.'
  const count = health.blockers?.length || health.warnings?.length || 0
  const label = health.status === 'blocked'
    ? 'BLOCKED'
    : health.status === 'warning'
      ? `${count} WARNING${count === 1 ? '' : 'S'}`
      : 'READY'

  return (
    <div className={`plan-health ${health.status}`}>
      <span>PLAN CHECK</span>
      <strong>{label}</strong>
      <small>{primary}</small>
    </div>
  )
}

export default function DriverDayPanel({
  driver,
  day,
  selection,
  planning = false,
  planningFeedback = null,
  onStartPlanning,
  onStopPlanning,
  onReorderStop,
  onSelectSubject,
}) {
  const [draggedStopId, setDraggedStopId] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)

  if (!driver || !day) return null

  const editable = canEditDispatchPlan(day)
  const planLabel = dispatchPlanStatusLabel(day)

  const clearDragState = () => {
    setDraggedStopId(null)
    setDropTarget(null)
  }

  const startDrag = (event, stopId) => {
    if (!planning) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', stopId)
    setDraggedStopId(stopId)
  }

  const setDropPosition = (event, targetStopId) => {
    if (!planning || !draggedStopId || draggedStopId === targetStopId) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const bounds = event.currentTarget.getBoundingClientRect()
    const placement = event.clientY < bounds.top + (bounds.height / 2) ? 'before' : 'after'
    setDropTarget({ id: targetStopId, placement })
  }

  const dropStop = (event, targetStopId) => {
    if (!planning || !draggedStopId || draggedStopId === targetStopId) {
      clearDragState()
      return
    }

    event.preventDefault()
    const bounds = event.currentTarget.getBoundingClientRect()
    const placement = event.clientY < bounds.top + (bounds.height / 2) ? 'before' : 'after'

    onReorderStop?.({
      driverId: driver.id,
      stopId: draggedStopId,
      targetStopId,
      placement,
    })
    clearDragState()
  }

  return (
    <section className={`driver-day-panel ${planning ? 'planning' : ''}`}>
      <div className="driver-day-summary" aria-label="Driver day operational summary">
        <div>
          <span>SHIFT</span>
          <strong>{formatClock(day.shift.startMinutes)}–{formatClock(day.shift.endMinutes)}</strong>
        </div>
        <div>
          <span>HOS</span>
          <strong>{day.hos.drive} / {day.hos.duty}</strong>
          <small>DRIVE / DUTY</small>
        </div>
        <div>
          <span>TRAILER</span>
          <strong>{day.trailer.peakPalletsUsed}/{day.trailer.capacityPallets} PLT</strong>
          <small>{formatWeight(day.trailer.peakWeightUsedLbs)} / {formatWeight(day.trailer.maxWeightLbs)}</small>
        </div>
      </div>

      <div className="driver-day-heading">
        <div>
          <span>{planLabel}</span>
          <strong>Driver Day</strong>
          <small>{day.freightStops.length} freight stops</small>
        </div>

        {editable ? (
          <button
            type="button"
            className={planning ? 'planning-active' : ''}
            onClick={planning ? onStopPlanning : onStartPlanning}
          >
            {planning ? 'DONE' : 'EDIT PLAN'}
          </button>
        ) : (
          <em className="driver-day-sent-lock">SENT</em>
        )}
      </div>

      {planning && (
        <>
          <div className="planning-mode-note">
            <span>PLANNING MODE · STOP SEQUENCING</span>
            <strong>Drag freight stops to rebuild the day. Pickup must stay before its matching delivery.</strong>
          </div>

          <PlanHealth health={day.planHealth} />

          {planningFeedback && (
            <div className={`planning-feedback ${planningFeedback.tone}`} role="status">
              {planningFeedback.message}
            </div>
          )}
        </>
      )}

      <div className="driver-day-timeline">
        {day.timeline.map((item, index) => {
          const selectable = ['freight-stop', 'lunch', 'staging'].includes(item.kind)
          const selected = selectable && isSelection(selection, SELECTION_TYPES.STOP, item.id)
          const draggableStop = planning && item.kind === 'freight-stop'
          const dragging = draggedStopId === item.id
          const droppingBefore = dropTarget?.id === item.id && dropTarget.placement === 'before'
          const droppingAfter = dropTarget?.id === item.id && dropTarget.placement === 'after'

          const content = (
            <>
              <div className="timeline-rail">
                <span className="timeline-dot" />
                {index < day.timeline.length - 1 && <i />}
              </div>
              <time>{formatClock(item.projectedArrivalMinutes)}</time>
              <div className="timeline-content">
                <div className="timeline-title">
                  {draggableStop && <span className="stop-drag-handle" aria-hidden="true">⋮⋮</span>}
                  <b>{eventCode(item)}</b>
                  <strong>{item.locationLabel}</strong>
                </div>
                {item.kind === 'freight-stop' && <FreightMeta item={item} capacityPallets={day.trailer.capacityPallets} />}
                {item.kind === 'lunch' && (
                  <div className="day-row-meta">
                    <span>OFF DUTY</span>
                    <b>30 MIN</b>
                    <em>until {formatClock(item.endMinutes)}</em>
                  </div>
                )}
                {item.kind === 'staging' && (
                  <div className="day-row-meta">
                    <span>SHIFT END</span>
                    <b>STAGING</b>
                    <em>planned</em>
                  </div>
                )}
                {item.kind === 'shift-start' && (
                  <div className="day-row-meta">
                    <span>ON DUTY</span>
                    <b>{driver.name}</b>
                    <em>{day.trailer.label}</em>
                  </div>
                )}
              </div>
            </>
          )

          return selectable ? (
            <button
              type="button"
              key={item.id}
              className={[
                'driver-day-row',
                'selectable',
                item.kind,
                selected ? 'selected' : '',
                draggableStop ? 'draggable-stop' : '',
                dragging ? 'dragging' : '',
                droppingBefore ? 'drop-before' : '',
                droppingAfter ? 'drop-after' : '',
              ].filter(Boolean).join(' ')}
              draggable={draggableStop}
              onDragStart={draggableStop ? (event) => startDrag(event, item.id) : undefined}
              onDragOver={draggableStop ? (event) => setDropPosition(event, item.id) : undefined}
              onDrop={draggableStop ? (event) => dropStop(event, item.id) : undefined}
              onDragEnd={draggableStop ? clearDragState : undefined}
              onClick={() => onSelectSubject(SELECTION_TYPES.STOP, item.id)}
              aria-pressed={selected}
              aria-label={draggableStop
                ? `${eventCode(item)} ${item.locationLabel}. Drag to resequence.`
                : undefined}
            >
              {content}
            </button>
          ) : (
            <div key={item.id} className={`driver-day-row ${item.kind}`}>
              {content}
            </div>
          )
        })}
      </div>
    </section>
  )
}
