import { formatClock } from '../../domain/manifest/driverDayModel.js'
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

export default function DriverDayPanel({ driver, day, selection, onSelectSubject }) {
  if (!driver || !day) return null

  return (
    <section className="driver-day-panel">
      <div className="driver-day-summary">
        <div>
          <span>SHIFT</span>
          <strong>{formatClock(day.shift.startMinutes)}–{formatClock(day.shift.endMinutes)}</strong>
        </div>
        <div>
          <span>HOS</span>
          <strong>{day.hos.drive} DRIVE · {day.hos.duty} DUTY</strong>
        </div>
        <div>
          <span>TRAILER</span>
          <strong>{day.trailer.peakPalletsUsed}/{day.trailer.capacityPallets} PLT PEAK</strong>
          <small>{formatWeight(day.trailer.peakWeightUsedLbs)} / {formatWeight(day.trailer.maxWeightLbs)}</small>
        </div>
      </div>

      <div className="driver-day-heading">
        <div>
          <span>DRIVER DAY</span>
          <strong>Manifest</strong>
        </div>
        <small>{day.freightStops.length} freight stops</small>
      </div>

      <div className="driver-day-timeline">
        {day.timeline.map((item, index) => {
          const selectable = item.kind === 'freight-stop'
          const selected = selectable && isSelection(selection, SELECTION_TYPES.STOP, item.id)

          const content = (
            <>
              <div className="timeline-rail">
                <span className="timeline-dot" />
                {index < day.timeline.length - 1 && <i />}
              </div>
              <time>{formatClock(item.projectedArrivalMinutes)}</time>
              <div className="timeline-content">
                <div className="timeline-title">
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
              className={`driver-day-row selectable ${selected ? 'selected' : ''}`}
              onClick={() => onSelectSubject(SELECTION_TYPES.STOP, item.id)}
              aria-pressed={selected}
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
