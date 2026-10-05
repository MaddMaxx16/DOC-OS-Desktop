import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  buildDeliveryAccessOrder,
  buildOnboardCargoForPickup,
  buildTrailerPuzzleBoard,
  buildTutorialStagedFreight,
  canPlaceFreight,
  dockNumberForPickup,
  evaluatePickupLoadPlan,
  evaluateTrailerDeliveryAccess,
  placementMap,
  rotateFreightShape,
} from '../../domain/facility/pickupOperation.js'
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
        <small>{freight.handlingLabel} · {pounds(freight.weightLbs)} lb</small>
        <small>{freight.destination}</small>
      </div>

      <div className="pallet-piece-actions">
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
  const stagedFreight = useMemo(
    () => buildTutorialStagedFreight(event),
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
    () => stagedFreight.filter((freight) => freight.expected).map((freight) => freight.id),
    [stagedFreight],
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
  const [hoverCell, setHoverCell] = useState(null)
  const [rotatingFreightId, setRotatingFreightId] = useState(null)
  const [settlingFreightId, setSettlingFreightId] = useState(null)
  const [invalidDropReason, setInvalidDropReason] = useState(null)
  const [readyPulse, setReadyPulse] = useState(false)
  const [doorsClosing, setDoorsClosing] = useState(false)
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

  useEffect(() => {
    if (!dragFreightId) return undefined

    const rotateDraggedFreight = (keyboardEvent) => {
      if (keyboardEvent.key.toLowerCase() !== 'r' || keyboardEvent.repeat) return
      keyboardEvent.preventDefault()

      setRotations((current) => ({
        ...current,
        [dragFreightId]: ((current[dragFreightId] ?? 0) + 1) % 4,
      }))
      setRotatingFreightId(dragFreightId)

      if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current)
      rotateTimerRef.current = setTimeout(() => setRotatingFreightId(null), 170)
    }

    window.addEventListener('keydown', rotateDraggedFreight)
    return () => window.removeEventListener('keydown', rotateDraggedFreight)
  }, [dragFreightId])

  const evaluation = useMemo(
    () => evaluatePickupLoadPlan({
      event,
      board,
      stagedFreight: allFreight,
      placements,
      requiredFreightIds,
      deliveryOrder,
    }),
    [allFreight, board, deliveryOrder, event, placements, requiredFreightIds],
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
  const nonAccessErrors = evaluation.errors.filter(
    (issue) => issue.code !== 'DELIVERY_ACCESS_BLOCKED',
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
    setRotations((current) => ({
      ...current,
      [freightId]: ((current[freightId] ?? 0) + 1) % 4,
    }))
    setRotatingFreightId(freightId)
    if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current)
    rotateTimerRef.current = setTimeout(() => setRotatingFreightId(null), 170)
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
    if (!evaluation.ready || doorsClosing) return
    setDoorsClosing(true)

    closeTimerRef.current = setTimeout(() => {
      const placedFreight = allFreight.filter((freight) => placements[freight.id])

      onCommit({
        driverId: driver.id,
        eventId: event.id,
        loadPlan: {
          freightIds: Object.keys(placements),
          freightManifest: placedFreight.map((freight) => ({ ...freight })),
          placements: { ...placements },
          board: { ...board },
          validation: evaluation,
          doorsState: 'closed',
        },
      })
    }, 840)
  }

  const carriedLoadRefs = [...new Set(
    carriedCargo.freight.map((freight) => freight.loadRef).filter(Boolean),
  )]

  return (
    <div
      className={[
        'dock-load-workspace',
        'puzzle-mode',
        evaluation.ready ? 'load-ready' : '',
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
            {board.capacityPallets} pallet positions · Drag onboard freight to reposition it · R rotates the piece in hand.
          </small>
        </header>

        <div className="dock-load-trailer-shell">
          <div className="trailer-view-tabs" aria-label="Trailer views">
            <button type="button" className="active">TRAILER VIEW</button>
            <button type="button" disabled>TOP DOWN</button>
            <button type="button" disabled>SIDE VIEW</button>
          </div>

          <div className="trailer-scene">
            <div className="trailer-visual-shell">
              <div className="trailer-roof">
                <i />
                <i />
                <i />
                <span>{board.label}</span>
              </div>

              <div className="trailer-open-cavity">
                <div className="trailer-side-wall left">
                  <span>53′</span>
                </div>

                <div className="trailer-floor-stage">
                  <div className="trailer-nose-wall">
                    <span>FRONT / NOSE</span>
                  </div>

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

                      return (
                        <button
                          type="button"
                          key={freightId}
                          draggable
                          className={[
                            'loaded-freight-piece',
                            cargoClass(freight),
                            handlingClass(freight),
                            freight.carried ? 'carried-freight' : 'current-pickup-freight',
                            freight.stackable ? 'stackable' : 'no-stack',
                            shape.length > 1 ? 'oversize' : 'standard',
                            settlingFreightId === freightId ? 'settling' : '',
                            dragFreightId === freightId ? 'dragging' : '',
                            deliveryRank === 1 ? 'delivery-next' : '',
                            blockedDeliveryIds.has(freightId) ? 'delivery-blocked' : '',
                            blockingDeliveryIds.has(freightId) ? 'delivery-blocker' : '',
                          ].filter(Boolean).join(' ')}
                          style={{
                            gridColumn: `${anchor.column} / span ${bounds.width}`,
                            gridRow: `${anchor.row} / span ${bounds.height}`,
                            '--piece-columns': bounds.width,
                            '--piece-rows': bounds.height,
                          }}
                          onDragStart={(dragEvent) => {
                            dragEvent.stopPropagation()
                            startDrag(dragEvent, freightId)
                          }}
                          onDragEnd={endDrag}
                          title={`${freight.loadRef} · ${freight.handlingLabel} · drag to reposition · press R while dragging to rotate`}
                          aria-label={`${freight.label}, load ${freight.loadRef}, ${freight.handlingLabel}. Drag to reposition.`}
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
                          {deliveryRank && (
                            <span
                              className="loaded-freight-order"
                              title={deliveryRank === 1 ? 'Next delivery off trailer' : `Delivery order ${deliveryRank}`}
                            >
                              D{deliveryRank}
                            </span>
                          )}
                          <span className="loaded-freight-grip" aria-hidden="true">MOVE</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="trailer-side-wall right">
                  <span>{board.capacityPallets} PLT</span>
                </div>
              </div>

              <div
                className={`trailer-door-commit ${doorsClosing ? 'closing' : ''}`}
                aria-hidden="true"
              >
                <i className="door-panel left" />
                <i className="door-panel right" />
                <strong>LOAD PLAN LOCKED</strong>
                <small>SENDING TO WAREHOUSE</small>
              </div>

              <div className="trailer-rear-frame">
                <div className="trailer-tail-light left" />
                <span>REAR / DOORS</span>
                <div className="trailer-tail-light right" />
              </div>
            </div>
          </div>

          <div className="dock-load-rear">
            <button
              type="button"
              className={[
                'dock-load-doors',
                evaluation.ready ? 'ready' : '',
                doorsClosing ? 'closing' : '',
              ].filter(Boolean).join(' ')}
              onClick={commit}
              disabled={!evaluation.ready || doorsClosing}
              aria-label={evaluation.ready ? 'Close trailer doors and commit load plan' : 'Load plan is not ready'}
            >
              <i />
              <i />
              <b>{doorsClosing ? 'SENDING PLAN…' : evaluation.ready ? 'CLOSE DOORS' : 'PLAN NOT READY'}</b>
            </button>
          </div>
        </div>
      </section>

      <aside className="dock-load-hud">
        <section className="dock-load-booked">
          <header>
            <span>BOOKED LOAD</span>
            <strong>{event.loadRef}</strong>
          </header>
          <div>
            <span>DRIVER</span>
            <strong>{driver.name}</strong>
          </div>
          <div>
            <span>TRAILER</span>
            <strong>{board.label} · {board.capacityPallets} pallet cap</strong>
          </div>
          {carriedCargo.freight.length > 0 && (
            <div>
              <span>ALREADY ONBOARD</span>
              <strong>
                {carriedCargo.freight.length} units · {carriedLoadRefs.join(', ')}
              </strong>
            </div>
          )}
          <div>
            <span>PICKUP</span>
            <strong>{event.locationLabel}</strong>
          </div>
          <div>
            <span>DESTINATION</span>
            <strong>{event.deliveryLocationLabel ?? 'Booked destination'}</strong>
          </div>
          <div>
            <span>EXPECTED</span>
            <strong>{event.freight?.pallets ?? 0} units · {pounds(event.freight?.weightLbs)} lb</strong>
          </div>
        </section>

        <section
          className={[
            'dock-load-readiness',
            evaluation.ready ? 'ready' : '',
            readyPulse ? 'pulse' : '',
          ].filter(Boolean).join(' ')}
        >
          <header>
            <span>LOAD PLAN</span>
            <strong>{evaluation.ready ? 'READY' : 'INCOMPLETE'}</strong>
          </header>

          <div className="dock-load-hud-grid">
            <div>
              <span>FLOOR SLOTS</span>
              <strong>{evaluation.occupiedCells} / {board.usableCells}</strong>
            </div>
            <div>
              <span>WEIGHT</span>
              <strong>{pounds(evaluation.plannedWeightLbs)} / {pounds(board.maxWeightLbs)}</strong>
            </div>
            <div>
              <span>ONBOARD UNITS</span>
              <strong>{evaluation.onboardCount}</strong>
            </div>
            <div>
              <span>THIS PICKUP</span>
              <strong>{evaluation.plannedExpectedCount} / {evaluation.expectedCount}</strong>
            </div>
          </div>

          <div
            className={[
              'dock-load-trailer-rule',
              evaluation.deliveryAccess?.clear ? 'clear' : 'blocked',
            ].filter(Boolean).join(' ')}
          >
            <header>
              <span>DELIVERY ACCESS</span>
              <strong>{evaluation.deliveryAccess?.clear ? 'CLEAR' : 'BLOCKED'}</strong>
            </header>
            <div className="dock-load-delivery-order" aria-label="Trailer unload order">
              {deliveryOrder.length > 0 ? deliveryOrder.map((stop) => (
                <span
                  key={stop.deliveryEventId ?? `${stop.loadRef}:${stop.rank}`}
                  className={stop.rank === 1 ? 'next' : ''}
                  title={stop.destination}
                >
                  <b>D{stop.rank}</b>
                  <strong>{stop.loadRef}</strong>
                </span>
              )) : (
                <span className="empty">NO DELIVERY ORDER</span>
              )}
            </div>
            <small>
              {evaluation.deliveryAccess?.clear
                ? deliveryOrder.length > 1
                  ? 'Earlier deliveries have a clear path to the rear doors.'
                  : 'Only one delivery is currently onboard; rear-door access is clear.'
                : evaluation.deliveryAccess?.pairSummaries?.[0]
                  ? `${evaluation.deliveryAccess.pairSummaries[0].blockedLoadRef} unloads before ${evaluation.deliveryAccess.pairSummaries[0].blockingLoadRef}. Move the earlier load rearward.`
                  : 'Earlier-delivery freight is buried behind later freight.'}
            </small>
          </div>

          <div className="dock-load-validation">
            {nonAccessErrors.length === 0
              && evaluation.warnings.length === 0
              && evaluation.deliveryAccess?.clear ? (
              <div className="ok">
                <strong>LOAD PLAN READY</strong>
                <small>Close the rear doors to send this plan to the warehouse.</small>
              </div>
            ) : (
              <>
                {nonAccessErrors.map((issue) => (
                  <div className="error" key={issue.code}>
                    <strong>{issue.code.replaceAll('_', ' ')}</strong>
                    <small>{issue.message}</small>
                  </div>
                ))}
                {evaluation.warnings.map((issue) => (
                  <div className="warning" key={issue.code}>
                    <strong>{issue.code.replaceAll('_', ' ')}</strong>
                    <small>{issue.message}</small>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="dock-load-interaction-status" aria-live="polite">
            {invalidDropReason === 'OVERLAP' && 'That space is already occupied.'}
            {invalidDropReason === 'OUT_OF_BOUNDS' && 'That freight does not fit there.'}
            {dragFreightId && 'R rotates the freight in hand. Drag current-pickup cargo back to the manifest to stage it again.'}
          </div>
        </section>

        <footer className="dock-load-focus-note">
          <span>FOCUSED MODE</span>
          <strong>World simulation is paused while you build the trailer load plan.</strong>
          <small>Load numbers and handling marks stay visible so placement decisions come from the freight itself.</small>
        </footer>
      </aside>
    </div>
  )
}
