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

## Current packet — V2.6.5.6 Operational Access Points

V2.1 through V2.6.4.1 remain the locked gameplay foundation. V2.6.5 label declutter remains accepted, while route/marker correctness is being corrected at the coordinate-model level.

Guardrails:
- preserve selected-driver committed route persistence when the inspector closes,
- preserve the proven Driver Day freight-stop marker interaction and V2.6.5 text declutter,
- separate a facility's canonical map coordinate from the truck's routable access coordinate,
- canonical facility coordinates identify the place and remain valid planning/facility truth,
- OSRM waypoint locations are operational truck-access coordinates,
- committed road geometry begins/ends at OSRM truck-access coordinates rather than being artificially extended to a facility centroid,
- the operational P/D/L/S route marker uses the same truck-access coordinate as its incoming road leg,
- if road access is unavailable, marker presentation may fall back to the facility coordinate until routing succeeds,
- never draw a fake straight connector from a road access point to a facility centroid just to make geometry visually touch,
- FreightLink preview P/D markers should use the same route-access coordinates as their preview road geometry when available,
- Driver Day sequencing, facility identity, appointments, HOS, capacity, sent-plan truth, and selected-driver ownership remain unchanged,
- route-access data is presentation/routing truth, not a mutation of the facility record itself.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
