export const PICKUP_OPERATION_STATUS = Object.freeze({
  DOCK_ASSIGNED: 'dock-assigned',
  LOAD_PLANNING: 'load-planning',
  PLAN_COMMITTED: 'plan-committed',
  LOADING: 'loading',
  LOADED: 'loaded',
})

const SHAPE_LIBRARY = Object.freeze({
  standard: Object.freeze({ id: 'standard', cells: Object.freeze([[0, 0]]) }),
  'standard-alt': Object.freeze({ id: 'standard-alt', cells: Object.freeze([[0, 0]]) }),
  long: Object.freeze({ id: 'long', cells: Object.freeze([[0, 0], [0, 1]]) }),
  wide: Object.freeze({ id: 'wide', cells: Object.freeze([[0, 0], [1, 0]]) }),
  block: Object.freeze({ id: 'block', cells: Object.freeze([[0, 0], [1, 0], [0, 1], [1, 1]]) }),
})

const FREIGHT_PROFILES = Object.freeze([
  Object.freeze({
    cargoType: 'wrapped-pallet',
    unitName: 'Pallet',
    handlingCode: 'STANDARD',
    handlingLabel: 'STANDARD',
    stackable: true,
    maxStack: 2,
    shapeId: 'standard',
  }),
  Object.freeze({
    cargoType: 'crate',
    unitName: 'Crate',
    handlingCode: 'FRAGILE',
    handlingLabel: 'FRAGILE',
    stackable: false,
    maxStack: 1,
    shapeId: 'standard-alt',
  }),
  Object.freeze({
    cargoType: 'long-skid',
    unitName: 'Long Skid',
    handlingCode: 'HEAVY',
    handlingLabel: 'HEAVY',
    stackable: false,
    maxStack: 1,
    shapeId: 'long',
  }),
  Object.freeze({
    cargoType: 'drum-pallet',
    unitName: 'Drum Pallet',
    handlingCode: 'HAZMAT',
    handlingLabel: 'HAZMAT',
    stackable: false,
    maxStack: 1,
    shapeId: 'standard',
  }),
  Object.freeze({
    cargoType: 'wide-skid',
    unitName: 'Wide Skid',
    handlingCode: 'UPRIGHT',
    handlingLabel: 'KEEP UPRIGHT',
    stackable: false,
    maxStack: 1,
    shapeId: 'wide',
  }),
  Object.freeze({
    cargoType: 'wrapped-pallet',
    unitName: 'Pallet',
    handlingCode: 'NO_STACK',
    handlingLabel: 'NO STACK',
    stackable: false,
    maxStack: 1,
    shapeId: 'standard-alt',
  }),
  Object.freeze({
    cargoType: 'machinery-crate',
    unitName: 'Machinery Crate',
    handlingCode: 'OVERSIZE',
    handlingLabel: 'OVERSIZE',
    stackable: false,
    maxStack: 1,
    shapeId: 'block',
  }),
  Object.freeze({
    cargoType: 'crate',
    unitName: 'Crate',
    handlingCode: 'FRAGILE',
    handlingLabel: 'FRAGILE',
    stackable: false,
    maxStack: 1,
    shapeId: 'standard',
  }),
])

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function freightProfileForIndex(index, expected = true) {
  if (!expected) {
    return {
      cargoType: 'wrapped-pallet',
      unitName: 'Pallet',
      handlingCode: 'STANDARD',
      handlingLabel: 'STANDARD',
      stackable: true,
      maxStack: 2,
      shapeId: 'standard-alt',
    }
  }

  return FREIGHT_PROFILES[index % FREIGHT_PROFILES.length]
}

function shapeForProfile(profile) {
  return SHAPE_LIBRARY[profile.shapeId] ?? SHAPE_LIBRARY.standard
}

function unitLabel(profile, index) {
  return `${profile.unitName} ${String(index + 1).padStart(2, '0')}`
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

export function buildTutorialStagedFreight(event = {}) {
  const palletCount = Math.max(1, Number(event.freight?.pallets ?? 1))
  const weightEach = palletWeight(event.freight?.weightLbs, palletCount)
  const loadRef = event.loadRef ?? event.loadId ?? 'LOAD'
  const destination = destinationLabel(event)

  const expected = Array.from({ length: palletCount }, (_, index) => {
    const profile = freightProfileForIndex(index, true)
    const shape = shapeForProfile(profile)

    return {
      id: `${event.id}:pallet-${index + 1}`,
      label: unitLabel(profile, index),
      unitCode: `P${String(index + 1).padStart(2, '0')}`,
      loadId: event.loadId ?? loadRef,
      loadRef,
      pickupNumber: loadRef,
      destination,
      commodity: profile.unitName,
      cargoType: profile.cargoType,
      handlingCode: profile.handlingCode,
      handlingLabel: profile.handlingLabel,
      weightLbs: weightEach,
      stackable: profile.stackable,
      maxStack: profile.maxStack,
      expected: true,
      shapeId: shape.id,
      shape: shape.cells.map(([x, y]) => [x, y]),
    }
  })

  const profile = freightProfileForIndex(0, false)
  const shape = shapeForProfile(profile)
  const noise = {
    id: `${event.id}:noise-1`,
    label: 'Pallet 99',
    unitCode: 'P99',
    loadId: `${loadRef}-ALT`,
    loadRef: `${loadRef}-ALT`,
    pickupNumber: `${loadRef}-ALT`,
    destination: 'Albany, NY',
    commodity: 'Staged freight',
    cargoType: profile.cargoType,
    handlingCode: profile.handlingCode,
    handlingLabel: profile.handlingLabel,
    weightLbs: Math.max(450, Math.round(weightEach * 0.9)),
    stackable: profile.stackable,
    maxStack: profile.maxStack,
    expected: false,
    shapeId: shape.id,
    shape: shape.cells.map(([x, y]) => [x, y]),
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

function loadKey(item = {}) {
  return item.loadRef ?? item.loadId ?? null
}

export function buildDeliveryAccessOrder({
  driverDay,
  eventId,
  freight = [],
} = {}) {
  const timeline = driverDay?.timeline ?? []
  const currentIndex = timeline.findIndex((item) => item.id === eventId)
  const remainingTimeline = currentIndex >= 0
    ? timeline.slice(currentIndex + 1)
    : timeline
  const onboardLoadKeys = new Set(
    freight.map((item) => loadKey(item)).filter(Boolean),
  )
  const seen = new Set()
  const order = []

  for (const timelineEvent of remainingTimeline) {
    if (timelineEvent.kind !== 'freight-stop' || timelineEvent.role !== 'delivery') continue

    const key = loadKey(timelineEvent)
    if (!key || seen.has(key)) continue
    if (onboardLoadKeys.size > 0 && !onboardLoadKeys.has(key)) continue

    seen.add(key)
    order.push({
      rank: order.length + 1,
      loadId: timelineEvent.loadId ?? key,
      loadRef: timelineEvent.loadRef ?? key,
      deliveryEventId: timelineEvent.id,
      destination: timelineEvent.locationLabel ?? 'Delivery',
    })
  }

  return order
}

export function evaluateTrailerDeliveryAccess({
  board,
  stagedFreight = [],
  placements = {},
  deliveryOrder = [],
} = {}) {
  const rankByLoad = new Map()
  for (const stop of deliveryOrder) {
    const rank = Number(stop.rank)
    if (!Number.isFinite(rank)) continue
    if (stop.loadId) rankByLoad.set(stop.loadId, rank)
    if (stop.loadRef) rankByLoad.set(stop.loadRef, rank)
  }

  if (!board || rankByLoad.size === 0) {
    return {
      clear: true,
      violations: [],
      blockedFreightIds: [],
      blockingFreightIds: [],
      pairSummaries: [],
    }
  }

  const freightById = new Map(stagedFreight.map((item) => [item.id, item]))
  const placed = []

  for (const [freightId, placement] of Object.entries(placements)) {
    const freight = freightById.get(freightId)
    const rank = rankByLoad.get(loadKey(freight))
    if (!freight || !Number.isFinite(rank)) continue

    const cells = footprintCellIndexes({
      board,
      freight,
      anchorCell: placement?.anchorCell,
      rotation: placement?.rotation ?? 0,
    })
    if (!cells) continue

    placed.push({
      freight,
      rank,
      cells: cells.map((cellIndex) => ({
        cellIndex,
        ...boardCellCoordinates(board, cellIndex),
      })),
    })
  }

  const violations = []
  const violationKeys = new Set()

  for (const earlier of placed) {
    for (const later of placed) {
      if (earlier.rank >= later.rank) continue

      for (const earlierCell of earlier.cells) {
        for (const laterCell of later.cells) {
          if (earlierCell.x !== laterCell.x) continue
          if (laterCell.y <= earlierCell.y) continue

          const key = `${earlier.freight.id}:${later.freight.id}:${earlierCell.x}`
          if (violationKeys.has(key)) continue
          violationKeys.add(key)

          violations.push({
            blockedFreightId: earlier.freight.id,
            blockingFreightId: later.freight.id,
            blockedLoadRef: earlier.freight.loadRef ?? earlier.freight.loadId,
            blockingLoadRef: later.freight.loadRef ?? later.freight.loadId,
            blockedRank: earlier.rank,
            blockingRank: later.rank,
            column: earlierCell.x,
            blockedRow: earlierCell.y,
            blockingRow: laterCell.y,
          })
        }
      }
    }
  }

  const blockedFreightIds = [...new Set(
    violations.map((issue) => issue.blockedFreightId),
  )]
  const blockingFreightIds = [...new Set(
    violations.map((issue) => issue.blockingFreightId),
  )]
  const pairMap = new Map()

  for (const issue of violations) {
    const key = `${issue.blockedLoadRef}:${issue.blockingLoadRef}`
    const current = pairMap.get(key) ?? {
      blockedLoadRef: issue.blockedLoadRef,
      blockingLoadRef: issue.blockingLoadRef,
      count: 0,
    }
    current.count += 1
    pairMap.set(key, current)
  }

  return {
    clear: violations.length === 0,
    violations,
    blockedFreightIds,
    blockingFreightIds,
    pairSummaries: [...pairMap.values()],
  }
}

export function evaluateTrailerWeightBalance({
  board,
  stagedFreight = [],
  placements = {},
} = {}) {
  const totalWeightLbs = stagedFreight
    .filter((freight) => placements[freight.id])
    .reduce((sum, freight) => sum + Number(freight.weightLbs ?? 0), 0)
  const maxWeightLbs = Math.max(1, finite(board?.maxWeightLbs, 44000))
  const activationWeightLbs = Math.round(maxWeightLbs * 0.2)
  const targetMinPercent = 35
  const targetMaxPercent = 65

  if (!board || totalWeightLbs <= 0) {
    return {
      active: false,
      clear: true,
      status: 'LIGHT_LOAD',
      totalWeightLbs,
      activationWeightLbs,
      targetMinPercent,
      targetMaxPercent,
      frontWeightLbs: 0,
      rearWeightLbs: 0,
      leftWeightLbs: 0,
      rightWeightLbs: 0,
      frontPercent: 50,
      rearPercent: 50,
      leftPercent: 50,
      rightPercent: 50,
      issues: [],
    }
  }

  const freightById = new Map(stagedFreight.map((freight) => [freight.id, freight]))
  let frontWeightLbs = 0
  let rearWeightLbs = 0
  let leftWeightLbs = 0
  let rightWeightLbs = 0

  for (const [freightId, placement] of Object.entries(placements)) {
    const freight = freightById.get(freightId)
    if (!freight) continue

    const cells = footprintCellIndexes({
      board,
      freight,
      anchorCell: placement?.anchorCell,
      rotation: placement?.rotation ?? 0,
    })
    if (!cells?.length) continue

    const cellWeight = Number(freight.weightLbs ?? 0) / cells.length

    for (const cellIndex of cells) {
      const { x, y } = boardCellCoordinates(board, cellIndex)
      const horizontalCenter = x + 0.5
      const verticalCenter = y + 0.5
      const horizontalMidpoint = board.columns / 2
      const verticalMidpoint = board.rows / 2

      if (horizontalCenter < horizontalMidpoint) {
        leftWeightLbs += cellWeight
      } else if (horizontalCenter > horizontalMidpoint) {
        rightWeightLbs += cellWeight
      } else {
        leftWeightLbs += cellWeight / 2
        rightWeightLbs += cellWeight / 2
      }

      if (verticalCenter < verticalMidpoint) {
        frontWeightLbs += cellWeight
      } else if (verticalCenter > verticalMidpoint) {
        rearWeightLbs += cellWeight
      } else {
        frontWeightLbs += cellWeight / 2
        rearWeightLbs += cellWeight / 2
      }
    }
  }

  const percent = (weight) => (
    totalWeightLbs > 0
      ? Math.round((weight / totalWeightLbs) * 100)
      : 50
  )

  const frontPercent = percent(frontWeightLbs)
  const rearPercent = 100 - frontPercent
  const leftPercent = percent(leftWeightLbs)
  const rightPercent = 100 - leftPercent
  const active = totalWeightLbs >= activationWeightLbs
  const issues = []

  if (active && frontPercent > targetMaxPercent) {
    issues.push({
      code: 'FRONT_HEAVY',
      label: 'FRONT HEAVY',
      axis: 'longitudinal',
      fix: 'Shift some weight toward the rear doors.',
    })
  } else if (active && frontPercent < targetMinPercent) {
    issues.push({
      code: 'REAR_HEAVY',
      label: 'REAR HEAVY',
      axis: 'longitudinal',
      fix: 'Shift some weight toward the nose.',
    })
  }

  if (active && leftPercent > targetMaxPercent) {
    issues.push({
      code: 'LEFT_HEAVY',
      label: 'LEFT HEAVY',
      axis: 'lateral',
      fix: 'Shift some weight toward the right side.',
    })
  } else if (active && leftPercent < targetMinPercent) {
    issues.push({
      code: 'RIGHT_HEAVY',
      label: 'RIGHT HEAVY',
      axis: 'lateral',
      fix: 'Shift some weight toward the left side.',
    })
  }

  return {
    active,
    clear: !active || issues.length === 0,
    status: !active
      ? 'LIGHT_LOAD'
      : issues.length === 0
        ? 'BALANCED'
        : issues.map((issue) => issue.code).join('+'),
    totalWeightLbs,
    activationWeightLbs,
    targetMinPercent,
    targetMaxPercent,
    frontWeightLbs: Math.round(frontWeightLbs),
    rearWeightLbs: Math.round(rearWeightLbs),
    leftWeightLbs: Math.round(leftWeightLbs),
    rightWeightLbs: Math.round(rightWeightLbs),
    frontPercent,
    rearPercent,
    leftPercent,
    rightPercent,
    issues,
  }
}

export function evaluateTrailerFragileProtection({
  board,
  stagedFreight = [],
  placements = {},
} = {}) {
  const freightById = new Map(stagedFreight.map((freight) => [freight.id, freight]))
  const placed = []

  for (const [freightId, placement] of Object.entries(placements)) {
    const freight = freightById.get(freightId)
    if (!freight) continue

    const cells = footprintCellIndexes({
      board,
      freight,
      anchorCell: placement?.anchorCell,
      rotation: placement?.rotation ?? 0,
    })
    if (!cells?.length) continue

    placed.push({
      freight,
      cells: cells.map((cellIndex) => ({
        cellIndex,
        ...boardCellCoordinates(board, cellIndex),
      })),
    })
  }

  const fragile = placed.filter((item) => item.freight.handlingCode === 'FRAGILE')
  const impactRisk = placed.filter((item) => (
    ['HEAVY', 'OVERSIZE'].includes(item.freight.handlingCode)
  ))
  const conflicts = []
  const seen = new Set()

  for (const fragileItem of fragile) {
    for (const riskItem of impactRisk) {
      for (const fragileCell of fragileItem.cells) {
        for (const riskCell of riskItem.cells) {
          const distance = Math.abs(fragileCell.x - riskCell.x)
            + Math.abs(fragileCell.y - riskCell.y)
          if (distance !== 1) continue

          const key = `${fragileItem.freight.id}:${riskItem.freight.id}`
          if (seen.has(key)) continue
          seen.add(key)

          conflicts.push({
            fragileFreightId: fragileItem.freight.id,
            riskFreightId: riskItem.freight.id,
            fragileLabel: fragileItem.freight.label,
            riskLabel: riskItem.freight.label,
            fragileLoadRef: fragileItem.freight.loadRef ?? fragileItem.freight.loadId,
            riskLoadRef: riskItem.freight.loadRef ?? riskItem.freight.loadId,
            riskHandlingCode: riskItem.freight.handlingCode,
          })
        }
      }
    }
  }

  return {
    active: fragile.length > 0 && impactRisk.length > 0,
    clear: conflicts.length === 0,
    fragileCount: fragile.length,
    impactRiskCount: impactRisk.length,
    conflicts,
    fragileFreightIds: [...new Set(conflicts.map((item) => item.fragileFreightId))],
    riskFreightIds: [...new Set(conflicts.map((item) => item.riskFreightId))],
  }
}

export function evaluatePickupLoadPlan({
  event,
  board,
  stagedFreight = [],
  placements = {},
  requiredFreightIds = null,
  deliveryOrder = [],
} = {}) {
  const placed = new Set(Object.keys(placements))
  const required = requiredFreightIds == null
    ? stagedFreight.filter((item) => item.expected)
    : stagedFreight.filter((item) => requiredFreightIds.includes(item.id))
  const requiredIds = new Set(required.map((item) => item.id))
  const wrongPlaced = stagedFreight.filter((item) => (
    item.expected === false && placed.has(item.id)
  ))
  const missingPlaced = required.filter((item) => !placed.has(item.id))
  const map = placementMap({ board, stagedFreight, placements })

  const errors = []
  const warnings = []

  if (missingPlaced.length > 0) {
    errors.push({
      code: 'REQUIRED_FREIGHT_NOT_PLANNED',
      message: `${missingPlaced.length} booked freight unit${missingPlaced.length === 1 ? '' : 's'} not placed.`,
    })
  }

  if (wrongPlaced.length > 0) {
    errors.push({
      code: 'WRONG_LOAD',
      message: `${wrongPlaced.length} staged unit${wrongPlaced.length === 1 ? '' : 's'} has a load-number mismatch.`,
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

  const deliveryAccess = evaluateTrailerDeliveryAccess({
    board,
    stagedFreight,
    placements,
    deliveryOrder,
  })

  if (!deliveryAccess.clear) {
    const firstConflict = deliveryAccess.pairSummaries[0]
    errors.push({
      code: 'DELIVERY_ACCESS_BLOCKED',
      message: firstConflict
        ? `${firstConflict.blockedLoadRef} delivers before ${firstConflict.blockingLoadRef}. Move ${firstConflict.blockedLoadRef} closer to the rear doors.`
        : 'Earlier-delivery freight is blocked by freight that unloads later.',
    })
  }

  const weightBalanceRaw = evaluateTrailerWeightBalance({
    board,
    stagedFreight,
    placements,
  })
  const weightBalance = {
    ...weightBalanceRaw,
    enforced: missingPlaced.length === 0 && weightBalanceRaw.active,
  }

  if (weightBalance.enforced && !weightBalance.clear) {
    const primaryIssue = weightBalance.issues[0]
    errors.push({
      code: 'WEIGHT_DISTRIBUTION_UNBALANCED',
      message: primaryIssue?.fix
        ?? 'Redistribute trailer weight before closing the doors.',
    })
  }

  const fragileProtectionRaw = evaluateTrailerFragileProtection({
    board,
    stagedFreight,
    placements,
  })
  const fragileProtection = {
    ...fragileProtectionRaw,
    enforced: missingPlaced.length === 0 && fragileProtectionRaw.active,
  }

  if (fragileProtection.enforced && !fragileProtection.clear) {
    const firstConflict = fragileProtection.conflicts[0]
    errors.push({
      code: 'FRAGILE_PROTECTION_CONFLICT',
      message: firstConflict
        ? `${firstConflict.fragileLabel} is directly beside ${firstConflict.riskHandlingCode} freight. Separate the pieces before closing the doors.`
        : 'Fragile freight is directly beside heavy-impact cargo.',
    })
  }

  return {
    ready: errors.length === 0,
    errors,
    warnings,
    expectedCount: requiredIds.size,
    plannedExpectedCount: required.filter((item) => placed.has(item.id)).length,
    plannedCount: placed.size,
    onboardCount: stagedFreight.filter((item) => placed.has(item.id) && item.expected !== false).length,
    occupiedCells: map.occupied.size,
    plannedWeightLbs,
    deliveryAccess,
    deliveryOrder,
    weightBalance,
    fragileProtection,
    loadRef: event?.loadRef ?? event?.loadId ?? null,
  }
}

function sameLoad(freight, event) {
  const eventLoadId = event?.loadId ?? event?.loadRef ?? null
  const eventLoadRef = event?.loadRef ?? event?.loadId ?? null
  return (
    (eventLoadId != null && freight.loadId === eventLoadId)
    || (eventLoadRef != null && freight.loadRef === eventLoadRef)
  )
}

export function buildOnboardCargoForPickup({
  driverId,
  eventId,
  driverDay,
  facilityOperations = {},
} = {}) {
  const activeFreight = new Map()
  const activePlacements = {}

  for (const timelineEvent of driverDay?.timeline ?? []) {
    if (timelineEvent.id === eventId) break
    if (timelineEvent.kind !== 'freight-stop') continue

    if (timelineEvent.role === 'delivery') {
      for (const [freightId, freight] of activeFreight.entries()) {
        if (!sameLoad(freight, timelineEvent)) continue
        activeFreight.delete(freightId)
        delete activePlacements[freightId]
      }
      continue
    }

    if (timelineEvent.role !== 'pickup') continue

    const operation = facilityOperationForEvent(
      facilityOperations,
      driverId,
      timelineEvent.id,
    )
    if (!pickupPlanCommitted(operation)) continue

    const snapshot = Array.isArray(operation?.loadPlan?.freightManifest)
      ? operation.loadPlan.freightManifest
      : null

    if (snapshot) {
      activeFreight.clear()
      for (const key of Object.keys(activePlacements)) delete activePlacements[key]

      for (const freight of snapshot) {
        activeFreight.set(freight.id, {
          ...freight,
          carried: true,
        })
        const placement = operation.loadPlan?.placements?.[freight.id]
        if (placement) activePlacements[freight.id] = { ...placement }
      }
      continue
    }

    const pickupFreight = buildTutorialStagedFreight(timelineEvent)
      .filter((freight) => freight.expected)

    for (const freight of pickupFreight) {
      activeFreight.set(freight.id, {
        ...freight,
        carried: true,
      })
      const placement = operation.loadPlan?.placements?.[freight.id]
      if (placement) activePlacements[freight.id] = { ...placement }
    }

    for (const [freightId, placement] of Object.entries(operation.loadPlan?.placements ?? {})) {
      if (activeFreight.has(freightId)) {
        activePlacements[freightId] = { ...placement }
      }
    }
  }

  return {
    freight: [...activeFreight.values()],
    placements: activePlacements,
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
