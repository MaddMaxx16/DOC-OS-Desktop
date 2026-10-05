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

## Current packet — V2.7.5.0.5 Cargo Interaction Polish

V2.1 through V2.7.5.0.4 are accepted and locked. Square floor slots, truck-capacity truth, shaped freight, rotation, placement legality, rear-open trailer presentation, facility gating, Focused Mode, door commitment, background loading, and downstream timing remain authoritative.

This packet is a targeted interaction pass:

> keep the grid as simulation truth, but make the freight itself feel like the game piece.

Polish rules:
- drag/drop legality still comes exclusively from the existing board and placement domain,
- the grid remains visible but becomes secondary during drag,
- drag hover renders one translucent physical freight object using the freight's real footprint and rotation,
- the whole preview object reads valid or invalid as one state,
- overlap may additionally mark the specific occupied blocker cell,
- staged cargo may be slightly larger and use straps/wrap/marking detail for stronger physical identity,
- valid placement may play a short settle response with no simulation-time effect,
- placed freight keeps its pallet identity visible while special-property tags stay collapsed until hover/focus,
- placed freight must not intercept trailer drag targets while another staged piece is being dragged,
- staged freight badges remain descriptive only,
- do not add stackability gameplay, fragile rules, height, axle/balance scoring, stop-order scoring, Top Down functionality, Side View functionality, rework, delivery puzzle, or HOS changes,
- do not change trailer capacity, footprint truth, placement legality, service duration, facility timing, route execution, READY semantics, or door-commit semantics.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
