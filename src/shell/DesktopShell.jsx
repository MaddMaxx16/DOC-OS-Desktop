import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { resolveSelectionContext } from '../domain/selection/selectionContext.js'
import { isSelection, SELECTION_TYPES } from '../domain/selection/selectionModel.js'
import FreightLinkWorkspace from '../features/freightlink/FreightLinkWorkspace.jsx'
import OperationsMap from '../map/OperationsMap.jsx'
import AppDock from './AppDock.jsx'
import DesktopAppDrawer from './DesktopAppDrawer.jsx'
import DriverDrawer from './DriverDrawer.jsx'
import OperationsDrawer from './OperationsDrawer.jsx'
import TopBar from './TopBar.jsx'
import './shell.css'

export default function DesktopShell({
  drivers,
  driverDays,
  marketLanes,
  locations,
  selection,
  activeApp,
  freightRoutePreview,
  leftOpen,
  rightOpen,
  onToggleLeft,
  onToggleRight,
  onCloseLeft,
  onCloseRight,
  onToggleApp,
  onCloseActiveApp,
  onRoutePreviewChange,
  onSelectSubject,
}) {
  const { driver: selectedDriver, driverDay, stop: selectedStop } = resolveSelectionContext(
    selection,
    drivers,
    driverDays,
  )

  const activeFreightRoutePreview = (
    isSelection(selection, SELECTION_TYPES.LOAD)
    && freightRoutePreview?.lane?.id === selection.id
  ) ? freightRoutePreview : null

  const freightDriver = activeFreightRoutePreview?.driver ?? null
  const mapDriver = selectedDriver ?? freightDriver
  const mapDriverDay = driverDay ?? (
    freightDriver ? driverDays.find((day) => day.driverId === freightDriver.id) ?? null : null
  )

  const selectedDriverIdentity = mapDriver ? getDriverIdentity(mapDriver.id) : null
  const operationsHandleStyle = selectedDriverIdentity
    ? { '--selected-driver-color': selectedDriverIdentity.color }
    : undefined

  const workspaceOpen = Boolean(activeApp)

  return (
    <main className="desktop-shell">
      <TopBar />

      <section
        className={`operations-canvas ${workspaceOpen ? 'workspace-open' : ''}`}
        aria-label="DOC OS operations workstation"
      >
        <div className="map-workspace">
          <OperationsMap
            drivers={drivers}
            driverDay={mapDriverDay}
            selectedDriver={mapDriver}
            selectedStop={selectedStop}
            selection={selection}
            freightRoutePreview={activeFreightRoutePreview}
            workspaceOpen={workspaceOpen}
            marketLanes={marketLanes}
            locations={locations}
            onSelectSubject={onSelectSubject}
          />

          {!workspaceOpen && (
            <>
              <button
                type="button"
                className={`drawer-handle drawer-handle-left ${leftOpen ? 'open' : ''}`}
                onClick={onToggleLeft}
                aria-expanded={leftOpen}
                aria-controls="driver-drawer"
              >
                <span className="handle-icon" aria-hidden="true">☷</span>
                <span>DRIVERS</span>
                <b>{drivers.length}</b>
              </button>

              <button
                type="button"
                className={`drawer-handle drawer-handle-right ${rightOpen ? 'open' : ''} ${selectedDriver ? 'has-driver-selection' : ''}`}
                style={operationsHandleStyle}
                onClick={onToggleRight}
                aria-expanded={rightOpen}
                aria-controls="operations-drawer"
              >
                <span className="handle-icon" aria-hidden="true">⌁</span>
                <span>OPS</span>
                <b>{selectedDriver?.initials ?? '—'}</b>
              </button>

              <DriverDrawer
                drivers={drivers}
                activeDriverId={selectedDriver?.id ?? null}
                open={leftOpen}
                onClose={onCloseLeft}
                onSelectSubject={onSelectSubject}
              />

              <OperationsDrawer
                selection={selection}
                driver={selectedDriver}
                driverDay={driverDay}
                selectedStop={selectedStop}
                open={rightOpen}
                onClose={onCloseRight}
                onSelectSubject={onSelectSubject}
              />
            </>
          )}
        </div>

        <DesktopAppDrawer activeApp={activeApp}>
          {activeApp === 'freightlink' && (
            <FreightLinkWorkspace
              drivers={drivers}
              driverDays={driverDays}
              lanes={marketLanes}
              locations={locations}
              selection={selection}
              onSelectSubject={onSelectSubject}
              onClose={onCloseActiveApp}
              onRoutePreviewChange={onRoutePreviewChange}
            />
          )}
        </DesktopAppDrawer>

        <AppDock activeApp={activeApp} onToggleApp={onToggleApp} />
      </section>
    </main>
  )
}
