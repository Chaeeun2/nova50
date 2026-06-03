import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { pageContentService } from '../services/dataService'

export default function JsonPageManager({ defaultContent, pageId, title, embedded = false }) {
  const [contentJson, setContentJson] = useState(JSON.stringify(defaultContent, null, 2))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadPageContent() {
      try {
        setLoading(true)
        const data = await pageContentService.getPageContent(pageId)

        if (isMounted && data?.content) {
          setContentJson(JSON.stringify(data.content, null, 2))
        }
      } catch (error) {
        window.alert(`${title} 데이터 로딩에 실패했습니다: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadPageContent()

    return () => {
      isMounted = false
    }
  }, [defaultContent, pageId, title])

  const saveContent = async () => {
    try {
      setSaving(true)
      await pageContentService.savePageContent(pageId, { content: JSON.parse(contentJson) })
      window.alert(`${title} 콘텐츠가 저장되었습니다.`)
    } catch (error) {
      window.alert(`저장에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const resetToDefault = () => {
    if (window.confirm('현재 입력값을 기본 콘텐츠로 되돌릴까요? 저장 전까지는 반영되지 않습니다.')) {
      setContentJson(JSON.stringify(defaultContent, null, 2))
    }
  }

  const editorPanel = (
    <div className="admin-content-layout admin-main-manager-layout">
      <section className="admin-content-main admin-form-section">
        <div className="admin-content-header">
          <div>
            <h3 className="admin-content-title">{title} 콘텐츠 JSON</h3>
            <p className="admin-content-description">
              현재 1차 버전은 페이지 콘텐츠를 JSON으로 관리합니다. 줄바꿈은 문자열 안의 \n 형식을 유지합니다.
            </p>
          </div>
          <div className="admin-header-buttons">
            <button className="admin-button" type="button" onClick={resetToDefault}>
              기본값 불러오기
            </button>
            <button className="admin-button" type="button" disabled={saving} onClick={saveContent}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>

        {loading ? (
          <p>로딩 중...</p>
        ) : (
          <textarea
            className="admin-json-editor"
            value={contentJson}
            onChange={(event) => setContentJson(event.target.value)}
            spellCheck={false}
          />
        )}
      </section>
    </div>
  )

  if (embedded) {
    return editorPanel
  }

  return (
    <AdminLayout>
      <div className="admin-content">
        <div className="admin-page-title admin-page-title-with-actions">
          <h2>{title} 관리</h2>
          <button className="admin-button" type="button" disabled={saving} onClick={saveContent}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
        {editorPanel}
      </div>
    </AdminLayout>
  )
}
