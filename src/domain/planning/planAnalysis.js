import { estimateRoadLeg, parseHosClock } from '../freight/freightFit.js'

const TIGHT_APPOINTMENT_MINUTES = 30

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function eventCoordinates(event, locations = {}) {
  if (Array.isArray(event?.coordinates)) return event.coordinates
  return locations[event?.locationId]?.coordinates ?? null
}

export function analyzeDriverDay(day, driver, locations = {}) {
  if (!day || !driver) {
    return {
      status: 'blocked',
      blockers: ['Driver Day unavailable.'],
      warnings: [],
      blockerIssues: [{ id: 'driver-day-missing', message: 'Driver Day unavailable.', stopId: null }],
      warningIssues: [],
      driveMinutes: 0,
      dutyMinutes: 0,
    }
  }

  const blockerIssues = []
  const warningIssues = []

  const addBlocker = (id, message, stopId = null) => {
    blockerIssues.push({ id, message, stopId })
  }

  const addWarning = (id, message, stopId = null) => {
    warningIssues.push({ id, message, stopId })
  }

  const lunch = day.timeline?.find((event) => event.kind === 'lunch') ?? null
  const staging = day.timeline?.find((event) => event.kind === 'staging') ?? null

  if (!lunch) {
    addBlocker('lunch-missing', 'Plan a lunch break before sending the schedule.')
  } else if (!lunch.locationId) {
    addBlocker(
      'lunch-location-missing',
      'Choose and confirm a lunch location.',
      lunch.id,
    )
  }

  if (!staging?.locationId) {
    addBlocker(
      'staging-location-missing',
      'Choose and confirm an end-of-day staging location.',
      staging?.id ?? `${driver.id}:staging`,
    )
  }

  for (const stop of day.freightStops ?? []) {
    if (stop.capacityAfter?.overCapacity) {
      addBlocker(
        `capacity:${stop.id}`,
        `${stop.loadRef} exceeds trailer capacity after ${stop.role}.`,
        stop.id,
      )
    }

    const appointmentReadyMinutes = finite(
      stop.serviceStartMinutes,
      stop.projectedArrivalMinutes,
    )
    const margin = finite(stop.appointmentEndMinutes) - appointmentReadyMinutes
    if (margin < 0) {
      addWarning(
        `appointment-late:${stop.id}`,
        `${stop.loadRef} ${stop.role} is projected ${Math.abs(margin)} min late.`,
        stop.id,
      )
    } else if (margin < TIGHT_APPOINTMENT_MINUTES) {
      addWarning(
        `appointment-tight:${stop.id}`,
        `${stop.loadRef} ${stop.role} has only ${margin} min appointment margin.`,
        stop.id,
      )
    }
  }

  let driveMinutes = 0
  const timeline = day.timeline ?? []
  for (let index = 0; index < timeline.length - 1; index += 1) {
    const origin = eventCoordinates(timeline[index], locations)
    const destination = eventCoordinates(timeline[index + 1], locations)
    if (!origin || !destination) continue
    driveMinutes += estimateRoadLeg(origin, destination).minutes
  }

  const finalEvent = timeline[timeline.length - 1]
  const dutyMinutes = Math.max(
    0,
    finite(finalEvent?.projectedArrivalMinutes, day.shift?.endMinutes)
      - finite(day.shift?.startMinutes),
  )
  const driveAvailable = parseHosClock(driver.hos?.drive)
  const dutyAvailable = parseHosClock(driver.hos?.duty)

  if (driveMinutes > driveAvailable) {
    addWarning(
      'hos-drive',
      `Driving HOS is exceeded by ${driveMinutes - driveAvailable} min.`,
      finalEvent?.id ?? null,
    )
  }
  if (dutyMinutes > dutyAvailable) {
    addWarning(
      'hos-duty',
      `Duty HOS is exceeded by ${dutyMinutes - dutyAvailable} min.`,
      finalEvent?.id ?? null,
    )
  }

  const blockers = blockerIssues.map((issue) => issue.message)
  const warnings = warningIssues.map((issue) => issue.message)

  return {
    status: blockers.length ? 'blocked' : warnings.length ? 'warning' : 'ready',
    blockers,
    warnings,
    blockerIssues,
    warningIssues,
    driveMinutes,
    dutyMinutes,
  }
}
