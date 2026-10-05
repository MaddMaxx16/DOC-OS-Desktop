import test from 'node:test'
import assert from 'node:assert/strict'
import { drivers } from '../src/data/drivers.js'
import { driverPlans, loads, locations } from '../src/data/operationsSeed.js'
import { buildDriverDay } from '../src/domain/manifest/driverDayModel.js'
import {
  buildPlanningPlaceOptions,
  choosePlanningPlace,
} from '../src/domain/planning/planningPlaces.js'

const marcus = drivers.find((driver) => driver.id === 'marcus-reed')
const day = buildDriverDay({
  driver: marcus,
  loads,
  plan: driverPlans[marcus.id],
  locations,
})

test('Lunch place options are real gameplay POIs ranked against the current route slot', () => {
  const options = buildPlanningPlaceOptions({
    day,
    kind: 'lunch',
    locations,
  })

  assert.ok(options.length >= 3)
  assert.equal(options[0].id, 'meadowlands-staging')
  assert.equal(options[0].isCurrent, true)
  assert.ok(options.some((option) => option.id === 'garden-state-travel-plaza'))
  assert.ok(options.every((option) => Number.isFinite(option.detourMinutes)))
  assert.ok(options.every((option) => Number.isFinite(option.forwardProgressMinutes)))
  assert.ok(options.every((option) => Number.isFinite(option.backtrackMinutes)))
  assert.ok(options.every((option) => Number.isFinite(option.planningScore)))
  assert.ok(options.every((option) => typeof option.directionLabel === 'string'))
  assert.ok(options.every((option) => Array.isArray(option.coordinates)))
})

test('Lunch ranking prefers forward progress over a slightly cheaper backtrack', () => {
  const routeDay = {
    timeline: [
      {
        id: 'previous-stop',
        kind: 'freight-stop',
        coordinates: [-74.0, 40.7],
      },
      {
        id: 'lunch-stop',
        kind: 'lunch',
        locationId: null,
      },
      {
        id: 'next-stop',
        kind: 'freight-stop',
        coordinates: [-73.8, 40.7],
      },
    ],
  }
  const routeLocations = {
    forward: {
      id: 'forward',
      label: 'Forward Route Diner',
      coordinates: [-73.95, 40.75],
      planningRoles: ['lunch'],
      poiType: 'food',
      truckAccess: 'easy',
      parking: true,
    },
    backtrack: {
      id: 'backtrack',
      label: 'Backtrack Cafe',
      coordinates: [-74.02, 40.7],
      planningRoles: ['lunch'],
      poiType: 'food',
      truckAccess: 'easy',
      parking: true,
    },
  }

  const options = buildPlanningPlaceOptions({
    day: routeDay,
    kind: 'lunch',
    locations: routeLocations,
  })

  assert.equal(options[0].id, 'forward')
  const forward = options.find((option) => option.id === 'forward')
  const backtrack = options.find((option) => option.id === 'backtrack')
  assert.ok(forward.forwardProgressMinutes > 0)
  assert.equal(forward.backtrackMinutes, 0)
  assert.ok(backtrack.backtrackMinutes > 0)
  assert.ok(backtrack.planningScore > backtrack.detourMinutes)
  assert.match(forward.directionLabel, /TOWARD NEXT STOP/)
  assert.match(backtrack.directionLabel, /BACKTRACK/)
})

test('choosing a Lunch POI persists the physical location and recalculates the Driver Day', () => {
  const result = choosePlanningPlace({
    driver: marcus,
    driverId: marcus.id,
    loads,
    driverPlans,
    locations,
    kind: 'lunch',
    locationId: 'hudson-route-diner',
  })

  assert.equal(result.ok, true)
  assert.equal(result.driverPlans[marcus.id].lunch.locationId, 'hudson-route-diner')
  const lunch = result.driverDay.timeline.find((event) => event.kind === 'lunch')
  assert.equal(lunch.locationId, 'hudson-route-diner')
  assert.equal(lunch.locationLabel, 'Hudson Route Diner')
  assert.deepEqual(lunch.coordinates, locations['hudson-route-diner'].coordinates)
})

test('unassigned staging ranks believable local choices from Marcus final Bronx stop', () => {
  const options = buildPlanningPlaceOptions({
    day,
    kind: 'staging',
    locations,
  })

  assert.ok(options.length >= 7)
  assert.equal(options.some((option) => option.isCurrent), false)
  assert.deepEqual(
    options.slice(0, 3).map((option) => option.id),
    [
      'hunts-point-truck-staging',
      'bronx-river-truck-parking',
      'port-morris-staging-yard',
    ],
  )
  assert.ok(options.slice(0, 3).every((option) => option.proximityLabel === 'NEAR FINAL STOP'))
  assert.ok(options.slice(0, 3).every((option) => option.travelMinutes <= 5))
  assert.ok(options.some((option) => option.id === 'newark-overnight-lot'))
  assert.ok(options.some((option) => option.id === 'metroline-yard'))
})

test('choosing staging persists the truck end-of-day place and updates the final route endpoint', () => {
  const result = choosePlanningPlace({
    driver: marcus,
    driverId: marcus.id,
    loads,
    driverPlans,
    locations,
    kind: 'staging',
    locationId: 'newark-overnight-lot',
  })

  assert.equal(result.ok, true)
  assert.equal(result.driverPlans[marcus.id].staging.locationId, 'newark-overnight-lot')
  const staging = result.driverDay.timeline.at(-1)
  assert.equal(staging.kind, 'staging')
  assert.equal(staging.locationId, 'newark-overnight-lot')
  assert.deepEqual(staging.coordinates, locations['newark-overnight-lot'].coordinates)
})

test('planning place validation rejects a POI without the requested planning role', () => {
  const result = choosePlanningPlace({
    driver: marcus,
    driverId: marcus.id,
    loads,
    driverPlans,
    locations,
    kind: 'lunch',
    locationId: 'empire-freight-terminal',
  })

  assert.equal(result.ok, false)
  assert.match(result.reason, /not valid/)
})
