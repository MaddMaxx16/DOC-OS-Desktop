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

## Current packet — V2.8.3 POD Focused Workflow

V2.1 through V2.7.6.8 are accepted and locked.

V2.8.1.3 is accepted. The filing model is locked: cabinet owns files, desk owns physical unfiled papers, filing is player-driven, and packet completeness gates submission.

V2.9.1.6 is accepted and locked. Routine paperwork enters Documents Incoming, then the player deliberately moves it to the working desk before review/filing. Email is communication, not the universal document conveyor.

V2.8.3 is the active document-depth packet.

The active acceptance packet is:

`docs/IMPLEMENTATION_V2.8.3.md`

The durable build sequence lives in:

`docs/ROADMAP.md`

### Purpose

Turn PODs into actual review gameplay rather than passive paperwork.

### Locked POD workflow

**Delivery → Receiver Verification → Documents Incoming → Desk/File → Focused POD Review → Accept or Correct → File → Packet Complete**

- clean PODs still require player review,
- exception PODs visibly surface refusal, shortage, and damage,
- accepting an exception requires explicit confirmation,
- correction requests create a waiting state,
- corrected POD returns as a new revision through Incoming,
- the original revision becomes superseded,
- corrected-POD communication may appear in Email,
- only an **ACCEPTED** POD can satisfy the packet requirement.

### Build

Implement:

- POD focused review workspace,
- signature / delivered / refused / shortage / damage review facts,
- clean POD acceptance,
- exception acknowledgement,
- request corrected POD action,
- corrected POD R2+ generation,
- superseded original revision,
- corrected POD Incoming arrival,
- corrected POD Email communication,
- POD physical status/revision stamp,
- load-packet requirement changed from RECEIVED to ACCEPTED,
- regression coverage for clean, exception, correction, superseded, and accepted states.

### Preserve

Do not redesign:

- Documents Incoming tray,
- global working desk,
- filing cabinet / load-file organization,
- Rate Confirmation review,
- booking lifecycle,
- Delivery facility puzzle,
- receiver verification timing,
- Email mailbox presentation,
- Driver Day / FreightLink fit logic,
- V2.7 facility puzzles,
- trailer state,
- right-side operational HUDs.

### State rule

The Delivery domain remains the source of truth for what physically happened.

A corrected POD is a **paperwork revision**, not a rewrite of the freight event:

- refusal stays refusal,
- shortage stays shortage,
- damage stays damage,
- correction reissues/clarifies the receiver copy,
- player may still accept the corrected POD with the recorded exception.

### Explicit non-goals

Do not add:

- Rate Con archive/history UI,
- BOL gameplay,
- invoice gameplay,
- Messages,
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

V2.9.1.6 passed implementation and visual acceptance.

V2.8.3 must pass install, lint, tests, build, and manual playtest of clean POD review, exception acceptance, correction request, corrected Incoming arrival, superseded history, Email notice, and final packet completion.

A green build does not equal visual acceptance.
