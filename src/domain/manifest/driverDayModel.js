import { freightServiceMinutes } from '../freight/serviceTimes.js'
import { normalizeDispatchPlanStatus } from '../planning/dispatchPlan.js'
import { analyzeDriverDay } from '../planning/planAnalysis.js'

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
  const appointmentStartMinutes = finite(spec.appointmentStartMinutes)
  const appointmentEndMinutes = finite(spec.appointmentEndMinutes)
  const physicalArrivalMinutes = finite(
    spec.physicalArrivalMinutes,
    finite(spec.projectedArrivalMinutes),
  )
  const explicitServiceStart = (
    spec.serviceStartMinutes !== null
    && spec.serviceStartMinutes !== undefined
    && Number.isFinite(Number(spec.serviceStartMinutes))
  )
    ? Number(spec.serviceStartMinutes)
    : null
  const serviceStartMinutes = explicitServiceStart ?? Math.max(
    physicalArrivalMinutes,
    appointmentStartMinutes,
  )
  const serviceMinutes = freightServiceMinutes(role, spec.serviceMinutes)

  return {
    id: `${load.id}:${role}`,
    kind: 'freight-stop',
    role,
    loadId: load.id,
    loadRef: load.loadRef,
    loadOrdinal: finite(load.dayLoadOrder, 1),
    driverId: load.assignedDriverId,
    manifestOrder: finite(spec.manifestOrder),
    projectedArrivalMinutes: physicalArrivalMinutes,
    physicalArrivalMinutes,
    serviceStartMinutes,
    waitMinutes: Math.max(0, serviceStartMinutes - physicalArrivalMinutes),
    serviceMinutes,
    endMinutes: serviceStartMinutes + serviceMinutes,
    appointmentStartMinutes,
    appointmentEndMinutes,
    locationId: spec.locationId,
    locationLabel: location?.label ?? spec.locationId,
    deliveryLocationLabel: role === 'pickup'
      ? locations[load.delivery?.locationId]?.label ?? load.delivery?.locationId ?? null
      : location?.label ?? spec.locationId,
    coordinates: location?.coordinates ?? null,
    freight: load.freight,
    pickupReality: role === 'pickup' && load.pickupReality
      ? {
          missingUnitNumbers: [...(load.pickupReality.missingUnitNumbers ?? [])],
          damagedUnits: (load.pickupReality.damagedUnits ?? []).map((item) => ({ ...item })),
        }
      : null,
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

function timelineStart(driver, plan, locations) {
  const explicitStart = plan.startLocationId
    ? locations[plan.startLocationId] ?? null
    : null
  const scheduledStartMinutes = finite(plan.shift?.startMinutes)
  const dispatchStartMinutes = Number.isFinite(Number(plan.dispatchStartMinutes))
    ? Number(plan.dispatchStartMinutes)
    : scheduledStartMinutes
  const effectiveStartMinutes = Math.max(scheduledStartMinutes, dispatchStartMinutes)

  if (explicitStart?.coordinates) {
    return {
      id: `${driver.id}:shift-start`,
      driverId: driver.id,
      kind: 'shift-start',
      label: 'SHIFT START',
      projectedArrivalMinutes: effectiveStartMinutes,
      scheduledStartMinutes,
      locationId: explicitStart.id ?? plan.startLocationId,
      locationLabel: explicitStart.label ?? plan.startLocationId,
      coordinates: explicitStart.coordinates,
      anchorMode: 'poi',
    }
  }

  return {
    id: `${driver.id}:shift-start`,
    driverId: driver.id,
    kind: 'shift-start',
    label: 'SHIFT START',
    projectedArrivalMinutes: effectiveStartMinutes,
    scheduledStartMinutes,
    locationId: null,
    locationLabel: driver.locationLabel ?? 'Current truck position',
    coordinates: Array.isArray(driver.coordinates) ? driver.coordinates : null,
    anchorMode: 'driver',
  }
}

function timelineLunch(driver, plan, locations) {
  if (!plan.lunch) return null
  const location = locations[plan.lunch.locationId]
  return {
    id: `${driver.id}:lunch`,
    driverId: driver.id,
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
    driverId: driver.id,
    kind: 'staging',
    label: 'STAGING',
    projectedArrivalMinutes: plan.staging.arrivalMinutes,
    locationId: plan.staging.locationId ?? null,
    locationLabel: location?.label ?? 'Choose Staging Location',
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
  const timeline = [timelineStart(driver, plan, locations)]

  if (lunch && Number(lunch.afterManifestOrder) < 0) timeline.push(lunch)

  for (const stop of freightStops) {
    timeline.push(stop)
    if (lunch && lunch.afterManifestOrder === stop.manifestOrder) timeline.push(lunch)
  }

  if (lunch && !timeline.includes(lunch)) timeline.push(lunch)
  if (staging) timeline.push(staging)

  const capacitySnapshots = freightStops.map((stop) => stop.capacityAfter)
  const peakPalletsUsed = Math.max(0, ...capacitySnapshots.map((item) => item.palletsUsed))
  const peakWeightUsedLbs = Math.max(0, ...capacitySnapshots.map((item) => item.weightUsedLbs))

  const day = {
    driverId: driver.id,
    dispatchStatus: normalizeDispatchPlanStatus(plan),
    dispatchStartMinutes: plan.dispatchStartMinutes !== null
      && plan.dispatchStartMinutes !== undefined
      && Number.isFinite(Number(plan.dispatchStartMinutes))
      ? Number(plan.dispatchStartMinutes)
      : null,
    sentAtMinutes: plan.sentAtMinutes !== null
      && plan.sentAtMinutes !== undefined
      && Number.isFinite(Number(plan.sentAtMinutes))
      ? Number(plan.sentAtMinutes)
      : null,
    sentAtDayNumber: plan.sentAtDayNumber !== null
      && plan.sentAtDayNumber !== undefined
      && Number.isFinite(Number(plan.sentAtDayNumber))
      ? Number(plan.sentAtDayNumber)
      : null,
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

  return {
    ...day,
    planHealth: analyzeDriverDay(day, driver, locations),
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
    const stop = day.timeline.find((item) => item.id === stopId)
    if (stop) return stop
  }
  return null
}
