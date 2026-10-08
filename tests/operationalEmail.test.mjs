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
  revision: 1,
  status: 'REVIEW_REQUIRED',
  statusLabel: 'REVIEW REQUIRED',
  issuedAtLabel: 'Sep 7, 2026 · 6:02 AM',
}

const pod = {
  id: 'POD:T-110:delivery',
  type: OPERATIONAL_DOCUMENT_TYPE.POD,
  loadRef: 'T-110',
  facilityLabel: 'Jersey City Crossdock',
  status: 'POD_REVIEW_REQUIRED',
  statusLabel: 'REVIEW POD',
  hasException: false,
  corrected: false,
  revision: 1,
}

test('routine initial Rate Con does not create Email', () => {
  const messages = buildOperationalEmailInbox({ documents: [rateCon] })
  assert.deepEqual(messages, [])
})

test('corrected Rate Con creates communication pointing back to Documents', () => {
  const corrected = {
    ...rateCon,
    id: 'RC-FL-402-R2',
    corrected: true,
    revision: 2,
    status: 'CORRECTED_RATE_CON_READY',
    statusLabel: 'CORRECTED · REVIEW REQUIRED',
  }
  const messages = buildOperationalEmailInbox({ documents: [corrected] })

  assert.equal(messages.length, 1)
  assert.equal(messages[0].id, emailIdForDocument(corrected.id))
  assert.equal(messages[0].subject, 'Corrected Rate Confirmation available · FL-402')
  assert.equal(messages[0].documentId, corrected.id)
  assert.equal(messages[0].relatedWorkLabel, 'Corrected Rate Confirmation')
  assert.match(messages[0].body, /Documents Incoming tray/)
  assert.equal(messages[0].unread, true)
})

test('clean POD does not create Email', () => {
  const messages = buildOperationalEmailInbox({ documents: [pod] })
  assert.deepEqual(messages, [])
})

test('POD exception creates Email communication and remains available through review state changes', () => {
  const exceptionPod = {
    ...pod,
    hasException: true,
    status: 'POD_EXCEPTION_REVIEW',
    statusLabel: 'EXCEPTION REVIEW',
  }
  const id = emailIdForDocument(exceptionPod.id)
  const unreadMessages = buildOperationalEmailInbox({ documents: [exceptionPod] })

  assert.equal(unreadMessages.length, 1)
  assert.equal(unreadMessages[0].subject, 'Delivery exception · T-110')
  assert.equal(unreadMessages[0].documentId, exceptionPod.id)
  assert.equal(unreadMessages[0].relatedWorkLabel, 'Proof of Delivery')
  assert.equal(operationalEmailUnreadCount(unreadMessages), 1)

  const acceptedException = {
    ...exceptionPod,
    status: 'ACCEPTED',
    statusLabel: 'ACCEPTED · EXCEPTION',
  }
  const readMessages = buildOperationalEmailInbox({
    documents: [acceptedException],
    readEmailIds: { [id]: true },
  })
  assert.equal(readMessages[0].unread, false)
  assert.equal(operationalEmailUnreadCount(readMessages), 0)
})

test('corrected POD creates a new Email notice linked to the revised paperwork', () => {
  const correctedPod = {
    ...pod,
    id: 'POD:T-110:delivery:R2',
    corrected: true,
    revision: 2,
    hasException: true,
    status: 'CORRECTED_POD_REVIEW',
    statusLabel: 'CORRECTED · REVIEW',
  }

  const messages = buildOperationalEmailInbox({ documents: [correctedPod] })
  assert.equal(messages.length, 1)
  assert.equal(messages[0].subject, 'Corrected POD available · T-110')
  assert.equal(messages[0].documentId, correctedPod.id)
  assert.equal(messages[0].relatedWorkLabel, 'Corrected Proof of Delivery')
  assert.match(messages[0].body, /Revision R2/)
  assert.match(messages[0].body, /Documents Incoming/)
})
