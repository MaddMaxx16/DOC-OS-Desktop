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

## Current packet — V2.6.4 Readiness + Send Schedule

V2.1 through V2.6.3.2 remain the locked desktop foundation.

Guardrails:
- preserve the map-first command rail → browser → live map → inspector workstation,
- preserve V2.5 booking/Rate Con truth and committed freight ownership,
- preserve V2.6.1 DRAFT/SENT planning truth,
- preserve V2.6.2 committed-manifest sequencing, pickup-before-delivery, capacity guards, and plan-health feedback,
- preserve V2.6.3 physical Lunch/Staging places, insertion lanes, preview/confirm flow, and contextual staging,
- Plan Check remains visible outside Planning Mode so readiness is always legible,
- readiness blockers and warnings should resolve to actionable Driver Day stops when a specific stop owns the issue,
- missing required Lunch/Staging place truth is a hard blocker,
- hard blockers prevent schedule dispatch,
- warnings remain sendable only through an explicit warning override,
- a clean plan still requires a deliberate send confirmation,
- SEND SCHEDULE changes the authoritative driver plan from DRAFT to SENT,
- a sent plan is not casually editable/resequenceable/place-editable,
- do not add a post-send revision workflow yet; that belongs with Live Operations,
- do not let SEND SCHEDULE automatically optimize or repair the plan,
- player intent remains authoritative for sendable warnings,
- V2.6.4 completes Daily Planning; V2.7 begins only after this packet passes visual/functional acceptance.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
