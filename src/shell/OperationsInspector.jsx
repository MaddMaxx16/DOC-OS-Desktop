import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { getSelectionKey } from '../domain/selection/selectionModel.js'
import DriverDayPanel from '../features/driver-day/DriverDayPanel.jsx'

function GenericSelectionContext({ selection }) {
  return (
    <div className="empty-context">
      <span>{selection.type.toUpperCase()}</span>
      <strong>{selection.id}</strong>
      <p>This subject is part of the shared selection contract but its detailed inspector is not built yet.</p>
    </div>
  )
}

export default function OperationsInspector({
  selection,
  driver,
  driverDay,
  selectedStop,
  planning = false,
  planningFeedback = null,
  planningPlaceOptions = [],
  onStartPlanning,
  onStopPlanning,
  onMovePlanEvent,
  onChoosePlanningPlace,
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
      className={`workstation-inspector operations-inspector ${driver ? 'driver-context' : ''} ${planning ? 'planning-context' : ''}`}
      style={style}
      data-selection={selectionKey ?? ''}
      aria-label="Selection details"
    >
      <header className="workstation-panel-header">
        <div>
          <span>{headerLabel}</span>
          <strong>{driver ? driver.name : selection ? selection.id : 'No selection'}</strong>
          <small>
            {selectedStop
              ? selectedStop.kind === 'freight-stop'
                ? `${selectedStop.locationLabel} · ${selectedStop.loadRef}`
                : selectedStop.locationLabel
              : driver ? driver.locationLabel : selection ? selection.type : 'Select a subject from the map or browser'}
          </small>
        </div>
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
            planning={planning}
            planningFeedback={planningFeedback}
            planningPlaceOptions={planningPlaceOptions}
            onStartPlanning={() => onStartPlanning?.(driver.id)}
            onStopPlanning={() => onStopPlanning?.(driver.id)}
            onMovePlanEvent={onMovePlanEvent}
            onChoosePlanningPlace={onChoosePlanningPlace}
            onSelectSubject={onSelectSubject}
          />
        </div>
      ) : selection ? (
        <GenericSelectionContext selection={selection} />
      ) : null}
    </aside>
  )
}
