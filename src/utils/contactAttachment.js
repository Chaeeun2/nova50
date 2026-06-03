export const MAX_CONTACT_ATTACHMENT_SIZE = 10 * 1024 * 1024
export const CONTACT_ATTACHMENT_MAX_SIZE_MB = 10

export const CONTACT_ATTACHMENT_FORMATS_LABEL =
  'PDF, Word, Excel, PowerPoint, JPG, PNG, WEBP, TXT'

export const CONTACT_ATTACHMENT_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt'

const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'txt',
])

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
])

function getFileExtension(fileName = '') {
  if (!fileName.includes('.')) {
    return ''
  }

  return fileName.split('.').pop()?.toLowerCase() || ''
}

export function validateContactAttachment(file) {
  if (!file) {
    return { ok: true }
  }

  if (file.size > MAX_CONTACT_ATTACHMENT_SIZE) {
    return {
      ok: false,
      message: '첨부파일은 최대 10MB까지 업로드할 수 있습니다.',
    }
  }

  const extension = getFileExtension(file.name)

  if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
    return {
      ok: false,
      message:
        '허용되지 않는 파일 형식입니다. PDF, Word, Excel, PowerPoint, JPG, PNG, WEBP, TXT 파일만 업로드할 수 있습니다.',
    }
  }

  const mimeType = file.type?.toLowerCase() || ''

  if (
    mimeType &&
    mimeType !== 'application/octet-stream' &&
    !ALLOWED_MIME_TYPES.has(mimeType)
  ) {
    return {
      ok: false,
      message:
        '허용되지 않는 파일 형식입니다. PDF, Word, Excel, PowerPoint, JPG, PNG, WEBP, TXT 파일만 업로드할 수 있습니다.',
    }
  }

  return { ok: true }
}
