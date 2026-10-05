import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { SELECTION_TYPES } from '../domain/selection/selectionModel.js'

const DRIVER_FILTER_LABELS = Object.freeze({
  all: 'ALL DRIVERS',
  attention: 'NEEDS ATTENTION',
  'en-route': 'EN ROUTE',
  'at-stop': 'AT STOP',
  break: 'ON BREAK',
  scheduled: 'SCHEDULED',
  'not-sent': 'PLAN NOT SENT',
})

function matchesDriverFilter(filter, liveState) {
  if (!filter || filter === 'all') return true
  if (filter === 'attention') {
    return liveState?.phase === 'dispatch-required' || liveState?.attention === true
  }
  if (filter === 'en-route') return liveState?.executionPhase === 'en-route'
  if (filter === 'at-stop') {
    return ['service-loading', 'service-unloading', 'arrived'].includes(
      liveState?.executionPhase,
    )
  }
  if (filter === 'break') return liveState?.executionPhase === 'dwell-break'
  if (filter === 'scheduled') return liveState?.phase === 'scheduled'
  if (filter === 'not-sent') {
    return !liveState?.sent && liveState?.phase !== 'dispatch-required'
  }
  return true
}

function liveStatusCopy(driver, liveState) {
  if (liveState?.phase === 'dispatch-required') {
    return {
      status: 'DISPATCH REQUIRED',
      detail: liveState.detail,
    }
  }

  if (!liveState?.sent) {
    return {
      status: 'PLAN NOT SENT',
      detail: liveState?.detail ?? driver.nextStop,
    }
  }

  if (liveState.phase === 'scheduled') {
    return {
      status: 'SCHEDULED',
      detail: liveState.nextEventLabel ?? driver.nextStop,
    }
  }

  if (liveState.phase === 'closed') {
    return {
      status: 'SHIFT CLOSED',
      detail: liveState.currentEventLabel ?? driver.nextStop,
    }
  }

  if (liveState.executionPhase === 'en-route') {
    return {
      status: 'EN ROUTE',
      detail: liveState.nextEventLabel ?? driver.nextStop,
    }
  }

  if (liveState.executionPhase === 'service-loading') {
    return {
      status: 'LOADING',
      detail: `${liveState.currentEventLabel ?? driver.nextStop} · ${liveState.serviceRemainingMinutes ?? 0} min`,
    }
  }

  if (liveState.executionPhase === 'service-unloading') {
    return {
      status: 'UNLOADING',
      detail: `${liveState.currentEventLabel ?? driver.nextStop} · ${liveState.serviceRemainingMinutes ?? 0} min`,
    }
  }

  if (liveState.executionPhase === 'dwell-break') {
    return {
      status: 'ON BREAK',
      detail: liveState.currentEventLabel ?? driver.nextStop,
    }
  }

  if (liveState.executionPhase === 'arrived') {
    return {
      status: 'ARRIVED',
      detail: liveState.currentEventLabel ?? driver.nextStop,
    }
  }

  if (liveState.executionPhase === 'complete') {
    return {
      status: 'ROUTE COMPLETE',
      detail: liveState.currentEventLabel ?? driver.nextStop,
    }
  }

  return {
    status: liveState.label ?? driver.status,
    detail: liveState.nextEventLabel ?? driver.nextStop,
  }
}

export default function DriverBrowser({
  drivers,
  activeDriverId,
  liveDriverStates = {},
  filter = 'all',
  onClearFilter,
  onSelectSubject,
}) {
  const filteredDrivers = drivers.filter((driver) => (
    matchesDriverFilter(filter, liveDriverStates[driver.id] ?? null)
  ))
  const filterLabel = DRIVER_FILTER_LABELS[filter] ?? DRIVER_FILTER_LABELS.all

  return (
    <aside className="workstation-browser driver-browser" aria-label="Drivers">
      <header className="workstation-panel-header">
        <div>
          <span>FLEET</span>
          <strong>Drivers</strong>
          <small>
            {filter === 'all'
              ? `${drivers.length} active today`
              : `${filteredDrivers.length} of ${drivers.length} · ${filterLabel}`}
          </small>
        </div>
        {filter !== 'all' && (
          <button
            type="button"
            className="driver-filter-clear"
            onClick={onClearFilter}
            title="Show all drivers"
          >
            ALL
          </button>
        )}
      </header>

      <div className="driver-list">
        {filteredDrivers.map((driver) => {
          const identity = getDriverIdentity(driver.id)
          const selected = driver.id === activeDriverId
          const liveCopy = liveStatusCopy(driver, liveDriverStates[driver.id])

          return (
            <button
              type="button"
              key={driver.id}
              className={selected ? 'active' : ''}
              style={{ '--driver-color': identity.color }}
              onClick={() => onSelectSubject(SELECTION_TYPES.DRIVER, driver.id)}
              aria-pressed={selected}
            >
              <i>{driver.initials}</i>
              <span>
                <strong>{driver.name}</strong>
                <small>{liveCopy.status}</small>
                <em>{liveCopy.detail}</em>
              </span>
              <mark aria-label={`${identity.colorName} driver identity`} title={`${identity.colorName} driver identity`} />
            </button>
          )
        })}

        {filteredDrivers.length === 0 && (
          <div className="driver-list-empty">
            <strong>No drivers in this group</strong>
            <small>{filterLabel}</small>
          </div>
        )}
      </div>
    </aside>
  )
}
