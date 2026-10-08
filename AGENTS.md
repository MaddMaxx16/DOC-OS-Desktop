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

## Current packet — V2.7.7 Freight Integrity & Exception Foundation

V2.1 through V2.7.6.8 are accepted and locked.

V2.8.1.3 is accepted. The filing model is locked: cabinet owns files, desk owns physical unfiled papers, filing is player-driven, and packet completeness gates submission.

V2.9.1.6 is accepted and locked. Routine paperwork enters Documents Incoming, then the player deliberately moves it to the working desk before review/filing. Email is communication, not the universal document conveyor.

V2.8.3 POD Focused Workflow is implemented, but manual acceptance is paused because the freight simulation did not yet produce shortage/damage/refusal outcomes naturally.

V2.7.7 is the active prerequisite packet.

The active acceptance packet is:

`docs/IMPLEMENTATION_V2.7.7.md`

The durable build sequence lives in:

`docs/ROADMAP.md`

### Purpose

Make freight itself the source of truth from Pickup through Delivery so downstream POD exceptions come from real gameplay.

### Locked freight-integrity chain

**Booked expectation → Pickup reality → actual trailer cargo → freight condition/history → receiver reconciliation → POD**

The expected manifest and physical freight are not the same concept.

### Build

Implement:

- authored pickup-reality metadata on selected market lanes,
- full booked expected manifest independent from facility-staged freight,
- pickup short tender,
- visible pre-existing pickup damage,
- damage documentation action,
- wrong-load cargo allowed to become actual trailer cargo,
- departure-with-discrepancy two-step confirmation,
- safety blockers remain non-overridable,
- committed trailer snapshot preserves actual identity/condition/history,
- Delivery shortage becomes a receiver discrepancy rather than a deadlock,
- receiver condition reconciliation,
- minor damage → ACCEPTED_WITH_DAMAGE,
- major damage → REFUSED,
- refused cargo remains on trailer,
- real receiver results feed the existing POD system.

### Safety vs operational-error rule

Keep physically impossible or safety-critical actions blocked:

- overlap,
- freight outside trailer bounds,
- trailer overweight,
- unsafe weight distribution,
- hazmat segregation failure,
- unreachable delivery-access layouts that cannot physically operate.

Allow operational mistakes to persist:

- facility short tender,
- leaving available booked freight behind,
- wrong-load freight onboard,
- visible damage not documented,
- carrying damaged freight to the receiver.

### No random failure rule

Do not add hidden RNG that damages freight or silently removes pallets.

For this packet:

- facility irregularities are authored/deterministic,
- player choices determine whether the discrepancy is caught, documented, carried, or departed with,
- receiver results are deterministic consequences of freight truth.

### Preserve

Do not redesign:

- Rate Confirmation / booking flow,
- Daily Planning,
- pickup trailer puzzle geometry,
- Delivery receiver SOP / handling puzzle,
- Documents Incoming / desk / filing,
- V2.8.3 focused POD review,
- Email presentation,
- Driver Day / FreightLink fit logic.

### Explicit non-goals

Do not add yet:

- random accident rolls,
- weather-caused damage,
- en-route cargo shifts,
- insurance/claims gameplay,
- BOL gameplay,
- invoice gameplay,
- Messages,
- Banking,
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

V2.8.3 automated implementation is complete; manual acceptance resumes after V2.7.7.

V2.7.7 must pass install, lint, tests, build, and manual playtest of clean pickup, short tender, wrong-load departure, documented/undocumented pickup damage, Delivery shortage, receiver damage acceptance, receiver refusal, refused cargo persistence, and downstream POD exception creation.

A green build does not equal visual acceptance.
