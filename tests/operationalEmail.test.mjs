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

test('Rate Con appears as an unread email with printable attachment', () => {
  const messages = buildOperationalEmailInbox({ documents: [rateCon] })

  assert.equal(messages.length, 1)
  assert.equal(messages[0].id, emailIdForDocument(rateCon.id))
  assert.equal(messages[0].subject, 'Rate Confirmation · FL-402')
  assert.equal(messages[0].recipientName, 'Metroline Operations')
  assert.equal(messages[0].recipientAddress, 'dispatch@metroline.example')
  assert.equal(messages[0].attachmentFileName, 'FL-402_Rate_Confirmation.pdf')
  assert.equal(messages[0].closingName, 'FreightLink Operations Desk')
  assert.equal(messages[0].unread, true)
  assert.equal(messages[0].printed, false)
  assert.equal(operationalEmailUnreadCount(messages), 1)
})

test('corrected Rate Con email is clearly labeled corrected', () => {
  const messages = buildOperationalEmailInbox({
    documents: [{
      ...rateCon,
      id: 'RC-FL-402-R2',
      corrected: true,
      status: 'CORRECTED_RATE_CON_READY',
      statusLabel: 'CORRECTED · REVIEW REQUIRED',
    }],
  })

  assert.match(messages[0].subject, /Corrected Rate Confirmation/)
  assert.match(messages[0].attachmentFileName, /_R1\.pdf$/)
  assert.match(messages[0].body, /corrected Rate Confirmation/)
})

test('pending receiver POD does not email before the receiver finishes', () => {
  const messages = buildOperationalEmailInbox({
    documents: [{ ...pod, status: 'PENDING_RECEIVER', statusLabel: 'PENDING RECEIVER' }],
  })

  assert.deepEqual(messages, [])
})

test('received POD appears in Email and printing state follows attachment state', () => {
  const id = emailIdForDocument(pod.id)
  const messages = buildOperationalEmailInbox({
    documents: [pod],
    readEmailIds: { [id]: true },
    printedDocumentIds: { [pod.id]: true },
  })

  assert.equal(messages[0].subject, 'Proof of Delivery · T-110')
  assert.equal(messages[0].attachmentFileName, 'T-110_Proof_of_Delivery.pdf')
  assert.equal(messages[0].recipientName, 'Metroline Operations')
  assert.equal(messages[0].unread, false)
  assert.equal(messages[0].printed, true)
  assert.equal(operationalEmailUnreadCount(messages), 0)
})
