import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildTrailerPuzzleBoard,
  buildTutorialStagedFreight,
  commitPickupOperation,
} from '../src/domain/facility/pickupOperation.js'
import {
  buildTrailerStateForDelivery,
  commitDeliveryOperation,
  deliveryOperationPhase,
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

test('a clean rear-accessible delivery unload plan is immediately ready', () => {
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
    selectedFreightIds: expected.map((item) => item.id),
  })

  assert.equal(plan.ready, true)
  assert.equal(plan.expectedCount, 3)
  assert.equal(plan.actualCount, 3)
  assert.equal(plan.selectedCount, 3)
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

  const clear = evaluateDeliveryUnloadAccess({
    board,
    freight,
    placements,
    deliveryEvent: delivery,
    temporaryStagedFreightIds: [later.id],
  })

  assert.equal(clear.clear, true)
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
    selectedFreightIds: expected.map((item) => item.id),
    temporaryStagedFreightIds: [later.id],
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
  assert.equal(operation.podSeed.deliveredPieces, expected.length)
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
    selectedFreightIds: expected.map((item) => item.id),
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
