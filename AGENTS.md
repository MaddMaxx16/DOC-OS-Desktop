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

## Current packet — V2.6.5.2 Route Endpoint Integrity

V2.1 through V2.6.5.1 remain the locked desktop foundation.

Guardrails:
- preserve V2.6.5 route visibility, grouped facility anchors, priority labels, and map declutter,
- preserve V2.6.5.1 floating label geometry,
- every committed route segment must render from its exact gameplay origin coordinate to its exact gameplay destination coordinate,
- routed road geometry may be snapped by the router, but the rendered shape must explicitly prepend/append the exact gameplay endpoints,
- if routed geometry is unavailable, render a direct fallback segment rather than silently dropping the committed leg,
- grouped P/D/L/S facility markers must use the exact same coordinates as the route-segment endpoints they represent,
- committed facility markers are center-anchored on the gameplay coordinate so the route visibly meets the icon,
- labels may move around the marker; the POI coordinate may not move,
- do not restore duplicate per-stop markers,
- do not change Driver Day order, scheduling truth, or route semantics in this correction packet.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
