import { useEffect, useMemo, useState } from 'react'
import {
  BOOKING_STATUS,
  bookingStatusLabel,
} from '../../domain/booking/bookingLifecycle.js'
import { getDriverIdentity } from '../../domain/drivers/driverIdentity.js'
import { evaluateFreightLane } from '../../domain/freight/freightFit.js'
import { formatClock } from '../../domain/manifest/driverDayModel.js'
import { isSelection, SELECTION_TYPES } from '../../domain/selection/selectionModel.js'
import { calculateRoadRoute } from '../../services/roadRouting.js'
import './freightLink.css'

const FIT_FILTERS = ['ALL', 'GOOD', 'TIGHT', 'POOR']

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function formatMiles(value) {
  if (!Number.isFinite(value)) return '—'
  return `${value.toFixed(value >= 100 ? 0 : 1)} mi`
}

function formatMinutes(value) {
  if (!Number.isFinite(value)) return '—'
  if (value < 60) return `${Math.round(value)} min`
  const hours = Math.floor(value / 60)
  const minutes = Math.round(value % 60)
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`
}

function windowLabel(window) {
  return `${formatClock(window.startMinutes)}–${formatClock(window.endMinutes)}`
}

function signalClass(ok) {
  return ok ? 'good' : 'poor'
}

function SignalCard({ label, ok, primary, secondary }) {
  return (
    <div className={`freight-signal ${signalClass(ok)}`}>
      <span>{label}</span>
      <strong>{primary}</strong>
      <small>{secondary}</small>
    </div>
  )
}

function bookingActionLabel(record) {
  switch (record?.status) {
    case BOOKING_STATUS.REQUESTED:
      return 'WAITING FOR RATE CON'
    case BOOKING_STATUS.RATE_CON_READY:
      return record.correctionCount ? 'REVIEW CORRECTED RATE CON' : 'REVIEW RATE CON'
    case BOOKING_STATUS.CORRECTION_REQUESTED:
      return 'WAITING FOR CORRECTION'
    case BOOKING_STATUS.CONFIRMED:
      return 'CONFIRMED'
    default:
      return 'REQUEST RATE CON'
  }
}

function bookingHelper(record, evaluation) {
  if (record?.bookingError) return record.bookingError
  switch (record?.status) {
    case BOOKING_STATUS.REQUESTED:
      return 'Request sent. The broker is returning the Rate Confirmation.'
    case BOOKING_STATUS.RATE_CON_READY:
      return 'Rate Confirmation received. Review the document before committing the freight.'
    case BOOKING_STATUS.CORRECTION_REQUESTED:
      return 'Correction requested. Wait for the revised Rate Confirmation before confirming.'
    case BOOKING_STATUS.CONFIRMED:
      return 'Freight is confirmed and has moved into operational work.'
    default:
      return evaluation?.legal
        ? 'Request the Rate Confirmation before committing this freight.'
        : 'This lane has fit risks. You may still request the Rate Confirmation, but verify the plan carefully.'
  }
}

export default function FreightLinkWorkspace({
  drivers,
  driverDays,
  lanes,
  locations,
  bookingRecords,
  selection,
  candidateDriverId,
  onCandidateDriverChange,
  onRequestRateCon,
  onOpenRateCon,
  onSelectSubject,
  onClose,
  onRoutePreviewChange,
}) {
  const [fitFilter, setFitFilter] = useState('ALL')
  const [routeResult, setRouteResult] = useState(null)

  const candidateDriver = drivers.find((driver) => driver.id === candidateDriverId) ?? null
  const candidateDay = driverDays.find((day) => day.driverId === candidateDriverId) ?? null
  const selectedLane = isSelection(selection, SELECTION_TYPES.LOAD)
    ? lanes.find((lane) => lane.id === selection.id) ?? null
    : null
  const selectedBooking = selectedLane ? bookingRecords[selectedLane.id] ?? null : null
  const bookingLocksDriver = Boolean(
    selectedBooking
    && selectedBooking.status !== BOOKING_STATUS.CONFIRMED,
  )
  const routeKey = selectedLane && candidateDriver ? `${selectedLane.id}:${candidateDriver.id}` : null
  const routeState = routeResult?.key === routeKey
    ? routeResult
    : { status: routeKey ? 'routing' : 'idle', deadhead: null, loaded: null, rejoin: null }

  const evaluations = useMemo(() => {
    if (!candidateDriver || !candidateDay) return []
    return lanes.map((lane) => ({
      lane,
      evaluation: evaluateFreightLane({
        lane,
        driver: candidateDriver,
        day: candidateDay,
        locations,
      }),
    }))
  }, [candidateDay, candidateDriver, lanes, locations])

  const visibleRows = evaluations.filter(({ evaluation }) => (
    fitFilter === 'ALL' || evaluation?.label === fitFilter
  ))

  const selectedEvaluation = selectedLane
    ? evaluations.find(({ lane }) => lane.id === selectedLane.id)?.evaluation ?? null
    : null

  useEffect(() => {
    if (!selectedLane || !selectedEvaluation || !candidateDriver) {
      onRoutePreviewChange(null)
      return undefined
    }

    const pickup = locations[selectedLane.pickupLocationId]
    const delivery = locations[selectedLane.deliveryLocationId]
    const originCoordinates = selectedEvaluation.insertion.originCoordinates
    const nextCoordinates = selectedEvaluation.insertion.nextCoordinates

    if (!pickup?.coordinates || !delivery?.coordinates || !originCoordinates || !nextCoordinates) {
      onRoutePreviewChange({
        lane: selectedLane,
        driver: candidateDriver,
        evaluation: selectedEvaluation,
        pickup,
        delivery,
        deadheadRoute: null,
        loadedRoute: null,
        rejoinRoute: null,
        routeStatus: 'estimate',
      })
      return undefined
    }

    let active = true
    onRoutePreviewChange({
      lane: selectedLane,
      driver: candidateDriver,
      evaluation: selectedEvaluation,
      pickup,
      delivery,
      deadheadRoute: null,
      loadedRoute: null,
      rejoinRoute: null,
      routeStatus: 'routing',
    })

    Promise.all([
      calculateRoadRoute(originCoordinates, pickup.coordinates),
      calculateRoadRoute(pickup.coordinates, delivery.coordinates),
      calculateRoadRoute(delivery.coordinates, nextCoordinates),
    ]).then(([deadhead, loaded, rejoin]) => {
      if (!active) return
      const status = [deadhead, loaded, rejoin].every((route) => route.source === 'road')
        ? 'ready'
        : 'estimate'
      setRouteResult({ key: routeKey, status, deadhead, loaded, rejoin })
      onRoutePreviewChange({
        lane: selectedLane,
        driver: candidateDriver,
        evaluation: selectedEvaluation,
        pickup,
        delivery,
        deadheadRoute: deadhead,
        loadedRoute: loaded,
        rejoinRoute: rejoin,
        routeStatus: status,
      })
    })

    return () => {
      active = false
    }
  }, [candidateDriver, locations, onRoutePreviewChange, routeKey, selectedEvaluation, selectedLane])

  const candidateIdentity = candidateDriver ? getDriverIdentity(candidateDriver.id) : null
  const bookingActionDisabled = (
    selectedBooking?.status === BOOKING_STATUS.REQUESTED
    || selectedBooking?.status === BOOKING_STATUS.CORRECTION_REQUESTED
    || selectedBooking?.status === BOOKING_STATUS.CONFIRMED
  )

  const handleBookingAction = () => {
    if (!selectedLane || !selectedEvaluation || !candidateDriver) return

    if (selectedBooking?.status === BOOKING_STATUS.RATE_CON_READY) {
      onOpenRateCon(selectedLane.id)
      return
    }

    if (!selectedBooking) {
      onRequestRateCon({
        laneId: selectedLane.id,
        driverId: candidateDriver.id,
        evaluation: selectedEvaluation,
      })
    }
  }

  return (
    <div className="freightlink-workspace">
      <aside className="workstation-browser freightlink-browser" aria-label="FreightLink marketplace">
        <header className="workstation-panel-header freightlink-browser-header">
          <div>
            <span>MARKETPLACE</span>
            <strong>FreightLink</strong>
            <small>Shop freight against the selected driver's real day.</small>
          </div>
          <button type="button" onClick={onClose} aria-label="Close FreightLink">×</button>
        </header>

        <label className="freightlink-driver-select">
          <span>{bookingLocksDriver ? 'DRIVER · LOCKED FOR REQUEST' : 'DRIVER'}</span>
          <div style={candidateIdentity ? { '--driver-color': candidateIdentity.color } : undefined}>
            <i />
            <select
              value={candidateDriverId ?? ''}
              disabled={bookingLocksDriver}
              onChange={(event) => onCandidateDriverChange(event.target.value)}
            >
              {drivers.map((driver) => (
                <option value={driver.id} key={driver.id}>{driver.name}</option>
              ))}
            </select>
          </div>
        </label>

        <div className="freightlink-filters" aria-label="Freight fit filters">
          {FIT_FILTERS.map((filter) => {
            const count = filter === 'ALL'
              ? evaluations.length
              : evaluations.filter(({ evaluation }) => evaluation?.label === filter).length
            return (
              <button
                type="button"
                key={filter}
                className={fitFilter === filter ? 'active' : ''}
                onClick={() => setFitFilter(filter)}
              >
                <span>{filter}</span>
                <b>{count}</b>
              </button>
            )
          })}
        </div>

        <div className="lane-list freightlink-browser-list">
          {visibleRows.map(({ lane, evaluation }) => {
            const pickup = locations[lane.pickupLocationId]
            const delivery = locations[lane.deliveryLocationId]
            const selected = selectedLane?.id === lane.id
            const bookingRecord = bookingRecords[lane.id] ?? null
            return (
              <button
                type="button"
                key={lane.id}
                className={`lane-row ${selected ? 'selected' : ''}`}
                onClick={() => onSelectSubject(SELECTION_TYPES.LOAD, lane.id)}
                aria-pressed={selected}
              >
                <div className="lane-route-copy">
                  <span>{lane.laneRef}</span>
                  <strong>{pickup?.label ?? lane.pickupLocationId}</strong>
                  <small>→ {delivery?.label ?? lane.deliveryLocationId}</small>
                </div>
                <div className="lane-browser-meta">
                  <span>{windowLabel(lane.pickupWindow)}</span>
                  <strong>{formatMoney(lane.rate)}</strong>
                </div>
                <div className={`lane-fit-pill ${evaluation?.tone ?? 'poor'}`}>
                  <strong>{evaluation?.label ?? '—'}</strong>
                  <small>{evaluation?.insertion.afterLabel ?? '—'} → {evaluation?.insertion.beforeLabel ?? '—'}</small>
                </div>
                {bookingRecord && (
                  <em className={`booking-state ${bookingRecord.status}`}>
                    {bookingStatusLabel(bookingRecord)}
                  </em>
                )}
              </button>
            )
          })}
        </div>
      </aside>

      {selectedLane && selectedEvaluation && (
        <aside className="workstation-inspector freightlink-inspector" aria-label={`${selectedLane.laneRef} details`}>
          <header className="workstation-panel-header freightlink-inspector-header">
            <div>
              <span>{selectedLane.laneRef}</span>
              <strong>{selectedEvaluation.pickup?.label} → {selectedEvaluation.delivery?.label}</strong>
              <small>{candidateDriver?.name} · {selectedLane.equipment}</small>
            </div>
            <div className={`detail-fit-badge ${selectedEvaluation.tone}`}>
              <span>FIT</span>
              <strong>{selectedEvaluation.label}</strong>
            </div>
          </header>

          <div className="freightlink-inspector-scroll">
            <div className="lane-money-strip">
              <div><span>RATE</span><strong>{formatMoney(selectedLane.rate)}</strong></div>
              <div><span>MILES</span><strong>{formatMiles(routeState.loaded?.distanceMiles ?? selectedEvaluation.loadedMiles)}</strong></div>
              <div><span>RATE / MI</span><strong>{formatMoney(selectedEvaluation.ratePerMile)}</strong></div>
              <div><span>FREIGHT</span><strong>{selectedLane.freight.pallets} PLT · {Math.round(selectedLane.freight.weightLbs / 1000)}K LB</strong></div>
            </div>

            <section className="lane-section">
              <header><span>MANIFEST INSERTION</span><small>{candidateDriver?.name}</small></header>
              <div className="manifest-insertion-card">
                <div><span>AFTER</span><strong>{selectedEvaluation.insertion.afterLabel}</strong><small>{selectedEvaluation.insertion.originLocationLabel}</small></div>
                <b>→</b>
                <div className="inserted-lane"><span>ADD</span><strong>{selectedLane.laneRef}</strong><small>{formatClock(selectedEvaluation.insertion.pickupArrival)} P · {formatClock(selectedEvaluation.insertion.deliveryArrival)} D</small></div>
                <b>→</b>
                <div><span>BEFORE</span><strong>{selectedEvaluation.insertion.beforeLabel}</strong><small>{selectedEvaluation.insertion.nextLocationLabel}</small></div>
              </div>
            </section>

            <section className="lane-section">
              <header><span>ROUTE</span><small>{routeState.status === 'routing' ? 'ROUTING…' : routeState.status === 'ready' ? 'ROAD ROUTE READY' : 'ESTIMATED'}</small></header>
              <div className="route-stats">
                <div><span>DEADHEAD</span><strong>{formatMiles(routeState.deadhead?.distanceMiles ?? selectedEvaluation.route.deadhead.miles)}</strong><small>{formatMinutes(routeState.deadhead?.durationMinutes ?? selectedEvaluation.route.deadhead.minutes)}</small></div>
                <div><span>LOADED</span><strong>{formatMiles(routeState.loaded?.distanceMiles ?? selectedEvaluation.route.loaded.miles)}</strong><small>{formatMinutes(routeState.loaded?.durationMinutes ?? selectedEvaluation.route.loaded.minutes)}</small></div>
                <div><span>PICKUP ETA</span><strong>{formatClock(selectedEvaluation.insertion.pickupArrival)}</strong><small>{selectedEvaluation.appointment.pickupMargin} min margin</small></div>
              </div>
            </section>

            <section className="lane-section">
              <header><span>FIT SIGNALS</span><small>{selectedEvaluation.detail}</small></header>
              <div className="freight-signal-grid">
                <SignalCard
                  label="APPOINTMENTS"
                  ok={selectedEvaluation.appointment.pickupOk && selectedEvaluation.appointment.deliveryOk}
                  primary={selectedEvaluation.appointment.pickupOk && selectedEvaluation.appointment.deliveryOk ? 'WINDOWS HOLD' : 'WINDOW RISK'}
                  secondary={`P ${windowLabel(selectedLane.pickupWindow)} · D ${windowLabel(selectedLane.deliveryWindow)}`}
                />
                <SignalCard
                  label="MANIFEST"
                  ok={selectedEvaluation.schedule.ok}
                  primary={selectedEvaluation.schedule.ok ? `${Math.max(0, selectedEvaluation.schedule.marginMinutes)} MIN SLACK` : `${Math.abs(selectedEvaluation.schedule.marginMinutes)} MIN LATE`}
                  secondary={`${selectedEvaluation.insertion.afterLabel} → lane → ${selectedEvaluation.insertion.beforeLabel}`}
                />
                <SignalCard
                  label="HOS"
                  ok={selectedEvaluation.hos.driveOk && selectedEvaluation.hos.dutyOk}
                  primary={selectedEvaluation.hos.driveOk && selectedEvaluation.hos.dutyOk ? 'WITHIN HOURS' : 'HOS RISK'}
                  secondary={`Drive ${formatMinutes(selectedEvaluation.hos.projectedDriveMinutes)} / ${formatMinutes(selectedEvaluation.hos.driveAvailableMinutes)}`}
                />
                <SignalCard
                  label="CAPACITY"
                  ok={selectedEvaluation.capacity.ok}
                  primary={selectedEvaluation.capacity.ok ? 'TRAILER FITS' : 'OVER CAPACITY'}
                  secondary={`${selectedEvaluation.capacity.palletsAfterPickup}/${selectedEvaluation.capacity.palletsCapacity} plt · ${Math.round(selectedEvaluation.capacity.weightAfterPickupLbs / 1000)}k/${Math.round(selectedEvaluation.capacity.weightCapacityLbs / 1000)}k lb`}
                />
              </div>
            </section>
          </div>

          <footer className="freightlink-footer booking-footer">
            <div>
              <span>{bookingStatusLabel(selectedBooking)}</span>
              <strong>{bookingHelper(selectedBooking, selectedEvaluation)}</strong>
            </div>
            <button
              type="button"
              className={selectedBooking?.status === BOOKING_STATUS.RATE_CON_READY ? 'ready' : ''}
              disabled={bookingActionDisabled}
              onClick={handleBookingAction}
            >
              {bookingActionLabel(selectedBooking)}
            </button>
          </footer>
        </aside>
      )}
    </div>
  )
}
