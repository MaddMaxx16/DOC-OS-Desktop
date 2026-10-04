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

## Current packet — V2.5 Booking + Rate Confirmation

V2.1 through V2.4.7 are structurally locked.

V2.5 makes freight commitment explicit and document-driven.

Guardrails:
- selecting/evaluating freight does not commit it,
- requesting a Rate Confirmation creates a distinct requested state,
- requested freight remains tied to the driver used for that request,
- Rate Confirmation arrival creates a distinct review-ready state,
- Rate Confirmation review uses Focused Workspace and pauses ordinary gameplay presentation,
- the player compares Rate Con terms against the FreightLink lane before confirmation,
- mismatches are clearly flagged,
- the player may request correction,
- the player may deliberately accept mismatched terms after a warning,
- accepting mismatched terms records that decision rather than silently fixing the document,
- confirmed booking uses the Rate Confirmation terms exactly as written,
- only confirmed freight leaves the marketplace,
- confirmation inserts the freight into the real driver manifest at the evaluated gap,
- manifest order is renumbered from authoritative Driver Day sequence,
- lunch placement updates when a confirmed insertion occurs before lunch,
- confirmed freight becomes part of the driver's committed operational route,
- do not begin editable Daily Planning behavior until V2.6,
- do not build the full Documents app until V2.8.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
