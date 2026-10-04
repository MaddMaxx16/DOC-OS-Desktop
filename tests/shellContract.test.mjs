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

test('V2.5.4 committed route language dashes pickup-bound legs and keeps other legs solid', async () => {
  const map = await readFile(new URL('../src/map/OperationsMap.jsx', import.meta.url), 'utf8')
  const route = await readFile(new URL('../src/domain/routing/driverRoutePlan.js', import.meta.url), 'utf8')

  assert.match(route, /toRole: to\.role \?\? null/)
  assert.match(map, /destinationRole: segment\.toRole \?\? ''/)
  assert.match(map, /DRIVER_ROUTE_PICKUP_LAYER/)
  assert.match(map, /pickupLegFilter/)
  assert.match(map, /'line-dasharray': PICKUP_ROUTE_DASH/)
  assert.match(map, /filter: solidLegFilter/)
})

test('V2.5.4 pause status lives beside the clock instead of at the bottom of the command rail', async () => {
  const top = await readFile(new URL('../src/shell/TopBar.jsx', import.meta.url), 'utf8')
  const rail = await readFile(new URL('../src/shell/CommandRail.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/shell/shell.css', import.meta.url), 'utf8')

  assert.match(top, /clock-time-row/)
  assert.match(top, />PAUSED</)
  assert.match(css, /\.clock-time-row/)
  assert.doesNotMatch(rail, /command-rail-status/)
  assert.doesNotMatch(css, /\.command-rail-status/)
})

test('V2.5.5 top bar reserves a compact disabled time-control strip beside the smaller clock', async () => {
  const top = await readFile(new URL('../src/shell/TopBar.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/shell/shell.css', import.meta.url), 'utf8')

  assert.match(top, /className="time-controls"/)
  assert.match(top, /aria-label="Pause"/)
  assert.match(top, /aria-label="Play"/)
  assert.match(top, /aria-label="Fast forward"/)
  assert.match(css, /grid-template-columns: 270px minmax\(320px, 1fr\) 300px/)
  assert.match(css, /\.clock-block strong \{[\s\S]*font-size: 18px/)
  assert.match(css, /\.time-controls button/)
})

test('V2.5.6 FreightLink rows keep a right gutter and collapse the empty booking row', async () => {
  const freight = await readFile(new URL('../src/features/freightlink/FreightLinkWorkspace.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/features/freightlink/freightLink.css', import.meta.url), 'utf8')

  assert.match(freight, /has-booking-state/)
  assert.match(css, /V2\.5\.6: give fit cards breathing room/)
  assert.match(css, /grid-template-areas:\s*"route fit"\s*"meta fit";/)
  assert.match(css, /\.lane-row\.has-booking-state/)
  assert.match(css, /padding: 10px 18px 10px 13px/)
  assert.match(css, /margin-right: 2px/)
})

test('V2.5.7 FreightLink fit treatment is a compact inset badge', async () => {
  const css = await readFile(new URL('../src/features/freightlink/freightLink.css', import.meta.url), 'utf8')

  assert.match(css, /V2\.5\.7: the fit treatment is a compact badge/)
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) 76px/)
  assert.match(css, /padding: 10px 28px 10px 13px/)
  assert.match(css, /width: 76px/)
  assert.match(css, /align-self: center/)
  assert.match(css, /gap: 2px/)
})

test('V2.6.1 Driver Day exposes draft planning mode without replacing the map-first shell', async () => {
  const app = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8')
  const shell = await readFile(new URL('../src/shell/DesktopShell.jsx', import.meta.url), 'utf8')
  const inspector = await readFile(new URL('../src/shell/OperationsInspector.jsx', import.meta.url), 'utf8')
  const panel = await readFile(new URL('../src/features/driver-day/DriverDayPanel.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/features/driver-day/driverDay.css', import.meta.url), 'utf8')

  assert.match(app, /planningDriverId/)
  assert.match(app, /startDriverPlanning/)
  assert.match(shell, /const planningActive = planningDriverId === selectedDriver\?\.id/)
  assert.match(inspector, /planning-context/)
  assert.match(panel, /dispatchPlanStatusLabel/)
  assert.match(panel, /EDIT PLAN/)
  assert.match(panel, /PLANNING MODE/)
  assert.match(panel, /DONE/)
  assert.match(css, /grid-template-columns: 1\.25fr \.9fr 1fr/)
  assert.match(css, /\.driver-day-panel\.planning/)
})

test('V2.6.2 Planning Mode drags freight stops through the authoritative reorder callback', async () => {
  const app = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8')
  const shell = await readFile(new URL('../src/shell/DesktopShell.jsx', import.meta.url), 'utf8')
  const panel = await readFile(new URL('../src/features/driver-day/DriverDayPanel.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/features/driver-day/driverDay.css', import.meta.url), 'utf8')

  assert.match(app, /moveDriverPlanEventToGap/)
  assert.match(app, /moveDriverPlanEvent/)
  assert.match(shell, /onMovePlanEvent=\{onMoveDriverPlanEvent\}/)
  assert.match(panel, /draggable=\{draggableEvent\}/)
  assert.match(panel, /onDragStart/)
  assert.match(panel, /timeline-insert-gap/)
  assert.match(panel, /DROP HERE/)
  assert.match(panel, /health=\{day\.planHealth\}/)
  assert.match(css, /\.timeline-insert-gap/)
  assert.match(css, /\.planning-feedback\.blocked/)
})

test('V2.6.3 Planning Mode moves Lunch through insertion lanes and uses physical POIs', async () => {
  const shell = await readFile(new URL('../src/shell/DesktopShell.jsx', import.meta.url), 'utf8')
  const panel = await readFile(new URL('../src/features/driver-day/DriverDayPanel.jsx', import.meta.url), 'utf8')
  const map = await readFile(new URL('../src/map/OperationsMap.jsx', import.meta.url), 'utf8')

  assert.match(shell, /buildPlanningPlaceOptions/)
  assert.match(panel, /timeline-insert-gap/)
  assert.match(panel, /click to open lunch planner/)
  assert.match(map, /planning-place-option/)
  assert.match(map, /event\.locationId \?\? 'truck'/)
})

test('V2.6.3.1 place choices use a side flyout with preview and explicit confirmation', async () => {
  const app = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8')
  const shell = await readFile(new URL('../src/shell/DesktopShell.jsx', import.meta.url), 'utf8')
  const panel = await readFile(new URL('../src/features/driver-day/DriverDayPanel.jsx', import.meta.url), 'utf8')
  const flyout = await readFile(new URL('../src/features/driver-day/PlanningPlaceFlyout.jsx', import.meta.url), 'utf8')
  const flyoutCss = await readFile(new URL('../src/features/driver-day/planningPlaceFlyout.css', import.meta.url), 'utf8')
  const map = await readFile(new URL('../src/map/OperationsMap.jsx', import.meta.url), 'utf8')

  assert.match(app, /pendingPlanningPlace/)
  assert.match(app, /planningPlacePreviewDay/)
  assert.match(app, /previewDriverPlanningPlace/)
  assert.match(app, /confirmDriverPlanningPlace/)
  assert.match(shell, /<PlanningPlaceFlyout/)
  assert.match(shell, /planningPlacePreviewDay/)
  assert.match(flyout, /CONFIRM LUNCH/)
  assert.match(flyout, /CONFIRM STAGING/)
  assert.match(flyout, /PREVIEWING/)
  assert.match(flyoutCss, /right: 430px/)
  assert.match(flyoutCss, /width: 390px/)
  assert.match(map, /onPreviewPlanningPlaceRef/)
  assert.doesNotMatch(panel, /PlanningPlacePicker/)
})

test('V2.6.3.2 staging flyout exposes context labels for nearby end-of-day choices', async () => {
  const flyout = await readFile(new URL('../src/features/driver-day/PlanningPlaceFlyout.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/features/driver-day/planningPlaceFlyout.css', import.meta.url), 'utf8')
  const planning = await readFile(new URL('../src/domain/planning/planningPlaces.js', import.meta.url), 'utf8')

  assert.match(flyout, /proximityLabel/)
  assert.match(flyout, /OVERNIGHT/)
  assert.match(planning, /NEAR FINAL STOP/)
  assert.match(planning, /LOCAL REPOSITION/)
  assert.match(planning, /LONG REPOSITION/)
  assert.match(css, /\.planning-place-flyout-list i/)
})

test('V2.6.4 Driver Day exposes actionable readiness and deliberate schedule dispatch', async () => {
  const app = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8')
  const shell = await readFile(new URL('../src/shell/DesktopShell.jsx', import.meta.url), 'utf8')
  const inspector = await readFile(new URL('../src/shell/OperationsInspector.jsx', import.meta.url), 'utf8')
  const panel = await readFile(new URL('../src/features/driver-day/DriverDayPanel.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/features/driver-day/driverDay.css', import.meta.url), 'utf8')

  assert.match(app, /sendDispatchPlan/)
  assert.match(app, /sendDriverSchedule/)
  assert.match(shell, /onSendSchedule=\{onSendDriverSchedule\}/)
  assert.match(inspector, /onSendSchedule/)
  assert.match(panel, /SCHEDULE READINESS/)
  assert.match(panel, /SEND SCHEDULE/)
  assert.match(panel, /SEND ANYWAY/)
  assert.match(panel, /SEND TO/)
  assert.match(panel, /BACK TO PLAN/)
  assert.match(panel, /SHOW STOP/)
  assert.match(panel, /SCHEDULE SENT/)
  assert.match(css, /\.driver-day-send-bar/)
  assert.match(css, /\.schedule-send-review/)
  assert.match(css, /\.plan-issue-list/)
  assert.match(css, /\.sent-plan-note/)
})

test('V2.6.4.1 Operations Inspector can close without clearing operational selection', async () => {
  const app = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8')
  const shell = await readFile(new URL('../src/shell/DesktopShell.jsx', import.meta.url), 'utf8')
  const inspector = await readFile(new URL('../src/shell/OperationsInspector.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/shell/shell.css', import.meta.url), 'utf8')

  assert.match(app, /operationsInspectorHidden/)
  assert.match(app, /closeOperationsInspector/)
  assert.match(app, /setOperationsInspectorHidden\(true\)/)
  assert.match(app, /setOperationsInspectorHidden\(false\)/)
  assert.doesNotMatch(app, /closeOperationsInspector[\s\S]{0,220}setSelection\(null\)/)
  assert.match(shell, /!operationsInspectorHidden/)
  assert.match(shell, /onClose=\{onCloseOperationsInspector\}/)
  assert.match(inspector, /aria-label="Close inspector"/)
  assert.match(inspector, /onClick=\{onClose\}/)
  assert.match(css, /\.workstation-panel-header > button:hover/)
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

test('V2.5.4 FreightLink cleanup allows operational copy to wrap instead of clipping', async () => {
  const css = await readFile(new URL('../src/features/freightlink/freightLink.css', import.meta.url), 'utf8')

  assert.match(css, /V2\.5\.4 visual cleanup/)
  assert.match(css, /\.lane-route-copy strong,[\s\S]*white-space: normal/)
  assert.match(css, /\.lane-fit-pill small \{[\s\S]*white-space: normal/)
  assert.match(css, /\.manifest-insertion-card strong,[\s\S]*overflow-wrap: anywhere/)
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
  assert.match(top, /DESKTOP V2\.6\.4\.1 · CLOSABLE INSPECTOR/)
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


test('V2.5.3 Rate Con keeps ISSUE markup on paper until the player changes the judgment', async () => {
  const review = await readFile(new URL('../src/features/rate-confirmation/RateConfirmationReview.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/features/rate-confirmation/rateConfirmation.css', import.meta.url), 'utf8')

  assert.match(review, /reviewChoices\[fieldId\] === 'issue' \? 'ratecon-field-issue'/)
  assert.match(review, /highlightField === fieldId \? 'ratecon-field-highlight'/)
  assert.match(css, /\.ratecon-field-issue/)
  assert.match(css, /rgba\(224, 177, 71, \.16\)/)
})

test('V2.5.3 Driver Day default shift origin is the current truck asset, not automatic home base', async () => {
  const day = await readFile(new URL('../src/domain/manifest/driverDayModel.js', import.meta.url), 'utf8')
  const route = await readFile(new URL('../src/domain/routing/driverRoutePlan.js', import.meta.url), 'utf8')

  assert.match(day, /plan\.startLocationId/)
  assert.match(day, /locationLabel: driver\.locationLabel/)
  assert.match(day, /coordinates: Array\.isArray\(driver\.coordinates\) \? driver\.coordinates : null/)
  assert.match(day, /anchorMode: 'driver'/)
  assert.match(route, /if \(event\?\.anchorMode === 'driver'\) continue/)
})
