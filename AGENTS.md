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

## Current packet — V2.7.3.2 Driver Label + Marker Alignment Cleanup

V2.1 through V2.7.3.1 are accepted and locked. Route-locked smooth truck motion must remain untouched.

Guardrails:
- preserve the V2.7.3.1 route interpolation and clock behavior exactly,
- driver name labels are hidden by default and appear only when the player explicitly selects that driver's truck,
- selecting a stop/load that resolves to a driver must not implicitly open the driver's map label,
- the selected-driver glow may remain independent from label visibility,
- the geographic coordinate of every coordinate-bearing DOM marker must correspond to the visual center of its icon artwork,
- committed lunch/staging route anchors use center anchoring,
- planning-place and FreightLink pickup/delivery preview icons use center anchoring,
- labels, badges, and role chips must float outside the coordinate-bearing icon box and must not change MapLibre marker geometry,
- hover/selected scale effects may enlarge icons but must not translate them away from their geographic coordinate,
- committed P/D freight stops remain map-native and continue using canonical stitched route access coordinates,
- do not change route calculation, truck motion, planning timing, or facility service behavior in this cleanup.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
