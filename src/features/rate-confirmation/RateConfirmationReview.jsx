import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  DocumentDesk,
  DraggableDocument,
} from '../documents/DocumentDesk.jsx'
import { compareRateConfirmationToLane } from '../../domain/booking/rateConfirmation.js'
import { formatClock } from '../../domain/manifest/driverDayModel.js'
import './rateConfirmation.css'

function money(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

function windowLabel(window) {
  return `${formatClock(window?.startMinutes)} – ${formatClock(window?.endMinutes)}`
}

function referenceValue(check, locations) {
  if (check.id === 'rate') return money(check.expected)
  if (check.id === 'pickup' || check.id === 'delivery') {
    return locations[check.expected]?.label ?? check.expected
  }
  if (check.id.endsWith('-window')) return windowLabel(check.expected)
  return String(check.expected ?? '—')
}

export default function RateConfirmationReview({
  lane,
  driver,
  bookingRecord,
  locations,
  onRequestCorrection,
  onConfirm,
}) {
  const [reviewChoices, setReviewChoices] = useState({})
  const [acceptRiskArmed, setAcceptRiskArmed] = useState(false)
  const [highlightField, setHighlightField] = useState(null)
  const highlightTimerRef = useRef(null)
  const rateCon = bookingRecord?.rateConfirmation
  const checks = useMemo(
    () => compareRateConfirmationToLane(rateCon, lane),
    [lane, rateCon],
  )

  useEffect(() => () => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
  }, [])

  if (!lane || !driver || !rateCon) return null

  const reviewedCount = checks.filter((check) => reviewChoices[check.id]).length
  const flaggedChecks = checks.filter((check) => reviewChoices[check.id] === 'issue')
  const allReviewed = reviewedCount === checks.length
  const actualMismatches = checks.filter((check) => !check.matches)
  const hasFlaggedIssue = flaggedChecks.length > 0

  const pulsePaperField = (fieldId) => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    setHighlightField(null)

    requestAnimationFrame(() => {
      setHighlightField(fieldId)
      highlightTimerRef.current = setTimeout(() => {
        setHighlightField(null)
      }, 900)
    })
  }

  const choose = (checkId, choice) => {
    setReviewChoices((current) => ({ ...current, [checkId]: choice }))
    setAcceptRiskArmed(false)
    if (choice === 'issue') pulsePaperField(checkId)
  }

  const correctionReason = flaggedChecks
    .map((check) => `${check.label} flagged during carrier review.`)
    .join(' ')

  const handleConfirm = () => {
    if (!allReviewed) return

    if (hasFlaggedIssue && !acceptRiskArmed) {
      setAcceptRiskArmed(true)
      return
    }

    onConfirm({ acceptedWithMismatch: actualMismatches.length > 0 })
  }

  const reviewStatus = !allReviewed
    ? `${reviewedCount}/${checks.length} REVIEWED`
    : hasFlaggedIssue
      ? `${flaggedChecks.length} ISSUE${flaggedChecks.length > 1 ? 'S' : ''} FLAGGED`
      : 'REVIEW COMPLETE'

  const paperFieldClass = (fieldId) => [
    reviewChoices[fieldId] === 'issue' ? 'ratecon-field-issue' : '',
    highlightField === fieldId ? 'ratecon-field-highlight' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="ratecon-review">
      <DocumentDesk className="ratecon-desk">
        <DraggableDocument
          documentId={rateCon.id}
          className="ratecon-sheet"
          initialPosition={{ x: 26, y: 18 }}
        >
          <article className="ratecon-paper">
            <header className="ratecon-paper-header">
              <div>
                <span>FREIGHTLINK BROKERAGE</span>
                <strong>RATE / LOAD CONFIRMATION</strong>
                <small>Confirmation #{rateCon.confirmationNumber}</small>
              </div>
              <div className="ratecon-revision">
                <span>REV</span>
                <strong>{rateCon.revision}</strong>
                <small>{rateCon.corrected ? 'CORRECTED' : 'ORIGINAL'}</small>
              </div>
            </header>

            <div className="ratecon-document-meta">
              <div><span>ISSUED</span><strong>{rateCon.issuedAtLabel}</strong></div>
              <div><span>LOAD</span><strong>{lane.laneRef}</strong></div>
              <div><span>PAYMENT</span><strong>{rateCon.paymentTerms}</strong></div>
            </div>

            <section className="ratecon-party-lines">
              <div>
                <span>BROKER / CONTACT</span>
                <strong>{rateCon.broker.name}</strong>
                <small>{rateCon.broker.contact} · {rateCon.broker.phone}</small>
              </div>
              <div>
                <span>CARRIER</span>
                <strong>{rateCon.carrier.name}</strong>
                <small>{rateCon.carrier.operatingArea} · Driver: {driver.name}</small>
              </div>
            </section>

            <section
              className={`ratecon-rate-line ${paperFieldClass('rate')}`}
              data-ratecon-field="rate"
            >
              <div>
                <span>AGREED LINEHAUL</span>
                <small>All-in unless separately authorized</small>
              </div>
              <strong>{money(rateCon.terms.rate)}</strong>
            </section>

            <section className="ratecon-stops-table">
              <div
                className={paperFieldClass('pickup')}
                data-ratecon-field="pickup"
              >
                <b>1</b>
                <span>SHIPPER / PICKUP</span>
                <strong>{rateCon.terms.pickupLocationLabel}</strong>
                <small
                  className={paperFieldClass('pickup-window')}
                  data-ratecon-field="pickup-window"
                >
                  Appointment: {windowLabel(rateCon.terms.pickupWindow)}
                </small>
              </div>
              <div
                className={paperFieldClass('delivery')}
                data-ratecon-field="delivery"
              >
                <b>2</b>
                <span>CONSIGNEE / DELIVERY</span>
                <strong>{rateCon.terms.deliveryLocationLabel}</strong>
                <small
                  className={paperFieldClass('delivery-window')}
                  data-ratecon-field="delivery-window"
                >
                  Appointment: {windowLabel(rateCon.terms.deliveryWindow)}
                </small>
              </div>
            </section>

            <section className="ratecon-freight-table">
              <div><span>PALLETS</span><strong>{rateCon.terms.freight.pallets}</strong></div>
              <div><span>WEIGHT</span><strong>{Math.round(rateCon.terms.freight.weightLbs / 1000)}K LB</strong></div>
              <div
                className={paperFieldClass('equipment')}
                data-ratecon-field="equipment"
              >
                <span>EQUIPMENT</span>
                <strong>{rateCon.terms.equipment}</strong>
              </div>
              <div><span>TRACKING</span><strong>REQUIRED</strong></div>
            </section>

            <section className="ratecon-terms">
              <span>TERMS / ACCESSORIALS</span>
              <p>{rateCon.trackingRequirement}.</p>
              <p>{rateCon.accessorialTerms}</p>
              <p>{rateCon.notes}</p>
            </section>

            <section className="ratecon-legal-copy">
              <p>
                Carrier agrees to perform transportation under the terms listed above.
                Changes to rate, appointments, equipment, or accessorial terms require
                written broker authorization.
              </p>
            </section>

            <div className="ratecon-signature-row">
              <div>
                <span>CARRIER ACCEPTANCE</span>
                <strong>Metroline / Dispatch</strong>
              </div>
              <div>
                <span>DATE / TIME</span>
                <strong>Pending acceptance</strong>
              </div>
            </div>

            <footer className="ratecon-paper-footer">
              <span>Retain this confirmation with the load paperwork and signed POD.</span>
            </footer>
          </article>
        </DraggableDocument>
      </DocumentDesk>

      <aside className="ratecon-verification">
        <header>
          <span>FREIGHTLINK REFERENCE</span>
          <strong>{reviewStatus}</strong>
          <small>
            Read the broker document yourself. FreightLink only shows what you agreed to.
          </small>
        </header>

        <div className="ratecon-check-list">
          {checks.map((check) => {
            const choice = reviewChoices[check.id] ?? null
            return (
              <div className={`ratecon-check ${choice ? `reviewed ${choice}` : ''}`} key={check.id}>
                <div className="ratecon-check-heading">
                  <span>{choice === 'match' ? 'M' : choice === 'issue' ? '!' : '—'}</span>
                  <strong>{check.label}</strong>
                </div>

                <div className="ratecon-reference-value">
                  <span>FREIGHTLINK SAYS</span>
                  <strong>{referenceValue(check, locations)}</strong>
                </div>

                <div className="ratecon-choice-row">
                  <button
                    type="button"
                    className={choice === 'match' ? 'active match' : ''}
                    onClick={() => choose(check.id, 'match')}
                  >
                    MATCH
                  </button>
                  <button
                    type="button"
                    className={choice === 'issue' ? 'active issue' : ''}
                    onClick={() => choose(check.id, 'issue')}
                  >
                    ISSUE
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {acceptRiskArmed && hasFlaggedIssue && (
          <div className="ratecon-risk-warning">
            <strong>YOU FLAGGED AN ISSUE.</strong>
            <p>
              Accepting anyway commits the broker document exactly as written.
              Request correction if you want the broker to revise it first.
            </p>
          </div>
        )}

        <div className="ratecon-review-actions">
          {hasFlaggedIssue && (
            <button
              type="button"
              className="ratecon-correction-button"
              disabled={!allReviewed}
              onClick={() => onRequestCorrection(correctionReason)}
            >
              REQUEST CORRECTION
            </button>
          )}
          <button
            type="button"
            className={`ratecon-confirm-button ${hasFlaggedIssue ? 'warning' : ''}`}
            disabled={!allReviewed}
            onClick={handleConfirm}
          >
            {!allReviewed
              ? 'REVIEW ALL TERMS'
              : hasFlaggedIssue && !acceptRiskArmed
                ? 'ACCEPT AS WRITTEN'
                : hasFlaggedIssue
                  ? 'CONFIRM ANYWAY + ASSIGN'
                  : 'ACCEPT + ASSIGN'}
          </button>
        </div>
      </aside>
    </div>
  )
}
