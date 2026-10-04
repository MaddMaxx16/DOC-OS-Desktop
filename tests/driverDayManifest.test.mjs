import test from 'node:test'
import assert from 'node:assert/strict'
import { drivers } from '../src/data/drivers.js'
import { driverPlans, loads, locations } from '../src/data/operationsSeed.js'
import { buildDriverDays, formatClock } from '../src/domain/manifest/driverDayModel.js'
import { createSelection, SELECTION_TYPES } from '../src/domain/selection/selectionModel.js'
import { resolveSelectionContext } from '../src/domain/selection/selectionContext.js'

const days = buildDriverDays(drivers, loads, driverPlans, locations)
const marcus = days.find((day) => day.driverId === 'marcus-reed')

test('seeded Driver Days expose draft dispatch-plan truth', () => {
  for (const day of days) {
    assert.equal(day.dispatchStatus, 'draft')
  }
})

test('Marcus day exposes the intended interleaved three-load sequence', () => {
  assert.deepEqual(
    marcus.timeline.map((item) => (
      item.kind === 'freight-stop'
        ? `${item.role === 'pickup' ? 'P' : 'D'}${item.loadOrdinal}`
        : item.kind
    )),
    [
      'shift-start',
      'P1',
      'P2',
      'lunch',
      'D1',
      'P3',
      'D2',
      'D3',
      'staging',
    ],
  )
})

test('capacity snapshots carry multiple loads and release them at delivery', () => {
  const p2 = marcus.freightStops.find((stop) => stop.id === 'M-202:pickup')
  const d1 = marcus.freightStops.find((stop) => stop.id === 'M-101:delivery')
  const p3 = marcus.freightStops.find((stop) => stop.id === 'M-303:pickup')
  const d3 = marcus.freightStops.find((stop) => stop.id === 'M-303:delivery')

  assert.deepEqual(p2.capacityAfter.onboardLoadIds, ['M-101', 'M-202'])
  assert.equal(p2.capacityAfter.palletsUsed, 14)
  assert.equal(p2.capacityAfter.weightUsedLbs, 21000)

  assert.deepEqual(d1.capacityAfter.onboardLoadIds, ['M-202'])
  assert.equal(d1.capacityAfter.palletsUsed, 6)

  assert.deepEqual(p3.capacityAfter.onboardLoadIds, ['M-202', 'M-303'])
  assert.equal(p3.capacityAfter.palletsUsed, 16)
  assert.equal(p3.capacityAfter.weightUsedLbs, 23000)
  assert.equal(p3.capacityAfter.overCapacity, false)

  assert.deepEqual(d3.capacityAfter.onboardLoadIds, [])
  assert.equal(d3.capacityAfter.palletsUsed, 0)
})

test('Driver Day exposes plan-health feedback for sequencing decisions', () => {
  assert.ok(['ready', 'warning', 'blocked'].includes(marcus.planHealth.status))
  assert.ok(Array.isArray(marcus.planHealth.blockers))
  assert.ok(Array.isArray(marcus.planHealth.warnings))
  assert.equal(Number.isFinite(marcus.planHealth.driveMinutes), true)
  assert.equal(Number.isFinite(marcus.planHealth.dutyMinutes), true)
})

test('driver day exposes HOS and trailer peak state', () => {
  assert.equal(marcus.hos.drive, '11:00')
  assert.equal(marcus.hos.duty, '14:00')
  assert.equal(marcus.trailer.capacityPallets, 26)
  assert.equal(marcus.trailer.peakPalletsUsed, 16)
  assert.equal(marcus.trailer.peakWeightUsedLbs, 23000)
})

test('stop selection resolves to the owning driver without second selection state', () => {
  const selection = createSelection(SELECTION_TYPES.STOP, 'M-202:pickup')
  const context = resolveSelectionContext(selection, drivers, days)
  assert.equal(context.driver?.id, 'marcus-reed')
  assert.equal(context.driverDay?.driverId, 'marcus-reed')
  assert.equal(context.stop?.loadRef, 'M-202')
  assert.equal(context.stop?.loadOrdinal, 2)
})

test('clock formatting remains readable for the desktop manifest', () => {
  assert.equal(formatClock(420), '7:00 AM')
  assert.equal(formatClock(780), '1:00 PM')
})

test('Lunch keeps its physical POI while draft staging starts unassigned', () => {
  const lunch = marcus.timeline.find((item) => item.kind === 'lunch')
  const staging = marcus.timeline.find((item) => item.kind === 'staging')

  assert.equal(lunch.locationId, 'meadowlands-staging')
  assert.equal(lunch.locationLabel, 'Meadowlands Staging')
  assert.deepEqual(lunch.coordinates, locations['meadowlands-staging'].coordinates)

  assert.equal(staging.locationId, null)
  assert.equal(staging.locationLabel, 'Choose Staging Location')
  assert.equal(staging.coordinates, null)
})

test('Lunch and staging selection both resolve to Marcus, including unresolved staging', () => {
  const lunchContext = resolveSelectionContext(
    createSelection(SELECTION_TYPES.STOP, 'marcus-reed:lunch'),
    drivers,
    days,
  )
  assert.equal(lunchContext.driver?.id, 'marcus-reed')
  assert.equal(lunchContext.stop?.locationId, 'meadowlands-staging')

  const stagingContext = resolveSelectionContext(
    createSelection(SELECTION_TYPES.STOP, 'marcus-reed:staging'),
    drivers,
    days,
  )
  assert.equal(stagingContext.driver?.id, 'marcus-reed')
  assert.equal(stagingContext.driverDay?.driverId, 'marcus-reed')
  assert.equal(stagingContext.stop?.locationId, null)
  assert.equal(stagingContext.stop?.locationLabel, 'Choose Staging Location')
})
