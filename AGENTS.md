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

## Current packet — V2.7.4.0.1 Fleet Map Clarity

V2.1 through V2.7.4.0 are accepted and locked. Fleet execution remains simultaneous and independent of UI selection.

Core invariant:

> selection is UI; simulation is world state.

Readability rules:
- all drivers continue executing at all times,
- only the selected driver shows the full detailed Driver Day route and committed stops,
- non-selected live drivers may show only their current active road leg as faint context,
- non-selected trucks are visually quieter than the selected truck but remain clickable,
- truck name labels remain click-only; fleet readability must not reintroduce persistent map labels,
- a compact fleet glance strip may show initials + operational status and may switch driver selection,
- when no driver is selected, all trucks read at equal strength as a fleet overview,
- FreightLink workspace hides fleet active-leg context to protect freight-preview readability,
- switching selection must not affect any driver's execution position, route progress, facing, or live state,
- do not change dispatch timing, route hydration, late-send behavior, HOS, or service timing in this patch.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
