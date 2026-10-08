import { OPERATIONAL_DOCUMENT_TYPE } from '../documents/operationalDocumentIndex.js'

export const OPERATIONAL_EMAIL_KIND = Object.freeze({
  RATE_CONFIRMATION: 'RATE_CONFIRMATION',
  POD: 'POD',
})

export function emailIdForDocument(documentId) {
  return `email:${documentId}`
}

function correctedRateConMessage(document, { readEmailIds }) {
  if (!document.corrected) return null

  const id = emailIdForDocument(document.id)
  return {
    id,
    kind: OPERATIONAL_EMAIL_KIND.RATE_CONFIRMATION,
    relatedDocumentId: document.id,
    loadRef: document.loadRef,
    senderName: document.brokerName ?? 'FreightLink Brokerage',
    senderAddress: 'operations@freightlink.example',
    recipientName: 'Metroline Operations',
    recipientAddress: 'dispatch@metroline.example',
    subject: `Corrected Rate Confirmation · ${document.loadRef}`,
    preview: 'Your requested Rate Confirmation correction has been returned.',
    body: `We completed the requested correction for ${document.loadRef}. The revised Rate Confirmation has been returned to your Documents Incoming tray for review.`,
    relatedLabel: 'Corrected Rate Confirmation',
    sourceLabel: 'FreightLink',
    statusLabel: document.statusLabel,
    unread: !readEmailIds[id],
    issuedAtLabel: document.issuedAtLabel ?? 'Today',
    closingName: 'FreightLink Operations Desk',
  }
}

function podExceptionMessage(document, { readEmailIds }) {
  if (document.status !== 'REVIEW_REQUIRED') return null

  const id = emailIdForDocument(document.id)
  const senderName = document.facilityLabel ?? 'Receiver'
  return {
    id,
    kind: OPERATIONAL_EMAIL_KIND.POD,
    relatedDocumentId: document.id,
    loadRef: document.loadRef,
    senderName,
    senderAddress: 'receiving@operations.example',
    recipientName: 'Metroline Operations',
    recipientAddress: 'dispatch@metroline.example',
    subject: `Delivery paperwork exception · ${document.loadRef}`,
    preview: 'The receiver completed the POD with an exception that needs attention.',
    body: `The Proof of Delivery for ${document.loadRef} has been completed with an exception. The paperwork is waiting in Documents Incoming for your review.`,
    relatedLabel: 'Proof of Delivery',
    sourceLabel: senderName,
    statusLabel: document.statusLabel,
    unread: !readEmailIds[id],
    issuedAtLabel: 'Receiver completed',
    closingName: `${senderName} Receiving`,
  }
}

export function buildOperationalEmailInbox({
  documents = [],
  readEmailIds = {},
} = {}) {
  return documents
    .map((document) => {
      if (document.type === OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION) {
        return correctedRateConMessage(document, { readEmailIds })
      }

      if (document.type === OPERATIONAL_DOCUMENT_TYPE.POD) {
        return podExceptionMessage(document, { readEmailIds })
      }

      return null
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (left.unread !== right.unread) return left.unread ? -1 : 1
      return String(left.id).localeCompare(String(right.id))
    })
}

export function operationalEmailUnreadCount(messages = []) {
  return messages.filter((message) => message?.unread).length
}
