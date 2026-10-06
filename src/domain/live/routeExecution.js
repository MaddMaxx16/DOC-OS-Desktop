import {
  dockNumberForPickup,
  facilityOperationForEvent,
  pickupPlanCommitted,
} from '../facility/pickupOperation.js'
import {
  deliveryOperationForEvent,
  deliveryOperationPhase,
  deliveryPlanCommitted,
  dockNumberForDelivery,
} from '../facility/deliveryOperation.js'

const EARTH_RADIUS_MILES = 3958.8

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function toRadians(value) {
  return Number(value) * Math.PI / 180
}

function distanceMiles(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return 0

  const [lng1, lat1] = left
  const [lng2, lat2] = right
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a = (
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1))
      * Math.cos(toRadians(lat2))
      * Math.sin(dLng / 2) ** 2
  )

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a))
}

function validCoordinate(point) {
  return Array.isArray(point)
    && point.length >= 2
    && Number.isFinite(Number(point[0]))
    && Number.isFinite(Number(point[1]))
}

function normalizeTimeline(driverDay = {}, facilityOperations = null) {
  const timeline = driverDay.timeline ?? []
  let previousArrival = Number.NEGATIVE_INFINITY
  let accumulatedDelayMinutes = 0

  return timeline.map((event, index) => {
    let arrival = finite(
      event.physicalArrivalMinutes,
      event.projectedArrivalMinutes,
    ) + accumulatedDelayMinutes

    while (arrival < previousArrival) arrival += 1440

    let serviceStart = arrival
    let departure = arrival

    if (event.kind === 'freight-stop') {
      serviceStart = Math.max(
        arrival,
        finite(event.serviceStartMinutes, arrival),
      )
      const serviceDuration = Math.max(
        0,
        finite(
          event.serviceMinutes,
          finite(event.endMinutes, serviceStart)
            - finite(event.serviceStartMinutes, serviceStart),
        ),
      )
      departure = serviceStart + serviceDuration
    } else if (Number.isFinite(Number(event.endMinutes))) {
      departure = finite(event.endMinutes) + accumulatedDelayMinutes
      while (departure < serviceStart) departure += 1440
    }

    const operation = (
      event.kind === 'freight-stop'
      && facilityOperations
    )
      ? facilityOperationForEvent(
          facilityOperations,
          driverDay.driverId,
          event.id,
        )
      : null

    if (event.role === 'pickup' && pickupPlanCommitted(operation)) {
      const originalDeparture = departure
      const loadingStart = Math.max(
        serviceStart,
        finite(operation.loadingStartMinutes, serviceStart),
      )
      const loadingDuration = Math.max(
        1,
        finite(
          operation.loadingDurationMinutes,
          departure - serviceStart,
        ),
      )

      serviceStart = loadingStart
      departure = loadingStart + loadingDuration
      accumulatedDelayMinutes += Math.max(0, departure - originalDeparture)
    }

    if (event.role === 'delivery' && deliveryPlanCommitted(operation)) {
      const originalDeparture = departure
      const unloadingStart = Math.max(
        serviceStart,
        finite(operation.unloadingStartMinutes, serviceStart),
      )
      const operationDeparture = Math.max(
        unloadingStart + 1,
        finite(
          operation.receiverVerificationCompleteMinutes,
          unloadingStart
            + finite(operation.unloadingDurationMinutes, departure - serviceStart)
            + finite(operation.receiverVerificationMinutes, 3),
        ),
      )

      serviceStart = unloadingStart
      departure = operationDeparture
      accumulatedDelayMinutes += Math.max(0, departure - originalDeparture)
    }

    previousArrival = arrival

    return {
      event,
      index,
      arrivalMinutes: arrival,
      serviceStartMinutes: serviceStart,
      departureMinutes: departure,
    }
  })
}

function currentAbsoluteMinutes(clock = {}) {
  const dayNumber = Math.max(1, Math.floor(finite(clock.dayNumber, 1)))
  const currentMinutes = ((Math.floor(finite(clock.currentMinutes)) % 1440) + 1440) % 1440
  return ((dayNumber - 1) * 1440) + currentMinutes
}

function segmentId(fromEvent, toEvent) {
  return `${fromEvent.id}->${toEvent.id}`
}

function completedSegmentIds(schedule = [], currentMinutes) {
  const ids = []

  for (let index = 1; index < schedule.length; index += 1) {
    if (currentMinutes < schedule[index].arrivalMinutes) break
    ids.push(segmentId(schedule[index - 1].event, schedule[index].event))
  }

  return ids
}

function completedEventIds(schedule = [], currentMinutes) {
  return schedule
    .filter((item) => currentMinutes >= item.departureMinutes)
    .map((item) => item.event.id)
}

function nextEventAfter(schedule = [], index) {
  return schedule[index + 1] ?? null
}

function freightLoadState(schedule = [], currentMinutes) {
  const onboard = new Map()
  const completedFreightServiceEventIds = []

  for (const item of schedule) {
    const event = item.event
    if (event?.kind !== 'freight-stop') continue
    if (currentMinutes < item.departureMinutes) continue

    completedFreightServiceEventIds.push(event.id)

    if (event.role === 'pickup') {
      onboard.set(event.loadId, event.freight ?? {})
    } else if (event.role === 'delivery') {
      onboard.delete(event.loadId)
    }
  }

  let onboardPallets = 0
  let onboardWeightLbs = 0
  for (const freight of onboard.values()) {
    onboardPallets += finite(freight?.pallets)
    onboardWeightLbs += finite(freight?.weightLbs)
  }

  return {
    completedFreightServiceEventIds,
    onboardLoadIds: [...onboard.keys()],
    onboardPallets,
    onboardWeightLbs,
  }
}

function freightServiceFields(item, currentMinutes) {
  const event = item?.event
  if (event?.kind !== 'freight-stop') return {}

  const serviceDurationMinutes = Math.max(
    0,
    item.departureMinutes - item.serviceStartMinutes,
  )
  const elapsed = Math.max(
    0,
    Math.min(serviceDurationMinutes, currentMinutes - item.serviceStartMinutes),
  )
  const serviceProgress = serviceDurationMinutes > 0
    ? elapsed / serviceDurationMinutes
    : 1

  return {
    serviceRole: event.role ?? null,
    serviceLoadId: event.loadId ?? null,
    serviceLoadRef: event.loadRef ?? null,
    serviceStartMinutes: item.serviceStartMinutes,
    serviceDurationMinutes,
    serviceProgress,
    serviceRemainingMinutes: Math.max(0, item.departureMinutes - currentMinutes),
  }
}

function executionBase(schedule, currentMinutes) {
  return {
    currentAbsoluteMinutes: currentMinutes,
    completedSegmentIds: completedSegmentIds(schedule, currentMinutes),
    completedEventIds: completedEventIds(schedule, currentMinutes),
    ...freightLoadState(schedule, currentMinutes),
  }
}

export function buildTimelineExecution(
  driverDay = {},
  clock = {},
  {
    pickupFacilityMode = false,
    deliveryFacilityMode = false,
    facilityOperations = null,
  } = {},
) {
  const schedule = normalizeTimeline(driverDay, facilityOperations)
  const currentMinutes = currentAbsoluteMinutes(clock)
  const base = executionBase(schedule, currentMinutes)

  if (!schedule.length) {
    return {
      ...base,
      executionPhase: 'idle',
      activeSegmentId: null,
      activeSegmentProgress: 0,
      currentEventId: null,
      currentEventKind: null,
      currentEventLabel: null,
      currentEventDepartureMinutes: null,
      nextEventId: null,
      nextEventKind: null,
      nextEventLabel: null,
      nextEventArrivalMinutes: null,
    }
  }

  const first = schedule[0]
  if (currentMinutes < first.arrivalMinutes) {
    const next = schedule[1] ?? first
    return {
      ...base,
      executionPhase: 'scheduled',
      activeSegmentId: null,
      activeSegmentProgress: 0,
      currentEventId: first.event.id,
      currentEventKind: first.event.kind,
      currentEventLabel: first.event.locationLabel,
      currentEventDepartureMinutes: first.departureMinutes,
      nextEventId: next.event.id,
      nextEventKind: next.event.kind,
      nextEventLabel: next.event.locationLabel,
      nextEventArrivalMinutes: next.arrivalMinutes,
    }
  }

  for (let index = 0; index < schedule.length; index += 1) {
    const current = schedule[index]
    const next = nextEventAfter(schedule, index)

    if (
      current.event.kind === 'freight-stop'
      && currentMinutes >= current.arrivalMinutes
      && currentMinutes < current.serviceStartMinutes
    ) {
      return {
        ...base,
        executionPhase: 'waiting-appointment',
        activeSegmentId: null,
        activeSegmentProgress: 0,
        currentEventId: current.event.id,
        currentEventKind: current.event.kind,
        currentEventLabel: current.event.locationLabel,
        currentEventArrivalMinutes: current.arrivalMinutes,
        currentEventServiceStartMinutes: current.serviceStartMinutes,
        currentEventDepartureMinutes: current.departureMinutes,
        waitingUntilMinutes: current.serviceStartMinutes,
        waitRemainingMinutes: Math.max(0, current.serviceStartMinutes - currentMinutes),
        nextEventId: next?.event.id ?? null,
        nextEventKind: next?.event.kind ?? null,
        nextEventLabel: next?.event.locationLabel ?? null,
        nextEventArrivalMinutes: next?.arrivalMinutes ?? null,
        serviceRole: current.event.role ?? null,
        serviceLoadId: current.event.loadId ?? null,
        serviceLoadRef: current.event.loadRef ?? null,
      }
    }

    if (
      pickupFacilityMode
      && current.event.kind === 'freight-stop'
      && current.event.role === 'pickup'
      && currentMinutes >= current.serviceStartMinutes
    ) {
      const operation = facilityOperationForEvent(
        facilityOperations ?? {},
        driverDay.driverId,
        current.event.id,
      )

      if (!pickupPlanCommitted(operation)) {
        const heldBase = executionBase(schedule, current.arrivalMinutes)

        return {
          ...heldBase,
          currentAbsoluteMinutes: currentMinutes,
          executionPhase: 'facility-dock-assigned',
          activeSegmentId: null,
          activeSegmentProgress: 0,
          currentEventId: current.event.id,
          currentEventKind: current.event.kind,
          currentEventLabel: current.event.locationLabel,
          currentEventArrivalMinutes: current.arrivalMinutes,
          currentEventServiceStartMinutes: current.serviceStartMinutes,
          currentEventDepartureMinutes: null,
          nextEventId: next?.event.id ?? null,
          nextEventKind: next?.event.kind ?? null,
          nextEventLabel: next?.event.locationLabel ?? null,
          nextEventArrivalMinutes: null,
          serviceRole: current.event.role,
          serviceLoadId: current.event.loadId ?? null,
          serviceLoadRef: current.event.loadRef ?? null,
          facilityStatus: 'DOCK ASSIGNED',
          dock: dockNumberForPickup(current.event),
          facilityActionRequired: true,
        }
      }
    }

    if (
      deliveryFacilityMode
      && current.event.kind === 'freight-stop'
      && current.event.role === 'delivery'
      && currentMinutes >= current.serviceStartMinutes
    ) {
      const operation = deliveryOperationForEvent(
        facilityOperations ?? {},
        driverDay.driverId,
        current.event.id,
      )

      if (!deliveryPlanCommitted(operation)) {
        const heldBase = executionBase(schedule, current.arrivalMinutes)

        return {
          ...heldBase,
          currentAbsoluteMinutes: currentMinutes,
          executionPhase: 'facility-dock-assigned',
          activeSegmentId: null,
          activeSegmentProgress: 0,
          currentEventId: current.event.id,
          currentEventKind: current.event.kind,
          currentEventLabel: current.event.locationLabel,
          currentEventArrivalMinutes: current.arrivalMinutes,
          currentEventServiceStartMinutes: current.serviceStartMinutes,
          currentEventDepartureMinutes: null,
          nextEventId: next?.event.id ?? null,
          nextEventKind: next?.event.kind ?? null,
          nextEventLabel: next?.event.locationLabel ?? null,
          nextEventArrivalMinutes: null,
          serviceRole: current.event.role,
          serviceLoadId: current.event.loadId ?? null,
          serviceLoadRef: current.event.loadRef ?? null,
          facilityStatus: 'DOCK ASSIGNED',
          facilityOperationType: 'delivery',
          dock: dockNumberForDelivery(current.event),
          facilityActionRequired: true,
        }
      }
    }

    if (
      currentMinutes >= current.serviceStartMinutes
      && currentMinutes < current.departureMinutes
    ) {
      let servicePhase = current.event.kind === 'freight-stop'
        ? current.event.role === 'pickup'
          ? 'service-loading'
          : 'service-unloading'
        : current.event.kind === 'lunch'
          ? 'dwell-break'
          : 'dwell'

      const deliveryOperation = current.event.role === 'delivery'
        ? deliveryOperationForEvent(
            facilityOperations ?? {},
            driverDay.driverId,
            current.event.id,
          )
        : null
      const deliveryPhase = deliveryOperation
        ? deliveryOperationPhase(deliveryOperation, currentMinutes)
        : null

      if (deliveryPhase === 'receiver-verification') {
        servicePhase = 'receiver-verification'
      }

      return {
        ...base,
        executionPhase: servicePhase,
        activeSegmentId: null,
        activeSegmentProgress: 0,
        currentEventId: current.event.id,
        currentEventKind: current.event.kind,
        currentEventLabel: current.event.locationLabel,
        currentEventArrivalMinutes: current.arrivalMinutes,
        currentEventServiceStartMinutes: current.serviceStartMinutes,
        currentEventDepartureMinutes: current.departureMinutes,
        nextEventId: next?.event.id ?? null,
        nextEventKind: next?.event.kind ?? null,
        nextEventLabel: next?.event.locationLabel ?? null,
        nextEventArrivalMinutes: next?.arrivalMinutes ?? null,
        ...freightServiceFields(current, currentMinutes),
        ...(deliveryOperation ? {
          facilityOperationType: 'delivery',
          dock: deliveryOperation.dock ?? dockNumberForDelivery(current.event),
          deliveryOperationPhase: deliveryPhase,
          unloadingCompleteMinutes: deliveryOperation.unloadingCompleteMinutes ?? null,
          receiverVerificationCompleteMinutes: deliveryOperation.receiverVerificationCompleteMinutes ?? null,
          receiverResults: deliveryOperation.receiverResults ?? [],
          podSeed: deliveryOperation.podSeed ?? null,
        } : {}),
      }
    }

    if (
      index > 0
      && currentMinutes === current.arrivalMinutes
      && current.departureMinutes === current.arrivalMinutes
    ) {
      return {
        ...base,
        executionPhase: 'arrived',
        activeSegmentId: null,
        activeSegmentProgress: 0,
        currentEventId: current.event.id,
        currentEventKind: current.event.kind,
        currentEventLabel: current.event.locationLabel,
        currentEventDepartureMinutes: current.departureMinutes,
        nextEventId: next?.event.id ?? null,
        nextEventKind: next?.event.kind ?? null,
        nextEventLabel: next?.event.locationLabel ?? null,
        nextEventArrivalMinutes: next?.arrivalMinutes ?? null,
      }
    }

    if (
      next
      && currentMinutes >= current.departureMinutes
      && currentMinutes < next.arrivalMinutes
    ) {
      const duration = Math.max(1, next.arrivalMinutes - current.departureMinutes)
      const progress = Math.min(
        1,
        Math.max(0, (currentMinutes - current.departureMinutes) / duration),
      )

      return {
        ...base,
        executionPhase: 'en-route',
        activeSegmentId: segmentId(current.event, next.event),
        activeSegmentProgress: progress,
        currentEventId: current.event.id,
        currentEventKind: current.event.kind,
        currentEventLabel: current.event.locationLabel,
        currentEventDepartureMinutes: current.departureMinutes,
        nextEventId: next.event.id,
        nextEventKind: next.event.kind,
        nextEventLabel: next.event.locationLabel,
        nextEventArrivalMinutes: next.arrivalMinutes,
        nextEventServiceStartMinutes: next.serviceStartMinutes,
      }
    }
  }

  const final = schedule[schedule.length - 1]

  return {
    ...base,
    executionPhase: 'complete',
    activeSegmentId: null,
    activeSegmentProgress: 1,
    currentEventId: final.event.id,
    currentEventKind: final.event.kind,
    currentEventLabel: final.event.locationLabel,
    currentEventDepartureMinutes: final.departureMinutes,
    nextEventId: null,
    nextEventKind: null,
    nextEventLabel: null,
    nextEventArrivalMinutes: null,
  }
}

export function coordinateAlongRouteShape(routeShape = [], progress = 0) {
  const points = routeShape.filter(validCoordinate)
  if (!points.length) return null
  if (points.length === 1) return [...points[0]]

  const safeProgress = Math.min(1, Math.max(0, Number(progress) || 0))
  if (safeProgress <= 0) return [...points[0]]
  if (safeProgress >= 1) return [...points[points.length - 1]]

  const legs = []
  let totalMiles = 0

  for (let index = 0; index < points.length - 1; index += 1) {
    const miles = distanceMiles(points[index], points[index + 1])
    legs.push(miles)
    totalMiles += miles
  }

  if (totalMiles <= 0) {
    const index = Math.min(points.length - 1, Math.floor(safeProgress * points.length))
    return [...points[index]]
  }

  const targetMiles = totalMiles * safeProgress
  let traversed = 0

  for (let index = 0; index < legs.length; index += 1) {
    const legMiles = legs[index]
    if (traversed + legMiles < targetMiles) {
      traversed += legMiles
      continue
    }

    const legProgress = legMiles <= 0
      ? 0
      : (targetMiles - traversed) / legMiles
    const from = points[index]
    const to = points[index + 1]

    return [
      from[0] + ((to[0] - from[0]) * legProgress),
      from[1] + ((to[1] - from[1]) * legProgress),
    ]
  }

  return [...points[points.length - 1]]
}

function eventCoordinateFromSegments(eventId, segments = []) {
  const incoming = segments.find((segment) => (
    segment.toId === eventId
    && segment.route?.source === 'road'
  ))
  if (incoming) {
    return (
      incoming.route.renderDestinationAccessCoordinates
      ?? incoming.route.destinationAccessCoordinates
      ?? incoming.route.routeShape?.at?.(-1)
      ?? null
    )
  }

  const outgoing = segments.find((segment) => (
    segment.fromId === eventId
    && segment.route?.source === 'road'
  ))
  if (outgoing) {
    return (
      outgoing.route.renderOriginAccessCoordinates
      ?? outgoing.route.originAccessCoordinates
      ?? outgoing.route.routeShape?.[0]
      ?? null
    )
  }

  return null
}

export function routeExecutionPosition(
  execution = {},
  segments = [],
  fallbackCoordinates = null,
) {
  if (execution?.executionPhase === 'en-route' && execution.activeSegmentId) {
    const segment = segments.find((item) => item.id === execution.activeSegmentId)
    const position = coordinateAlongRouteShape(
      segment?.route?.routeShape ?? [],
      execution.activeSegmentProgress,
    )
    if (validCoordinate(position)) return position
  }

  if (execution?.currentEventId) {
    const parked = eventCoordinateFromSegments(execution.currentEventId, segments)
    if (validCoordinate(parked)) return parked
  }

  return validCoordinate(fallbackCoordinates)
    ? [...fallbackCoordinates]
    : null
}

export function routeSegmentExecutionPhase(segmentIdValue, execution = {}) {
  if (!execution?.sent || execution.phase === 'draft' || execution.phase === 'scheduled') {
    return 'planned'
  }

  if ((execution.completedSegmentIds ?? []).includes(segmentIdValue)) {
    return 'completed'
  }

  if (execution.activeSegmentId === segmentIdValue) return 'active'

  return 'future'
}
