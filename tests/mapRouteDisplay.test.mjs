import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildRouteAnchorDisplayPlan,
  distanceMilesBetween,
  nextOperationalEventId,
} from '../src/domain/routing/mapRouteDisplay.js'

test('next operational event ignores shift start', () => {
  const day = {
    timeline: [
      { id: 'driver:shift-start', kind: 'shift-start' },
      { id: 'load-1:pickup', kind: 'freight-stop' },
      { id: 'driver:lunch', kind: 'lunch' },
    ],
  }

  assert.equal(nextOperationalEventId(day), 'load-1:pickup')
})

test('selected stop label outranks the next-stop label', () => {
  const anchors = [
    {
      id: 'a',
      eventIds: ['load-1:pickup'],
      coordinates: [-73.90, 40.80],
    },
    {
      id: 'b',
      eventIds: ['load-2:pickup'],
      coordinates: [-73.95, 40.75],
    },
  ]

  const display = buildRouteAnchorDisplayPlan(anchors, {
    selectedEventId: 'load-2:pickup',
    nextEventId: 'load-1:pickup',
  })

  assert.equal(display.find((anchor) => anchor.id === 'a').labelPriority, 'next')
  assert.equal(display.find((anchor) => anchor.id === 'b').labelPriority, 'selected')
})

test('close route anchors get different label placements without moving the physical coordinates', () => {
  const anchors = [
    {
      id: 'a',
      eventIds: ['a:pickup'],
      coordinates: [-73.9000, 40.8000],
    },
    {
      id: 'b',
      eventIds: ['b:delivery'],
      coordinates: [-73.9010, 40.8010],
    },
  ]

  assert.ok(distanceMilesBetween(anchors[0].coordinates, anchors[1].coordinates) < 1.35)

  const display = buildRouteAnchorDisplayPlan(anchors, {
    nextEventId: 'a:pickup',
  })

  assert.equal(display[0].crowded, true)
  assert.equal(display[1].crowded, true)
  assert.notEqual(display[0].labelPlacement, display[1].labelPlacement)
  assert.deepEqual(display[0].coordinates, anchors[0].coordinates)
  assert.deepEqual(display[1].coordinates, anchors[1].coordinates)
})

test('far route anchors keep centered label placement', () => {
  const display = buildRouteAnchorDisplayPlan([
    {
      id: 'a',
      eventIds: ['a:pickup'],
      coordinates: [-74.15, 40.70],
    },
    {
      id: 'b',
      eventIds: ['b:delivery'],
      coordinates: [-73.80, 40.85],
    },
  ])

  assert.equal(display[0].crowded, false)
  assert.equal(display[1].crowded, false)
  assert.equal(display[0].labelPlacement, 'label-center')
  assert.equal(display[1].labelPlacement, 'label-center')
})
