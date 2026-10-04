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

## Current packet — V2.6.5.3 Road Route Reliability

V2.1 through V2.6.5.2 remain the locked desktop foundation.

Guardrails:
- preserve V2.6.5 map declutter, grouped facility anchors, selected-route persistence, and priority labels,
- preserve V2.6.5.1 label-anchor integrity,
- preserve V2.6.5.2 exact gameplay endpoint normalization,
- public road-router failures must never be painted as thick committed driver routes,
- estimate fallback remains valid for timing/math but is not valid committed map geometry,
- committed route rendering accepts only geometry whose source is ROAD,
- road-route requests retry before falling back,
- failed estimate results are not cached so later refreshes can recover,
- Driver Day routing should use low concurrency rather than bursting every leg at the public router simultaneously,
- if a road leg remains unavailable after retries, leave an honest temporary gap instead of drawing a fake straight-line road,
- do not change Driver Day sequence, route semantics, or P/D/L/S coordinate truth in this packet,
- V2.7 must eventually move routing behind a production-grade routing strategy rather than depending on a public demo router as a permanent runtime assumption.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
