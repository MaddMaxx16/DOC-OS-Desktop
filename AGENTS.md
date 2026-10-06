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

## Current packet — V2.7.5.2 Trailer Rules: Weight Distribution / Balance

V2.1 through V2.7.5.1.2 are accepted and locked. Freight identity, persistent trailer state, direct onboard repositioning, reliable rotation, right-panel hierarchy, Delivery Access, rear-door commitment, Focused Mode, and downstream timing remain authoritative.

This packet adds the second trailer rule:

> a materially loaded trailer must distribute freight weight across both its length and width instead of concentrating the load at one end or on one side.

Weight-balance rules:
- calculate balance from the real placed freight weights and the actual occupied footprint cells,
- distribute a freight unit's weight evenly across its occupied floor cells,
- evaluate FRONT / REAR and LEFT / RIGHT as separate balance axes,
- the acceptable target band is 35–65% on each side of an axis,
- balance becomes active once onboard planned freight reaches 20% of the trailer's rated freight capacity,
- below that activation weight, the rule remains advisory and reports LIGHT LOAD,
- while the current pickup is incomplete, show live balance monitoring but do not add a readiness error solely for imbalance,
- once all booked freight for the current pickup is placed, an active out-of-band balance becomes enforceable,
- enforce FRONT HEAVY, REAR HEAVY, LEFT HEAVY, and RIGHT HEAVY states,
- an enforced imbalance prevents LOAD PLAN READY / READY TO CLOSE until corrected,
- the Trailer Rules section must include a dedicated Weight Distribution rule card below Delivery Access,
- show live FRONT / REAR and LEFT / RIGHT percentages,
- show target guidance and a direct directional fix when blocked,
- Required Action should surface FIX WEIGHT DISTRIBUTION when the completed plan is materially unbalanced,
- Delivery Access remains an independent rule and both rules must be satisfied for readiness,
- do not claim this is DOT axle compliance, tandem/kingpin math, or certified weight distribution,
- this is a simplified floor-balance gameplay abstraction only,
- do not add axle weights, sliding tandems, scale tickets, legal axle limits, vertical stacking, hazmat compatibility, fragile separation, keep-upright penalties, no-stack penalties, delivery puzzle, rework, HOS changes, or service-time changes in this packet.

After visual/gameplay acceptance, the next trailer-rule slice is handling restrictions.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
