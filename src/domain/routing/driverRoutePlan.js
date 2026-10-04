function coordinatesForEvent(event, locations = {}) {
  if (Array.isArray(event?.coordinates)) return event.coordinates
  return locations[event?.locationId]?.coordinates ?? null
}

function anchorBadge(event) {
  if (event?.kind === 'freight-stop') {
    return `${event.role === 'pickup' ? 'P' : 'D'}${event.loadOrdinal}`
  }
  if (event?.kind === 'lunch') return 'L'
  if (event?.kind === 'staging') return 'S'
  if (event?.kind === 'shift-start') return 'Y'
  return ''
}

function anchorPoiType(events = [], location = {}) {
  if (events.some((event) => event.kind === 'freight-stop')) {
    return location.poiType ?? 'warehouse'
  }
  if (events.some((event) => event.kind === 'shift-start')) {
    return location.poiType ?? 'yard'
  }
  if (events.some((event) => event.kind === 'staging')) {
    return location.poiType ?? 'staging'
  }
  if (events.some((event) => event.kind === 'lunch')) return 'food'
  return location.poiType ?? 'warehouse'
}

export function buildDriverRouteAnchors(driverDay, locations = {}) {
  const grouped = new Map()

  for (const event of driverDay?.timeline ?? []) {
    if (event?.anchorMode === 'driver') continue

    const coordinates = coordinatesForEvent(event, locations)
    if (!coordinates) continue

    const key = event.locationId ?? coordinates.join(',')
    const location = locations[event.locationId] ?? {}
    const current = grouped.get(key) ?? {
      id: `route-anchor:${key}`,
      driverId: driverDay.driverId,
      locationId: event.locationId ?? null,
      locationLabel: event.locationLabel ?? location.label ?? 'Route stop',
      coordinates,
      events: [],
    }

    current.events.push(event)
    grouped.set(key, current)
  }

  return [...grouped.values()].map((anchor) => {
    const badges = [...new Set(anchor.events.map(anchorBadge).filter(Boolean))]
    return {
      id: anchor.id,
      driverId: anchor.driverId,
      locationId: anchor.locationId,
      locationLabel: anchor.locationLabel,
      coordinates: anchor.coordinates,
      poiType: anchorPoiType(anchor.events, locations[anchor.locationId] ?? {}),
      badge: badges.join('/'),
      eventIds: anchor.events.map((event) => event.id),
      eventKinds: anchor.events.map((event) => event.kind),
    }
  })
}

export function buildDriverRouteSegments(driverDay, locations = {}) {
  const timeline = driverDay?.timeline ?? []
  const segments = []

  for (let index = 0; index < timeline.length - 1; index += 1) {
    const from = timeline[index]
    const to = timeline[index + 1]
    const fromCoordinates = coordinatesForEvent(from, locations)
    const toCoordinates = coordinatesForEvent(to, locations)

    if (!fromCoordinates || !toCoordinates) continue

    segments.push({
      id: `${from.id}->${to.id}`,
      driverId: driverDay.driverId,
      fromId: from.id,
      toId: to.id,
      fromKind: from.kind,
      toKind: to.kind,
      fromCoordinates,
      toCoordinates,
    })
  }

  return segments
}

export function markInsertionAffectedSegment(segments = [], insertion = null) {
  return segments.map((segment) => ({
    ...segment,
    affected: Boolean(
      insertion
      && segment.fromId === insertion.afterId
      && segment.toId === insertion.beforeId
    ),
  }))
}
