import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { SELECTION_TYPES } from '../domain/selection/selectionModel.js'

export default function DriverBrowser({ drivers, activeDriverId, onSelectSubject }) {
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
                <small>{driver.status}</small>
                <em>{driver.nextStop}</em>
              </span>
              <mark aria-label={`${identity.colorName} driver identity`} title={`${identity.colorName} driver identity`} />
            </button>
          )
        })}
      </div>
    </aside>
  )
}
