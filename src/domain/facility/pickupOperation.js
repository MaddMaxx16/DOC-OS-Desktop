export const PICKUP_OPERATION_STATUS = Object.freeze({
  DOCK_ASSIGNED: 'dock-assigned',
  LOAD_PLANNING: 'load-planning',
  PLAN_COMMITTED: 'plan-committed',
  LOADING: 'loading',
  LOADED: 'loaded',
})

const SHAPE_LIBRARY = Object.freeze([
  Object.freeze({ id: 'standard', cells: Object.freeze([[0, 0]]) }),
  Object.freeze({ id: 'standard-alt', cells: Object.freeze([[0, 0]]) }),
  Object.freeze({ id: 'long', cells: Object.freeze([[0, 0], [0, 1]]) }),
  Object.freeze({ id: 'wide', cells: Object.freeze([[0, 0], [1, 0]]) }),
  Object.freeze({ id: 'l-overhang', cells: Object.freeze([[0, 0], [0, 1], [1, 1]]) }),
  Object.freeze({ id: 'block', cells: Object.freeze([[0, 0], [1, 0], [0, 1], [1, 1]]) }),
])

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function facilityOperationKey(driverId, eventId) {
  return `${driverId}:${eventId}`
}

export function dockNumberForPickup(event = {}) {
  const source = String(event.loadRef ?? event.loadId ?? event.id ?? 'dock')
  let hash = 0

  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash * 31) + source.charCodeAt(index)) >>> 0
  }

  return 8 + (hash % 9)
}

export function facilityOperationForEvent(
  facilityOperations = {},
  driverId,
  eventId,
) {
  return facilityOperations[facilityOperationKey(driverId, eventId)] ?? null
}

export function pickupPlanCommitted(operation = null) {
  return [
    PICKUP_OPERATION_STATUS.PLAN_COMMITTED,
    PICKUP_OPERATION_STATUS.LOADING,
    PICKUP_OPERATION_STATUS.LOADED,
  ].includes(operation?.status)
}

export function buildTrailerPuzzleBoard(equipment = {}) {
  const capacityPallets = Math.max(1, finite(equipment.capacityPallets, 26))
  const maxWeightLbs = Math.max(1, finite(equipment.maxWeightLbs, 44000))
  const columns = capacityPallets >= 18
    ? 4
    : capacityPallets >= 8
      ? 3
      : capacityPallets >= 4
        ? 2
        : 1
  const rows = Math.ceil(capacityPallets / columns)
  const usableCells = capacityPallets
  const totalCells = rows * columns

  return {
    label: equipment.label ?? "53' Dry Van",
    capacityPallets,
    maxWeightLbs,
    columns,
    rows,
    usableCells,
    totalCells,
    disabledCellCount: totalCells - usableCells,
  }
}

function palletWeight(totalWeightLbs, palletCount) {
  if (!palletCount) return 0
  return Math.max(1, Math.round(Number(totalWeightLbs ?? 0) / palletCount))
}

function destinationLabel(event = {}) {
  return event.deliveryLocationLabel
    ?? event.destinationLabel
    ?? event.locationLabel
    ?? 'Booked destination'
}

function shapeForIndex(index, expected = true) {
  if (!expected) return SHAPE_LIBRARY[4]

  const tutorialPattern = [
    SHAPE_LIBRARY[0],
    SHAPE_LIBRARY[1],
    SHAPE_LIBRARY[2],
    SHAPE_LIBRARY[0],
    SHAPE_LIBRARY[3],
    SHAPE_LIBRARY[0],
    SHAPE_LIBRARY[4],
    SHAPE_LIBRARY[0],
  ]

  return tutorialPattern[index % tutorialPattern.length]
}

export function buildTutorialStagedFreight(event = {}) {
  const palletCount = Math.max(1, Number(event.freight?.pallets ?? 1))
  const weightEach = palletWeight(event.freight?.weightLbs, palletCount)
  const loadRef = event.loadRef ?? event.loadId ?? 'LOAD'
  const destination = destinationLabel(event)

  const expected = Array.from({ length: palletCount }, (_, index) => {
    const shape = shapeForIndex(index, true)

    return {
      id: `${event.id}:pallet-${index + 1}`,
      label: `Pallet ${index + 1}`,
      loadRef,
      pickupNumber: loadRef,
      destination,
      commodity: 'Booked freight',
      weightLbs: weightEach,
      stackable: index % 4 !== 3,
      maxStack: index % 4 !== 3 ? 2 : 1,
      expected: true,
      shapeId: shape.id,
      shape: shape.cells.map(([x, y]) => [x, y]),
    }
  })

  const noiseShape = shapeForIndex(0, false)
  const noise = {
    id: `${event.id}:noise-1`,
    label: 'Pallet X',
    loadRef: `${loadRef}-ALT`,
    pickupNumber: `${loadRef}-ALT`,
    destination: 'Albany, NY',
    commodity: 'Unrelated staged freight',
    weightLbs: Math.max(450, Math.round(weightEach * 0.9)),
    stackable: true,
    maxStack: 2,
    expected: false,
    shapeId: noiseShape.id,
    shape: noiseShape.cells.map(([x, y]) => [x, y]),
  }

  return [...expected, noise]
}

function normalizeShape(cells = []) {
  const minX = Math.min(...cells.map(([x]) => x))
  const minY = Math.min(...cells.map(([, y]) => y))
  return cells
    .map(([x, y]) => [x - minX, y - minY])
    .sort(([ax, ay], [bx, by]) => ay - by || ax - bx)
}

export function rotateFreightShape(shape = [], quarterTurns = 0) {
  let cells = shape.map(([x, y]) => [x, y])
  const turns = ((Number(quarterTurns) % 4) + 4) % 4

  for (let turn = 0; turn < turns; turn += 1) {
    cells = cells.map(([x, y]) => [-y, x])
  }

  return normalizeShape(cells)
}

export function boardCellCoordinates(board, cellIndex) {
  return {
    x: cellIndex % board.columns,
    y: Math.floor(cellIndex / board.columns),
  }
}

export function boardCellIndex(board, x, y) {
  if (x < 0 || x >= board.columns || y < 0 || y >= board.rows) return null
  const index = (y * board.columns) + x
  return index < board.usableCells ? index : null
}

export function footprintCellIndexes({
  board,
  freight,
  anchorCell,
  rotation = 0,
} = {}) {
  if (!board || !freight || !Number.isInteger(Number(anchorCell))) return null

  const anchor = boardCellCoordinates(board, Number(anchorCell))
  const shape = rotateFreightShape(freight.shape, rotation)
  const indexes = []

  for (const [dx, dy] of shape) {
    const index = boardCellIndex(board, anchor.x + dx, anchor.y + dy)
    if (index == null) return null
    indexes.push(index)
  }

  return indexes
}

export function placementMap({
  board,
  stagedFreight = [],
  placements = {},
} = {}) {
  const byId = new Map(stagedFreight.map((freight) => [freight.id, freight]))
  const occupied = new Map()
  const invalid = new Set()
  const collisions = new Set()

  for (const [freightId, placement] of Object.entries(placements)) {
    const freight = byId.get(freightId)
    const cells = footprintCellIndexes({
      board,
      freight,
      anchorCell: placement?.anchorCell,
      rotation: placement?.rotation ?? 0,
    })

    if (!cells) {
      invalid.add(freightId)
      continue
    }

    for (const cell of cells) {
      if (occupied.has(cell)) {
        collisions.add(freightId)
        collisions.add(occupied.get(cell))
      } else {
        occupied.set(cell, freightId)
      }
    }
  }

  return { occupied, invalid, collisions }
}

export function canPlaceFreight({
  board,
  stagedFreight = [],
  placements = {},
  freightId,
  anchorCell,
  rotation = 0,
} = {}) {
  const freight = stagedFreight.find((item) => item.id === freightId)
  const cells = footprintCellIndexes({
    board,
    freight,
    anchorCell,
    rotation,
  })

  if (!cells) {
    return { valid: false, reason: 'OUT_OF_BOUNDS', cells: [] }
  }

  const otherPlacements = Object.fromEntries(
    Object.entries(placements).filter(([id]) => id !== freightId),
  )
  const map = placementMap({
    board,
    stagedFreight,
    placements: otherPlacements,
  })
  const collision = cells.some((cell) => map.occupied.has(cell))

  return {
    valid: !collision,
    reason: collision ? 'OVERLAP' : null,
    cells,
  }
}

export function evaluatePickupLoadPlan({
  event,
  board,
  stagedFreight = [],
  verifiedIds = [],
  placements = {},
} = {}) {
  const verified = new Set(verifiedIds)
  const placed = new Set(Object.keys(placements))
  const expectedFreight = stagedFreight.filter((item) => item.expected)
  const expectedIds = new Set(expectedFreight.map((item) => item.id))
  const wrongPlaced = stagedFreight.filter((item) => (
    !item.expected && placed.has(item.id)
  ))
  const missingVerified = expectedFreight.filter((item) => !verified.has(item.id))
  const missingPlaced = expectedFreight.filter((item) => !placed.has(item.id))
  const map = placementMap({ board, stagedFreight, placements })

  const errors = []
  const warnings = []

  if (missingVerified.length > 0) {
    errors.push({
      code: 'REQUIRED_FREIGHT_UNRESOLVED',
      message: `${missingVerified.length} expected pallet${missingVerified.length === 1 ? '' : 's'} not verified.`,
    })
  }

  if (missingPlaced.length > 0) {
    errors.push({
      code: 'REQUIRED_FREIGHT_NOT_PLANNED',
      message: `${missingPlaced.length} expected pallet${missingPlaced.length === 1 ? '' : 's'} not placed.`,
    })
  }

  if (wrongPlaced.length > 0) {
    errors.push({
      code: 'WRONG_LOAD',
      message: `${wrongPlaced.length} unrelated pallet${wrongPlaced.length === 1 ? '' : 's'} included in trailer plan.`,
    })
  }

  if (map.invalid.size > 0) {
    errors.push({
      code: 'FREIGHT_OUT_OF_BOUNDS',
      message: `${map.invalid.size} freight piece${map.invalid.size === 1 ? '' : 's'} does not fit inside this trailer.`,
    })
  }

  if (map.collisions.size > 0) {
    errors.push({
      code: 'FREIGHT_OVERLAP',
      message: `${map.collisions.size} freight piece${map.collisions.size === 1 ? '' : 's'} overlap another piece.`,
    })
  }

  const unverifiedPlaced = stagedFreight.filter((item) => (
    placed.has(item.id) && !verified.has(item.id)
  ))
  if (unverifiedPlaced.length > 0) {
    warnings.push({
      code: 'UNVERIFIED_PLACEMENT',
      message: `${unverifiedPlaced.length} placed unit${unverifiedPlaced.length === 1 ? '' : 's'} still unverified.`,
    })
  }

  const plannedWeightLbs = stagedFreight
    .filter((item) => placed.has(item.id))
    .reduce((sum, item) => sum + Number(item.weightLbs ?? 0), 0)

  const maxWeightLbs = Math.max(1, finite(board?.maxWeightLbs, 44000))
  if (plannedWeightLbs > maxWeightLbs) {
    errors.push({
      code: 'TRAILER_OVERWEIGHT',
      message: `Planned trailer weight is ${Math.round(plannedWeightLbs - maxWeightLbs).toLocaleString()} lb over this trailer's freight limit.`,
    })
  }

  return {
    ready: errors.length === 0,
    errors,
    warnings,
    expectedCount: expectedIds.size,
    verifiedExpectedCount: expectedFreight.filter((item) => verified.has(item.id)).length,
    plannedExpectedCount: expectedFreight.filter((item) => placed.has(item.id)).length,
    plannedCount: placed.size,
    occupiedCells: map.occupied.size,
    plannedWeightLbs,
    loadRef: event?.loadRef ?? event?.loadId ?? null,
  }
}

export function commitPickupOperation({
  driverId,
  event,
  loadPlan,
  currentAbsoluteMinutes,
} = {}) {
  if (!driverId || !event?.id) {
    throw new Error('Pickup operation requires a driver and freight event.')
  }

  return {
    key: facilityOperationKey(driverId, event.id),
    driverId,
    eventId: event.id,
    loadId: event.loadId ?? null,
    loadRef: event.loadRef ?? event.loadId ?? null,
    facilityId: event.locationId ?? null,
    dock: dockNumberForPickup(event),
    status: PICKUP_OPERATION_STATUS.PLAN_COMMITTED,
    planCommittedTime: Number(currentAbsoluteMinutes ?? 0),
    loadingStartMinutes: Number(currentAbsoluteMinutes ?? 0),
    loadingDurationMinutes: Math.max(1, Number(event.serviceMinutes ?? 12)),
    loadPlan,
  }
}
