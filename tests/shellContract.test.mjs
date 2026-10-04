import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SHELL_CONFIG, WORKSTATION_SECTIONS } from '../src/config/shellConfig.js'

test('desktop reference remains 1920x1080', () => {
  assert.equal(SHELL_CONFIG.referenceWidth, 1920)
  assert.equal(SHELL_CONFIG.referenceHeight, 1080)
})

test('V2.5.1 workstation uses rail, browser, and inspector widths', () => {
  assert.equal(SHELL_CONFIG.commandRailWidth, 76)
  assert.equal(SHELL_CONFIG.browserWidth, 340)
  assert.equal(SHELL_CONFIG.inspectorWidth, 430)
  assert.equal(WORKSTATION_SECTIONS[0].id, 'drivers')
  assert.equal(WORKSTATION_SECTIONS[1].id, 'freightlink')
})

test('desktop project contains no Capacitor dependency', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const dependencyNames = Object.keys({
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  })
  assert.equal(dependencyNames.some((name) => name.startsWith('@capacitor/')), false)
})

test('desktop runtime contains no phone shell or retired bottom drawer runtime', async () => {
  const files = [
    '../src/app/App.jsx',
    '../src/shell/DesktopShell.jsx',
    '../src/shell/shell.css',
  ]
  const contents = await Promise.all(files.map((path) => readFile(new URL(path, import.meta.url), 'utf8')))
  const joined = contents.join('\n')

  assert.doesNotMatch(joined, /phone-shell/)
  assert.doesNotMatch(joined, /DesktopAppDrawer/)
  assert.doesNotMatch(joined, /AppDock/)
  assert.doesNotMatch(joined, /desktop-app-drawer/)
  assert.doesNotMatch(joined, /app-dock/)
})

test('V2.5.1 shell is rail -> browser -> map -> inspector', async () => {
  const shell = await readFile(new URL('../src/shell/DesktopShell.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/shell/shell.css', import.meta.url), 'utf8')

  assert.match(shell, /<CommandRail/)
  assert.match(shell, /<DriverBrowser/)
  assert.match(shell, /className="map-workspace"/)
  assert.match(shell, /<OperationsInspector/)
  assert.match(css, /grid-template-columns: 76px 0 minmax\(0, 1fr\) 0/)
  assert.match(css, /browser-open\.inspector-open/)
  assert.match(css, /76px minmax\(300px, 340px\) minmax\(0, 1fr\) minmax\(390px, 430px\)/)
})

test('V2.5.1 command rail exposes Drivers and FreightLink as live sections', async () => {
  const rail = await readFile(new URL('../src/shell/CommandRail.jsx', import.meta.url), 'utf8')

  assert.match(rail, /section\.id === 'drivers' \|\| section\.id === 'freightlink'/)
  assert.match(rail, /activeSection === section\.id/)
  assert.match(rail, /onToggleSection\(section\.id\)/)
})

test('FreightLink renders left marketplace browser and right selected-lane inspector', async () => {
  const freight = await readFile(new URL('../src/features/freightlink/FreightLinkWorkspace.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/features/freightlink/freightLink.css', import.meta.url), 'utf8')

  assert.match(freight, /workstation-browser freightlink-browser/)
  assert.match(freight, /workstation-inspector freightlink-inspector/)
  assert.match(freight, /selectedLane && selectedEvaluation/)
  assert.match(css, /\.freightlink-workspace \{\s*display: contents;/)
  assert.match(css, /\.freightlink-inspector \{[\s\S]*grid-template-rows: auto minmax\(0, 1fr\) auto;/)
})

test('MapLibre map class does not shadow the native Map registry', async () => {
  const source = await readFile(new URL('../src/map/OperationsMap.jsx', import.meta.url), 'utf8')
  assert.match(source, /Map as MapLibreMap/)
  assert.match(source, /new globalThis\.Map\(\)/)
  assert.match(source, /new MapLibreMap\(\{/)
})

test('local Vite setup owns the MapLibre worker explicitly', async () => {
  const vite = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8')
  const map = await readFile(new URL('../src/map/OperationsMap.jsx', import.meta.url), 'utf8')

  assert.match(vite, /exclude: \['maplibre-gl'\]/)
  assert.match(map, /maplibre-gl-worker\.mjs\?worker&url/)
  assert.match(map, /setWorkerUrl\(maplibreWorkerUrl\)/)
})

test('operations map remains dark, flat, north-up, and pan/zoom only', async () => {
  const style = await readFile(new URL('../src/data/mapStyle.js', import.meta.url), 'utf8')
  const source = await readFile(new URL('../src/map/OperationsMap.jsx', import.meta.url), 'utf8')

  assert.match(style, /tiles\.openfreemap\.org\/styles\/dark/)
  assert.match(source, /bearing:\s*0/)
  assert.match(source, /pitch:\s*0/)
  assert.match(source, /maxPitch:\s*0/)
  assert.match(source, /dragRotate:\s*false/)
  assert.match(source, /map\.touchZoomRotate\.disableRotation\(\)/)
  assert.match(source, /map\.touchPitch\.disable\(\)/)
  assert.match(source, /new NavigationControl\(\{ showCompass: false \}\)/)
})

test('map language uses trucks, typed POIs, neutral proposal routes, and committed route anchors', async () => {
  const map = await readFile(new URL('../src/map/OperationsMap.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/map/map.css', import.meta.url), 'utf8')

  assert.match(map, /function truckMarkup/)
  assert.match(map, /function poiSvg/)
  assert.match(map, /type === 'fuel'/)
  assert.match(map, /type === 'food'/)
  assert.match(map, /type === 'truck-stop'/)
  assert.match(map, /DRIVER_ROUTE_SOURCE/)
  assert.match(map, /buildDriverRouteAnchors/)
  assert.match(map, /const PREVIEW_ROUTE = '#c8d2da'/)
  assert.match(map, /const PREVIEW_DEADHEAD = '#8797a4'/)
  assert.match(css, /\.driver-route-anchor/)
  assert.match(css, /\.freight-preview-marker/)
})

test('FreightLink candidate driver and selected lane stay synchronized with the map', async () => {
  const app = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8')
  const shell = await readFile(new URL('../src/shell/DesktopShell.jsx', import.meta.url), 'utf8')
  const freight = await readFile(new URL('../src/features/freightlink/FreightLinkWorkspace.jsx', import.meta.url), 'utf8')

  assert.match(app, /freightCandidateDriverId/)
  assert.match(shell, /freightRoutePreview\?\.lane\?\.id === selection\.id/)
  assert.match(shell, /freightRoutePreview\?\.driver\?\.id === freightCandidateDriverId/)
  assert.match(freight, /candidateDriverId/)
  assert.match(freight, /onCandidateDriverChange/)
})

test('FreightLink proposal includes entry, loaded, and rejoin road legs', async () => {
  const freight = await readFile(new URL('../src/features/freightlink/FreightLinkWorkspace.jsx', import.meta.url), 'utf8')

  assert.match(freight, /calculateRoadRoute\(originCoordinates, pickup\.coordinates\)/)
  assert.match(freight, /calculateRoadRoute\(pickup\.coordinates, delivery\.coordinates\)/)
  assert.match(freight, /calculateRoadRoute\(delivery\.coordinates, nextCoordinates\)/)
  assert.match(freight, /rejoinRoute: rejoin/)
})

test('desktop type scale keeps an 11px operational readability floor', async () => {
  const globalCss = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8')
  const freightCss = await readFile(new URL('../src/features/freightlink/freightLink.css', import.meta.url), 'utf8')

  assert.match(globalCss, /--type-micro:\s*11px/)
  assert.match(globalCss, /--type-secondary:\s*12px/)
  assert.match(globalCss, /--type-body:\s*14px/)
  assert.match(globalCss, /--type-emphasis:\s*16px/)
  assert.match(freightCss, /font-size:\s*var\(--type-body\)/)
})

test('V2.5 booking lifecycle remains explicit and Rate Con request does not commit freight', async () => {
  const freight = await readFile(new URL('../src/features/freightlink/FreightLinkWorkspace.jsx', import.meta.url), 'utf8')
  const app = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8')

  assert.match(freight, /REQUEST RATE CON/)
  assert.match(freight, /WAITING FOR RATE CON/)
  assert.match(freight, /REVIEW RATE CON/)
  assert.match(freight, /WAITING FOR CORRECTION/)
  assert.match(app, /record\?\.status === BOOKING_STATUS\.CONFIRMED/)
  assert.match(app, /commitBookedFreight/)
})

test('Rate Confirmation review is player-driven and hides the document answer from the verifier', async () => {
  const review = await readFile(new URL('../src/features/rate-confirmation/RateConfirmationReview.jsx', import.meta.url), 'utf8')

  assert.match(review, /reviewChoices/)
  assert.match(review, /\bMATCH\b/)
  assert.match(review, /\bISSUE\b/)
  assert.match(review, /REVIEW ALL TERMS/)
  assert.match(review, /reviewedCount === checks\.length/)
  assert.match(review, /referenceValue\(check, locations\)/)
  assert.doesNotMatch(review, /check\.actual/)
  assert.doesNotMatch(review, />TERMS MATCH</)
  assert.doesNotMatch(review, /check\.matches \? '✓'/)
})

test('Rate Confirmation remains a focused full-workspace task', async () => {
  const shell = await readFile(new URL('../src/shell/DesktopShell.jsx', import.meta.url), 'utf8')
  const focused = await readFile(new URL('../src/shell/FocusedWorkspace.jsx', import.meta.url), 'utf8')
  const top = await readFile(new URL('../src/shell/TopBar.jsx', import.meta.url), 'utf8')

  assert.match(shell, /focusedTask\?\.type === 'rate-confirmation'/)
  assert.match(shell, /<FocusedWorkspace/)
  assert.match(focused, /focused-workspace/)
  assert.match(top, /DESKTOP V2\.5\.2 · DOCUMENT DESK/)
  assert.match(top, /RATE CON REVIEW · GAMEPLAY PAUSED/)
})

test('confirmed freight rebuilds operational load and driver-plan truth', async () => {
  const app = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8')

  assert.match(app, /operationalLoads/)
  assert.match(app, /operationalDriverPlans/)
  assert.match(app, /buildDriverDays\(drivers, operationalLoads, operationalDriverPlans, locations\)/)
  assert.match(app, /setOperationalLoads\(committed\.loads\)/)
  assert.match(app, /setOperationalDriverPlans\(committed\.driverPlans\)/)
  assert.match(app, /freightMarket\.filter\(\(lane\) => !confirmedLaneIds\.has\(lane\.id\)\)/)
})


test('V2.5.2 Rate Con uses the reusable draggable stacking Document Desk', async () => {
  const review = await readFile(new URL('../src/features/rate-confirmation/RateConfirmationReview.jsx', import.meta.url), 'utf8')
  const desk = await readFile(new URL('../src/features/documents/DocumentDesk.jsx', import.meta.url), 'utf8')
  const deskCss = await readFile(new URL('../src/features/documents/documentDesk.css', import.meta.url), 'utf8')

  assert.match(review, /<DocumentDesk/)
  assert.match(review, /<DraggableDocument/)
  assert.match(desk, /zOrder/)
  assert.match(desk, /bringToFront/)
  assert.match(desk, /onPointerDown/)
  assert.match(desk, /onPointerMove/)
  assert.match(deskCss, /\.draggable-document/)
  assert.match(deskCss, /cursor: grab/)
})

test('V2.5.2 ISSUE highlights the paper field without revealing correctness', async () => {
  const review = await readFile(new URL('../src/features/rate-confirmation/RateConfirmationReview.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/features/rate-confirmation/rateConfirmation.css', import.meta.url), 'utf8')

  assert.match(review, /pulsePaperField/)
  assert.match(review, /choice === 'issue'\) pulsePaperField\(checkId\)/)
  assert.match(review, /data-ratecon-field="rate"/)
  assert.match(review, /data-ratecon-field="equipment"/)
  assert.match(review, /data-ratecon-field="pickup"/)
  assert.match(review, /data-ratecon-field="delivery"/)
  assert.match(css, /\.ratecon-field-highlight/)
  assert.match(css, /@keyframes rateconIssueFlash/)
})

test('V2.5.2 normal Driver view renders non-freight route endpoints instead of unexplained lines', async () => {
  const map = await readFile(new URL('../src/map/OperationsMap.jsx', import.meta.url), 'utf8')

  assert.match(map, /const routeAnchors = driverIdentity && driverDay/)
  assert.match(map, /routeAnchor\.eventKinds\.includes\('freight-stop'\)/)
  assert.match(map, /if \(!isFreightLocation\) addRouteAnchorMarker\(routeAnchor, \{ interactive: true \}\)/)
  assert.match(map, /workspaceOpen && driverIdentity/)
})
