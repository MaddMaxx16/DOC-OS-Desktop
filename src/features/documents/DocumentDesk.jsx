import {
  createContext,
  useContext,
  useRef,
  useState,
} from 'react'
import './documentDesk.css'

const DocumentDeskContext = createContext(null)

export function DocumentDesk({ children, className = '' }) {
  const deskRef = useRef(null)
  const nextZRef = useRef(10)
  const [zOrder, setZOrder] = useState({})

  const bringToFront = (documentId) => {
    nextZRef.current += 1
    const zIndex = nextZRef.current
    setZOrder((current) => ({ ...current, [documentId]: zIndex }))
    return zIndex
  }

  return (
    <div ref={deskRef} className={`document-desk ${className}`}>
      <DocumentDeskContext.Provider value={{ deskRef, zOrder, bringToFront }}>
        {children}
      </DocumentDeskContext.Provider>
    </div>
  )
}

export function DraggableDocument({
  documentId,
  initialPosition = { x: 24, y: 20 },
  className = '',
  onClick,
  onDoubleClick,
  onDragEnd,
  ariaLabel,
  children,
}) {
  const context = useContext(DocumentDeskContext)
  const [position, setPosition] = useState(initialPosition)
  const dragRef = useRef(null)

  if (!context) {
    throw new Error('DraggableDocument must be rendered inside DocumentDesk.')
  }

  const { deskRef, zOrder, bringToFront } = context

  const handlePointerDown = (event) => {
    if (event.button !== 0) return

    const sheet = event.currentTarget
    const desk = deskRef.current
    if (!desk) return

    bringToFront(documentId)
    const sheetRect = sheet.getBoundingClientRect()
    const deskRect = desk.getBoundingClientRect()

    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - sheetRect.left,
      offsetY: event.clientY - sheetRect.top,
      deskRect,
      sheetWidth: sheetRect.width,
      sheetHeight: sheetRect.height,
    }

    sheet.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }

  const handlePointerMove = (event) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const maxX = Math.max(0, drag.deskRect.width - drag.sheetWidth)
    const maxY = Math.max(0, drag.deskRect.height - drag.sheetHeight)
    const x = Math.min(maxX, Math.max(0, event.clientX - drag.deskRect.left - drag.offsetX))
    const y = Math.min(maxY, Math.max(0, event.clientY - drag.deskRect.top - drag.offsetY))

    setPosition({ x, y })
  }

  const finishDrag = (event, cancelled = false) => {
    const drag = dragRef.current
    if (drag?.pointerId !== event.pointerId) return

    dragRef.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)

    if (!cancelled) {
      onDragEnd?.({
        documentId,
        clientX: event.clientX,
        clientY: event.clientY,
      })
    }
  }

  return (
    <div
      className={`draggable-document ${className}`}
      data-document-id={documentId}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        zIndex: zOrder[documentId] ?? 10,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => finishDrag(event, false)}
      onPointerCancel={(event) => finishDrag(event, true)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  )
}
