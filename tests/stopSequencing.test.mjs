import test from 'node:test'
import assert from 'node:assert/strict'
import { drivers } from '../src/data/drivers.js'
import { driverPlans, loads, locations } from '../src/data/operationsSeed.js'
import { buildDriverDay } from '../src/domain/manifest/driverDayModel.js'
import { buildDriverRouteSegments } from '../src/domain/routing/driverRoutePlan.js'
import { resequenceDriverStops } from '../src/domain/planning/stopSequencing.js'

const marcusDriver = drivers.find((driver) => driver.id === 'marcus-reed')

function freightIds(day) {
  return day.freightStops.map((stop) => stop.id)
}

test('valid stop resequencing rewrites the authoritative manifest and route order', () => {
  const result = resequenceDriverStops({
    driver: marcusDriver,
    driverId: marcusDriver.id,
    loads,
    driverPlans,
    locations,
    stopId: 'M-303:pickup',
    targetStopId: 'M-101:delivery',
    placement: 'before',
  })

  assert.equal(result.ok, true)
  assert.deepEqual(result.orderedStopIds, [
    'M-101:pickup',
    'M-202:pickup',
    'M-303:pickup',
    'M-101:delivery',
    'M-202:delivery',
    'M-303:delivery',
  ])
  assert.deepEqual(freightIds(result.driverDay), result.orderedStopIds)

  const routeIds = buildDriverRouteSegments(result.driverDay, locations)
    .map((segment) => segment.toId)
  assert.deepEqual(
    routeIds,
    result.driverDay.timeline.slice(1).map((event) => event.id),
  )
})

test('sequencing recalculates arrival timing and capacity from the new order', () => {
  const before = buildDriverDay({
    driver: marcusDriver,
    loads,
    plan: driverPlans[marcusDriver.id],
    locations,
  })
  const beforeP3 = before.freightStops.find((stop) => stop.id === 'M-303:pickup')

  const result = resequenceDriverStops({
    driver: marcusDriver,
    driverId: marcusDriver.id,
    loads,
    driverPlans,
    locations,
    stopId: 'M-303:pickup',
    targetStopId: 'M-101:delivery',
    placement: 'before',
  })

  const afterP3 = result.driverDay.freightStops.find((stop) => stop.id === 'M-303:pickup')
  assert.notEqual(afterP3.projectedArrivalMinutes, beforeP3.projectedArrivalMinutes)
  assert.deepEqual(afterP3.capacityAfter.onboardLoadIds, ['M-101', 'M-202', 'M-303'])
  assert.equal(afterP3.capacityAfter.palletsUsed, 24)
  assert.equal(afterP3.capacityAfter.overCapacity, false)
})

test('delivery before matching pickup is blocked instead of committed', () => {
  const result = resequenceDriverStops({
    driver: marcusDriver,
    driverId: marcusDriver.id,
    loads,
    driverPlans,
    locations,
    stopId: 'M-101:delivery',
    targetStopId: 'M-101:pickup',
    placement: 'before',
  })

  assert.equal(result.ok, false)
  assert.match(result.reason, /cannot deliver before it is picked up/)
})

test('a reorder that would exceed trailer capacity is blocked', () => {
  const heavyLoads = loads.map((load) => (
    load.id === 'M-303'
      ? { ...load, freight: { ...load.freight, pallets: 20 } }
      : load
  ))

  const result = resequenceDriverStops({
    driver: marcusDriver,
    driverId: marcusDriver.id,
    loads: heavyLoads,
    driverPlans,
    locations,
    stopId: 'M-303:pickup',
    targetStopId: 'M-101:delivery',
    placement: 'before',
  })

  assert.equal(result.ok, false)
  assert.match(result.reason, /exceeds trailer capacity/)
})

test('sent plans cannot be resequenced', () => {
  const sentPlans = {
    ...driverPlans,
    'marcus-reed': {
      ...driverPlans['marcus-reed'],
      dispatchStatus: 'sent',
    },
  }

  const result = resequenceDriverStops({
    driver: marcusDriver,
    driverId: marcusDriver.id,
    loads,
    driverPlans: sentPlans,
    locations,
    stopId: 'M-303:pickup',
    targetStopId: 'M-101:delivery',
    placement: 'before',
  })

  assert.equal(result.ok, false)
  assert.match(result.reason, /not editable/)
})
