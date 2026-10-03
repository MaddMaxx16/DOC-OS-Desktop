import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { resolveSelectionContext } from '../domain/selection/selectionContext.js'
import OperationsMap from '../map/OperationsMap.jsx'
import AppDock from './AppDock.jsx'
import DriverDrawer from './DriverDrawer.jsx'
import OperationsDrawer from './OperationsDrawer.jsx'
import TopBar from './TopBar.jsx'
import './shell.css'

export default function DesktopShell({
  drivers,
  driverDays,
  selection,
  leftOpen,
  rightOpen,
  onToggleLeft,
  onToggleRight,
  onCloseLeft,
  onCloseRight,
  onSelectSubject,
}) {
  const { driver: selectedDriver, driverDay, stop: selectedStop } = resolveSelectionContext(
    selection,
    drivers,
    driverDays,
  )

  const selectedDriverIdentity = selectedDriver ? getDriverIdentity(selectedDriver.id) : null
  const operationsHandleStyle = selectedDriverIdentity
    ? { '--selected-driver-color': selectedDriverIdentity.color }
    : undefined

  return (
    <main className="desktop-shell">
      <TopBar />

      <section className="operations-canvas" aria-label="DOC OS operations workstation">
        <OperationsMap
          drivers={drivers}
          driverDay={driverDay}
          selectedDriver={selectedDriver}
          selectedStop={selectedStop}
          selection={selection}
          onSelectSubject={onSelectSubject}
        />

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

        <AppDock />
      </section>
    </main>
  )
}
