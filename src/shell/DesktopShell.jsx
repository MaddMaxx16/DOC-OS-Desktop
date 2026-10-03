import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { isSelection, SELECTION_TYPES } from '../domain/selection/selectionModel.js'
import OperationsMap from '../map/OperationsMap.jsx'
import AppDock from './AppDock.jsx'
import DriverDrawer from './DriverDrawer.jsx'
import OperationsDrawer from './OperationsDrawer.jsx'
import TopBar from './TopBar.jsx'
import './shell.css'

export default function DesktopShell({
  drivers,
  selection,
  leftOpen,
  rightOpen,
  onToggleLeft,
  onToggleRight,
  onCloseLeft,
  onCloseRight,
  onSelectSubject,
}) {
  const selectedDriver = isSelection(selection, SELECTION_TYPES.DRIVER)
    ? drivers.find((driver) => driver.id === selection.id) ?? null
    : null

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
          selection={selection}
          open={leftOpen}
          onClose={onCloseLeft}
          onSelectSubject={onSelectSubject}
        />

        <OperationsDrawer
          selection={selection}
          driver={selectedDriver}
          open={rightOpen}
          onClose={onCloseRight}
        />

        <AppDock />
      </section>
    </main>
  )
}
