export const DELIVERY_DOCUMENT_STATUS = Object.freeze({
  PENDING_RECEIVER: 'PENDING_RECEIVER',
  RECEIVED: 'RECEIVED',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
})

export function deliveryPodId(eventId) {
  return `POD:${eventId}`
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
  }
}

export function advanceDeliveryDocument(record = {}, currentAbsoluteMinutes = 0) {
  if (record.type !== 'POD') return record
  if (record.status !== DELIVERY_DOCUMENT_STATUS.PENDING_RECEIVER) return record
  if (Number(currentAbsoluteMinutes) < Number(record.availableAtMinutes ?? Infinity)) {
    return record
  }

  const reviewRequired = (
    Number(record.refusedPieces ?? 0) > 0
    || Number(record.shortagePieces ?? 0) > 0
    || Boolean(record.damageNoted)
  )

  return {
    ...record,
    status: reviewRequired
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
