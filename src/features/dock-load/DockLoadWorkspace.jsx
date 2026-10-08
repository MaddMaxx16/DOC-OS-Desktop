import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  buildDeliveryAccessOrder,
  buildExpectedPickupFreight,
  buildOnboardCargoForPickup,
  buildPickupFacilityFreight,
  buildTrailerPuzzleBoard,
  canPlaceFreight,
  dockNumberForPickup,
  evaluatePickupLoadPlan,
  evaluateTrailerDeliveryAccess,
  placementMap,
  rotateFreightShape,
} from '../../domain/facility/pickupOperation.js'
import TrailerShell from '../trailer/TrailerShell.jsx'
import './dockLoad.css'

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

function freightCanRotate(freight) {
  if (!freight?.shape?.length) return false
  const base = shapeBounds(rotateFreightShape(freight.shape, 0))
  const rotated = shapeBounds(rotateFreightShape(freight.shape, 1))
  return base.width !== rotated.width || base.height !== rotated.height
}

function handlingClass(freight) {
  return `handling-${String(freight.handlingCode ?? 'standard').toLowerCase().replaceAll('_', '-')}`
}

function trailerCellFromPointer(pointerEvent) {
  if (typeof document === 'undefined') return null

  const cell = document
    .elementsFromPoint(pointerEvent.clientX, pointerEvent.clientY)
    .find((element) => element?.dataset?.trailerCellIndex != null)

  if (!cell) return null
  const cellIndex = Number(cell.dataset.trailerCellIndex)
  return Number.isInteger(cellIndex) ? cellIndex : null
}

function FreightManifestRow({
  freight,
  rotation,
  planned,
  dragging,
  rotating,
  damageNoted,
  onNoteDamage,
  onRotate,
  onDragStart,
  onDragEnd,
}) {
  const shape = rotateFreightShape(freight.shape, rotation)
  const bounds = shapeBounds(shape)
  const occupied = new Set(shape.map(([x, y]) => `${x}:${y}`))

  return (
    <article
      className={[
        'pallet-piece',
        'freight-manifest-row',
        cargoClass(freight),
        handlingClass(freight),
        planned ? 'planned' : '',
        dragging ? 'dragging' : '',
        rotating ? 'rotating' : '',
        freight.condition === 'DAMAGED' ? 'pickup-damaged' : '',
      ].filter(Boolean).join(' ')}
      draggable={!planned}
      onDragStart={(event) => onDragStart(event, freight.id)}
      onDragEnd={onDragEnd}
      title={planned
        ? `${freight.label} is already onboard. Drag it inside the trailer to reposition it.`
        : `Drag ${freight.label} into the trailer`}
    >
      <div
        className="pallet-piece-shape"
        style={{
          gridTemplateColumns: `repeat(${bounds.width}, 31px)`,
          gridTemplateRows: `repeat(${bounds.height}, 31px)`,
        }}
        aria-hidden="true"
      >
        {Array.from({ length: bounds.width * bounds.height }, (_, index) => {
          const x = index % bounds.width
          const y = Math.floor(index / bounds.width)
          const filled = occupied.has(`${x}:${y}`)

          return (
            <i
              key={index}
              className={filled ? 'filled' : 'empty'}
            />
          )
        })}
        <span className="pallet-piece-marking">
          <strong>{freight.loadRef}</strong>
          <small>{freight.handlingLabel}</small>
        </span>
      </div>

      <div className="pallet-piece-copy">
        <div>
          <strong>{freight.label}</strong>
          <span>{freight.unitCode}</span>
        </div>
        <b className="manifest-load-number">LOAD {freight.loadRef}</b>
        <small>
          {freight.hazmatClassLabel
            ? `${freight.hazmatClassLabel} · ${freight.handlingLabel}`
            : freight.handlingLabel}
          {' · '}{pounds(freight.weightLbs)} lb
        </small>
        <small>{freight.destination}</small>
        {freight.condition === 'DAMAGED' && (
          <small className="pickup-damage-copy">
            {freight.damageSeverity ?? 'DAMAGE'} · {freight.damageDescription ?? 'Visible damage at pickup'}
          </small>
        )}
      </div>

      <div className="pallet-piece-actions">
        {freight.condition === 'DAMAGED' && (
          <button
            type="button"
            className={damageNoted ? 'damage-noted' : 'note-damage'}
            onClick={onNoteDamage}
            title="Record that this damage was present before loading."
          >
            {damageNoted ? 'DAMAGE NOTED' : 'NOTE DAMAGE'}
          </button>
        )}
        <button
          type="button"
          onClick={onRotate}
          disabled={planned}
          title="Rotate staged freight. While dragging, press R."
        >
          ROTATE · R
        </button>
        <span className={planned ? 'onboard' : 'staged'}>
          {planned ? 'ONBOARD' : freight.handlingLabel}
        </span>
      </div>
    </article>
  )
}

export default function DockLoadWorkspace({
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
  const expectedFreight = useMemo(
    () => buildExpectedPickupFreight(event),
    [event],
  )
  const stagedFreight = useMemo(
    () => buildPickupFacilityFreight(event),
    [event],
  )
  const carriedCargo = useMemo(
    () => buildOnboardCargoForPickup({
      driverId: driver.id,
      eventId: event.id,
      driverDay,
      facilityOperations,
    }),
    [driver.id, driverDay, event.id, facilityOperations],
  )
  const allFreight = useMemo(() => {
    const byId = new Map()

    for (const freight of carriedCargo.freight) {
      byId.set(freight.id, { ...freight, carried: true })
    }
    for (const freight of stagedFreight) {
      byId.set(freight.id, freight)
    }

    return [...byId.values()]
  }, [carriedCargo.freight, stagedFreight])

  const deliveryOrder = useMemo(
    () => buildDeliveryAccessOrder({
      driverDay,
      eventId: event.id,
      freight: allFreight,
    }),
    [allFreight, driverDay, event.id],
  )
  const deliveryRankByLoad = useMemo(() => {
    const rankMap = new Map()
    for (const stop of deliveryOrder) {
      if (stop.loadId) rankMap.set(stop.loadId, stop.rank)
      if (stop.loadRef) rankMap.set(stop.loadRef, stop.rank)
    }
    return rankMap
  }, [deliveryOrder])

  const requiredFreightIds = useMemo(
    () => expectedFreight.map((freight) => freight.id),
    [expectedFreight],
  )
  const currentStagedIds = useMemo(
    () => new Set(stagedFreight.map((freight) => freight.id)),
    [stagedFreight],
  )

  const [placements, setPlacements] = useState(() => ({ ...carriedCargo.placements }))
  const [rotations, setRotations] = useState(() => Object.fromEntries(
    Object.entries(carriedCargo.placements).map(([freightId, placement]) => (
      [freightId, placement.rotation ?? 0]
    )),
  ))
  const [dragFreightId, setDragFreightId] = useState(null)
  const [hoverFreightId, setHoverFreightId] = useState(null)
  const [hoverCell, setHoverCell] = useState(null)
  const [rotatingFreightId, setRotatingFreightId] = useState(null)
  const [settlingFreightId, setSettlingFreightId] = useState(null)
  const [invalidDropReason, setInvalidDropReason] = useState(null)
  const [readyPulse, setReadyPulse] = useState(false)
  const [doorsClosing, setDoorsClosing] = useState(false)
  const [discrepancyArmed, setDiscrepancyArmed] = useState(false)
  const [pickupDamageNotes, setPickupDamageNotes] = useState({})
  const closeTimerRef = useRef(null)
  const rotateTimerRef = useRef(null)
  const settleTimerRef = useRef(null)
  const invalidTimerRef = useRef(null)
  const readyTimerRef = useRef(null)
  const wasReadyRef = useRef(false)

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current)
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
    if (invalidTimerRef.current) clearTimeout(invalidTimerRef.current)
    if (readyTimerRef.current) clearTimeout(readyTimerRef.current)
  }, [])

  const pulseRotation = useCallback((freightId) => {
    setRotatingFreightId(freightId)
    if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current)
    rotateTimerRef.current = setTimeout(() => setRotatingFreightId(null), 170)
  }, [])

  const rotatePlacedFreight = useCallback((freightId) => {
    const placement = placements[freightId]
    const freight = allFreight.find((item) => item.id === freightId)
    if (!placement || !freightCanRotate(freight)) return

    const currentRotation = placement.rotation ?? rotations[freightId] ?? 0
    const nextRotation = (currentRotation + 1) % 4
    const result = canPlaceFreight({
      board,
      stagedFreight: allFreight,
      placements,
      freightId,
      anchorCell: placement.anchorCell,
      rotation: nextRotation,
    })

    if (!result.valid) {
      setInvalidDropReason(result.reason ?? 'INVALID')
      if (invalidTimerRef.current) clearTimeout(invalidTimerRef.current)
      invalidTimerRef.current = setTimeout(() => setInvalidDropReason(null), 320)
      return
    }

    setRotations((current) => ({
      ...current,
      [freightId]: nextRotation,
    }))
    setPlacements((current) => ({
      ...current,
      [freightId]: {
        ...current[freightId],
        rotation: nextRotation,
      },
    }))
    pulseRotation(freightId)
  }, [allFreight, board, placements, pulseRotation, rotations])

  useEffect(() => {
    const rotateActiveFreight = (keyboardEvent) => {
      if (keyboardEvent.key.toLowerCase() !== 'r' || keyboardEvent.repeat) return

      if (dragFreightId) {
        const freight = allFreight.find((item) => item.id === dragFreightId)
        if (!freightCanRotate(freight)) return
        keyboardEvent.preventDefault()

        setRotations((current) => ({
          ...current,
          [dragFreightId]: ((current[dragFreightId] ?? 0) + 1) % 4,
        }))
        pulseRotation(dragFreightId)
        return
      }

      if (!hoverFreightId) return
      keyboardEvent.preventDefault()
      rotatePlacedFreight(hoverFreightId)
    }

    window.addEventListener('keydown', rotateActiveFreight)
    return () => window.removeEventListener('keydown', rotateActiveFreight)
  }, [
    allFreight,
    dragFreightId,
    hoverFreightId,
    pulseRotation,
    rotatePlacedFreight,
  ])

  const evaluation = useMemo(
    () => evaluatePickupLoadPlan({
      event,
      board,
      stagedFreight: allFreight,
      expectedFreight,
      placements,
      requiredFreightIds,
      documentedDamageIds: Object.keys(pickupDamageNotes).filter((id) => pickupDamageNotes[id]),
      deliveryOrder,
    }),
    [allFreight, board, deliveryOrder, event, expectedFreight, pickupDamageNotes, placements, requiredFreightIds],
  )

  useEffect(() => {
    if (evaluation.ready && !wasReadyRef.current) {
      setReadyPulse(true)
      if (readyTimerRef.current) clearTimeout(readyTimerRef.current)
      readyTimerRef.current = setTimeout(() => setReadyPulse(false), 620)
    }

    wasReadyRef.current = evaluation.ready
  }, [evaluation.ready])

  const mapped = useMemo(
    () => placementMap({
      board,
      stagedFreight: allFreight,
      placements,
    }),
    [allFreight, board, placements],
  )

  const plannedIds = new Set(Object.keys(placements))
  const blockedDeliveryIds = new Set(evaluation.deliveryAccess?.blockedFreightIds ?? [])
  const blockingDeliveryIds = new Set(evaluation.deliveryAccess?.blockingFreightIds ?? [])
  const fragileAtRiskIds = new Set(evaluation.fragileProtection?.fragileFreightIds ?? [])
  const fragileImpactRiskIds = new Set(evaluation.fragileProtection?.riskFreightIds ?? [])
  const hazmatConflictIds = new Set(evaluation.hazmatSegregation?.conflictFreightIds ?? [])
  const nonRuleErrors = evaluation.errors.filter(
    (issue) => ![
      'DELIVERY_ACCESS_BLOCKED',
      'WEIGHT_DISTRIBUTION_UNBALANCED',
      'FRAGILE_PROTECTION_CONFLICT',
      'HAZMAT_SEGREGATION_CONFLICT',
    ].includes(issue.code),
  )
  const orderedStagedFreight = [
    ...stagedFreight.filter((freight) => !plannedIds.has(freight.id)),
    ...stagedFreight.filter((freight) => plannedIds.has(freight.id)),
  ]
  const dock = dockNumberForPickup(event)
  const draggedFreight = allFreight.find((item) => item.id === dragFreightId) ?? null
  const dragRotation = dragFreightId ? rotations[dragFreightId] ?? 0 : 0

  const hoverPlacement = useMemo(() => (
    dragFreightId != null && hoverCell != null
      ? canPlaceFreight({
          board,
          stagedFreight: allFreight,
          placements,
          freightId: dragFreightId,
          anchorCell: hoverCell,
          rotation: dragRotation,
        })
      : null
  ), [
    allFreight,
    board,
    dragFreightId,
    dragRotation,
    hoverCell,
    placements,
  ])

  const previewDeliveryAccess = useMemo(() => {
    if (
      !dragFreightId
      || hoverCell == null
      || !hoverPlacement?.valid
    ) return null

    return evaluateTrailerDeliveryAccess({
      board,
      stagedFreight: allFreight,
      placements: {
        ...placements,
        [dragFreightId]: {
          anchorCell: hoverCell,
          rotation: dragRotation,
        },
      },
      deliveryOrder,
    })
  }, [
    allFreight,
    board,
    deliveryOrder,
    dragFreightId,
    dragRotation,
    hoverCell,
    hoverPlacement?.valid,
    placements,
  ])

  const previewAccessWarning = Boolean(
    previewDeliveryAccess
    && !previewDeliveryAccess.clear
    && previewDeliveryAccess.violations.some((issue) => (
      issue.blockedFreightId === dragFreightId
      || issue.blockingFreightId === dragFreightId
    )),
  )

  const previewCells = new Set(
    visibleFootprintCells(
      board,
      draggedFreight,
      hoverCell,
      dragRotation,
    ),
  )

  const previewBlockedCells = new Set(
    hoverPlacement?.valid === false && hoverPlacement.reason === 'OVERLAP'
      ? [...previewCells].filter((cell) => {
          const occupantId = mapped.occupied.get(cell)
          return occupantId != null && occupantId !== dragFreightId
        })
      : [],
  )

  const dragPreviewShape = draggedFreight
    ? rotateFreightShape(draggedFreight.shape, dragRotation)
    : []
  const dragPreviewBounds = shapeBounds(dragPreviewShape)
  const dragPreviewAnchor = hoverCell != null
    ? boardPosition(board, hoverCell)
    : null

  const rotate = (freightId) => {
    const freight = allFreight.find((item) => item.id === freightId)
    if (!freightCanRotate(freight)) return

    setRotations((current) => ({
      ...current,
      [freightId]: ((current[freightId] ?? 0) + 1) % 4,
    }))
    pulseRotation(freightId)
  }

  const startDrag = (dragEvent, freightId) => {
    setDragFreightId(freightId)
    setHoverCell(null)
    dragEvent.dataTransfer.setData('text/plain', freightId)
    dragEvent.dataTransfer.effectAllowed = 'move'

    const dragVisual = dragEvent.currentTarget.querySelector(
      '.pallet-piece-shape, .loaded-freight-shape',
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
    setHoverCell(null)
  }

  const placeFreight = (freightId, anchorCell) => {
    const rotation = rotations[freightId] ?? 0
    const result = canPlaceFreight({
      board,
      stagedFreight: allFreight,
      placements,
      freightId,
      anchorCell,
      rotation,
    })

    if (!result.valid) {
      setInvalidDropReason(result.reason ?? 'INVALID')
      setHoverCell(null)
      if (invalidTimerRef.current) clearTimeout(invalidTimerRef.current)
      invalidTimerRef.current = setTimeout(() => setInvalidDropReason(null), 260)
      return
    }

    setPlacements((current) => ({
      ...current,
      [freightId]: {
        anchorCell,
        rotation,
      },
    }))
    setSettlingFreightId(freightId)
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
    settleTimerRef.current = setTimeout(() => setSettlingFreightId(null), 260)
    endDrag()
  }

  const returnFreightToStaging = (freightId) => {
    if (!currentStagedIds.has(freightId)) {
      endDrag()
      return
    }

    setPlacements((current) => {
      const next = { ...current }
      delete next[freightId]
      return next
    })
    endDrag()
  }

  const occupantForCell = (cellIndex) => mapped.occupied.get(cellIndex) ?? null

  const commit = () => {
    if (!evaluation.canCommit || doorsClosing) return
    if (evaluation.discrepancies.length > 0 && !discrepancyArmed) {
      setDiscrepancyArmed(true)
      return
    }

    setDoorsClosing(true)

    closeTimerRef.current = setTimeout(() => {
      const placedFreight = allFreight.filter((freight) => placements[freight.id])

      onCommit({
        driverId: driver.id,
        eventId: event.id,
        loadPlan: {
          freightIds: Object.keys(placements),
          expectedFreightManifest: expectedFreight.map((freight) => ({ ...freight })),
          freightManifest: placedFreight.map((freight) => ({
            ...freight,
            pickupDamageDocumented: Boolean(pickupDamageNotes[freight.id]),
          })),
          placements: { ...placements },
          board: { ...board },
          validation: evaluation,
          pickupDiscrepancies: evaluation.discrepancies.map((issue) => ({ ...issue })),
          doorsState: 'closed',
        },
      })
    }, 840)
  }

  const carriedLoadRefs = [...new Set(
    carriedCargo.freight.map((freight) => freight.loadRef).filter(Boolean),
  )]
  const showDeliveryOrderBadges = deliveryOrder.length > 1
  const deliveryConflict = evaluation.deliveryAccess?.pairSummaries?.[0] ?? null
  const remainingPickupUnits = evaluation.notLoadedFreight.length
  const facilityMissingUnits = evaluation.notTenderedFreight.length
  const wrongLoadUnits = evaluation.wrongPlaced.length
  const undocumentedDamageUnits = evaluation.undocumentedDamagedFreight.length
  const otherActionErrors = nonRuleErrors.filter(
    (issue) => issue.code !== 'REQUIRED_FREIGHT_NOT_PLANNED',
  )
  const weightBalance = evaluation.weightBalance
  const balanceNeedsAction = Boolean(
    weightBalance?.enforced && !weightBalance?.clear,
  )
  const balanceMonitoring = Boolean(
    weightBalance?.active && !weightBalance?.enforced,
  )
  const balanceIssueLabel = weightBalance?.issues
    ?.map((issue) => issue.label)
    .join(' + ') ?? ''
  const balanceFixText = weightBalance?.issues
    ?.map((issue) => issue.fix)
    .join(' ') ?? 'Redistribute trailer weight.'
  const fragileProtection = evaluation.fragileProtection
  const fragileConflict = fragileProtection?.conflicts?.[0] ?? null
  const fragileNeedsAction = Boolean(
    fragileProtection?.enforced && !fragileProtection?.clear,
  )
  const fragileMonitoring = Boolean(
    fragileProtection?.active && !fragileProtection?.enforced,
  )
  const deliveryNeedsAction = !evaluation.deliveryAccess?.clear
  const deliveryRuleStatus = deliveryNeedsAction ? 'BLOCKED' : 'CLEAR'
  const balanceRuleStatus = balanceNeedsAction
    ? 'ADJUST'
    : balanceMonitoring
      ? 'LIVE'
      : !weightBalance?.active
        ? 'LIGHT'
        : 'BALANCED'
  const fragileRuleStatus = fragileNeedsAction
    ? 'SEPARATE'
    : fragileMonitoring
      ? 'LIVE'
      : fragileProtection?.active
        ? 'PROTECTED'
        : 'CLEAR'
  const hazmatSegregation = evaluation.hazmatSegregation
  const hazmatConflict = hazmatSegregation?.conflicts?.[0] ?? null
  const hazmatNeedsAction = Boolean(
    hazmatSegregation?.enforced && !hazmatSegregation?.clear,
  )
  const hazmatMonitoring = Boolean(
    hazmatSegregation?.active && !hazmatSegregation?.enforced,
  )
  const hazmatRuleStatus = hazmatNeedsAction
    ? 'SEPARATE'
    : hazmatMonitoring
      ? 'LIVE'
      : hazmatSegregation?.active
        ? 'SEPARATED'
        : 'CLEAR'
  const onboardHazmatClasses = [...new Set(
    allFreight
      .filter((freight) => placements[freight.id] && freight.handlingCode === 'HAZMAT')
      .map((freight) => freight.hazmatClassCode)
      .filter(Boolean),
  )]
  const blockingRuleCount = [
    deliveryNeedsAction,
    balanceNeedsAction,
    fragileNeedsAction,
    hazmatNeedsAction,
  ].filter(Boolean).length
  const anyRuleMonitoring = balanceMonitoring || fragileMonitoring || hazmatMonitoring
  const trailerRuleSummary = blockingRuleCount > 0
    ? `${blockingRuleCount} NEED${blockingRuleCount === 1 ? 'S' : ''} ATTENTION`
    : anyRuleMonitoring
      ? 'LIVE'
      : 'OK'

  return (
    <div
      className={[
        'dock-load-workspace',
        'puzzle-mode',
        evaluation.ready ? 'load-ready' : evaluation.canCommit ? 'load-discrepancy' : '',
        readyPulse ? 'ready-pulse' : '',
        invalidDropReason ? 'invalid-drop' : '',
        doorsClosing ? 'committing' : '',
      ].filter(Boolean).join(' ')}
    >
      <aside className="dock-load-staging">
        <header>
          <span>STAGED FREIGHT MANIFEST</span>
          <strong>Dock {dock}</strong>
          <small>
            Match the load number, then drag freight into the trailer. Hold a piece and press R to rotate.
          </small>
        </header>

        <div
          className="pallet-piece-bin"
          onDragOver={(dragEvent) => {
            if (!dragFreightId || !currentStagedIds.has(dragFreightId)) return
            dragEvent.preventDefault()
            dragEvent.dataTransfer.dropEffect = 'move'
          }}
          onDrop={(dragEvent) => {
            dragEvent.preventDefault()
            const freightId = dragEvent.dataTransfer.getData('text/plain')
            if (freightId) returnFreightToStaging(freightId)
          }}
        >
          {orderedStagedFreight.map((freight) => (
            <FreightManifestRow
              key={freight.id}
              freight={freight}
              rotation={rotations[freight.id] ?? 0}
              planned={plannedIds.has(freight.id)}
              dragging={dragFreightId === freight.id}
              rotating={rotatingFreightId === freight.id}
              damageNoted={Boolean(pickupDamageNotes[freight.id])}
              onNoteDamage={() => setPickupDamageNotes((current) => ({
                ...current,
                [freight.id]: true,
              }))}
              onRotate={() => rotate(freight.id)}
              onDragStart={startDrag}
              onDragEnd={endDrag}
            />
          ))}
        </div>
      </aside>

      <section className="dock-load-trailer-panel">
        <header className="dock-load-trailer-heading">
          <div>
            <span>TRAILER LOAD PLAN</span>
            <strong>{board.label}</strong>
          </div>
          <small>
            {board.capacityPallets} pallet positions · Hover freight and press R to rotate · Drag onboard freight to reposition it.
          </small>
        </header>

        <div className="dock-load-trailer-shell">
          <div className="trailer-view-tabs" aria-label="Trailer views">
            <button type="button" className="active">TRAILER VIEW</button>
            <button type="button" disabled>TOP DOWN</button>
            <button type="button" disabled>SIDE VIEW</button>
          </div>

          <div className="trailer-scene">
            <TrailerShell
              board={board}
              overlay={(
                <div
                  className={`trailer-door-commit ${doorsClosing ? 'closing' : ''}`}
                  aria-hidden="true"
                >
                  <i className="door-panel left" />
                  <i className="door-panel right" />
                  <strong>LOAD PLAN LOCKED</strong>
                  <small>SENDING TO WAREHOUSE</small>
                </div>
              )}
            >
              <div
                    className={`dock-load-grid puzzle-board ${draggedFreight ? 'drag-active' : ''}`}
                    style={{
                      '--board-columns': board.columns,
                      '--board-rows': board.rows,
                    }}
                    onDragOver={(dragEvent) => {
                      if (!draggedFreight) return
                      const cellIndex = trailerCellFromPointer(dragEvent)
                      if (cellIndex == null || cellIndex >= board.usableCells) return

                      dragEvent.preventDefault()
                      dragEvent.dataTransfer.dropEffect = 'move'
                      setHoverCell(cellIndex)
                    }}
                    onDrop={(dragEvent) => {
                      if (!draggedFreight) return
                      dragEvent.preventDefault()

                      const freightId = dragEvent.dataTransfer.getData('text/plain') || dragFreightId
                      const cellIndex = trailerCellFromPointer(dragEvent) ?? hoverCell
                      if (freightId && cellIndex != null) placeFreight(freightId, cellIndex)
                    }}
                    onDragLeave={(dragEvent) => {
                      if (!dragEvent.currentTarget.contains(dragEvent.relatedTarget)) {
                        setHoverCell(null)
                      }
                    }}
                  >
                    {Array.from({ length: board.totalCells }, (_, cellIndex) => {
                      const disabled = cellIndex >= board.usableCells
                      const occupantId = occupantForCell(cellIndex)
                      const occupant = allFreight.find((item) => item.id === occupantId) ?? null
                      const preview = previewCells.has(cellIndex)
                      const previewValid = preview && hoverPlacement?.valid && !previewAccessWarning
                      const previewRuleWarning = preview && hoverPlacement?.valid && previewAccessWarning
                      const previewInvalid = preview && !hoverPlacement?.valid
                      const previewBlocked = previewBlockedCells.has(cellIndex)
                      const cellPosition = boardPosition(board, cellIndex)

                      return (
                        <button
                          type="button"
                          key={cellIndex}
                          style={{
                            gridColumn: cellPosition.column,
                            gridRow: cellPosition.row,
                          }}
                          className={[
                            'trailer-puzzle-cell',
                            disabled ? 'disabled' : '',
                            occupant ? 'occupied' : '',
                            previewValid ? 'preview-valid' : '',
                            previewRuleWarning ? 'preview-rule-warning' : '',
                            previewInvalid ? 'preview-invalid' : '',
                            previewBlocked ? 'preview-blocker' : '',
                          ].filter(Boolean).join(' ')}
                          disabled={disabled}
                          data-trailer-cell-index={cellIndex}
                          title={occupant
                            ? `Occupied by ${occupant.label}. Drag the cargo itself to reposition it.`
                            : 'Open trailer position'}
                        />
                      )
                    })}

                    {draggedFreight && dragPreviewAnchor && hoverPlacement && (
                      <div
                        className={[
                          'drag-preview-piece',
                          cargoClass(draggedFreight),
                          handlingClass(draggedFreight),
                          hoverPlacement.valid
                            ? previewAccessWarning ? 'rule-warning' : 'valid'
                            : 'invalid',
                          dragPreviewShape.length > 1 ? 'oversize' : 'standard',
                        ].filter(Boolean).join(' ')}
                        style={{
                          gridColumn: `${dragPreviewAnchor.column} / span ${dragPreviewBounds.width}`,
                          gridRow: `${dragPreviewAnchor.row} / span ${dragPreviewBounds.height}`,
                          '--piece-columns': dragPreviewBounds.width,
                          '--piece-rows': dragPreviewBounds.height,
                        }}
                        aria-hidden="true"
                      >
                        <div className="drag-preview-shape">
                          {dragPreviewShape.map(([x, y], index) => (
                            <i
                              key={`preview:${draggedFreight.id}:${index}`}
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

                    {Object.entries(placements).map(([freightId, placement]) => {
                      const freight = allFreight.find((item) => item.id === freightId)
                      if (!freight) return null

                      const shape = rotateFreightShape(
                        freight.shape,
                        placement.rotation ?? 0,
                      )
                      const bounds = shapeBounds(shape)
                      const anchor = boardPosition(board, placement.anchorCell)
                      const deliveryRank = deliveryRankByLoad.get(
                        freight.loadRef ?? freight.loadId,
                      )

                      const rotatable = freightCanRotate(freight)

                      return (
                        <div
                          key={freightId}
                          draggable
                          tabIndex={0}
                          className={[
                            'loaded-freight-piece',
                            cargoClass(freight),
                            handlingClass(freight),
                            freight.carried ? 'carried-freight' : 'current-pickup-freight',
                            freight.stackable ? 'stackable' : 'no-stack',
                            shape.length > 1 ? 'oversize' : 'standard',
                            settlingFreightId === freightId ? 'settling' : '',
                            rotatingFreightId === freightId ? 'rotating' : '',
                            dragFreightId === freightId ? 'dragging' : '',
                            deliveryRank === 1 ? 'delivery-next' : '',
                            blockedDeliveryIds.has(freightId) ? 'delivery-blocked' : '',
                            blockingDeliveryIds.has(freightId) ? 'delivery-blocker' : '',
                            fragileAtRiskIds.has(freightId) ? 'fragile-at-risk' : '',
                            fragileImpactRiskIds.has(freightId) ? 'fragile-impact-risk' : '',
                            hazmatConflictIds.has(freightId) ? 'hazmat-segregation-conflict' : '',
                          ].filter(Boolean).join(' ')}
                          style={{
                            gridColumn: `${anchor.column} / span ${bounds.width}`,
                            gridRow: `${anchor.row} / span ${bounds.height}`,
                            '--piece-columns': bounds.width,
                            '--piece-rows': bounds.height,
                          }}
                          onMouseEnter={() => setHoverFreightId(freightId)}
                          onMouseLeave={() => setHoverFreightId((current) => (
                            current === freightId ? null : current
                          ))}
                          onFocus={() => setHoverFreightId(freightId)}
                          onBlur={(focusEvent) => {
                            if (!focusEvent.currentTarget.contains(focusEvent.relatedTarget)) {
                              setHoverFreightId((current) => (
                                current === freightId ? null : current
                              ))
                            }
                          }}
                          onDragStart={(dragEvent) => {
                            dragEvent.stopPropagation()
                            startDrag(dragEvent, freightId)
                          }}
                          onDragEnd={endDrag}
                          title={rotatable
                            ? `${freight.loadRef} · ${freight.handlingLabel} · hover + R to rotate · drag to reposition`
                            : `${freight.loadRef} · ${freight.handlingLabel} · drag to reposition`}
                          aria-label={`${freight.label}, load ${freight.loadRef}, ${freight.handlingLabel}. Drag to reposition${rotatable ? ' or press R to rotate' : ''}.`}
                        >
                          <div className="loaded-freight-shape">
                            {shape.map(([x, y], index) => (
                              <i
                                key={`${freightId}:${index}`}
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
                          {showDeliveryOrderBadges && deliveryRank && (
                            <span
                              className="loaded-freight-order"
                              title={deliveryRank === 1 ? 'Next delivery off trailer' : `Delivery order ${deliveryRank}`}
                            >
                              D{deliveryRank}
                            </span>
                          )}
                          {rotatable && (
                            <button
                              type="button"
                              className="loaded-freight-rotate"
                              draggable={false}
                              title="Rotate freight 90°"
                              aria-label={`Rotate ${freight.label} 90 degrees`}
                              onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
                              onClick={(clickEvent) => {
                                clickEvent.stopPropagation()
                                rotatePlacedFreight(freightId)
                              }}
                            >
                              ↻ <span>R</span>
                            </button>
                          )}
                          <span className="loaded-freight-grip" aria-hidden="true">MOVE</span>
                        </div>
                      )
                    })}
              </div>
            </TrailerShell>
          </div>

          <div className="dock-load-rear">
            <button
              type="button"
              className={[
                'dock-load-doors',
                evaluation.ready ? 'ready' : evaluation.canCommit ? 'discrepancy' : '',
                doorsClosing ? 'closing' : '',
              ].filter(Boolean).join(' ')}
              onClick={commit}
              disabled={!evaluation.canCommit || doorsClosing}
              aria-label={evaluation.ready
                ? 'Close trailer doors and commit load plan'
                : evaluation.canCommit
                  ? 'Close trailer doors with pickup discrepancies'
                  : 'Load plan is not safe to commit'}
            >
              <i />
              <i />
              <b>
                {doorsClosing
                  ? 'SENDING PLAN…'
                  : evaluation.ready
                    ? 'CLOSE DOORS'
                    : evaluation.canCommit
                      ? discrepancyArmed
                        ? 'CONFIRM DEPARTURE'
                        : 'CLOSE WITH DISCREPANCY'
                      : 'PLAN NOT READY'}
              </b>
            </button>
          </div>
        </div>
      </section>

      <aside className="dock-load-hud">
        <section className="dock-load-summary">
          <header>
            <span>LOAD SUMMARY</span>
            <strong>{event.loadRef}</strong>
          </header>

          <div className="dock-load-summary-route">
            <div>
              <span>PICKUP</span>
              <strong>{event.locationLabel}</strong>
            </div>
            <i aria-hidden="true">→</i>
            <div>
              <span>DESTINATION</span>
              <strong>{event.deliveryLocationLabel ?? 'Booked destination'}</strong>
            </div>
          </div>

          <div className="dock-load-summary-meta">
            <div>
              <span>EXPECTED</span>
              <strong>
                {event.freight?.pallets ?? 0} units · {pounds(event.freight?.weightLbs)} lb
              </strong>
            </div>
            <div>
              <span>ALREADY ONBOARD</span>
              <strong>
                {carriedCargo.freight.length > 0
                  ? `${carriedCargo.freight.length} units · ${carriedLoadRefs.join(', ')}`
                  : 'Trailer empty'}
              </strong>
            </div>
          </div>
        </section>

        <section
          className={[
            'dock-load-completion',
            remainingPickupUnits === 0 ? 'complete' : '',
          ].filter(Boolean).join(' ')}
        >
          <header>
            <span>LOAD COMPLETION</span>
            <strong>
              {evaluation.plannedExpectedCount} / {evaluation.expectedCount} LOADED
            </strong>
          </header>
          <div
            className="dock-load-progress"
            aria-label={`${evaluation.plannedExpectedCount} of ${evaluation.expectedCount} booked units loaded`}
          >
            <i
              style={{
                width: `${evaluation.expectedCount > 0
                  ? Math.min(100, (evaluation.plannedExpectedCount / evaluation.expectedCount) * 100)
                  : 0}%`,
              }}
            />
          </div>
        </section>

        <section className="dock-load-status dock-load-status-compact">
          <header>
            <span>TRAILER</span>
            <strong>
              {evaluation.occupiedCells}/{board.usableCells} positions
              <i>·</i>
              {pounds(evaluation.plannedWeightLbs)}/{pounds(board.maxWeightLbs)} lb
              <i>·</i>
              {evaluation.onboardCount} units
            </strong>
          </header>
        </section>

        <section
          className={[
            'dock-load-rules',
            'dock-load-rules-compact',
            blockingRuleCount > 0 ? 'attention' : '',
            blockingRuleCount === 0 && anyRuleMonitoring ? 'monitoring' : '',
          ].filter(Boolean).join(' ')}
        >
          <header>
            <span>TRAILER RULES</span>
            <strong>{trailerRuleSummary}</strong>
          </header>

          <div className="dock-load-rule-list">
            <article
              className={[
                'dock-load-rule-row',
                deliveryNeedsAction ? 'blocked' : 'healthy',
              ].filter(Boolean).join(' ')}
            >
              <header>
                <div>
                  <i aria-hidden="true">{deliveryNeedsAction ? '!' : '✓'}</i>
                  <strong>DELIVERY ACCESS</strong>
                </div>
                <b>{deliveryRuleStatus}</b>
              </header>

              <div className="dock-load-rule-summary">
                <span>Unload order</span>
                <strong>
                  {deliveryOrder.length > 0
                    ? deliveryOrder
                        .map((stop) => `D${stop.rank} ${stop.loadRef}`)
                        .join(' → ')
                    : 'No scheduled delivery order'}
                </strong>
              </div>

              {deliveryNeedsAction && (
                <div className="dock-load-rule-detail">
                  <div>
                    <span>PROBLEM</span>
                    <strong>
                      {deliveryConflict
                        ? `${deliveryConflict.blockedLoadRef} is blocked by ${deliveryConflict.blockingLoadRef}.`
                        : 'Earlier-delivery freight is buried behind later freight.'}
                    </strong>
                  </div>
                  <div>
                    <span>FIX</span>
                    <strong>
                      {deliveryConflict
                        ? `Move ${deliveryConflict.blockedLoadRef} closer to the rear doors.`
                        : 'Move the earlier delivery rearward.'}
                    </strong>
                  </div>
                </div>
              )}
            </article>

            <article
              className={[
                'dock-load-rule-row',
                'weight',
                balanceNeedsAction ? 'blocked' : '',
                balanceMonitoring ? 'live' : '',
                !balanceNeedsAction && !balanceMonitoring ? 'healthy' : '',
              ].filter(Boolean).join(' ')}
            >
              <header>
                <div>
                  <i aria-hidden="true">{balanceNeedsAction ? '!' : balanceMonitoring ? '•' : '✓'}</i>
                  <strong>WEIGHT BALANCE</strong>
                </div>
                <b>{balanceRuleStatus}</b>
              </header>

              <div className="dock-load-rule-summary balance">
                <span>
                  F/R <strong>{weightBalance?.frontPercent ?? 50}/{weightBalance?.rearPercent ?? 50}</strong>
                </span>
                <span>
                  L/R <strong>{weightBalance?.leftPercent ?? 50}/{weightBalance?.rightPercent ?? 50}</strong>
                </span>
                <small>
                  {!weightBalance?.active
                    ? `Advisory below ${pounds(weightBalance?.activationWeightLbs)} lb`
                    : balanceMonitoring
                      ? 'Live while loading'
                      : 'Target 35–65'}
                </small>
              </div>

              {balanceNeedsAction && (
                <div className="dock-load-rule-detail">
                  <div>
                    <span>PROBLEM</span>
                    <strong>{balanceIssueLabel}</strong>
                  </div>
                  <div>
                    <span>FIX</span>
                    <strong>{balanceFixText}</strong>
                  </div>
                </div>
              )}
            </article>

            <article
              className={[
                'dock-load-rule-row',
                'fragile',
                fragileNeedsAction ? 'blocked' : '',
                fragileMonitoring ? 'live' : '',
                !fragileNeedsAction && !fragileMonitoring ? 'healthy' : '',
              ].filter(Boolean).join(' ')}
            >
              <header>
                <div>
                  <i aria-hidden="true">{fragileNeedsAction ? '!' : fragileMonitoring ? '•' : '✓'}</i>
                  <strong>FRAGILE PROTECTION</strong>
                </div>
                <b>{fragileRuleStatus}</b>
              </header>

              <div className="dock-load-rule-summary">
                <span>Spacing</span>
                <strong>
                  {fragileMonitoring
                    ? 'Live while loading'
                    : fragileNeedsAction
                      ? 'Conflict detected'
                      : fragileProtection?.active
                        ? 'Fragile clear of HEAVY / OVERSIZE'
                        : 'No active conflict pair'}
                </strong>
              </div>

              {fragileNeedsAction && (
                <div className="dock-load-rule-detail">
                  <div>
                    <span>PROBLEM</span>
                    <strong>
                      {fragileConflict
                        ? `${fragileConflict.fragileLabel} is beside ${fragileConflict.riskLabel}.`
                        : 'Fragile freight is directly beside heavy-impact cargo.'}
                    </strong>
                  </div>
                  <div>
                    <span>FIX</span>
                    <strong>
                      {fragileConflict
                        ? `Separate ${fragileConflict.fragileLabel} from ${fragileConflict.riskLabel}.`
                        : 'Move the conflicting freight apart.'}
                    </strong>
                  </div>
                </div>
              )}
            </article>

            <article
              className={[
                'dock-load-rule-row',
                'hazmat',
                hazmatNeedsAction ? 'blocked' : '',
                hazmatMonitoring ? 'live' : '',
                !hazmatNeedsAction && !hazmatMonitoring ? 'healthy' : '',
              ].filter(Boolean).join(' ')}
            >
              <header>
                <div>
                  <i aria-hidden="true">{hazmatNeedsAction ? '!' : hazmatMonitoring ? '•' : '✓'}</i>
                  <strong>HAZMAT SEGREGATION</strong>
                </div>
                <b>{hazmatRuleStatus}</b>
              </header>

              <div className="dock-load-rule-summary">
                <span>Classes</span>
                <strong>
                  {onboardHazmatClasses.length > 0
                    ? onboardHazmatClasses.map((classCode) => `Class ${classCode}`).join(' + ')
                    : 'No classified hazmat onboard'}
                </strong>
              </div>

              {hazmatNeedsAction && (
                <div className="dock-load-rule-detail">
                  <div>
                    <span>PROBLEM</span>
                    <strong>
                      {hazmatConflict
                        ? `Class ${hazmatConflict.firstClassCode} is directly beside Class ${hazmatConflict.secondClassCode}.`
                        : 'Incompatible hazmat classes are too close together.'}
                    </strong>
                  </div>
                  <div>
                    <span>FIX</span>
                    <strong>
                      {hazmatConflict
                        ? `Separate ${hazmatConflict.firstLabel} from ${hazmatConflict.secondLabel} by at least one floor position.`
                        : 'Separate the incompatible hazmat freight.'}
                    </strong>
                  </div>
                </div>
              )}
            </article>
          </div>
        </section>

        {evaluation.ready ? (
          <section className="dock-load-actions ready dock-load-ready-strip">
            <strong>READY TO CLOSE</strong>
            <span>Booked freight accounted for · trailer rules clear</span>
          </section>
        ) : evaluation.canCommit && evaluation.discrepancies.length > 0 ? (
          <section className="dock-load-actions discrepancy">
            <header>
              <span>PICKUP DISCREPANCIES</span>
              <strong>{evaluation.discrepancies.length} OPEN</strong>
            </header>
            <div className="dock-load-action-list">
              {evaluation.discrepancies.map((issue) => (
                <div className="dock-load-action-card warning" key={issue.code}>
                  <strong>{issue.code.replaceAll('_', ' ')}</strong>
                  <small>{issue.message}</small>
                </div>
              ))}
            </div>
            <footer>
              <strong>{discrepancyArmed ? 'DEPARTURE CONFIRMATION ARMED' : 'YOU CAN DEPART, BUT THE DISCREPANCY WILL FOLLOW THE LOAD'}</strong>
              <small>
                {discrepancyArmed
                  ? 'Click CONFIRM DEPARTURE to leave with the current freight reality.'
                  : 'Close the doors once to review the exception, then confirm if you intentionally want to depart.'}
              </small>
            </footer>
          </section>
        ) : (
          <section className="dock-load-actions attention">
            <header>
              <span>REQUIRED ACTION</span>
            </header>

            <div className="dock-load-action-list">
              {facilityMissingUnits > 0 && (
                <div className="dock-load-action-card warning">
                  <strong>FACILITY SHORT TENDER</strong>
                  <small>
                    {facilityMissingUnits} booked unit{facilityMissingUnits === 1 ? ' is' : 's are'} not physically staged at this pickup.
                  </small>
                </div>
              )}

              {remainingPickupUnits > 0 && (
                <div className="dock-load-action-card pending">
                  <strong>LOAD REMAINING FREIGHT</strong>
                  <small>
                    {remainingPickupUnits} {event.loadRef} unit{remainingPickupUnits === 1 ? '' : 's'} still need to be loaded.
                  </small>
                </div>
              )}

              {otherActionErrors.map((issue) => (
                <div className="dock-load-action-card error" key={issue.code}>
                  <strong>{issue.code.replaceAll('_', ' ')}</strong>
                  <small>{issue.message}</small>
                </div>
              ))}

              {remainingPickupUnits === 0 && blockingRuleCount > 0 && (
                <div className="dock-load-action-card error">
                  <strong>RESOLVE TRAILER RULES</strong>
                  <small>
                    {blockingRuleCount} trailer rule{blockingRuleCount === 1 ? '' : 's'} need attention above before you can close the doors.
                  </small>
                </div>
              )}

              {wrongLoadUnits > 0 && (
                <div className="dock-load-action-card warning">
                  <strong>WRONG LOAD ONBOARD</strong>
                  <small>{wrongLoadUnits} mismatched unit{wrongLoadUnits === 1 ? ' is' : 's are'} currently on the trailer.</small>
                </div>
              )}

              {undocumentedDamageUnits > 0 && (
                <div className="dock-load-action-card warning">
                  <strong>DAMAGE NOT DOCUMENTED</strong>
                  <small>{undocumentedDamageUnits} visibly damaged unit{undocumentedDamageUnits === 1 ? ' is' : 's are'} loaded without a pickup damage note.</small>
                </div>
              )}

              {evaluation.warnings.map((issue) => (
                <div className="dock-load-action-card warning" key={issue.code}>
                  <strong>{issue.code.replaceAll('_', ' ')}</strong>
                  <small>{issue.message}</small>
                </div>
              ))}
            </div>
          </section>
        )}

        {(invalidDropReason || dragFreightId || hoverFreightId) && (
          <div className="dock-load-interaction-status" aria-live="polite">
            {invalidDropReason === 'OVERLAP' && 'That space is already occupied.'}
            {invalidDropReason === 'OUT_OF_BOUNDS' && 'That freight does not fit there.'}
            {dragFreightId && 'R rotates the freight in hand. Drag current-pickup cargo back to the manifest to stage it again.'}
            {!dragFreightId && hoverFreightId && 'Press R or use the rotate control to turn this freight before moving it.'}
          </div>
        )}
      </aside>
    </div>
  )
}
