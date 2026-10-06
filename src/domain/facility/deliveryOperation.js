import {
  boardCellCoordinates,
  boardCellIndex,
  buildOnboardCargoForPickup,
  buildTutorialStagedFreight,
  canPlaceFreight,
  facilityOperationKey,
  footprintCellIndexes,
} from './pickupOperation.js'

export const DELIVERY_OPERATION_STATUS = Object.freeze({
  DOCK_ASSIGNED: 'dock-assigned',
  UNLOAD_PLANNING: 'unload-planning',
  PLAN_COMMITTED: 'plan-committed',
  UNLOADING: 'unloading',
  RECEIVER_VERIFICATION: 'receiver-verification',
  COMPLETE: 'complete',
})

export const RECEIVER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  ACCEPTED_WITH_DAMAGE: 'ACCEPTED_WITH_DAMAGE',
  REFUSED: 'REFUSED',
  SHORT: 'SHORT',
  WRONG_DESTINATION: 'WRONG_DESTINATION',
})

const DEFAULT_RECEIVING_PHASES = Object.freeze([
  Object.freeze({
    id: 'controlled',
    label: 'CONTROLLED FREIGHT',
    zoneId: 'controlled',
    zoneLabel: 'CONTROLLED RECEIVING',
    handlingCodes: Object.freeze(['HAZMAT']),
    instruction: 'Controlled materials are processed first.',
  }),
  Object.freeze({
    id: 'forklift',
    label: 'FORKLIFT HANDLING',
    zoneId: 'forklift',
    zoneLabel: 'FORKLIFT LANE',
    handlingCodes: Object.freeze(['HEAVY', 'OVERSIZE']),
    instruction: 'Heavy and oversize freight moves through the forklift lane.',
  }),
  Object.freeze({
    id: 'inspection',
    label: 'FRAGILE INSPECTION',
    zoneId: 'inspection',
    zoneLabel: 'INSPECTION',
    handlingCodes: Object.freeze(['FRAGILE']),
    instruction: 'Fragile freight is checked before general receiving opens.',
  }),
  Object.freeze({
    id: 'general',
    label: 'GENERAL RECEIVING',
    zoneId: 'general',
    zoneLabel: 'GENERAL RECEIVING',
    handlingCodes: null,
    instruction: 'Release the remaining delivery freight to general receiving.',
  }),
])

const FACILITY_RECEIVING_PROFILES = Object.freeze({
  'harborline-logistics': Object.freeze({
    label: 'HARBORLINE RECEIVING SOP',
    phases: DEFAULT_RECEIVING_PHASES,
  }),
  'freshway-grocery-dc': Object.freeze({
    label: 'FRESHWAY RECEIVING SOP',
    phases: Object.freeze([
      Object.freeze({
        id: 'inspection',
        label: 'FRAGILE INSPECTION',
        zoneId: 'inspection',
        zoneLabel: 'QUALITY CHECK',
        handlingCodes: Object.freeze(['FRAGILE', 'UPRIGHT']),
        instruction: 'Inspection freight clears quality check before controlled materials.',
      }),
      Object.freeze({
        id: 'controlled',
        label: 'CONTROLLED FREIGHT',
        zoneId: 'controlled',
        zoneLabel: 'CONTROLLED RECEIVING',
        handlingCodes: Object.freeze(['HAZMAT']),
        instruction: 'Controlled materials move to the marked receiving area.',
      }),
      Object.freeze({
        id: 'forklift',
        label: 'FORKLIFT HANDLING',
        zoneId: 'forklift',
        zoneLabel: 'FORKLIFT LANE',
        handlingCodes: Object.freeze(['HEAVY', 'OVERSIZE']),
        instruction: 'Heavy freight moves through the forklift lane.',
      }),
      Object.freeze({
        id: 'general',
        label: 'GENERAL RECEIVING',
        zoneId: 'general',
        zoneLabel: 'GENERAL RECEIVING',
        handlingCodes: null,
        instruction: 'Release the remaining delivery freight.',
      }),
    ]),
  }),
})

export const DELIVERY_STAGING_CAPACITY = 3

export function deliveryStagingFootprint(freight = {}) {
  return Math.max(1, Array.isArray(freight.shape) ? freight.shape.length : 1)
}

export function evaluateDeliveryStaging({
  freight = [],
  stagingPlacements = {},
  capacity = DELIVERY_STAGING_CAPACITY,
} = {}) {
  const freightById = new Map(freight.map((item) => [item.id, item]))
  const occupied = Array.from({ length: capacity }, () => null)
  const invalidFreightIds = new Set()
  const collisionFreightIds = new Set()

  for (const [freightId, placement] of Object.entries(stagingPlacements)) {
    const unit = freightById.get(freightId)
    const size = deliveryStagingFootprint(unit)
    const startSlot = Number(placement?.startSlot)

    if (
      !unit
      || !Number.isInteger(startSlot)
      || size > capacity
      || startSlot < 0
      || startSlot + size > capacity
    ) {
      invalidFreightIds.add(freightId)
      continue
    }

    for (let slot = startSlot; slot < startSlot + size; slot += 1) {
      if (occupied[slot] != null) {
        collisionFreightIds.add(freightId)
        collisionFreightIds.add(occupied[slot])
      } else {
        occupied[slot] = freightId
      }
    }
  }

  return {
    capacity,
    used: occupied.filter(Boolean).length,
    available: occupied.filter((item) => item == null).length,
    occupied,
    invalidFreightIds: [...invalidFreightIds],
    collisionFreightIds: [...collisionFreightIds],
    clear: invalidFreightIds.size === 0 && collisionFreightIds.size === 0,
  }
}

export function findDeliveryStagingPlacement({
  freight,
  allFreight = [],
  stagingPlacements = {},
  capacity = DELIVERY_STAGING_CAPACITY,
} = {}) {
  if (!freight) return null

  const size = deliveryStagingFootprint(freight)
  if (size > capacity) return null

  const withoutFreight = Object.fromEntries(
    Object.entries(stagingPlacements)
      .filter(([freightId]) => freightId !== freight.id),
  )
  const staging = evaluateDeliveryStaging({
    freight: allFreight,
    stagingPlacements: withoutFreight,
    capacity,
  })

  for (let startSlot = 0; startSlot <= capacity - size; startSlot += 1) {
    const free = Array.from({ length: size }, (_, offset) => (
      staging.occupied[startSlot + offset] == null
    )).every(Boolean)

    if (free) {
      return {
        startSlot,
        size,
      }
    }
  }

  return null
}



function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function loadKey(item = {}) {
  return item.loadRef ?? item.loadId ?? null
}

function sameLoad(left = {}, right = {}) {
  const leftKey = loadKey(left)
  const rightKey = loadKey(right)
  return leftKey != null && rightKey != null && leftKey === rightKey
}

function receivingProfileForEvent(event = {}) {
  return FACILITY_RECEIVING_PROFILES[event.locationId] ?? {
    label: 'RECEIVING SOP',
    phases: DEFAULT_RECEIVING_PHASES,
  }
}

function phaseMatchesFreight(phase, freight) {
  if (!Array.isArray(phase.handlingCodes)) return true
  return phase.handlingCodes.includes(freight.handlingCode)
}

export function buildDeliveryReceivingProtocol({
  event,
  freight = [],
} = {}) {
  const profile = receivingProfileForEvent(event)
  const deliveryFreight = freight.filter((item) => sameLoad(item, event))
  const assigned = new Set()
  const phases = []

  for (const phase of profile.phases) {
    const matching = deliveryFreight.filter((item) => (
      !assigned.has(item.id) && phaseMatchesFreight(phase, item)
    ))
    if (matching.length === 0) continue

    for (const item of matching) assigned.add(item.id)

    phases.push({
      id: phase.id,
      label: phase.label,
      zoneId: phase.zoneId,
      zoneLabel: phase.zoneLabel,
      instruction: phase.instruction,
      handlingCodes: phase.handlingCodes ? [...phase.handlingCodes] : null,
      freightIds: matching.map((item) => item.id),
    })
  }

  return {
    facilityId: event?.locationId ?? null,
    label: profile.label,
    phases,
  }
}

export function evaluateDeliveryReceivingProtocol({
  event,
  freight = [],
  unloadedFreightIds = [],
  receivingZoneByFreightId = {},
} = {}) {
  const protocol = buildDeliveryReceivingProtocol({ event, freight })
  const phaseIndexByFreightId = new Map()
  const zoneByFreightId = new Map()

  protocol.phases.forEach((phase, phaseIndex) => {
    phase.freightIds.forEach((freightId) => {
      phaseIndexByFreightId.set(freightId, phaseIndex)
      zoneByFreightId.set(freightId, phase.zoneId)
    })
  })

  const remainingByPhase = protocol.phases.map((phase) => phase.freightIds.length)
  const sequenceViolations = []
  const zoneViolations = []
  let activePhaseIndex = 0

  for (const freightId of unloadedFreightIds) {
    while (
      activePhaseIndex < remainingByPhase.length
      && remainingByPhase[activePhaseIndex] === 0
    ) {
      activePhaseIndex += 1
    }

    const freightPhaseIndex = phaseIndexByFreightId.get(freightId)
    if (freightPhaseIndex == null) continue

    if (freightPhaseIndex !== activePhaseIndex) {
      sequenceViolations.push({
        freightId,
        expectedPhaseId: protocol.phases[activePhaseIndex]?.id ?? null,
        actualPhaseId: protocol.phases[freightPhaseIndex]?.id ?? null,
      })
    }

    const expectedZoneId = zoneByFreightId.get(freightId)
    const actualZoneId = receivingZoneByFreightId[freightId] ?? null
    if (actualZoneId !== expectedZoneId) {
      zoneViolations.push({
        freightId,
        expectedZoneId,
        actualZoneId,
      })
    }

    remainingByPhase[freightPhaseIndex] = Math.max(
      0,
      remainingByPhase[freightPhaseIndex] - 1,
    )
  }

  const unloadedSet = new Set(unloadedFreightIds)
  const phases = protocol.phases.map((phase, phaseIndex) => {
    const receivedCount = phase.freightIds
      .filter((freightId) => unloadedSet.has(freightId))
      .length
    const complete = receivedCount === phase.freightIds.length
    return {
      ...phase,
      phaseIndex,
      receivedCount,
      totalCount: phase.freightIds.length,
      complete,
    }
  })
  const currentPhase = phases.find((phase) => !phase.complete) ?? null

  return {
    ...protocol,
    phases,
    currentPhase,
    complete: phases.every((phase) => phase.complete),
    sequenceViolations,
    zoneViolations,
    phaseIndexByFreightId: Object.fromEntries(phaseIndexByFreightId),
    zoneByFreightId: Object.fromEntries(zoneByFreightId),
  }
}

export function dockNumberForDelivery(event = {}) {
  const source = String(event.loadRef ?? event.loadId ?? event.id ?? 'delivery')
  let hash = 17

  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash * 33) + source.charCodeAt(index)) >>> 0
  }

  return 2 + (hash % 12)
}

export function deliveryOperationForEvent(
  facilityOperations = {},
  driverId,
  eventId,
) {
  return facilityOperations[facilityOperationKey(driverId, eventId)] ?? null
}

export function deliveryPlanCommitted(operation = null) {
  return [
    DELIVERY_OPERATION_STATUS.PLAN_COMMITTED,
    DELIVERY_OPERATION_STATUS.UNLOADING,
    DELIVERY_OPERATION_STATUS.RECEIVER_VERIFICATION,
    DELIVERY_OPERATION_STATUS.COMPLETE,
  ].includes(operation?.status)
}

export function pickupEventForDelivery(driverDay = {}, deliveryEvent = {}) {
  const deliveryIndex = (driverDay.timeline ?? [])
    .findIndex((item) => item.id === deliveryEvent.id)
  const timeline = deliveryIndex >= 0
    ? driverDay.timeline.slice(0, deliveryIndex)
    : driverDay.timeline ?? []

  return [...timeline]
    .reverse()
    .find((item) => (
      item.kind === 'freight-stop'
      && item.role === 'pickup'
      && sameLoad(item, deliveryEvent)
    )) ?? null
}

export function expectedFreightForDelivery({
  driverDay,
  event,
} = {}) {
  const pickupEvent = pickupEventForDelivery(driverDay, event)
  if (!pickupEvent) return []

  return buildTutorialStagedFreight(pickupEvent)
    .filter((freight) => freight.expected)
    .map((freight) => ({
      ...freight,
      expectedDestination: event.locationLabel ?? freight.destination,
    }))
}

export function buildTrailerStateForDelivery({
  driverId,
  eventId,
  driverDay,
  facilityOperations = {},
} = {}) {
  return buildOnboardCargoForPickup({
    driverId,
    eventId,
    driverDay,
    facilityOperations,
  })
}

function placedFreightEntries({
  board,
  freight = [],
  placements = {},
  excludedFreightIds = new Set(),
} = {}) {
  const freightById = new Map(freight.map((item) => [item.id, item]))
  const placed = []

  for (const [freightId, placement] of Object.entries(placements)) {
    if (excludedFreightIds.has(freightId)) continue
    const unit = freightById.get(freightId)
    if (!unit) continue

    const cells = footprintCellIndexes({
      board,
      freight: unit,
      anchorCell: placement?.anchorCell,
      rotation: placement?.rotation ?? 0,
    })
    if (!cells?.length) continue

    placed.push({
      freight: unit,
      placement,
      cells: cells.map((cellIndex) => ({
        cellIndex,
        ...boardCellCoordinates(board, cellIndex),
      })),
    })
  }

  return placed
}

function deliveryHandlingPlacementsWithoutFreight(placements = {}, freightId) {
  return Object.fromEntries(
    Object.entries(placements)
      .filter(([id]) => id !== freightId)
      .map(([id, placement]) => [id, { ...placement }]),
  )
}

function rearDoorAnchorCells({
  board,
  freight,
  placements,
  freightId,
  rotation,
} = {}) {
  const otherPlacements = deliveryHandlingPlacementsWithoutFreight(
    placements,
    freightId,
  )
  const anchors = []

  for (let anchorCell = 0; anchorCell < board.usableCells; anchorCell += 1) {
    const cells = footprintCellIndexes({
      board,
      freight,
      anchorCell,
      rotation,
    })
    if (!cells?.length) continue

    const place = canPlaceFreight({
      board,
      stagedFreight: freight ? [freight] : [],
      placements: {},
      freightId: freight?.id,
      anchorCell,
      rotation,
    })
    if (!place.valid) continue

    const { x, y } = boardCellCoordinates(board, anchorCell)
    const rearNeighbor = boardCellIndex(board, x, y + 1)
    const rearNeighborFits = rearNeighbor != null
      ? footprintCellIndexes({
          board,
          freight,
          anchorCell: rearNeighbor,
          rotation,
        })
      : null

    if (rearNeighborFits) continue

    const clearAtDoor = canPlaceFreight({
      board,
      stagedFreight: [freight],
      placements: otherPlacements,
      freightId: freight.id,
      anchorCell,
      rotation,
    })
    if (clearAtDoor.valid) anchors.push(anchorCell)
  }

  return anchors
}

function deliveryHandlingNeighborAnchors(board, anchorCell) {
  const { x, y } = boardCellCoordinates(board, anchorCell)
  return [
    boardCellIndex(board, x - 1, y),
    boardCellIndex(board, x + 1, y),
    boardCellIndex(board, x, y - 1),
    boardCellIndex(board, x, y + 1),
  ].filter((cell) => cell != null)
}

export function findDeliveryRearHandlingPath({
  board,
  freight = [],
  placements = {},
  freightId,
  anchorCell,
  rotation = 0,
} = {}) {
  const unit = freight.find((item) => item.id === freightId)
  if (!board || !unit || !Number.isInteger(Number(anchorCell))) {
    return {
      clear: false,
      reason: 'INVALID_REQUEST',
      path: [],
    }
  }

  const targetCell = Number(anchorCell)
  const otherPlacements = deliveryHandlingPlacementsWithoutFreight(
    placements,
    freightId,
  )
  const targetPlacement = canPlaceFreight({
    board,
    stagedFreight: freight,
    placements: otherPlacements,
    freightId,
    anchorCell: targetCell,
    rotation,
  })

  if (!targetPlacement.valid) {
    return {
      clear: false,
      reason: targetPlacement.reason ?? 'INVALID_PLACEMENT',
      path: [],
    }
  }

  const doorAnchors = rearDoorAnchorCells({
    board,
    freight: unit,
    placements,
    freightId,
    rotation,
  })
  if (doorAnchors.length === 0) {
    return {
      clear: false,
      reason: 'NO_REAR_ENTRY',
      path: [],
    }
  }

  const queue = doorAnchors.map((cell) => [cell])
  const visited = new Set(doorAnchors)

  while (queue.length > 0) {
    const path = queue.shift()
    const current = path[path.length - 1]
    if (current === targetCell) {
      return {
        clear: true,
        reason: null,
        path,
      }
    }

    for (const neighbor of deliveryHandlingNeighborAnchors(board, current)) {
      if (visited.has(neighbor)) continue

      const step = canPlaceFreight({
        board,
        stagedFreight: freight,
        placements: otherPlacements,
        freightId,
        anchorCell: neighbor,
        rotation,
      })
      if (!step.valid) continue

      visited.add(neighbor)
      queue.push([...path, neighbor])
    }
  }

  return {
    clear: false,
    reason: 'NO_HANDLING_PATH',
    path: [],
  }
}

export function evaluateDeliveryHandlingAccess({
  board,
  freight = [],
  placements = {},
  excludedFreightIds = [],
} = {}) {
  const excluded = new Set(excludedFreightIds)
  const accessibleFreightIds = []
  const blockedFreightIds = []
  const pathByFreightId = {}

  for (const [freightId, placement] of Object.entries(placements)) {
    if (excluded.has(freightId)) continue

    const access = findDeliveryRearHandlingPath({
      board,
      freight,
      placements,
      freightId,
      anchorCell: placement?.anchorCell,
      rotation: placement?.rotation ?? 0,
    })
    pathByFreightId[freightId] = access.path

    if (access.clear) accessibleFreightIds.push(freightId)
    else blockedFreightIds.push(freightId)
  }

  return {
    accessibleFreightIds,
    blockedFreightIds,
    pathByFreightId,
  }
}

export function evaluateDeliveryRepositionMove({
  board,
  freight = [],
  placements = {},
  freightId,
  anchorCell,
  rotation = 0,
  source = 'trailer',
} = {}) {
  const unit = freight.find((item) => item.id === freightId)
  if (!unit) {
    return {
      valid: false,
      reason: 'FREIGHT_NOT_FOUND',
      destinationPath: [],
      sourcePath: [],
    }
  }

  const destination = canPlaceFreight({
    board,
    stagedFreight: freight,
    placements,
    freightId,
    anchorCell,
    rotation,
  })
  if (!destination.valid) {
    return {
      valid: false,
      reason: destination.reason ?? 'INVALID_PLACEMENT',
      destinationPath: [],
      sourcePath: [],
    }
  }

  let sourcePath = []
  if (source === 'trailer') {
    const sourcePlacement = placements[freightId]
    if (!sourcePlacement) {
      return {
        valid: false,
        reason: 'SOURCE_NOT_ON_TRAILER',
        destinationPath: [],
        sourcePath: [],
      }
    }

    const sourceAccess = findDeliveryRearHandlingPath({
      board,
      freight,
      placements,
      freightId,
      anchorCell: sourcePlacement.anchorCell,
      rotation: sourcePlacement.rotation ?? 0,
    })
    if (!sourceAccess.clear) {
      return {
        valid: false,
        reason: 'SOURCE_NOT_REAR_ACCESSIBLE',
        destinationPath: [],
        sourcePath: sourceAccess.path,
      }
    }
    sourcePath = sourceAccess.path
  }

  const destinationAccess = findDeliveryRearHandlingPath({
    board,
    freight,
    placements,
    freightId,
    anchorCell,
    rotation,
  })
  if (!destinationAccess.clear) {
    return {
      valid: false,
      reason: 'DESTINATION_NOT_REAR_ACCESSIBLE',
      destinationPath: destinationAccess.path,
      sourcePath,
    }
  }

  return {
    valid: true,
    reason: null,
    cells: destination.cells,
    destinationPath: destinationAccess.path,
    sourcePath,
  }
}

function freightBlockedByRearCargo(target, active = []) {
  const targetColumns = new Map()

  for (const cell of target.cells) {
    const currentRearMost = targetColumns.get(cell.x)
    if (currentRearMost == null || cell.y > currentRearMost) {
      targetColumns.set(cell.x, cell.y)
    }
  }

  const blockers = new Set()

  for (const other of active) {
    if (other.freight.id === target.freight.id) continue

    for (const cell of other.cells) {
      const targetRearMost = targetColumns.get(cell.x)
      if (targetRearMost == null) continue
      if (cell.y > targetRearMost) blockers.add(other.freight.id)
    }
  }

  return [...blockers]
}

export function evaluateDeliveryUnloadAccess({
  board,
  freight = [],
  placements = {},
  deliveryEvent,
  temporaryStagedFreightIds = [],
  unloadedFreightIds = [],
} = {}) {
  const excluded = new Set([
    ...temporaryStagedFreightIds,
    ...unloadedFreightIds,
  ])
  const active = placedFreightEntries({
    board,
    freight,
    placements,
    excludedFreightIds: excluded,
  })
  const currentLoad = active.filter((item) => sameLoad(item.freight, deliveryEvent))
  const immediateBlockerMap = new Map()
  const currentlyAccessibleFreightIds = []
  const currentlyBlockedFreightIds = []

  for (const target of currentLoad) {
    const blockers = freightBlockedByRearCargo(target, active)
    immediateBlockerMap.set(target.freight.id, blockers)
    if (blockers.length > 0) currentlyBlockedFreightIds.push(target.freight.id)
    else currentlyAccessibleFreightIds.push(target.freight.id)
  }

  const immediateBlockingFreightIds = [...new Set(
    currentlyBlockedFreightIds.flatMap((freightId) => (
      immediateBlockerMap.get(freightId) ?? []
    )),
  )]
  const remaining = new Map(currentLoad.map((item) => [item.freight.id, item]))
  const workingActive = new Map(active.map((item) => [item.freight.id, item]))
  const unloadOrder = []
  const blockerMap = new Map()

  let progressed = true
  while (remaining.size > 0 && progressed) {
    progressed = false

    for (const [freightId, target] of [...remaining.entries()]) {
      const blockers = freightBlockedByRearCargo(
        target,
        [...workingActive.values()],
      )
      if (blockers.length > 0) {
        blockerMap.set(freightId, blockers)
        continue
      }

      unloadOrder.push(freightId)
      remaining.delete(freightId)
      workingActive.delete(freightId)
      blockerMap.delete(freightId)
      progressed = true
    }
  }

  const blockedFreightIds = [...remaining.keys()]
  const blockingFreightIds = [...new Set(
    blockedFreightIds.flatMap((freightId) => blockerMap.get(freightId) ?? []),
  )]

  return {
    clear: blockedFreightIds.length === 0,
    unloadOrder,
    accessibleFreightIds: unloadOrder,
    blockedFreightIds,
    blockingFreightIds,
    blockerMap: Object.fromEntries(
      blockedFreightIds.map((freightId) => [
        freightId,
        blockerMap.get(freightId) ?? [],
      ]),
    ),
    currentlyAccessibleFreightIds,
    currentlyBlockedFreightIds,
    immediateBlockingFreightIds,
    immediateBlockerMap: Object.fromEntries(
      currentLoad.map((item) => [
        item.freight.id,
        immediateBlockerMap.get(item.freight.id) ?? [],
      ]),
    ),
  }
}

export function evaluateDeliveryUnloadPlan({
  board,
  driverDay,
  event,
  freight = [],
  placements = {},
  unloadedFreightIds = null,
  selectedFreightIds = [],
  temporaryStagedFreightIds = [],
  rehandledFreightIds = null,
  stagingPlacements = {},
  receivingZoneByFreightId = {},
  internalRepositionHistory = [],
} = {}) {
  const expectedFreight = expectedFreightForDelivery({ driverDay, event })
  const expectedIds = new Set(expectedFreight.map((item) => item.id))
  const actualForStop = freight.filter((item) => sameLoad(item, event))
  const actualIds = new Set(actualForStop.map((item) => item.id))
  const unloadedIds = new Set(
    unloadedFreightIds == null
      ? selectedFreightIds
      : unloadedFreightIds,
  )
  const temporaryIds = new Set(temporaryStagedFreightIds)

  const shortageFreight = expectedFreight.filter((item) => !actualIds.has(item.id))
  const unexpectedFreight = freight.filter((item) => (
    sameLoad(item, event) && !expectedIds.has(item.id)
  ))
  const remainingToUnload = actualForStop.filter((item) => !unloadedIds.has(item.id))
  const wrongUnload = freight.filter((item) => (
    unloadedIds.has(item.id) && !sameLoad(item, event)
  ))

  const access = evaluateDeliveryUnloadAccess({
    board,
    freight,
    placements,
    deliveryEvent: event,
    temporaryStagedFreightIds,
    unloadedFreightIds: [...unloadedIds],
  })
  const handlingAccess = evaluateDeliveryHandlingAccess({
    board,
    freight,
    placements,
    excludedFreightIds: [
      ...temporaryStagedFreightIds,
      ...unloadedIds,
    ],
  })

  const receivingProtocol = evaluateDeliveryReceivingProtocol({
    event,
    freight: actualForStop,
    unloadedFreightIds: [
      ...(unloadedFreightIds == null ? selectedFreightIds : unloadedFreightIds),
    ],
    receivingZoneByFreightId,
  })
  const staging = evaluateDeliveryStaging({
    freight,
    stagingPlacements,
  })
  const retainedStagedFreight = freight.filter((item) => (
    temporaryIds.has(item.id)
    && !unloadedIds.has(item.id)
    && !sameLoad(item, event)
  ))

  const errors = []
  const warnings = []

  if (shortageFreight.length > 0) {
    errors.push({
      code: 'DELIVERY_SHORTAGE',
      message: `${shortageFreight.length} expected freight unit${shortageFreight.length === 1 ? '' : 's'} are not physically on the trailer.`,
    })
  }

  if (unexpectedFreight.length > 0) {
    warnings.push({
      code: 'UNEXPECTED_FREIGHT',
      message: `${unexpectedFreight.length} unexpected freight unit${unexpectedFreight.length === 1 ? '' : 's'} share this load identity.`,
    })
  }

  if (remainingToUnload.length > 0) {
    errors.push({
      code: 'DELIVERY_FREIGHT_REMAINING',
      message: `${remainingToUnload.length} delivery unit${remainingToUnload.length === 1 ? '' : 's'} still need to come through the rear doors.`,
    })
  }

  if (wrongUnload.length > 0) {
    errors.push({
      code: 'WRONG_DELIVERY_FREIGHT',
      message: `${wrongUnload.length} unloaded unit${wrongUnload.length === 1 ? '' : 's'} belong to another delivery.`,
    })
  }

  if (receivingProtocol.sequenceViolations.length > 0) {
    errors.push({
      code: 'RECEIVING_SEQUENCE_VIOLATION',
      message: 'Freight was sent to receiving before its facility phase opened.',
    })
  }

  if (receivingProtocol.zoneViolations.length > 0) {
    errors.push({
      code: 'WRONG_RECEIVING_ZONE',
      message: 'One or more freight units were sent to the wrong facility receiving area.',
    })
  }

  if (!staging.clear) {
    errors.push({
      code: 'TEMP_STAGING_INVALID',
      message: 'Temporary staging freight exceeds the available dock positions or overlaps another staged unit.',
    })
  }

  if (remainingToUnload.length === 0 && retainedStagedFreight.length > 0) {
    errors.push({
      code: 'STAGED_FREIGHT_NOT_RELOADED',
      message: `${retainedStagedFreight.length} later-stop freight unit${retainedStagedFreight.length === 1 ? '' : 's'} must return to the trailer before handoff.`,
    })
  }

  const rehandledIds = new Set(
    rehandledFreightIds == null
      ? temporaryStagedFreightIds
      : rehandledFreightIds,
  )
  const rehandleUnits = rehandledIds.size
  const rehandleMoves = rehandleUnits * 2

  return {
    ready: errors.length === 0,
    errors,
    warnings,
    expectedFreight,
    expectedCount: expectedFreight.length,
    actualForStop,
    actualCount: actualForStop.length,
    unloadedCount: actualForStop.filter((item) => unloadedIds.has(item.id)).length,
    selectedCount: actualForStop.filter((item) => unloadedIds.has(item.id)).length,
    shortageFreight,
    unexpectedFreight,
    access,
    handlingAccess,
    receivingProtocol,
    receivingZoneByFreightId: { ...receivingZoneByFreightId },
    staging,
    stagingPlacements: Object.fromEntries(
      Object.entries(stagingPlacements).map(([freightId, placement]) => [
        freightId,
        { ...placement },
      ]),
    ),
    rehandledFreightIds: [...rehandledIds],
    internalRepositionCount: internalRepositionHistory.length,
    internalRepositionHistory: internalRepositionHistory.map((move) => ({
      ...move,
      from: move.from ? { ...move.from } : null,
      to: move.to ? { ...move.to } : null,
    })),
    rehandleUnits,
    rehandleMoves,
    temporaryStagedFreightIds: [...temporaryIds],
    unloadedFreightIds: [
      ...(unloadedFreightIds == null ? selectedFreightIds : unloadedFreightIds),
    ],
    unloadSequence: [
      ...(unloadedFreightIds == null ? selectedFreightIds : unloadedFreightIds),
    ],
    selectedFreightIds: [...unloadedIds],
  }
}

export function deliveryServiceDuration({
  event,
  unloadPlan,
} = {}) {
  const baseMinutes = Math.max(1, finite(event?.serviceMinutes, 12))
  const rehandlePenaltyMinutes = Math.max(
    0,
    finite(unloadPlan?.rehandleUnits, 0) * 3,
  )

  return {
    baseMinutes,
    rehandlePenaltyMinutes,
    unloadMinutes: baseMinutes + rehandlePenaltyMinutes,
    receiverVerificationMinutes: 3,
    totalMinutes: baseMinutes + rehandlePenaltyMinutes + 3,
  }
}

export function commitDeliveryOperation({
  driverId,
  event,
  trailerState,
  unloadPlan,
  currentAbsoluteMinutes,
} = {}) {
  if (!driverId || !event?.id) {
    throw new Error('Delivery operation requires a driver and freight event.')
  }
  if (!unloadPlan?.ready) {
    throw new Error('Delivery unload plan must be ready before commit.')
  }

  const unloaded = new Set(
    unloadPlan.unloadedFreightIds
      ?? unloadPlan.selectedFreightIds
      ?? [],
  )
  const rehandled = new Set(
    unloadPlan.rehandledFreightIds
      ?? unloadPlan.temporaryStagedFreightIds
      ?? [],
  )
  const operationTime = Number(currentAbsoluteMinutes ?? 0)
  const remainingFreight = (trailerState?.freight ?? [])
    .filter((freight) => !unloaded.has(freight.id))
    .map((freight) => {
      const wasRehandled = rehandled.has(freight.id)
      return {
        ...freight,
        carried: true,
        currentLocation: 'TRAILER',
        status: freight.status === 'REFUSED' ? 'REFUSED' : 'IN_TRANSIT',
        freightHistory: [
          ...(freight.freightHistory ?? []),
          ...(unloadPlan.internalRepositionHistory ?? [])
            .filter((move) => move.freightId === freight.id)
            .map((move) => ({
              event: 'REPOSITIONED_IN_TRAILER',
              facilityId: event.locationId ?? null,
              time: operationTime,
              from: move.from ? { ...move.from } : null,
              to: move.to ? { ...move.to } : null,
            })),
          ...(wasRehandled
            ? [
                {
                  event: 'TEMP_STAGED',
                  facilityId: event.locationId ?? null,
                  time: operationTime,
                },
                {
                  event: 'RELOADED',
                  facilityId: event.locationId ?? null,
                  time: operationTime,
                  trailerPosition: trailerState?.placements?.[freight.id]
                    ? { ...trailerState.placements[freight.id] }
                    : null,
                },
              ]
            : []),
        ],
      }
    })
  const remainingPlacements = Object.fromEntries(
    Object.entries(trailerState?.placements ?? {})
      .filter(([freightId]) => !unloaded.has(freightId))
      .map(([freightId, placement]) => [freightId, { ...placement }]),
  )
  const deliveredFreight = (trailerState?.freight ?? [])
    .filter((freight) => unloaded.has(freight.id))
    .map((freight) => {
      const wasRehandled = rehandled.has(freight.id)
      return {
        ...freight,
        currentLocation: 'RECEIVER',
        status: 'ACCEPTED',
        receiverStatus: RECEIVER_STATUS.ACCEPTED,
        condition: freight.condition ?? 'GOOD',
        conditionKnown: freight.conditionKnown ?? true,
        freightHistory: [
          ...(freight.freightHistory ?? []),
          ...(unloadPlan.internalRepositionHistory ?? [])
            .filter((move) => move.freightId === freight.id)
            .map((move) => ({
              event: 'REPOSITIONED_IN_TRAILER',
              facilityId: event.locationId ?? null,
              time: operationTime,
              from: move.from ? { ...move.from } : null,
              to: move.to ? { ...move.to } : null,
            })),
          ...(wasRehandled
            ? [{
                event: 'TEMP_STAGED',
                facilityId: event.locationId ?? null,
                time: operationTime,
              }]
            : []),
          {
            event: 'DELIVERED',
            facilityId: event.locationId ?? null,
            time: operationTime,
            receiverStatus: RECEIVER_STATUS.ACCEPTED,
            receivingZoneId: unloadPlan.receivingZoneByFreightId?.[freight.id] ?? null,
          },
        ],
      }
    })

  const duration = deliveryServiceDuration({ event, unloadPlan })
  const unloadingStartMinutes = operationTime
  const unloadingCompleteMinutes = unloadingStartMinutes + duration.unloadMinutes
  const receiverVerificationCompleteMinutes = unloadingStartMinutes + duration.totalMinutes

  const receiverResults = deliveredFreight.map((freight) => ({
    freightId: freight.id,
    loadRef: freight.loadRef,
    status: RECEIVER_STATUS.ACCEPTED,
    condition: freight.condition ?? 'GOOD',
  }))

  return {
    key: facilityOperationKey(driverId, event.id),
    driverId,
    eventId: event.id,
    loadId: event.loadId ?? null,
    loadRef: event.loadRef ?? event.loadId ?? null,
    facilityId: event.locationId ?? null,
    dock: dockNumberForDelivery(event),
    status: DELIVERY_OPERATION_STATUS.PLAN_COMMITTED,
    planCommittedTime: unloadingStartMinutes,
    unloadingStartMinutes,
    unloadingDurationMinutes: duration.unloadMinutes,
    unloadingCompleteMinutes,
    receiverVerificationMinutes: duration.receiverVerificationMinutes,
    receiverVerificationCompleteMinutes,
    unloadPlan: {
      unloadedFreightIds: [...unloaded],
      unloadSequence: [...(unloadPlan.unloadSequence ?? [...unloaded])],
      receivingZoneByFreightId: {
        ...(unloadPlan.receivingZoneByFreightId ?? {}),
      },
      receivingProtocol: unloadPlan.receivingProtocol
        ? {
            facilityId: unloadPlan.receivingProtocol.facilityId ?? null,
            label: unloadPlan.receivingProtocol.label ?? null,
            phases: (unloadPlan.receivingProtocol.phases ?? []).map((phase) => ({
              id: phase.id,
              label: phase.label,
              zoneId: phase.zoneId,
              zoneLabel: phase.zoneLabel,
              freightIds: [...(phase.freightIds ?? [])],
            })),
          }
        : null,
      temporaryStagedFreightIds: [...(unloadPlan.temporaryStagedFreightIds ?? [])],
      stagingPlacements: Object.fromEntries(
        Object.entries(unloadPlan.stagingPlacements ?? {}).map(([freightId, placement]) => [
          freightId,
          { ...placement },
        ]),
      ),
      rehandledFreightIds: [...(unloadPlan.rehandledFreightIds ?? [])],
      internalRepositionCount: unloadPlan.internalRepositionCount ?? 0,
      internalRepositionHistory: (unloadPlan.internalRepositionHistory ?? []).map((move) => ({
        ...move,
        from: move.from ? { ...move.from } : null,
        to: move.to ? { ...move.to } : null,
      })),
      rehandleUnits: unloadPlan.rehandleUnits ?? 0,
      rehandleMoves: unloadPlan.rehandleMoves ?? 0,
    },
    deliveredFreight,
    receiverResults,
    trailerAfter: {
      freightManifest: remainingFreight,
      placements: remainingPlacements,
      board: trailerState?.board ? { ...trailerState.board } : null,
    },
    shortagePieces: unloadPlan.shortageFreight?.length ?? 0,
  }
}

export function deliveryOperationPhase(operation, currentAbsoluteMinutes) {
  if (!deliveryPlanCommitted(operation)) return DELIVERY_OPERATION_STATUS.DOCK_ASSIGNED

  const now = finite(currentAbsoluteMinutes)
  if (now < finite(operation.unloadingCompleteMinutes)) {
    return DELIVERY_OPERATION_STATUS.UNLOADING
  }
  if (now < finite(operation.receiverVerificationCompleteMinutes)) {
    return DELIVERY_OPERATION_STATUS.RECEIVER_VERIFICATION
  }
  return DELIVERY_OPERATION_STATUS.COMPLETE
}
