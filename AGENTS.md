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

## Current packet — V2.7.6.6 Delivery Handling Constraints

V2.1 through V2.7.5.4 are accepted and locked.
V2.7.6 Delivery Operations architecture remains authoritative.
V2.7.6.2 receiver-specific SOP phases and zone validation remain authoritative.
V2.7.6.3 pointer-owned freight interaction remains authoritative.
V2.7.6.4 Delivery Space Management remains authoritative:
- shared Pickup/Delivery trailer shell,
- mutable Delivery trailer placements,
- internal Trailer → Trailer repositioning,
- finite 3-position Temp Staging,
- internal reposition history vs external rehandles,
- current-state access recalculation.
V2.7.6.5 warehouse physicalization remains visually authoritative.

V2.7.6.6 is the active Delivery packet.

### Purpose

Gameplay review of V2.7.6.5 found two remaining Delivery problems:

1. an interrupted pointer move could leave the workspace stuck in FREIGHT IN MOTION,
2. internal repositioning was too permissive because any collision-free empty trailer position could be used even when the freight could not plausibly be handled there from the rear doors.

This packet fixes those two issues only.

### Handling-path gameplay abstraction

Delivery now adds a rear handling-path rule.

This is a DOC OS gameplay abstraction for dock-equipment reachability.
It is **not** a forklift-certification, OSHA, DOT, FMCSA, or warehouse-engineering simulator.

The rule exists to stop freight from teleporting through other freight during Delivery.

### Rear handling path

For a trailer freight unit to be manipulated from the trailer, DOC OS must be able to find a legal path for that freight footprint from a rear-door boundary position to its current position.

The path:
- uses the current mutable Delivery trailer state,
- uses the freight's current footprint and rotation,
- moves through adjacent trailer anchor positions,
- may not overlap other freight,
- may not leave the usable trailer floor,
- respects disabled/non-floor cells.

A freight unit with no rear handling path is not currently manipulable.

### Delivery unload access

Receiver SOP remains authoritative, but current-phase freight must also be rear-handling accessible before it can leave the trailer.

A valid receiver unload therefore requires:
1. correct receiver phase,
2. correct receiver zone,
3. rear handling path from the trailer to the doors.

The previous same-lane blocker model remains available for contextual blocker feedback, but the handling-path rule is the stronger physical manipulation gate.

### Trailer → Trailer repositioning

An empty destination is no longer sufficient.

For an internal reposition to be valid:
- the source freight must itself be reachable from the rear doors,
- the destination footprint must fit,
- the destination must be collision-free,
- the freight footprint must have a rear handling path to the destination through the current trailer layout.

If the destination is empty but unreachable, reject with **NO HANDLING PATH**.

If the source itself is buried beyond handling reach, reject with **FORKLIFT CANNOT REACH**.

This rule should make open trailer space useful without allowing the player to teleport freight behind blockers.

### Temp Staging interaction

Existing Temp Staging capacity remains exactly 3 pallet-equivalent positions.

A trailer freight unit must itself be rear-handling accessible before it may move to Temp Staging.

Existing "unnecessary staging" protection remains, with one extension:

If the active receiver phase has **no rear-handling-accessible freight**, a rear-accessible later-phase or later-stop freight unit may be staged to open a handling corridor even when it is not the old same-column immediate blocker.

This lets Temp Staging become necessary when the receiver sequence is physically trapped.

Do not increase staging capacity in this packet.

### Challenge intent

The intended decision becomes:

1. What freight does the receiver require now?
2. Can that freight physically reach the rear doors?
3. If not, which freight can the dock equipment actually reach?
4. Can a reachable blocker be repositioned to another rear-reachable trailer location?
5. If no legal internal path exists, which blocker is worth spending scarce Temp Staging on?

Do not add arbitrary time limits or additional receiver SOP rules to create difficulty.

### Pointer-interaction hardening

No Delivery drag may leave the workspace indefinitely stuck in FREIGHT IN MOTION.

The active pointer session must safely terminate on:
- normal pointer-up,
- pointer-cancel,
- lost pointer capture,
- window blur,
- page/tab visibility loss,
- Escape.

Normal valid release still commits the move.

If the release cannot be resolved safely:
- cancel the move,
- animate freight back toward its last valid origin,
- clear the active pointer state,
- return control to the player,
- show concise MOVE CANCELED / POINTER RELEASED feedback.

The game must prefer safely returning freight over preserving an uncertain drag.

### Pointer state rules

Maintain an authoritative active pointer reference separate from transient React render state so late browser events cannot leave a ghost freight session active.

Guard move completion so duplicate pointer-up/capture-loss events cannot double-commit or double-cancel a freight move.

### Preserved systems

Do not redesign:
- V2.7.6.5 warehouse presentation,
- shared Pickup/Delivery trailer,
- receiver SOP panel,
- receiving-zone visuals,
- receiver-floor freight visuals,
- staging visuals,
- freight families,
- staging capacity,
- receiver phase order,
- rehandle time,
- background unloading,
- receiver verification,
- routine auto-depart.

### Visual feedback

Reuse the existing Trailer → Trailer footprint preview.

Preview should now represent both:
- footprint/collision legality,
- rear handling-path legality.

Green means the move can actually be handled from the rear.
Red means either the footprint does not fit, collides, or has no handling path.

Do not add another permanent HUD card for this rule.

Contextual feedback is enough.

### Accuracy boundary

Rear handling paths are a gameplay abstraction.

Do not claim:
- exact forklift turning-radius simulation,
- OSHA-compliant warehouse access,
- certified forklift maneuverability,
- real dock-equipment clearance calculations.

The model only represents whether the freight footprint can move through adjacent open trailer positions from the rear.

### Acceptance requirements

V2.7.6.6 is not accepted until gameplay confirms:

1. An accidental release cannot leave FREIGHT IN MOTION stuck.
2. Escape safely cancels a held freight move.
3. Losing pointer capture safely returns freight.
4. Window/tab interruption safely clears the drag state.
5. Empty but unreachable trailer positions are rejected.
6. Reachable internal positions still work.
7. Rear-accessible freight can be unloaded normally.
8. Buried freight cannot be manipulated through other cargo.
9. Temp Staging becomes useful when the active receiver phase has no reachable freight.
10. The accepted trailer, warehouse, and right HUD remain visually unchanged.

### Explicit non-goals

Do not add:
- exact forklift turning radii,
- forklift/NPC animation,
- vertical stacking,
- new receiver phases,
- new Pickup rules,
- random damage,
- refusal/claims,
- HOS changes,
- schedule-send UX changes,
- next-event controls,
- RPG scoring UI.

V2.7.6.6 exists specifically to harden Delivery pointer interaction and make internal freight movement obey the trailer's physical access constraints.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
