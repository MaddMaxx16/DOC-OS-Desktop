function cloneWindow(window) {
  return Object.freeze({
    startMinutes: Number(window?.startMinutes ?? 0),
    endMinutes: Number(window?.endMinutes ?? 0),
  })
}

const INITIAL_OVERRIDES = Object.freeze({
  // Deliberate gameplay mismatch: the first FL-403 Rate Con is $30 short.
  'FL-403': Object.freeze({ rate: 650 }),
})

export function buildRateConfirmation({
  lane,
  locations = {},
  revision = 1,
  corrected = false,
} = {}) {
  if (!lane) return null

  const initialOverride = !corrected && revision === 1
    ? INITIAL_OVERRIDES[lane.id] ?? {}
    : {}

  return Object.freeze({
    id: `RC-${lane.id}-R${revision}`,
    laneId: lane.id,
    laneRef: lane.laneRef,
    confirmationNumber: `FLB-${lane.id.replace('FL-', '')}-0907`,
    issuedAtLabel: 'Sep 7, 2026 · 6:02 AM',
    paymentTerms: 'Net 30 from clean POD',
    trackingRequirement: 'Driver check-in required at arrival and release',
    accessorialTerms: 'Detention eligible after 2 hours with signed in/out times. Lumper requires receipt.',
    revision,
    corrected,
    broker: Object.freeze({
      name: 'FreightLink Brokerage',
      contact: 'Operations Desk',
      phone: '(212) 555-0148',
    }),
    carrier: Object.freeze({
      name: 'Metroline',
      operatingArea: 'New York Operations',
    }),
    terms: Object.freeze({
      rate: Number(initialOverride.rate ?? lane.rate),
      equipment: lane.equipment,
      pickupLocationId: lane.pickupLocationId,
      pickupLocationLabel: locations[lane.pickupLocationId]?.label ?? lane.pickupLocationId,
      pickupWindow: cloneWindow(lane.pickupWindow),
      deliveryLocationId: lane.deliveryLocationId,
      deliveryLocationLabel: locations[lane.deliveryLocationId]?.label ?? lane.deliveryLocationId,
      deliveryWindow: cloneWindow(lane.deliveryWindow),
      freight: Object.freeze({
        pallets: Number(lane.freight?.pallets ?? 0),
        weightLbs: Number(lane.freight?.weightLbs ?? 0),
      }),
    }),
    notes: 'Driver must check in with shipping/receiving. Detention requires documented arrival and release times.',
  })
}

function sameWindow(left, right) {
  return Number(left?.startMinutes) === Number(right?.startMinutes)
    && Number(left?.endMinutes) === Number(right?.endMinutes)
}

export function compareRateConfirmationToLane(rateConfirmation, lane) {
  if (!rateConfirmation || !lane) return []

  const terms = rateConfirmation.terms
  const checks = [
    {
      id: 'rate',
      label: 'Rate',
      matches: Number(terms.rate) === Number(lane.rate),
      expected: Number(lane.rate),
      actual: Number(terms.rate),
    },
    {
      id: 'equipment',
      label: 'Equipment',
      matches: terms.equipment === lane.equipment,
      expected: lane.equipment,
      actual: terms.equipment,
    },
    {
      id: 'pickup',
      label: 'Pickup Facility',
      matches: terms.pickupLocationId === lane.pickupLocationId,
      expected: lane.pickupLocationId,
      actual: terms.pickupLocationId,
    },
    {
      id: 'pickup-window',
      label: 'Pickup Window',
      matches: sameWindow(terms.pickupWindow, lane.pickupWindow),
      expected: lane.pickupWindow,
      actual: terms.pickupWindow,
    },
    {
      id: 'delivery',
      label: 'Delivery Facility',
      matches: terms.deliveryLocationId === lane.deliveryLocationId,
      expected: lane.deliveryLocationId,
      actual: terms.deliveryLocationId,
    },
    {
      id: 'delivery-window',
      label: 'Delivery Window',
      matches: sameWindow(terms.deliveryWindow, lane.deliveryWindow),
      expected: lane.deliveryWindow,
      actual: terms.deliveryWindow,
    },
  ]

  return checks
}

export function getRateConfirmationMismatches(rateConfirmation, lane) {
  return compareRateConfirmationToLane(rateConfirmation, lane)
    .filter((check) => !check.matches)
}
