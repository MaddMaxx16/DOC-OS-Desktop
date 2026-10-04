import { useMemo, useState } from 'react'
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

function checkValue(check, value, locations) {
  if (check.id === 'rate') return money(value)
  if (check.id === 'pickup' || check.id === 'delivery') {
    return locations[value]?.label ?? value
  }
  if (check.id.endsWith('-window')) return windowLabel(value)
  return String(value ?? '—')
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
  const rateCon = bookingRecord?.rateConfirmation
  const checks = useMemo(
    () => compareRateConfirmationToLane(rateCon, lane),
    [lane, rateCon],
  )

  if (!lane || !driver || !rateCon) return null

  const reviewedCount = checks.filter((check) => reviewChoices[check.id]).length
  const flaggedChecks = checks.filter((check) => reviewChoices[check.id] === 'issue')
  const allReviewed = reviewedCount === checks.length
  const actualMismatches = checks.filter((check) => !check.matches)
  const hasFlaggedIssue = flaggedChecks.length > 0

  const choose = (checkId, choice) => {
    setReviewChoices((current) => ({ ...current, [checkId]: choice }))
    setAcceptRiskArmed(false)
  }

  const correctionReason = flaggedChecks
    .map((check) => (
      `${check.label}: FreightLink ${checkValue(check, check.expected, locations)}; Rate Con ${checkValue(check, check.actual, locations)}`
    ))
    .join('; ')

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

  return (
    <div className="ratecon-review">
      <article className="ratecon-paper">
        <header className="ratecon-paper-header">
          <div>
            <span>FREIGHTLINK BROKERAGE</span>
            <strong>RATE / LOAD CONFIRMATION</strong>
            <small>Confirmation #{rateCon.confirmationNumber}</small>
          </div>
          <div className="ratecon-revision">
            <span>REVISION</span>
            <strong>{rateCon.revision}</strong>
            <small>{rateCon.corrected ? 'CORRECTED' : 'ORIGINAL'}</small>
          </div>
        </header>

        <div className="ratecon-document-meta">
          <div><span>ISSUED</span><strong>{rateCon.issuedAtLabel}</strong></div>
          <div><span>LOAD</span><strong>{lane.laneRef}</strong></div>
          <div><span>PAYMENT</span><strong>{rateCon.paymentTerms}</strong></div>
        </div>

        <div className="ratecon-party-grid">
          <section>
            <span>BROKER / CONTACT</span>
            <strong>{rateCon.broker.name}</strong>
            <small>{rateCon.broker.contact}</small>
            <small>{rateCon.broker.phone}</small>
          </section>
          <section>
            <span>CARRIER</span>
            <strong>{rateCon.carrier.name}</strong>
            <small>{rateCon.carrier.operatingArea}</small>
            <small>Driver: {driver.name}</small>
          </section>
        </div>

        <div className="ratecon-rate">
          <div>
            <span>AGREED LINEHAUL</span>
            <small>All-in unless separately authorized below</small>
          </div>
          <strong>{money(rateCon.terms.rate)}</strong>
          <em>{rateCon.terms.equipment}</em>
        </div>

        <div className="ratecon-stop-grid">
          <section>
            <div className="ratecon-stop-number">1</div>
            <div>
              <span>SHIPPER / PICKUP</span>
              <strong>{rateCon.terms.pickupLocationLabel}</strong>
              <small>Appointment: {windowLabel(rateCon.terms.pickupWindow)}</small>
            </div>
          </section>
          <section>
            <div className="ratecon-stop-number">2</div>
            <div>
              <span>CONSIGNEE / DELIVERY</span>
              <strong>{rateCon.terms.deliveryLocationLabel}</strong>
              <small>Appointment: {windowLabel(rateCon.terms.deliveryWindow)}</small>
            </div>
          </section>
        </div>

        <div className="ratecon-freight-grid">
          <div><span>PALLETS</span><strong>{rateCon.terms.freight.pallets}</strong></div>
          <div><span>WEIGHT</span><strong>{Math.round(rateCon.terms.freight.weightLbs / 1000)}K LB</strong></div>
          <div><span>EQUIPMENT</span><strong>{rateCon.terms.equipment}</strong></div>
          <div><span>TRACKING</span><strong>REQUIRED</strong></div>
        </div>

        <section className="ratecon-terms">
          <span>TERMS / ACCESSORIALS</span>
          <p>{rateCon.trackingRequirement}.</p>
          <p>{rateCon.accessorialTerms}</p>
          <p>{rateCon.notes}</p>
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
          <span>Carrier acceptance confirms the terms shown on this document. Retain with load paperwork.</span>
        </footer>
      </article>

      <aside className="ratecon-verification">
        <header>
          <span>YOUR VERIFICATION</span>
          <strong>{reviewStatus}</strong>
          <small>Compare each FreightLink term with the broker document, then mark what you found.</small>
        </header>

        <div className="ratecon-check-list">
          {checks.map((check) => {
            const choice = reviewChoices[check.id] ?? null
            return (
              <div className={`ratecon-check ${choice ? `reviewed ${choice}` : ''}`} key={check.id}>
                <div className="ratecon-check-heading">
                  <span>{reviewChoices[check.id] ? reviewedCount : '—'}</span>
                  <strong>{check.label}</strong>
                </div>

                <div className="ratecon-compare-values">
                  <div>
                    <span>FREIGHTLINK</span>
                    <strong>{checkValue(check, check.expected, locations)}</strong>
                  </div>
                  <div>
                    <span>RATE CON</span>
                    <strong>{checkValue(check, check.actual, locations)}</strong>
                  </div>
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
            <p>Accepting anyway commits the broker document exactly as written. Use correction if the terms should change.</p>
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
