# V2.8.1 · Documents Workspace & Rate Con Handoff

## Status

**NEXT BUILD**

V2.7.6.8 is accepted and locked.

This packet begins the V2.8 Documents phase.

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

Today:

- FreightLink directly opens the Rate Confirmation,
- Documents is disabled,
- Email is not built,
- POD records are created but invisible to the player.

V2.8.1 creates the first real Documents workspace and moves Rate Confirmation access to the correct operational home.

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

**Command Rail → Documents Browser → Live Map → Document Inspector**

Do not replace the map for ordinary browsing.

Use Focused Workspace only when a deep document task begins.

### Documents browser

The left browser should support scanning documents.

At minimum show:

- document type,
- load ref,
- status,
- attention indicator,
- revision for Rate Con when relevant.

Useful filters may include:

- ALL,
- NEEDS ACTION,
- RATE CON,
- POD.

Keep filtering simple in this packet.

### Document selection

Selecting a document should use a coherent document selection state local to the Documents app or the shared selection model if that model is extended intentionally.

Do not overload freight-stop selection IDs.

The browser and inspector must agree on one selected document.

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
