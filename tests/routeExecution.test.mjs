import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildTimelineExecution,
  coordinateAlongRouteShape,
  routeExecutionPosition,
  routeSegmentExecutionPhase,
} from '../src/domain/live/routeExecution.js'
import { buildFreightManifest } from '../src/domain/manifest/driverDayModel.js'
import {
  FREIGHT_SERVICE_MINUTES,
  freightServiceMinutes,
} from '../src/domain/freight/serviceTimes.js'

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
      loadId: 'M-101',
      loadRef: 'M-101',
      freight: { pallets: 8, weightLbs: 12000 },
      locationLabel: 'Empire Freight Terminal',
      projectedArrivalMinutes: 480,
      endMinutes: 492,
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
      loadId: 'M-101',
      loadRef: 'M-101',
      freight: { pallets: 8, weightLbs: 12000 },
      locationLabel: 'Harborline Logistics',
      projectedArrivalMinutes: 700,
      endMinutes: 710,
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

test('early freight arrival parks at the facility and waits for the appointment before service', () => {
  const waitingDay = {
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
        loadId: 'M-101',
        loadRef: 'M-101',
        freight: { pallets: 8, weightLbs: 12000 },
        locationLabel: 'Empire Freight Terminal',
        projectedArrivalMinutes: 470,
        physicalArrivalMinutes: 470,
        serviceStartMinutes: 480,
        endMinutes: 492,
      },
      {
        id: 'M-101:delivery',
        kind: 'freight-stop',
        role: 'delivery',
        loadId: 'M-101',
        loadRef: 'M-101',
        freight: { pallets: 8, weightLbs: 12000 },
        locationLabel: 'Harborline Logistics',
        projectedArrivalMinutes: 540,
        physicalArrivalMinutes: 540,
        serviceStartMinutes: 540,
        endMinutes: 550,
      },
    ],
  }

  const driving = buildTimelineExecution(waitingDay, {
    dayNumber: 1,
    currentMinutes: 465,
  })
  assert.equal(driving.executionPhase, 'en-route')
  assert.equal(driving.activeSegmentProgress, 0.9)

  const waiting = buildTimelineExecution(waitingDay, {
    dayNumber: 1,
    currentMinutes: 474,
  })
  assert.equal(waiting.executionPhase, 'waiting-appointment')
  assert.equal(waiting.currentEventId, 'M-101:pickup')
  assert.equal(waiting.currentEventArrivalMinutes, 470)
  assert.equal(waiting.waitingUntilMinutes, 480)
  assert.equal(waiting.waitRemainingMinutes, 6)
  assert.ok(waiting.completedSegmentIds.includes('marcus-reed:shift-start->M-101:pickup'))
  assert.ok(!waiting.completedEventIds.includes('M-101:pickup'))
  assert.deepEqual(waiting.onboardLoadIds, [])

  const loading = buildTimelineExecution(waitingDay, {
    dayNumber: 1,
    currentMinutes: 486,
  })
  assert.equal(loading.executionPhase, 'service-loading')
  assert.equal(loading.serviceStartMinutes, 480)
  assert.equal(loading.serviceDurationMinutes, 12)
  assert.equal(loading.serviceRemainingMinutes, 6)
  assert.equal(loading.serviceProgress, 0.5)
})

test('Dock & Load mode holds pickup at its assigned dock until a load plan is committed', () => {
  const held = buildTimelineExecution(
    day,
    {
      dayNumber: 1,
      currentMinutes: 486,
    },
    {
      pickupFacilityMode: true,
      facilityOperations: {},
    },
  )

  assert.equal(held.executionPhase, 'facility-dock-assigned')
  assert.equal(held.currentEventId, 'M-101:pickup')
  assert.equal(held.facilityStatus, 'DOCK ASSIGNED')
  assert.equal(held.facilityActionRequired, true)
  assert.equal(held.currentEventDepartureMinutes, null)
  assert.deepEqual(held.onboardLoadIds, [])
  assert.ok(held.completedSegmentIds.includes('marcus-reed:shift-start->M-101:pickup'))
  assert.ok(!held.completedSegmentIds.includes('M-101:pickup->marcus-reed:lunch'))
  assert.ok(!held.completedEventIds.includes('M-101:pickup'))
})

test('committed Dock & Load plan starts loading at commit time and shifts the downstream day', () => {
  const operationKey = 'marcus-reed:M-101:pickup'
  const facilityOperations = {
    [operationKey]: {
      key: operationKey,
      driverId: 'marcus-reed',
      eventId: 'M-101:pickup',
      status: 'plan-committed',
      loadingStartMinutes: 500,
      loadingDurationMinutes: 12,
    },
  }

  const loading = buildTimelineExecution(
    day,
    {
      dayNumber: 1,
      currentMinutes: 506,
    },
    {
      pickupFacilityMode: true,
      facilityOperations,
    },
  )

  assert.equal(loading.executionPhase, 'service-loading')
  assert.equal(loading.serviceStartMinutes, 500)
  assert.equal(loading.currentEventDepartureMinutes, 512)
  assert.equal(loading.serviceRemainingMinutes, 6)
  assert.deepEqual(loading.onboardLoadIds, [])

  const departed = buildTimelineExecution(
    day,
    {
      dayNumber: 1,
      currentMinutes: 512,
    },
    {
      pickupFacilityMode: true,
      facilityOperations,
    },
  )

  assert.equal(departed.executionPhase, 'en-route')
  assert.ok(departed.completedEventIds.includes('M-101:pickup'))
  assert.deepEqual(departed.onboardLoadIds, ['M-101'])
  assert.equal(departed.nextEventId, 'marcus-reed:lunch')
  assert.equal(departed.nextEventArrivalMinutes, 650)
})

test('freight pickup becomes a parked loading service window', () => {
  const state = buildTimelineExecution(day, {
    dayNumber: 1,
    currentMinutes: 486,
  })

  assert.equal(state.executionPhase, 'service-loading')
  assert.equal(state.currentEventId, 'M-101:pickup')
  assert.equal(state.nextEventId, 'marcus-reed:lunch')
  assert.equal(state.serviceLoadRef, 'M-101')
  assert.equal(state.serviceRemainingMinutes, 6)
  assert.equal(state.serviceProgress, 0.5)
  assert.ok(state.completedSegmentIds.includes('marcus-reed:shift-start->M-101:pickup'))
  assert.ok(!state.completedEventIds.includes('M-101:pickup'))
  assert.deepEqual(state.onboardLoadIds, [])
})

test('pickup service completion puts freight onboard and automatically resumes the route', () => {
  const state = buildTimelineExecution(day, {
    dayNumber: 1,
    currentMinutes: 492,
  })

  assert.equal(state.executionPhase, 'en-route')
  assert.ok(state.completedEventIds.includes('M-101:pickup'))
  assert.deepEqual(state.onboardLoadIds, ['M-101'])
  assert.equal(state.onboardPallets, 8)
  assert.equal(state.onboardWeightLbs, 12000)
})

test('delivery remains onboard while unloading and clears at service completion', () => {
  const unloading = buildTimelineExecution(day, {
    dayNumber: 1,
    currentMinutes: 705,
  })

  assert.equal(unloading.executionPhase, 'service-unloading')
  assert.equal(unloading.serviceRemainingMinutes, 5)
  assert.deepEqual(unloading.onboardLoadIds, ['M-101'])

  const complete = buildTimelineExecution(day, {
    dayNumber: 1,
    currentMinutes: 710,
  })

  assert.equal(complete.executionPhase, 'complete')
  assert.deepEqual(complete.onboardLoadIds, [])
  assert.ok(complete.completedEventIds.includes('M-101:delivery'))
})

test('freight manifest gives pickup and delivery deterministic service windows by default', () => {
  const stops = buildFreightManifest([
    {
      id: 'L-1',
      loadRef: 'L-1',
      assignedDriverId: 'marcus-reed',
      freight: { pallets: 4, weightLbs: 5000 },
      pickup: {
        locationId: 'pickup',
        projectedArrivalMinutes: 500,
        manifestOrder: 0,
      },
      delivery: {
        locationId: 'delivery',
        projectedArrivalMinutes: 600,
        manifestOrder: 1,
      },
    },
  ], 'marcus-reed', {
    pickup: { label: 'Pickup', coordinates: [0, 0] },
    delivery: { label: 'Delivery', coordinates: [1, 1] },
  })

  assert.equal(FREIGHT_SERVICE_MINUTES.pickup, 12)
  assert.equal(FREIGHT_SERVICE_MINUTES.delivery, 10)
  assert.equal(freightServiceMinutes('pickup'), 12)
  assert.equal(freightServiceMinutes('delivery'), 10)
  assert.equal(freightServiceMinutes('pickup', 0), 0)
  assert.equal(stops[0].serviceMinutes, 12)
  assert.equal(stops[0].endMinutes, 512)
  assert.equal(stops[1].serviceMinutes, 10)
  assert.equal(stops[1].endMinutes, 610)
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

  assert.deepEqual(routeExecutionPosition({
    executionPhase: 'waiting-appointment',
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
