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

## Current packet — V2.7.6 Delivery Operations

V2.1 through V2.7.5.4 are accepted and locked.

Delivery is now the active packet.

Core delivery contract:
- delivery is not pickup in reverse,
- delivery opens from the exact persistent trailer state produced by pickup,
- freight IDs and trailer placements remain authoritative,
- Focused Mode pauses simulation while the player reasons,
- a delivery stop holds at DOCK ASSIGNED until the player commits an unload plan,
- the player selects the current stop's actual freight,
- rear-door accessibility is derived from physical trailer positions,
- later-stop freight may be temporarily staged when it blocks current-stop freight,
- temporary staging creates rehandle count and additional unload time,
- commit ends Focused Mode and starts background unloading,
- after unloading, a short receiver-verification phase runs in simulation,
- clean receiver results are ACCEPTED in this first active slice,
- routine completion automatically continues the route; no manual DEPART action,
- accepted freight physically leaves the trailer snapshot,
- the delivery trailerAfter snapshot becomes authoritative for later stops,
- this architecture must preserve refused/retained freight in future exception packets.

Expected versus actual:
- expected delivery freight comes from the matching pickup freight-unit identities,
- actual freight comes from the physical trailer snapshot,
- shortage/wrong-delivery validation is ID-based rather than count-only,
- clean current tutorial flows should normally have no shortage because pickup validation is strict.

Documents:
- Delivery does not own a separate POD copy,
- the Documents domain owns POD records,
- committing a delivery creates a PENDING_RECEIVER POD record,
- the POD becomes RECEIVED after clean receiver verification,
- damage/refusal/shortage outcomes will produce REVIEW_REQUIRED when those exception systems are activated,
- the Documents workstation UI remains scheduled for its existing build phase; this packet only establishes the authoritative document data seam.

Initial-scope boundary:
- do not randomly generate damage,
- do not randomly create missing or wrong freight,
- do not activate refusal gameplay yet,
- do not add a full claims system,
- do not add vertical stacking/securement,
- do not add another pickup handling rule,
- do not alter HOS or route-planning behavior beyond delivery service timing,
- preserve the simplified Trailer HUD and accepted pickup mechanics.

The next delivery slices after acceptance are:
1. blocked-delivery tutorial / temporary rehandle polish,
2. one known freight-condition exception,
3. receiver/POD exception handling.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
