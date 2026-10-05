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

## Current packet — V2.7.4.1 Dispatch Gating + Late Send Recovery

V2.1 through V2.7.4.0.4 are accepted and locked. Fleet execution, fleet route truth, marker anchoring, and fleet map clarity remain intact.

Core dispatch rules:
- an unsent driver never begins route execution merely because the global clock reaches the planned shift start,
- before shift start an unsent driver remains PLAN NOT SENT,
- at or after planned shift start an unsent driver becomes DISPATCH REQUIRED and holds at the start/current truck position,
- other drivers continue executing; dispatch-required state never pauses the fleet clock,
- the top operations bar and fleet surfaces must surface dispatch-required drivers clearly,
- when a late schedule is finally sent, the current absolute game minute becomes that driver's actual dispatch/departure start,
- downstream freight arrivals, Lunch timing, Staging arrival, appointment margin, and plan analysis are recalculated from the actual dispatch start,
- the original scheduled shift start remains preserved as schedule truth; late dispatch does not rewrite the planned shift,
- late dispatch may create appointment/HOS warnings after the send because the delay is an operational consequence,
- sending late must never retroactively complete route legs, service events, or freight state,
- the driver begins at route progress zero from the start location at the actual send minute,
- dispatch send metadata records sentAtMinutes and sentAtDayNumber,
- V2.7.4.1 does not yet separate physical arrival from appointment waiting; that remains V2.7.4.2,
- do not change fleet route hydration, truck animation, HOS depletion, or facility-service timing in this packet.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
