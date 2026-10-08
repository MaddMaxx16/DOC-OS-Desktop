export const DELIVERY_DOCUMENT_STATUS = Object.freeze({
  PENDING_RECEIVER: 'PENDING_RECEIVER',
  RECEIVED: 'RECEIVED',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
  CORRECTION_REQUESTED: 'CORRECTION_REQUESTED',
  CORRECTED_RECEIVED: 'CORRECTED_RECEIVED',
  ACCEPTED: 'ACCEPTED',
  SUPERSEDED: 'SUPERSEDED',
})

export function deliveryPodId(eventId) {
  return `POD:${eventId}`
}

export function correctedDeliveryPodId(eventId, revision) {
  return `${deliveryPodId(eventId)}:R${revision}`
}

export function deliveryPodHasException(record = {}) {
  return (
    Number(record.refusedPieces ?? 0) > 0
    || Number(record.shortagePieces ?? 0) > 0
    || Boolean(record.damageNoted)
  )
}

export function createDeliveryPodRecord({
  driverId,
  event,
  deliveryOperation,
} = {}) {
  if (!event?.id || !deliveryOperation) {
    throw new Error('Delivery POD requires a delivery event and committed operation.')
  }

  const receiverResults = deliveryOperation.receiverResults ?? []
  const refusedPieces = receiverResults
    .filter((result) => result.status === 'REFUSED')
    .length
  const damageNoted = receiverResults
    .some((result) => result.status === 'ACCEPTED_WITH_DAMAGE')
  const shortagePieces = Number(deliveryOperation.shortagePieces ?? 0)

  return {
    id: deliveryPodId(event.id),
    type: 'POD',
    driverId: driverId ?? deliveryOperation.driverId ?? null,
    loadId: event.loadId ?? deliveryOperation.loadId ?? null,
    loadRef: event.loadRef ?? deliveryOperation.loadRef ?? event.loadId ?? null,
    eventId: event.id,
    facilityId: event.locationId ?? null,
    facilityLabel: event.locationLabel ?? 'Receiver',
    status: DELIVERY_DOCUMENT_STATUS.PENDING_RECEIVER,
    availableAtMinutes: deliveryOperation.receiverVerificationCompleteMinutes,
    deliveredPieces: receiverResults
      .filter((result) => ['ACCEPTED', 'ACCEPTED_WITH_DAMAGE'].includes(result.status))
      .length,
    refusedPieces,
    shortagePieces,
    damageNoted,
    signaturePresent: false,
    receiverResults: receiverResults.map((result) => ({ ...result })),
    revision: 1,
    corrected: false,
    correctionCount: 0,
    correctionReason: null,
    acceptedWithException: false,
    supersedesId: null,
  }
}

export function advanceDeliveryDocument(record = {}, currentAbsoluteMinutes = 0) {
  if (record.type !== 'POD') return record
  if (record.status !== DELIVERY_DOCUMENT_STATUS.PENDING_RECEIVER) return record
  if (Number(currentAbsoluteMinutes) < Number(record.availableAtMinutes ?? Infinity)) {
    return record
  }

  return {
    ...record,
    status: deliveryPodHasException(record)
      ? DELIVERY_DOCUMENT_STATUS.REVIEW_REQUIRED
      : DELIVERY_DOCUMENT_STATUS.RECEIVED,
    signaturePresent: true,
  }
}

export function advanceDeliveryDocuments(records = {}, currentAbsoluteMinutes = 0) {
  let changed = false
  const next = {}

  for (const [id, record] of Object.entries(records)) {
    const advanced = advanceDeliveryDocument(record, currentAbsoluteMinutes)
    next[id] = advanced
    if (advanced !== record) changed = true
  }

  return changed ? next : records
}

export function requestDeliveryPodCorrection(record = {}, reason = '') {
  if (record.type !== 'POD') {
    throw new Error('Only POD records can request a POD correction.')
  }

  if (![
    DELIVERY_DOCUMENT_STATUS.REVIEW_REQUIRED,
    DELIVERY_DOCUMENT_STATUS.CORRECTED_RECEIVED,
  ].includes(record.status)) {
    throw new Error('POD correction can only be requested while reviewing exception paperwork.')
  }

  return {
    ...record,
    status: DELIVERY_DOCUMENT_STATUS.CORRECTION_REQUESTED,
    correctionReason: String(reason || 'Receiver paperwork correction requested.'),
  }
}

export function createCorrectedDeliveryPodRecord(record = {}) {
  if (record.type !== 'POD') {
    throw new Error('Corrected POD requires an existing POD record.')
  }
  if (record.status !== DELIVERY_DOCUMENT_STATUS.CORRECTION_REQUESTED) {
    throw new Error('Corrected POD can only be created after a correction request.')
  }

  const revision = Number(record.revision ?? 1) + 1
  return {
    ...record,
    id: correctedDeliveryPodId(record.eventId, revision),
    status: DELIVERY_DOCUMENT_STATUS.CORRECTED_RECEIVED,
    revision,
    corrected: true,
    correctionCount: Number(record.correctionCount ?? 0) + 1,
    signaturePresent: true,
    acceptedWithException: false,
    supersedesId: record.id,
  }
}

export function supersedeDeliveryPod(record = {}) {
  if (record.type !== 'POD') return record
  return {
    ...record,
    status: DELIVERY_DOCUMENT_STATUS.SUPERSEDED,
  }
}

export function acceptDeliveryPod(record = {}, { acceptedWithException = false } = {}) {
  if (record.type !== 'POD') {
    throw new Error('Only POD records can be accepted.')
  }

  if (![
    DELIVERY_DOCUMENT_STATUS.RECEIVED,
    DELIVERY_DOCUMENT_STATUS.REVIEW_REQUIRED,
    DELIVERY_DOCUMENT_STATUS.CORRECTED_RECEIVED,
  ].includes(record.status)) {
    throw new Error('POD is not ready for acceptance.')
  }

  const hasException = deliveryPodHasException(record)
  if (hasException && !acceptedWithException) {
    throw new Error('POD contains a delivery exception that must be acknowledged.')
  }

  return {
    ...record,
    status: DELIVERY_DOCUMENT_STATUS.ACCEPTED,
    acceptedWithException: Boolean(hasException && acceptedWithException),
  }
}
