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

## Current packet — V2.7.3.6 Motion + Lunch Flow Polish

V2.1 through V2.7.3.5 are accepted and locked. Native operational/planning POIs, complete route truth, click-only driver labels, and facility-service execution remain intact.

Guardrails:
- truck artwork faces right when the local committed route is traveling east/right and faces left when the local route is traveling west/left,
- facing is derived from a short window of the actual routed LineString around current rendered progress, not from destination geography,
- nearly vertical road motion preserves the previous facing to avoid rapid left/right flicker,
- flip only the truck SVG; driver initials remain readable and reposition over the box body,
- the simulation clock remains authoritative while visual motion slightly overlaps the 1-second clock cadence to avoid stop-start gaps,
- a new clock tick cancels the unfinished tween and continues from current rendered route progress,
- do not introduce easing that changes gameplay timing or causes the visual truck to overshoot authoritative progress,
- lunch planning must consider direction of travel in addition to total detour,
- lunch options that leave the driver farther from the next scheduled stop receive a backtrack penalty,
- small backtracks remain legal; they are penalized rather than categorically forbidden,
- planning options expose TOWARD NEXT STOP / ROUTE NEUTRAL / BACKTRACK context to the player,
- staging ranking remains based on end-of-day proximity and is unchanged,
- do not alter route hydration, HOS, booking, service timing, or freight stop sequencing in this packet.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
