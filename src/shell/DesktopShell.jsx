import { useMemo, useState } from 'react'
import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { resolveSelectionContext } from '../domain/selection/selectionContext.js'
import { isSelection, SELECTION_TYPES } from '../domain/selection/selectionModel.js'
import { buildPlanningPlaceOptions } from '../domain/planning/planningPlaces.js'
import PlanningPlaceFlyout from '../features/driver-day/PlanningPlaceFlyout.jsx'
import DockLoadWorkspace from '../features/dock-load/DockLoadWorkspace.jsx'
import DeliveryWorkspace from '../features/dock-delivery/DeliveryWorkspace.jsx'
import DocumentsWorkspace from '../features/documents/DocumentsWorkspace.jsx'
import EmailWorkspace from '../features/email/EmailWorkspace.jsx'
import OperationalDocumentInspection from '../features/documents/OperationalDocumentInspection.jsx'
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
  facilityOperations,
  operationalDocuments = [],
  operationalLoadFiles = [],
  documentAttentionCount = 0,
  emailMessages = [],
  emailUnreadCount = 0,
  selectedEmailId,
  selectedDocumentId,
  selection,
  activeApp,
  focusedTask,
  planningDriverId,
  planningFeedback,
  pendingPlanningPlace,
  planningPlacePreviewDay,
  operationsInspectorHidden = false,
  freightRoutePreview,
  freightCandidateDriverId,
  simulationClock,
  liveDriverStates = {},
  onToggleApp,
  onCloseActiveApp,
  onCloseFocusedTask,
  onRoutePreviewChange,
  onFreightCandidateDriverChange,
  onSimulationModeChange,
  onRequestRateCon,
  onOpenEmailForRateCon,
  onSelectEmail,
  onPrintDocument,
  onOpenDocuments,
  onInspectDocument,
  onSelectDocument,
  onFileDocument,
  onUnfileDocument,
  onSubmitLoadFile,
  onRequestRateConCorrection,
  onConfirmBooking,
  onOpenDockLoad,
  onCommitDockLoad,
  onCommitDockDelivery,
  onStartDriverPlanning,
  onStopDriverPlanning,
  onMoveDriverPlanEvent,
  onPreviewDriverPlanningPlace,
  onCancelDriverPlanningPlace,
  onConfirmDriverPlanningPlace,
  onSendDriverSchedule,
  onCloseOperationsInspector,
  onSelectSubject,
}) {
  const [driverBrowserFilter, setDriverBrowserFilter] = useState('all')

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
  const emailOpen = activeApp === 'email'
  const documentsOpen = activeApp === 'documents'
  const freightDriver = activeFreightRoutePreview?.driver ?? null
  const freightCandidateDriver = freightlinkOpen
    ? drivers.find((driver) => driver.id === freightCandidateDriverId) ?? null
    : null
  const mapDriver = freightlinkOpen
    ? (freightDriver ?? freightCandidateDriver)
    : selectedDriver
  const committedMapDriverDay = mapDriver
    ? driverDays.find((day) => day.driverId === mapDriver.id) ?? null
    : driverDay
  const mapDriverDay = (
    !freightlinkOpen
    && planningPlacePreviewDay?.driverId === mapDriver?.id
  )
    ? planningPlacePreviewDay
    : committedMapDriverDay

  const planningActive = planningDriverId === selectedDriver?.id
  const selectedPlanningKind = selectedStop?.kind ?? null
  const planningPlaceOptions = useMemo(() => (
    planningActive
    && driverDay
    && (selectedPlanningKind === 'lunch' || selectedPlanningKind === 'staging')
      ? buildPlanningPlaceOptions({
          day: driverDay,
          kind: selectedPlanningKind,
          locations,
        })
      : []
  ), [driverDay, locations, planningActive, selectedPlanningKind])

  const toggleShellApp = (appId) => {
    if (appId === 'drivers' && activeApp !== 'drivers') {
      setDriverBrowserFilter('all')
    }
    onToggleApp(appId)
  }

  const openDriversBrowser = (filter = 'all') => {
    setDriverBrowserFilter(filter)
    if (activeApp !== 'drivers') onToggleApp('drivers')
  }

  const hasBrowser = activeApp === 'drivers' || freightlinkOpen || emailOpen || documentsOpen
  const hasFreightInspector = freightlinkOpen && isSelection(selection, SELECTION_TYPES.LOAD)
  const selectedDocument = documentsOpen
    ? operationalDocuments.find((document) => document.id === selectedDocumentId) ?? null
    : null
  const hasDocumentInspector = documentsOpen && Boolean(selectedDocument)
  const hasOperationsInspector = (
    !freightlinkOpen
    && !emailOpen
    && !documentsOpen
    && Boolean(selection)
    && !operationsInspectorHidden
  )
  const hasInspector = hasFreightInspector || hasDocumentInspector || hasOperationsInspector

  const focusedDockDriver = ['dock-load', 'dock-delivery'].includes(focusedTask?.type)
    ? drivers.find((driver) => driver.id === focusedTask.driverId) ?? null
    : null
  const focusedDockDay = focusedDockDriver
    ? driverDays.find((day) => day.driverId === focusedDockDriver.id) ?? null
    : null
  const focusedDockEvent = focusedDockDay
    ? focusedDockDay.timeline.find((event) => event.id === focusedTask?.eventId) ?? null
    : null

  const focusedRecord = focusedTask?.type === 'rate-confirmation'
    ? bookingRecords[focusedTask.laneId] ?? null
    : null
  const focusedLane = focusedRecord
    ? allMarketLanes.find((lane) => lane.id === focusedRecord.laneId) ?? null
    : null
  const focusedDriver = focusedRecord
    ? drivers.find((driver) => driver.id === focusedRecord.driverId) ?? null
    : null

  const focusedInspectionDocument = focusedTask?.type === 'document-inspect'
    ? operationalDocuments.find((document) => document.id === focusedTask.documentId) ?? null
    : null
  const focusedInspectionDriver = focusedInspectionDocument?.driverId
    ? drivers.find((driver) => driver.id === focusedInspectionDocument.driverId) ?? null
    : null

  const selectedDriverIdentity = mapDriver ? getDriverIdentity(mapDriver.id) : null
  const selectedLiveState = selectedDriver
    ? liveDriverStates[selectedDriver.id] ?? null
    : null
  const mapLiveState = mapDriver
    ? liveDriverStates[mapDriver.id] ?? null
    : null

  return (
    <main className="desktop-shell">
      <TopBar
        focused={Boolean(focusedTask)}
        simulationClock={simulationClock}
        liveDriverStates={liveDriverStates}
        onSimulationModeChange={onSimulationModeChange}
      />

      {focusedTask?.type === 'dock-load' && focusedDockDriver && focusedDockEvent ? (
        <FocusedWorkspace
          eyebrow="DOCK & LOAD"
          title={`${focusedDockDriver.name} · ${focusedDockEvent.locationLabel}`}
          subtitle="FOCUSED · GAMEPLAY PAUSED"
          onClose={onCloseFocusedTask}
        >
          <DockLoadWorkspace
            driver={focusedDockDriver}
            driverDay={focusedDockDay}
            event={focusedDockEvent}
            facilityOperations={facilityOperations}
            onCommit={onCommitDockLoad}
          />
        </FocusedWorkspace>
      ) : focusedTask?.type === 'dock-delivery' && focusedDockDriver && focusedDockEvent ? (
        <FocusedWorkspace
          eyebrow="DOCK & DELIVERY"
          title={`${focusedDockDriver.name} · ${focusedDockEvent.locationLabel}`}
          subtitle="FOCUSED · GAMEPLAY PAUSED"
          onClose={onCloseFocusedTask}
        >
          <DeliveryWorkspace
            driver={focusedDockDriver}
            driverDay={focusedDockDay}
            event={focusedDockEvent}
            facilityOperations={facilityOperations}
            onCommit={onCommitDockDelivery}
          />
        </FocusedWorkspace>
      ) : focusedTask?.type === 'rate-confirmation' && focusedLane && focusedDriver && focusedRecord ? (
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
      ) : focusedTask?.type === 'document-inspect' && focusedInspectionDocument ? (
        <FocusedWorkspace
          eyebrow="DOCUMENT INSPECTION"
          title={`${focusedInspectionDocument.title} · ${focusedInspectionDocument.loadRef}`}
          subtitle="FOCUSED · GAMEPLAY PAUSED"
          onClose={onCloseFocusedTask}
        >
          <OperationalDocumentInspection
            document={focusedInspectionDocument}
            driver={focusedInspectionDriver}
          />
        </FocusedWorkspace>
      ) : (
        <section
          className={[
            'operations-canvas',
            hasBrowser ? 'browser-open' : '',
            hasInspector ? 'inspector-open' : '',
            freightlinkOpen ? 'freightlink-open' : '',
            emailOpen ? 'email-open' : '',
            documentsOpen ? 'documents-open' : '',
            activeApp === 'drivers' ? 'fleet-browser-open' : '',
          ].filter(Boolean).join(' ')}
          style={selectedDriverIdentity ? { '--selected-driver-color': selectedDriverIdentity.color } : undefined}
          aria-label="DOC OS operations workstation"
        >
          <CommandRail
            activeSection={activeApp}
            attentionCounts={{
              email: emailUnreadCount,
              documents: documentAttentionCount,
            }}
            onToggleSection={toggleShellApp}
          />

          {activeApp === 'drivers' && (
            <DriverBrowser
              drivers={drivers}
              driverDays={driverDays}
              activeDriverId={selectedDriver?.id ?? null}
              liveDriverStates={liveDriverStates}
              filter={driverBrowserFilter}
              onClearFilter={() => setDriverBrowserFilter('all')}
              onSelectSubject={onSelectSubject}
            />
          )}

          {emailOpen && (
            <EmailWorkspace
              messages={emailMessages}
              selectedEmailId={selectedEmailId}
              onSelectEmail={onSelectEmail}
              onPrintDocument={onPrintDocument}
              onOpenDocuments={onOpenDocuments}
              onClose={onCloseActiveApp}
            />
          )}

          {documentsOpen && (
            <DocumentsWorkspace
              documents={operationalDocuments}
              loadFiles={operationalLoadFiles}
              drivers={drivers}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={onSelectDocument}
              onInspectDocument={onInspectDocument}
              onFileDocument={onFileDocument}
              onUnfileDocument={onUnfileDocument}
              onSubmitLoadFile={onSubmitLoadFile}
              onClose={onCloseActiveApp}
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
              onOpenEmailForRateCon={onOpenEmailForRateCon}
              onSelectSubject={onSelectSubject}
              onClose={onCloseActiveApp}
              onRoutePreviewChange={onRoutePreviewChange}
            />
          )}

          {!emailOpen && !documentsOpen && (
            <div className="map-workspace">
              <OperationsMap
                drivers={drivers}
                driverDays={driverDays}
                driverDay={mapDriverDay}
                selectedDriver={mapDriver}
                selectedStop={selectedStop}
                selection={selection}
                liveDriverStates={liveDriverStates}
                liveState={mapLiveState}
                freightRoutePreview={activeFreightRoutePreview}
                planningPlaceOptions={planningPlaceOptions}
                pendingPlanningPlace={pendingPlanningPlace}
                workspaceOpen={freightlinkOpen}
                marketLanes={marketLanes}
                locations={locations}
                onPreviewPlanningPlace={onPreviewDriverPlanningPlace}
                onSelectSubject={onSelectSubject}
                onOpenDrivers={openDriversBrowser}
              />
            </div>
          )}

          {!emailOpen && !documentsOpen && planningActive && selectedStop && ['lunch', 'staging'].includes(selectedStop.kind) && (
            <PlanningPlaceFlyout
              driver={selectedDriver}
              event={selectedStop}
              options={planningPlaceOptions}
              pendingPlace={pendingPlanningPlace?.driverId === selectedDriver?.id
                && pendingPlanningPlace?.kind === selectedStop.kind
                ? pendingPlanningPlace
                : null}
              onPreviewPlace={onPreviewDriverPlanningPlace}
              onCancel={onCancelDriverPlanningPlace}
              onConfirm={onConfirmDriverPlanningPlace}
            />
          )}

          {hasOperationsInspector && (
            <OperationsInspector
              selection={selection}
              driver={selectedDriver}
              driverDay={driverDay}
              selectedStop={selectedStop}
              planning={planningActive}
              planningFeedback={planningFeedback?.driverId === selectedDriver?.id ? planningFeedback : null}
              liveState={selectedLiveState}
              onStartPlanning={onStartDriverPlanning}
              onStopPlanning={onStopDriverPlanning}
              onMovePlanEvent={onMoveDriverPlanEvent}
              onSendSchedule={onSendDriverSchedule}
              onOpenDockLoad={onOpenDockLoad}
              onClose={onCloseOperationsInspector}
              onSelectSubject={onSelectSubject}
            />
          )}
        </section>
      )}
    </main>
  )
}
