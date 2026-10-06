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

## Current packet — V2.7.5.1.1 Rotation + Rule-Panel Readability

V2.1 through V2.7.5.1 are accepted and locked. Freight identity, persistent trailer state, direct onboard repositioning, delivery-access rules, rear-door commitment, Focused Mode, and downstream timing remain authoritative.

This packet fixes two playtest issues without adding another trailer rule.

Rotation rules:
- placed freight with a non-square rectangular footprint must be rotatable before dragging,
- hovering or focusing a rotatable onboard freight piece and pressing R rotates it 90 degrees in place,
- rotatable onboard freight exposes a visible rotate control on hover/focus for discoverability,
- R during an active drag may remain supported but is not the only or required rotation path,
- in-place rotation must use the existing footprint legality check,
- if rotation would overlap freight or move out of bounds, reject the rotation and show the existing invalid interaction feedback,
- square/1x1/2x2 freight should not show a meaningless rotate control,
- direct drag/repositioning behavior remains unchanged.

Trailer-rule readability:
- the right-side HUD must use a comfortable gameplay text size; critical rule instructions may not use micro-label sizing,
- separate LOAD COMPLETION from TRAILER RULES so a fully loaded but rule-blocked trailer does not read as incomplete loading,
- Delivery Access must present UNLOAD ORDER clearly,
- blocked Delivery Access must present distinct PROBLEM and FIX guidance,
- CLEAR state must explain why the trailer is acceptable,
- D1/D2/D3 badges on individual cargo appear only when more than one delivery is onboard; single-delivery trailers do not repeat D1 on every freight piece,
- the unload order may still remain visible in the right-side rule card for a single delivery,
- preserve delivery-access logic, amber rule warning, red geometry invalid state, and rear-door readiness gating.

Do not add weight distribution, axle logic, fragile/hazmat penalties, stacking rules, Top Down/Side View functionality, delivery puzzle, rework, HOS changes, or service-time changes in this packet.

After visual/gameplay acceptance, proceed to V2.7.5.2 Weight Distribution / Balance.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
