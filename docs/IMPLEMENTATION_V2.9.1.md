# V2.9.1 · Documents Intake + Email Communication

## Status

**ACCEPTED · V2.9.1.6 INCOMING TRAY & COMMUNICATION SPLIT**

Accepted base checkpoint:

`V2.8.1.3 · Global Paper Desk & Filing Gameplay`

---

## 1. Why this packet changed

The first V2.9.1 implementation routed routine Rate Cons and PODs through Email and required the player to print them before Documents could use them.

The workflow was technically coherent but added too many low-decision steps:

**FreightLink → Email → open attachment → print → Documents → desk → file**

The physical organization idea remains valuable. The mandatory printing loop does not.

V2.9.1.6 replaces the print gate with a Documents intake queue and gives Email a narrower, stronger purpose.

---

## 2. Locked workflow

> **Operational system → Documents Incoming → Working Desk → Load File → Submit**

These are separate states:

**Incoming ≠ Desk ≠ Filed ≠ Requirement satisfied**

### Incoming

Operational paperwork has arrived and is waiting to be worked.

Examples:

- initial Rate Confirmation,
- corrected Rate Confirmation,
- receiver-verified clean POD,
- POD with an exception after receiver verification,
- future BOL / receipts / invoice-support paperwork.

### Working Desk

The player has deliberately pulled the paper from Incoming and is actively working it.

The global desk:

- contains papers from many loads at once,
- can become cluttered,
- lets the player inspect and arrange papers,
- supports drag-to-file gameplay.

### Filed

The player has placed the paper into a load folder.

Filing does not imply approval.

A filed paper only satisfies a packet requirement when the paper's own document status is acceptable.

### Submitted

A load packet may be submitted only after all current required documents are filed and acceptable.

---

## 3. Locked Email role

> **Email is communication, not the universal paperwork conveyor.**

Email is for:

- correction notices,
- exception notices,
- approvals,
- requests,
- explanations,
- operational messages from people/systems that are worth reading.

Email is not required for:

- routine initial Rate Con delivery,
- routine clean POD delivery,
- moving paper into Documents,
- printing,
- filing,
- packet completion.

Email may link the player to related work in Documents.

---

## 4. Routine Rate Confirmation flow

1. player requests Rate Con in FreightLink,
2. booking enters REQUESTED,
3. broker returns Rate Con,
4. FreightLink shows **RATE CON RECEIVED**,
5. FreightLink action becomes **CHECK DOCUMENTS**,
6. Rate Con appears in Documents **Incoming**,
7. player selects/pulls the paper to the working desk,
8. paper can now enter focused MATCH / ISSUE review,
9. accepted Rate Con remains a paper,
10. player files it into the matching load file when desired.

Initial Rate Con arrival does **not** create routine Email.

---

## 5. Corrected Rate Confirmation flow

1. player reviews Rate Con,
2. player requests correction,
3. revised Rate Con is generated,
4. revised paper appears in Documents Incoming,
5. Email may receive a human-facing correction notice,
6. Email's related-work action opens Documents,
7. player pulls revised paper to desk and reviews again.

The corrected paper and the Email message are separate objects serving separate purposes.

---

## 6. POD flow

A POD record may exist internally while the receiver is still processing it.

### PENDING_RECEIVER

- does not appear in Incoming,
- does not appear on the desk,
- does not create routine Email.

### RECEIVED

- appears in Documents Incoming,
- no routine Email is required,
- player pulls it to desk and files it.

### REVIEW_REQUIRED

- appears in Documents Incoming,
- may create an Email exception notice,
- Email links back to Documents,
- the paper remains Documents work.

---

## 7. Documents Incoming tray

The center Documents workspace includes a physical **INCOMING** tray.

Requirements:

- shows count of waiting papers,
- shows document type,
- shows load reference,
- shows document status,
- lets the player select an incoming paper,
- exposes **PULL TO DESK**,
- never auto-files,
- never auto-reviews,
- never filters based on the selected load folder.

The left side remains the filing cabinet.

The center remains one global desk.

The right remains the selected-paper inspector.

---

## 8. Inspector behavior

If selected paper is Incoming:

- LOCATION = INCOMING TRAY,
- inspector explains that the paper must be pulled before review/filing,
- primary action = **PULL TO DESK**.

If selected paper is on desk:

- LOCATION = ON DESK,
- Rate Con can be reviewed,
- paper can be filed by drag/drop.

If selected paper is filed:

- LOCATION = FILED · <load>,
- paper can be opened/inspected,
- paper can return to desk until packet submission.

---

## 9. Attention rules

Documents attention should represent work waiting in Documents.

Count:

- every Incoming paper once,
- actionable desk paper once,
- actionable filed paper once.

Do not double-count the same paper.

Email badge counts unread communication only.

Therefore:

- routine initial Rate Con → Documents badge, no Email badge,
- clean POD → Documents badge, no Email badge,
- corrected Rate Con → Documents badge + possible unread Email,
- POD exception → Documents badge + possible unread Email.

---

## 10. FreightLink ownership

FreightLink owns:

- lane evaluation,
- REQUEST RATE CON,
- booking status,
- RATE CON RECEIVED state.

FreightLink does not:

- display the paper directly,
- launch focused paper review directly,
- route routine paperwork through Email.

RATE_CON_READY action:

**CHECK DOCUMENTS**

---

## 11. State model

Do not duplicate booking/POD document truth.

Use derived operational documents from:

- booking records,
- delivery document records.

Workflow placement state is separate:

- `deskDocumentIds`,
- `documentFileAssignments`,
- `submittedLoadFiles`.

A document is:

- Incoming when available and neither on desk nor filed,
- Desk when marked in `deskDocumentIds` and not filed,
- Filed when assigned to its load file.

PENDING_RECEIVER POD is not yet available for intake.

---

## 12. Preserve

Do not redesign:

- RateConfirmationReview MATCH / ISSUE gameplay,
- shared RateConfirmationPaper rendering,
- global draggable desk,
- load-file cabinet,
- wrong-folder rejection,
- return-to-desk behavior,
- packet requirement logic,
- submit lock,
- Delivery POD generation,
- receiver verification timing,
- facility gameplay,
- shared workstation gutter fixes.

---

## 13. Explicit non-goals

Do not add in this packet:

- full Rate Con revision archive,
- corrected POD request workflow,
- BOL generation,
- invoice generation,
- Banking,
- driver Messages,
- arbitrary Email compose/reply,
- tutorial/Jordan gating,
- Send Schedule UX correction,
- Advance to Next Operational Moment.

---

## 14. Required automated coverage

Domain tests:

1. new Rate Con enters Incoming,
2. PENDING_RECEIVER POD does not enter Incoming,
3. RECEIVED POD enters Incoming,
4. Pull to Desk removes paper from Incoming and adds it to desk,
5. filing removes paper from desk,
6. filed unacceptable paper does not satisfy requirement,
7. complete filed packet can submit,
8. Documents attention counts Incoming/actionable papers without duplicates,
9. routine Rate Con creates no Email,
10. clean POD creates no Email,
11. corrected Rate Con creates communication Email,
12. POD exception creates communication Email.

Shell/static contracts:

- FreightLink uses CHECK DOCUMENTS,
- no printDocument / printedDocumentIds workflow,
- Incoming tray exists,
- PULL TO DESK exists,
- Email contains related-work links,
- Email has no PRINT ATTACHMENT,
- Documents still uses global desk and load files.

---

## 15. Manual acceptance

### Rate Con

1. request Rate Con,
2. confirm **CHECK DOCUMENTS**,
3. open Documents,
4. confirm Rate Con is in Incoming and not yet on desk,
5. select it and inspect right panel,
6. press **PULL TO DESK**,
7. confirm it leaves Incoming and appears as a draggable paper,
8. double-click and complete review,
9. file it.

### Clean POD

1. complete Delivery,
2. before receiver verification, confirm no POD is in Incoming,
3. advance until receiver verification,
4. confirm POD appears in Incoming,
5. confirm no routine Email was created,
6. pull POD to desk,
7. file it.

### Communication

1. request Rate Con correction,
2. confirm corrected paper appears in Incoming,
3. confirm Email receives correction notice,
4. open Email and use related-work link to Documents,
5. create/test POD exception,
6. confirm exception Email appears while the POD itself remains Documents paperwork.

---

## 16. Verification gate

Before merge:

```bash
npm install --no-audit --no-fund
npm run lint
npm test
npm run build
```

A green automated gate does not replace manual visual/gameplay acceptance.
