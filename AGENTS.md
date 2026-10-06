# DOC OS Desktop — Development Contract

This repository is the clean desktop rebuild of DOC OS.

## Hard boundaries

- Desktop/web only during the active rebuild.
- Do not add Capacitor, iOS, Android, phone shells, mobile compatibility wrappers, or device-specific presentation code.
- Do not copy whole components, stylesheets, or application shells from `MaddMaxx16/DOC-OS`.
- The old repository is a donor/reference for proven business logic only.
- Port small domain utilities only after identifying the source-of-truth behavior they own.
- Do not import old tutorial/Jordan gating until V2.11.
- Do not add a compatibility layer just to make legacy mobile UI render on desktop.
- Keep CSS local and intentional. Avoid one giant global stylesheet.

## Active source of truth

`docs/DESKTOP_EXPERIENCE_ARCHITECTURE_V2.md`

## Build order

V2.1 Shell Reset
→ V2.2 Shared Selection + Driver Identity
→ V2.3 Driver Day / Manifest
→ V2.4 FreightLink Desktop
→ V2.5 Booking + Rate Con
→ V2.6 Daily Planning
→ V2.7 Live Operations
→ V2.8 Documents
→ V2.9 Email + Messages
→ V2.10 Banking + Career Progression
→ V2.11 Onboarding
→ V2.12 Packaging

## Current packet — V2.7.6.1 Physical Delivery Unload

V2.1 through V2.7.5.4 are accepted and locked.
V2.7.6 Delivery Operations architecture is preserved, but its first unload interaction was rejected as too checklist-driven.

This packet changes the delivery interaction layer only.

Core interaction:
- the physical trailer is the primary delivery interaction surface,
- do not use a right-side freight checklist as the player's answer key,
- the player knows the receiver, load reference, expected count, and expected weight,
- freight load numbers on the physical cargo are the primary identity clue,
- the player drags freight from the trailer into the Receiving Bay,
- removing a freight unit updates physical accessibility immediately,
- a freight unit can leave through the rear doors only when no active freight is farther rearward in an overlapping trailer lane,
- if a delivery unit is blocked, the attempted unload is rejected,
- only after that failed attempt should DOC OS identify/highlight the physical blocker,
- if the blocker is another unit for the same receiver, unload that unit first,
- if the blocker belongs to a later stop, it may be dragged to Temporary Staging,
- unnecessary later-stop rehandles should be rejected rather than encouraged,
- each temporary staged unit remains a two-move rehandle and adds +3 minutes of simulated service time,
- staged later-stop freight is automatically reloaded into its original trailer position when the delivery plan commits,
- the actual unload sequence must be preserved on the committed delivery operation.

Receiving-side hierarchy:
- Receiving Dock / receiver identity,
- Expected / Received / Rehandles only,
- large Receiving Bay drop zone,
- Temporary Staging drop zone,
- contextual interaction feedback,
- final Confirm Handoff action.

Do not permanently display BLOCKED 0, a per-unit SELECT list, or a full list of which units belong to the receiver. The player should read the physical load markings.

Color/information behavior:
- do not highlight all correct delivery freight in advance,
- normal trailer cargo remains visually neutral,
- blocked target and blocking freight receive attention styling only after an attempted inaccessible unload,
- wrong-receiver freight dropped in Receiving is rejected with contextual feedback,
- final handoff success may use the accepted success treatment.

Time model remains locked:
- Focused Mode does not advance simulation time,
- drag/remove interactions represent the unload sequence/plan,
- operational unloading time begins after Confirm Handoff,
- rehandles add simulated service time,
- receiver verification follows unloading,
- routine completion auto-departs.

Persistent-state architecture remains locked:
- Delivery opens the exact pickup trailer snapshot,
- accepted freight leaves trailerAfter,
- later stops inherit trailerAfter,
- refused/retained freight architecture remains available for future exception packets,
- POD remains owned by Documents.

Known Live Operations UX backlog — note only, do not solve in this packet:
- SEND SCHEDULE is currently reachable only while the Driver Day is in Planning state; provide a normal-workflow dispatch/send entry point later,
- time controls currently require manual fast-forward through idle stretches; add an Advance to Next Event / Next Operational Moment control later.

Do not add random damage, refusal gameplay, claims, another pickup rule, HOS changes, Documents UI, or next-event time navigation in this packet.

After visual/gameplay acceptance, continue with one authored delivery exception rather than adding more normal-delivery UI.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
