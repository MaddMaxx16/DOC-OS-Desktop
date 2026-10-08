import { useEffect, useMemo, useState } from 'react'
import { drivers } from '../data/drivers.js'
import { freightMarket } from '../data/freightMarket.js'
import {
  driverPlans as seedDriverPlans,
  loads as seedLoads,
  locations,
} from '../data/operationsSeed.js'
import {
  BOOKING_STATUS,
  confirmBookingRecord,
  createBookingRequest,
  receiveCorrectedRateConfirmation,
  receiveRateConfirmation,
  requestRateConfirmationCorrection,
} from '../domain/booking/bookingLifecycle.js'
import { commitBookedFreight } from '../domain/booking/commitBookedFreight.js'
import { buildRateConfirmation } from '../domain/booking/rateConfirmation.js'
import { evaluateFreightLane } from '../domain/freight/freightFit.js'
import {
  buildOperationalEmailInbox,
  operationalEmailUnreadCount,
} from '../domain/communications/operationalEmail.js'
import { commitPickupOperation } from '../domain/facility/pickupOperation.js'
import { commitDeliveryOperation } from '../domain/facility/deliveryOperation.js'
import {
  acceptDeliveryPod,
  advanceDeliveryDocuments,
  createCorrectedDeliveryPodRecord,
  createDeliveryPodRecord,
  DELIVERY_DOCUMENT_STATUS,
  deliveryPodId,
  requestDeliveryPodCorrection,
  supersedeDeliveryPod,
} from '../domain/documents/deliveryPod.js'
import {
  buildOperationalDocumentIndex,
  buildOperationalLoadFiles,
  operationalDocumentWorkspaceAttentionCount,
  OPERATIONAL_DOCUMENT_TYPE,
} from '../domain/documents/operationalDocumentIndex.js'
import { buildDriverDays } from '../domain/manifest/driverDayModel.js'
import {
  advanceSimulationClock,
  buildLiveDriverStates,
  createSimulationClock,
  dispatchDelayMinutes,
  setSimulationMode,
  simulationAbsoluteMinutes,
  SIMULATION_MODE,
  SIMULATION_TICK_MS,
} from '../domain/live/liveOperations.js'
import {
  canEditDispatchPlan,
  sendDispatchPlan,
} from '../domain/planning/dispatchPlan.js'
import { choosePlanningPlace } from '../domain/planning/planningPlaces.js'
import {
  moveDriverPlanEventToGap,
  recalculateDriverTimeline,
} from '../domain/planning/stopSequencing.js'
import { createSelection, SELECTION_TYPES } from '../domain/selection/selectionModel.js'
import DesktopShell from '../shell/DesktopShell.jsx'

export default function App() {
  const [selection, setSelection] = useState(null)
  const [activeApp, setActiveApp] = useState(null)
  const [freightRoutePreview, setFreightRoutePreview] = useState(null)
  const [freightCandidateDriverId, setFreightCandidateDriverId] = useState(drivers[0]?.id ?? null)
  const [operationalLoads, setOperationalLoads] = useState(() => [...seedLoads])
  const [operationalDriverPlans, setOperationalDriverPlans] = useState(() => ({ ...seedDriverPlans }))
  const [bookingRecords, setBookingRecords] = useState({})
  const [facilityOperations, setFacilityOperations] = useState({})
  const [documentRecords, setDocumentRecords] = useState({})
  const [documentFileAssignments, setDocumentFileAssignments] = useState({})
  const [submittedLoadFiles, setSubmittedLoadFiles] = useState({})
  const [deskDocumentIds, setDeskDocumentIds] = useState({})
  const [readEmailIds, setReadEmailIds] = useState({})
  const [selectedEmailId, setSelectedEmailId] = useState(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState(null)
  const [focusedTask, setFocusedTask] = useState(null)
  const [planningDriverId, setPlanningDriverId] = useState(null)
  const [planningFeedback, setPlanningFeedback] = useState(null)
  const [pendingPlanningPlace, setPendingPlanningPlace] = useState(null)
  const [operationsInspectorHidden, setOperationsInspectorHidden] = useState(false)
  const [simulationClock, setSimulationClock] = useState(() => createSimulationClock())

  const driverDays = useMemo(
    () => buildDriverDays(drivers, operationalLoads, operationalDriverPlans, locations),
    [operationalDriverPlans, operationalLoads],
  )

  const liveDriverStates = useMemo(
    () => buildLiveDriverStates(driverDays, simulationClock, {
      pickupFacilityMode: true,
      deliveryFacilityMode: true,
      facilityOperations,
    }),
    [driverDays, facilityOperations, simulationClock],
  )

  useEffect(() => {
    if (focusedTask || simulationClock.mode === SIMULATION_MODE.PAUSED) return undefined

    const timer = setInterval(() => {
      setSimulationClock((current) => advanceSimulationClock(current))
    }, SIMULATION_TICK_MS)

    return () => clearInterval(timer)
  }, [focusedTask, simulationClock.mode])

  useEffect(() => {
    setDocumentRecords((current) => advanceDeliveryDocuments(
      current,
      simulationAbsoluteMinutes(simulationClock),
    ))
  }, [simulationClock])


  const setSimulationClockMode = (mode) => {
    setSimulationClock((current) => setSimulationMode(current, mode))
  }

  const planningPlacePreviewDay = useMemo(() => {
    if (!pendingPlanningPlace) return null

    const driver = drivers.find((item) => item.id === pendingPlanningPlace.driverId)
    if (!driver) return null

    const result = choosePlanningPlace({
      driver,
      driverId: driver.id,
      loads: operationalLoads,
      driverPlans: operationalDriverPlans,
      locations,
      kind: pendingPlanningPlace.kind,
      locationId: pendingPlanningPlace.locationId,
    })

    return result.ok ? result.driverDay : null
  }, [operationalDriverPlans, operationalLoads, pendingPlanningPlace])

  const marketLanes = useMemo(() => {
    const confirmedLaneIds = new Set(
      Object.values(bookingRecords)
        .filter((record) => record?.status === BOOKING_STATUS.CONFIRMED)
        .map((record) => record.laneId),
    )
    return freightMarket.filter((lane) => !confirmedLaneIds.has(lane.id))
  }, [bookingRecords])

  const operationalDocuments = useMemo(() => buildOperationalDocumentIndex({
    bookingRecords,
    documentRecords,
    lanes: freightMarket,
  }), [bookingRecords, documentRecords])

  const operationalLoadFiles = useMemo(
    () => buildOperationalLoadFiles(operationalDocuments, {
      fileAssignments: documentFileAssignments,
      submittedLoadFiles,
      deskDocumentIds,
    }),
    [deskDocumentIds, documentFileAssignments, operationalDocuments, submittedLoadFiles],
  )

  const documentAttentionCount = useMemo(
    () => operationalDocumentWorkspaceAttentionCount(operationalLoadFiles),
    [operationalLoadFiles],
  )

  const operationalEmails = useMemo(
    () => buildOperationalEmailInbox({
      documents: operationalDocuments,
      readEmailIds,
    }),
    [operationalDocuments, readEmailIds],
  )

  const emailUnreadCount = useMemo(
    () => operationalEmailUnreadCount(operationalEmails),
    [operationalEmails],
  )

  const selectSubject = (type, id) => {
    setPendingPlanningPlace(null)
    setOperationsInspectorHidden(false)
    setSelection(createSelection(type, id))

    const subjectDriverId = type === SELECTION_TYPES.DRIVER
      ? id
      : type === SELECTION_TYPES.STOP
        ? driverDays.find((day) => day.timeline.some((item) => item.id === id))?.driverId ?? null
        : null

    if (
      planningDriverId
      && subjectDriverId
      && subjectDriverId !== planningDriverId
    ) {
      setPlanningDriverId(null)
      setPlanningFeedback(null)
    }

    if (type === SELECTION_TYPES.DRIVER || type === SELECTION_TYPES.STOP) {
      return
    }

    if (type === SELECTION_TYPES.LOAD) {
      const bookingRecord = bookingRecords[id]
      if (
        bookingRecord
        && bookingRecord.status !== BOOKING_STATUS.CONFIRMED
        && bookingRecord.driverId
      ) {
        setFreightCandidateDriverId(bookingRecord.driverId)
      }
    }
  }

  const startDriverPlanning = (driverId) => {
    const day = driverDays.find((item) => item.driverId === driverId)
    if (!day || !canEditDispatchPlan(day)) return
    setPlanningFeedback(null)
    setPendingPlanningPlace(null)
    setPlanningDriverId(driverId)
  }

  const stopDriverPlanning = (driverId) => {
    setPlanningFeedback(null)
    setPendingPlanningPlace(null)
    setPlanningDriverId((current) => current === driverId ? null : current)
  }

  const moveDriverPlanEvent = ({ driverId, eventId, beforeId, afterId }) => {
    setPendingPlanningPlace(null)
    const driver = drivers.find((item) => item.id === driverId)
    if (!driver || planningDriverId !== driverId) return

    const result = moveDriverPlanEventToGap({
      driver,
      driverId,
      loads: operationalLoads,
      driverPlans: operationalDriverPlans,
      locations,
      eventId,
      beforeId,
      afterId,
    })

    if (!result.ok) {
      setPlanningFeedback({
        driverId,
        tone: 'blocked',
        message: result.reason ?? 'That planning move is not possible.',
      })
      return
    }

    setOperationalLoads(result.loads)
    setOperationalDriverPlans(result.driverPlans)
    setSelection(createSelection(SELECTION_TYPES.STOP, eventId))

    const firstWarning = result.driverDay?.planHealth?.warnings?.[0]
    setPlanningFeedback({
      driverId,
      tone: firstWarning ? 'warning' : 'success',
      message: firstWarning
        ? `Plan updated. ${firstWarning}`
        : 'Plan updated. Route, timing, and capacity recalculated.',
    })
  }

  const previewDriverPlanningPlace = ({ driverId, kind, locationId }) => {
    if (planningDriverId !== driverId) return
    setPlanningFeedback(null)
    setPendingPlanningPlace({ driverId, kind, locationId })
  }

  const cancelDriverPlanningPlace = () => {
    setPendingPlanningPlace(null)
    if (planningDriverId) {
      setSelection(createSelection(SELECTION_TYPES.DRIVER, planningDriverId))
    }
  }

  const confirmDriverPlanningPlace = () => {
    if (!pendingPlanningPlace) return

    const { driverId, kind, locationId } = pendingPlanningPlace
    const driver = drivers.find((item) => item.id === driverId)
    if (!driver || planningDriverId !== driverId) return

    const result = choosePlanningPlace({
      driver,
      driverId,
      loads: operationalLoads,
      driverPlans: operationalDriverPlans,
      locations,
      kind,
      locationId,
    })

    if (!result.ok) {
      setPlanningFeedback({
        driverId,
        tone: 'blocked',
        message: result.reason ?? 'That location cannot be used here.',
      })
      return
    }

    setOperationalLoads(result.loads)
    setOperationalDriverPlans(result.driverPlans)
    setPendingPlanningPlace(null)
    setSelection(createSelection(SELECTION_TYPES.DRIVER, driverId))

    const firstWarning = result.driverDay?.planHealth?.warnings?.[0]
    setPlanningFeedback({
      driverId,
      tone: firstWarning ? 'warning' : 'success',
      message: firstWarning
        ? `${result.location.label} confirmed. ${firstWarning}`
        : `${result.location.label} confirmed. Route and timing recalculated.`,
    })
  }

  const sendDriverSchedule = ({ driverId, allowWarnings = false }) => {
    const driverDay = driverDays.find((day) => day.driverId === driverId)
    if (!driverDay || planningDriverId !== driverId) return

    const result = sendDispatchPlan({
      driverId,
      driverPlans: operationalDriverPlans,
      driverDay,
      allowWarnings,
      sentAtMinutes: simulationClock.currentMinutes,
      sentAtDayNumber: simulationClock.dayNumber,
    })

    if (!result.ok) {
      setPlanningFeedback({
        driverId,
        tone: result.requiresWarningOverride ? 'warning' : 'blocked',
        message: result.reason ?? 'This schedule cannot be sent yet.',
      })
      return
    }

    const delayMinutes = dispatchDelayMinutes(driverDay, simulationClock)
    let nextLoads = operationalLoads
    let nextDriverPlans = result.driverPlans

    if (delayMinutes > 0) {
      const driver = drivers.find((item) => item.id === driverId)
      const sentPlan = result.driverPlans[driverId]

      if (driver && sentPlan) {
        const recalculated = recalculateDriverTimeline({
          driver,
          loads: operationalLoads,
          plan: {
            ...sentPlan,
            lateDispatchMinutes: delayMinutes,
          },
          locations,
          startMinutesOverride: simulationAbsoluteMinutes(simulationClock),
        })

        nextLoads = recalculated.loads
        nextDriverPlans = {
          ...result.driverPlans,
          [driverId]: {
            ...recalculated.plan,
            lateDispatchMinutes: delayMinutes,
          },
        }
      }
    }

    setOperationalLoads(nextLoads)
    setOperationalDriverPlans(nextDriverPlans)
    setPlanningDriverId(null)
    setPlanningFeedback(null)
    setPendingPlanningPlace(null)
    setSelection(createSelection(SELECTION_TYPES.DRIVER, driverId))
  }

  const closeOperationsInspector = () => {
    setOperationsInspectorHidden(true)
    setPlanningFeedback(null)
    setPendingPlanningPlace(null)
    setPlanningDriverId(null)
  }

  const toggleApp = (appId) => {
    if (!['drivers', 'freightlink', 'email', 'documents'].includes(appId)) return

    const opening = activeApp !== appId
    if (appId === 'freightlink' && opening && selection?.type === SELECTION_TYPES.DRIVER) {
      setFreightCandidateDriverId(selection.id)
    }

    if (['freightlink', 'email', 'documents'].includes(appId) && opening) {
      setOperationsInspectorHidden(false)
      setPlanningDriverId(null)
      setPlanningFeedback(null)
      setPendingPlanningPlace(null)
    }

    if (activeApp === 'freightlink' && appId !== 'freightlink') {
      setFreightRoutePreview(null)
      if (selection?.type === SELECTION_TYPES.LOAD) setSelection(null)
    }

    if (['email', 'documents'].includes(appId) && opening) {
      setFreightRoutePreview(null)
      if (selection?.type === SELECTION_TYPES.LOAD) setSelection(null)
    }

    setActiveApp(opening ? appId : null)

    if (!opening && appId === 'freightlink') {
      setFreightRoutePreview(null)
      if (selection?.type === SELECTION_TYPES.LOAD) setSelection(null)
    }
  }

  const closeActiveApp = () => {
    setActiveApp(null)
    setFreightRoutePreview(null)
    setPendingPlanningPlace(null)
    if (selection?.type === SELECTION_TYPES.LOAD) setSelection(null)
  }

  const requestRateCon = ({ laneId, driverId, evaluation }) => {
    const lane = freightMarket.find((item) => item.id === laneId)
    if (!lane || !driverId || !evaluation) return

    const request = createBookingRequest({
      laneId,
      driverId,
      evaluation,
    })
    setBookingRecords((current) => ({
      ...current,
      [laneId]: request,
    }))

    setTimeout(() => {
      setBookingRecords((current) => {
        const record = current[laneId]
        if (
          !record
          || record.status !== BOOKING_STATUS.REQUESTED
          || record.driverId !== driverId
        ) {
          return current
        }

        const rateConfirmation = buildRateConfirmation({
          lane,
          locations,
          revision: 1,
        })

        return {
          ...current,
          [laneId]: receiveRateConfirmation(record, rateConfirmation),
        }
      })
    }, 650)
  }

  const openDocumentsForRateCon = (laneId) => {
    const record = bookingRecords[laneId]
    const documentId = record?.rateConfirmation?.id
    if (!documentId) return

    setFreightRoutePreview(null)
    if (selection?.type === SELECTION_TYPES.LOAD) setSelection(null)
    setSelectedDocumentId(documentId)
    setActiveApp('documents')
  }

  const selectEmail = (emailId) => {
    setSelectedEmailId(emailId)
    setReadEmailIds((current) => ({ ...current, [emailId]: true }))
  }

  const moveDocumentToDesk = (documentId) => {
    const document = operationalDocuments.find((item) => item.id === documentId)
    if (!document) return { ok: false, message: 'That incoming paper is no longer available.' }
    if (documentFileAssignments[documentId]) {
      return { ok: false, message: `${document.shortTypeLabel} is already filed.` }
    }
    if (deskDocumentIds[documentId]) {
      return { ok: true, message: `${document.shortTypeLabel} is already on the desk.` }
    }

    setDeskDocumentIds((current) => ({
      ...current,
      [documentId]: true,
    }))
    setSelectedDocumentId(documentId)
    return {
      ok: true,
      message: `${document.shortTypeLabel} moved from Incoming to the working desk.`,
    }
  }

  const openDocuments = (documentId = null) => {
    if (documentId) setSelectedDocumentId(documentId)
    setActiveApp('documents')
  }

  const openRateCon = (laneId) => {
    const record = bookingRecords[laneId]
    const documentId = record?.rateConfirmation?.id
    const availableToWork = Boolean(
      documentId
      && (deskDocumentIds[documentId] || documentFileAssignments[documentId])
    )
    if (
      record?.status !== BOOKING_STATUS.RATE_CON_READY
      || !documentId
      || !availableToWork
    ) return
    setSelectedDocumentId(documentId)
    setActiveApp('documents')
    setFocusedTask({ type: 'rate-confirmation', laneId })
  }

  const inspectDocument = (documentId) => {
    const document = operationalDocuments.find((item) => item.id === documentId)
    if (!document) return
    if (!deskDocumentIds[documentId] && !documentFileAssignments[documentId]) return

    setSelectedDocumentId(document.id)
    setActiveApp('documents')

    const bookingRecord = document.type === OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION
      ? bookingRecords[document.laneId]
      : null

    if (bookingRecord?.status === BOOKING_STATUS.RATE_CON_READY) {
      openRateCon(document.laneId)
      return
    }

    if (
      document.type === OPERATIONAL_DOCUMENT_TYPE.POD
      && [
        DELIVERY_DOCUMENT_STATUS.RECEIVED,
        DELIVERY_DOCUMENT_STATUS.REVIEW_REQUIRED,
        DELIVERY_DOCUMENT_STATUS.CORRECTED_RECEIVED,
      ].includes(document.sourceRecord?.status)
    ) {
      setFocusedTask({ type: 'pod-review', documentId: document.id })
      return
    }

    setFocusedTask({ type: 'document-inspect', documentId: document.id })
  }

  const requestPodCorrection = (documentId, reason) => {
    const record = documentRecords[documentId]
    if (!record?.id) return

    let requested
    try {
      requested = requestDeliveryPodCorrection(record, reason)
    } catch {
      return
    }

    setDocumentRecords((current) => ({
      ...current,
      [documentId]: requested,
    }))
    setFocusedTask(null)

    setTimeout(() => {
      setDocumentRecords((current) => {
        const source = current[documentId]
        if (!source || source.status !== DELIVERY_DOCUMENT_STATUS.CORRECTION_REQUESTED) {
          return current
        }

        const corrected = createCorrectedDeliveryPodRecord(source)
        return {
          ...current,
          [documentId]: supersedeDeliveryPod(source),
          [corrected.id]: corrected,
        }
      })
    }, 900)
  }

  const acceptPod = (documentId, options = {}) => {
    const record = documentRecords[documentId]
    if (!record?.id) return

    try {
      const accepted = acceptDeliveryPod(record, options)
      setDocumentRecords((current) => ({
        ...current,
        [documentId]: accepted,
      }))
      setFocusedTask(null)
    } catch {
      // Focused POD review owns validation and confirmation messaging.
    }
  }

  const fileDocument = (documentId, targetLoadRef) => {
    const document = operationalDocuments.find((item) => item.id === documentId)
    if (!document) {
      return { ok: false, message: 'That paper is no longer available on the desk.' }
    }

    if (!deskDocumentIds[documentId]) {
      return { ok: false, message: 'Move this paper from Incoming to the desk before filing it.' }
    }

    const targetLoadFile = operationalLoadFiles.find((item) => item.loadRef === targetLoadRef)
    if (targetLoadFile?.submitted) {
      return { ok: false, message: `${targetLoadRef} has already been submitted.` }
    }

    if (document.loadRef !== targetLoadRef) {
      return {
        ok: false,
        message: `${document.shortTypeLabel} belongs to ${document.loadRef}, not ${targetLoadRef}.`,
      }
    }

    setDocumentFileAssignments((current) => ({
      ...current,
      [document.id]: targetLoadRef,
    }))

    return {
      ok: true,
      message: `${document.shortTypeLabel} filed in ${targetLoadRef}.`,
    }
  }

  const unfileDocument = (documentId) => {
    const document = operationalDocuments.find((item) => item.id === documentId)
    if (!document) {
      return { ok: false, message: 'That paper is no longer available.' }
    }

    setDocumentFileAssignments((current) => {
      if (!current[documentId]) return current
      const next = { ...current }
      delete next[documentId]
      return next
    })

    setDeskDocumentIds((current) => ({
      ...current,
      [document.id]: true,
    }))
    setSelectedDocumentId(document.id)
    return {
      ok: true,
      message: `${document.shortTypeLabel} returned to the desk.`,
    }
  }

  const submitLoadFile = (loadRef) => {
    const loadFile = operationalLoadFiles.find((item) => item.loadRef === loadRef)
    if (!loadFile) {
      return { ok: false, message: 'That load file is no longer available.' }
    }
    if (!loadFile.canSubmit) {
      return { ok: false, message: 'This load file is still missing required paperwork.' }
    }

    setSubmittedLoadFiles((current) => ({
      ...current,
      [loadRef]: true,
    }))

    return {
      ok: true,
      message: `${loadRef} packet submitted.`,
    }
  }

  const requestRateConCorrection = (laneId, reason) => {
    const lane = freightMarket.find((item) => item.id === laneId)
    if (!lane) return

    setBookingRecords((current) => {
      const record = current[laneId]
      if (!record) return current
      return {
        ...current,
        [laneId]: requestRateConfirmationCorrection(record, reason),
      }
    })
    setFocusedTask(null)

    setTimeout(() => {
      setBookingRecords((current) => {
        const record = current[laneId]
        if (!record || record.status !== BOOKING_STATUS.CORRECTION_REQUESTED) {
          return current
        }

        const revision = Number(record.rateConfirmation?.revision ?? 1) + 1
        const corrected = buildRateConfirmation({
          lane,
          locations,
          revision,
          corrected: true,
        })

        return {
          ...current,
          [laneId]: receiveCorrectedRateConfirmation(record, corrected),
        }
      })
    }, 900)
  }

  const confirmBooking = (laneId, { acceptedWithMismatch = false } = {}) => {
    const lane = freightMarket.find((item) => item.id === laneId)
    const record = bookingRecords[laneId]
    const driver = drivers.find((item) => item.id === record?.driverId)
    const driverDay = driverDays.find((day) => day.driverId === record?.driverId)

    if (
      !lane
      || !record?.rateConfirmation
      || !driver
      || !driverDay
    ) {
      return
    }

    const currentEvaluation = evaluateFreightLane({
      lane,
      driver,
      day: driverDay,
      locations,
    })
    if (!currentEvaluation) return

    try {
      const committed = commitBookedFreight({
        lane,
        driverId: driver.id,
        driverDay,
        evaluation: currentEvaluation,
        rateConfirmation: record.rateConfirmation,
        loads: operationalLoads,
        driverPlans: operationalDriverPlans,
      })

      setOperationalLoads(committed.loads)
      setOperationalDriverPlans(committed.driverPlans)
      setBookingRecords((current) => ({
        ...current,
        [laneId]: {
          ...confirmBookingRecord(current[laneId], { acceptedWithMismatch }),
          bookedLoadId: committed.bookedLoad.id,
        },
      }))
      setFocusedTask(null)
      setFreightRoutePreview(null)
      setSelection(null)
    } catch (error) {
      setBookingRecords((current) => ({
        ...current,
        [laneId]: {
          ...current[laneId],
          bookingError: error instanceof Error ? error.message : 'Unable to commit booking.',
        },
      }))
    }
  }

  const openDockLoad = ({ driverId, eventId }) => {
    const day = driverDays.find((item) => item.driverId === driverId)
    const event = day?.timeline?.find((item) => item.id === eventId)
    const liveState = liveDriverStates[driverId] ?? null

    if (
      !event
      || event.kind !== 'freight-stop'
      || !['pickup', 'delivery'].includes(event.role)
      || liveState?.executionPhase !== 'facility-dock-assigned'
      || liveState.currentEventId !== eventId
    ) {
      return
    }

    setFocusedTask({
      type: event.role === 'delivery' ? 'dock-delivery' : 'dock-load',
      driverId,
      eventId,
    })
  }

  const commitDockLoad = ({ driverId, eventId, loadPlan }) => {
    const day = driverDays.find((item) => item.driverId === driverId)
    const event = day?.timeline?.find((item) => item.id === eventId)
    if (!event || event.kind !== 'freight-stop' || event.role !== 'pickup') return

    const operation = commitPickupOperation({
      driverId,
      event,
      loadPlan,
      currentAbsoluteMinutes: simulationAbsoluteMinutes(simulationClock),
    })

    setFacilityOperations((current) => ({
      ...current,
      [operation.key]: operation,
    }))
    setFocusedTask(null)
  }

  const commitDockDelivery = ({
    driverId,
    eventId,
    trailerState,
    unloadPlan,
  }) => {
    const day = driverDays.find((item) => item.driverId === driverId)
    const event = day?.timeline?.find((item) => item.id === eventId)
    if (!event || event.kind !== 'freight-stop' || event.role !== 'delivery') return

    const operation = commitDeliveryOperation({
      driverId,
      event,
      trailerState,
      unloadPlan,
      currentAbsoluteMinutes: simulationAbsoluteMinutes(simulationClock),
    })
    const podDocumentId = deliveryPodId(event.id)
    const committedOperation = {
      ...operation,
      podDocumentId,
    }
    const podRecord = createDeliveryPodRecord({
      driverId,
      event,
      deliveryOperation: committedOperation,
    })

    setFacilityOperations((current) => ({
      ...current,
      [committedOperation.key]: committedOperation,
    }))
    setDocumentRecords((current) => ({
      ...current,
      [podRecord.id]: podRecord,
    }))
    setFocusedTask(null)
  }

  return (
    <DesktopShell
      drivers={drivers}
      driverDays={driverDays}
      marketLanes={marketLanes}
      allMarketLanes={freightMarket}
      locations={locations}
      bookingRecords={bookingRecords}
      facilityOperations={facilityOperations}
      documentRecords={documentRecords}
      operationalDocuments={operationalDocuments}
      operationalLoadFiles={operationalLoadFiles}
      documentAttentionCount={documentAttentionCount}
      emailMessages={operationalEmails}
      emailUnreadCount={emailUnreadCount}
      selectedEmailId={selectedEmailId}
      selectedDocumentId={selectedDocumentId}
      selection={selection}
      activeApp={activeApp}
      focusedTask={focusedTask}
      planningDriverId={planningDriverId}
      planningFeedback={planningFeedback}
      pendingPlanningPlace={pendingPlanningPlace}
      planningPlacePreviewDay={planningPlacePreviewDay}
      operationsInspectorHidden={operationsInspectorHidden}
      freightRoutePreview={freightRoutePreview}
      freightCandidateDriverId={freightCandidateDriverId}
      simulationClock={simulationClock}
      liveDriverStates={liveDriverStates}
      onToggleApp={toggleApp}
      onCloseActiveApp={closeActiveApp}
      onCloseFocusedTask={() => setFocusedTask(null)}
      onRoutePreviewChange={setFreightRoutePreview}
      onFreightCandidateDriverChange={setFreightCandidateDriverId}
      onSimulationModeChange={setSimulationClockMode}
      onRequestRateCon={requestRateCon}
      onOpenDocumentsForRateCon={openDocumentsForRateCon}
      onSelectEmail={selectEmail}
      onOpenDocuments={openDocuments}
      onMoveDocumentToDesk={moveDocumentToDesk}
      onInspectDocument={inspectDocument}
      onSelectDocument={setSelectedDocumentId}
      onFileDocument={fileDocument}
      onUnfileDocument={unfileDocument}
      onSubmitLoadFile={submitLoadFile}
      onRequestRateConCorrection={requestRateConCorrection}
      onConfirmBooking={confirmBooking}
      onRequestPodCorrection={requestPodCorrection}
      onAcceptPod={acceptPod}
      onOpenDockLoad={openDockLoad}
      onCommitDockLoad={commitDockLoad}
      onCommitDockDelivery={commitDockDelivery}
      onStartDriverPlanning={startDriverPlanning}
      onStopDriverPlanning={stopDriverPlanning}
      onMoveDriverPlanEvent={moveDriverPlanEvent}
      onPreviewDriverPlanningPlace={previewDriverPlanningPlace}
      onCancelDriverPlanningPlace={cancelDriverPlanningPlace}
      onConfirmDriverPlanningPlace={confirmDriverPlanningPlace}
      onSendDriverSchedule={sendDriverSchedule}
      onCloseOperationsInspector={closeOperationsInspector}
      onSelectSubject={selectSubject}
    />
  )
}
