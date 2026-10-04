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

test('route anchors include the driver yard as the shift-start anchor', () => {
  const anchors = buildDriverRouteAnchors(marcus, locations)
  const yard = anchors.find((anchor) => anchor.locationId === 'metroline-yard')

  assert.equal(yard?.badge, 'Y')
  assert.equal(yard?.poiType, 'yard')
})
