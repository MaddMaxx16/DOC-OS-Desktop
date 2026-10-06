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

## Current packet — V2.7.5.4 Handling Restrictions: HAZMAT Segregation

V2.1 through V2.7.5.3.1 are accepted and locked. Freight interaction, persistent cargo, Delivery Access, Weight Balance, Fragile Protection, compact Trailer HUD behavior, rotation, rear-door commitment, and simulation timing remain authoritative.

This packet activates one additional handling rule while preserving the simplified HUD.

HUD typography:
- apply the accepted one-notch readability increase to the right-side operational HUD,
- keep the simplified V2.7.5.3.1 hierarchy locked,
- do not widen the panel or reintroduce persistent charts/explanations.

HAZMAT identity:
- tutorial HAZMAT freight carries a visible hazard class in addition to the generic HAZMAT handling code,
- the current tutorial subset uses Class 3 FLAMMABLE LIQUID and Division 5.1 OXIDIZER,
- the class marking must be readable on the physical freight and in the staging manifest,
- hazard class identity persists with carried freight between pickup stops.

HAZMAT segregation:
- segregation is class-specific; do not treat all HAZMAT as mutually incompatible,
- for this tutorial subset, Class 3 and Division 5.1 are an incompatible pair requiring separation,
- the game models required separation as: incompatible hazmat units may not share a trailer-floor edge,
- diagonal placement is allowed by this simplified floor abstraction,
- while the current pickup is incomplete, the rule is LIVE only,
- once all booked freight is onboard, an unresolved incompatible pair blocks READY TO CLOSE,
- conflicting HAZMAT freight must receive a restrained visual highlight,
- Trailer Rules gains one compact HAZMAT SEGREGATION row,
- only a HAZMAT blocker expands to show PROBLEM / FIX detail,
- Required Action must not duplicate the expanded rule explanation.

Accuracy boundary:
- this is a simplified training/gameplay subset inspired by class-specific highway segregation rules,
- it is not a complete 49 CFR hazardous-material compliance engine,
- do not claim the trailer plan is legally certified or regulatory-complete.

Do not add additional hazard classes, placarding, shipping-paper checks, NO STACK enforcement, KEEP UPRIGHT enforcement, vertical stacking, axle math, delivery puzzle, HOS changes, or service-time changes in this packet.

After visual/gameplay acceptance, continue handling restrictions one rule at a time.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
