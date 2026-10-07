import { OPERATIONAL_DOCUMENT_TYPE } from '../../domain/documents/operationalDocumentIndex.js'
import RateConfirmationPaper from '../rate-confirmation/RateConfirmationPaper.jsx'
import '../rate-confirmation/rateConfirmation.css'
import './operationalDocumentPaper.css'

function PodPaper({ document }) {
  return (
    <article className="pod-paper">
      <header className="pod-paper-header">
        <div>
          <span>RECEIVER COPY</span>
          <strong>PROOF OF DELIVERY</strong>
          <small>Load {document.loadRef}</small>
        </div>
        <div className="pod-paper-status">
          <span>STATUS</span>
          <strong>{document.statusLabel}</strong>
        </div>
      </header>

      <section className="pod-paper-parties">
        <div>
          <span>RECEIVER</span>
          <strong>{document.facilityLabel}</strong>
          <small>Delivery location</small>
        </div>
        <div>
          <span>CARRIER</span>
          <strong>Metroline</strong>
          <small>Driver delivery record</small>
        </div>
      </section>

      <section className="pod-paper-summary">
        <div><span>DELIVERED</span><strong>{document.deliveredPieces}</strong><small>units</small></div>
        <div><span>REFUSED</span><strong>{document.refusedPieces}</strong><small>units</small></div>
        <div><span>SHORTAGE</span><strong>{document.shortagePieces}</strong><small>units</small></div>
        <div><span>DAMAGE</span><strong>{document.damageNoted ? 'YES' : 'NO'}</strong><small>noted</small></div>
      </section>

      <section className="pod-paper-receipt">
        <span>RECEIVER ACKNOWLEDGEMENT</span>
        <p>
          Freight for load <strong>{document.loadRef}</strong> was presented to
          {' '}{document.facilityLabel} and recorded by the receiving operation.
        </p>
      </section>

      <section className="pod-paper-signature">
        <div>
          <span>RECEIVER SIGNATURE</span>
          <strong>{document.signaturePresent ? 'SIGNATURE ON FILE' : 'PENDING RECEIVER'}</strong>
        </div>
        <div>
          <span>DOCUMENT STATE</span>
          <strong>{document.statusLabel}</strong>
        </div>
      </section>

      <footer>
        Retain this POD with the Rate Confirmation, BOL, invoice, and supporting load paperwork.
      </footer>
    </article>
  )
}

export default function OperationalDocumentPaper({
  document,
  driver,
}) {
  if (!document) return null

  if (document.type === OPERATIONAL_DOCUMENT_TYPE.RATE_CONFIRMATION) {
    return (
      <RateConfirmationPaper
        rateCon={document.documentRecord}
        lane={{ laneRef: document.loadRef }}
        driver={driver ?? { name: document.driverId ?? 'Unassigned' }}
        acceptanceLabel={document.status === 'ACCEPTED' ? 'Accepted' : 'Pending acceptance'}
        stampLabel={
          document.status === 'ACCEPTED'
            ? 'ACCEPTED'
            : document.status === 'CORRECTED_RATE_CON_READY'
              ? 'CORRECTED'
              : document.status === 'CORRECTION_REQUESTED'
                ? 'CORRECTION REQUESTED'
                : document.status === 'REVIEW_REQUIRED'
                  ? 'REVIEW REQUIRED'
                  : null
        }
      />
    )
  }

  return <PodPaper document={document} />
}