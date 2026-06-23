import emailjs from '@emailjs/browser'

const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY?.trim()
const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID?.trim()
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID?.trim()

/** EmailJS 템플릿 변수명 (대시보드 Content와 동일) */
export const EMAILJS_TEMPLATE_PARAMS = [
  'timestamp',
  'contact_name',
  'phone_number',
  'company_name',
  'inquiry_content',
]

export function isEmailJsConfigured() {
  return Boolean(publicKey && serviceId && templateId)
}

if (publicKey) {
  emailjs.init({ publicKey })
}

function formatTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(date)
}

function buildInquiryContent(inquiry, attachment) {
  const body = String(inquiry || '').trim()

  if (!attachment) {
    return body
  }

  const fileName = attachment.fileName || attachment.name || '첨부파일'
  const fileUrl =
    attachment.publicUrl || attachment.imageUrl || attachment.fileUrl || attachment.url || ''

  if (!fileUrl) {
    return `${body}\n\n[첨부파일] ${fileName}`
  }

  return `${body}\n\n[첨부파일]\n${fileName}\n${fileUrl}`
}

export async function sendContactInquiryEmail({ name, phone, company, inquiry, attachment }) {
  if (!isEmailJsConfigured()) {
    throw new Error(
      'EmailJS 설정이 완료되지 않았습니다. VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID를 확인해 주세요.',
    )
  }

  try {
    await emailjs.send(serviceId, templateId, {
      timestamp: formatTimestamp(),
      contact_name: name,
      phone_number: phone,
      company_name: company || '-',
      inquiry_content: buildInquiryContent(inquiry, attachment),
    })
  } catch (error) {
    const message =
      typeof error?.text === 'string'
        ? error.text
        : error?.message || '이메일 발송에 실패했습니다.'

    throw new Error(message)
  }

  return true
}
