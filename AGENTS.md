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

## Current packet — V2.7.3.3 Complete Route Truth

V2.1 through V2.7.3.2 are accepted and locked. Smooth truck motion and explicit-click driver labels must remain intact.

Guardrails:
- a committed Driver Day route snapshot may publish only when every planned leg has real road geometry,
- timing-only estimate legs are internal retry state and must not appear as a partially complete operational route,
- unresolved committed legs retry automatically while the selected Driver Day remains active,
- the last complete same-driver route may remain visible while a replacement route resolves,
- committed operational stop markers must never fall back to raw facility coordinates when their road-access coordinate is unresolved,
- if road-access truth for a committed stop is unavailable, hide that operational marker until the route leg resolves rather than displaying a floating icon,
- committed P/D map-native markers and committed L/S DOM markers must both use route-access truth only,
- facility coordinates remain valid for planning candidates and non-committed preview context, but not as a substitute for committed road-access truth,
- route retries must preserve serialized OSRM access and existing route caching,
- do not change route timing, HOS, plan evaluation, truck interpolation, or facility service timing in this packet.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
