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

**V2.8.1.3 · Global Paper Desk & Filing Gameplay**

Accepted `main` checkpoint:

`0c809eed4d59bbd28d84d659aaba62e51f77031c`

V2.8.1.3 is visually accepted.

### Current candidate

**V2.9.1.2 · Email Sidebar Spacing**

V2.9.1 implemented Email intake and V2.9.1.1 corrected the reader into a real email client. The next visual pass found the inbox/browser content too close to panel edges. V2.9.1.2 adds safe gutters and resilient row layout without changing Email behavior.

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

## V2.5 · Booking + Rate Confirmation — FUNCTIONALLY COMPLETE / WORKFLOW RELOCATION IMPLEMENTED

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

V2.8.1 now moves Rate Confirmation viewing into Documents and preserves the accepted current Rate Con as retrievable paperwork.

Still later:

- Email becomes an additional delivery path in V2.9,
- full accepted/superseded revision history is completed in V2.8.2.

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

## V2.8.1 · Documents Workspace & Rate Con Handoff — ACCEPTED THROUGH V2.8.1.3

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

Delivered:

- Documents enabled on the command rail,
- unified Rate Con + POD operational document index,
- left document browser and filters,
- selected-document inspector,
- document attention badge,
- Rate Con review entry owned by Documents,
- FreightLink handoff copy and CHECK DOCUMENTS navigation,
- accepted current Rate Con retained after booking,
- live POD state surfaced from Delivery records,
- domain and shell regression coverage.

Automated verification passed across the V2.8.1 closeout and correction series.

V2.8.1.3 manual playtest accepted the global-paper-desk filing model.

### V2.8.1.1 · Acceptance correction

Playtest findings being corrected before V2.8.1 acceptance:

- Documents center workspace becomes a dedicated paper desk instead of the live map,
- the left Documents browser is treated as a filing cabinet,
- Fleet, FreightLink, and Documents share one browser-width rule,
- command-rail labels stop clipping,
- Jersey City Forklift Handling receives enough physical floor capacity for T-110's two heavy skids plus oversize crate,
- receiver placement never silently shrinks a freight footprint.

The correction does not change the V2.8 architecture or advance to V2.8.2.

### V2.8.1.2 · Load-file acceptance correction

Documents now organizes operational paperwork around the **load file**:

- one cabinet row per load rather than one row per document,
- Rate Con and POD papers grouped in the same derived file,
- command-rail attention counts load files needing action,
- physical load folder on the center desk,
- papers can be dragged/arranged on the desk,
- single click selects a paper and updates the right inspector,
- double click inspects that exact paper,
- the same authoritative Rate Confirmation paper component is used on the desk and in focused review,
- non-actionable Rate Cons and PODs can open as read-only focused paper inspections,
- delivered files remain open for billing/payment rather than being prematurely marked closed.

BOL, invoice creation, sent-for-payment, payment receipt, and final file closeout remain later document/finance work.

### V2.8.1.3 · Global desk / filing acceptance correction

Locked architecture:

- **cabinet owns files,**
- **desk owns all unfiled papers,**
- opening/selecting a file never filters the desk,
- papers from every load may overlap and accumulate together,
- filing is a deliberate drag/drop action from desk to matching load file,
- wrong-folder drops are rejected,
- filed paperwork may be returned to the desk until the packet is submitted,
- filing and document approval are separate states,
- a filed document only satisfies a packet requirement when its document status is acceptable,
- current implemented requirements are Rate Con + POD; BOL/invoice extend the same requirement model when those document systems exist,
- packet submission is disabled until every current requirement is satisfied,
- submitted packets lock filing changes,
- accepted Rate Cons carry a visible physical status stamp on the paper.

This is intentionally organization gameplay: a busy desk may contain paperwork from many loads, and the player must read, inspect, arrange, and file it correctly.

## V2.8.2 · Document Revisions & Rate Con Archive — DEFERRED UNTIL V2.9.1 INTAKE IS ACCEPTED

Goal:

Make commercial paperwork persist like real paperwork.

Build:

- accepted Rate Con remains retrievable,
- corrected Rate Con revisions remain traceable,
- superseded/current revision status,
- revision history inside the existing load file,
- no disappearing paperwork after booking confirmation.

Acceptance:

A confirmed load retains its Rate Confirmation history in Documents.

## V2.8.3 · POD Focused Workflow — DEFERRED UNTIL V2.9.1 INTAKE IS ACCEPTED

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

## V2.8.4 · Load Packet / Invoice Support Foundation — AFTER EMAIL + DOCUMENT DEPTH

Goal:

Prepare paperwork for downstream payment without prematurely building the full finance system.

Build:

- extend the existing load file with BOL/invoice-support requirements,
- document completeness rules for billing,
- invoice-support readiness state,
- package/closeout handoff toward payment.

Do not build full owner-era receivables here.

---

# V2.9 · Email + Messages

## V2.9.1 · Email Inbox & Print-to-Documents — IMPLEMENTED / VISUAL CORRECTION ACTIVE

Goal:

Make business communication the arrival mechanism for external paperwork and create a deliberate digital-to-physical handoff.

Build:

- enable Email on the command rail,
- inbox,
- read/unread,
- message detail,
- document attachments,
- Rate Con arrival email,
- corrected Rate Con email,
- POD arrival email after receiver verification,
- unread Email badge,
- explicit **PRINT ATTACHMENT** action,
- printed-document state,
- Documents desk contains only printed physical copies,
- FreightLink routes Rate Con arrivals to **CHECK EMAIL** instead of Documents.

Architecture rule:

**FreightLink requests it → Email delivers the digital attachment → Player prints it → Documents owns the physical copy.**

State rule:

**Received digitally ≠ printed ≠ filed ≠ requirement satisfied.**

Acceptance:

A Rate Con and later a POD can arrive digitally without appearing on the physical Documents desk; printing each attachment deliberately creates the physical paper that enters the existing filing gameplay.

### V2.9.1.1 · Email Reader Polish — IMPLEMENTED

### V2.9.1.2 · Email Sidebar Spacing — ACTIVE

Visual correction goals:

- opened messages use real email structure: subject, From, To, date/time, body, signature,
- inbox rows read like mailbox rows rather than document cards,
- attachment is a compact email attachment card, not a giant hero document preview,
- PRINT ATTACHMENT and OPEN DOCUMENTS stay attached to the file row,
- printed state lives with the attachment rather than taking over the message header,
- no workflow/state changes from V2.9.1.

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

These are real findings, but they should not derail the active communication/document intake work.

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
- `docs/IMPLEMENTATION_V2.8.1.md` — current acceptance packet,
- `docs/DESKTOP_EXPERIENCE_ARCHITECTURE_V2.md` — long-term desktop architecture decisions.

When a major sequencing decision changes, update **this roadmap** in the same change.
