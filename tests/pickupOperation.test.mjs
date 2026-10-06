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
  evaluateTrailerFragileProtection,
  evaluateTrailerHazmatSegregation,
  evaluateTrailerWeightBalance,
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
  assert.ok(expected.some((item) => item.handlingCode === 'HAZMAT'))
  const hazmat = expected.find((item) => item.handlingCode === 'HAZMAT')
  assert.ok(hazmat.hazmatClassCode)
  assert.ok(hazmat.hazmatClassLabel)
  assert.match(hazmat.handlingLabel, /^HAZMAT /)
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

test('later stops inherit an explicit delivery trailer snapshot when one exists', () => {
  const firstPickup = {
    ...event,
    id: 'M-101:pickup',
    loadId: 'M-101',
    loadRef: 'M-101',
  }
  const firstDelivery = {
    ...event,
    id: 'M-101:delivery',
    role: 'delivery',
    loadId: 'M-101',
    loadRef: 'M-101',
  }
  const laterPickup = {
    ...event,
    id: 'M-202:pickup',
    loadId: 'M-202',
    loadRef: 'M-202',
  }
  const firstFreight = buildTutorialStagedFreight(firstPickup)
    .filter((item) => item.expected)
  const refused = {
    ...firstFreight[0],
    id: 'M-101:pickup:refused',
    status: 'REFUSED',
    receiverStatus: 'REFUSED',
  }
  const pickupOperation = commitPickupOperation({
    driverId: 'marcus-reed',
    event: firstPickup,
    currentAbsoluteMinutes: 500,
    loadPlan: {
      freightIds: firstFreight.map((item) => item.id),
      freightManifest: firstFreight,
      placements: {
        [firstFreight[0].id]: { anchorCell: 0, rotation: 0 },
        [firstFreight[1].id]: { anchorCell: 6, rotation: 0 },
        [firstFreight[2].id]: { anchorCell: 12, rotation: 0 },
      },
      board: buildTrailerPuzzleBoard(equipment),
    },
  })
  const deliveryKey = 'marcus-reed:M-101:delivery'
  const facilityOperations = {
    [pickupOperation.key]: pickupOperation,
    [deliveryKey]: {
      key: deliveryKey,
      eventId: firstDelivery.id,
      trailerAfter: {
        freightManifest: [refused],
        placements: {
          [refused.id]: { anchorCell: 18, rotation: 0 },
        },
      },
    },
  }

  const state = buildOnboardCargoForPickup({
    driverId: 'marcus-reed',
    eventId: laterPickup.id,
    driverDay: {
      timeline: [firstPickup, firstDelivery, laterPickup],
    },
    facilityOperations,
  })

  assert.equal(state.freight.length, 1)
  assert.equal(state.freight[0].id, refused.id)
  assert.equal(state.freight[0].receiverStatus, 'REFUSED')
  assert.deepEqual(state.placements[refused.id], { anchorCell: 18, rotation: 0 })
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

test('light trailer loads keep weight distribution advisory', () => {
  const board = buildTrailerPuzzleBoard(equipment)
  const freight = [{
    id: 'light-1',
    loadId: 'LIGHT',
    loadRef: 'LIGHT',
    weightLbs: 3000,
    expected: true,
    shape: [[0, 0]],
  }]

  const balance = evaluateTrailerWeightBalance({
    board,
    stagedFreight: freight,
    placements: {
      'light-1': { anchorCell: 0, rotation: 0 },
    },
  })

  assert.equal(balance.active, false)
  assert.equal(balance.clear, true)
  assert.equal(balance.status, 'LIGHT_LOAD')
  assert.equal(balance.activationWeightLbs, 8800)
})

test('completed heavy loads must be balanced front-to-rear and left-to-right', () => {
  const board = buildTrailerPuzzleBoard(equipment)
  const stagedFreight = Array.from({ length: 8 }, (_, index) => ({
    id: `balance-${index + 1}`,
    loadId: 'BAL-101',
    loadRef: 'BAL-101',
    weightLbs: 1500,
    expected: true,
    shape: [[0, 0]],
  }))
  const requiredFreightIds = stagedFreight.map((freight) => freight.id)

  const frontLeftCells = [0, 1, 4, 5, 8, 9, 12, 13]
  const unbalancedPlacements = Object.fromEntries(
    stagedFreight.map((freight, index) => [
      freight.id,
      { anchorCell: frontLeftCells[index], rotation: 0 },
    ]),
  )

  const unbalanced = evaluateTrailerWeightBalance({
    board,
    stagedFreight,
    placements: unbalancedPlacements,
  })

  assert.equal(unbalanced.active, true)
  assert.equal(unbalanced.clear, false)
  assert.ok(unbalanced.frontPercent > 65)
  assert.ok(unbalanced.leftPercent > 65)
  assert.ok(unbalanced.issues.some((issue) => issue.code === 'FRONT_HEAVY'))
  assert.ok(unbalanced.issues.some((issue) => issue.code === 'LEFT_HEAVY'))

  const blockedPlan = evaluatePickupLoadPlan({
    event: {
      ...event,
      loadId: 'BAL-101',
      loadRef: 'BAL-101',
      freight: { pallets: 8, weightLbs: 12000 },
    },
    board,
    stagedFreight,
    placements: unbalancedPlacements,
    requiredFreightIds,
  })

  assert.equal(blockedPlan.weightBalance.enforced, true)
  assert.equal(blockedPlan.ready, false)
  assert.ok(blockedPlan.errors.some((issue) => (
    issue.code === 'WEIGHT_DISTRIBUTION_UNBALANCED'
  )))

  const balancedCells = [0, 3, 8, 11, 16, 19, 21, 23]
  const balancedPlacements = Object.fromEntries(
    stagedFreight.map((freight, index) => [
      freight.id,
      { anchorCell: balancedCells[index], rotation: 0 },
    ]),
  )
  const balancedPlan = evaluatePickupLoadPlan({
    event: {
      ...event,
      loadId: 'BAL-101',
      loadRef: 'BAL-101',
      freight: { pallets: 8, weightLbs: 12000 },
    },
    board,
    stagedFreight,
    placements: balancedPlacements,
    requiredFreightIds,
  })

  assert.equal(balancedPlan.weightBalance.active, true)
  assert.equal(balancedPlan.weightBalance.enforced, true)
  assert.equal(balancedPlan.weightBalance.clear, true)
  assert.equal(balancedPlan.weightBalance.frontPercent, 50)
  assert.equal(balancedPlan.weightBalance.rearPercent, 50)
  assert.equal(balancedPlan.weightBalance.leftPercent, 50)
  assert.equal(balancedPlan.weightBalance.rightPercent, 50)
  assert.equal(balancedPlan.ready, true)
})

test('fragile protection detects edge-adjacent heavy or oversize freight', () => {
  const board = buildTrailerPuzzleBoard(equipment)
  const fragile = {
    id: 'fragile-1',
    label: 'Crate 01',
    loadId: 'F-101',
    loadRef: 'F-101',
    handlingCode: 'FRAGILE',
    weightLbs: 1500,
    expected: true,
    shape: [[0, 0]],
  }
  const heavy = {
    id: 'heavy-1',
    label: 'Long Skid 02',
    loadId: 'F-101',
    loadRef: 'F-101',
    handlingCode: 'HEAVY',
    weightLbs: 1500,
    expected: true,
    shape: [[0, 0]],
  }
  const stagedFreight = [fragile, heavy]

  const adjacent = evaluateTrailerFragileProtection({
    board,
    stagedFreight,
    placements: {
      [fragile.id]: { anchorCell: 0, rotation: 0 },
      [heavy.id]: { anchorCell: 1, rotation: 0 },
    },
  })

  assert.equal(adjacent.active, true)
  assert.equal(adjacent.clear, false)
  assert.deepEqual(adjacent.fragileFreightIds, [fragile.id])
  assert.deepEqual(adjacent.riskFreightIds, [heavy.id])
  assert.equal(adjacent.conflicts[0].riskHandlingCode, 'HEAVY')

  const separated = evaluateTrailerFragileProtection({
    board,
    stagedFreight,
    placements: {
      [fragile.id]: { anchorCell: 0, rotation: 0 },
      [heavy.id]: { anchorCell: 2, rotation: 0 },
    },
  })

  assert.equal(separated.clear, true)
})

test('fragile protection becomes enforceable when the current pickup is complete', () => {
  const board = buildTrailerPuzzleBoard(equipment)
  const fragile = {
    id: 'fragile-1',
    label: 'Crate 01',
    loadId: 'F-101',
    loadRef: 'F-101',
    handlingCode: 'FRAGILE',
    weightLbs: 1500,
    expected: true,
    shape: [[0, 0]],
  }
  const oversize = {
    id: 'oversize-1',
    label: 'Machinery Crate 02',
    loadId: 'F-101',
    loadRef: 'F-101',
    handlingCode: 'OVERSIZE',
    weightLbs: 1500,
    expected: true,
    shape: [[0, 0]],
  }
  const stagedFreight = [fragile, oversize]
  const placements = {
    [fragile.id]: { anchorCell: 4, rotation: 0 },
    [oversize.id]: { anchorCell: 5, rotation: 0 },
  }

  const plan = evaluatePickupLoadPlan({
    event: {
      ...event,
      loadId: 'F-101',
      loadRef: 'F-101',
      freight: { pallets: 2, weightLbs: 3000 },
    },
    board,
    stagedFreight,
    placements,
    requiredFreightIds: [fragile.id, oversize.id],
  })

  assert.equal(plan.fragileProtection.enforced, true)
  assert.equal(plan.fragileProtection.clear, false)
  assert.equal(plan.ready, false)
  assert.ok(plan.errors.some((issue) => (
    issue.code === 'FRAGILE_PROTECTION_CONFLICT'
  )))
})

test('tutorial hazmat classes are deterministic by load and visibly marked', () => {
  const first = buildTutorialStagedFreight({
    ...event,
    id: 'M-101:pickup',
    loadId: 'M-101',
    loadRef: 'M-101',
    freight: { pallets: 6, weightLbs: 9000 },
  }).find((item) => item.handlingCode === 'HAZMAT')

  const second = buildTutorialStagedFreight({
    ...event,
    id: 'M-202:pickup',
    loadId: 'M-202',
    loadRef: 'M-202',
    freight: { pallets: 6, weightLbs: 9000 },
  }).find((item) => item.handlingCode === 'HAZMAT')

  assert.ok(first)
  assert.ok(second)
  assert.notEqual(first.hazmatClassCode, second.hazmatClassCode)
  assert.match(first.handlingLabel, /^HAZMAT /)
  assert.match(second.handlingLabel, /^HAZMAT /)
})

test('incompatible tutorial hazmat classes require floor separation', () => {
  const board = buildTrailerPuzzleBoard(equipment)
  const class3 = {
    id: 'hazmat-3',
    label: 'Drum Pallet 01',
    loadId: 'HZ-3',
    loadRef: 'HZ-3',
    handlingCode: 'HAZMAT',
    handlingLabel: 'HAZMAT 3',
    hazmatClassCode: '3',
    hazmatClassLabel: 'FLAMMABLE LIQUID',
    weightLbs: 1500,
    expected: true,
    shape: [[0, 0]],
  }
  const class51 = {
    id: 'hazmat-51',
    label: 'Drum Pallet 02',
    loadId: 'HZ-51',
    loadRef: 'HZ-51',
    handlingCode: 'HAZMAT',
    handlingLabel: 'HAZMAT 5.1',
    hazmatClassCode: '5.1',
    hazmatClassLabel: 'OXIDIZER',
    weightLbs: 1500,
    expected: true,
    shape: [[0, 0]],
  }
  const stagedFreight = [class3, class51]

  const adjacent = evaluateTrailerHazmatSegregation({
    board,
    stagedFreight,
    placements: {
      [class3.id]: { anchorCell: 0, rotation: 0 },
      [class51.id]: { anchorCell: 1, rotation: 0 },
    },
  })

  assert.equal(adjacent.active, true)
  assert.equal(adjacent.clear, false)
  assert.deepEqual(
    new Set(adjacent.conflictFreightIds),
    new Set([class3.id, class51.id]),
  )

  const separated = evaluateTrailerHazmatSegregation({
    board,
    stagedFreight,
    placements: {
      [class3.id]: { anchorCell: 0, rotation: 0 },
      [class51.id]: { anchorCell: 2, rotation: 0 },
    },
  })

  assert.equal(separated.active, true)
  assert.equal(separated.clear, true)
})

test('hazmat segregation becomes enforceable after the pickup is complete', () => {
  const board = buildTrailerPuzzleBoard(equipment)
  const stagedFreight = [
    {
      id: 'hazmat-3',
      label: 'Drum Pallet 01',
      loadId: 'HZ',
      loadRef: 'HZ',
      handlingCode: 'HAZMAT',
      handlingLabel: 'HAZMAT 3',
      hazmatClassCode: '3',
      hazmatClassLabel: 'FLAMMABLE LIQUID',
      weightLbs: 1500,
      expected: true,
      shape: [[0, 0]],
    },
    {
      id: 'hazmat-51',
      label: 'Drum Pallet 02',
      loadId: 'HZ',
      loadRef: 'HZ',
      handlingCode: 'HAZMAT',
      handlingLabel: 'HAZMAT 5.1',
      hazmatClassCode: '5.1',
      hazmatClassLabel: 'OXIDIZER',
      weightLbs: 1500,
      expected: true,
      shape: [[0, 0]],
    },
  ]
  const placements = {
    'hazmat-3': { anchorCell: 8, rotation: 0 },
    'hazmat-51': { anchorCell: 9, rotation: 0 },
  }

  const plan = evaluatePickupLoadPlan({
    event: {
      ...event,
      loadId: 'HZ',
      loadRef: 'HZ',
      freight: { pallets: 2, weightLbs: 3000 },
    },
    board,
    stagedFreight,
    placements,
    requiredFreightIds: stagedFreight.map((item) => item.id),
  })

  assert.equal(plan.hazmatSegregation.enforced, true)
  assert.equal(plan.hazmatSegregation.clear, false)
  assert.equal(plan.ready, false)
  assert.ok(plan.errors.some((issue) => (
    issue.code === 'HAZMAT_SEGREGATION_CONFLICT'
  )))
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
