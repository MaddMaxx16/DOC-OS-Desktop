import { useMemo, useState } from 'react'
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
import { buildDriverDays } from '../domain/manifest/driverDayModel.js'
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
  const [focusedTask, setFocusedTask] = useState(null)

  const driverDays = useMemo(
    () => buildDriverDays(drivers, operationalLoads, operationalDriverPlans, locations),
    [operationalDriverPlans, operationalLoads],
  )

  const marketLanes = useMemo(() => {
    const confirmedLaneIds = new Set(
      Object.values(bookingRecords)
        .filter((record) => record?.status === BOOKING_STATUS.CONFIRMED)
        .map((record) => record.laneId),
    )
    return freightMarket.filter((lane) => !confirmedLaneIds.has(lane.id))
  }, [bookingRecords])

  const selectSubject = (type, id) => {
    setSelection(createSelection(type, id))

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

  const toggleApp = (appId) => {
    if (!['drivers', 'freightlink'].includes(appId)) return

    const opening = activeApp !== appId
    if (appId === 'freightlink' && opening && selection?.type === SELECTION_TYPES.DRIVER) {
      setFreightCandidateDriverId(selection.id)
    }

    if (activeApp === 'freightlink' && appId !== 'freightlink') {
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

  const openRateCon = (laneId) => {
    const record = bookingRecords[laneId]
    if (record?.status !== BOOKING_STATUS.RATE_CON_READY) return
    setFocusedTask({ type: 'rate-confirmation', laneId })
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

  return (
    <DesktopShell
      drivers={drivers}
      driverDays={driverDays}
      marketLanes={marketLanes}
      allMarketLanes={freightMarket}
      locations={locations}
      bookingRecords={bookingRecords}
      selection={selection}
      activeApp={activeApp}
      focusedTask={focusedTask}
      freightRoutePreview={freightRoutePreview}
      freightCandidateDriverId={freightCandidateDriverId}
      onToggleApp={toggleApp}
      onCloseActiveApp={closeActiveApp}
      onCloseFocusedTask={() => setFocusedTask(null)}
      onRoutePreviewChange={setFreightRoutePreview}
      onFreightCandidateDriverChange={setFreightCandidateDriverId}
      onRequestRateCon={requestRateCon}
      onOpenRateCon={openRateCon}
      onRequestRateConCorrection={requestRateConCorrection}
      onConfirmBooking={confirmBooking}
      onSelectSubject={selectSubject}
    />
  )
}
