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

## Current packet — V2.7.5.1 Trailer Rules: Delivery Access

V2.1 through V2.7.5.0.6.1 are accepted and locked. Equipment-derived capacity, realistic freight identity, persistent trailer snapshots, direct onboard repositioning, keyboard rotation, rear-door commitment, background loading, Focused Mode, and route timing remain authoritative.

This packet introduces the first actual trailer-loading rule:

> freight that delivers earlier must remain accessible from the rear doors before freight that delivers later.

Delivery-access rules:
- derive unload order from the driver's real remaining Driver Day delivery sequence,
- label onboard loads with D1, D2, D3… according to that delivery order,
- trailer rows increase from FRONT / NOSE toward REAR / DOORS,
- model rear-door access lane-by-lane using the existing trailer columns,
- if an earlier-delivery freight piece occupies a lane and later-delivery freight sits farther rearward in that same lane, the earlier piece is blocked,
- blocked earlier freight and the later freight causing the block must be visually distinguishable,
- the right-side trailer-rule card must show the unload sequence and CLEAR / BLOCKED state,
- a delivery-access conflict prevents LOAD PLAN READY and rear-door commitment,
- placement itself remains player-owned: DOC OS warns and blocks readiness rather than snapping cargo into a correct answer,
- dragging a piece into a delivery-access conflict may show an amber rule warning while ordinary overlap/out-of-bounds remains the red legality state,
- single-load trailers are automatically clear for delivery access,
- delivery-access truth must include carried freight from prior pickups and current-pickup freight together,
- do not add full 3D forklift pathfinding; lane-based rear-door access is the intentional abstraction for this packet,
- do not add axle/weight-balance scoring yet,
- do not activate fragile, hazmat, no-stack, upright, or heavy handling penalties yet,
- do not add vertical stacking, Top Down functionality, Side View functionality, delivery puzzle, rework, HOS changes, or service-time changes.

After visual/gameplay acceptance, the next trailer-rule slice is weight distribution / balance.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
