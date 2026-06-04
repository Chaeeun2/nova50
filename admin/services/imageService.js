const workerUrl = import.meta.env.VITE_R2_WORKER_URL?.replace(/\/$/, '')
const uploadToken = import.meta.env.VITE_R2_UPLOAD_TOKEN

function getAuthHeaders() {
  return uploadToken ? { authorization: `Bearer ${uploadToken}` } : {}
}

function assertWorkerConfigured() {
  if (!workerUrl) {
    throw new Error('VITE_R2_WORKER_URL 설정이 필요합니다.')
  }
}

function normalizeUploadResponse(data, file) {
  const key = data.key || data.r2Key || data.path
  const publicUrl = data.publicUrl || data.url || data.imageUrl || data.fileUrl

  if (!key || !publicUrl) {
    throw new Error('Worker 응답에 key와 publicUrl이 필요합니다.')
  }

  return {
    success: true,
    fileName: data.fileName || file.name,
    key,
    r2Key: key,
    imageUrl: publicUrl,
    fileUrl: publicUrl,
    publicUrl,
    originalUrl: publicUrl,
    size: data.size || file.size,
    contentType: data.contentType || file.type || 'application/octet-stream',
  }
}

export const imageService = {
  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const maxSize = 2 * 1024 * 1024

    if (!allowedTypes.includes(file.type)) {
      throw new Error('지원되지 않는 이미지 형식입니다. (JPG, PNG, WebP, GIF만 허용)')
    }

    if (file.size > maxSize) {
      throw new Error('이미지 크기가 너무 큽니다. (최대 2MB)')
    }

    return true
  },

  validateDocumentFile(file) {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]
    const allowedExtensions = ['.pdf', '.docx', '.doc']
    const maxSize = 10 * 1024 * 1024
    const extension = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : ''
    const hasAllowedType = file.type && allowedTypes.includes(file.type)
    const hasAllowedExtension = allowedExtensions.includes(extension)

    if (!hasAllowedType && !hasAllowedExtension) {
      throw new Error('지원되지 않는 파일 형식입니다. (PDF, DOC, DOCX만 허용)')
    }

    if (file.size > maxSize) {
      throw new Error('파일 크기가 너무 큽니다. (최대 10MB)')
    }

    return true
  },

  validateVideoFile(file) {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    const allowedExtensions = ['.mp4', '.webm', '.mov']
    const maxSize = 10 * 1024 * 1024
    const extension = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : ''
    const hasAllowedType = file.type && allowedTypes.includes(file.type)
    const hasAllowedExtension = allowedExtensions.includes(extension)

    if (!hasAllowedType && !hasAllowedExtension) {
      throw new Error('지원되지 않는 동영상 형식입니다. (MP4, WebM, MOV만 허용)')
    }

    if (file.size > maxSize) {
      throw new Error('동영상 크기가 너무 큽니다. (최대 10MB)')
    }

    return true
  },

  async uploadFile(file, metadata = {}) {
    assertWorkerConfigured()

    const formData = new FormData()
    formData.append('file', file)
    formData.append('metadata', JSON.stringify(metadata))

    const response = await fetch(`${workerUrl}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || data.error || '파일 업로드에 실패했습니다.')
    }

    return normalizeUploadResponse(data, file)
  },

  async uploadImage(file, metadata = {}) {
    this.validateImageFile(file)
    return this.uploadFile(file, { ...metadata, folder: metadata.folder || 'images' })
  },

  async uploadMultipleImages(files, metadata = {}) {
    const images = await Promise.all(files.map((file) => this.uploadImage(file, metadata)))
    return { success: true, images }
  },

  async deleteImage(keyOrFileName) {
    assertWorkerConfigured()

    const response = await fetch(`${workerUrl}/files/${encodeURIComponent(keyOrFileName)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || data.error || '파일 삭제에 실패했습니다.')
    }

    return { success: true }
  },
}
