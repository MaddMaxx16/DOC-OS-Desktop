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

## Current packet — V2.7.5.0.1 Puzzle Board Correction

V2.1 through V2.7.5.0 are accepted and locked. Facility gating, Focused Mode, rear-door commitment, background loading, route timing, and Fleet behavior remain intact.

Core interaction correction:

> Dock & Load must feel like a packing puzzle, not a form made of freight cards and fixed pallet boxes.

Puzzle-board rules:
- staged freight is rendered as draggable pallet-shaped puzzle pieces, not long text cards,
- pieces may have different floor footprints,
- the initial shape library includes standard, long, wide, L, block, and overhang footprints,
- each piece may be rotated before placement,
- dragging unverified freight into the trailer may implicitly verify it; verification remains visible but must not dominate the interaction,
- the trailer board is generated from the selected driver's assigned equipment,
- the current 53' dry van uses its existing 26-pallet capacity and 44,000 lb max-weight truth,
- that capacity is translated into a finer packing grid so different freight footprints can be meaningfully fitted,
- smaller/larger future equipment must generate a correspondingly smaller/larger puzzle board without hard-coded 26-slot UI,
- the board validates footprint bounds and overlap continuously,
- drag hover shows valid/invalid footprint preview,
- clicking a placed freight piece returns it to staging before commitment,
- the HUD reports floor-space cells used, truck weight limit, verification, and planned freight,
- wrong/noise freight may still be placed but must remain a blocker in this tutorial slice,
- trailer doors remain the only final commitment interaction,
- this correction does not change the facility state machine or loading-time semantics from V2.7.5.0,
- stacking level, balance score, stop-access scoring, and multi-view trailer analysis remain later extensions of this same board model.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
