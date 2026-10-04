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

function sameCoordinate(left, right) {
  return validCoordinate(left)
    && validCoordinate(right)
    && Math.abs(Number(left[0]) - Number(right[0])) < 0.000001
    && Math.abs(Number(left[1]) - Number(right[1])) < 0.000001
}

export function stitchRouteShapeToAccess(route, originAccess, destinationAccess) {
  if (route?.source !== 'road' || !Array.isArray(route.routeShape) || route.routeShape.length < 2) {
    return route
  }

  const routeShape = route.routeShape.map((point) => [...point])

  if (validCoordinate(originAccess) && !sameCoordinate(routeShape[0], originAccess)) {
    routeShape.unshift([...originAccess])
  }
  if (
    validCoordinate(destinationAccess)
    && !sameCoordinate(routeShape[routeShape.length - 1], destinationAccess)
  ) {
    routeShape.push([...destinationAccess])
  }

  return {
    ...route,
    routeShape,
    renderOriginAccessCoordinates: validCoordinate(originAccess)
      ? [...originAccess]
      : route.originAccessCoordinates,
    renderDestinationAccessCoordinates: validCoordinate(destinationAccess)
      ? [...destinationAccess]
      : route.destinationAccessCoordinates,
  }
}

export function stitchCommittedRouteSegments(segments = []) {
  const accessByEventId = buildRouteAccessByEventId(segments)

  return segments.map((segment) => {
    if (segment?.route?.source !== 'road') return segment

    const originAccess = routeAccessCoordinate(
      accessByEventId,
      segment.fromId,
      segment.route.originAccessCoordinates,
    )
    const destinationAccess = routeAccessCoordinate(
      accessByEventId,
      segment.toId,
      segment.route.destinationAccessCoordinates,
    )

    return {
      ...segment,
      route: stitchRouteShapeToAccess(
        segment.route,
        originAccess,
        destinationAccess,
      ),
    }
  })
}

export function stitchFreightPreviewRoutes(preview) {
  if (!preview) return preview

  const pickupAccess = (
    preview.deadheadRoute?.destinationAccessCoordinates
    ?? preview.loadedRoute?.originAccessCoordinates
    ?? null
  )
  const deliveryAccess = (
    preview.loadedRoute?.destinationAccessCoordinates
    ?? preview.rejoinRoute?.originAccessCoordinates
    ?? null
  )

  return {
    ...preview,
    deadheadRoute: stitchRouteShapeToAccess(
      preview.deadheadRoute,
      preview.deadheadRoute?.originAccessCoordinates,
      pickupAccess,
    ),
    loadedRoute: stitchRouteShapeToAccess(
      preview.loadedRoute,
      pickupAccess,
      deliveryAccess,
    ),
    rejoinRoute: stitchRouteShapeToAccess(
      preview.rejoinRoute,
      deliveryAccess,
      preview.rejoinRoute?.destinationAccessCoordinates,
    ),
  }
}

