import emailjs from '@emailjs/browser'

const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID

export function isEmailJsConfigured() {
  return Boolean(publicKey && serviceId && templateId)
}

function formatSubmittedAt(date = new Date()) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(date)
}

function resolveAttachmentFields(attachment) {
  if (!attachment) {
    return {
      attachment_name: '없음',
      attachment_url: '없음',
    }
  }

  return {
    attachment_name: attachment.fileName || attachment.name || '첨부파일',
    attachment_url:
      attachment.publicUrl || attachment.imageUrl || attachment.fileUrl || attachment.url || '없음',
  }
}

export async function sendContactInquiryEmail({ name, phone, company, inquiry, attachment }) {
  if (!isEmailJsConfigured()) {
    return false
  }

  const attachmentFields = resolveAttachmentFields(attachment)

  await emailjs.send(
    serviceId,
    templateId,
    {
      name,
      phone,
      company: company || '-',
      inquiry,
      submitted_at: formatSubmittedAt(),
      ...attachmentFields,
    },
    { publicKey },
  )

  return true
}
