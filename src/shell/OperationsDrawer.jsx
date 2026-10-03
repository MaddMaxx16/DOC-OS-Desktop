import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { getSelectionKey, SELECTION_TYPES } from '../domain/selection/selectionModel.js'

function GenericSelectionContext({ selection }) {
  return (
    <div className="empty-context">
      <span>{selection.type.toUpperCase()}</span>
      <strong>{selection.id}</strong>
      <p>This subject is already part of the shared V2.2 selection contract. Its desktop context arrives with the system that owns it.</p>
    </div>
  )
}

export default function OperationsDrawer({ selection, driver, open, onClose }) {
  const driverIdentity = driver ? getDriverIdentity(driver.id) : null
  const style = driverIdentity ? { '--selected-driver-color': driverIdentity.color } : undefined
  const selectionKey = getSelectionKey(selection)

  return (
    <aside
      id="operations-drawer"
      className={`side-drawer operations-drawer ${open ? 'open' : ''} ${driver ? 'driver-context' : ''}`}
      style={style}
      aria-hidden={!open}
      data-selection={selectionKey ?? ''}
    >
      <header className="drawer-header">
        <div>
          <span>{driver ? 'SELECTED DRIVER' : 'OPERATIONS'}</span>
          <strong>{driver ? driver.name : selection ? selection.id : 'No selection'}</strong>
          <small>{driver ? driver.locationLabel : selection ? selection.type : 'Select a subject from the map or roster'}</small>
        </div>
        <button type="button" onClick={onClose} aria-label="Close operations drawer">×</button>
      </header>

      {driver ? (
        <div className="operations-content">
          <div className="driver-identity-strip">
            <i aria-hidden="true" />
            <span>{driver.name}</span>
            <small>{driverIdentity.colorName.toUpperCase()} IDENTITY</small>
          </div>

          <section className="metric-grid">
            <div><span>STATUS</span><strong>{driver.status}</strong></div>
            <div><span>NEXT STOP</span><strong>{driver.nextStop}</strong></div>
            <div><span>DRIVE</span><strong>{driver.hos.drive}</strong></div>
            <div><span>DUTY</span><strong>{driver.hos.duty}</strong></div>
          </section>

          <section className="placeholder-card">
            <span>V2.2 SELECTION FOUNDATION</span>
            <strong>Driver Day comes in V2.3</strong>
            <p>The selected driver now owns one persistent identity across the map, roster, and operations context. Manifest and route ownership will inherit this same identity.</p>
          </section>
        </div>
      ) : selection ? (
        <GenericSelectionContext selection={selection} />
      ) : (
        <div className="empty-context">
          <span>CONTEXT</span>
          <strong>Nothing selected</strong>
          <p>Open Drivers or click a map marker. One shared selection state drives every desktop surface.</p>
        </div>
      )}
    </aside>
  )
}
