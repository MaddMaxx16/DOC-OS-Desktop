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

## Current packet — V2.7.6.7 Warehouse Fidelity

V2.1 through V2.7.5.4 are accepted and locked.
V2.7.6 Delivery Operations architecture remains authoritative.
V2.7.6.2 receiver-specific SOP logic remains authoritative.
V2.7.6.3 pointer-owned freight movement remains authoritative.
V2.7.6.4 Delivery Space Management remains authoritative.
V2.7.6.5 warehouse physicalization remains authoritative.
V2.7.6.6 rear handling paths and pointer recovery remain authoritative.

V2.7.6.7 is the active Delivery packet.

### Purpose

Gameplay review shows the Delivery system is mechanically close to target.

This packet makes three tightly scoped corrections:

1. raise the receiver-floor brightness/contrast so the left side reads more clearly as an active warehouse gameplay surface,
2. make Temp Staging freight retain the same physical cargo fidelity and stable scale as trailer freight,
3. correct Freshway's misleading first-phase wording so its 0/2 requirement clearly describes one FRAGILE and one KEEP UPRIGHT unit rather than implying two fragile pallets.

### Warehouse contrast

Do not redesign the V2.7.6.5 warehouse layout.

Keep:
- one continuous receiving floor,
- painted zone geometry,
- current zone positions,
- current cargo placement,
- accepted trailer width and shell,
- accepted right-side SOP panel.

Change only visual legibility:
- lift the warehouse base luminance,
- improve floor/header/stencil contrast,
- make inactive zones readable without turning them into cards,
- keep active-zone emphasis restrained,
- preserve DOC OS's dark industrial visual language.

The left side should be lighter than V2.7.6.6 without becoming bright, washed out, or visually detached from the rest of the application.

### Temp Staging freight fidelity

Temp Staging remains exactly 3 pallet-equivalent positions.

The staging freight must use the same physical freight visual component as trailer freight.

The staging layout must not stretch freight to arbitrary fractional row widths.

Use a stable pallet-scale visual slot so staged freight preserves:
- cargo family,
- pallet/crate/skid/drum appearance,
- handling markings,
- label treatment,
- relative footprint,
- recognizable physical proportions.

A staged piece should look like the same physical object that was just removed from the trailer.

No staging-capacity or rehandle-rule changes are allowed.

### Freshway Quality Check wording

Freshway's first receiver phase currently matches:
- FRAGILE,
- UPRIGHT / KEEP UPRIGHT.

The gameplay rule is correct, but the label FRAGILE INSPECTION is misleading when the phase count includes keep-upright freight.

Freshway first phase is now:

**QUALITY CHECK**

Cargo summary:

**FRAGILE + KEEP UPRIGHT**

Destination:

**QUALITY CHECK**

The instruction should explicitly state that fragile and keep-upright freight clear quality check before controlled materials.

This is a wording/clarity correction only.
Do not change which freight IDs belong to the phase.

Harborline keeps its existing FRAGILE INSPECTION phase because Harborline's inspection phase matches FRAGILE only.

### Preserved mechanics

Do not alter:
- rear handling-path rules,
- source/destination reachability,
- pointer recovery behavior,
- trailer repositioning,
- staging capacity,
- staging footprint accounting,
- receiver phase order,
- phase membership,
- rehandle timing,
- background unload / receiver verification / auto-depart,
- Pickup trailer visual shell,
- Delivery trailer visual shell.

### Acceptance requirements

V2.7.6.7 requires gameplay confirmation that:

1. the receiver floor is noticeably easier to read at normal scale,
2. the warehouse remains dark/industrial rather than bright,
3. staging freight looks like the same physical cargo used in the trailer,
4. staged freight no longer appears stretched or flattened by the staging layout,
5. Freshway shows QUALITY CHECK instead of FRAGILE INSPECTION,
6. Freshway's phase summary clearly says FRAGILE + KEEP UPRIGHT,
7. the Freshway phase count still reflects the actual matching freight,
8. Harborline wording remains unchanged,
9. V2.7.6.6 handling-path difficulty remains unchanged,
10. the accepted trailer and right HUD remain unchanged.

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

V2.7.6.7 is a focused warehouse readability, staging-fidelity, and SOP-wording correction packet.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
