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

## Current packet — V2.9.1 Email Inbox & Print-to-Documents

V2.1 through V2.7.6.8 are accepted and locked.

V2.8.1.3 is accepted. The filing model is locked: cabinet owns files, desk owns physical unfiled papers, filing is player-driven, and packet completeness gates submission.

V2.9.1 is the active build. It introduces the digital intake layer that feeds Documents.

The active acceptance packet is:

`docs/IMPLEMENTATION_V2.8.1.md`

The durable build sequence lives in:

`docs/ROADMAP.md`

### Purpose

Connect paperwork that already exists underneath the Desktop build to a real Documents workstation app.

V2.8.1 now corrects the prior workflow-ownership problem:

- FreightLink requests paperwork and hands the player to Documents,
- Documents is live on the command rail,
- Rate Con and POD state share a derived operational document index,
- Documents launches the existing focused Rate Con review,
- Email remains deferred to V2.9.

V2.8.1.3 keeps the same underlying document truth but locks the gameplay contract: folders never leave the cabinet; the center desk is global unfiled paperwork; selecting a folder never filters the desk; filing removes a paper from the desk and adds it to that load file; packet completeness gates submission.

### Core workflow rule

**FreightLink requests paperwork. Documents owns paperwork.**

### Locked filing invariant

**Cabinet owns files. Desk owns unfiled papers. Folder selection never filters the desk. Filing is player-driven. Packet completeness gates submission.**

### Locked communication/document invariant

**FreightLink requests it → Email delivers it → player prints it → Documents owns the physical copy.**

- digital receipt does not create a Documents paper,
- reading an email does not print it,
- printing does not file it,
- filing does not satisfy a requirement unless document status is acceptable,
- Email owns digital arrival/read state,
- Documents owns physical paper/filing state,
- do not auto-print external paperwork,
- POD email appears only after receiver verification has completed.

- paperwork may be filed at any time,
- filing does not imply review/acceptance,
- only filed paperwork in acceptable status satisfies requirements,
- current implemented requirements are Rate Con + POD; BOL/invoice extend this same checklist later,
- submitted packets are locked from unfiling,
- do not auto-file documents when they arrive or when a folder is selected.

For this packet:

- FreightLink keeps lane evaluation and REQUEST RATE CON,
- FreightLink may display document/booking status,
- FreightLink routes RATE CON READY to **CHECK EMAIL**,
- Email owns digital arrival/read state and attachment printing,
- Documents receives only printed physical copies,
- Documents remains the entry point to focused Rate Confirmation review after printing,
- reading an email must not auto-print or auto-file its attachment.

Locked invariant:

**FreightLink requests it → Email delivers it → player prints it → Documents owns the physical copy → Focused Document Mode reviews it.**

### Build

Implement:

- Email command-rail enablement,
- inbox + read/unread state,
- unread Email badge,
- message detail,
- Rate Con arrival attachment,
- corrected Rate Con attachment labeling,
- POD email after receiver verification,
- PRINT ATTACHMENT,
- OPEN DOCUMENTS after print,
- printed-document state,
- Documents desk filtered to printed papers only,
- Documents attention filtered to printed papers only,
- FreightLink CHECK EMAIL handoff.

Preserve the accepted V2.8.1.3 cabinet/desk/filing/submission gameplay unchanged.

### Preserve

Do not redesign:

- `RateConfirmationReview`,
- `DocumentDesk`,
- booking lifecycle states,
- Rate Con correction behavior,
- accept-with-mismatch behavior,
- Delivery POD generation,
- POD simulation-time advancement,
- Driver Day / FreightLink fit logic,
- V2.7 facility puzzles,
- trailer state,
- right-side operational HUDs.

### State rule

Do not create duplicate editable document truth.

Email messages may derive from the existing operational document index. Printing is presentation/workflow state; it does not create a second booking or POD truth.

A broader storage migration is not required unless implementation proves it necessary.

### Explicit non-goals

Do not add:

- Messages,
- focused POD review,
- corrected POD workflow,
- invoice gameplay,
- Banking,
- LedgerDesk,
- RPG/XP,
- Jordan tutorial,
- Send Schedule UX changes,
- Advance to Next Operational Moment.

### Deployment policy

Automatic Git-triggered Vercel deployments are disabled through `vercel.json`.

Vercel remains available for deliberate manual/shareable checkpoints only.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

V2.8.1.3 passed automated verification and manual acceptance.

V2.9.1 must pass install, lint, tests, build, and manual playtest of Rate Con/POD Email arrival, unread state, printing, and Documents handoff.

A green build does not equal visual acceptance.
