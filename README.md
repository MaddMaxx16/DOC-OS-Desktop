# DOC OS Desktop

DOC OS Desktop is the desktop-first rebuild of the DOC OS trucking/dispatch simulator.

The active game is built around a map-first dispatch workstation where the player evaluates freight, builds a driver's day, confirms commercial paperwork, sends the operating plan, monitors live execution, and works physical pickup/delivery operations.

The original `MaddMaxx16/DOC-OS` repository remains a donor/reference for proven simulation logic only. Desktop presentation and active gameplay are rebuilt natively in this repository.

## Current status

**Accepted checkpoint:** `V2.9.1.6 · Incoming Tray & Communication Split`

**Current candidate:** `V2.7.7 · Freight Integrity & Exception Foundation`

V2.8.3 POD Focused Workflow is implemented, but its acceptance exposed an upstream simulation gap: Pickup and Delivery were still protecting the player from most operational failures, so shortage/damage/refusal states were largely unreachable through normal play.

V2.7.7 fixes that prerequisite. Pickup now has authored freight reality instead of guaranteed-perfect tender, the player may knowingly depart with operational discrepancies, freight condition/history persists through the trailer, Delivery reconciles what actually arrived, and POD exceptions are generated from that real freight state.

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

The Documents + Incoming architecture is accepted. V2.8.3 is implemented, but manual acceptance is paused until V2.7.7 proves that its POD exceptions can be produced by normal freight gameplay.

Still pending:

- **V2.7.7 Freight Integrity & Exception Foundation** is the active acceptance candidate,
- V2.8.3 POD Focused Workflow returns to acceptance immediately after V2.7.7 passes,
- Messages / driver communication remains V2.9.2,
- accepted Rate Con revision/archive viewing remains a later document-depth pass,
- Send Schedule is still too tightly coupled to Planning mode,
- Live Operations has Play/Fast Forward but no **Advance to Next Operational Moment** control yet.

## Current acceptance gate

### V2.7.7 · Freight Integrity & Exception Foundation

The critical flow is:

1. book a clean lane and verify Pickup can still complete normally,
2. book a short-tender lane and confirm the booked manifest expects more freight than the facility physically presents,
3. load every available booked unit and verify Pickup shows **FACILITY SHORT TENDER**,
4. close once to arm discrepancy departure, then **CONFIRM DEPARTURE**,
5. arrive at Delivery and confirm the receiver naturally detects the missing expected unit,
6. complete the receiver sequence and use **CONFIRM SHORT HANDOFF**,
7. verify the POD is created with a shortage exception,
8. book a lane with visible pickup damage,
9. verify the damaged unit is visibly marked and can be **NOTE DAMAGE** before loading,
10. carry minor damaged freight to Delivery and confirm receiver result becomes **ACCEPTED_WITH_DAMAGE**,
11. carry major damaged freight to Delivery and confirm receiver result becomes **REFUSED**,
12. verify refused freight remains on the trailer after handoff,
13. deliberately load the staged wrong-load pallet and depart with the mismatch,
14. verify that wrong freight persists as real trailer cargo and the intended load is short downstream.

Then return to V2.8.3 acceptance and prove that those real shortage/damage/refusal results flow into focused POD review.

See the implementation packets:

- [V2.7.7 Freight Integrity Foundation](docs/IMPLEMENTATION_V2.7.7.md)
- [V2.8.3 POD Focused Workflow](docs/IMPLEMENTATION_V2.8.3.md)
- [V2.9.1 Accepted Incoming + Communication Packet](docs/IMPLEMENTATION_V2.9.1.md)

## Roadmap

The durable project roadmap now lives in:

- [DOC OS Desktop Roadmap](docs/ROADMAP.md)

Use that file as the default answer to **"what are we building next?"** rather than reconstructing the build order from chat history.

High-level direction:

**V2.7.7 Freight Integrity prerequisite → finish V2.8.3 POD acceptance → remaining document depth → V2.9 Messages → V2.10 Banking + Career Progression → V2.11 Onboarding → V2.12 Packaging**

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
