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

## Current packet — V2.4.4 Map Interaction + Drawer Layout Polish

V2.1 through V2.4.3 are structurally locked.

V2.4.4 is the final usability polish before V2.5.

Guardrails:
- keep the V2.4.3 dark vector basemap, truck markers, POI language, route semantics, and readability scale,
- operations map is permanently flat and north-up,
- normal map interaction is pan + zoom only,
- bearing is locked to 0 degrees,
- pitch is locked to 0 degrees,
- mouse drag rotation, touch rotation, and touch pitch are disabled,
- programmatic camera moves must preserve bearing 0 and pitch 0,
- navigation control exposes zoom only, not compass/rotation affordances,
- shared app drawer targets 46% of viewport height,
- shared app drawer bounds are 360px minimum and 540px maximum,
- increased drawer height must not be achieved by shrinking operational typography,
- FreightLink may still scroll on genuinely small viewports, but normal desktop height should expose nearly the full selected-lane evaluation,
- closing the active app restores the reclaimed map space cleanly,
- do not begin booking or Rate Confirmation behavior until V2.5.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
