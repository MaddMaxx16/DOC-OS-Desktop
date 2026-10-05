import { DISPATCH_PLAN_STATUS } from '../planning/dispatchPlan.js'
import { buildTimelineExecution } from './routeExecution.js'

export const SIMULATION_MODE = Object.freeze({
  PAUSED: 'paused',
  PLAYING: 'playing',
  FAST: 'fast',
})

export const SIMULATION_TICK_MS = 1000
export const FAST_FORWARD_MULTIPLIER = 4
export const DAY_START_MINUTES = 360

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function createSimulationClock({
  dayNumber = 1,
  currentMinutes = DAY_START_MINUTES,
  mode = SIMULATION_MODE.PAUSED,
} = {}) {
  return {
    dayNumber: Math.max(1, Math.floor(finite(dayNumber, 1))),
    currentMinutes: ((Math.floor(finite(currentMinutes, DAY_START_MINUTES)) % 1440) + 1440) % 1440,
    mode: Object.values(SIMULATION_MODE).includes(mode)
      ? mode
      : SIMULATION_MODE.PAUSED,
  }
}

export function setSimulationMode(clock = {}, mode = SIMULATION_MODE.PAUSED) {
  if (!Object.values(SIMULATION_MODE).includes(mode)) return createSimulationClock(clock)

  return {
    ...createSimulationClock(clock),
    mode,
  }
}

export function simulationMinutesPerTick(mode) {
  if (mode === SIMULATION_MODE.FAST) return FAST_FORWARD_MULTIPLIER
  if (mode === SIMULATION_MODE.PLAYING) return 1
  return 0
}

export function advanceSimulationClock(clock = {}, gameMinutes = null) {
  const normalized = createSimulationClock(clock)
  const increment = gameMinutes == null
    ? simulationMinutesPerTick(normalized.mode)
    : Math.max(0, Math.floor(finite(gameMinutes)))

  if (!increment) return normalized

  const absoluteMinutes = normalized.currentMinutes + increment
  const dayAdvance = Math.floor(absoluteMinutes / 1440)

  return {
    ...normalized,
    dayNumber: normalized.dayNumber + dayAdvance,
    currentMinutes: absoluteMinutes % 1440,
  }
}

export function simulationDateLabel(clock = {}) {
  const normalized = createSimulationClock(clock)
  return `SEP ${6 + normalized.dayNumber} · DAY ${normalized.dayNumber}`
}

function isSent(day) {
  return day?.dispatchStatus === DISPATCH_PLAN_STATUS.SENT
}

export function simulationAbsoluteMinutes(clock = {}) {
  const normalized = createSimulationClock(clock)
  return ((normalized.dayNumber - 1) * 1440) + normalized.currentMinutes
}

export function dispatchDelayMinutes(day = {}, clock = {}) {
  const shiftStartMinutes = finite(day?.shift?.startMinutes)
  return Math.max(0, simulationAbsoluteMinutes(clock) - shiftStartMinutes)
}

export function requiresDispatch(day = {}, clock = {}) {
  if (isSent(day)) return false
  return simulationAbsoluteMinutes(clock) >= finite(day?.shift?.startMinutes)
}

function isCrossMidnightShift(shift = {}) {
  return finite(shift.endMinutes) < finite(shift.startMinutes)
}

function isInsideShiftWindow(shift = {}, currentMinutes) {
  const start = finite(shift.startMinutes)
  const end = finite(shift.endMinutes)

  if (isCrossMidnightShift(shift)) {
    return currentMinutes >= start || currentMinutes <= end
  }

  return currentMinutes >= start && currentMinutes <= end
}

function activePresentation(execution = {}) {
  if (execution.executionPhase === 'en-route') {
    return {
      label: 'EN ROUTE',
      detail: execution.nextEventLabel
        ? `Driving to ${execution.nextEventLabel}.`
        : 'Executing the communicated route.',
    }
  }

  if (execution.executionPhase === 'waiting-appointment') {
    return {
      label: 'WAITING',
      detail: execution.currentEventLabel
        ? `Early at ${execution.currentEventLabel} · appointment opens in ${Math.ceil(execution.waitRemainingMinutes ?? 0)} min.`
        : `Waiting ${Math.ceil(execution.waitRemainingMinutes ?? 0)} min for appointment.`,
    }
  }

  if (execution.executionPhase === 'arrived') {
    return {
      label: 'ARRIVED',
      detail: execution.currentEventLabel
        ? `Arrived at ${execution.currentEventLabel}.`
        : 'Arrived at the next planned stop.',
    }
  }

  if (execution.executionPhase === 'service-loading') {
    return {
      label: 'LOADING',
      detail: execution.currentEventLabel
        ? `Loading ${execution.serviceLoadRef ?? 'freight'} at ${execution.currentEventLabel}.`
        : 'Loading freight at the planned pickup.',
    }
  }

  if (execution.executionPhase === 'service-unloading') {
    return {
      label: 'UNLOADING',
      detail: execution.currentEventLabel
        ? `Unloading ${execution.serviceLoadRef ?? 'freight'} at ${execution.currentEventLabel}.`
        : 'Unloading freight at the planned delivery.',
    }
  }

  if (execution.executionPhase === 'dwell-break') {
    return {
      label: 'ON BREAK',
      detail: execution.currentEventLabel
        ? `Lunch at ${execution.currentEventLabel}.`
        : 'Driver is on the planned lunch break.',
    }
  }

  if (execution.executionPhase === 'dwell') {
    return {
      label: 'AT STOP',
      detail: execution.currentEventLabel
        ? `Stopped at ${execution.currentEventLabel}.`
        : 'Driver is at a planned stop.',
    }
  }

  if (execution.executionPhase === 'complete') {
    return {
      label: 'ROUTE COMPLETE',
      detail: 'The communicated Driver Day has reached its final planned event.',
    }
  }

  return {
    label: 'LIVE READY',
    detail: 'The sent plan is armed inside the driver\'s shift window.',
  }
}

export function buildLiveDriverState(day = {}, clock = {}) {
  const normalizedClock = createSimulationClock(clock)
  const shift = day?.shift ?? {}
  const shiftStartMinutes = finite(shift.startMinutes)
  const shiftEndMinutes = finite(shift.endMinutes)
  const timelineExecution = buildTimelineExecution(day, normalizedClock)

  if (!isSent(day)) {
    const dispatchRequired = requiresDispatch(day, normalizedClock)
    const delayMinutes = dispatchRequired
      ? dispatchDelayMinutes(day, normalizedClock)
      : 0
    const startEvent = day?.timeline?.[0] ?? null
    const nextEvent = day?.timeline?.[1] ?? null

    return {
      driverId: day?.driverId ?? null,
      phase: dispatchRequired ? 'dispatch-required' : 'draft',
      sent: false,
      label: dispatchRequired ? 'DISPATCH REQUIRED' : 'PLAN NOT SENT',
      detail: dispatchRequired
        ? delayMinutes > 0
          ? `Shift began ${delayMinutes} min ago · driver holding at ${startEvent?.locationLabel ?? 'start'}.`
          : `Shift has started · driver holding at ${startEvent?.locationLabel ?? 'start'}.`
        : 'Send the schedule to arm Live Operations.',
      dispatchDelayMinutes: delayMinutes,
      shiftStartMinutes,
      shiftEndMinutes,
      executionPhase: dispatchRequired ? 'held-dispatch' : 'draft',
      activeSegmentId: null,
      activeSegmentProgress: 0,
      currentEventId: startEvent?.id ?? null,
      currentEventKind: startEvent?.kind ?? null,
      currentEventLabel: startEvent?.locationLabel ?? null,
      currentEventDepartureMinutes: null,
      nextEventId: nextEvent?.id ?? null,
      nextEventKind: nextEvent?.kind ?? null,
      nextEventLabel: nextEvent?.locationLabel ?? null,
      nextEventArrivalMinutes: nextEvent?.projectedArrivalMinutes ?? null,
      completedSegmentIds: [],
      completedEventIds: [],
    }
  }

  if (normalizedClock.dayNumber > 1 && !isCrossMidnightShift(shift)) {
    return {
      driverId: day?.driverId ?? null,
      phase: 'closed',
      sent: true,
      label: 'SHIFT CLOSED',
      detail: 'This communicated shift window has ended.',
      shiftStartMinutes,
      shiftEndMinutes,
      ...timelineExecution,
    }
  }

  if (isInsideShiftWindow(shift, normalizedClock.currentMinutes)) {
    const presentation = activePresentation(timelineExecution)
    return {
      driverId: day?.driverId ?? null,
      phase: 'active',
      sent: true,
      ...presentation,
      shiftStartMinutes,
      shiftEndMinutes,
      ...timelineExecution,
    }
  }

  const beforeShift = !isCrossMidnightShift(shift)
    ? normalizedClock.currentMinutes < shiftStartMinutes
    : normalizedClock.currentMinutes > shiftEndMinutes
      && normalizedClock.currentMinutes < shiftStartMinutes

  if (beforeShift) {
    return {
      driverId: day?.driverId ?? null,
      phase: 'scheduled',
      sent: true,
      label: 'SCHEDULED',
      detail: 'The sent plan is armed and waiting for shift start.',
      shiftStartMinutes,
      shiftEndMinutes,
      ...timelineExecution,
    }
  }

  return {
    driverId: day?.driverId ?? null,
    phase: 'closed',
    sent: true,
    label: 'SHIFT CLOSED',
    detail: 'This communicated shift window has ended.',
    shiftStartMinutes,
    shiftEndMinutes,
    ...timelineExecution,
  }
}

export function buildLiveDriverStates(driverDays = [], clock = {}) {
  return Object.fromEntries(
    driverDays.map((day) => [
      day.driverId,
      buildLiveDriverState(day, clock),
    ]),
  )
}
