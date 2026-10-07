import { formatClock } from '../../domain/manifest/driverDayModel.js'

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

export default function RateConfirmationPaper({
  rateCon,
  lane,
  driver,
  paperFieldClass = () => '',
  acceptanceLabel = 'Pending acceptance',
}) {
  if (!rateCon || !lane || !driver) return null

  return (
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
          <strong>{acceptanceLabel}</strong>
        </div>
      </div>

      <footer className="ratecon-paper-footer">
        <span>Retain this confirmation with the load paperwork and signed POD.</span>
      </footer>
    </article>
  )
}
