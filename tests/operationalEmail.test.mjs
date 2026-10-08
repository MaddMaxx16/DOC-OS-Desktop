import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildOperationalEmailInbox,
  emailIdForDocument,
  operationalEmailUnreadCount,
} from '../src/domain/communications/operationalEmail.js'
import { OPERATIONAL_DOCUMENT_TYPE } from '../src/domain/documents/operationalDocumentIndex.js'

const rateCon = {
  id: 'RC-FL-402-R1',
  type: OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION,
  loadRef: 'FL-402',
  brokerName: 'FreightLink Brokerage',
  corrected: false,
  status: 'REVIEW_REQUIRED',
  statusLabel: 'REVIEW REQUIRED',
  issuedAtLabel: 'Sep 7, 2026 · 6:02 AM',
}

const pod = {
  id: 'POD:T-110:delivery',
  type: OPERATIONAL_DOCUMENT_TYPE.POD,
  loadRef: 'T-110',
  facilityLabel: 'Jersey City Crossdock',
  status: 'RECEIVED',
  statusLabel: 'RECEIVED',
}

test('routine initial Rate Con does not generate Email', () => {
  const messages = buildOperationalEmailInbox({ documents: [rateCon] })
  assert.deepEqual(messages, [])
})

test('corrected Rate Con generates communication that points back to Documents', () => {
  const corrected = {
    ...rateCon,
    id: 'RC-FL-402-R2',
    corrected: true,
    status: 'CORRECTED_RATE_CON_READY',
    statusLabel: 'CORRECTED · REVIEW REQUIRED',
  }
  const messages = buildOperationalEmailInbox({ documents: [corrected] })

  assert.equal(messages.length, 1)
  assert.equal(messages[0].id, emailIdForDocument(corrected.id))
  assert.equal(messages[0].subject, 'Corrected Rate Confirmation · FL-402')
  assert.equal(messages[0].relatedDocumentId, corrected.id)
  assert.equal(messages[0].recipientName, 'Metroline Operations')
  assert.match(messages[0].body, /Documents Incoming/)
  assert.equal(messages[0].unread, true)
  assert.equal(operationalEmailUnreadCount(messages), 1)
})

test('routine received POD does not generate Email', () => {
  const messages = buildOperationalEmailInbox({ documents: [pod] })
  assert.deepEqual(messages, [])
})

test('POD exception generates Email communication', () => {
  const exceptionPod = {
    ...pod,
    status: 'REVIEW_REQUIRED',
    statusLabel: 'REVIEW REQUIRED',
  }
  const id = emailIdForDocument(exceptionPod.id)
  const messages = buildOperationalEmailInbox({
    documents: [exceptionPod],
    readEmailIds: { [id]: true },
  })

  assert.equal(messages.length, 1)
  assert.equal(messages[0].subject, 'Delivery paperwork exception · T-110')
  assert.equal(messages[0].relatedDocumentId, exceptionPod.id)
  assert.match(messages[0].body, /Documents Incoming/)
  assert.equal(messages[0].unread, false)
  assert.equal(operationalEmailUnreadCount(messages), 0)
})

test('pending receiver POD does not generate Email', () => {
  const messages = buildOperationalEmailInbox({
    documents: [{ ...pod, status: 'PENDING_RECEIVER', statusLabel: 'PENDING RECEIVER' }],
  })

  assert.deepEqual(messages, [])
})
