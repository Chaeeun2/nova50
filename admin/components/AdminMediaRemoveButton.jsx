export default function AdminMediaRemoveButton({
  onClick,
  onPointerDown,
  ariaLabel = '미디어 제거',
  className = '',
}) {
  return (
    <button
      type="button"
      className={`admin-media-remove-button${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
      onPointerDown={(event) => {
        event.stopPropagation()
        onPointerDown?.(event)
      }}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(event)
      }}
    >
      ×
    </button>
  )
}
