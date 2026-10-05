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

## Current packet — V2.7.5.0.3 Square Pallet Floor

V2.1 through V2.7.5.0.2 are accepted and locked. Rear-open trailer presentation, equipment-derived puzzle logic, shaped freight, rotation, overlap/bounds validation, facility gating, Focused Mode, door commitment, and background loading remain authoritative.

Gameplay correction:

> the trailer floor must behave like pallet packing, not a spreadsheet of stretched half-cells.

Square-floor rules:
- trailer capacity maps directly to legal floor slots; do not double capacity into hidden half-pallet cells,
- Marcus's existing 26-pallet dry van therefore exposes exactly 26 usable puzzle slots,
- the 26 slots are laid out compactly as a 4×7 board with two unavailable cells,
- standard pallet freight occupies one square slot,
- oversized or irregular freight may occupy multiple adjacent square slots,
- rotation, overlap, out-of-bounds, wrong-load, and weight validation remain unchanged,
- puzzle tracks must render as true square cells rather than stretching to fill the panel,
- placed freight must render as raised physical cargo/crate boxes sitting on the trailer floor,
- visual box depth must not change collision geometry,
- left-side staged pieces and center-floor placements must continue sharing the same freight shape truth,
- FLOOR SLOTS replaces half-cell/puzzle-cell language in the player-facing HUD,
- do not change facility timing, loading duration, route execution, or door-commit semantics in this packet.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
