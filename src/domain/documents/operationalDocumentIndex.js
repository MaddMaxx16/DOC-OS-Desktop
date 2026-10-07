import { BOOKING_STATUS } from '../booking/bookingLifecycle.js'
import { DELIVERY_DOCUMENT_STATUS } from './deliveryPod.js'

export const OPERATIONAL_DOCUMENT_TYPE = Object.freeze({
  RATE_CONFIRMATION: 'RATE_CONFIRMATION',
  POD: 'POD',
})

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
