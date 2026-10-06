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

## Current packet — V2.7.6.5 Warehouse Physicalization

V2.1 through V2.7.5.4 are accepted and locked.
V2.7.6 Delivery Operations architecture remains authoritative.
V2.7.6.2 receiver-specific SOP phases and receiving-zone validation remain authoritative.
V2.7.6.3 pointer-owned freight movement remains authoritative.
V2.7.6.4 space-management mechanics remain authoritative:
- shared Pickup/Delivery trailer shell,
- mutable Delivery trailer placements,
- Trailer → Trailer repositioning,
- finite footprint-based Temp Staging,
- internal reposition history,
- external rehandle history,
- receiver-floor freight persistence,
- current-state rear-access recalculation.

V2.7.6.4 visual acceptance is partial:
- the shared Pickup/Delivery trailer is accepted,
- the right-side receiver/SOP panel is accepted,
- the warehouse-side receiving floor is not accepted because it still reads as a UI diagram/card layout rather than a physical warehouse.

V2.7.6.5 is the active Delivery packet.

### Purpose

V2.7.6.5 is a **warehouse visual/physicalization pass**.

Do not redesign Delivery mechanics.

The goal is to make the receiving side feel like a physical warehouse floor where the same freight objects that leave the trailer visibly settle into real operational areas.

The intended scene should read immediately as:

**Warehouse floor ← dock apron / threshold ← same Pickup trailer**

not:

**zone panel | separator | trailer UI**

### Hard preservation rules

Do not change the following unless a visual bug makes it strictly necessary:
- shared Pickup/Delivery TrailerShell,
- trailer proportions,
- trailer floor geometry,
- trailer reposition rules,
- Temp Staging capacity,
- Temp Staging footprint rules,
- receiver SOP phase order,
- receiving-zone validation,
- rear-door access logic,
- rehandle timing,
- unload sequence,
- right-side SOP information hierarchy,
- background unloading / receiver check / auto-depart flow.

V2.7.6.5 is not a mechanics packet.

### Warehouse must read as one environment

The entire receiver side must visually read as one continuous warehouse floor.

Avoid:
- large bordered cards,
- 2×2 dashboard layouts,
- equal-sized rectangular UI cells,
- dark panels floating on top of the floor,
- card-header styling inside each receiving zone,
- tokenized freight rows inside a zone,
- spreadsheet-like visual grouping.

Use:
- one shared concrete/floor surface,
- painted floor boundaries,
- painted lane lines,
- aisle arrows,
- dock-apron markings,
- receiver-area text painted or stenciled onto the floor,
- low-contrast scuffs / wear / floor texture,
- subtle wall/column/dock context where useful,
- environmental rather than dashboard separation.

The floor should remain visually restrained and consistent with DOC OS's dark industrial style.

Do not turn the warehouse into a decorative 3D scene that obscures gameplay.

### Receiving zones remain physical drop targets

Controlled Receiving, Forklift Lane, Inspection, General Receiving, and Temp Staging remain mechanically distinct.

Their boundaries should be expressed as **warehouse-floor markings**, not UI cards.

Each area should have a different physical cue:

#### Controlled Receiving
- controlled-material / caution floor treatment,
- restrained hazard striping or caution border,
- clear floor stencil,
- should feel like a marked handling pad.

#### Forklift Lane
- directional lane markings,
- traffic arrows / travel lane cues,
- forklift handling text or floor stencil,
- should read as a movement/handling lane rather than a box.

#### Inspection
- smaller inspection/check area,
- floor footprint for an inspection station / check pad,
- may include restrained table/scale/scanner cues,
- must still be a floor destination, not a floating widget.

#### General Receiving
- largest open pallet receiving / staging area,
- painted pallet-position guides or warehouse floor lanes,
- should read as the normal destination for general freight.

#### Temp Staging
- remains exactly 3 pallet-equivalent positions,
- positions should look like painted pallet bays on the dock apron,
- the finite capacity must remain obvious without looking like three spreadsheet cells.

### Freight must stay visually physical after unloading

This is a must-pass requirement.

Freight leaving the trailer may not collapse into:
- chips,
- list rows,
- compact badges,
- generic mini rectangles,
- simplified tokens that lose cargo identity.

Receiver-floor freight must preserve:
- cargo family,
- handling visual,
- load marking,
- relative footprint,
- orientation where relevant,
- recognizable pallet/crate/skid/drum identity.

Examples:
- wide skid remains visibly wide,
- long skid remains visibly long,
- drum pallet still shows drum identity,
- fragile crate still looks like a crate,
- heavy/machinery freight remains visually heavy/large,
- standard pallet remains a recognizable palletized load.

### Receiver-floor freight scale

Warehouse freight should visually relate to the same freight scale used in the trailer.

Do not size receiver freight primarily by flexbox/card width.

Instead:
- derive receiver freight dimensions from a stable pallet/floor-cell visual unit,
- preserve footprint proportions,
- allow modest visual scaling for the larger warehouse space,
- do not shrink freight simply because a zone contains multiple units.

The floor should feel like freight is accumulating in physical space, not like a responsive list is compacting to fit.

### Receiver-floor placement

Receiver zones are still **not** a second packing puzzle.

The player chooses the correct receiving area; the facility may auto-place the freight inside that area.

Auto-placement must:
- use visible physical slots / floor positions,
- respect freight footprint and relative size,
- avoid overlap,
- place freight from a consistent floor edge / staging direction,
- keep enough separation that individual cargo objects remain readable,
- preserve visual identity even as the zone fills.

If a zone becomes crowded, expand/flow the physical floor arrangement rather than collapsing freight into smaller UI tokens.

### Physical continuity during drag

The carried object, trailer object, and receiver-floor object should feel like the same freight unit.

During pointer movement:
- preserve cargo family visuals,
- preserve relative shape,
- preserve load/handling identity,
- preserve orientation when possible.

On valid release:
- freight should settle into the warehouse floor,
- it should not visually transform into a different object class,
- use a short physical settle animation rather than a UI-card transition.

On invalid release:
- existing snap-back behavior remains authoritative.

### Environmental layering

The receiving floor should include enough physical context to read as a warehouse:

Recommended restrained cues:
- concrete-style base surface,
- painted safety/lane lines,
- dock-apron edge,
- aisle arrows,
- floor-number / zone stencils,
- occasional scuffing / tire wear,
- subtle column or wall-edge cues,
- low-profile inspection equipment cues,
- receiving-bay lane guides.

Avoid:
- photo-realistic texture,
- decorative clutter,
- forklifts/NPC animation in this packet,
- excessive props,
- bright arcade colors,
- strong 3D perspective that conflicts with the top-down trailer view.

### Current phase emphasis

Only the active receiver phase should receive notable visual emphasis.

Use environmental emphasis:
- brighter painted boundary,
- subtle floor glow,
- active stencil treatment,
- restrained directional cue.

Do not:
- turn the active zone into a large glowing UI card,
- fully hide inactive zones,
- make completed zones bright green blocks.

Healthy/completed/inactive areas should remain part of the physical room.

### Right-side SOP panel

The right-side receiver/SOP panel from V2.7.6.4 is accepted and should remain structurally unchanged.

Allowed:
- tiny spacing/font adjustments only if the warehouse layout forces clipping.

Not allowed:
- new rule cards,
- extra freight lists,
- duplicate current-phase explanations,
- major width redesign,
- turning the panel back into the main interaction surface.

The physical warehouse/trailer workspace remains primary.

### Trailer

The V2.7.6.4 shared Pickup/Delivery trailer is accepted.

Do not:
- resize it narrower,
- restyle the shell,
- create a warehouse-specific trailer variant,
- change floor-cell scale,
- alter its visual proportions to make room for the warehouse.

If more warehouse space is needed, solve that in the receiving-floor composition rather than shrinking the truck.

### Temp Staging presentation

The existing finite capacity remains exactly:
**3 pallet-equivalent positions**.

V2.7.6.5 changes only how those positions look.

The dock staging area should:
- look like three physical painted pallet positions,
- show freight occupying those positions at full recognizable cargo scale,
- visually communicate used/free space,
- preserve footprint-based occupancy,
- avoid card borders and numbered spreadsheet-cell styling where possible.

Do not change staging capacity or rehandle rules.

### Visual acceptance requirements

V2.7.6.5 is not accepted until manual gameplay confirms all of the following:

1. The warehouse side reads immediately as a warehouse floor, not a dashboard.
2. The receiving areas feel painted/marked into one shared environment.
3. No major receiving zone looks like a UI card.
4. Freight remains recognizable as the same physical cargo after leaving the trailer.
5. Wide/long/multi-cell freight retains visibly different proportions on the warehouse floor.
6. Multiple received freight units remain individually readable and do not collapse into tiny tokens.
7. Temp Staging looks like finite dock space rather than three spreadsheet cells.
8. Full-size staged freight visibly occupies that limited space.
9. The active receiving phase is clear without dominating the environment.
10. The accepted shared trailer remains visually unchanged from V2.7.6.4.
11. The accepted right-side SOP panel remains secondary to the physical workspace.
12. Pointer movement still feels continuous from trailer → warehouse floor.

A green automated build does not satisfy these visual requirements.

### Implementation guidance

Prefer reusing the same freight visual component/family across:
- trailer freight,
- pointer freight ghost,
- Temp Staging freight,
- receiver-floor freight.

If separate wrappers are required for layout, the freight object's internal visual should remain shared.

Prefer warehouse placement data such as:
- zone slot,
- x/y floor position,
- footprint width/height,
- rotation,

over responsive token/card layout.

The implementation should be robust at normal desktop gameplay scale before optimizing smaller widths.

### Time model remains locked

No changes:
- Focused Mode pauses simulation,
- trailer repositioning does not directly advance time,
- external rehandles retain their current service-time cost,
- Confirm Handoff begins background unloading,
- receiver verification follows,
- routine clean delivery auto-departs.

### Accuracy boundary

Receiver SOPs remain fictional DOC OS facility procedures.

Do not imply that the Harborline/Freshway order represents universal freight-handling regulation.

### Known Live Operations UX backlog — still deferred

- SEND SCHEDULE needs a normal-workflow entry point outside Planning state.
- Add Advance to Next Event / Next Operational Moment instead of requiring manual fast-forward through idle time.

Do not solve these in V2.7.6.5.

### Explicit non-goals

Do not add:
- new receiver SOP rules,
- new Pickup rules,
- random damage,
- refusal/claims,
- Documents workstation UI,
- forklifts/NPC warehouse animation,
- vertical stacking,
- HOS changes,
- route-planning changes,
- schedule-send UX changes,
- next-event time controls,
- RPG XP/scoring UI.

V2.7.6.5 exists to make the already-working Delivery space-management system visually read as a physical warehouse operation.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
