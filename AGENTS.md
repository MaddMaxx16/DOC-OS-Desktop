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

## Current packet — V2.7.6.3 Pointer Freight Handling + Warehouse Floor

V2.1 through V2.7.5.4 are accepted and locked.
V2.7.6 Delivery Operations architecture is preserved.
V2.7.6.2 receiving SOP, ordered phases, zone validation, access blocking, rehandles, persistent trailer state, and background service remain authoritative.

This packet changes interaction feel and warehouse presentation only.

Pointer freight handling:
- native HTML drag/drop is not the primary delivery interaction,
- freight uses pointer events controlled by DOC OS,
- pointer-down on a trailer or staged freight unit lifts that physical unit,
- the lifted freight follows the pointer using a floating freight ghost,
- the original freight remains visibly dimmed at its origin while in motion,
- pointer hit testing uses the physical facility floor zones under the cursor,
- facility zones react when freight is carried over them,
- pointer release attempts the same existing receiving/staging move,
- accepted drops remove the freight from origin and settle it into the destination,
- rejected or empty-floor drops animate the freight back to its origin,
- click freight → click destination remains an accessibility/fallback path,
- do not reintroduce browser draggable/onDragStart/onDrop as the main path.

Warehouse-floor presentation:
- the receiving side is one continuous warehouse environment,
- do not lay the receiver zones out as a 2×2 dashboard/card grid,
- zones should read as painted floor areas / operational spaces inside one room,
- use aisle markings, dock apron cues, hazard/traffic markings, and floor texture,
- Controlled Receiving, Forklift Lane, Inspection, General Receiving, and Temp Staging remain mechanically distinct drop targets,
- completed freight accumulates physically inside its receiving area,
- inactive zones may be subdued but should still look like part of the warehouse, not disabled UI cards.

Trailer:
- preserve the unmistakable 53' trailer treatment from V2.7.6.2,
- keep nose, side walls, rear frame, doors, floor grid, and wheels,
- give the trailer enough visual width to remain a primary half of the puzzle,
- dock connection should be a narrow physical bridge/apron, not a large striped interface divider.

Gameplay rules remain unchanged:
- receiver-specific SOP defines the phase order,
- only current-phase freight can be accepted,
- correct receiving zone is required,
- rear-door physical access is required for trailer freight,
- genuine blockers may move to Temp Staging,
- each unique staged unit is one rehandle / two handling moves / +3 minutes,
- same-delivery later-phase blockers may be staged,
- later-stop blockers may be staged and restored after delivery,
- Confirm Handoff remains locked until the receiver protocol is complete.

Accuracy:
- Harborline/Freshway procedures remain fictional facility gameplay SOPs,
- do not imply HAZMAT, fragile, heavy, or oversize freight universally follows these receiving orders.

Time model remains locked:
- Focused Mode pauses simulation,
- physical freight manipulation is player reasoning/coordination,
- Confirm Handoff resumes operational unloading time,
- receiver verification follows,
- routine delivery auto-departs.

Known Live Operations UX backlog remains deferred:
- SEND SCHEDULE needs a normal-workflow entry point outside Planning state,
- add Advance to Next Event / Next Operational Moment instead of manually waiting through fast-forward.

Do not add damage/refusal, claims, Documents UI, HOS changes, new Pickup rules, or Live Operations time-navigation changes in this packet.

Visual/gameplay acceptance is required before advancing Delivery.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
