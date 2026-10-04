import test from 'node:test'
import assert from 'node:assert/strict'
import { hydrateCommittedRouteSegments } from '../src/domain/routing/committedRouteHydration.js'

test('committed route hydration requests one segment at a time in Driver Day order', async () => {
  const calls = []
  const segmentSpecs = [
    { id: 'a', fromCoordinates: [0, 0], toCoordinates: [1, 1] },
    { id: 'b', fromCoordinates: [1, 1], toCoordinates: [2, 2] },
    { id: 'c', fromCoordinates: [2, 2], toCoordinates: [3, 3] },
  ]

  const result = await hydrateCommittedRouteSegments(segmentSpecs, {
    routeSegment: async (from, to) => {
      calls.push([from, to])
      return { source: 'road', routeShape: [from, to] }
    },
    waitFn: async () => {},
  })

  assert.deepEqual(calls, [
    [[0, 0], [1, 1]],
    [[1, 1], [2, 2]],
    [[2, 2], [3, 3]],
  ])
  assert.ok(result.every((segment) => segment.route?.source === 'road'))
})

test('unresolved estimate legs get another serialized hydration wave', async () => {
  const attempts = new Map()
  const segmentSpecs = [
    { id: 'a', fromCoordinates: [0, 0], toCoordinates: [1, 1] },
    { id: 'b', fromCoordinates: [1, 1], toCoordinates: [2, 2] },
  ]

  const result = await hydrateCommittedRouteSegments(segmentSpecs, {
    routeSegment: async (from, to) => {
      const key = `${from.join(',')}->${to.join(',')}`
      const count = (attempts.get(key) ?? 0) + 1
      attempts.set(key, count)

      if (key === '1,1->2,2' && count === 1) {
        return { source: 'estimate', routeShape: [from, to] }
      }

      return { source: 'road', routeShape: [from, to] }
    },
    waitFn: async () => {},
  })

  assert.equal(attempts.get('0,0->1,1'), 1)
  assert.equal(attempts.get('1,1->2,2'), 2)
  assert.equal(result[1].route.source, 'road')
})




test('committed route hydration returns the completed day without exposing partial publication callbacks', async () => {
  const segmentSpecs = [
    { id: 'a', fromCoordinates: [0, 0], toCoordinates: [1, 1] },
    { id: 'b', fromCoordinates: [1, 1], toCoordinates: [2, 2] },
  ]

  const result = await hydrateCommittedRouteSegments(segmentSpecs, {
    routeSegment: async (from, to) => ({
      source: 'road',
      routeShape: [from, to],
    }),
    waitFn: async () => {},
  })

  assert.equal(result.length, 2)
  assert.ok(result.every((segment) => segment.route?.source === 'road'))
})
