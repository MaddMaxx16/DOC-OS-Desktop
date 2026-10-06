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

## Current packet — V2.7.6.8 Dock Continuity & Placement Stability

V2.1 through V2.7.5.4 are accepted and locked.
V2.7.6 Delivery Operations architecture remains authoritative.
V2.7.6.2 receiver-specific SOP logic remains authoritative.
V2.7.6.3 pointer-owned freight movement remains authoritative.
V2.7.6.4 Delivery Space Management remains authoritative.
V2.7.6.5 warehouse physicalization remains authoritative.
V2.7.6.6 rear handling paths and pointer recovery remain authoritative.
V2.7.6.7 warehouse contrast, staging freight fidelity, and Freshway wording remain authoritative.

V2.7.6.8 is the active Delivery packet.

### Purpose

Gameplay review shows three remaining presentation/stability issues:

1. staged freight can render beneath the painted Temp Staging bays instead of physically occupying them,
2. already-received freight can visually shift because receiver-floor positions are recalculated as more freight arrives,
3. the warehouse/trailer relationship still needs a stronger physical dock threshold.

This packet fixes only those three issues.

### Temp Staging occupancy

Temp Staging remains exactly 3 pallet-equivalent positions.

The painted staging bays and staged freight must occupy the same physical coordinate layer.

Requirements:
- each bay is fixed to an explicit staging slot,
- staged freight is explicitly anchored to its occupied slot(s),
- bay visuals remain underneath freight,
- staged freight may not fall into an implicit extra grid row,
- footprint-based capacity remains unchanged,
- freight fidelity from V2.7.6.7 remains unchanged.

### Persistent receiver-floor placement

Receiver zones remain automatic placement areas, not a second packing puzzle.

Once freight is accepted into a receiver zone:
- assign its physical warehouse position once,
- preserve that position for the remainder of the focused Delivery operation,
- do not recompute settled cargo positions when later freight arrives,
- new freight must choose from the remaining free zone positions,
- settled freight may not visually shuffle/repack.

Implementation should retain a persistent map keyed by freight ID rather than deriving every warehouse position from the current received-freight array on each render.

### Dock continuity

Do not redesign the warehouse or trailer.

Strengthen only the physical connection at the dock:
- warehouse-side dock door/jamb,
- dock threshold,
- dock plate / leveler,
- dock bumpers,
- apron termination at the door,
- a localized rear connector between warehouse and trailer.

The previous full-height divider should visually recede.
The physical connector should read near the trailer rear / receiving apron.

Temp Staging may shift modestly toward the dock threshold so it reads as dock-apron space, but:
- staging capacity remains 3,
- receiver zones remain in their current overall layout,
- trailer proportions remain unchanged,
- right HUD remains unchanged.

### Preserved mechanics

Do not alter:
- handling-path rules,
- pointer recovery,
- trailer repositioning,
- staging capacity or footprint accounting,
- receiver SOP order or membership,
- Freshway QUALITY CHECK wording,
- rehandle timing,
- unload sequence,
- background unload / receiver verification / auto-depart,
- Pickup/Delivery shared TrailerShell,
- right-side receiver/SOP hierarchy.

### Acceptance requirements

V2.7.6.8 requires gameplay confirmation that:

1. staged freight sits directly inside the painted staging bays,
2. multi-slot staged freight spans the correct physical bays,
3. no staged freight renders beneath the target bays,
4. receiver-floor freight stays in the position where it originally settled,
5. adding new freight does not shuffle earlier received freight,
6. the dock door/threshold/leveler reads more physically,
7. the full-height separator no longer dominates the warehouse/trailer relationship,
8. Temp Staging visually belongs near the dock apron,
9. accepted trailer, warehouse freight visuals, handling-path gameplay, and right HUD remain unchanged.

### Explicit non-goals

Do not add:
- new receiver rules,
- new staging rules,
- new freight categories,
- new difficulty systems,
- forklifts/NPCs,
- scoring/XP UI,
- route/planning changes,
- schedule-send changes,
- next-event controls.

V2.7.6.8 is a focused placement-stability and dock-continuity pass.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
