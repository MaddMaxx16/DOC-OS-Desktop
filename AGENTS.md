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

## Current packet — V2.6.5.11 Shared Native Stops

V2.1 through V2.6.4.1 remain the locked gameplay foundation. V2.6.5.6 truck-access coordinates, V2.6.5.7 serialized road hydration, and V2.6.5.9/.10 MapLibre-native committed stops remain active.

Guardrails:
- preserve selected-driver route persistence and Driver Day plan truth,
- preserve facility-coordinate vs truck-access-coordinate separation,
- preserve serialized committed road hydration and real-road-only rendering,
- committed pickup/delivery stop badges use one MapLibre-native renderer in every ordinary map mode,
- opening FreightLink must not disable the native committed-stop source/layers,
- FreightLink marketplace markers and candidate-route preview are overlays only; they must not replace Marcus's committed stop renderer,
- DOM route-anchor markers are reserved for non-freight plan events such as Lunch and Staging,
- committed freight route anchors must not return to the old DOM Marker path in FreightLink,
- native P/D badges remain above committed route lines and continue using the route-access coordinate truth,
- selected/next labels and STOP selection behavior remain shared between Live Map and FreightLink,
- do not change routing, lane evaluation, sequencing, HOS, capacity, appointments, or sent-plan truth in this packet.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
