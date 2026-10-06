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

## Current packet — V2.7.5.1.2 Right Panel Hierarchy Polish

V2.1 through V2.7.5.1.1 are accepted and locked. Freight identity, persistent trailer state, direct onboard repositioning, reliable rotation, delivery-access rules, rear-door commitment, Focused Mode, and downstream timing remain authoritative.

This packet changes right-side information hierarchy only. It does not add or alter trailer simulation rules.

Right-panel rules:
- the panel is organized as Load Summary → Load Completion → Trailer Status → Trailer Rules → Required Action / Ready to Close,
- Load Summary owns load number, pickup, destination, expected freight, and freight already onboard from earlier loads,
- do not repeat Driver or Trailer identity in the right panel when they are already clear in the focused workspace and trailer heading,
- Load Completion owns the current-pickup loaded count and progress,
- Trailer Status owns floor positions, total trailer weight, and total onboard unit count,
- do not repeat THIS PICKUP in Trailer Status when Load Completion already shows the same count,
- Trailer Rules is a dedicated section; Delivery Access remains its first rule card,
- Delivery Access logic, unload order, CLEAR/BLOCKED state, PROBLEM/FIX copy, and readiness gating remain unchanged,
- Required Action must have guaranteed readable space and may never collapse into a narrow warning strip,
- when booked freight is still missing, show a direct action such as “5 M-202 units still need to be loaded,”
- other geometry, wrong-load, overweight, delivery-access, or warning conditions remain readable action cards,
- when the plan is fully valid, Required Action becomes a compact READY TO CLOSE state,
- remove the right-panel Focused Mode footer because the top bar already communicates Focused Mode,
- the panel should scroll naturally if its content exceeds available vertical space rather than compressing critical guidance,
- preserve the larger readable text floor established in V2.7.5.1.1,
- do not add weight distribution, axle logic, handling penalties, stacking rules, Top Down/Side View functionality, delivery puzzle, rework, HOS changes, or service-time changes.

After visual/gameplay acceptance, proceed to V2.7.5.2 Weight Distribution / Balance.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
