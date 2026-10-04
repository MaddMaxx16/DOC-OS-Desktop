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

## Current packet — V2.6.5.13 Atomic Route Publish

V2.1 through V2.6.5.12 remain the locked gameplay and map foundation.

Guardrails:
- preserve Driver Day order, route mileage, duration, HOS, appointments, capacity, sent-plan truth, access-point truth, native stop rendering, and route seam continuity,
- keep committed road hydration serialized so the public router is never burst with all Driver Day legs at once,
- do not publish partially hydrated committed routes to the map,
- the player should not watch the committed day appear leg-by-leg as individual route requests finish,
- publish one completed committed-route snapshot after the hydration pass finishes,
- unresolved estimate legs may still receive the existing retry wave before the final snapshot is published,
- estimate fallback geometry remains timing-only and must not render as committed road truth,
- opening FreightLink must reuse the same stable committed-route snapshot rather than triggering a progressive redraw,
- FreightLink candidate preview behavior is unchanged by this packet,
- do not change routing requests, route coordinates, route styling, Driver Day sequencing, or planning math in this packet.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
