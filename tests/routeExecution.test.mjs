import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildTimelineExecution,
  coordinateAlongRouteShape,
  routeExecutionPosition,
  routeSegmentExecutionPhase,
} from '../src/domain/live/routeExecution.js'

const day = {
  driverId: 'marcus-reed',
  timeline: [
    {
      id: 'marcus-reed:shift-start',
      kind: 'shift-start',
      locationLabel: 'Newark, NJ',
      projectedArrivalMinutes: 420,
    },
    {
      id: 'M-101:pickup',
      kind: 'freight-stop',
      role: 'pickup',
      locationLabel: 'Empire Freight Terminal',
      projectedArrivalMinutes: 480,
    },
    {
      id: 'marcus-reed:lunch',
      kind: 'lunch',
      locationLabel: 'Brooklyn Driver Deli',
      projectedArrivalMinutes: 630,
      endMinutes: 660,
    },
    {
      id: 'M-101:delivery',
      kind: 'freight-stop',
      role: 'delivery',
      locationLabel: 'Harborline Logistics',
      projectedArrivalMinutes: 700,
    },
  ],
}

test('sent-day timeline execution moves between planned events', () => {
  const state = buildTimelineExecution(day, {
    dayNumber: 1,
    currentMinutes: 450,
  })

  assert.equal(state.executionPhase, 'en-route')
  assert.equal(state.activeSegmentId, 'marcus-reed:shift-start->M-101:pickup')
  assert.equal(state.activeSegmentProgress, 0.5)
  assert.equal(state.nextEventId, 'M-101:pickup')
  assert.deepEqual(state.completedEventIds, ['marcus-reed:shift-start'])
})

test('timeline execution exposes a one-minute arrival state at a freight stop', () => {
  const state = buildTimelineExecution(day, {
    dayNumber: 1,
    currentMinutes: 480,
  })

  assert.equal(state.executionPhase, 'arrived')
  assert.equal(state.currentEventId, 'M-101:pickup')
  assert.equal(state.nextEventId, 'marcus-reed:lunch')
  assert.ok(state.completedSegmentIds.includes('marcus-reed:shift-start->M-101:pickup'))
})

test('planned lunch is a real dwell window and does not move the truck', () => {
  const state = buildTimelineExecution(day, {
    dayNumber: 1,
    currentMinutes: 645,
  })

  assert.equal(state.executionPhase, 'dwell-break')
  assert.equal(state.currentEventId, 'marcus-reed:lunch')
  assert.equal(state.currentEventDepartureMinutes, 660)
  assert.equal(state.nextEventId, 'M-101:delivery')
})

test('road-shape interpolation follows cumulative route distance', () => {
  const position = coordinateAlongRouteShape([
    [0, 0],
    [1, 0],
    [3, 0],
  ], 0.5)

  assert.ok(Math.abs(position[0] - 1.5) < 0.01)
  assert.ok(Math.abs(position[1]) < 0.000001)
})

test('route execution position uses active road geometry and stop access points', () => {
  const segments = [
    {
      id: 'start->p1',
      fromId: 'start',
      toId: 'p1',
      route: {
        source: 'road',
        routeShape: [[0, 0], [1, 0], [2, 0]],
        originAccessCoordinates: [0, 0],
        destinationAccessCoordinates: [2, 0],
      },
    },
  ]

  assert.deepEqual(routeExecutionPosition({
    executionPhase: 'en-route',
    activeSegmentId: 'start->p1',
    activeSegmentProgress: 0.5,
  }, segments, [-1, -1]), [1, 0])

  assert.deepEqual(routeExecutionPosition({
    executionPhase: 'arrived',
    currentEventId: 'p1',
  }, segments, [-1, -1]), [2, 0])
})

test('route leg visual phase fades completed work and marks the active leg', () => {
  const execution = {
    sent: true,
    phase: 'active',
    completedSegmentIds: ['start->p1'],
    activeSegmentId: 'p1->p2',
  }

  assert.equal(routeSegmentExecutionPhase('start->p1', execution), 'completed')
  assert.equal(routeSegmentExecutionPhase('p1->p2', execution), 'active')
  assert.equal(routeSegmentExecutionPhase('p2->d1', execution), 'future')
})
