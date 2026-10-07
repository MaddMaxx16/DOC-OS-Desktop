import { useEffect, useMemo, useState } from 'react'
import {
  OPERATIONAL_DOCUMENT_TYPE,
  OPERATIONAL_LOAD_FILE_STATUS,
} from '../../domain/documents/operationalDocumentIndex.js'
import {
  DocumentDesk,
  DraggableDocument,
} from './DocumentDesk.jsx'
import OperationalDocumentPaper from './OperationalDocumentPaper.jsx'
import './documentsWorkspace.css'

const FILE_FILTERS = Object.freeze([
  { id: 'ALL', label: 'ALL FILES' },
  { id: 'ACTION', label: 'NEEDS ACTION' },
  { id: 'ACTIVE', label: 'ACTIVE' },
  { id: 'READY', label: 'READY TO BILL' },
])

function loadFileMatchesFilter(loadFile, filter) {
  if (filter === 'ACTION') return Boolean(loadFile.attention)
  if (filter === 'ACTIVE') {
    return [
      OPERATIONAL_LOAD_FILE_STATUS.OPEN,
      OPERATIONAL_LOAD_FILE_STATUS.RECEIVER_PROCESSING,
    ].includes(loadFile.status)
  }
  if (filter === 'READY') return loadFile.status === OPERATIONAL_LOAD_FILE_STATUS.READY_TO_BILL
  return true
}

function documentTone(document) {
  if (document?.attention) return 'attention'
  if (['ACCEPTED', 'RECEIVED'].includes(document?.status)) return 'complete'
  if (['CORRECTION_REQUESTED', 'PENDING_RECEIVER'].includes(document?.status)) return 'waiting'
  return 'neutral'
}

function fileTone(loadFile) {
  if (loadFile?.attention) return 'attention'
  if (loadFile?.status === OPERATIONAL_LOAD_FILE_STATUS.READY_TO_BILL) return 'complete'
  if (loadFile?.status === OPERATIONAL_LOAD_FILE_STATUS.RECEIVER_PROCESSING) return 'waiting'
  return 'neutral'
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

function fileDriver(loadFile, drivers) {
  if (!loadFile?.driverId) return null
  return drivers.find((driver) => driver.id === loadFile.driverId) ?? null
}

function documentLabel(document) {
  if (document.type === OPERATIONAL_DOCUMENT_TYPE.POD) return 'POD'
  return 'RATE CON'
}

function nextDocumentForFile(loadFile, selectedDocumentId) {
  if (!loadFile?.documents?.length) return null
  const current = loadFile.documents.find((document) => document.id === selectedDocumentId)
  if (current) return current
  return loadFile.documents.find((document) => document.attention) ?? loadFile.documents[0]
}

function RateConInspector({ document, driverLabel, onInspectDocument }) {
  const canReview = documentCanReview(document)

  return (
    <>
      <div className="document-detail-grid">
        <div><span>DOCUMENT</span><strong>Rate Confirmation</strong></div>
        <div><span>LOAD FILE</span><strong>{document.loadRef}</strong></div>
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
            <strong>Inspect this Rate Confirmation before committing the freight.</strong>
            <small>Double-click the paper on the desk or use the review button below.</small>
          </div>
        ) : document.status === 'CORRECTION_REQUESTED' ? (
          <div className="document-next-action waiting">
            <span>WAITING</span>
            <strong>Correction requested from FreightLink Brokerage.</strong>
            <small>The revised paper will be added back to this load file when it arrives.</small>
          </div>
        ) : (
          <div className="document-next-action complete">
            <span>IN LOAD FILE</span>
            <strong>This accepted Rate Confirmation remains with the active load packet.</strong>
            <small>The file stays open until billing and load closeout are complete.</small>
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
          <strong>{canReview ? 'Inspect the paper and compare its terms.' : 'Paper remains inside this load file.'}</strong>
        </div>
        <button type="button" onClick={() => onInspectDocument(document.id)}>
          {canReview ? 'REVIEW DOCUMENT' : 'INSPECT DOCUMENT'}
        </button>
      </footer>
    </>
  )
}

function PodInspector({ document, onInspectDocument }) {
  const exceptionCount = (
    Number(document.refusedPieces ?? 0)
    + Number(document.shortagePieces ?? 0)
    + (document.damageNoted ? 1 : 0)
  )

  return (
    <>
      <div className="document-detail-grid">
        <div><span>DOCUMENT</span><strong>Proof of Delivery</strong></div>
        <div><span>LOAD FILE</span><strong>{document.loadRef}</strong></div>
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
            <small>This paper will update inside the same load file when receiver verification completes.</small>
          </div>
        ) : document.status === 'REVIEW_REQUIRED' ? (
          <div className="document-next-action attention">
            <span>REVIEW REQUIRED</span>
            <strong>{exceptionCount} delivery exception signal{exceptionCount === 1 ? '' : 's'} require document review.</strong>
            <small>The exception stays attached to this load file until resolved.</small>
          </div>
        ) : (
          <div className="document-next-action complete">
            <span>IN LOAD FILE</span>
            <strong>Clean POD received with receiver signature.</strong>
            <small>This paper now travels with the rest of the load packet toward billing.</small>
          </div>
        )}
      </section>

      <footer className="documents-inspector-footer">
        <div>
          <span>{document.statusLabel}</span>
          <strong>{
            document.status === 'REVIEW_REQUIRED'
              ? 'Document needs attention.'
              : document.status === 'PENDING_RECEIVER'
                ? 'Waiting for receiver verification.'
                : 'POD is part of the active load packet.'
          }</strong>
        </div>
        <button type="button" onClick={() => onInspectDocument(document.id)}>
          INSPECT DOCUMENT
        </button>
      </footer>
    </>
  )
}

function LoadFileDesk({
  loadFile,
  drivers,
  selectedDocumentId,
  onSelectDocument,
  onInspectDocument,
}) {
  if (!loadFile) {
    return (
      <section className="documents-desk-workspace empty" aria-label="Load file desk">
        <div className="load-file-empty">
          <span>EMPTY DESK</span>
          <strong>Select a load file from the cabinet.</strong>
          <small>Rate Cons, PODs, and future load paperwork stay packaged by load.</small>
        </div>
      </section>
    )
  }

  const driver = fileDriver(loadFile, drivers)

  return (
    <section className="documents-desk-workspace" aria-label={'Load file ' + loadFile.loadRef}>
      <header className="documents-desk-header">
        <div>
          <span>LOAD FILE</span>
          <strong>{loadFile.loadRef}</strong>
          <small>{driver?.name ?? 'Unassigned driver'} · {loadFile.documentCount} paper{loadFile.documentCount === 1 ? '' : 's'}</small>
        </div>
        <div className={'load-file-state ' + fileTone(loadFile)}>
          <span>FILE STATUS</span>
          <strong>{loadFile.statusLabel}</strong>
        </div>
      </header>

      <DocumentDesk className="load-file-document-desk">
        <div className="load-file-folder" aria-hidden="true">
          <div className="load-file-folder-tab">
            <span>METROLINE · LOAD FILE</span>
            <strong>{loadFile.loadRef}</strong>
          </div>
          <div className="load-file-folder-body">
            <div>
              <span>DRIVER</span>
              <strong>{driver?.name ?? 'Unassigned'}</strong>
            </div>
            <div>
              <span>PAPERS</span>
              <strong>{loadFile.documentCount}</strong>
            </div>
            <div>
              <span>STATUS</span>
              <strong>{loadFile.statusLabel}</strong>
            </div>
          </div>
        </div>

        <div className="load-file-desk-instruction">
          <span>WORKING FILE</span>
          <strong>Drag papers to arrange · double-click to inspect</strong>
        </div>

        {loadFile.documents.map((document, index) => {
          const selected = document.id === selectedDocumentId
          const paperDriver = drivers.find((item) => item.id === document.driverId) ?? driver
          const column = index % 3
          const row = Math.floor(index / 3)
          const initialPosition = {
            x: 58 + (column * 58),
            y: 96 + (row * 48),
          }

          return (
            <DraggableDocument
              key={document.id}
              documentId={document.id}
              initialPosition={initialPosition}
              className={'load-file-document-sheet ' + (selected ? 'selected ' : '') + documentTone(document)}
              onClick={() => onSelectDocument(document.id)}
              onDoubleClick={() => onInspectDocument(document.id)}
              ariaLabel={documentLabel(document) + ' ' + document.loadRef + '. Double-click to inspect.'}
            >
              <div className="load-file-paper-scale">
                <OperationalDocumentPaper
                  document={document}
                  driver={paperDriver}
                />
              </div>
              <div className="load-file-paper-tab">
                <span>{documentLabel(document)}</span>
                <strong>{document.statusLabel}</strong>
              </div>
            </DraggableDocument>
          )
        })}

        <div className="load-file-package-note">
          <span>LOAD PACKET</span>
          <strong>{loadFile.documentCount} paper{loadFile.documentCount === 1 ? '' : 's'} collected</strong>
          <small>
            {loadFile.status === OPERATIONAL_LOAD_FILE_STATUS.READY_TO_BILL
              ? 'Operational paperwork is ready for the billing step.'
              : 'This file stays open while the load is active and paperwork is still arriving.'}
          </small>
        </div>
      </DocumentDesk>
    </section>
  )
}

export default function DocumentsWorkspace({
  documents = [],
  loadFiles = [],
  drivers = [],
  selectedDocumentId,
  onSelectDocument,
  onInspectDocument,
  onClose,
}) {
  const [filter, setFilter] = useState('ALL')

  const filteredLoadFiles = useMemo(
    () => loadFiles.filter((loadFile) => loadFileMatchesFilter(loadFile, filter)),
    [filter, loadFiles],
  )

  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null
  const selectedLoadFile = (
    loadFiles.find((loadFile) => loadFile.documents.some((document) => document.id === selectedDocumentId))
    ?? loadFiles.find((loadFile) => loadFile.attention)
    ?? loadFiles[0]
    ?? null
  )
  const selectedDriver = selectedDocument?.driverId
    ? drivers.find((driver) => driver.id === selectedDocument.driverId) ?? null
    : fileDriver(selectedLoadFile, drivers)

  useEffect(() => {
    if (selectedDocumentId && documents.some((document) => document.id === selectedDocumentId)) return
    const firstFile = loadFiles.find((loadFile) => loadFile.attention) ?? loadFiles[0]
    const nextDocument = nextDocumentForFile(firstFile, null)
    onSelectDocument(nextDocument?.id ?? null)
  }, [documents, loadFiles, onSelectDocument, selectedDocumentId])

  const chooseLoadFile = (loadFile) => {
    const nextDocument = nextDocumentForFile(loadFile, selectedDocumentId)
    onSelectDocument(nextDocument?.id ?? null)
  }

  return (
    <div className="documents-workspace">
      <aside className="workstation-browser documents-browser" aria-label="Load files">
        <header className="workstation-panel-header documents-browser-header">
          <div>
            <span>FILING CABINET</span>
            <strong>Load Files</strong>
            <small>One working file per load. Paperwork stays together through closeout.</small>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Documents">×</button>
        </header>

        <div className="documents-filters load-file-filters" aria-label="Load file filters">
          {FILE_FILTERS.map((item) => {
            const count = loadFiles.filter((loadFile) => loadFileMatchesFilter(loadFile, item.id)).length
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

        <div className="load-file-list">
          {filteredLoadFiles.length === 0 ? (
            <div className="documents-empty">
              <strong>NO LOAD FILES</strong>
              <small>No load files match this cabinet filter.</small>
            </div>
          ) : filteredLoadFiles.map((loadFile) => {
            const selected = selectedLoadFile?.id === loadFile.id
            const driver = fileDriver(loadFile, drivers)
            return (
              <button
                type="button"
                key={loadFile.id}
                className={'load-file-row ' + (selected ? 'selected ' : '') + fileTone(loadFile)}
                onClick={() => chooseLoadFile(loadFile)}
                aria-pressed={selected}
              >
                <div className="load-file-folder-mark" aria-hidden="true">
                  <span>{loadFile.loadRef}</span>
                </div>
                <div className="load-file-row-copy">
                  <div>
                    <span>LOAD FILE</span>
                    <strong className={fileTone(loadFile)}>{loadFile.statusLabel}</strong>
                  </div>
                  <b>{loadFile.loadRef}</b>
                  <small>{driver?.name ?? 'Unassigned'} · {loadFile.documentCount} paper{loadFile.documentCount === 1 ? '' : 's'}</small>
                  <div className="load-file-document-chips">
                    {loadFile.documents.map((document) => (
                      <i key={document.id} className={documentTone(document)}>
                        {documentLabel(document)}
                      </i>
                    ))}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <LoadFileDesk
        loadFile={selectedLoadFile}
        drivers={drivers}
        selectedDocumentId={selectedDocumentId}
        onSelectDocument={onSelectDocument}
        onInspectDocument={onInspectDocument}
      />

      {selectedDocument && (
        <aside className="workstation-inspector documents-inspector" aria-label={selectedDocument.title + ' details'}>
          <header className="workstation-panel-header documents-inspector-header">
            <div>
              <span>{selectedDocument.shortTypeLabel} · {selectedDocument.loadRef}</span>
              <strong>{selectedDocument.title}</strong>
              <small>{selectedDocument.source}</small>
            </div>
            <div className={'documents-status-badge ' + documentTone(selectedDocument)}>
              <span>STATUS</span>
              <strong>{selectedDocument.statusLabel}</strong>
            </div>
          </header>

          <div className="documents-inspector-scroll">
            {selectedDocument.type === OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION ? (
              <RateConInspector
                document={selectedDocument}
                driverLabel={selectedDriver?.name ?? selectedDocument.driverId ?? '—'}
                onInspectDocument={onInspectDocument}
              />
            ) : (
              <PodInspector
                document={selectedDocument}
                onInspectDocument={onInspectDocument}
              />
            )}
          </div>
        </aside>
      )}
    </div>
  )
}
