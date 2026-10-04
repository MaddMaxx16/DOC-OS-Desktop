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

Goal: execute the plan cleanly.

Build/polish:

- movement,
- pickup/delivery handoffs,
- waiting,
- driver status,
- map route ownership,
- live timing,
- HOS consequences,
- exceptions.

Acceptance:

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
- The top-right clock area reserves permanent runway for pause, play, and fast-forward controls; controls may remain disabled until Live Operations is implemented.
- The game clock should remain visually subordinate to the operational workspace rather than dominating the top bar.
- FreightLink lane-fit cards must remain fully inset within the browser column at the 1920×1080 reference layout; status text or borders may not disappear under the map edge or scrollbar.
- The operational basemap is a dark detailed vector style with consumer POI clutter suppressed.
- Browser previews remain intentional checkpoints, not automatic per-push deployments.
- PC/Steam remains the long-term target.

---

## 25. Immediate next work packet

V2.5 through V2.6.5.11 are accepted and locked.

The active final route-polish packet is:

# **V2.6.5.12 — Route Seam Continuity**

After committed stop alignment was corrected in both Live Map and FreightLink, visual acceptance exposed one remaining presentation issue: route legs can appear to hop or jump as they pass through a stop.

The cause is expected behavior from independent road-route calls:

- an incoming leg may snap a stop to access point A,
- the outgoing leg may snap the same stop to a nearby access point B,
- the native stop badge correctly uses the canonical incoming access point,
- without display stitching, the next line may begin a few pixels away.

V2.6.5.12 resolves the seam without changing simulation truth:

- build one canonical access map from the resolved Driver Day,
- stitch each rendered committed leg to the canonical access coordinates at both ends,
- retain original route distance/duration for all planning calculations,
- apply the same visual stitching to FreightLink deadhead → loaded → rejoin seams,
- preserve dashed pickup-bound and solid delivery/non-pickup line semantics,
- use normal rounded MapLibre joins rather than decorative curves.

Acceptance:

Committed routes and FreightLink candidate previews read as continuous road paths through their stop markers, without small visual hops at P/D transition points.

After visual acceptance, lock V2.6 Daily Planning and proceed to:

# **V2.7 — Live Operations**

---

This file is the active desktop design and build-order contract. If a major desktop decision changes, update this document rather than layering a competing rule elsewhere.
