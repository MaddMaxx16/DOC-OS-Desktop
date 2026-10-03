import test from 'node:test'
import assert from 'node:assert/strict'
import { drivers } from '../src/data/drivers.js'
import { freightMarket } from '../src/data/freightMarket.js'
import { driverPlans, loads, locations } from '../src/data/operationsSeed.js'
import { evaluateFreightLane } from '../src/domain/freight/freightFit.js'
import { buildDriverDays } from '../src/domain/manifest/driverDayModel.js'

const days = buildDriverDays(drivers, loads, driverPlans, locations)
const marcus = drivers.find((driver) => driver.id === 'marcus-reed')
const marcusDay = days.find((day) => day.driverId === 'marcus-reed')

function evaluate(laneId) {
  const lane = freightMarket.find((item) => item.id === laneId)
  return evaluateFreightLane({ lane, driver: marcus, day: marcusDay, locations })
}

test('FreightLink evaluates a tight lane inside the real Marcus manifest gap', () => {
  const fit = evaluate('FL-401')
  assert.equal(fit.label, 'TIGHT')
  assert.equal(fit.insertion.afterLabel, 'P2')
  assert.equal(fit.insertion.beforeLabel, 'LUNCH')
  assert.equal(fit.appointment.pickupOk, true)
  assert.equal(fit.appointment.deliveryOk, true)
  assert.equal(fit.schedule.ok, true)
  assert.equal(fit.capacity.ok, true)
})

test('FreightLink can identify a clean good insertion later in the day', () => {
  const fit = evaluate('FL-404')
  assert.equal(fit.label, 'GOOD')
  assert.equal(fit.insertion.afterLabel, 'D2')
  assert.equal(fit.insertion.beforeLabel, 'D3')
  assert.equal(fit.hos.driveOk, true)
  assert.equal(fit.hos.dutyOk, true)
})

test('FreightLink rejects freight that cannot physically fit the trailer', () => {
  const fit = evaluate('FL-405')
  assert.equal(fit.label, 'POOR')
  assert.equal(fit.capacity.ok, false)
  assert.match(fit.detail, /trailer capacity/)
})

test('FreightLink evaluation returns route, HOS, appointment and capacity signals', () => {
  const fit = evaluate('FL-402')
  assert.equal(Number.isFinite(fit.route.loaded.miles), true)
  assert.equal(Number.isFinite(fit.route.deadhead.minutes), true)
  assert.equal(Number.isFinite(fit.hos.projectedDriveMinutes), true)
  assert.equal(typeof fit.appointment.pickupOk, 'boolean')
  assert.equal(typeof fit.schedule.ok, 'boolean')
  assert.equal(typeof fit.capacity.ok, 'boolean')
})

test('FreightLink uses the selected driver day instead of a global fit label', () => {
  const lane = freightMarket.find((item) => item.id === 'FL-401')
  const taylor = drivers.find((driver) => driver.id === 'taylor-brooks')
  const taylorDay = days.find((day) => day.driverId === 'taylor-brooks')
  const fit = evaluateFreightLane({ lane, driver: taylor, day: taylorDay, locations })
  assert.equal(fit.driverId, 'taylor-brooks')
  assert.ok(fit.insertion.afterLabel)
  assert.ok(fit.insertion.beforeLabel)
})
