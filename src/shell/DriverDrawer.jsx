import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { isSelection, SELECTION_TYPES } from '../domain/selection/selectionModel.js'

export default function DriverDrawer({ drivers, selection, open, onClose, onSelectSubject }) {
  return (
    <aside id="driver-drawer" className={`side-drawer driver-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <header className="drawer-header">
        <div>
          <span>FLEET</span>
          <strong>Drivers</strong>
          <small>{drivers.length} active today</small>
        </div>
        <button type="button" onClick={onClose} aria-label="Close driver drawer">×</button>
      </header>

      <div className="driver-list">
        {drivers.map((driver) => {
          const identity = getDriverIdentity(driver.id)
          const selected = isSelection(selection, SELECTION_TYPES.DRIVER, driver.id)

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
                <em>{driver.locationLabel}</em>
              </span>
              <mark aria-label={`${identity.colorName} driver identity`} title={`${identity.colorName} driver identity`} />
            </button>
          )
        })}
      </div>
    </aside>
  )
}
