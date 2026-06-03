import AdminMediaPreview from './AdminMediaPreview'
import {
  createEmptyMediaRef,
  getMediaDisplayUrl,
  revokeMediaPreview,
} from '../utils/r2Media'

export default function PendingMediaPreview({
  media,
  onRemove,
  removeAriaLabel = '미디어 제거',
  className = '',
  assetClassName = 'admin-media-preview__asset',
}) {
  const displayUrl = getMediaDisplayUrl(media)

  if (!displayUrl) {
    return null
  }

  const isVideo =
    media?.pendingFile?.type?.startsWith('video/') ||
    /\.(mp4|webm|mov)(\?|$)/i.test(media?.url || '')

  return (
    <AdminMediaPreview
      className={className}
      onRemove={onRemove}
      removeAriaLabel={removeAriaLabel}
    >
      {isVideo ? (
        <video className={assetClassName} src={displayUrl} controls />
      ) : (
        <img className={assetClassName} src={displayUrl} alt="" />
      )}
    </AdminMediaPreview>
  )
}

export function resetMediaRef(media) {
  if (media) {
    revokeMediaPreview(media)
  }

  return createEmptyMediaRef()
}
