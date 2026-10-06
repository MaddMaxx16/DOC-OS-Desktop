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

## Current packet — V2.7.5.3.1 Trailer HUD Simplification

V2.1 through V2.7.5.3 are accepted and locked. Freight interaction, persistent cargo, Delivery Access, Weight Balance, Fragile Protection, rotation, rear-door commitment, and simulation timing remain authoritative.

This packet changes information hierarchy only. It does not weaken or remove trailer rules.

HUD rules:
- healthy trailer rules render as compact rows rather than expanded cards,
- only a rule that actually needs player action expands to show PROBLEM / FIX detail,
- live/incomplete rule evaluation uses a neutral LIVE state rather than warning-color treatment,
- reserve red for actual blockers,
- reserve green for final READY TO CLOSE success,
- normal/healthy rule states use neutral/muted styling,
- Delivery Access stays readable in one compact row with unload order,
- Weight Balance stays readable in one compact row using F/R and L/R percentages,
- Fragile Protection stays readable in one compact row,
- remove persistent weight bars, target callouts, fragile rule-definition copy, and healthy explanatory boxes from normal play,
- preserve the underlying rule calculations and readiness gating unchanged,
- Required Action should not duplicate the full fix already expanded inside a blocked rule,
- while freight is still missing, LOAD REMAINING FREIGHT is a neutral pending action rather than an error state,
- when all freight is loaded but rules are blocked, Required Action may summarize that trailer rules still need attention,
- Trailer Status collapses to one line containing positions, weight, and onboard units,
- final success is one READY TO CLOSE strip; do not repeat it with a second TRAILER PLAN COMPLETE card,
- right-panel text must remain readable at normal desktop viewing distance,
- scrolling remains a fallback, not the normal information model.

Do not add HAZMAT, NO STACK, KEEP UPRIGHT, additional handling restrictions, axle math, vertical stacking, delivery puzzle, HOS changes, or service-time changes in this packet.

After visual acceptance, continue handling restrictions one rule at a time.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
