# DOC OS Desktop

DOC OS Desktop is the desktop-first rebuild of the DOC OS trucking/dispatch simulator.

The active game is built around a map-first dispatch workstation where the player evaluates freight, builds a driver's day, confirms commercial paperwork, sends the operating plan, monitors live execution, and works physical pickup/delivery operations.

The original `MaddMaxx16/DOC-OS` repository remains a donor/reference for proven simulation logic only. Desktop presentation and active gameplay are rebuilt natively in this repository.

## Current status

**Accepted checkpoint:** `V2.7.6.8 · Dock Continuity & Placement Stability`

**Current candidate:** `V2.8.1.1 · Documents Desk Polish & Delivery Fix`

V2.8.1.1 is the active correction candidate after the first V2.8.1 playtest. It replaces the map-centered Documents view with a dedicated paperwork desk, standardizes workstation browser width, and fixes the recorded Jersey City Delivery receiving-floor deadlock. Automated verification is required again before merge, followed by visual/gameplay acceptance.

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
- POD records created after Delivery and advanced by simulation time,
- Documents as a live workstation app,
- unified Rate Con + POD document indexing,
- Documents attention badges and document selection,
- Rate Con handoff from FreightLink into Documents,
- existing Focused Document Mode launched from Documents.

### Important current gaps

The V2.8.1 feature set is implemented, but the first visual playtest produced a Documents-layout correction and a real Delivery deadlock. V2.8.1.1 addresses those findings before checkpoint acceptance.

Still pending after that gate:

- **Email** is not yet implemented.
- **Messages** is not yet implemented.
- accepted Rate Con revision/archive viewing is deferred to V2.8.2,
- focused POD review/correction is deferred to V2.8.3,
- Send Schedule is still too tightly coupled to Planning mode,
- Live Operations has Play/Fast Forward but no **Advance to Next Operational Moment** control yet.

## Current acceptance gate

### V2.8.1.1 · Documents Desk Polish & Delivery Fix

Correction pass in verification. The acceptance flow is:

1. request a Rate Con in FreightLink,
2. confirm FreightLink reports **RATE CON RECEIVED** and routes to **CHECK DOCUMENTS**,
3. open the matching Rate Con in Documents and verify the center workspace is the document desk rather than the live map,
4. confirm Fleet, FreightLink, and Documents use the same browser width, then launch the existing Focused Document Mode,
5. exercise mismatch/correction/acceptance behavior,
6. confirm the accepted Rate Con remains filed,
7. reproduce Taylor Brooks / T-110 at Jersey City Crossdock and confirm all three Forklift Handling units can clear the receiving floor,
8. complete a Delivery and confirm the POD appears and advances status correctly.

See the implementation packet:

- [V2.8.1 Implementation Packet](docs/IMPLEMENTATION_V2.8.1.md)

After V2.8.1 is visually accepted, the next packet is **V2.8.2 · Document Revisions & Rate Con Archive**.

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
