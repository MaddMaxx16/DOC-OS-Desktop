# DOC OS Desktop

DOC OS Desktop is the desktop-first rebuild of the DOC OS trucking/dispatch simulator.

The active game is built around a map-first dispatch workstation where the player evaluates freight, builds a driver's day, confirms commercial paperwork, sends the operating plan, monitors live execution, and works physical pickup/delivery operations.

The original `MaddMaxx16/DOC-OS` repository remains a donor/reference for proven simulation logic only. Desktop presentation and active gameplay are rebuilt natively in this repository.

## Current status

**Accepted checkpoint:** `V2.8.1.3 · Global Paper Desk & Filing Gameplay`

**Current candidate:** `V2.9.1.6 · Incoming Tray & Communication Split`

V2.8.1.3 is visually accepted and locks the Documents interaction model: load folders live in the filing cabinet, every unfiled physical paper shares one persistent desk, filing is player-driven, and packet completeness gates submission.

V2.9.1.5 fixed the Documents panel containment issue. V2.9.1.6 changes the paperwork loop itself: routine operational paperwork now enters a Documents **Incoming** tray, the player pulls it onto the working desk, and Email is reserved for meaningful communication such as corrections and exceptions.

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

The physical Documents workflow is accepted. V2.9.1.6 is correcting how paperwork enters that workflow.

Still pending:

- **V2.9.1.6 Incoming Tray & Communication Split** is the active acceptance candidate,
- Messages / driver communication remains V2.9.2,
- accepted Rate Con revision/archive viewing returns after the Incoming workflow is accepted,
- focused POD review/correction returns after the Incoming workflow is accepted,
- Send Schedule is still too tightly coupled to Planning mode,
- Live Operations has Play/Fast Forward but no **Advance to Next Operational Moment** control yet.

## Current acceptance gate

### V2.9.1.6 · Incoming Tray & Communication Split

The critical flow is:

1. request a Rate Con in FreightLink,
2. FreightLink reports **RATE CON RECEIVED** and routes to **CHECK DOCUMENTS**,
3. the Rate Con appears in the Documents **Incoming** tray, not directly on the desk,
4. pull the Rate Con from Incoming onto the working desk,
5. review/accept/file it through the existing Documents workflow,
6. complete a Delivery and wait for receiver verification,
7. a clean POD appears in Documents Incoming without creating routine Email,
8. pull the POD to the desk and file it,
9. request a Rate Con correction and confirm the revised paper returns to Incoming while Email provides the human-facing correction notice,
10. create a POD exception and confirm Email notifies the player while the POD itself remains Documents work.

See the implementation packets:

- [V2.8.1 Accepted Documents Packet](docs/IMPLEMENTATION_V2.8.1.md)
- [V2.9.1 Email Intake Packet](docs/IMPLEMENTATION_V2.9.1.md)

## Roadmap

The durable project roadmap now lives in:

- [DOC OS Desktop Roadmap](docs/ROADMAP.md)

Use that file as the default answer to **"what are we building next?"** rather than reconstructing the build order from chat history.

High-level direction:

**V2.8 Documents foundation → V2.9.1 Incoming + communication split → remaining document depth → V2.9 Messages → V2.10 Banking + Career Progression → V2.11 Onboarding → V2.12 Packaging**

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
