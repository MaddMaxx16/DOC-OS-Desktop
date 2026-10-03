export default function DesktopAppDrawer({ activeApp, children }) {
  if (!activeApp) return null

  return (
    <section
      className="desktop-app-drawer"
      data-app={activeApp}
      aria-label={`${activeApp} workspace`}
    >
      {children}
    </section>
  )
}
