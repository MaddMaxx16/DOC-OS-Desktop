import test from 'node:test'
import assert from 'node:assert/strict'
import { exactSegmentRouteShape } from '../src/domain/routing/routeRenderGeometry.js'

test('exactSegmentRouteShape prepends and appends exact gameplay endpoints around snapped road geometry', () => {
  const segment = {
    fromCoordinates: [-74.0107, 40.6562],
    toCoordinates: [-74.0170, 40.6470],
    route: {
      source: 'road',
      routeShape: [
        [-74.0090, 40.6580],
        [-74.0150, 40.6490],
      ],
    },
  }

  const shape = exactSegmentRouteShape(segment)

  assert.deepEqual(shape[0], segment.fromCoordinates)
  assert.deepEqual(shape.at(-1), segment.toCoordinates)
  assert.equal(shape.length, 4)
})

test('exactSegmentRouteShape does not paint estimate fallback as a committed road', () => {
  const segment = {
    fromCoordinates: [-73.9171, 40.7282],
    toCoordinates: [-74.0107, 40.6562],
    route: {
      source: 'estimate',
      routeShape: [
        [-73.9171, 40.7282],
        [-74.0107, 40.6562],
      ],
    },
  }

  assert.deepEqual(exactSegmentRouteShape(segment), [])
})

test('exactSegmentRouteShape preserves valid road geometry that already touches exact endpoints', () => {
  const segment = {
    fromCoordinates: [-74.0732, 40.7901],
    toCoordinates: [-74.0107, 40.6562],
    route: {
      routeShape: [
        [-74.0732, 40.7901],
        [-74.0500, 40.7300],
        [-74.0107, 40.6562],
      ],
    },
  }

  const shape = exactSegmentRouteShape(segment)

  assert.deepEqual(shape, segment.route.routeShape)
})
