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
import { createEmptyAboutContent } from '../../src/data/pageContentDefaults'
import {
  getServiceDisplayNumber,
  mergeAboutPageContent,
  serializeAboutContentForFirestore,
  normalizeOrganizationTeams,
  syncMemberIds,
  syncServiceNumbers,
} from '../../src/utils/aboutContentFirestore'
import AdminEditModal from '../components/AdminEditModal'
import AdminLayout from '../components/AdminLayout'
import ImageUploader from '../components/ImageUploader'
import PendingMediaPreview, { resetMediaRef } from '../components/PendingMediaPreview'
import { pageContentService } from '../services/dataService'
import { imageService } from '../services/imageService'
import {
  collectAboutMemberMedia,
  collectAboutServiceMedia,
  createEmptyMediaRef,
  deleteMediaAsset,
  deleteMediaAssets,
  getMediaDisplayUrl,
  mediaRefFromPendingFile,
  mediaRefFromUrl,
  resolveMediaRef,
  revokeMediaPreview,
} from '../utils/r2Media'

function cloneDefaultContent() {
  return createEmptyAboutContent()
}

function mergeContent(content) {
  const merged = mergeAboutPageContent(cloneDefaultContent(), content)
  return {
    ...merged,
    services: syncServiceNumbers(merged.services),
    members: syncMemberIds(merged.members),
  }
}

function parseList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function SortableServiceRow({ service, index, onEdit, onDelete }) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: service.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      className={`admin-service-row ${isDragging ? 'is-dragging' : ''}`}
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
            <div className="admin-service-number">{getServiceDisplayNumber(service, index)}</div>
      <div className="admin-service-title">
        <strong>{service.title?.pc || '제목 없음'}</strong>
      </div>
      <div className="admin-service-actions" style={{ display: 'flex', gap: 6 }}>
        <button
          className="admin-button admin-button-secondary"
          type="button"
          onClick={() => onEdit(index)}
        >
          수정
        </button>
        <button
          className="admin-button admin-button-danger"
          type="button"
          onClick={() => onDelete(index)}
        >
          삭제
        </button>
      </div>
    </div>
  )
}

function SortableMemberRow({ member, index, onEdit, onDelete, getMemberListImage }) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: member.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const thumbSrc = getMemberListImage(member)

  return (
    <div
      ref={setNodeRef}
      className={`admin-about-item-row admin-member-item-row ${isDragging ? 'is-dragging' : ''}`}
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
        <strong>{member.name || '이름 없음'}</strong>
      </div>
      <div className="admin-about-item-meta">{member.role || '-'}</div>
      <div className="admin-about-item-actions" style={{ display: 'flex', gap: 6 }}>
        <button
          className="admin-button admin-button-secondary"
          type="button"
          onClick={() => onEdit(index)}
        >
          수정
        </button>
        <button
          className="admin-button admin-button-danger"
          type="button"
          onClick={() => onDelete(index)}
        >
          삭제
        </button>
      </div>
    </div>
  )
}

export default function AboutManager() {
  const [content, setContent] = useState(cloneDefaultContent)
  const [editingServiceIndex, setEditingServiceIndex] = useState(null)
  const [isCreatingService, setIsCreatingService] = useState(false)
  const [serviceDraft, setServiceDraft] = useState(null)
  const [editingCoreIndex, setEditingCoreIndex] = useState(null)
  const [coreValueDraft, setCoreValueDraft] = useState(null)
  const [editingOrgIndex, setEditingOrgIndex] = useState(null)
  const [orgDraft, setOrgDraft] = useState(null)
  const [orgTeamsInput, setOrgTeamsInput] = useState('')
  const [editingMemberIndex, setEditingMemberIndex] = useState(null)
  const [isCreatingMember, setIsCreatingMember] = useState(false)
  const [memberDraft, setMemberDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const aboutDragSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleMemberDragEnd = (dragEvent) => {
    const { active, over } = dragEvent

    if (!over || active.id === over.id) {
      return
    }

    updateContent((currentContent) => {
      const members = currentContent.members
      const oldIndex = members.findIndex((item) => item.id === active.id)
      const newIndex = members.findIndex((item) => item.id === over.id)

      if (oldIndex < 0 || newIndex < 0) {
        return currentContent
      }

      return {
        ...currentContent,
        members: syncMemberIds(arrayMove(members, oldIndex, newIndex)),
      }
    })
  }

  const handleServiceDragEnd = (dragEvent) => {
    const { active, over } = dragEvent

    if (!over || active.id === over.id) {
      return
    }

    updateContent((currentContent) => {
      const services = currentContent.services
      const oldIndex = services.findIndex((item) => item.id === active.id)
      const newIndex = services.findIndex((item) => item.id === over.id)

      if (oldIndex < 0 || newIndex < 0) {
        return currentContent
      }

      return {
        ...currentContent,
        services: syncServiceNumbers(arrayMove(services, oldIndex, newIndex)),
      }
    })
  }

  useEffect(() => {
    async function loadAboutContent() {
      try {
        setLoading(true)
        const data = await pageContentService.getPageContent('about')
        setContent(mergeContent(data?.content))
      } catch (error) {
        window.alert(`ABOUT 데이터 로딩에 실패했습니다: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadAboutContent()
  }, [])

  useEffect(() => {
    const isModalOpen = serviceDraft || coreValueDraft || orgDraft || memberDraft

    if (!isModalOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [serviceDraft, coreValueDraft, orgDraft, memberDraft])

  const updateContent = (updater) => {
    setContent((currentContent) => mergeContent(updater(currentContent)))
  }

  const updateIdentity = (section, device, value) => {
    updateContent((currentContent) => ({
      ...currentContent,
      identity: {
        ...currentContent.identity,
        [section]: {
          ...currentContent.identity[section],
          [device]: value,
        },
      },
    }))
  }

  const updateCoreValue = (index, changes) => {
    updateContent((currentContent) => ({
      ...currentContent,
      coreValues: currentContent.coreValues.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
    }))
  }

  const updateService = (index, changes) => {
    updateContent((currentContent) => ({
      ...currentContent,
      services: currentContent.services.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
    }))
  }

  const createEmptyService = () => ({
    id: crypto.randomUUID(),
    title: { pc: '', mo: '' },
    english: { pc: '', mo: '' },
    korean: { pc: '', mo: '' },
    tags: [],
    video: '',
    videoMedia: createEmptyMediaRef(),
  })

  const openServiceModal = (index) => {
    const service = content.services[index]

    setIsCreatingService(false)
    setEditingServiceIndex(index)
    setServiceDraft({
      ...JSON.parse(JSON.stringify(service)),
      videoMedia: mediaRefFromUrl(service.video, service.videoR2Key),
    })
  }

  const openAddServiceModal = () => {
    setIsCreatingService(true)
    setEditingServiceIndex(content.services.length)
    setServiceDraft(createEmptyService())
  }

  const closeServiceModal = () => {
    revokeMediaPreview(serviceDraft?.videoMedia)
    setEditingServiceIndex(null)
    setIsCreatingService(false)
    setServiceDraft(null)
  }

  const updateServiceDraft = (updater) => {
    setServiceDraft((currentDraft) => updater(currentDraft))
  }

  const normalizeServiceDraftForSave = (draft) => {
    if (draft.video?.trim()) {
      return draft
    }

    return {
      ...draft,
      video: '',
      videoFileName: undefined,
      videoR2Key: undefined,
    }
  }

  const removeServiceVideo = async () => {
    const media = serviceDraft?.videoMedia

    if (media?.url || media?.r2Key) {
      await deleteMediaAsset(media)
    }

    updateServiceDraft((currentDraft) => ({
      ...currentDraft,
      video: '',
      videoFileName: undefined,
      videoR2Key: undefined,
      videoMedia: resetMediaRef(currentDraft.videoMedia),
    }))
  }

  const saveServiceDraft = async () => {
    try {
      const originalService = isCreatingService ? null : content.services[editingServiceIndex]
      const videoMedia = await resolveMediaRef(
        serviceDraft.videoMedia || mediaRefFromUrl(serviceDraft.video, serviceDraft.videoR2Key),
        {
          metadata: { folder: 'about/services', source: 'about-service-video' },
          validateFile: (file) => imageService.validateVideoFile(file),
          uploadFileFn: (file, metadata) => imageService.uploadFile(file, metadata),
        },
      )

      if (originalService?.video && originalService.video !== videoMedia.url) {
        await deleteMediaAsset({ url: originalService.video })
      }

      const draftToSave = normalizeServiceDraftForSave({
        ...serviceDraft,
        video: videoMedia.url,
        videoR2Key: videoMedia.r2Key,
        videoFileName: videoMedia.url ? serviceDraft.videoFileName : undefined,
      })

      delete draftToSave.videoMedia

      if (isCreatingService) {
        updateContent((currentContent) => ({
          ...currentContent,
          services: syncServiceNumbers([...currentContent.services, draftToSave]),
        }))
      } else {
        updateService(editingServiceIndex, draftToSave)
      }

      closeServiceModal()
    } catch (error) {
      window.alert(`Service 저장에 실패했습니다: ${error.message}`)
    }
  }

  const updateOrganizationItem = (index, changes) => {
    updateContent((currentContent) => ({
      ...currentContent,
      organization: {
        ...currentContent.organization,
        items: currentContent.organization.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, ...changes } : item,
        ),
      },
    }))
  }

  const updateMember = (index, changes) => {
    updateContent((currentContent) => ({
      ...currentContent,
      members: currentContent.members.map((member, memberIndex) =>
        memberIndex === index ? { ...member, ...changes } : member,
      ),
    }))
  }

  const openCoreValueModal = (index) => {
    const item = content.coreValues[index]

    setEditingCoreIndex(index)
    setCoreValueDraft({
      ...JSON.parse(JSON.stringify(item)),
      imageMedia: mediaRefFromUrl(item.image),
      hoverImageMedia: mediaRefFromUrl(item.hoverImage || item.image),
    })
  }

  const closeCoreValueModal = () => {
    revokeMediaPreview(coreValueDraft?.imageMedia)
    revokeMediaPreview(coreValueDraft?.hoverImageMedia)
    setEditingCoreIndex(null)
    setCoreValueDraft(null)
  }

  const updateCoreValueDraft = (updater) => {
    setCoreValueDraft((currentDraft) => updater(currentDraft))
  }

  const removeCoreValueImage = async () => {
    const media = coreValueDraft?.imageMedia

    if (media?.url || media?.r2Key) {
      await deleteMediaAsset(media)
    }

    updateCoreValueDraft((currentDraft) => ({
      ...currentDraft,
      image: '',
      imageMedia: resetMediaRef(currentDraft.imageMedia),
    }))
  }

  const removeCoreValueHoverImage = async () => {
    const media = coreValueDraft?.hoverImageMedia

    if (media?.url || media?.r2Key) {
      await deleteMediaAsset(media)
    }

    updateCoreValueDraft((currentDraft) => ({
      ...currentDraft,
      hoverImage: '',
      hoverImageMedia: resetMediaRef(currentDraft.hoverImageMedia),
    }))
  }

  const saveCoreValueDraft = async () => {
    try {
      const originalItem = content.coreValues[editingCoreIndex]
      const imageMedia = await resolveMediaRef(
        coreValueDraft.imageMedia || mediaRefFromUrl(coreValueDraft.image),
        {
          metadata: { folder: 'about/core-values', source: 'about-core-value-image' },
        },
      )
      const hoverImageMedia = await resolveMediaRef(
        coreValueDraft.hoverImageMedia ||
          mediaRefFromUrl(coreValueDraft.hoverImage || coreValueDraft.image),
        {
          metadata: { folder: 'about/core-values', source: 'about-core-value-hover-image' },
        },
      )

      if (originalItem?.image && originalItem.image !== imageMedia.url) {
        await deleteMediaAsset({ url: originalItem.image })
      }

      if (originalItem?.hoverImage && originalItem.hoverImage !== hoverImageMedia.url) {
        await deleteMediaAsset({ url: originalItem.hoverImage })
      }

      const draftToSave = {
        ...coreValueDraft,
        image: imageMedia.url,
        hoverImage: hoverImageMedia.url,
      }

      delete draftToSave.imageMedia
      delete draftToSave.hoverImageMedia

      updateCoreValue(editingCoreIndex, draftToSave)
      closeCoreValueModal()
    } catch (error) {
      window.alert(`Core Value 저장에 실패했습니다: ${error.message}`)
    }
  }

  const openOrganizationModal = (index) => {
    const item = content.organization.items[index]
    const teams = normalizeOrganizationTeams(item.teams)
    setEditingOrgIndex(index)
    setOrgDraft({
      ...JSON.parse(JSON.stringify(item)),
      teams,
    })
    setOrgTeamsInput(teams.join(', '))
  }

  const closeOrganizationModal = () => {
    setEditingOrgIndex(null)
    setOrgDraft(null)
    setOrgTeamsInput('')
  }

  const updateOrgDraft = (updater) => {
    setOrgDraft((currentDraft) => updater(currentDraft))
  }

  const saveOrganizationDraft = () => {
    updateOrganizationItem(editingOrgIndex, {
      ...orgDraft,
      teams: parseList(orgTeamsInput),
    })
    closeOrganizationModal()
  }

  const createEmptyMember = () => {
    const nextIndex = content.members.length + 1
    return {
      id: `member-${String(nextIndex).padStart(2, '0')}`,
      name: '',
      role: '',
      projects: [],
      image: '',
      imageMedia: createEmptyMediaRef(),
    }
  }

  const getMemberListImage = (member) => member?.image || ''

  const openMemberModal = (index) => {
    const member = content.members[index]

    setIsCreatingMember(false)
    setEditingMemberIndex(index)
    setMemberDraft({
      ...JSON.parse(JSON.stringify(member)),
      imageMedia: mediaRefFromUrl(member.image, member.imageR2Key),
    })
  }

  const openAddMemberModal = () => {
    setIsCreatingMember(true)
    setEditingMemberIndex(content.members.length)
    setMemberDraft(createEmptyMember())
  }

  const closeMemberModal = () => {
    revokeMediaPreview(memberDraft?.imageMedia)
    setEditingMemberIndex(null)
    setIsCreatingMember(false)
    setMemberDraft(null)
  }

  const updateMemberDraft = (updater) => {
    setMemberDraft((currentDraft) => updater(currentDraft))
  }

  const removeMemberImage = async () => {
    const media = memberDraft?.imageMedia

    if (media?.url || media?.r2Key) {
      await deleteMediaAsset(media)
    }

    updateMemberDraft((currentDraft) => ({
      ...currentDraft,
      image: '',
      imageFileName: undefined,
      imageR2Key: undefined,
      imageMedia: resetMediaRef(currentDraft.imageMedia),
    }))
  }

  const saveMemberDraft = async () => {
    try {
      const originalMember = isCreatingMember ? null : content.members[editingMemberIndex]
      const imageMedia = await resolveMediaRef(
        memberDraft.imageMedia || mediaRefFromUrl(memberDraft.image, memberDraft.imageR2Key),
        {
          metadata: { folder: 'about/members', source: 'about-member-image' },
        },
      )

      if (originalMember?.image && originalMember.image !== imageMedia.url) {
        await deleteMediaAsset({ url: originalMember.image })
      }

      const draftToSave = {
        ...memberDraft,
        image: imageMedia.url,
        imageR2Key: imageMedia.r2Key,
        imageFileName: imageMedia.url ? memberDraft.imageFileName : undefined,
      }

      delete draftToSave.imageMedia

      if (isCreatingMember) {
        updateContent((currentContent) => ({
          ...currentContent,
          members: syncMemberIds([...currentContent.members, draftToSave]),
        }))
      } else {
        updateMember(editingMemberIndex, draftToSave)
      }

      closeMemberModal()
    } catch (error) {
      window.alert(`멤버 저장에 실패했습니다: ${error.message}`)
    }
  }

  const deleteMember = async (index) => {
    if (!window.confirm('이 멤버를 삭제하시겠습니까?')) {
      return
    }

    await deleteMediaAssets(collectAboutMemberMedia(content.members[index]))

    updateContent((currentContent) => ({
      ...currentContent,
      members: syncMemberIds(
        currentContent.members.filter((_, memberIndex) => memberIndex !== index),
      ),
    }))
  }

  const getCoreValueListTitle = (item) =>
    item.title?.replace(/\s*\n+\s*/g, ' ').trim() || '제목 없음'

  const getOrganizationListTitle = (item) => {
    const title = item.title?.pc || item.title?.mo || ''
    return title.split('\n')[0]?.trim() || item.id || '제목 없음'
  }

  const saveContent = async () => {
    try {
      setSaving(true)
      await pageContentService.savePageContent('about', {
        content: serializeAboutContentForFirestore(content),
      })
      window.alert('ABOUT 콘텐츠가 저장되었습니다.')
    } catch (error) {
      window.alert(`ABOUT 저장에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-content">
        <div className="admin-page-title admin-page-title-with-actions">
          <h2>ABOUT 관리</h2>
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
                <h4>Identity</h4>
                <div className="admin-pc-mo-grid">
                  {['pc', 'mo'].map((device) => (
                    <div className="admin-device-panel" key={device}>
                      <h5>{device === 'pc' ? 'PC' : 'Mobile'}</h5>
                      <div className="admin-form-row">
                        <label htmlFor={`about-title-${device}`}>타이틀</label>
                        <textarea
                          id={`about-title-${device}`}
                          className="admin-textarea"
                          value={content.identity.title[device]}
                          onChange={(event) => updateIdentity('title', device, event.target.value)}
                        />
                      </div>
                      <div className="admin-form-row">
                        <label htmlFor={`about-intro-${device}`}>본문 타이틀</label>
                        <textarea
                          id={`about-intro-${device}`}
                          className="admin-textarea admin-textarea-small"
                          value={content.identity.introTitle[device]}
                          onChange={(event) => updateIdentity('introTitle', device, event.target.value)}
                        />
                      </div>
                      <div className="admin-form-row">
                        <label htmlFor={`about-copy-${device}`}>본문</label>
                        <small>*텍스트*로 강조</small>
                        <textarea
                          id={`about-copy-${device}`}
                          className="admin-textarea admin-textarea-large"
                          value={content.identity.copy[device]}
                          onChange={(event) => updateIdentity('copy', device, event.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="admin-content-main admin-form-section">
                <h4>Core Values</h4>
                <div className="admin-about-item-list">
                  {content.coreValues.map((item, index) => (
                    <div className="admin-about-item-row admin-about-item-row--core-value" key={`core-${index}`}>
                      <div className="admin-about-item-title">
                        <strong>{getCoreValueListTitle(item)}</strong>
                      </div>
                      <div className="admin-about-item-actions">
                        <button
                          className="admin-button admin-button-secondary"
                          type="button"
                          onClick={() => openCoreValueModal(index)}
                        >
                          수정
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="admin-content-main admin-form-section admin-services-section">
                <div className="admin-form-section-header">
                  <h4>Services</h4>
                  <button
                    className="admin-button admin-button-primary"
                    type="button"
                    onClick={openAddServiceModal}
                  >
                    추가
                  </button>
                </div>
                <DndContext
                  sensors={aboutDragSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleServiceDragEnd}
                >
                  <SortableContext
                    items={content.services.map((service) => service.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="admin-service-list">
                      {content.services.map((service, index) => (
                        <SortableServiceRow
                          key={service.id}
                          service={service}
                          index={index}
                          onEdit={openServiceModal}
                          onDelete={async (itemIndex) => {
                            if (!window.confirm('이 서비스를 삭제하시겠습니까?')) {
                              return
                            }

                            await deleteMediaAssets(
                              collectAboutServiceMedia(content.services[itemIndex]),
                            )

                            updateContent((currentContent) => ({
                              ...currentContent,
                              services: currentContent.services.filter(
                                (_, serviceIndex) => serviceIndex !== itemIndex,
                              ),
                            }))
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </section>



              <section className="admin-content-main admin-form-section">
                <h4>Organization</h4>
                <div className="admin-about-item-list">
                  {content.organization.items.map((item, index) => (
                    <div className="admin-about-item-row" key={item.id || index}>
                      <div className="admin-about-item-title">
                        <strong>{getOrganizationListTitle(item)}</strong>
                      </div>
                      <div className="admin-about-item-actions">
                        <button
                          className="admin-button admin-button-secondary"
                          type="button"
                          onClick={() => openOrganizationModal(index)}
                        >
                          수정
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="admin-content-main admin-form-section admin-members-section">
                <div className="admin-form-section-header">
                  <h4>Members</h4>
                  <button
                    className="admin-button admin-button-primary"
                    type="button"
                    onClick={openAddMemberModal}
                  >
                    추가
                  </button>
                </div>
                {content.members.length === 0 ? (
                  <p className="admin-empty-list-message">등록된 멤버가 없습니다.</p>
                ) : (
                  <DndContext
                    sensors={aboutDragSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleMemberDragEnd}
                  >
                    <SortableContext
                      items={content.members.map((member) => member.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="admin-about-item-list">
                        {content.members.map((member, index) => (
                          <SortableMemberRow
                            key={member.id}
                            member={member}
                            index={index}
                            getMemberListImage={getMemberListImage}
                            onEdit={openMemberModal}
                            onDelete={deleteMember}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </section>
              </div>
            )}
          </div>
        </div>
      </div>

      <AdminEditModal
        open={Boolean(coreValueDraft)}
        title="Core Value 수정"
        onClose={closeCoreValueModal}
        footer={
          <>
            <button className="admin-button" type="button" onClick={saveCoreValueDraft}>
              저장
            </button>
          </>
        }
      >
        {coreValueDraft && (
          <>
            <div className="admin-form-row">
              <label htmlFor="core-modal-title">영문 타이틀</label>
              <textarea
                id="core-modal-title"
                className="admin-textarea"
                value={coreValueDraft.title}
                onChange={(event) =>
                  updateCoreValueDraft((currentDraft) => ({
                    ...currentDraft,
                    title: event.target.value,
                  }))
                }
              />
            </div>
            <div className="admin-form-row">
              <label htmlFor="core-modal-headline">국문 타이틀</label>
              <input
                id="core-modal-headline"
                className="admin-input"
                value={coreValueDraft.headline}
                onChange={(event) =>
                  updateCoreValueDraft((currentDraft) => ({
                    ...currentDraft,
                    headline: event.target.value,
                  }))
                }
              />
            </div>
            <div className="admin-form-row">
              <label htmlFor="core-modal-body">설명</label>
              <textarea
                id="core-modal-body"
                className="admin-textarea"
                value={coreValueDraft.body}
                onChange={(event) =>
                  updateCoreValueDraft((currentDraft) => ({
                    ...currentDraft,
                    body: event.target.value,
                  }))
                }
              />
            </div>
            <div className="admin-pc-mo-grid admin-core-value-images-grid">
              <div className="admin-device-panel admin-core-value-images-panel">
                <div className="admin-upload-section">
                  <h4>기본 이미지</h4>
                  <ImageUploader
                    deferUpload
                    maxFiles={1}
                    showPreview={false}
                    onFilesSelected={({ previews }) => {
                      const file = previews[0]?.file

                      if (!file) {
                        return
                      }

                      updateCoreValueDraft((currentDraft) => ({
                        ...currentDraft,
                        imageMedia: mediaRefFromPendingFile(file),
                      }))
                    }}
                  />
                  <PendingMediaPreview
                    className="admin-media-preview--corevalue"
                    assetClassName="admin-media-preview__asset admin-media-preview__asset--corevalue"
                    media={coreValueDraft.imageMedia || mediaRefFromUrl(coreValueDraft.image)}
                    removeAriaLabel="기본 이미지 제거"
                    onRemove={removeCoreValueImage}
                  />
                </div>
              </div>
              <div className="admin-device-panel admin-core-value-images-panel">
                <div className="admin-upload-section">
                  <h4>마우스 오버 시 이미지</h4>
                  <ImageUploader
                    deferUpload
                    maxFiles={1}
                    showPreview={false}
                    onFilesSelected={({ previews }) => {
                      const file = previews[0]?.file

                      if (!file) {
                        return
                      }

                      updateCoreValueDraft((currentDraft) => ({
                        ...currentDraft,
                        hoverImageMedia: mediaRefFromPendingFile(file),
                      }))
                    }}
                  />
                  <PendingMediaPreview
                    className="admin-media-preview--corevalue"
                    assetClassName="admin-media-preview__asset admin-media-preview__asset--corevalue"
                    media={
                      coreValueDraft.hoverImageMedia ||
                      mediaRefFromUrl(coreValueDraft.hoverImage || coreValueDraft.image)
                    }
                    removeAriaLabel="호버 이미지 제거"
                    onRemove={removeCoreValueHoverImage}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </AdminEditModal>

      <AdminEditModal
        open={Boolean(orgDraft)}
        title={orgDraft ? `${getOrganizationListTitle(orgDraft)} 수정` : 'Organization 수정'}
        onClose={closeOrganizationModal}
        footer={
          <>
            <button className="admin-button" type="button" onClick={saveOrganizationDraft}>
              저장
            </button>
          </>
        }
      >
        {orgDraft && (
          <>
            <div className="admin-pc-mo-grid">
              {['pc', 'mo'].map((device) => (
                <div className="admin-device-panel" key={device}>
                  <h5>{device === 'pc' ? 'PC' : 'Mobile'}</h5>
                  <div className="admin-form-row">
                    <label htmlFor={`org-modal-title-${device}`}>타이틀</label>
                    <textarea
                      id={`org-modal-title-${device}`}
                      className="admin-textarea admin-textarea-small"
                      value={orgDraft.title?.[device] || ''}
                      onChange={(event) =>
                        updateOrgDraft((currentDraft) => ({
                          ...currentDraft,
                          title: { ...(currentDraft.title || {}), [device]: event.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="admin-form-row">
                    <label htmlFor={`org-modal-body-${device}`}>본문</label>
                    <textarea
                      id={`org-modal-body-${device}`}
                      className="admin-textarea admin-textarea-small"
                      value={orgDraft.body?.[device] || ''}
                      onChange={(event) =>
                        updateOrgDraft((currentDraft) => ({
                          ...currentDraft,
                          body: { ...(currentDraft.body || {}), [device]: event.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-form-row" style={{ marginTop: '20px' }}>
              <label htmlFor="org-modal-teams">팀</label>
              <small>쉼표로 구분합니다. 비워 두면 표시하지 않습니다.</small>
              <textarea
                id="org-modal-teams"
                className="admin-textarea admin-textarea-small"
                value={orgTeamsInput}
                onChange={(event) => setOrgTeamsInput(event.target.value)}
              />
            </div>
          </>
        )}
      </AdminEditModal>

      <AdminEditModal
        open={Boolean(memberDraft)}
        title={isCreatingMember ? 'Member 추가' : `${memberDraft?.name || 'Member'} 수정`}
        onClose={closeMemberModal}
        footer={
          <>
            <button className="admin-button" type="button" onClick={saveMemberDraft}>
              저장
            </button>
          </>
        }
      >
        {memberDraft && (
          <>
            <div className="admin-form-row">
              <label htmlFor="member-modal-name">이름</label>
              <input
                id="member-modal-name"
                className="admin-input"
                value={memberDraft.name}
                onChange={(event) =>
                  updateMemberDraft((currentDraft) => ({
                    ...currentDraft,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="admin-form-row">
              <label htmlFor="member-modal-role">직책</label>
              <input
                id="member-modal-role"
                className="admin-input"
                value={memberDraft.role}
                onChange={(event) =>
                  updateMemberDraft((currentDraft) => ({
                    ...currentDraft,
                    role: event.target.value,
                  }))
                }
              />
            </div>
            <div className="admin-form-row">
              <label htmlFor="member-modal-projects">프로젝트</label>
              <small>엔터로 구분</small>
              <textarea
                id="member-modal-projects"
                className="admin-textarea admin-textarea-large"
                value={(memberDraft.projects || []).join('\n')}
                onChange={(event) =>
                  updateMemberDraft((currentDraft) => ({
                    ...currentDraft,
                    projects: event.target.value.split('\n').filter(Boolean),
                  }))
                }
              />
            </div>

            <div className="admin-upload-section">
              <h4>프로필 이미지</h4>
              <ImageUploader
                deferUpload
                maxFiles={1}
                showPreview={false}
                onFilesSelected={({ previews }) => {
                  const file = previews[0]?.file

                  if (!file) {
                    return
                  }

                  updateMemberDraft((currentDraft) => ({
                    ...currentDraft,
                    imageMedia: mediaRefFromPendingFile(file),
                  }))
                }}
              />
              <PendingMediaPreview
                className="admin-media-preview--member"
                media={memberDraft.imageMedia || mediaRefFromUrl(memberDraft.image, memberDraft.imageR2Key)}
                removeAriaLabel="이미지 제거"
                onRemove={removeMemberImage}
              />
              {!getMediaDisplayUrl(memberDraft.imageMedia || mediaRefFromUrl(memberDraft.image)) && (
                <small>이미지가 없으면 기본 에셋(member_01 등) 순서로 표시됩니다.</small>
              )}
            </div>
          </>
        )}
      </AdminEditModal>

      <AdminEditModal
        open={Boolean(serviceDraft)}
        title={isCreatingService ? 'Service 추가' : 'Service 수정'}
        onClose={closeServiceModal}
        footer={
          <>
            <button className="admin-button" type="button" onClick={saveServiceDraft}>
              저장
            </button>
          </>
        }
      >
        {serviceDraft && (
          <>
            <div className="admin-pc-mo-grid">
              {['pc', 'mo'].map((device) => (
                <div className="admin-device-panel" key={device}>
                  <h5>{device === 'pc' ? 'PC' : 'Mobile'}</h5>
                  <div className="admin-form-row">
                    <label htmlFor={`service-modal-title-${device}`}>타이틀</label>
                    <textarea
                      id={`service-modal-title-${device}`}
                      className="admin-textarea admin-textarea-small"
                      value={serviceDraft.title[device]}
                      onChange={(event) =>
                        updateServiceDraft((currentDraft) => ({
                          ...currentDraft,
                          title: { ...currentDraft.title, [device]: event.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="admin-form-row">
                    <label htmlFor={`service-modal-english-${device}`}>영문 설명</label>
                    <textarea
                      id={`service-modal-english-${device}`}
                      className="admin-textarea admin-textarea-large"
                      value={serviceDraft.english[device]}
                      onChange={(event) =>
                        updateServiceDraft((currentDraft) => ({
                          ...currentDraft,
                          english: { ...currentDraft.english, [device]: event.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="admin-form-row">
                    <label htmlFor={`service-modal-korean-${device}`}>국문 설명</label>
                    <textarea
                      id={`service-modal-korean-${device}`}
                      className="admin-textarea admin-textarea-large"
                      value={serviceDraft.korean[device]}
                      onChange={(event) =>
                        updateServiceDraft((currentDraft) => ({
                          ...currentDraft,
                          korean: { ...currentDraft.korean, [device]: event.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-form-row" style={{ marginTop: '20px' }}>
              <label htmlFor="service-modal-tags">태그 (쉼표로 구분)</label>
              <input
                id="service-modal-tags"
                className="admin-input"
                value={serviceDraft.tags.join(', ')}
                onChange={(event) =>
                  updateServiceDraft((currentDraft) => ({
                    ...currentDraft,
                    tags: parseList(event.target.value),
                  }))
                }
              />
            </div>

            <div className="admin-form-row admin-service-video-field">
              <label>동영상</label>
              <ImageUploader
                deferUpload
                maxFiles={1}
                showPreview={false}
                acceptedTypes="video/mp4,video/webm,video/quicktime"
                hintText="MP4, WebM, MOV 지원 (최대 10MB)"
                validateFile={(file) => imageService.validateVideoFile(file)}
                onFilesSelected={({ previews }) => {
                  const file = previews[0]?.file

                  if (!file) {
                    return
                  }

                  updateServiceDraft((currentDraft) => ({
                    ...currentDraft,
                    videoMedia: mediaRefFromPendingFile(file),
                  }))
                }}
              />
              <PendingMediaPreview
                className="admin-media-preview--video"
                assetClassName="admin-media-preview__asset admin-media-preview__asset--video"
                media={
                  serviceDraft.videoMedia ||
                  mediaRefFromUrl(serviceDraft.video, serviceDraft.videoR2Key)
                }
                removeAriaLabel="동영상 제거"
                onRemove={removeServiceVideo}
              />
            </div>
          </>
        )}
      </AdminEditModal>

    </AdminLayout>
  )
}
