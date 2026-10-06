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

## Current packet — V2.7.6.2 Receiving Floor Protocol

V2.1 through V2.7.5.4 are accepted and locked.
V2.7.6 Delivery Operations architecture is preserved.
V2.7.6.1 established that Delivery must physically manipulate the persistent trailer rather than use a checklist, but its single generic Receiving Bay was not sufficient gameplay.

This packet expands physical unloading into a two-space puzzle:

**Receiving Floor ← Dock Threshold ← Physical Trailer**

Physical trailer:
- Delivery must visibly read as the same 53' trailer used during Pickup,
- preserve the 4×7 trailer floor model and committed freight positions,
- show trailer nose, side walls, rear frame/doors, floor grid, and wheels/chassis cues,
- freight remains physically draggable from the trailer,
- clicking a freight unit may select it as an accessibility fallback, but must not replace physical cargo identity,
- unloaded or temporarily staged freight leaves the visible trailer,
- rear-door accessibility remains derived from actual trailer positions.

Facility receiving floor:
- render physical receiving zones beside the trailer rather than one generic drop box,
- each active facility protocol defines ordered receiving phases,
- each phase maps a handling family to a named receiving zone,
- the facility floor visibly shows received freight accumulating in the correct zone,
- Temporary Staging remains a physical dock-apron zone.

Harborline gameplay SOP:
1. CONTROLLED FREIGHT → CONTROLLED RECEIVING — HAZMAT
2. FORKLIFT HANDLING → FORKLIFT LANE — HEAVY / OVERSIZE
3. FRAGILE INSPECTION → INSPECTION — FRAGILE
4. GENERAL RECEIVING → GENERAL RECEIVING — remaining freight

Freshway has a different receiver-specific sequence to establish that facility protocols are not universal rules.

Critical accuracy boundary:
- these are fictional facility receiving procedures for DOC OS gameplay,
- do not describe them as universal DOT/FMCSA/warehouse rules,
- HAZMAT does not universally have to unload first,
- facility SOP is the source of the sequence requirement.

Delivery decision model:
1. What is the receiver's current phase?
2. Which physical freight belongs to that phase?
3. Can that freight physically reach the rear doors?
4. Which receiving zone must it enter?
5. If blocked, is a rehandle required?

Phase enforcement:
- only freight assigned to the current facility phase may be accepted,
- freight sent before its phase opens is rejected,
- freight sent to the wrong receiving zone is rejected,
- successful receipt advances phase progress,
- when all freight in a phase is received, the next phase opens,
- the handoff cannot complete until all active phases are complete.

Temporary staging:
- later-stop freight may be staged when it physically blocks the active delivery,
- same-delivery freight from a later receiving phase may also be staged when it physically blocks the current phase,
- same-delivery freight staged for access may later move directly from Temp Staging into its receiving zone once that phase opens,
- unnecessary rehandles are rejected,
- each unique staged unit remains one rehandle / two handling moves / +3 minutes service time,
- later-stop freight remaining after delivery is restored to its original trailer placement.

Interaction:
- drag physical freight from Trailer → facility zone,
- drag blocking freight from Trailer → Temp Staging,
- staged freight remains draggable,
- click freight then click a zone is a fallback for browser/native drag reliability,
- the right panel is a compact Facility SOP/progress panel, not a freight answer list,
- do not pre-highlight all correct current-phase freight.

Persistence:
- receivingZoneByFreightId is stored in the unload plan,
- actual unloadSequence remains ordered,
- delivered freight history records its receiving zone,
- same-stop Temp Staging history is retained before delivery,
- trailerAfter remains authoritative for later stops.

Time model remains locked:
- Focused Mode pauses world time,
- physical manipulation is planning/coordination time,
- Confirm Handoff begins simulated unloading,
- rehandles add service time,
- receiver verification follows,
- routine clean delivery auto-departs.

Known Live Operations UX backlog remains deferred:
- SEND SCHEDULE needs a normal-workflow entry point outside Planning state,
- add Advance to Next Event / Next Operational Moment instead of manually waiting through fast-forward.

Do not add damage/refusal randomness, claims, Documents UI, HOS changes, a new Pickup handling rule, or Live Operations time-navigation changes in this packet.

Visual/gameplay acceptance is required before the next delivery exception packet.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
