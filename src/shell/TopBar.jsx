export default function TopBar({ focused = false }) {
  return (
    <header className="top-bar">
      <div className="brand-block">
        <strong>METROLINE</strong>
        <span>New York Operations</span>
      </div>

      <div className={`operations-status ${focused ? 'focused' : ''}`} aria-label="Operational status">
        <span className="status-dot" />
        <strong>{focused ? 'FOCUSED' : 'NO ALERTS'}</strong>
        <span className="status-divider" />
        <small>{focused ? 'RATE CON REVIEW · GAMEPLAY PAUSED' : 'DESKTOP V2.5.2 · DOCUMENT DESK'}</small>
      </div>

      <div className="clock-block">
        <span>SEP 7 · DAY 1</span>
        <strong>6:00 AM</strong>
      </div>
    </header>
  )
}
