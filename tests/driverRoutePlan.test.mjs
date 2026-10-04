import test from 'node:test'
import assert from 'node:assert/strict'
import { drivers } from '../src/data/drivers.js'
import { driverPlans, loads, locations } from '../src/data/operationsSeed.js'
import { buildDriverDays } from '../src/domain/manifest/driverDayModel.js'
import {
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
