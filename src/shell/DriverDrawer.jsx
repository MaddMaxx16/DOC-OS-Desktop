export default function DriverDrawer({ drivers, selectedDriverId, open, onClose, onSelectDriver }) {
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
        {drivers.map((driver) => (
          <button
            type="button"
            key={driver.id}
            className={driver.id === selectedDriverId ? 'active' : ''}
            onClick={() => onSelectDriver(driver.id)}
          >
            <i>{driver.initials}</i>
            <span>
              <strong>{driver.name}</strong>
              <small>{driver.status}</small>
              <em>{driver.locationLabel}</em>
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}
