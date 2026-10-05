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

## Current packet — V2.7.4.1.1 Fleet Glance Scaling

V2.1 through V2.7.4.1 are accepted and locked. Dispatch gating, late-send recovery, fleet execution, route truth, and marker anchoring remain intact.

Fleet glance scaling rules:
- fleets with 1–5 drivers retain the existing one-chip-per-driver map strip,
- fleets with 6+ drivers switch to a compact selected-driver + fleet-health summary,
- the selected driver remains visible regardless of fleet size,
- up to two non-selected drivers requiring attention remain individually visible by initials/status,
- additional attention drivers collapse into a NEED ATTENTION counter,
- fleet summary counters include EN ROUTE, AT STOP, BREAK, SCHEDULED, and NOT SENT when nonzero,
- clicking a summary counter opens the Drivers browser filtered to that operational group,
- clicking DRIVERS opens the complete roster,
- the Drivers browser exposes the active filter and provides an ALL clear action,
- fleets with 6–10 drivers retain non-selected active-leg context at reduced opacity,
- fleets with 11+ drivers hide ordinary non-selected active legs by default; only attention-worthy context may break through,
- truck simulation remains fully active regardless of whether route context is hidden,
- persistent truck name labels remain click-only,
- do not change dispatch timing, late-send recovery, route execution, HOS, or appointment/service timing in this patch.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
