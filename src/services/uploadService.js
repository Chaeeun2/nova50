const workerUrl = import.meta.env.VITE_R2_WORKER_URL?.replace(/\/$/, '')
const uploadToken = import.meta.env.VITE_R2_UPLOAD_TOKEN

function getAuthHeaders() {
  return uploadToken ? { authorization: `Bearer ${uploadToken}` } : {}
}

export async function uploadFile(file, metadata = {}) {
  if (!workerUrl) {
    throw new Error('VITE_R2_WORKER_URL 설정이 필요합니다.')
  }

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

  return {
    fileName: data.fileName || file.name,
    key: data.key || data.r2Key || data.path,
    publicUrl: data.publicUrl || data.url || data.fileUrl || data.imageUrl,
    size: data.size || file.size,
    contentType: data.contentType || file.type || 'application/octet-stream',
  }
}
