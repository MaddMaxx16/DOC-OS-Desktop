export default function TrailerShell({
  board,
  children,
  className = '',
  overlay = null,
  rearLabel = 'REAR / DOORS',
}) {
  return (
    <div
      className={[
        'trailer-visual-shell',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className="trailer-roof">
        <i />
        <i />
        <i />
        <span>{board.label}</span>
      </div>

      <div className="trailer-open-cavity">
        <div className="trailer-side-wall left">
          <span>53′</span>
        </div>

        <div className="trailer-floor-stage">
          <div className="trailer-nose-wall">
            <span>FRONT / NOSE</span>
          </div>

          {children}
        </div>

        <div className="trailer-side-wall right">
          <span>{board.capacityPallets} PLT</span>
        </div>
      </div>

      {overlay}

      <div className="trailer-rear-frame">
        <div className="trailer-tail-light left" />
        <span>{rearLabel}</span>
        <div className="trailer-tail-light right" />
      </div>
    </div>
  )
}
