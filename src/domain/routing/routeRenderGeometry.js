function sameCoordinate(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && Math.abs(Number(left[0]) - Number(right[0])) < 0.000001
    && Math.abs(Number(left[1]) - Number(right[1])) < 0.000001
}

function validCoordinate(point) {
  return Array.isArray(point)
    && point.length >= 2
    && Number.isFinite(Number(point[0]))
    && Number.isFinite(Number(point[1]))
}

export function exactSegmentRouteShape(segment = {}) {
  const origin = segment.fromCoordinates
  const destination = segment.toCoordinates

  if (!validCoordinate(origin) || !validCoordinate(destination)) return []

  if (segment.route?.source !== 'road') return []

  const routeShape = Array.isArray(segment.route?.routeShape)
    ? segment.route.routeShape.filter(validCoordinate).map((point) => [...point])
    : []

  if (!routeShape.length) return []

  if (!sameCoordinate(routeShape[0], origin)) routeShape.unshift([...origin])
  if (!sameCoordinate(routeShape[routeShape.length - 1], destination)) {
    routeShape.push([...destination])
  }

  if (routeShape.length === 1) routeShape.push([...destination])

  return routeShape
}
