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

function FreightVisual({
  freight,
  shape,
  label = true,
}) {
  return (
    <>
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
      {label && (
        <span className="loaded-freight-label">
          <strong>{freight.loadRef}</strong>
          <span>{freight.handlingLabel}</span>
        </span>
      )}
    </>
  )
}

function TrailerFreightPiece({
  freight,
  placement,
  board,
  currentStop,
  focusedBlocked,
  focusedBlocker,
  lifting,
  active,
  doorsOpening,
  onPointerDown,
  onActivate,
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
        focusedBlocked ? 'delivery-focus-blocked' : '',
        focusedBlocker ? 'delivery-focus-blocker' : '',
        lifting ? 'delivery-lifting' : '',
        active ? 'delivery-active-piece' : '',
      ].filter(Boolean).join(' ')}
      style={{
        gridColumn: `${anchor.column} / span ${bounds.width}`,
        gridRow: `${anchor.row} / span ${bounds.height}`,
        '--piece-columns': bounds.width,
        '--piece-rows': bounds.height,
      }}
      onPointerDown={(pointerEvent) => {
        if (doorsOpening) return
        onPointerDown(pointerEvent, freight.id, 'trailer')
      }}
      onClick={() => onActivate(freight.id, 'trailer')}
      onKeyDown={(keyboardEvent) => {
        if (!['Enter', ' '].includes(keyboardEvent.key)) return
        keyboardEvent.preventDefault()
        onActivate(freight.id, 'trailer')
      }}
      title={`${freight.loadRef} · ${freight.label} · ${freight.handlingLabel}`}
    >
      <FreightVisual freight={freight} shape={shape} />
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

function WarehouseZone({
  phase,
  currentPhase,
  receivedFreight,
  pointerOver,
  selected,
  onClick,
}) {
  const complete = phase.complete
  const current = currentPhase?.id === phase.id
  const locked = !complete && !current

  return (
    <section
      data-delivery-zone={phase.zoneId}
      className={[
        'delivery-warehouse-zone',
        `zone-${phase.zoneId}`,
        current ? 'current' : '',
        complete ? 'complete' : '',
        locked ? 'locked' : '',
        pointerOver ? 'pointer-over' : '',
        selected ? 'selection-target' : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <div className="delivery-zone-sign">
        <span>{complete ? 'CLEARED' : current ? 'ACTIVE' : 'HOLD'}</span>
        <strong>{phase.zoneLabel}</strong>
        <b>{phase.receivedCount}/{phase.totalCount}</b>
      </div>

      <div className="delivery-zone-marking" aria-hidden="true">
        <i /><i /><i />
      </div>

      {receivedFreight.length > 0 && (
        <div className="delivery-zone-freight-grid">
          {receivedFreight.map((freight) => (
            <ReceivedFreightToken key={freight.id} freight={freight} />
          ))}
        </div>
      )}

      {current && receivedFreight.length === 0 && (
        <div className="delivery-zone-current-cue">
          <i>↓</i>
          <span>{phase.label}</span>
        </div>
      )}
    </section>
  )
}

function PointerFreightGhost({
  pointerDrag,
  freight,
}) {
  if (!pointerDrag || !freight) return null

  const shape = rotateFreightShape(
    freight.shape,
    pointerDrag.rotation ?? 0,
  )
  const bounds = shapeBounds(shape)

  return (
    <div
      className={[
        'delivery-pointer-freight',
        cargoClass(freight),
        handlingClass(freight),
        pointerDrag.overZoneId ? 'over-zone' : '',
      ].filter(Boolean).join(' ')}
      style={{
        left: pointerDrag.x - pointerDrag.offsetX,
        top: pointerDrag.y - pointerDrag.offsetY,
        width: pointerDrag.width,
        height: pointerDrag.height,
        '--piece-columns': bounds.width,
        '--piece-rows': bounds.height,
      }}
      aria-hidden="true"
    >
      <FreightVisual freight={freight} shape={shape} />
      <span className="delivery-pointer-caption">
        {pointerDrag.overZoneId
          ? 'RELEASE TO PLACE'
          : 'MOVE TO FACILITY FLOOR'}
      </span>
    </div>
  )
}

function ReturningFreightGhost({
  returnDrag,
  freight,
}) {
  if (!returnDrag || !freight) return null
  const shape = rotateFreightShape(freight.shape, returnDrag.rotation ?? 0)
  const bounds = shapeBounds(shape)

  return (
    <div
      className={[
        'delivery-pointer-freight',
        'returning',
        cargoClass(freight),
        handlingClass(freight),
      ].join(' ')}
      style={{
        '--return-start-x': `${returnDrag.startX}px`,
        '--return-start-y': `${returnDrag.startY}px`,
        '--return-end-x': `${returnDrag.endX}px`,
        '--return-end-y': `${returnDrag.endY}px`,
        width: returnDrag.width,
        height: returnDrag.height,
        '--piece-columns': bounds.width,
        '--piece-rows': bounds.height,
      }}
      aria-hidden="true"
    >
      <FreightVisual freight={freight} shape={shape} />
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
  const freightById = useMemo(
    () => new Map(trailerState.freight.map((freight) => [freight.id, freight])),
    [trailerState.freight],
  )

  const [unloadedFreightIds, setUnloadedFreightIds] = useState([])
  const [temporaryStagedFreightIds, setTemporaryStagedFreightIds] = useState([])
  const [receivingZoneByFreightId, setReceivingZoneByFreightId] = useState({})
  const [pointerDrag, setPointerDrag] = useState(null)
  const [returnDrag, setReturnDrag] = useState(null)
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
  const remainingCount = Math.max(
    0,
    evaluation.actualCount - evaluation.unloadedCount,
  )

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

  const phaseForFreight = (freightId) => {
    const phaseIndex = phaseIndexByFreightId[freightId]
    return Number.isInteger(phaseIndex)
      ? protocol.phases[phaseIndex]
      : null
  }

  const activateFreight = (freightId, source) => {
    if (doorsOpening || pointerDrag) return
    setActiveFreightId(freightId)
    setActiveSource(source)
    setNotice(null)
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
    if (!freight || unloaded.has(freightId)) return false

    if (!sameLoad(freight, event)) {
      setBlockedFocusId(null)
      setNotice({
        tone: 'wrong',
        title: 'NOT THIS RECEIVER',
        detail: `${freight.loadRef} stays onboard for a later delivery.`,
      })
      return false
    }

    const freightPhase = phaseForFreight(freightId)
    if (!currentPhase || !freightPhase) return false

    if (freightPhase.id !== currentPhase.id) {
      setNotice({
        tone: 'protocol',
        title: `${currentPhase.label} FIRST`,
        detail: `${freight.handlingLabel} belongs to ${freightPhase.zoneLabel}. That facility phase is not open yet.`,
      })
      return false
    }

    if (zoneId !== freightPhase.zoneId) {
      setNotice({
        tone: 'wrong',
        title: 'WRONG RECEIVING AREA',
        detail: `${freight.handlingLabel} goes to ${freightPhase.zoneLabel} during this phase.`,
      })
      return false
    }

    if (source === 'trailer' && !currentlyAccessible.has(freightId)) {
      showAccessBlocked(freightId)
      return false
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
    return true
  }

  const stageTemporarily = (freightId, source = 'trailer') => {
    const freight = freightById.get(freightId)
    if (
      !freight
      || unloaded.has(freightId)
      || temporary.has(freightId)
      || source === 'staging'
    ) return false

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
      return false
    }

    if (sameLoad(freight, event) && !laterFacilityPhase) {
      setNotice({
        tone: 'protocol',
        title: 'PROCESS THIS FREIGHT',
        detail: `${freight.handlingLabel} belongs to the current phase. Send it to ${freightPhase?.zoneLabel ?? 'receiving'} instead.`,
      })
      return false
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
    return true
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

  const zoneAtPoint = (clientX, clientY) => {
    const element = document.elementFromPoint(clientX, clientY)
    return element?.closest?.('[data-delivery-zone]')?.dataset?.deliveryZone ?? null
  }

  const startPointerMove = (pointerEvent, freightId, source) => {
    if (doorsOpening || pointerEvent.button !== 0) return
    const freight = freightById.get(freightId)
    if (!freight) return

    pointerEvent.preventDefault()
    pointerEvent.stopPropagation()

    const target = pointerEvent.currentTarget
    const rect = target.getBoundingClientRect()
    const placement = trailerState.placements[freightId]

    target.setPointerCapture?.(pointerEvent.pointerId)

    setActiveFreightId(freightId)
    setActiveSource(source)
    setNotice(null)
    setPointerDrag({
      pointerId: pointerEvent.pointerId,
      freightId,
      source,
      x: pointerEvent.clientX,
      y: pointerEvent.clientY,
      originX: rect.left,
      originY: rect.top,
      offsetX: pointerEvent.clientX - rect.left,
      offsetY: pointerEvent.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      rotation: placement?.rotation ?? 0,
      overZoneId: null,
    })
  }

  const animateReturn = (drag) => {
    if (!drag) return
    setReturnDrag({
      freightId: drag.freightId,
      rotation: drag.rotation,
      width: drag.width,
      height: drag.height,
      startX: drag.x - drag.offsetX,
      startY: drag.y - drag.offsetY,
      endX: drag.originX,
      endY: drag.originY,
    })
    setTimeout(() => setReturnDrag(null), 180)
  }

  useEffect(() => {
    if (!pointerDrag) return undefined

    const move = (pointerEvent) => {
      if (pointerEvent.pointerId !== pointerDrag.pointerId) return
      pointerEvent.preventDefault()
      const overZoneId = zoneAtPoint(pointerEvent.clientX, pointerEvent.clientY)
      setPointerDrag((current) => current
        ? {
            ...current,
            x: pointerEvent.clientX,
            y: pointerEvent.clientY,
            overZoneId,
          }
        : current)
    }

    const release = (pointerEvent) => {
      if (pointerEvent.pointerId !== pointerDrag.pointerId) return
      pointerEvent.preventDefault()

      const zoneId = zoneAtPoint(pointerEvent.clientX, pointerEvent.clientY)
      let accepted = false

      if (zoneId === 'staging') {
        accepted = stageTemporarily(
          pointerDrag.freightId,
          pointerDrag.source,
        )
      } else if (zoneId) {
        accepted = sendToReceivingZone(
          pointerDrag.freightId,
          zoneId,
          pointerDrag.source,
        )
      }

      if (!accepted) {
        animateReturn({
          ...pointerDrag,
          x: pointerEvent.clientX,
          y: pointerEvent.clientY,
        })
      }

      setPointerDrag(null)
    }

    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', release, { passive: false })
    window.addEventListener('pointercancel', release, { passive: false })

    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
    }
  }, [
    pointerDrag,
    currentPhase,
    currentlyAccessible,
    currentImmediateBlockers,
    focusedBlockerIds,
    unloaded,
    temporary,
  ])

  const handleZoneClick = (zoneId) => {
    if (!activeFreightId || pointerDrag) return
    sendToReceivingZone(
      activeFreightId,
      zoneId,
      activeSource ?? 'trailer',
    )
  }

  const handleStagingClick = () => {
    if (!activeFreightId || pointerDrag) return
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

  const pointerFreight = pointerDrag
    ? freightById.get(pointerDrag.freightId)
    : null
  const returnFreight = returnDrag
    ? freightById.get(returnDrag.freightId)
    : null
  const onboardCount = trailerState.freight.length
    - unloadedFreightIds.length
    - temporaryStagedFreightIds.filter((id) => !unloaded.has(id)).length

  return (
    <div className="delivery-workspace receiving-protocol pointer-freight-mode">
      <section className="delivery-operation-stage">
        <header className="delivery-heading">
          <div>
            <span>DOCK & DELIVERY</span>
            <strong>{event.loadRef} · {event.locationLabel}</strong>
          </div>
          <small>
            Grab freight from the trailer · move it across the dock · follow receiver SOP.
          </small>
        </header>

        <div className="delivery-dock-scene warehouse-layout">
          <section className="delivery-warehouse-floor">
            <header className="delivery-floor-header">
              <div>
                <span>RECEIVING FLOOR</span>
                <strong>{event.locationLabel}</strong>
              </div>
              <b>DOCK {dockNumberForDelivery(event)}</b>
            </header>

            <div className="delivery-floor-environment">
              <div className="delivery-floor-aisle main" aria-hidden="true">
                <span>WAREHOUSE AISLE</span>
                <i>→</i><i>→</i><i>→</i>
              </div>
              <div className="delivery-floor-aisle cross" aria-hidden="true" />

              {protocol.phases.map((phase) => (
                <WarehouseZone
                  key={phase.id}
                  phase={phase}
                  currentPhase={currentPhase}
                  receivedFreight={receivedByZone.get(phase.zoneId) ?? []}
                  pointerOver={pointerDrag?.overZoneId === phase.zoneId}
                  selected={Boolean(activeFreightId)}
                  onClick={() => handleZoneClick(phase.zoneId)}
                />
              ))}

              <section
                data-delivery-zone="staging"
                className={[
                  'delivery-warehouse-staging',
                  pointerDrag?.overZoneId === 'staging' ? 'pointer-over' : '',
                  blockedFocusId ? 'recommended' : '',
                  activeFreightId ? 'selection-target' : '',
                ].filter(Boolean).join(' ')}
                onClick={handleStagingClick}
              >
                <div className="delivery-staging-sign">
                  <span>DOCK APRON</span>
                  <strong>TEMP STAGING</strong>
                  <b>{stagedTemporarily.length} OUT</b>
                </div>
                <div className="delivery-staging-stripes" aria-hidden="true" />

                {stagedTemporarily.length === 0 ? (
                  <small>For physical blockers only · +3 min per rehandle</small>
                ) : (
                  <div className="delivery-staged-freight-grid">
                    {stagedTemporarily.map((freight) => (
                      <article
                        key={freight.id}
                        role="button"
                        tabIndex={0}
                        className={[
                          'delivery-staged-freight',
                          activeFreightId === freight.id ? 'active' : '',
                          pointerDrag?.freightId === freight.id ? 'lifting' : '',
                        ].filter(Boolean).join(' ')}
                        onPointerDown={(pointerEvent) => startPointerMove(
                          pointerEvent,
                          freight.id,
                          'staging',
                        )}
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
                          onPointerDown={(pointerEvent) => pointerEvent.stopPropagation()}
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

              <div className="delivery-dock-apron" aria-hidden="true">
                <i /><i /><i /><i />
                <span>DOCK {dockNumberForDelivery(event)} · RECEIVING APRON</span>
              </div>
            </div>
          </section>

          <div className="delivery-dock-bridge" aria-hidden="true">
            <span>DOCK {dockNumberForDelivery(event)}</span>
            <div><i /><i /><i /></div>
            <small>REAR DOORS</small>
          </div>

          <section className="delivery-trailer-assembly">
            <header>
              <span>53' DRY VAN</span>
              <strong>PHYSICAL TRAILER</strong>
              <small>{onboardCount} units onboard</small>
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
                  pointerDrag ? 'pointer-active' : '',
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
                      lifting={pointerDrag?.freightId === freightId}
                      active={activeFreightId === freightId}
                      doorsOpening={doorsOpening}
                      onPointerDown={startPointerMove}
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
                {pointerDrag
                  ? 'FREIGHT IN MOTION'
                  : activeFreightId
                    ? 'FREIGHT SELECTED'
                    : currentPhase
                      ? 'WORK THE TRAILER'
                      : 'RECEIVER READY'}
              </strong>
              <span>
                {pointerDrag
                  ? pointerDrag.overZoneId
                    ? 'Release to place freight in the highlighted floor area.'
                    : 'Carry the freight across the dock to a receiving area.'
                  : activeFreightId
                    ? `${describeFreight(activeFreightId)} · drag it, or click its destination on the warehouse floor.`
                    : currentPhase
                      ? `${currentPhase.label}: identify an accessible unit, then move it to ${currentPhase.zoneLabel}.`
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

      <PointerFreightGhost
        pointerDrag={pointerDrag}
        freight={pointerFreight}
      />
      <ReturningFreightGhost
        returnDrag={returnDrag}
        freight={returnFreight}
      />
    </div>
  )
}
