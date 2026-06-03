import { useEffect, useMemo, useState } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  normalizeWorksFilterTags,
  sortWorksTagsAlphabetically,
} from '../../src/data/worksFilterTags'
import AdminEditModal from '../components/AdminEditModal'
import AdminLayout from '../components/AdminLayout'
import ImageUploader from '../components/ImageUploader'
import AdminMediaPreview from '../components/AdminMediaPreview'
import AdminMediaRemoveButton from '../components/AdminMediaRemoveButton'
import TagManageModal from '../components/TagManageModal'
import WorksTagCheckboxGroup from '../components/WorksTagCheckboxGroup'
import { pageContentService, worksService } from '../services/dataService'
import {
  collectWorkMediaUrls,
  deleteMediaAsset,
  deleteMediaAssets,
  mediaRefFromPendingFile,
  mediaRefFromUrl,
  resolveMediaRef,
  revokeMediaPreview,
  getMediaDisplayUrl,
  revokeMediaPreviews,
} from '../utils/r2Media'

const emptyWork = {
  koreanTitle: '',
  modalKoreanTitle: '',
  englishTitle: '',
  date: '',
  client: '',
  location: '',
  whatWeDid: '',
  cardTags: [],
  tags: [],
  thumbnail: '',
  detailImages: [],
}

function normalizeEnglishTitle(value) {
  if (typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object') {
    return value.pc || value.mo || ''
  }

  return ''
}

function normalizeWork(work = {}) {
  return {
    ...emptyWork,
    ...work,
    englishTitle: normalizeEnglishTitle(work.englishTitle),
    tags: orderWorkTags(work.tags),
    cardTags: normalizeCardTags(work),
    detailImages: Array.isArray(work.detailImages) ? work.detailImages : [],
  }
}

function orderWorkTags(tags = []) {
  const selected = Array.isArray(tags) ? tags : []

  return sortWorksTagsAlphabetically(selected)
}

function normalizeCardTags(work = {}) {
  const fullTags = orderWorkTags(work.tags)

  if (Array.isArray(work.cardTags) && work.cardTags.length > 0) {
    return orderWorkTags(work.cardTags).filter((tag) => fullTags.includes(tag))
  }

  return fullTags
}

function syncCardTagsWithFullTags(cardTags, fullTags) {
  return orderWorkTags(cardTags).filter((tag) => fullTags.includes(tag))
}

function stripRemovedTagsFromWork(work, removedTags) {
  if (!removedTags.length) {
    return work
  }

  return {
    ...work,
    tags: orderWorkTags(work.tags).filter((tag) => !removedTags.includes(tag)),
    cardTags: orderWorkTags(work.cardTags).filter((tag) => !removedTags.includes(tag)),
  }
}

function toggleWorkTag(tags, tag) {
  if (tags.includes(tag)) {
    return tags.filter((item) => item !== tag)
  }

  return orderWorkTags([...tags, tag])
}

function workToDraft(work = {}) {
  const normalized = normalizeWork(work)

  return {
    ...normalized,
    thumbnailMedia: mediaRefFromUrl(normalized.thumbnail),
    detailImagesMedia: normalized.detailImages.map((url) => mediaRefFromUrl(url)),
  }
}

function stripDraftMedia(draft) {
  const { thumbnailMedia, detailImagesMedia, ...rest } = draft

  return {
    ...rest,
    thumbnail: thumbnailMedia?.url || '',
    detailImages: (detailImagesMedia || []).map((media) => media.url).filter(Boolean),
  }
}

function revokeWorkDraftMedia(draft) {
  if (!draft) {
    return
  }

  revokeMediaPreview(draft.thumbnailMedia)
  revokeMediaPreviews(draft.detailImagesMedia)
}

function getWorkEnglishSubtitle(work) {
  return normalizeEnglishTitle(work.englishTitle).replace(/\s+/g, ' ').trim()
}

function getWorkYear(work) {
  const yearMatch = work.date?.match(/\d{4}/)
  return yearMatch ? yearMatch[0] : work.date || '-'
}

function getWorkCategory(work) {
  return work.cardTags?.[0] || work.tags?.[0] || '-'
}

function workMatchesSearch(work, query) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  const searchableText = [
    work.koreanTitle,
    work.modalKoreanTitle,
    getWorkEnglishSubtitle(work),
    work.client,
    work.location,
    work.date,
    ...(work.cardTags || []),
    ...(work.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return searchableText.includes(normalizedQuery)
}

function SortableDetailImageItem({ media, onDelete }) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: media.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      className={`admin-work-detail-image ${isDragging ? 'is-dragging' : ''}`}
      style={style}
      {...attributes}
    >
      <div className="admin-work-detail-image-body" {...listeners}>
        <img
          className="admin-media-preview__asset admin-media-preview__asset--fill"
          src={media.previewUrl || media.url}
          alt=""
        />
      </div>
      <AdminMediaRemoveButton ariaLabel="이미지 삭제" onClick={onDelete} />
    </div>
  )
}

function SortableWorkRow({ work, onEdit, onDelete, disabled }) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: work.id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      className={`admin-works-row ${isDragging ? 'is-dragging' : ''}`}
      style={style}
      {...attributes}
    >
      <button
        className="admin-works-drag"
        type="button"
        aria-label="순서 변경"
        title="드래그로 순서 이동"
        disabled={disabled}
        {...listeners}
      >
        <span aria-hidden="true">⠿</span>
      </button>
      <div className="admin-works-row-titles">
        <strong className="admin-works-row-title-ko">{work.koreanTitle || '제목 없음'}</strong>
        <span className="admin-works-row-title-en">{getWorkEnglishSubtitle(work) || '-'}</span>
      </div>
      <div className="admin-works-row-meta">
        <span className="admin-works-row-year">{getWorkYear(work)}</span>
      </div>
      <div className="admin-about-item-actions">
        <button className="admin-button admin-button-secondary" type="button" onClick={onEdit}>
          수정
        </button>
        <button className="admin-button admin-button-danger" type="button" onClick={onDelete}>
          삭제
        </button>
      </div>
    </li>
  )
}

export default function WorksManager() {
  const [works, setWorks] = useState([])
  const [workDraft, setWorkDraft] = useState(null)
  const [editingWorkId, setEditingWorkId] = useState(null)
  const [isCreatingWork, setIsCreatingWork] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTagOptions, setFilterTagOptions] = useState([])
  const [isTagManageOpen, setIsTagManageOpen] = useState(false)
  const [savedWorkMedia, setSavedWorkMedia] = useState(null)

  const isSearchActive = searchQuery.trim().length > 0

  const filteredWorks = useMemo(
    () => works.filter((work) => workMatchesSearch(work, searchQuery)),
    [works, searchQuery],
  )

  const dragSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const loadFilterTags = async () => {
    try {
      const data = await pageContentService.getPageContent('works')
      setFilterTagOptions(normalizeWorksFilterTags(data?.filterTags))
    } catch (error) {
      console.warn('Works 필터 태그 로딩 실패:', error)
      setFilterTagOptions([])
    }
  }

  const loadWorks = async () => {
    try {
      setLoading(true)
      setWorks(await worksService.getWorks())
    } catch (error) {
      window.alert(`Works 로딩에 실패했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFilterTags()
    loadWorks()
  }, [])

  const updateWorkDraft = (updater) => {
    setWorkDraft((currentDraft) => updater(currentDraft))
  }

  const openAddWorkModal = () => {
    setIsCreatingWork(true)
    setEditingWorkId(null)
    setSavedWorkMedia(null)
    setWorkDraft(workToDraft(emptyWork))
  }

  const openEditWorkModal = (work) => {
    setIsCreatingWork(false)
    setEditingWorkId(work.id)
    setSavedWorkMedia({
      thumbnail: work.thumbnail || '',
      detailImages: [...(work.detailImages || [])],
    })
    setWorkDraft(workToDraft(work))
  }

  const handleApplyFilterTags = async (nextTagOptions) => {
    const sortedTagOptions = sortWorksTagsAlphabetically(nextTagOptions)
    const removedTags = filterTagOptions.filter((tag) => !sortedTagOptions.includes(tag))

    try {
      await pageContentService.savePageContent('works', { filterTags: sortedTagOptions })
      setFilterTagOptions(sortedTagOptions)

      if (removedTags.length > 0) {
        const updates = works.map((work) => {
          const updated = stripRemovedTagsFromWork(work, removedTags)
          const changed =
            JSON.stringify(work.tags) !== JSON.stringify(updated.tags) ||
            JSON.stringify(work.cardTags) !== JSON.stringify(updated.cardTags)

          return { work, updated, changed }
        })

        await Promise.all(
          updates
            .filter(({ changed }) => changed)
            .map(({ work, updated }) =>
              worksService.updateWork(work.id, {
                tags: updated.tags,
                cardTags: updated.cardTags,
              }),
            ),
        )

        setWorks(updates.map(({ updated }) => updated))

        if (workDraft) {
          setWorkDraft((currentDraft) =>
            stripRemovedTagsFromWork(currentDraft, removedTags),
          )
        }
      }
    } catch (error) {
      window.alert(`태그 저장에 실패했습니다: ${error.message}`)
    }
  }

  const closeWorkModal = () => {
    revokeWorkDraftMedia(workDraft)
    setIsCreatingWork(false)
    setEditingWorkId(null)
    setSavedWorkMedia(null)
    setWorkDraft(null)
  }

  const removeWorkThumbnail = () => {
    updateWorkDraft((currentDraft) => {
      revokeMediaPreview(currentDraft.thumbnailMedia)

      return {
        ...currentDraft,
        thumbnailMedia: createEmptyMediaRef(),
      }
    })
  }

  const removeDetailImageMedia = async (mediaId) => {
    const media = workDraft?.detailImagesMedia?.find((item) => item.id === mediaId)

    if (!media) {
      return
    }

    if (media.url || media.r2Key) {
      await deleteMediaAsset(media)
    }

    updateWorkDraft((currentDraft) => {
      const nextMedia = currentDraft.detailImagesMedia.filter((item) => item.id !== mediaId)
      revokeMediaPreview(media)

      return {
        ...currentDraft,
        detailImagesMedia: nextMedia,
      }
    })
  }

  const handleDetailImageDragEnd = (dragEvent) => {
    const { active, over } = dragEvent

    if (!over || active.id === over.id) {
      return
    }

    updateWorkDraft((currentDraft) => {
      const items = currentDraft.detailImagesMedia || []
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      if (oldIndex < 0 || newIndex < 0) {
        return currentDraft
      }

      return {
        ...currentDraft,
        detailImagesMedia: arrayMove(items, oldIndex, newIndex),
      }
    })
  }

  const saveWorkDraft = async () => {
    if (!workDraft?.koreanTitle?.trim()) {
      window.alert('국문 제목을 입력해 주세요.')
      return
    }

    try {
      setSaving(true)

      const thumbnailMedia = await resolveMediaRef(workDraft.thumbnailMedia, {
        metadata: { folder: 'works/thumbnails', source: 'works-thumbnail' },
      })

      const detailImagesMedia = await Promise.all(
        (workDraft.detailImagesMedia || []).map((media) =>
          resolveMediaRef(media, {
            metadata: { folder: 'works/details', source: 'works-detail' },
          }),
        ),
      )

      const nextDetailUrls = detailImagesMedia.map((media) => media.url).filter(Boolean)

      if (savedWorkMedia?.thumbnail && savedWorkMedia.thumbnail !== thumbnailMedia.url) {
        await deleteMediaAsset({ url: savedWorkMedia.thumbnail })
      }

      const removedDetailUrls = (savedWorkMedia?.detailImages || []).filter(
        (url) => url && !nextDetailUrls.includes(url),
      )

      await deleteMediaAssets(removedDetailUrls)

      const payload = stripDraftMedia({
        ...workDraft,
        thumbnailMedia,
        detailImagesMedia,
        cardTags: workDraft.cardTags,
        tags: workDraft.tags,
        modalKoreanTitle: workDraft.modalKoreanTitle || workDraft.koreanTitle,
        order: isCreatingWork ? works.length : workDraft.order ?? 0,
      })

      if (isCreatingWork) {
        await worksService.addWork(payload)
      } else {
        await worksService.updateWork(editingWorkId, payload)
      }

      closeWorkModal()
      await loadWorks()
      window.alert('Works가 저장되었습니다.')
    } catch (error) {
      window.alert(`Works 저장에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const deleteWork = async (work) => {
    if (!window.confirm(`${work.koreanTitle || 'Works'}를 삭제하시겠습니까?`)) {
      return
    }

    try {
      await deleteMediaAssets(collectWorkMediaUrls(work))
      await worksService.deleteWork(work.id)
      await loadWorks()
    } catch (error) {
      window.alert(`Works 삭제에 실패했습니다: ${error.message}`)
    }
  }

  const handleWorkDragEnd = async (dragEvent) => {
    const { active, over } = dragEvent

    if (!over || active.id === over.id || reordering) {
      return
    }

    const oldIndex = works.findIndex((work) => work.id === active.id)
    const newIndex = works.findIndex((work) => work.id === over.id)

    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    const reorderedWorks = arrayMove(works, oldIndex, newIndex)

    setWorks(reorderedWorks)
    setReordering(true)

    try {
      await worksService.updateWorkOrder(reorderedWorks)
    } catch (error) {
      window.alert(`순서 저장에 실패했습니다: ${error.message}`)
      await loadWorks()
    } finally {
      setReordering(false)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-content">
        <div className="admin-page-title">
          <h2>WORKS 관리</h2>
        </div>

        <div className="admin-content-layout admin-main-manager-layout">
          <section className="admin-content-main admin-form-section admin-works-section">
            <div className="admin-form-section-header admin-works-section-header">
              <h4>프로젝트 목록</h4>
              <div className="admin-works-section-actions">
                <input
                  className="admin-input admin-works-search-input"
                  type="search"
                  placeholder="프로젝트 검색..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <button
                  className="admin-button admin-button-secondary"
                  type="button"
                  onClick={() => setIsTagManageOpen(true)}
                >
                  태그 관리
                </button>
                <button
                  className="admin-button admin-button-primary"
                  type="button"
                  onClick={openAddWorkModal}
                >
                  추가
                </button>
              </div>
            </div>

            {loading ? (
              <p className="admin-works-status-message">로딩 중...</p>
            ) : works.length === 0 ? (
              <p className="admin-works-status-message">
                등록된 프로젝트가 없습니다. 「추가」로 등록하세요.
              </p>
            ) : filteredWorks.length === 0 ? (
              <p className="admin-works-status-message">검색 결과가 없습니다.</p>
            ) : (
              <DndContext
                sensors={dragSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleWorkDragEnd}
              >
                <SortableContext
                  items={filteredWorks.map((work) => work.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="admin-works-list">
                    {filteredWorks.map((work) => (
                      <SortableWorkRow
                        key={work.id}
                        work={work}
                        disabled={reordering || isSearchActive}
                        onEdit={() => openEditWorkModal(work)}
                        onDelete={() => deleteWork(work)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
            {isSearchActive && filteredWorks.length > 0 && (
              <p className="admin-works-search-hint">검색 중에는 순서 변경이 비활성화됩니다.</p>
            )}
          </section>
        </div>
      </div>

      <AdminEditModal
        open={Boolean(workDraft)}
        title={isCreatingWork ? '프로젝트 추가' : '프로젝트 수정'}
        onClose={closeWorkModal}
        size="wide"
        footer={
          <>
            <button className="admin-button" type="button" disabled={saving} onClick={saveWorkDraft}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </>
        }
      >
        {workDraft && (
          <div className="admin-work-modal-sections">
            <section className="admin-work-modal-section">
              <h4>기본 정보</h4>
                <div className="admin-form-row">
                  <label htmlFor="work-modal-korean-title">국문 제목</label>
                  <input
                    id="work-modal-korean-title"
                    className="admin-input"
                    value={workDraft.koreanTitle}
                    onChange={(event) =>
                      updateWorkDraft((currentDraft) => ({
                        ...currentDraft,
                        koreanTitle: event.target.value,
                      }))
                    }
                  />
                </div>
              <div className="admin-form-row">
                <label htmlFor="work-modal-english-title">영문 제목</label>
                <input
                  id="work-modal-english-title"
                  className="admin-input"
                  value={workDraft.englishTitle}
                  onChange={(event) =>
                    updateWorkDraft((currentDraft) => ({
                      ...currentDraft,
                      englishTitle: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="admin-upload-section">
                <h4>썸네일</h4>
                <ImageUploader
                  deferUpload
                  maxFiles={1}
                  showPreview={false}
                  hintText="JPG, PNG, WebP, GIF 지원 (최대 2MB)"
                  onFilesSelected={({ previews }) => {
                    const file = previews[0]?.file

                    if (!file) {
                      return
                    }

                    updateWorkDraft((currentDraft) => ({
                      ...currentDraft,
                      thumbnailMedia: mediaRefFromPendingFile(file),
                    }))
                  }}
                />
                {getMediaDisplayUrl(workDraft.thumbnailMedia) && (
                  <AdminMediaPreview
                    className="admin-media-preview--work-thumbnail"
                    onRemove={removeWorkThumbnail}
                    removeAriaLabel="썸네일 제거"
                  >
                    <img
                      className="admin-media-preview__asset admin-media-preview__asset--work-thumbnail"
                      src={getMediaDisplayUrl(workDraft.thumbnailMedia)}
                      alt=""
                    />
                  </AdminMediaPreview>
                )}
              </div>
            </section>

            <section className="admin-work-modal-section">
              <h4>상세 정보</h4>
              <div className="admin-form-row">
                <label htmlFor="work-modal-date">일자</label>
                <input
                  id="work-modal-date"
                  className="admin-input"
                  value={workDraft.date}
                  onChange={(event) =>
                    updateWorkDraft((currentDraft) => ({
                      ...currentDraft,
                      date: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="admin-form-row">
                <label htmlFor="work-modal-client">클라이언트</label>
                <input
                  id="work-modal-client"
                  className="admin-input"
                  value={workDraft.client}
                  onChange={(event) =>
                    updateWorkDraft((currentDraft) => ({
                      ...currentDraft,
                      client: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="admin-form-row">
                <label htmlFor="work-modal-location">장소</label>
                <input
                  id="work-modal-location"
                  className="admin-input"
                  value={workDraft.location}
                  onChange={(event) =>
                    updateWorkDraft((currentDraft) => ({
                      ...currentDraft,
                      location: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="admin-form-row">
                <label htmlFor="work-modal-did">What we did</label>
                <textarea
                  id="work-modal-did"
                  className="admin-textarea"
                  value={workDraft.whatWeDid}
                  onChange={(event) =>
                    updateWorkDraft((currentDraft) => ({
                      ...currentDraft,
                      whatWeDid: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="admin-form-row">
                <span className="admin-form-row-label">전체 태그</span>
                <WorksTagCheckboxGroup
                  idPrefix="work-all-tag"
                  tagOptions={filterTagOptions}
                  ariaLabel="전체 태그"
                  tags={workDraft.tags}
                  onChange={(tag) =>
                    updateWorkDraft((currentDraft) => {
                      const tags = toggleWorkTag(currentDraft.tags, tag)

                      return {
                        ...currentDraft,
                        tags,
                        cardTags: syncCardTagsWithFullTags(currentDraft.cardTags, tags),
                      }
                    })
                  }
                />
              </div>
              <div className="admin-form-row">
                <span className="admin-form-row-label">썸네일 표시 태그</span>
                <WorksTagCheckboxGroup
                  idPrefix="work-card-tag"
                  tagOptions={filterTagOptions}
                  ariaLabel="썸네일 표시 태그"
                  enabledTags={workDraft.tags}
                  tags={workDraft.cardTags}
                  onChange={(tag) =>
                    updateWorkDraft((currentDraft) => ({
                      ...currentDraft,
                      cardTags: toggleWorkTag(currentDraft.cardTags, tag),
                    }))
                  }
                />
              </div>
              <div className="admin-upload-section">
                <h4>상세 이미지</h4>
                <small className="admin-detail-images-hint">드래그로 순서를 변경할 수 있습니다.</small>
                <ImageUploader
                  deferUpload
                  multiple
                  maxFiles={20}
                  showPreview={false}
                  hintText="JPG, PNG, WebP, GIF 지원 (최대 2MB)"
                  onFilesSelected={({ previews }) => {
                    updateWorkDraft((currentDraft) => ({
                      ...currentDraft,
                      detailImagesMedia: [
                        ...(currentDraft.detailImagesMedia || []),
                        ...previews.map((preview) => mediaRefFromPendingFile(preview.file)),
                      ],
                    }))
                  }}
                />
                {(workDraft.detailImagesMedia || []).length > 0 && (
                  <DndContext
                    sensors={dragSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDetailImageDragEnd}
                  >
                    <SortableContext
                      items={workDraft.detailImagesMedia.map((media) => media.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="admin-work-detail-images">
                        {workDraft.detailImagesMedia.map((media) => (
                          <SortableDetailImageItem
                            key={media.id}
                            media={media}
                            onDelete={() => removeDetailImageMedia(media.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </section>
          </div>
        )}
      </AdminEditModal>

      <TagManageModal
        open={isTagManageOpen}
        tags={filterTagOptions}
        onClose={() => setIsTagManageOpen(false)}
        onApply={handleApplyFilterTags}
      />
    </AdminLayout>
  )
}
