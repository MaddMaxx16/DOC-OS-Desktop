# V2.8.1 · Documents Workspace & Rate Con Handoff

## Status

**IMPLEMENTED · V2.8.1.3 GLOBAL-DESK CORRECTION IN VERIFY · VISUAL ACCEPTANCE PENDING**

V2.7.6.8 remains the accepted and locked checkpoint until this packet passes its manual visual/gameplay acceptance flow.

V2.8.1 implementation is complete. The closeout audit verified the required document index, Documents workspace, Rate Con handoff, accepted-document retention, POD visibility, attention logic, and regression coverage. The technical verification gate (install, lint, tests, production build) is green.

---

## V2.8.1.1 playtest correction

The first V2.8.1 acceptance playtest produced two blocking findings that are corrected before this packet can be accepted:

1. **Documents presentation ownership** — the center workspace must be a paperwork desk, not the live operational map. The left browser acts as a filing cabinet, the selected paper occupies the center desk, and the right inspector remains metadata/workflow context.
2. **Delivery receiving deadlock** — Taylor Brooks / T-110 at Jersey City Crossdock can enter Forklift Handling with two 1×2 heavy skids and one 2×2 oversize crate. The old 3×2 receiver floor only exposed six cells for eight required cells, so the final oversize piece could never be received. The correction expands the Forklift Handling floor and forbids receiver placement from silently shrinking freight footprints.

The correction also standardizes the left workstation-browser width across Fleet, FreightLink, and Documents and removes clipped command-rail labels.

This correction does not advance the roadmap to V2.8.2. It is part of the V2.8.1 acceptance gate.

---

## V2.8.1.2 load-file correction

The next Documents playtest clarified that the primary object is not an individual paper. It is the **load file**.

Required acceptance behavior:

- one derived load file per load reference,
- Rate Con, POD, and later BOL/invoice records belong to that file,
- the left cabinet lists load files rather than loose documents,
- opening a load file places its physical folder on the desk,
- papers inside the folder are individually selectable and draggable,
- double-clicking a paper inspects that same paper,
- an actionable Rate Con transitions into the existing MATCH / ISSUE focused gameplay,
- accepted/non-actionable papers can still be inspected read-only,
- closing focused inspection returns the player to the same working load file,
- the file remains open through operational completion and future billing/payment closeout.

The load-file index remains derived presentation state over existing document truth. Do not duplicate booking/POD state just to create folders.

The delivered state is not equivalent to a closed file. A clean POD may mark the operational delivery portion complete, but BOL/invoice/payment rules will decide later billing and final closeout.

---

## V2.8.1.3 locked filing model

The physical folder-on-desk model is superseded.

The accepted architecture target is:

> **Cabinet owns files. Desk owns all unfiled papers. Folder selection never filters the desk. Filing is player-driven. Packet completeness gates submission.**

Required behavior:

- all load folders remain in the left filing cabinet,
- clicking a folder expands its filed contents and packet requirements in the cabinet,
- selecting/expanding any folder must not alter the papers visible on the desk,
- every unfiled Rate Con, POD, and future paper from every load appears on the same global center desk,
- loose papers may overlap and be rearranged,
- single click selects a paper; double click inspects/reviews that same paper,
- dragging a loose paper onto its matching folder files it,
- dragging onto the wrong folder is rejected,
- filing may happen before or after review,
- filing does not make an unacceptable document satisfy the packet,
- a filed paper may be returned to the desk until the packet is submitted,
- packet submission is disabled until every current requirement is both filed and in an acceptable status,
- submitted packets lock further filing/unfiling,
- accepted Rate Cons show a physical **ACCEPTED** stamp,
- new documents never auto-file.

Current requirement model:

- Rate Confirmation — must be filed and ACCEPTED,
- POD — must be filed and RECEIVED.

These are only the currently implemented document types. BOL, invoice, supporting receipts, and accessorial approvals must extend this same requirements framework later rather than creating a second closeout system.

---

## 1. Purpose

The current Desktop build already has real document-related gameplay underneath the shell:

- Rate Confirmation generation,
- Rate Confirmation correction/revision,
- Focused Rate Confirmation review,
- shared physical Document Desk,
- Delivery-created POD records,
- simulation-driven POD availability/status.

The problem is that the workstation does not yet expose those systems coherently.

Before this packet:

- FreightLink directly opened the Rate Confirmation,
- Documents was disabled,
- Email was not built,
- POD records were created but invisible to the player.

V2.8.1 now provides the first real Documents workspace and moves Rate Confirmation access to the correct operational home. Email remains intentionally deferred.

---

## 2. Core architecture rule

**FreightLink requests paperwork. Documents owns paperwork.**

For V2.8.1:

- FreightLink may request a Rate Confirmation.
- FreightLink may show booking/document status.
- FreightLink may navigate the player toward Documents.
- FreightLink may **not display or directly launch the Rate Confirmation paper**.
- Documents is the only implemented place that can open the Rate Confirmation document in this packet.
- Email becomes an additional arrival path in V2.9, not a prerequisite for V2.8.1.

This creates the eventual invariant:

> FreightLink requests it  
> Email delivers it  
> Documents owns it  
> Focused Document Mode reviews it

---

## 3. Scope

### In scope

- enable Documents in the command rail,
- build a Documents context browser,
- build selected-document inspector/detail behavior,
- create a unified document index over existing document sources,
- include Rate Confirmations,
- include POD records,
- show document status,
- show associated load,
- open Rate Confirmation from Documents,
- keep existing Focused Rate Confirmation gameplay unchanged,
- remove direct Rate Con review from FreightLink,
- preserve FreightLink request/correction/booking lifecycle,
- surface POD state as an indexed document even though focused POD review is a later packet.

### Out of scope

Do not build:

- Email,
- Messages,
- focused POD paper review,
- corrected POD request workflow,
- invoice creation,
- Banking,
- LedgerDesk,
- RPG/XP,
- Jordan tutorial,
- schedule-send UX rewrite,
- next-event control.

---

## 4. Existing systems to preserve

### Booking lifecycle

Keep the existing booking states:

- AVAILABLE
- RATE CON REQUESTED
- RATE CON READY
- CORRECTION REQUESTED
- CONFIRMED

Do not let opening/closing Documents mutate booking truth.

### Existing Rate Confirmation review

Preserve:

- `RateConfirmationReview`,
- Focused Workspace,
- shared `DocumentDesk`,
- draggable Rate Con paper,
- lane-vs-document comparison,
- MATCH / ISSUE player judgment,
- issue highlighting,
- Request Correction,
- corrected Rate Con revision,
- deliberate accept-with-mismatch,
- Rate Con terms becoming authoritative booking terms.

Do not redesign this screen in V2.8.1.

### Existing POD lifecycle

Preserve:

- `createDeliveryPodRecord`,
- `advanceDeliveryDocuments`,
- PENDING_RECEIVER,
- RECEIVED,
- REVIEW_REQUIRED,
- receiver verification timing,
- Delivery operation → POD association.

V2.8.1 exposes this state; it does not replace it.

---

## 5. Unified document index

Create a presentation/domain adapter that gives the Documents workspace one normalized index.

Suggested responsibility:

`buildOperationalDocumentIndex({ bookingRecords, documentRecords, lanes, loads, driverDays })`

The index should normalize document metadata without duplicating the underlying source-of-truth payloads.

Each indexed record should expose enough information for the Documents UI, conceptually:

- document ID,
- document type,
- title,
- load ID / load ref,
- driver ID where known,
- source system,
- revision where relevant,
- current status,
- attention state,
- created/available ordering value,
- reference to the underlying booking/document record.

### Important ownership rule

V2.8.1 does **not** need a risky broad state migration.

- booking lifecycle may continue owning Rate Con booking state,
- `documentRecords` may continue owning POD lifecycle state,
- the document index is the one **presentation contract** consumed by Documents.

Do not create a second editable copy of Rate Con or POD truth.

Future packets may normalize storage if there is a real need.

---

## 6. Document types in V2.8.1

### Rate Confirmation

Index every booking record that currently has a Rate Confirmation.

Display states should distinguish:

- REVIEW REQUIRED / RATE CON READY,
- CORRECTION REQUESTED,
- CORRECTED RATE CON READY,
- ACCEPTED / CONFIRMED.

A confirmed Rate Con must remain visible in Documents.

If the booking has a corrected revision, the Documents UI must at minimum show the active/current revision correctly.

Full revision-history UI is V2.8.2.

### POD

Index every existing POD document record.

Display states:

- PENDING RECEIVER,
- RECEIVED,
- REVIEW REQUIRED.

The POD row must show enough context to prove that Delivery paperwork is connected to the load.

Focused POD review is not required in V2.8.1.

---

## 7. Documents command-rail app

Enable `documents` in the command rail.

Do not enable Email or Messages yet.

### Normal workspace grammar

Documents follows the accepted Desktop shell model:

**Command Rail → Load-File Cabinet + Global Unfiled Paper Desk → Document Inspector**

The left cabinet and center desk are independent surfaces:

- cabinet = load files + filed contents + completeness,
- desk = every loose/unfiled paper across all loads.

Selecting a folder does not own or filter the desk.

Use Focused Workspace when a paper is enlarged for review/inspection.

### Documents browser

The left browser is a filing cabinet of load files.

At minimum each file row shows:

- load ref,
- driver where known,
- file status,
- paper count,
- paper-type chips,
- attention state.

Useful filters include:

- ALL FILES,
- NEEDS ACTION,
- ACTIVE,
- DELIVERY COMPLETE.

### Document selection

Selecting a document should use a coherent document selection state local to the Documents app or the shared selection model if that model is extended intentionally.

Do not overload freight-stop selection IDs.

Folder expansion is independent from desk selection. The selected paper and right inspector must agree on one selected document whether that paper is loose on the desk or already filed.

---

## 8. Document inspector

The right inspector should explain the selected document without reproducing the entire paper.

### Rate Con inspector

Show:

- RATE CONFIRMATION,
- load ref,
- revision,
- broker/source,
- status,
- driver/request context,
- concise next action.

For a pending/current Rate Con:

**REVIEW DOCUMENT**

opens the existing Focused Rate Confirmation review.

For correction-requested:

show waiting/correction status.

For confirmed:

show accepted status.

If read-only accepted-paper reopening is not safely supported yet, the inspector may show accepted metadata only in V2.8.1 and leave full accepted-paper archive behavior to V2.8.2.

### POD inspector

Show:

- POD,
- load ref,
- receiver/facility,
- status,
- delivered/refused/shortage summary,
- signature state,
- whether review is required.

Do not invent a review action before the POD focused packet exists.

If the POD requires review, clearly label it **REVIEW WORKFLOW COMING IN V2.8.3** only in development copy/tests, not as player-facing roadmap text. Prefer player-facing copy such as **REVIEW REQUIRED** with no unavailable button.

---

## 9. FreightLink changes

This is an important architecture correction.

### Keep

FreightLink continues to own:

- lane evaluation,
- candidate driver,
- fit signals,
- Request Rate Con,
- request-pending status,
- correction-pending status,
- confirmed booking status.

### Remove

When a Rate Con arrives, FreightLink must no longer call the focused paper review directly.

Remove the direct:

`REVIEW RATE CON → onOpenRateCon(laneId)`

workflow.

### Replace

For RATE CON READY, FreightLink should communicate something like:

- **RATE CON RECEIVED**
- **CHECK DOCUMENTS**

If a CTA is retained, it may open the Documents app or select the associated document.

That is navigation to Documents, not document viewing inside FreightLink.

Correction requests still originate from the Focused Rate Con review opened through Documents.

---

## 10. Focused document handoff

The actual focused Rate Con screen remains the same component and behavior.

The new entry path is:

1. FreightLink requests Rate Con.
2. Booking record becomes RATE CON READY.
3. Documents index contains that Rate Con.
4. Player opens Documents.
5. Player selects the Rate Con.
6. Player chooses REVIEW DOCUMENT.
7. `focusedTask = rate-confirmation` opens existing Focused Workspace.
8. Player reviews/corrects/accepts.
9. Returning to Documents shows the updated status.

Closing Focused Workspace must return to a coherent Documents context rather than leaving the player in an unrelated FreightLink selection.

---

## 11. Bad-document and correction behavior

Preserve the deliberate mismatch scenario.

If a player requests correction:

- booking state becomes CORRECTION REQUESTED,
- Documents reflects that state,
- when the corrected Rate Con arrives, the same document/load context becomes actionable again,
- current corrected revision is clearly labeled.

Do not auto-mark the corrected document as valid.

The player still performs the comparison.

---

## 12. Confirmed Rate Con behavior

When the Rate Con is accepted:

- booking commits exactly as today,
- load enters the operational manifest,
- FreightLink lane leaves the available marketplace,
- Documents retains the Rate Con as part of the load's paperwork context.

Do not delete or hide the accepted Rate Con just because the market lane disappeared.

This is the first step toward a persistent load packet.

---

## 13. POD visibility

After Delivery creates a POD record, Documents must show it.

The row/inspector updates automatically as simulation time advances:

**PENDING RECEIVER → RECEIVED / REVIEW REQUIRED**

No manual refresh.

This proves the document index is connected to live game state.

---

## 14. Badges / attention count

Documents should expose a small attention count for documents that need the player's action.

At minimum count:

- Rate Con ready for review,
- corrected Rate Con ready for review,
- POD REVIEW_REQUIRED.

Do not count:

- pending receiver,
- correction requested / waiting,
- confirmed/accepted paperwork.

If command-rail badge styling already exists, reuse it.
Do not redesign the rail.

---

## 15. State and persistence rules

V2.8.1 must not introduce duplicate simulation truth.

### Invariants

- Documents browsing never alters route/manifest state.
- Rate Con acceptance remains the only booking-commit gate.
- POD state still advances from simulation time.
- Focused document work pauses simulation according to the existing Focused Workspace rule.
- Closing Focused review does not discard the underlying document.
- Confirmed Rate Cons remain discoverable even after their FreightLink lane is removed.

---

## 16. Tests

Add domain tests for the unified document index.

Required cases:

1. booking without Rate Con is not indexed as a document,
2. RATE CON READY becomes an actionable Rate Con document,
3. corrected Rate Con shows correct revision/status,
4. confirmed Rate Con remains indexed,
5. POD PENDING_RECEIVER is indexed,
6. POD RECEIVED is indexed,
7. POD REVIEW_REQUIRED is actionable/attention-bearing,
8. attention count excludes waiting/accepted states.

Add shell/static contract tests that assert:

- Documents command-rail section is enabled,
- Documents workspace renders,
- Rate Con opens from Documents,
- FreightLink no longer directly calls `onOpenRateCon`,
- FreightLink RATE CON READY copy points to Documents,
- existing `RateConfirmationReview` remains the focused review component,
- POD document records are passed into/consumed by the Documents workspace.

Full verification remains:

```bash
npm install --no-audit --no-fund
npm run lint
npm test
npm run build
```

---

## 17. Visual acceptance

Automated green is not visual acceptance.

Manual playtest should confirm:

- Documents feels like a native part of the workstation,
- the left browser is easy to scan,
- the right inspector is informative without becoming a second document page,
- moving from Documents into Focused Rate Con review feels intentional,
- closing review returns cleanly,
- Rate Con no longer feels like a FreightLink-owned screen,
- POD appearing in Documents feels naturally connected to the completed Delivery operation.

---

## Closeout audit result

The implementation audit found and corrected three final contract gaps before verification:

- Rate Con inspector now includes driver context,
- FreightLink explicitly communicates **RATE CON RECEIVED** before **CHECK DOCUMENTS**,
- player-facing Documents copy no longer exposes internal future-packet roadmap language.

Automated verification passed after these corrections.

The only remaining gate is the manual visual/gameplay acceptance flow below.

---

## 18. Acceptance flow

The critical V2.8.1 playtest is:

1. open FreightLink,
2. choose a lane/driver,
3. request Rate Con,
4. observe waiting state,
5. Rate Con arrives,
6. FreightLink says the paperwork is received / check Documents,
7. open Documents,
8. find the correct Rate Con,
9. select it,
10. open focused review,
11. identify the deliberate mismatch,
12. request correction or accept deliberately,
13. confirm load,
14. return to Documents,
15. verify the accepted/current document remains present,
16. later complete a Delivery,
17. verify its POD appears in Documents and advances status over time.

If that flow works cleanly, V2.8.1 is accepted.

---

## 19. Explicit non-goals

Do not add in this packet:

- Email inbox,
- driver Messages,
- invoice workflow,
- Banking,
- owner receivables,
- document folder drag/drop,
- advanced search,
- document deletion,
- exact file-system metaphors,
- tutorial gating,
- RPG consequences.

---

## 20. What comes immediately after

After V2.8.1 acceptance:

**V2.8.2 · Document Revisions & Rate Con Archive**

Then:

**V2.8.3 · POD Focused Workflow**

The durable sequence is maintained in `docs/ROADMAP.md`.
