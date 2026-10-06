import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  buildTrailerPuzzleBoard,
  canPlaceFreight,
  placementMap,
  rotateFreightShape,
} from '../../domain/facility/pickupOperation.js'
import {
  buildTrailerStateForDelivery,
  DELIVERY_STAGING_CAPACITY,
  deliveryStagingFootprint,
  dockNumberForDelivery,
  evaluateDeliveryUnloadPlan,
  expectedFreightForDelivery,
  findDeliveryStagingPlacement,
} from '../../domain/facility/deliveryOperation.js'
import TrailerShell from '../trailer/TrailerShell.jsx'
import '../dock-load/dockLoad.css'
import './deliveryWorkspace.css'

function pounds(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

function shapeBounds(shape = []) {
  return {
    width: Math.max(1, ...shape.map(([x]) => x + 1)),
    height: Math.max(1, ...shape.map(([, y]) => y + 1)),
  }
}

function boardPosition(board, cellIndex) {
  return {
    column: (Number(cellIndex) % board.columns) + 1,
    row: Math.floor(Number(cellIndex) / board.columns) + 1,
  }
}

function freightCanRotate(freight) {
  if (!freight?.shape?.length) return false
  const base = shapeBounds(rotateFreightShape(freight.shape, 0))
  const rotated = shapeBounds(rotateFreightShape(freight.shape, 1))
  return base.width !== rotated.width || base.height !== rotated.height
}

function visibleFootprintCells(board, freight, anchorCell, rotation) {
  if (!freight || anchorCell == null) return []

  const anchor = boardPosition(board, anchorCell)
  const shape = rotateFreightShape(freight.shape, rotation)

  return shape
    .map(([dx, dy]) => {
      const column = anchor.column + dx
      const row = anchor.row + dy
      if (
        column < 1
        || column > board.columns
        || row < 1
        || row > board.rows
      ) return null

      const index = ((row - 1) * board.columns) + (column - 1)
      return index < board.usableCells ? index : null
    })
    .filter((index) => index != null)
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
  rotation = 0,
}) {
  const shape = rotateFreightShape(freight.shape, rotation)
  const bounds = shapeBounds(shape)

  return (
    <>
      <div
        className="loaded-freight-shape"
        style={{
          '--piece-columns': bounds.width,
          '--piece-rows': bounds.height,
        }}
      >
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
  onPointerMove,
  onPointerUp,
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
        shape.length > 1 ? 'oversize' : 'standard',
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
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={() => onActivate(freight.id, 'trailer')}
      onKeyDown={(keyboardEvent) => {
        if (!['Enter', ' '].includes(keyboardEvent.key)) return
        keyboardEvent.preventDefault()
        onActivate(freight.id, 'trailer')
      }}
      title={`${freight.loadRef} · ${freight.label} · ${freight.handlingLabel} · drag to unload or reposition`}
    >
      <FreightVisual
        freight={freight}
        rotation={placement.rotation ?? 0}
      />
      {(focusedBlocked || focusedBlocker) && (
        <span className="delivery-piece-action">
          {focusedBlocked ? 'ACCESS BLOCKED' : 'IN THE WAY'}
        </span>
      )}
      <span className="loaded-freight-grip" aria-hidden="true">MOVE</span>
    </div>
  )
}

function ReceiverFreightPiece({
  freight,
  rotation = 0,
}) {
  const shape = rotateFreightShape(freight.shape, rotation)
  const bounds = shapeBounds(shape)

  return (
    <article
      className={[
        'loaded-freight-piece',
        'delivery-receiver-freight',
        cargoClass(freight),
        handlingClass(freight),
        shape.length > 1 ? 'oversize' : 'standard',
      ].filter(Boolean).join(' ')}
      style={{
        '--piece-columns': bounds.width,
        '--piece-rows': bounds.height,
        '--receiver-piece-columns': bounds.width,
        '--receiver-piece-rows': bounds.height,
      }}
    >
      <FreightVisual freight={freight} rotation={rotation} />
    </article>
  )
}

function WarehouseZone({
  phase,
  currentPhase,
  receivedFreight,
  receivedRotations,
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
        <div className="delivery-zone-freight-floor">
          {receivedFreight.map((freight) => (
            <ReceiverFreightPiece
              key={freight.id}
              freight={freight}
              rotation={receivedRotations[freight.id] ?? 0}
            />
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

function StagedFreightPiece({
  freight,
  placement,
  active,
  lifting,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onActivate,
}) {
  const rotation = placement?.rotation ?? 0
  const shape = rotateFreightShape(freight.shape, rotation)
  const bounds = shapeBounds(shape)

  return (
    <article
      role="button"
      tabIndex={0}
      className={[
        'loaded-freight-piece',
        'delivery-staged-freight',
        cargoClass(freight),
        handlingClass(freight),
        shape.length > 1 ? 'oversize' : 'standard',
        active ? 'active' : '',
        lifting ? 'lifting' : '',
      ].filter(Boolean).join(' ')}
      style={{
        gridColumn: `${placement.startSlot + 1} / span ${placement.size}`,
        '--piece-columns': bounds.width,
        '--piece-rows': bounds.height,
      }}
      onPointerDown={(pointerEvent) => onPointerDown(
        pointerEvent,
        freight.id,
        'staging',
      )}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation()
        onActivate(freight.id, 'staging')
      }}
      onKeyDown={(keyboardEvent) => {
        if (!['Enter', ' '].includes(keyboardEvent.key)) return
        keyboardEvent.preventDefault()
        onActivate(freight.id, 'staging')
      }}
    >
      <FreightVisual freight={freight} rotation={rotation} />
    </article>
  )
}

function PointerFreightGhost({
  pointerDrag,
  freight,
}) {
  if (!pointerDrag || !freight) return null

  const shape = rotateFreightShape(freight.shape, pointerDrag.rotation ?? 0)
  const bounds = shapeBounds(shape)
  const overDestination = (
    pointerDrag.overZoneId
    || pointerDrag.overTrailerCell != null
  )

  return (
    <div
      className={[
        'delivery-pointer-freight',
        cargoClass(freight),
        handlingClass(freight),
        overDestination ? 'over-destination' : '',
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
      <FreightVisual
        freight={freight}
        rotation={pointerDrag.rotation ?? 0}
      />
      <span className="delivery-pointer-caption">
        {pointerDrag.overTrailerCell != null
          ? 'RELEASE TO REPOSITION'
          : pointerDrag.overZoneId
            ? 'RELEASE TO PLACE'
            : 'MOVE FREIGHT'}
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
      <FreightVisual
        freight={freight}
        rotation={returnDrag.rotation ?? 0}
      />
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

  const [workingPlacements, setWorkingPlacements] = useState(() => (
    Object.fromEntries(
      Object.entries(trailerState.placements ?? {}).map(([freightId, placement]) => [
        freightId,
        { ...placement },
      ]),
    )
  ))
  const [unloadedFreightIds, setUnloadedFreightIds] = useState([])
  const [temporaryStagedFreightIds, setTemporaryStagedFreightIds] = useState([])
  const [rehandledFreightIds, setRehandledFreightIds] = useState([])
  const [stagingPlacements, setStagingPlacements] = useState({})
  const [receivingZoneByFreightId, setReceivingZoneByFreightId] = useState({})
  const [receivedRotations, setReceivedRotations] = useState({})
  const [internalRepositionHistory, setInternalRepositionHistory] = useState([])
  const [pointerDrag, setPointerDrag] = useState(null)
  const [returnDrag, setReturnDrag] = useState(null)
  const [activeFreightId, setActiveFreightId] = useState(null)
  const [activeSource, setActiveSource] = useState(null)
  const [blockedFocusId, setBlockedFocusId] = useState(null)
  const [notice, setNotice] = useState(null)
  const [doorsOpening, setDoorsOpening] = useState(true)
  const [committing, setCommitting] = useState(false)
  const suppressClickRef = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => setDoorsOpening(false), 720)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const rotateHeldFreight = (keyboardEvent) => {
      if (
        keyboardEvent.key.toLowerCase() !== 'r'
        || keyboardEvent.repeat
        || !pointerDrag
      ) return

      const freight = freightById.get(pointerDrag.freightId)
      if (!freightCanRotate(freight)) return

      keyboardEvent.preventDefault()
      setPointerDrag((current) => current
        ? {
            ...current,
            rotation: ((current.rotation ?? 0) + 1) % 4,
          }
        : current)
    }

    window.addEventListener('keydown', rotateHeldFreight)
    return () => window.removeEventListener('keydown', rotateHeldFreight)
  }, [freightById, pointerDrag])

  const evaluation = useMemo(
    () => evaluateDeliveryUnloadPlan({
      board,
      driverDay,
      event,
      freight: trailerState.freight,
      placements: workingPlacements,
      unloadedFreightIds,
      temporaryStagedFreightIds,
      rehandledFreightIds,
      stagingPlacements,
      receivingZoneByFreightId,
      internalRepositionHistory,
    }),
    [
      board,
      driverDay,
      event,
      internalRepositionHistory,
      receivingZoneByFreightId,
      rehandledFreightIds,
      stagingPlacements,
      temporaryStagedFreightIds,
      trailerState.freight,
      unloadedFreightIds,
      workingPlacements,
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
  const trailerMap = useMemo(
    () => placementMap({
      board,
      stagedFreight: trailerState.freight,
      placements: workingPlacements,
    }),
    [board, trailerState.freight, workingPlacements],
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
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
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
        : 'Another freight unit must move before this piece can clear the trailer.',
    })
  }

  const clearStagingFreight = (freightId) => {
    setTemporaryStagedFreightIds((current) => (
      current.filter((id) => id !== freightId)
    ))
    setStagingPlacements((current) => {
      const next = { ...current }
      delete next[freightId]
      return next
    })
  }

  const sendToReceivingZone = (
    freightId,
    zoneId,
    source = 'trailer',
    rotationOverride = null,
  ) => {
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

    const sourceRotation = rotationOverride
      ?? workingPlacements[freightId]?.rotation
      ?? stagingPlacements[freightId]?.rotation
      ?? 0

    setUnloadedFreightIds((current) => [...current, freightId])
    setReceivingZoneByFreightId((current) => ({
      ...current,
      [freightId]: zoneId,
    }))
    setReceivedRotations((current) => ({
      ...current,
      [freightId]: sourceRotation,
    }))
    setWorkingPlacements((current) => {
      const next = { ...current }
      delete next[freightId]
      return next
    })
    if (source === 'staging') clearStagingFreight(freightId)

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

  const stageTemporarily = (
    freightId,
    source = 'trailer',
    rotationOverride = null,
  ) => {
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
        detail: `${freight.loadRef} is not blocking the current receiving phase. Reposition it in the trailer instead if you want more room.`,
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

    const stagingPlacement = findDeliveryStagingPlacement({
      freight,
      allFreight: trailerState.freight,
      stagingPlacements,
    })

    if (!stagingPlacement) {
      const size = deliveryStagingFootprint(freight)
      setNotice({
        tone: 'blocked',
        title: size > DELIVERY_STAGING_CAPACITY
          ? 'TOO LARGE FOR TEMP STAGING'
          : 'TEMP STAGING FULL',
        detail: size > DELIVERY_STAGING_CAPACITY
          ? `${freight.label} needs ${size} pallet positions. Reposition it inside the trailer instead.`
          : 'No contiguous staging positions remain. Free staging space or solve the blocker inside the trailer.',
      })
      return false
    }

    const sourcePlacement = workingPlacements[freightId]
    const rotation = rotationOverride
      ?? sourcePlacement?.rotation
      ?? 0

    setWorkingPlacements((current) => {
      const next = { ...current }
      delete next[freightId]
      return next
    })
    setTemporaryStagedFreightIds((current) => [...current, freightId])
    setRehandledFreightIds((current) => (
      current.includes(freightId)
        ? current
        : [...current, freightId]
    ))
    setStagingPlacements((current) => ({
      ...current,
      [freightId]: {
        ...stagingPlacement,
        rotation,
        originPlacement: sourcePlacement ? { ...sourcePlacement } : null,
      },
    }))
    setBlockedFocusId(null)
    setActiveFreightId(null)
    setActiveSource(null)
    setNotice({
      tone: 'warning',
      title: 'MOVED TO TEMP STAGING',
      detail: `${freight.loadRef} ${freight.label} uses ${stagingPlacement.size} of ${DELIVERY_STAGING_CAPACITY} staging position${stagingPlacement.size === 1 ? '' : 's'} · +3 min handling.`,
    })
    return true
  }

  const moveToTrailer = (
    freightId,
    anchorCell,
    source = 'trailer',
    rotationOverride = null,
  ) => {
    const freight = freightById.get(freightId)
    if (!freight || anchorCell == null || unloaded.has(freightId)) return false

    const rotation = rotationOverride
      ?? workingPlacements[freightId]?.rotation
      ?? stagingPlacements[freightId]?.rotation
      ?? 0
    const result = canPlaceFreight({
      board,
      stagedFreight: trailerState.freight,
      placements: workingPlacements,
      freightId,
      anchorCell,
      rotation,
    })

    if (!result.valid) {
      setNotice({
        tone: 'blocked',
        title: result.reason === 'OVERLAP'
          ? 'TRAILER POSITION OCCUPIED'
          : 'FREIGHT DOES NOT FIT',
        detail: 'Choose another open trailer position.',
      })
      return false
    }

    const previous = source === 'trailer'
      ? workingPlacements[freightId]
      : stagingPlacements[freightId]?.originPlacement ?? null
    const nextPlacement = { anchorCell, rotation }
    const unchanged = (
      source === 'trailer'
      && previous?.anchorCell === nextPlacement.anchorCell
      && (previous?.rotation ?? 0) === nextPlacement.rotation
    )

    if (unchanged) {
      setActiveFreightId(null)
      setActiveSource(null)
      return true
    }

    setWorkingPlacements((current) => ({
      ...current,
      [freightId]: nextPlacement,
    }))

    if (source === 'staging') {
      clearStagingFreight(freightId)
      setNotice({
        tone: 'neutral',
        title: 'RETURNED TO TRAILER',
        detail: `${describeFreight(freightId)} is back onboard in a new valid position.`,
      })
    } else {
      setInternalRepositionHistory((current) => [
        ...current,
        {
          freightId,
          from: previous ? { ...previous } : null,
          to: { ...nextPlacement },
        },
      ])
      setNotice({
        tone: 'reposition',
        title: 'REPOSITIONED IN TRAILER',
        detail: `${describeFreight(freightId)} moved without using Temp Staging.`,
      })
    }

    setBlockedFocusId(null)
    setActiveFreightId(null)
    setActiveSource(null)
    return true
  }

  const zoneAtPoint = (clientX, clientY) => {
    if (typeof document === 'undefined') return null

    const element = document
      .elementsFromPoint(clientX, clientY)
      .find((item) => item?.dataset?.deliveryZone)

    return element?.dataset?.deliveryZone ?? null
  }

  const trailerCellAtPoint = (clientX, clientY) => {
    if (typeof document === 'undefined') return null

    const cell = document
      .elementsFromPoint(clientX, clientY)
      .find((item) => item?.dataset?.deliveryTrailerCell != null)

    if (!cell) return null
    const cellIndex = Number(cell.dataset.deliveryTrailerCell)
    return Number.isInteger(cellIndex) ? cellIndex : null
  }

  const startPointerMove = (pointerEvent, freightId, source) => {
    if (doorsOpening || pointerEvent.button !== 0) return
    const freight = freightById.get(freightId)
    if (!freight) return

    pointerEvent.preventDefault()
    pointerEvent.stopPropagation()

    const target = pointerEvent.currentTarget
    const rect = target.getBoundingClientRect()
    const sourcePlacement = source === 'trailer'
      ? workingPlacements[freightId]
      : stagingPlacements[freightId]

    target.setPointerCapture?.(pointerEvent.pointerId)
    suppressClickRef.current = false

    setActiveFreightId(freightId)
    setActiveSource(source)
    setNotice(null)
    setPointerDrag({
      pointerId: pointerEvent.pointerId,
      freightId,
      source,
      x: pointerEvent.clientX,
      y: pointerEvent.clientY,
      startX: pointerEvent.clientX,
      startY: pointerEvent.clientY,
      originX: rect.left,
      originY: rect.top,
      offsetX: pointerEvent.clientX - rect.left,
      offsetY: pointerEvent.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      rotation: sourcePlacement?.rotation ?? 0,
      overZoneId: null,
      overTrailerCell: null,
    })
  }

  const movePointer = (pointerEvent) => {
    if (!pointerDrag || pointerEvent.pointerId !== pointerDrag.pointerId) return

    pointerEvent.preventDefault()
    const distance = Math.hypot(
      pointerEvent.clientX - pointerDrag.startX,
      pointerEvent.clientY - pointerDrag.startY,
    )
    if (distance > 4) suppressClickRef.current = true

    const overTrailerCell = trailerCellAtPoint(
      pointerEvent.clientX,
      pointerEvent.clientY,
    )
    const overZoneId = overTrailerCell == null
      ? zoneAtPoint(pointerEvent.clientX, pointerEvent.clientY)
      : null

    setPointerDrag((current) => current
      ? {
          ...current,
          x: pointerEvent.clientX,
          y: pointerEvent.clientY,
          overZoneId,
          overTrailerCell,
        }
      : current)
  }

  const animateReturn = (drag, clientX, clientY) => {
    if (!drag) return

    setReturnDrag({
      freightId: drag.freightId,
      rotation: drag.rotation,
      width: drag.width,
      height: drag.height,
      startX: clientX - drag.offsetX,
      startY: clientY - drag.offsetY,
      endX: drag.originX,
      endY: drag.originY,
    })
    setTimeout(() => setReturnDrag(null), 190)
  }

  const releasePointer = (pointerEvent) => {
    if (!pointerDrag || pointerEvent.pointerId !== pointerDrag.pointerId) return

    pointerEvent.preventDefault()
    pointerEvent.stopPropagation()

    const trailerCell = trailerCellAtPoint(
      pointerEvent.clientX,
      pointerEvent.clientY,
    )
    const zoneId = trailerCell == null
      ? zoneAtPoint(pointerEvent.clientX, pointerEvent.clientY)
      : null
    let accepted = false

    if (trailerCell != null) {
      accepted = moveToTrailer(
        pointerDrag.freightId,
        trailerCell,
        pointerDrag.source,
        pointerDrag.rotation,
      )
    } else if (zoneId === 'staging') {
      accepted = stageTemporarily(
        pointerDrag.freightId,
        pointerDrag.source,
        pointerDrag.rotation,
      )
    } else if (zoneId) {
      accepted = sendToReceivingZone(
        pointerDrag.freightId,
        zoneId,
        pointerDrag.source,
        pointerDrag.rotation,
      )
    }

    if (!accepted) {
      animateReturn(
        pointerDrag,
        pointerEvent.clientX,
        pointerEvent.clientY,
      )
    }

    setPointerDrag(null)
  }

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

  const handleTrailerCellClick = (cellIndex) => {
    if (!activeFreightId || pointerDrag) return
    moveToTrailer(
      activeFreightId,
      cellIndex,
      activeSource ?? 'trailer',
    )
  }

  const draggedFreight = pointerDrag
    ? freightById.get(pointerDrag.freightId)
    : null
  const previewPlacement = useMemo(() => (
    pointerDrag?.overTrailerCell != null && draggedFreight
      ? canPlaceFreight({
          board,
          stagedFreight: trailerState.freight,
          placements: workingPlacements,
          freightId: pointerDrag.freightId,
          anchorCell: pointerDrag.overTrailerCell,
          rotation: pointerDrag.rotation ?? 0,
        })
      : null
  ), [
    board,
    draggedFreight,
    pointerDrag,
    trailerState.freight,
    workingPlacements,
  ])
  const previewCells = new Set(
    visibleFootprintCells(
      board,
      draggedFreight,
      pointerDrag?.overTrailerCell,
      pointerDrag?.rotation ?? 0,
    ),
  )
  const previewShape = draggedFreight
    ? rotateFreightShape(draggedFreight.shape, pointerDrag?.rotation ?? 0)
    : []
  const previewBounds = shapeBounds(previewShape)
  const previewAnchor = pointerDrag?.overTrailerCell != null
    ? boardPosition(board, pointerDrag.overTrailerCell)
    : null

  const commit = () => {
    if (!evaluation.ready || committing) return
    setCommitting(true)

    setTimeout(() => {
      onCommit?.({
        driverId: driver.id,
        eventId: event.id,
        trailerState: {
          freight: trailerState.freight.map((freight) => ({ ...freight })),
          placements: Object.fromEntries(
            Object.entries(workingPlacements).map(([freightId, placement]) => [
              freightId,
              { ...placement },
            ]),
          ),
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
  const onboardCount = Object.keys(workingPlacements).length
  const stagingUsed = evaluation.staging?.used ?? 0

  return (
    <div className="delivery-workspace receiving-protocol pointer-freight-mode space-management">
      <section className="delivery-operation-stage">
        <header className="delivery-heading">
          <div>
            <span>DOCK & DELIVERY</span>
            <strong>{event.loadRef} · {event.locationLabel}</strong>
          </div>
          <small>
            Work the same trailer you packed · reposition onboard · stage only when space demands it.
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
                  receivedRotations={receivedRotations}
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
                  <b>{stagingUsed}/{DELIVERY_STAGING_CAPACITY} POSITIONS</b>
                </div>

                <div className="delivery-staging-grid">
                  {Array.from({ length: DELIVERY_STAGING_CAPACITY }, (_, slot) => (
                    <div
                      key={slot}
                      className={[
                        'delivery-staging-cell',
                        evaluation.staging?.occupied?.[slot] ? 'occupied' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <span>{slot + 1}</span>
                    </div>
                  ))}

                  {stagedTemporarily.map((freight) => {
                    const placement = stagingPlacements[freight.id]
                    if (!placement) return null

                    return (
                      <StagedFreightPiece
                        key={freight.id}
                        freight={freight}
                        placement={placement}
                        active={activeFreightId === freight.id}
                        lifting={pointerDrag?.freightId === freight.id}
                        onPointerDown={startPointerMove}
                        onPointerMove={movePointer}
                        onPointerUp={releasePointer}
                        onActivate={activateFreight}
                      />
                    )
                  })}
                </div>

                <small>
                  Finite dock space · large freight may not fit · reposition in the trailer first.
                </small>
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

          <section className="delivery-shared-trailer-panel">
            <header>
              <span>53' DRY VAN</span>
              <strong>SAME TRAILER · DELIVERY STATE</strong>
              <small>{onboardCount} units onboard</small>
            </header>

            <div className="trailer-scene delivery-trailer-scene">
              <TrailerShell board={board} className="delivery-shared-trailer">
                <div
                  className={[
                    'dock-load-grid',
                    'puzzle-board',
                    pointerDrag ? 'drag-active' : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    '--board-columns': board.columns,
                    '--board-rows': board.rows,
                  }}
                >
                  {Array.from({ length: board.totalCells }, (_, cellIndex) => {
                    const disabled = cellIndex >= board.usableCells
                    const occupantId = trailerMap.occupied.get(cellIndex)
                    const preview = previewCells.has(cellIndex)
                    const previewValid = preview && previewPlacement?.valid
                    const previewInvalid = preview && !previewPlacement?.valid
                    const position = boardPosition(board, cellIndex)

                    return (
                      <button
                        type="button"
                        key={cellIndex}
                        style={{
                          gridColumn: position.column,
                          gridRow: position.row,
                        }}
                        className={[
                          'trailer-puzzle-cell',
                          disabled ? 'disabled' : '',
                          occupantId ? 'occupied' : '',
                          previewValid ? 'preview-valid' : '',
                          previewInvalid ? 'preview-invalid' : '',
                        ].filter(Boolean).join(' ')}
                        disabled={disabled}
                        data-delivery-trailer-cell={cellIndex}
                        onClick={() => handleTrailerCellClick(cellIndex)}
                        title={occupantId
                          ? `Occupied by ${describeFreight(occupantId)}`
                          : 'Open trailer position'}
                      />
                    )
                  })}

                  {draggedFreight && previewAnchor && previewPlacement && (
                    <div
                      className={[
                        'drag-preview-piece',
                        cargoClass(draggedFreight),
                        handlingClass(draggedFreight),
                        previewPlacement.valid ? 'valid' : 'invalid',
                        previewShape.length > 1 ? 'oversize' : 'standard',
                      ].filter(Boolean).join(' ')}
                      style={{
                        gridColumn: `${previewAnchor.column} / span ${previewBounds.width}`,
                        gridRow: `${previewAnchor.row} / span ${previewBounds.height}`,
                        '--piece-columns': previewBounds.width,
                        '--piece-rows': previewBounds.height,
                      }}
                      aria-hidden="true"
                    >
                      <div className="drag-preview-shape">
                        {previewShape.map(([x, y], index) => (
                          <i
                            key={`delivery-preview:${draggedFreight.id}:${index}`}
                            style={{
                              gridColumn: x + 1,
                              gridRow: y + 1,
                            }}
                          />
                        ))}
                      </div>
                      <span>
                        <strong>{draggedFreight.loadRef}</strong>
                        <small>{draggedFreight.handlingLabel}</small>
                      </span>
                    </div>
                  )}

                  {Object.entries(workingPlacements).map(([freightId, placement]) => {
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
                        onPointerMove={movePointer}
                        onPointerUp={releasePointer}
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
              </TrailerShell>
            </div>

            <footer>
              <span>Grab freight · R rotates while held</span>
              <strong>{evaluation.internalRepositionCount} internal moves</strong>
              <span>Trailer → Trailer uses no staging space</span>
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
          <div className="delivery-space-stats">
            <p><span>INTERNAL MOVES</span><strong>{evaluation.internalRepositionCount}</strong></p>
            <p><span>STAGING</span><strong>{stagingUsed}/{DELIVERY_STAGING_CAPACITY}</strong></p>
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
                      ? 'MANAGE THE SPACE'
                      : 'RECEIVER READY'}
              </strong>
              <span>
                {pointerDrag
                  ? pointerDrag.overTrailerCell != null
                    ? 'Release to reposition this freight inside the trailer.'
                    : pointerDrag.overZoneId
                      ? 'Release to place freight in the highlighted floor area.'
                      : 'Move to another trailer position, Temp Staging, or the active receiving area.'
                  : activeFreightId
                    ? `${describeFreight(activeFreightId)} · move it physically or click a valid destination.`
                    : currentPhase
                      ? `${currentPhase.label}: unload it if accessible, rearrange the trailer if possible, or spend scarce staging space.`
                      : 'Return any later-stop staged freight to the trailer, then confirm handoff.'}
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
                : remainingCount > 0
                  ? `${remainingCount} UNIT${remainingCount === 1 ? '' : 'S'} REMAIN`
                  : 'CLEAR TEMP STAGING'}
          </strong>
          <small>
            {evaluation.ready
              ? `Protocol complete · ${evaluation.internalRepositionCount} internal move${evaluation.internalRepositionCount === 1 ? '' : 's'} · ${evaluation.rehandleUnits} external rehandle${evaluation.rehandleUnits === 1 ? '' : 's'}`
              : 'Complete the receiver sequence and return later-stop staged freight before handoff'}
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
