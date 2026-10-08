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

## Current packet — V2.9.1.6 Incoming Tray & Communication Split

V2.1 through V2.7.6.8 are accepted and locked.

V2.8.1.3 is accepted. The filing model is locked: cabinet owns files, desk owns physical unfiled papers, filing is player-driven, and packet completeness gates submission.

V2.9.1.5 is implemented. V2.9.1.6 changes the workflow model: routine paperwork enters Documents Incoming, then the player deliberately moves it to the working desk before review/filing. Email is communication, not the universal document conveyor.

The active acceptance packet is:

`docs/IMPLEMENTATION_V2.9.1.md`

The durable build sequence lives in:

`docs/ROADMAP.md`

### Purpose

Preserve the accepted paper-organization gameplay while removing the unnecessary print-everything chore.

### Locked workflow invariant

**Operational system → Documents Incoming → Working Desk → Load File → Submit**

- routine Rate Cons go directly to Documents Incoming,
- receiver-verified clean PODs go directly to Documents Incoming,
- Incoming paperwork is not yet on the working desk,
- the player deliberately uses **PULL TO DESK** before review/filing,
- desk paperwork from every load still shares one global surface,
- filing is still deliberate drag/drop organization gameplay,
- packet completeness still gates submission.

### Locked communication invariant

**Email is for people talking about the operation, not for routine paper delivery.**

- initial Rate Con arrival does not create Email,
- clean POD arrival does not create Email,
- corrected Rate Con may create an Email notice while the revised paper itself goes to Documents Incoming,
- POD exceptions may create an Email notice while the POD itself remains Documents work,
- Email can link the player to related work in Documents,
- Email does not print, create, file, or approve paperwork.

### Build

Implement:

- Documents Incoming tray in the center workspace,
- three document locations: Incoming, Desk, Filed,
- PENDING_RECEIVER POD stays unavailable until receiver verification completes,
- PULL TO DESK action,
- Incoming-aware right inspector,
- Rate Con review unavailable until the paper leaves Incoming,
- file action requires the paper to be on the desk,
- unfile returns paper to the desk,
- Documents badge counts waiting Incoming work plus actionable desk/file work,
- FreightLink RATE CON READY routes to **CHECK DOCUMENTS**,
- Email removes attachment/printing gameplay,
- Email inbox remains real communication UI,
- corrected Rate Con and POD exception messages link to Documents.

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

Email messages may derive from the existing operational document index. Incoming/Desk/File placement is presentation/workflow state; it does not create a second booking or POD truth.

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

V2.9.1.6 must pass install, lint, tests, build, and manual playtest of Rate Con/POD Incoming arrival, Pull to Desk, review/filing, correction Email, and exception Email.

A green build does not equal visual acceptance.
