import { useMemo, useState } from 'react'
import './emailWorkspace.css'

const EMAIL_FILTERS = Object.freeze([
  { id: 'ALL', label: 'ALL' },
  { id: 'UNREAD', label: 'UNREAD' },
  { id: 'ATTACHMENTS', label: 'ATTACHMENTS' },
])

function matchesFilter(message, filter) {
  if (filter === 'UNREAD') return message.unread
  if (filter === 'ATTACHMENTS') return Boolean(message.documentId)
  return true
}

function emailTone(message) {
  if (message.unread) return 'unread'
  if (message.printed) return 'printed'
  return 'read'
}

export default function EmailWorkspace({
  messages = [],
  selectedEmailId,
  onSelectEmail,
  onPrintDocument,
  onOpenDocuments,
  onClose,
}) {
  const [filter, setFilter] = useState('ALL')
  const [notice, setNotice] = useState(null)

  const visibleMessages = useMemo(
    () => messages.filter((message) => matchesFilter(message, filter)),
    [filter, messages],
  )
  const selectedMessage = messages.find((message) => message.id === selectedEmailId) ?? null

  const printAttachment = () => {
    if (!selectedMessage?.documentId) return
    const result = onPrintDocument(selectedMessage.documentId)
    if (result?.message) {
      setNotice({
        tone: result.ok ? 'success' : 'error',
        message: result.message,
      })
    }
  }

  return (
    <div className="email-workspace">
      <aside className="workstation-browser email-browser" aria-label="Email inbox">
        <header className="workstation-panel-header email-browser-header">
          <div>
            <span>COMMUNICATIONS</span>
            <strong>Email</strong>
            <small>External paperwork and business notices arrive here first.</small>
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

        {notice && (
          <button
            type="button"
            className={'email-notice ' + notice.tone}
            onClick={() => setNotice(null)}
            aria-label="Dismiss email notice"
          >
            {notice.message}
          </button>
        )}

        <div className="email-list">
          {visibleMessages.length === 0 ? (
            <div className="email-empty-list">
              <strong>NO MESSAGES</strong>
              <small>No email matches this filter.</small>
            </div>
          ) : visibleMessages.map((message) => {
            const selected = message.id === selectedEmailId
            return (
              <button
                type="button"
                key={message.id}
                className={'email-row ' + emailTone(message) + (selected ? ' selected' : '')}
                onClick={() => onSelectEmail(message.id)}
                aria-pressed={selected}
              >
                <div className="email-row-topline">
                  <span>{message.senderName}</span>
                  <small>{message.issuedAtLabel}</small>
                </div>
                <strong>{message.subject}</strong>
                <p>{message.preview}</p>
                <div className="email-row-meta">
                  <i>{message.loadRef}</i>
                  <em>{message.printed ? 'PRINTED' : message.unread ? 'NEW' : 'READ'}</em>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="email-reading-pane" aria-label="Email message">
        {selectedMessage ? (
          <>
            <header className="email-message-header">
              <div>
                <span>MESSAGE</span>
                <strong>{selectedMessage.subject}</strong>
                <small>From: {selectedMessage.senderName} · {selectedMessage.senderAddress}</small>
              </div>
              <div className={'email-message-state ' + emailTone(selectedMessage)}>
                <span>{selectedMessage.printed ? 'PRINTED' : selectedMessage.unread ? 'NEW' : 'OPENED'}</span>
              </div>
            </header>

            <div className="email-message-body">
              <div className="email-message-copy">
                <p>{selectedMessage.body}</p>
              </div>

              <section className={'email-attachment-card ' + (selectedMessage.printed ? 'printed' : '')}>
                <header>
                  <div>
                    <span>ATTACHMENT</span>
                    <strong>{selectedMessage.attachmentLabel}</strong>
                    <small>{selectedMessage.attachmentTypeLabel} · Load {selectedMessage.loadRef}</small>
                  </div>
                  <b>{selectedMessage.statusLabel}</b>
                </header>

                <div className="email-attachment-preview">
                  <div className="email-attachment-sheet">
                    <span>{selectedMessage.attachmentLabel}</span>
                    <strong>{selectedMessage.loadRef}</strong>
                    <small>{selectedMessage.sourceLabel}</small>
                  </div>
                </div>

                <footer>
                  <div>
                    <span>{selectedMessage.printed ? 'PHYSICAL COPY CREATED' : 'DIGITAL ATTACHMENT'}</span>
                    <strong>
                      {selectedMessage.printed
                        ? 'This paper is now available in Documents.'
                        : 'Print this attachment to place a physical copy on the Documents desk.'}
                    </strong>
                  </div>
                  {selectedMessage.printed ? (
                    <button type="button" onClick={onOpenDocuments}>OPEN DOCUMENTS</button>
                  ) : (
                    <button type="button" className="primary" onClick={printAttachment}>
                      PRINT ATTACHMENT
                    </button>
                  )}
                </footer>
              </section>
            </div>
          </>
        ) : (
          <div className="email-empty-reading">
            <span>INBOX</span>
            <strong>Select a message to read.</strong>
            <small>Paperwork does not enter Documents until you print its attachment.</small>
          </div>
        )}
      </section>
    </div>
  )
}
