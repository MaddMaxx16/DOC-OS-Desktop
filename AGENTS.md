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

## Current packet — V2.5.2 Document Desk + POI Completeness

V2.1 through V2.5.1 remain the active desktop foundation.

Guardrails:
- preserve the V2.5.1 command rail → browser → full-height map → inspector workstation,
- Focused Workspace remains the deliberate deep-task exception,
- Rate Confirmation paper lives on a reusable physical Document Desk,
- document sheets have persistent-in-session X/Y position and z-order behavior,
- dragging a document brings it to the front,
- stacking infrastructure must support future BOL/POD/invoice/document sheets without replacing the desk model,
- Rate Confirmation should visually read as a loose broker document rather than a dashboard card,
- the verification panel shows FreightLink reference values only,
- the Rate Con value must be read from the paper itself,
- MATCH / ISSUE is the player's judgment and must not reveal correctness,
- choosing ISSUE briefly highlights the corresponding area of the paper without confirming whether the player is right,
- acceptance remains blocked until every required comparison has been reviewed,
- the game may preserve a missed mismatch as a player mistake,
- every visible committed route segment must have visible endpoint context,
- the selected driver's normal map renders non-freight route anchors for yard, lunch, staging, and other route-owning events,
- freight pickup/delivery markers remain the richer P/D markers in normal Driver view,
- FreightLink may continue using the quieter compact route-anchor treatment,
- route/anchor completeness is validated for every seeded driver, not special-cased for Derrick,
- V2.5 booking/manifest truth remains authoritative,
- do not begin editable Daily Planning behavior until V2.6.

## Verification

Before merging meaningful changes:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Manual browser screenshot review for visual work.

A green build does not equal visual acceptance.
