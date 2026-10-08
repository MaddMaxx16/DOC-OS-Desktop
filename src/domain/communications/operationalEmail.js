import { OPERATIONAL_DOCUMENT_TYPE } from '../documents/operationalDocumentIndex.js'

export const OPERATIONAL_EMAIL_KIND = Object.freeze({
  RATE_CONFIRMATION_CORRECTION: 'RATE_CONFIRMATION_CORRECTION',
  POD_EXCEPTION: 'POD_EXCEPTION',
  POD_CORRECTION: 'POD_CORRECTION',
})

export function emailIdForDocument(documentId) {
  return `email:${documentId}`
}

function correctedRateConMessage(document, { readEmailIds }) {
  if (!document.corrected) return null

  const id = emailIdForDocument(document.id)
  return {
    id,
    kind: OPERATIONAL_EMAIL_KIND.RATE_CONFIRMATION_CORRECTION,
    documentId: document.id,
    loadRef: document.loadRef,
    senderName: document.brokerName ?? 'FreightLink Brokerage',
    senderAddress: 'operations@freightlink.example',
    recipientName: 'Metroline Operations',
    recipientAddress: 'dispatch@metroline.example',
    subject: `Corrected Rate Confirmation available · ${document.loadRef}`,
    preview: 'FreightLink issued revised paperwork for this load.',
    body: `We issued a corrected Rate Confirmation for ${document.loadRef}. The revised paperwork is waiting in the Documents Incoming tray for your review.`,
    sourceLabel: 'FreightLink',
    statusLabel: document.statusLabel,
    relatedWorkLabel: 'Corrected Rate Confirmation',
    unread: !readEmailIds[id],
    issuedAtLabel: document.issuedAtLabel ?? 'Today',
    closingName: 'FreightLink Operations Desk',
  }
}

function podExceptionMessage(document, { readEmailIds }) {
  if (!document.hasException || document.corrected) return null

  const id = emailIdForDocument(document.id)
  const senderName = document.facilityLabel ?? 'Receiver'
  return {
    id,
    kind: OPERATIONAL_EMAIL_KIND.POD_EXCEPTION,
    documentId: document.id,
    loadRef: document.loadRef,
    senderName,
    senderAddress: 'receiving@operations.example',
    recipientName: 'Metroline Operations',
    recipientAddress: 'dispatch@metroline.example',
    subject: `Delivery exception · ${document.loadRef}`,
    preview: 'The receiver reported an exception on the Proof of Delivery.',
    body: `The Proof of Delivery for ${document.loadRef} contains a delivery exception that needs your attention. Review the receiver copy in Documents before accepting the packet.`,
    sourceLabel: senderName,
    statusLabel: document.statusLabel,
    relatedWorkLabel: 'Proof of Delivery',
    unread: !readEmailIds[id],
    issuedAtLabel: 'Receiver completed',
    closingName: `${senderName} Receiving`,
  }
}

function correctedPodMessage(document, { readEmailIds }) {
  if (!document.corrected) return null

  const id = emailIdForDocument(document.id)
  const senderName = document.facilityLabel ?? 'Receiver'
  return {
    id,
    kind: OPERATIONAL_EMAIL_KIND.POD_CORRECTION,
    documentId: document.id,
    loadRef: document.loadRef,
    senderName,
    senderAddress: 'receiving@operations.example',
    recipientName: 'Metroline Operations',
    recipientAddress: 'dispatch@metroline.example',
    subject: `Corrected POD available · ${document.loadRef}`,
    preview: 'The receiver reissued the Proof of Delivery you requested.',
    body: `A corrected Proof of Delivery for ${document.loadRef} has been returned. Revision R${document.revision ?? 2} is waiting in Documents Incoming for your review.`,
    sourceLabel: senderName,
    statusLabel: document.statusLabel,
    relatedWorkLabel: 'Corrected Proof of Delivery',
    unread: !readEmailIds[id],
    issuedAtLabel: 'Correction returned',
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
        return correctedPodMessage(document, { readEmailIds })
          ?? podExceptionMessage(document, { readEmailIds })
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
