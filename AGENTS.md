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

## Current packet — V2.7.3 Facility Service Execution

V2.1 through V2.7.2 are accepted and locked. V2.7.2 route execution, truck motion, camera ownership, and sent-plan live truth must remain intact.

Guardrails:
- preserve every locked planning, booking, routing, native-stop, camera-ownership, live-clock, and route-execution invariant,
- only SENT Driver Days execute; draft plans never move or service freight,
- pickup and delivery freight stops own deterministic service windows; default service is 12 minutes for pickup loading and 10 minutes for delivery unloading unless the stop explicitly overrides it,
- the truck remains parked at the routed facility access point for the full service window,
- pickup service completion is the moment the load becomes live onboard freight,
- delivery service completion is the moment the load leaves live onboard freight,
- outgoing route motion begins automatically when the service window ends; there is no manual Depart action,
- Driver Day, Fleet, and map execution state must read from the same service truth,
- completed timeline events are based on service completion/departure, not merely facility arrival,
- completed incoming route legs may fade on arrival while the truck remains parked for service,
- the future loading puzzle may become the gate that starts facility service, but V2.7.3 must not invent that puzzle or couple the execution engine to a specific puzzle UI,
- do not add facility congestion, detention, paperwork completion, document generation, dock assignment, or player-controlled loading geometry in this packet,
- service timing must remain deterministic and testable from the shared simulation clock.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
