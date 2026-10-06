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

function TrailerFreightPiece({
  freight,
  placement,
  board,
  currentStop,
  focusedBlocked,
  focusedBlocker,
  dragging,
  active,
  doorsOpening,
  onDragStart,
  onDragEnd,
  onActivate,
}) {
  const shape = rotateFreightShape(freight.shape, placement.rotation ?? 0)
  const bounds = shapeBounds(shape)
  const anchor = boardPosition(board, placement.anchorCell)
  const target = sameLoad(freight, currentStop)

  return (
    <div
      draggable={!doorsOpening}
      role="button"
      tabIndex={0}
      className={[
        'loaded-freight-piece',
        'delivery-freight-piece',
        cargoClass(freight),
        handlingClass(freight),
        target ? 'delivery-target' : 'delivery-other',
        focusedBlocked ? 'delivery-focus-blocked' : '',
        focusedBlocker ? 'delivery-focus-blocker' : '',
        dragging ? 'delivery-dragging' : '',
        active ? 'delivery-active-piece' : '',
      ].filter(Boolean).join(' ')}
      style={{
        gridColumn: `${anchor.column} / span ${bounds.width}`,
        gridRow: `${anchor.row} / span ${bounds.height}`,
        '--piece-columns': bounds.width,
        '--piece-rows': bounds.height,
      }}
      onDragStart={(dragEvent) => onDragStart(dragEvent, freight.id, 'trailer')}
      onDragEnd={onDragEnd}
      onClick={() => onActivate(freight.id, 'trailer')}
      onKeyDown={(keyboardEvent) => {
        if (!['Enter', ' '].includes(keyboardEvent.key)) return
        keyboardEvent.preventDefault()
        onActivate(freight.id, 'trailer')
      }}
      title={`${freight.loadRef} · ${freight.label} · ${freight.handlingLabel}`}
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

function ReceivedFreightToken({ freight }) {
  return (
    <article className={[
      'delivery-zone-freight',
      cargoClass(freight),
      handlingClass(freight),
    ].join(' ')}>
      <div aria-hidden="true"><i /><i /><i /></div>
      <span>
        <strong>{freight.unitCode}</strong>
        <small>{freight.handlingLabel}</small>
      </span>
    </article>
  )
}

function FacilityZone({
  phase,
  currentPhase,
  receivedFreight,
  dragOver,
  activeFreightId,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
}) {
  const complete = phase.complete
  const current = currentPhase?.id === phase.id
  const locked = !complete && !current

  return (
    <section
      data-delivery-zone={phase.zoneId}
      className={[
        'delivery-facility-zone',
        `zone-${phase.zoneId}`,
        current ? 'current' : '',
        complete ? 'complete' : '',
        locked ? 'locked' : '',
        dragOver ? 'drag-over' : '',
        activeFreightId ? 'accepting-selection' : '',
      ].filter(Boolean).join(' ')}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
    >
      <header>
        <div>
          <span>{complete ? 'COMPLETE' : current ? 'CURRENT PHASE' : 'WAITING'}</span>
          <strong>{phase.zoneLabel}</strong>
        </div>
        <b>{phase.receivedCount}/{phase.totalCount}</b>
      </header>

      <div className="delivery-zone-floor">
        {receivedFreight.length > 0 ? (
          <div className="delivery-zone-freight-grid">
            {receivedFreight.map((freight) => (
              <ReceivedFreightToken key={freight.id} freight={freight} />
            ))}
          </div>
        ) : (
          <div className="delivery-zone-empty">
            <i aria-hidden="true">{current ? '↓' : complete ? '✓' : '·'}</i>
            <span>
              {current
                ? `Move ${phase.label.toLowerCase()} here`
                : locked
                  ? 'Facility phase not open'
                  : 'Receiving complete'}
            </span>
          </div>
        )}
      </div>
    </section>
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
  const [receivingZoneByFreightId, setReceivingZoneByFreightId] = useState({})
  const [dragFreightId, setDragFreightId] = useState(null)
  const [dragSource, setDragSource] = useState(null)
  const [dragOverZone, setDragOverZone] = useState(null)
  const [activeFreightId, setActiveFreightId] = useState(null)
  const [activeSource, setActiveSource] = useState(null)
  const [blockedFocusId, setBlockedFocusId] = useState(null)
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
      receivingZoneByFreightId,
    }),
    [
      board,
      driverDay,
      event,
      receivingZoneByFreightId,
      temporaryStagedFreightIds,
      trailerState.freight,
      trailerState.placements,
      unloadedFreightIds,
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
  const protocol = evaluation.receivingProtocol
  const currentPhase = protocol.currentPhase
  const phaseIndexByFreightId = protocol.phaseIndexByFreightId ?? {}
  const currentPhaseIndex = currentPhase?.phaseIndex ?? null

  const currentStopFreight = trailerState.freight
    .filter((freight) => sameLoad(freight, event))
  const stagedTemporarily = temporaryStagedFreightIds
    .filter((freightId) => !unloaded.has(freightId))
    .map((freightId) => freightById.get(freightId))
    .filter(Boolean)
  const expectedWeight = currentStopFreight
    .reduce((sum, freight) => sum + Number(freight.weightLbs ?? 0), 0)
  const remainingCount = Math.max(0, evaluation.actualCount - evaluation.unloadedCount)

  const receivedByZone = useMemo(() => {
    const map = new Map()
    for (const freightId of unloadedFreightIds) {
      const zoneId = receivingZoneByFreightId[freightId]
      const freight = freightById.get(freightId)
      if (!zoneId || !freight) continue
      if (!map.has(zoneId)) map.set(zoneId, [])
      map.get(zoneId).push(freight)
    }
    return map
  }, [freightById, receivingZoneByFreightId, unloadedFreightIds])

  const describeFreight = (freightId) => {
    const freight = freightById.get(freightId)
    return freight
      ? `${freight.loadRef} ${freight.label}`
      : 'freight'
  }

  const activateFreight = (freightId, source) => {
    if (doorsOpening) return
    setActiveFreightId(freightId)
    setActiveSource(source)
    setNotice(null)
  }

  const startDrag = (dragEvent, freightId, source) => {
    if (doorsOpening) {
      dragEvent.preventDefault()
      return
    }

    setDragFreightId(freightId)
    setDragSource(source)
    setActiveFreightId(freightId)
    setActiveSource(source)
    setDragOverZone(null)
    dragEvent.dataTransfer.setData('text/plain', freightId)
    dragEvent.dataTransfer.setData('application/x-doc-source', source)
    dragEvent.dataTransfer.effectAllowed = 'move'

    const dragVisual = dragEvent.currentTarget.querySelector(
      '.loaded-freight-shape, .delivery-staged-freight-visual',
    )
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
    setDragSource(null)
    setDragOverZone(null)
  }

  const dropPayload = (dropEvent) => ({
    freightId: dropEvent.dataTransfer.getData('text/plain') || dragFreightId,
    source: dropEvent.dataTransfer.getData('application/x-doc-source')
      || dragSource
      || activeSource,
  })

  const phaseForFreight = (freightId) => {
    const phaseIndex = phaseIndexByFreightId[freightId]
    return Number.isInteger(phaseIndex)
      ? protocol.phases[phaseIndex]
      : null
  }

  const showAccessBlocked = (freightId) => {
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
  }

  const sendToReceivingZone = (freightId, zoneId, source = 'trailer') => {
    const freight = freightById.get(freightId)
    if (!freight || unloaded.has(freightId)) return

    if (!sameLoad(freight, event)) {
      setBlockedFocusId(null)
      setNotice({
        tone: 'wrong',
        title: 'NOT THIS RECEIVER',
        detail: `${freight.loadRef} stays onboard for a later delivery.`,
      })
      return
    }

    const freightPhase = phaseForFreight(freightId)
    if (!currentPhase || !freightPhase) return

    if (freightPhase.id !== currentPhase.id) {
      setNotice({
        tone: 'protocol',
        title: `${currentPhase.label} FIRST`,
        detail: `${freight.handlingLabel} belongs to ${freightPhase.zoneLabel}. That facility phase is not open yet.`,
      })
      return
    }

    if (zoneId !== freightPhase.zoneId) {
      setNotice({
        tone: 'wrong',
        title: 'WRONG RECEIVING AREA',
        detail: `${freight.handlingLabel} goes to ${freightPhase.zoneLabel} during this phase.`,
      })
      return
    }

    if (source === 'trailer' && !currentlyAccessible.has(freightId)) {
      showAccessBlocked(freightId)
      return
    }

    setUnloadedFreightIds((current) => [...current, freightId])
    setReceivingZoneByFreightId((current) => ({
      ...current,
      [freightId]: zoneId,
    }))
    setBlockedFocusId(null)
    setActiveFreightId(null)
    setActiveSource(null)
    setNotice({
      tone: 'received',
      title: `${freightPhase.zoneLabel} RECEIVED`,
      detail: `${freight.loadRef} ${freight.label} cleared the current receiving step.`,
    })
  }

  const stageTemporarily = (freightId, source = 'trailer') => {
    const freight = freightById.get(freightId)
    if (
      !freight
      || unloaded.has(freightId)
      || temporary.has(freightId)
      || source === 'staging'
    ) return

    const freightPhase = sameLoad(freight, event)
      ? phaseForFreight(freightId)
      : null
    const laterFacilityPhase = (
      freightPhase
      && currentPhaseIndex != null
      && freightPhase.phaseIndex > currentPhaseIndex
    )
    const physicallyBlocking = (
      currentImmediateBlockers.has(freightId)
      || focusedBlockerIds.has(freightId)
    )

    if (!physicallyBlocking) {
      setNotice({
        tone: 'warning',
        title: 'NO REHANDLE NEEDED',
        detail: `${freight.loadRef} is not blocking the current receiving phase. Leave it onboard.`,
      })
      return
    }

    if (sameLoad(freight, event) && !laterFacilityPhase) {
      setNotice({
        tone: 'protocol',
        title: 'PROCESS THIS FREIGHT',
        detail: `${freight.handlingLabel} belongs to the current phase. Send it to ${freightPhase?.zoneLabel ?? 'receiving'} instead.`,
      })
      return
    }

    setTemporaryStagedFreightIds((current) => [...current, freightId])
    setBlockedFocusId(null)
    setActiveFreightId(null)
    setActiveSource(null)
    setNotice({
      tone: 'warning',
      title: 'MOVED TO TEMP STAGING',
      detail: `${freight.loadRef} ${freight.label} is off the trailer temporarily · +3 min handling.`,
    })
  }

  const returnToTrailer = (freightId) => {
    setTemporaryStagedFreightIds((current) => (
      current.filter((id) => id !== freightId)
    ))
    setActiveFreightId(null)
    setActiveSource(null)
    setNotice({
      tone: 'neutral',
      title: 'RETURNED TO TRAILER',
      detail: `${describeFreight(freightId)} restored to its original position.`,
    })
  }

  const handleZoneDrop = (dropEvent, zoneId) => {
    dropEvent.preventDefault()
    const { freightId, source } = dropPayload(dropEvent)
    sendToReceivingZone(freightId, zoneId, source)
    endDrag()
  }

  const handleStagingDrop = (dropEvent) => {
    dropEvent.preventDefault()
    const { freightId, source } = dropPayload(dropEvent)
    stageTemporarily(freightId, source)
    endDrag()
  }

  const handleZoneClick = (zoneId) => {
    if (!activeFreightId) return
    sendToReceivingZone(activeFreightId, zoneId, activeSource ?? 'trailer')
  }

  const handleStagingClick = () => {
    if (!activeFreightId) return
    stageTemporarily(activeFreightId, activeSource ?? 'trailer')
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
    <div className="delivery-workspace receiving-protocol">
      <section className="delivery-operation-stage">
        <header className="delivery-heading">
          <div>
            <span>DOCK & DELIVERY</span>
            <strong>{event.loadRef} · {event.locationLabel}</strong>
          </div>
          <small>
            Work the trailer physically · follow this receiver's dock protocol.
          </small>
        </header>

        <div className="delivery-dock-scene">
          <section className="delivery-receiving-floor">
            <header className="delivery-floor-header">
              <div>
                <span>FACILITY FLOOR</span>
                <strong>{event.locationLabel}</strong>
              </div>
              <b>DOCK {dockNumberForDelivery(event)}</b>
            </header>

            <div className="delivery-zone-grid">
              {protocol.phases.map((phase) => (
                <FacilityZone
                  key={phase.id}
                  phase={phase}
                  currentPhase={currentPhase}
                  receivedFreight={receivedByZone.get(phase.zoneId) ?? []}
                  dragOver={dragOverZone === phase.zoneId}
                  activeFreightId={activeFreightId}
                  onDragOver={(dragEvent) => {
                    dragEvent.preventDefault()
                    dragEvent.dataTransfer.dropEffect = 'move'
                    setDragOverZone(phase.zoneId)
                  }}
                  onDragLeave={() => setDragOverZone((zone) => (
                    zone === phase.zoneId ? null : zone
                  ))}
                  onDrop={(dropEvent) => handleZoneDrop(dropEvent, phase.zoneId)}
                  onClick={() => handleZoneClick(phase.zoneId)}
                />
              ))}
            </div>

            <section
              data-delivery-zone="staging"
              className={[
                'delivery-floor-staging',
                dragOverZone === 'staging' ? 'drag-over' : '',
                blockedFocusId ? 'recommended' : '',
                activeFreightId ? 'accepting-selection' : '',
              ].filter(Boolean).join(' ')}
              onDragOver={(dragEvent) => {
                dragEvent.preventDefault()
                dragEvent.dataTransfer.dropEffect = 'move'
                setDragOverZone('staging')
              }}
              onDragLeave={() => setDragOverZone((zone) => (
                zone === 'staging' ? null : zone
              ))}
              onDrop={handleStagingDrop}
              onClick={handleStagingClick}
            >
              <header>
                <div>
                  <span>DOCK APRON</span>
                  <strong>TEMP STAGING</strong>
                </div>
                <b>{stagedTemporarily.length} OUT</b>
              </header>

              {stagedTemporarily.length === 0 ? (
                <div className="delivery-staging-empty">
                  <strong>REHANDLE ONLY WHEN ACCESS REQUIRES IT</strong>
                  <span>Move a physical blocker here, then continue the receiver sequence.</span>
                </div>
              ) : (
                <div className="delivery-staged-freight-grid">
                  {stagedTemporarily.map((freight) => (
                    <article
                      key={freight.id}
                      draggable
                      role="button"
                      tabIndex={0}
                      className={[
                        'delivery-staged-freight',
                        activeFreightId === freight.id ? 'active' : '',
                      ].filter(Boolean).join(' ')}
                      onDragStart={(dragEvent) => startDrag(
                        dragEvent,
                        freight.id,
                        'staging',
                      )}
                      onDragEnd={endDrag}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation()
                        activateFreight(freight.id, 'staging')
                      }}
                      onKeyDown={(keyboardEvent) => {
                        if (!['Enter', ' '].includes(keyboardEvent.key)) return
                        keyboardEvent.preventDefault()
                        activateFreight(freight.id, 'staging')
                      }}
                    >
                      <div className="delivery-staged-freight-visual" aria-hidden="true">
                        <i /><i /><i />
                      </div>
                      <span>
                        <strong>{freight.loadRef} · {freight.unitCode}</strong>
                        <small>{freight.handlingLabel}</small>
                      </span>
                      <button
                        type="button"
                        onClick={(buttonEvent) => {
                          buttonEvent.stopPropagation()
                          returnToTrailer(freight.id)
                        }}
                      >
                        RETURN
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>

          <div className="delivery-dock-threshold" aria-hidden="true">
            <span>DOCK {dockNumberForDelivery(event)}</span>
            <i>⇄</i>
            <small>REAR DOORS</small>
          </div>

          <section className="delivery-trailer-assembly">
            <header>
              <span>53' DRY VAN</span>
              <strong>PHYSICAL TRAILER</strong>
              <small>{trailerState.freight.length - unloadedFreightIds.length - temporaryStagedFreightIds.filter((id) => !unloaded.has(id)).length} units onboard</small>
            </header>

            <div className="delivery-trailer-body">
              <div className="delivery-trailer-nose" aria-hidden="true">
                <span>NOSE</span>
              </div>
              <div className="delivery-trailer-wall left" aria-hidden="true" />
              <div className="delivery-trailer-wall right" aria-hidden="true" />

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
                    <TrailerFreightPiece
                      key={freightId}
                      freight={freight}
                      placement={placement}
                      board={board}
                      currentStop={event}
                      focusedBlocked={blockedFocusId === freightId}
                      focusedBlocker={focusedBlockerIds.has(freightId)}
                      dragging={dragFreightId === freightId}
                      active={activeFreightId === freightId}
                      doorsOpening={doorsOpening}
                      onDragStart={startDrag}
                      onDragEnd={endDrag}
                      onActivate={activateFreight}
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

              <div className="delivery-trailer-rear" aria-hidden="true">
                <i />
                <span>{doorsOpening ? 'OPENING DOORS…' : 'DOORS OPEN'}</span>
                <i />
              </div>
              <div className="delivery-trailer-wheels" aria-hidden="true">
                <i /><i /><i /><i />
              </div>
            </div>

            <footer>
              <span>FRONT / NOSE ↑</span>
              <strong>{board.capacityPallets} floor positions</strong>
              <span>↓ REAR / DOORS</span>
            </footer>
          </section>
        </div>
      </section>

      <aside className="delivery-protocol-panel">
        <section className="delivery-stop-summary protocol">
          <header>
            <span>RECEIVER</span>
            <strong>DOCK {dockNumberForDelivery(event)}</strong>
          </header>
          <div className="delivery-receiver-title">
            <strong>{event.locationLabel}</strong>
            <small>{event.loadRef} · {expectedFreight.length} units · {pounds(expectedWeight)} lb</small>
          </div>
          <div className="delivery-stop-stats physical">
            <p><span>EXPECTED</span><strong>{expectedFreight.length}</strong></p>
            <p><span>RECEIVED</span><strong>{evaluation.unloadedCount}</strong></p>
            <p><span>REHANDLES</span><strong>{evaluation.rehandleUnits}</strong></p>
          </div>
        </section>

        <section className="delivery-protocol-card">
          <header>
            <div>
              <span>FACILITY SOP · GAMEPLAY</span>
              <strong>{protocol.label}</strong>
            </div>
            <b>{protocol.complete ? 'COMPLETE' : 'ACTIVE'}</b>
          </header>

          <div className="delivery-protocol-phases">
            {protocol.phases.map((phase, index) => (
              <article
                key={phase.id}
                className={[
                  phase.complete ? 'complete' : '',
                  currentPhase?.id === phase.id ? 'current' : '',
                ].filter(Boolean).join(' ')}
              >
                <i>{phase.complete ? '✓' : index + 1}</i>
                <div>
                  <strong>{phase.label}</strong>
                  <span>{phase.zoneLabel} · {phase.receivedCount}/{phase.totalCount}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={[
          'delivery-current-phase',
          protocol.complete ? 'complete' : '',
        ].filter(Boolean).join(' ')}>
          {currentPhase ? (
            <>
              <header>
                <span>CURRENT RECEIVING PHASE</span>
                <strong>{currentPhase.label}</strong>
              </header>
              <p>{currentPhase.instruction}</p>
              <div>
                <span>DESTINATION</span>
                <strong>{currentPhase.zoneLabel}</strong>
              </div>
            </>
          ) : (
            <>
              <header>
                <span>FACILITY PROTOCOL</span>
                <strong>ALL PHASES COMPLETE</strong>
              </header>
              <p>All expected freight has cleared the receiver sequence.</p>
            </>
          )}
        </section>

        <section className={[
          'delivery-interaction-status',
          notice?.tone ?? 'neutral',
        ].join(' ')}>
          {notice ? (
            <>
              <strong>{notice.title}</strong>
              <span>{notice.detail}</span>
            </>
          ) : (
            <>
              <strong>
                {activeFreightId
                  ? 'FREIGHT SELECTED'
                  : currentPhase
                    ? 'WORK THE TRAILER'
                    : 'RECEIVER READY'}
              </strong>
              <span>
                {activeFreightId
                  ? `${describeFreight(activeFreightId)} · drag it to the facility floor, or click its destination zone.`
                  : currentPhase
                    ? `${currentPhase.label}: identify an accessible unit, then place it in ${currentPhase.zoneLabel}.`
                    : 'Confirm the completed receiver handoff.'}
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
              ? 'CONFIRMING…'
              : evaluation.ready
                ? 'CONFIRM HANDOFF'
                : `${remainingCount} UNIT${remainingCount === 1 ? '' : 'S'} REMAIN`}
          </strong>
          <small>
            {evaluation.ready
              ? evaluation.rehandleUnits > 0
                ? `Facility protocol complete · ${evaluation.rehandleUnits} rehandle${evaluation.rehandleUnits === 1 ? '' : 's'} recorded`
                : 'Facility protocol complete · clean unload sequence'
              : 'Complete the active facility receiving phase before handoff'}
          </small>
        </button>
      </aside>
    </div>
  )
}
