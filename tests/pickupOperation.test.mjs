import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildTrailerPuzzleBoard,
  buildTutorialStagedFreight,
  canPlaceFreight,
  commitPickupOperation,
  dockNumberForPickup,
  evaluatePickupLoadPlan,
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

test('tutorial staged freight exposes different shaped puzzle pieces plus discoverable noise freight', () => {
  const staged = buildTutorialStagedFreight(event)
  const expected = staged.filter((item) => item.expected)
  const noise = staged.filter((item) => !item.expected)

  assert.equal(expected.length, 3)
  assert.equal(noise.length, 1)
  assert.ok(expected.every((item) => item.loadRef === 'M-101'))
  assert.ok(expected.every((item) => item.destination === 'Harborline Logistics'))
  assert.ok(expected.every((item) => Array.isArray(item.shape) && item.shape.length >= 1))
  assert.ok(expected.some((item) => item.shape.length === 1))
  assert.ok(expected.some((item) => item.shape.length > 1))
  assert.ok(new Set(expected.map((item) => item.shapeId)).size > 1)
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

test('load plan is ready only when expected shaped freight is verified and legally placed', () => {
  const board = buildTrailerPuzzleBoard(equipment)
  const staged = buildTutorialStagedFreight(event)
  const expected = staged.filter((item) => item.expected)
  const expectedIds = expected.map((item) => item.id)

  const incomplete = evaluatePickupLoadPlan({
    event,
    board,
    stagedFreight: staged,
    verifiedIds: expectedIds.slice(0, 2),
    placements: {
      [expectedIds[0]]: { anchorCell: 0, rotation: 0 },
      [expectedIds[1]]: { anchorCell: 6, rotation: 0 },
    },
  })
  assert.equal(incomplete.ready, false)
  assert.ok(incomplete.errors.some((issue) => issue.code === 'REQUIRED_FREIGHT_UNRESOLVED'))

  const ready = evaluatePickupLoadPlan({
    event,
    board,
    stagedFreight: staged,
    verifiedIds: expectedIds,
    placements: {
      [expectedIds[0]]: { anchorCell: 0, rotation: 0 },
      [expectedIds[1]]: { anchorCell: 6, rotation: 0 },
      [expectedIds[2]]: { anchorCell: 12, rotation: 0 },
    },
  })
  assert.equal(ready.ready, true)
  assert.equal(ready.verifiedExpectedCount, 3)
  assert.equal(ready.plannedExpectedCount, 3)
  assert.ok(ready.occupiedCells >= 4)

  const wrong = evaluatePickupLoadPlan({
    event,
    board,
    stagedFreight: staged,
    verifiedIds: [...expectedIds, staged.at(-1).id],
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

test('committing the rear doors preserves the solved puzzle plan and starts loading now', () => {
  const board = buildTrailerPuzzleBoard(equipment)
  const operation = commitPickupOperation({
    driverId: 'marcus-reed',
    event,
    currentAbsoluteMinutes: 503,
    loadPlan: {
      freightIds: ['a', 'b', 'c'],
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
