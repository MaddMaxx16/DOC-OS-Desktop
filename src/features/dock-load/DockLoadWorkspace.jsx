import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  buildTrailerPuzzleBoard,
  buildTutorialStagedFreight,
  canPlaceFreight,
  dockNumberForPickup,
  evaluatePickupLoadPlan,
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

function PalletPiece({
  freight,
  rotation,
  verified,
  planned,
  onRotate,
  onVerify,
  onDragStart,
}) {
  const shape = rotateFreightShape(freight.shape, rotation)
  const bounds = shapeBounds(shape)
  const occupied = new Set(shape.map(([x, y]) => `${x}:${y}`))

  return (
    <article
      className={[
        'pallet-piece',
        verified ? 'verified' : '',
        planned ? 'planned' : '',
        freight.expected ? 'expected-piece' : 'noise-piece',
      ].filter(Boolean).join(' ')}
      draggable={!planned}
      onDragStart={(event) => onDragStart(event, freight.id)}
      title={planned ? 'Already planned in trailer' : 'Drag this pallet into the trailer'}
    >
      <div
        className="pallet-piece-shape"
        style={{
          gridTemplateColumns: `repeat(${bounds.width}, 28px)`,
          gridTemplateRows: `repeat(${bounds.height}, 28px)`,
        }}
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
      </div>

      <div className="pallet-piece-copy">
        <div>
          <strong>{freight.label}</strong>
          <span>{freight.loadRef}</span>
        </div>
        <small>{pounds(freight.weightLbs)} lb · {freight.stackable ? `STACK ×${freight.maxStack}` : 'NO STACK'}</small>
        <small>{freight.destination}</small>
      </div>

      <div className="pallet-piece-actions">
        <button
          type="button"
          onClick={onVerify}
          disabled={planned}
          className={verified ? 'active' : ''}
        >
          {verified ? 'VERIFIED' : 'VERIFY'}
        </button>
        <button
          type="button"
          onClick={onRotate}
          disabled={planned}
        >
          ROTATE
        </button>
      </div>
    </article>
  )
}

export default function DockLoadWorkspace({
  driver,
  event,
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
  const [verifiedIds, setVerifiedIds] = useState([])
  const [placements, setPlacements] = useState({})
  const [rotations, setRotations] = useState({})
  const [dragFreightId, setDragFreightId] = useState(null)
  const [hoverCell, setHoverCell] = useState(null)
  const [doorsClosing, setDoorsClosing] = useState(false)
  const closeTimerRef = useRef(null)

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
  }, [])

  const evaluation = useMemo(
    () => evaluatePickupLoadPlan({
      event,
      board,
      stagedFreight,
      verifiedIds,
      placements,
    }),
    [board, event, placements, stagedFreight, verifiedIds],
  )

  const mapped = useMemo(
    () => placementMap({
      board,
      stagedFreight,
      placements,
    }),
    [board, placements, stagedFreight],
  )

  const plannedIds = new Set(Object.keys(placements))
  const dock = dockNumberForPickup(event)
  const draggedFreight = stagedFreight.find((item) => item.id === dragFreightId) ?? null
  const dragRotation = dragFreightId ? rotations[dragFreightId] ?? 0 : 0

  const hoverPlacement = useMemo(() => (
    dragFreightId != null && hoverCell != null
      ? canPlaceFreight({
          board,
          stagedFreight,
          placements,
          freightId: dragFreightId,
          anchorCell: hoverCell,
          rotation: dragRotation,
        })
      : null
  ), [
    board,
    dragFreightId,
    dragRotation,
    hoverCell,
    placements,
    stagedFreight,
  ])

  const previewCells = new Set(hoverPlacement?.cells ?? [])

  const verify = (freightId) => {
    setVerifiedIds((current) => (
      current.includes(freightId)
        ? current.filter((id) => id !== freightId)
        : [...current, freightId]
    ))
  }

  const rotate = (freightId) => {
    setRotations((current) => ({
      ...current,
      [freightId]: ((current[freightId] ?? 0) + 1) % 4,
    }))
  }

  const startDrag = (dragEvent, freightId) => {
    setDragFreightId(freightId)
    setHoverCell(null)
    dragEvent.dataTransfer.setData('text/plain', freightId)
    dragEvent.dataTransfer.effectAllowed = 'move'
  }

  const endDrag = () => {
    setDragFreightId(null)
    setHoverCell(null)
  }

  const placeFreight = (freightId, anchorCell) => {
    const rotation = rotations[freightId] ?? 0
    const result = canPlaceFreight({
      board,
      stagedFreight,
      placements,
      freightId,
      anchorCell,
      rotation,
    })

    if (!result.valid) return

    setPlacements((current) => ({
      ...current,
      [freightId]: {
        anchorCell,
        rotation,
      },
    }))
    setVerifiedIds((current) => (
      current.includes(freightId)
        ? current
        : [...current, freightId]
    ))
    endDrag()
  }

  const removeFreight = (freightId) => {
    setPlacements((current) => {
      const next = { ...current }
      delete next[freightId]
      return next
    })
  }

  const occupantForCell = (cellIndex) => mapped.occupied.get(cellIndex) ?? null

  const commit = () => {
    if (!evaluation.ready || doorsClosing) return
    setDoorsClosing(true)

    closeTimerRef.current = setTimeout(() => {
      onCommit({
        driverId: driver.id,
        eventId: event.id,
        loadPlan: {
          freightIds: Object.keys(placements),
          placements: { ...placements },
          board: { ...board },
          verifiedIds: [...verifiedIds],
          validation: evaluation,
          doorsState: 'closed',
        },
      })
    }, 720)
  }

  return (
    <div className="dock-load-workspace puzzle-mode">
      <aside className="dock-load-staging">
        <header>
          <span>STAGED FREIGHT</span>
          <strong>Dock {dock}</strong>
          <small>
            These are the puzzle pieces. Verify them, rotate them, then drag them into the trailer.
          </small>
        </header>

        <div className="pallet-piece-bin">
          {stagedFreight.map((freight) => (
            <PalletPiece
              key={freight.id}
              freight={freight}
              rotation={rotations[freight.id] ?? 0}
              verified={verifiedIds.includes(freight.id)}
              planned={plannedIds.has(freight.id)}
              onRotate={() => rotate(freight.id)}
              onVerify={() => verify(freight.id)}
              onDragStart={startDrag}
            />
          ))}
        </div>
      </aside>

      <section className="dock-load-trailer-panel">
        <header className="dock-load-trailer-heading">
          <div>
            <span>TRAILER PUZZLE</span>
            <strong>{board.label}</strong>
          </div>
          <small>
            {board.capacityPallets} floor slots · square-slot packing board.
            Rotate oversized pieces to make the load fit.
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
                    className="dock-load-grid puzzle-board"
                    style={{
                      '--board-columns': board.columns,
                      '--board-rows': board.rows,
                    }}
                    onDragLeave={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) {
                        setHoverCell(null)
                      }
                    }}
                  >
                    {Array.from({ length: board.totalCells }, (_, cellIndex) => {
                      const disabled = cellIndex >= board.usableCells
                      const occupantId = occupantForCell(cellIndex)
                      const occupant = stagedFreight.find((item) => item.id === occupantId) ?? null
                      const anchor = occupantId
                        ? placements[occupantId]?.anchorCell === cellIndex
                        : false
                      const preview = previewCells.has(cellIndex)
                      const previewValid = preview && hoverPlacement?.valid
                      const previewInvalid = preview && !hoverPlacement?.valid

                      return (
                        <button
                          type="button"
                          key={cellIndex}
                          className={[
                            'trailer-puzzle-cell',
                            disabled ? 'disabled' : '',
                            occupant ? 'occupied' : '',
                            occupant?.expected === false ? 'wrong-load' : '',
                            anchor ? 'piece-anchor' : '',
                            previewValid ? 'preview-valid' : '',
                            previewInvalid ? 'preview-invalid' : '',
                          ].filter(Boolean).join(' ')}
                          disabled={disabled}
                          onDragOver={(dragEvent) => {
                            if (disabled || !draggedFreight) return
                            dragEvent.preventDefault()
                            dragEvent.dataTransfer.dropEffect = 'move'
                            setHoverCell(cellIndex)
                          }}
                          onDrop={(dragEvent) => {
                            dragEvent.preventDefault()
                            const freightId = dragEvent.dataTransfer.getData('text/plain')
                            if (freightId) placeFreight(freightId, cellIndex)
                          }}
                          onClick={() => occupantId && removeFreight(occupantId)}
                          title={occupant ? `Return ${occupant.label} to staging` : 'Open puzzle cell'}
                        >
                          {occupant && <i className="loaded-cargo-box" />}
                          {anchor && occupant && (
                            <span className="trailer-piece-label">
                              <strong>{occupant.label}</strong>
                              <small>{occupant.loadRef}</small>
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="trailer-side-wall right">
                  <span>{board.capacityPallets} PLT</span>
                </div>
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
              <b>{doorsClosing ? 'LOCKING PLAN…' : evaluation.ready ? 'CLOSE DOORS' : 'PLAN NOT READY'}</b>
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
            <strong>{event.freight?.pallets ?? 0} pallets · {pounds(event.freight?.weightLbs)} lb</strong>
          </div>
        </section>

        <section className="dock-load-readiness">
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
              <span>VERIFIED</span>
              <strong>{evaluation.verifiedExpectedCount} / {evaluation.expectedCount}</strong>
            </div>
            <div>
              <span>PLANNED</span>
              <strong>{evaluation.plannedExpectedCount} / {evaluation.expectedCount}</strong>
            </div>
          </div>

          <div className="dock-load-validation">
            {evaluation.errors.length === 0 && evaluation.warnings.length === 0 ? (
              <div className="ok">
                <strong>LOAD PLAN READY</strong>
                <small>Close the rear doors to send this plan to the warehouse.</small>
              </div>
            ) : (
              <>
                {evaluation.errors.map((issue) => (
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
        </section>

        <footer className="dock-load-focus-note">
          <span>FOCUSED MODE</span>
          <strong>World simulation is paused while you solve the load.</strong>
          <small>Fit the pieces now. Warehouse loading begins only after the trailer doors are closed.</small>
        </footer>
      </aside>
    </div>
  )
}
