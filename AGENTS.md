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

## Current packet — V2.5.1 Workstation Navigation + Rate Con Review

V2.1 through V2.5 remain the gameplay foundation. V2.5.1 deliberately replaces the V2.4 bottom-drawer presentation contract.

Guardrails:
- the bottom app bar and shared bottom app drawer are retired from active runtime,
- normal workstation layout is left command rail → optional left browser → full-height map → optional right inspector,
- Drivers is a first-class command-rail section,
- FreightLink uses the left browser for lane shopping and the right inspector for selected-lane evaluation,
- future Email/Documents/Messages/Banking surfaces inherit the same browser/inspector grammar where appropriate,
- Focused Workspace remains the deliberate exception for deep document/task work,
- opening ordinary workstation sections must not consume vertical map height,
- Rate Confirmation review is player-driven: no term begins pre-verified,
- the player must mark each comparison MATCH or ISSUE before acceptance,
- flagged issues may be corrected or deliberately accepted as written,
- a missed real mismatch may still be committed and recorded as a player mistake,
- Rate Confirmation should read visually like broker paperwork rather than a DOC OS-generated form,
- every rendered road route must begin/end at the exact gameplay POI coordinates,
- routing-engine road snapping may affect the route interior but never leave visible lines floating short of a POI,
- committed and proposal endpoint POIs remain visible whenever their route is visible,
- V2.5 booking/manifest truth remains authoritative,
- do not begin editable Daily Planning behavior until V2.6.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
