import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildTutorialStagedFreight,
  commitPickupOperation,
  dockNumberForPickup,
  evaluatePickupLoadPlan,
  facilityOperationKey,
  pickupPlanCommitted,
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

test('tutorial staged freight includes the complete booked shipment plus discoverable noise freight', () => {
  const staged = buildTutorialStagedFreight(event)
  const expected = staged.filter((item) => item.expected)
  const noise = staged.filter((item) => !item.expected)

  assert.equal(expected.length, 3)
  assert.equal(noise.length, 1)
  assert.ok(expected.every((item) => item.loadRef === 'M-101'))
  assert.ok(expected.every((item) => item.destination === 'Harborline Logistics'))
  assert.notEqual(noise[0].loadRef, 'M-101')
})

test('load plan is ready only when expected freight is verified and placed without unrelated freight', () => {
  const staged = buildTutorialStagedFreight(event)
  const expectedIds = staged.filter((item) => item.expected).map((item) => item.id)

  const incomplete = evaluatePickupLoadPlan({
    event,
    stagedFreight: staged,
    verifiedIds: expectedIds.slice(0, 2),
    placements: {
      0: expectedIds[0],
      1: expectedIds[1],
    },
  })
  assert.equal(incomplete.ready, false)
  assert.ok(incomplete.errors.some((issue) => issue.code === 'REQUIRED_FREIGHT_UNRESOLVED'))

  const ready = evaluatePickupLoadPlan({
    event,
    stagedFreight: staged,
    verifiedIds: expectedIds,
    placements: {
      0: expectedIds[0],
      1: expectedIds[1],
      2: expectedIds[2],
    },
  })
  assert.equal(ready.ready, true)
  assert.equal(ready.verifiedExpectedCount, 3)
  assert.equal(ready.plannedExpectedCount, 3)

  const wrong = evaluatePickupLoadPlan({
    event,
    stagedFreight: staged,
    verifiedIds: [...expectedIds, staged.at(-1).id],
    placements: {
      0: expectedIds[0],
      1: expectedIds[1],
      2: expectedIds[2],
      3: staged.at(-1).id,
    },
  })
  assert.equal(wrong.ready, false)
  assert.ok(wrong.errors.some((issue) => issue.code === 'WRONG_LOAD'))
})

test('committing the rear doors creates a loading operation at the current simulation minute', () => {
  const operation = commitPickupOperation({
    driverId: 'marcus-reed',
    event,
    currentAbsoluteMinutes: 503,
    loadPlan: {
      freightIds: ['a', 'b', 'c'],
      plannedPositions: { 0: 'a', 1: 'b', 2: 'c' },
    },
  })

  assert.equal(operation.key, facilityOperationKey('marcus-reed', event.id))
  assert.equal(operation.dock, dockNumberForPickup(event))
  assert.equal(operation.status, 'plan-committed')
  assert.equal(operation.loadingStartMinutes, 503)
  assert.equal(operation.loadingDurationMinutes, 12)
  assert.equal(pickupPlanCommitted(operation), true)
})
