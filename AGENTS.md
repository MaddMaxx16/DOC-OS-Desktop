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

## Current packet — V2.6.5.12 Route Seam Continuity

V2.1 through V2.6.4.1 remain the locked gameplay foundation. V2.6.5.6 truck-access coordinates, V2.6.5.7 serialized road hydration, V2.6.5.9/.10 native committed stops, and V2.6.5.11 shared Live Map/FreightLink stop rendering remain active.

Guardrails:
- preserve Driver Day order, route mileage, duration, HOS, appointments, capacity, and sent-plan truth,
- preserve real-road-only rendering and serialized road hydration,
- preserve one canonical operational access coordinate per Driver Day event,
- adjacent committed route legs must visually meet at that same canonical access coordinate,
- route-seam stitching is rendering truth only; it must not mutate the route's calculated distance or duration,
- the outgoing leg may receive a short display-only connector from the canonical stop access point to its OSRM-snapped first road point,
- committed pickup/delivery badges remain on the same canonical access coordinates used by the stitched route,
- FreightLink deadhead → loaded → rejoin preview legs must use the same seam-continuity rule at pickup and delivery,
- candidate preview timing and fit math continue to use the original routed results,
- preserve pickup-bound dashed styling and delivery/non-pickup solid styling,
- do not introduce interpolation, splines, or curves that leave the routed road geometry,
- do not alter routing requests or reintroduce multi-waypoint/continuous-route experiments in this packet.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
