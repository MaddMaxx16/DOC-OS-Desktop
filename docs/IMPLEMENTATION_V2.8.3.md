# V2.8.3 · POD Focused Workflow

## Status

**ACTIVE IMPLEMENTATION CANDIDATE**

Accepted base checkpoint:

`V2.9.1.6 · Incoming Tray & Communication Split`

---

## 1. Purpose

Make Proof of Delivery paperwork something the player must actually review and resolve.

A POD should not become packet-complete simply because the receiver finished it.

The player must inspect the receiver copy, understand whether the delivery was clean or had an exception, then either accept it or request corrected paperwork.

---

## 2. Locked workflow

> **Delivery → Receiver Verification → Documents Incoming → Desk/File → Focused POD Review → Accept or Correct → File → Packet Complete**

These states remain separate:

**Receiver finalized ≠ reviewed ≠ accepted ≠ filed ≠ packet complete**

---

## 3. POD lifecycle

### PENDING_RECEIVER

- internal POD record exists,
- receiver verification is still running,
- no usable paper appears in Incoming,
- no review action exists.

### RECEIVED

- clean receiver copy is ready,
- paper enters Documents Incoming,
- player must pull/work it,
- focused review is required before packet eligibility.

### REVIEW_REQUIRED

- receiver copy contains a refusal, shortage, damage signal, or other delivery exception,
- paper enters Incoming,
- focused review highlights the exception,
- Email may notify the player because communication value exists.

### CORRECTION_REQUESTED

- player asked receiver to reissue the POD,
- current paper remains visible in its current physical location,
- current paper cannot satisfy the packet,
- corrected revision has not arrived yet.

### CORRECTED_RECEIVED

- new POD revision is created,
- revision returns through Documents Incoming,
- original revision becomes SUPERSEDED,
- corrected revision must still be reviewed.

### ACCEPTED

- player accepted the receiver copy,
- accepted-with-exception is recorded when applicable,
- accepted paper only satisfies the packet when it is also filed.

### SUPERSEDED

- older revision retained as historical paperwork,
- cannot satisfy packet completeness.

---

## 4. Focused POD review

Focused POD review pauses gameplay and uses the real physical POD paper.

Required facts:

- receiver signature,
- delivered units,
- refused units,
- shortage units,
- damage state,
- revision number.

### Clean POD

Player sees:

- CLEAN POD,
- no exception signals,
- **ACCEPT POD**.

### Exception POD

Player sees:

- EXCEPTION POD,
- every exception signal,
- **REQUEST CORRECTED POD**,
- **ACCEPT WITH EXCEPTION**.

Accepting with exception requires a second confirmation.

### Corrected POD

Player sees:

- CORRECTED POD,
- revision number,
- correction context,
- preserved delivery facts,
- same accept/correction options when exceptions still exist.

---

## 5. Correction rule

A corrected POD is a paperwork revision.

It must not rewrite what physically happened at Delivery.

Therefore:

- refused freight remains refused,
- shortage remains shortage,
- damage remains damage,
- corrected copy may clarify/reissue the receiver paperwork,
- player may accept the corrected copy with the recorded exception.

This preserves the Delivery operation as source of truth.

---

## 6. Revision behavior

Initial POD:

- R1,
- existing POD id remains unchanged.

Corrected POD:

- R2+,
- receives a new document id,
- carries `supersedesId`,
- original revision becomes SUPERSEDED,
- new revision enters Incoming.

This creates the first real multi-revision POD history without building the full general document archive packet yet.

---

## 7. Packet completeness

POD requirement changes from:

**filed RECEIVED POD**

to:

**filed ACCEPTED POD**

Therefore:

- a clean but unreviewed POD does not complete the packet,
- a filed but unreviewed POD does not complete the packet,
- an exception POD does not complete the packet until accepted,
- a correction-requested or superseded POD does not complete the packet,
- only an ACCEPTED filed POD completes the current POD requirement.

---

## 8. Email role

Routine clean POD:

- no Email required.

Initial exception POD:

- may generate **Delivery exception · <load>** communication.

Corrected POD arrival:

- generates **Corrected POD available · <load>** communication,
- message links back to Documents,
- paper itself remains Documents work.

Email does not own acceptance or filing.

---

## 9. Documents behavior

Incoming:

- usable unreviewed POD revisions appear here.

Working desk:

- player may arrange/inspect/review PODs.

Load file:

- player may file before or after review,
- filing alone does not satisfy the requirement,
- superseded revisions may remain as historical paperwork,
- accepted revision becomes the qualifying packet document.

Right inspector:

- shows revision,
- signature,
- delivery summary,
- review/correction/accepted/superseded state,
- exposes **REVIEW POD** when focused review is available.

---

## 10. Physical paper

POD paper shows:

- revision,
- receiver details,
- delivery summary,
- signature,
- physical status stamp.

Expected stamps include:

- REVIEW POD,
- EXCEPTION REVIEW,
- CORRECTION REQUESTED,
- CORRECTED · REVIEW,
- ACCEPTED,
- ACCEPTED · EXCEPTION,
- SUPERSEDED.

---

## 11. Tests

Domain tests:

1. PENDING_RECEIVER advances to RECEIVED for clean delivery,
2. receiver exception advances to REVIEW_REQUIRED,
3. clean POD can be accepted,
4. exception POD cannot be accepted without explicit exception acknowledgement,
5. exception POD can request correction,
6. corrected POD creates a new revision,
7. original POD becomes superseded,
8. corrected revision preserves actual delivery exception facts.

Operational-document tests:

1. clean RECEIVED POD becomes actionable REVIEW POD,
2. exception POD becomes EXCEPTION REVIEW,
3. corrected POD becomes CORRECTED · REVIEW,
4. accepted POD is non-actionable,
5. packet requirement accepts only ACCEPTED POD,
6. filed unreviewed POD does not satisfy the packet.

Email tests:

1. routine clean POD creates no Email,
2. exception POD creates communication,
3. corrected POD creates corrected-paper communication.

Shell/static tests:

- focused `pod-review` task exists,
- PodReview component is wired,
- review/correction/accept actions are wired,
- Documents inspector shows REVIEW POD,
- physical paper revision/status stamp exists.

---

## 12. Acceptance flow

### Clean POD

1. complete a clean Delivery,
2. wait for receiver verification,
3. POD enters Incoming,
4. pull to desk,
5. open REVIEW POD,
6. verify signature/delivery facts,
7. accept POD,
8. file POD,
9. verify packet requirement completes.

### Exception POD — accept

1. create refusal, shortage, or damage during Delivery,
2. wait for receiver verification,
3. POD enters Incoming as exception review,
4. pull/open review,
5. inspect exception signals,
6. choose ACCEPT WITH EXCEPTION,
7. confirm warning,
8. file accepted POD,
9. verify packet can progress.

### Exception POD — correction

1. open exception POD review,
2. request corrected POD,
3. focused review closes,
4. current paper shows CORRECTION REQUESTED,
5. corrected R2 returns through Incoming,
6. original R1 becomes SUPERSEDED,
7. Email receives corrected-POD communication,
8. pull R2 to desk,
9. review and accept,
10. file R2,
11. verify only accepted R2 satisfies packet.

---

## 13. Verification

Before merge:

```bash
npm install --no-audit --no-fund
npm run lint
npm test
npm run build
```

Manual playtest remains required after green automation.
