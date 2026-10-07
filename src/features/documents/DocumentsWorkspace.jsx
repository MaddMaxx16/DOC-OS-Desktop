import { useEffect, useMemo, useState } from 'react'
import { OPERATIONAL_DOCUMENT_TYPE } from '../../domain/documents/operationalDocumentIndex.js'
import './documentsWorkspace.css'

const FILTERS = Object.freeze([
  { id: 'ALL', label: 'ALL' },
  { id: 'ACTION', label: 'NEEDS ACTION' },
  { id: 'RATE_CON', label: 'RATE CON' },
  { id: 'POD', label: 'POD' },
])

function documentMatchesFilter(document, filter) {
  if (filter === 'ACTION') return Boolean(document.attention)
  if (filter === 'RATE_CON') return document.type === OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION
  if (filter === 'POD') return document.type === OPERATIONAL_DOCUMENT_TYPE.POD
  return true
}

function documentTone(document) {
  if (document.attention) return 'attention'
  if (['ACCEPTED', 'RECEIVED'].includes(document.status)) return 'complete'
  if (['CORRECTION_REQUESTED', 'PENDING_RECEIVER'].includes(document.status)) return 'waiting'
  return 'neutral'
}

function DocumentTypeMark({ type }) {
  return (
    <div className={`document-type-mark ${type === OPERATIONAL_DOCUMENT_TYPE.POD ? 'pod' : 'ratecon'}`} aria-hidden="true">
      <span>{type === OPERATIONAL_DOCUMENT_TYPE.POD ? 'POD' : 'RC'}</span>
    </div>
  )
}

function RateConInspector({ document, onOpenRateCon }) {
  const canReview = (
    document.status === 'REVIEW_REQUIRED'
    || document.status === 'CORRECTED_RATE_CON_READY'
  )

  return (
    <>
      <div className="document-detail-grid">
        <div><span>DOCUMENT</span><strong>Rate Confirmation</strong></div>
        <div><span>LOAD</span><strong>{document.loadRef}</strong></div>
        <div><span>REVISION</span><strong>R{document.revision}</strong></div>
        <div><span>SOURCE</span><strong>{document.brokerName}</strong></div>
        <div className="wide"><span>STATUS</span><strong className={documentTone(document)}>{document.statusLabel}</strong></div>
      </div>

      <section className="document-inspector-section">
        <header><span>WORKFLOW</span></header>
        {canReview ? (
          <div className="document-next-action attention">
            <span>NEXT ACTION</span>
            <strong>Review the Rate Confirmation before committing this freight.</strong>
            <small>Focused Document Mode pauses the simulation while you compare the paper against the lane.</small>
          </div>
        ) : document.status === 'CORRECTION_REQUESTED' ? (
          <div className="document-next-action waiting">
            <span>WAITING</span>
            <strong>Correction requested from FreightLink Brokerage.</strong>
            <small>The revised Rate Confirmation will become actionable here when it arrives.</small>
          </div>
        ) : (
          <div className="document-next-action complete">
            <span>FILED</span>
            <strong>This Rate Confirmation was accepted for the booked load.</strong>
            <small>Full revision/archive viewing is scheduled for the next Documents packet.</small>
          </div>
        )}
      </section>

      {document.documentRecord && (
        <section className="document-inspector-section">
          <header><span>COMMERCIAL SUMMARY</span></header>
          <div className="document-summary-list">
            <p><span>Confirmation</span><strong>{document.documentRecord.confirmationNumber ?? '—'}</strong></p>
            <p><span>Rate</span><strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(document.documentRecord.terms?.rate ?? 0)}</strong></p>
            <p><span>Equipment</span><strong>{document.documentRecord.terms?.equipment ?? '—'}</strong></p>
            <p><span>Payment</span><strong>{document.documentRecord.paymentTerms ?? '—'}</strong></p>
          </div>
        </section>
      )}

      <footer className="documents-inspector-footer">
        <div>
          <span>{canReview ? 'ACTION REQUIRED' : document.statusLabel}</span>
          <strong>{canReview ? 'Open the paper desk to review terms.' : 'Document remains associated with this load.'}</strong>
        </div>
        {canReview && (
          <button type="button" onClick={() => onOpenRateCon(document.laneId)}>
            REVIEW DOCUMENT
          </button>
        )}
      </footer>
    </>
  )
}

function PodInspector({ document }) {
  const exceptionCount = (
    Number(document.refusedPieces ?? 0)
    + Number(document.shortagePieces ?? 0)
    + (document.damageNoted ? 1 : 0)
  )

  return (
    <>
      <div className="document-detail-grid">
        <div><span>DOCUMENT</span><strong>Proof of Delivery</strong></div>
        <div><span>LOAD</span><strong>{document.loadRef}</strong></div>
        <div><span>RECEIVER</span><strong>{document.facilityLabel}</strong></div>
        <div><span>SIGNATURE</span><strong>{document.signaturePresent ? 'PRESENT' : 'PENDING'}</strong></div>
        <div className="wide"><span>STATUS</span><strong className={documentTone(document)}>{document.statusLabel}</strong></div>
      </div>

      <section className="document-inspector-section">
        <header><span>DELIVERY SUMMARY</span></header>
        <div className="document-summary-list">
          <p><span>Delivered</span><strong>{document.deliveredPieces} units</strong></p>
          <p><span>Refused</span><strong>{document.refusedPieces}</strong></p>
          <p><span>Shortage</span><strong>{document.shortagePieces}</strong></p>
          <p><span>Damage</span><strong>{document.damageNoted ? 'NOTED' : 'NONE'}</strong></p>
        </div>
      </section>

      <section className="document-inspector-section">
        <header><span>DOCUMENT STATE</span></header>
        {document.status === 'PENDING_RECEIVER' ? (
          <div className="document-next-action waiting">
            <span>PENDING RECEIVER</span>
            <strong>The receiver is finalizing the Proof of Delivery.</strong>
            <small>This record will update automatically when receiver verification completes.</small>
          </div>
        ) : document.status === 'REVIEW_REQUIRED' ? (
          <div className="document-next-action attention">
            <span>REVIEW REQUIRED</span>
            <strong>{exceptionCount} delivery exception signal{exceptionCount === 1 ? '' : 's'} require document review.</strong>
            <small>The focused POD review workflow arrives in the dedicated POD packet.</small>
          </div>
        ) : (
          <div className="document-next-action complete">
            <span>RECEIVED</span>
            <strong>Clean POD received with receiver signature.</strong>
            <small>The document is retained with this load's paperwork.</small>
          </div>
        )}
      </section>

      <footer className="documents-inspector-footer static">
        <div>
          <span>{document.statusLabel}</span>
          <strong>{document.status === 'REVIEW_REQUIRED' ? 'Document needs attention.' : 'No document action is available in this packet.'}</strong>
        </div>
      </footer>
    </>
  )
}

export default function DocumentsWorkspace({
  documents = [],
  selectedDocumentId,
  onSelectDocument,
  onOpenRateCon,
  onClose,
}) {
  const [filter, setFilter] = useState('ALL')

  const filteredDocuments = useMemo(
    () => documents.filter((document) => documentMatchesFilter(document, filter)),
    [documents, filter],
  )

  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null

  useEffect(() => {
    if (selectedDocumentId && documents.some((document) => document.id === selectedDocumentId)) return
    const firstAction = documents.find((document) => document.attention)
    onSelectDocument(firstAction?.id ?? documents[0]?.id ?? null)
  }, [documents, onSelectDocument, selectedDocumentId])

  return (
    <div className="documents-workspace">
      <aside className="workstation-browser documents-browser" aria-label="Documents">
        <header className="workstation-panel-header documents-browser-header">
          <div>
            <span>OPERATIONS FILES</span>
            <strong>Documents</strong>
            <small>Rate Cons and delivery paperwork tied to active work.</small>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Documents">×</button>
        </header>

        <div className="documents-filters" aria-label="Document filters">
          {FILTERS.map((item) => {
            const count = documents.filter((document) => (
              documentMatchesFilter(document, item.id)
            )).length
            return (
              <button
                type="button"
                key={item.id}
                className={filter === item.id ? 'active' : ''}
                onClick={() => setFilter(item.id)}
              >
                <span>{item.label}</span>
                <b>{count}</b>
              </button>
            )
          })}
        </div>

        <div className="documents-list">
          {filteredDocuments.length === 0 ? (
            <div className="documents-empty">
              <strong>NO DOCUMENTS</strong>
              <small>{filter === 'ALL' ? 'Operational paperwork will appear here.' : 'No paperwork matches this filter.'}</small>
            </div>
          ) : filteredDocuments.map((document) => {
            const selected = document.id === selectedDocumentId
            return (
              <button
                type="button"
                key={document.id}
                className={`document-row ${selected ? 'selected' : ''} ${documentTone(document)}`}
                onClick={() => onSelectDocument(document.id)}
                aria-pressed={selected}
              >
                <DocumentTypeMark type={document.type} />
                <div className="document-row-copy">
                  <span>{document.shortTypeLabel} · {document.loadRef}</span>
                  <strong>{document.title}</strong>
                  <small>
                    {document.type === OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION
                      ? `Revision R${document.revision} · ${document.source}`
                      : document.facilityLabel}
                  </small>
                </div>
                <div className="document-row-status">
                  {document.attention && <i>!</i>}
                  <strong>{document.statusLabel}</strong>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {selectedDocument && (
        <aside className="workstation-inspector documents-inspector" aria-label={`${selectedDocument.title} details`}>
          <header className="workstation-panel-header documents-inspector-header">
            <div>
              <span>{selectedDocument.shortTypeLabel} · {selectedDocument.loadRef}</span>
              <strong>{selectedDocument.title}</strong>
              <small>{selectedDocument.source}</small>
            </div>
            <div className={`documents-status-badge ${documentTone(selectedDocument)}`}>
              <span>STATUS</span>
              <strong>{selectedDocument.statusLabel}</strong>
            </div>
          </header>

          <div className="documents-inspector-scroll">
            {selectedDocument.type === OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION ? (
              <RateConInspector document={selectedDocument} onOpenRateCon={onOpenRateCon} />
            ) : (
              <PodInspector document={selectedDocument} />
            )}
          </div>
        </aside>
      )}
    </div>
  )
}
