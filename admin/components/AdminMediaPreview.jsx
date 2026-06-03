import AdminMediaRemoveButton from './AdminMediaRemoveButton'

export default function AdminMediaPreview({
  children,
  className = '',
  onRemove,
  removeAriaLabel = '미디어 제거',
}) {
  return (
    <div className={`admin-media-preview${className ? ` ${className}` : ''}`}>
      {children}
      {onRemove && <AdminMediaRemoveButton ariaLabel={removeAriaLabel} onClick={onRemove} />}
    </div>
  )
}
