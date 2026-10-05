export const PICKUP_OPERATION_STATUS = Object.freeze({
  DOCK_ASSIGNED: 'dock-assigned',
  LOAD_PLANNING: 'load-planning',
  PLAN_COMMITTED: 'plan-committed',
  LOADING: 'loading',
  LOADED: 'loaded',
})

export function facilityOperationKey(driverId, eventId) {
  return `${driverId}:${eventId}`
}

export function dockNumberForPickup(event = {}) {
  const source = String(event.loadRef ?? event.loadId ?? event.id ?? 'dock')
  let hash = 0

  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash * 31) + source.charCodeAt(index)) >>> 0
  }

  return 8 + (hash % 9)
}

export function facilityOperationForEvent(
  facilityOperations = {},
  driverId,
  eventId,
) {
  return facilityOperations[facilityOperationKey(driverId, eventId)] ?? null
}

export function pickupPlanCommitted(operation = null) {
  return [
    PICKUP_OPERATION_STATUS.PLAN_COMMITTED,
    PICKUP_OPERATION_STATUS.LOADING,
    PICKUP_OPERATION_STATUS.LOADED,
  ].includes(operation?.status)
}

function palletWeight(totalWeightLbs, palletCount) {
  if (!palletCount) return 0
  return Math.max(1, Math.round(Number(totalWeightLbs ?? 0) / palletCount))
}

function destinationLabel(event = {}) {
  return event.deliveryLocationLabel
    ?? event.destinationLabel
    ?? event.locationLabel
    ?? 'Booked destination'
}

export function buildTutorialStagedFreight(event = {}) {
  const palletCount = Math.max(1, Number(event.freight?.pallets ?? 1))
  const weightEach = palletWeight(event.freight?.weightLbs, palletCount)
  const loadRef = event.loadRef ?? event.loadId ?? 'LOAD'
  const destination = destinationLabel(event)

  const expected = Array.from({ length: palletCount }, (_, index) => ({
    id: `${event.id}:pallet-${index + 1}`,
    label: `Pallet ${index + 1}`,
    loadRef,
    pickupNumber: loadRef,
    destination,
    commodity: 'Booked freight',
    weightLbs: weightEach,
    stackable: true,
    maxStack: 2,
    expected: true,
  }))

  const noise = {
    id: `${event.id}:noise-1`,
    label: 'Pallet X',
    loadRef: `${loadRef}-ALT`,
    pickupNumber: `${loadRef}-ALT`,
    destination: 'Albany, NY',
    commodity: 'Unrelated staged freight',
    weightLbs: Math.max(450, Math.round(weightEach * 0.9)),
    stackable: true,
    maxStack: 2,
    expected: false,
  }

  return [...expected, noise]
}

export function evaluatePickupLoadPlan({
  event,
  stagedFreight = [],
  verifiedIds = [],
  placements = {},
} = {}) {
  const verified = new Set(verifiedIds)
  const placedIds = Object.values(placements).filter(Boolean)
  const placed = new Set(placedIds)
  const expectedFreight = stagedFreight.filter((item) => item.expected)
  const expectedIds = new Set(expectedFreight.map((item) => item.id))
  const wrongPlaced = stagedFreight.filter((item) => (
    !item.expected && placed.has(item.id)
  ))
  const missingVerified = expectedFreight.filter((item) => !verified.has(item.id))
  const missingPlaced = expectedFreight.filter((item) => !placed.has(item.id))

  const errors = []
  const warnings = []

  if (missingVerified.length > 0) {
    errors.push({
      code: 'REQUIRED_FREIGHT_UNRESOLVED',
      message: `${missingVerified.length} expected pallet${missingVerified.length === 1 ? '' : 's'} not verified.`,
    })
  }

  if (missingPlaced.length > 0) {
    errors.push({
      code: 'REQUIRED_FREIGHT_NOT_PLANNED',
      message: `${missingPlaced.length} expected pallet${missingPlaced.length === 1 ? '' : 's'} not placed.`,
    })
  }

  if (wrongPlaced.length > 0) {
    errors.push({
      code: 'WRONG_LOAD',
      message: `${wrongPlaced.length} unrelated pallet${wrongPlaced.length === 1 ? '' : 's'} included in trailer plan.`,
    })
  }

  const duplicatePlacements = placedIds.length - placed.size
  if (duplicatePlacements > 0) {
    errors.push({
      code: 'DUPLICATE_PLACEMENT',
      message: 'The same freight unit is planned in more than one position.',
    })
  }

  const unverifiedPlaced = stagedFreight.filter((item) => (
    placed.has(item.id) && !verified.has(item.id)
  ))
  if (unverifiedPlaced.length > 0) {
    warnings.push({
      code: 'UNVERIFIED_PLACEMENT',
      message: `${unverifiedPlaced.length} placed unit${unverifiedPlaced.length === 1 ? '' : 's'} still unverified.`,
    })
  }

  const plannedWeightLbs = stagedFreight
    .filter((item) => placed.has(item.id))
    .reduce((sum, item) => sum + Number(item.weightLbs ?? 0), 0)

  if (plannedWeightLbs > 44000) {
    errors.push({
      code: 'TRAILER_OVERWEIGHT',
      message: `Planned trailer weight is ${Math.round(plannedWeightLbs - 44000).toLocaleString()} lb over the 44,000 lb freight limit.`,
    })
  }

  return {
    ready: errors.length === 0,
    errors,
    warnings,
    expectedCount: expectedIds.size,
    verifiedExpectedCount: expectedFreight.filter((item) => verified.has(item.id)).length,
    plannedExpectedCount: expectedFreight.filter((item) => placed.has(item.id)).length,
    plannedCount: placed.size,
    plannedWeightLbs,
    loadRef: event?.loadRef ?? event?.loadId ?? null,
  }
}

export function commitPickupOperation({
  driverId,
  event,
  loadPlan,
  currentAbsoluteMinutes,
} = {}) {
  if (!driverId || !event?.id) {
    throw new Error('Pickup operation requires a driver and freight event.')
  }

  return {
    key: facilityOperationKey(driverId, event.id),
    driverId,
    eventId: event.id,
    loadId: event.loadId ?? null,
    loadRef: event.loadRef ?? event.loadId ?? null,
    facilityId: event.locationId ?? null,
    dock: dockNumberForPickup(event),
    status: PICKUP_OPERATION_STATUS.PLAN_COMMITTED,
    planCommittedTime: Number(currentAbsoluteMinutes ?? 0),
    loadingStartMinutes: Number(currentAbsoluteMinutes ?? 0),
    loadingDurationMinutes: Math.max(1, Number(event.serviceMinutes ?? 12)),
    loadPlan,
  }
}
