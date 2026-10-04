import test from 'node:test'
import assert from 'node:assert/strict'
import { freightMarket } from '../src/data/freightMarket.js'
import { locations } from '../src/data/operationsSeed.js'
import {
  BOOKING_STATUS,
  confirmBookingRecord,
  createBookingRequest,
  receiveCorrectedRateConfirmation,
  receiveRateConfirmation,
  requestRateConfirmationCorrection,
} from '../src/domain/booking/bookingLifecycle.js'
import {
  buildRateConfirmation,
  getRateConfirmationMismatches,
} from '../src/domain/booking/rateConfirmation.js'

test('booking lifecycle keeps requested, document-ready, correction, and confirmed states distinct', () => {
  const lane = freightMarket.find((item) => item.id === 'FL-401')
  const request = createBookingRequest({
    laneId: lane.id,
    driverId: 'marcus-reed',
    evaluation: { label: 'TIGHT' },
  })
  assert.equal(request.status, BOOKING_STATUS.REQUESTED)

  const rateCon = buildRateConfirmation({ lane, locations })
  const ready = receiveRateConfirmation(request, rateCon)
  assert.equal(ready.status, BOOKING_STATUS.RATE_CON_READY)

  const correction = requestRateConfirmationCorrection(ready, 'Rate is wrong')
  assert.equal(correction.status, BOOKING_STATUS.CORRECTION_REQUESTED)

  const correctedDoc = buildRateConfirmation({
    lane,
    locations,
    revision: 2,
    corrected: true,
  })
  const corrected = receiveCorrectedRateConfirmation(correction, correctedDoc)
  assert.equal(corrected.status, BOOKING_STATUS.RATE_CON_READY)
  assert.equal(corrected.correctionCount, 1)

  const confirmed = confirmBookingRecord(corrected, { acceptedWithMismatch: true })
  assert.equal(confirmed.status, BOOKING_STATUS.CONFIRMED)
  assert.equal(confirmed.confirmedRateConfirmationId, correctedDoc.id)
  assert.equal(confirmed.acceptedWithMismatch, true)
})

test('FL-401 initial Rate Con matches marketplace terms', () => {
  const lane = freightMarket.find((item) => item.id === 'FL-401')
  const rateCon = buildRateConfirmation({ lane, locations })

  assert.deepEqual(getRateConfirmationMismatches(rateCon, lane), [])
})

test('FL-403 initial Rate Con exposes the deliberate rate mismatch', () => {
  const lane = freightMarket.find((item) => item.id === 'FL-403')
  const rateCon = buildRateConfirmation({ lane, locations })
  const mismatches = getRateConfirmationMismatches(rateCon, lane)

  assert.equal(rateCon.terms.rate, 650)
  assert.equal(mismatches.length, 1)
  assert.equal(mismatches[0].id, 'rate')
  assert.equal(mismatches[0].expected, 680)
})

test('FL-403 corrected Rate Con matches the marketplace terms', () => {
  const lane = freightMarket.find((item) => item.id === 'FL-403')
  const corrected = buildRateConfirmation({
    lane,
    locations,
    revision: 2,
    corrected: true,
  })

  assert.equal(corrected.terms.rate, 680)
  assert.deepEqual(getRateConfirmationMismatches(corrected, lane), [])
})
