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

## Current packet — V2.4.1 Shared Bottom App Drawer

V2.1 through V2.4 are structurally locked. Visual polish remains deferred.

V2.4.1 promotes the bottom app workspace into a shared shell primitive.

Guardrails:
- every dock app opens inside the same `DesktopAppDrawer`,
- the app drawer spans the full workstation width,
- the bottom app bar spans the full workstation width,
- default app drawer height targets about 40% of the viewport, bounded to a practical desktop range,
- opening an app resizes the map above the drawer instead of covering it,
- closing the app restores the map to the reclaimed space,
- app-specific views own their internal content but not shell placement,
- FreightLink marketplace mode shows available lanes on the map before a lane is selected,
- selecting a FreightLink lane keeps board selection and map selection synchronized,
- focused document/task modes may still expand beyond the shared drawer in later packets,
- Drivers and Ops remain map-context drawers rather than dock apps.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
