import { BOOKING_STATUS } from '../booking/bookingLifecycle.js'
import { DELIVERY_DOCUMENT_STATUS } from './deliveryPod.js'

export const OPERATIONAL_DOCUMENT_TYPE = Object.freeze({
  RATE_CONFIRMATION: 'RATE_CONFIRMATION',
  POD: 'POD',
})

export const OPERATIONAL_LOAD_FILE_STATUS = Object.freeze({
  NEEDS_ACTION: 'NEEDS_ACTION',
  OPEN: 'OPEN',
  RECEIVER_PROCESSING: 'RECEIVER_PROCESSING',
  SUBMIT_READY: 'SUBMIT_READY',
  SUBMITTED: 'SUBMITTED',
})

export const OPERATIONAL_LOAD_FILE_REQUIREMENTS = Object.freeze([
  Object.freeze({
    type: OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION,
    label: 'Rate Confirmation',
    acceptedStatuses: Object.freeze(['ACCEPTED']),
  }),
  Object.freeze({
    type: OPERATIONAL_DOCUMENT_TYPE.POD,
    label: 'Proof of Delivery',
    acceptedStatuses: Object.freeze(['RECEIVED']),
  }),
])

function rateConfirmationStatus(record = {}) {
  switch (record.status) {
    case BOOKING_STATUS.RATE_CON_READY:
      return {
        status: record.correctionCount ? 'CORRECTED_RATE_CON_READY' : 'REVIEW_REQUIRED',
        statusLabel: record.correctionCount ? 'CORRECTED · REVIEW REQUIRED' : 'REVIEW REQUIRED',
        attention: true,
      }
    case BOOKING_STATUS.CORRECTION_REQUESTED:
      return {
        status: 'CORRECTION_REQUESTED',
        statusLabel: 'CORRECTION REQUESTED',
        attention: false,
      }
    case BOOKING_STATUS.CONFIRMED:
      return {
        status: 'ACCEPTED',
        statusLabel: 'ACCEPTED',
        attention: false,
      }
    default:
      return {
        status: 'AVAILABLE',
        statusLabel: 'AVAILABLE',
        attention: false,
      }
  }
}

function podStatus(record = {}) {
  switch (record.status) {
    case DELIVERY_DOCUMENT_STATUS.PENDING_RECEIVER:
      return {
        status: 'PENDING_RECEIVER',
        statusLabel: 'PENDING RECEIVER',
        attention: false,
      }
    case DELIVERY_DOCUMENT_STATUS.REVIEW_REQUIRED:
      return {
        status: 'REVIEW_REQUIRED',
        statusLabel: 'REVIEW REQUIRED',
        attention: true,
      }
    case DELIVERY_DOCUMENT_STATUS.RECEIVED:
    default:
      return {
        status: 'RECEIVED',
        statusLabel: 'RECEIVED',
        attention: false,
      }
  }
}

function buildRateConfirmationDocuments(bookingRecords = {}, lanes = []) {
  const laneById = new Map(lanes.map((lane) => [lane.id, lane]))

  return Object.values(bookingRecords)
    .filter((record) => Boolean(record?.rateConfirmation))
    .map((record) => {
      const rateConfirmation = record.rateConfirmation
      const lane = laneById.get(record.laneId) ?? null
      const status = rateConfirmationStatus(record)

      return {
        id: rateConfirmation.id,
        type: OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION,
        title: 'Rate Confirmation',
        shortTypeLabel: 'RATE CON',
        loadId: record.bookedLoadId ?? record.laneId ?? null,
        loadRef: rateConfirmation.laneRef ?? lane?.laneRef ?? record.laneId ?? '—',
        laneId: record.laneId ?? rateConfirmation.laneId ?? null,
        driverId: record.driverId ?? null,
        source: 'FreightLink Brokerage',
        revision: Number(rateConfirmation.revision ?? 1),
        corrected: Boolean(rateConfirmation.corrected),
        issuedAtLabel: rateConfirmation.issuedAtLabel ?? null,
        brokerName: rateConfirmation.broker?.name ?? 'FreightLink Brokerage',
        ...status,
        sourceRecord: record,
        documentRecord: rateConfirmation,
      }
    })
}

function buildPodDocuments(documentRecords = {}) {
  return Object.values(documentRecords)
    .filter((record) => record?.type === 'POD')
    .map((record) => {
      const status = podStatus(record)
      return {
        id: record.id,
        type: OPERATIONAL_DOCUMENT_TYPE.POD,
        title: 'Proof of Delivery',
        shortTypeLabel: 'POD',
        loadId: record.loadId ?? null,
        loadRef: record.loadRef ?? record.loadId ?? '—',
        laneId: null,
        driverId: record.driverId ?? null,
        source: record.facilityLabel ?? 'Receiver',
        revision: null,
        corrected: false,
        facilityId: record.facilityId ?? null,
        facilityLabel: record.facilityLabel ?? 'Receiver',
        availableAtMinutes: record.availableAtMinutes ?? null,
        deliveredPieces: Number(record.deliveredPieces ?? 0),
        refusedPieces: Number(record.refusedPieces ?? 0),
        shortagePieces: Number(record.shortagePieces ?? 0),
        damageNoted: Boolean(record.damageNoted),
        signaturePresent: Boolean(record.signaturePresent),
        ...status,
        sourceRecord: record,
        documentRecord: record,
      }
    })
}

export function buildOperationalDocumentIndex({
  bookingRecords = {},
  documentRecords = {},
  lanes = [],
} = {}) {
  const documents = [
    ...buildRateConfirmationDocuments(bookingRecords, lanes),
    ...buildPodDocuments(documentRecords),
  ]

  return documents.sort((left, right) => {
    if (left.attention !== right.attention) return left.attention ? -1 : 1

    const leftTypeOrder = left.type === OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION ? 0 : 1
    const rightTypeOrder = right.type === OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION ? 0 : 1
    if (leftTypeOrder !== rightTypeOrder) return leftTypeOrder - rightTypeOrder

    const loadCompare = String(left.loadRef ?? '').localeCompare(String(right.loadRef ?? ''))
    if (loadCompare !== 0) return loadCompare

    return String(left.id).localeCompare(String(right.id))
  })
}

export function operationalDocumentAttentionCount(documents = []) {
  return documents.filter((document) => document?.attention).length
}

export function operationalDocumentAvailableForIntake(document) {
  if (!document) return false
  if (
    document.type === OPERATIONAL_DOCUMENT_TYPE.POD
    && document.status === 'PENDING_RECEIVER'
  ) {
    return false
  }
  return true
}

function sortFileDocuments(documents = []) {
  return [...documents].sort((left, right) => {
    if (left.attention !== right.attention) return left.attention ? -1 : 1

    const leftTypeOrder = left.type === OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION ? 0 : 1
    const rightTypeOrder = right.type === OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION ? 0 : 1
    if (leftTypeOrder !== rightTypeOrder) return leftTypeOrder - rightTypeOrder

    const revisionCompare = Number(right.revision ?? 0) - Number(left.revision ?? 0)
    if (revisionCompare !== 0) return revisionCompare

    return String(left.id).localeCompare(String(right.id))
  })
}

function buildRequirementState(filedDocuments = []) {
  return OPERATIONAL_LOAD_FILE_REQUIREMENTS.map((requirement) => {
    const matchingDocuments = filedDocuments.filter((document) => document.type === requirement.type)
    const qualifyingDocument = matchingDocuments.find((document) => (
      requirement.acceptedStatuses.includes(document.status)
    )) ?? null

    return {
      ...requirement,
      filed: matchingDocuments.length > 0,
      satisfied: Boolean(qualifyingDocument),
      documentId: qualifyingDocument?.id ?? matchingDocuments[0]?.id ?? null,
      status: qualifyingDocument?.status ?? matchingDocuments[0]?.status ?? null,
    }
  })
}

function loadFileStatus({
  allDocuments = [],
  availableDocuments = [],
  filedDocuments = [],
  requirements = [],
  submitted = false,
} = {}) {
  if (submitted) {
    return {
      status: OPERATIONAL_LOAD_FILE_STATUS.SUBMITTED,
      statusLabel: 'PACKET SUBMITTED',
      attention: false,
    }
  }

  if (availableDocuments.some((document) => document?.attention)) {
    return {
      status: OPERATIONAL_LOAD_FILE_STATUS.NEEDS_ACTION,
      statusLabel: 'NEEDS ACTION',
      attention: true,
    }
  }

  const hasPendingPod = allDocuments.some((document) => (
    document.type === OPERATIONAL_DOCUMENT_TYPE.POD
    && document.status === 'PENDING_RECEIVER'
  ))

  if (hasPendingPod) {
    return {
      status: OPERATIONAL_LOAD_FILE_STATUS.RECEIVER_PROCESSING,
      statusLabel: 'RECEIVER PROCESSING',
      attention: false,
    }
  }

  if (requirements.length > 0 && requirements.every((requirement) => requirement.satisfied)) {
    return {
      status: OPERATIONAL_LOAD_FILE_STATUS.SUBMIT_READY,
      statusLabel: 'READY TO SUBMIT',
      attention: false,
    }
  }

  return {
    status: OPERATIONAL_LOAD_FILE_STATUS.OPEN,
    statusLabel: filedDocuments.length > 0 ? 'FILE IN PROGRESS' : 'ACTIVE FILE',
    attention: false,
  }
}

export function buildOperationalLoadFiles(
  documents = [],
  {
    fileAssignments = {},
    submittedLoadFiles = {},
    deskDocumentIds = {},
  } = {},
) {
  const grouped = new Map()

  for (const document of documents) {
    const loadKey = document?.loadRef ?? document?.loadId
    if (!loadKey) continue

    if (!grouped.has(loadKey)) grouped.set(loadKey, [])
    grouped.get(loadKey).push(document)
  }

  return [...grouped.entries()]
    .map(([loadRef, fileDocuments]) => {
      const documentsForFile = sortFileDocuments(fileDocuments)
      const availableDocuments = documentsForFile.filter(operationalDocumentAvailableForIntake)
      const filedDocuments = availableDocuments.filter((document) => (
        fileAssignments[document.id] === loadRef
      ))
      const deskDocuments = availableDocuments.filter((document) => (
        fileAssignments[document.id] !== loadRef
        && Boolean(deskDocumentIds[document.id])
      ))
      const incomingDocuments = availableDocuments.filter((document) => (
        fileAssignments[document.id] !== loadRef
        && !deskDocumentIds[document.id]
      ))
      const requirements = buildRequirementState(filedDocuments)
      const primary = documentsForFile[0] ?? null
      const submitted = Boolean(submittedLoadFiles[loadRef])
      const status = loadFileStatus({
        allDocuments: documentsForFile,
        availableDocuments,
        filedDocuments,
        requirements,
        submitted,
      })

      return {
        id: `load-file:${loadRef}`,
        loadId: primary?.loadId ?? null,
        loadRef,
        driverId: primary?.driverId ?? null,
        documents: documentsForFile,
        availableDocuments,
        incomingDocuments,
        deskDocuments,
        filedDocuments,
        documentCount: documentsForFile.length,
        availableCount: availableDocuments.length,
        incomingCount: incomingDocuments.length,
        deskCount: deskDocuments.length,
        filedCount: filedDocuments.length,
        attentionCount: availableDocuments.filter((document) => document.attention).length,
        requirements,
        requiredCount: requirements.length,
        satisfiedRequirementCount: requirements.filter((requirement) => requirement.satisfied).length,
        canSubmit: requirements.length > 0 && requirements.every((requirement) => requirement.satisfied),
        submitted,
        ...status,
      }
    })
    .sort((left, right) => {
      if (left.attention !== right.attention) return left.attention ? -1 : 1

      const leftReady = left.status === OPERATIONAL_LOAD_FILE_STATUS.SUBMIT_READY
      const rightReady = right.status === OPERATIONAL_LOAD_FILE_STATUS.SUBMIT_READY
      if (leftReady !== rightReady) return leftReady ? -1 : 1

      return String(left.loadRef).localeCompare(String(right.loadRef))
    })
}

export function operationalLoadFileAttentionCount(loadFiles = []) {
  return loadFiles.filter((loadFile) => loadFile?.attention).length
}

export function buildOperationalIncomingDocuments(loadFiles = []) {
  const seen = new Set()
  const incomingDocuments = []

  for (const loadFile of loadFiles) {
    for (const document of loadFile?.incomingDocuments ?? []) {
      if (seen.has(document.id)) continue
      seen.add(document.id)
      incomingDocuments.push(document)
    }
  }

  return incomingDocuments.sort((left, right) => {
    if (left.attention !== right.attention) return left.attention ? -1 : 1
    return String(left.id).localeCompare(String(right.id))
  })
}

export function buildOperationalDeskDocuments(loadFiles = []) {
  const seen = new Set()
  const deskDocuments = []

  for (const loadFile of loadFiles) {
    for (const document of loadFile?.deskDocuments ?? []) {
      if (seen.has(document.id)) continue
      seen.add(document.id)
      deskDocuments.push(document)
    }
  }

  return deskDocuments.sort((left, right) => {
    if (left.attention !== right.attention) return left.attention ? -1 : 1
    return String(left.id).localeCompare(String(right.id))
  })
}

export function operationalDocumentWorkspaceAttentionCount(loadFiles = []) {
  const seen = new Set()
  let count = 0

  for (const loadFile of loadFiles) {
    for (const document of [
      ...(loadFile?.incomingDocuments ?? []),
      ...(loadFile?.deskDocuments ?? []),
      ...(loadFile?.filedDocuments ?? []),
    ]) {
      if (seen.has(document.id)) continue
      seen.add(document.id)
      if (
        loadFile.incomingDocuments.some((item) => item.id === document.id)
        || document.attention
      ) {
        count += 1
      }
    }
  }

  return count
}
