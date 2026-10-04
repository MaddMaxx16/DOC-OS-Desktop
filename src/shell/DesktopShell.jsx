import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { resolveSelectionContext } from '../domain/selection/selectionContext.js'
import { isSelection, SELECTION_TYPES } from '../domain/selection/selectionModel.js'
import FreightLinkWorkspace from '../features/freightlink/FreightLinkWorkspace.jsx'
import RateConfirmationReview from '../features/rate-confirmation/RateConfirmationReview.jsx'
import OperationsMap from '../map/OperationsMap.jsx'
import AppDock from './AppDock.jsx'
import DesktopAppDrawer from './DesktopAppDrawer.jsx'
import DriverDrawer from './DriverDrawer.jsx'
import FocusedWorkspace from './FocusedWorkspace.jsx'
import OperationsDrawer from './OperationsDrawer.jsx'
import TopBar from './TopBar.jsx'
import './shell.css'

export default function DesktopShell({
  drivers,
  driverDays,
  marketLanes,
  allMarketLanes,
  locations,
  bookingRecords,
  selection,
  activeApp,
  focusedTask,
  freightRoutePreview,
  freightCandidateDriverId,
  leftOpen,
  rightOpen,
  onToggleLeft,
  onToggleRight,
  onCloseLeft,
  onCloseRight,
  onToggleApp,
  onCloseActiveApp,
  onCloseFocusedTask,
  onRoutePreviewChange,
  onFreightCandidateDriverChange,
  onRequestRateCon,
  onOpenRateCon,
  onRequestRateConCorrection,
  onConfirmBooking,
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
    && freightRoutePreview?.driver?.id === freightCandidateDriverId
  ) ? freightRoutePreview : null

  const freightDriver = activeFreightRoutePreview?.driver ?? null
  const freightCandidateDriver = activeApp === 'freightlink'
    ? drivers.find((driver) => driver.id === freightCandidateDriverId) ?? null
    : null
  const mapDriver = activeApp === 'freightlink'
    ? (freightDriver ?? freightCandidateDriver)
    : (selectedDriver ?? freightDriver)
  const mapDriverDay = mapDriver
    ? driverDays.find((day) => day.driverId === mapDriver.id) ?? null
    : driverDay

  const selectedDriverIdentity = mapDriver ? getDriverIdentity(mapDriver.id) : null
  const operationsHandleStyle = selectedDriverIdentity
    ? { '--selected-driver-color': selectedDriverIdentity.color }
    : undefined

  const workspaceOpen = Boolean(activeApp)

  const focusedRecord = focusedTask?.type === 'rate-confirmation'
    ? bookingRecords[focusedTask.laneId] ?? null
    : null
  const focusedLane = focusedRecord
    ? allMarketLanes.find((lane) => lane.id === focusedRecord.laneId) ?? null
    : null
  const focusedDriver = focusedRecord
    ? drivers.find((driver) => driver.id === focusedRecord.driverId) ?? null
    : null

  return (
    <main className="desktop-shell">
      <TopBar focused={Boolean(focusedTask)} />

      {focusedTask?.type === 'rate-confirmation' && focusedLane && focusedDriver && focusedRecord ? (
        <FocusedWorkspace
          eyebrow="DOCUMENT REVIEW"
          title={`Rate Confirmation · ${focusedLane.laneRef}`}
          subtitle="FOCUSED · GAMEPLAY PAUSED"
          onClose={onCloseFocusedTask}
        >
          <RateConfirmationReview
            lane={focusedLane}
            driver={focusedDriver}
            bookingRecord={focusedRecord}
            locations={locations}
            onRequestCorrection={(reason) => onRequestRateConCorrection(focusedLane.id, reason)}
            onConfirm={(options) => onConfirmBooking(focusedLane.id, options)}
          />
        </FocusedWorkspace>
      ) : (
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
                bookingRecords={bookingRecords}
                selection={selection}
                candidateDriverId={freightCandidateDriverId}
                onCandidateDriverChange={onFreightCandidateDriverChange}
                onRequestRateCon={onRequestRateCon}
                onOpenRateCon={onOpenRateCon}
                onSelectSubject={onSelectSubject}
                onClose={onCloseActiveApp}
                onRoutePreviewChange={onRoutePreviewChange}
              />
            )}
          </DesktopAppDrawer>

          <AppDock activeApp={activeApp} onToggleApp={onToggleApp} />
        </section>
      )}
    </main>
  )
}
