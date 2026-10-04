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

## Current packet — V2.6.5.7 Serialized Route Hydration

V2.1 through V2.6.4.1 remain the locked gameplay foundation. V2.6.5 label declutter and V2.6.5.6 operational access-point truth remain active.

Guardrails:
- preserve selected-driver route persistence and Driver Day plan truth,
- preserve facility-coordinate vs truck-access-coordinate separation,
- committed Driver Day road legs must not be requested in one Promise.all burst against the public OSRM endpoint,
- hydrate committed segments strictly in Driver Day order with at most one active road request at a time,
- successful road legs may appear progressively as they resolve,
- estimate fallbacks remain timing-only and must not render as committed blue roads,
- unresolved estimate legs receive a later retry wave automatically without requiring the player to refresh or edit the plan,
- successful route results remain cached; estimate failures remain uncached,
- operational P/D/L/S markers follow resolved truck-access coordinates and fall back to facility coordinates only while their road leg is unresolved,
- do not restore the retired continuous multi-waypoint routing experiment,
- remove retired routing helpers/tests that are no longer used by runtime code,
- do not alter sequencing, HOS, appointments, capacity, sent-plan truth, or driver ownership in this packet.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
