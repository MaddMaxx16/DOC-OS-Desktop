# V2.7.7 · Freight Integrity & Exception Foundation

## Status

**ACTIVE IMPLEMENTATION CANDIDATE**

Accepted base checkpoints:

- `V2.7.6.8 · Facility Gameplay`
- `V2.9.1.6 · Incoming Tray & Communication Split`

V2.8.3 POD Focused Workflow is implemented and waiting on this prerequisite for realistic exception sources.

---

## 1. Purpose

Make freight itself authoritative from Pickup through Delivery.

The player should not receive a shortage/damage/refusal POD because a downstream minigame invented one.

The system should derive those outcomes from:

- what was booked,
- what the pickup facility actually tendered,
- what the player actually loaded,
- what condition the freight was in,
- what stayed on the trailer,
- what the receiver physically received.

---

## 2. Locked freight truth

> **Booked expectation → Pickup reality → actual trailer cargo → freight condition/history → receiver reconciliation → POD**

These states are deliberately different:

**Expected ≠ tendered ≠ loaded ≠ delivered ≠ accepted**

The booked manifest remains the contractual expectation.

The trailer snapshot remains the physical truth.

---

## 3. Authored pickup reality

Selected market lanes now carry deterministic pickup irregularities.

Initial scenarios:

- **FL-401** — clean baseline,
- **FL-402** — one minor damaged unit presented at Pickup,
- **FL-403** — facility short-tenders one booked unit,
- **FL-404** — one major damaged unit presented at Pickup.

No hidden random failure roll is used.

This keeps debugging/playtesting deterministic and makes failures understandable.

---

## 4. Expected manifest vs staged freight

`buildExpectedPickupFreight(event)` owns the full booked freight expectation.

`buildPickupFacilityFreight(event)` owns what is physically on the dock.

A missing expected pallet is omitted from facility staging but remains in the expected manifest.

Therefore Pickup can truthfully show:

**EXPECTED 5 / TENDERED 4**

without manufacturing the missing pallet as an invisible object.

---

## 5. Pickup discrepancies

Pickup distinguishes physical/safety blockers from operational discrepancies.

### Non-overridable blockers

Still prevent departure:

- freight overlap,
- freight outside trailer geometry,
- trailer overweight,
- unsafe weight balance,
- incompatible hazmat segregation,
- physically unworkable delivery-access layout,
- other hard trailer constraints.

### Overridable operational discrepancies

May depart after deliberate confirmation:

- facility short tender,
- booked freight left behind,
- wrong-load freight onboard,
- visible damage loaded without a pickup damage note.

The departure action is two-step:

1. **CLOSE WITH DISCREPANCY**
2. **CONFIRM DEPARTURE**

That confirmation records intent without pretending the discrepancy was fixed.

---

## 6. Pickup damage

A staged freight unit may arrive with:

- `condition = DAMAGED`,
- `damageSeverity = MINOR | MAJOR`,
- description,
- origin = PICKUP_FACILITY.

The manifest visibly identifies the damage.

Player action:

**NOTE DAMAGE**

records that the damage was observed before departure.

If the player loads damaged freight without noting it, Pickup records an unresolved risk.

Damage documentation does not repair the freight.

---

## 7. Wrong-load freight

The existing staged load-number mismatch pallet remains physically selectable.

V2.7.7 changes its consequence:

- loading it is no longer blocked as an abstract validation error,
- it becomes real trailer cargo,
- its own load identity persists,
- intended booked freight may therefore remain missing,
- downstream receiver reconciliation sees the intended shortage naturally.

This keeps the load-number matching puzzle meaningful.

---

## 8. Persistent trailer truth

`commitPickupOperation()` persists every actually loaded freight unit, including mismatched cargo.

Persisted freight owns:

- freight id,
- load identity,
- expected destination,
- condition,
- damage severity/description,
- pickup-damage documentation state,
- trailer position,
- freight history.

Important events include:

- STAGED,
- DAMAGE_PRESENTED_AT_PICKUP,
- PICKUP_DAMAGE_NOTED,
- LOADED.

Later operations must consume this snapshot rather than regenerating a perfect load.

---

## 9. Delivery reconciliation

Delivery compares the full expected manifest against actual trailer freight.

### Shortage

If an expected freight id is absent from the trailer:

- Delivery records a shortage discrepancy,
- shortage does not deadlock the receiver handoff,
- player may finish unloading the freight that actually arrived,
- handoff visibly warns **SHORT**,
- POD receives `shortagePieces`.

### Damaged freight

Receiver disposition is deterministic:

- GOOD → ACCEPTED,
- DAMAGED + MINOR → ACCEPTED_WITH_DAMAGE,
- DAMAGED + MAJOR → REFUSED.

No random receiver roll is used.

---

## 10. Refused freight

Major damaged freight that the receiver refuses:

- produces receiver result REFUSED,
- is added to the POD exception truth,
- returns to / remains on the trailer after handoff,
- receives freight-history events:
  - RECEIVER_REFUSED,
  - RELOADED_AFTER_REFUSAL.

The next physical operation inherits that refused cargo from the delivery trailer snapshot.

---

## 11. POD integration

V2.8.3 remains downstream owner of paperwork review.

V2.7.7 supplies genuine input:

- shortage → POD shortage,
- ACCEPTED_WITH_DAMAGE → POD damage,
- REFUSED → POD refusal,
- clean freight → clean POD.

Therefore focused POD review no longer depends on dev tools or manually injected receiver results.

---

## 12. Tests

### Pickup domain

- expected manifest remains full when facility short-tenders,
- facility staged freight omits missing unit,
- short tender is a discrepancy,
- short tender can commit if physical safety rules pass,
- wrong-load cargo is an operational discrepancy,
- wrong-load cargo persists into trailer snapshot,
- pickup damage appears in staged freight,
- documented damage removes undocumented-damage discrepancy,
- committed damage history retains pickup note.

### Delivery domain

- shortage no longer blocks receiver handoff,
- shortage count persists into operation,
- minor damage produces ACCEPTED_WITH_DAMAGE,
- major damage produces REFUSED,
- refused freight remains on trailer,
- receiver results preserve pickup damage documentation.

### Booking / manifest

- lane pickup reality persists into booked load,
- pickup reality reaches Driver Day pickup stop,
- Delivery expectation remains the full booked manifest.

### Shell/static

- Pickup shows discrepancy departure controls,
- damaged freight exposes NOTE DAMAGE,
- Delivery shows SHORT / DAMAGED receiver stats,
- top bar identifies Freight Integrity candidate.

---

## 13. Acceptance flow

### Clean baseline — FL-401

1. book FL-401,
2. complete Pickup normally,
3. no discrepancy confirmation,
4. deliver clean freight,
5. clean receiver results.

### Facility short tender — FL-403

1. book FL-403,
2. Pickup expects 5 but only 4 booked units are staged,
3. load all 4 available booked units,
4. verify FACILITY SHORT TENDER,
5. CLOSE WITH DISCREPANCY,
6. CONFIRM DEPARTURE,
7. Delivery expects 5 and sees 4 actual,
8. unload all actual cargo,
9. CONFIRM SHORT HANDOFF,
10. POD receives shortage = 1.

### Minor pickup damage — FL-402

1. book FL-402,
2. identify damaged unit,
3. NOTE DAMAGE,
4. load and depart,
5. Delivery receiver result is ACCEPTED_WITH_DAMAGE,
6. POD becomes exception review with damage noted.

### Major pickup damage — FL-404

1. book FL-404,
2. identify major damaged unit,
3. either note or fail to note it,
4. load and depart,
5. receiver REFUSES that unit,
6. refused cargo remains on trailer,
7. POD shows refusal/damage exception.

### Wrong-load mistake

1. load the staged mismatched pallet,
2. CLOSE WITH DISCREPANCY,
3. CONFIRM DEPARTURE,
4. verify mismatched freight persists onboard,
5. downstream intended load shortage is derived from actual cargo identity.

---

## 14. Verification

Before merge:

```bash
npm install --no-audit --no-fund
npm run lint
npm test
npm run build
```

Manual gameplay acceptance remains required after green automation.
