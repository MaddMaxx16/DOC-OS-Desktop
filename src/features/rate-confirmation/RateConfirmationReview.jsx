import { useState } from 'react'
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
  const [acceptRiskArmed, setAcceptRiskArmed] = useState(false)
  const rateCon = bookingRecord?.rateConfirmation
  const checks = compareRateConfirmationToLane(rateCon, lane)
  const mismatches = checks.filter((check) => !check.matches)
  const hasMismatch = mismatches.length > 0

  if (!lane || !driver || !rateCon) return null

  const handleConfirm = () => {
    if (hasMismatch && !acceptRiskArmed) {
      setAcceptRiskArmed(true)
      return
    }
    onConfirm({ acceptedWithMismatch: hasMismatch })
  }

  const correctionReason = mismatches
    .map((check) => `${check.label}: expected ${checkValue(check, check.expected, locations)}, document says ${checkValue(check, check.actual, locations)}`)
    .join('; ')

  return (
    <div className="ratecon-review">
      <article className="ratecon-paper">
        <header className="ratecon-paper-header">
          <div>
            <span>FREIGHTLINK BROKERAGE</span>
            <strong>RATE CONFIRMATION</strong>
            <small>Confirmation #{rateCon.confirmationNumber}</small>
          </div>
          <div className="ratecon-revision">
            <span>REVISION</span>
            <strong>{rateCon.revision}</strong>
            <small>{rateCon.corrected ? 'CORRECTED' : 'ORIGINAL'}</small>
          </div>
        </header>

        <div className="ratecon-party-grid">
          <section>
            <span>BROKER</span>
            <strong>{rateCon.broker.name}</strong>
            <small>{rateCon.broker.contact}</small>
            <small>{rateCon.broker.phone}</small>
          </section>
          <section>
            <span>CARRIER</span>
            <strong>{rateCon.carrier.name}</strong>
            <small>{rateCon.carrier.operatingArea}</small>
            <small>Assigned driver: {driver.name}</small>
          </section>
        </div>

        <div className="ratecon-rate">
          <span>AGREED LINEHAUL RATE</span>
          <strong>{money(rateCon.terms.rate)}</strong>
          <small>{rateCon.terms.equipment}</small>
        </div>

        <div className="ratecon-stop-grid">
          <section>
            <div className="ratecon-stop-number">1</div>
            <div>
              <span>PICKUP</span>
              <strong>{rateCon.terms.pickupLocationLabel}</strong>
              <small>{windowLabel(rateCon.terms.pickupWindow)}</small>
            </div>
          </section>
          <section>
            <div className="ratecon-stop-number">2</div>
            <div>
              <span>DELIVERY</span>
              <strong>{rateCon.terms.deliveryLocationLabel}</strong>
              <small>{windowLabel(rateCon.terms.deliveryWindow)}</small>
            </div>
          </section>
        </div>

        <div className="ratecon-freight-grid">
          <div><span>LANE</span><strong>{lane.laneRef}</strong></div>
          <div><span>PALLETS</span><strong>{rateCon.terms.freight.pallets}</strong></div>
          <div><span>WEIGHT</span><strong>{Math.round(rateCon.terms.freight.weightLbs / 1000)}K LB</strong></div>
          <div><span>EQUIPMENT</span><strong>{rateCon.terms.equipment}</strong></div>
        </div>

        <section className="ratecon-notes">
          <span>CARRIER INSTRUCTIONS</span>
          <p>{rateCon.notes}</p>
        </section>

        <footer className="ratecon-paper-footer">
          <span>Review all terms before dispatching. Acceptance confirms the terms shown on this document.</span>
        </footer>
      </article>

      <aside className="ratecon-verification">
        <header>
          <span>VERIFY BEFORE ACCEPTING</span>
          <strong>{hasMismatch ? `${mismatches.length} MISMATCH${mismatches.length > 1 ? 'ES' : ''}` : 'TERMS MATCH'}</strong>
          <small>Compare the broker document against the lane you evaluated in FreightLink.</small>
        </header>

        <div className="ratecon-check-list">
          {checks.map((check) => (
            <div className={`ratecon-check ${check.matches ? 'match' : 'mismatch'}`} key={check.id}>
              <span>{check.matches ? '✓' : '!'}</span>
              <div>
                <strong>{check.label}</strong>
                {check.matches ? (
                  <small>{checkValue(check, check.actual, locations)}</small>
                ) : (
                  <>
                    <small>FreightLink: {checkValue(check, check.expected, locations)}</small>
                    <small>Rate Con: {checkValue(check, check.actual, locations)}</small>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {acceptRiskArmed && hasMismatch && (
          <div className="ratecon-risk-warning">
            <strong>YOU ARE ABOUT TO ACCEPT MISMATCHED TERMS.</strong>
            <p>The booked load will use the Rate Confirmation exactly as written. DOC OS will not silently correct it.</p>
          </div>
        )}

        <div className="ratecon-review-actions">
          {hasMismatch && (
            <button
              type="button"
              className="ratecon-correction-button"
              onClick={() => onRequestCorrection(correctionReason)}
            >
              REQUEST CORRECTION
            </button>
          )}
          <button
            type="button"
            className={`ratecon-confirm-button ${hasMismatch ? 'warning' : ''}`}
            onClick={handleConfirm}
          >
            {hasMismatch && !acceptRiskArmed ? 'ACCEPT WITH WARNING' : hasMismatch ? 'ACCEPT ANYWAY + ASSIGN' : 'ACCEPT + ASSIGN'}
          </button>
        </div>
      </aside>
    </div>
  )
}
