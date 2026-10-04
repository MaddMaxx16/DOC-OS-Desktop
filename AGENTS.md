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

## Current packet — V2.5.3 Persistent Issue Markup + Route Origin Truth

V2.1 through V2.5.2 remain the active desktop foundation.

Guardrails:
- preserve the V2.5.1 command rail → browser → full-height map → inspector workstation,
- preserve V2.5.2 Document Desk dragging/stacking and reference-only Rate Con verification,
- choosing ISSUE keeps the corresponding paper field visibly marked until the player changes that judgment,
- the initial ISSUE click may still animate/pulse the marked area,
- MATCH removes any persistent issue markup for that field,
- the driver/truck map marker represents current operational position,
- home base is identity/reference data and must not automatically become shift start,
- Driver Day begins at the current truck position by default,
- a plan may explicitly provide startLocationId when the operational day truly begins at a facility such as Metroline Yard,
- the current truck asset counts as the visible anchor for a default shift-start route origin,
- route geometry must visibly leave the current truck marker toward the first planned event,
- explicit facility starts use a typed POI anchor instead,
- no teleporting between current truck position and the first Driver Day event,
- V2.5 booking/manifest truth remains authoritative,
- do not begin editable Daily Planning behavior until V2.6.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
