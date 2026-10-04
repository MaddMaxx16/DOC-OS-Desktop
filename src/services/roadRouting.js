const ROUTER_URL = 'https://router.project-osrm.org/route/v1/driving'
const REQUEST_TIMEOUT_MS = 8000
const MAX_ROAD_ATTEMPTS = 3
const RETRY_DELAYS_MS = [0, 250, 700]
const routeCache = new Map()

function sameCoordinate(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && Math.abs(Number(left[0]) - Number(right[0])) < 0.000001
    && Math.abs(Number(left[1]) - Number(right[1])) < 0.000001
}

export function ensureRouteTouchesEndpoints(routeShape = [], origin, destination) {
  const shape = Array.isArray(routeShape)
    ? routeShape.map((point) => [...point])
    : []

  if (!shape.length) return [origin, destination]

  if (!sameCoordinate(shape[0], origin)) shape.unshift([...origin])
  if (!sameCoordinate(shape[shape.length - 1], destination)) shape.push([...destination])

  return shape
}

function fallbackRoute(origin, destination) {
  const [originLon, originLat] = origin
  const [destinationLon, destinationLat] = destination
  const radians = (value) => value * (Math.PI / 180)
  const earthRadiusMiles = 3958.7613
  const phi1 = radians(originLat)
  const phi2 = radians(destinationLat)
  const deltaPhi = radians(destinationLat - originLat)
  const deltaLambda = radians(destinationLon - originLon)
  const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2
  const straightMiles = earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distanceMiles = straightMiles * 1.18
  const durationMinutes = Math.max(1, Math.round((distanceMiles / 38) * 60))
  return {
    distanceMiles,
    durationMinutes,
    routeShape: [origin, destination],
    source: 'estimate',
  }
}

function wait(milliseconds) {
  if (!milliseconds) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function validCoordinate(point) {
  return Array.isArray(point)
    && point.length >= 2
    && Number.isFinite(Number(point[0]))
    && Number.isFinite(Number(point[1]))
}

function appendShape(target, coordinates = []) {
  for (const point of coordinates) {
    if (!validCoordinate(point)) continue
    const previous = target[target.length - 1]
    if (previous && sameCoordinate(previous, point)) continue
    target.push([...point])
  }
}

export function roadPlanLegShape(leg = {}, origin, destination) {
  const shape = []

  for (const step of leg.steps ?? []) {
    appendShape(shape, step?.geometry?.coordinates ?? [])
  }

  if (!shape.length) return []
  return ensureRouteTouchesEndpoints(shape, origin, destination)
}

export function roadPlanLegs(route = {}, waypoints = []) {
  if (!Array.isArray(route?.legs) || route.legs.length !== waypoints.length - 1) return []

  return route.legs.map((leg, index) => ({
    distanceMiles: Number(leg.distance ?? 0) / 1609.344,
    durationMinutes: Math.max(0, Math.round(Number(leg.duration ?? 0) / 60)),
    routeShape: roadPlanLegShape(leg, waypoints[index], waypoints[index + 1]),
    source: 'road',
  }))
}

async function requestRoadRoutePlan(waypoints) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const coordinates = waypoints
      .map(([longitude, latitude]) => `${longitude},${latitude}`)
      .join(';')
    const response = await fetch(
      `${ROUTER_URL}/${coordinates}?overview=false&geometries=geojson&steps=true`,
      { headers: { Accept: 'application/json' }, signal: controller.signal },
    )
    if (!response.ok) throw new Error(`Road plan failed (${response.status})`)

    const data = await response.json()
    const route = data.routes?.[0]
    const legs = roadPlanLegs(route, waypoints)

    if (legs.length !== waypoints.length - 1) {
      throw new Error('Road plan returned incomplete legs')
    }
    if (legs.some((leg) => leg.routeShape.length < 2)) {
      throw new Error('Road plan leg missing geometry')
    }

    return legs
  } finally {
    clearTimeout(timeout)
  }
}

export async function calculateRoadRoutePlan(waypoints = []) {
  if (!Array.isArray(waypoints) || waypoints.length < 2 || waypoints.some((point) => !validCoordinate(point))) {
    throw new Error('At least two valid route waypoints are required')
  }

  const key = `plan:${waypoints.map((point) => point.join(',')).join(';')}`
  if (routeCache.has(key)) return routeCache.get(key)

  for (let attempt = 0; attempt < MAX_ROAD_ATTEMPTS; attempt += 1) {
    await wait(RETRY_DELAYS_MS[attempt] ?? 0)

    try {
      const legs = await requestRoadRoutePlan(waypoints)
      routeCache.set(key, legs)
      return legs
    } catch {
      // Retry the complete ordered plan so every leg shares one routing calculation.
    }
  }

  return null
}

export function buildRoadRouteResult(data, origin, destination) {
  const route = data?.routes?.[0]
  if (!route?.geometry?.coordinates?.length) throw new Error('Road route missing geometry')

  const originAccessCoordinates = validCoordinate(data?.waypoints?.[0]?.location)
    ? [...data.waypoints[0].location]
    : [...origin]
  const destinationAccessCoordinates = validCoordinate(data?.waypoints?.[1]?.location)
    ? [...data.waypoints[1].location]
    : [...destination]

  return {
    distanceMiles: route.distance / 1609.344,
    durationMinutes: Math.max(1, Math.round(route.duration / 60)),
    routeShape: ensureRouteTouchesEndpoints(
      route.geometry.coordinates,
      originAccessCoordinates,
      destinationAccessCoordinates,
    ),
    originAccessCoordinates,
    destinationAccessCoordinates,
    requestedOriginCoordinates: [...origin],
    requestedDestinationCoordinates: [...destination],
    source: 'road',
  }
}

async function requestRoadRoute(origin, destination) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const coordinates = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`
    const response = await fetch(
      `${ROUTER_URL}/${coordinates}?overview=full&geometries=geojson&steps=false`,
      { headers: { Accept: 'application/json' }, signal: controller.signal },
    )
    if (!response.ok) throw new Error(`Road route failed (${response.status})`)
    const data = await response.json()
    return buildRoadRouteResult(data, origin, destination)
  } finally {
    clearTimeout(timeout)
  }
}

export async function calculateRoadRoute(origin, destination) {
  if (!Array.isArray(origin) || !Array.isArray(destination)) throw new Error('Route endpoints are required')
  const key = `${origin.join(',')}:${destination.join(',')}`
  if (routeCache.has(key)) return routeCache.get(key)

  for (let attempt = 0; attempt < MAX_ROAD_ATTEMPTS; attempt += 1) {
    await wait(RETRY_DELAYS_MS[attempt] ?? 0)

    try {
      const result = await requestRoadRoute(origin, destination)
      routeCache.set(key, result)
      return result
    } catch {
      // A public road-router miss is retried before falling back to timing-only estimation.
    }
  }

  // Do not cache an estimate. A later map refresh should get another chance to obtain real road geometry.
  return fallbackRoute(origin, destination)
}
