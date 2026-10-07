# DOC OS Desktop

DOC OS Desktop is the desktop-first rebuild of the DOC OS trucking/dispatch simulator.

The active game is built around a map-first dispatch workstation where the player evaluates freight, builds a driver's day, confirms commercial paperwork, sends the operating plan, monitors live execution, and works physical pickup/delivery operations.

The original `MaddMaxx16/DOC-OS` repository remains a donor/reference for proven simulation logic only. Desktop presentation and active gameplay are rebuilt natively in this repository.

## Current status

**Accepted checkpoint:** `V2.7.6.8 · Dock Continuity & Placement Stability`

The operational freight loop is now substantially playable:

- desktop workstation shell and shared selection,
- per-driver identity and Driver Day / manifest,
- FreightLink lane evaluation against real schedule, HOS, route, and capacity,
- booking request + Rate Confirmation lifecycle,
- Focused Document Mode for Rate Confirmation review,
- Daily Planning with Lunch, staging, readiness, and schedule send,
- simulation clock, real route execution, facility waiting/service, and truck motion,
- physical Pickup loading puzzle,
- persistent shared trailer state,
- physical Delivery unloading / space-management puzzle,
- rear handling-path constraints and Temp Staging,
- receiver SOP sequencing,
- POD records created after Delivery and advanced by simulation time.

### Important current gaps

The operations engine is ahead of the workstation communication layer.

- **Documents** is not yet a first-class command-rail app.
- **Email** is not yet implemented.
- **Messages** is not yet implemented.
- Rate Confirmation review currently opens directly from FreightLink and must move into the Documents/Email workflow.
- POD records exist in game state but are not yet exposed through the workstation.
- Send Schedule is still too tightly coupled to Planning mode.
- Live Operations has Play/Fast Forward but no **Advance to Next Operational Moment** control yet.

## Next build

### V2.8.1 · Documents Workspace & Rate Con Handoff

The next build will:

- enable Documents as a real workstation app,
- create a unified document index over existing Rate Con and POD state,
- surface document status and load association,
- open Rate Confirmations from Documents into the existing Focused Document Mode,
- remove direct Rate Con document viewing from FreightLink,
- keep FreightLink responsible for requesting paperwork and showing booking status,
- preserve the existing Rate Con comparison/correction/acceptance gameplay,
- expose existing POD records in Documents as groundwork for focused POD review.

See the full implementation packet:

- [V2.8.1 Implementation Packet](docs/IMPLEMENTATION_V2.8.1.md)

## Roadmap

The durable project roadmap now lives in:

- [DOC OS Desktop Roadmap](docs/ROADMAP.md)

Use that file as the default answer to **"what are we building next?"** rather than reconstructing the build order from chat history.

High-level direction:

**V2.8 Documents → V2.9 Email + Messages → V2.10 Banking + Career Progression → V2.11 Onboarding → V2.12 Packaging**

## Architecture / development contract

- [Desktop Experience Architecture V2](docs/DESKTOP_EXPERIENCE_ARCHITECTURE_V2.md)
- [Development Contract](AGENTS.md)

The architecture document owns long-term desktop design decisions. `AGENTS.md` owns the active implementation contract for the current packet.

## Run locally

```bash
npm install
npm run dev
```

## Verify

Before meaningful changes are promoted:

```bash
npm run lint
npm test
npm run build
```

Visual/gameplay work also requires manual playtest acceptance. A green automated build means the code is structurally healthy; it does not mean the UI is visually accepted.

## Deployment policy

Git-triggered Vercel deployments are intentionally disabled.

Vercel is used only for **deliberate manual/shareable checkpoints**, not automatically on every push or merge.

## Migration rule

Do not copy legacy UI wholesale.

For each future packet:

1. identify the current source-of-truth behavior,
2. preserve proven domain/business logic,
3. add regression tests around its invariants,
4. build a desktop-native presentation on top of it,
5. remove transitional entry points once the replacement workflow is accepted.

## Current product principle

**Build the game → prove the systems → connect the workstation → then teach the finished game.**

Jordan/onboarding remains deferred until the real systems are stable enough to teach.
