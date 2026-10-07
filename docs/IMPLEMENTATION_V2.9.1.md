# V2.9.1 · Email Inbox & Print-to-Documents

## Status

**IMPLEMENTED · V2.9.1.1 VISUAL CORRECTION IN VERIFY**

Accepted base checkpoint:

`V2.8.1.3 · Global Paper Desk & Filing Gameplay`

Accepted base commit:

`0c809eed4d59bbd28d84d659aaba62e51f77031c`

---

## 1. Purpose

V2.8.1.3 proved the physical paperwork workflow.

The missing layer is digital intake.

External paperwork must no longer appear automatically on the Documents desk. It must arrive through a communication channel first.

V2.9.1 makes Email the first real digital paperwork delivery system.

---

## 2. Locked architecture rule

> **FreightLink requests it → Email delivers the digital attachment → Player prints it → Documents owns the physical copy.**

These states are intentionally different:

**Received digitally ≠ read ≠ printed ≠ filed ≠ packet requirement satisfied**

Do not collapse them.

---

## 3. Scope

### In scope

- enable Email on the command rail,
- Email inbox,
- read/unread state,
- Email badge for unread messages,
- message detail,
- digital document attachment card,
- Rate Confirmation arrival email,
- corrected Rate Confirmation arrival email,
- POD arrival email after receiver verification,
- explicit PRINT ATTACHMENT action,
- printed-document state,
- Documents desk shows only printed physical papers,
- FreightLink RATE CON READY routes to CHECK EMAIL,
- printed paper continues through the accepted V2.8 filing workflow.

### Out of scope

- driver Messages,
- sending arbitrary email,
- reply/composer gameplay,
- attachment downloads outside the game,
- full Rate Con revision archive,
- corrected POD request workflow,
- BOL generation,
- invoice generation,
- payment/Banking,
- Jordan tutorial.

---

## 4. Email ownership

Email owns:

- digital arrival,
- sender / subject / body,
- read/unread,
- attachment availability,
- whether the attachment has been printed.

Email does not own:

- booking acceptance,
- physical filing,
- packet completeness,
- load submission.

---

## 5. Documents ownership

Documents owns physical copies only.

A document may exist digitally while:

- its load file exists,
- the desk remains empty,
- Documents has no attention badge for that paper.

Only PRINT ATTACHMENT creates the physical copy that enters:

- global desk clutter,
- document inspection/review,
- drag-to-file,
- packet completeness.

---

## 6. Rate Confirmation flow

1. player requests Rate Con in FreightLink,
2. booking becomes RATE_CON_READY,
3. Email receives unread Rate Con message,
4. FreightLink says RATE CON RECEIVED / CHECK EMAIL,
5. player opens Email,
6. reading message clears unread state,
7. player prints attachment,
8. printed Rate Con appears loose on Documents desk,
9. player double-clicks and performs MATCH / ISSUE review,
10. accepted paper may be filed into the matching load file.

Corrected Rate Cons repeat the same digital-arrival and print flow.

Full old-revision email/document history remains later archive work.

---

## 7. POD flow

PENDING_RECEIVER is not yet an Email.

When receiver verification advances the POD to:

- RECEIVED, or
- REVIEW_REQUIRED,

Email receives the POD message.

The POD does not appear on the physical Documents desk until the player prints it.

---

## 8. Printing rule

PRINT ATTACHMENT:

- is deliberate,
- is idempotent,
- creates physical-paper eligibility,
- does not auto-open Documents,
- does not auto-file,
- does not mutate booking/POD status,
- does not satisfy a packet requirement by itself.

After printing, Email may offer OPEN DOCUMENTS as navigation only.

---

## 9. Attention rules

Email badge counts unread Email.

Documents badge counts only printed physical papers that need action.

Therefore:

- unread digital Rate Con → Email badge,
- unprinted Rate Con → no Documents paper / no Documents action badge,
- printed Rate Con needing review → Documents attention,
- filed accepted Rate Con → no action badge.

---

## 10. FreightLink correction

Replace:

**RATE CON RECEIVED → CHECK DOCUMENTS**

with:

**RATE CON RECEIVED → CHECK EMAIL**

FreightLink may navigate to the matching Email message.

FreightLink may not print the attachment or launch the paper review directly.

---

## 11. Tests

Required domain tests:

1. Rate Con becomes unread Email,
2. corrected Rate Con Email is labeled corrected,
3. PENDING_RECEIVER POD creates no Email,
4. RECEIVED POD creates Email,
5. read state clears unread count,
6. printed state appears on the Email attachment,
7. unprinted digital documents do not appear on Documents desk,
8. printing allows physical desk presence,
9. unprinted actionable paper does not create Documents attention.

Required shell/static contracts:

- Email command-rail app enabled,
- Email workspace rendered,
- unread Email badge wired,
- Email owns center workspace,
- PRINT ATTACHMENT present,
- OPEN DOCUMENTS after print,
- FreightLink uses CHECK EMAIL,
- old CHECK DOCUMENTS handoff removed,
- Documents index consumes printed-document state.

---

## 12. Acceptance flow

1. request Rate Con,
2. wait for arrival,
3. observe Email unread badge,
4. verify Documents desk does not receive the paper automatically,
5. open Email,
6. select Rate Con message,
7. print attachment,
8. open Documents,
9. verify printed Rate Con is now loose on desk,
10. review/accept/file Rate Con,
11. complete a Delivery,
12. wait for receiver verification,
13. observe POD Email arrival,
14. verify POD still is not on Documents desk,
15. print POD,
16. verify POD enters global desk and existing filing gameplay.

---

## V2.9.1.1 · Email Reader Polish

The first V2.9.1 playtest accepted the workflow but rejected the reader presentation as too document-centric.

Locked visual correction:

- preserve the inbox/read/unread/print state model,
- preserve Email → PRINT → Documents ownership,
- opened email must use normal message structure:
  - subject,
  - From,
  - To,
  - date/time,
  - body copy,
  - signature,
- attachment becomes a compact row/card beneath the message,
- attachment shows filename, type, load reference, source, document status, and print state,
- PRINT ATTACHMENT / OPEN DOCUMENTS remain file actions,
- remove the giant hero-paper preview from Email,
- Email must not visually compete with Documents as the paper workspace.

Acceptance:

A player looking at the screen should immediately read it as **an email client with an attachment**, not as **a document viewer with an email note above it**.

---

## 13. Verification

Before merge:

```bash
npm install --no-audit --no-fund
npm run lint
npm test
npm run build
```

Manual playtest is still required after green automation.
