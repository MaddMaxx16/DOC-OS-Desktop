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

## Current packet — V2.7.4.0.4 Fleet Marker Anchor

V2.1 through V2.7.4.0.3 are accepted and locked. Fleet execution, single route truth, and fleet map clarity remain intact.

Root cause addressed:
- MapLibre custom markers require absolute positioning,
- the custom .driver-marker CSS had overridden MapLibre's marker positioning with position: relative,
- with multiple driver markers in DOM order, normal document flow could offset later markers before MapLibre's geographic transform,
- this explains the fleet-only pattern where the first driver appeared correctly aligned while later drivers appeared beside otherwise-correct routes.

Guardrails:
- .driver-marker must remain position: absolute,
- truck marker geometry uses a fixed 42x31 border-box with zero padding,
- the truck's internal artwork may use relative positioning, but the MapLibre marker container may not,
- all driver markers continue to use anchor: 'center',
- route geometry, execution progress, and route ownership from V2.7.4.0.3 are unchanged,
- do not compensate with per-driver pixel offsets,
- do not change dispatch gating, late-send recovery, appointment waiting, HOS, or service timing in this patch.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
