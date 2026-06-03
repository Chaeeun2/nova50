import ContactMap from '../../src/components/ContactMap'
import { defaultContactContent, mergeContactPageContent } from '../../src/pages/ContactPage'

const INTRO_COPY_SEPARATOR = '\n\n'

function joinIntroCopy(lead = '', follow = '') {
  if (!follow.trim()) {
    return lead
  }

  if (!lead.trim()) {
    return follow
  }

  return `${lead}${INTRO_COPY_SEPARATOR}${follow}`
}

function splitIntroCopy(combined = '') {
  const separatorIndex = combined.indexOf(INTRO_COPY_SEPARATOR)

  if (separatorIndex === -1) {
    return { lead: combined, follow: '' }
  }

  return {
    lead: combined.slice(0, separatorIndex),
    follow: combined.slice(separatorIndex + INTRO_COPY_SEPARATOR.length),
  }
}

export default function ContactContentManager({ content, loading, onUpdateContent }) {
  const updateContent = (updater) => {
    onUpdateContent((currentContent) => mergeContactPageContent(updater(currentContent)))
  }

  const updateIntroCopy = (device, value) => {
    const { lead, follow } = splitIntroCopy(value)

    updateContent((currentContent) => ({
      ...currentContent,
      copy: {
        ...currentContent.copy,
        lead: {
          ...currentContent.copy.lead,
          [device]: lead,
        },
        follow: {
          ...currentContent.copy.follow,
          [device]: follow,
        },
      },
    }))
  }

  const updateAddress = (field, value) => {
    updateContent((currentContent) => ({
      ...currentContent,
      address: {
        ...currentContent.address,
        [field]: value,
      },
    }))
  }

  if (loading) {
    return (
      <div className="admin-content-layout admin-main-manager-layout">
        <section className="admin-content-main admin-form-section">
          <p>로딩 중...</p>
        </section>
      </div>
    )
  }

  return (
    <div className="admin-content-layout admin-main-manager-layout">
      <section className="admin-content-main admin-form-section">
        <h4>소개 문구</h4>
        <div className="admin-pc-mo-grid">
          {['pc', 'mo'].map((device) => (
            <div className="admin-device-panel" key={device}>
              <h5>{device === 'pc' ? 'PC' : 'Mobile'}</h5>
              <div className="admin-form-row">
                <label htmlFor={`contact-intro-${device}`}>소개 문구</label>
                <textarea
                  id={`contact-intro-${device}`}
                  className="admin-textarea admin-textarea-large"
                  value={joinIntroCopy(content.copy.lead[device], content.copy.follow[device])}
                  onChange={(event) => updateIntroCopy(device, event.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-content-main admin-form-section">
        <h4>연락처</h4>
        <div className="admin-form-row">
          <label htmlFor="contact-phone">전화</label>
          <input
            id="contact-phone"
            className="admin-input"
            value={content.phone}
            onChange={(event) =>
              updateContent((currentContent) => ({
                ...currentContent,
                phone: event.target.value,
              }))
            }
          />
        </div>
        <div className="admin-form-row">
          <label htmlFor="contact-email">이메일</label>
          <input
            id="contact-email"
            className="admin-input"
            type="email"
            value={content.email}
            onChange={(event) =>
              updateContent((currentContent) => ({
                ...currentContent,
                email: event.target.value,
              }))
            }
          />
        </div>
      </section>

      <section className="admin-content-main admin-form-section">
        <h4>Location</h4>
        <div className="admin-form-row">
          <label htmlFor="contact-address-ko">주소 (국문)</label>
          <input
            id="contact-address-ko"
            className="admin-input"
            value={content.address.ko}
            onChange={(event) => updateAddress('ko', event.target.value)}
          />
        </div>
        <div className="admin-form-row">
          <label htmlFor="contact-address-en">주소 (영문)</label>
          <input
            id="contact-address-en"
            className="admin-input"
            value={content.address.en}
            onChange={(event) => updateAddress('en', event.target.value)}
          />
        </div>
        <p className="admin-contact-map-hint">
          지도 위치는 국문 주소를 기준으로 표시됩니다.
        </p>
        <div className="admin-contact-map-preview">
          <ContactMap address={content.address.ko} geocodeDebounceMs={500} />
        </div>
      </section>
    </div>
  )
}

export function createDefaultContactContentState() {
  return JSON.parse(JSON.stringify(defaultContactContent))
}
