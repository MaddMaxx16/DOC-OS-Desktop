export default function TopBar() {
  return (
    <header className="top-bar">
      <div className="brand-block">
        <strong>METROLINE</strong>
        <span>New York Operations</span>
      </div>

      <div className="operations-status" aria-label="Operational status">
        <span className="status-dot" />
        <strong>NO ALERTS</strong>
        <span className="status-divider" />
        <small>DESKTOP V2.4.5 · MAP FOCUS</small>
      </div>

      <div className="clock-block">
        <span>SEP 7 · DAY 1</span>
        <strong>6:00 AM</strong>
      </div>
    </header>
  )
}
