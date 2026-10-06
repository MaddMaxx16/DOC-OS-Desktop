import test from 'node:test'
import assert from 'node:assert/strict'
import {
  advanceDeliveryDocument,
  createDeliveryPodRecord,
  deliveryPodId,
} from '../src/domain/documents/deliveryPod.js'

const event = {
  id: 'M-101:delivery',
  loadId: 'M-101',
  loadRef: 'M-101',
  locationId: 'harborline-logistics',
  locationLabel: 'Harborline Logistics',
}

test('delivery POD is owned by the documents domain and waits for receiver verification', () => {
  const operation = {
    driverId: 'marcus-reed',
    loadId: 'M-101',
    loadRef: 'M-101',
    receiverVerificationCompleteMinutes: 730,
    receiverResults: [
      { freightId: 'a', status: 'ACCEPTED', condition: 'GOOD' },
      { freightId: 'b', status: 'ACCEPTED', condition: 'GOOD' },
    ],
    shortagePieces: 0,
  }

  const pod = createDeliveryPodRecord({
    driverId: 'marcus-reed',
    event,
    deliveryOperation: operation,
  })

  assert.equal(pod.id, deliveryPodId(event.id))
  assert.equal(pod.type, 'POD')
  assert.equal(pod.status, 'PENDING_RECEIVER')
  assert.equal(pod.deliveredPieces, 2)
  assert.equal(pod.signaturePresent, false)

  assert.equal(advanceDeliveryDocument(pod, 729), pod)

  const received = advanceDeliveryDocument(pod, 730)
  assert.equal(received.status, 'RECEIVED')
  assert.equal(received.signaturePresent, true)
})

test('POD becomes review-required when actual receiver results contain an exception', () => {
  const operation = {
    receiverVerificationCompleteMinutes: 730,
    receiverResults: [
      { freightId: 'a', status: 'ACCEPTED_WITH_DAMAGE', condition: 'DAMAGED' },
    ],
    shortagePieces: 0,
  }

  const pod = createDeliveryPodRecord({
    driverId: 'marcus-reed',
    event,
    deliveryOperation: operation,
  })
  const advanced = advanceDeliveryDocument(pod, 730)

  assert.equal(pod.damageNoted, true)
  assert.equal(advanced.status, 'REVIEW_REQUIRED')
  assert.equal(advanced.signaturePresent, true)
})
