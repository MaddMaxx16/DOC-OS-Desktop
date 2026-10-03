import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { getDriverIdentity } from '../src/domain/drivers/driverIdentity.js'
import {
  createSelection,
  getSelectionKey,
  isSelection,
  SELECTION_TYPES,
  SELECTION_TYPE_VALUES,
} from '../src/domain/selection/selectionModel.js'

test('V2.2 selection contract supports every architecture subject type', () => {
  assert.deepEqual(
    [...SELECTION_TYPE_VALUES].sort(),
    ['driver', 'facility', 'load', 'route-leg', 'stop'].sort(),
  )
})

test('selection is represented by one stable type/id subject', () => {
  const selection = createSelection(SELECTION_TYPES.DRIVER, 'marcus-reed')
  assert.deepEqual(selection, { type: 'driver', id: 'marcus-reed' })
  assert.equal(getSelectionKey(selection), 'driver:marcus-reed')
  assert.equal(isSelection(selection, SELECTION_TYPES.DRIVER), true)
  assert.equal(isSelection(selection, SELECTION_TYPES.DRIVER, 'marcus-reed'), true)
  assert.equal(isSelection(selection, SELECTION_TYPES.LOAD), false)
})

test('invalid selection subjects are rejected early', () => {
  assert.throws(() => createSelection('phone-screen', 'legacy'), /Unsupported selection type/)
  assert.throws(() => createSelection(SELECTION_TYPES.DRIVER, ''), /non-empty string/)
})

test('known drivers have persistent distinct identities', () => {
  const marcus = getDriverIdentity('marcus-reed')
  const taylor = getDriverIdentity('taylor-brooks')
  const derrick = getDriverIdentity('derrick-cole')

  assert.equal(marcus.colorName, 'blue')
  assert.equal(taylor.colorName, 'amber')
  assert.equal(derrick.colorName, 'teal')
  assert.equal(new Set([marcus.color, taylor.color, derrick.color]).size, 3)
})

test('unknown driver identity is deterministic by id', () => {
  assert.deepEqual(getDriverIdentity('future-driver-17'), getDriverIdentity('future-driver-17'))
})

test('App owns generic selection rather than a driver-only selected id', async () => {
  const source = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8')
  assert.match(source, /const \[selection, setSelection\]/)
  assert.doesNotMatch(source, /selectedDriverId/)
  assert.match(source, /createSelection\(type, id\)/)
})
