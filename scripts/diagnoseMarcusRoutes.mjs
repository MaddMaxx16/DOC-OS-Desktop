import { drivers } from '../src/data/drivers.js'
import { driverPlans, loads, locations } from '../src/data/operationsSeed.js'
import { buildDriverDay } from '../src/domain/manifest/driverDayModel.js'
import { buildDriverRouteSegments } from '../src/domain/routing/driverRoutePlan.js'

const ROUTER_URL = 'https://router.project-osrm.org/route/v1/driving'

function radians(value) {
  return Number(value) * Math.PI / 180
}

function milesBetween(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return null
  const [lon1, lat1] = left
  const [lon2, lat2] = right
  const dLat = radians(lat2 - lat1)
  const dLon = radians(lon2 - lon1)
  const a = (
    Math.sin(dLat / 2) ** 2
    + Math.cos(radians(lat1))
      * Math.cos(radians(lat2))
      * Math.sin(dLon / 2) ** 2
  )
  return 3958.8 * 2 * Math.asin(Math.sqrt(a))
}

function coord(point) {
  return Array.isArray(point)
    ? point.map((value) => Number(value).toFixed(6)).join(',')
    : 'NONE'
}

const marcus = drivers.find((driver) => driver.id === 'marcus-reed')
const day = buildDriverDay({
  driver: marcus,
  loads,
  plan: driverPlans[marcus.id],
  locations,
})
const segments = buildDriverRouteSegments(day, locations)

console.log('=== MARCUS ROUTE DIAGNOSTIC ===')
console.log('timeline:', day.timeline.map((event) => event.id).join(' -> '))

for (const [index, segment] of segments.entries()) {
  const coordinates = `${segment.fromCoordinates[0]},${segment.fromCoordinates[1]};${segment.toCoordinates[0]},${segment.toCoordinates[1]}`
  const url = `${ROUTER_URL}/${coordinates}?overview=full&geometries=geojson&steps=false`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  console.log(`\n[${index + 1}/${segments.length}] ${segment.id}`)
  console.log(`requested from=${coord(segment.fromCoordinates)} to=${coord(segment.toCoordinates)}`)

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'DOC-OS-route-diagnostic/1.0' },
      signal: controller.signal,
    })
    console.log(`http=${response.status}`)
    const data = await response.json()

    console.log(`code=${data.code ?? 'NONE'} message=${data.message ?? ''}`)
    const originAccess = data.waypoints?.[0]?.location ?? null
    const destinationAccess = data.waypoints?.[1]?.location ?? null
    console.log(`originAccess=${coord(originAccess)} originSnapMi=${milesBetween(segment.fromCoordinates, originAccess)?.toFixed(3) ?? 'NA'}`)
    console.log(`destinationAccess=${coord(destinationAccess)} destinationSnapMi=${milesBetween(segment.toCoordinates, destinationAccess)?.toFixed(3) ?? 'NA'}`)

    const route = data.routes?.[0]
    console.log(`route=${Boolean(route)} geometryPoints=${route?.geometry?.coordinates?.length ?? 0} distanceMi=${route ? (route.distance / 1609.344).toFixed(2) : 'NA'} durationMin=${route ? (route.duration / 60).toFixed(1) : 'NA'}`)
    if (route?.geometry?.coordinates?.length) {
      console.log(`geometryStart=${coord(route.geometry.coordinates[0])}`)
      console.log(`geometryEnd=${coord(route.geometry.coordinates.at(-1))}`)
    }
  } catch (error) {
    console.log(`ERROR=${error?.name ?? 'Error'}:${error?.message ?? String(error)}`)
  } finally {
    clearTimeout(timeout)
  }

  await new Promise((resolve) => setTimeout(resolve, 500))
}
