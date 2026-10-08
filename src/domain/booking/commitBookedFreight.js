function cloneLoadWithOrders(load, orderByStopId) {
  const pickupId = `${load.id}:pickup`
  const deliveryId = `${load.id}:delivery`
  const pickupOrder = orderByStopId.get(pickupId)
  const deliveryOrder = orderByStopId.get(deliveryId)

  if (!Number.isFinite(pickupOrder) && !Number.isFinite(deliveryOrder)) return load

  return {
    ...load,
    pickup: {
      ...load.pickup,
      manifestOrder: Number.isFinite(pickupOrder)
        ? pickupOrder
        : load.pickup.manifestOrder,
    },
    delivery: {
      ...load.delivery,
      manifestOrder: Number.isFinite(deliveryOrder)
        ? deliveryOrder
        : load.delivery.manifestOrder,
    },
  }
}

function getNextDayLoadOrder(loads, driverId) {
  return loads
    .filter((load) => load.assignedDriverId === driverId)
    .reduce((highest, load) => Math.max(highest, Number(load.dayLoadOrder ?? 0)), 0) + 1
}

function buildInsertedTimeline(driverDay, newLoadId, evaluation) {
  const afterId = evaluation?.insertion?.afterId
  const beforeId = evaluation?.insertion?.beforeId
  const timeline = driverDay?.timeline ?? []
  const afterIndex = timeline.findIndex((event) => event.id === afterId)

  if (
    afterIndex < 0
    || timeline[afterIndex + 1]?.id !== beforeId
  ) {
    throw new Error('Booking insertion no longer matches the current driver day.')
  }

  const pickupEvent = {
    id: `${newLoadId}:pickup`,
    kind: 'freight-stop',
    role: 'pickup',
  }
  const deliveryEvent = {
    id: `${newLoadId}:delivery`,
    kind: 'freight-stop',
    role: 'delivery',
  }

  return [
    ...timeline.slice(0, afterIndex + 1),
    pickupEvent,
    deliveryEvent,
    ...timeline.slice(afterIndex + 1),
  ]
}

function manifestOrderMap(timeline) {
  const map = new Map()
  let order = 0

  for (const event of timeline) {
    if (event.kind !== 'freight-stop') continue
    map.set(event.id, order)
    order += 1
  }

  return map
}

function updateLunchPlacement(plan, insertedTimeline, orderByStopId) {
  if (!plan?.lunch) return plan

  const lunchIndex = insertedTimeline.findIndex((event) => event.kind === 'lunch')
  if (lunchIndex < 0) return plan

  let previousFreight = null
  for (let index = lunchIndex - 1; index >= 0; index -= 1) {
    if (insertedTimeline[index]?.kind === 'freight-stop') {
      previousFreight = insertedTimeline[index]
      break
    }
  }

  const afterManifestOrder = previousFreight
    ? orderByStopId.get(previousFreight.id)
    : plan.lunch.afterManifestOrder

  return {
    ...plan,
    lunch: {
      ...plan.lunch,
      afterManifestOrder,
    },
  }
}

export function commitBookedFreight({
  lane,
  driverId,
  driverDay,
  evaluation,
  rateConfirmation,
  loads = [],
  driverPlans = {},
} = {}) {
  if (!lane || !driverId || !driverDay || !evaluation || !rateConfirmation) {
    throw new Error('Cannot confirm freight without lane, driver, day, fit, and Rate Confirmation.')
  }

  const newLoadId = lane.id
  if (loads.some((load) => load.id === newLoadId)) {
    throw new Error(`Load ${newLoadId} is already committed.`)
  }

  const insertedTimeline = buildInsertedTimeline(driverDay, newLoadId, evaluation)
  const orderByStopId = manifestOrderMap(insertedTimeline)
  const terms = rateConfirmation.terms

  const bookedLoad = {
    id: newLoadId,
    loadRef: lane.laneRef,
    dayLoadOrder: getNextDayLoadOrder(loads, driverId),
    assignedDriverId: driverId,
    sourceLaneId: lane.id,
    bookingStatus: 'confirmed',
    rate: Number(terms.rate),
    rateConfirmationId: rateConfirmation.id,
    freight: {
      pallets: Number(terms.freight.pallets),
      weightLbs: Number(terms.freight.weightLbs),
    },
    pickupReality: lane.pickupReality
      ? {
          missingUnitNumbers: [...(lane.pickupReality.missingUnitNumbers ?? [])],
          damagedUnits: (lane.pickupReality.damagedUnits ?? []).map((item) => ({ ...item })),
        }
      : null,
    pickup: {
      locationId: terms.pickupLocationId,
      appointmentStartMinutes: Number(terms.pickupWindow.startMinutes),
      appointmentEndMinutes: Number(terms.pickupWindow.endMinutes),
      projectedArrivalMinutes: Number(evaluation.insertion.pickupArrival),
      manifestOrder: orderByStopId.get(`${newLoadId}:pickup`),
    },
    delivery: {
      locationId: terms.deliveryLocationId,
      appointmentStartMinutes: Number(terms.deliveryWindow.startMinutes),
      appointmentEndMinutes: Number(terms.deliveryWindow.endMinutes),
      projectedArrivalMinutes: Number(evaluation.insertion.deliveryArrival),
      manifestOrder: orderByStopId.get(`${newLoadId}:delivery`),
    },
  }

  const nextLoads = loads.map((load) => (
    load.assignedDriverId === driverId
      ? cloneLoadWithOrders(load, orderByStopId)
      : load
  ))
  nextLoads.push(bookedLoad)

  const nextDriverPlans = {
    ...driverPlans,
    [driverId]: updateLunchPlacement(
      driverPlans[driverId],
      insertedTimeline,
      orderByStopId,
    ),
  }

  return {
    loads: nextLoads,
    driverPlans: nextDriverPlans,
    bookedLoad,
  }
}
