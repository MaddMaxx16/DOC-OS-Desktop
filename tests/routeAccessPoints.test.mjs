import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildRouteAccessByEventId,
  routeAccessCoordinate,
  stitchCommittedRouteSegments,
  stitchFreightPreviewRoutes,
} from '../src/domain/routing/routeAccessPoints.js'

test('route access map uses incoming road access coordinate for an operational stop', () => {
  const segments = [
    {
      fromId: 'driver:start',
      toId: 'M-101:pickup',
      route: {
        source: 'road',
        originAccessCoordinates: [-74.17, 40.73],
        destinationAccessCoordinates: [-74.188, 40.676],
      },
    },
    {
      fromId: 'M-101:pickup',
      toId: 'M-202:pickup',
      route: {
        source: 'road',
        originAccessCoordinates: [-74.1879, 40.6761],
        destinationAccessCoordinates: [-73.916, 40.728],
      },
    },
  ]

  const access = buildRouteAccessByEventId(segments)

  assert.deepEqual(access.get('M-101:pickup'), [-74.188, 40.676])
  assert.deepEqual(access.get('M-202:pickup'), [-73.916, 40.728])
})

test('route access coordinate falls back to facility coordinate until road geometry is available', () => {
  const fallback = [-74.0107, 40.6562]

  assert.deepEqual(
    routeAccessCoordinate(new Map(), 'M-101:delivery', fallback),
    fallback,
  )
})


test('committed route rendering stitches adjacent legs through one canonical stop access point', () => {
  const segments = [
    {
      id: 'start->p1',
      fromId: 'driver:start',
      toId: 'M-101:pickup',
      route: {
        source: 'road',
        distanceMiles: 4.2,
        durationMinutes: 9,
        originAccessCoordinates: [-74.17, 40.73],
        destinationAccessCoordinates: [-74.188, 40.676],
        routeShape: [
          [-74.17, 40.73],
          [-74.18, 40.70],
          [-74.188, 40.676],
        ],
      },
    },
    {
      id: 'p1->p2',
      fromId: 'M-101:pickup',
      toId: 'M-202:pickup',
      route: {
        source: 'road',
        distanceMiles: 12.4,
        durationMinutes: 22,
        originAccessCoordinates: [-74.1877, 40.6763],
        destinationAccessCoordinates: [-73.916, 40.728],
        routeShape: [
          [-74.1877, 40.6763],
          [-74.05, 40.70],
          [-73.916, 40.728],
        ],
      },
    },
  ]

  const stitched = stitchCommittedRouteSegments(segments)

  assert.deepEqual(stitched[0].route.routeShape.at(-1), [-74.188, 40.676])
  assert.deepEqual(stitched[1].route.routeShape[0], [-74.188, 40.676])
  assert.equal(stitched[1].route.distanceMiles, 12.4)
  assert.equal(stitched[1].route.durationMinutes, 22)
  assert.deepEqual(
    stitched[1].route.renderOriginAccessCoordinates,
    [-74.188, 40.676],
  )
})

test('FreightLink deadhead loaded and rejoin display routes share exact seam coordinates', () => {
  const preview = stitchFreightPreviewRoutes({
    deadheadRoute: {
      source: 'road',
      originAccessCoordinates: [-74.10, 40.70],
      destinationAccessCoordinates: [-74.00, 40.75],
      routeShape: [[-74.10, 40.70], [-74.00, 40.75]],
    },
    loadedRoute: {
      source: 'road',
      originAccessCoordinates: [-73.9997, 40.7502],
      destinationAccessCoordinates: [-73.90, 40.80],
      routeShape: [[-73.9997, 40.7502], [-73.90, 40.80]],
    },
    rejoinRoute: {
      source: 'road',
      originAccessCoordinates: [-73.8996, 40.8003],
      destinationAccessCoordinates: [-73.85, 40.82],
      routeShape: [[-73.8996, 40.8003], [-73.85, 40.82]],
    },
  })

  assert.deepEqual(
    preview.deadheadRoute.routeShape.at(-1),
    preview.loadedRoute.routeShape[0],
  )
  assert.deepEqual(
    preview.loadedRoute.routeShape.at(-1),
    preview.rejoinRoute.routeShape[0],
  )
})
