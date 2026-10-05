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

## Current packet — V2.7.4.2 Physical Arrival + Appointment Waiting

V2.1 through V2.7.4.1.3 are accepted and locked. Fleet Roster cleanup, dispatch gating, late-send recovery, fleet execution, route truth, and marker anchoring remain intact.

Core timing invariant:
- road travel ends when the truck physically reaches the facility,
- appointment timing gates service, not driving.

Freight timing rules:
- projectedArrivalMinutes now represents physical facility arrival for recalculated freight stops,
- physicalArrivalMinutes explicitly preserves that same arrival truth,
- serviceStartMinutes is max(physical arrival, appointment start),
- waitMinutes is the early-arrival gap between physical arrival and service start,
- endMinutes is service start + deterministic freight service duration,
- appointment risk is evaluated from service-ready time, not by stretching drive time,
- route-segment completion occurs at physical arrival,
- if physical arrival is before service start, execution enters waiting-appointment,
- waiting-appointment parks the truck at the facility and completes no freight service,
- onboard freight changes only when pickup/delivery service actually completes,
- once serviceStartMinutes is reached, existing LOADING / UNLOADING service behavior begins,
- all fleet surfaces may classify waiting-appointment as AT STOP and show WAITING,
- Driver Day shows an appointment countdown for the actively waiting stop,
- do not implement the pickup/delivery facility puzzle in this packet,
- V2.7.4.2 creates the truthful facility-arrival trigger that the upcoming facility gameplay will consume,
- do not change HOS depletion in this packet.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
