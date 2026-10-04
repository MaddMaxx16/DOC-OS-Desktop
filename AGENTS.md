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

## Current packet — V2.4.6 Driver Route + Load Insertion Preview

V2.1 through V2.4.5 are structurally locked.

V2.4.6 turns the FreightLink map from isolated lane preview into a before/after planning board.

Guardrails:
- preserve the V2.4.4 flat north-up camera, shared drawer, map style, POI language, and readability scale,
- FreightLink candidate driver context is shared with the shell even before a load is selected,
- the candidate driver's existing planned day is rendered as a continuous route in that driver's persistent identity color,
- existing route order follows the authoritative Driver Day timeline,
- FreightLink evaluation keeps the committed driver route visible,
- the direct existing leg replaced by a proposed insertion is visually subdued rather than removed from the model,
- a proposed insertion renders in neutral from existing stop → pickup → delivery → next existing stop,
- deadhead and rejoin portions use neutral dashed treatment,
- loaded proposed freight uses a stronger neutral solid treatment,
- neutral proposal routes do not inherit driver color until booking/assignment actually commits the work,
- FreightLink hides the driver's individual manifest POI markers while shopping so route context does not recreate map clutter,
- truck and facility symbol bodies are reduced roughly 15–20% without reducing gameplay text,
- do not change FreightLink fit truth, manifest order, HOS, capacity, appointments, shell structure, or typography,
- do not add booking or Rate Confirmation behavior until V2.5.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
