export const BOOKING_STATUS = Object.freeze({
  AVAILABLE: 'available',
  REQUESTED: 'requested',
  RATE_CON_READY: 'rate-con-ready',
  CORRECTION_REQUESTED: 'correction-requested',
  CONFIRMED: 'confirmed',
})

export function createBookingRequest({ laneId, driverId, evaluation } = {}) {
  if (!laneId || !driverId) return null
  return {
    laneId,
    driverId,
    status: BOOKING_STATUS.REQUESTED,
    evaluationSnapshot: evaluation ?? null,
    rateConfirmation: null,
    correctionCount: 0,
  }
}

export function receiveRateConfirmation(record, rateConfirmation) {
  if (!record || !rateConfirmation) return record
  return {
    ...record,
    status: BOOKING_STATUS.RATE_CON_READY,
    rateConfirmation,
  }
}

export function requestRateConfirmationCorrection(record, reason = '') {
  if (!record?.rateConfirmation) return record
  return {
    ...record,
    status: BOOKING_STATUS.CORRECTION_REQUESTED,
    correctionReason: reason || 'Rate Confirmation terms do not match the booked lane.',
  }
}

export function receiveCorrectedRateConfirmation(record, rateConfirmation) {
  if (!record || !rateConfirmation) return record
  return {
    ...record,
    status: BOOKING_STATUS.RATE_CON_READY,
    rateConfirmation,
    correctionCount: Number(record.correctionCount ?? 0) + 1,
    correctionReason: null,
  }
}

export function confirmBookingRecord(record, { acceptedWithMismatch = false } = {}) {
  if (!record?.rateConfirmation) return record
  return {
    ...record,
    status: BOOKING_STATUS.CONFIRMED,
    confirmedRateConfirmationId: record.rateConfirmation.id,
    acceptedWithMismatch: Boolean(acceptedWithMismatch),
  }
}

export function bookingStatusLabel(record) {
  switch (record?.status) {
    case BOOKING_STATUS.REQUESTED:
      return 'RATE CON REQUESTED'
    case BOOKING_STATUS.RATE_CON_READY:
      return record?.correctionCount ? 'CORRECTED RATE CON READY' : 'RATE CON READY'
    case BOOKING_STATUS.CORRECTION_REQUESTED:
      return 'CORRECTION REQUESTED'
    case BOOKING_STATUS.CONFIRMED:
      return 'CONFIRMED'
    default:
      return 'AVAILABLE'
  }
}
