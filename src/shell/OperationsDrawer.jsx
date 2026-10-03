export default function OperationsDrawer({ driver, open, onClose }) {
  return (
    <aside id="operations-drawer" className={`side-drawer operations-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <header className="drawer-header">
        <div>
          <span>OPERATIONS</span>
          <strong>{driver ? driver.name : 'No selection'}</strong>
          <small>{driver ? driver.locationLabel : 'Select a driver from the map or roster'}</small>
        </div>
        <button type="button" onClick={onClose} aria-label="Close operations drawer">×</button>
      </header>

      {driver ? (
        <div className="operations-content">
          <section className="metric-grid">
            <div><span>STATUS</span><strong>{driver.status}</strong></div>
            <div><span>NEXT STOP</span><strong>{driver.nextStop}</strong></div>
            <div><span>DRIVE</span><strong>{driver.hos.drive}</strong></div>
            <div><span>DUTY</span><strong>{driver.hos.duty}</strong></div>
          </section>

          <section className="placeholder-card">
            <span>V2.1 SHELL ONLY</span>
            <strong>Driver Day comes in V2.3</strong>
            <p>This panel is intentionally light. Manifest, trailer capacity, HOS logic, and live actions will be ported as dedicated desktop systems later.</p>
          </section>
        </div>
      ) : (
        <div className="empty-context">
          <span>CONTEXT</span>
          <strong>Nothing selected</strong>
          <p>Open Drivers or click a map marker. The map stays fixed while this drawer overlays it.</p>
        </div>
      )}
    </aside>
  )
}
