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


---

## V2.7.4.1.2 — Fleet Roster

Fleet Glance proved useful for quick switching and exception awareness, which made the old Drivers panel redundant: it repeated the same driver/status information in larger cards.

The left-side driver app is therefore reframed as **Fleet**.

### Three levels of driver UX

The workstation now has three deliberately different levels:

1. **Fleet Glance** — who needs attention and who should I inspect?
2. **Fleet Roster** — what is happening across the operation?
3. **Driver Day** — what exactly is happening with this one driver?

The roster must provide information that cannot fit responsibly in the map chips.

### Roster fields

Each driver row exposes:

- **DRIVER / STATUS** — identity plus current live phase,
- **HOS** — current Driver Day drive/duty source,
- **LOAD** — current/next load reference and live onboard context,
- **NEXT** — next operational location and ETA,
- **RISK** — dispatch-required, plan blocker, warning, or clear.

Rows remain selectable and drive the existing Driver Day inspector.

### Search and filters

Fleet supports text search across:

- driver name,
- initials,
- operational status,
- load reference,
- next stop,
- risk.

Fleet Glance status counters continue to hand off into Fleet filters. An ALL action clears the status filter without clearing the game selection.

### Layout

Fleet is slightly wider than the generic browser because it is a command board, not a card list.

- Fleet browser: up to ~410 px,
- FreightLink browser retains the existing generic width,
- the map remains the dominant center surface,
- the right Driver Day inspector remains unchanged.

### HOS source

This packet does not implement live HOS depletion.

The Fleet HOS column intentionally reads the same Driver Day HOS source used by the current Driver Day summary. When live HOS is implemented, Fleet becomes the fleet-level view of those clocks without another layout redesign.

The architectural separation remains:

> Fleet Glance tells the dispatcher where to look; Fleet tells the dispatcher what needs management; Driver Day is where the dispatcher acts.


---

## V2.7.4.1.3 — Fleet Roster Cleanup

The first Fleet Roster pass proved the command-board direction, but the live screenshot exposed too much duplication with Fleet Glance and Driver Day.

### Ownership cleanup

Fleet no longer attempts to summarize every piece of driver state.

The responsibilities are:

- **Fleet Glance:** lightweight current status and fast switching,
- **Fleet Roster:** driver identity, next work, workload count, operational risk,
- **Driver Day:** HOS, trailer detail, full timeline, plan editing, and one-driver execution detail.

### Compact row

Each Fleet row is now:

- **Driver**
  - name/identity,
  - inline `NEXT · location · ETA`,
- **Loads**
  - assigned load count,
- **Risk**
  - DISPATCH, BLOCKER, WARNING, or CLEAR.

The old HOS column is removed.

The separate NEXT column is removed.

The generic instructional/detail footer is removed, including repeated copy such as "Send the schedule to arm Live Operations."

Ordinary status text such as PLAN NOT SENT is intentionally not repeated inside the roster row because Fleet Glance already carries that glanceable state.

### Space recovery

With fewer columns, Fleet narrows from the first roster pass and returns horizontal space to the map.

Risk receives explicit right-side padding so it does not visually collide with the browser boundary.

The principle is:

> Fleet should answer "who, what's next, how much work, and what is wrong?" Anything deeper belongs in Driver Day.


---

## V2.7.4.2 — Physical Arrival + Appointment Waiting

The pre-V2.7.4.2 schedule model clamped a freight stop's arrival to the appointment start. If a truck could physically reach a receiver early, the live route therefore stretched the drive until the appointment rather than arriving and waiting.

V2.7.4.2 separates those concepts.

### Freight timing model

Each freight stop now carries:

- **physicalArrivalMinutes** — when road travel reaches the facility,
- **serviceStartMinutes** — when loading/unloading may begin,
- **waitMinutes** — early dwell before service,
- **endMinutes** — service completion/departure.

For an appointment-gated stop:

`serviceStart = max(physicalArrival, appointmentStart)`

and:

`end = serviceStart + serviceDuration`

`projectedArrivalMinutes` now follows physical arrival for recalculated freight stops so the Driver Day timeline represents where the truck actually is.

### Live execution

A freight leg is complete at physical arrival.

If the driver is early:

`EN ROUTE → WAITING → LOADING / UNLOADING → EN ROUTE`

During WAITING:

- the truck is parked at the facility access point,
- the completed incoming leg is visually retired,
- no pickup freight becomes onboard,
- no delivery freight is removed,
- service progress has not started,
- a countdown identifies when the appointment opens.

The next road leg does not begin until service completes.

### Planning and appointment risk

Plan analysis evaluates appointment-window risk using service-ready time.

This preserves the useful distinction:

- arriving early is not a late appointment,
- arriving after the appointment start may still be inside the window,
- arriving/service-ready after the appointment end is late.

### Facility gameplay handoff

This packet intentionally does **not** add the pickup/delivery puzzle.

It creates the event boundary that facility gameplay needs:

1. truck physically arrives,
2. early truck waits if required,
3. appointment/service gate opens,
4. facility interaction may begin,
5. service/loading time follows facility interaction,
6. driver departs automatically after service completion.

The next facility-gameplay packet can replace the automatic transition at step 4 with the dock/freight puzzle without rewriting route or appointment timing.


---

## V2.7.5.0 — Dock & Load Foundation

V2.7.4.2 established the truthful facility boundary: a truck physically arrives, waits when early, and reaches an appointment-ready state without stretching road travel.

V2.7.5.0 inserts the first player-driven pickup operation at that boundary.

### Simulation boundary

Pickup execution now follows:

`EN ROUTE → WAITING (when early) → DOCK ASSIGNED → FOCUSED LOAD PLANNING → LOADING → EN ROUTE`

The important separation is:

- **decision time** happens in Focused Mode and pauses the world clock,
- **operational loading time** happens after commitment in normal simulation.

The player does not impersonate warehouse labor. The player verifies and plans the operation.

### Facility gate

When an appointment-ready pickup has no committed facility operation:

- the incoming road leg remains complete,
- the truck remains parked at the facility,
- freight is not onboard,
- later route legs cannot complete,
- Driver Day exposes the assigned dock and an OPEN DOCK & LOAD action.

The first packet assigns a deterministic dock immediately when the appointment/service gate opens. Congestion-based WAITING FOR DOCK timing is deferred.

### Focused Dock & Load

Dock & Load uses the existing FocusedWorkspace shell, so world simulation pauses automatically while the player solves the load.

The first playable puzzle includes three regions:

1. **Staged Freight**
   - expected booked freight,
   - one unrelated noise unit,
   - verify/unverify,
   - drag or PLACE into trailer.

2. **Trailer Plan**
   - stylized 53-foot dry-van board,
   - 26 floor positions,
   - verified freight placement,
   - click planned freight to return it to staging,
   - visible FRONT / NOSE and REAR / DOORS orientation.

3. **Booked Load / Readiness HUD**
   - driver,
   - pickup,
   - destination,
   - expected pallet count and weight,
   - positions used,
   - planned weight,
   - verified expected freight,
   - planned expected freight,
   - blocking validation.

### Rear doors are the commit control

There is no generic final submit button.

When the load plan has no blocking errors, the rear doors become actionable.

Closing them:

1. locks the current plan,
2. records the facility operation,
3. records actual loading start at the current simulation minute,
4. exits Focused Mode,
5. resumes the world clock,
6. begins background LOADING.

The door interaction is therefore both visual feedback and the state transition between planning and execution.

### Downstream timing

A pickup held for player action cannot silently keep executing the old schedule.

Once the plan is committed, route execution uses the actual loading start and deterministic loading duration. Any delay beyond the original service window is propagated into downstream arrivals and dwell timing.

Appointment clocks themselves remain fixed; delays move the truck, not the appointment.

### Tutorial-level scope

The V2.7.5.0 load-plan evaluator is intentionally simple:

- all expected pallets must be verified,
- all expected pallets must be placed,
- unrelated freight in the trailer is a blocker,
- duplicate placement is a blocker.

The underlying operation/load-plan state is preserved so later packets can add:

- stack compatibility,
- vertical height,
- trailer weight and balance,
- stop accessibility,
- ambiguous labels,
- missing/extra freight,
- rework,
- facility personality,
- variable loading time,
- paperwork and pickup exceptions,
- delivery consequences.

The first goal is to prove the complete interaction boundary without destabilizing fleet execution.


---

## V2.7.5.0.1 — Puzzle Board Correction

The first Dock & Load screen proved the pickup state transition but exposed the wrong interaction model: freight behaved like form rows and the trailer behaved like 26 independent parking spaces.

The corrected model is a packing puzzle.

### Freight pieces

Staged freight is represented as movable pallet pieces.

Each freight object now carries a floor footprint. Tutorial shapes include:

- standard long,
- standard wide,
- L overhang,
- wide overhang,
- block,
- long overhang.

The player may rotate staged pieces before placement.

Verification still matters, but the visual and mechanical center of the screen is now the shape itself rather than a freight card.

### Equipment-derived board

The trailer board is generated from the driver's assigned equipment.

For the current 53-foot dry van:

- equipment capacity remains 26 standard pallet positions,
- max freight weight remains 44,000 lb,
- the puzzle board uses a finer cell grid derived from that capacity so irregular freight footprints can occupy multiple cells.

Future equipment with different pallet capacity automatically produces a different board size.

No Dock & Load screen may hard-code a universal 26-box layout.

### Placement rules

A placement stores:

- freight ID,
- anchor cell,
- rotation.

The board derives the full occupied footprint from those values.

Continuous validation checks:

- board bounds,
- overlap,
- expected freight resolution,
- expected freight placement,
- unrelated freight,
- trailer weight.

Drag hover previews the full footprint:

- valid footprint → positive preview,
- collision/out-of-bounds → invalid preview.

Placed freight remains freely editable until rear-door commitment.

### Gameplay principle

The core question is no longer:

> Which numbered pallet box should this item occupy?

It is:

> Can I fit the correct shaped freight into this driver's actual trailer cleanly?

That packing interaction is the foundation for later stacking, balance, height, and stop-access gameplay.


---

## V2.7.5.0.2 — Trailer View

The V2.7.5.0.1 correction fixed the mechanics, but the center board still visually presented as a flat matrix of cells.

The interaction is now rendered as a rear-open trailer.

### Separation of logic and presentation

The equipment-derived puzzle grid remains the authoritative placement model.

The Trailer View is a visual shell around that grid:

- metallic roof/frame,
- left and right trailer walls,
- recessed trailer floor,
- visible front/nose wall,
- rear frame and tail lights,
- rear doors as the commitment control.

This keeps collision and fit calculations deterministic while making the gameplay surface communicate the object being loaded.

### 2.5D floor

The interactive floor narrows toward the trailer nose.

The perspective treatment is visual only; the same underlying cell coordinates, footprints, rotations, overlap detection, and out-of-bounds checks remain authoritative.

### Freight rendering

Occupied puzzle cells now render pallet/crate material inside the trailer.

The player should visually perceive freight sitting on the trailer floor rather than abstract blue occupancy.

Future asset art may replace these CSS crate treatments without changing the puzzle state model.

### Views

The design reserves a shared-state multi-view system:

- Trailer View,
- Top Down,
- Side View.

V2.7.5.0.2 implements Trailer View only.

Top Down and Side View appear as disabled view affordances so later work can expose the same load plan for balance, stop order, stacking, and height analysis without inventing a second load state.

### Focused shell

The top operations status must describe the mode, not a specific unrelated task.

Focused work now displays:

`FOCUSED MODE · GAMEPLAY PAUSED`

instead of retaining Rate Confirmation copy during Dock & Load.


---

## V2.7.5.0.3 — Square Pallet Floor

The rear-open Trailer View fixed the object being represented, but the interior still inherited a spreadsheet-like floor because 26 pallet capacity had been expanded into 52 stretched half-pallet cells.

That abstraction is removed.

### Capacity means floor slots

Equipment capacity is now represented directly:

- a 26-pallet trailer exposes 26 legal floor slots,
- a 12-pallet vehicle exposes 12 legal floor slots,
- max freight weight still comes from the same equipment source.

The visual board may include disabled filler cells only to complete a compact rectangular puzzle layout. Those filler cells are not usable capacity.

### Compact trailer layout

Marcus's 26-pallet dry van is represented as:

- 4 columns,
- 7 rows,
- 26 usable square slots,
- 2 disabled cells.

This is a gameplay board layout, not a literal DOT loading diagram. Its purpose is to preserve truck-specific capacity while making spatial packing legible and fun.

### Freight scale

A standard pallet is one square slot.

Irregular freight expands from that base unit:

- 1×2,
- 2×1,
- L footprint,
- 2×2 block.

This allows rotation and packing decisions without making every ordinary pallet a domino.

### Physical cargo rendering

The trailer floor remains the collision surface.

Placed freight is now drawn as a raised cargo/crate box above that floor using visual top and side faces.

The visual depth is presentation only:

- collision still uses footprint cells,
- rotation still uses the same shape coordinates,
- validation still uses the same board model.

The player should perceive boxes sitting inside the trailer rather than colored spreadsheet rows.


---

## V2.7.5.0.4 — Visual / Interaction Polish

V2.7.5.0.3 establishes the accepted Dock & Load gameplay surface. This packet does not change the puzzle model.

Its purpose is to improve tactile readability.

### Staged freight

Staged pieces are intentionally brighter than the surrounding DOC OS chrome so cargo reads as the primary interactive material.

Freight pieces support distinct visual states:

- idle,
- hover,
- dragging,
- rotating,
- verified,
- planned,
- wrong/noise freight.

Existing metadata may drive visual badges such as:

- OVERSIZE,
- NO STACK,
- WRONG LOAD,
- PLANNED.

These badges are descriptive in this packet. They do not add new simulation rules.

### Trailer cargo

The trailer floor remains the authoritative placement grid.

Placed freight is rendered above that grid as physical crate/pallet material.

Multi-slot freight is grouped into one visual cargo object using the same footprint and rotation as the placement model. The visual grouping must never rewrite the placement geometry.

### Drag feedback

Drag preview uses the whole visible footprint.

- valid footprint = bright positive outline/fill,
- invalid footprint = strong red blocked state,
- out-of-bounds and overlap remain domain validation truth,
- failed drop triggers a short board rejection response and never places the freight.

### READY state

When the last blocker clears, LOAD PLAN READY may briefly pulse.

The trailer rear frame and Close Doors control gain restrained positive emphasis so the commitment action becomes the natural next step without a modal.

### Rear-door commitment

Closing the doors remains the single commitment boundary.

The visual sequence is:

1. disable further puzzle interaction,
2. slide the trailer doors across the opening,
3. show brief LOAD PLAN LOCKED / SENDING TO WAREHOUSE feedback,
4. execute the existing commit callback,
5. exit Focused Mode,
6. resume the world in LOADING.

The animation is presentation only. Simulation remains paused during the visual commit.

### Performance

Idle Dock & Load should not run continuous expensive animation.

Motion is state-triggered by:

- hover,
- drag,
- rotate,
- invalid drop,
- ready transition,
- door commit.

Reduced-motion preferences disable nonessential animation.


---

## V2.7.5.0.5 — Cargo Interaction Polish

V2.7.5.0.4 proved the visual direction, but gameplay review exposed one remaining illusion break: during drag, the trailer temporarily read as a colored spreadsheet because the preview was drawn primarily as green/red floor cells.

V2.7.5.0.5 keeps the accepted puzzle model and changes only how that truth is presented.

### Physical drag preview

The board remains the hit-test and legality source of truth.

The player now sees the dragged freight itself positioned over the proposed floor location:

- the preview uses the freight's real rotated footprint,
- valid placement keeps the cargo material visible with restrained positive edging/glow,
- invalid placement keeps the same physical shape but shifts the whole object into a blocked red state,
- overlap may additionally stripe the specific occupied blocker cell,
- floor-cell feedback stays subtle so the cargo remains the primary visual object.

Out-of-bounds, overlap, capacity, rotation, and placement legality remain unchanged.

### Staged freight presence

Staged cargo is slightly larger and receives small physical details such as straps, wrap/tape cues, pallet feet, and material variation.

These are presentation details only.

### Placement weight

A successful drop may play a short lift/snap/settle response.

The response is event-driven and does not advance simulation time.

### Trailer label hierarchy

Placed freight always keeps the pallet identity readable.

Special descriptors such as OVERSIZE, NO STACK, and WRONG LOAD are secondary and stay collapsed until the player hovers or keyboard-focuses the placed cargo.

When another staged piece is actively being dragged, placed cargo becomes pointer-transparent so it cannot block trailer drop targets.

### Locked systems

This packet does not add or modify:

- stackability gameplay,
- fragile handling,
- height rules,
- axle or balance scoring,
- stop-order scoring,
- Top Down or Side View functionality,
- rework,
- delivery puzzle behavior,
- HOS logic,
- loading duration,
- route timing,
- trailer capacity,
- placement legality,
- READY validation,
- Close Doors commitment.


---

## V2.7.5.0.6 — Freight Loading

The Cargo Interaction pass made drag/drop feel physical, but gameplay review exposed a deeper problem: the freight still behaved like anonymous puzzle pieces. Load identity was too small, irregular footprints could imply impossible pallet geometry, VERIFY duplicated the act of loading, and a later pickup reopened an empty trailer even when the driver had already collected freight.

V2.7.5.0.6 promotes Dock & Load from a packing prototype to a persistent freight-loading system.

### Vertical staged-freight manifest

Staged freight is presented as one readable vertical manifest on the left.

Each row exposes, at normal gameplay scale:

- a recognizable cargo silhouette/material treatment,
- freight-unit identity,
- a prominent load number,
- handling marking,
- weight,
- destination,
- staged/onboard state,
- rotation affordance.

Completed current-pickup rows may fall below remaining staged freight, but their identity stays readable.

### Freight identity lives on the freight

The physical cargo is the primary gameplay object.

Every freight object displays its load number directly on the object. Handling information that may matter to placement is also printed visibly on the cargo rather than hidden in tiny secondary badges.

Tutorial cargo may visibly identify:

- STANDARD,
- FRAGILE,
- HAZMAT,
- HEAVY,
- KEEP UPRIGHT,
- NO STACK,
- OVERSIZE.

These markings are descriptive in this packet. Future handling-rule packets may attach consequences to them without redesigning the freight object.

Unrelated facility freight no longer announces WRONG LOAD before interaction. Its mismatching load number is the player's clue.

### Physically credible footprints

The puzzle keeps equipment-derived floor positions and deterministic footprint collision, but tutorial shapes must represent plausible freight.

Supported examples include:

- one-position pallet or crate,
- two-position long skid,
- two-position wide skid,
- rectangular machinery/crate block.

L-shaped pallet footprints are removed.

The game may still use different footprints for packing decisions, but the rendered cargo must plausibly explain the occupied footprint.

### Loading is verification

The separate VERIFY action is removed.

For the current pickup:

> correctly placing the booked freight in the trailer is the verification action.

Readiness therefore requires the booked pickup freight to be legally placed, with unrelated freight excluded and existing capacity/weight legality preserved. There is no second verification counter.

### Fast manipulation

Rotation is available while the freight is in hand:

- drag freight,
- press **R**,
- the active freight rotates under the same drag operation.

The visible rotate control may remain for discoverability, but keyboard rotation is the fast path.

Placed freight is also directly draggable. The player does not eject a unit to staging merely to move it to another trailer position.

Current-pickup cargo may be dragged back to that facility's manifest before commitment. Cargo inherited from an earlier pickup cannot be returned to an unrelated facility's staging area.

### Persistent trailer continuity

A committed pickup now records a complete trailer snapshot:

- freight manifest,
- placements,
- rotations embedded in placement state,
- equipment-derived board,
- validation result.

When a later pickup opens, Dock & Load reconstructs the driver's trailer from prior committed pickup snapshots.

Prior cargo:

- remains visible,
- occupies its real positions,
- contributes to occupied-floor and weight truth,
- blocks overlapping placements,
- may be repositioned inside the same trailer,
- remains onboard until its matching delivery occurs.

A completed delivery removes that load from the reconstructed onboard state before subsequent pickups.

This creates the operational invariant:

> the trailer seen at a facility is the trailer the driver actually arrived with.

### Locked systems

V2.7.5.0.6 does not add:

- fragile or hazardous-material penalties,
- stackability rules,
- vertical height simulation,
- axle/weight-balance scoring,
- stop-order accessibility scoring,
- Top Down or Side View functionality,
- delivery-side freight puzzles,
- facility rework,
- HOS changes.

Rear-door commitment, background loading duration, route timing, equipment capacity, and Focused Mode behavior remain unchanged.


---

## V2.7.5.0.6.1 — Cargo Readability + Reposition Fix

The first Freight Loading playtest confirmed trailer continuity and readable load-number identity, but exposed two implementation defects.

### Reliable onboard repositioning

Placed cargo is intended to remain directly draggable. The previous drag-preview CSS made every loaded freight object pointer-transparent as soon as a drag began, including the source piece. That rule was inherited from the staging-only interaction model.

V2.7.5.0.6.1 corrects the interaction boundary:

- the actively dragged onboard cargo remains an interactive drag source,
- other loaded cargo may become pointer-transparent during that drag,
- the trailer surface owns drag-over and drop resolution,
- the hovered floor cell is resolved underneath visible cargo,
- moving freight therefore continues to work in a crowded trailer and when shifting a piece near its prior footprint,
- placement legality still comes from the existing footprint/collision domain.

### Stronger freight silhouettes

The V2.7.5.0.6 data distinctions were readable in text but too visually similar in the trailer.

V2.7.5.0.6.1 adds a second presentation layer driven by handling class:

- STANDARD keeps the familiar warm wrapped-pallet language,
- FRAGILE uses visibly braced crate treatment,
- HEAVY uses a darker industrial skid treatment and strong load band,
- HAZMAT uses steel/drum language with a regulated warning band,
- KEEP UPRIGHT uses cooler directional striping,
- NO STACK uses a pale wrap plus repeated warning bands,
- OVERSIZE uses industrial steel/hazard-edge treatment.

These treatments are visual identity only. No new handling penalties, hazmat rules, stack rules, or balance simulation are introduced.

The goal is:

> before reading the label, the player should already have a strong clue what kind of freight they are looking at.


---

## V2.7.5.1 — Trailer Rules Foundation: Delivery Access

The freight-loading interaction is now visually accepted enough to begin making placement quality matter. The first trailer rule is unload accessibility.

### Driver Day owns unload order

Dock & Load does not invent a separate delivery sequence.

For every pickup workspace, DOC OS reads the driver's remaining Driver Day timeline and derives the delivery order for freight that will be onboard after this pickup:

- D1 = next load scheduled to deliver,
- D2 = following delivery,
- D3 = next after that,
- and so on.

Only loads represented by the current trailer freight set participate.

This preserves the invariant:

> the trailer puzzle reasons about the same stop order the dispatcher already planned.

### Rear-door access abstraction

The existing trailer board is a 2D floor model. V2.7.5.1 deliberately does not pretend to simulate full forklift geometry.

Rows run:

**FRONT / NOSE → REAR / DOORS**

Columns act as simplified trailer lanes.

For any two loads sharing a lane:

- lower delivery rank means the freight must unload earlier,
- earlier-delivery freight may sit rearward of later freight,
- later-delivery freight may not sit farther rearward than earlier freight in the same lane,
- if it does, that later freight blocks rear-door access to the earlier load.

The rule evaluates the real occupied footprint of each freight object, including long/wide/oversize rectangular cargo.

### Player-owned correction

Delivery-access failure does not reject the drop.

The player may create a bad load plan. DOC OS then explains the problem:

- earlier blocked freight receives a blocked treatment,
- later freight physically causing the conflict receives a blocker treatment,
- onboard cargo shows D1 / D2 / D3 delivery-order badges,
- the right-side rule card shows the unload sequence,
- the rule card reports CLEAR or BLOCKED,
- drag preview may turn amber when the proposed placement creates an unload-order conflict.

Red remains reserved for geometric illegality such as overlap or out-of-bounds placement.

### Readiness

Trailer readiness now requires:

- booked freight placed,
- no unrelated staged freight loaded,
- no overlap,
- no out-of-bounds footprint,
- legal trailer weight,
- delivery access clear.

A delivery-access conflict produces DELIVERY_ACCESS_BLOCKED and keeps the rear-door commit control locked.

### Persistent cargo matters

Because prior pickup cargo remains physically onboard, later pickups can force the player to reorganize earlier loads.

Example:

- M-101 is already onboard,
- Queens adds M-202,
- Driver Day says M-101 delivers before M-202,
- any M-202 freight placed behind M-101 in the same lane blocks D1 access,
- the player may reposition either load until M-101 has a clear rear-door path.

That is the first point where trailer continuity becomes a strategic gameplay constraint rather than visual persistence.

### Non-goals

This packet does not add:

- axle calculations,
- front/rear or left/right weight-balance scoring,
- fragile separation,
- hazardous-material compatibility,
- no-stack enforcement,
- keep-upright enforcement,
- heavy-low/forward rules,
- vertical stacking,
- full forklift pathfinding,
- delivery unloading puzzle,
- service-time changes,
- HOS changes.

The next trailer-rule slice after playtest acceptance is weight distribution / balance.


---

## V2.7.5.1.1 — Rotation + Rule-Panel Readability

Gameplay review of the accepted Delivery Access rule showed that the rule itself works, but two interaction/presentation problems remain before adding weight balance.

### Rotation must not depend on native drag state

The earlier control expected the player to begin a browser-native drag and then press **R** while holding the mouse button. That is a fragile interaction and is not the primary rotation path going forward.

Placed rotatable freight now supports:

- hover or keyboard focus the freight,
- press **R**,
- the freight rotates 90 degrees around its current anchor if the new footprint is geometrically legal.

Rotatable placed freight also exposes a visible **↻ R** control on hover/focus.

The rotate control and hover/focus shortcut both use the same placement legality truth:

- the piece may rotate when the new footprint remains inside the trailer and does not overlap other freight,
- an invalid in-place rotation is rejected,
- existing invalid interaction feedback is shown,
- delivery-access consequences are allowed to update after a geometrically legal rotation rather than preventing the rotation.

Pressing **R** during an active drag may remain supported as an additional fast path, but it is not required.

Square freight does not show a meaningless rotation affordance when a 90-degree turn would produce the same footprint.

### Cargo delivery badges become contextual

D1 / D2 / D3 badges are useful when multiple delivery sequences coexist in the trailer and become visual noise when every item is D1.

Therefore:

- individual onboard freight displays delivery-order badges only when more than one delivery is represented,
- single-delivery trailers omit redundant D1 cargo badges,
- the right-side Delivery Access rule card may still show the single unload-order entry.

### Right-side HUD hierarchy

The right-side panel is operational guidance and must be readable at normal desktop viewing distance.

V2.7.5.1.1 raises the text hierarchy and separates concepts:

**LOAD COMPLETION**
- current pickup loaded count,
- trailer occupancy,
- trailer weight,
- onboard unit count.

**DELIVERY ACCESS**
- CLEAR / BLOCKED state,
- readable UNLOAD ORDER,
- when blocked: a distinct PROBLEM statement,
- when blocked: a distinct FIX statement,
- when clear: a readable explanation of why access is acceptable.

A trailer may be fully loaded while Delivery Access is blocked. The UI must represent those as two separate truths rather than calling the loading task itself incomplete.

### Locked behavior

This patch does not change:

- delivery-access lane logic,
- persistent carried cargo,
- footprint geometry,
- weight capacity,
- rear-door commitment,
- warehouse loading duration,
- route timing,
- handling penalties.

The next trailer-rule slice remains V2.7.5.2 Weight Distribution / Balance.


---

## V2.7.5.1.2 — Right Panel Hierarchy Polish

Gameplay screenshots after the rotation/readability pass confirmed that text size was no longer the primary problem. The remaining issue was structural: the right panel still behaved like several independent status/debug boxes competing for vertical space.

At partial loads, critical warnings such as REQUIRED FREIGHT NOT PLANNED could collapse into a thin strip. At completed loads, the same panel could leave large dead areas and repeat information already visible elsewhere.

V2.7.5.1.2 reorganizes the right-side panel without changing trailer-rule behavior.

### Load Summary

The first section owns only the current load identity and route:

- load number,
- pickup,
- destination,
- expected units and weight,
- freight already onboard from earlier loads.

Driver identity is already visible in the focused workspace title. Trailer identity/capacity is already visible in the trailer heading. Those duplicate rows are removed from this panel.

### Load Completion

Current-pickup progress becomes a dedicated section:

**LOAD COMPLETION — X / Y LOADED**

A simple progress bar reinforces the count.

This section is the single source of truth for how much of the current pickup has been loaded. The old duplicate THIS PICKUP status tile is removed.

### Trailer Status

Trailer Status owns total physical occupancy:

- floor positions used / available,
- current trailer weight / trailer limit,
- total onboard units.

These values describe the whole trailer, including carried freight and current-pickup freight.

### Trailer Rules

Trailer Rules is a dedicated section intended to scale as future rules are added.

Delivery Access remains the first rule card and retains:

- CLEAR / BLOCKED state,
- unload order,
- STATUS when clear,
- PROBLEM and FIX when blocked,
- existing readiness gating.

Future Weight Distribution / Balance should be added as another rule card in this section rather than inventing a new panel hierarchy.

### Required Action

Critical action guidance receives guaranteed readable space.

Examples:

- “5 M-202 units still need to be loaded.”
- geometry/overlap/out-of-bounds correction,
- wrong-load correction,
- overweight correction,
- “Fix Delivery Access.”

The panel may scroll when necessary. Critical actions must never be compressed into a narrow unreadable strip merely to keep all sections visible at once.

When the entire load plan is valid, Required Action becomes:

**READY TO CLOSE**

with a compact confirmation that booked freight is loaded and current trailer rules are satisfied.

This replaces the redundant standalone LOAD PLAN READY card.

### Focused Mode duplication removed

The right-panel Focused Mode footer is removed.

Focused Mode and gameplay pause state remain visible in the top bar and focused workspace heading, so repeating the same information at the bottom of the operational panel adds noise without improving comprehension.

### Locked behavior

This packet does not change:

- freight geometry,
- drag/drop,
- rotation,
- persistent cargo,
- delivery-access calculation,
- trailer weight capacity,
- rear-door commit,
- loading duration,
- route timing,
- handling penalties.

The next planned trailer-rule slice remains V2.7.5.2 Weight Distribution / Balance.


---

## V2.7.5.2 — Trailer Rules: Weight Distribution / Balance

Dock & Load now has stable freight interaction, persistent cargo, Delivery Access, and a readable right-side rule hierarchy. The next gameplay layer is simplified load balance.

This is intentionally **not** a DOT axle-weight simulation.

### Weight truth

Each placed freight unit contributes its actual modeled freight weight.

For multi-position freight, that weight is distributed evenly across every occupied floor cell. This means long skids, wide skids, and machinery crates affect balance according to their real puzzle footprint rather than only their anchor cell.

The trailer floor is evaluated on two axes:

- FRONT / REAR,
- LEFT / RIGHT.

A center-row floor cell contributes equally to front and rear. A center-column cell, on equipment layouts that have one, contributes equally to left and right.

### Target band

A trailer is considered acceptably balanced when each side of an axis carries between **35% and 65%** of the modeled freight weight.

Examples:

- 52% front / 48% rear = balanced,
- 64% left / 36% right = balanced,
- 72% front / 28% rear = FRONT HEAVY,
- 30% left / 70% right = RIGHT HEAVY.

The tolerance is deliberately broad. The goal is to prevent obviously bad loading patterns, not to impersonate a certified scale or axle calculation.

### Light-load activation

Weight distribution becomes an enforceable rule only after planned onboard freight reaches **20% of the trailer's rated freight capacity**.

For a 44,000 lb freight rating, the activation threshold is 8,800 lb.

Below that threshold:

- the card reports LIGHT LOAD,
- distribution remains visible,
- imbalance does not block readiness.

This prevents one- or two-pallet loads from becoming artificial balance puzzles.

### Live monitoring vs. enforcement

While the current pickup is still incomplete:

- the weight card updates live,
- Trailer Rules may report MONITORING,
- the player can see where the balance is trending,
- imbalance by itself does not add a readiness error yet.

Once all booked freight for the current pickup is placed:

- an active in-band load reports BALANCED,
- an active out-of-band load reports ADJUST,
- the specific condition may be FRONT HEAVY, REAR HEAVY, LEFT HEAVY, RIGHT HEAVY, or a combination,
- Required Action surfaces a directional correction,
- rear-door commitment remains locked until the balance is corrected.

This avoids punishing the player halfway through a load while still making the completed arrangement matter.

### Right-panel presentation

Weight Distribution is the second card in **TRAILER RULES**, directly below Delivery Access.

The card shows:

- status: LIGHT LOAD / MONITOR / BALANCED / ADJUST,
- target: 35–65% per side,
- live FRONT / REAR percentages,
- live LEFT / RIGHT percentages,
- visual split bars,
- STATUS while valid,
- LIVE PREVIEW while still loading,
- PROBLEM + FIX when enforceably unbalanced.

The top-level Trailer Rules state becomes:

- ALL CLEAR,
- MONITORING,
- ACTION NEEDED.

Delivery Access and Weight Distribution remain independent rules.

### Gameplay consequence

A player can no longer load every heavy piece into the nose or stack nearly all freight down one side and still receive READY.

The player must now solve for:

1. freight identity,
2. physical fit,
3. delivery accessibility,
4. weight distribution.

At multi-pickup facilities, carried freight from earlier stops participates in the same balance calculation, so a new pickup may require reorganizing existing cargo.

### Non-goals

V2.7.5.2 does not add:

- certified DOT compliance,
- steer/drive/trailer axle calculations,
- kingpin position,
- sliding tandems,
- scale tickets,
- legal axle-limit enforcement,
- cargo height/center-of-gravity simulation,
- vertical stacking,
- hazardous-material compatibility,
- fragile separation,
- keep-upright enforcement,
- no-stack enforcement,
- delivery unloading puzzle,
- service-time changes,
- HOS changes.

The next planned trailer-rule layer after playtest acceptance is handling restrictions.


---

## V2.7.5.3 — Handling Restrictions: Fragile Protection

This packet introduces the first active handling restriction without turning every freight label into a rule at once.

**Rule:** FRAGILE freight may not share an edge with HEAVY or OVERSIZE freight.

The rule is footprint-aware, diagonal contact is permitted, and it uses the same placed-cargo truth as fit, delivery access, and balance.

While the current pickup is incomplete, Fragile Protection is monitored live. Once all booked freight is onboard, any unresolved conflict becomes enforceable and prevents READY TO CLOSE.

The Trailer Rules panel adds a dedicated Fragile Protection card and conflicting freight receives visual emphasis so the player can identify what must move.

HAZMAT, NO STACK, and KEEP UPRIGHT remain descriptive only in this packet.


---

## V2.7.5.3.1 — Trailer HUD Simplification

Gameplay review after Fragile Protection confirmed that the trailer puzzle itself is strong, but the right-side HUD had become over-instrumented. Every healthy rule was rendering its own status color, explanation, target, bars, and confirmation copy at once.

The result was mechanically correct but visually noisy.

### Progressive disclosure

Trailer Rules now follow one presentation rule:

> healthy rules collapse; only the rule that needs action expands.

Normal rule rows show only the information needed to scan state quickly.

**Delivery Access**
- status,
- unload order.

**Weight Balance**
- status,
- F/R percentage split,
- L/R percentage split,
- one short contextual note.

**Fragile Protection**
- status,
- one short spacing summary.

When a rule becomes an actual blocker, that row expands to reveal PROBLEM and FIX detail.

### Color hierarchy

The HUD now treats color as meaning rather than decoration.

- neutral/muted = healthy normal state,
- cool neutral = live/incomplete monitoring,
- red = completion blocker,
- green = final READY TO CLOSE state only.

A completed subsystem does not turn green simply because it is healthy.

### Removed persistent detail

The normal HUD no longer continuously renders:

- weight-distribution split bars,
- the 35–65 target banner,
- healthy weight explanation cards,
- the fragile rule-definition box,
- healthy Fragile Protection explanation cards,
- duplicate rule-fix cards in Required Action,
- duplicate Trailer Plan Complete success messaging.

Those mechanics remain fully active; only their always-on explanation is removed.

### Compact trailer status

Trailer Status becomes one readable line:

- occupied / available positions,
- current / maximum freight weight,
- onboard units.

This removes another stacked section without losing information.

### Required Action

Required Action now distinguishes normal workflow from actual failure.

While freight is still missing:

**LOAD REMAINING FREIGHT**

is a neutral pending instruction.

When the pickup is complete but trailer rules are blocked, Required Action summarizes that rule issues remain while the expanded rule rows above explain the actual fix.

### Final readiness

Final success is represented once:

**READY TO CLOSE**

with a short confirmation that freight is loaded and trailer rules are clear.

Green is reserved for this final state.

### Locked mechanics

This packet does not change:
- Delivery Access math,
- Weight Balance thresholds or enforcement,
- Fragile Protection logic,
- freight geometry,
- persistent cargo,
- rotation,
- loading time,
- rear-door commitment,
- route timing.


---

## V2.7.5.4 — Handling Restrictions: HAZMAT Segregation

This packet activates HAZMAT as a class-specific handling mechanic while keeping the simplified Trailer HUD intact.

### Why class-specific

HAZMAT is not treated as one universal incompatibility category.

The tutorial freight subset assigns visible hazard classes so the player can make a real classification-based decision rather than memorizing a generic “hazmat cannot touch anything” rule.

The first tutorial subset uses:

- **Class 3 — Flammable Liquid**
- **Division 5.1 — Oxidizer**

The load generator assigns a deterministic class by load reference so carried freight retains the same hazard identity across facilities.

### Tutorial segregation abstraction

For this first slice, Class 3 and Division 5.1 form the only active segregation pair.

The real highway segregation model is more detailed than the 2D puzzle. DOC OS therefore uses a deliberately simplified spatial abstraction:

> incompatible tutorial HAZMAT classes may not share a trailer-floor edge.

Diagonal contact is allowed by the current floor model.

This rule is intended to teach that hazardous-material compatibility is **class-specific**. It does not claim to replace regulatory segregation tables, packaging requirements, placarding, shipping papers, or carrier compliance procedures.

### Freight readability

HAZMAT freight shows the class directly on the physical cargo:

- HAZMAT 3
- HAZMAT 5.1

The staging manifest also exposes the class meaning, such as FLAMMABLE LIQUID or OXIDIZER.

This identity persists in the committed trailer snapshot and remains readable at later pickup stops.

### Enforcement timing

While the current pickup is incomplete:

- HAZMAT SEGREGATION reports LIVE,
- the player may continue loading,
- an incompatible placement does not yet add a readiness error.

Once all booked freight is onboard:

- separated incompatible classes report SEPARATED,
- edge-adjacent incompatible classes report SEPARATE,
- conflicting pieces receive a restrained visual emphasis,
- the rule expands with PROBLEM / FIX guidance,
- READY TO CLOSE remains locked until the conflict is corrected.

### HUD preservation

HAZMAT SEGREGATION is a fourth compact row inside Trailer Rules.

The row follows the V2.7.5.3.1 progressive-disclosure contract:

- healthy = collapsed,
- live = neutral,
- blocked = expanded,
- no new permanent chart or rule-definition card.

The right-side HUD also receives the accepted one-notch typography increase without changing its width or structure.

### Non-goals

This packet does not add:

- a complete 49 CFR segregation matrix,
- additional hazardous-material classes,
- placarding,
- shipping-paper validation,
- packaging-group logic,
- loading/unloading certification,
- NO STACK enforcement,
- KEEP UPRIGHT enforcement,
- vertical stacking,
- axle calculations,
- delivery puzzle,
- HOS changes.


---

## V2.7.6 — Delivery Operations

Delivery is the operational counterpart to Dock & Load, but it is not implemented as a reversed pickup puzzle.

Pickup asks which freight belongs on the truck and how it should be arranged.

Delivery asks whether the correct physical freight can be removed, accepted, and documented from the trailer state that actually survived pickup and transit.

### Persistent trailer truth

The delivery workspace never generates a new delivery inventory.

It reconstructs the trailer from committed facility snapshots:

- freight IDs,
- load identity,
- cargo/handling identity,
- trailer placements,
- retained carried freight.

The matching pickup event remains the source of the expected freight-unit identities. Delivery validation compares that expected set with the actual trailer set by ID rather than relying on pallet count alone.

### Facility gate

A delivery appointment no longer flows directly into automatic unloading.

When the driver reaches service time:

**DOCK ASSIGNED**

holds the live route.

The driver remains at the receiver until the dispatcher opens **Dock & Delivery**, solves the unload plan, and commits it.

Focused Mode pauses world time while the player reasons.

### Delivery workspace

The focused layout presents:

- the physical trailer as packed,
- the current receiver,
- expected count,
- actual freight on trailer,
- selected unload freight,
- blocked freight,
- temporary staging,
- unload-plan readiness.

Rear doors animate open when the workspace appears. Opening the doors reveals the consequences of the pickup plan.

The player selects the actual current-stop freight rather than clicking a separate verification control.

### Rear-door accessibility

Accessibility is derived from the physical trailer grid.

Freight closer to the rear doors can block current-stop freight in the same trailer lane.

The unload evaluator computes a valid sequence by repeatedly removing current-stop freight that has no remaining rearward blocker.

If later-stop freight blocks the current delivery, that freight may be temporarily staged.

### Temporary staging and rehandles

Temporarily staged later-stop freight is removed from the working trailer plan while the current delivery is unloaded, then retained in the resulting trailer snapshot.

Each temporarily staged freight unit counts as a rehandle and adds operational unload time.

The first timing model uses:

- scheduled delivery service time as base unload time,
- +3 minutes per temporarily staged unit,
- +3 minutes for receiver verification.

These values are gameplay timing abstractions and can be tuned later by facility/skill systems.

### Commit and background operation

A valid unload plan commits through the Receiving Dock interaction.

Commit:

- closes Focused Mode,
- begins simulated UNLOADING,
- keeps Marcus at the receiver,
- runs rehandle-adjusted service time,
- transitions into RECEIVER CHECK,
- then allows automatic route continuation.

No manual DEPART action is required for a clean delivery.

### Trailer after delivery

Accepted freight is removed from the physical trailer state.

The delivery operation stores a **trailerAfter** snapshot containing the freight and placements that remain onboard.

Later pickup and delivery facilities consume this explicit snapshot when available.

This is important for future exception work because refused freight can remain physical cargo rather than being deleted merely because a delivery event occurred.

### Receiver verification — first active scope

The first delivery slice resolves correctly delivered freight as:

**ACCEPTED**

No random refusal or damage is injected.

The domain already keeps individual receiver results so later delivery packets can add:

- ACCEPTED_WITH_DAMAGE,
- REFUSED,
- SHORT,
- WRONG_DESTINATION,
- NOT_DELIVERED.

### POD ownership

POD data belongs to the Documents domain, not to the delivery facility operation.

On delivery commit, Documents creates:

**PENDING_RECEIVER**

After receiver verification time is complete:

- a clean POD becomes **RECEIVED**,
- future exception outcomes may become **REVIEW_REQUIRED**.

The delivery operation stores only a document reference.

The Documents workstation UI remains in its existing build phase; V2.7.6 establishes the authoritative data relationship so it does not need to be retrofitted later.

### Exception philosophy

V2.7.6 does not create arbitrary delivery failures.

Shortage detection is already based on expected freight IDs minus actual trailer freight IDs.

Wrong-delivery selection is rejected by load identity.

Damage/refusal generation is intentionally deferred until there is a traceable causal source.

### Locked time philosophy

**Thinking does not consume simulation time. Operations do.**

The player may inspect and plan the delivery indefinitely while Focused Mode is open.

Once the unload plan is committed, operational time resumes and the driver remains at the facility for the real simulated work.


---

## V2.7.6.1 — Physical Delivery Unload

Gameplay review of the first Delivery Operations implementation found that the underlying architecture worked, but the interaction layer did not.

The first screen exposed a per-unit UNLOAD PLAN list on the right. Because the list already identified every correct freight unit, the player could ignore the trailer and click through the answers. Persistent trailer state was visible, but it was not the actual game surface.

V2.7.6.1 corrects that.

### Primary player verb

Pickup uses:

**PLACE**

Delivery now uses:

**REMOVE**

The player interacts directly with physical freight in the trailer and drags it through the rear-door side into the receiver's **Receiving Bay**.

The right side is no longer a selectable freight checklist.

### Information given to the player

At the receiver, DOC OS provides:

- receiver/facility identity,
- load reference,
- expected unit count,
- expected weight,
- received unit count,
- rehandle count.

The physical load markings on cargo remain the clue for deciding which freight belongs at the stop.

DOC OS does not permanently list the correct units for the player.

### Immediate accessibility

The delivery domain now distinguishes between:

- freight that can physically exit through the rear doors **right now**,
- delivery freight currently blocked,
- the exact active freight causing that immediate blockage.

Accessibility recalculates after every unload and every temporary rehandle.

A unit farther toward the trailer nose may become accessible only after a rearward unit leaves.

### Discovery before explanation

The game does not announce every blocked unit in advance.

When the player attempts to drag an inaccessible delivery unit into Receiving:

1. the drop is rejected,
2. the attempted freight is highlighted,
3. the physical blocking freight is highlighted,
4. contextual text explains what is closer to the rear doors.

This keeps the first task spatial: read the trailer.

### Same-stop blocker

If the blocker belongs to the same receiver, the fix is simply to unload the blocking delivery unit first.

That creates a natural extraction sequence without requiring a separate sequence UI.

### Later-stop blocker

If freight for a later delivery blocks the current delivery, the player may drag that blocker into **Temporary Staging**.

Temporary Staging:

- removes the blocker from the working trailer,
- opens access for the current delivery,
- records one rehandled unit,
- represents two handling moves,
- adds +3 minutes of simulated service time,
- automatically reloads that freight into its original trailer position when the delivery plan commits.

Dragging an unrelated later-stop unit to staging when it is not needed is rejected.

### Receiving Bay

The Receiving Bay is a physical drop destination.

Successfully extracted freight appears there as received units, preserving the feeling that cargo actually moved out of the trailer.

The bay shows progress such as:

**3 / 6 RECEIVED**

rather than presenting six SELECT buttons before the interaction begins.

### Handoff

Once all expected actual freight has been physically extracted:

**CONFIRM HANDOFF**

becomes available.

This preserves the V2.7.6 time philosophy:

- the focused drag interaction represents the unload sequence/plan,
- Focused Mode itself consumes no world time,
- Confirm Handoff begins simulated warehouse unloading,
- rehandles influence service duration,
- receiver verification follows,
- routine clean delivery auto-departs.

### Preserved sequence data

The committed delivery operation now stores the physical unload sequence.

This provides a future input for:

- operational efficiency,
- rehandle scoring,
- Freight Operations XP,
- facility performance,
- authored exceptions.

### Removed interaction pattern

The following V2.7.6 presentation is no longer authoritative:

- right-side per-unit SELECT list,
- selecting all freight without touching the trailer,
- permanent BLOCKED count as primary guidance,
- always-visible answer-state highlighting.

### Known Live Operations UX backlog

Observed during the same gameplay review but intentionally deferred:

1. **Schedule send access** — SEND SCHEDULE is currently coupled to Planning state. A later Live Operations UX pass should expose a normal-workflow way to dispatch/send the completed plan.
2. **Advance to next operational moment** — current fast-forward requires the player to sit through idle time. A later time-control pass should add an Advance to Next Event / Next Operational Moment action.

These are recorded issues, not part of the V2.7.6.1 delivery interaction scope.


---

## V2.7.6.2 — Receiving Floor Protocol

V2.7.6.1 correctly moved Delivery back onto the physical trailer, but gameplay review showed that physically dragging freight into one generic Receiving Bay still did not create enough decision-making.

V2.7.6.2 keeps physical unloading and adds the missing second half of the puzzle: **receiver procedure**.

### Core scene

The delivery workspace is now one continuous dock scene:

**Receiving Floor ← Dock Threshold ← 53' Trailer**

The player should immediately recognize the trailer as the same physical equipment used during Pickup.

The trailer visualization restores:

- nose cap,
- side walls,
- rear frame,
- opening doors,
- floor grid,
- wheels/chassis cues,
- the exact committed freight positions.

The facility floor sits directly beside the rear doors so unloading is visually a move from truck to receiver rather than from a grid into a dashboard.

### Receiver-specific SOPs

Delivery sequence is driven by fictional facility receiving procedures created for DOC OS gameplay.

They are not universal transportation or warehouse requirements.

For the first Harborline scenario:

1. **CONTROLLED FREIGHT**
   - destination: **CONTROLLED RECEIVING**
   - applies to: HAZMAT freight

2. **FORKLIFT HANDLING**
   - destination: **FORKLIFT LANE**
   - applies to: HEAVY and OVERSIZE freight

3. **FRAGILE INSPECTION**
   - destination: **INSPECTION**
   - applies to: FRAGILE freight

4. **GENERAL RECEIVING**
   - destination: **GENERAL RECEIVING**
   - applies to remaining delivery freight

Freshway uses a different sequence, establishing that the rule belongs to the receiver rather than the freight category globally.

### Delivery decision loop

Every freight move now asks three simultaneous questions:

1. **Sequence** — is this freight valid in the facility's current receiving phase?
2. **Access** — can this physical unit reach the rear doors from its trailer position?
3. **Destination** — is the player sending it to the correct receiving zone?

A successful delivery move must satisfy all three.

### Phase progression

The receiver opens one phase at a time.

A phase displays:

- handling phase name,
- receiving destination,
- units received,
- units required,
- short facility instruction.

Later phases remain visible but inactive.

When all units assigned to the current phase arrive in its correct zone, the next phase opens automatically.

### Wrong sequence

If the player attempts to send later-phase freight while an earlier phase is still active, the receiver rejects it.

The feedback states which phase must be completed first and which facility zone the attempted freight belongs to later.

This creates operational order without relying on a hidden score.

### Wrong receiving area

Current-phase freight sent to the wrong facility zone is rejected.

For example, Harborline HAZMAT freight belongs in Controlled Receiving during the Controlled Freight phase.

This is a facility-gameplay rule, not a universal HAZMAT unloading requirement.

### Access and rehandling

Rear-door access remains physical.

If current-phase freight is buried:

- the move is rejected,
- the target and physical blocker are highlighted,
- the player must decide what must move.

A blocker can be:

**Another load**
- move it to Temp Staging if it is genuinely blocking access,
- it returns to its original trailer position after the delivery.

**Same delivery, later receiving phase**
- move it to Temp Staging,
- once that facility phase opens, the staged freight may move directly from Temp Staging into its receiving zone.

This makes receiver sequence capable of creating real rehandles even within one delivery.

### Rehandle accounting

Every unique freight unit placed in Temp Staging counts as:

- one rehandled unit,
- two handling moves,
- +3 minutes simulated delivery service time.

The freight history records the temporary staging event.

If that staged freight is later delivered at the same receiver, its delivery history also records the final receiving zone.

### Physical receiving zones

The facility floor visually contains the zones defined by the protocol.

Received freight accumulates in those physical areas instead of disappearing into one generic counter.

The player therefore sees two changing spaces:

- the trailer progressively empties,
- the receiving floor progressively fills.

### Drag reliability

Physical drag remains the intended interaction.

A click-selection fallback also exists:

1. click the physical freight unit,
2. click its receiving zone or Temp Staging.

This exists only to avoid browser/native drag quirks blocking gameplay testing; it does not reintroduce the old freight checklist.

### Facility SOP panel

The right panel no longer lists the freight answers.

It shows:

- receiver identity,
- Expected / Received / Rehandles,
- the ordered facility phases,
- current phase,
- required destination zone,
- contextual interaction feedback,
- Confirm Handoff.

The physical cargo markings remain the primary clue for deciding which trailer freight matches the current phase.

### Pickup consequence

This system strengthens the connection between Pickup and Delivery.

If the player packed freight in an order compatible with the destination's receiving procedure, the delivery can be nearly rehandle-free.

If current-phase freight is buried behind later-phase or later-stop freight, Delivery exposes that mistake as operational handling cost.

Future planning/tutorial work should surface receiver SOP information before Pickup so skilled players can plan for it intentionally rather than learning it only after arrival.

### Completion

Confirm Handoff unlocks only after:

- every expected actual freight unit has been physically removed,
- facility phase order is valid,
- each freight unit was received into its assigned facility zone.

The existing V2.7.6 background sequence remains unchanged:

**Confirm Handoff → UNLOADING → RECEIVER CHECK → routine automatic departure**


---

## V2.7.6.3 — Pointer Freight Handling + Warehouse Floor

Gameplay review of V2.7.6.2 confirmed that the delivery decision model was moving in the right direction, but two interaction problems remained:

1. native browser drag did not reliably feel like grabbing and moving freight,
2. the facility floor still visually read as a dashboard because the receiving areas were presented as large rectangular cells.

V2.7.6.3 keeps the V2.7.6.2 receiving logic and replaces those two presentation layers.

### Pointer-owned freight movement

DOC OS now owns freight movement directly with pointer events.

The delivery workspace no longer relies on browser HTML drag/drop for its main interaction.

When the player presses a freight unit:

- the freight lifts from its origin,
- the original unit dims in place,
- a floating freight representation follows the pointer,
- the floor area under the cursor is detected continuously,
- eligible facility areas react beneath the carried freight.

On release:

- the existing delivery rule engine evaluates the destination,
- a valid move settles the freight into that facility area,
- an invalid move returns the freight to its original position.

The visual return is intentionally immediate and physical so an invalid action feels like a rejected warehouse move rather than a form validation error.

### Click fallback

Click-selection remains available:

1. click freight,
2. click the intended facility area.

This is a fallback/accessibility path, not the primary visual interaction.

### Continuous warehouse environment

The receiving side is one room rather than a set of cards.

The warehouse floor now uses:

- continuous concrete-style floor texture,
- painted operating boundaries,
- aisle markings,
- dock apron markings,
- hazard-pattern controlled area,
- forklift traffic lane cues,
- inspection station cues,
- general pallet-receiving markings.

The mechanical zones still exist in the DOM for hit testing, but they are presented as locations in the environment rather than dashboard panels.

### Floor layout

The first warehouse layout places:

- **Controlled Receiving** as a marked controlled-material floor area,
- **Forklift Lane** as a traffic/handling area,
- **Inspection** as a smaller check station,
- **General Receiving** as the largest pallet staging area,
- **Temp Staging** along the dock apron.

The right-side Facility SOP HUD remains the authoritative text explanation of the active receiver phase.

### Trailer prominence

The trailer remains a full physical object and receives more of the scene width.

The dock connection is reduced to a narrow physical bridge between the rear doors and warehouse apron.

The visual relationship should read as:

**warehouse floor ← dock bridge ← open trailer**

rather than:

**UI column | separator | UI column**

### Rule preservation

No delivery mechanics change in V2.7.6.3.

The following V2.7.6.2 rules remain authoritative:

- receiver-specific phase order,
- correct-zone validation,
- physical rear-door accessibility,
- later-phase and later-stop temporary rehandles,
- +3 minutes per rehandled unit,
- persistent unload sequence,
- receiving-zone history,
- trailerAfter persistence,
- Confirm Handoff → background unloading → receiver check → auto-depart.

### Interaction goal

The feel target is:

> When the player grabs a freight unit, it should feel like they grabbed something out of the trailer and carried it onto a warehouse floor.

Visual acceptance should specifically verify:

- freight follows the pointer smoothly,
- active floor areas react under the carried freight,
- invalid release visibly returns to origin,
- the warehouse reads as one physical environment,
- the trailer remains visually dominant enough to read immediately,
- the right panel stays secondary to the physical workspace.


---

## V2.7.6.4 — Delivery Space Management

V2.7.6.3 established two useful directions: freight should be physically manipulated with pointer-owned movement, and the receiver should read as one continuous warehouse environment. Gameplay review still exposed three structural weaknesses:

1. freight lost its physical identity after entering the receiver floor,
2. Temp Staging acted as an effectively unlimited escape hatch,
3. Delivery could not use open trailer space to solve access problems.

A fourth visual continuity problem was also identified: the Delivery trailer had drifted away from the proportions of the Pickup trailer.

V2.7.6.4 addresses all four together as one space-management packet.

### Core puzzle

Delivery is now defined as management of three connected physical spaces:

**Trailer Floor → Dock / Temp Staging → Receiver Floor**

The player is not simply deciding which freight to unload. The player decides where blockers should go while maintaining receiver sequence and rear-door access.

Valid actions are:

- unload to the active receiver area,
- reposition inside the trailer,
- temporarily stage outside the trailer.

The intended expertise progression is that a strong player uses the trailer's available space intelligently and relies on external staging only when genuinely necessary.

### Exact Pickup trailer continuity

Delivery must not maintain a separately tuned trailer shell.

The Delivery trailer must use the same visual system and proportions as Pickup.

The safest architecture is one shared trailer-shell presentation consumed by both modes.

The shared shell owns:
- 53' dry-van silhouette,
- width,
- wall thickness,
- nose treatment,
- rear door frame,
- floor dimensions,
- floor-cell scale,
- relative freight scale,
- overall body proportions.

Pickup and Delivery may add mode-specific overlays and interactions around this shared shell, but may not independently reshape it.

The result should feel like the same physical trailer traveled from Pickup to Delivery.

### Internal trailer repositioning

Delivery can now rearrange freight inside the trailer.

A trailer-to-trailer move:
- starts from the current working placement,
- previews the freight footprint over candidate cells,
- checks collision and floor legality,
- commits to the new placement on a valid release,
- snaps back to the previous placement on an invalid release.

The current Delivery trailer state becomes mutable during the focused interaction.

Rear-door accessibility is recalculated against the working placements after every successful reposition.

This creates a new solution path:

> Move the blocker deeper or sideways inside the trailer rather than automatically removing it to the dock.

Internal repositioning uses Pickup's proven footprint and placement concepts but does not restart Pickup's load-completion rule set.

### Limited Temp Staging

Temp Staging is a physical resource.

Initial staging capacity is **3 pallet-equivalent floor cells**.

Freight consumes staging cells by footprint:

- 1×1 = 1 cell,
- 1×2 / 2×1 = 2 cells,
- 2×2 = 4 cells.

A 2×2 unit therefore cannot fit into a three-cell staging area.

This is intentional: some blockers must be solved by trailer repositioning rather than being dumped onto the dock.

The staging area visibly renders its limited positions and occupied cells.

Staging rules:
- freight must fit in available staging cells,
- overlap is impossible,
- full staging rejects another move,
- staged freight can later move to the trailer or receiver,
- later-phase same-delivery freight may be staged when it physically blocks the current phase,
- later-stop freight may be staged when it physically blocks the current delivery,
- unnecessary staging remains invalid.

### Internal moves versus external rehandles

Two efficiency concepts are stored separately.

**Internal reposition**
- freight stays on the trailer,
- changes trailer placement,
- increments internal reposition history/count.

**External rehandle**
- freight leaves the trailer for Temp Staging,
- later returns to the trailer or proceeds to receiver,
- increments unique rehandled freight count,
- adds +3 minutes simulated service time per unique freight unit in the current tuning.

A freight unit does not receive repeated external-rehandle penalties merely for being adjusted within Temp Staging.

### Physical freight on receiver floor

Freight retains its physical representation after unloading.

The receiver floor should display recognizable cargo objects:
- standard wrapped pallet,
- fragile crate,
- drum pallet,
- long skid,
- wide skid,
- machinery/heavy crate,
- other existing freight families.

The facility may auto-place received freight inside the correct receiver area, but placement should use the freight's real footprint or a proportional receiver-floor footprint.

Do not reduce received freight to:
- chips,
- list rows,
- miniature generic rectangles,
- text badges.

This visual continuity is required so the warehouse appears to fill with the same objects that left the trailer.

### Receiver-floor snapping

Receiver zones are not another player packing puzzle in this packet.

After a valid zone drop:
1. the facility finds a free visual placement inside that zone,
2. the freight settles into that location,
3. the full freight representation remains visible,
4. later received freight occupies another free location.

If a zone becomes visually crowded, the facility layout may compact intelligently, but physical identity and relative footprint remain visible.

### Pointer paths

The pointer engine must support every physical move path needed by Delivery:

**Trailer → Receiver**
- validates phase, zone, and rear access.

**Trailer → Trailer**
- validates floor placement and collisions.

**Trailer → Temp Staging**
- validates genuine-blocker requirement and staging capacity.

**Temp Staging → Trailer**
- validates trailer placement and collision.

**Temp Staging → Receiver**
- validates active receiver phase and zone.

All invalid moves visually return to their previous position.

### Access recalculation

Delivery access always uses the current mutable trailer placements.

This means player actions can change the puzzle dynamically:

- repositioning deeper may clear a delivery lane,
- repositioning rearward may block another unit,
- staging removes a blocker from the trailer,
- unloading removes delivered freight.

The original Pickup snapshot is the starting state, not an immutable Delivery layout.

### Connection to Pickup

This packet strengthens the intended causal loop.

A well-packed Pickup may arrive with:
- current-phase freight already accessible,
- little or no internal repositioning,
- no external staging.

A poor Pickup may require:
- multiple internal trailer moves,
- scarce Temp Staging,
- additional simulated service time.

Receiver SOP information should eventually be visible before Pickup so expert players can intentionally load around the destination requirements. That planning-surface work remains outside V2.7.6.4.

### RPG data seam

Do not expose RPG scoring yet.

Persist enough data for later progression:
- unloadSequence,
- internalRepositionCount,
- reposition history by freight ID,
- unique staged freight IDs,
- externalRehandleCount,
- receiving zones.

Later systems may convert this into:
- Freight Operations XP,
- clean-operation ratings,
- warehouse handling-time bonuses/penalties,
- tutorial feedback.

### Visual acceptance gate

Automated tests cannot approve V2.7.6.4.

Manual gameplay must confirm:
- Pickup and Delivery trailer shells visibly match,
- trailer scale remains stable,
- freight remains physical in the warehouse,
- staging visibly has finite capacity,
- internal trailer repositioning is understandable,
- pointer previews make valid/invalid trailer placements clear,
- access changes correctly after reposition,
- the warehouse remains environmental rather than spreadsheet-like.

### Deferred work

The following remain recorded but outside this packet:
- normal-workflow SEND SCHEDULE access,
- Advance to Next Event / Next Operational Moment,
- damage/refusal/claims,
- Documents workstation UI,
- RPG reward presentation,
- additional receiver SOP complexity.
