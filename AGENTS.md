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

## Current packet — V2.7.4.0.2 Fleet Route Lock

V2.1 through V2.7.4.0.1 are accepted and locked. Fleet execution and fleet-map readability remain intact.

Core invariant:

> the rendered truck coordinate and the rendered active road leg must come from the same authoritative route segment.

Guardrails:
- fleet active-leg rendering and per-driver truck motion use one shared active-segment lookup,
- a truck may never animate against a different routeShape than the active leg shown for that driver,
- selected-driver full-route display prefers an exact active preview only when its route key matches the currently displayed preview day,
- stale same-driver preview geometry must never override committed fleet execution geometry,
- non-selected trucks remain full-size at their map anchor and are de-emphasized by opacity/filter only,
- do not use scale transforms to create fleet hierarchy because the truck SVG is asymmetric and scale can make route alignment look wrong,
- all prior fleet execution rules remain: selection is UI; simulation is world state,
- do not change dispatch gating, late-send recovery, appointment waiting, HOS, or facility timing in this patch.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
