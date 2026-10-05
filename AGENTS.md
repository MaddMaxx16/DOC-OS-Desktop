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

## Current packet — V2.7.4.1.3 Fleet Roster Cleanup

V2.1 through V2.7.4.1.2 are accepted and locked. Fleet search/filter/risk behavior, Fleet Glance scaling, dispatch gating, fleet execution, route truth, and marker anchoring remain intact.

Product hierarchy:
- quick driver chips own lightweight operational status and driver switching,
- Fleet owns roster scanning/search/filtering/risk,
- Driver Day owns detailed driver metrics such as HOS and the full timeline.

Fleet row rules:
- do not duplicate HOS in Fleet while Driver Day already owns that detail,
- do not repeat ordinary PLAN NOT SENT / EN ROUTE status text inside every Fleet row; the quick chips and Fleet filters already carry fleet-status context,
- each Fleet row shows the driver identity, inline NEXT stop/ETA, assigned load count, and RISK,
- NEXT replaces the old instructional/detail sentence under the driver name,
- remove instructional copy such as "Send the schedule to arm Live Operations" from roster rows,
- LOADS is a simple assigned-load count, not a miniature load-detail view,
- RISK remains the exception surface: DISPATCH REQUIRED -> BLOCKER -> WARNING -> CLEAR,
- risk must have right-side breathing room and must not hug the browser edge,
- Fleet may be narrower than V2.7.4.1.2 now that duplicate columns are gone; the map should regain that space,
- search may still index operational status/detail text even when those strings are not rendered redundantly,
- clicking the row still selects the driver and opens Driver Day,
- do not change route execution, dispatch timing, late-send recovery, appointment/service timing, or HOS calculations in this packet.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
