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

## Current packet — V2.6.2 Stop Sequencing

V2.1 through V2.6.1 remain the locked desktop foundation.

Guardrails:
- preserve the map-first command rail → browser → live map → inspector workstation,
- preserve V2.5 booking/Rate Con truth and committed freight ownership,
- the committed manifest remains the only stop-order source of truth,
- Planning Mode may reorder freight stops only while the driver plan is DRAFT,
- moving a stop rewrites manifestOrder on the committed loads; do not create a parallel draft-manifest copy,
- pickup must remain before its matching delivery,
- reject resequences that would exceed trailer capacity,
- risky-but-possible appointment or HOS outcomes remain visible warnings rather than automatic optimization,
- every accepted resequence recalculates projected arrivals and capacity state,
- the committed map route rebuilds from the same updated Driver Day timeline,
- the player chooses the order; do not add an Optimize Route button,
- Lunch is not draggable yet; its timeline slot remains fixed during V2.6.2,
- physical lunch POI selection and movable Lunch belong to V2.6.3,
- staging selection belongs to V2.6.3,
- readiness and Send Schedule belong to V2.6.4,
- current truck position remains the default route origin,
- the V2.6 lunch-POI/RPG bridge remains locked.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
