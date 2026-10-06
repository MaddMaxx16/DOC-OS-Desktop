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

## Current packet — V2.7.6.4 Delivery Space Management

V2.1 through V2.7.5.4 are accepted and locked.
V2.7.6 Delivery Operations architecture remains authoritative.
V2.7.6.2 receiver-specific SOP phases and zone validation remain authoritative.
V2.7.6.3 pointer-owned freight movement and continuous warehouse-floor direction are preserved, but visual/gameplay acceptance remains open.

V2.7.6.4 is the active Delivery packet.

### Purpose

Delivery should feel like a physical space-management puzzle built from the same trailer the player packed at Pickup.

The player must manage three physical spaces:

**Trailer floor → Dock / Temp Staging → Receiver floor**

The challenge is not simply dragging freight out of the trailer. The player must decide whether to:

1. unload current-phase freight,
2. reposition freight inside the trailer,
3. temporarily stage a physical blocker outside the trailer.

Receiver SOP, rear-door access, freight footprint, and limited available space all interact.

### Hard trailer continuity rule

Delivery must use the **same Pickup trailer visual system**, not a similar or delivery-specific recreation.

This is a must-pass requirement.

Delivery trailer:
- reuse the same 53' dry-van shell geometry and proportions as Pickup,
- reuse the same width and overall silhouette,
- reuse the same wall thickness and floor footprint,
- reuse the same nose treatment,
- reuse the same rear-door frame / door treatment,
- reuse the same trailer-floor cell geometry,
- reuse the same freight scale relative to floor positions,
- preserve the exact committed freight positions and rotations,
- preserve the same visual depth and body proportions,
- do not narrow, compress, restyle, or independently tune the trailer for Delivery.

The player should be able to look at the Delivery trailer and immediately recognize it as the exact trailer they packed earlier.

If the shared visual shell cannot be cleanly reused yet, refactor Pickup and Delivery to consume one shared trailer-shell component rather than allowing two visually divergent implementations.

### Freight identity must remain physical everywhere

Freight may not collapse into token/chip/list representations after leaving the trailer.

When a freight unit moves to:
- Controlled Receiving,
- Forklift Lane,
- Inspection,
- General Receiving,
- Temp Staging,

it must retain its recognizable physical visual identity:
- cargo family,
- footprint,
- relative size,
- handling appearance,
- load marking.

A wide skid should still look wide.
A long skid should still look long.
A drum pallet should still read as a drum pallet.
A fragile crate should still read as a crate.

Receiver-floor placement may auto-snap to facility positions, but the freight itself remains a physical object.

### Delivery move types

Delivery now has three valid physical move types.

#### 1. Unload to receiver
Move accessible current-delivery freight from the trailer to the currently valid receiver zone.

Requirements remain:
- current receiver phase allows the freight,
- correct receiving zone is used,
- rear-door access is physically clear.

Accepted freight leaves the trailer and occupies receiver-floor space.

#### 2. Reposition inside trailer
Freight may be moved to another valid empty trailer-floor position during Delivery.

Internal repositioning:
- uses the same collision and footprint rules as Pickup,
- uses the same trailer grid,
- preserves freight identity and rotation,
- may not overlap other freight,
- may not occupy disabled/non-floor positions,
- should preserve Pickup rotation rules,
- immediately changes rear-door accessibility calculations,
- is recorded as an internal reposition move.

Internal repositioning is often preferable to consuming scarce Temp Staging space.

Do not rerun Pickup load-plan completion rules merely because freight is repositioned during Delivery. Delivery repositions are about extraction/access; receiver SOP and physical validity remain the active constraints.

#### 3. Temp Stage
A genuine blocker may be removed from the trailer and placed in limited dock staging.

Temp Staging is not an unlimited escape hatch.

### Limited Temp Staging

Temp Staging must be a finite physical grid.

Initial target:
- **3 pallet-equivalent staging positions** at the dock.

Capacity is footprint-based:
- 1×1 freight consumes 1 staging position,
- 1×2 / 2×1 freight consumes 2 staging positions,
- 2×2 freight consumes 4 positions and therefore cannot fit in the initial 3-position staging area unless the staging layout is later expanded.

Exact visual arrangement may be tuned, but staging capacity must be derived from occupied floor cells rather than arbitrary unit count.

Rules:
- staged freight physically occupies staging cells,
- no overlap,
- once capacity is full, additional staging is rejected,
- player may move staged freight back into a valid trailer position,
- same-delivery later-phase blockers may be staged when physically necessary,
- later-stop blockers may be staged when physically necessary,
- unnecessary staging remains rejected,
- each unique staged freight unit counts as one external rehandle,
- rehandle time remains +3 simulated minutes per unique staged unit for this packet,
- a unit should not accrue repeated rehandle penalties merely because the player adjusts it within the staging grid.

### Trailer reposition accounting

Internal trailer moves and external rehandles are separate concepts.

Persist:
- unload sequence,
- internal reposition count,
- internal reposition history per freight unit,
- unique externally staged freight IDs,
- external rehandle count.

Do not surface an arcade score yet.

The data should be available later for:
- Freight Operations XP,
- efficiency grading,
- service-time tuning,
- facility performance,
- Jordan/tutorial feedback.

### Receiver-floor space

Receiver zones are not a second packing puzzle in this packet.

When valid freight is released into the correct receiving area:
- preserve its real freight visual,
- preserve its footprint/relative size,
- allow the facility to choose an appropriate snap position inside that zone,
- do not turn it into a tiny list row or badge,
- avoid visual overlap.

The receiving floor should visibly fill while the trailer visibly empties.

### Pointer interaction

V2.7.6.3 pointer-owned movement remains authoritative.

Primary path:
- pointer-down lifts freight,
- freight follows the cursor,
- valid trailer cells / receiver zones / staging cells react,
- pointer-up commits the move,
- invalid move visibly returns to origin.

The pointer system must support:
- Trailer → Receiver
- Trailer → Trailer
- Trailer → Temp Staging
- Temp Staging → Trailer
- Temp Staging → Receiver when the freight's receiving phase is active.

Click freight → click destination may remain as an accessibility fallback.

Native HTML drag/drop remains non-authoritative.

### Trailer-to-trailer move feedback

While freight is held over the trailer:
- show footprint preview at the prospective anchor,
- distinguish valid vs invalid placement,
- preserve the visual language already proven in Pickup where practical,
- invalid release returns the freight to its prior placement,
- valid release updates the physical trailer state immediately.

### Access logic

Rear-door access must be calculated from the **current working trailer state**, including Delivery reposition moves.

Therefore:
- moving a blocker deeper into the trailer may open access,
- moving freight into a rearward lane may create a new blocker,
- Temp Staging removes that freight from the active trailer,
- unloading removes accepted freight from the active trailer.

Access is not frozen to the Pickup snapshot after Delivery begins.

### Receiver SOP remains authoritative

Harborline/Freshway facility SOP behavior from V2.7.6.2 stays active.

The player still must solve:
1. What phase is active?
2. Which freight belongs to that phase?
3. Can it physically reach the rear doors?
4. Can blockers be repositioned internally?
5. Is scarce Temp Staging necessary?
6. Which receiver zone accepts the freight?

Do not add more facility rules in this packet.

### Visual acceptance requirements

V2.7.6.4 is not accepted until manual gameplay confirms:

1. Delivery trailer is visually the same trailer as Pickup.
2. Trailer width/proportions do not change between Pickup and Delivery.
3. Freight keeps recognizable physical shape after entering the warehouse.
4. Temp Staging visibly has finite physical capacity.
5. Staging cannot be used to empty unlimited freight onto the dock.
6. Freight can be repositioned inside the trailer.
7. Repositioning changes access in a predictable way.
8. Pointer movement remains smooth for Trailer → Trailer and Trailer → Floor.
9. Warehouse still reads as one continuous physical environment.
10. Right-side SOP panel remains secondary to the physical workspace.

A green automated build does not satisfy these acceptance requirements.

### Time model remains locked

- Focused Mode pauses simulation while the player manipulates freight.
- Internal trailer repositioning represents planning/warehouse coordination and does not advance world time directly.
- External rehandles affect simulated service time after handoff.
- Confirm Handoff starts background unloading.
- Receiver verification follows.
- Routine clean delivery auto-departs.

Future RPG tuning may make move efficiency affect operational time, but do not add that scoring/tuning in this packet.

### Accuracy boundary

Receiver SOPs remain fictional DOC OS facility procedures.
Do not imply:
- HAZMAT universally unloads first,
- fragile freight universally requires inspection first,
- heavy freight universally requires a dedicated forklift sequence.

The gameplay rule comes from the fictional receiver SOP.

### Known Live Operations UX backlog — still deferred

- SEND SCHEDULE needs a normal-workflow entry point outside Planning state.
- Add Advance to Next Event / Next Operational Moment instead of requiring manual fast-forward through idle time.

Do not solve those in V2.7.6.4.

### Explicit non-goals

Do not add in this packet:
- random freight damage,
- refusal/claims gameplay,
- Documents workstation UI,
- new Pickup handling rules,
- vertical stacking,
- HOS changes,
- route-planning redesign,
- schedule-send UX changes,
- next-event time controls,
- new receiver SOP phases,
- RPG rewards/XP presentation.

The packet is specifically about making Delivery's existing rules into a stronger physical space-management puzzle.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
