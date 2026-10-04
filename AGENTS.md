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

## Current packet — V2.7.2 Route Execution + Truck Motion

V2.1 through V2.6.5.14 are accepted and locked. V2.6 Daily Planning is complete. V2.7.1/.1.1/.1.2 clock, startup, and camera behavior are accepted and locked.

Guardrails:
- preserve every locked planning, booking, routing, native-stop, camera-ownership, and live-clock invariant,
- only SENT Driver Days execute; draft plans never move,
- every sent driver derives execution state from the shared simulation clock and communicated Driver Day,
- execution phases include SCHEDULED, EN ROUTE, ARRIVED, ON BREAK/AT STOP, ROUTE COMPLETE, and SHIFT CLOSED presentation,
- route execution uses Driver Day event times; Lunch is a true dwell window and the truck remains parked until lunch end,
- pickup/delivery loading and unloading service timers are not part of V2.7.2 and must not be invented here,
- the currently hydrated map driver moves along the real committed road geometry using cumulative route distance, never straight-line interpolation between facilities,
- native committed stop emphasis follows the live next-event truth,
- completed committed route legs fade; the active leg remains strongest; future legs remain visible but subordinate,
- the Driver Day timeline exposes completed / NOW / NEXT state from the same live execution truth,
- manual pan/zoom remains player-owned while the truck moves; truck motion must not recenter the camera,
- execution state may advance for all sent drivers even when only the currently hydrated map driver's precise road motion is rendered,
- do not mutate HOS, appointments, capacity, load onboard state, paperwork, or service completion in this packet,
- do not automatically complete pickups or deliveries; V2.7.2 proves movement and arrival state only.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
