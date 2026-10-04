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

function formatMiles(value) {
  if (!Number.isFinite(value)) return '—'
  return `${value.toFixed(value >= 10 ? 0 : 1)} mi`
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

function PlanningPlacePicker({ driverId, event, options, onChoosePlanningPlace }) {
  if (!event || !['lunch', 'staging'].includes(event.kind)) return null

  const lunch = event.kind === 'lunch'

  return (
    <section className="planning-place-picker">
      <header>
        <div>
          <span>{lunch ? 'LUNCH PLACE' : 'END-OF-DAY STAGING'}</span>
          <strong>{event.locationLabel}</strong>
        </div>
        <small>{lunch ? 'Choose a real stop. Route detour updates immediately.' : 'Choose where the truck finishes the day.'}</small>
      </header>

      <div className="planning-place-list">
        {options.map((option) => (
          <button
            type="button"
            key={option.id}
            className={option.isCurrent ? 'current' : ''}
            disabled={option.isCurrent}
            onClick={() => onChoosePlanningPlace?.({
              driverId,
              kind: event.kind,
              locationId: option.id,
            })}
          >
            <div>
              <strong>{option.label}</strong>
              <span>{option.poiType.replace('-', ' ').toUpperCase()}</span>
            </div>
            <small>
              {lunch
                ? `+${option.detourMinutes} min · ${formatMiles(option.detourMiles)} detour`
                : `${option.travelMinutes} min · ${formatMiles(option.travelMiles)} from final stop`}
            </small>
            <em>
              {option.truckAccess.toUpperCase()} TRUCK ACCESS
              {option.parking ? ' · PARKING' : ' · NO TRUCK PARKING'}
            </em>
            {option.isCurrent && <b>CURRENT</b>}
          </button>
        ))}
      </div>
    </section>
  )
}

export default function DriverDayPanel({
  driver,
  day,
  selection,
  planning = false,
  planningFeedback = null,
  planningPlaceOptions = [],
  onStartPlanning,
  onStopPlanning,
  onMovePlanEvent,
  onChoosePlanningPlace,
  onSelectSubject,
}) {
  const [draggedEventId, setDraggedEventId] = useState(null)
  const [activeGap, setActiveGap] = useState(null)

  if (!driver || !day) return null

  const editable = canEditDispatchPlan(day)
  const planLabel = dispatchPlanStatusLabel(day)
  const selectedPlanningEvent = isSelection(selection, SELECTION_TYPES.STOP)
    ? day.timeline.find((item) => item.id === selection.id) ?? null
    : null

  const clearDragState = () => {
    setDraggedEventId(null)
    setActiveGap(null)
  }

  const startDrag = (event, eventId) => {
    if (!planning) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', eventId)
    setDraggedEventId(eventId)
    onSelectSubject?.(SELECTION_TYPES.STOP, eventId)
  }

  const dropIntoGap = (event, beforeId, afterId, gapKey) => {
    if (!planning || !draggedEventId) return
    event.preventDefault()
    onMovePlanEvent?.({
      driverId: driver.id,
      eventId: draggedEventId,
      beforeId,
      afterId,
    })
    setActiveGap(gapKey)
    clearDragState()
  }

  const renderGap = (beforeItem, afterItem, index) => {
    if (!planning || !afterItem || beforeItem?.kind === 'staging') return null
    const gapKey = `${beforeItem?.id ?? 'start'}->${afterItem.id}`
    const active = activeGap === gapKey

    return (
      <div
        key={`gap:${gapKey}`}
        className={`timeline-insert-gap ${draggedEventId ? 'drag-active' : ''} ${active ? 'active' : ''}`}
        onDragOver={(event) => {
          if (!draggedEventId) return
          event.preventDefault()
          event.dataTransfer.dropEffect = 'move'
          setActiveGap(gapKey)
        }}
        onDragLeave={() => setActiveGap((current) => current === gapKey ? null : current)}
        onDrop={(event) => dropIntoGap(event, beforeItem?.id ?? null, afterItem.id, gapKey)}
      >
        <span>{draggedEventId ? 'DROP HERE' : 'INSERT'}</span>
        <i />
        <small>{index === 0 ? 'start of plan' : 'between events'}</small>
      </div>
    )
  }

  const renderRow = (item, index) => {
    const selectable = ['freight-stop', 'lunch', 'staging'].includes(item.kind)
    const selected = selectable && isSelection(selection, SELECTION_TYPES.STOP, item.id)
    const draggableEvent = planning && ['freight-stop', 'lunch'].includes(item.kind)
    const dragging = draggedEventId === item.id

    const content = (
      <>
        <div className="timeline-rail">
          <span className="timeline-dot" />
          {index < day.timeline.length - 1 && <i />}
        </div>
        <time>{formatClock(item.projectedArrivalMinutes)}</time>
        <div className="timeline-content">
          <div className="timeline-title">
            {draggableEvent && <span className="stop-drag-handle" aria-hidden="true">⋮⋮</span>}
            <b>{eventCode(item)}</b>
            <strong>{item.locationLabel}</strong>
          </div>
          {item.kind === 'freight-stop' && <FreightMeta item={item} capacityPallets={day.trailer.capacityPallets} />}
          {item.kind === 'lunch' && (
            <div className="day-row-meta">
              <span>OFF DUTY</span>
              <b>30 MIN</b>
              <em>{planning ? 'click to choose place' : `until ${formatClock(item.endMinutes)}`}</em>
            </div>
          )}
          {item.kind === 'staging' && (
            <div className="day-row-meta">
              <span>SHIFT END</span>
              <b>STAGING</b>
              <em>{planning ? 'click to choose place' : 'planned'}</em>
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
          draggableEvent ? 'draggable-stop' : '',
          dragging ? 'dragging' : '',
        ].filter(Boolean).join(' ')}
        draggable={draggableEvent}
        onDragStart={draggableEvent ? (event) => startDrag(event, item.id) : undefined}
        onDragEnd={draggableEvent ? clearDragState : undefined}
        onClick={() => onSelectSubject(SELECTION_TYPES.STOP, item.id)}
        aria-pressed={selected}
        aria-label={draggableEvent
          ? `${eventCode(item)} ${item.locationLabel}. Drag into an insertion lane to move.`
          : undefined}
      >
        {content}
      </button>
    ) : (
      <div key={item.id} className={`driver-day-row ${item.kind}`}>
        {content}
      </div>
    )
  }

  const timelineNodes = []
  day.timeline.forEach((item, index) => {
    timelineNodes.push(renderRow(item, index))
    const next = day.timeline[index + 1]
    if (next) timelineNodes.push(renderGap(item, next, index))
  })

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
            <span>PLANNING MODE · BREAKS, PLACES + STAGING</span>
            <strong>Drag freight or Lunch into the insertion lanes. Select Lunch or Stage to choose a real location.</strong>
          </div>

          <PlanHealth health={day.planHealth} />

          {planningFeedback && (
            <div className={`planning-feedback ${planningFeedback.tone}`} role="status">
              {planningFeedback.message}
            </div>
          )}

          <PlanningPlacePicker
            driverId={driver.id}
            event={selectedPlanningEvent}
            options={planningPlaceOptions}
            onChoosePlanningPlace={onChoosePlanningPlace}
          />
        </>
      )}

      <div className="driver-day-timeline">
        {timelineNodes}
      </div>
    </section>
  )
}
