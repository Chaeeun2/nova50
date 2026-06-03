import { useEffect, useState } from 'react'
import { sortWorksTagsAlphabetically } from '../../src/data/worksFilterTags'
import AdminEditModal from './AdminEditModal'

function TagChip({ tag, onRemove }) {
  return (
    <div className="admin-works-filter-chip">
      <span className="admin-works-filter-chip__label">{tag}</span>
      <button
        className="admin-tag-chip-remove"
        type="button"
        aria-label={`${tag} 삭제`}
        onClick={() => onRemove(tag)}
      >
        ×
      </button>
    </div>
  )
}

export default function TagManageModal({ open, title = '태그 관리', tags, onClose, onApply }) {
  const [draftTags, setDraftTags] = useState(tags)
  const [newTagName, setNewTagName] = useState('')

  useEffect(() => {
    if (open) {
      setDraftTags(sortWorksTagsAlphabetically(tags))
      setNewTagName('')
    }
  }, [open, tags])

  const addTag = () => {
    const trimmed = newTagName.trim()

    if (!trimmed) {
      return
    }

    if (draftTags.includes(trimmed)) {
      window.alert('이미 등록된 태그입니다.')
      return
    }

    setDraftTags((currentTags) => sortWorksTagsAlphabetically([...currentTags, trimmed]))
    setNewTagName('')
  }

  const removeTag = (tag) => {
    setDraftTags((currentTags) => currentTags.filter((item) => item !== tag))
  }

  const handleApply = () => {
    onApply(sortWorksTagsAlphabetically(draftTags))
    onClose()
  }

  return (
    <AdminEditModal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="admin-button" type="button" onClick={handleApply}>
            저장
          </button>
        </>
      }
    >
      <div className="admin-tag-manage">
        <div className="admin-tag-manage-section">
          <h5>새 태그 추가</h5>
          <div className="admin-tag-manage-add-row">
            <input
              className="admin-input"
              type="text"
              placeholder="새 태그명을 입력하세요"
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addTag()
                }
              }}
            />
            <button className="admin-button" type="button" onClick={addTag}>
              추가
            </button>
          </div>
        </div>

        <div className="admin-tag-manage-section">
          <h5>기존 태그 목록</h5>
          <p className="admin-tag-manage-hint">태그는 자동으로 알파벳순 정렬됩니다.</p>
          <div className="admin-tag-manage-list">
            {draftTags.length === 0 ? (
              <p className="admin-tag-manage-empty">등록된 태그가 없습니다.</p>
            ) : (
              <div className="admin-tag-manage-list-inner">
                {draftTags.map((tag) => (
                  <TagChip key={tag} tag={tag} onRemove={removeTag} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminEditModal>
  )
}
