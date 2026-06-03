const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://nova-50.web.app',
  'https://nova-50.firebaseapp.com',
]

const MAX_IMAGE_UPLOAD_SIZE = 2 * 1024 * 1024
const MAX_FILE_UPLOAD_SIZE = 50 * 1024 * 1024
const MAX_CONTACT_UPLOAD_SIZE = 10 * 1024 * 1024
const CONTACT_ALLOWED_FILE_TYPES = new Set([
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
const ALLOWED_FILE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

function json(data, init = {}, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...init.headers,
    },
  })
}

function getAllowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) {
    return false
  }

  if (allowedOrigins.includes(origin)) {
    return true
  }

  return origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get('origin')
  const allowedOrigins = getAllowedOrigins(env)
  const allowOrigin = isAllowedOrigin(origin, allowedOrigins) ? origin : allowedOrigins[0]

  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
    vary: 'Origin',
  }
}

function requireUploadToken(request, env) {
  if (!env.ADMIN_UPLOAD_TOKEN) {
    return true
  }

  return request.headers.get('authorization') === `Bearer ${env.ADMIN_UPLOAD_TOKEN}`
}

function parseMetadata(value) {
  if (!value) {
    return {}
  }

  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

function sanitizeSegment(value, fallback = 'file') {
  return (value || fallback)
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || fallback
}

function createObjectKey(file, metadata) {
  const folder = sanitizeSegment(metadata.folder || 'images', 'images')
  const extension = sanitizeSegment(file.name.split('.').pop() || 'bin', 'bin').toLowerCase()
  const basename = sanitizeSegment(file.name.replace(/\.[^.]+$/, ''), 'file')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const random = crypto.randomUUID().slice(0, 8)

  return `${folder}/${timestamp}-${random}-${basename}.${extension}`
}

function getPublicUrl(request, key) {
  const url = new URL(request.url)
  return `${url.origin}/files/${encodeURIComponent(key)}`
}

function getFileKey(pathname) {
  const encodedKey = pathname.replace(/^\/files\/?/, '')

  if (!encodedKey) {
    return null
  }

  return decodeURIComponent(encodedKey)
}

const EXTENSION_CONTENT_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
}

const CONTACT_ALLOWED_EXTENSIONS = new Set([
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

function getFileExtension(fileName = '') {
  if (!fileName.includes('.')) {
    return ''
  }

  return fileName.split('.').pop()?.toLowerCase() || ''
}

function resolveUploadContentType(file, allowedTypes) {
  if (file.type && allowedTypes.has(file.type)) {
    return file.type
  }

  const extension = getFileExtension(file.name)
  const inferredType = extension ? EXTENSION_CONTENT_TYPES[extension] : null

  return inferredType && allowedTypes.has(inferredType) ? inferredType : null
}

function isContactFormUpload(metadata) {
  return metadata.source === 'contact-form'
}

async function handleUpload(request, env, corsHeaders) {
  if (!requireUploadToken(request, env)) {
    return json({ error: 'Unauthorized' }, { status: 401 }, corsHeaders)
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const metadata = parseMetadata(formData.get('metadata'))

  if (!(file instanceof File)) {
    return json({ error: 'file 필드가 필요합니다.' }, { status: 400 }, corsHeaders)
  }

  const contactUpload = isContactFormUpload(metadata)

  if (contactUpload) {
    const extension = getFileExtension(file.name)

    if (!extension || !CONTACT_ALLOWED_EXTENSIONS.has(extension)) {
      return json(
        {
          error:
            '허용되지 않는 파일 형식입니다. PDF, Word, Excel, PowerPoint, JPG, PNG, WEBP, TXT 파일만 업로드할 수 있습니다.',
        },
        { status: 400 },
        corsHeaders,
      )
    }

    const contentType = resolveUploadContentType(file, CONTACT_ALLOWED_FILE_TYPES)

    if (!contentType) {
      return json(
        {
          error:
            '허용되지 않는 파일 형식입니다. PDF, Word, Excel, PowerPoint, JPG, PNG, WEBP, TXT 파일만 업로드할 수 있습니다.',
        },
        { status: 400 },
        corsHeaders,
      )
    }

    if (file.size > MAX_CONTACT_UPLOAD_SIZE) {
      return json({ error: '첨부파일은 최대 10MB까지 업로드할 수 있습니다.' }, { status: 413 }, corsHeaders)
    }

    const key = createObjectKey(file, metadata)

    await env.NOVA_R2.put(key, file.stream(), {
      httpMetadata: {
        contentType,
      },
      customMetadata: {
        originalName: encodeURIComponent(file.name),
        source: metadata.source || 'contact-form',
        uploadedAt: metadata.uploadedAt || new Date().toISOString(),
      },
    })

    const publicUrl = getPublicUrl(request, key)

    return json(
      {
        key,
        publicUrl,
        imageUrl: publicUrl,
        fileName: file.name,
        size: file.size,
        contentType,
        fileUrl: publicUrl,
      },
      { status: 200 },
      corsHeaders,
    )
  }

  const contentType = resolveUploadContentType(file, ALLOWED_FILE_TYPES)

  if (!contentType) {
    return json({ error: '지원되지 않는 파일 형식입니다.' }, { status: 400 }, corsHeaders)
  }

  const maxSize = contentType.startsWith('image/') ? MAX_IMAGE_UPLOAD_SIZE : MAX_FILE_UPLOAD_SIZE

  if (file.size > maxSize) {
    return json(
      { error: `파일 크기는 최대 ${Math.round(maxSize / 1024 / 1024)}MB까지 허용됩니다.` },
      { status: 413 },
      corsHeaders,
    )
  }

  const key = createObjectKey(file, metadata)

  await env.NOVA_R2.put(key, file.stream(), {
    httpMetadata: {
      contentType,
    },
    customMetadata: {
      originalName: encodeURIComponent(file.name),
      source: metadata.source || 'admin-panel',
      uploadedAt: metadata.uploadedAt || new Date().toISOString(),
    },
  })

  const publicUrl = getPublicUrl(request, key)

  return json(
    {
      success: true,
      key,
      r2Key: key,
      fileName: file.name,
      size: file.size,
      contentType,
      publicUrl,
      imageUrl: publicUrl,
      fileUrl: publicUrl,
    },
    { status: 201 },
    corsHeaders,
  )
}

async function handleGetFile(request, env, corsHeaders) {
  const key = getFileKey(new URL(request.url).pathname)

  if (!key) {
    return json({ error: '파일 key가 필요합니다.' }, { status: 400 }, corsHeaders)
  }

  const object = await env.NOVA_R2.get(key)

  if (!object) {
    return json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 }, corsHeaders)
  }

  const headers = new Headers(corsHeaders)
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('cache-control', 'public, max-age=31536000, immutable')

  return new Response(object.body, { headers })
}

async function handleDeleteFile(request, env, corsHeaders) {
  if (!requireUploadToken(request, env)) {
    return json({ error: 'Unauthorized' }, { status: 401 }, corsHeaders)
  }

  const key = getFileKey(new URL(request.url).pathname)

  if (!key) {
    return json({ error: '파일 key가 필요합니다.' }, { status: 400 }, corsHeaders)
  }

  await env.NOVA_R2.delete(key)
  return json({ success: true, key }, {}, corsHeaders)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const corsHeaders = getCorsHeaders(request, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    if (url.pathname === '/health') {
      return json({ ok: true }, {}, corsHeaders)
    }

    if (url.pathname === '/upload' && request.method === 'POST') {
      return handleUpload(request, env, corsHeaders)
    }

    if (url.pathname.startsWith('/files/') && request.method === 'GET') {
      return handleGetFile(request, env, corsHeaders)
    }

    if (url.pathname.startsWith('/files/') && request.method === 'DELETE') {
      return handleDeleteFile(request, env, corsHeaders)
    }

    return json({ error: 'Not found' }, { status: 404 }, corsHeaders)
  },
}
