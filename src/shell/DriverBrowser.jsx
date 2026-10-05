import { useMemo, useState } from 'react'
import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { formatClock } from '../domain/manifest/driverDayModel.js'
import { SELECTION_TYPES } from '../domain/selection/selectionModel.js'

const DRIVER_FILTER_LABELS = Object.freeze({
  all: 'ALL DRIVERS',
  attention: 'NEEDS ATTENTION',
  'en-route': 'EN ROUTE',
  'at-stop': 'AT STOP',
  break: 'ON BREAK',
  scheduled: 'SCHEDULED',
  'not-sent': 'PLAN NOT SENT',
})

function matchesDriverFilter(filter, liveState) {
  if (!filter || filter === 'all') return true
  if (filter === 'attention') {
    return liveState?.phase === 'dispatch-required' || liveState?.attention === true
  }
  if (filter === 'en-route') return liveState?.executionPhase === 'en-route'
  if (filter === 'at-stop') {
    return ['waiting-appointment', 'facility-dock-assigned', 'service-loading', 'service-unloading', 'arrived'].includes(
      liveState?.executionPhase,
    )
  }
  if (filter === 'break') return liveState?.executionPhase === 'dwell-break'
  if (filter === 'scheduled') return liveState?.phase === 'scheduled'
  if (filter === 'not-sent') {
    return !liveState?.sent && liveState?.phase !== 'dispatch-required'
  }
  return true
}

function liveStatusCopy(driver, liveState) {
  if (liveState?.phase === 'dispatch-required') {
    return {
      status: 'DISPATCH REQUIRED',
      detail: liveState.detail,
      tone: 'alert',
    }
  }

  if (!liveState?.sent) {
    return {
      status: 'PLAN NOT SENT',
      detail: liveState?.detail ?? driver.nextStop,
      tone: 'muted',
    }
  }

  if (liveState.phase === 'scheduled') {
    return {
      status: 'SCHEDULED',
      detail: liveState.nextEventLabel ?? driver.nextStop,
      tone: 'scheduled',
    }
  }

  if (liveState.phase === 'closed') {
    return {
      status: 'SHIFT CLOSED',
      detail: liveState.currentEventLabel ?? driver.nextStop,
      tone: 'muted',
    }
  }

  if (liveState.executionPhase === 'en-route') {
    return {
      status: 'EN ROUTE',
      detail: liveState.nextEventLabel ?? driver.nextStop,
      tone: 'live',
    }
  }

  if (liveState.executionPhase === 'waiting-appointment') {
    return {
      status: 'WAITING',
      detail: liveState.currentEventLabel
        ? `Early at ${liveState.currentEventLabel} · appointment ${Math.ceil(liveState.waitRemainingMinutes ?? 0)} min`
        : 'Waiting for appointment',
      tone: 'scheduled',
    }
  }

  if (liveState.executionPhase === 'facility-dock-assigned') {
    return {
      status: `DOCK ${liveState.dock ?? '—'}`,
      detail: liveState.currentEventLabel
        ? `Load plan required at ${liveState.currentEventLabel}`
        : 'Dock & Load plan required',
      tone: 'scheduled',
    }
  }

  if (liveState.executionPhase === 'service-loading') {
    return {
      status: 'LOADING',
      detail: `${liveState.currentEventLabel ?? driver.nextStop} · ${liveState.serviceRemainingMinutes ?? 0} min`,
      tone: 'live',
    }
  }

  if (liveState.executionPhase === 'service-unloading') {
    return {
      status: 'UNLOADING',
      detail: `${liveState.currentEventLabel ?? driver.nextStop} · ${liveState.serviceRemainingMinutes ?? 0} min`,
      tone: 'live',
    }
  }

  if (liveState.executionPhase === 'dwell-break') {
    return {
      status: 'ON BREAK',
      detail: liveState.currentEventLabel ?? driver.nextStop,
      tone: 'break',
    }
  }

  if (liveState.executionPhase === 'arrived') {
    return {
      status: 'ARRIVED',
      detail: liveState.currentEventLabel ?? driver.nextStop,
      tone: 'live',
    }
  }

  if (liveState.executionPhase === 'complete') {
    return {
      status: 'ROUTE COMPLETE',
      detail: liveState.currentEventLabel ?? driver.nextStop,
      tone: 'ready',
    }
  }

  return {
    status: liveState.label ?? driver.status,
    detail: liveState.nextEventLabel ?? driver.nextStop,
    tone: 'muted',
  }
}

function driverDayById(driverDays, driverId) {
  return driverDays.find((day) => day.driverId === driverId) ?? null
}

function loadRefs(day) {
  return [...new Set(
    (day?.freightStops ?? [])
      .map((stop) => stop.loadRef)
      .filter(Boolean),
  )]
}

function loadCount(day) {
  return loadRefs(day).length
}

function nextStopCopy(day, liveState) {
  const nextEvent = day?.timeline?.find((event) => event.id === liveState?.nextEventId) ?? null
  const label = liveState?.nextEventLabel ?? nextEvent?.locationLabel ?? '—'
  const eta = liveState?.nextEventArrivalMinutes ?? nextEvent?.projectedArrivalMinutes ?? null

  return {
    label,
    eta: Number.isFinite(Number(eta)) ? formatClock(Number(eta)) : null,
  }
}

function riskCopy(day, liveState) {
  if (liveState?.phase === 'dispatch-required') {
    return {
      label: 'DISPATCH',
      detail: `${liveState.dispatchDelayMinutes ?? 0}m late`,
      tone: 'alert',
      rank: 0,
    }
  }

  const blockers = day?.planHealth?.blockers?.length ?? 0
  if (blockers > 0) {
    return {
      label: 'BLOCKER',
      detail: `${blockers} issue${blockers === 1 ? '' : 's'}`,
      tone: 'blocker',
      rank: 1,
    }
  }

  const warnings = day?.planHealth?.warnings?.length ?? 0
  if (warnings > 0) {
    return {
      label: 'WARNING',
      detail: `${warnings} risk${warnings === 1 ? '' : 's'}`,
      tone: 'warning',
      rank: 2,
    }
  }

  return {
    label: 'CLEAR',
    detail: 'No flags',
    tone: 'clear',
    rank: 3,
  }
}

function searchHaystack(driver, liveCopy, day, risk, nextStop) {
  return [
    driver.name,
    driver.initials,
    liveCopy.status,
    liveCopy.detail,
    risk.label,
    risk.detail,
    nextStop.label,
    ...loadRefs(day),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export default function DriverBrowser({
  drivers,
  driverDays = [],
  activeDriverId,
  liveDriverStates = {},
  filter = 'all',
  onClearFilter,
  onSelectSubject,
}) {
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim().toLowerCase()

  const rosterRows = useMemo(() => (
    drivers.map((driver) => {
      const day = driverDayById(driverDays, driver.id)
      const liveState = liveDriverStates[driver.id] ?? null
      const liveCopy = liveStatusCopy(driver, liveState)
      const risk = riskCopy(day, liveState)
      const nextStop = nextStopCopy(day, liveState)

      return {
        driver,
        day,
        liveState,
        liveCopy,
        risk,
        nextStop,
        loadCount: loadCount(day),
      }
    })
  ), [driverDays, drivers, liveDriverStates])

  const filteredRows = rosterRows.filter((row) => {
    if (!matchesDriverFilter(filter, row.liveState)) return false
    if (!normalizedSearch) return true

    return searchHaystack(
      row.driver,
      row.liveCopy,
      row.day,
      row.risk,
      row.nextStop,
    ).includes(normalizedSearch)
  })

  const filterLabel = DRIVER_FILTER_LABELS[filter] ?? DRIVER_FILTER_LABELS.all

  return (
    <aside className="workstation-browser driver-browser fleet-roster" aria-label="Fleet roster">
      <header className="workstation-panel-header fleet-roster-header">
        <div>
          <span>FLEET</span>
          <strong>Roster</strong>
          <small>
            {filter === 'all'
              ? `${drivers.length} active today`
              : `${filteredRows.length} of ${drivers.length} · ${filterLabel}`}
          </small>
        </div>
        {filter !== 'all' && (
          <button
            type="button"
            className="driver-filter-clear"
            onClick={onClearFilter}
            title="Show all drivers"
          >
            ALL
          </button>
        )}
      </header>

      <div className="fleet-roster-tools">
        <label>
          <span>SEARCH</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Driver, load, stop, status…"
            aria-label="Search fleet roster"
          />
        </label>
        <small>{filteredRows.length} shown</small>
      </div>

      <div className="fleet-roster-columns" aria-hidden="true">
        <span>DRIVER</span>
        <span>LOADS</span>
        <span>RISK</span>
      </div>

      <div className="driver-list fleet-roster-list">
        {filteredRows.map((row) => {
          const { driver, risk, nextStop, loadCount: assignedLoadCount } = row
          const identity = getDriverIdentity(driver.id)
          const selected = driver.id === activeDriverId

          return (
            <button
              type="button"
              key={driver.id}
              className={`fleet-roster-row ${selected ? 'active' : ''} risk-${risk.tone}`}
              style={{ '--driver-color': identity.color }}
              onClick={() => onSelectSubject(SELECTION_TYPES.DRIVER, driver.id)}
              aria-pressed={selected}
            >
              <div className="fleet-roster-driver">
                <i>{driver.initials}</i>
                <span>
                  <strong>{driver.name}</strong>
                  <small className="fleet-roster-next">
                    <b>NEXT</b>
                    <span>{nextStop.label}</span>
                    {nextStop.eta && <em>{nextStop.eta}</em>}
                  </small>
                </span>
              </div>

              <div className="fleet-roster-loads">
                <strong>{assignedLoadCount}</strong>
                <small>LOAD{assignedLoadCount === 1 ? '' : 'S'}</small>
              </div>

              <div className={`fleet-roster-risk ${risk.tone}`}>
                <span>{risk.label}</span>
                <small>{risk.detail}</small>
              </div>
            </button>
          )
        })}

        {filteredRows.length === 0 && (
          <div className="driver-list-empty">
            <strong>No drivers match this view</strong>
            <small>{normalizedSearch ? 'SEARCH / FILTER' : filterLabel}</small>
          </div>
        )}
      </div>
    </aside>
  )
}
