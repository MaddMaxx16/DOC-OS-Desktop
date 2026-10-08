import { useMemo, useState } from 'react'
import {
  DocumentDesk,
  DraggableDocument,
} from './DocumentDesk.jsx'
import OperationalDocumentPaper from './OperationalDocumentPaper.jsx'
import './podReview.css'

function exceptionSignals(document) {
  const signals = []
  if (Number(document?.refusedPieces ?? 0) > 0) {
    signals.push({
      id: 'refused',
      label: 'Refused freight',
      value: `${document.refusedPieces} unit${document.refusedPieces === 1 ? '' : 's'}`,
    })
  }
  if (Number(document?.shortagePieces ?? 0) > 0) {
    signals.push({
      id: 'shortage',
      label: 'Shortage',
      value: `${document.shortagePieces} unit${document.shortagePieces === 1 ? '' : 's'}`,
    })
  }
  if (document?.damageNoted) {
    signals.push({
      id: 'damage',
      label: 'Damage',
      value: 'Damage noted by receiver',
    })
  }
  return signals
}

function defaultCorrectionReason(document) {
  const signals = exceptionSignals(document)
  if (!signals.length) return 'Please reissue the POD with corrected receiver paperwork.'
  return `Please reissue the POD and clarify: ${signals.map((item) => item.label.toLowerCase()).join(', ')}.`
}

export default function PodReview({
  document,
  driver,
  onRequestCorrection,
  onAccept,
}) {
  const [acceptRiskArmed, setAcceptRiskArmed] = useState(false)
  const [correctionReason, setCorrectionReason] = useState(() => defaultCorrectionReason(document))
  const signals = useMemo(() => exceptionSignals(document), [document])
  const hasException = signals.length > 0
  const corrected = Boolean(document?.corrected)

  if (!document) return null

  const reviewLabel = corrected
    ? 'CORRECTED POD'
    : hasException
      ? 'EXCEPTION POD'
      : 'CLEAN POD'

  const accept = () => {
    if (hasException && !acceptRiskArmed) {
      setAcceptRiskArmed(true)
      return
    }
    onAccept({ acceptedWithException: hasException })
  }

  return (
    <div className="pod-review">
      <DocumentDesk className="pod-review-desk">
        <DraggableDocument
          documentId={document.id}
          className="pod-review-sheet"
          initialPosition={{ x: 30, y: 18 }}
          ariaLabel={'Proof of Delivery ' + document.loadRef}
        >
          <OperationalDocumentPaper
            document={document}
            driver={driver}
          />
        </DraggableDocument>
      </DocumentDesk>

      <aside className="pod-review-panel">
        <header>
          <span>DELIVERY PAPERWORK REVIEW</span>
          <strong>{reviewLabel}</strong>
          <small>
            Verify the receiver signature and delivery outcome before this POD can satisfy the load packet.
          </small>
        </header>

        <section className="pod-review-facts">
          <div>
            <span>SIGNATURE</span>
            <strong>{document.signaturePresent ? 'PRESENT' : 'MISSING'}</strong>
          </div>
          <div>
            <span>DELIVERED</span>
            <strong>{document.deliveredPieces} units</strong>
          </div>
          <div className={Number(document.refusedPieces ?? 0) > 0 ? 'issue' : ''}>
            <span>REFUSED</span>
            <strong>{document.refusedPieces}</strong>
          </div>
          <div className={Number(document.shortagePieces ?? 0) > 0 ? 'issue' : ''}>
            <span>SHORTAGE</span>
            <strong>{document.shortagePieces}</strong>
          </div>
          <div className={document.damageNoted ? 'issue' : ''}>
            <span>DAMAGE</span>
            <strong>{document.damageNoted ? 'NOTED' : 'NONE'}</strong>
          </div>
          <div>
            <span>REVISION</span>
            <strong>R{document.revision ?? 1}</strong>
          </div>
        </section>

        {hasException ? (
          <section className="pod-review-exceptions">
            <header>
              <span>DELIVERY EXCEPTIONS</span>
              <strong>{signals.length}</strong>
            </header>
            {signals.map((signal) => (
              <div key={signal.id}>
                <span>!</span>
                <p>
                  <strong>{signal.label}</strong>
                  <small>{signal.value}</small>
                </p>
              </div>
            ))}
          </section>
        ) : (
          <section className="pod-review-clean">
            <span>CLEAN DELIVERY</span>
            <strong>No shortage, refusal, or damage is recorded on this POD.</strong>
            <small>Accepting the document marks it ready to count toward packet completeness once filed.</small>
          </section>
        )}

        {corrected && (
          <section className="pod-review-corrected">
            <span>CORRECTED PAPERWORK</span>
            <strong>This receiver copy was reissued after a correction request.</strong>
            <small>{document.correctionReason ?? 'Review the revised paper before accepting it.'}</small>
          </section>
        )}

        {hasException && (
          <section className="pod-correction-request">
            <label htmlFor="pod-correction-reason">CORRECTION REQUEST</label>
            <textarea
              id="pod-correction-reason"
              value={correctionReason}
              onChange={(event) => setCorrectionReason(event.target.value)}
              rows={3}
            />
            <button
              type="button"
              disabled={!correctionReason.trim()}
              onClick={() => onRequestCorrection(correctionReason.trim())}
            >
              REQUEST CORRECTED POD
            </button>
          </section>
        )}

        {acceptRiskArmed && hasException && (
          <div className="pod-review-risk">
            <strong>ACCEPT DELIVERY EXCEPTION?</strong>
            <p>
              This keeps the shortage/refusal/damage on the load record and accepts the POD as valid paperwork.
            </p>
          </div>
        )}

        <div className="pod-review-actions">
          <button
            type="button"
            className={hasException ? 'warning' : 'primary'}
            onClick={accept}
          >
            {hasException
              ? acceptRiskArmed
                ? 'CONFIRM ACCEPT WITH EXCEPTION'
                : 'ACCEPT WITH EXCEPTION'
              : 'ACCEPT POD'}
          </button>
        </div>
      </aside>
    </div>
  )
}
