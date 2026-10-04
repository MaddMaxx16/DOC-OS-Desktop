import './planningPlaceFlyout.css'

function formatMiles(value) {
  if (!Number.isFinite(value)) return '—'
  return `${value.toFixed(value >= 10 ? 0 : 1)} mi`
}

export default function PlanningPlaceFlyout({
  driver,
  event,
  options = [],
  pendingPlace = null,
  onPreviewPlace,
  onCancel,
  onConfirm,
}) {
  if (!driver || !event || !['lunch', 'staging'].includes(event.kind)) return null

  const lunch = event.kind === 'lunch'
  const pendingOption = pendingPlace
    ? options.find((option) => option.id === pendingPlace.locationId) ?? null
    : null

  return (
    <aside className="planning-place-flyout" aria-label={lunch ? 'Lunch place planner' : 'Staging place planner'}>
      <header>
        <div>
          <span>{lunch ? 'LUNCH PLANNER' : 'STAGING PLANNER'}</span>
          <strong>{driver.name}</strong>
        </div>
        <button type="button" onClick={onCancel} aria-label="Close place planner">×</button>
      </header>

      <div className="planning-place-flyout-context">
        <span>{lunch ? 'CURRENT LUNCH' : 'CURRENT END LOCATION'}</span>
        <strong>{event.locationId ? event.locationLabel : 'Not selected'}</strong>
        <small>
          {lunch
            ? 'Choose a real lunch stop. Selection previews on the map until confirmed.'
            : 'Choose where the truck will actually finish the day. Selection previews on the map until confirmed.'}
        </small>
      </div>

      <div className="planning-place-flyout-list">
        {options.map((option) => {
          const previewing = pendingOption?.id === option.id
          return (
            <button
              type="button"
              key={option.id}
              className={[
                option.isCurrent ? 'current' : '',
                previewing ? 'previewing' : '',
              ].filter(Boolean).join(' ')}
              disabled={option.isCurrent}
              onClick={() => onPreviewPlace?.({
                driverId: driver.id,
                kind: event.kind,
                locationId: option.id,
              })}
            >
              <div>
                <strong>{option.label}</strong>
                <span>{option.poiType.replace('-', ' ').toUpperCase()}</span>
              </div>
              <small>
                {lunch
                  ? `+${option.detourMinutes} min · ${formatMiles(option.detourMiles)} detour`
                  : `${option.travelMinutes} min · ${formatMiles(option.travelMiles)} from final stop`}
              </small>
              <em>
                {option.truckAccess.toUpperCase()} TRUCK ACCESS
                {option.parking ? ' · PARKING' : ' · NO TRUCK PARKING'}
                {!lunch && option.overnight === true ? ' · OVERNIGHT' : ''}
              </em>
              {!lunch && option.proximityLabel && <i>{option.proximityLabel}</i>}
              {option.isCurrent && <b>CONFIRMED</b>}
              {previewing && <b>PREVIEW</b>}
            </button>
          )
        })}
      </div>

      <footer>
        <div>
          <span>{pendingOption ? 'PREVIEWING' : 'SELECT A PLACE'}</span>
          <strong>{pendingOption?.label ?? (lunch ? 'Choose a lunch location' : 'Choose a staging location')}</strong>
        </div>
        <button
          type="button"
          disabled={!pendingOption}
          onClick={onConfirm}
        >
          {lunch ? 'CONFIRM LUNCH' : 'CONFIRM STAGING'}
        </button>
      </footer>
    </aside>
  )
}
