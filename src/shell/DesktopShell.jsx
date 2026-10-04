import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { resolveSelectionContext } from '../domain/selection/selectionContext.js'
import { isSelection, SELECTION_TYPES } from '../domain/selection/selectionModel.js'
import FreightLinkWorkspace from '../features/freightlink/FreightLinkWorkspace.jsx'
import RateConfirmationReview from '../features/rate-confirmation/RateConfirmationReview.jsx'
import OperationsMap from '../map/OperationsMap.jsx'
import CommandRail from './CommandRail.jsx'
import DriverBrowser from './DriverBrowser.jsx'
import FocusedWorkspace from './FocusedWorkspace.jsx'
import OperationsInspector from './OperationsInspector.jsx'
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
  planningDriverId,
  planningFeedback,
  freightRoutePreview,
  freightCandidateDriverId,
  onToggleApp,
  onCloseActiveApp,
  onCloseFocusedTask,
  onRoutePreviewChange,
  onFreightCandidateDriverChange,
  onRequestRateCon,
  onOpenRateCon,
  onRequestRateConCorrection,
  onConfirmBooking,
  onStartDriverPlanning,
  onStopDriverPlanning,
  onReorderDriverStop,
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

  const freightlinkOpen = activeApp === 'freightlink'
  const freightDriver = activeFreightRoutePreview?.driver ?? null
  const freightCandidateDriver = freightlinkOpen
    ? drivers.find((driver) => driver.id === freightCandidateDriverId) ?? null
    : null
  const mapDriver = freightlinkOpen
    ? (freightDriver ?? freightCandidateDriver)
    : selectedDriver
  const mapDriverDay = mapDriver
    ? driverDays.find((day) => day.driverId === mapDriver.id) ?? null
    : driverDay

  const hasBrowser = activeApp === 'drivers' || freightlinkOpen
  const hasFreightInspector = freightlinkOpen && isSelection(selection, SELECTION_TYPES.LOAD)
  const hasOperationsInspector = !freightlinkOpen && Boolean(selection)
  const hasInspector = hasFreightInspector || hasOperationsInspector

  const focusedRecord = focusedTask?.type === 'rate-confirmation'
    ? bookingRecords[focusedTask.laneId] ?? null
    : null
  const focusedLane = focusedRecord
    ? allMarketLanes.find((lane) => lane.id === focusedRecord.laneId) ?? null
    : null
  const focusedDriver = focusedRecord
    ? drivers.find((driver) => driver.id === focusedRecord.driverId) ?? null
    : null

  const selectedDriverIdentity = mapDriver ? getDriverIdentity(mapDriver.id) : null

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
          className={[
            'operations-canvas',
            hasBrowser ? 'browser-open' : '',
            hasInspector ? 'inspector-open' : '',
            freightlinkOpen ? 'freightlink-open' : '',
          ].filter(Boolean).join(' ')}
          style={selectedDriverIdentity ? { '--selected-driver-color': selectedDriverIdentity.color } : undefined}
          aria-label="DOC OS operations workstation"
        >
          <CommandRail activeSection={activeApp} onToggleSection={onToggleApp} />

          {activeApp === 'drivers' && (
            <DriverBrowser
              drivers={drivers}
              activeDriverId={selectedDriver?.id ?? null}
              onSelectSubject={onSelectSubject}
            />
          )}

          {freightlinkOpen && (
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

          <div className="map-workspace">
            <OperationsMap
              drivers={drivers}
              driverDay={mapDriverDay}
              selectedDriver={mapDriver}
              selectedStop={selectedStop}
              selection={selection}
              freightRoutePreview={activeFreightRoutePreview}
              workspaceOpen={freightlinkOpen}
              marketLanes={marketLanes}
              locations={locations}
              onSelectSubject={onSelectSubject}
            />
          </div>

          {hasOperationsInspector && (
            <OperationsInspector
              selection={selection}
              driver={selectedDriver}
              driverDay={driverDay}
              selectedStop={selectedStop}
              planning={planningDriverId === selectedDriver?.id}
              planningFeedback={planningFeedback?.driverId === selectedDriver?.id ? planningFeedback : null}
              onStartPlanning={onStartDriverPlanning}
              onStopPlanning={onStopDriverPlanning}
              onReorderStop={onReorderDriverStop}
              onSelectSubject={onSelectSubject}
            />
          )}
        </section>
      )}
    </main>
  )
}
