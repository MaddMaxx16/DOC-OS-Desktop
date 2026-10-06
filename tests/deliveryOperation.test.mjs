import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildTrailerPuzzleBoard,
  buildTutorialStagedFreight,
  commitPickupOperation,
} from '../src/domain/facility/pickupOperation.js'
import {
  buildDeliveryReceivingProtocol,
  buildTrailerStateForDelivery,
  commitDeliveryOperation,
  DELIVERY_STAGING_CAPACITY,
  deliveryOperationPhase,
  evaluateDeliveryStaging,
  findDeliveryStagingPlacement,
  evaluateDeliveryReceivingProtocol,
  evaluateDeliveryUnloadAccess,
  evaluateDeliveryUnloadPlan,
  expectedFreightForDelivery,
} from '../src/domain/facility/deliveryOperation.js'

const driver = {
  id: 'marcus-reed',
  equipment: {
    label: "53' Dry Van",
    capacityPallets: 26,
    maxWeightLbs: 44000,
  },
}

const pickup = {
  id: 'M-101:pickup',
  kind: 'freight-stop',
  role: 'pickup',
  loadId: 'M-101',
  loadRef: 'M-101',
  locationId: 'empire-freight-terminal',
  locationLabel: 'Empire Freight Terminal',
  deliveryLocationLabel: 'Harborline Logistics',
  freight: { pallets: 3, weightLbs: 4500 },
  serviceMinutes: 12,
}

const delivery = {
  id: 'M-101:delivery',
  kind: 'freight-stop',
  role: 'delivery',
  loadId: 'M-101',
  loadRef: 'M-101',
  locationId: 'harborline-logistics',
  locationLabel: 'Harborline Logistics',
  freight: { pallets: 3, weightLbs: 4500 },
  serviceMinutes: 15,
}

function protocolPlan(event, freight) {
  const protocol = buildDeliveryReceivingProtocol({ event, freight })
  const unloadedFreightIds = protocol.phases.flatMap((phase) => phase.freightIds)
  const receivingZoneByFreightId = Object.fromEntries(
    protocol.phases.flatMap((phase) => (
      phase.freightIds.map((freightId) => [freightId, phase.zoneId])
    )),
  )

  return {
    protocol,
    unloadedFreightIds,
    receivingZoneByFreightId,
  }
}

function committedPickupState({
  placements = null,
  extraFreight = [],
} = {}) {
  const board = buildTrailerPuzzleBoard(driver.equipment)
  const expected = buildTutorialStagedFreight(pickup).filter((item) => item.expected)
  const freight = [...expected, ...extraFreight]
  const resolvedPlacements = placements ?? {
    [expected[0].id]: { anchorCell: 20, rotation: 0 },
    [expected[1].id]: { anchorCell: 21, rotation: 0 },
    [expected[2].id]: { anchorCell: 22, rotation: 0 },
  }
  const operation = commitPickupOperation({
    driverId: driver.id,
    event: pickup,
    currentAbsoluteMinutes: 500,
    loadPlan: {
      freightIds: Object.keys(resolvedPlacements),
      freightManifest: freight,
      placements: resolvedPlacements,
      board,
    },
  })

  return {
    board,
    expected,
    operation,
    facilityOperations: {
      [operation.key]: operation,
    },
  }
}

test('delivery opens the exact persistent trailer snapshot committed at pickup', () => {
  const { expected, operation, facilityOperations } = committedPickupState()
  const driverDay = {
    driverId: driver.id,
    timeline: [pickup, delivery],
  }

  const trailer = buildTrailerStateForDelivery({
    driverId: driver.id,
    eventId: delivery.id,
    driverDay,
    facilityOperations,
  })

  assert.deepEqual(
    trailer.freight.map((item) => item.id),
    operation.loadPlan.freightManifest.map((item) => item.id),
  )
  assert.deepEqual(trailer.placements, operation.loadPlan.placements)
  assert.equal(trailer.freight.length, expected.length)
})

test('delivery expected freight IDs come from the matching pickup freight units', () => {
  const driverDay = {
    driverId: driver.id,
    timeline: [pickup, delivery],
  }

  const expected = expectedFreightForDelivery({
    driverDay,
    event: delivery,
  })

  assert.equal(expected.length, 3)
  assert.ok(expected.every((item) => item.id.startsWith('M-101:pickup:')))
  assert.ok(expected.every((item) => item.expectedDestination === 'Harborline Logistics'))
})

test('a clean rear-accessible delivery plan is ready when facility protocol is satisfied', () => {
  const { board, facilityOperations } = committedPickupState()
  const driverDay = {
    driverId: driver.id,
    timeline: [pickup, delivery],
  }
  const trailer = buildTrailerStateForDelivery({
    driverId: driver.id,
    eventId: delivery.id,
    driverDay,
    facilityOperations,
  })

  const plan = evaluateDeliveryUnloadPlan({
    board,
    driverDay,
    event: delivery,
    freight: trailer.freight,
    placements: trailer.placements,
    ...protocolPlan(delivery, trailer.freight),
  })

  assert.equal(plan.ready, true)
  assert.equal(plan.expectedCount, 3)
  assert.equal(plan.actualCount, 3)
  assert.equal(plan.unloadedCount, 3)
  assert.equal(plan.access.clear, true)
  assert.equal(plan.rehandleUnits, 0)
})

test('later-stop freight can block delivery freight until it is temporarily staged', () => {
  const board = buildTrailerPuzzleBoard(driver.equipment)
  const current = buildTutorialStagedFreight(pickup).filter((item) => item.expected)
  const later = {
    id: 'M-202:pickup:pallet-1',
    label: 'Pallet 01',
    loadId: 'M-202',
    loadRef: 'M-202',
    destination: 'Freshway Grocery DC',
    cargoType: 'wrapped-pallet',
    handlingCode: 'STANDARD',
    handlingLabel: 'STANDARD',
    weightLbs: 1200,
    expected: true,
    shapeId: 'standard',
    shape: [[0, 0]],
  }
  const freight = [...current, later]
  const placements = {
    [current[0].id]: { anchorCell: 0, rotation: 0 },
    [current[1].id]: { anchorCell: 1, rotation: 0 },
    [current[2].id]: { anchorCell: 2, rotation: 0 },
    [later.id]: { anchorCell: 20, rotation: 0 },
  }

  const blocked = evaluateDeliveryUnloadAccess({
    board,
    freight,
    placements,
    deliveryEvent: delivery,
  })

  assert.equal(blocked.clear, false)
  assert.ok(blocked.blockingFreightIds.includes(later.id))
  assert.ok(blocked.currentlyBlockedFreightIds.includes(current[0].id))
  assert.ok(blocked.immediateBlockingFreightIds.includes(later.id))
  assert.deepEqual(blocked.immediateBlockerMap[current[0].id], [later.id])

  const clear = evaluateDeliveryUnloadAccess({
    board,
    freight,
    placements,
    deliveryEvent: delivery,
    temporaryStagedFreightIds: [later.id],
  })

  assert.equal(clear.clear, true)
  assert.ok(clear.currentlyAccessibleFreightIds.includes(current[0].id))
})

test('physical unload access updates after each freight unit leaves the trailer', () => {
  const board = buildTrailerPuzzleBoard(driver.equipment)
  const current = buildTutorialStagedFreight(pickup).filter((item) => item.expected)
  const placements = {
    [current[0].id]: { anchorCell: 0, rotation: 0 },
    [current[1].id]: { anchorCell: 20, rotation: 0 },
    [current[2].id]: { anchorCell: 21, rotation: 0 },
  }

  const initial = evaluateDeliveryUnloadAccess({
    board,
    freight: current,
    placements,
    deliveryEvent: delivery,
  })

  assert.ok(initial.currentlyBlockedFreightIds.includes(current[0].id))
  assert.ok(initial.currentlyAccessibleFreightIds.includes(current[1].id))

  const afterRearUnit = evaluateDeliveryUnloadAccess({
    board,
    freight: current,
    placements,
    deliveryEvent: delivery,
    unloadedFreightIds: [current[1].id],
  })

  assert.ok(afterRearUnit.currentlyAccessibleFreightIds.includes(current[0].id))
})

test('temporary staging creates rehandle time and delivered freight leaves the trailer snapshot', () => {
  const board = buildTrailerPuzzleBoard(driver.equipment)
  const expected = buildTutorialStagedFreight(pickup).filter((item) => item.expected)
  const later = {
    id: 'M-202:pickup:pallet-1',
    label: 'Pallet 01',
    loadId: 'M-202',
    loadRef: 'M-202',
    destination: 'Freshway Grocery DC',
    cargoType: 'wrapped-pallet',
    handlingCode: 'STANDARD',
    handlingLabel: 'STANDARD',
    weightLbs: 1200,
    expected: true,
    shapeId: 'standard',
    shape: [[0, 0]],
  }
  const freight = [...expected, later]
  const placements = {
    [expected[0].id]: { anchorCell: 0, rotation: 0 },
    [expected[1].id]: { anchorCell: 1, rotation: 0 },
    [expected[2].id]: { anchorCell: 2, rotation: 0 },
    [later.id]: { anchorCell: 20, rotation: 0 },
  }
  const driverDay = {
    driverId: driver.id,
    timeline: [pickup, delivery],
  }
  const plan = evaluateDeliveryUnloadPlan({
    board,
    driverDay,
    event: delivery,
    freight,
    placements,
    ...protocolPlan(delivery, freight),
    temporaryStagedFreightIds: [],
    rehandledFreightIds: [later.id],
  })

  assert.equal(plan.ready, true)
  assert.equal(plan.rehandleUnits, 1)
  assert.equal(plan.rehandleMoves, 2)

  const operation = commitDeliveryOperation({
    driverId: driver.id,
    event: delivery,
    trailerState: { freight, placements, board },
    unloadPlan: plan,
    currentAbsoluteMinutes: 700,
  })

  assert.equal(operation.unloadingDurationMinutes, delivery.serviceMinutes + 3)
  assert.equal(operation.receiverVerificationMinutes, 3)
  assert.equal(operation.trailerAfter.freightManifest.length, 1)
  assert.equal(operation.trailerAfter.freightManifest[0].id, later.id)
  assert.ok(operation.trailerAfter.placements[later.id])
  assert.equal(operation.receiverResults.length, expected.length)
  assert.ok(operation.receiverResults.every((result) => result.status === 'ACCEPTED'))
  assert.equal(operation.shortagePieces, 0)
  assert.deepEqual(
    operation.unloadPlan.unloadSequence,
    protocolPlan(delivery, freight).unloadedFreightIds,
  )
})

test('delivery can clear rear access by repositioning freight inside the trailer', () => {
  const board = buildTrailerPuzzleBoard(driver.equipment)
  const current = buildTutorialStagedFreight(pickup).filter((item) => item.expected)
  const later = {
    id: 'M-202:pickup:pallet-1',
    label: 'Pallet 01',
    loadId: 'M-202',
    loadRef: 'M-202',
    destination: 'Freshway Grocery DC',
    cargoType: 'wrapped-pallet',
    handlingCode: 'STANDARD',
    handlingLabel: 'STANDARD',
    weightLbs: 1200,
    expected: true,
    shapeId: 'standard',
    shape: [[0, 0]],
  }
  const freight = [...current, later]
  const blockedPlacements = {
    [current[0].id]: { anchorCell: 0, rotation: 0 },
    [current[1].id]: { anchorCell: 1, rotation: 0 },
    [current[2].id]: { anchorCell: 2, rotation: 0 },
    [later.id]: { anchorCell: 20, rotation: 0 },
  }

  const blocked = evaluateDeliveryUnloadAccess({
    board,
    freight,
    placements: blockedPlacements,
    deliveryEvent: delivery,
  })
  assert.equal(blocked.clear, false)

  const repositioned = evaluateDeliveryUnloadAccess({
    board,
    freight,
    placements: {
      ...blockedPlacements,
      [later.id]: { anchorCell: 3, rotation: 0 },
    },
    deliveryEvent: delivery,
  })

  assert.equal(repositioned.clear, true)
  assert.equal(repositioned.currentlyBlockedFreightIds.length, 0)
})

test('temporary staging has three pallet-equivalent positions and respects freight footprint', () => {
  const single = {
    id: 'single',
    shape: [[0, 0]],
  }
  const double = {
    id: 'double',
    shape: [[0, 0], [1, 0]],
  }
  const oversized = {
    id: 'oversized',
    shape: [[0, 0], [1, 0], [0, 1], [1, 1]],
  }
  const allFreight = [single, double, oversized]

  const singlePlacement = findDeliveryStagingPlacement({
    freight: single,
    allFreight,
    stagingPlacements: {},
  })
  assert.deepEqual(singlePlacement, { startSlot: 0, size: 1 })

  const doublePlacement = findDeliveryStagingPlacement({
    freight: double,
    allFreight,
    stagingPlacements: {
      [single.id]: singlePlacement,
    },
  })
  assert.deepEqual(doublePlacement, { startSlot: 1, size: 2 })

  const staging = evaluateDeliveryStaging({
    freight: allFreight,
    stagingPlacements: {
      [single.id]: singlePlacement,
      [double.id]: doublePlacement,
    },
  })

  assert.equal(staging.capacity, DELIVERY_STAGING_CAPACITY)
  assert.equal(staging.used, 3)
  assert.equal(staging.available, 0)
  assert.equal(staging.clear, true)

  const tooLarge = findDeliveryStagingPlacement({
    freight: oversized,
    allFreight,
    stagingPlacements: {},
  })
  assert.equal(tooLarge, null)
})

test('later-stop freight cannot remain in Temp Staging when receiver handoff is complete', () => {
  const board = buildTrailerPuzzleBoard(driver.equipment)
  const expected = buildTutorialStagedFreight(pickup).filter((item) => item.expected)
  const later = {
    id: 'M-202:pickup:pallet-1',
    label: 'Pallet 01',
    loadId: 'M-202',
    loadRef: 'M-202',
    destination: 'Freshway Grocery DC',
    cargoType: 'wrapped-pallet',
    handlingCode: 'STANDARD',
    handlingLabel: 'STANDARD',
    weightLbs: 1200,
    expected: true,
    shapeId: 'standard',
    shape: [[0, 0]],
  }
  const freight = [...expected, later]
  const driverDay = {
    driverId: driver.id,
    timeline: [pickup, delivery],
  }
  const protocol = protocolPlan(delivery, freight)

  const stagedPlan = evaluateDeliveryUnloadPlan({
    board,
    driverDay,
    event: delivery,
    freight,
    placements: {
      [later.id]: { anchorCell: 20, rotation: 0 },
    },
    ...protocol,
    temporaryStagedFreightIds: [later.id],
    rehandledFreightIds: [later.id],
    stagingPlacements: {
      [later.id]: { startSlot: 0, size: 1, rotation: 0 },
    },
  })

  assert.equal(stagedPlan.ready, false)
  assert.ok(stagedPlan.errors.some((issue) => (
    issue.code === 'STAGED_FREIGHT_NOT_RELOADED'
  )))

  const returnedPlan = evaluateDeliveryUnloadPlan({
    board,
    driverDay,
    event: delivery,
    freight,
    placements: {
      [later.id]: { anchorCell: 20, rotation: 0 },
    },
    ...protocol,
    temporaryStagedFreightIds: [],
    rehandledFreightIds: [later.id],
    stagingPlacements: {},
  })

  assert.equal(returnedPlan.ready, true)
  assert.equal(returnedPlan.rehandleUnits, 1)
})

test('delivery commit persists internal reposition history separately from rehandles', () => {
  const { board, facilityOperations } = committedPickupState()
  const driverDay = {
    driverId: driver.id,
    timeline: [pickup, delivery],
  }
  const trailer = buildTrailerStateForDelivery({
    driverId: driver.id,
    eventId: delivery.id,
    driverDay,
    facilityOperations,
  })
  const movedFreightId = trailer.freight[0].id
  const protocol = protocolPlan(delivery, trailer.freight)
  const plan = evaluateDeliveryUnloadPlan({
    board,
    driverDay,
    event: delivery,
    freight: trailer.freight,
    placements: trailer.placements,
    ...protocol,
    internalRepositionHistory: [{
      freightId: movedFreightId,
      from: { anchorCell: 16, rotation: 0 },
      to: { anchorCell: 20, rotation: 0 },
    }],
  })

  const operation = commitDeliveryOperation({
    driverId: driver.id,
    event: delivery,
    trailerState: { ...trailer, board },
    unloadPlan: plan,
    currentAbsoluteMinutes: 700,
  })

  assert.equal(operation.unloadPlan.internalRepositionCount, 1)
  assert.equal(operation.unloadPlan.rehandleUnits, 0)
  assert.ok(
    operation.deliveredFreight
      .find((freight) => freight.id === movedFreightId)
      .freightHistory
      .some((entry) => entry.event === 'REPOSITIONED_IN_TRAILER'),
  )
})

test('Harborline receiving SOP creates handling phases from the actual freight', () => {
  const event8 = {
    ...delivery,
    freight: { pallets: 8, weightLbs: 12000 },
  }
  const pickup8 = {
    ...pickup,
    freight: { pallets: 8, weightLbs: 12000 },
  }
  const freight = buildTutorialStagedFreight(pickup8)
    .filter((item) => item.expected)
  const protocol = buildDeliveryReceivingProtocol({
    event: event8,
    freight,
  })

  assert.equal(protocol.label, 'HARBORLINE RECEIVING SOP')
  assert.deepEqual(
    protocol.phases.map((phase) => phase.id),
    ['controlled', 'forklift', 'inspection', 'general'],
  )
  assert.ok(protocol.phases[0].freightIds.some((id) => (
    freight.find((item) => item.id === id)?.handlingCode === 'HAZMAT'
  )))
  assert.ok(protocol.phases[1].freightIds.every((id) => (
    ['HEAVY', 'OVERSIZE'].includes(
      freight.find((item) => item.id === id)?.handlingCode,
    )
  )))
})

test('facility receiving protocol rejects later phases and wrong receiving zones', () => {
  const event8 = {
    ...delivery,
    freight: { pallets: 8, weightLbs: 12000 },
  }
  const pickup8 = {
    ...pickup,
    freight: { pallets: 8, weightLbs: 12000 },
  }
  const freight = buildTutorialStagedFreight(pickup8)
    .filter((item) => item.expected)
  const protocol = buildDeliveryReceivingProtocol({
    event: event8,
    freight,
  })
  const controlledId = protocol.phases[0].freightIds[0]
  const generalId = protocol.phases.at(-1).freightIds[0]

  const outOfOrder = evaluateDeliveryReceivingProtocol({
    event: event8,
    freight,
    unloadedFreightIds: [generalId],
    receivingZoneByFreightId: {
      [generalId]: 'general',
    },
  })
  assert.equal(outOfOrder.sequenceViolations.length, 1)

  const wrongZone = evaluateDeliveryReceivingProtocol({
    event: event8,
    freight,
    unloadedFreightIds: [controlledId],
    receivingZoneByFreightId: {
      [controlledId]: 'general',
    },
  })
  assert.equal(wrongZone.zoneViolations.length, 1)

  const correct = evaluateDeliveryReceivingProtocol({
    event: event8,
    freight,
    unloadedFreightIds: [controlledId],
    receivingZoneByFreightId: {
      [controlledId]: 'controlled',
    },
  })
  assert.equal(correct.sequenceViolations.length, 0)
  assert.equal(correct.zoneViolations.length, 0)
  assert.equal(correct.currentPhase.id, 'forklift')
})

test('delivery operation transitions from unloading to receiver verification to complete', () => {
  const { board, expected, facilityOperations } = committedPickupState()
  const driverDay = {
    driverId: driver.id,
    timeline: [pickup, delivery],
  }
  const trailer = buildTrailerStateForDelivery({
    driverId: driver.id,
    eventId: delivery.id,
    driverDay,
    facilityOperations,
  })
  const plan = evaluateDeliveryUnloadPlan({
    board,
    driverDay,
    event: delivery,
    freight: trailer.freight,
    placements: trailer.placements,
    ...protocolPlan(delivery, trailer.freight),
  })
  const operation = commitDeliveryOperation({
    driverId: driver.id,
    event: delivery,
    trailerState: { ...trailer, board },
    unloadPlan: plan,
    currentAbsoluteMinutes: 700,
  })

  assert.equal(deliveryOperationPhase(operation, 700), 'unloading')
  assert.equal(
    deliveryOperationPhase(operation, operation.unloadingCompleteMinutes),
    'receiver-verification',
  )
  assert.equal(
    deliveryOperationPhase(operation, operation.receiverVerificationCompleteMinutes),
    'complete',
  )
})
