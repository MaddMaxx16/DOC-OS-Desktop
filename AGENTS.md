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

## Current packet — V2.6.5.5 Proven Route Markers

V2.1 through V2.6.4.1 remain the locked gameplay foundation. V2.6.5 map declutter remains accepted in intent, but its grouped committed-freight marker implementation is retired after visual regression.

Guardrails:
- preserve selected-driver committed route persistence when the inspector closes,
- restore the proven V2.6.4.1 committed freight-stop marker architecture,
- normal Driver view renders freight pickups/deliveries from driverDay.freightStops,
- committed freight markers use their original bottom-anchored MapLibre marker geometry,
- route rendering returns to per-segment road routing from the authoritative Driver Day order,
- timing-only estimate geometry must not be drawn as a committed blue road,
- label declutter is presentation-only and must not replace or reposition committed freight-stop markers,
- PICKUP / DELIVERY text beneath normal committed markers stays hidden to reduce clutter,
- selected stop and next planned stop may expose the facility name,
- other committed freight stops remain badge-first and reveal facility name on hover/focus,
- non-freight Lunch/Staging route anchors remain separate from committed freight markers,
- same-facility marker grouping is deferred; do not reintroduce it until it can be implemented without changing proven route/marker geometry,
- do not alter Driver Day sequencing, plan truth, route ownership, or sent-plan behavior in this packet.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
