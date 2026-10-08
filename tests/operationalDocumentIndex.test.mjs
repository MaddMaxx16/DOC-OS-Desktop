import test from 'node:test'
import assert from 'node:assert/strict'
import { BOOKING_STATUS } from '../src/domain/booking/bookingLifecycle.js'
import { DELIVERY_DOCUMENT_STATUS } from '../src/domain/documents/deliveryPod.js'
import {
  buildOperationalDocumentIndex,
  buildOperationalLoadFiles,
  buildOperationalIncomingDocuments,
  buildOperationalDeskDocuments,
  operationalDocumentAttentionCount,
  operationalIncomingDocumentCount,
  operationalLoadFileAttentionCount,
  OPERATIONAL_DOCUMENT_TYPE,
  OPERATIONAL_LOAD_FILE_STATUS,
} from '../src/domain/documents/operationalDocumentIndex.js'

const lane = {
  id: 'FL-403',
  laneRef: 'FL-403',
}

function rateCon(revision = 1, corrected = false) {
  return {
    id: `RC-FL-403-R${revision}`,
    laneId: 'FL-403',
    laneRef: 'FL-403',
    revision,
    corrected,
    issuedAtLabel: 'Sep 7, 2026 · 6:02 AM',
    broker: { name: 'FreightLink Brokerage' },
    terms: { rate: corrected ? 680 : 650, equipment: "53' Dry Van" },
  }
}

function pod(status) {
  return {
    id: 'POD:M-101:delivery',
    type: 'POD',
    driverId: 'marcus-reed',
    loadId: 'M-101',
    loadRef: 'M-101',
    facilityId: 'harborline',
    facilityLabel: 'Harborline Receiving',
    status,
    deliveredPieces: 4,
    refusedPieces: status === DELIVERY_DOCUMENT_STATUS.REVIEW_REQUIRED ? 1 : 0,
    shortagePieces: 0,
    damageNoted: false,
    signaturePresent: status !== DELIVERY_DOCUMENT_STATUS.PENDING_RECEIVER,
  }
}

test('booking without a Rate Con is not indexed as a document', () => {
  const documents = buildOperationalDocumentIndex({
    bookingRecords: {
      'FL-403': {
        laneId: 'FL-403',
        driverId: 'marcus-reed',
        status: BOOKING_STATUS.REQUESTED,
        rateConfirmation: null,
      },
    },
    lanes: [lane],
  })

  assert.deepEqual(documents, [])
})

test('Rate Con ready becomes an actionable document', () => {
  const documents = buildOperationalDocumentIndex({
    bookingRecords: {
      'FL-403': {
        laneId: 'FL-403',
        driverId: 'marcus-reed',
        status: BOOKING_STATUS.RATE_CON_READY,
        correctionCount: 0,
        rateConfirmation: rateCon(),
      },
    },
    lanes: [lane],
  })

  assert.equal(documents.length, 1)
  assert.equal(documents[0].type, OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION)
  assert.equal(documents[0].status, 'REVIEW_REQUIRED')
  assert.equal(documents[0].attention, true)
  assert.equal(operationalDocumentAttentionCount(documents), 1)
})

test('corrected Rate Con exposes corrected revision and remains actionable', () => {
  const documents = buildOperationalDocumentIndex({
    bookingRecords: {
      'FL-403': {
        laneId: 'FL-403',
        driverId: 'marcus-reed',
        status: BOOKING_STATUS.RATE_CON_READY,
        correctionCount: 1,
        rateConfirmation: rateCon(2, true),
      },
    },
    lanes: [lane],
  })

  assert.equal(documents[0].revision, 2)
  assert.equal(documents[0].corrected, true)
  assert.equal(documents[0].status, 'CORRECTED_RATE_CON_READY')
  assert.equal(documents[0].attention, true)
})

test('confirmed Rate Con remains indexed and does not count as attention', () => {
  const documents = buildOperationalDocumentIndex({
    bookingRecords: {
      'FL-403': {
        laneId: 'FL-403',
        driverId: 'marcus-reed',
        bookedLoadId: 'M-403',
        status: BOOKING_STATUS.CONFIRMED,
        correctionCount: 1,
        rateConfirmation: rateCon(2, true),
      },
    },
    lanes: [lane],
  })

  assert.equal(documents[0].status, 'ACCEPTED')
  assert.equal(documents[0].loadId, 'M-403')
  assert.equal(documents[0].attention, false)
  assert.equal(operationalDocumentAttentionCount(documents), 0)
})

test('POD pending receiver is indexed without attention', () => {
  const record = pod(DELIVERY_DOCUMENT_STATUS.PENDING_RECEIVER)
  const documents = buildOperationalDocumentIndex({
    documentRecords: { [record.id]: record },
  })

  assert.equal(documents[0].type, OPERATIONAL_DOCUMENT_TYPE.POD)
  assert.equal(documents[0].status, 'PENDING_RECEIVER')
  assert.equal(documents[0].attention, false)
})

test('POD received is indexed without attention', () => {
  const record = pod(DELIVERY_DOCUMENT_STATUS.RECEIVED)
  const documents = buildOperationalDocumentIndex({
    documentRecords: { [record.id]: record },
  })

  assert.equal(documents[0].status, 'RECEIVED')
  assert.equal(documents[0].signaturePresent, true)
  assert.equal(documents[0].attention, false)
})

test('POD review required contributes to attention count', () => {
  const record = pod(DELIVERY_DOCUMENT_STATUS.REVIEW_REQUIRED)
  const documents = buildOperationalDocumentIndex({
    documentRecords: { [record.id]: record },
  })

  assert.equal(documents[0].status, 'REVIEW_REQUIRED')
  assert.equal(documents[0].attention, true)
  assert.equal(operationalDocumentAttentionCount(documents), 1)
})

test('waiting and accepted documents do not count as attention', () => {
  const podRecord = pod(DELIVERY_DOCUMENT_STATUS.PENDING_RECEIVER)
  const documents = buildOperationalDocumentIndex({
    bookingRecords: {
      waiting: {
        laneId: 'FL-403',
        driverId: 'marcus-reed',
        status: BOOKING_STATUS.CORRECTION_REQUESTED,
        correctionCount: 0,
        rateConfirmation: rateCon(),
      },
      accepted: {
        laneId: 'FL-404',
        driverId: 'marcus-reed',
        status: BOOKING_STATUS.CONFIRMED,
        correctionCount: 0,
        rateConfirmation: {
          ...rateCon(),
          id: 'RC-FL-404-R1',
          laneId: 'FL-404',
          laneRef: 'FL-404',
        },
      },
    },
    documentRecords: { [podRecord.id]: podRecord },
    lanes: [lane, { id: 'FL-404', laneRef: 'FL-404' }],
  })

  assert.equal(operationalDocumentAttentionCount(documents), 0)
})


test('new operational paperwork enters Incoming before the working desk', () => {
  const podRecord = {
    ...pod(DELIVERY_DOCUMENT_STATUS.RECEIVED),
    id: 'POD:M-403:delivery',
    loadId: 'M-403',
    loadRef: 'FL-403',
  }
  const documents = buildOperationalDocumentIndex({
    bookingRecords: {
      'FL-403': {
        laneId: 'FL-403',
        driverId: 'marcus-reed',
        bookedLoadId: 'M-403',
        status: BOOKING_STATUS.CONFIRMED,
        correctionCount: 0,
        rateConfirmation: rateCon(),
      },
    },
    documentRecords: { [podRecord.id]: podRecord },
    lanes: [lane],
  })

  const loadFiles = buildOperationalLoadFiles(documents)
  assert.equal(loadFiles[0].incomingCount, 2)
  assert.equal(loadFiles[0].deskCount, 0)
  assert.equal(buildOperationalIncomingDocuments(loadFiles).length, 2)
  assert.equal(buildOperationalDeskDocuments(loadFiles).length, 0)
  assert.equal(operationalIncomingDocumentCount(loadFiles), 2)
})

test('pulling paperwork from Incoming moves it onto the working desk', () => {
  const documents = buildOperationalDocumentIndex({
    bookingRecords: {
      'FL-403': {
        laneId: 'FL-403',
        driverId: 'marcus-reed',
        status: BOOKING_STATUS.RATE_CON_READY,
        correctionCount: 0,
        rateConfirmation: rateCon(),
      },
    },
    lanes: [lane],
  })

  const loadFiles = buildOperationalLoadFiles(documents, {
    deskDocumentIds: { [documents[0].id]: true },
  })

  assert.equal(loadFiles[0].incomingCount, 0)
  assert.equal(loadFiles[0].deskCount, 1)
  assert.equal(buildOperationalIncomingDocuments(loadFiles).length, 0)
  assert.equal(buildOperationalDeskDocuments(loadFiles).length, 1)
})

test('pending receiver POD does not enter Incoming until receiver processing finishes', () => {
  const pending = pod(DELIVERY_DOCUMENT_STATUS.PENDING_RECEIVER)
  const pendingDocuments = buildOperationalDocumentIndex({
    documentRecords: { [pending.id]: pending },
  })
  const pendingFiles = buildOperationalLoadFiles(pendingDocuments)

  assert.equal(pendingFiles[0].incomingCount, 0)
  assert.equal(buildOperationalIncomingDocuments(pendingFiles).length, 0)

  const received = pod(DELIVERY_DOCUMENT_STATUS.RECEIVED)
  const receivedDocuments = buildOperationalDocumentIndex({
    documentRecords: { [received.id]: received },
  })
  const receivedFiles = buildOperationalLoadFiles(receivedDocuments)

  assert.equal(receivedFiles[0].incomingCount, 1)
  assert.equal(buildOperationalIncomingDocuments(receivedFiles).length, 1)
})

test('filing accepted paperwork advances packet completeness but does not submit automatically', () => {
  const podRecord = {
    ...pod(DELIVERY_DOCUMENT_STATUS.RECEIVED),
    id: 'POD:M-403:delivery',
    loadId: 'M-403',
    loadRef: 'FL-403',
  }
  const documents = buildOperationalDocumentIndex({
    bookingRecords: {
      'FL-403': {
        laneId: 'FL-403',
        driverId: 'marcus-reed',
        bookedLoadId: 'M-403',
        status: BOOKING_STATUS.CONFIRMED,
        correctionCount: 0,
        rateConfirmation: rateCon(),
      },
    },
    documentRecords: { [podRecord.id]: podRecord },
    lanes: [lane],
  })
  const fileAssignments = Object.fromEntries(documents.map((document) => [document.id, 'FL-403']))
  const [loadFile] = buildOperationalLoadFiles(documents, { fileAssignments })

  assert.equal(loadFile.filedCount, 2)
  assert.equal(loadFile.incomingCount, 0)
  assert.equal(loadFile.deskCount, 0)
  assert.equal(loadFile.satisfiedRequirementCount, 2)
  assert.equal(loadFile.canSubmit, true)
  assert.equal(loadFile.status, OPERATIONAL_LOAD_FILE_STATUS.SUBMIT_READY)
})

test('filed review-required paper does not satisfy packet requirement', () => {
  const documents = buildOperationalDocumentIndex({
    bookingRecords: {
      'FL-403': {
        laneId: 'FL-403',
        driverId: 'marcus-reed',
        status: BOOKING_STATUS.RATE_CON_READY,
        correctionCount: 0,
        rateConfirmation: rateCon(),
      },
    },
    lanes: [lane],
  })
  const [loadFile] = buildOperationalLoadFiles(documents, {
    fileAssignments: { [documents[0].id]: 'FL-403' },
  })

  assert.equal(loadFile.filedCount, 1)
  assert.equal(loadFile.requirements[0].filed, true)
  assert.equal(loadFile.requirements[0].satisfied, false)
  assert.equal(loadFile.canSubmit, false)
  assert.equal(loadFile.status, OPERATIONAL_LOAD_FILE_STATUS.NEEDS_ACTION)
})

test('Incoming actionable paperwork contributes to Documents attention', () => {
  const documents = buildOperationalDocumentIndex({
    bookingRecords: {
      'FL-403': {
        laneId: 'FL-403',
        driverId: 'marcus-reed',
        status: BOOKING_STATUS.RATE_CON_READY,
        correctionCount: 0,
        rateConfirmation: rateCon(),
      },
    },
    lanes: [lane],
  })

  const loadFiles = buildOperationalLoadFiles(documents)
  assert.equal(loadFiles[0].attentionCount, 1)
  assert.equal(operationalLoadFileAttentionCount(loadFiles), 1)
  assert.equal(operationalIncomingDocumentCount(loadFiles), 1)
})

test('submitted load file remains separate after completed paperwork is filed', () => {
  const podRecord = {
    ...pod(DELIVERY_DOCUMENT_STATUS.RECEIVED),
    id: 'POD:M-403:delivery',
    loadId: 'M-403',
    loadRef: 'FL-403',
  }
  const documents = buildOperationalDocumentIndex({
    bookingRecords: {
      'FL-403': {
        laneId: 'FL-403',
        driverId: 'marcus-reed',
        bookedLoadId: 'M-403',
        status: BOOKING_STATUS.CONFIRMED,
        correctionCount: 0,
        rateConfirmation: rateCon(),
      },
    },
    documentRecords: { [podRecord.id]: podRecord },
    lanes: [lane],
  })
  const fileAssignments = Object.fromEntries(documents.map((document) => [document.id, 'FL-403']))
  const [loadFile] = buildOperationalLoadFiles(documents, {
    fileAssignments,
    submittedLoadFiles: { 'FL-403': true },
  })

  assert.equal(loadFile.canSubmit, true)
  assert.equal(loadFile.submitted, true)
  assert.equal(loadFile.status, OPERATIONAL_LOAD_FILE_STATUS.SUBMITTED)
})

test('global desk combines only papers the player pulled from Incoming across loads', () => {
  const documents = buildOperationalDocumentIndex({
    bookingRecords: {
      'FL-403': {
        laneId: 'FL-403',
        driverId: 'marcus-reed',
        status: BOOKING_STATUS.CONFIRMED,
        correctionCount: 0,
        rateConfirmation: rateCon(),
      },
      'FL-404': {
        laneId: 'FL-404',
        driverId: 'marcus-reed',
        status: BOOKING_STATUS.CONFIRMED,
        correctionCount: 0,
        rateConfirmation: {
          ...rateCon(),
          id: 'RC-FL-404-R1',
          laneId: 'FL-404',
          laneRef: 'FL-404',
        },
      },
    },
    lanes: [lane, { id: 'FL-404', laneRef: 'FL-404' }],
  })
  const loadFiles = buildOperationalLoadFiles(documents, {
    deskDocumentIds: { 'RC-FL-404-R1': true },
    fileAssignments: { 'RC-FL-403-R1': 'FL-403' },
  })
  const incomingDocuments = buildOperationalIncomingDocuments(loadFiles)
  const deskDocuments = buildOperationalDeskDocuments(loadFiles)

  assert.equal(loadFiles.length, 2)
  assert.equal(incomingDocuments.length, 0)
  assert.equal(deskDocuments.length, 1)
  assert.equal(deskDocuments[0].loadRef, 'FL-404')
})
