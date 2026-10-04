import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildRouteAccessByEventId,
  routeAccessCoordinate,
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
