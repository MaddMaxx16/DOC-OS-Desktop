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

## Current packet — V2.4.2 FreightLink Usability Pass

V2.1 through V2.4.1 are structurally locked.

V2.4.2 is a focused usability pass before V2.5.

Guardrails:
- keep the shared full-width bottom app drawer and full-width app bar unchanged,
- FreightLink marketplace markers must stay compact until hovered or selected,
- when one lane is selected, unrelated marketplace lanes should visually recede,
- driver labels should not crowd FreightLink marketplace overview,
- selected lane geography remains the dominant map signal,
- FreightLink inspector should fit useful evaluation context without forcing one-section-at-a-time scrolling,
- inspector content uses a two-column desktop layout at normal desktop widths,
- typography may be increased for readability without changing gameplay truth,
- the current raster basemap may receive a temporary darker treatment, but a full map-style redesign remains a later visual pass,
- do not begin booking or Rate Confirmation behavior until V2.5.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
