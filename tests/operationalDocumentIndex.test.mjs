import test from 'node:test'
import assert from 'node:assert/strict'
import { BOOKING_STATUS } from '../src/domain/booking/bookingLifecycle.js'
import { DELIVERY_DOCUMENT_STATUS } from '../src/domain/documents/deliveryPod.js'
import {
  buildOperationalDocumentIndex,
  buildOperationalLoadFiles,
  buildOperationalDeskDocuments,
  operationalDocumentAttentionCount,
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


test('digital documents do not enter the physical desk until printed', () => {
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

  const [digitalFile] = buildOperationalLoadFiles(documents)
  assert.equal(digitalFile.documentCount, 2)
  assert.equal(digitalFile.printedCount, 0)
  assert.equal(digitalFile.deskCount, 0)
  assert.equal(buildOperationalDeskDocuments([digitalFile]).length, 0)

  const printedDocumentIds = Object.fromEntries(documents.map((document) => [document.id, true]))
  const [printedFile] = buildOperationalLoadFiles(documents, { printedDocumentIds })
  assert.equal(printedFile.printedCount, 2)
  assert.equal(printedFile.deskCount, 2)
  assert.equal(buildOperationalDeskDocuments([printedFile]).length, 2)
})

test('filing printed accepted paperwork advances packet completeness but does not submit automatically', () => {
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
  const printedDocumentIds = Object.fromEntries(documents.map((document) => [document.id, true]))
  const fileAssignments = Object.fromEntries(documents.map((document) => [document.id, 'FL-403']))
  const [loadFile] = buildOperationalLoadFiles(documents, {
    fileAssignments,
    printedDocumentIds,
  })

  assert.equal(loadFile.filedCount, 2)
  assert.equal(loadFile.deskCount, 0)
  assert.equal(loadFile.satisfiedRequirementCount, 2)
  assert.equal(loadFile.canSubmit, true)
  assert.equal(loadFile.status, OPERATIONAL_LOAD_FILE_STATUS.SUBMIT_READY)
})

test('printed filed paper can exist without satisfying packet requirement', () => {
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
    printedDocumentIds: { [documents[0].id]: true },
    fileAssignments: { [documents[0].id]: 'FL-403' },
  })

  assert.equal(loadFile.filedCount, 1)
  assert.equal(loadFile.requirements[0].filed, true)
  assert.equal(loadFile.requirements[0].satisfied, false)
  assert.equal(loadFile.canSubmit, false)
  assert.equal(loadFile.status, OPERATIONAL_LOAD_FILE_STATUS.NEEDS_ACTION)
})

test('unprinted actionable email does not create Documents attention', () => {
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

  const [digitalFile] = buildOperationalLoadFiles(documents)
  assert.equal(digitalFile.attentionCount, 0)
  assert.equal(operationalLoadFileAttentionCount([digitalFile]), 0)

  const [printedFile] = buildOperationalLoadFiles(documents, {
    printedDocumentIds: { [documents[0].id]: true },
  })
  assert.equal(printedFile.attentionCount, 1)
  assert.equal(operationalLoadFileAttentionCount([printedFile]), 1)
})

test('submitted load file is a separate state after printed paperwork is filed', () => {
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
  const printedDocumentIds = Object.fromEntries(documents.map((document) => [document.id, true]))
  const fileAssignments = Object.fromEntries(documents.map((document) => [document.id, 'FL-403']))
  const [loadFile] = buildOperationalLoadFiles(documents, {
    fileAssignments,
    printedDocumentIds,
    submittedLoadFiles: { 'FL-403': true },
  })

  assert.equal(loadFile.canSubmit, true)
  assert.equal(loadFile.submitted, true)
  assert.equal(loadFile.status, OPERATIONAL_LOAD_FILE_STATUS.SUBMITTED)
})

test('global desk combines printed unfiled papers across load files instead of following selection', () => {
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
  const printedDocumentIds = Object.fromEntries(documents.map((document) => [document.id, true]))
  const loadFiles = buildOperationalLoadFiles(documents, {
    printedDocumentIds,
    fileAssignments: { 'RC-FL-403-R1': 'FL-403' },
  })
  const deskDocuments = buildOperationalDeskDocuments(loadFiles)

  assert.equal(loadFiles.length, 2)
  assert.equal(deskDocuments.length, 1)
  assert.equal(deskDocuments[0].loadRef, 'FL-404')
})
