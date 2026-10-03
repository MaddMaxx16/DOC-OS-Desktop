import { DOCK_APPS } from '../config/shellConfig.js'

export default function AppDock() {
  return (
    <nav className="app-dock" aria-label="DOC OS apps">
      <div className="dock-brand"><b>DOC</b><span>OS</span></div>
      {DOCK_APPS.map((app) => (
        <button type="button" key={app.id} title={`${app.label} planned for ${app.phase}`}>
          <strong>{app.label}</strong>
          <small>{app.phase}</small>
        </button>
      ))}
      <div className="dock-clock"><span>PAUSED</span></div>
    </nav>
  )
}
