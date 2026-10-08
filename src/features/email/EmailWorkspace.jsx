import { useMemo, useState } from 'react'
import './emailWorkspace.css'

const EMAIL_FILTERS = Object.freeze([
  { id: 'ALL', label: 'ALL' },
  { id: 'UNREAD', label: 'UNREAD' },
  { id: 'OPERATIONS', label: 'OPERATIONS' },
])

function matchesFilter(message, filter) {
  if (filter === 'UNREAD') return message.unread
  if (filter === 'OPERATIONS') return Boolean(message.documentId)
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

function relatedWorkTone(message) {
  if (String(message?.statusLabel ?? '').includes('CORRECTION')) return 'waiting'
  return 'attention'
}

export default function EmailWorkspace({
  messages = [],
  selectedEmailId,
  onSelectEmail,
  onOpenDocuments,
  onClose,
}) {
  const [filter, setFilter] = useState('ALL')

  const visibleMessages = useMemo(
    () => messages.filter((message) => matchesFilter(message, filter)),
    [filter, messages],
  )
  const selectedMessage = messages.find((message) => message.id === selectedEmailId) ?? null

  return (
    <div className="email-workspace">
      <aside className="workstation-browser email-browser" aria-label="Email inbox">
        <header className="workstation-panel-header email-browser-header">
          <div>
            <span>COMMUNICATIONS</span>
            <strong>Email</strong>
            <small>Corrections, exceptions, approvals, and operational messages.</small>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Email">×</button>
        </header>

        <div className="email-filters" aria-label="Email filters">
          {EMAIL_FILTERS.map((item) => {
            const count = messages.filter((message) => matchesFilter(message, item.id)).length
            return (
              <button
                type="button"
                key={item.id}
                className={filter === item.id ? 'active' : ''}
                onClick={() => setFilter(item.id)}
              >
                <span>{item.label}</span>
                <b>{count}</b>
              </button>
            )
          })}
        </div>

        <div className="email-list">
          {visibleMessages.length === 0 ? (
            <div className="email-empty-list">
              <strong>NO MESSAGES</strong>
              <small>Routine paperwork goes to Documents. Email appears when someone needs to tell you something.</small>
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
                  {message.documentId && <em>RELATED WORK</em>}
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
                  <small>Operational message</small>
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

              {selectedMessage.documentId && (
                <section className="email-related-work">
                  <header>
                    <div>
                      <span>RELATED WORK</span>
                      <strong>{selectedMessage.relatedWorkLabel}</strong>
                    </div>
                    <b className={relatedWorkTone(selectedMessage)}>{selectedMessage.statusLabel}</b>
                  </header>
                  <div>
                    <span>LOAD</span>
                    <strong>{selectedMessage.loadRef}</strong>
                    <small>The operational paper is waiting in Documents, not attached to this email.</small>
                  </div>
                  <button type="button" onClick={() => onOpenDocuments(selectedMessage.documentId)}>
                    OPEN DOCUMENTS
                  </button>
                </section>
              )}
            </div>
          </article>
        ) : (
          <div className="email-empty-reading">
            <span>INBOX</span>
            <strong>Select a message to read.</strong>
            <small>Routine Rate Cons and clean PODs go directly to Documents Incoming.</small>
          </div>
        )}
      </section>
    </div>
  )
}
