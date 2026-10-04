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
      driveMinutes: 0,
      dutyMinutes: 0,
    }
  }

  const blockers = []
  const warnings = []

  for (const stop of day.freightStops ?? []) {
    if (stop.capacityAfter?.overCapacity) {
      blockers.push(`${stop.loadRef} exceeds trailer capacity after ${stop.role}.`)
    }

    const margin = finite(stop.appointmentEndMinutes) - finite(stop.projectedArrivalMinutes)
    if (margin < 0) {
      warnings.push(`${stop.loadRef} ${stop.role} is projected ${Math.abs(margin)} min late.`)
    } else if (margin < TIGHT_APPOINTMENT_MINUTES) {
      warnings.push(`${stop.loadRef} ${stop.role} has only ${margin} min appointment margin.`)
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
    warnings.push(`Driving HOS is exceeded by ${driveMinutes - driveAvailable} min.`)
  }
  if (dutyMinutes > dutyAvailable) {
    warnings.push(`Duty HOS is exceeded by ${dutyMinutes - dutyAvailable} min.`)
  }

  return {
    status: blockers.length ? 'blocked' : warnings.length ? 'warning' : 'ready',
    blockers,
    warnings,
    driveMinutes,
    dutyMinutes,
  }
}
