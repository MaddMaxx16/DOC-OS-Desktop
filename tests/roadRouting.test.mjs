import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildRoadRouteResult,
  ensureRouteTouchesEndpoints,
  roadPlanLegs,
} from '../src/services/roadRouting.js'

test('road route geometry is extended to exact gameplay POI endpoints', () => {
  const origin = [-74.1000, 40.7000]
  const destination = [-73.9000, 40.8000]
  const snappedRoadShape = [
    [-74.0992, 40.7006],
    [-74.0000, 40.7500],
    [-73.9008, 40.7994],
  ]

  const shape = ensureRouteTouchesEndpoints(snappedRoadShape, origin, destination)

  assert.deepEqual(shape[0], origin)
  assert.deepEqual(shape.at(-1), destination)
  assert.deepEqual(shape.slice(1, -1), snappedRoadShape)
})

test('exact route endpoints are not duplicated', () => {
  const origin = [-74.1000, 40.7000]
  const destination = [-73.9000, 40.8000]
  const shape = ensureRouteTouchesEndpoints(
    [origin, [-74.0000, 40.7500], destination],
    origin,
    destination,
  )

  assert.equal(shape.length, 3)
})

test('road-routing source keeps exact endpoint normalization separate from estimate display policy', () => {
  const origin = [-74.0107, 40.6562]
  const destination = [-74.0170, 40.6470]
  const roadShape = [
    origin,
    [-74.0140, 40.6510],
    destination,
  ]

  assert.deepEqual(
    ensureRouteTouchesEndpoints(roadShape, origin, destination),
    roadShape,
  )
})


test('continuous road plan splits one ordered OSRM result back into exact Driver Day legs', () => {
  const waypoints = [
    [-74.16, 40.73],
    [-74.18, 40.68],
    [-73.92, 40.73],
  ]
  const route = {
    legs: [
      {
        distance: 1609.344,
        duration: 600,
        steps: [
          { geometry: { coordinates: [[-74.159, 40.729], [-74.170, 40.700]] } },
          { geometry: { coordinates: [[-74.170, 40.700], [-74.181, 40.681]] } },
        ],
      },
      {
        distance: 3218.688,
        duration: 1200,
        steps: [
          { geometry: { coordinates: [[-74.179, 40.681], [-74.050, 40.710]] } },
          { geometry: { coordinates: [[-74.050, 40.710], [-73.919, 40.729]] } },
        ],
      },
    ],
  }

  const legs = roadPlanLegs(route, waypoints)

  assert.equal(legs.length, 2)
  assert.equal(legs[0].source, 'road')
  assert.equal(legs[1].source, 'road')
  assert.deepEqual(legs[0].routeShape[0], waypoints[0])
  assert.deepEqual(legs[0].routeShape.at(-1), waypoints[1])
  assert.deepEqual(legs[1].routeShape[0], waypoints[1])
  assert.deepEqual(legs[1].routeShape.at(-1), waypoints[2])
  assert.equal(legs[0].durationMinutes, 10)
  assert.equal(legs[1].durationMinutes, 20)
})

test('continuous road plan rejects incomplete leg counts', () => {
  const legs = roadPlanLegs(
    { legs: [{ steps: [] }] },
    [[-74.1, 40.7], [-74.0, 40.75], [-73.9, 40.8]],
  )

  assert.deepEqual(legs, [])
})


test('road route result uses OSRM snapped access points instead of forcing road geometry to facility centroids', () => {
  const requestedOrigin = [-74.0732, 40.7901]
  const requestedDestination = [-74.0107, 40.6562]
  const originAccess = [-74.0728, 40.7897]
  const destinationAccess = [-74.0089, 40.6604]

  const result = buildRoadRouteResult({
    waypoints: [
      { location: originAccess },
      { location: destinationAccess },
    ],
    routes: [{
      distance: 16093.44,
      duration: 1800,
      geometry: {
        coordinates: [
          [-74.0726, 40.7896],
          [-74.0400, 40.7200],
          [-74.0092, 40.6607],
        ],
      },
    }],
  }, requestedOrigin, requestedDestination)

  assert.deepEqual(result.originAccessCoordinates, originAccess)
  assert.deepEqual(result.destinationAccessCoordinates, destinationAccess)
  assert.deepEqual(result.routeShape[0], originAccess)
  assert.deepEqual(result.routeShape.at(-1), destinationAccess)
  assert.deepEqual(result.requestedOriginCoordinates, requestedOrigin)
  assert.deepEqual(result.requestedDestinationCoordinates, requestedDestination)
  assert.notDeepEqual(result.routeShape.at(-1), requestedDestination)
})
