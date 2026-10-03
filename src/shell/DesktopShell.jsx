import TopBar from './TopBar.jsx'
import DriverDrawer from './DriverDrawer.jsx'
import OperationsDrawer from './OperationsDrawer.jsx'
import AppDock from './AppDock.jsx'
import OperationsMap from '../map/OperationsMap.jsx'
import './shell.css'

export default function DesktopShell({
  drivers,
  selectedDriver,
  leftOpen,
  rightOpen,
  onToggleLeft,
  onToggleRight,
  onCloseLeft,
  onCloseRight,
  onSelectDriver,
}) {
  return (
    <main className="desktop-shell">
      <TopBar />

      <section className="operations-canvas" aria-label="DOC OS operations workstation">
        <OperationsMap drivers={drivers} selectedDriver={selectedDriver} onSelectDriver={onSelectDriver} />

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
          className={`drawer-handle drawer-handle-right ${rightOpen ? 'open' : ''}`}
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
          selectedDriverId={selectedDriver?.id ?? null}
          open={leftOpen}
          onClose={onCloseLeft}
          onSelectDriver={onSelectDriver}
        />

        <OperationsDrawer
          driver={selectedDriver}
          open={rightOpen}
          onClose={onCloseRight}
        />

        <AppDock />
      </section>
    </main>
  )
}
