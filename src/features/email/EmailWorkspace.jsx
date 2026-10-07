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

function senderInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'EM'
}

function attachmentTone(message) {
  if (['ACCEPTED', 'RECEIVED'].includes(message?.statusLabel)) return 'complete'
  if (String(message?.statusLabel ?? '').includes('CORRECTION')) return 'waiting'
  return 'attention'
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
                  <span>{message.documentId ? 'ATTACHMENT' : 'MESSAGE'}</span>
                  <i>{message.loadRef}</i>
                  {message.printed && <em>PRINTED</em>}
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
                  <small>1 attachment</small>
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

              <section className="email-attachments">
                <header className="email-attachments-header">
                  <div>
                    <span>ATTACHMENTS</span>
                    <strong>1 file</strong>
                  </div>
                  {selectedMessage.printed && <b>PRINTED TO DOCUMENTS</b>}
                </header>

                <article className={'email-attachment-row' + (selectedMessage.printed ? ' printed' : '')}>
                  <div className="email-attachment-thumbnail" aria-hidden="true">
                    <div>
                      <span>PDF</span>
                      <strong>{selectedMessage.loadRef}</strong>
                    </div>
                  </div>

                  <div className="email-attachment-info">
                    <strong>{selectedMessage.attachmentFileName}</strong>
                    <span>{selectedMessage.attachmentLabel}</span>
                    <small>
                      {selectedMessage.attachmentTypeLabel}
                      {' · '}
                      Load {selectedMessage.loadRef}
                      {' · '}
                      {selectedMessage.sourceLabel}
                    </small>
                  </div>

                  <div className={'email-attachment-status ' + attachmentTone(selectedMessage)}>
                    <span>{selectedMessage.statusLabel}</span>
                    <small>{selectedMessage.printed ? 'Physical copy created' : 'Digital attachment'}</small>
                  </div>

                  <div className="email-attachment-actions">
                    {selectedMessage.printed ? (
                      <button type="button" onClick={onOpenDocuments}>OPEN DOCUMENTS</button>
                    ) : (
                      <button type="button" className="primary" onClick={printAttachment}>
                        PRINT ATTACHMENT
                      </button>
                    )}
                  </div>
                </article>

                <footer className="email-print-note">
                  <span>{selectedMessage.printed ? 'PRINTED' : 'PRINT REQUIRED FOR PHYSICAL WORKFLOW'}</span>
                  <strong>
                    {selectedMessage.printed
                      ? 'The physical copy is now available on the Documents desk.'
                      : 'This attachment stays digital until you print it. Reading the email does not create a paper copy.'}
                  </strong>
                </footer>
              </section>
            </div>
          </article>
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
