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

## Current packet — V2.7.1.2 Camera Ownership

V2.1 through V2.6.5.14 are accepted and locked. V2.6 Daily Planning is complete. V2.7.1 Live Operations clock/execution-gate behavior is visually accepted.

Guardrails:
- preserve every locked planning, routing, map, booking, Rate Con, startup-guard, and V2.7.1 live-clock invariant,
- selecting a driver or stop may frame that target once,
- after intentional framing, manual pan/zoom belongs to the player and ordinary React rerenders or simulation-clock ticks must not reclaim the camera,
- a moving selected truck must not automatically drag the camera in future Live Operations unless a separate explicit Follow Driver mode is added,
- camera framing keys are based on selection/planning target identity, not continuously changing truck coordinates,
- clearing selection resets the frame key so a later re-selection may intentionally frame again,
- FreightLink preview/planning modes may still intentionally fit their own relevant geometry,
- stabilize planning-place option identity so the live clock does not manufacture false camera-change signals,
- do not change routing, route geometry, simulation speed, Driver Day sequencing, HOS, appointments, capacity, or sent-plan truth in this packet.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
