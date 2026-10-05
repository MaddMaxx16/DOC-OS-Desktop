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

## Current packet — V2.7.4.1.2 Fleet Roster

V2.1 through V2.7.4.1.1 are accepted and locked. Fleet glance scaling, dispatch gating, fleet execution, route truth, and marker anchoring remain intact.

Product hierarchy:
- quick driver chips are glance + driver switching,
- Fleet is the roster/search/filter/risk command board,
- Driver Day is the detailed one-driver operations workspace.

Fleet roster rules:
- keep the internal app id `drivers` stable, but present the navigation label as Fleet,
- Fleet receives committed Driver Days and live driver states; it must not duplicate or invent operational truth,
- each roster row exposes DRIVER / STATUS, HOS, LOAD, NEXT, and RISK,
- current/next load identity comes from Driver Day freight stops and live current/next event ids,
- live onboard count/pallet state comes from live execution state,
- next-stop ETA comes from live state when available and Driver Day as fallback,
- risk priority is DISPATCH REQUIRED -> BLOCKER -> WARNING -> CLEAR,
- Fleet search matches driver, initials, status, stop, risk, and load reference,
- map-summary filters continue to open Fleet already filtered to the matching operational group,
- Fleet gets a slightly wider browser than FreightLink; the map remains the primary workspace,
- clicking a roster row selects that driver and opens the existing Driver Day inspector,
- Fleet HOS currently reflects the Driver Day HOS source; live HOS depletion will replace that source in the dedicated HOS packet,
- do not add duplicate persistent driver labels to the map,
- do not change dispatch timing, route execution, late-send recovery, appointment/service timing, or HOS calculations in this packet.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
