import { formatClock } from '../domain/manifest/driverDayModel.js'
import {
  simulationDateLabel,
  SIMULATION_MODE,
} from '../domain/live/liveOperations.js'

export default function TopBar({
  focused = false,
  simulationClock,
  liveDriverStates = {},
  onSimulationModeChange,
}) {
  const requestedMode = simulationClock?.mode ?? SIMULATION_MODE.PAUSED
  const effectiveMode = focused ? SIMULATION_MODE.PAUSED : requestedMode
  const dispatchRequiredCount = Object.values(liveDriverStates)
    .filter((state) => state?.phase === 'dispatch-required')
    .length
  const operationalAlert = dispatchRequiredCount > 0

  const modeLabel = effectiveMode === SIMULATION_MODE.FAST
    ? '4×'
    : effectiveMode === SIMULATION_MODE.PLAYING
      ? 'LIVE'
      : 'PAUSED'

  const setMode = (mode) => {
    if (focused) return
    onSimulationModeChange?.(mode)
  }

  return (
    <header className="top-bar">
      <div className="brand-block">
        <strong>METROLINE</strong>
        <span>New York Operations</span>
      </div>

      <div
        className={`operations-status ${focused ? 'focused' : operationalAlert ? 'alert' : ''}`}
        aria-label="Operational status"
      >
        <span className="status-dot" />
        <strong>
          {focused
            ? 'FOCUSED'
            : operationalAlert
              ? `${dispatchRequiredCount} DISPATCH REQUIRED`
              : 'NO ALERTS'}
        </strong>
        <span className="status-divider" />
        <small>{focused ? 'FOCUSED MODE · GAMEPLAY PAUSED' : 'DESKTOP V2.7.5.3.1 · HUD SIMPLIFIED'}</small>
      </div>

      <div className="clock-block">
        <span>{simulationDateLabel(simulationClock)}</span>
        <div className="clock-time-row">
          <strong>{formatClock(simulationClock?.currentMinutes ?? 360)}</strong>
          <em className={effectiveMode}>{modeLabel}</em>
          <div className="time-controls" aria-label="Time controls">
            <button
              type="button"
              className={effectiveMode === SIMULATION_MODE.PAUSED ? 'active' : ''}
              disabled={focused}
              aria-label="Pause"
              aria-pressed={effectiveMode === SIMULATION_MODE.PAUSED}
              onClick={() => setMode(SIMULATION_MODE.PAUSED)}
            >
              Ⅱ
            </button>
            <button
              type="button"
              className={effectiveMode === SIMULATION_MODE.PLAYING ? 'active' : ''}
              disabled={focused}
              aria-label="Play"
              aria-pressed={effectiveMode === SIMULATION_MODE.PLAYING}
              onClick={() => setMode(SIMULATION_MODE.PLAYING)}
            >
              ▶
            </button>
            <button
              type="button"
              className={effectiveMode === SIMULATION_MODE.FAST ? 'active' : ''}
              disabled={focused}
              aria-label="Fast forward"
              aria-pressed={effectiveMode === SIMULATION_MODE.FAST}
              onClick={() => setMode(SIMULATION_MODE.FAST)}
            >
              »
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
