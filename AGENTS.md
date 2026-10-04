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

## Current packet — V2.4.7 Route Anchors

V2.1 through V2.4.6 are structurally locked.

V2.4.7 restores spatial anchors for the candidate driver's committed day without reintroducing map clutter.

Guardrails:
- preserve the V2.4.6 colored committed route + neutral insertion preview,
- while FreightLink is open, render compact route anchors for the candidate driver's meaningful Driver Day locations,
- route anchors are derived from the authoritative Driver Day timeline,
- pickup/delivery anchors retain P1/P2/P3 and D1/D2/D3 badges,
- shift-start/yard, lunch, and staging retain typed POI symbols,
- multiple timeline events at the same physical location collapse into one marker with combined badges,
- existing route anchors are smaller and quieter than selected FreightLink pickup/delivery markers,
- route-anchor facility names stay hidden until hover,
- selected FreightLink pickup/delivery markers remain visually dominant,
- when an existing route anchor shares the exact facility with the proposed pickup/delivery, offset the committed anchor slightly instead of stacking it directly underneath,
- unrelated marketplace opportunities and unrelated drivers remain hidden during selected-lane focus,
- do not change route truth, fit evaluation, map camera, drawer layout, typography, or booking behavior.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
