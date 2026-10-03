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

## Current packet — V2.3 Driver Day / Manifest

V2.1 and V2.2 are structurally locked. Visual polish remains deferred.

V2.3 ports the proven manifest invariants into a new desktop-native Driver Day surface.

Guardrails:
- manifest stop order is authoritative for freight sequence,
- pickup and delivery stops may interleave across loads,
- trailer capacity is calculated from actual onboard freight after each stop,
- lunch and staging are timeline events, not freight stops,
- stop selection uses the shared V2.2 selection contract,
- selecting a manifest stop must resolve back to its owning driver without creating a second selected-driver state,
- do not port legacy manifest UI or the old driver scheduler,
- do not begin FreightLink insertion/evaluation UI until V2.4.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
