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

## Current packet — V2.7.5.0.6 Freight Loading

V2.1 through V2.7.5.0.5 are accepted and locked. Equipment-derived trailer capacity, footprint legality, physical drag preview, rear-open trailer presentation, facility gating, Focused Mode, rear-door commitment, background loading, and downstream timing remain authoritative.

This packet turns Dock & Load from a shaped-piece prototype into a readable freight-loading system:

> the player should identify freight from the freight itself, place it naturally, and arrive at later pickups with truthful cargo already onboard.

Freight-loading rules:
- staged freight is a single vertical manifest on the left rather than a two-column card gallery,
- every freight unit must show a clearly readable load number at normal gameplay scale,
- any handling information that could affect placement must remain readable on the physical cargo, not hidden behind tiny hover-only metadata,
- tutorial freight may use STANDARD, FRAGILE, HAZMAT, HEAVY, KEEP UPRIGHT, NO STACK, and OVERSIZE markings as descriptive identity,
- those handling markings do not add their future simulation penalties or placement rules in this packet,
- freight footprints must be physically credible rectangles: standard pallet, long skid, wide skid, and rectangular machinery/crate footprints are permitted; L-shaped pallet footprints are not,
- placing booked freight in the trailer is sufficient verification; there is no separate VERIFY interaction or verification readiness state,
- the player may press R while actively dragging freight to rotate it,
- freight already in the trailer remains directly draggable and can be repositioned without first ejecting it to staging,
- current-pickup freight may be dragged back to the staging manifest before rear-door commitment,
- cargo inherited from a prior pickup cannot be returned to the current facility's staging area,
- a committed pickup stores the complete trailer freight manifest and placements,
- later pickups reconstruct still-onboard cargo from prior committed pickup snapshots and remove a load after its delivery occurs,
- inherited cargo occupies real trailer positions and participates in overlap, capacity, weight, and placement truth,
- unrelated staged freight must not advertise itself as WRONG LOAD before the player identifies the mismatch; its visible load number is the clue,
- rear doors remain the single commit control and loading still occurs in simulation time after Focused Mode closes,
- do not add stackability gameplay, fragile/hazmat consequence systems, height, axle/balance scoring, stop-order scoring, Top Down functionality, Side View functionality, rework, delivery puzzle, or HOS changes,
- do not change equipment capacity, loading duration, facility timing, route execution, or rear-door commitment semantics.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
