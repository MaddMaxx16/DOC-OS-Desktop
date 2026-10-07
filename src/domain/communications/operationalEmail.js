import { OPERATIONAL_DOCUMENT_TYPE } from '../documents/operationalDocumentIndex.js'

export const OPERATIONAL_EMAIL_KIND = Object.freeze({
  RATE_CONFIRMATION: 'RATE_CONFIRMATION',
  POD: 'POD',
})

export function emailIdForDocument(documentId) {
  return `email:${documentId}`
}

function rateConMessage(document, { readEmailIds, printedDocumentIds }) {
  const corrected = Boolean(document.corrected)
  const subject = corrected
    ? `Corrected Rate Confirmation · ${document.loadRef}`
    : `Rate Confirmation · ${document.loadRef}`

  return {
    id: emailIdForDocument(document.id),
    kind: OPERATIONAL_EMAIL_KIND.RATE_CONFIRMATION,
    documentId: document.id,
    loadRef: document.loadRef,
    senderName: document.brokerName ?? 'FreightLink Brokerage',
    senderAddress: 'operations@freightlink.example',
    subject,
    preview: corrected
      ? 'The corrected Rate Confirmation is attached for review.'
      : 'The Rate Confirmation you requested is attached.',
    body: corrected
      ? `The corrected Rate Confirmation for ${document.loadRef} is attached. Review the revised terms before confirming the freight.`
      : `The Rate Confirmation for ${document.loadRef} is attached. Print the paper to your Documents desk, then review the terms before confirming the freight.`,
    attachmentLabel: corrected ? 'Corrected Rate Confirmation' : 'Rate Confirmation',
    attachmentTypeLabel: 'PDF',
    sourceLabel: 'FreightLink',
    statusLabel: document.statusLabel,
    unread: !readEmailIds[emailIdForDocument(document.id)],
    printed: Boolean(printedDocumentIds[document.id]),
    issuedAtLabel: document.issuedAtLabel ?? 'Today',
  }
}

function podMessage(document, { readEmailIds, printedDocumentIds }) {
  if (document.status === 'PENDING_RECEIVER') return null

  const hasException = document.status === 'REVIEW_REQUIRED'
  const senderName = document.facilityLabel ?? 'Receiver'
  return {
    id: emailIdForDocument(document.id),
    kind: OPERATIONAL_EMAIL_KIND.POD,
    documentId: document.id,
    loadRef: document.loadRef,
    senderName,
    senderAddress: 'receiving@operations.example',
    subject: `Proof of Delivery · ${document.loadRef}`,
    preview: hasException
      ? 'The POD is attached and requires review.'
      : 'The signed POD is attached.',
    body: hasException
      ? `The Proof of Delivery for ${document.loadRef} is attached with an exception that requires your attention. Print the paper to Documents before working the load file.`
      : `The signed Proof of Delivery for ${document.loadRef} is attached. Print the paper to Documents when you are ready to file the load packet.`,
    attachmentLabel: 'Proof of Delivery',
    attachmentTypeLabel: 'PDF',
    sourceLabel: senderName,
    statusLabel: document.statusLabel,
    unread: !readEmailIds[emailIdForDocument(document.id)],
    printed: Boolean(printedDocumentIds[document.id]),
    issuedAtLabel: 'Receiver completed',
  }
}

export function buildOperationalEmailInbox({
  documents = [],
  readEmailIds = {},
  printedDocumentIds = {},
} = {}) {
  return documents
    .map((document) => {
      if (document.type === OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION) {
        return rateConMessage(document, { readEmailIds, printedDocumentIds })
      }

      if (document.type === OPERATIONAL_DOCUMENT_TYPE.POD) {
        return podMessage(document, { readEmailIds, printedDocumentIds })
      }

      return null
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (left.unread !== right.unread) return left.unread ? -1 : 1
      if (left.printed !== right.printed) return left.printed ? 1 : -1
      return String(left.id).localeCompare(String(right.id))
    })
}

export function operationalEmailUnreadCount(messages = []) {
  return messages.filter((message) => message?.unread).length
}
