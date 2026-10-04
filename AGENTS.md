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

## Current packet — V2.4.5 FreightLink Map Focus Cleanup

V2.1 through V2.4.4 are structurally locked.

V2.4.5 removes visual overlap and stale-preview risk discovered during final FreightLink testing.

Guardrails:
- preserve the V2.4.4 flat north-up camera and 46% shared app drawer,
- FreightLink has two map modes: marketplace overview and selected-lane focus,
- marketplace overview may show compact load opportunities and driver assets,
- selected-lane focus hides unrelated marketplace opportunity markers,
- selected-lane focus hides the candidate driver's full manifest stop set,
- selected-lane focus hides unrelated drivers,
- selected-lane focus shows the selected neutral route and its pickup/delivery facilities as the dominant map objects,
- FreightLink route preview data is rendered only when its lane id matches the currently selected LOAD id,
- stale route/marker data from a previous lane must never remain visible after selection changes,
- selected pickup/delivery facility markers stay compact and do not repeat redundant PICKUP/DELIVERY text,
- do not change FreightLink fit truth, map style, route semantics, shell structure, or typography scale,
- do not begin booking or Rate Confirmation behavior until V2.5.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
