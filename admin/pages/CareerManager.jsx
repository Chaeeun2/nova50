import { useEffect, useState } from 'react'
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createEmptyCareerContent } from '../../src/data/pageContentDefaults'
import {
  formatCareerNotesForEditor,
  getCareerApplicationFormDownloadName,
  normalizeCareerCta,
  normalizeCareerCtaOpenings,
} from '../../src/pages/CareerPage'
import AdminEditModal from '../components/AdminEditModal'
import AdminLayout from '../components/AdminLayout'
import ImageUploader from '../components/ImageUploader'
import PendingMediaPreview, { resetMediaRef } from '../components/PendingMediaPreview'
import { imageService } from '../services/imageService'
import { pageContentService } from '../services/dataService'
import {
  createEmptyMediaRef,
  deleteMediaAsset,
  getMediaDisplayUrl,
  mediaRefFromPendingFile,
  mediaRefFromUrl,
  resolveMediaRef,
  revokeMediaPreview,
} from '../utils/r2Media'

function cloneDefaultContent() {
  return createEmptyCareerContent()
}

function mergeContent(content) {
  const merged = {
    ...cloneDefaultContent(),
    ...(content || {}),
  }
  const rawCta = merged.cta || {}

  return {
    ...merged,
    cta: {
      ...normalizeCareerCta(rawCta),
      ...(rawCta.applicationFormMedia ? { applicationFormMedia: rawCta.applicationFormMedia } : {}),
    },
  }
}

function parseList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function createWorkId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `work-${Date.now()}`
}

function createWelfareId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `welfare-${Date.now()}`
}

function createOpeningId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `opening-${Date.now()}`
}

function createEmptyCtaOpening() {
  return {
    id: createOpeningId(),
    team: '',
    role: '',
  }
}

function createEmptyWork() {
  return {
    id: createWorkId(),
    title: { pc: '', mo: '' },
    copy: '',
    tags: [],
  }
}

function createEmptyWelfare() {
  return {
    id: createWelfareId(),
    title: '',
    copy: '',
    icon: '',
    iconMedia: createEmptyMediaRef(),
  }
}

function normalizeWorkList(work = []) {
  return work.map((item, index) => ({
    ...item,
    id: item.id || `work-${index}`,
    title: { pc: item.title?.pc || '', mo: item.title?.mo || '' },
    tags: Array.isArray(item.tags) ? item.tags : [],
    copy: item.copy || '',
  }))
}

function normalizeWelfareList(welfare = []) {
  return welfare.map((item, index) => ({
    ...item,
    id: item.id || `welfare-${index}`,
    title: item.title || '',
    copy: item.copy || '',
  }))
}

function resolveWelfareIconMedia(item) {
  const media = item.iconMedia

  if (media?.pendingFile || media?.previewUrl) {
    return media
  }

  if (media?.url || media?.r2Key) {
    return media
  }

  return mediaRefFromUrl(item.icon)
}

function resolveApplicationFormMedia(cta = {}) {
  const media = cta.applicationFormMedia

  if (media?.pendingFile || media?.previewUrl) {
    return media
  }

  if (media?.url || media?.r2Key) {
    return media
  }

  return mediaRefFromUrl(cta.applicationFormUrl, cta.applicationFormR2Key || '')
}

function attachCareerMediaRefs(careerContent) {
  const rawCta = careerContent.cta || {}
  const normalizedCta = normalizeCareerCta(rawCta)
  const applicationFormMedia =
    rawCta.applicationFormMedia?.pendingFile || rawCta.applicationFormMedia?.previewUrl
      ? rawCta.applicationFormMedia
      : resolveApplicationFormMedia(normalizedCta)

  return {
    ...careerContent,
    work: normalizeWorkList(careerContent.work),
    welfare: normalizeWelfareList(careerContent.welfare).map((item) => ({
      ...item,
      iconMedia: resolveWelfareIconMedia(item),
    })),
    cta: {
      ...normalizedCta,
      applicationFormMedia,
    },
  }
}

function stripCareerMediaRefs(careerContent) {
  const { applicationFormMedia, ...ctaWithoutMedia } = careerContent.cta || {}

  return {
    ...careerContent,
    welfare: (careerContent.welfare || []).map(({ iconMedia, ...item }) => item),
    cta: normalizeCareerCta(ctaWithoutMedia),
  }
}

function getWorkListTitle(item) {
  const title = item.title?.pc || item.title?.mo || ''
  const fullTitle = title
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')

  return fullTitle || '제목 없음'
}

function getWelfareListThumb(item) {
  return getMediaDisplayUrl(item.iconMedia || mediaRefFromUrl(item.icon))
}

function SortableWorkRow({ item, index, onEdit, onDelete }) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      className={`admin-about-item-row admin-career-work-row ${isDragging ? 'is-dragging' : ''}`}
      style={style}
      {...attributes}
    >
      <div
        className="admin-service-drag"
        aria-hidden="true"
        title="드래그로 순서 이동"
        {...listeners}
      >
        ⠿
      </div>
      <div className="admin-about-item-title">
        <strong>{getWorkListTitle(item)}</strong>
      </div>
      <div className="admin-about-item-actions" style={{ display: 'flex', gap: 6 }}>
        <button className="admin-button admin-button-secondary" type="button" onClick={() => onEdit(index)}>
          수정
        </button>
        <button className="admin-button admin-button-danger" type="button" onClick={() => onDelete(index)}>
          삭제
        </button>
      </div>
    </div>
  )
}

function SortableCtaOpeningRow({ item, index, onEdit, onDelete }) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      className={`admin-about-item-row admin-career-opening-row ${isDragging ? 'is-dragging' : ''}`}
      style={style}
      {...attributes}
    >
      <div
        className="admin-service-drag"
        aria-hidden="true"
        title="드래그로 순서 이동"
        {...listeners}
      >
        ⠿
      </div>
      <div className="admin-about-item-title">
        <strong>{item.team || '팀명 없음'}</strong>
      </div>
      <div className="admin-about-item-meta">{item.role || '-'}</div>
      <div className="admin-about-item-actions" style={{ display: 'flex', gap: 6 }}>
        <button className="admin-button admin-button-secondary" type="button" onClick={() => onEdit(index)}>
          수정
        </button>
        <button className="admin-button admin-button-danger" type="button" onClick={() => onDelete(index)}>
          삭제
        </button>
      </div>
    </div>
  )
}

function SortableWelfareRow({ item, index, onEdit, onDelete }) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const thumbSrc = getWelfareListThumb(item)

  return (
    <div
      ref={setNodeRef}
      className={`admin-about-item-row admin-career-welfare-row ${isDragging ? 'is-dragging' : ''}`}
      style={style}
      {...attributes}
    >
      <div
        className="admin-service-drag"
        aria-hidden="true"
        title="드래그로 순서 이동"
        {...listeners}
      >
        ⠿
      </div>
      <div className="admin-member-list-thumb-wrap">
        {thumbSrc ? (
          <img className="admin-member-list-thumb" src={thumbSrc} alt="" />
        ) : (
          <span className="admin-member-list-thumb-placeholder" aria-hidden="true">
            —
          </span>
        )}
      </div>
      <div className="admin-about-item-title">
        <strong>{item.title || '제목 없음'}</strong>
      </div>
      <div className="admin-about-item-actions" style={{ display: 'flex', gap: 6 }}>
        <button className="admin-button admin-button-secondary" type="button" onClick={() => onEdit(index)}>
          수정
        </button>
        <button className="admin-button admin-button-danger" type="button" onClick={() => onDelete(index)}>
          삭제
        </button>
      </div>
    </div>
  )
}

export default function CareerManager() {
  const [content, setContent] = useState(() => attachCareerMediaRefs(cloneDefaultContent()))
  const [savedWelfareIcons, setSavedWelfareIcons] = useState([])
  const [savedApplicationFormUrl, setSavedApplicationFormUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [editingWorkIndex, setEditingWorkIndex] = useState(null)
  const [isCreatingWork, setIsCreatingWork] = useState(false)
  const [workDraft, setWorkDraft] = useState(null)

  const [editingWelfareIndex, setEditingWelfareIndex] = useState(null)
  const [isCreatingWelfare, setIsCreatingWelfare] = useState(false)
  const [welfareDraft, setWelfareDraft] = useState(null)

  const [editingOpeningIndex, setEditingOpeningIndex] = useState(null)
  const [isCreatingOpening, setIsCreatingOpening] = useState(false)
  const [openingDraft, setOpeningDraft] = useState(null)

  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    async function loadCareerContent() {
      try {
        setLoading(true)
        const data = await pageContentService.getPageContent('career')
        const merged = attachCareerMediaRefs(mergeContent(data?.content))
        setContent(merged)
        setSavedWelfareIcons(merged.welfare.map((item) => item.icon || ''))
        setSavedApplicationFormUrl(merged.cta.applicationFormUrl || '')
      } catch (error) {
        window.alert(`CAREER 데이터 로딩에 실패했습니다: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadCareerContent()
  }, [])

  const updateContent = (updater) => {
    setContent((currentContent) => attachCareerMediaRefs(mergeContent(updater(currentContent))))
  }

  const openAddWorkModal = () => {
    setIsCreatingWork(true)
    setEditingWorkIndex(null)
    setWorkDraft(createEmptyWork())
  }

  const openEditWorkModal = (index) => {
    const item = content.work[index]

    setIsCreatingWork(false)
    setEditingWorkIndex(index)
    setWorkDraft(JSON.parse(JSON.stringify(item)))
  }

  const closeWorkModal = () => {
    setIsCreatingWork(false)
    setEditingWorkIndex(null)
    setWorkDraft(null)
  }

  const applyWorkDraft = () => {
    if (!workDraft) {
      return
    }

    updateContent((currentContent) => {
      if (isCreatingWork) {
        return {
          ...currentContent,
          work: [...currentContent.work, workDraft],
        }
      }

      return {
        ...currentContent,
        work: currentContent.work.map((item, itemIndex) =>
          itemIndex === editingWorkIndex ? workDraft : item,
        ),
      }
    })

    closeWorkModal()
  }

  const deleteWork = (index) => {
    if (!window.confirm('이 항목을 삭제하시겠습니까?')) {
      return
    }

    updateContent((currentContent) => ({
      ...currentContent,
      work: currentContent.work.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleWorkDragEnd = (dragEvent) => {
    const { active, over } = dragEvent

    if (!over || active.id === over.id) {
      return
    }

    updateContent((currentContent) => {
      const work = currentContent.work
      const oldIndex = work.findIndex((item) => item.id === active.id)
      const newIndex = work.findIndex((item) => item.id === over.id)

      if (oldIndex < 0 || newIndex < 0) {
        return currentContent
      }

      return {
        ...currentContent,
        work: arrayMove(work, oldIndex, newIndex),
      }
    })
  }

  const openAddWelfareModal = () => {
    setIsCreatingWelfare(true)
    setEditingWelfareIndex(null)
    setWelfareDraft(createEmptyWelfare())
  }

  const openEditWelfareModal = (index) => {
    const item = content.welfare[index]

    setIsCreatingWelfare(false)
    setEditingWelfareIndex(index)
    setWelfareDraft({
      ...item,
      iconMedia: resolveWelfareIconMedia(item),
    })
  }

  const closeWelfareModal = ({ revokeDraftPreview = true } = {}) => {
    if (revokeDraftPreview) {
      revokeMediaPreview(welfareDraft?.iconMedia)
    }

    setIsCreatingWelfare(false)
    setEditingWelfareIndex(null)
    setWelfareDraft(null)
  }

  const removeWelfareDraftIcon = async () => {
    if (!welfareDraft) {
      return
    }

    const media = welfareDraft.iconMedia

    if (media?.url || media?.r2Key) {
      await deleteMediaAsset(media)
    }

    setWelfareDraft((currentDraft) => ({
      ...currentDraft,
      icon: '',
      iconMedia: resetMediaRef(currentDraft.iconMedia),
    }))
  }

  const applyWelfareDraft = () => {
    if (!welfareDraft) {
      return
    }

    const welfareToApply = {
      ...welfareDraft,
      iconMedia: welfareDraft.iconMedia
        ? {
            ...welfareDraft.iconMedia,
            pendingFile: welfareDraft.iconMedia.pendingFile ?? null,
          }
        : mediaRefFromUrl(welfareDraft.icon),
    }

    updateContent((currentContent) => {
      if (isCreatingWelfare) {
        return {
          ...currentContent,
          welfare: [...currentContent.welfare, welfareToApply],
        }
      }

      return {
        ...currentContent,
        welfare: currentContent.welfare.map((item, itemIndex) =>
          itemIndex === editingWelfareIndex ? welfareToApply : item,
        ),
      }
    })

    closeWelfareModal({ revokeDraftPreview: false })
  }

  const deleteWelfare = async (index) => {
    if (!window.confirm('이 항목을 삭제하시겠습니까?')) {
      return
    }

    const media = content.welfare[index]?.iconMedia

    if (media?.url || media?.r2Key) {
      await deleteMediaAsset(media)
    }

    updateContent((currentContent) => ({
      ...currentContent,
      welfare: currentContent.welfare.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleWelfareDragEnd = (dragEvent) => {
    const { active, over } = dragEvent

    if (!over || active.id === over.id) {
      return
    }

    updateContent((currentContent) => {
      const welfare = currentContent.welfare
      const oldIndex = welfare.findIndex((item) => item.id === active.id)
      const newIndex = welfare.findIndex((item) => item.id === over.id)

      if (oldIndex < 0 || newIndex < 0) {
        return currentContent
      }

      return {
        ...currentContent,
        welfare: arrayMove(welfare, oldIndex, newIndex),
      }
    })
  }

  const openAddOpeningModal = () => {
    setIsCreatingOpening(true)
    setEditingOpeningIndex(null)
    setOpeningDraft(createEmptyCtaOpening())
  }

  const openEditOpeningModal = (index) => {
    setIsCreatingOpening(false)
    setEditingOpeningIndex(index)
    setOpeningDraft({ ...normalizeCareerCtaOpenings(content.cta.openings)[index] })
  }

  const closeOpeningModal = () => {
    setIsCreatingOpening(false)
    setEditingOpeningIndex(null)
    setOpeningDraft(null)
  }

  const applyOpeningDraft = () => {
    if (!openingDraft) {
      return
    }

    updateContent((currentContent) => {
      const openings = normalizeCareerCtaOpenings(currentContent.cta.openings, currentContent.cta.teams)

      if (isCreatingOpening) {
        return {
          ...currentContent,
          cta: {
            ...currentContent.cta,
            openings: [...openings, openingDraft],
          },
        }
      }

      return {
        ...currentContent,
        cta: {
          ...currentContent.cta,
          openings: openings.map((item, itemIndex) =>
            itemIndex === editingOpeningIndex ? openingDraft : item,
          ),
        },
      }
    })

    closeOpeningModal()
  }

  const deleteOpening = (index) => {
    if (!window.confirm('이 채용 포지션을 삭제하시겠습니까?')) {
      return
    }

    updateContent((currentContent) => ({
      ...currentContent,
      cta: {
        ...currentContent.cta,
        openings: normalizeCareerCtaOpenings(currentContent.cta.openings, currentContent.cta.teams).filter(
          (_, itemIndex) => itemIndex !== index,
        ),
      },
    }))
  }

  const handleOpeningDragEnd = (dragEvent) => {
    const { active, over } = dragEvent

    if (!over || active.id === over.id) {
      return
    }

    updateContent((currentContent) => {
      const openings = normalizeCareerCtaOpenings(currentContent.cta.openings, currentContent.cta.teams)
      const oldIndex = openings.findIndex((item) => item.id === active.id)
      const newIndex = openings.findIndex((item) => item.id === over.id)

      if (oldIndex < 0 || newIndex < 0) {
        return currentContent
      }

      return {
        ...currentContent,
        cta: {
          ...currentContent.cta,
          openings: arrayMove(openings, oldIndex, newIndex),
        },
      }
    })
  }

  const updateNotes = (value) => {
    updateContent((currentContent) => ({
      ...currentContent,
      cta: {
        ...currentContent.cta,
        notes: value,
      },
    }))
  }

  const saveContent = async () => {
    try {
      setSaving(true)

      const resolvedWelfare = await Promise.all(
        content.welfare.map((item, index) =>
          resolveMediaRef(item.iconMedia || mediaRefFromUrl(item.icon), {
            metadata: { folder: 'career/welfare', source: 'career-welfare-icon' },
          }).then((iconMedia) => ({ index, iconMedia })),
        ),
      )

      for (const { index, iconMedia } of resolvedWelfare) {
        const previousIcon = savedWelfareIcons[index] || ''

        if (previousIcon && previousIcon !== iconMedia.url) {
          await deleteMediaAsset({ url: previousIcon })
        }
      }

      const pendingApplicationFormName = content.cta.applicationFormMedia?.pendingFile?.name || ''

      const resolvedApplicationForm = await resolveMediaRef(
        content.cta.applicationFormMedia || mediaRefFromUrl(content.cta.applicationFormUrl),
        {
          metadata: { folder: 'career/application-forms', source: 'career-application-form' },
          validateFile: (file) => imageService.validateDocumentFile(file),
        },
      )

      const applicationFormFileName =
        pendingApplicationFormName ||
        resolvedApplicationForm.fileName ||
        content.cta.applicationFormFileName ||
        getCareerApplicationFormDownloadName({
          applicationFormUrl: resolvedApplicationForm.url || content.cta.applicationFormUrl,
          applicationFormFileName: content.cta.applicationFormFileName,
        })

      if (
        savedApplicationFormUrl &&
        savedApplicationFormUrl !== resolvedApplicationForm.url &&
        savedApplicationFormUrl.includes('/files/')
      ) {
        await deleteMediaAsset({ url: savedApplicationFormUrl })
      }

      const nextContent = {
        ...content,
        welfare: content.welfare.map((item, index) => {
          const resolved = resolvedWelfare.find((entry) => entry.index === index)?.iconMedia

          return {
            ...item,
            icon: resolved?.url || '',
            iconMedia: undefined,
          }
        }),
        cta: {
          ...content.cta,
          applicationFormUrl: resolvedApplicationForm.url || content.cta.applicationFormUrl || '',
          applicationFormR2Key: resolvedApplicationForm.r2Key || '',
          applicationFormFileName,
          applicationFormMedia: undefined,
        },
      }

      const payload = stripCareerMediaRefs(nextContent)

      await pageContentService.savePageContent('career', { content: payload })
      setContent(attachCareerMediaRefs(payload))
      setSavedWelfareIcons(payload.welfare.map((item) => item.icon || ''))
      setSavedApplicationFormUrl(payload.cta.applicationFormUrl || '')
      window.alert('CAREER 콘텐츠가 저장되었습니다.')
    } catch (error) {
      window.alert(`CAREER 저장에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-content">
        <div className="admin-page-title admin-page-title-with-actions">
          <h2>CAREER 관리</h2>
          <button className="admin-button" type="button" disabled={saving} onClick={saveContent}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>

        <div className="admin-content-layout admin-main-manager-layout">
          <div className="admin-main-form">
            {loading ? (
              <div className="admin-content-main">
                <p>로딩 중...</p>
              </div>
            ) : (
              <div className="admin-main-form-sections">
              <section className="admin-content-main admin-form-section">
                <h4>Hero</h4>
                <div className="admin-form-row">
                  <label htmlFor="career-hero-eyebrow">소제목</label>
                  <input
                    id="career-hero-eyebrow"
                    className="admin-input"
                    value={content.hero.eyebrow}
                    onChange={(event) =>
                      updateContent((currentContent) => ({
                        ...currentContent,
                        hero: { ...currentContent.hero, eyebrow: event.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-pc-mo-grid">
                  <div className="admin-form-row">
                    <label htmlFor="career-hero-title">타이틀</label>
                    <textarea
                      id="career-hero-title"
                      className="admin-textarea"
                      value={content.hero.title}
                      onChange={(event) =>
                        updateContent((currentContent) => ({
                          ...currentContent,
                          hero: { ...currentContent.hero, title: event.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="admin-form-row">
                    <label htmlFor="career-hero-copy">본문</label>
                    <textarea
                      id="career-hero-copy"
                      className="admin-textarea"
                      value={content.hero.copy}
                      onChange={(event) =>
                        updateContent((currentContent) => ({
                          ...currentContent,
                          hero: { ...currentContent.hero, copy: event.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="admin-content-main admin-form-section admin-career-list-section">
                <div className="admin-form-section-header">
                  <h4>How We Work</h4>
                  <button className="admin-button admin-button-primary" type="button" onClick={openAddWorkModal}>
                    추가
                  </button>
                </div>
                <DndContext
                  sensors={dragSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleWorkDragEnd}
                >
                  <SortableContext
                    items={content.work.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="admin-about-item-list">
                      {content.work.map((item, index) => (
                        <SortableWorkRow
                          key={item.id}
                          item={item}
                          index={index}
                          onEdit={openEditWorkModal}
                          onDelete={deleteWork}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </section>

              <section className="admin-content-main admin-form-section admin-career-list-section">
                <div className="admin-form-section-header">
                  <h4>Welfare</h4>
                  <button
                    className="admin-button admin-button-primary"
                    type="button"
                    onClick={openAddWelfareModal}
                  >
                    추가
                  </button>
                </div>
                <DndContext
                  sensors={dragSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleWelfareDragEnd}
                >
                  <SortableContext
                    items={content.welfare.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="admin-about-item-list">
                      {content.welfare.map((item, index) => (
                        <SortableWelfareRow
                          key={item.id}
                          item={item}
                          index={index}
                          onEdit={openEditWelfareModal}
                          onDelete={deleteWelfare}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </section>

              <section className="admin-content-main admin-form-section">
                <h4>채용</h4>
                <div className="admin-pc-mo-grid">
                  {['pc', 'mo'].map((device) => (
                    <div className="admin-device-panel" key={device}>
                      <h5>{device === 'pc' ? 'PC' : 'Mobile'}</h5>
                      <div className="admin-form-row">
                        <label htmlFor={`career-cta-title-${device}`}>타이틀</label>
                        <textarea
                          id={`career-cta-title-${device}`}
                          className="admin-textarea admin-textarea-small"
                          value={content.cta.title[device]}
                          onChange={(event) =>
                            updateContent((currentContent) => ({
                              ...currentContent,
                              cta: {
                                ...currentContent.cta,
                                title: { ...currentContent.cta.title, [device]: event.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="admin-form-row">
                        <label htmlFor={`career-cta-copy-${device}`}>본문</label>
                        <small>*텍스트*로 강조</small>
                        <textarea
                          id={`career-cta-copy-${device}`}
                          className="admin-textarea admin-textarea-large"
                          value={content.cta.copy[device]}
                          onChange={(event) =>
                            updateContent((currentContent) => ({
                              ...currentContent,
                              cta: {
                                ...currentContent.cta,
                                copy: { ...currentContent.cta.copy, [device]: event.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <section
                  className="admin-form-section admin-career-list-section admin-career-cta-openings-section"
                  style={{ marginTop: '28px' }}
                >
                  <div className="admin-form-section-header" style={{ marginBottom: '10px' }}>
                    <h4>채용 포지션</h4>
                    <button
                      className="admin-button admin-button-primary"
                      type="button"
                      onClick={openAddOpeningModal}
                    >
                      추가
                    </button>
                  </div>
                  <DndContext
                    sensors={dragSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleOpeningDragEnd}
                  >
                    <SortableContext
                      items={normalizeCareerCtaOpenings(content.cta.openings, content.cta.teams).map(
                        (item) => item.id,
                      )}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="admin-about-item-list">
                        {normalizeCareerCtaOpenings(content.cta.openings, content.cta.teams).map(
                          (item, index) => (
                            <SortableCtaOpeningRow
                              key={item.id}
                              item={item}
                              index={index}
                              onEdit={openEditOpeningModal}
                              onDelete={deleteOpening}
                            />
                          ),
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>
                </section>

                <div className="admin-form-row" style={{ marginTop: '28px' }}>
                  <label htmlFor="career-cta-notes" style={{ fontSize: '20px' }}>안내 문구</label>
                  <small>엔터로 항목 구분</small>
                  <textarea
                    id="career-cta-notes"
                    className="admin-textarea admin-textarea-largeah"
                    value={formatCareerNotesForEditor(content.cta.notes)}
                    onChange={(event) => updateNotes(event.target.value)}
                  />
                </div>

                <div className="admin-form-row" style={{ marginTop: '28px' }}>
                  <label htmlFor="career-cta-contact-email">지원 이메일 (복사하기 버튼)</label>
                  <input
                    id="career-cta-contact-email"
                    className="admin-input"
                    type="email"
                    value={content.cta.contactEmail}
                    onChange={(event) =>
                      updateContent((currentContent) => ({
                        ...currentContent,
                        cta: {
                          ...currentContent.cta,
                          contactEmail: event.target.value,
                        },
                      }))
                    }
                  />
                </div>

                <div className="admin-upload-section" style={{ marginTop: '28px' }}>
                  <h4>지원양식 파일</h4>
                  <small>PDF, DOC, DOCX (최대 10MB). 저장 시 R2에 업로드됩니다.</small>
                  {(() => {
                    const pendingFile = content.cta.applicationFormMedia?.pendingFile
                    const pendingPreviewUrl = getMediaDisplayUrl(content.cta.applicationFormMedia)
                    const savedUrl = content.cta.applicationFormUrl
                    const savedFileName = getCareerApplicationFormDownloadName(content.cta)
                    const hasSavedFile = Boolean(savedUrl) && !pendingFile

                    return (
                      <div className="admin-career-form-files">
                        {hasSavedFile && (
                          <div className="admin-career-form-file-row">
                            <span className="admin-career-form-file-label">현재 파일</span>
                            <a
                              className="admin-career-form-file-name"
                              href={savedUrl}
                              download={savedFileName}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {savedFileName}
                            </a>
                          </div>
                        )}
                        {pendingFile && (
                          <div className="admin-career-form-file-row">
                            <span className="admin-career-form-file-label">현재 파일</span>
                            <a
                              className="admin-career-form-file-name"
                              href={pendingPreviewUrl}
                              download={pendingFile.name}
                            >
                              {pendingFile.name}
                            </a>
                          </div>
                        )}
                        {!hasSavedFile && !pendingFile && (
                          <p className="admin-empty-message">현재 파일이 없습니다.</p>
                        )}
                      </div>
                    )
                  })()}
                  <ImageUploader
                    deferUpload
                    maxFiles={1}
                    showPreview={false}
                    acceptedTypes="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.doc,.docx"
                    hintText="PDF, DOC, DOCX 지원 (최대 10MB)"
                    placeholderTitle="지원양식 파일 업로드"
                    validateFile={(file) => imageService.validateDocumentFile(file)}
                    onFilesSelected={({ previews }) => {
                      const file = previews[0]?.file

                      if (!file) {
                        return
                      }

                      revokeMediaPreview(content.cta.applicationFormMedia)
                      updateContent((currentContent) => ({
                        ...currentContent,
                        cta: {
                          ...currentContent.cta,
                          applicationFormMedia: mediaRefFromPendingFile(file),
                        },
                      }))
                    }}
                  />
                  {(content.cta.applicationFormMedia?.pendingFile ||
                    content.cta.applicationFormUrl) && (
                    <div className="admin-form-actions" style={{ marginTop: '12px' }}>
                      <button
                        className="admin-button admin-button-secondary"
                        type="button"
                        onClick={() => {
                          revokeMediaPreview(content.cta.applicationFormMedia)
                          updateContent((currentContent) => ({
                            ...currentContent,
                            cta: {
                              ...currentContent.cta,
                              applicationFormUrl: '',
                              applicationFormR2Key: '',
                              applicationFormFileName: '',
                              applicationFormMedia: createEmptyMediaRef(),
                            },
                          }))
                        }}
                      >
                        {content.cta.applicationFormMedia?.pendingFile
                          ? '업로드 취소'
                          : '파일 제거'}
                      </button>
                    </div>
                  )}
                </div>
              </section>
              </div>
            )}
          </div>
        </div>
      </div>

      <AdminEditModal
        open={Boolean(workDraft)}
        title={isCreatingWork ? 'How We Work 추가' : 'How We Work 수정'}
        onClose={closeWorkModal}
        footer={
          <>
            <button className="admin-button" type="button" onClick={applyWorkDraft}>
              저장
            </button>
          </>
        }
      >
        {workDraft && (
          <>
            <div className="admin-pc-mo-grid">
              {['pc', 'mo'].map((device) => (
                <div className="admin-device-panel" key={device}>
                  <h5>{device === 'pc' ? 'PC' : 'Mobile'}</h5>
                  <div className="admin-form-row">
                    <label htmlFor={`work-modal-title-${device}`}>타이틀</label>
                    <textarea
                      id={`work-modal-title-${device}`}
                      className="admin-textarea"
                      value={workDraft.title[device]}
                      onChange={(event) =>
                        setWorkDraft((currentDraft) => ({
                          ...currentDraft,
                          title: { ...currentDraft.title, [device]: event.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="admin-form-row" style={{ marginTop: '20px' }}>
              <label htmlFor="work-modal-copy">카드 문구</label>
              <textarea
                id="work-modal-copy"
                className="admin-textarea admin-textarea-small"
                value={workDraft.copy}
                onChange={(event) =>
                  setWorkDraft((currentDraft) => ({
                    ...currentDraft,
                    copy: event.target.value,
                  }))
                }
              />
            </div>
            <div className="admin-form-row">
              <label htmlFor="work-modal-tags">태그 (쉼표로 구분)</label>
              <input
                id="work-modal-tags"
                className="admin-input"
                value={workDraft.tags.join(', ')}
                onChange={(event) =>
                  setWorkDraft((currentDraft) => ({
                    ...currentDraft,
                    tags: parseList(event.target.value),
                  }))
                }
              />
            </div>
          </>
        )}
      </AdminEditModal>

      <AdminEditModal
        open={Boolean(welfareDraft)}
        title={isCreatingWelfare ? 'Welfare 추가' : 'Welfare 수정'}
        onClose={closeWelfareModal}
        footer={
          <>
            <button className="admin-button" type="button" onClick={applyWelfareDraft}>
              저장
            </button>
          </>
        }
      >
        {welfareDraft && (
          <>
            <div className="admin-form-row">
              <label htmlFor="welfare-modal-title">타이틀</label>
              <input
                id="welfare-modal-title"
                className="admin-input"
                value={welfareDraft.title}
                onChange={(event) =>
                  setWelfareDraft((currentDraft) => ({
                    ...currentDraft,
                    title: event.target.value,
                  }))
                }
              />
            </div>
            <div className="admin-form-row">
              <label htmlFor="welfare-modal-copy">설명</label>
              <textarea
                id="welfare-modal-copy"
                className="admin-textarea admin-textarea-small"
                value={welfareDraft.copy}
                onChange={(event) =>
                  setWelfareDraft((currentDraft) => ({
                    ...currentDraft,
                    copy: event.target.value,
                  }))
                }
              />
            </div>
            <div className="admin-upload-section">
              <h4>아이콘</h4>
              <ImageUploader
                deferUpload
                maxFiles={1}
                showPreview={false}
                onFilesSelected={({ previews }) => {
                  const file = previews[0]?.file

                  if (!file) {
                    return
                  }

                  revokeMediaPreview(welfareDraft.iconMedia)
                  setWelfareDraft((currentDraft) => ({
                    ...currentDraft,
                    iconMedia: mediaRefFromPendingFile(file),
                  }))
                }}
              />
              <PendingMediaPreview
                className="admin-media-preview--icon"
                media={welfareDraft.iconMedia || mediaRefFromUrl(welfareDraft.icon)}
                removeAriaLabel="아이콘 제거"
                onRemove={removeWelfareDraftIcon}
              />
            </div>
          </>
        )}
      </AdminEditModal>

      <AdminEditModal
        open={Boolean(openingDraft)}
        title={isCreatingOpening ? '채용 포지션 추가' : '채용 포지션 수정'}
        onClose={closeOpeningModal}
        footer={
          <>
            <button className="admin-button" type="button" onClick={applyOpeningDraft}>
              저장
            </button>
          </>
        }
      >
        {openingDraft && (
          <>
            <div className="admin-form-row">
              <label htmlFor="career-opening-modal-team">팀</label>
              <input
                id="career-opening-modal-team"
                className="admin-input"
                value={openingDraft.team}
                onChange={(event) =>
                  setOpeningDraft((currentDraft) => ({
                    ...currentDraft,
                    team: event.target.value,
                  }))
                }
              />
            </div>
            <div className="admin-form-row">
              <label htmlFor="career-opening-modal-role">직무</label>
              <input
                id="career-opening-modal-role"
                className="admin-input"
                value={openingDraft.role}
                onChange={(event) =>
                  setOpeningDraft((currentDraft) => ({
                    ...currentDraft,
                    role: event.target.value,
                  }))
                }
              />
            </div>
          </>
        )}
      </AdminEditModal>
    </AdminLayout>
  )
}
