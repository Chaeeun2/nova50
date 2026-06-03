/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { contactInquiryService, pageContentService } from '../services/dataService'
import ContactContentManager, { createDefaultContactContentState } from './ContactContentManager'
import { mergeContactPageContent } from '../../src/pages/ContactPage'

function formatInquiryDate(value) {
  if (!value) {
    return '날짜 없음'
  }

  try {
    const date = value?.toDate ? value.toDate() : new Date(value)

    if (Number.isNaN(date.getTime())) {
      return '날짜 형식 오류'
    }

    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '날짜 처리 오류'
  }
}

function getAttachmentDisplay(attachment) {
  if (!attachment) {
    return null
  }

  const url = attachment.publicUrl || attachment.imageUrl || attachment.fileUrl || attachment.url

  if (!url) {
    return null
  }

  return {
    url,
    fileName: attachment.fileName || attachment.name || '첨부파일',
  }
}

function getInquiryDisplay(inquiry) {
  return {
    name: inquiry.name || '-',
    phone: inquiry.phone || '-',
    company: inquiry.company || '-',
    inquiry: inquiry.inquiry || '-',
    attachment: getAttachmentDisplay(inquiry.attachment),
  }
}

export default function ContactManager() {
  const [activeTab, setActiveTab] = useState('inquiries')
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [contactContent, setContactContent] = useState(createDefaultContactContentState)
  const [contentLoading, setContentLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadInquiries = async () => {
    try {
      setLoading(true)
      setInquiries(await contactInquiryService.getInquiries())
    } catch (error) {
      window.alert(`문의 로딩에 실패했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInquiries()
  }, [])

  useEffect(() => {
    async function loadContactContent() {
      try {
        setContentLoading(true)
        const data = await pageContentService.getPageContent('contact')
        setContactContent(mergeContactPageContent(data?.content))
      } catch (error) {
        window.alert(`Contact 정보 로딩에 실패했습니다: ${error.message}`)
      } finally {
        setContentLoading(false)
      }
    }

    loadContactContent()
  }, [])

  const updateContactContent = (updater) => {
    setContactContent((currentContent) => mergeContactPageContent(updater(currentContent)))
  }

  const saveContent = async () => {
    if (activeTab !== 'info') {
      return
    }

    try {
      setSaving(true)
      await pageContentService.savePageContent('contact', { content: contactContent })
      window.alert('Contact 정보가 저장되었습니다.')
    } catch (error) {
      window.alert(`Contact 정보 저장에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const deleteInquiry = async (inquiryId) => {
    if (!window.confirm('이 문의사항을 삭제하시겠습니까?')) {
      return
    }

    try {
      await contactInquiryService.deleteInquiry(inquiryId)
      await loadInquiries()
    } catch (error) {
      window.alert(`문의 삭제에 실패했습니다: ${error.message}`)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-content admin-contact-manager">
        <div className="admin-page-title admin-page-title-with-actions">
          <h2>CONTACT 관리</h2>
          <button
            className="admin-button"
            type="button"
            disabled={activeTab !== 'info' || saving || contentLoading}
            onClick={saveContent}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>

        <div className="admin-tabs admin-tabs-underline">
          <button
            className={`admin-tab ${activeTab === 'inquiries' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab('inquiries')}
          >
            문의 관리 ({inquiries.length})
          </button>
          <button
            className={`admin-tab ${activeTab === 'info' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab('info')}
          >
            정보 관리
          </button>
        </div>

        {activeTab === 'inquiries' ? (
          <div className="admin-content-layout admin-main-manager-layout">
            <section className="admin-content-main admin-form-section">
        <h4>소개 문구</h4>

              {loading ? (
                <p>로딩 중...</p>
              ) : inquiries.length === 0 ? (
                <div className="admin-empty-state">
                  <p>등록된 문의사항이 없습니다.</p>
                </div>
              ) : (
                <div className="admin-inquiries-container">
                  {inquiries.map((inquiry) => {
                    const display = getInquiryDisplay(inquiry)

                    return (
                      <article className="admin-inquiry-item" key={inquiry.id}>
                        <div className="admin-inquiry-content">
                          <div className="admin-inquiry-info">
                            <div className="admin-inquiry-field">
                              <p className="admin-inquiry-label">이름</p>
                              {display.name}
                            </div>
                            <div className="admin-inquiry-field">
                              <p className="admin-inquiry-label">연락처</p>
                              {display.phone}
                            </div>
                            <div className="admin-inquiry-field">
                              <p className="admin-inquiry-label">기업 정보</p>
                              {display.company}
                            </div>
                            <div className="admin-inquiry-field">
                              <p className="admin-inquiry-label">첨부파일</p>
                              {display.attachment ? (
                                <a href={display.attachment.url} target="_blank" rel="noreferrer">
                                  {display.attachment.fileName}
                                </a>
                              ) : (
                                '-'
                              )}
                            </div>
                          </div>
                          <div className="admin-inquiry-details">
                            <div className="admin-inquiry-message">
                              <div className="admin-inquiry-text">{display.inquiry}</div>
                            </div>
                          </div>
                        </div>
                        <div className="admin-inquiry-header">
                          <div className="admin-inquiry-meta">
                            <span className="admin-inquiry-date">
                              {formatInquiryDate(inquiry.createdAt)}
                            </span>
                          </div>
                          <div className="admin-inquiry-actions">
                            <button
                              className="admin-button admin-button-danger"
                              type="button"
                              onClick={() => deleteInquiry(inquiry.id)}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        ) : (
          <ContactContentManager
            content={contactContent}
            loading={contentLoading}
            onUpdateContent={updateContactContent}
          />
        )}
      </div>
    </AdminLayout>
  )
}
