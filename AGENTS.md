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

## Current packet — V2.8.1 Documents Workspace & Rate Con Handoff

V2.1 through V2.7.6.8 are accepted and locked.

The active implementation packet is:

`docs/IMPLEMENTATION_V2.8.1.md`

The durable build sequence lives in:

`docs/ROADMAP.md`

### Purpose

Begin the V2.8 Documents phase by connecting paperwork that already exists underneath the Desktop build to a real Documents workstation app.

The current problem is workflow ownership:

- FreightLink directly opens Rate Confirmation paper,
- Documents is disabled,
- Email is not built,
- POD records exist but are invisible.

V2.8.1 corrects that without redesigning the existing Rate Con gameplay.

### Core workflow rule

**FreightLink requests paperwork. Documents owns paperwork.**

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

Implement:

- Documents command-rail enablement,
- Documents browser,
- document inspector,
- unified operational document index over existing Rate Con and POD state,
- actionable Rate Con rows,
- POD visibility,
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

A green build does not equal visual acceptance.
