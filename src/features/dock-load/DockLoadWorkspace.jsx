import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  buildTutorialStagedFreight,
  dockNumberForPickup,
  evaluatePickupLoadPlan,
} from '../../domain/facility/pickupOperation.js'
import './dockLoad.css'

const TRAILER_POSITION_COUNT = 26
const TRAILER_MAX_WEIGHT_LBS = 44000

function pounds(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

function positionLabel(index) {
  const row = Math.floor(index / 2) + 1
  const side = index % 2 === 0 ? 'L' : 'R'
  return `${row}${side}`
}

export default function DockLoadWorkspace({
  driver,
  event,
  onCommit,
}) {
  const stagedFreight = useMemo(
    () => buildTutorialStagedFreight(event),
    [event],
  )
  const [verifiedIds, setVerifiedIds] = useState([])
  const [placements, setPlacements] = useState({})
  const [doorsClosing, setDoorsClosing] = useState(false)
  const closeTimerRef = useRef(null)

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
  }, [])

  const evaluation = useMemo(
    () => evaluatePickupLoadPlan({
      event,
      stagedFreight,
      verifiedIds,
      placements,
    }),
    [event, placements, stagedFreight, verifiedIds],
  )

  const plannedIds = new Set(Object.values(placements).filter(Boolean))
  const dock = dockNumberForPickup(event)

  const verify = (freightId) => {
    setVerifiedIds((current) => (
      current.includes(freightId)
        ? current.filter((id) => id !== freightId)
        : [...current, freightId]
    ))
  }

  const placeFreight = (freightId, slotIndex) => {
    if (!freightId || !verifiedIds.includes(freightId)) return

    setPlacements((current) => {
      const next = Object.fromEntries(
        Object.entries(current).filter(([, id]) => id !== freightId),
      )
      next[slotIndex] = freightId
      return next
    })
  }

  const placeNextOpen = (freightId) => {
    if (!verifiedIds.includes(freightId)) return
    const occupied = new Set(Object.keys(placements).map(Number))
    const slotIndex = Array.from(
      { length: TRAILER_POSITION_COUNT },
      (_, index) => index,
    ).find((index) => !occupied.has(index))

    if (slotIndex == null) return
    placeFreight(freightId, slotIndex)
  }

  const removePlacement = (slotIndex) => {
    setPlacements((current) => {
      const next = { ...current }
      delete next[slotIndex]
      return next
    })
  }

  const handleDrop = (eventDrop, slotIndex) => {
    eventDrop.preventDefault()
    const freightId = eventDrop.dataTransfer.getData('text/plain')
    placeFreight(freightId, slotIndex)
  }

  const commit = () => {
    if (!evaluation.ready || doorsClosing) return
    setDoorsClosing(true)

    closeTimerRef.current = setTimeout(() => {
      onCommit({
        driverId: driver.id,
        eventId: event.id,
        loadPlan: {
          freightIds: Object.values(placements).filter(Boolean),
          plannedPositions: { ...placements },
          verifiedIds: [...verifiedIds],
          validation: evaluation,
          doorsState: 'closed',
        },
      })
    }, 720)
  }

  return (
    <div className="dock-load-workspace">
      <aside className="dock-load-staging">
        <header>
          <span>STAGED FREIGHT</span>
          <strong>Dock {dock}</strong>
          <small>
            Verify freight against the booked load before placing it in the trailer.
          </small>
        </header>

        <div className="dock-load-freight-list">
          {stagedFreight.map((freight) => {
            const verified = verifiedIds.includes(freight.id)
            const planned = plannedIds.has(freight.id)

            return (
              <article
                key={freight.id}
                className={[
                  'dock-load-freight-card',
                  verified ? 'verified' : '',
                  planned ? 'planned' : '',
                ].filter(Boolean).join(' ')}
                draggable={verified && !planned}
                onDragStart={(dragEvent) => {
                  dragEvent.dataTransfer.setData('text/plain', freight.id)
                  dragEvent.dataTransfer.effectAllowed = 'move'
                }}
              >
                <div className="dock-load-freight-card-head">
                  <div>
                    <span>{freight.loadRef}</span>
                    <strong>{freight.label}</strong>
                  </div>
                  <b>{planned ? 'PLANNED' : verified ? 'VERIFIED' : 'UNVERIFIED'}</b>
                </div>

                <dl>
                  <div>
                    <dt>PICKUP</dt>
                    <dd>{freight.pickupNumber}</dd>
                  </div>
                  <div>
                    <dt>DEST</dt>
                    <dd>{freight.destination}</dd>
                  </div>
                  <div>
                    <dt>WEIGHT</dt>
                    <dd>{pounds(freight.weightLbs)} lb</dd>
                  </div>
                  <div>
                    <dt>STACK</dt>
                    <dd>{freight.stackable ? `×${freight.maxStack}` : 'NO'}</dd>
                  </div>
                </dl>

                <div className="dock-load-freight-actions">
                  <button
                    type="button"
                    className={verified ? 'active' : ''}
                    onClick={() => verify(freight.id)}
                    disabled={planned}
                  >
                    {verified ? 'VERIFIED' : 'VERIFY FOR LOAD'}
                  </button>
                  <button
                    type="button"
                    onClick={() => placeNextOpen(freight.id)}
                    disabled={!verified || planned}
                  >
                    PLACE
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </aside>

      <section className="dock-load-trailer-panel">
        <header className="dock-load-trailer-heading">
          <div>
            <span>TRAILER PLAN</span>
            <strong>53′ Dry Van</strong>
          </div>
          <small>Drag verified freight into an open position. Click a planned pallet to return it to staging.</small>
        </header>

        <div className="dock-load-trailer-shell">
          <div className="dock-load-nose">
            <span>FRONT / NOSE</span>
          </div>

          <div className="dock-load-grid">
            {Array.from({ length: TRAILER_POSITION_COUNT }, (_, slotIndex) => {
              const freightId = placements[slotIndex] ?? null
              const freight = stagedFreight.find((item) => item.id === freightId) ?? null

              return (
                <button
                  type="button"
                  key={slotIndex}
                  className={freight ? 'occupied' : ''}
                  onDragOver={(dragEvent) => {
                    dragEvent.preventDefault()
                    dragEvent.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(dragEvent) => handleDrop(dragEvent, slotIndex)}
                  onClick={() => freight && removePlacement(slotIndex)}
                  title={freight ? 'Return freight to staging' : 'Open trailer position'}
                >
                  <span>{positionLabel(slotIndex)}</span>
                  {freight && (
                    <>
                      <strong>{freight.label}</strong>
                      <small>{freight.loadRef}</small>
                    </>
                  )}
                </button>
              )
            })}
          </div>

          <div className="dock-load-rear">
            <span>REAR / DOORS</span>
            <button
              type="button"
              className={[
                'dock-load-doors',
                evaluation.ready ? 'ready' : '',
                doorsClosing ? 'closing' : '',
              ].filter(Boolean).join(' ')}
              onClick={commit}
              disabled={!evaluation.ready || doorsClosing}
              aria-label={evaluation.ready ? 'Close trailer doors and commit load plan' : 'Load plan is not ready'}
            >
              <i />
              <i />
              <b>{doorsClosing ? 'LOCKING PLAN…' : evaluation.ready ? 'CLOSE DOORS' : 'PLAN NOT READY'}</b>
            </button>
          </div>
        </div>
      </section>

      <aside className="dock-load-hud">
        <section className="dock-load-booked">
          <header>
            <span>BOOKED LOAD</span>
            <strong>{event.loadRef}</strong>
          </header>
          <div>
            <span>DRIVER</span>
            <strong>{driver.name}</strong>
          </div>
          <div>
            <span>PICKUP</span>
            <strong>{event.locationLabel}</strong>
          </div>
          <div>
            <span>DESTINATION</span>
            <strong>{event.deliveryLocationLabel ?? 'Booked destination'}</strong>
          </div>
          <div>
            <span>EXPECTED</span>
            <strong>{event.freight?.pallets ?? 0} pallets · {pounds(event.freight?.weightLbs)} lb</strong>
          </div>
        </section>

        <section className="dock-load-readiness">
          <header>
            <span>LOAD PLAN</span>
            <strong>{evaluation.ready ? 'READY' : 'INCOMPLETE'}</strong>
          </header>

          <div className="dock-load-hud-grid">
            <div>
              <span>POSITIONS</span>
              <strong>{evaluation.plannedCount} / {TRAILER_POSITION_COUNT}</strong>
            </div>
            <div>
              <span>WEIGHT</span>
              <strong>{pounds(evaluation.plannedWeightLbs)} / {pounds(TRAILER_MAX_WEIGHT_LBS)}</strong>
            </div>
            <div>
              <span>VERIFIED</span>
              <strong>{evaluation.verifiedExpectedCount} / {evaluation.expectedCount}</strong>
            </div>
            <div>
              <span>PLANNED</span>
              <strong>{evaluation.plannedExpectedCount} / {evaluation.expectedCount}</strong>
            </div>
          </div>

          <div className="dock-load-validation">
            {evaluation.errors.length === 0 && evaluation.warnings.length === 0 ? (
              <div className="ok">
                <strong>LOAD PLAN READY</strong>
                <small>Close the rear doors to send this plan to the warehouse.</small>
              </div>
            ) : (
              <>
                {evaluation.errors.map((issue) => (
                  <div className="error" key={issue.code}>
                    <strong>{issue.code.replaceAll('_', ' ')}</strong>
                    <small>{issue.message}</small>
                  </div>
                ))}
                {evaluation.warnings.map((issue) => (
                  <div className="warning" key={issue.code}>
                    <strong>{issue.code.replaceAll('_', ' ')}</strong>
                    <small>{issue.message}</small>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        <footer className="dock-load-focus-note">
          <span>FOCUSED MODE</span>
          <strong>World simulation is paused while you plan.</strong>
          <small>Operational loading begins only after the trailer doors are closed.</small>
        </footer>
      </aside>
    </div>
  )
}
