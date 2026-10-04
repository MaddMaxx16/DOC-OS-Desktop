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

## Current packet — V2.4.3 Readability + Map Language

V2.1 through V2.4.2 are structurally locked.

V2.4.3 establishes the visual language players will use for long desktop sessions.

Guardrails:
- no important operational text should require leaning toward the monitor,
- shared desktop type scale: micro 11px, secondary 12px, body 14px, emphasis 16px, heading 22px,
- FreightLink preview routes are neutral because unassigned freight does not belong to a driver,
- assigned operational routes inherit the owning driver's identity color in later execution packets,
- drivers render as truck assets in driver color with initials integrated into the marker,
- POI icon shape communicates location type before color,
- POI taxonomy must support warehouse, yard, staging, fuel, food, truck stop, and service,
- pickup and delivery are facility roles layered onto the underlying POI type,
- marketplace opportunities remain compact until hover or selection,
- selected geography is visually dominant while unrelated opportunities recede,
- use a crisp dark vector basemap; do not return to brightness-filtered OSM raster styling,
- hide irrelevant consumer POI clutter from the basemap where practical,
- MapLibre/Vite worker setup must be deterministic for local Mac testing,
- do not begin booking or Rate Confirmation behavior until V2.5.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
