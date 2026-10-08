import test from 'node:test'
import assert from 'node:assert/strict'
import {
  acceptDeliveryPod,
  advanceDeliveryDocument,
  correctedDeliveryPodId,
  createCorrectedDeliveryPodRecord,
  createDeliveryPodRecord,
  DELIVERY_DOCUMENT_STATUS,
  deliveryPodHasException,
  deliveryPodId,
  requestDeliveryPodCorrection,
  supersedeDeliveryPod,
} from '../src/domain/documents/deliveryPod.js'

const event = {
  id: 'M-101:delivery',
  loadId: 'M-101',
  loadRef: 'M-101',
  locationId: 'harborline-logistics',
  locationLabel: 'Harborline Logistics',
}

function operation({
  receiverResults = [
    { freightId: 'a', status: 'ACCEPTED', condition: 'GOOD' },
    { freightId: 'b', status: 'ACCEPTED', condition: 'GOOD' },
  ],
  shortagePieces = 0,
} = {}) {
  return {
    driverId: 'marcus-reed',
    loadId: 'M-101',
    loadRef: 'M-101',
    receiverVerificationCompleteMinutes: 730,
    receiverResults,
    shortagePieces,
  }
}

test('delivery POD waits for receiver verification and clean copy becomes received', () => {
  const pod = createDeliveryPodRecord({
    driverId: 'marcus-reed',
    event,
    deliveryOperation: operation(),
  })

  assert.equal(pod.id, deliveryPodId(event.id))
  assert.equal(pod.type, 'POD')
  assert.equal(pod.status, DELIVERY_DOCUMENT_STATUS.PENDING_RECEIVER)
  assert.equal(pod.revision, 1)
  assert.equal(pod.corrected, false)
  assert.equal(pod.deliveredPieces, 2)
  assert.equal(pod.signaturePresent, false)

  assert.equal(advanceDeliveryDocument(pod, 729), pod)

  const received = advanceDeliveryDocument(pod, 730)
  assert.equal(received.status, DELIVERY_DOCUMENT_STATUS.RECEIVED)
  assert.equal(received.signaturePresent, true)
  assert.equal(deliveryPodHasException(received), false)
})

test('receiver exception creates review-required POD', () => {
  const pod = createDeliveryPodRecord({
    driverId: 'marcus-reed',
    event,
    deliveryOperation: operation({
      receiverResults: [
        { freightId: 'a', status: 'ACCEPTED_WITH_DAMAGE', condition: 'DAMAGED' },
        { freightId: 'b', status: 'REFUSED', condition: 'GOOD' },
      ],
      shortagePieces: 1,
    }),
  })
  const advanced = advanceDeliveryDocument(pod, 730)

  assert.equal(advanced.status, DELIVERY_DOCUMENT_STATUS.REVIEW_REQUIRED)
  assert.equal(advanced.signaturePresent, true)
  assert.equal(advanced.refusedPieces, 1)
  assert.equal(advanced.shortagePieces, 1)
  assert.equal(advanced.damageNoted, true)
  assert.equal(deliveryPodHasException(advanced), true)
})

test('clean POD can be accepted after review', () => {
  const received = advanceDeliveryDocument(
    createDeliveryPodRecord({
      driverId: 'marcus-reed',
      event,
      deliveryOperation: operation(),
    }),
    730,
  )

  const accepted = acceptDeliveryPod(received)
  assert.equal(accepted.status, DELIVERY_DOCUMENT_STATUS.ACCEPTED)
  assert.equal(accepted.acceptedWithException, false)
})

test('exception POD requires explicit accept-with-exception acknowledgement', () => {
  const reviewRequired = advanceDeliveryDocument(
    createDeliveryPodRecord({
      driverId: 'marcus-reed',
      event,
      deliveryOperation: operation({
        receiverResults: [
          { freightId: 'a', status: 'ACCEPTED_WITH_DAMAGE', condition: 'DAMAGED' },
        ],
      }),
    }),
    730,
  )

  assert.throws(() => acceptDeliveryPod(reviewRequired), /must be acknowledged/)

  const accepted = acceptDeliveryPod(reviewRequired, { acceptedWithException: true })
  assert.equal(accepted.status, DELIVERY_DOCUMENT_STATUS.ACCEPTED)
  assert.equal(accepted.acceptedWithException, true)
  assert.equal(accepted.damageNoted, true)
})

test('exception POD can request correction and return as a new revision', () => {
  const reviewRequired = advanceDeliveryDocument(
    createDeliveryPodRecord({
      driverId: 'marcus-reed',
      event,
      deliveryOperation: operation({
        receiverResults: [
          { freightId: 'a', status: 'REFUSED', condition: 'GOOD' },
        ],
      }),
    }),
    730,
  )

  const requested = requestDeliveryPodCorrection(
    reviewRequired,
    'Please clarify the refused freight on the receiver copy.',
  )
  assert.equal(requested.status, DELIVERY_DOCUMENT_STATUS.CORRECTION_REQUESTED)
  assert.match(requested.correctionReason, /refused freight/)

  const corrected = createCorrectedDeliveryPodRecord(requested)
  assert.equal(corrected.id, correctedDeliveryPodId(event.id, 2))
  assert.equal(corrected.revision, 2)
  assert.equal(corrected.corrected, true)
  assert.equal(corrected.status, DELIVERY_DOCUMENT_STATUS.CORRECTED_RECEIVED)
  assert.equal(corrected.supersedesId, requested.id)
  assert.equal(corrected.refusedPieces, 1)

  const superseded = supersedeDeliveryPod(requested)
  assert.equal(superseded.status, DELIVERY_DOCUMENT_STATUS.SUPERSEDED)
})

test('correction request is limited to exception review states', () => {
  const received = advanceDeliveryDocument(
    createDeliveryPodRecord({
      driverId: 'marcus-reed',
      event,
      deliveryOperation: operation(),
    }),
    730,
  )

  assert.throws(
    () => requestDeliveryPodCorrection(received, 'Change it.'),
    /only be requested while reviewing exception paperwork/,
  )
})
