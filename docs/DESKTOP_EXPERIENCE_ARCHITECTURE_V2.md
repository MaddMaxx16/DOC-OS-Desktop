# DOC OS Desktop Experience Architecture v2

Status: **Active desktop source of truth**

Replaces: `docs/DESKTOP_EXPERIENCE_ARCHITECTURE.md` v1

This document defines the desktop rebuild direction after the first live Desktop Build 1 test.

Desktop Build 1 confirmed that DOC OS belongs on desktop, but it also exposed a core mistake: the existing mobile presentation had been placed inside a desktop frame instead of being re-authored as a desktop game.

v2 corrects that.

The goal is no longer:

> make the iPhone interface fit a large screen.

The goal is:

> build the actual desktop dispatch simulator around the simulation systems already proven underneath.

---

## 1. What Desktop Build 1 taught us

Desktop Build 1 was useful because it exposed the architectural problem immediately.

The first desktop shell had:

- a permanently visible driver panel on the left,
- a permanently visible operations panel on the right,
- a large app workspace occupying the bottom,
- the live map squeezed into the remaining center,
- mobile-sized layouts reused inside desktop surfaces,
- too many visible boxes competing for attention at the same time.

That created a desktop-shaped version of the phone UI.

The problem is not simply spacing or styling. The shell behavior itself is wrong.

### v2 conclusion

The map must own the workstation by default.

Panels should appear because the player asks for context, then get out of the way.

Apps should be redesigned as desktop workspaces, not framed versions of mobile screens.

---

## 2. Product direction remains desktop-first

The long-term direction is unchanged:

- DOC OS is desktop-first.
- Primary reference resolution is **1920 × 1080**.
- PC/Steam remains the long-term platform target.
- React/Vite browser checkpoints remain useful during development.
- Existing simulation systems should be preserved where their architecture is already correct.
- Mobile is no longer the primary UX constraint.

The desktop rebuild is a presentation and gameplay-organization rebuild, not a reason to throw away working simulation logic.

---

## 3. New development priority: systems first, tutorial later

The active build should stop forcing Jordan's tutorial while the gameplay structure is still being rebuilt.

### Jordan status for v2

Jordan is **removed from the active playable loop for now**.

This means:

- no forced Jordan overlays,
- no tutorial gates blocking normal actions,
- no lesson-specific screen routing,
- no tutorial-only progression requirements,
- no requirement to perform systems in a scripted instructional order.

Jordan content may remain dormant in the repository if removing it would create unnecessary risk, but it must not own the current player flow.

Do not continue building new gameplay around Jordan-specific conditions.

### Why

We need to discover and stabilize the real game loop first.

The order is now:

**build the game → prove the systems → make the systems readable → then teach the finished game.**

Jordan can return later as a trainer layered over real gameplay rather than as the structure holding the game together.

---

## 4. Core player fantasy

The player is a dispatcher managing a live operation.

The main loop should feel like:

1. understand the current operational picture,
2. inspect drivers and available capacity,
3. shop freight,
4. evaluate whether a lane/load fits a driver's existing day,
5. commit freight,
6. verify the Rate Confirmation,
7. build and adjust the driver's manifest,
8. place lunch and staging correctly,
9. dispatch the plan,
10. monitor execution,
11. react to delays and operational events,
12. handle paperwork,
13. close the day,
14. progress the career.

The UI exists to support that loop.

The loop should not exist merely to advance tutorial steps.

---

## 5. Three experience layers remain

The overall game hierarchy from v1 still holds.

### Title Screen

A dedicated game title screen.

Expected options:

- Continue
- New Career
- Load Career
- Settings
- Quit

### Career World

The physical player environment.

Early career:

- Metroline cubicle

Later progression may include:

- upgraded desk,
- better equipment,
- larger office,
- owned business workspace.

Create-A-Character remains part of New Career.

### DOC OS Workstation

The operational desktop.

This is where game time, dispatching, FreightLink, documents, messages, driver management, and operational decisions occur.

The player enters DOC OS by interacting with the physical workstation.

---

## 6. Workstation principle: the map owns the height

The live map remains the primary operational canvas.

V2.5.1 corrects the last major shell problem discovered during FreightLink and Rate Confirmation testing: ordinary apps should not consume a large horizontal drawer across the bottom of the screen.

The normal workstation is organized horizontally:

**Command Rail → Context Browser → Live Map → Context Inspector**

The map should retain essentially the full workstation height during normal dispatch work.

### Default monitoring state

At rest, the player primarily sees:

- global top bar,
- left command rail,
- live map,
- lightweight status information.

No bottom app bar is used.

No ordinary app should take 35–50% of the map's vertical space.

### Horizontal context rule

Opening a normal workstation section may claim horizontal space for:

- a left browser/list,
- a right inspector/details panel,
- or both.

This is deliberate desktop reflow, not an overlay accident.

The player should still retain a tall, geographically useful center map.

Focused work is the exception and may temporarily replace the map.

---

## 7. Left command rail and context browser

The far-left edge owns **workstation navigation**.

### Command rail

Target width:

- approximately 72–80 px.

The command rail includes:

- Drivers,
- FreightLink,
- Email,
- Documents,
- Messages,
- Banking,
- CarrierSource,
- Shop.

Only systems already built are enabled.

The active section receives a strong selected treatment.

Clicking the active section again may close its browser and return more width to the map.

### Left context browser

When a section needs discovery/list navigation, a browser opens immediately to the right of the command rail.

Target width:

- approximately 300–360 px.

Examples:

**Drivers**
- roster,
- duty status,
- next-state cue,
- warning indicator.

**FreightLink**
- candidate driver selector,
- fit filters,
- available lanes,
- booking/document state.

**Email**
- inbox/thread list.

**Documents**
- document list.

**Messages**
- conversation list.

The browser is for scanning and choosing, not deep detail.

---

## 8. Right context inspector

The right side owns **details and actions for the selected subject**.

Target width:

- approximately 390–450 px.

The inspector appears when there is something meaningful to inspect.

Examples:

### Driver
- identity,
- duty state,
- HOS,
- trailer,
- next stop,
- manifest,
- route risk.

### FreightLink lane
- rate and freight,
- insertion point,
- route impact,
- appointments,
- HOS,
- capacity,
- booking / Rate Con action.

### Facility
- facility identity,
- appointment information,
- expected arrivals,
- congestion/wait context.

### Message / email / document
- selected content and relevant actions.

### Rule

The player learns one ordinary desktop interaction grammar:

> choose a system on the left  
> choose an item in the left browser  
> inspect or act on it on the right  
> keep the map visible in the middle when geography matters

The right inspector is contextual. It is not a second permanent app and should disappear when there is no selected subject.

---

## 9. Driver color identity — corrected in v2

v1's one-color-for-all-drivers rule is removed.

### New rule

**Each driver has their own persistent color identity.**

Example concept:

- Marcus = blue,
- Taylor = amber,
- Derrick = teal,
- Alyssa = violet,
- Chris = red.

These exact colors are not locked. The system behavior is.

### A driver's color follows them through:

- map marker,
- active route,
- route-leg highlight,
- driver roster accent,
- manifest ownership cue,
- selected-driver context,
- related map/itinerary references.

### Why

Once multiple drivers operate at the same time, color becomes a fast visual language.

The player should be able to glance at the map and understand:

> that blue route belongs to Marcus.

### Accessibility rule

Color may reinforce ownership, but should not be the only signal.

Use names, initials, icons, labels, outlines, and selection treatment as backup cues.

---

## 10. Map interaction and visual-language contract

The map remains interactive, detailed, and readable without becoming cluttered.

The normal operations camera is a flat north-up planning surface:

- bearing is fixed at 0°,
- pitch is fixed at 0°,
- mouse/trackpad interaction is pan + zoom only,
- rotation and perspective gestures are disabled,
- automatic camera moves preserve bearing 0° and pitch 0°.

DOC OS does not use a cinematic 3D/perspective camera for ordinary dispatch work.

### Basemap

The default operational map should be:

- dark,
- crisp,
- vector-based,
- detailed enough to understand roads and geography,
- restrained enough that gameplay symbols remain dominant.

Consumer POI clutter should be suppressed where practical. Gameplay POIs are drawn by DOC OS, not delegated to the basemap.

### Driver marker

Drivers render as **truck assets**, not generic circles.

The marker:

- uses the driver's persistent identity color,
- includes initials as a backup identity cue,
- shows the driver's name/status on hover or selection,
- may gain heading/orientation later during live operations.

### POI taxonomy

POI icon shape communicates type before color.

The map system must support at least:

- warehouse / freight facility,
- Metroline yard,
- staging / parking,
- fuel,
- food,
- truck stop,
- repair / service.

Pickup and delivery are roles applied to the underlying facility type. They should not force every location into the same generic pin shape.

### Stable route refresh

Atomic publication prevents a route from assembling leg-by-leg, but a refresh must also avoid a blank frame between the old complete route and the new complete route.

Rules:

- the last complete route snapshot may remain visible while the same driver's replacement route hydrates,
- the replacement route swaps in only after its full hydration/retry pass finishes,
- the cached snapshot is scoped to the selected driver,
- switching drivers must never show the previous driver's route,
- this is presentation continuity only and does not make the old route current planning truth after the swap completes.

This creates the transition invariant:

> old complete route → new complete route  
> never old route → blank map → new route

### Atomic committed-route publication

Committed Driver Day routing may hydrate multiple road legs serially, but route loading is not gameplay and should not read as vehicle motion.

Rules:

- road requests remain serialized for router reliability,
- the map does not publish each successful leg as soon as it returns,
- the hydration pass completes first, including its retry wave,
- the map then receives one completed committed-route snapshot,
- partially resolved legs are internal loading state, not visible operational state,
- opening FreightLink or another map presentation must reuse the completed committed route rather than replaying route construction,
- this rule affects presentation only and does not change route distance, duration, HOS, appointments, or plan truth.

This creates the presentation invariant:

> route calculation may happen leg-by-leg  
> route presentation appears as one stable plan

### Route seam continuity

A Driver Day is calculated as ordered road legs, but separate road calls may snap the same stop to slightly different access points depending on whether that stop is an origin or destination.

DOC OS keeps one canonical operational access point per event and uses it to stitch the **rendered** route across leg boundaries.

Rules:

- the incoming leg's destination access point remains the preferred canonical stop access point,
- the next outgoing leg is visually stitched from that same canonical coordinate,
- native P/D stop badges use that same canonical coordinate,
- FreightLink preview seams use the same rule for deadhead → loaded and loaded → rejoin,
- stitching may add a short display-only connector between two near-identical road snaps,
- route distance, duration, HOS, appointment calculations, and fit evaluation remain based on the original road-route results,
- line joins remain round and styling semantics remain intact,
- DOC OS must not invent decorative splines or curves that leave road geometry merely to look smooth.

This creates the visual invariant:

> one operational stop = one map coordinate = one continuous route seam

### Serialized committed-route hydration

The public OSRM endpoint is a runtime dependency with practical throttling/availability limits. DOC OS must not burst every committed Driver Day leg simultaneously.

Rules:

- committed road legs hydrate in authoritative Driver Day order,
- only one committed road request is active at a time,
- resolved road legs may render progressively rather than waiting for the entire day,
- a timing-only estimate remains non-renderable as committed road truth,
- any unresolved estimate leg receives a delayed retry wave automatically,
- successful routes are cacheable; estimate failures are not,
- the player must not have to refresh the app or mutate the plan to retry a missing leg.

The visual contract is:

> incomplete router response = temporarily incomplete route  
> never a fake route, and never a permanently missing leg after one transient failure

### Facility coordinates vs operational truck access

Every visible route must terminate on visible operational context, but a facility's geographic identity and the truck's routable access point are not always the same coordinate.

DOC OS therefore distinguishes:

- **facility coordinate** — the canonical location of the gameplay place,
- **truck-access coordinate** — the road-network point where the routing engine can actually deliver the truck.

Routing engines such as OSRM may snap a requested facility coordinate onto the drivable road network. That snapped waypoint is operational route truth for the road-facing marker.

Therefore:

- committed road geometry begins and ends at truck-access coordinates returned by the router,
- the operational pickup/delivery/lunch/staging marker shown as a route endpoint uses that same access coordinate,
- the canonical facility record is not rewritten when routing snaps to an access point,
- do not extend a road route with an artificial straight segment into the middle of a facility property merely to touch its canonical coordinate,
- no visible route may stop short of the operational marker that represents its routed access point,
- proposal entry/rejoin legs and preview markers follow the same access-point rule,
- every event that owns an endpoint of a visible committed route segment must have a visible operational marker,
- the current truck marker remains a valid route-origin context,
- home base must not be assumed to be shift start,
- Driver Day begins at the current operational truck position unless the plan explicitly defines a start facility,
- there must be no invisible teleport between operational route state and the marker presented to the player.

This creates the invariant:

> facility identity may live inside the property  
> truck route + operational marker meet at the routable entrance/access point

### Pickup / delivery marker

Pickup and delivery facility markers surface:

- role,
- load/lane identifier where relevant,
- facility identity,
- appointment window,
- driver,
- projected arrival,
- timing state.

### Route color semantics

Color must communicate ownership.

**Assigned / committed driver plan**
- the driver's existing planned day renders continuously in the owning driver's persistent identity color,
- route order follows the authoritative Driver Day timeline,
- committed legs whose destination is a pickup render dashed,
- committed delivery-bound legs render solid,
- lunch, staging, yard, and other non-pickup operational moves remain solid,
- when evaluating a candidate insertion, the existing direct leg being replaced is subdued rather than treated as the proposal.

**Unassigned / marketplace freight**
- proposed insertion route stays neutral,
- deadhead into pickup is neutral dashed,
- loaded pickup → delivery is stronger neutral solid,
- rejoin delivery → next existing stop is neutral dashed,
- selection is communicated through weight, casing, emphasis, and POI markers.

**After assignment**
- once freight is actually booked/assigned, its route becomes part of the owning driver's colored operational plan.

This preserves the rule:

> neutral = opportunity  
> driver color = committed ownership

### Route leg

Click:

- driver,
- current leg,
- destination,
- remaining time,
- remaining miles where available,
- load/manifest relationship.

### Readability floor

DOC OS is a desktop game, not a dense admin dashboard.

Target type scale:

- micro / uppercase labels: 11 px minimum,
- supporting/secondary text: 12 px minimum,
- normal operational information: 14 px,
- emphasized information: 16 px or larger,
- major app headings: approximately 20–26 px.

If important information requires leaning toward the monitor or squinting at normal desktop distance, the presentation fails.

### Route visibility and label priority

The selected driver's committed route is part of the operational picture, not part of the inspector.

Therefore:

- a selected driver's sent route remains visible when the right inspector is dismissed,
- inspector visibility and route visibility are independent presentation concerns,
- other drivers remain visible as truck assets without painting every sent route at equal strength by default,
- selecting another driver transfers full committed-route emphasis to that driver.

Committed freight stops render as MapLibre-native operational layers:

- pickup/delivery features come directly from the authoritative Driver Day freight stops,
- each feature resolves to the route's truck-access coordinate when road truth is available,
- committed route lines and committed P/D stop badges use the same MapLibre projection,
- DOM Marker positioning must not be used for committed freight-stop badges,
- the same native committed-stop source/layers are used in Live Map and FreightLink,
- opening FreightLink never swaps committed freight stops back to a separate DOM rendering path,
- FreightLink marketplace/candidate visuals are overlays around the same committed Driver Day map truth,
- normal committed stop presentation is badge-first rather than redundant PICKUP / DELIVERY copy,
- the selected stop and next planned stop may show their full facility names,
- other freight stops reveal facility labels on hover/focus,
- native stop layers remain clickable and feed the shared STOP selection model,
- committed stop layers render above their committed route line.

V2.6.5.8 diagnostics proved the route endpoint and marker-access coordinates were identical while the HTML stop marker still appeared displaced on screen. Therefore the committed freight-stop DOM-marker path is retired. Same-facility grouping may return later only through a map-native implementation that preserves route projection truth.

This preserves the hierarchy:

> route + P/D marker = operational truth  
> badge = plan structure  
> facility label = contextual detail

### Selection synchronization

Map, manifest, load, and driver selection share one selection model.

Examples:

- select Marcus → Marcus truck and owned route become emphasized,
- select a manifest stop → that typed POI highlights on map,
- click a route leg → corresponding driver/load context becomes selected,
- click a facility → related expected arrivals can be surfaced,
- click marketplace freight → the same LOAD becomes selected in FreightLink.

---

## 11. Workstation navigation and app surfaces

The retired bottom app bar / shared bottom drawer pattern is no longer part of the active desktop shell.

Ordinary workstation systems use the shared horizontal grammar:

1. **Command Rail**
2. **Left Context Browser**
3. **Live Map**
4. **Right Context Inspector**

Not every system must use all four columns simultaneously.

### Drivers

- Drivers is a first-class rail section.
- Left browser = driver roster.
- Map = driver location / route.
- Right inspector = selected Driver Day / operational context.

### FreightLink

**Marketplace overview**

When FreightLink is active without a selected lane:

- left browser shows candidate driver + freight list,
- map shows marketplace opportunities and candidate driver's committed route,
- no large right inspector is required.

**Selected-lane focus**

When a lane is selected:

- left browser keeps the marketplace list visible,
- map hides unrelated marketplace clutter,
- candidate driver's committed route remains visible,
- committed route anchors remain visible,
- proposal geometry overlays in neutral,
- right inspector shows lane fit, insertion, route, HOS, capacity, and booking state.

The map and inspector must represent the same selected LOAD and candidate driver.

### Other apps

Future systems should prefer this same grammar:

- Email → mailbox/browser left, selected message right,
- Documents → document list left, selected document/details right,
- Messages → conversation list left, thread right,
- Banking → navigation/account list left, selected account/details right.

A system may omit the map when geography is irrelevant, but it should not invent an unrelated window-placement model.

### Focused workspace

Focused work remains a deliberate exception.

Use Focused Workspace for tasks such as:

- Rate Confirmation review,
- POD investigation,
- invoice/document work,
- paper comparison,
- other tasks requiring sustained attention.

Focused Workspace may take over most of the workstation and pauses ordinary gameplay presentation.

---

## 12. Desktop app rebuild rule

This is one of the most important v2 rules.

### Legacy mobile components are not the final desktop UI.

Existing mobile components may temporarily provide behavior while a desktop replacement is being built.

However:

- they should not define desktop layout,
- they should not remain permanently wrapped inside desktop panels,
- they should not force phone-size card structures into desktop space.

### Preferred migration pattern

For each app:

1. identify the state/actions/business logic already working,
2. keep or extract that logic,
3. create a desktop-native view,
4. connect it to the same underlying truth,
5. remove the old desktop compatibility wrapper once replaced.

This prevents a second parallel simulation from appearing.

---

## 13. Source-of-truth rules

### Simulation truth remains shared

Existing systems should remain authoritative where already correct:

- driver manifest stop order,
- trailer capacity,
- HOS,
- game time,
- load lifecycle,
- booking state,
- routing,
- driver movement,
- documents,
- messages,
- banking data,
- career/save data.

### Desktop UI owns presentation state only

Examples:

- active command-rail section,
- left browser state,
- selected subject,
- right inspector state,
- focused task,
- map selection/filter state.

### Removed assumption

The desktop UI must no longer assume:

> one mobile screen = one desktop application surface.

Desktop is a new presentation contract over shared state.

---

## 14. Driver Manifest remains the operational backbone

The P2.5 manifest architecture remains valid and should be strengthened rather than replaced.

The model remains:

**Driver → Manifest → Ordered Stops → Onboard Loads → Capacity State**

The game must support interleaved operations such as:

**P1 → P2 → Lunch → D1 → P3 → D2 → D3**

A dispatcher does not need to finish one entire load before beginning another.

### Manifest must eventually communicate:

- ordered stops,
- which load each stop belongs to,
- pickup/delivery role,
- appointment windows,
- projected arrival,
- service time,
- lunch,
- staging,
- capacity after each stop,
- HOS feasibility,
- current execution position.

---

## 15. Systems-first gameplay architecture

The rebuild should focus on these systems in order.

### System A — Operational selection model

Create one coherent selection contract for:

- selected driver,
- selected load,
- selected stop,
- selected facility,
- selected route leg.

This selection should drive:

- map emphasis,
- left browser / right inspector context,
- manifest highlight,
- active workstation section.

Avoid screen-specific copies of selection state.

### System B — Manifest / itinerary planning

The player must be able to understand the driver's full day.

This includes:

- current location,
- future pickups,
- future deliveries,
- lunch,
- staging,
- end-of-shift behavior,
- trailer contents,
- HOS.

The itinerary must expose the same truth used by the movement engine.

### System C — FreightLink lane evaluation

FreightLink should help answer:

> Is this freight a good fit for this driver's existing day?

Evaluation should use real operational inputs:

- driver location,
- current manifest,
- appointment windows,
- empty/deadhead distance,
- loaded miles,
- trailer capacity,
- existing onboard freight,
- HOS,
- lunch requirements,
- stop insertion effects,
- conflicts/risk.

The player should see why a lane fits or does not fit.

### System D — Booking and Rate Confirmation

The booking lifecycle is explicit:

candidate freight → Rate Con requested / booking pending → Rate Confirmation arrives → focused document review → correction or acceptance → confirmed operational work.

The player should never feel they committed blindly without seeing confirmation terms.

#### Booking state language

Freight may occupy these states:

- **AVAILABLE** — still only a marketplace opportunity,
- **RATE CON REQUESTED** — request sent; not committed,
- **RATE CON READY** — document arrived; still not committed,
- **CORRECTION REQUESTED** — discrepancy reported; still not committed,
- **CONFIRMED** — Rate Con accepted; freight is now operational work.

Requesting paperwork never changes the committed driver plan.

#### Rate Confirmation review

Rate Confirmation review uses Focused Workspace and the shared physical **Document Desk**.

Focused review:

- replaces the ordinary workstation navigation surfaces for the duration of the task,
- visibly pauses gameplay presentation,
- presents the Rate Confirmation as loose broker paperwork on a desk,
- allows the paper to be dragged and brought to the front,
- preserves a reusable X/Y + z-order model so future BOL/POD/invoice sheets can stack on the same desk,
- shows FreightLink's agreed reference value in the verification panel,
- does **not** repeat the Rate Confirmation answer beside that reference value,
- requires the player to visually read the paper and mark each comparison **MATCH** or **ISSUE**,
- begins with no term pre-verified,
- briefly pulses the corresponding paper field when the player first chooses ISSUE without revealing whether that judgment is correct,
- keeps that field visibly marked as an issue until the player changes the judgment back to MATCH,
- offers correction when the player flags an issue.

Verification is gameplay, not an automatic answer key.

If the player flags an issue, they may request correction or deliberately accept the document as written. If the player fails to notice a real mismatch and marks it MATCH, the game may still accept that mistake and preserve the Rate Confirmation terms exactly as written.

#### Confirmation handoff

Only Rate Con acceptance commits freight.

On confirmation:

- the marketplace lane is removed from available freight,
- the Rate Confirmation terms become authoritative booking terms,
- the freight is assigned to the requested driver,
- the evaluated insertion is materialized into the real manifest,
- existing manifest stops are renumbered to preserve actual sequence,
- lunch placement is updated when the insertion changes which freight stop directly precedes lunch,
- the driver's committed route rebuilds from the new manifest truth.

V2.5 commits the evaluated insertion as the initial operational placement. V2.6 may later let the player deliberately resequence confirmed work during Daily Planning.

### System E — Dispatch plan

Once freight is confirmed, the player builds the operational day.

This includes:

- stop order,
- lunch,
- staging,
- sendable driver schedule.

The game should distinguish:

- freight that is booked,
- freight placed into a valid plan,
- plan sent to the driver,
- freight currently executing.

#### Lunch is a place, not a generic break node

Lunch is part of both the dispatch simulation and the future RPG layer.

Therefore:

- every planned lunch must resolve to a real selectable gameplay POI,
- lunch placement determines **when** the break occurs in the Driver Day,
- lunch location determines **where** the driver leaves the committed route to take the break,
- routing to the lunch POI and back into the remaining plan must affect projected arrival times, HOS, appointment risk, and route geometry,
- lunch POIs may include restaurants, food locations, truck stops, or other valid break locations,
- the selected lunch POI must persist as part of the driver's plan rather than being reconstructed from a generic break slot,
- lunch POIs should be represented through the shared location/POI model so future RPG metadata can be layered onto the same physical places,
- future RPG metadata may include driver preference, favorite locations, cost, food quality, service speed, relationship effects, morale/fatigue effects, dialogue/events, or other character-facing consequences,
- V2.6 does **not** need to implement those RPG stats yet; it must preserve the data and interaction foundation so they can be added without replacing the lunch system.

This creates an intentional bridge:

> dispatch choice now  
> character consequence later

A lunch plan such as **P2 → lunch POI → D1** is real route truth. It must never collapse back into an abstract “break after P2” once a location has been chosen.

### System F — Live operations

Execution should include:

- driver movement,
- pickup,
- loading,
- multi-load onboard state,
- delivery,
- unloading,
- waiting,
- HOS,
- lunch,
- staging,
- overnight continuation,
- exceptions.

The map is the main monitoring surface.

### System G — Facilities and waiting

Facilities should become real operational entities.

Future architecture should support:

- expected arrival volume,
- appointments,
- dock pressure,
- estimated wait,
- own-driver congestion,
- NPC carrier traffic later.

Do not build the full simulation before the basic facility model is needed.

### System H — Documents

Documents should support the actual freight lifecycle:

- Rate Confirmation,
- POD,
- corrections,
- load packet,
- invoice support.

Desktop Focused mode is where tactile paper interaction can live.

### System I — Communications

Email and Messages should support operational decisions, not become a separate mini-game.

Examples:

- driver updates,
- appointment problems,
- corrected Rate Con,
- POD correction,
- carrier/customer messages.

### System J — Finance and progression

Employee phase:

- Banking,
- paychecks,
- career earnings.

Owner phase later:

- LedgerDesk,
- business money,
- receivables,
- expenses,
- settlements.

Shop and workspace progression come after the core dispatch game feels right.

---

## 16. Tutorial policy

Tutorial systems are deferred until the gameplay systems above are stable.

### When Jordan returns

Jordan should teach by pointing the player toward real interfaces.

Examples:

- highlight Marcus in the driver rail,
- highlight FreightLink,
- point at trailer capacity,
- call attention to an appointment conflict,
- explain why a particular lane fits,
- guide a Rate Con comparison.

Jordan should not own a separate tutorial-only version of the systems.

### Tutorial principle

**Teach the game that exists. Do not build a different game for the tutorial.**

---

## 17. Rebuild work packets

This is the intended v2 build order.

### V2.1 — Shell Reset

Goal: establish the map-first desktop direction and remove the inherited mobile-shell assumptions.

This milestone proved the map-first concept but its temporary side-drawer/bottom-dock presentation was later superseded by **V2.5.1 Workstation Navigation**.

The retained V2.1 truth is:

- desktop-first workstation,
- map as the main operational canvas,
- compact global top bar,
- no active Jordan tutorial gating,
- no permanent mobile-shell layout.

The active navigation/layout contract is defined by V2.5.1.

### V2.2 — Shared Selection + Driver Identity

Goal: establish the interaction language for the whole game.

Build:

- persistent per-driver colors,
- selected driver,
- selected load,
- selected stop,
- selected facility,
- selected route leg,
- map/browser/inspector/manifest synchronization,
- contextual right inspector content.

Acceptance:

Selecting an object anywhere produces the same selected object everywhere.

### V2.3 — Driver Day / Manifest Workspace

Goal: make the driver's day understandable before adding more app complexity.

Build:

- desktop manifest/day view,
- ordered stops,
- onboard freight,
- capacity state,
- HOS,
- lunch,
- staging,
- projected timing.

Acceptance:

The player can look at a driver's day and understand what the truck will do from start to finish.

### V2.4 — FreightLink Desktop

Goal: rebuild FreightLink natively for desktop.

Build:

- lane list/table,
- filters,
- selected lane details,
- driver selector,
- real fit evaluation,
- manifest insertion preview,
- appointment/HOS/capacity signals.

Acceptance:

The player can compare freight and understand why a lane does or does not fit a driver.

### V2.5 — Booking + Rate Con

Goal: make freight commitment understandable.

Build:

- explicit request/pending state,
- Rate Confirmation arrival,
- focused desktop Rate Con review,
- lane-vs-document verification,
- correction request and corrected revision,
- deliberate bad-document acceptance with warning,
- confirmation state,
- confirmed terms stored as written,
- handoff into the real assigned manifest,
- committed route refresh after confirmation.

Acceptance:

The player never has to wonder whether freight is merely interesting, requested, awaiting paperwork, under correction, or confirmed.

A lane does not leave FreightLink until its Rate Confirmation is accepted.

A confirmed lane becomes real manifest work and the map reflects the newly committed driver plan.

### V2.6 — Daily Planning

Goal: build a coherent dispatch plan.

Build:

- stop sequencing,
- physical lunch-place selection,
- staging,
- schedule readiness checks,
- send schedule to driver.

Acceptance:

A multi-load day such as P1 → P2 → Lunch → D1 → P3 → D2 → D3 can be built and sent, with Lunch resolving to a real selected POI that affects the route and timing.

#### V2.6.1 — Planning Foundation

Build:

- explicit DRAFT PLAN / SENT PLAN state,
- planning mode inside the existing Driver Day inspector,
- compact Driver Day operational summary,
- editable-plan state separated from sent/executing state,
- no new full-screen planner and no bottom drawer.

Acceptance:

A selected driver can enter and exit planning mode without changing committed freight ownership or duplicating simulation truth.

#### V2.6.2 — Stop Sequencing

Build:

- direct stop reordering in the Driver Day timeline,
- pickup-before-delivery hard rule,
- trailer-capacity recalculation,
- timing / appointment / HOS recalculation,
- live committed-route rebuild from the edited order,
- warnings for risky but possible plans,
- blockers for physically impossible plans.

Acceptance:

The player can deliberately build and repair an interleaved multi-load sequence while the map and Driver Day remain synchronized.

#### V2.6.3 — Breaks, Places + Staging

Build:

- lunch as a draggable Driver Day event,
- selectable physical lunch POIs near the relevant route/time position,
- lunch-route detour and rejoin calculations,
- lunch duration and downstream timing effects,
- persisted lunch POI identity in the driver plan,
- staging/end-location selection,
- staging-route effect and end-of-day truck-position truth,
- location data structured so later RPG metadata can be added without replacing the planning model.

Acceptance:

The player can place Lunch in the day, choose an actual lunch location, see the route/timing consequences, choose an end-of-day staging location, and preserve both locations as real plan truth.

#### V2.6.4 — Readiness + Send Schedule

Build:

- always-visible plan readiness state,
- hard blockers vs sendable warnings,
- warning selection/highlight on timeline and map,
- send schedule confirmation,
- deliberate SEND ANYWAY path for warnings,
- sent-plan lock before Live Operations,
- no casual post-send rearranging.

Acceptance:

A valid or deliberately warning-bearing Driver Day can be reviewed, sent, and locked as the driver's communicated operating plan.

### V2.7 — Live Operations

Goal: execute the communicated Driver Day cleanly.

#### V2.7.1 — Simulation Clock + Execution Gate

Build:

- real simulation clock beginning at 6:00 AM on Day 1,
- functional Pause / Play / Fast Forward controls in the existing top-right strip,
- Play = one game minute per simulation tick,
- Fast Forward = four game minutes per simulation tick,
- Focused Workspace freezes simulation time without discarding the player's requested mode,
- SENT plan → SCHEDULED before shift start,
- SENT plan → LIVE READY inside the shift window,
- draft plan → not armed for execution,
- visible live-state copy in Driver Day after schedule send.

V2.7.1 is an execution foundation only. It does not yet move trucks or complete stops.

Acceptance:

The game clock can run, pause, and fast-forward; Focused work freezes it; and a sent schedule visibly becomes armed Live Operations state at the correct shift window.

#### V2.7.1.2 — Camera Ownership

Live Operations clock ticks must not be treated as camera-navigation events.

Rules:

- selecting a driver or stop may frame the target once,
- after that frame completes, pan/zoom ownership transfers to the player,
- simulation ticks, status updates, route hydration, and ordinary rerenders do not re-center the map,
- a driver's changing live coordinates do not imply camera follow,
- future driver-follow behavior must be an explicit player-controlled mode,
- clearing/changing selection may intentionally create a new frame target,
- planning place and FreightLink preview modes may continue to perform deliberate fit operations when their target actually changes.

This creates the camera invariant:

> selection chooses context once  
> the player owns the camera afterward

#### V2.7.2 — Route Execution + Truck Motion

Build:

- derive execution position for every SENT Driver Day from the shared live clock,
- SCHEDULED before shift start,
- EN ROUTE between planned events,
- one-minute ARRIVED state at freight stops before the next travel interval,
- Lunch as a real dwell window through its planned end time,
- ROUTE COMPLETE after the final planned event,
- precise selected/map-driver truck position interpolated by cumulative distance along the hydrated committed road LineString,
- actual next-event truth replaces the static first-stop assumption,
- completed route legs fade,
- active route leg remains strongest,
- future route legs remain visible but subordinate,
- Driver Day rows communicate completed / NOW / NEXT execution state,
- Fleet browser reflects each sent driver's live execution status,
- moving trucks never reclaim camera ownership.

Scope boundary:

- all sent Driver Days advance logically from the shared clock,
- precise map movement requires real hydrated road geometry and is rendered for the current map driver in this slice,
- do not fake unhydrated drivers with straight-line movement,
- pickup/delivery service timers, loading/unloading, HOS consumption, onboard mutation, and exception handling remain later V2.7 slices.

Acceptance:

With a sent schedule and running clock, the current map driver's truck visibly travels the real committed road route toward the correct next event. Reaching a stop produces ARRIVED state, prior route legs fade, Lunch parks the truck until break end, and manual camera position is preserved.

#### Later V2.7 slices

- pickup/delivery handoffs,
- waiting/loading/unloading service time,
- driver status transitions,
- live timing drift,
- HOS consequences,
- exceptions and dispatcher intervention.

Acceptance for V2.7:

The live map accurately reflects the manifest and actual driver state.

### V2.8 — Documents Workspace

Goal: make paperwork a desktop gameplay system.

Build:

- desktop Documents app,
- physical paper workspace,
- Rate Con/POD interaction,
- corrections,
- packet organization.

Acceptance:

Paperwork is readable, tactile, and connected to the real load lifecycle.

### V2.9 — Email + Messages

Goal: make communication desktop-native.

Build:

- inbox,
- message threads,
- driver messages,
- actionable notifications,
- document/link handoffs.

### V2.10 — Banking + Career Progression

Goal: bring back the employee-career meta systems after dispatch is stable.

Build:

- personal Banking,
- paychecks,
- Shop,
- workspace customization,
- visible career progression.

### V2.11 — Onboarding Rebuild

Goal: reintroduce Jordan over the finished systems.

Build:

- contextual instruction,
- progressive tool introduction,
- real gameplay teaching,
- minimal interruption.

### V2.12 — Packaging

After the desktop game loop is stable:

- packaged Mac/Windows builds,
- save-file hardening,
- display/resolution settings,
- keyboard polish,
- Steam integration work.

---

## 18. What gets removed or retired

The rebuild should not keep dead desktop experiments in the active runtime.

As replacements land:

- remove Desktop Build 1 shell code that is no longer used,
- remove desktop wrappers around mobile screens after desktop versions replace them,
- remove tutorial gating from active systems,
- remove duplicate selection state,
- remove duplicate panel concepts,
- remove any obsolete route/driver color assumptions.

Do not leave "old garbage" active beside the new system.

Historical files may remain only when they are intentionally retained and clearly not part of runtime behavior.

---

## 19. Save compatibility

The rebuild should preserve saves where practical.

Presentation-state changes do not require a save reset.

Gameplay-state changes must consider migration.

Important persistent truth includes:

- career identity,
- created character,
- game day,
- drivers,
- loads,
- manifests,
- HOS,
- documents,
- money,
- career progress.

Temporary UI state such as which command-rail section/browser was open should not need to become important save data unless there is a clear reason.

If a future work packet requires resetting unfinished operations because old state is incompatible, that must be called out before implementation.

---

## 20. Regression requirements

Major v2 work should add regression tests around game-state invariants.

Key invariants include:

- per-driver color identity remains stable,
- two drivers can be active simultaneously without route ownership confusion,
- manifest order remains authoritative,
- multiple loads may be onboard,
- pickups and deliveries may interleave,
- trailer capacity is enforced,
- HOS feasibility consumes the same manifest truth shown to the player,
- Focused work pauses simulation,
- leaving Focused restores the prior clock state,
- command-rail/browser/inspector presentation does not alter simulation truth,
- desktop selection never creates a second copy of driver/load state,
- tutorial-disabled mode does not block ordinary gameplay.

Visual layout behavior still requires screenshot/manual browser testing.

---

## 21. Desktop test strategy

Desktop work is tested primarily through the local Vite build on the Mac.

Vercel remains useful for intentional shareable checkpoints, but it is not required for every visual iteration.

Preferred loop:

**design packet → feature branch → build → permanent verification → squash merge → local pull → fullscreen Mac test → collect feedback → next packet**

For visual shell work, Maxx's screenshot/video feedback is part of acceptance.

A green automated build means:

> the code is structurally healthy.

It does **not** mean:

> the UI looks right.

---

## 22. What v2 deliberately does not solve yet

Not required during the early rebuild:

- full NPC traffic simulation,
- final facility congestion model,
- Shop depth,
- owner-era CarrierSource gameplay,
- full LedgerDesk,
- advanced office interaction,
- Steam packaging,
- controller support,
- achievements,
- final sound design,
- final onboarding.

These are later layers.

Do not use them to delay the shell and core gameplay rebuild.

---

## 23. Architecture replacement contract

### New source of truth

Desktop Experience Architecture v2.

### Old assumption removed

The desktop interface is no longer an expanded or embedded version of the mobile UI.

### Existing truth retained

Simulation systems already owning:

- manifest,
- HOS,
- load lifecycle,
- routing,
- driver movement,
- documents,
- money,
- saves,

continue to own that truth unless a dedicated later architecture packet explicitly replaces them.

### New desktop truth

Desktop owns:

- map-first shell state,
- left command rail,
- context browser / inspector presentation,
- shared selection,
- focused-task state,
- desktop-native presentation.

### Compatibility bridge

Legacy mobile views may be used temporarily to keep functionality alive during migration.

They are transitional only.

Each app work packet should remove its compatibility wrapper once the desktop-native replacement is ready.

### Migration expectation

No broad save reset is expected for the shell rebuild.

State migrations are handled only when a gameplay source of truth changes.

---

## 24. Locked v2 decisions

The following are now considered locked unless deliberately reopened:

- Desktop Build 1 is a prototype, not the final shell.
- The shell is rebuilt around a map-first default state.
- The normal workstation uses a permanent left command rail.
- Drivers is a first-class command-rail section.
- Ordinary systems use a left browser and right contextual inspector around a full-height center map.
- The bottom app bar and shared bottom app drawer are retired.
- Ordinary app navigation must not consume large vertical map space.
- Focused Workspace is the deliberate exception for deep task/document work.
- Desktop apps are rebuilt as desktop apps rather than stretched phone screens.
- Existing simulation logic is preserved where sound.
- Jordan's tutorial is removed from the active loop during the systems rebuild.
- Gameplay systems are stabilized before onboarding is rebuilt.
- Each driver has a unique persistent color identity.
- Driver identity color follows assigned driver markers, assigned routes, and related operational cues.
- Unassigned FreightLink route previews stay neutral until freight is committed.
- Color is supported by labels/icons for accessibility.
- The driver manifest remains the operational backbone.
- Interleaved pickups/deliveries remain supported.
- FreightLink evaluation must use the driver's real manifest/HOS/capacity.
- Rate Confirmation is a real gameplay checkpoint.
- Requesting a Rate Confirmation never commits freight.
- Only Rate Confirmation acceptance turns marketplace freight into committed driver work.
- Rate Confirmation verification is player-driven; no term begins pre-verified.
- The verification panel shows only the FreightLink reference value; the player reads the Rate Con value from the paper.
- Rate Confirmation paper uses the shared draggable Document Desk and stacking model.
- ISSUE keeps the referenced paper field visibly marked until the player changes the judgment; the mark must not reveal correctness.
- The current truck position is the default Driver Day route origin; home base is not an automatic start location.
- A plan may explicitly define a startLocationId when the day truly begins at a facility.
- The player marks each comparison MATCH or ISSUE before acceptance.
- The player may deliberately accept flagged mismatched terms; DOC OS preserves the document terms exactly as written.
- Lunch and staging are part of operational planning.
- Lunch is always tied to a real selectable gameplay POI; it is not stored or presented as a generic break-only node once a location is chosen.
- Lunch POI choice affects route geometry, timing, appointments, and HOS in the same Driver Day truth used by the map.
- Lunch locations use the shared POI/location model so future RPG preferences, favorite places, cost/quality, dialogue/events, morale/fatigue, and relationship effects can be layered onto the same locations without rebuilding the lunch system.
- V2.6 establishes the RPG-ready lunch foundation but does not require the RPG consequence systems themselves.
- Focused work pauses simulation.
- Map selection and manifest/context selection share one model.
- Drivers use truck markers; operational locations use typed POI icons rather than generic circles.
- Every rendered route begins and ends on the exact gameplay POI/asset coordinates so lines visually connect to their endpoint icons.
- Committed pickup-bound route legs are dashed while delivery-bound route legs remain solid, preserving driver color as ownership language and line style as move-type language.
- Desktop operational text follows the V2.4.3 readability floor (11/12/14/16/22 px scale).
- The top-right clock area reserves permanent runway for pause, play, and fast-forward controls; V2.7 activates those controls without redesigning the header.
- The game clock should remain visually subordinate to the operational workspace rather than dominating the top bar.
- FreightLink lane-fit cards must remain fully inset within the browser column at the 1920×1080 reference layout; status text or borders may not disappear under the map edge or scrollbar.
- The operational basemap is a dark detailed vector style with consumer POI clutter suppressed.
- Browser previews remain intentional checkpoints, not automatic per-push deployments.
- PC/Steam remains the long-term target.

---

## 25. Immediate next work packet

V2.5 through V2.6.5.14 are accepted and locked.

# **V2.6 Daily Planning is complete.**

V2.7.1, V2.7.1.1, and V2.7.1.2 are visually accepted and locked.

The active work packet is:

# **V2.7.2 — Route Execution + Truck Motion**

Build:

- derive live execution state from each SENT Driver Day timeline,
- move the currently hydrated map driver's truck along real committed road geometry,
- use cumulative route distance for position interpolation,
- expose EN ROUTE, ARRIVED, ON BREAK, and ROUTE COMPLETE states,
- respect Lunch as a dwell window,
- drive next-stop emphasis from actual execution state,
- fade completed route legs and emphasize the active leg,
- mark Driver Day rows as completed / NOW / NEXT,
- show live execution status in the Fleet browser,
- preserve V2.7.1.2 player-owned camera behavior.

Non-goals:

- no pickup/loading puzzle yet,
- no unload/service timer yet,
- no onboard-load mutation,
- no HOS decrement,
- no detention or exception engine,
- no fake straight-line movement for drivers whose road routes are not hydrated.

Acceptance:

At normal or fast time, a sent driver's selected truck progresses along the actual road route toward its next planned event, route/timeline state advances coherently, Lunch holds the truck, and camera pan/zoom remains untouched.

After acceptance, the next Live Operations slice will add stop service/handoff behavior and can generalize hydrated route caching for simultaneous visible fleet motion.

---

This file is the active desktop design and build-order contract. If a major desktop decision changes, update this document rather than layering a competing rule elsewhere.


---

## V2.7.3 — Facility Service Execution

V2.7.3 turns freight-stop arrival into real operational dwell instead of an instantaneous waypoint.

### Service clock

- Pickup = **12 minutes loading** by default.
- Delivery = **10 minutes unloading** by default.
- A stop may override its own service duration later without changing the execution model.
- Service time begins at the Driver Day projected arrival time for this packet.
- The truck remains parked at the routed facility access point for the entire service window.
- The next route leg begins automatically when service ends. The dispatcher does not press a redundant Depart button.

### Live freight truth

Arrival alone does not change cargo state.

- A pickup becomes onboard only when loading completes.
- A delivery remains onboard during unloading.
- The load leaves the truck only when unloading completes.
- Live onboard pallet and weight totals derive from completed facility-service events, not from the planning-only capacity snapshot.

This keeps planning truth and execution truth separate:

> planned capacity describes what the day should look like  
> live onboard state describes what has actually finished loading or unloading

### Presentation

During service, the same execution state drives every surface:

- Fleet shows **LOADING** or **UNLOADING**,
- Driver Day keeps the freight stop marked **NOW**,
- the freight row shows service progress, remaining minutes, and automatic departure time,
- the map keeps the truck parked at the current facility,
- the completed incoming route leg may remain visually retired while the outgoing leg stays future.

### Loading-puzzle seam

The physical loading puzzle is deliberately not implemented in V2.7.3.

The execution engine is structured so the later facility puzzle can become the gate that releases/starts the service clock. Finishing the puzzle and closing the trailer doors can trigger loading time without rewriting route movement, cargo-state, Driver Day, or Fleet behavior.

Paperwork, dock congestion, detention, and facility-specific service variability remain later work.


---

## V2.7.3.1 — Route-Locked Smooth Truck Motion

The first V2.7.3 desktop playtest confirmed that route execution worked, but exposed two presentation defects:

1. the selected truck artwork appeared offset from its route coordinate because the visible name label participated in the MapLibre marker's bounding box while the marker used a bottom anchor,
2. live coordinates changed only once per simulation tick, making truck motion visibly step or jump, especially at 4× speed.

### Marker-coordinate invariant

Truck artwork, not its floating label, owns the map coordinate.

- truck markers use a center anchor,
- the marker's coordinate-bearing box is the truck artwork dimensions,
- selected/hover driver labels are absolutely positioned outside that box,
- selection scaling must not vertically shift the truck away from the route.

This creates the visual invariant:

> route coordinate = center of truck artwork

### Smooth execution invariant

The shared simulation clock remains gameplay truth. Smooth motion is presentation interpolation only.

For an active committed route leg:

- each clock tick supplies the new authoritative segment progress,
- the map remembers the currently rendered progress,
- the visual tween advances from rendered progress to the new authoritative progress over the interval between clock ticks,
- every animation frame recomputes coordinates with `coordinateAlongRouteShape()`,
- therefore the truck follows the committed road LineString through curves and turns instead of drawing a straight shortcut between tick positions,
- a new tick cancels the unfinished tween and continues from the currently rendered route progress,
- dwell/service phases immediately hold the truck at the routed stop access coordinate.

At 4× speed the truck covers more route per real second, but it still visibly traverses that route continuously.


---

## V2.7.3.2 — Driver Label + Marker Alignment Cleanup

V2.7.3.2 is a map-presentation cleanup after the smooth-motion playtest.

### Driver label interaction

The truck icon is the persistent map object. The driver name is contextual detail.

- Driver labels are hidden by default.
- Clicking/selecting the truck explicitly opens its driver label.
- Merely resolving the same driver from a selected stop or load does not open the label.
- The selected-driver visual glow remains available without forcing the name label open.

### Coordinate-bearing marker invariant

Every physical stop icon uses this rule:

> geographic coordinate = visual center of icon artwork

Committed lunch/staging anchors, planning-place candidates, and FreightLink pickup/delivery preview markers therefore use centered MapLibre anchoring.

Their labels, badges, and role chips are absolutely positioned outside a fixed icon-sized geometry box. Hover and selected states may scale an icon, but must not translate it away from the map coordinate.

Committed freight P/D circles remain map-native symbols sourced from the canonical stitched route-access coordinate and do not need a DOM-anchor adjustment.


---

## V2.7.3.3 — Complete Route Truth

A V2.7.3.2 playtest showed that some operational icons still appeared detached from the blue route. The marker anchor was no longer the problem. The actual defect was incomplete road hydration being published as if it were a complete Driver Day.

When an OSRM request fell back to a timing estimate:

- that estimate leg was intentionally omitted from committed blue-road rendering,
- but its operational stop marker could still fall back to the canonical facility coordinate,
- the result looked like a floating Lunch/Staging/Pickup/Delivery icon with no route touching it.

### Publication rule

A Driver Day road snapshot becomes visible only when every segment has real road geometry.

If any segment is unresolved:

- keep the previous complete snapshot for the same driver when one exists,
- otherwise keep committed route truth unpublished,
- retry unresolved road truth automatically with capped backoff,
- reuse cached successful road legs so retries focus network work on missing geometry.

### Operational marker rule

Committed markers are road-facing operational context, not generic facility pins.

Therefore:

- committed P/D markers use route-access coordinates only,
- committed Lunch/Staging route anchors use route-access coordinates only,
- no committed marker falls back to the facility coordinate,
- a committed marker with unresolved route access remains hidden until road truth exists.

Planning candidates and non-committed location previews may still use canonical facility coordinates because they are not yet route execution truth.

This creates the invariant:

> if the player can see a committed operational marker, a committed road route must physically meet it.


---

## V2.7.3.4 — Native Operational Stops

The V2.7.3.3 playtest isolated the remaining map mismatch:

- committed Pickup/Delivery markers were MapLibre-native and met the route correctly,
- committed Lunch/Staging markers still used HTML/DOM Marker positioning and appeared displaced from the same route-access coordinate.

The committed DOM route-anchor path is therefore retired.

### One projection path

All committed operational stops now come from the same MapLibre GeoJSON source:

- Pickup → `P#`
- Delivery → `D#`
- Lunch → `L`
- Staging → `S`

Every feature resolves its coordinate from the canonical committed route-access map. The same source drives:

- the stop circle,
- badge text,
- selected/next-stop label,
- completion opacity,
- hover label,
- click selection.

This creates the rendering invariant:

> committed route line + committed P/D/L/S stop = one MapLibre projection system

No committed Lunch or Staging HTML marker is permitted.

### DOM markers that remain

DOM markers are still valid for non-committed context such as:

- planning-place candidates,
- FreightLink preview pickup/delivery markers,
- the moving driver truck asset.

Those are presentation/interaction overlays, not committed stop truth.


---

## V2.7.3.5 — Native Planning POIs

V2.7.3.4 proved that one MapLibre-native projection path eliminates the visual drift that affected committed Lunch/Staging stops. V2.7.3.5 applies that same rule to temporary Lunch/Staging planning choices.

### Semantic place language

Planning choices describe physical places, so the marker communicates the place type rather than repeating the event role.

Examples:

- diner / restaurant → food icon,
- truck stop / travel plaza → truck-stop icon,
- staging lot → staging icon,
- yard → yard icon,
- fuel location → fuel icon,
- service facility → service icon,
- generic freight facility → warehouse icon.

The planning flyout still explains that the player is choosing a Lunch or Staging location. The map icon answers a different question: **what kind of place is this?**

### Native planning source

Lunch/Staging candidates are features in a dedicated MapLibre GeoJSON source with native:

- candidate circle layer,
- semantic icon layer,
- hover label layer,
- click interaction.

The retired `.planning-place-option` DOM marker path is no longer used.

Candidate markers use canonical location coordinates because they are still uncommitted choices. Once the player previews a choice, the preview Driver Day and its route hydration own the road-facing stop truth.

### Consistent committed semantics

Committed non-freight stops no longer use generic `L` or `S` letters.

- P/D remain numbered load badges.
- Lunch/Staging render the semantic icon for their chosen physical location.
- Previewed Lunch/Staging stops use the same icon and receive a distinct preview accent.

This creates the map-language invariant:

> letters/numbers identify freight work; icons identify physical stop types.


---

## V2.7.3.6 — Motion + Lunch Flow Polish

The V2.7.3.5 playtest exposed three polish issues:

1. the truck silhouette always faced one direction even when the route reversed,
2. route motion still had an occasional stop-start hitch between one-second simulation ticks,
3. Lunch ranking minimized total detour but did not distinguish forward progress from backtracking toward the previous stop.

### Truck facing

The truck remains a horizontally oriented dispatch-map asset rather than a full heading-rotated vehicle.

For each rendered frame:

- sample the committed road LineString immediately before and after current route progress,
- compare the longitude direction,
- east/right movement uses the default truck silhouette,
- west/left movement mirrors the truck SVG,
- nearly vertical movement preserves the previous facing to avoid visual flicker,
- initials are not mirrored and reposition to remain on the trailer/body side.

This intentionally implements **left/right travel facing**, not continuous compass rotation.

### Continuous visual motion

The simulation clock still advances once per second.

The visual interpolation window now runs slightly longer than that one-second cadence. The next authoritative tick normally arrives before the previous tween finishes, cancels it, and begins the next tween from the truck's current rendered progress.

That overlap removes the tiny idle gap produced by a 900 ms animation on a 1000 ms clock tick while keeping clock state authoritative.

### Forward-progress Lunch scoring

Lunch selection now evaluates both:

- added route detour,
- whether the lunch stop moves the truck closer to or farther from the next scheduled stop.

For a candidate:

- **forward progress** = direct previous-stop → next-stop travel time minus candidate → next-stop travel time,
- negative forward progress becomes **backtrack minutes**,
- backtrack minutes receive a 3× ranking penalty on top of normal detour.

This is a preference, not a hard rule. A small backtrack can still win if forward alternatives impose a substantially worse overall route.

The Lunch Planner surfaces:

- **TOWARD NEXT STOP**,
- **ROUTE NEUTRAL**,
- **BACKTRACK**,

so the player can understand why one option is operationally stronger than another.


---

## V2.7.3.7 — Truck Label State

The V2.7.3.6 playtest exposed one remaining interaction leak: the truck name label was tied to global driver selection.

Because Marcus remains the selected driver during live execution, the label stayed visible even though the player had not just clicked the moving truck.

### Interaction rule

Driver selection and truck-label visibility are now independent.

- selecting Marcus anywhere in the desktop may highlight his truck,
- that selection does **not** open the name label,
- clicking the truck itself toggles the name label,
- clicking elsewhere on the map closes the label,
- live movement never changes label visibility on its own.

This creates the invariant:

> selection answers “which driver is active?” while the map label answers “which truck did the player explicitly inspect?”


---

## V2.7.4.0 — Fleet Execution Foundation

V2.7.4.0 removes the final selected-driver dependency from live truck execution.

The domain layer already produces one live state per Driver Day from the shared simulation clock. The map now honors that same fleet model instead of animating only the currently inspected driver.

### World-state invariant

> selection is UI; simulation is world state.

Marcus, Taylor, Derrick, and future drivers continue executing whether or not their Driver Day, route, or inspector is currently visible.

### Fleet route runtime

The map maintains:

- a committed road-route result per driver,
- a rendered route collection per driver,
- one truck-motion record per driver,
- one animation-frame handle per driver.

Committed Driver Days hydrate in the background independent of selection. Successful road routes are cached by the existing road-routing service.

Planning-place and FreightLink previews remain separate inspection routes. Preview geometry may temporarily replace the **displayed** route for the selected driver, but it never replaces that driver's committed execution geometry.

### Fleet truck motion

On each global clock update, every driver is evaluated.

For each driver:

1. read that driver's live state,
2. read that driver's committed routed geometry,
3. determine the authoritative live route position,
4. update/animate that driver's own truck marker,
5. preserve that driver's facing and rendered progress independently.

If a truck marker is temporarily hidden by a workspace filter, its motion state still advances. When the marker reappears it starts from the driver's current live/rendered position rather than the original seed coordinate.

### Selection behavior

Changing the selected driver:

- changes route/stops/inspector emphasis,
- may frame the selected driver's current live position once,
- does **not** alter any driver's execution state,
- does **not** create catch-up movement.

Only the selected driver's detailed route is rendered at full detail to keep the map readable as fleet size grows.

### Deferred late-send behavior

An unsent Driver Day remains unarmed and the truck stays at its start/current position.

If a schedule is sent after its planned shift start, the current execution model can still evaluate against the original timeline. Correct late-dispatch recovery and downstream ETA recalculation are explicitly deferred to **V2.7.4.1**.


---

## V2.7.4.0.1 — Fleet Map Clarity

V2.7.4.0 correctly made all drivers execute at once, but the first fleet playtest exposed a presentation problem: the map showed multiple live trucks without enough hierarchy to explain what each one was doing.

The simulation was correct; the fleet visualization was not yet readable.

### Visual hierarchy

When a driver is selected:

- the selected truck remains full-strength,
- the selected driver's full route and operational stops remain the primary map story,
- every other truck remains live but is reduced in scale/opacity,
- non-selected trucks do not gain persistent name labels.

When no driver is selected, all trucks return to equal visual strength so the map can act as a true fleet overview.

### Active-leg context

A non-selected driver may display only the driver's **current active road leg**.

This is intentionally not the full Driver Day route. It answers one simple question:

> where is that driver going right now?

The active-leg line uses the driver's identity color at low opacity with a dark casing. It is removed from FreightLink preview mode to avoid competing with freight-market route evaluation.

### Fleet glance strip

The Live Map includes a compact clickable fleet strip showing:

- driver initials,
- driver identity color,
- current operational state such as SCHEDULED, EN ROUTE, LOADING, UNLOADING, ON BREAK, or PLAN NOT SENT.

The strip changes selection but never changes simulation state.

Truck labels remain click-only. The strip is fleet status UI, not a replacement persistent map label.


---

## V2.7.4.0.2 — Fleet Route Lock

The V2.7.4.0.1 fleet playtest showed that Marcus visually tracked the selected route correctly while Taylor and Derrick could appear near—but not exactly on—the route being shown for them.

Two ambiguity sources were removed.

### One active segment object

Fleet active-leg rendering and fleet truck motion now resolve through the same `fleetActiveSegment()` helper.

For a given driver:

- read the driver's live `activeSegmentId`,
- resolve one segment from that driver's stitched committed route collection,
- use that segment's exact `routeShape` for both the faint active-leg LineString and per-frame truck interpolation.

This creates the invariant:

> if the active leg is visible, the truck coordinate is sampled from that exact LineString.

### Stale preview rejection

The selected driver's detailed route no longer falls back to arbitrary older preview geometry for the same driver.

A preview route is used only when:

- it belongs to the selected driver,
- its route key exactly matches the currently displayed preview Driver Day.

Otherwise the detailed map uses committed fleet route geometry.

### Context truck presentation

Non-selected trucks remain de-emphasized, but are no longer scaled down.

The truck SVG is asymmetric, so scaling the artwork could make a correctly anchored marker appear visually displaced relative to a thin route line. Context hierarchy now uses opacity/filter while preserving the same marker box and artwork size as the selected truck.


---

## V2.7.4.0.3 — Single Route Truth

A recording of V2.7.4.0.2 showed Taylor and Derrick visually displaced from the thick selected route even though fleet active-leg and truck interpolation shared the same active segment.

The remaining split was one level higher: selected full-route rendering could still prefer `driverRouteResult` when its driver ID and route key matched, while truck execution used `fleetRouteResults`.

Two separately hydrated road results can share the same schedule key while containing different road geometry.

### Committed route ownership

For a committed Driver Day:

- `fleetRouteResults[driverId]` is the authoritative full-route geometry,
- active-leg rendering resolves from that same fleet route collection,
- truck interpolation resolves from that same fleet route collection.

`driverRouteResult` is reserved for a distinct planning-preview Driver Day.

### Preview isolation

A preview route is eligible only when the displayed Driver Day is not the same committed Driver Day object supplied by `driverDays`.

If preview hydration has not completed, the committed route may remain visible as a temporary fallback rather than showing stale preview geometry.

This creates the invariant:

> committed route line, current active leg, and truck position are three views of one route object—not three independently hydrated routes.


---

## V2.7.4.0.4 — Fleet Marker Anchor

The V2.7.4.0.3 recording exposed a fleet-only presentation bug that route-geometry changes could not explain: Marcus, the first driver marker, aligned correctly while Taylor and Derrick appeared progressively displaced from otherwise-correct route lines.

### Root cause

MapLibre positions custom markers with geographic transforms on absolutely positioned marker elements.

The DOC OS truck element also had:

```css
.driver-marker {
  position: relative;
}
```

That custom rule overrode MapLibre's required marker positioning.

With one truck, the error could remain invisible. With multiple marker elements in DOM order, later markers could inherit normal document-flow placement before MapLibre's transform was applied, producing apparent geographic offsets.

### Marker invariant

The truck marker container now uses:

- `position: absolute`,
- fixed `42px × 31px` dimensions,
- `padding: 0`,
- `box-sizing: border-box`,
- MapLibre `anchor: 'center'`.

Only child artwork uses relative positioning.

No driver-specific pixel correction is permitted. Every truck receives the same geographic-to-screen projection path.


---

## V2.7.4.1 — Dispatch Gating + Late Send Recovery

V2.7.4.0 established fleet execution independent of selection. The next fleet failure case is an unsent schedule whose planned shift has already started.

Previously, sending that schedule late armed the original timeline against the current clock. The driver could appear to jump into work that was never physically executed.

### Dispatch gating

An unsent Driver Day has two pre-execution states:

- **PLAN NOT SENT** before planned shift start,
- **DISPATCH REQUIRED** at or after planned shift start.

A dispatch-required driver:

- remains at the start/current truck position,
- owns no active route segment,
- has no completed route legs or service events,
- does not gain onboard freight,
- does not pause other fleet operations.

The operations bar exposes the number of drivers requiring dispatch.

### Actual dispatch start

When a schedule is sent after planned shift start:

- the plan records the actual send minute/day,
- the current absolute simulation minute becomes `dispatchStartMinutes`,
- the original planned `shift.startMinutes` remains unchanged,
- the Driver Day shift-start event uses the later actual dispatch start,
- the remaining timeline is recalculated forward from that minute.

This ensures route execution begins at progress zero when the player actually dispatches the driver.

### Recalculated downstream consequences

Late dispatch recalculates:

- freight projected arrivals,
- service completion times,
- Lunch start/end,
- Staging arrival,
- appointment margins,
- schedule warnings.

The send itself is not undone merely because the late start creates new operational risk. Those warnings are consequences the dispatcher must manage after the driver is finally released.

### Deferred appointment waiting

Freight arrival still uses the existing appointment-start clamping model in this packet. Separating physical arrival from appointment/service start is intentionally deferred to **V2.7.4.2**.


---

## V2.7.4.1.1 — Fleet Glance Scaling

The three-driver fleet glance works well because every driver can remain visible at once. That pattern does not scale to a 10–20 driver operation.

The glance strip therefore changes representation based on fleet size.

### Small fleet: 1–5 drivers

Retain the current individual-chip pattern:

- identity color,
- initials,
- live operational status,
- direct driver selection.

This keeps the current three-driver experience unchanged.

### Larger fleet: 6+ drivers

The strip becomes an operational summary.

It may show:

- the currently selected driver,
- up to two specific drivers requiring attention,
- EN ROUTE count,
- AT STOP count,
- BREAK count,
- SCHEDULED count,
- NOT SENT count,
- total DRIVERS action.

Attention is exception-first: the dispatcher sees who needs help before aggregate counts.

### Filter handoff

Fleet summary buttons open the existing Drivers browser with a matching filter.

Supported groups:

- NEEDS ATTENTION,
- EN ROUTE,
- AT STOP,
- ON BREAK,
- SCHEDULED,
- PLAN NOT SENT,
- ALL DRIVERS.

The browser header reports the filtered count and provides an ALL control to return to the full roster.

### Route-context scaling

Fleet route context also adapts:

- 1–5 drivers: normal faint active legs for non-selected drivers,
- 6–10 drivers: active legs remain but at reduced opacity,
- 11+ drivers: ordinary non-selected active legs are hidden by default.

Truck markers still execute and remain visible. Hiding a context line never pauses or alters simulation state.

Future attention states may opt into visible route context even in dense fleets.

This preserves the fleet invariant:

> the map shows enough context to understand the operation without rendering every possible piece of fleet state at once.
