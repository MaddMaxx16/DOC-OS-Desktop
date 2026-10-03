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

## 6. v2 shell principle: the map owns the screen

The default workstation state should feel spacious.

The live map is the main canvas.

The shell should behave like a dispatch command surface with information available on demand.

### Default monitoring state

At rest, the player should primarily see:

- global top bar,
- live map,
- compact side handles/rails,
- compact bottom app dock,
- only lightweight status information.

The player should **not** see two full-height side panels and a large bottom workspace by default.

### Important rule

Opening a side panel should normally **overlay the map**, not permanently shrink/reflow it.

The map should keep its geographic framing as panels open and close.

This prevents constant visual jumping and preserves spatial awareness.

---

## 7. Left side: driver roster drawer

The left side owns **driver discovery and selection**.

### Closed state

A compact rail/handle remains visible.

It may show:

- Drivers icon,
- number of active drivers,
- small warning indicator if a driver needs attention.

Target visual footprint:

- approximately 48–64 px wide.

This is a design target, not an immutable pixel requirement.

### Open state

The driver roster slides over the map from the left.

Target width:

- approximately 260–320 px.

It may include:

- search,
- driver avatar,
- driver name,
- duty status,
- quick current-state label,
- warning/attention cue.

The roster should be dense and scannable.

It should not attempt to display full HOS, trailer, route, manifest, and communication data.

### Selecting a driver

Selecting a driver:

- makes that driver the selected operational subject,
- highlights that driver's marker and route,
- may close the roster automatically,
- may open or refresh the right contextual panel.

The exact auto-close behavior may be tuned during testing, but the roster must always remain independently closable.

---

## 8. Right side: contextual operations drawer

The right side owns **deep context for whatever the player selected**.

It is not permanently visible.

### Closed state

Only a compact handle/indicator remains.

### Open state

The panel slides over the map from the right.

Target width:

- approximately 360–420 px.

The right panel may represent different selected subjects:

- driver,
- load,
- stop,
- facility,
- route leg,
- manifest.

It should not always assume "Marcus detail."

### Driver context

When a driver is selected, the right drawer may contain:

- driver identity,
- duty state,
- HOS,
- trailer,
- onboard freight,
- next stop,
- manifest,
- route risk,
- messages/action shortcuts.

### Facility context

When a facility is selected, the same drawer may show:

- facility details,
- appointment information,
- expected arrivals,
- current/predicted congestion,
- player drivers headed there.

### Load context

When a load is selected:

- lane,
- appointments,
- rate,
- equipment,
- assigned driver,
- paperwork state,
- fit/risk signals.

### Rule

The right drawer is contextual information, not a second permanent app.

The player should be able to close it at any time and return to a map-first view.

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

## 10. Map interaction contract

The map remains interactive without becoming cluttered.

### Driver marker

Click:

- compact popover,
- driver name,
- status,
- ETA/next stop,
- critical warning if needed.

A secondary action such as **View Driver** can open the right drawer.

### Pickup / delivery marker

Click:

- load/lane identifier,
- appointment window,
- driver,
- projected arrival,
- timing state.

A secondary action can open the load/right drawer.

### Facility

Click:

- facility name,
- expected DOC arrivals,
- current known scheduling pressure,
- eventual predicted wait information.

A secondary action opens facility context in the right drawer.

### Route leg

Click:

- driver,
- current leg,
- destination,
- remaining time,
- remaining miles where available,
- load/manfest relationship.

### Selection synchronization

Map, manifest, load, and driver selection should share one selection model.

Examples:

- select Marcus → Marcus route brightens,
- select a manifest stop → that stop highlights on map,
- click a route leg → corresponding driver/load context becomes selected,
- click a facility → related expected arrivals can be surfaced.

---

## 11. Bottom dock and workspace

The bottom of DOC OS has two different concepts:

1. **App Dock**
2. **App Workspace**

They should not visually blur together.

### Dock

Always compact.

Target height:

- approximately 50–64 px.

Possible apps:

- FreightLink
- Email
- Documents
- Messages
- Banking
- CarrierSource
- Shop

Badges may appear for unread/new content.

CarrierSource remains locked during early career.

### Working workspace

Opening an app raises a desktop-native workspace.

Target height:

- roughly 32–42% of the screen depending on app.

The map remains visible above it.

The workspace should feel like desktop software:

- tables,
- lists,
- dense rows,
- split panes,
- filters,
- inspectors.

Do not simply mount the old phone screen inside a larger rectangle.

### Focused workspace

For detailed work such as:

- Rate Confirmation review,
- POD investigation,
- invoice/document work,
- paper comparison,
- detailed planning,

the task may expand to most of the screen.

Gameplay automatically pauses.

The player should still see a compact operational reminder, but the task gets visual priority.

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

- left drawer open/closed,
- right drawer open/closed,
- selected subject,
- active app,
- workspace mode,
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
- left/right drawers,
- manifest highlight,
- app context.

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

The booking lifecycle should be clear:

candidate freight → approval/booking process where applicable → Rate Confirmation arrives → player verifies → freight becomes fully confirmed operational work.

The player should not feel they committed blindly without seeing confirmation terms.

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

Goal: make DOC OS feel like the mockup structurally.

Build:

- map-first default state,
- compact top bar,
- left drawer closed by default,
- right drawer closed by default,
- smooth independent slide-in/out behavior,
- compact bottom dock,
- map stays geographically stable while side drawers overlay it,
- remove permanent side-panel squeeze,
- remove the always-open bottom workspace,
- remove active Jordan tutorial presentation/gating.

Acceptance:

When the workstation opens, the map feels dominant and calm.

The player can open and close both side drawers without the entire layout jumping.

No tutorial card interrupts the shell test.

### V2.2 — Shared Selection + Driver Identity

Goal: establish the interaction language for the whole game.

Build:

- persistent per-driver colors,
- selected driver,
- selected load,
- selected stop,
- selected facility,
- selected route leg,
- map/drawer/manifest synchronization,
- contextual right drawer content.

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

- booking request/approval state where required,
- Rate Confirmation arrival,
- desktop Rate Con review,
- correction request,
- confirmation state,
- handoff into booked manifest work.

Acceptance:

The player never has to wonder whether freight is merely interesting, requested, booked, confirmed, or ready to dispatch.

### V2.6 — Daily Planning

Goal: build a coherent dispatch plan.

Build:

- stop sequencing,
- lunch placement,
- staging,
- schedule readiness checks,
- send schedule to driver.

Acceptance:

A multi-load day such as P1 → P2 → Lunch → D1 → P3 → D2 → D3 can be built and sent.

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

Temporary UI state such as which drawer was open should not need to become important save data unless there is a clear reason.

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
- side drawers do not alter simulation truth,
- desktop selection never creates a second copy of driver/load state,
- tutorial-disabled mode does not block ordinary gameplay.

Visual layout behavior still requires screenshot/manual browser testing.

---

## 21. Desktop test strategy

Desktop work is tested through intentional Vercel/browser checkpoints.

Do not deploy after every small edit.

Preferred loop:

**design packet → feature branch → build → permanent verification → squash merge → intentional preview → fullscreen Mac test → collect feedback → next packet**

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
- drawers,
- shared selection,
- app workspace mode,
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
- Left and right panels slide in/out.
- Side panels overlay rather than permanently squeeze the map.
- The bottom dock stays compact when no app is active.
- Desktop apps are rebuilt as desktop apps rather than stretched phone screens.
- Existing simulation logic is preserved where sound.
- Jordan's tutorial is removed from the active loop during the systems rebuild.
- Gameplay systems are stabilized before onboarding is rebuilt.
- Each driver has a unique persistent color identity.
- Color follows driver marker, route, and related operational cues.
- Color is supported by labels/icons for accessibility.
- The driver manifest remains the operational backbone.
- Interleaved pickups/deliveries remain supported.
- FreightLink evaluation must use the driver's real manifest/HOS/capacity.
- Rate Confirmation is a real gameplay checkpoint.
- Lunch and staging are part of operational planning.
- Focused work pauses simulation.
- Map selection and manifest/context selection share one model.
- Browser previews remain intentional checkpoints, not automatic per-push deployments.
- PC/Steam remains the long-term target.

---

## 25. Immediate next work packet

The next implementation packet is:

# **V2.1 — Shell Reset**

It should do only the structural reset:

- remove active Jordan tutorial interruption/gating,
- remove the permanent left driver panel,
- remove the permanent right operations panel,
- restore the map as the dominant canvas,
- add compact left/right handles,
- create independent sliding drawers,
- keep drawers as overlays rather than layout columns,
- collapse the bottom workspace back to the compact dock by default,
- preserve current gameplay systems underneath,
- remove Desktop Build 1 shell code that becomes obsolete.

Do **not** rebuild FreightLink, Documents, Banking, or the full manifest UI inside V2.1.

The purpose of V2.1 is to get the workstation shell right before we pile gameplay surfaces back into it.

---

This file is the active desktop design and build-order contract. If a major desktop decision changes, update this document rather than layering a competing rule elsewhere.
