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
  assert.equal(SHELL_CONFIG.appDrawerViewportRatio, 0.46)
  assert.equal(SHELL_CONFIG.appDrawerMinHeight, 360)
  assert.equal(SHELL_CONFIG.appDrawerMaxHeight, 540)

  const shell = await readFile(new URL('../src/shell/DesktopShell.jsx', import.meta.url), 'utf8')
  const drawer = await readFile(new URL('../src/shell/DesktopAppDrawer.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/shell/shell.css', import.meta.url), 'utf8')

  assert.match(shell, /<div className="map-workspace">/)
  assert.match(shell, /<DesktopAppDrawer activeApp=\{activeApp\}>/)
  assert.match(drawer, /className="desktop-app-drawer"/)
  assert.match(css, /grid-template-rows: minmax\(0, 1fr\) clamp\(360px, 46vh, 540px\) 64px/)
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


test('V2.4.3 marketplace keeps labels quiet until interaction', async () => {
  const source = await readFile(new URL('../src/map/OperationsMap.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/map/map.css', import.meta.url), 'utf8')

  assert.match(source, /anotherLaneSelected/)
  assert.match(css, /\.driver-marker > small \{[\s\S]*display: none;/)
  assert.match(css, /\.driver-marker:hover > small,[\s\S]*\.driver-marker\.selected > small/)
  assert.match(css, /\.market-lane-marker > small \{[\s\S]*display: none;/)
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


test('V2.4.3 local Vite setup owns the MapLibre worker explicitly', async () => {
  const vite = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8')
  const map = await readFile(new URL('../src/map/OperationsMap.jsx', import.meta.url), 'utf8')

  assert.match(vite, /exclude: \['maplibre-gl'\]/)
  assert.match(map, /maplibre-gl-worker\.mjs\?worker&url/)
  assert.match(map, /setWorkerUrl\(maplibreWorkerUrl\)/)
})

test('V2.4.3 uses a dark vector basemap instead of filtered raster OSM', async () => {
  const style = await readFile(new URL('../src/data/mapStyle.js', import.meta.url), 'utf8')

  assert.match(style, /tiles\.openfreemap\.org\/styles\/dark/)
  assert.doesNotMatch(style, /tile\.openstreetmap\.org/)
  assert.doesNotMatch(style, /type:\s*['"]raster['"]/)
})

test('V2.4.3 map language uses trucks, typed POIs, and neutral preview routes', async () => {
  const map = await readFile(new URL('../src/map/OperationsMap.jsx', import.meta.url), 'utf8')

  assert.match(map, /function truckMarkup/)
  assert.match(map, /driver-truck-icon/)
  assert.match(map, /function poiSvg/)
  assert.match(map, /type === 'fuel'/)
  assert.match(map, /type === 'food'/)
  assert.match(map, /type === 'truck-stop'/)
  assert.match(map, /type === 'service'/)
  assert.match(map, /const PREVIEW_ROUTE = '#c8d2da'/)
  assert.match(map, /const PREVIEW_DEADHEAD = '#8797a4'/)
  assert.doesNotMatch(map, /addLine\(DEADHEAD_SOURCE[\s\S]*identity\.color/)
})

test('V2.4.3 operational seed classifies facility POIs', async () => {
  const { locations } = await import('../src/data/operationsSeed.js')

  assert.equal(locations['metroline-yard'].poiType, 'yard')
  assert.equal(locations['meadowlands-staging'].poiType, 'staging')
  assert.equal(locations['queens-freight-center'].poiType, 'warehouse')
})

test('V2.4.3 desktop type scale has an 11px readability floor', async () => {
  const globalCss = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8')
  const freightCss = await readFile(new URL('../src/features/freightlink/freightLink.css', import.meta.url), 'utf8')

  assert.match(globalCss, /--type-micro:\s*11px/)
  assert.match(globalCss, /--type-secondary:\s*12px/)
  assert.match(globalCss, /--type-body:\s*14px/)
  assert.match(globalCss, /--type-emphasis:\s*16px/)
  assert.match(globalCss, /--type-heading:\s*22px/)
  assert.match(freightCss, /font-size:\s*var\(--type-micro\)/)
  assert.match(freightCss, /font-size:\s*var\(--type-body\)/)
})


test('V2.4.4 operations map is locked flat, north-up, and pan-and-zoom only', async () => {
  const source = await readFile(new URL('../src/map/OperationsMap.jsx', import.meta.url), 'utf8')

  assert.match(source, /bearing:\s*0/)
  assert.match(source, /pitch:\s*0/)
  assert.match(source, /maxPitch:\s*0/)
  assert.match(source, /dragRotate:\s*false/)
  assert.match(source, /pitchWithRotate:\s*false/)
  assert.match(source, /touchPitch:\s*false/)
  assert.match(source, /keyboard:\s*false/)
  assert.match(source, /map\.dragRotate\.disable\(\)/)
  assert.match(source, /map\.touchZoomRotate\.disableRotation\(\)/)
  assert.match(source, /map\.touchPitch\.disable\(\)/)
  assert.match(source, /new NavigationControl\(\{ showCompass: false \}\)/)
})

test('V2.4.4 shared app drawer uses the taller desktop target without shrinking type', async () => {
  const globalCss = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8')
  const freightCss = await readFile(new URL('../src/features/freightlink/freightLink.css', import.meta.url), 'utf8')
  const shellCss = await readFile(new URL('../src/shell/shell.css', import.meta.url), 'utf8')

  assert.equal(SHELL_CONFIG.appDrawerViewportRatio, 0.46)
  assert.equal(SHELL_CONFIG.appDrawerMinHeight, 360)
  assert.equal(SHELL_CONFIG.appDrawerMaxHeight, 540)
  assert.match(shellCss, /clamp\(360px, 46vh, 540px\)/)
  assert.match(globalCss, /--type-micro:\s*11px/)
  assert.match(freightCss, /font-size:\s*var\(--type-body\)/)
})
