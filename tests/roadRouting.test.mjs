import test from 'node:test'
import assert from 'node:assert/strict'
import { ensureRouteTouchesEndpoints } from '../src/services/roadRouting.js'

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
