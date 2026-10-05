import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { SELECTION_TYPES } from '../domain/selection/selectionModel.js'

function liveStatusCopy(driver, liveState) {
  if (!liveState?.sent) {
    return {
      status: driver.status,
      detail: driver.nextStop,
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
  onSelectSubject,
}) {
  return (
    <aside className="workstation-browser driver-browser" aria-label="Drivers">
      <header className="workstation-panel-header">
        <div>
          <span>FLEET</span>
          <strong>Drivers</strong>
          <small>{drivers.length} active today</small>
        </div>
      </header>

      <div className="driver-list">
        {drivers.map((driver) => {
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
      </div>
    </aside>
  )
}
