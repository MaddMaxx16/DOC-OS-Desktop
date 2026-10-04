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


test('V2.4.1 shared app drawer owns the bottom workstation region', async () => {
  assert.equal(SHELL_CONFIG.dockHeight, 64)
  assert.equal(SHELL_CONFIG.appDrawerViewportRatio, 0.40)
  assert.equal(SHELL_CONFIG.appDrawerMinHeight, 320)
  assert.equal(SHELL_CONFIG.appDrawerMaxHeight, 460)

  const shell = await readFile(new URL('../src/shell/DesktopShell.jsx', import.meta.url), 'utf8')
  const drawer = await readFile(new URL('../src/shell/DesktopAppDrawer.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/shell/shell.css', import.meta.url), 'utf8')

  assert.match(shell, /<div className="map-workspace">/)
  assert.match(shell, /<DesktopAppDrawer activeApp=\{activeApp\}>/)
  assert.match(drawer, /className="desktop-app-drawer"/)
  assert.match(css, /grid-template-rows: minmax\(0, 1fr\) clamp\(320px, 40vh, 460px\) 64px/)
  assert.match(css, /width: 100%/)
})

test('FreightLink uses the shared drawer instead of floating over the map', async () => {
  const css = await readFile(new URL('../src/features/freightlink/freightLink.css', import.meta.url), 'utf8')
  assert.match(css, /\.freightlink-workspace\{position:relative/)
  assert.doesNotMatch(css, /\.freightlink-workspace\{position:absolute/)
})

test('FreightLink marketplace mode exposes map-selectable lane markers', async () => {
  const source = await readFile(new URL('../src/map/OperationsMap.jsx', import.meta.url), 'utf8')
  assert.match(source, /market-lane-marker/)
  assert.match(source, /SELECTION_TYPES\.LOAD/)
  assert.match(source, /marketLanes = \[\]/)
  assert.match(source, /workspaceOpen \|\| freightRoutePreview/)
})


test('V2.4.2 marketplace keeps labels quiet until interaction', async () => {
  const source = await readFile(new URL('../src/map/OperationsMap.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/map/map.css', import.meta.url), 'utf8')

  assert.match(source, /market-mode/)
  assert.match(source, /anotherLaneSelected/)
  assert.match(css, /\.driver-marker\.market-mode:not\(\.selected\) > small/)
  assert.match(css, /\.market-lane-marker > small \{\s*display: none;/)
  assert.match(css, /\.market-lane-marker\.muted/)
})

test('V2.4.2 FreightLink inspector uses two desktop columns', async () => {
  const source = await readFile(new URL('../src/features/freightlink/FreightLinkWorkspace.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/features/freightlink/freightLink.css', import.meta.url), 'utf8')

  assert.match(source, /className="lane-detail-columns"/)
  assert.match(source, /className="lane-detail-column"/)
  assert.match(css, /\.lane-detail-columns \{[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/)
  assert.match(css, /\.lane-route-copy strong \{\s*font-size: 11px;/)
})
