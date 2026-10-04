import test from 'node:test'
import assert from 'node:assert/strict'
import { drivers } from '../src/data/drivers.js'
import { freightMarket } from '../src/data/freightMarket.js'
import { driverPlans, loads, locations } from '../src/data/operationsSeed.js'
import { buildRateConfirmation } from '../src/domain/booking/rateConfirmation.js'
import { commitBookedFreight } from '../src/domain/booking/commitBookedFreight.js'
import { evaluateFreightLane } from '../src/domain/freight/freightFit.js'
import { buildDriverDays } from '../src/domain/manifest/driverDayModel.js'

function setup(laneId) {
  const driver = drivers.find((item) => item.id === 'marcus-reed')
  const days = buildDriverDays(drivers, loads, driverPlans, locations)
  const day = days.find((item) => item.driverId === driver.id)
  const lane = freightMarket.find((item) => item.id === laneId)
  const evaluation = evaluateFreightLane({ lane, driver, day, locations })
  const rateConfirmation = buildRateConfirmation({ lane, locations })
  return { driver, day, lane, evaluation, rateConfirmation }
}

test('confirming FL-401 inserts P4/D4 before lunch and renumbers the real manifest', () => {
  const { driver, day, lane, evaluation, rateConfirmation } = setup('FL-401')
  const result = commitBookedFreight({
    lane,
    driverId: driver.id,
    driverDay: day,
    evaluation,
    rateConfirmation,
    loads,
    driverPlans,
  })

  const days = buildDriverDays(drivers, result.loads, result.driverPlans, locations)
  const marcus = days.find((item) => item.driverId === driver.id)

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
      'P4',
      'D4',
      'lunch',
      'D1',
      'P3',
      'D2',
      'D3',
      'staging',
    ],
  )
  assert.equal(result.driverPlans[driver.id].lunch.afterManifestOrder, 3)
  assert.equal(result.bookedLoad.rate, 525)
  assert.equal(result.bookedLoad.bookingStatus, 'confirmed')
})

test('confirming FL-404 inserts P4/D4 between D2 and D3 without moving lunch', () => {
  const { driver, day, lane, evaluation, rateConfirmation } = setup('FL-404')
  const result = commitBookedFreight({
    lane,
    driverId: driver.id,
    driverDay: day,
    evaluation,
    rateConfirmation,
    loads,
    driverPlans,
  })

  const days = buildDriverDays(drivers, result.loads, result.driverPlans, locations)
  const marcus = days.find((item) => item.driverId === driver.id)

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
      'P4',
      'D4',
      'D3',
      'staging',
    ],
  )
  assert.equal(result.driverPlans[driver.id].lunch.afterManifestOrder, 1)
})

test('accepted Rate Con terms become the booked rate', () => {
  const { driver, day, lane, evaluation } = setup('FL-403')
  const badRateCon = buildRateConfirmation({ lane, locations })

  assert.equal(badRateCon.terms.rate, 650)

  const result = commitBookedFreight({
    lane,
    driverId: driver.id,
    driverDay: day,
    evaluation,
    rateConfirmation: badRateCon,
    loads,
    driverPlans,
  })

  assert.equal(result.bookedLoad.rate, 650)
})
