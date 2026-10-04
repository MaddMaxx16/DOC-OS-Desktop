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

## Current packet — V2.6.3 Breaks, Places + Staging

V2.1 through V2.6.2 remain the locked desktop foundation.

Guardrails:
- preserve the map-first command rail → browser → live map → inspector workstation,
- preserve V2.5 booking/Rate Con truth and committed freight ownership,
- preserve V2.6.1 DRAFT/SENT planning truth,
- preserve V2.6.2 committed-manifest sequencing, pickup-before-delivery, capacity guards, and plan-health feedback,
- replace card-half drop targeting with explicit insertion lanes between Driver Day events,
- freight stops and Lunch are movable planning events; Staging remains the end-of-day event,
- moving freight around Lunch must preserve the visible event order rather than treating Lunch as a fixed numeric slot,
- Lunch always resolves to a real selectable gameplay POI,
- Lunch place selection affects the committed route, downstream timing, appointments, and HOS,
- staging selection chooses the truck's real planned end-of-day location and changes the final route leg,
- lunch and staging candidates come from the shared gameplay location model and carry stable IDs,
- the same physical place records must be reusable by later RPG preference/favorite/cost/event systems,
- do not implement RPG consequence stats yet,
- do not auto-optimize place or stop choices; show consequences and let the player decide,
- readiness and Send Schedule still belong to V2.6.4,
- current truck position remains the default route origin.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
