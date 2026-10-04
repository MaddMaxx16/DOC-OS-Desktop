import test from 'node:test'
import assert from 'node:assert/strict'
import { drivers } from '../src/data/drivers.js'
import { driverPlans, loads, locations } from '../src/data/operationsSeed.js'
import { evaluateFreightLane } from '../src/domain/freight/freightFit.js'
import { buildDriverDay } from '../src/domain/manifest/driverDayModel.js'

const marcus = drivers.find((driver) => driver.id === 'marcus-reed')
const day = buildDriverDay({
  driver: marcus,
  loads,
  plan: driverPlans[marcus.id],
  locations,
})

test('FreightLink can evaluate a late-day insertion before unresolved staging', () => {
  const lane = {
    id: 'TEST-END-OF-DAY',
    laneRef: 'TEST-END-OF-DAY',
    pickupLocationId: 'bronx-commerce-terminal',
    deliveryLocationId: 'huntspoint-terminal',
    pickupWindow: { startMinutes: 940, endMinutes: 975 },
    deliveryWindow: { startMinutes: 955, endMinutes: 1010 },
    freight: { pallets: 1, weightLbs: 1200 },
    rate: 225,
  }

  const evaluation = evaluateFreightLane({
    lane,
    driver: marcus,
    day,
    locations,
  })

  assert.ok(evaluation)
  assert.equal(evaluation.insertion.beforeId, 'marcus-reed:staging')
  assert.equal(evaluation.insertion.nextCoordinates, null)
  assert.equal(evaluation.insertion.nextLocationLabel, 'Unassigned staging')
})
