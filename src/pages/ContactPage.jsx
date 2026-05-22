import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ContactMap from '../components/ContactMap'
import uploadIcon from '../assets/contact/upload.png'
import { contactPrivacyPolicy } from '../data/privacyPolicy'
import '../styles/ProjectModal.css'
import './ContactPage.css'

const revealStagger = 120
const revealDelay = (order = 0) => ({
  '--reveal-delay': `${order * revealStagger}ms`,
})

const LOCATION_ADDRESSES = {
  ko: '서울 강서구 마곡중앙로 165, 805호 (프라이빗타워1차)',
  en: '805, 165 Magokjungang-ro, Gangseo-gu, Seoul, Republic of Korea',
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
  const [isLocationActive, setIsLocationActive] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false)

  useEffect(() => {
    const revealTargets = document.querySelectorAll('[data-reveal]')

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return
          }

          entry.target.classList.add('is-revealed')
          revealObserver.unobserve(entry.target)
        })
      },
      {
        rootMargin: '0px 0px -12% 0px',
        threshold: 0.15,
      },
    )

    revealTargets.forEach((target) => revealObserver.observe(target))

    return () => revealObserver.disconnect()
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

  const handleSubmit = (event) => {
    event.preventDefault()
    window.alert('문의가 접수되었습니다.')
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

      <section className="contact-hero-section">
        <h1 data-reveal>Contact us</h1>
        <span className="contact-section-line" aria-hidden="true" data-reveal style={revealDelay(1)} />
        <div className="contact-intro" data-reveal style={revealDelay(2)}>
          <p>
            노바피프티는 사람과 브랜드를 직접 연결하는 순간을 만듭니다.
            <br />
            새로운 아이디어, 감각적인 실행, 그리고 차별화된 경험으로
            <br />
            당신의 브랜드가 빛나는 현장을 함께 완성하겠습니다.
          </p>
          <p>
            프로젝트 문의나 협업 제안은 언제든 아래 연락처로 남겨주세요.
            <br />
            검토 후, 회신 드리겠습니다.
          </p>
          <p className="contact-direct">
            (+82) 2-6949-0550 ㅣ{' '}
            <span className="contact-email-copy">
              <a href="mailto:hello@nova-50.com">hello@nova-50.com</a>
              <button
                className="contact-copy-button"
                type="button"
                aria-label="이메일 주소 복사"
                onClick={() => copyToClipboard('hello@nova-50.com')}
              >
                <CopyIcon />
              </button>
            </span>
          </p>
        </div>

        <form className="contact-form" data-reveal style={revealDelay(3)} onSubmit={handleSubmit}>
          <div className="contact-form-left">
            <label>
              <span>Your name</span>
              <input name="name" type="text" />
            </label>
            <label>
              <span>Phone number</span>
              <input name="phone" type="tel" />
            </label>
            <label>
              <span>Corporate info</span>
              <input name="company" type="text" />
            </label>
            <label className="contact-consent">
              <input name="privacy" type="checkbox" required />
              <span>
                개인정보 수집 및 이용에 동의합니다.{' '}
                <button type="button" onClick={() => setIsPrivacyModalOpen(true)}>
                  [내용 보기]
                </button>
              </span>
            </label>
            <button className="contact-submit" type="submit">
              SUBMIT <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="contact-form-right">
            <label>
              <span>About your inquiry</span>
              <textarea name="inquiry" />
            </label>
            <label className="contact-file-button">
              <input
                name="attachment"
                type="file"
                onChange={(event) => {
                  setSelectedFileName(event.target.files?.[0]?.name ?? '')
                }}
              />
              <img className="contact-file-button-icon" src={uploadIcon} alt="" aria-hidden="true" />
              Upload files
            </label>
            <p className="contact-file-name">
              {selectedFileName || '첨부된 파일 이름.pdf'}
              {selectedFileName && <button type="button" onClick={() => setSelectedFileName('')} aria-label="첨부 파일 삭제" />}
            </p>
          </div>
        </form>
      </section>

      <section className="contact-location-section">
        <div className="contact-location-header">
          <h2 data-reveal>Location</h2>
          <div className="contact-location-info" data-reveal style={revealDelay(1)}>
            <p>
              <span className="contact-address-copy">
                {LOCATION_ADDRESSES.ko}
                <button
                  className="contact-copy-button contact-copy-button--light"
                  type="button"
                  aria-label="한글 주소 복사"
                  onClick={() => copyToClipboard(LOCATION_ADDRESSES.ko)}
                >
                  <CopyIcon variant="light" />
                </button>
              </span>
            </p>
            <p>
              <span className="contact-address-copy">
                {LOCATION_ADDRESSES.en}
                <button
                  className="contact-copy-button contact-copy-button--light"
                  type="button"
                  aria-label="영문 주소 복사"
                  onClick={() => copyToClipboard(LOCATION_ADDRESSES.en)}
                >
                  <CopyIcon variant="light" />
                </button>
              </span>
            </p>
            <p>
              (+82) 2-6949-0550 ㅣ <a href="mailto:hello@nova-50.com">hello@nova-50.com</a>
            </p>
          </div>
        </div>
        <div className="contact-map-frame" data-reveal style={revealDelay(2)}>
          <ContactMap />
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
