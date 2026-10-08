import { useEffect, useMemo, useState } from 'react'
import {
  buildOperationalDeskDocuments,
  buildOperationalIncomingDocuments,
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
  { id: 'READY', label: 'SUBMIT READY' },
])

function loadFileMatchesFilter(loadFile, filter) {
  if (filter === 'ACTION') return Boolean(loadFile.attention)
  if (filter === 'ACTIVE') {
    return [
      OPERATIONAL_LOAD_FILE_STATUS.OPEN,
      OPERATIONAL_LOAD_FILE_STATUS.RECEIVER_PROCESSING,
    ].includes(loadFile.status)
  }
  if (filter === 'READY') {
    return loadFile.status === OPERATIONAL_LOAD_FILE_STATUS.SUBMIT_READY
  }
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
  if (loadFile?.status === OPERATIONAL_LOAD_FILE_STATUS.SUBMIT_READY) return 'complete'
  if (loadFile?.status === OPERATIONAL_LOAD_FILE_STATUS.SUBMITTED) return 'submitted'
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
  return document.type === OPERATIONAL_DOCUMENT_TYPE.POD ? 'POD' : 'RATE CON'
}

function findDocumentFile(loadFiles, documentId) {
  return loadFiles.find((loadFile) => (
    loadFile.filedDocuments.some((document) => document.id === documentId)
  )) ?? null
}

function paperStartPosition(index) {
  const column = index % 4
  const row = Math.floor(index / 4)
  return {
    x: 42 + (column * 58) + ((row % 2) * 16),
    y: 82 + (row * 46) + ((column % 2) * 14),
  }
}

function loadFileDropTarget(clientX, clientY) {
  const target = globalThis.document
    ?.elementsFromPoint?.(clientX, clientY)
    ?.map((element) => element.closest?.('[data-load-file-ref]'))
    ?.find(Boolean)

  return target?.dataset?.loadFileRef ?? null
}

function RateConInspector({
  document,
  driverLabel,
  filedLoadRef,
  onInspectDocument,
}) {
  const canReview = documentCanReview(document)
  const filed = Boolean(filedLoadRef)

  return (
    <>
      <div className="document-detail-grid">
        <div><span>DOCUMENT</span><strong>Rate Confirmation</strong></div>
        <div><span>LOAD</span><strong>{document.loadRef}</strong></div>
        <div><span>REVISION</span><strong>R{document.revision}</strong></div>
        <div><span>DRIVER</span><strong>{driverLabel}</strong></div>
        <div><span>LOCATION</span><strong>{filed ? `FILED · ${filedLoadRef}` : 'ON DESK'}</strong></div>
        <div><span>SOURCE</span><strong>{document.brokerName}</strong></div>
        <div className="wide"><span>STATUS</span><strong className={documentTone(document)}>{document.statusLabel}</strong></div>
      </div>

      <section className="document-inspector-section">
        <header><span>WORKFLOW</span></header>
        {canReview ? (
          <div className="document-next-action attention">
            <span>NEXT ACTION</span>
            <strong>Inspect this Rate Confirmation before committing the freight.</strong>
            <small>{filed ? 'Open it from the file to review.' : `You can review it now or file it into ${document.loadRef} first.`}</small>
          </div>
        ) : document.status === 'CORRECTION_REQUESTED' ? (
          <div className="document-next-action waiting">
            <span>WAITING</span>
            <strong>Correction requested from FreightLink Brokerage.</strong>
            <small>The revised paper will arrive in the Incoming tray when it is available.</small>
          </div>
        ) : filed ? (
          <div className="document-next-action complete">
            <span>FILED</span>
            <strong>This accepted Rate Confirmation is inside load file {filedLoadRef}.</strong>
            <small>It counts toward packet completeness while it remains filed.</small>
          </div>
        ) : (
          <div className="document-next-action complete">
            <span>READY TO FILE</span>
            <strong>This accepted Rate Confirmation is still on the desk.</strong>
            <small>Drag it onto load file {document.loadRef} when you are ready to put it away.</small>
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
          <span>{filed ? 'FILED PAPER' : 'DESK PAPER'}</span>
          <strong>{canReview ? 'Review terms before accepting.' : filed ? 'Paper is stored in the load file.' : 'Paper remains loose until you file it.'}</strong>
        </div>
        <button type="button" onClick={() => onInspectDocument(document.id)}>
          {canReview ? 'REVIEW DOCUMENT' : 'INSPECT DOCUMENT'}
        </button>
      </footer>
    </>
  )
}

function PodInspector({
  document,
  filedLoadRef,
  onInspectDocument,
}) {
  const exceptionCount = (
    Number(document.refusedPieces ?? 0)
    + Number(document.shortagePieces ?? 0)
    + (document.damageNoted ? 1 : 0)
  )
  const filed = Boolean(filedLoadRef)

  return (
    <>
      <div className="document-detail-grid">
        <div><span>DOCUMENT</span><strong>Proof of Delivery</strong></div>
        <div><span>LOAD</span><strong>{document.loadRef}</strong></div>
        <div><span>RECEIVER</span><strong>{document.facilityLabel}</strong></div>
        <div><span>SIGNATURE</span><strong>{document.signaturePresent ? 'PRESENT' : 'PENDING'}</strong></div>
        <div><span>LOCATION</span><strong>{filed ? `FILED · ${filedLoadRef}` : 'ON DESK'}</strong></div>
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
            <small>You may file the paper now, but it will not satisfy the POD requirement until receiver verification completes.</small>
          </div>
        ) : document.status === 'REVIEW_REQUIRED' ? (
          <div className="document-next-action attention">
            <span>REVIEW REQUIRED</span>
            <strong>{exceptionCount} delivery exception signal{exceptionCount === 1 ? '' : 's'} require document review.</strong>
            <small>Filing does not resolve the exception or make the packet complete.</small>
          </div>
        ) : filed ? (
          <div className="document-next-action complete">
            <span>FILED</span>
            <strong>Clean POD is inside load file {filedLoadRef}.</strong>
            <small>It now counts toward packet completeness.</small>
          </div>
        ) : (
          <div className="document-next-action complete">
            <span>READY TO FILE</span>
            <strong>Clean POD is still loose on the desk.</strong>
            <small>Drag it onto load file {document.loadRef} to include it in the packet.</small>
          </div>
        )}
      </section>

      <footer className="documents-inspector-footer">
        <div>
          <span>{filed ? 'FILED PAPER' : 'DESK PAPER'}</span>
          <strong>{filed ? 'Paper is stored in the load file.' : 'Paper remains loose until you file it.'}</strong>
        </div>
        <button type="button" onClick={() => onInspectDocument(document.id)}>
          INSPECT DOCUMENT
        </button>
      </footer>
    </>
  )
}

function LoadFileContents({
  loadFile,
  selectedDocumentId,
  onSelectDocument,
  onInspectDocument,
  onUnfileDocument,
  onSubmitLoadFile,
  onNotice,
}) {
  const submit = () => {
    const result = onSubmitLoadFile(loadFile.loadRef)
    onNotice(result)
  }

  const unfile = (documentId) => {
    const result = onUnfileDocument(documentId)
    onNotice(result)
  }

  return (
    <div className="load-file-expanded">
      <div className="load-file-requirements">
        <header>
          <span>CURRENT REQUIRED PACKET</span>
          <strong>{loadFile.satisfiedRequirementCount}/{loadFile.requiredCount}</strong>
        </header>
        {loadFile.requirements.map((requirement) => (
          <div
            key={requirement.type}
            className={'load-file-requirement ' + (requirement.satisfied ? 'satisfied' : requirement.filed ? 'filed-pending' : 'missing')}
          >
            <i>{requirement.satisfied ? '✓' : requirement.filed ? '•' : '○'}</i>
            <span>{requirement.label}</span>
            <strong>
              {requirement.satisfied
                ? 'COMPLETE'
                : requirement.filed
                  ? requirement.status?.replaceAll('_', ' ') ?? 'FILED'
                  : 'MISSING'}
            </strong>
          </div>
        ))}
      </div>

      <div className="load-file-filed-papers">
        <header>
          <span>IN FILE</span>
          <strong>{loadFile.filedCount}</strong>
        </header>
        {loadFile.filedDocuments.length === 0 ? (
          <div className="load-file-no-papers">No paperwork filed yet.</div>
        ) : loadFile.filedDocuments.map((document) => (
          <div
            key={document.id}
            className={'filed-paper-row ' + (selectedDocumentId === document.id ? 'selected ' : '') + documentTone(document)}
          >
            <button type="button" onClick={() => onSelectDocument(document.id)}>
              <span>{documentLabel(document)}</span>
              <strong>{document.statusLabel}</strong>
            </button>
            <div>
              <button type="button" onClick={() => onInspectDocument(document.id)}>OPEN</button>
              <button
                type="button"
                disabled={loadFile.submitted}
                onClick={() => unfile(document.id)}
              >
                RETURN TO DESK
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={'load-file-submit ' + (loadFile.canSubmit ? 'ready' : '')}
        disabled={!loadFile.canSubmit || loadFile.submitted}
        onClick={submit}
      >
        {loadFile.submitted
          ? 'PACKET SUBMITTED'
          : loadFile.canSubmit
            ? 'SUBMIT LOAD FILE'
            : 'PACKET INCOMPLETE'}
      </button>
      <small className="load-file-submit-note">
        Submission requires every currently implemented required document to be filed in acceptable status. Future BOL/invoice requirements plug into this same checklist.
      </small>
    </div>
  )
}

function GlobalPaperDesk({
  loadFiles,
  drivers,
  selectedDocumentId,
  onSelectDocument,
  onInspectDocument,
  onFileDocument,
  onMoveDocumentToDesk,
  onNotice,
  onDropTargetChange,
}) {
  const incomingDocuments = useMemo(
    () => buildOperationalIncomingDocuments(loadFiles),
    [loadFiles],
  )
  const deskDocuments = useMemo(
    () => buildOperationalDeskDocuments(loadFiles),
    [loadFiles],
  )

  const handlePaperDragMove = (clientX, clientY) => {
    onDropTargetChange(loadFileDropTarget(clientX, clientY))
  }

  const handlePaperDrop = (documentId, clientX, clientY, cancelled) => {
    const targetLoadRef = cancelled ? null : loadFileDropTarget(clientX, clientY)
    onDropTargetChange(null)
    if (!targetLoadRef) return

    const result = onFileDocument(documentId, targetLoadRef)
    onNotice(result)
  }

  const moveToDesk = (documentId) => {
    const result = onMoveDocumentToDesk(documentId)
    onNotice(result)
  }

  return (
    <section className="documents-desk-workspace" aria-label="Documents incoming tray and working desk">
      <header className="documents-desk-header">
        <div>
          <span>WORKING PAPER DESK</span>
          <strong>{deskDocuments.length} on desk · {incomingDocuments.length} incoming</strong>
          <small>New paperwork enters Incoming first. Pull out only what you want to work.</small>
        </div>
        <div className="desk-rule-card">
          <span>WORKFLOW</span>
          <strong>Incoming → Desk → File</strong>
        </div>
      </header>

      <DocumentDesk className="global-paper-desk">
        <aside className={'incoming-paper-tray ' + (incomingDocuments.length ? 'has-paper' : 'empty')} aria-label="Incoming paperwork tray">
          <header>
            <div>
              <span>INCOMING</span>
              <strong>{incomingDocuments.length}</strong>
            </div>
            <small>New paperwork</small>
          </header>

          <div className="incoming-paper-stack">
            {incomingDocuments.length === 0 ? (
              <div className="incoming-tray-empty">
                <strong>Tray empty</strong>
                <small>New operational paperwork will arrive here.</small>
              </div>
            ) : incomingDocuments.map((document) => (
              <button
                type="button"
                key={document.id}
                className={'incoming-paper-card ' + documentTone(document)}
                onClick={() => moveToDesk(document.id)}
              >
                <div>
                  <span>{documentLabel(document)}</span>
                  <strong>{document.loadRef}</strong>
                </div>
                <small>{document.statusLabel}</small>
                <em>PULL TO DESK</em>
              </button>
            ))}
          </div>
        </aside>

        {deskDocuments.length === 0 ? (
          <div className="global-desk-empty">
            <span>DESK CLEAR</span>
            <strong>No paperwork is being worked.</strong>
            <small>{incomingDocuments.length ? 'Pull a paper from Incoming when you are ready to work it.' : 'Incoming paperwork will collect in the tray when it arrives.'}</small>
          </div>
        ) : (
          deskDocuments.map((document, index) => {
            const selected = document.id === selectedDocumentId
            const paperDriver = drivers.find((driver) => driver.id === document.driverId) ?? null
            return (
              <DraggableDocument
                key={document.id}
                documentId={document.id}
                initialPosition={paperStartPosition(index)}
                className={'global-desk-paper ' + (selected ? 'selected ' : '') + documentTone(document)}
                onClick={() => onSelectDocument(document.id)}
                onDoubleClick={() => onInspectDocument(document.id)}
                onDragMove={({ clientX, clientY }) => handlePaperDragMove(clientX, clientY)}
                onDragEnd={({ documentId, clientX, clientY, cancelled }) => handlePaperDrop(documentId, clientX, clientY, cancelled)}
                ariaLabel={documentLabel(document) + ' ' + document.loadRef + '. Drag to its load file or double-click to inspect.'}
              >
                <div className="global-desk-paper-scale">
                  <OperationalDocumentPaper
                    document={document}
                    driver={paperDriver}
                  />
                </div>
                <div className="global-desk-paper-tab">
                  <span>{documentLabel(document)} · {document.loadRef}</span>
                  <strong>{document.statusLabel}</strong>
                </div>
              </DraggableDocument>
            )
          })
        )}
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
  onFileDocument,
  onMoveDocumentToDesk,
  onUnfileDocument,
  onSubmitLoadFile,
  onClose,
}) {
  const [filter, setFilter] = useState('ALL')
  const [expandedFileId, setExpandedFileId] = useState(null)
  const [notice, setNotice] = useState(null)
  const [dropTargetLoadRef, setDropTargetLoadRef] = useState(null)

  const filteredLoadFiles = useMemo(
    () => loadFiles.filter((loadFile) => loadFileMatchesFilter(loadFile, filter)),
    [filter, loadFiles],
  )

  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null
  const selectedDocumentFile = selectedDocument
    ? findDocumentFile(loadFiles, selectedDocument.id)
    : null
  const selectedDriver = selectedDocument?.driverId
    ? drivers.find((driver) => driver.id === selectedDocument.driverId) ?? null
    : null

  useEffect(() => {
    if (selectedDocumentId && documents.some((document) => document.id === selectedDocumentId)) return
    onSelectDocument(null)
  }, [documents, onSelectDocument, selectedDocumentId])

  const handleNotice = (result) => {
    if (!result?.message) return
    setNotice({
      tone: result.ok ? 'success' : 'error',
      message: result.message,
    })
  }

  const toggleLoadFile = (loadFile) => {
    setExpandedFileId((current) => current === loadFile.id ? null : loadFile.id)
  }

  return (
    <div className="documents-workspace">
      <aside className="workstation-browser documents-browser" aria-label="Load files">
        <header className="workstation-panel-header documents-browser-header">
          <div>
            <span>FILING CABINET</span>
            <strong>Load Files</strong>
            <small>Folders stay here. Incoming paperwork moves to the desk only when you pull it out.</small>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Documents">×</button>
        </header>

        <div className="documents-filters" aria-label="Load file filters">
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

        {notice && (
          <button
            type="button"
            className={'filing-notice ' + notice.tone}
            onClick={() => setNotice(null)}
            aria-label="Dismiss filing notice"
          >
            {notice.message}
          </button>
        )}

        <div className="load-file-list">
          {filteredLoadFiles.length === 0 ? (
            <div className="documents-empty">
              <strong>NO LOAD FILES</strong>
              <small>No load files match this cabinet filter.</small>
            </div>
          ) : filteredLoadFiles.map((loadFile) => {
            const expanded = expandedFileId === loadFile.id
            const driver = fileDriver(loadFile, drivers)

            return (
              <div
                key={loadFile.id}
                className={
                  'load-file-entry '
                  + (expanded ? 'expanded ' : '')
                  + (dropTargetLoadRef === loadFile.loadRef ? 'drop-target ' : '')
                  + fileTone(loadFile)
                }
                data-load-file-ref={loadFile.loadRef}
              >
                <button
                  type="button"
                  className="load-file-row"
                  onClick={() => toggleLoadFile(loadFile)}
                  aria-expanded={expanded}
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
                    <small>{driver?.name ?? 'Unassigned'} · {loadFile.satisfiedRequirementCount}/{loadFile.requiredCount} required complete</small>
                    <div className="load-file-progress">
                      <i style={{ '--file-progress': `${loadFile.requiredCount ? (loadFile.satisfiedRequirementCount / loadFile.requiredCount) * 100 : 0}%` }} />
                    </div>
                  </div>
                </button>

                {expanded && (
                  <LoadFileContents
                    loadFile={loadFile}
                    selectedDocumentId={selectedDocumentId}
                    onSelectDocument={onSelectDocument}
                    onInspectDocument={onInspectDocument}
                    onUnfileDocument={onUnfileDocument}
                    onSubmitLoadFile={onSubmitLoadFile}
                    onNotice={handleNotice}
                  />
                )}
              </div>
            )
          })}
        </div>
      </aside>

      <GlobalPaperDesk
        loadFiles={loadFiles}
        drivers={drivers}
        selectedDocumentId={selectedDocumentId}
        onSelectDocument={onSelectDocument}
        onInspectDocument={onInspectDocument}
        onFileDocument={onFileDocument}
        onMoveDocumentToDesk={onMoveDocumentToDesk}
        onNotice={handleNotice}
        onDropTargetChange={setDropTargetLoadRef}
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
                filedLoadRef={selectedDocumentFile?.loadRef ?? null}
                onInspectDocument={onInspectDocument}
              />
            ) : (
              <PodInspector
                document={selectedDocument}
                filedLoadRef={selectedDocumentFile?.loadRef ?? null}
                onInspectDocument={onInspectDocument}
              />
            )}
          </div>
        </aside>
      )}
    </div>
  )
}
