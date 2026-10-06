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

## Current packet — V2.7.5.3 Handling Restrictions: Fragile Protection

V2.1 through V2.7.5.2 are accepted and locked.

This packet activates one handling rule only:
- FRAGILE freight may not share an edge with HEAVY or OVERSIZE freight,
- diagonal contact is allowed,
- conflicts are evaluated from actual occupied footprint cells,
- while the pickup is incomplete the rule monitors live but does not block readiness,
- once all booked freight is loaded, any fragile conflict blocks READY TO CLOSE,
- conflicting FRAGILE freight and the HEAVY/OVERSIZE freight causing the risk must be visually distinguishable,
- Trailer Rules gains a FRAGILE PROTECTION card with CLEAR / MONITOR / PROTECTED / SEPARATE states,
- Required Action must surface PROTECT FRAGILE FREIGHT with a specific move instruction,
- this is a gameplay handling abstraction, not a regulatory cargo-securement standard.

Do not activate HAZMAT compatibility, NO STACK enforcement, KEEP UPRIGHT enforcement, vertical stacking, axle math, delivery puzzle, HOS changes, or service-time changes in this packet.

After acceptance, continue handling restrictions one rule at a time.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
