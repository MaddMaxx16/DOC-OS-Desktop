import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDeliveryAccessOrder,
  buildOnboardCargoForPickup,
  buildTrailerPuzzleBoard,
  buildTutorialStagedFreight,
  canPlaceFreight,
  commitPickupOperation,
  dockNumberForPickup,
  evaluatePickupLoadPlan,
  evaluateTrailerDeliveryAccess,
  facilityOperationKey,
  footprintCellIndexes,
  pickupPlanCommitted,
  rotateFreightShape,
} from '../src/domain/facility/pickupOperation.js'

const event = {
  id: 'M-101:pickup',
  kind: 'freight-stop',
  role: 'pickup',
  loadId: 'M-101',
  loadRef: 'M-101',
  locationId: 'empire-freight-terminal',
  locationLabel: 'Empire Freight Terminal',
  deliveryLocationLabel: 'Harborline Logistics',
  freight: { pallets: 3, weightLbs: 2400 },
  serviceMinutes: 12,
}

const equipment = {
  label: "53' Dry Van",
  capacityPallets: 26,
  maxWeightLbs: 44000,
}

test('trailer puzzle board derives its usable puzzle cells from the assigned equipment', () => {
  const board = buildTrailerPuzzleBoard(equipment)

  assert.equal(board.label, "53' Dry Van")
  assert.equal(board.capacityPallets, 26)
  assert.equal(board.usableCells, 26)
  assert.equal(board.columns, 4)
  assert.equal(board.rows, 7)
  assert.equal(board.maxWeightLbs, 44000)

  const smaller = buildTrailerPuzzleBoard({
    label: 'City Box Truck',
    capacityPallets: 12,
    maxWeightLbs: 18000,
  })

  assert.equal(smaller.usableCells, 12)
  assert.equal(smaller.columns, 3)
  assert.equal(smaller.rows, 4)
  assert.equal(smaller.maxWeightLbs, 18000)
})

test('staged freight uses realistic rectangular footprints and readable handling identity', () => {
  const staged = buildTutorialStagedFreight({
    ...event,
    freight: { pallets: 8, weightLbs: 12000 },
  })
  const expected = staged.filter((item) => item.expected)
  const noise = staged.filter((item) => !item.expected)

  assert.equal(expected.length, 8)
  assert.equal(noise.length, 1)
  assert.ok(expected.every((item) => item.loadRef === 'M-101'))
  assert.ok(expected.every((item) => item.destination === 'Harborline Logistics'))
  assert.ok(expected.every((item) => item.handlingLabel))
  assert.ok(expected.every((item) => item.cargoType))
  assert.ok(expected.some((item) => item.handlingLabel === 'FRAGILE'))
  assert.ok(expected.some((item) => item.handlingLabel === 'HAZMAT'))
  assert.ok(expected.some((item) => item.handlingLabel === 'HEAVY'))
  assert.ok(expected.some((item) => item.shape.length > 1))
  assert.ok(expected.every((item) => item.shapeId !== 'l-overhang'))
  assert.notEqual(noise[0].loadRef, 'M-101')
})

test('freight shapes rotate and reject overlap or out-of-bounds placement', () => {
  const board = buildTrailerPuzzleBoard(equipment)
  const staged = buildTutorialStagedFreight(event)
  const first = staged[0]
  const second = staged[1]

  assert.deepEqual(
    rotateFreightShape([[0, 0], [0, 1]], 1),
    [[0, 0], [1, 0]],
  )

  const firstCells = footprintCellIndexes({
    board,
    freight: first,
    anchorCell: 0,
    rotation: 0,
  })
  assert.ok(firstCells.length >= 1)

  const overlap = canPlaceFreight({
    board,
    stagedFreight: staged,
    placements: {
      [first.id]: { anchorCell: 0, rotation: 0 },
    },
    freightId: second.id,
    anchorCell: 0,
    rotation: 0,
  })
  assert.equal(overlap.valid, false)
  assert.equal(overlap.reason, 'OVERLAP')

  const out = canPlaceFreight({
    board,
    stagedFreight: staged,
    placements: {},
    freightId: staged[2].id,
    anchorCell: board.usableCells - 1,
    rotation: 0,
  })
  assert.equal(out.valid, false)
  assert.equal(out.reason, 'OUT_OF_BOUNDS')
})

test('placing the booked freight is verification; no separate verify state is required', () => {
  const board = buildTrailerPuzzleBoard(equipment)
  const staged = buildTutorialStagedFreight(event)
  const expected = staged.filter((item) => item.expected)
  const expectedIds = expected.map((item) => item.id)

  const incomplete = evaluatePickupLoadPlan({
    event,
    board,
    stagedFreight: staged,
    requiredFreightIds: expectedIds,
    placements: {
      [expectedIds[0]]: { anchorCell: 0, rotation: 0 },
      [expectedIds[1]]: { anchorCell: 6, rotation: 0 },
    },
  })
  assert.equal(incomplete.ready, false)
  assert.ok(incomplete.errors.some((issue) => issue.code === 'REQUIRED_FREIGHT_NOT_PLANNED'))

  const ready = evaluatePickupLoadPlan({
    event,
    board,
    stagedFreight: staged,
    requiredFreightIds: expectedIds,
    placements: {
      [expectedIds[0]]: { anchorCell: 0, rotation: 0 },
      [expectedIds[1]]: { anchorCell: 6, rotation: 0 },
      [expectedIds[2]]: { anchorCell: 12, rotation: 0 },
    },
  })
  assert.equal(ready.ready, true)
  assert.equal(ready.plannedExpectedCount, 3)
  assert.equal(ready.onboardCount, 3)
  assert.ok(ready.occupiedCells >= 4)

  const wrong = evaluatePickupLoadPlan({
    event,
    board,
    stagedFreight: staged,
    requiredFreightIds: expectedIds,
    placements: {
      [expectedIds[0]]: { anchorCell: 0, rotation: 0 },
      [expectedIds[1]]: { anchorCell: 6, rotation: 0 },
      [expectedIds[2]]: { anchorCell: 12, rotation: 0 },
      [staged.at(-1).id]: { anchorCell: 20, rotation: 0 },
    },
  })
  assert.equal(wrong.ready, false)
  assert.ok(wrong.errors.some((issue) => issue.code === 'WRONG_LOAD'))
})

test('later pickups inherit committed cargo until that load has been delivered', () => {
  const firstPickup = {
    ...event,
    id: 'M-101:pickup',
  }
  const secondPickup = {
    ...event,
    id: 'M-202:pickup',
    loadId: 'M-202',
    loadRef: 'M-202',
    locationId: 'queens-freight-center',
    locationLabel: 'Queens Freight Center',
  }
  const firstDelivery = {
    ...event,
    id: 'M-101:delivery',
    role: 'delivery',
  }
  const thirdPickup = {
    ...event,
    id: 'M-303:pickup',
    loadId: 'M-303',
    loadRef: 'M-303',
  }

  const firstFreight = buildTutorialStagedFreight(firstPickup).filter((item) => item.expected)
  const firstPlacements = {
    [firstFreight[0].id]: { anchorCell: 0, rotation: 0 },
    [firstFreight[1].id]: { anchorCell: 6, rotation: 0 },
    [firstFreight[2].id]: { anchorCell: 12, rotation: 0 },
  }
  const firstOperation = commitPickupOperation({
    driverId: 'marcus-reed',
    event: firstPickup,
    currentAbsoluteMinutes: 503,
    loadPlan: {
      freightIds: Object.keys(firstPlacements),
      freightManifest: firstFreight,
      placements: firstPlacements,
      board: buildTrailerPuzzleBoard(equipment),
    },
  })
  const facilityOperations = {
    [firstOperation.key]: firstOperation,
  }

  const beforeSecondPickup = buildOnboardCargoForPickup({
    driverId: 'marcus-reed',
    eventId: secondPickup.id,
    driverDay: {
      timeline: [firstPickup, secondPickup, firstDelivery, thirdPickup],
    },
    facilityOperations,
  })

  assert.equal(beforeSecondPickup.freight.length, 3)
  assert.equal(Object.keys(beforeSecondPickup.placements).length, 3)
  assert.ok(beforeSecondPickup.freight.every((item) => item.loadRef === 'M-101'))

  const afterDelivery = buildOnboardCargoForPickup({
    driverId: 'marcus-reed',
    eventId: thirdPickup.id,
    driverDay: {
      timeline: [firstPickup, secondPickup, firstDelivery, thirdPickup],
    },
    facilityOperations,
  })

  assert.equal(afterDelivery.freight.length, 0)
  assert.equal(Object.keys(afterDelivery.placements).length, 0)
})

test('delivery-access order follows the remaining Driver Day delivery sequence', () => {
  const firstPickup = {
    ...event,
    id: 'M-101:pickup',
    loadId: 'M-101',
    loadRef: 'M-101',
  }
  const secondPickup = {
    ...event,
    id: 'M-202:pickup',
    loadId: 'M-202',
    loadRef: 'M-202',
  }
  const firstDelivery = {
    ...firstPickup,
    id: 'M-101:delivery',
    role: 'delivery',
    locationLabel: 'Harborline Logistics',
  }
  const secondDelivery = {
    ...secondPickup,
    id: 'M-202:delivery',
    role: 'delivery',
    locationLabel: 'Freshway Grocery DC',
  }
  const freight = [
    ...buildTutorialStagedFreight(firstPickup).filter((item) => item.expected),
    ...buildTutorialStagedFreight(secondPickup).filter((item) => item.expected),
  ]

  const order = buildDeliveryAccessOrder({
    driverDay: {
      timeline: [firstPickup, secondPickup, firstDelivery, secondDelivery],
    },
    eventId: secondPickup.id,
    freight,
  })

  assert.deepEqual(
    order.map((stop) => [stop.rank, stop.loadRef]),
    [[1, 'M-101'], [2, 'M-202']],
  )
})

test('later-delivery freight behind an earlier load blocks rear-door access', () => {
  const board = buildTrailerPuzzleBoard(equipment)
  const firstPickup = {
    ...event,
    id: 'M-101:pickup',
    loadId: 'M-101',
    loadRef: 'M-101',
    freight: { pallets: 1, weightLbs: 1500 },
  }
  const secondPickup = {
    ...event,
    id: 'M-202:pickup',
    loadId: 'M-202',
    loadRef: 'M-202',
    freight: { pallets: 1, weightLbs: 1500 },
  }
  const firstFreight = buildTutorialStagedFreight(firstPickup).find((item) => item.expected)
  const secondFreight = buildTutorialStagedFreight(secondPickup).find((item) => item.expected)
  const stagedFreight = [firstFreight, secondFreight]
  const deliveryOrder = [
    { rank: 1, loadId: 'M-101', loadRef: 'M-101' },
    { rank: 2, loadId: 'M-202', loadRef: 'M-202' },
  ]

  const blockedPlacements = {
    [firstFreight.id]: { anchorCell: 0, rotation: 0 },
    [secondFreight.id]: { anchorCell: 20, rotation: 0 },
  }
  const blocked = evaluateTrailerDeliveryAccess({
    board,
    stagedFreight,
    placements: blockedPlacements,
    deliveryOrder,
  })

  assert.equal(blocked.clear, false)
  assert.deepEqual(blocked.blockedFreightIds, [firstFreight.id])
  assert.deepEqual(blocked.blockingFreightIds, [secondFreight.id])
  assert.equal(blocked.pairSummaries[0].blockedLoadRef, 'M-101')
  assert.equal(blocked.pairSummaries[0].blockingLoadRef, 'M-202')

  const blockedPlan = evaluatePickupLoadPlan({
    event: secondPickup,
    board,
    stagedFreight,
    placements: blockedPlacements,
    requiredFreightIds: [secondFreight.id],
    deliveryOrder,
  })
  assert.equal(blockedPlan.ready, false)
  assert.ok(blockedPlan.errors.some((issue) => issue.code === 'DELIVERY_ACCESS_BLOCKED'))

  const clearPlacements = {
    [firstFreight.id]: { anchorCell: 20, rotation: 0 },
    [secondFreight.id]: { anchorCell: 0, rotation: 0 },
  }
  const clearPlan = evaluatePickupLoadPlan({
    event: secondPickup,
    board,
    stagedFreight,
    placements: clearPlacements,
    requiredFreightIds: [secondFreight.id],
    deliveryOrder,
  })

  assert.equal(clearPlan.deliveryAccess.clear, true)
  assert.equal(clearPlan.ready, true)
})

test('committing the rear doors preserves the solved trailer snapshot and starts loading now', () => {
  const board = buildTrailerPuzzleBoard(equipment)
  const operation = commitPickupOperation({
    driverId: 'marcus-reed',
    event,
    currentAbsoluteMinutes: 503,
    loadPlan: {
      freightIds: ['a', 'b', 'c'],
      freightManifest: [],
      placements: {
        a: { anchorCell: 0, rotation: 0 },
        b: { anchorCell: 6, rotation: 1 },
        c: { anchorCell: 12, rotation: 0 },
      },
      board,
    },
  })

  assert.equal(operation.key, facilityOperationKey('marcus-reed', event.id))
  assert.equal(operation.dock, dockNumberForPickup(event))
  assert.equal(operation.status, 'plan-committed')
  assert.equal(operation.loadingStartMinutes, 503)
  assert.equal(operation.loadingDurationMinutes, 12)
  assert.equal(operation.loadPlan.board.usableCells, 26)
  assert.equal(pickupPlanCommitted(operation), true)
})
