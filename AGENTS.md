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

## Current packet — V2.7.3.1 Route-Locked Smooth Truck Motion

V2.1 through V2.7.3 are accepted and locked. Facility service execution remains intact.

Guardrails:
- preserve every locked planning, booking, routing, camera-ownership, live-clock, facility-service, and cargo-state invariant,
- the truck's geographic coordinate must stay on the same committed road LineString rendered to the player,
- smooth motion must interpolate execution progress along routed geometry, never interpolate longitude/latitude directly across road corners,
- clock truth remains authoritative; animation only smooths presentation between clock ticks,
- a new clock tick may cancel the previous visual tween and continue from the truck's current rendered route progress,
- 4× simulation may cover more road per real second, but the truck must still visibly traverse that road rather than teleport between tick positions,
- the truck marker artwork must be centered on its geographic coordinate; hover/selection labels must not change marker anchoring,
- driver labels may float outside the marker layout but must not become part of the coordinate-bearing box,
- manual pan/zoom remains player-owned and moving trucks must not recenter the map,
- service phases remain parked states and must snap/hold at the routed facility access coordinate,
- do not add vehicle physics, lane-level navigation, traffic, heading rotation, or camera following in this hotfix.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
