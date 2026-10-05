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

## Current packet — V2.7.5.0.2 Trailer View

V2.1 through V2.7.5.0.1 are accepted and locked. The equipment-derived puzzle grid, shaped freight, rotation, overlap/bounds validation, facility gating, Focused Mode, door commitment, and background loading remain authoritative.

Visual/gameplay correction:

> The center must read as an open truck trailer being loaded, not as a detached spreadsheet grid.

Trailer-view rules:
- preserve the existing equipment-derived collision grid underneath the visual surface,
- render that grid inside a stylized rear-open trailer body,
- visibly communicate roof/frame, side walls, front/nose, trailer floor, rear frame, tail lights, and doors,
- the floor narrows toward the nose to create 2.5D depth while remaining an interactive drag/drop board,
- placed freight renders as physical pallet/crate blocks inside the trailer rather than only changing cell color,
- full footprint preview remains green/valid or red/invalid during drag,
- clicking placed freight still returns it to staging before commitment,
- TRAILER VIEW is the active view for this packet,
- TOP DOWN and SIDE VIEW are shown as disabled future views only; they must not create a second state model,
- rear doors remain the commit interaction,
- do not alter puzzle legality, facility timing, route timing, or background-loading behavior in this visual packet,
- Focused Mode shell copy must be generic and must not say RATE CON REVIEW while Dock & Load is active.


## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
