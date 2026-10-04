import { estimateRoadLeg } from '../freight/freightFit.js'
import { buildDriverDay } from '../manifest/driverDayModel.js'
import { canEditDispatchPlan } from './dispatchPlan.js'
import { recalculateDriverTimeline } from './stopSequencing.js'

function eventCoordinates(event, locations = {}) {
  if (Array.isArray(event?.coordinates)) return event.coordinates
  return locations[event?.locationId]?.coordinates ?? null
}

function roleForKind(kind) {
  if (kind === 'lunch') return 'lunch'
  if (kind === 'staging') return 'staging'
  return null
}

function eventContext(day, kind) {
  const timeline = day?.timeline ?? []
  const index = timeline.findIndex((event) => event.kind === kind)
  if (index < 0) return null

  return {
    event: timeline[index],
    previous: timeline[index - 1] ?? null,
    next: timeline[index + 1] ?? null,
  }
}

function locationOption(location, metrics, currentLocationId) {
  return {
    id: location.id,
    label: location.label,
    poiType: location.poiType ?? 'warehouse',
    coordinates: location.coordinates,
    truckAccess: location.truckAccess ?? 'unknown',
    parking: Boolean(location.parking),
    costTier: Number(location.costTier ?? 0),
    isCurrent: location.id === currentLocationId,
    ...metrics,
  }
}

export function buildPlanningPlaceOptions({
  day,
  kind,
  locations = {},
  limit = null,
} = {}) {
  const role = roleForKind(kind)
  const context = eventContext(day, kind)
  if (!role || !context) return []

  const previousCoordinates = eventCoordinates(context.previous, locations)
  const nextCoordinates = eventCoordinates(context.next, locations)
  const currentLocationId = context.event?.locationId ?? null

  const candidates = Object.values(locations)
    .filter((location) => (
      Array.isArray(location?.coordinates)
      && Array.isArray(location?.planningRoles)
      && location.planningRoles.includes(role)
    ))

  const options = candidates.map((location) => {
    if (kind === 'lunch') {
      const into = previousCoordinates
        ? estimateRoadLeg(previousCoordinates, location.coordinates)
        : { miles: 0, minutes: 0 }
      const out = nextCoordinates
        ? estimateRoadLeg(location.coordinates, nextCoordinates)
        : { miles: 0, minutes: 0 }
      const direct = previousCoordinates && nextCoordinates
        ? estimateRoadLeg(previousCoordinates, nextCoordinates)
        : { miles: 0, minutes: 0 }

      return locationOption(location, {
        travelMinutes: into.minutes + out.minutes,
        travelMiles: into.miles + out.miles,
        detourMinutes: Math.max(0, into.minutes + out.minutes - direct.minutes),
        detourMiles: Math.max(0, into.miles + out.miles - direct.miles),
      }, currentLocationId)
    }

    const into = previousCoordinates
      ? estimateRoadLeg(previousCoordinates, location.coordinates)
      : { miles: 0, minutes: 0 }

    return locationOption(location, {
      travelMinutes: into.minutes,
      travelMiles: into.miles,
      detourMinutes: 0,
      detourMiles: 0,
    }, currentLocationId)
  })

  options.sort((left, right) => {
    if (left.isCurrent !== right.isCurrent) return left.isCurrent ? -1 : 1
    const leftScore = kind === 'lunch' ? left.detourMinutes : left.travelMinutes
    const rightScore = kind === 'lunch' ? right.detourMinutes : right.travelMinutes
    return leftScore - rightScore || left.label.localeCompare(right.label)
  })

  if (limit == null) return options
  return options.slice(0, Math.max(1, Number(limit) || options.length))
}

export function choosePlanningPlace({
  driver,
  driverId,
  loads = [],
  driverPlans = {},
  locations = {},
  kind,
  locationId,
} = {}) {
  const plan = driverPlans[driverId]
  const role = roleForKind(kind)
  const location = locations[locationId]

  if (!driver || !plan || !canEditDispatchPlan(plan)) {
    return { ok: false, reason: 'This Driver Day is not editable.' }
  }

  if (
    !role
    || !location
    || !Array.isArray(location.planningRoles)
    || !location.planningRoles.includes(role)
  ) {
    return { ok: false, reason: 'That location is not valid for this planning event.' }
  }

  const nextPlan = {
    ...plan,
    [kind]: {
      ...plan[kind],
      locationId,
    },
  }

  const recalculated = recalculateDriverTimeline({
    driver,
    loads,
    plan: nextPlan,
    locations,
  })

  const nextDriverPlans = {
    ...driverPlans,
    [driverId]: recalculated.plan,
  }
  const driverDay = buildDriverDay({
    driver,
    loads: recalculated.loads,
    plan: recalculated.plan,
    locations,
  })

  return {
    ok: true,
    loads: recalculated.loads,
    driverPlans: nextDriverPlans,
    driverDay,
    location,
  }
}
