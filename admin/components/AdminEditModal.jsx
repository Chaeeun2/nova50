import './AdminEditModal.css'

export default function AdminEditModal({
  children,
  confirmOnClose = true,
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

  const handleCloseRequest = () => {
    if (confirmOnClose && !window.confirm('닫으시겠습니까?')) {
      return
    }

    onClose?.()
  }

  return (
    <div className="admin-edit-modal-backdrop" role="presentation" onClick={handleCloseRequest}>
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
            <button className="admin-button admin-button-secondary" type="button" onClick={handleCloseRequest}>
              닫기
            </button>
          </div>
        </header>

        <div className="admin-edit-modal__body">{children}</div>
      </article>
    </div>
  )
}
