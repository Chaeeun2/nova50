import { imageService } from '../services/imageService'

export function getR2KeyFromPublicUrl(url) {
  if (!url || typeof url !== 'string') {
    return null
  }

  if (!url.includes('/files/')) {
    return null
  }

  try {
    const pathname = url.startsWith('http') ? new URL(url).pathname : url
    const match = pathname.match(/\/files\/(.+)$/)

    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

function createMediaId() {
  return crypto.randomUUID()
}

export function createEmptyMediaRef() {
  return {
    id: createMediaId(),
    url: '',
    r2Key: '',
    pendingFile: null,
    previewUrl: null,
  }
}

export function mediaRefFromUrl(url, r2Key = '') {
  return {
    id: createMediaId(),
    url: url || '',
    r2Key: r2Key || getR2KeyFromPublicUrl(url) || '',
    pendingFile: null,
    previewUrl: null,
  }
}

export function mediaRefFromPendingFile(file) {
  return {
    id: createMediaId(),
    url: '',
    r2Key: '',
    pendingFile: file,
    previewUrl: URL.createObjectURL(file),
  }
}

export function revokeMediaPreview(media) {
  if (media?.previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(media.previewUrl)
  }
}

export function revokeMediaPreviews(mediaList = []) {
  mediaList.forEach((media) => revokeMediaPreview(media))
}

export async function deleteMediaAsset({ url, r2Key } = {}) {
  const key = r2Key || getR2KeyFromPublicUrl(url)

  if (!key) {
    return
  }

  try {
    await imageService.deleteImage(key)
  } catch (error) {
    console.warn('R2 미디어 삭제 실패:', key, error)
  }
}

export async function deleteMediaAssets(assets = []) {
  await Promise.all(
    assets.map((asset) => {
      if (typeof asset === 'string') {
        return deleteMediaAsset({ url: asset })
      }

      return deleteMediaAsset(asset)
    }),
  )
}

export async function uploadMediaRef(
  media,
  { metadata = {}, validateFile, uploadFileFn } = {},
) {
  if (!media?.pendingFile) {
    return {
      url: media?.url || '',
      r2Key: media?.r2Key || getR2KeyFromPublicUrl(media?.url) || '',
      fileName: media?.fileName || '',
    }
  }

  const file = media.pendingFile

  if (validateFile) {
    validateFile(file)
  }

  const uploadFn = uploadFileFn || ((uploadFile, uploadMetadata) => imageService.uploadFile(uploadFile, uploadMetadata))
  const result = await uploadFn(file, metadata)

  revokeMediaPreview(media)

  return {
    url: result.publicUrl || result.imageUrl || result.fileUrl || '',
    r2Key: result.key || result.r2Key || '',
    fileName: result.fileName || file.name,
  }
}

export async function resolveMediaRef(media, options) {
  const resolved = await uploadMediaRef(media, options)

  return {
    ...createEmptyMediaRef(),
    id: media?.id || createMediaId(),
    ...resolved,
  }
}

export function getMediaDisplayUrl(media) {
  if (!media) {
    return ''
  }

  return media.previewUrl || media.url || ''
}

export function collectWorkMediaUrls(work = {}) {
  const urls = []

  if (work.thumbnail) {
    urls.push(work.thumbnail)
  }

  if (Array.isArray(work.detailImages)) {
    urls.push(...work.detailImages.filter(Boolean))
  }

  return urls
}

export function collectAboutMemberMedia(member = {}) {
  return member.image ? [member.image] : []
}

export function collectAboutServiceMedia(service = {}) {
  return service.video?.trim() ? [service.video] : []
}
