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
  focusedBlocked,
  focusedBlocker,
  dragging,
  onDragStart,
  onDragEnd,
}) {
  const shape = rotateFreightShape(freight.shape, placement.rotation ?? 0)
  const bounds = shapeBounds(shape)
  const anchor = boardPosition(board, placement.anchorCell)
  const target = sameLoad(freight, currentStop)

  return (
    <div
      draggable
      className={[
        'loaded-freight-piece',
        'delivery-freight-piece',
        cargoClass(freight),
        handlingClass(freight),
        target ? 'delivery-target' : 'delivery-other',
        focusedBlocked ? 'delivery-focus-blocked' : '',
        focusedBlocker ? 'delivery-focus-blocker' : '',
        dragging ? 'delivery-dragging' : '',
      ].filter(Boolean).join(' ')}
      style={{
        gridColumn: `${anchor.column} / span ${bounds.width}`,
        gridRow: `${anchor.row} / span ${bounds.height}`,
        '--piece-columns': bounds.width,
        '--piece-rows': bounds.height,
      }}
      onDragStart={(event) => onDragStart(event, freight.id)}
      onDragEnd={onDragEnd}
      title={
        target
          ? `${freight.loadRef} · ${freight.label} · drag through the rear doors to Receiving`
          : `${freight.loadRef} · ${freight.label} · later-stop freight`
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
      {(focusedBlocked || focusedBlocker) && (
        <span className="delivery-piece-action">
          {focusedBlocked ? 'ACCESS BLOCKED' : 'IN THE WAY'}
        </span>
      )}
    </div>
  )
}

function ReceivedFreightCard({ freight, recent }) {
  return (
    <article
      className={[
        'delivery-received-unit',
        cargoClass(freight),
        handlingClass(freight),
        recent ? 'recent' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="delivery-received-icon" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div>
        <strong>{freight.loadRef} · {freight.label}</strong>
        <span>{freight.handlingLabel} · {pounds(freight.weightLbs)} lb</span>
      </div>
      <b>RECEIVED</b>
    </article>
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
  const freightById = useMemo(
    () => new Map(trailerState.freight.map((freight) => [freight.id, freight])),
    [trailerState.freight],
  )

  const [unloadedFreightIds, setUnloadedFreightIds] = useState([])
  const [temporaryStagedFreightIds, setTemporaryStagedFreightIds] = useState([])
  const [dragFreightId, setDragFreightId] = useState(null)
  const [dragOverZone, setDragOverZone] = useState(null)
  const [blockedFocusId, setBlockedFocusId] = useState(null)
  const [recentlyUnloadedId, setRecentlyUnloadedId] = useState(null)
  const [notice, setNotice] = useState(null)
  const [doorsOpening, setDoorsOpening] = useState(true)
  const [committing, setCommitting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDoorsOpening(false), 720)
    return () => clearTimeout(timer)
  }, [])

  const evaluation = useMemo(
    () => evaluateDeliveryUnloadPlan({
      board,
      driverDay,
      event,
      freight: trailerState.freight,
      placements: trailerState.placements,
      unloadedFreightIds,
      temporaryStagedFreightIds,
    }),
    [
      board,
      driverDay,
      event,
      unloadedFreightIds,
      temporaryStagedFreightIds,
      trailerState.freight,
      trailerState.placements,
    ],
  )

  const unloaded = new Set(unloadedFreightIds)
  const temporary = new Set(temporaryStagedFreightIds)
  const currentlyAccessible = new Set(
    evaluation.access.currentlyAccessibleFreightIds ?? [],
  )
  const currentImmediateBlockers = new Set(
    evaluation.access.immediateBlockingFreightIds ?? [],
  )
  const focusedBlockerIds = new Set(
    blockedFocusId
      ? evaluation.access.immediateBlockerMap?.[blockedFocusId] ?? []
      : [],
  )
  const currentStopFreight = trailerState.freight.filter((freight) => sameLoad(freight, event))
  const unloadedFreight = unloadedFreightIds
    .map((freightId) => freightById.get(freightId))
    .filter(Boolean)
  const stagedTemporarily = temporaryStagedFreightIds
    .map((freightId) => freightById.get(freightId))
    .filter(Boolean)
  const expectedWeight = currentStopFreight
    .reduce((sum, freight) => sum + Number(freight.weightLbs ?? 0), 0)
  const receivedWeight = unloadedFreight
    .reduce((sum, freight) => sum + Number(freight.weightLbs ?? 0), 0)
  const remainingCount = Math.max(0, evaluation.actualCount - evaluation.unloadedCount)

  const describeFreight = (freightId) => {
    const freight = freightById.get(freightId)
    return freight
      ? `${freight.loadRef} ${freight.label}`
      : 'freight'
  }

  const startDrag = (dragEvent, freightId) => {
    setDragFreightId(freightId)
    setDragOverZone(null)
    dragEvent.dataTransfer.setData('text/plain', freightId)
    dragEvent.dataTransfer.effectAllowed = 'move'

    const dragVisual = dragEvent.currentTarget.querySelector('.loaded-freight-shape')
    if (dragVisual) {
      dragEvent.dataTransfer.setDragImage(
        dragVisual,
        dragVisual.offsetWidth / 2,
        dragVisual.offsetHeight / 2,
      )
    }
  }

  const endDrag = () => {
    setDragFreightId(null)
    setDragOverZone(null)
  }

  const freightIdFromDrop = (dropEvent) => (
    dropEvent.dataTransfer.getData('text/plain') || dragFreightId
  )

  const unloadIntoReceiving = (freightId) => {
    const freight = freightById.get(freightId)
    if (!freight || unloaded.has(freightId) || temporary.has(freightId)) return

    if (!sameLoad(freight, event)) {
      setBlockedFocusId(null)
      setNotice({
        tone: 'wrong',
        title: 'NOT THIS RECEIVER',
        detail: `${freight.loadRef} stays onboard for a later delivery.`,
      })
      return
    }

    if (!currentlyAccessible.has(freightId)) {
      const blockerIds = evaluation.access.immediateBlockerMap?.[freightId] ?? []
      const blockerNames = blockerIds.map(describeFreight)
      setBlockedFocusId(freightId)
      setNotice({
        tone: 'blocked',
        title: 'ACCESS BLOCKED',
        detail: blockerNames.length > 0
          ? `${blockerNames.join(' + ')} ${blockerNames.length === 1 ? 'is' : 'are'} closer to the rear doors.`
          : 'Another freight unit must come out first.',
      })
      return
    }

    setUnloadedFreightIds((current) => [...current, freightId])
    setBlockedFocusId(null)
    setRecentlyUnloadedId(freightId)
    setNotice({
      tone: 'received',
      title: 'MOVED TO RECEIVING',
      detail: `${freight.loadRef} ${freight.label} added to the receiver handoff.`,
    })
  }

  const stageTemporarily = (freightId) => {
    const freight = freightById.get(freightId)
    if (!freight || unloaded.has(freightId) || temporary.has(freightId)) return

    if (sameLoad(freight, event)) {
      setNotice({
        tone: 'blocked',
        title: 'DELIVER THIS FREIGHT',
        detail: `${freight.loadRef} belongs at this receiver. Unload it into Receiving instead.`,
      })
      return
    }

    if (!currentImmediateBlockers.has(freightId) && !focusedBlockerIds.has(freightId)) {
      setNotice({
        tone: 'warning',
        title: 'NO REHANDLE NEEDED',
        detail: `${freight.loadRef} is not blocking the current delivery. Leave it onboard.`,
      })
      return
    }

    setTemporaryStagedFreightIds((current) => [...current, freightId])
    setBlockedFocusId(null)
    setNotice({
      tone: 'warning',
      title: 'TEMPORARILY STAGED',
      detail: `${freight.loadRef} ${freight.label} will be reloaded after delivery · +3 min handling.`,
    })
  }

  const returnToTrailer = (freightId) => {
    setTemporaryStagedFreightIds((current) => (
      current.filter((id) => id !== freightId)
    ))
    setBlockedFocusId(null)
    setNotice({
      tone: 'neutral',
      title: 'RETURNED TO TRAILER',
      detail: `${describeFreight(freightId)} restored to its original position.`,
    })
  }

  const handleReceiverDrop = (dropEvent) => {
    dropEvent.preventDefault()
    unloadIntoReceiving(freightIdFromDrop(dropEvent))
    endDrag()
  }

  const handleStagingDrop = (dropEvent) => {
    dropEvent.preventDefault()
    stageTemporarily(freightIdFromDrop(dropEvent))
    endDrag()
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
    <div className="delivery-workspace physical-unload">
      <section className="delivery-trailer-panel">
        <header className="delivery-heading">
          <div>
            <span>DOCK & DELIVERY</span>
            <strong>{event.loadRef} · {event.locationLabel}</strong>
          </div>
          <small>
            Read the trailer · drag {event.loadRef} freight through the rear doors into Receiving.
          </small>
        </header>

        <div className="delivery-trailer-shell">
          <div className="delivery-trailer-meta">
            <span>FRONT / NOSE</span>
            <strong>{board.label}</strong>
            <span>REAR / DOORS</span>
          </div>

          <div
            className={[
              'dock-load-grid',
              'puzzle-board',
              'delivery-trailer-grid',
              dragFreightId ? 'drag-active' : '',
            ].filter(Boolean).join(' ')}
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
              if (temporary.has(freightId) || unloaded.has(freightId)) return null
              const freight = freightById.get(freightId)
              if (!freight) return null

              return (
                <DeliveryFreightPiece
                  key={freightId}
                  freight={freight}
                  placement={placement}
                  board={board}
                  currentStop={event}
                  focusedBlocked={blockedFocusId === freightId}
                  focusedBlocker={focusedBlockerIds.has(freightId)}
                  dragging={dragFreightId === freightId}
                  onDragStart={startDrag}
                  onDragEnd={endDrag}
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
            <strong>{doorsOpening ? 'OPENING…' : 'DRAG FREIGHT OUT ↓'}</strong>
          </div>
        </div>

        <div className="delivery-legend">
          <span><i className="target" /> {event.loadRef} · THIS RECEIVER</span>
          <span><i className="later" /> OTHER LOADS · STAY ONBOARD</span>
          {blockedFocusId && <span><i className="blocker" /> HIGHLIGHTED · BLOCKING ACCESS</span>}
        </div>
      </section>

      <aside className="delivery-receiving-panel">
        <section className="delivery-stop-summary compact">
          <header>
            <span>RECEIVING DOCK</span>
            <strong>DOCK {dockNumberForDelivery(event)}</strong>
          </header>
          <div className="delivery-receiver-title">
            <span>RECEIVER</span>
            <strong>{event.locationLabel}</strong>
            <small>{event.loadRef} · {expectedFreight.length} units · {pounds(expectedWeight)} lb</small>
          </div>
          <div className="delivery-stop-stats physical">
            <p><span>EXPECTED</span><strong>{expectedFreight.length}</strong></p>
            <p><span>RECEIVED</span><strong>{evaluation.unloadedCount}</strong></p>
            <p><span>REHANDLES</span><strong>{evaluation.rehandleUnits}</strong></p>
          </div>
        </section>

        <section
          className={[
            'delivery-receiving-bay',
            dragOverZone === 'receiver' ? 'drag-over' : '',
            evaluation.ready ? 'complete' : '',
          ].filter(Boolean).join(' ')}
          onDragOver={(dragEvent) => {
            dragEvent.preventDefault()
            dragEvent.dataTransfer.dropEffect = 'move'
            setDragOverZone('receiver')
          }}
          onDragLeave={() => setDragOverZone((zone) => zone === 'receiver' ? null : zone)}
          onDrop={handleReceiverDrop}
        >
          <header>
            <div>
              <span>RECEIVING BAY</span>
              <strong>{evaluation.unloadedCount} / {evaluation.actualCount} RECEIVED</strong>
            </div>
            <b>{pounds(receivedWeight)} lb</b>
          </header>

          {unloadedFreight.length === 0 ? (
            <div className="delivery-receiving-empty">
              <i aria-hidden="true">↓</i>
              <strong>DRAG {event.loadRef} FREIGHT HERE</strong>
              <span>Freight must have a clear path to the rear doors.</span>
            </div>
          ) : (
            <div className="delivery-received-grid">
              {unloadedFreight.map((freight) => (
                <ReceivedFreightCard
                  key={freight.id}
                  freight={freight}
                  recent={recentlyUnloadedId === freight.id}
                />
              ))}
            </div>
          )}

          {remainingCount > 0 && unloadedFreight.length > 0 && (
            <footer>
              <span>{remainingCount} unit{remainingCount === 1 ? '' : 's'} still onboard for this receiver</span>
            </footer>
          )}
        </section>

        <section
          className={[
            'delivery-temp-staging',
            'physical',
            dragOverZone === 'staging' ? 'drag-over' : '',
            blockedFocusId ? 'recommended' : '',
          ].filter(Boolean).join(' ')}
          onDragOver={(dragEvent) => {
            dragEvent.preventDefault()
            dragEvent.dataTransfer.dropEffect = 'move'
            setDragOverZone('staging')
          }}
          onDragLeave={() => setDragOverZone((zone) => zone === 'staging' ? null : zone)}
          onDrop={handleStagingDrop}
        >
          <header>
            <span>TEMP STAGING</span>
            <strong>{stagedTemporarily.length > 0 ? `${stagedTemporarily.length} OUT` : 'EMPTY'}</strong>
          </header>

          {stagedTemporarily.length === 0 ? (
            <div className="delivery-staging-empty">
              <strong>REHANDLE ONLY IF NEEDED</strong>
              <span>
                If later-stop freight blocks the delivery, drag that blocker here temporarily.
              </span>
            </div>
          ) : (
            <div className="delivery-staged-units">
              {stagedTemporarily.map((freight) => (
                <button
                  type="button"
                  key={freight.id}
                  onClick={() => returnToTrailer(freight.id)}
                >
                  <div>
                    <strong>{freight.loadRef} · {freight.label}</strong>
                    <span>+3 min handling · reloads after delivery</span>
                  </div>
                  <b>RETURN</b>
                </button>
              ))}
            </div>
          )}
        </section>

        <section
          className={[
            'delivery-interaction-status',
            notice?.tone ?? 'neutral',
          ].join(' ')}
        >
          {notice ? (
            <>
              <strong>{notice.title}</strong>
              <span>{notice.detail}</span>
            </>
          ) : (
            <>
              <strong>{evaluation.unloadedCount === 0 ? 'READ THE TRAILER' : 'KEEP UNLOADING'}</strong>
              <span>
                {evaluation.unloadedCount === 0
                  ? `Find ${event.loadRef} freight and pull an accessible unit toward Receiving.`
                  : `${remainingCount} ${event.loadRef} unit${remainingCount === 1 ? '' : 's'} remain.`}
              </span>
            </>
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
          <span>RECEIVER HANDOFF</span>
          <strong>
            {committing
              ? 'SENDING TO RECEIVER…'
              : evaluation.ready
                ? 'CONFIRM HANDOFF'
                : `RECEIVE ${remainingCount} MORE`}
          </strong>
          <small>
            {evaluation.ready
              ? evaluation.rehandleUnits > 0
                ? `All freight extracted · ${evaluation.rehandleUnits} rehandle${evaluation.rehandleUnits === 1 ? '' : 's'} · warehouse service continues in background`
                : 'All freight extracted · clean access · warehouse service continues in background'
              : 'The handoff unlocks when all expected freight reaches Receiving'}
          </small>
        </button>
      </aside>
    </div>
  )
}
