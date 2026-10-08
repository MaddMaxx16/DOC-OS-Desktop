import { useMemo } from 'react'
import './emailWorkspace.css'

const EMAIL_FILTERS = Object.freeze([
  { id: 'ALL', label: 'ALL' },
  { id: 'UNREAD', label: 'UNREAD' },
  { id: 'LOADS', label: 'LOADS' },
])

function matchesFilter(message, filter) {
  if (filter === 'UNREAD') return message.unread
  if (filter === 'LOADS') return Boolean(message.loadRef)
  return true
}

function senderInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'EM'
}

export default function EmailWorkspace({
  messages = [],
  selectedEmailId,
  onSelectEmail,
  onOpenDocuments,
  onClose,
}) {
  const selectedMessage = messages.find((message) => message.id === selectedEmailId) ?? null

  const visibleMessages = useMemo(
    () => messages,
    [messages],
  )

  return (
    <div className="email-workspace">
      <aside className="workstation-browser email-browser" aria-label="Email inbox">
        <header className="workstation-panel-header email-browser-header">
          <div>
            <span>COMMUNICATIONS</span>
            <strong>Email</strong>
            <small>People contact you here about changes, exceptions, and work that needs attention.</small>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Email">×</button>
        </header>

        <div className="email-filters" aria-label="Email filters">
          {EMAIL_FILTERS.map((item) => {
            const count = messages.filter((message) => matchesFilter(message, item.id)).length
            return (
              <div className="email-filter-summary" key={item.id}>
                <span>{item.label}</span>
                <b>{count}</b>
              </div>
            )
          })}
        </div>

        <div className="email-list">
          {visibleMessages.length === 0 ? (
            <div className="email-empty-list">
              <strong>INBOX CLEAR</strong>
              <small>Routine paperwork goes straight to Documents Incoming. Email is for communication and exceptions.</small>
            </div>
          ) : visibleMessages.map((message) => {
            const selected = message.id === selectedEmailId
            return (
              <button
                type="button"
                key={message.id}
                className={'email-row' + (message.unread ? ' unread' : '') + (selected ? ' selected' : '')}
                onClick={() => onSelectEmail(message.id)}
                aria-pressed={selected}
              >
                <div className="email-row-topline">
                  <span className="email-row-sender">
                    {message.unread && <i aria-hidden="true" />}
                    {message.senderName}
                  </span>
                  <small>{message.issuedAtLabel}</small>
                </div>
                <strong>{message.subject}</strong>
                <p>{message.preview}</p>
                <div className="email-row-meta">
                  <span>MESSAGE</span>
                  <i>{message.loadRef}</i>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="email-reading-pane" aria-label="Email message">
        {selectedMessage ? (
          <article className="email-message">
            <header className="email-subject-bar">
              <div>
                <span>INBOX</span>
                <strong>{selectedMessage.subject}</strong>
              </div>
              <small>{selectedMessage.issuedAtLabel}</small>
            </header>

            <div className="email-message-scroll">
              <div className="email-envelope">
                <div className="email-sender-avatar" aria-hidden="true">
                  {senderInitials(selectedMessage.senderName)}
                </div>
                <div className="email-envelope-main">
                  <div className="email-from-line">
                    <strong>{selectedMessage.senderName}</strong>
                    <span>&lt;{selectedMessage.senderAddress}&gt;</span>
                  </div>
                  <div className="email-to-line">
                    <span>To:</span>
                    <strong>{selectedMessage.recipientName}</strong>
                    <small>&lt;{selectedMessage.recipientAddress}&gt;</small>
                  </div>
                </div>
                <div className="email-envelope-date">
                  <span>{selectedMessage.issuedAtLabel}</span>
                </div>
              </div>

              <div className="email-message-copy">
                <p>{selectedMessage.recipientName},</p>
                <p>{selectedMessage.body}</p>
                <div className="email-signature">
                  <span>Regards,</span>
                  <strong>{selectedMessage.closingName}</strong>
                  <small>{selectedMessage.senderName}</small>
                </div>
              </div>

              {selectedMessage.relatedDocumentId && (
                <section className="email-related-work">
                  <header>
                    <div>
                      <span>RELATED PAPERWORK</span>
                      <strong>{selectedMessage.relatedLabel}</strong>
                    </div>
                    <b>{selectedMessage.statusLabel}</b>
                  </header>
                  <div>
                    <p>
                      <span>LOAD</span>
                      <strong>{selectedMessage.loadRef}</strong>
                    </p>
                    <p>
                      <span>LOCATION</span>
                      <strong>DOCUMENTS · INCOMING</strong>
                    </p>
                    <button type="button" onClick={onOpenDocuments}>OPEN DOCUMENTS</button>
                  </div>
                </section>
              )}
            </div>
          </article>
        ) : (
          <div className="email-empty-reading">
            <span>INBOX</span>
            <strong>Select a message to read.</strong>
            <small>Routine operational paperwork lives in Documents. Email is for people, changes, and exceptions.</small>
          </div>
        )}
      </section>
    </div>
  )
}
