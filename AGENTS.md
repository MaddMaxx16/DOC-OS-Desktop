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

## Current packet — V2.7.5.0 Dock & Load Foundation

V2.1 through V2.7.4.2 are accepted and locked. Physical arrival, appointment waiting, Fleet Roster, dispatch gating, late-send recovery, fleet execution, route truth, and marker anchoring remain intact.

Core pickup invariant:

> the player plans the load; the warehouse executes the load afterward.

Pickup flow in this packet:
- road arrival and appointment waiting remain owned by V2.7.4.2,
- when an appointment-ready pickup has no committed load plan, execution enters facility-dock-assigned instead of automatic LOADING,
- facility-dock-assigned parks the truck at the pickup and blocks all downstream execution,
- the assigned dock is deterministic per pickup for this foundation packet,
- Driver Day exposes OPEN DOCK & LOAD only for the active pickup that owns the dock gate,
- opening Dock & Load creates a Focused Mode task; the global simulation clock pauses while the player thinks,
- closing the focused workspace without committing leaves the driver at DOCK ASSIGNED,
- the initial puzzle shows booked-load reference, staged freight, a 26-position dry-van board, verification state, readiness, and rear-door commitment,
- the tutorial staging set contains the complete expected pallet set plus one clearly discoverable unrelated freight unit,
- verified freight can be dragged into trailer positions or placed into the next open position,
- planned freight can be returned to staging before commitment,
- the first-slice readiness gate requires all expected freight verified and planned and rejects unrelated freight in the plan,
- closing the rear doors commits the load plan, exits Focused Mode, and starts background LOADING at the current simulation minute,
- focused decision time consumes no simulation time,
- a delayed door commit shifts downstream route timing from the actual loading start rather than retroactively loading,
- warehouse loading duration still uses the existing deterministic pickup service duration in this packet,
- automatic departure resumes after loading completes because route execution remains authoritative,
- this packet does not yet implement stacking, weight-balance scoring, stop-access warnings, freight ambiguity difficulty, dock congestion delay, rework, final paperwork exceptions, or delivery puzzle gameplay,
- those systems must extend the committed trailer/facility model instead of replacing it,
- do not change live HOS depletion in this packet.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
