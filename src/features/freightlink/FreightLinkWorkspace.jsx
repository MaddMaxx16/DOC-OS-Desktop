import { useEffect, useMemo, useState } from 'react'
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

export default function FreightLinkWorkspace({
  drivers,
  driverDays,
  lanes,
  locations,
  selection,
  onSelectSubject,
  onClose,
  onRoutePreviewChange,
}) {
  const [candidateDriverId, setCandidateDriverId] = useState(drivers[0]?.id ?? null)
  const [fitFilter, setFitFilter] = useState('ALL')
  const [routeResult, setRouteResult] = useState(null)

  const candidateDriver = drivers.find((driver) => driver.id === candidateDriverId) ?? null
  const candidateDay = driverDays.find((day) => day.driverId === candidateDriverId) ?? null
  const selectedLane = isSelection(selection, SELECTION_TYPES.LOAD)
    ? lanes.find((lane) => lane.id === selection.id) ?? null
    : null
  const routeKey = selectedLane && driver ? `${selectedLane.id}:${driver.id}` : null
  const routeState = routeResult?.key === routeKey
    ? routeResult
    : { status: routeKey ? 'routing' : 'idle', deadhead: null, loaded: null }

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
      setRouteState({ status: 'idle', deadhead: null, loaded: null })
      onRoutePreviewChange(null)
      return undefined
    }

    const pickup = locations[selectedLane.pickupLocationId]
    const delivery = locations[selectedLane.deliveryLocationId]
    const originCoordinates = selectedEvaluation.insertion.originCoordinates

    if (!pickup?.coordinates || !delivery?.coordinates || !originCoordinates) {
      setRouteState({ status: 'estimate', deadhead: null, loaded: null })
      onRoutePreviewChange({
        lane: selectedLane,
        driver: candidateDriver,
        evaluation: selectedEvaluation,
        pickup,
        delivery,
        deadheadRoute: null,
        loadedRoute: null,
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
      routeStatus: 'routing',
    })

    Promise.all([
      calculateRoadRoute(originCoordinates, pickup.coordinates),
      calculateRoadRoute(pickup.coordinates, delivery.coordinates),
    ]).then(([deadhead, loaded]) => {
      if (!active) return
      const status = deadhead.source === 'road' || loaded.source === 'road' ? 'ready' : 'estimate'
      setRouteResult({ key: routeKey, status, deadhead, loaded })
      onRoutePreviewChange({
        lane: selectedLane,
        driver: candidateDriver,
        evaluation: selectedEvaluation,
        pickup,
        delivery,
        deadheadRoute: deadhead,
        loadedRoute: loaded,
        routeStatus: status,
      })
    })

    return () => {
      active = false
    }
  }, [candidateDriver, locations, onRoutePreviewChange, selectedEvaluation, selectedLane])

  const candidateIdentity = candidateDriver ? getDriverIdentity(candidateDriver.id) : null

  return (
    <section className="freightlink-workspace" aria-label="FreightLink desktop">
      <header className="freightlink-header">
        <div className="freightlink-title">
          <span>MARKETPLACE</span>
          <strong>FreightLink</strong>
          <small>Compare lanes against the actual driver day before you commit.</small>
        </div>

        <label className="freightlink-driver-select">
          <span>DRIVER</span>
          <div style={candidateIdentity ? { '--driver-color': candidateIdentity.color } : undefined}>
            <i />
            <select value={candidateDriverId ?? ''} onChange={(event) => setCandidateDriverId(event.target.value)}>
              {drivers.map((driver) => (
                <option value={driver.id} key={driver.id}>{driver.name}</option>
              ))}
            </select>
          </div>
        </label>

        <button type="button" className="freightlink-close" onClick={onClose} aria-label="Close FreightLink">×</button>
      </header>

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

      <div className="freightlink-body">
        <div className="lane-board">
          <div className="lane-board-head">
            <span>LANE</span>
            <span>PICKUP</span>
            <span>RATE</span>
            <span>FIT</span>
          </div>

          <div className="lane-list">
            {visibleRows.map(({ lane, evaluation }) => {
              const pickup = locations[lane.pickupLocationId]
              const delivery = locations[lane.deliveryLocationId]
              const selected = selectedLane?.id === lane.id
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
                  <div className="lane-pickup-copy">
                    <strong>{windowLabel(lane.pickupWindow)}</strong>
                    <small>{lane.freight.pallets} plt · {Math.round(lane.freight.weightLbs / 1000)}k lb</small>
                  </div>
                  <div className="lane-rate-copy">
                    <strong>{formatMoney(lane.rate)}</strong>
                    <small>{formatMoney(evaluation?.ratePerMile ?? 0)}/mi</small>
                  </div>
                  <div className={`lane-fit-pill ${evaluation?.tone ?? 'poor'}`}>
                    <strong>{evaluation?.label ?? '—'}</strong>
                    <small>{evaluation?.insertion.afterLabel ?? '—'} → {evaluation?.insertion.beforeLabel ?? '—'}</small>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="lane-detail-panel">
          {!selectedLane || !selectedEvaluation ? (
            <div className="lane-detail-empty">
              <span>LANE PREVIEW</span>
              <strong>Select freight from the board.</strong>
              <p>The lane will stay beside the map so you can see where the freight sits relative to the selected driver's existing day.</p>
            </div>
          ) : (
            <>
              <div className="lane-detail-hero">
                <div>
                  <span>{selectedLane.laneRef}</span>
                  <strong>{selectedEvaluation.pickup?.label} → {selectedEvaluation.delivery?.label}</strong>
                  <small>{selectedLane.equipment}</small>
                </div>
                <div className={`detail-fit-badge ${selectedEvaluation.tone}`}>
                  <span>DRIVER FIT</span>
                  <strong>{selectedEvaluation.label}</strong>
                </div>
              </div>

              <div className="lane-money-strip">
                <div><span>RATE</span><strong>{formatMoney(selectedLane.rate)}</strong></div>
                <div><span>EST. MILES</span><strong>{formatMiles(routeState.loaded?.distanceMiles ?? selectedEvaluation.loadedMiles)}</strong></div>
                <div><span>RATE / MI</span><strong>{formatMoney(selectedEvaluation.ratePerMile)}</strong></div>
                <div><span>FREIGHT</span><strong>{selectedLane.freight.pallets} PLT · {Math.round(selectedLane.freight.weightLbs / 1000)}K LB</strong></div>
              </div>

              <section className="lane-section">
                <header><span>MANIFEST INSERTION</span><small>{candidateDriver?.name}</small></header>
                <div className="manifest-insertion-card">
                  <div><span>AFTER</span><strong>{selectedEvaluation.insertion.afterLabel}</strong><small>{selectedEvaluation.insertion.originLocationLabel}</small></div>
                  <b>→</b>
                  <div className="inserted-lane"><span>ADD LANE</span><strong>{selectedLane.laneRef}</strong><small>{formatClock(selectedEvaluation.insertion.pickupArrival)} pickup · {formatClock(selectedEvaluation.insertion.deliveryArrival)} delivery</small></div>
                  <b>→</b>
                  <div><span>BEFORE</span><strong>{selectedEvaluation.insertion.beforeLabel}</strong><small>{selectedEvaluation.insertion.nextLocationLabel}</small></div>
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

              <section className="lane-section">
                <header><span>MAP ROUTE</span><small>{routeState.status === 'routing' ? 'ROUTING…' : routeState.status === 'ready' ? 'ROAD ROUTE READY' : 'ESTIMATED ROUTE'}</small></header>
                <div className="route-stats">
                  <div><span>DEADHEAD</span><strong>{formatMiles(routeState.deadhead?.distanceMiles ?? selectedEvaluation.route.deadhead.miles)}</strong><small>{formatMinutes(routeState.deadhead?.durationMinutes ?? selectedEvaluation.route.deadhead.minutes)}</small></div>
                  <div><span>LOADED</span><strong>{formatMiles(routeState.loaded?.distanceMiles ?? selectedEvaluation.route.loaded.miles)}</strong><small>{formatMinutes(routeState.loaded?.durationMinutes ?? selectedEvaluation.route.loaded.minutes)}</small></div>
                  <div><span>PICKUP ETA</span><strong>{formatClock(selectedEvaluation.insertion.pickupArrival)}</strong><small>{selectedEvaluation.appointment.pickupMargin} min window margin</small></div>
                </div>
              </section>

              <footer className="freightlink-footer">
                <div>
                  <span>V2.4 EVALUATION ONLY</span>
                  <strong>{selectedEvaluation.detail}</strong>
                </div>
                <button type="button" disabled>BOOKING + RATE CON · V2.5</button>
              </footer>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}
