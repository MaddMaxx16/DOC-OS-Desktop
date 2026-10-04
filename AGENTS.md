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

## Current packet — V2.7.1.1 Startup Route Guard

V2.1 through V2.6.5.14 are accepted and locked. V2.6 Daily Planning is complete. V2.7.1 Live Operations Foundation is implemented pending visual acceptance.

Guardrails:
- preserve every locked planning, routing, map, booking, Rate Con, and V2.7.1 live-clock invariant,
- no-selection startup must never treat null route state and null selected-driver state as a valid route match,
- route rendering may read segments only when both a selected driver and a driver-scoped route result exist,
- activate the existing top-right pause/play/fast-forward runway instead of redesigning the header,
- simulation begins at 6:00 AM, Day 1, paused,
- Play advances one game minute per simulation tick; Fast Forward advances four game minutes per tick,
- Focused Workspace freezes simulation time regardless of the requested clock mode,
- closing Focused Workspace may resume the previously requested Play/Fast mode,
- only SENT Driver Days are armed for Live Operations,
- before shift start a sent plan is SCHEDULED; inside the shift window it becomes LIVE READY,
- draft plans remain planning truth only and are not live-executable,
- V2.7.1 does not move trucks, complete route legs, consume service time, mutate HOS, or auto-complete stops,
- truck movement and execution-position truth belong to the next V2.7 slice,
- do not let clock activation mutate route timing, Driver Day order, appointments, capacity, or sent-plan contents.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
