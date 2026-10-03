function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function formatClock(minutes) {
  const safe = ((finite(minutes) % 1440) + 1440) % 1440
  const hour24 = Math.floor(safe / 60)
  const minute = safe % 60
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour = hour24 % 12 || 12
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`
}

function freightStop(load, role, locations) {
  const spec = load[role]
  const location = locations[spec.locationId]
  return {
    id: `${load.id}:${role}`,
    kind: 'freight-stop',
    role,
    loadId: load.id,
    loadRef: load.loadRef,
    driverId: load.assignedDriverId,
    manifestOrder: finite(spec.manifestOrder),
    projectedArrivalMinutes: finite(spec.projectedArrivalMinutes),
    appointmentStartMinutes: finite(spec.appointmentStartMinutes),
    appointmentEndMinutes: finite(spec.appointmentEndMinutes),
    locationId: spec.locationId,
    locationLabel: location?.label ?? spec.locationId,
    coordinates: location?.coordinates ?? null,
    freight: load.freight,
  }
}

export function buildFreightManifest(loads = [], driverId, locations = {}) {
  const stops = []
  for (const load of loads) {
    if (load.assignedDriverId !== driverId) continue
    stops.push(freightStop(load, 'pickup', locations))
    stops.push(freightStop(load, 'delivery', locations))
  }
  return stops.sort((a, b) => a.manifestOrder - b.manifestOrder || a.id.localeCompare(b.id))
}

export function applyCapacitySnapshots(stops = [], trailer = {}) {
  const capacityPallets = finite(trailer.capacityPallets, 26)
  const maxWeightLbs = finite(trailer.maxWeightLbs, 44000)
  const onboard = new Map()

  return stops.map((stop) => {
    if (stop.role === 'pickup') onboard.set(stop.loadId, stop.freight)
    else onboard.delete(stop.loadId)

    let palletsUsed = 0
    let weightUsedLbs = 0
    for (const freight of onboard.values()) {
      palletsUsed += finite(freight.pallets)
      weightUsedLbs += finite(freight.weightLbs)
    }

    return {
      ...stop,
      capacityAfter: {
        onboardLoadIds: [...onboard.keys()],
        palletsUsed,
        palletsRemaining: capacityPallets - palletsUsed,
        weightUsedLbs,
        weightRemainingLbs: maxWeightLbs - weightUsedLbs,
        overCapacity: palletsUsed > capacityPallets || weightUsedLbs > maxWeightLbs,
      },
    }
  })
}

function timelineStart(driver, plan) {
  return {
    id: `${driver.id}:shift-start`,
    kind: 'shift-start',
    label: 'SHIFT START',
    projectedArrivalMinutes: plan.shift.startMinutes,
    locationId: driver.homeBaseLocationId ?? 'metroline-yard',
    locationLabel: driver.homeBaseLabel ?? 'Metroline Yard',
  }
}

function timelineLunch(driver, plan, locations) {
  if (!plan.lunch) return null
  const location = locations[plan.lunch.locationId]
  return {
    id: `${driver.id}:lunch`,
    kind: 'lunch',
    label: 'LUNCH',
    projectedArrivalMinutes: plan.lunch.startMinutes,
    endMinutes: plan.lunch.endMinutes,
    afterManifestOrder: plan.lunch.afterManifestOrder,
    locationId: plan.lunch.locationId,
    locationLabel: location?.label ?? plan.lunch.locationId,
    coordinates: location?.coordinates ?? null,
  }
}

function timelineStaging(driver, plan, locations) {
  if (!plan.staging) return null
  const location = locations[plan.staging.locationId]
  return {
    id: `${driver.id}:staging`,
    kind: 'staging',
    label: 'STAGING',
    projectedArrivalMinutes: plan.staging.arrivalMinutes,
    locationId: plan.staging.locationId,
    locationLabel: location?.label ?? plan.staging.locationId,
    coordinates: location?.coordinates ?? null,
  }
}

export function buildDriverDay({ driver, loads = [], plan, locations = {} } = {}) {
  if (!driver || !plan) return null

  const freightStops = applyCapacitySnapshots(
    buildFreightManifest(loads, driver.id, locations),
    driver.equipment,
  )
  const lunch = timelineLunch(driver, plan, locations)
  const staging = timelineStaging(driver, plan, locations)
  const timeline = [timelineStart(driver, plan)]

  for (const stop of freightStops) {
    timeline.push(stop)
    if (lunch && lunch.afterManifestOrder === stop.manifestOrder) timeline.push(lunch)
  }

  if (lunch && !timeline.includes(lunch)) timeline.push(lunch)
  if (staging) timeline.push(staging)

  const capacitySnapshots = freightStops.map((stop) => stop.capacityAfter)
  const peakPalletsUsed = Math.max(0, ...capacitySnapshots.map((item) => item.palletsUsed))
  const peakWeightUsedLbs = Math.max(0, ...capacitySnapshots.map((item) => item.weightUsedLbs))

  return {
    driverId: driver.id,
    shift: plan.shift,
    hos: driver.hos,
    trailer: {
      label: driver.equipment?.label ?? "53' Dry Van",
      capacityPallets: finite(driver.equipment?.capacityPallets, 26),
      maxWeightLbs: finite(driver.equipment?.maxWeightLbs, 44000),
      peakPalletsUsed,
      peakWeightUsedLbs,
    },
    freightStops,
    timeline,
    staging,
  }
}

export function buildDriverDays(drivers = [], loads = [], driverPlans = {}, locations = {}) {
  return drivers.map((driver) => buildDriverDay({
    driver,
    loads,
    plan: driverPlans[driver.id],
    locations,
  })).filter(Boolean)
}

export function getStopById(driverDays = [], stopId) {
  for (const day of driverDays) {
    const stop = day.freightStops.find((item) => item.id === stopId)
    if (stop) return stop
  }
  return null
}
