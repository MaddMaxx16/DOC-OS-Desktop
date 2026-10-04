import { useState } from 'react'
import { formatClock } from '../../domain/manifest/driverDayModel.js'
import {
  canEditDispatchPlan,
  dispatchPlanReadiness,
  dispatchPlanStatusLabel,
} from '../../domain/planning/dispatchPlan.js'
import { isSelection, SELECTION_TYPES } from '../../domain/selection/selectionModel.js'
import './driverDay.css'

function formatWeight(value) {
  return `${Math.round(Number(value || 0) / 1000)}k lb`
}

function eventTimeLabel(item) {
  if (item.kind === 'staging' && !item.locationId) return 'TBD'
  return formatClock(item.projectedArrivalMinutes)
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

function PlanHealth({ health, expanded = false, onSelectIssue }) {
  if (!health) return null

  const issues = health.status === 'blocked'
    ? health.blockerIssues ?? []
    : health.status === 'warning'
      ? health.warningIssues ?? []
      : []

  const primary = issues[0]?.message ?? 'Appointments, capacity, HOS, Lunch, and Staging are clear.'
  const count = issues.length
  const label = health.status === 'blocked'
    ? `${count} BLOCKER${count === 1 ? '' : 'S'}`
    : health.status === 'warning'
      ? `${count} WARNING${count === 1 ? '' : 'S'}`
      : 'READY'

  return (
    <section className={`plan-health ${health.status}`} aria-label="Schedule readiness">
      <span>PLAN CHECK</span>
      <strong>{label}</strong>
      <small>{primary}</small>

      {expanded && issues.length > 0 && (
        <div className="plan-issue-list">
          {issues.map((issue) => (
            <button
              type="button"
              key={issue.id}
              disabled={!issue.stopId}
              onClick={() => issue.stopId && onSelectIssue?.(issue.stopId)}
            >
              <span>{health.status === 'blocked' ? 'BLOCKER' : 'WARNING'}</span>
              <strong>{issue.message}</strong>
              {issue.stopId && <em>SHOW STOP</em>}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function ScheduleSendReview({ driver, day, readiness, onBack, onSend }) {
  const lunch = day.timeline.find((event) => event.kind === 'lunch')
  const staging = day.timeline.find((event) => event.kind === 'staging')
  const loadCount = new Set(day.freightStops.map((stop) => stop.loadId)).size
  const warning = readiness.requiresWarningOverride

  return (
    <section className={`schedule-send-review ${warning ? 'warning' : 'ready'}`}>
      <header>
        <div>
          <span>{warning ? 'WARNING REVIEW' : 'READY TO SEND'}</span>
          <strong>{driver.name}</strong>
        </div>
        <small>
          {warning
            ? 'This schedule is sendable, but the driver will receive the plan with the risks shown below.'
            : 'This schedule is complete and ready to become the driver\'s communicated plan.'}
        </small>
      </header>

      <div className="schedule-send-summary">
        <div>
          <span>WORK</span>
          <strong>{loadCount} loads · {day.freightStops.length} stops</strong>
        </div>
        <div>
          <span>LUNCH</span>
          <strong>{lunch?.locationLabel ?? 'Not planned'}</strong>
        </div>
        <div>
          <span>STAGE</span>
          <strong>{staging?.locationLabel ?? 'Not selected'}</strong>
        </div>
        <div>
          <span>EST. FINISH</span>
          <strong>{staging?.locationId ? formatClock(staging.projectedArrivalMinutes) : 'TBD'}</strong>
        </div>
      </div>

      {warning && (
        <div className="schedule-send-warnings">
          {readiness.warnings.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <footer>
        <button type="button" className="secondary" onClick={onBack}>BACK TO PLAN</button>
        <button
          type="button"
          className={warning ? 'warning-action' : 'primary'}
          onClick={() => onSend?.({ driverId: driver.id, allowWarnings: warning })}
        >
          {warning ? 'SEND ANYWAY' : `SEND TO ${driver.name.split(' ')[0].toUpperCase()}`}
        </button>
      </footer>
    </section>
  )
}

export default function DriverDayPanel({
  driver,
  day,
  selection,
  planning = false,
  planningFeedback = null,
  liveState = null,
  onStartPlanning,
  onStopPlanning,
  onMovePlanEvent,
  onSendSchedule,
  onSelectSubject,
}) {
  const [draggedEventId, setDraggedEventId] = useState(null)
  const [activeGap, setActiveGap] = useState(null)
  const [sendReviewOpen, setSendReviewOpen] = useState(false)

  if (!driver || !day) return null

  const editable = canEditDispatchPlan(day)
  const planLabel = dispatchPlanStatusLabel(day)
  const readiness = dispatchPlanReadiness(day)
  const planningEditable = planning && editable && !sendReviewOpen

  const clearDragState = () => {
    setDraggedEventId(null)
    setActiveGap(null)
  }

  const startDrag = (event, eventId) => {
    if (!planningEditable) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', eventId)
    setDraggedEventId(eventId)
  }

  const dropIntoGap = (event, beforeId, afterId, gapKey) => {
    if (!planningEditable || !draggedEventId) return
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
    if (!planningEditable || !afterItem || beforeItem?.kind === 'staging') return null
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
    const draggableEvent = planningEditable && ['freight-stop', 'lunch'].includes(item.kind)
    const dragging = draggedEventId === item.id
    const current = Boolean(
      liveState?.phase === 'active'
      && liveState?.executionPhase !== 'en-route'
      && liveState?.currentEventId === item.id
    )
    const completed = Boolean(
      liveState?.completedEventIds?.includes(item.id)
      && !current
    )
    const next = liveState?.sent && liveState?.nextEventId === item.id

    const content = (
      <>
        <div className="timeline-rail">
          <span className="timeline-dot" />
          {index < day.timeline.length - 1 && <i />}
        </div>
        <time>{eventTimeLabel(item)}</time>
        <div className="timeline-content">
          <div className="timeline-title">
            {draggableEvent && <span className="stop-drag-handle" aria-hidden="true">⋮⋮</span>}
            <b>{eventCode(item)}</b>
            <strong>{item.locationLabel}</strong>
            {current && <em className="execution-chip current">NOW</em>}
            {!current && next && <em className="execution-chip next">NEXT</em>}
          </div>
          {item.kind === 'freight-stop' && <FreightMeta item={item} capacityPallets={day.trailer.capacityPallets} />}
          {item.kind === 'lunch' && (
            <div className="day-row-meta">
              <span>OFF DUTY</span>
              <b>30 MIN</b>
              <em>{planningEditable ? 'click to open lunch planner' : `until ${formatClock(item.endMinutes)}`}</em>
            </div>
          )}
          {item.kind === 'staging' && (
            <div className="day-row-meta">
              <span>SHIFT END</span>
              <b>STAGING</b>
              <em>{planningEditable ? 'click to choose end location' : item.locationId ? 'planned' : 'not selected'}</em>
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
          completed ? 'execution-completed' : '',
          current ? 'execution-current' : '',
          next ? 'execution-next' : '',
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
      <div
        key={item.id}
        className={[
          'driver-day-row',
          item.kind,
          completed ? 'execution-completed' : '',
          current ? 'execution-current' : '',
          next ? 'execution-next' : '',
        ].filter(Boolean).join(' ')}
      >
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
    <section className={`driver-day-panel ${planning ? 'planning' : ''} ${sendReviewOpen ? 'send-reviewing' : ''}`}>
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
            onClick={() => {
              setSendReviewOpen(false)
              if (planning) onStopPlanning?.()
              else onStartPlanning?.()
            }}
          >
            {planning ? 'DONE' : 'EDIT PLAN'}
          </button>
        ) : (
          <em className="driver-day-sent-lock">SENT</em>
        )}
      </div>

      {planning && (
        <div className="planning-mode-note">
          <span>PLANNING MODE · READINESS + SEND</span>
          <strong>Finish the day, resolve blockers, review any warnings, then send the schedule to the driver.</strong>
        </div>
      )}

      <PlanHealth
        health={day.planHealth}
        expanded={planning}
        onSelectIssue={(stopId) => {
          setSendReviewOpen(false)
          onSelectSubject?.(SELECTION_TYPES.STOP, stopId)
        }}
      />

      {planning && planningFeedback && (
        <div className={`planning-feedback ${planningFeedback.tone}`} role="status">
          {planningFeedback.message}
        </div>
      )}

      {!editable && (
        <div className={`sent-plan-note live-${liveState?.phase ?? 'sent'}`}>
          <span>{liveState?.label ?? 'SCHEDULE SENT'}</span>
          <strong>{liveState?.detail ?? `${driver.name} now owns this communicated plan.`}</strong>
          <small>
            {liveState?.phase === 'scheduled'
              ? `Shift starts at ${formatClock(liveState.shiftStartMinutes)}. Live execution is armed.`
              : liveState?.executionPhase === 'en-route'
                ? `Next: ${liveState.nextEventLabel ?? 'planned stop'} · ETA ${formatClock(liveState.nextEventArrivalMinutes)}`
                : liveState?.executionPhase === 'arrived'
                  ? `At ${liveState.currentEventLabel ?? 'planned stop'} · next movement begins on the live clock.`
                  : liveState?.executionPhase === 'dwell-break'
                    ? `Lunch holds until ${formatClock(liveState.currentEventDepartureMinutes)}.`
                    : liveState?.executionPhase === 'complete'
                      ? 'All planned route legs are complete.'
                      : liveState?.phase === 'active'
                        ? 'Clock is inside the sent shift window.'
                        : liveState?.phase === 'closed'
                          ? 'The communicated shift window has passed.'
                          : 'Editing remains locked after dispatch.'}
          </small>
        </div>
      )}

      <div className="driver-day-timeline">
        {timelineNodes}
      </div>

      {planning && editable && (
        sendReviewOpen ? (
          <ScheduleSendReview
            driver={driver}
            day={day}
            readiness={readiness}
            onBack={() => setSendReviewOpen(false)}
            onSend={onSendSchedule}
          />
        ) : (
          <footer className={`driver-day-send-bar ${readiness.status}`}>
            <div>
              <span>SCHEDULE READINESS</span>
              <strong>
                {readiness.status === 'blocked'
                  ? `FIX ${readiness.blockers.length} BLOCKER${readiness.blockers.length === 1 ? '' : 'S'}`
                  : readiness.status === 'warning'
                    ? `${readiness.warnings.length} WARNING${readiness.warnings.length === 1 ? '' : 'S'} · SENDABLE`
                    : 'READY TO SEND'}
              </strong>
            </div>
            <button
              type="button"
              disabled={!readiness.canSend}
              onClick={() => {
                onSelectSubject?.(SELECTION_TYPES.DRIVER, driver.id)
                setSendReviewOpen(true)
              }}
            >
              {readiness.canSend ? 'SEND SCHEDULE' : 'FIX PLAN'}
            </button>
          </footer>
        )
      )}
    </section>
  )
}
