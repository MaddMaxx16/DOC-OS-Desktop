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

function RateConInspector({ document, driverLabel, onOpenRateCon }) {
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
        <div><span>DRIVER</span><strong>{driverLabel}</strong></div>
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
            <small>The accepted paperwork stays filed with the booked load.</small>
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
            <small>Delivery exceptions are recorded on this POD and require follow-up.</small>
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
          <strong>{
            document.status === 'REVIEW_REQUIRED'
              ? 'Document needs attention.'
              : document.status === 'PENDING_RECEIVER'
                ? 'Waiting for receiver verification.'
                : 'POD is filed with this load.'
          }</strong>
        </div>
      </footer>
    </>
  )
}

function documentCanReview(document) {
  return Boolean(
    document?.type === OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION
    && (
      document.status === 'REVIEW_REQUIRED'
      || document.status === 'CORRECTED_RATE_CON_READY'
    )
  )
}

function DocumentsDesk({
  documents,
  selectedDocument,
  selectedDriver,
  onOpenRateCon,
}) {
  const actionCount = documents.filter((document) => document.attention).length
  const filedCount = documents.filter((document) => (
    ['ACCEPTED', 'RECEIVED'].includes(document.status)
  )).length
  const canReview = documentCanReview(selectedDocument)

  return (
    <section className="documents-desk-workspace" aria-label="Document desk">
      <header className="documents-desk-header">
        <div>
          <span>DOCUMENT DESK</span>
          <strong>{selectedDocument ? [selectedDocument.shortTypeLabel, selectedDocument.loadRef].join(' · ') : 'No file selected'}</strong>
        </div>
        <small>{actionCount} need action · {filedCount} filed</small>
      </header>

      <div className="documents-desk-surface">
        <div className="documents-desk-tray incoming" aria-hidden="true">
          <span>INBOX</span>
          <strong>{actionCount}</strong>
          <small>Needs action</small>
          <i /><i /><i />
        </div>

        <div className="documents-paper-stage">
          <i className="documents-paper-shadow sheet-three" aria-hidden="true" />
          <i className="documents-paper-shadow sheet-two" aria-hidden="true" />

          {selectedDocument ? (
            <article className={'documents-paper-preview ' + documentTone(selectedDocument)}>
              <header>
                <div>
                  <span>{selectedDocument.type === OPERATIONAL_DOCUMENT_TYPE.POD ? 'RECEIVER COPY' : 'FREIGHTLINK BROKERAGE'}</span>
                  <strong>{selectedDocument.type === OPERATIONAL_DOCUMENT_TYPE.POD ? 'PROOF OF DELIVERY' : 'RATE CONFIRMATION'}</strong>
                </div>
                <b>{selectedDocument.statusLabel}</b>
              </header>

              <div className="documents-paper-rule" />

              {selectedDocument.type === OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION ? (
                <>
                  <div className="documents-paper-grid">
                    <p><span>LOAD</span><strong>{selectedDocument.loadRef}</strong></p>
                    <p><span>REVISION</span><strong>R{selectedDocument.revision}</strong></p>
                    <p><span>DRIVER</span><strong>{selectedDriver?.name ?? selectedDocument.driverId ?? '—'}</strong></p>
                    <p><span>CONFIRMATION</span><strong>{selectedDocument.documentRecord?.confirmationNumber ?? '—'}</strong></p>
                  </div>
                  <section className="documents-paper-summary">
                    <p><span>RATE</span><strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(selectedDocument.documentRecord?.terms?.rate ?? 0)}</strong></p>
                    <p><span>EQUIPMENT</span><strong>{selectedDocument.documentRecord?.terms?.equipment ?? '—'}</strong></p>
                    <p><span>PAYMENT</span><strong>{selectedDocument.documentRecord?.paymentTerms ?? '—'}</strong></p>
                  </section>
                </>
              ) : (
                <>
                  <div className="documents-paper-grid">
                    <p><span>LOAD</span><strong>{selectedDocument.loadRef}</strong></p>
                    <p><span>RECEIVER</span><strong>{selectedDocument.facilityLabel}</strong></p>
                    <p><span>SIGNATURE</span><strong>{selectedDocument.signaturePresent ? 'PRESENT' : 'PENDING'}</strong></p>
                    <p><span>DELIVERED</span><strong>{selectedDocument.deliveredPieces} units</strong></p>
                  </div>
                  <section className="documents-paper-summary">
                    <p><span>REFUSED</span><strong>{selectedDocument.refusedPieces}</strong></p>
                    <p><span>SHORTAGE</span><strong>{selectedDocument.shortagePieces}</strong></p>
                    <p><span>DAMAGE</span><strong>{selectedDocument.damageNoted ? 'NOTED' : 'NONE'}</strong></p>
                  </section>
                </>
              )}

              <footer>
                <span>{selectedDocument.source}</span>
                {canReview ? (
                  <button type="button" onClick={() => onOpenRateCon(selectedDocument.laneId)}>
                    OPEN PAPER DESK
                  </button>
                ) : (
                  <strong>{selectedDocument.statusLabel}</strong>
                )}
              </footer>
            </article>
          ) : (
            <div className="documents-paper-empty">
              <span>EMPTY DESK</span>
              <strong>Select a file from the cabinet.</strong>
              <small>The selected document will open here without replacing your inspector.</small>
            </div>
          )}
        </div>

        <div className="documents-desk-tray filed" aria-hidden="true">
          <span>FILED</span>
          <strong>{filedCount}</strong>
          <small>Completed records</small>
          <i /><i /><i />
        </div>
      </div>
    </section>
  )
}
export default function DocumentsWorkspace({
  documents = [],
  drivers = [],
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
  const selectedDriver = selectedDocument?.driverId
    ? drivers.find((driver) => driver.id === selectedDocument.driverId) ?? null
    : null

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
            <span>FILING CABINET</span>
            <strong>Documents</strong>
            <small>Browse Rate Cons and delivery files by status.</small>
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
                  <div className="document-row-meta">
                    <span>{document.shortTypeLabel} · {document.loadRef}</span>
                    <strong className={documentTone(document)}>
                      {document.attention && <i>!</i>}
                      {document.statusLabel}
                    </strong>
                  </div>
                  <strong className="document-row-title">{document.title}</strong>
                  <small>
                    {document.type === OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION
                      ? `Revision R${document.revision} · ${document.source}`
                      : document.facilityLabel}
                  </small>
                </div>              </button>
            )
          })}
        </div>
      </aside>

      <DocumentsDesk
        documents={documents}
        selectedDocument={selectedDocument}
        selectedDriver={selectedDriver}
        onOpenRateCon={onOpenRateCon}
      />

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
              <RateConInspector
                document={selectedDocument}
                driverLabel={selectedDriver?.name ?? selectedDocument.driverId ?? '—'}
                onOpenRateCon={onOpenRateCon}
              />
            ) : (
              <PodInspector document={selectedDocument} />
            )}
          </div>
        </aside>
      )}
    </div>
  )
}
