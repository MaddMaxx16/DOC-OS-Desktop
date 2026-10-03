import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { getSelectionKey } from '../domain/selection/selectionModel.js'
import DriverDayPanel from '../features/driver-day/DriverDayPanel.jsx'

function GenericSelectionContext({ selection }) {
  return (
    <div className="empty-context">
      <span>{selection.type.toUpperCase()}</span>
      <strong>{selection.id}</strong>
      <p>This subject is part of the shared selection contract but its owning desktop system has not been ported yet.</p>
    </div>
  )
}

export default function OperationsDrawer({
  selection,
  driver,
  driverDay,
  selectedStop,
  open,
  onClose,
  onSelectSubject,
}) {
  const driverIdentity = driver ? getDriverIdentity(driver.id) : null
  const style = driverIdentity ? { '--selected-driver-color': driverIdentity.color } : undefined
  const selectionKey = getSelectionKey(selection)
  const headerLabel = selectedStop
    ? selectedStop.kind === 'freight-stop'
      ? `${selectedStop.role.toUpperCase()} · ${selectedStop.loadRef}`
      : selectedStop.label
    : driver ? 'DRIVER DAY' : 'OPERATIONS'

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
          <span>{headerLabel}</span>
          <strong>{driver ? driver.name : selection ? selection.id : 'No selection'}</strong>
          <small>
            {selectedStop
              ? selectedStop.kind === 'freight-stop'
                ? `${selectedStop.locationLabel} · ${selectedStop.loadRef}`
                : selectedStop.locationLabel
              : driver ? driver.locationLabel : selection ? selection.type : 'Select a subject from the map or roster'}
          </small>
        </div>
        <button type="button" onClick={onClose} aria-label="Close operations drawer">×</button>
      </header>

      {driver && driverDay ? (
        <div className="operations-content">
          <div className="driver-identity-strip">
            <i aria-hidden="true" />
            <span>{driver.name}</span>
            <small>{driverIdentity.colorName.toUpperCase()} IDENTITY</small>
          </div>

          <DriverDayPanel
            driver={driver}
            day={driverDay}
            selection={selection}
            onSelectSubject={onSelectSubject}
          />
        </div>
      ) : selection ? (
        <GenericSelectionContext selection={selection} />
      ) : (
        <div className="empty-context">
          <span>CONTEXT</span>
          <strong>Nothing selected</strong>
          <p>Open Drivers or click a map marker. Driver Day appears here without replacing the map.</p>
        </div>
      )}
    </aside>
  )
}
