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

## Current packet — V2.8.1.3 Global Paper Desk & Filing Gameplay

V2.1 through V2.7.6.8 are accepted and locked.

V2.8.1 is implemented. V2.8.1.1 fixed the recorded Delivery deadlock and moved Documents off the live map. V2.8.1.2 established load files and one authoritative paper rendering. The next playtest clarified the final interaction rule: load files live in the cabinet; all unfiled papers from all loads share one persistent desk. V2.8.1.3 is the active correction pass and must complete automated verification plus manual playtest before V2.8 is accepted.

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

- paperwork may be filed at any time,
- filing does not imply review/acceptance,
- only filed paperwork in acceptable status satisfies requirements,
- current implemented requirements are Rate Con + POD; BOL/invoice extend this same checklist later,
- submitted packets are locked from unfiling,
- do not auto-file documents when they arrive or when a folder is selected.

For this packet:

- FreightLink keeps lane evaluation and REQUEST RATE CON,
- FreightLink may display document/booking status,
- FreightLink may navigate the user toward Documents,
- FreightLink must not directly display or launch the Rate Confirmation paper,
- Documents becomes the implemented entry point to the existing Focused Rate Confirmation review,
- Email is deferred to V2.9.

Future complete invariant:

**FreightLink requests it → Email delivers it → Documents owns it → Focused Document Mode reviews it.**

### Build

Implemented:

- Documents command-rail enablement,
- load-file cabinet with expandable filed contents,
- global unfiled-paper desk across all loads,
- document inspector,
- unified operational document index over existing Rate Con and POD state,
- derived load-file index grouping papers by load,
- draggable/selectable loose papers on the global desk,
- drag-to-file gameplay with wrong-folder rejection,
- return-to-desk behavior for filed papers,
- double-click paper inspection,
- actionable Rate Con review from the paper itself,
- POD arrival onto the loose-paper desk before filing,
- current packet requirements and submission gate,
- Rate Con focused-review launch from Documents,
- direct FreightLink Rate Con review removal,
- accepted Rate Con persistence in Documents.

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

V2.8.1 may use a normalized/derived document index that references the existing booking/document sources.

A broader storage migration is not required unless implementation proves it necessary.

### Explicit non-goals

Do not add:

- Email,
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

The original V2.8.1 closeout, V2.8.1.1 correction, and V2.8.1.2 load-file refactor passed automated verification. V2.8.1.3 must pass the same gate after the global-desk filing changes.

A green build does not equal visual acceptance. Do not mark V2.8 accepted until multi-load desk clutter, drag-to-file, unfile, packet completeness/submission, focused paper handoff, and the Taylor T-110/Jersey City Delivery repro are manually playtested.
