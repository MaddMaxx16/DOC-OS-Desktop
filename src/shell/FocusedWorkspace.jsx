export default function FocusedWorkspace({
  eyebrow = 'FOCUSED WORKSPACE',
  title,
  subtitle = 'GAMEPLAY PAUSED',
  onClose,
  children,
}) {
  return (
    <section className="focused-workspace" aria-label={title}>
      <header className="focused-workspace-header">
        <div>
          <span>{eyebrow}</span>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </div>
        <button type="button" onClick={onClose} aria-label="Close focused workspace">×</button>
      </header>
      <div className="focused-workspace-body">{children}</div>
    </section>
  )
}
