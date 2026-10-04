function validCoordinate(point) {
  return Array.isArray(point)
    && point.length >= 2
    && Number.isFinite(Number(point[0]))
    && Number.isFinite(Number(point[1]))
}

export function buildRouteAccessByEventId(segments = []) {
  const accessByEventId = new Map()

  for (const segment of segments) {
    if (segment?.route?.source !== 'road') continue

    const originAccess = segment.route.originAccessCoordinates
    const destinationAccess = segment.route.destinationAccessCoordinates

    if (validCoordinate(originAccess) && !accessByEventId.has(segment.fromId)) {
      accessByEventId.set(segment.fromId, [...originAccess])
    }

    if (validCoordinate(destinationAccess)) {
      // Prefer the incoming leg's destination access point for an operational stop.
      accessByEventId.set(segment.toId, [...destinationAccess])
    }
  }

  return accessByEventId
}

export function routeAccessCoordinate(accessByEventId, eventId, fallback = null) {
  const access = accessByEventId?.get?.(eventId)
  if (validCoordinate(access)) return access
  return validCoordinate(fallback) ? fallback : null
}
