# DOC OS Desktop

DOC OS Desktop is the desktop-first rebuild of the DOC OS trucking/dispatch simulator.

The active game is built around a map-first dispatch workstation where the player evaluates freight, builds a driver's day, confirms commercial paperwork, sends the operating plan, monitors live execution, and works physical pickup/delivery operations.

The original `MaddMaxx16/DOC-OS` repository remains a donor/reference for proven simulation logic only. Desktop presentation and active gameplay are rebuilt natively in this repository.

## Current status

**Accepted checkpoint:** `V2.9.1.6 · Incoming Tray & Communication Split`

**Current candidate:** `V2.8.3 · POD Focused Workflow`

V2.9.1.6 is visually accepted and locks the paperwork intake model: routine operational paperwork enters Documents **Incoming**, the player deliberately pulls it to the working desk, and Email is reserved for meaningful communication such as corrections and exceptions.

V2.8.3 builds document-depth gameplay on that accepted foundation: every usable POD must now be reviewed before it can satisfy a load packet, delivery exceptions can be accepted explicitly or sent back for correction, and corrected POD revisions return through Incoming.

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

The Documents + Incoming architecture is accepted. V2.8.3 is now adding deeper POD gameplay.

Still pending:

- **V2.8.3 POD Focused Workflow** is the active acceptance candidate,
- Messages / driver communication remains V2.9.2,
- accepted Rate Con revision/archive viewing remains a later document-depth pass,
- Send Schedule is still too tightly coupled to Planning mode,
- Live Operations has Play/Fast Forward but no **Advance to Next Operational Moment** control yet.

## Current acceptance gate

### V2.8.3 · POD Focused Workflow

The critical flow is:

1. complete a clean Delivery and wait for receiver verification,
2. confirm the POD appears in Documents Incoming as **REVIEW POD** rather than counting as complete immediately,
3. pull the POD to the desk and open **REVIEW POD**,
4. verify receiver signature, delivered quantity, refused quantity, shortage, damage, and revision are visible,
5. accept the clean POD and confirm its paper becomes **ACCEPTED**,
6. file it and confirm only then does the POD requirement become complete,
7. produce a Delivery with a refusal, shortage, or damage exception,
8. open focused POD review and confirm the exception is visibly called out,
9. test **ACCEPT WITH EXCEPTION** and its confirmation step,
10. separately test **REQUEST CORRECTED POD**,
11. confirm the original copy becomes superseded and revision R2 returns through Documents Incoming,
12. confirm Email reports the corrected POD as communication while the paper itself remains Documents work,
13. accept/file the corrected POD and complete the packet.

See the implementation packets:

- [V2.8.1 Accepted Documents Packet](docs/IMPLEMENTATION_V2.8.1.md)
- [V2.8.3 POD Focused Workflow](docs/IMPLEMENTATION_V2.8.3.md)
- [V2.9.1 Accepted Incoming + Communication Packet](docs/IMPLEMENTATION_V2.9.1.md)

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
