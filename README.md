# DOC OS Desktop

Clean desktop-first rebuild of DOC OS.

This repository intentionally does **not** fork the mobile codebase. The original `MaddMaxx16/DOC-OS` repository remains a donor/reference for proven simulation logic. Desktop presentation is rebuilt from scratch around the active Desktop Experience Architecture V2.

## Current packet

**V2.1 — Shell Reset**

Included now:
- desktop-only React/Vite foundation,
- full-screen operations map,
- compact Metroline top bar,
- independently controlled left Driver drawer,
- independently controlled right Operations drawer,
- compact bottom app dock,
- no Capacitor,
- no phone shell,
- no Jordan tutorial,
- no legacy compatibility wrapper.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm run verify
```

## Migration rule

Do not copy legacy UI wholesale. For each future packet:

1. identify proven domain/business logic in the old repo,
2. port only that logic,
3. add tests around its invariants,
4. build a desktop-native presentation on top of it.
