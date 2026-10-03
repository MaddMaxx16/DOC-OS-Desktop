import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SHELL_CONFIG } from '../src/config/shellConfig.js'

test('V2.1 drawers start closed', () => {
  assert.equal(SHELL_CONFIG.leftDrawerDefaultOpen, false)
  assert.equal(SHELL_CONFIG.rightDrawerDefaultOpen, false)
})

test('V2.1 desktop reference remains 1920x1080', () => {
  assert.equal(SHELL_CONFIG.referenceWidth, 1920)
  assert.equal(SHELL_CONFIG.referenceHeight, 1080)
})

test('desktop project contains no Capacitor dependency', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const dependencyNames = Object.keys({ ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) })
  assert.equal(dependencyNames.some((name) => name.startsWith('@capacitor/')), false)
})

test('desktop runtime contains no phone-shell class', async () => {
  const files = [
    '../src/app/App.jsx',
    '../src/shell/DesktopShell.jsx',
    '../src/shell/shell.css',
  ]
  const contents = await Promise.all(files.map((path) => readFile(new URL(path, import.meta.url), 'utf8')))
  assert.equal(contents.some((content) => content.includes('phone-shell')), false)
})

test('MapLibre map class does not shadow the native Map registry', async () => {
  const source = await readFile(new URL('../src/map/OperationsMap.jsx', import.meta.url), 'utf8')
  assert.match(source, /Map as MapLibreMap/)
  assert.match(source, /new globalThis\.Map\(\)/)
  assert.match(source, /new MapLibreMap\(\{/)
})
