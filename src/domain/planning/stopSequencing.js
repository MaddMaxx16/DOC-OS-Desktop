import { estimateRoadLeg } from '../freight/freightFit.js'
import { buildDriverDay } from '../manifest/driverDayModel.js'
import { canEditDispatchPlan } from './dispatchPlan.js'

const PICKUP_SERVICE_MINUTES = 12
const DELIVERY_SERVICE_MINUTES = 10

function eventCoordinates(event, locations = {}) {
  if (Array.isArray(event?.coordinates)) return event.coordinates
  return locations[event?.locationId]?.coordinates ?? null
}

function moveItem(ids, stopId, targetStopId, placement) {
  const next = ids.filter((id) => id !== stopId)
  const targetIndex = next.indexOf(targetStopId)
  if (targetIndex < 0) return ids

  const insertIndex = placement === 'after' ? targetIndex + 1 : targetIndex
  next.splice(insertIndex, 0, stopId)
  return next
}

function validatePickupBeforeDelivery(orderedStopIds = []) {
  const positions = new Map(orderedStopIds.map((id, index) => [id, index]))
  const loadIds = new Set(
    orderedStopIds
      .map((id) => id.match(/^(.*):(pickup|delivery)$/)?.[1])
      .filter(Boolean),
  )

  for (const loadId of loadIds) {
    const pickupIndex = positions.get(`${loadId}:pickup`)
    const deliveryIndex = positions.get(`${loadId}:delivery`)
    if (
      Number.isFinite(pickupIndex)
      && Number.isFinite(deliveryIndex)
      && deliveryIndex < pickupIndex
    ) {
      return {
        ok: false,
        reason: `Move blocked: ${loadId} cannot deliver before it is picked up.`,
      }
    }
  }

  return { ok: true, reason: null }
}

function applyManifestOrder(loads, driverId, orderedStopIds) {
  const orderByStopId = new Map(orderedStopIds.map((id, index) => [id, index]))

  return loads.map((load) => {
    if (load.assignedDriverId !== driverId) return load
    return {
      ...load,
      pickup: {
        ...load.pickup,
        manifestOrder: orderByStopId.get(`${load.id}:pickup`),
      },
      delivery: {
        ...load.delivery,
        manifestOrder: orderByStopId.get(`${load.id}:delivery`),
      },
    }
  })
}

function updateLoadArrival(loads, loadId, role, arrivalMinutes) {
  return loads.map((load) => (
    load.id === loadId
      ? {
          ...load,
          [role]: {
            ...load[role],
            projectedArrivalMinutes: arrivalMinutes,
          },
        }
      : load
  ))
}

function recalculateTimeline({
  driver,
  loads,
  plan,
  locations,
}) {
  let nextLoads = loads
  let nextPlan = {
    ...plan,
    lunch: plan.lunch
      ? {
          ...plan.lunch,
          preferredStartMinutes: Number(plan.lunch.preferredStartMinutes ?? plan.lunch.startMinutes),
          durationMinutes: Number(
            plan.lunch.durationMinutes
              ?? (Number(plan.lunch.endMinutes ?? 0) - Number(plan.lunch.startMinutes ?? 0)),
          ),
        }
      : null,
    staging: plan.staging ? { ...plan.staging } : null,
  }

  let day = buildDriverDay({ driver, loads: nextLoads, plan: nextPlan, locations })
  if (!day) return { loads: nextLoads, plan: nextPlan }

  let readyMinute = Number(day.shift.startMinutes ?? 0)
  let currentCoordinates = eventCoordinates(day.timeline[0], locations)

  for (const event of day.timeline.slice(1)) {
    const coordinates = eventCoordinates(event, locations)
    const travel = currentCoordinates && coordinates
      ? estimateRoadLeg(currentCoordinates, coordinates)
      : { minutes: 0 }
    const rawArrival = readyMinute + Number(travel.minutes ?? 0)

    if (event.kind === 'freight-stop') {
      const arrival = Math.max(rawArrival, Number(event.appointmentStartMinutes ?? rawArrival))
      nextLoads = updateLoadArrival(nextLoads, event.loadId, event.role, arrival)
      readyMinute = arrival + (event.role === 'pickup' ? PICKUP_SERVICE_MINUTES : DELIVERY_SERVICE_MINUTES)
    } else if (event.kind === 'lunch' && nextPlan.lunch) {
      const duration = Math.max(1, Number(nextPlan.lunch.durationMinutes ?? 30))
      const preferredStart = Number(nextPlan.lunch.preferredStartMinutes ?? rawArrival)
      const startMinutes = Math.max(rawArrival, preferredStart)
      nextPlan = {
        ...nextPlan,
        lunch: {
          ...nextPlan.lunch,
          startMinutes,
          endMinutes: startMinutes + duration,
        },
      }
      readyMinute = startMinutes + duration
    } else if (event.kind === 'staging' && nextPlan.staging) {
      nextPlan = {
        ...nextPlan,
        staging: {
          ...nextPlan.staging,
          arrivalMinutes: rawArrival,
        },
      }
      readyMinute = rawArrival
    } else {
      readyMinute = rawArrival
    }

    currentCoordinates = coordinates ?? currentCoordinates
    day = buildDriverDay({ driver, loads: nextLoads, plan: nextPlan, locations })
  }

  return { loads: nextLoads, plan: nextPlan }
}

export function resequenceDriverStops({
  driver,
  driverId,
  loads = [],
  driverPlans = {},
  locations = {},
  stopId,
  targetStopId,
  placement = 'before',
} = {}) {
  const plan = driverPlans[driverId]
  if (!driver || !plan || !canEditDispatchPlan(plan)) {
    return { ok: false, reason: 'This Driver Day is not editable.' }
  }

  if (stopId === targetStopId) {
    return { ok: false, reason: 'Choose a different stop position.' }
  }

  const driverLoads = loads
    .filter((load) => load.assignedDriverId === driverId)
    .flatMap((load) => [
      { id: `${load.id}:pickup`, order: Number(load.pickup.manifestOrder) },
      { id: `${load.id}:delivery`, order: Number(load.delivery.manifestOrder) },
    ])
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))

  const currentIds = driverLoads.map((item) => item.id)
  if (!currentIds.includes(stopId) || !currentIds.includes(targetStopId)) {
    return { ok: false, reason: 'Only freight stops can be resequenced in V2.6.2.' }
  }

  const orderedStopIds = moveItem(currentIds, stopId, targetStopId, placement)
  const orderCheck = validatePickupBeforeDelivery(orderedStopIds)
  if (!orderCheck.ok) return orderCheck

  const reorderedLoads = applyManifestOrder(loads, driverId, orderedStopIds)
  const recalculated = recalculateTimeline({
    driver,
    loads: reorderedLoads,
    plan,
    locations,
  })

  const nextDriverPlans = {
    ...driverPlans,
    [driverId]: recalculated.plan,
  }
  const nextDay = buildDriverDay({
    driver,
    loads: recalculated.loads,
    plan: recalculated.plan,
    locations,
  })

  if (nextDay?.planHealth?.blockers?.length) {
    return {
      ok: false,
      reason: `Move blocked: ${nextDay.planHealth.blockers[0]}`,
    }
  }

  return {
    ok: true,
    reason: null,
    orderedStopIds,
    loads: recalculated.loads,
    driverPlans: nextDriverPlans,
    driverDay: nextDay,
  }
}
