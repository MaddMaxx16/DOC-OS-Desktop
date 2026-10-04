import { WORKSTATION_SECTIONS } from '../config/shellConfig.js'

function RailIcon({ id, label }) {
  if (id === 'drivers') {
    return (
      <svg viewBox="0 0 32 24" aria-hidden="true">
        <path d="M2 5h17v12H2zM19 9h6l5 5v3H19z" />
        <circle cx="8" cy="19" r="3" />
        <circle cx="24" cy="19" r="3" />
      </svg>
    )
  }
  if (id === 'freightlink') {
    return (
      <svg viewBox="0 0 32 24" aria-hidden="true">
        <circle cx="6" cy="12" r="4" />
        <circle cx="26" cy="6" r="4" />
        <circle cx="26" cy="18" r="4" />
        <path d="M10 11 22 7M10 13l12 4" />
      </svg>
    )
  }
  if (id === 'email') {
    return <svg viewBox="0 0 32 24" aria-hidden="true"><path d="M3 4h26v16H3zM4 6l12 9L28 6" /></svg>
  }
  if (id === 'documents') {
    return <svg viewBox="0 0 32 24" aria-hidden="true"><path d="M8 2h12l6 6v14H8zM20 2v7h6M12 13h10M12 17h10" /></svg>
  }
  if (id === 'messages') {
    return <svg viewBox="0 0 32 24" aria-hidden="true"><path d="M4 3h24v14H14l-7 5v-5H4z" /></svg>
  }
  if (id === 'banking') {
    return <svg viewBox="0 0 32 24" aria-hidden="true"><path d="m16 2 13 6H3zM5 10h22M7 10v9m6-9v9m6-9v9m6-9v9M3 22h26" /></svg>
  }
  if (id === 'shop') {
    return <svg viewBox="0 0 32 24" aria-hidden="true"><path d="M3 4h4l3 11h14l4-8H9M12 20h1m10 0h1" /></svg>
  }
  return <span aria-hidden="true">{label.slice(0, 2).toUpperCase()}</span>
}

export default function CommandRail({ activeSection, onToggleSection }) {
  return (
    <nav className="command-rail" aria-label="DOC OS workstation">
      <div className="command-rail-brand">
        <b>DOC</b>
        <span>OS</span>
      </div>

      <div className="command-rail-sections">
        {WORKSTATION_SECTIONS.map((section) => {
          const enabled = section.id === 'drivers' || section.id === 'freightlink'
          const active = activeSection === section.id
          return (
            <button
              type="button"
              key={section.id}
              className={active ? 'active' : ''}
              disabled={!enabled}
              onClick={() => enabled && onToggleSection(section.id)}
              title={enabled ? section.label : `${section.label} · ${section.phase}`}
              aria-pressed={active}
            >
              <i><RailIcon id={section.id} label={section.label} /></i>
              <strong>{section.label}</strong>
              {!enabled && <small>{section.phase}</small>}
            </button>
          )
        })}
      </div>

      <div className="command-rail-status">PAUSED</div>
    </nav>
  )
}
