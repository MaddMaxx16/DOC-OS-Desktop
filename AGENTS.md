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

## Current packet — V2.6.5.4 Continuous Route Plan

V2.1 through V2.6.5.3 remain the locked desktop foundation.

Guardrails:
- preserve V2.6.5 map declutter, grouped facility anchors, route persistence, and priority labels,
- preserve V2.6.5.1 label-anchor integrity and V2.6.5.2 endpoint normalization,
- preserve V2.6.5.3 separation between road geometry and timing-only estimates,
- a committed Driver Day must be routed as one ordered multi-waypoint road plan rather than unrelated per-leg road requests,
- the router receives the Driver Day waypoint order exactly as shown in the manifest,
- returned route legs are split back into DOC OS segments only after that single continuous route calculation,
- pickup/delivery line-style semantics remain per leg after splitting,
- the fixed committed POI marker shell is centered on the same gameplay coordinate used by the route,
- labels and badge bubbles may overflow the shell but may not alter its size or coordinate center,
- committed POI offsets are permitted only while a visible FreightLink preview intentionally needs separation,
- no hidden/stale preview state may offset normal Driver Day markers,
- do not change Driver Day sequence, scheduling truth, or facility identity in this correction packet.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
