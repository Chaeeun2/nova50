import './AdminEditModal.css'

export default function AdminEditModal({
  children,
  footer,
  onClose,
  open,
  size = 'default',
  title,
}) {
  if (!open) {
    return null
  }

  const modalClassName = [
    'admin-edit-modal',
    size === 'wide' ? 'admin-edit-modal--wide' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="admin-edit-modal-backdrop" role="presentation" onClick={onClose}>
      <article
        className={modalClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-edit-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-edit-modal__header">
          <h3 id="admin-edit-modal-title">{title}</h3>
          <div className="admin-edit-modal__header-actions">
            {footer}
            <button className="admin-button admin-button-secondary" type="button" onClick={onClose}>
              닫기
            </button>
          </div>
        </header>

        <div className="admin-edit-modal__body">{children}</div>
      </article>
    </div>
  )
}
