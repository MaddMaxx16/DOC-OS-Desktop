import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  buildTrailerPuzzleBoard,
  rotateFreightShape,
} from '../../domain/facility/pickupOperation.js'
import {
  buildTrailerStateForDelivery,
  dockNumberForDelivery,
  evaluateDeliveryUnloadPlan,
  expectedFreightForDelivery,
} from '../../domain/facility/deliveryOperation.js'
import '../dock-load/dockLoad.css'
import './deliveryWorkspace.css'

function pounds(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

function shapeBounds(shape = []) {
  if (!shape.length) return { width: 1, height: 1 }
  return {
    width: Math.max(...shape.map(([x]) => x)) + 1,
    height: Math.max(...shape.map(([, y]) => y)) + 1,
  }
}

function boardPosition(board, cellIndex) {
  return {
    column: (cellIndex % board.columns) + 1,
    row: Math.floor(cellIndex / board.columns) + 1,
  }
}

function cargoClass(freight) {
  return `cargo-${freight.cargoType ?? 'wrapped-pallet'}`
}

function handlingClass(freight) {
  return `handling-${String(freight.handlingCode ?? 'standard').toLowerCase().replaceAll('_', '-')}`
}

function sameLoad(freight, event) {
  const freightKey = freight?.loadRef ?? freight?.loadId
  const eventKey = event?.loadRef ?? event?.loadId
  return freightKey != null && eventKey != null && freightKey === eventKey
}

function DeliveryFreightPiece({
  freight,
  placement,
  board,
  currentStop,
  selected,
  blocked,
  blocking,
  onSelect,
  onTemporaryStage,
}) {
  const shape = rotateFreightShape(freight.shape, placement.rotation ?? 0)
  const bounds = shapeBounds(shape)
  const anchor = boardPosition(board, placement.anchorCell)
  const target = sameLoad(freight, currentStop)

  return (
    <div
      role="button"
      tabIndex={0}
      className={[
        'loaded-freight-piece',
        'delivery-freight-piece',
        cargoClass(freight),
        handlingClass(freight),
        target ? 'delivery-target' : 'delivery-other',
        selected ? 'selected-unload' : '',
        blocked ? 'delivery-unload-blocked' : '',
        blocking ? 'delivery-unload-blocker' : '',
      ].filter(Boolean).join(' ')}
      style={{
        gridColumn: `${anchor.column} / span ${bounds.width}`,
        gridRow: `${anchor.row} / span ${bounds.height}`,
        '--piece-columns': bounds.width,
        '--piece-rows': bounds.height,
      }}
      onClick={() => {
        if (target) onSelect(freight.id)
        else if (blocking) onTemporaryStage(freight.id)
      }}
      onKeyDown={(event) => {
        if (!['Enter', ' '].includes(event.key)) return
        event.preventDefault()
        if (target) onSelect(freight.id)
        else if (blocking) onTemporaryStage(freight.id)
      }}
      title={
        target
          ? blocked
            ? `${freight.label} · delivery freight · blocked by cargo closer to rear doors`
            : `${freight.label} · click to ${selected ? 'remove from' : 'add to'} unload plan`
          : blocking
            ? `${freight.label} · later-stop blocker · click to stage temporarily`
            : `${freight.label} · remains onboard for a later stop`
      }
    >
      <div className="loaded-freight-shape">
        {shape.map(([x, y], index) => (
          <i
            key={`${freight.id}:${index}`}
            style={{
              gridColumn: x + 1,
              gridRow: y + 1,
            }}
          />
        ))}
      </div>
      <span className="loaded-freight-label">
        <strong>{freight.loadRef}</strong>
        <span>{freight.handlingLabel}</span>
      </span>
      <span className="delivery-piece-action">
        {target
          ? selected ? 'UNLOAD ✓' : blocked ? 'BLOCKED' : 'UNLOAD'
          : blocking ? 'TEMP STAGE' : 'STAYS'}
      </span>
    </div>
  )
}

export default function DeliveryWorkspace({
  driver,
  driverDay,
  event,
  facilityOperations = {},
  onCommit,
}) {
  const board = useMemo(
    () => buildTrailerPuzzleBoard(driver.equipment),
    [driver.equipment],
  )
  const trailerState = useMemo(
    () => buildTrailerStateForDelivery({
      driverId: driver.id,
      eventId: event.id,
      driverDay,
      facilityOperations,
    }),
    [driver.id, driverDay, event.id, facilityOperations],
  )
  const expectedFreight = useMemo(
    () => expectedFreightForDelivery({ driverDay, event }),
    [driverDay, event],
  )
  const [selectedFreightIds, setSelectedFreightIds] = useState([])
  const [temporaryStagedFreightIds, setTemporaryStagedFreightIds] = useState([])
  const [doorsOpening, setDoorsOpening] = useState(true)
  const [committing, setCommitting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDoorsOpening(false), 720)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setSelectedFreightIds([])
    setTemporaryStagedFreightIds([])
    setCommitting(false)
  }, [event.id])

  const evaluation = useMemo(
    () => evaluateDeliveryUnloadPlan({
      board,
      driverDay,
      event,
      freight: trailerState.freight,
      placements: trailerState.placements,
      selectedFreightIds,
      temporaryStagedFreightIds,
    }),
    [
      board,
      driverDay,
      event,
      selectedFreightIds,
      temporaryStagedFreightIds,
      trailerState.freight,
      trailerState.placements,
    ],
  )

  const selected = new Set(selectedFreightIds)
  const temporary = new Set(temporaryStagedFreightIds)
  const blocked = new Set(evaluation.access.blockedFreightIds)
  const blockers = new Set(evaluation.access.blockingFreightIds)
  const currentStopFreight = trailerState.freight.filter((freight) => sameLoad(freight, event))
  const stagedTemporarily = trailerState.freight.filter((freight) => temporary.has(freight.id))
  const otherOnboard = trailerState.freight.filter((freight) => (
    !sameLoad(freight, event) && !temporary.has(freight.id)
  ))
  const expectedWeight = currentStopFreight
    .reduce((sum, freight) => sum + Number(freight.weightLbs ?? 0), 0)

  const toggleUnload = (freightId) => {
    setSelectedFreightIds((current) => (
      current.includes(freightId)
        ? current.filter((id) => id !== freightId)
        : [...current, freightId]
    ))
  }

  const toggleTemporaryStage = (freightId) => {
    setTemporaryStagedFreightIds((current) => (
      current.includes(freightId)
        ? current.filter((id) => id !== freightId)
        : [...current, freightId]
    ))
  }

  const commit = () => {
    if (!evaluation.ready || committing) return
    setCommitting(true)

    setTimeout(() => {
      onCommit?.({
        driverId: driver.id,
        eventId: event.id,
        trailerState: {
          freight: trailerState.freight.map((freight) => ({ ...freight })),
          placements: { ...trailerState.placements },
          board: { ...board },
        },
        unloadPlan: evaluation,
      })
    }, 520)
  }

  return (
    <div className="delivery-workspace">
      <section className="delivery-trailer-panel">
        <header className="delivery-heading">
          <div>
            <span>DELIVERY UNLOAD PLAN</span>
            <strong>{event.loadRef} · {event.locationLabel}</strong>
          </div>
          <small>Rear doors open · select this stop's freight · temporarily stage blockers only when needed.</small>
        </header>

        <div className="delivery-trailer-shell">
          <div className="delivery-trailer-meta">
            <span>FRONT / NOSE</span>
            <strong>{board.label}</strong>
            <span>REAR / DOORS</span>
          </div>

          <div
            className="dock-load-grid puzzle-board delivery-trailer-grid"
            style={{
              '--board-columns': board.columns,
              '--board-rows': board.rows,
            }}
          >
            {Array.from({ length: board.totalCells }, (_, cellIndex) => {
              const disabled = cellIndex >= board.usableCells
              const position = boardPosition(board, cellIndex)
              return (
                <div
                  key={cellIndex}
                  style={{
                    gridColumn: position.column,
                    gridRow: position.row,
                  }}
                  className={[
                    'trailer-puzzle-cell',
                    disabled ? 'disabled' : '',
                  ].filter(Boolean).join(' ')}
                />
              )
            })}

            {Object.entries(trailerState.placements).map(([freightId, placement]) => {
              if (temporary.has(freightId)) return null
              const freight = trailerState.freight.find((item) => item.id === freightId)
              if (!freight) return null

              return (
                <DeliveryFreightPiece
                  key={freightId}
                  freight={freight}
                  placement={placement}
                  board={board}
                  currentStop={event}
                  selected={selected.has(freightId)}
                  blocked={blocked.has(freightId)}
                  blocking={blockers.has(freightId)}
                  onSelect={toggleUnload}
                  onTemporaryStage={toggleTemporaryStage}
                />
              )
            })}

            <div
              className={[
                'delivery-door-reveal',
                doorsOpening ? 'opening' : 'open',
              ].join(' ')}
              aria-hidden="true"
            >
              <i className="left" />
              <i className="right" />
            </div>
          </div>

          <div className="delivery-rear-label">
            <span>REAR DOORS</span>
            <strong>{doorsOpening ? 'OPENING…' : 'OPEN'}</strong>
          </div>
        </div>

        <div className="delivery-legend">
          <span><i className="target" /> THIS STOP</span>
          <span><i className="selected" /> SELECTED TO UNLOAD</span>
          <span><i className="later" /> LATER STOP</span>
          {blockers.size > 0 && <span><i className="blocker" /> BLOCKING ACCESS</span>}
        </div>
      </section>

      <aside className="delivery-receiving-panel">
        <section className="delivery-stop-summary">
          <header>
            <span>RECEIVING DOCK</span>
            <strong>DOCK {dockNumberForDelivery(event)}</strong>
          </header>
          <div>
            <span>DESTINATION</span>
            <strong>{event.locationLabel}</strong>
          </div>
          <div className="delivery-stop-stats">
            <p><span>EXPECTED</span><strong>{expectedFreight.length}</strong></p>
            <p><span>ON TRAILER</span><strong>{evaluation.actualCount}</strong></p>
            <p><span>SELECTED</span><strong>{evaluation.selectedCount}</strong></p>
            <p><span>BLOCKED</span><strong>{evaluation.access.blockedFreightIds.length}</strong></p>
          </div>
          <div className="delivery-stop-weight">
            <span>DELIVERY WEIGHT</span>
            <strong>{pounds(expectedWeight)} lb</strong>
          </div>
        </section>

        <section className="delivery-plan-list">
          <header>
            <span>UNLOAD PLAN</span>
            <strong>{evaluation.ready ? 'READY' : 'BUILDING'}</strong>
          </header>

          <div className="delivery-plan-units">
            {currentStopFreight.map((freight) => (
              <button
                type="button"
                key={freight.id}
                className={[
                  selected.has(freight.id) ? 'selected' : '',
                  blocked.has(freight.id) ? 'blocked' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => toggleUnload(freight.id)}
              >
                <div>
                  <strong>{freight.label}</strong>
                  <span>{freight.handlingLabel}</span>
                </div>
                <b>
                  {selected.has(freight.id)
                    ? 'UNLOAD'
                    : blocked.has(freight.id)
                      ? 'BLOCKED'
                      : 'SELECT'}
                </b>
              </button>
            ))}
          </div>
        </section>

        {(blockers.size > 0 || stagedTemporarily.length > 0) && (
          <section className="delivery-temp-staging">
            <header>
              <span>TEMPORARY STAGING</span>
              <strong>{stagedTemporarily.length} UNIT{stagedTemporarily.length === 1 ? '' : 'S'}</strong>
            </header>
            <small>Later-stop freight staged here will be reloaded after this delivery. Each unit adds handling time.</small>

            {otherOnboard
              .filter((freight) => blockers.has(freight.id))
              .map((freight) => (
                <button
                  type="button"
                  key={freight.id}
                  onClick={() => toggleTemporaryStage(freight.id)}
                >
                  <strong>{freight.loadRef} · {freight.label}</strong>
                  <span>TEMP STAGE</span>
                </button>
              ))}

            {stagedTemporarily.map((freight) => (
              <button
                type="button"
                key={freight.id}
                className="staged"
                onClick={() => toggleTemporaryStage(freight.id)}
              >
                <strong>{freight.loadRef} · {freight.label}</strong>
                <span>RETURN TO TRAILER</span>
              </button>
            ))}
          </section>
        )}

        <section className="delivery-plan-status">
          <header>
            <span>PLAN STATUS</span>
            <strong>{evaluation.ready ? 'UNLOAD PLAN READY' : 'ACTION REQUIRED'}</strong>
          </header>

          {evaluation.errors.length > 0 ? (
            <div className="delivery-plan-errors">
              {evaluation.errors.map((issue) => (
                <p key={issue.code}>
                  <strong>{issue.code.replaceAll('_', ' ')}</strong>
                  <span>{issue.message}</span>
                </p>
              ))}
            </div>
          ) : (
            <div className="delivery-plan-clear">
              <strong>{evaluation.selectedCount} correct units selected</strong>
              <span>
                {evaluation.rehandleUnits > 0
                  ? `${evaluation.rehandleUnits} temporary rehandle${evaluation.rehandleUnits === 1 ? '' : 's'} · +${evaluation.rehandleUnits * 3} min`
                  : 'Rear-door access is clean · no rehandles'}
              </span>
            </div>
          )}
        </section>

        <button
          type="button"
          className={[
            'delivery-commit-dock',
            evaluation.ready ? 'ready' : '',
            committing ? 'committing' : '',
          ].filter(Boolean).join(' ')}
          disabled={!evaluation.ready || committing}
          onClick={commit}
        >
          <span>RECEIVING DOCK</span>
          <strong>{committing ? 'SENDING UNLOAD PLAN…' : 'COMMIT UNLOAD PLAN'}</strong>
          <small>
            {evaluation.ready
              ? 'Focused Mode ends · unloading continues in background'
              : 'Select the correct freight and clear any access blockers'}
          </small>
        </button>
      </aside>
    </div>
  )
}
