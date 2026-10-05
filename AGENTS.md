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

## Current packet — V2.7.5.0.4 Dock & Load Visual / Interaction Polish

V2.1 through V2.7.5.0.3 are accepted and locked. Square floor slots, truck-capacity truth, shaped freight, rotation, placement legality, rear-open trailer presentation, facility gating, Focused Mode, door commitment, background loading, and downstream timing remain authoritative.

This packet is polish only:

> do not redesign the puzzle; make the accepted interaction feel brighter, more tactile, more expressive, and more rewarding.

Polish rules:
- staged freight remains the same puzzle-piece data but receives brighter crate/pallet rendering,
- hover lifts the freight piece and strengthens border/shadow feedback,
- active drag visibly reduces the source piece while preserving a clear drag target,
- rotation gets a short state-triggered visual pop,
- staged freight may show visual badges for oversized, no-stack, wrong-load, and planned state without adding new mechanics,
- planned freight remains visible in staging rather than disappearing into an unusably dark state,
- multi-slot freight inside the trailer must visually read as one connected cargo object,
- placed freight gets brighter top/side/base treatment and stronger contact shadow,
- trailer-floor texture may add subtle grooves/wear only if puzzle slot readability remains dominant,
- whole visible freight footprint must preview during drag,
- valid drag preview is clearly positive and invalid drag preview is clearly blocked,
- invalid drop must not place the freight and should trigger a brief rejection response rather than a modal,
- READY transition may pulse briefly but must not interrupt play,
- ready state should visually draw attention toward the rear-door commit interaction,
- Close Doors remains the only final commit action,
- closing doors must play a short state-triggered trailer-door animation before Focused Mode exits,
- door commit animation must not create extra simulation time; the world remains paused until the existing commit callback finishes,
- animations must be event-driven rather than continuously expensive at idle,
- reduced-motion preferences must suppress nonessential animation,
- do not add stackability gameplay, fragile rules, height, axle/balance scoring, stop-order scoring, Top Down functionality, Side View functionality, rework, delivery puzzle, or HOS changes in this packet,
- do not change placement legality, capacity, service duration, facility timing, route execution, or door-commit semantics.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
