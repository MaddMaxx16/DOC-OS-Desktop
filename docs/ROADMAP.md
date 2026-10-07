# DOC OS Desktop Roadmap

This file is the durable build-order source of truth for DOC OS Desktop.

Use it to answer:

- What is complete?
- What is currently being built?
- What comes next?
- Which known issues are intentionally deferred?

Update this file whenever the project changes direction materially.

---

## Current accepted checkpoint

**V2.7.6.8 · Dock Continuity & Placement Stability**

Current `main` before the V2.8 transition:

`f3dd9b528c4ad974e25fd1c5ae166cafc55e6d53`

V2.7.6.8 is visually accepted.

### What that means

The current Desktop build has a coherent operational freight loop:

1. inspect Driver Day,
2. shop FreightLink,
3. evaluate lane fit,
4. request/receive Rate Confirmation,
5. review/accept Rate Confirmation,
6. commit the load to the real manifest,
7. plan Lunch / staging / stop sequence,
8. send the Driver Day,
9. execute the route in Live Operations,
10. perform Pickup,
11. preserve trailer cargo across stops,
12. perform Delivery,
13. create POD state after receiver verification.

The major missing layer is no longer the freight operation itself.

The major missing layer is the **workstation communication + document workflow around that operation**.

---

# Phase status

## V2.1 · Shell Reset — COMPLETE

Delivered:

- desktop-only React/Vite shell,
- map-first workstation,
- compact global top bar,
- permanent left command rail,
- Focused Workspace pattern,
- no active mobile/Capacitor presentation.

## V2.2 · Shared Selection + Driver Identity — COMPLETE

Delivered:

- shared driver/load/stop selection model,
- persistent driver identity colors,
- map / browser / inspector synchronization,
- driver ownership cues.

## V2.3 · Driver Day / Manifest — COMPLETE

Delivered:

- ordered Driver Day,
- freight stop sequencing,
- capacity-after-stop truth,
- HOS context,
- Lunch and staging representation,
- planning/readiness presentation.

## V2.4 · FreightLink Desktop — COMPLETE

Delivered:

- lane browser,
- driver selection,
- fit filtering,
- route impact,
- appointment signals,
- HOS signals,
- trailer-capacity signals,
- manifest insertion evaluation.

## V2.5 · Booking + Rate Confirmation — FUNCTIONALLY COMPLETE / WORKFLOW RELOCATION PENDING

Delivered:

- explicit booking request state,
- Rate Con arrival state,
- deliberate mismatch scenario,
- Focused Rate Confirmation review,
- MATCH / ISSUE comparison gameplay,
- correction request,
- corrected revision,
- deliberate accept-with-mismatch path,
- accepted Rate Con terms become booking authority.

Still required:

- move Rate Confirmation ownership out of FreightLink viewing,
- surface Rate Con through Documents and later Email,
- preserve accepted/superseded paperwork as retrievable operational documents.

## V2.6 · Daily Planning — COMPLETE

Delivered:

- manifest resequencing,
- Lunch location,
- staging location,
- timing recalculation,
- plan health,
- warnings vs blockers,
- send confirmation,
- sent-plan lock.

Known UX follow-up:

- **Send Schedule must become available outside the active Planning-edit state when a valid unsent plan is ready.**

This is not a planning-model rewrite.

## V2.7 · Live Operations — COMPLETE FOR CURRENT FREIGHT-OPERATIONS STAGE

Delivered:

- simulation clock,
- Pause / Play / Fast Forward,
- sent-plan execution gate,
- route hydration,
- real road movement,
- current / next / completed event state,
- appointment waiting,
- dock assignment,
- facility service,
- Pickup focused operation,
- persistent trailer cargo,
- Delivery focused operation,
- receiver verification,
- auto departure,
- POD record creation.

### Facility gameplay accepted through V2.7.6.8

Pickup includes:

- physical trailer loading,
- staged freight selection,
- footprints / rotation,
- Delivery Access,
- Weight Balance,
- Fragile Protection,
- physical shared trailer state.

Delivery includes:

- same physical trailer,
- receiver SOP phases,
- warehouse receiving floor,
- finite 3-position Temp Staging,
- trailer repositioning,
- rear handling-path constraints,
- rehandle tracking,
- stable receiver-floor placement,
- accepted dock continuity visuals.

### Known Live Operations UX follow-up

Add:

**Advance to Next Operational Moment**

The user should not have to sit through long stretches of 4× Fast Forward when the next meaningful operational event is known.

This is intentionally deferred until Documents / Communications begin connecting to event delivery.

---

# V2.8 · Documents

## V2.8.1 · Documents Workspace & Rate Con Handoff — NEXT

Goal:

Make Documents a real first-class workstation system and move Rate Confirmation review out of FreightLink.

Build:

- enable Documents on command rail,
- create unified operational document index,
- index existing Rate Con and POD state,
- Documents left browser,
- selected-document inspector,
- load/document status associations,
- open Rate Con from Documents into existing Focused Document Mode,
- FreightLink remains responsible for **REQUEST RATE CON**,
- FreightLink may show document status but may not directly display the Rate Con,
- expose POD records in Documents even before full POD paper review lands.

Acceptance:

A player requests a Rate Con in FreightLink, waits for it, opens Documents, finds the correct Rate Con, and launches the existing focused review from there.

## V2.8.2 · Document Revisions & Rate Con Archive

Goal:

Make commercial paperwork persist like real paperwork.

Build:

- accepted Rate Con remains retrievable,
- corrected Rate Con revisions remain traceable,
- superseded/current revision status,
- load packet grouping,
- confirmed-document read-only viewing,
- no disappearing paperwork after booking confirmation.

Acceptance:

A confirmed load retains its Rate Confirmation history in Documents.

## V2.8.3 · POD Focused Workflow

Goal:

Connect the POD state already created by Delivery to actual player-facing paperwork.

Build:

- POD received notification state,
- focused POD paper view,
- clean vs issue review,
- signature / shortage / damage visibility,
- corrected POD request path,
- corrected POD arrival,
- accepted POD state.

Acceptance:

Delivery produces a POD the player can actually receive, inspect, correct if necessary, and retain in the load packet.

## V2.8.4 · Load Packet / Invoice Support Foundation

Goal:

Prepare paperwork for downstream payment without prematurely building the full finance system.

Build:

- grouped load packet,
- Rate Con + POD packet relationship,
- invoice-support readiness state,
- document completeness indicator.

Do not build full owner-era receivables here.

---

# V2.9 · Email + Messages

## V2.9.1 · Email Inbox

Goal:

Make business communication the arrival mechanism for external paperwork and operational notices.

Build:

- inbox,
- read/unread,
- message detail,
- actionable document attachments / links,
- Rate Con arrival email,
- corrected Rate Con email,
- POD-related email where appropriate.

Architecture rule:

**Email delivers paperwork. Documents owns paperwork.**

## V2.9.2 · Driver Messages

Goal:

Make driver communication a real operational timeline.

Build:

- per-driver threads,
- dispatcher/driver messages,
- operational status entries,
- schedule communication,
- dock/pickup/delivery updates,
- document requests when appropriate.

Architecture rule:

Messages supports dispatch work; it is not a separate social-chat mini-game.

## V2.9.3 · Communication + Live Operations Integration

Build:

- Send Schedule from the correct normal operational context,
- schedule-sent thread entry,
- acknowledgements,
- actionable live notifications,
- Advance to Next Operational Moment,
- event-aware communication badges.

Acceptance:

The player can communicate a plan, monitor it, and receive meaningful operational/document events without manually hunting across disconnected systems.

---

# V2.10 · Banking + Career Progression

Goal:

Reconnect the employee-career meta layer after dispatch/document systems are stable.

Build direction:

- personal Banking,
- paychecks,
- career earnings,
- Shop,
- workspace upgrades,
- visible progression.

Later owner-era systems may include:

- LedgerDesk,
- receivables,
- expenses,
- settlements,
- business banking.

Do not let finance work replace unfinished operational/document workflows.

---

# V2.11 · Onboarding

Goal:

Reintroduce Jordan only after the actual game is stable.

Jordan should teach the real interfaces:

- Driver Day,
- FreightLink,
- Rate Con,
- Planning,
- Live Operations,
- Pickup,
- Delivery,
- Documents,
- Email,
- Messages.

Do not create tutorial-only duplicate systems.

---

# V2.12 · Packaging

Goal:

Turn the stable Desktop build into the distributable PC product.

Expected work:

- save hardening / migrations,
- display and resolution settings,
- keyboard polish,
- packaged Mac/Windows builds,
- Steam integration preparation.

---

# Current backlog that should not be forgotten

These are real findings, but they should not derail V2.8.1.

### Operational UX

- Send Schedule outside Planning-edit mode.
- Advance to Next Operational Moment.
- Continue testing Delivery closeout/state persistence across multi-stop loads.

### Later facility depth

Do not add until intentionally reopened:

- exact forklift physics,
- vertical stacking,
- HAZMAT compatibility simulation,
- exact DOT axle model,
- final facility congestion/NPC traffic.

### RPG / progression hooks

Existing systems already expose useful future signals:

- internal trailer moves,
- external rehandles,
- staging usage,
- load-plan quality,
- document errors,
- schedule quality,
- on-time performance.

Do not build scoring/XP until the full work loop is connected.

---

# Source-of-truth rules

Use:

- `README.md` — public/current project snapshot,
- `docs/ROADMAP.md` — durable build order and future plan,
- `AGENTS.md` — active implementation contract,
- `docs/IMPLEMENTATION_V2.8.1.md` — next-build packet,
- `docs/DESKTOP_EXPERIENCE_ARCHITECTURE_V2.md` — long-term desktop architecture decisions.

When a major sequencing decision changes, update **this roadmap** in the same change.
