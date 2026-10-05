import { estimateRoadLeg } from '../freight/freightFit.js'
import { freightServiceMinutes } from '../freight/serviceTimes.js'
import { buildDriverDay } from '../manifest/driverDayModel.js'
import { canEditDispatchPlan } from './dispatchPlan.js'

function eventCoordinates(event, locations = {}) {
  if (Array.isArray(event?.coordinates)) return event.coordinates
  return locations[event?.locationId]?.coordinates ?? null
}

function movableSequence(day) {
  return (day?.timeline ?? [])
    .filter((event) => event.kind === 'freight-stop' || event.kind === 'lunch')
    .map((event) => event.id)
}

function validatePickupBeforeDelivery(sequenceIds = []) {
  const freightIds = sequenceIds.filter((id) => /:(pickup|delivery)$/.test(id))
  const positions = new Map(freightIds.map((id, index) => [id, index]))
  const loadIds = new Set(
    freightIds
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

function applyManifestOrder(loads, driverId, sequenceIds) {
  const freightIds = sequenceIds.filter((id) => /:(pickup|delivery)$/.test(id))
  const orderByStopId = new Map(freightIds.map((id, index) => [id, index]))

  return {
    loads: loads.map((load) => {
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
    }),
    orderByStopId,
    orderedStopIds: freightIds,
  }
}

function updateLunchSequence(plan, sequenceIds, orderByStopId) {
  if (!plan?.lunch) return plan

  const lunchIndex = sequenceIds.findIndex((id) => id.endsWith(':lunch'))
  if (lunchIndex < 0) return plan

  let previousFreightId = null
  for (let index = lunchIndex - 1; index >= 0; index -= 1) {
    if (/:(pickup|delivery)$/.test(sequenceIds[index])) {
      previousFreightId = sequenceIds[index]
      break
    }
  }

  return {
    ...plan,
    lunch: {
      ...plan.lunch,
      afterManifestOrder: previousFreightId
        ? orderByStopId.get(previousFreightId)
        : -1,
    },
  }
}

function updateLoadTiming(
  loads,
  loadId,
  role,
  physicalArrivalMinutes,
  serviceStartMinutes,
) {
  return loads.map((load) => (
    load.id === loadId
      ? {
          ...load,
          [role]: {
            ...load[role],
            projectedArrivalMinutes: physicalArrivalMinutes,
            physicalArrivalMinutes,
            serviceStartMinutes,
          },
        }
      : load
  ))
}

export function recalculateDriverTimeline({
  driver,
  loads,
  plan,
  locations,
  startMinutesOverride = null,
}) {
  let nextLoads = loads
  const explicitStartMinutes = (
    startMinutesOverride !== null
    && startMinutesOverride !== undefined
    && Number.isFinite(Number(startMinutesOverride))
  )
    ? Number(startMinutesOverride)
    : null
  let nextPlan = {
    ...plan,
    ...(explicitStartMinutes == null
      ? {}
      : {
          dispatchStartMinutes: Math.max(
            Number(plan.shift?.startMinutes ?? 0),
            explicitStartMinutes,
          ),
        }),
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

  const day = buildDriverDay({ driver, loads: nextLoads, plan: nextPlan, locations })
  if (!day) return { loads: nextLoads, plan: nextPlan }

  let readyMinute = Number(
    day.timeline?.[0]?.projectedArrivalMinutes
      ?? day.dispatchStartMinutes
      ?? day.shift.startMinutes
      ?? 0,
  )
  let currentCoordinates = eventCoordinates(day.timeline[0], locations)

  for (const event of day.timeline.slice(1)) {
    const coordinates = eventCoordinates(event, locations)
    const travel = currentCoordinates && coordinates
      ? estimateRoadLeg(currentCoordinates, coordinates)
      : { minutes: 0 }
    const rawArrival = readyMinute + Number(travel.minutes ?? 0)

    if (event.kind === 'freight-stop') {
      const physicalArrivalMinutes = rawArrival
      const serviceStartMinutes = Math.max(
        physicalArrivalMinutes,
        Number(event.appointmentStartMinutes ?? physicalArrivalMinutes),
      )
      nextLoads = updateLoadTiming(
        nextLoads,
        event.loadId,
        event.role,
        physicalArrivalMinutes,
        serviceStartMinutes,
      )
      readyMinute = serviceStartMinutes
        + freightServiceMinutes(event.role, event.serviceMinutes)
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
  }

  return { loads: nextLoads, plan: nextPlan }
}

function insertionIndexForGap(sequenceWithoutMoving, beforeId, afterId, driverId) {
  if (afterId && sequenceWithoutMoving.includes(afterId)) {
    return sequenceWithoutMoving.indexOf(afterId)
  }

  if (beforeId && sequenceWithoutMoving.includes(beforeId)) {
    return sequenceWithoutMoving.indexOf(beforeId) + 1
  }

  if (!beforeId || beforeId === `${driverId}:shift-start`) return 0
  if (!afterId || afterId === `${driverId}:staging`) return sequenceWithoutMoving.length

  return -1
}

export function moveDriverPlanEventToGap({
  driver,
  driverId,
  loads = [],
  driverPlans = {},
  locations = {},
  eventId,
  beforeId = null,
  afterId = null,
} = {}) {
  const plan = driverPlans[driverId]
  if (!driver || !plan || !canEditDispatchPlan(plan)) {
    return { ok: false, reason: 'This Driver Day is not editable.' }
  }

  const currentDay = buildDriverDay({ driver, loads, plan, locations })
  const currentSequence = movableSequence(currentDay)

  if (!currentSequence.includes(eventId)) {
    return { ok: false, reason: 'Only freight stops and Lunch can be moved in V2.6.3.' }
  }

  const nextSequence = currentSequence.filter((id) => id !== eventId)
  const insertIndex = insertionIndexForGap(nextSequence, beforeId, afterId, driverId)
  if (insertIndex < 0) {
    return { ok: false, reason: 'That insertion gap is no longer available.' }
  }

  nextSequence.splice(insertIndex, 0, eventId)

  const orderCheck = validatePickupBeforeDelivery(nextSequence)
  if (!orderCheck.ok) return orderCheck

  const reordered = applyManifestOrder(loads, driverId, nextSequence)
  const sequencedPlan = updateLunchSequence(plan, nextSequence, reordered.orderByStopId)
  const recalculated = recalculateDriverTimeline({
    driver,
    loads: reordered.loads,
    plan: sequencedPlan,
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

  const sequencingBlocker = nextDay?.planHealth?.blockerIssues?.find((issue) => (
    issue.id.startsWith('capacity:')
  ))
  if (sequencingBlocker) {
    return {
      ok: false,
      reason: `Move blocked: ${sequencingBlocker.message}`,
    }
  }

  return {
    ok: true,
    reason: null,
    sequenceIds: nextSequence,
    orderedStopIds: reordered.orderedStopIds,
    loads: recalculated.loads,
    driverPlans: nextDriverPlans,
    driverDay: nextDay,
  }
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
  const day = driver && plan
    ? buildDriverDay({ driver, loads, plan, locations })
    : null
  const sequence = movableSequence(day)

  if (!sequence.includes(stopId) || !sequence.includes(targetStopId)) {
    return { ok: false, reason: 'Only planned freight stops can be resequenced.' }
  }

  const targetIndex = sequence.indexOf(targetStopId)
  const beforeId = placement === 'after'
    ? targetStopId
    : sequence[targetIndex - 1] ?? `${driverId}:shift-start`
  const afterId = placement === 'after'
    ? sequence[targetIndex + 1] ?? `${driverId}:staging`
    : targetStopId

  return moveDriverPlanEventToGap({
    driver,
    driverId,
    loads,
    driverPlans,
    locations,
    eventId: stopId,
    beforeId,
    afterId,
  })
}
