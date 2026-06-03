/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ContactMap from '../components/ContactMap'
const uploadIcon = '/contact/upload.png'
import { createEmptyContactContent } from '../data/pageContentDefaults'
import { contactPrivacyPolicy } from '../data/privacyPolicy'
import '../styles/ProjectModal.css'
import { useRevealAnimations } from '../hooks/useRevealAnimations'
import { getPageContent, submitContactInquiry } from '../services/mainPageService'
import { uploadFile } from '../services/uploadService'
import { CONTACT_ATTACHMENT_ACCEPT, validateContactAttachment } from '../utils/contactAttachment'
import { revealDelay } from '../utils/reveal'
import './ContactPage.css'

const contactTitle = (
  <>
    Conta<span className="contact-title-ct-gap">c</span>t us
  </>
)

export const defaultContactContent = createEmptyContactContent()

function mergeDeviceText(defaults = {}, remote = {}) {
  return { ...defaults, ...remote }
}

export function mergeContactPageContent(content) {
  const remote = content || {}

  return {
    ...defaultContactContent,
    ...remote,
    copy: {
      lead: mergeDeviceText(defaultContactContent.copy.lead, remote.copy?.lead),
      follow: mergeDeviceText(defaultContactContent.copy.follow, remote.copy?.follow),
    },
    address: {
      ...defaultContactContent.address,
      ...(remote.address || {}),
    },
    phone: remote.phone ?? defaultContactContent.phone,
    email: remote.email ?? defaultContactContent.email,
  }
}

function CopyIcon({ variant = 'dark' }) {
  const fill = variant === 'light' ? 'rgba(255,255,255,0.6)' : 'black'

  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M0 4.41174H10.5882V15H0V4.41174Z" fill={fill} />
      <path d="M15.0003 0V10.5882H13.4877V1.5126H4.41211V0H15.0003Z" fill={fill} />
    </svg>
  )
}

function ContactPage() {
  const [pageText, setPageText] = useState(defaultContactContent)
  const [isLocationActive, setIsLocationActive] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useRevealAnimations()

  useEffect(() => {
    let isMounted = true

    async function loadContactContent() {
      try {
        const data = await getPageContent('contact')

        if (isMounted && data?.content) {
          setPageText(mergeContactPageContent(data.content))
        }
      } catch (error) {
        console.warn('Contact 데이터 로딩 실패:', error)
      }
    }

    loadContactContent()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const updateLocationState = () => {
      const locationSection = document.querySelector('.contact-location-section')
      setIsLocationActive(Boolean(locationSection && locationSection.getBoundingClientRect().top < 80))
    }

    updateLocationState()
    window.addEventListener('scroll', updateLocationState, { passive: true })
    window.addEventListener('resize', updateLocationState)

    return () => {
      window.removeEventListener('scroll', updateLocationState)
      window.removeEventListener('resize', updateLocationState)
    }
  }, [])

  useEffect(() => {
    if (!isPrivacyModalOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsPrivacyModalOpen(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPrivacyModalOpen])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      setIsSubmitting(true)

      let attachment = null

      if (selectedFile) {
        const attachmentValidation = validateContactAttachment(selectedFile)

        if (!attachmentValidation.ok) {
          window.alert(attachmentValidation.message)
          return
        }

        const uploadResult = await uploadFile(selectedFile, {
          folder: 'contact',
          source: 'contact-form',
        })

        attachment = uploadResult
      }

      await submitContactInquiry({
        name: String(formData.get('name') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        company: String(formData.get('company') || '').trim(),
        inquiry: String(formData.get('inquiry') || '').trim(),
        attachment,
      })

      form.reset()
      setSelectedFile(null)
      setSelectedFileName('')
      window.alert('문의가 접수되었습니다.')
    } catch (error) {
      window.alert(`문의 접수에 실패했습니다: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard?.writeText(text)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    window.alert('복사되었습니다.')
  }

  return (
    <main className="contact-page">
      <Header currentPage="contact" forceDark={isLocationActive} variant="light" />

      <section className="contact-hero-section" data-reveal-section>
        <h1 data-reveal-item style={revealDelay(0)}>
          <span className="contact-title-pc">{contactTitle}</span>
          <span className="contact-title-mo">{contactTitle}</span>
        </h1>
        <span
          className="contact-section-line"
          aria-hidden="true"
          data-reveal-item
          style={revealDelay(1)}
        />
        <div className="contact-intro" data-reveal-item style={revealDelay(2)}>
          <p className="contact-intro-lead-pc">{pageText.copy.lead.pc}</p>
          <p className="contact-intro-lead-mo">{pageText.copy.lead.mo}</p>
          <p className="contact-intro-follow-pc">{pageText.copy.follow.pc}</p>
          <p className="contact-intro-follow-mo">{pageText.copy.follow.mo}</p>
          <p className="contact-direct">
            <span className="contact-direct-pc">
              {pageText.phone} ㅣ{' '}
              <span className="contact-email-copy">
                <a href={`mailto:${pageText.email}`}>{pageText.email}</a>
                <button
                  className="contact-copy-button"
                  type="button"
                  aria-label="이메일 주소 복사"
                  onClick={() => copyToClipboard(pageText.email)}
                >
                  <CopyIcon />
                </button>
              </span>
            </span>
            <span className="contact-direct-mo">
              {pageText.phone}
              <br />
              <span className="contact-email-copy">
                <a href={`mailto:${pageText.email}`}>{pageText.email}</a>
                <button
                  className="contact-copy-button"
                  type="button"
                  aria-label="이메일 주소 복사"
                  onClick={() => copyToClipboard(pageText.email)}
                >
                  <CopyIcon />
                </button>
              </span>
            </span>
          </p>
        </div>

        <form
          className="contact-form"
          data-reveal-item
          style={revealDelay(3)}
          onSubmit={handleSubmit}
        >
          <div className="contact-form-left">
            <label className="contact-form-order-1">
              <span>Your name</span>
              <input name="name" type="text" />
            </label>
            <label className="contact-form-order-2">
              <span>Phone number</span>
              <input name="phone" type="tel" />
            </label>
            <label className="contact-form-order-3">
              <span>Corporate info</span>
              <input name="company" type="text" />
            </label>
            <label className="contact-consent contact-form-order-7">
              <input name="privacy" type="checkbox" required />
              <span>
                개인정보 수집 및 이용에 동의합니다.{' '}
                <button type="button" onClick={() => setIsPrivacyModalOpen(true)}>
                  [내용 보기]
                </button>
              </span>
            </label>
            <button className="contact-submit contact-form-order-8" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'} <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="contact-form-right">
            <label className="contact-form-order-4">
              <span>About your inquiry</span>
              <textarea name="inquiry" />
            </label>
            <div className="contact-file-upload contact-form-order-5">
              <label className="contact-file-button">
                <input
                  name="attachment"
                  type="file"
                  accept={CONTACT_ATTACHMENT_ACCEPT}
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null

                    if (!file) {
                      setSelectedFile(null)
                      setSelectedFileName('')
                      return
                    }

                    const validation = validateContactAttachment(file)

                    if (!validation.ok) {
                      window.alert(validation.message)
                      event.target.value = ''
                      setSelectedFile(null)
                      setSelectedFileName('')
                      return
                    }

                    setSelectedFile(file)
                    setSelectedFileName(file.name)
                  }}
                />
                <img className="contact-file-button-icon" src={uploadIcon} alt="" aria-hidden="true" />
                Upload files
              </label>
              <p className="contact-file-caption">
                <span>최대 10MB까지 첨부 가능합니다.<br/>대용량 파일은{' '}
                  <a href={`mailto:${pageText.email}`}>{pageText.email}</a>으로 보내주세요.
                </span>
              </p>
            </div>
            {selectedFileName && (
              <p className="contact-file-name contact-form-order-6">
                {selectedFileName}
                <button
                  type="button"
                  className="contact-file-remove"
                  onClick={() => {
                    setSelectedFile(null)
                    setSelectedFileName('')
                  }}
                  aria-label="첨부 파일 삭제"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </p>
            )}
          </div>
        </form>
      </section>

      <section className="contact-location-section" data-reveal-section>
        <div className="contact-location-header">
          <h2 data-reveal-item style={revealDelay(0)}>Location</h2>
          <div className="contact-location-info" data-reveal-item style={revealDelay(1)}>
            <p>
              <span className="contact-address-copy">
                {pageText.address.ko}
                <button
                  className="contact-copy-button contact-copy-button--light"
                  type="button"
                  aria-label="한글 주소 복사"
                  onClick={() => copyToClipboard(pageText.address.ko)}
                >
                  <CopyIcon variant="light" />
                </button>
              </span>
            </p>
            <p>
              <span className="contact-address-copy">
                {pageText.address.en}
                <button
                  className="contact-copy-button contact-copy-button--light"
                  type="button"
                  aria-label="영문 주소 복사"
                  onClick={() => copyToClipboard(pageText.address.en)}
                >
                  <CopyIcon variant="light" />
                </button>
              </span>
            </p>
            <p>
              {pageText.phone} ㅣ <a href={`mailto:${pageText.email}`}>{pageText.email}</a>
            </p>
          </div>
        </div>
        <div className="contact-map-frame" data-reveal-item style={revealDelay(2)}>
          <ContactMap address={pageText.address.ko} />
        </div>
      </section>

      {isPrivacyModalOpen && (
        <div
          className="project-modal-overlay"
          role="presentation"
          onClick={() => setIsPrivacyModalOpen(false)}
        >
          <article
            className="project-modal project-modal--text-only"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-privacy-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="project-modal-close"
              type="button"
              aria-label="개인정보 안내 닫기"
              onClick={() => setIsPrivacyModalOpen(false)}
            />
            <div className="project-modal-content">
              <div className="project-modal-title">
                <h2 id="contact-privacy-title">{contactPrivacyPolicy.title}</h2>
              </div>
              <div className="project-modal-description">
                <p>{contactPrivacyPolicy.content}</p>
              </div>
            </div>
          </article>
        </div>
      )}

      <Footer />
    </main>
  )
}

export default ContactPage
