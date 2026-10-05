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

## Current packet — V2.7.4.0 Fleet Execution Foundation

V2.1 through V2.7.3.7 are accepted and locked. Route truth, native POIs, smooth directional truck motion, Lunch ranking, facility service, and click-only truck labels remain intact.

Core invariant:

> selection is UI; simulation is world state.

Guardrails:
- every Driver Day receives a live state from the same global simulation clock regardless of which driver is selected,
- every committed Driver Day hydrates road geometry independently of selection,
- every truck owns its own rendered motion state, route progress, facing, and animation frame,
- selecting Marcus, Taylor, or Derrick must not start, stop, advance, rewind, or catch up another driver's simulation,
- switching selected drivers changes only inspection/detail context and which route/stops are emphasized,
- the selected driver's detailed committed route may remain the only full route rendered to avoid fleet-route spaghetti,
- hidden or temporarily filtered truck markers must continue accumulating correct world state and reappear at their current rendered/live position,
- a driver with an unsent plan remains at the start/current truck position because Live Operations is not armed,
- V2.7.4.0 does not yet redefine late-send recovery; retroactive schedule recovery belongs to V2.7.4.1,
- FreightLink/planning previews may hydrate a temporary selected-driver route without replacing that driver's committed execution route,
- camera framing may inspect a selected driver's current live position, but moving trucks never own or chase the viewport,
- preserve the single global clock and focused-task pause behavior,
- do not change appointment waiting, HOS depletion, late-send recovery, Lunch validation, or facility-service timing in this packet.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
