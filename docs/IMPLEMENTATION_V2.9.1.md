# V2.9.1 · Communications + Documents Intake

## Status

**IMPLEMENTED · V2.9.1.6 DOCUMENTS INCOMING TRAY IN VERIFY**

Accepted base checkpoint:

`V2.8.1.3 · Global Paper Desk & Filing Gameplay`

---

## 1. Purpose

Preserve paperwork organization as gameplay while removing unnecessary repetitive steps.

The player should make organizational decisions:

- what paperwork to pull out,
- what to leave in Incoming,
- what to review,
- what to file,
- what is still missing from the load packet.

The player should not have to click Print for every routine document just to reach that gameplay.

---

## 2. Locked architecture

> **Operational system → Documents Incoming → Working Desk → Load File → Submit**

These states are distinct:

**Arrived ≠ on desk ≠ filed ≠ requirement satisfied ≠ submitted**

Email is not part of the required path for routine paperwork.

---

## 3. Documents ownership

Documents owns:

- Incoming paperwork,
- working-desk papers,
- document inspection/review entry,
- drag-to-file,
- load-file completeness,
- packet submission.

Routine documents enter Documents automatically when their source system produces a usable document.

### Rate Confirmation

When FreightLink returns a Rate Confirmation:

- the document appears in **Incoming**,
- FreightLink shows **RATE CON RECEIVED / CHECK DOCUMENTS**,
- it does not automatically appear on the working desk,
- the player must **PULL TO DESK** before working it.

### POD

While the receiver is processing:

- POD status may exist as PENDING_RECEIVER,
- no usable paper appears in Incoming yet.

When receiver processing advances the POD to RECEIVED or REVIEW_REQUIRED:

- the paper enters **Incoming**.

---

## 4. Incoming tray

Incoming is a physical tray inside the Documents desk workspace.

Rules:

- all usable new operational paperwork across loads can accumulate there,
- Incoming is independent from the selected load file,
- papers in Incoming do not clutter the working desk,
- **PULL TO DESK** moves one paper from Incoming to the global desk,
- pulling a paper does not review, accept, or file it,
- Documents command-rail badge counts papers currently waiting in Incoming.

---

## 5. Working desk

The working desk remains the global paper surface from V2.8.1.3.

Rules:

- papers from multiple loads may coexist,
- papers can overlap and be rearranged,
- single click selects,
- double click inspects/reviews,
- only desk papers may be dragged into load files,
- filing removes the paper from the working desk,
- unfiling returns the paper to the working desk.

Selecting a folder never filters the desk.

---

## 6. Load files and submission

No change to the accepted filing rules.

- each load owns one file,
- paperwork may be filed before or after review,
- filing does not imply validity,
- only acceptable filed documents satisfy requirements,
- packet submission stays disabled until all current requirements are satisfied,
- submitted packets remain locked.

Current implemented required documents:

- accepted Rate Confirmation,
- received clean POD.

Future BOL/invoice/supporting-document requirements extend this same model.

---

## 7. Email ownership

Email remains a real app, but it is communication-driven.

Routine initial Rate Con:

- no Email required.

Routine clean POD:

- no Email required.

Email is appropriate when a person or system needs to communicate context, for example:

- corrected Rate Confirmation returned,
- POD exception requires attention,
- future detention/accessorial approvals,
- accounting questions,
- customer/broker changes.

Current implemented exception messages:

- corrected Rate Con communication,
- POD REVIEW_REQUIRED communication.

These messages link back to Documents. They do not require printing.

---

## 8. FreightLink handoff

RATE_CON_READY behavior:

**RATE CON RECEIVED → CHECK DOCUMENTS**

FreightLink may navigate to Documents.

FreightLink does not launch focused review directly.

The player must pull the Rate Con from Incoming before reviewing it.

---

## 9. Attention model

Documents badge:

- counts papers waiting in Incoming.

Email badge:

- counts unread communication messages.

This keeps the two apps semantically different:

- Documents badge = paperwork waiting to be organized,
- Email badge = communication waiting to be read.

---

## 10. V2.9.1 correction history

### V2.9.1.1 · Email Reader Polish

Email presentation changed from document-centric to mailbox-centric.

### V2.9.1.2 · Email Sidebar Spacing

Email browser safe-area spacing corrected.

### V2.9.1.3 · Shared Left-Panel Gutters

Shared browser gutters established across workstation apps.

### V2.9.1.4 · Documents Panel Gutter Fix

Documents given stronger right-side breathing room.

### V2.9.1.5 · Documents Browser Containment

Documents header/filter/list overflow fixed.

### V2.9.1.6 · Documents Incoming Tray

Mandatory routine printing removed. Incoming becomes the operational paperwork intake surface.

---

## 11. Required tests

Domain:

1. new Rate Con enters Incoming,
2. finalized POD enters Incoming,
3. PENDING_RECEIVER POD does not enter Incoming,
4. PULL TO DESK removes paper from Incoming and adds it to desk,
5. filed paper is absent from Incoming and desk,
6. packet completeness still depends on acceptable filed documents,
7. Documents badge count equals Incoming count,
8. routine Rate Con produces no Email,
9. routine clean POD produces no Email,
10. corrected Rate Con produces Email communication,
11. POD exception produces Email communication.

Shell/static:

- Documents renders Incoming tray,
- PULL TO DESK exists,
- print-era state/actions are absent,
- FreightLink uses CHECK DOCUMENTS,
- Email has no PRINT ATTACHMENT action,
- Email related-work card opens Documents.

---

## 12. Acceptance flow

1. request Rate Con,
2. wait for RATE CON RECEIVED,
3. open Documents,
4. verify Rate Con is in Incoming and not on desk,
5. leave it there and verify desk stays clear,
6. pull it onto the desk,
7. review/accept/file it,
8. complete delivery,
9. while receiver processing is pending, verify no POD paper is available,
10. after receiver processing completes, verify POD enters Incoming,
11. pull POD onto desk and file it,
12. create multiple loads and allow several papers to accumulate in Incoming,
13. pull only some papers to the desk and confirm the others stay queued,
14. trigger a correction/exception and verify Email communicates the issue and points back to Documents.

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
