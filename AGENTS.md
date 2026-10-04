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

## Current packet — V2.6.5 Route Visibility + Label Declutter

V2.1 through V2.6.4.1 remain the locked desktop foundation.

Guardrails:
- preserve the map-first command rail → browser → live map → inspector workstation,
- preserve V2.6 Daily Planning truth, readiness, DRAFT → SENT dispatch behavior, and closable inspector behavior,
- the selected driver's committed route remains visible whether the right inspector is open or closed,
- inspector visibility must not own route visibility,
- non-selected drivers remain represented by their truck markers without rendering every committed route at full strength,
- normal Driver view uses grouped route anchors as the physical POI source instead of separate duplicate freight-stop markers,
- multiple planned visits to the same facility share one physical marker and combine their P/D/L/S badges,
- full facility labels are priority-based rather than permanently visible for every stop,
- selected stop labels are always eligible for full display,
- before Live Operations exists, the first planned event after shift start is the next-stop label priority,
- V2.7 must replace that pre-live next-stop heuristic with real execution-position truth,
- non-priority route anchors remain badge-first and reveal full labels on hover/focus,
- close facility labels use alternate label placements while keeping the physical POI coordinate exact,
- do not solve clutter by shrinking operational type below the readability floor,
- route and marker declutter must preserve driver-color ownership and pickup/delivery route-line semantics.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
