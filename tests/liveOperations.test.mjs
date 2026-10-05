import test from 'node:test'
import assert from 'node:assert/strict'
import {
  advanceSimulationClock,
  buildLiveDriverState,
  buildLiveDriverStates,
  createSimulationClock,
  dispatchDelayMinutes,
  FAST_FORWARD_MULTIPLIER,
  requiresDispatch,
  simulationAbsoluteMinutes,
  setSimulationMode,
  simulationDateLabel,
  simulationMinutesPerTick,
  SIMULATION_MODE,
} from '../src/domain/live/liveOperations.js'

test('simulation clock starts paused at 6:00 AM on Day 1', () => {
  assert.deepEqual(createSimulationClock(), {
    dayNumber: 1,
    currentMinutes: 360,
    mode: SIMULATION_MODE.PAUSED,
  })
})

test('play and fast-forward modes advance deterministic game minutes', () => {
  const playing = setSimulationMode(createSimulationClock(), SIMULATION_MODE.PLAYING)
  const fast = setSimulationMode(playing, SIMULATION_MODE.FAST)

  assert.equal(simulationMinutesPerTick(SIMULATION_MODE.PLAYING), 1)
  assert.equal(simulationMinutesPerTick(SIMULATION_MODE.FAST), FAST_FORWARD_MULTIPLIER)
  assert.equal(advanceSimulationClock(playing).currentMinutes, 361)
  assert.equal(advanceSimulationClock(fast).currentMinutes, 364)
})

test('simulation clock advances across midnight and increments the business day', () => {
  const clock = createSimulationClock({
    dayNumber: 1,
    currentMinutes: 1439,
    mode: SIMULATION_MODE.PLAYING,
  })
  const advanced = advanceSimulationClock(clock, 2)

  assert.equal(advanced.dayNumber, 2)
  assert.equal(advanced.currentMinutes, 1)
  assert.equal(simulationDateLabel(advanced), 'SEP 8 · DAY 2')
})

test('draft plans are not armed for live operations', () => {
  const state = buildLiveDriverState({
    driverId: 'marcus-reed',
    dispatchStatus: 'draft',
    shift: { startMinutes: 420, endMinutes: 1020 },
  }, createSimulationClock())

  assert.equal(state.phase, 'draft')
  assert.equal(state.sent, false)
})

test('an unsent driver becomes dispatch-required at shift start and remains held', () => {
  const day = {
    driverId: 'taylor-brooks',
    dispatchStatus: 'draft',
    shift: { startMinutes: 450, endMinutes: 1020 },
    timeline: [
      {
        id: 'taylor-brooks:shift-start',
        kind: 'shift-start',
        locationLabel: 'Jersey City',
        projectedArrivalMinutes: 450,
      },
      {
        id: 'taylor-p1',
        kind: 'freight-stop',
        role: 'pickup',
        locationLabel: 'Taylor Pickup',
        projectedArrivalMinutes: 510,
        endMinutes: 522,
      },
    ],
  }

  const before = createSimulationClock({ currentMinutes: 449 })
  const atStart = createSimulationClock({ currentMinutes: 450 })
  const late = createSimulationClock({ currentMinutes: 468 })

  assert.equal(requiresDispatch(day, before), false)
  assert.equal(requiresDispatch(day, atStart), true)
  assert.equal(dispatchDelayMinutes(day, late), 18)
  assert.equal(simulationAbsoluteMinutes(late), 468)

  const state = buildLiveDriverState(day, late)
  assert.equal(state.phase, 'dispatch-required')
  assert.equal(state.sent, false)
  assert.equal(state.executionPhase, 'held-dispatch')
  assert.equal(state.label, 'DISPATCH REQUIRED')
  assert.equal(state.dispatchDelayMinutes, 18)
  assert.equal(state.currentEventId, 'taylor-brooks:shift-start')
  assert.equal(state.nextEventId, 'taylor-p1')
  assert.deepEqual(state.completedEventIds, [])
  assert.deepEqual(state.completedSegmentIds, [])
  assert.match(state.detail, /18 min ago/)
  assert.match(state.detail, /holding at Jersey City/)
})

test('pickup facility mode changes appointment-ready pickup into a dock-assigned action state', () => {
  const day = {
    driverId: 'marcus-reed',
    dispatchStatus: 'sent',
    shift: { startMinutes: 420, endMinutes: 1020 },
    timeline: [
      {
        id: 'marcus-reed:shift-start',
        kind: 'shift-start',
        locationLabel: 'Newark',
        projectedArrivalMinutes: 420,
      },
      {
        id: 'M-101:pickup',
        kind: 'freight-stop',
        role: 'pickup',
        loadId: 'M-101',
        loadRef: 'M-101',
        locationLabel: 'Empire Freight Terminal',
        projectedArrivalMinutes: 470,
        physicalArrivalMinutes: 470,
        serviceStartMinutes: 480,
        serviceMinutes: 12,
        endMinutes: 492,
      },
    ],
  }

  const state = buildLiveDriverState(
    day,
    createSimulationClock({ currentMinutes: 486 }),
    {
      pickupFacilityMode: true,
      facilityOperations: {},
    },
  )

  assert.equal(state.phase, 'active')
  assert.equal(state.executionPhase, 'facility-dock-assigned')
  assert.match(state.label, /^DOCK /)
  assert.equal(state.facilityActionRequired, true)
  assert.match(state.detail, /load plan required/)
  assert.deepEqual(state.onboardLoadIds, [])
})

test('live state reports WAITING when a driver physically arrives before an appointment', () => {
  const day = {
    driverId: 'marcus-reed',
    dispatchStatus: 'sent',
    shift: { startMinutes: 420, endMinutes: 1020 },
    timeline: [
      {
        id: 'marcus-reed:shift-start',
        kind: 'shift-start',
        locationLabel: 'Newark',
        projectedArrivalMinutes: 420,
      },
      {
        id: 'M-101:pickup',
        kind: 'freight-stop',
        role: 'pickup',
        loadId: 'M-101',
        loadRef: 'M-101',
        locationLabel: 'Empire Freight Terminal',
        projectedArrivalMinutes: 470,
        physicalArrivalMinutes: 470,
        serviceStartMinutes: 480,
        endMinutes: 492,
      },
    ],
  }

  const state = buildLiveDriverState(day, createSimulationClock({
    currentMinutes: 474,
  }))

  assert.equal(state.phase, 'active')
  assert.equal(state.executionPhase, 'waiting-appointment')
  assert.equal(state.label, 'WAITING')
  assert.equal(state.waitRemainingMinutes, 6)
  assert.equal(state.waitingUntilMinutes, 480)
  assert.match(state.detail, /Early at Empire Freight Terminal/)
  assert.match(state.detail, /opens in 6 min/)
})

test('fleet live state advances every driver from the same global clock without selection', () => {
  const days = [
    {
      driverId: 'marcus-reed',
      dispatchStatus: 'sent',
      shift: { startMinutes: 420, endMinutes: 1020 },
      timeline: [
        {
          id: 'marcus-reed:shift-start',
          kind: 'shift-start',
          locationLabel: 'Newark',
          projectedArrivalMinutes: 420,
        },
        {
          id: 'marcus-p1',
          kind: 'freight-stop',
          role: 'pickup',
          locationLabel: 'Marcus Pickup',
          projectedArrivalMinutes: 480,
          endMinutes: 492,
        },
      ],
    },
    {
      driverId: 'taylor-brooks',
      dispatchStatus: 'sent',
      shift: { startMinutes: 450, endMinutes: 1020 },
      timeline: [
        {
          id: 'taylor-brooks:shift-start',
          kind: 'shift-start',
          locationLabel: 'Jersey City',
          projectedArrivalMinutes: 450,
        },
        {
          id: 'taylor-p1',
          kind: 'freight-stop',
          role: 'pickup',
          locationLabel: 'Taylor Pickup',
          projectedArrivalMinutes: 510,
          endMinutes: 522,
        },
      ],
    },
    {
      driverId: 'derrick-cole',
      dispatchStatus: 'draft',
      shift: { startMinutes: 480, endMinutes: 1020 },
      timeline: [
        {
          id: 'derrick-cole:shift-start',
          kind: 'shift-start',
          locationLabel: 'Brooklyn',
          projectedArrivalMinutes: 480,
        },
      ],
    },
  ]

  const states = buildLiveDriverStates(days, createSimulationClock({
    currentMinutes: 465,
  }))

  assert.equal(states['marcus-reed'].phase, 'active')
  assert.equal(states['marcus-reed'].executionPhase, 'en-route')
  assert.equal(states['taylor-brooks'].phase, 'active')
  assert.equal(states['taylor-brooks'].executionPhase, 'en-route')
  assert.equal(states['derrick-cole'].phase, 'draft')
  assert.equal(states['derrick-cole'].sent, false)
})

test('sent plan waits for shift start then becomes live-ready inside the shift window', () => {
  const day = {
    driverId: 'marcus-reed',
    dispatchStatus: 'sent',
    shift: { startMinutes: 420, endMinutes: 1020 },
  }

  const scheduled = buildLiveDriverState(day, createSimulationClock({
    currentMinutes: 360,
  }))
  const active = buildLiveDriverState(day, createSimulationClock({
    currentMinutes: 421,
  }))

  assert.equal(scheduled.phase, 'scheduled')
  assert.equal(scheduled.label, 'SCHEDULED')
  assert.equal(active.phase, 'active')
  assert.equal(active.label, 'LIVE READY')
})
