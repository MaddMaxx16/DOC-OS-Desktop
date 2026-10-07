import { DocumentDesk, DraggableDocument } from './DocumentDesk.jsx'
import OperationalDocumentPaper from './OperationalDocumentPaper.jsx'
import './operationalDocumentInspection.css'

export default function OperationalDocumentInspection({
  document,
  driver,
}) {
  if (!document) return null

  return (
    <div className="operational-document-inspection">
      <DocumentDesk className="operational-document-inspection-desk">
        <DraggableDocument
          documentId={document.id}
          className="operational-document-inspection-sheet"
          initialPosition={{ x: 34, y: 18 }}
          ariaLabel={document.title + ' ' + document.loadRef}
        >
          <OperationalDocumentPaper
            document={document}
            driver={driver}
          />
        </DraggableDocument>
      </DocumentDesk>

      <aside className="operational-document-inspection-context">
        <header>
          <span>LOAD FILE · {document.loadRef}</span>
          <strong>{document.title}</strong>
          <small>This is the same paper you selected in Documents.</small>
        </header>

        <div className="operational-document-inspection-details">
          <p><span>TYPE</span><strong>{document.shortTypeLabel}</strong></p>
          <p><span>STATUS</span><strong>{document.statusLabel}</strong></p>
          <p><span>DRIVER</span><strong>{driver?.name ?? document.driverId ?? '—'}</strong></p>
          <p><span>SOURCE</span><strong>{document.source}</strong></p>
        </div>

        <div className="operational-document-inspection-note">
          <span>LOAD PACKET</span>
          <strong>Close this view to return to the Documents workspace.</strong>
          <small>Inspecting a paper never files it, unfiles it, or submits the load packet.</small>
        </div>
      </aside>
    </div>
  )
}