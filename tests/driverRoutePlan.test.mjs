import test from 'node:test'
import assert from 'node:assert/strict'
import { drivers } from '../src/data/drivers.js'
import { driverPlans, loads, locations } from '../src/data/operationsSeed.js'
import { buildDriverDays } from '../src/domain/manifest/driverDayModel.js'
import {
  buildDriverRouteAnchors,
  buildDriverRouteSegments,
  markInsertionAffectedSegment,
} from '../src/domain/routing/driverRoutePlan.js'

const days = buildDriverDays(drivers, loads, driverPlans, locations)
const marcus = days.find((day) => day.driverId === 'marcus-reed')

test('Marcus planned route follows authoritative timeline order', () => {
  const segments = buildDriverRouteSegments(marcus, locations)

  assert.deepEqual(
    segments.map((segment) => [segment.fromId, segment.toId]),
    marcus.timeline.slice(0, -1).map((event, index) => [
      event.id,
      marcus.timeline[index + 1].id,
    ]),
  )
})

test('load insertion dims only the direct leg being replaced', () => {
  const segments = buildDriverRouteSegments(marcus, locations)
  const affected = markInsertionAffectedSegment(segments, {
    afterId: 'M-202:pickup',
    beforeId: 'marcus-reed:lunch',
  })

  assert.equal(affected.filter((segment) => segment.affected).length, 1)
  assert.equal(
    affected.find((segment) => segment.affected)?.id,
    'M-202:pickup->marcus-reed:lunch',
  )
})


test('route anchors preserve meaningful Marcus locations without duplicate physical pins', () => {
  const anchors = buildDriverRouteAnchors(marcus, locations)
  const meadowlands = anchors.find((anchor) => anchor.locationId === 'meadowlands-staging')

  assert.ok(anchors.find((anchor) => anchor.badge === 'P1'))
  assert.ok(anchors.find((anchor) => anchor.badge === 'P2'))
  assert.ok(anchors.find((anchor) => anchor.badge === 'D1'))
  assert.ok(anchors.find((anchor) => anchor.badge === 'P3'))
  assert.ok(anchors.find((anchor) => anchor.badge === 'D2'))
  assert.ok(anchors.find((anchor) => anchor.badge === 'D3'))
  assert.equal(meadowlands?.badge, 'L/S')
  assert.equal(meadowlands?.poiType, 'staging')
  assert.equal(
    anchors.filter((anchor) => anchor.locationId === 'meadowlands-staging').length,
    1,
  )
})

test('seeded Driver Days start at each truck current operational position by default', () => {
  for (const driver of drivers) {
    const day = days.find((candidate) => candidate.driverId === driver.id)
    const start = day.timeline[0]

    assert.equal(start.kind, 'shift-start')
    assert.equal(start.anchorMode, 'driver')
    assert.equal(start.locationId, null)
    assert.equal(start.locationLabel, driver.locationLabel)
    assert.deepEqual(start.coordinates, driver.coordinates)
  }
})

test('current truck marker owns the default shift-start anchor', () => {
  const anchors = buildDriverRouteAnchors(marcus, locations)

  assert.equal(
    anchors.some((anchor) => anchor.eventIds.includes('marcus-reed:shift-start')),
    false,
  )
})

test('every seeded route segment endpoint has either a POI anchor or the current truck asset', () => {
  for (const day of days) {
    const anchors = buildDriverRouteAnchors(day, locations)
    const coveredEventIds = new Set(
      anchors.flatMap((anchor) => anchor.eventIds),
    )
    const driverStartId = `${day.driverId}:shift-start`
    const segments = buildDriverRouteSegments(day, locations)

    for (const segment of segments) {
      assert.ok(
        coveredEventIds.has(segment.fromId) || segment.fromId === driverStartId,
        `${day.driverId} route is missing visible origin context for ${segment.fromId}`,
      )
      assert.ok(
        coveredEventIds.has(segment.toId) || segment.toId === driverStartId,
        `${day.driverId} route is missing visible destination context for ${segment.toId}`,
      )
    }
  }
})

test('Derrick route begins at Derrick current Brooklyn truck position and keeps later POI anchors', () => {
  const derrickDriver = drivers.find((driver) => driver.id === 'derrick-cole')
  const derrick = days.find((day) => day.driverId === 'derrick-cole')
  const segments = buildDriverRouteSegments(derrick, locations)
  const anchors = buildDriverRouteAnchors(derrick, locations)
  const badges = anchors.map((anchor) => anchor.badge)

  assert.deepEqual(segments[0].fromCoordinates, derrickDriver.coordinates)
  assert.equal(derrick.timeline[0].locationLabel, 'Brooklyn, NY')
  assert.ok(badges.includes('P1'))
  assert.ok(badges.includes('D1'))
  assert.ok(badges.includes('L/S'))
  assert.equal(badges.includes('Y'), false)
})


test('an explicit plan start location overrides current truck position', () => {
  const driver = drivers.find((item) => item.id === 'derrick-cole')
  const explicitPlans = {
    ...driverPlans,
    'derrick-cole': {
      ...driverPlans['derrick-cole'],
      startLocationId: 'metroline-yard',
    },
  }
  const explicitDay = buildDriverDays([driver], loads, explicitPlans, locations)[0]
  const start = explicitDay.timeline[0]
  const anchors = buildDriverRouteAnchors(explicitDay, locations)
  const yard = anchors.find((anchor) => anchor.locationId === 'metroline-yard')

  assert.equal(start.anchorMode, 'poi')
  assert.equal(start.locationLabel, 'Metroline Yard')
  assert.deepEqual(start.coordinates, locations['metroline-yard'].coordinates)
  assert.equal(yard?.badge, 'Y')
  assert.equal(yard?.poiType, 'yard')
})
