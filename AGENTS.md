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

## Current packet — V2.7.3.5 Native Planning POIs

V2.1 through V2.7.3.4 are accepted and locked. Complete route truth, smooth truck motion, click-only driver labels, and native committed P/D/L/S stops remain intact.

Guardrails:
- lunch/staging planning candidates use MapLibre-native GeoJSON layers, not HTML/DOM Marker positioning,
- candidate POIs preserve their semantic place type: food, truck stop, staging, yard, fuel, service, or warehouse,
- committed lunch/staging use the same semantic icon family as planning candidates,
- pickup/delivery retain P#/D# load badges because freight sequence and identity remain operationally useful,
- planning candidate circles use a distinct preview treatment so they read as choices rather than committed stops,
- hovering a candidate may reveal its place label; clicking it previews that location through the existing planning workflow,
- the currently previewed candidate is represented by the preview Driver Day route/stop and must not render twice,
- semantic icon sprites are registered once on map load and shared by committed and planning layers,
- planning-place DOM marker markup and CSS are retired,
- FreightLink preview pickup/delivery DOM markers remain valid preview-only context,
- do not alter route geometry, routing retries, truck interpolation, simulation timing, HOS, planning calculations, or facility-service timing in this packet.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
