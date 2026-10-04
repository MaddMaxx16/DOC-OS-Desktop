const PICKUP_SERVICE_MINUTES = 12
const DELIVERY_SERVICE_MINUTES = 10
const ROAD_DISTANCE_MULTIPLIER = 1.18
const PLANNING_SPEED_MPH = 38
const TIGHT_MARGIN_MINUTES = 30

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function toRadians(value) {
  return value * (Math.PI / 180)
}

export function getDistanceMiles(origin, destination) {
  if (!Array.isArray(origin) || !Array.isArray(destination)) return Number.POSITIVE_INFINITY
  const [lon1, lat1] = origin
  const [lon2, lat2] = destination
  if (![lon1, lat1, lon2, lat2].every(Number.isFinite)) return Number.POSITIVE_INFINITY

  const earthRadiusMiles = 3958.7613
  const phi1 = toRadians(lat1)
  const phi2 = toRadians(lat2)
  const deltaPhi = toRadians(lat2 - lat1)
  const deltaLambda = toRadians(lon2 - lon1)
  const a = Math.sin(deltaPhi / 2) ** 2
    + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function estimateRoadLeg(origin, destination) {
  const straightMiles = getDistanceMiles(origin, destination)
  if (!Number.isFinite(straightMiles)) {
    return { miles: Number.POSITIVE_INFINITY, minutes: Number.POSITIVE_INFINITY }
  }
  const miles = Math.max(0, straightMiles * ROAD_DISTANCE_MULTIPLIER)
  const minutes = miles < 0.15 ? 0 : Math.max(1, Math.round((miles / PLANNING_SPEED_MPH) * 60))
  return { miles, minutes }
}

export function parseHosClock(value) {
  const match = String(value ?? '').match(/^(\d+):(\d{2})$/)
  if (!match) return 0
  return Number(match[1]) * 60 + Number(match[2])
}

function eventCoordinates(event, locations) {
  if (Array.isArray(event?.coordinates)) return event.coordinates
  return locations[event?.locationId]?.coordinates ?? null
}

function eventReadyMinute(event) {
  if (!event) return 0
  if (event.kind === 'lunch') return finite(event.endMinutes, event.projectedArrivalMinutes)
  if (event.kind === 'freight-stop') return finite(event.projectedArrivalMinutes) + (event.role === 'pickup' ? PICKUP_SERVICE_MINUTES : DELIVERY_SERVICE_MINUTES)
  return finite(event.projectedArrivalMinutes)
}

function eventCode(event) {
  if (!event) return '—'
  if (event.kind === 'shift-start') return 'START'
  if (event.kind === 'lunch') return 'LUNCH'
  if (event.kind === 'staging') return 'STAGE'
  if (event.kind === 'freight-stop') return `${event.role === 'pickup' ? 'P' : 'D'}${event.loadOrdinal}`
  return event.label ?? event.id
}

function capacityAtGap(day, timelineIndex) {
  for (let index = timelineIndex; index >= 0; index -= 1) {
    const event = day.timeline[index]
    if (event?.kind === 'freight-stop' && event.capacityAfter) return event.capacityAfter
  }
  return {
    onboardLoadIds: [],
    palletsUsed: 0,
    weightUsedLbs: 0,
  }
}

function baselineDriveMinutes(day, locations) {
  let total = 0
  for (let index = 0; index < day.timeline.length - 1; index += 1) {
    const origin = eventCoordinates(day.timeline[index], locations)
    const destination = eventCoordinates(day.timeline[index + 1], locations)
    if (!origin || !destination) continue
    total += estimateRoadLeg(origin, destination).minutes
  }
  return total
}

function candidateGap({ lane, driver, day, locations, index, baselineDrive }) {
  const previous = day.timeline[index]
  const next = day.timeline[index + 1]
  const previousCoordinates = eventCoordinates(previous, locations)
  const nextCoordinates = eventCoordinates(next, locations)
  const pickupCoordinates = locations[lane.pickupLocationId]?.coordinates
  const deliveryCoordinates = locations[lane.deliveryLocationId]?.coordinates

  if (!previousCoordinates || !nextCoordinates || !pickupCoordinates || !deliveryCoordinates) return null

  const previousReady = eventReadyMinute(previous)
  const nextArrival = finite(next.projectedArrivalMinutes)
  const deadhead = estimateRoadLeg(previousCoordinates, pickupCoordinates)
  const loaded = estimateRoadLeg(pickupCoordinates, deliveryCoordinates)
  const reposition = estimateRoadLeg(deliveryCoordinates, nextCoordinates)
  const direct = estimateRoadLeg(previousCoordinates, nextCoordinates)

  const pickupArrival = Math.max(previousReady + deadhead.minutes, lane.pickupWindow.startMinutes)
  const pickupDeparture = pickupArrival + PICKUP_SERVICE_MINUTES
  const deliveryArrival = Math.max(pickupDeparture + loaded.minutes, lane.deliveryWindow.startMinutes)
  const deliveryDeparture = deliveryArrival + DELIVERY_SERVICE_MINUTES
  const returnArrival = deliveryDeparture + reposition.minutes

  const pickupOk = pickupArrival <= lane.pickupWindow.endMinutes
  const deliveryOk = deliveryArrival <= lane.deliveryWindow.endMinutes
  const scheduleOk = returnArrival <= nextArrival

  const capacity = capacityAtGap(day, index)
  const palletsAfterPickup = finite(capacity.palletsUsed) + finite(lane.freight.pallets)
  const weightAfterPickup = finite(capacity.weightUsedLbs) + finite(lane.freight.weightLbs)
  const capacityOk = palletsAfterPickup <= finite(day.trailer.capacityPallets, 26)
    && weightAfterPickup <= finite(day.trailer.maxWeightLbs, 44000)

  const extraDrive = Math.max(0, deadhead.minutes + loaded.minutes + reposition.minutes - direct.minutes)
  const projectedDriveMinutes = baselineDrive + extraDrive
  const driveAvailableMinutes = parseHosClock(driver.hos?.drive)
  const dutyAvailableMinutes = parseHosClock(driver.hos?.duty)
  const projectedDutyMinutes = Math.max(
    finite(day.shift.endMinutes) - finite(day.shift.startMinutes),
    returnArrival - finite(day.shift.startMinutes),
  )
  const driveOk = projectedDriveMinutes <= driveAvailableMinutes
  const dutyOk = projectedDutyMinutes <= dutyAvailableMinutes

  const pickupMargin = lane.pickupWindow.endMinutes - pickupArrival
  const deliveryMargin = lane.deliveryWindow.endMinutes - deliveryArrival
  const scheduleMargin = nextArrival - returnArrival
  const driveMargin = driveAvailableMinutes - projectedDriveMinutes
  const dutyMargin = dutyAvailableMinutes - projectedDutyMinutes

  const failures = []
  if (!pickupOk) failures.push('pickup appointment')
  if (!deliveryOk) failures.push('delivery appointment')
  if (!scheduleOk) failures.push('existing manifest')
  if (!capacityOk) failures.push('trailer capacity')
  if (!driveOk) failures.push('driving HOS')
  if (!dutyOk) failures.push('duty HOS')

  const legal = failures.length === 0
  const usefulMargin = Math.min(pickupMargin, deliveryMargin, scheduleMargin, driveMargin, dutyMargin)
  const label = legal ? (usefulMargin < TIGHT_MARGIN_MINUTES ? 'TIGHT' : 'GOOD') : 'POOR'
  const tone = label.toLowerCase()

  return {
    label,
    tone,
    legal,
    failures,
    detail: legal
      ? label === 'TIGHT'
        ? 'Fits this driver day, but one or more planning margins are under 30 minutes.'
        : 'Fits appointments, manifest sequence, HOS, and trailer capacity.'
      : `Does not fit: ${failures.join(', ')}.`,
    insertion: {
      afterId: previous.id,
      beforeId: next.id,
      afterLabel: eventCode(previous),
      beforeLabel: eventCode(next),
      originCoordinates: previousCoordinates,
      nextCoordinates,
      originLocationLabel: previous.locationLabel,
      nextLocationLabel: next.locationLabel,
      pickupArrival,
      deliveryArrival,
      returnArrival,
    },
    appointment: {
      pickupOk,
      deliveryOk,
      pickupMargin,
      deliveryMargin,
    },
    schedule: {
      ok: scheduleOk,
      marginMinutes: scheduleMargin,
    },
    capacity: {
      ok: capacityOk,
      palletsUsedBefore: finite(capacity.palletsUsed),
      palletsAfterPickup,
      palletsCapacity: finite(day.trailer.capacityPallets, 26),
      weightUsedBeforeLbs: finite(capacity.weightUsedLbs),
      weightAfterPickupLbs: weightAfterPickup,
      weightCapacityLbs: finite(day.trailer.maxWeightLbs, 44000),
    },
    hos: {
      driveOk,
      dutyOk,
      driveAvailableMinutes,
      projectedDriveMinutes,
      driveMarginMinutes: driveMargin,
      dutyAvailableMinutes,
      projectedDutyMinutes,
      dutyMarginMinutes: dutyMargin,
    },
    route: {
      deadhead,
      loaded,
      reposition,
      direct,
    },
    score: (legal ? 100000 : 0)
      - failures.length * 10000
      + Math.min(9999, usefulMargin)
      - deadhead.minutes,
  }
}

export function evaluateFreightLane({ lane, driver, day, locations = {} } = {}) {
  if (!lane || !driver || !day) return null
  const baselineDrive = baselineDriveMinutes(day, locations)
  const candidates = []

  for (let index = 0; index < day.timeline.length - 1; index += 1) {
    const candidate = candidateGap({ lane, driver, day, locations, index, baselineDrive })
    if (candidate) candidates.push(candidate)
  }

  candidates.sort((a, b) => b.score - a.score)
  const best = candidates[0] ?? null
  if (!best) return null

  const pickup = locations[lane.pickupLocationId]
  const delivery = locations[lane.deliveryLocationId]
  const loadedMiles = best.route.loaded.miles
  const ratePerMile = loadedMiles > 0 ? lane.rate / loadedMiles : lane.rate

  return {
    ...best,
    laneId: lane.id,
    driverId: driver.id,
    pickup,
    delivery,
    loadedMiles,
    ratePerMile,
  }
}
