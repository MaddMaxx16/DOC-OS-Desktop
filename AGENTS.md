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

## Current packet — V2.6.1 Planning Foundation

V2.1 through V2.5 remain the locked desktop foundation.

Guardrails:
- preserve the V2.5.1 command rail → browser → full-height map → inspector workstation,
- preserve V2.5 booking/Rate Con truth and committed freight ownership,
- dispatch-plan status is gameplay truth stored with the driver plan,
- Planning Mode is presentation state only and must not create a second manifest or schedule,
- DRAFT PLAN is editable; SENT PLAN is not casually editable,
- the selected Driver Day inspector is the planning surface; do not add a full-screen planner or bottom drawer,
- keep the live map visible during ordinary planning,
- compact the Driver Day summary so the timeline owns most inspector height,
- no stop reordering in V2.6.1; sequencing belongs to V2.6.2,
- no lunch-place picker in V2.6.1; physical lunch POI selection belongs to V2.6.3,
- no Send Schedule behavior in V2.6.1; readiness/send belongs to V2.6.4,
- current truck position remains the default route origin,
- lunch and staging remain real operational locations,
- the V2.6 lunch-POI/RPG bridge in the architecture document is locked.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
