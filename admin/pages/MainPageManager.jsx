/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react'
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
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { defaultMainPageContent, normalizeMainPageContent } from '../../src/data/mainPageContent'
import AdminEditModal from '../components/AdminEditModal'
import AdminMediaRemoveButton from '../components/AdminMediaRemoveButton'
import AdminLayout from '../components/AdminLayout'
import ImageUploader from '../components/ImageUploader'
import { mainImageService, mainPageContentService, partnerLogoService } from '../services/dataService'
import { imageService } from '../services/imageService'

const imageSections = [
  {
    description: '히어로 이미지 (권장 크기: 2560*1440px)',
    emptyText: '업로드된 PC 이미지가 없습니다.',
    itemClassName: 'admin-image-item-horizontal',
    title: 'PC 히어로 이미지',
    type: 'horizontal',
  },
  {
    description: '히어로 이미지 (권장 크기: 1080*1920px)',
    emptyText: '업로드된 모바일 이미지가 없습니다.',
    itemClassName: 'admin-image-item-vertical',
    title: '모바일 히어로 이미지',
    type: 'vertical',
  },
]

function cloneDefaultContent() {
  return JSON.parse(JSON.stringify(defaultMainPageContent))
}

function mergeMainContent(content) {
  return normalizeMainPageContent(content)
}

function SortablePartnerLogoItem({ logo, onDelete }) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: logo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      className={`admin-logo-item ${isDragging ? 'is-dragging' : ''}`}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="admin-logo-preview admin-media-preview admin-media-preview--logo">
        <img
          className="admin-media-preview__asset admin-media-preview__asset--logo"
          src={logo.imageUrl}
          alt={logo.name || 'partner logo'}
        />
        <AdminMediaRemoveButton
          ariaLabel={`${logo.name || '로고'} 삭제`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onDelete(logo)}
        />
      </div>
    </div>
  )
}

export default function MainPageManager() {
  const [content, setContent] = useState(cloneDefaultContent)
  const [imagesByType, setImagesByType] = useState({ horizontal: [], vertical: [] })
  const [partnerLogos, setPartnerLogos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [editingCardIndex, setEditingCardIndex] = useState(null)
  const [cardDraft, setCardDraft] = useState(null)
  const logoDragSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const loadMainData = useCallback(async () => {
    try {
      setLoading(true)
      const [contentData, horizontalImages, verticalImages, logos] = await Promise.all([
        mainPageContentService.getMainPageContent(),
        mainImageService.getMainImagesByType('horizontal'),
        mainImageService.getMainImagesByType('vertical'),
        partnerLogoService.getPartnerLogos(),
      ])

      setContent(mergeMainContent(contentData))
      setImagesByType({ horizontal: horizontalImages, vertical: verticalImages })
      setPartnerLogos(logos)
    } catch (error) {
      window.alert(`메인 데이터 로딩에 실패했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMainData()
  }, [loadMainData])

  const updateContent = (updater) => {
    setContent((currentContent) => mergeMainContent(updater(currentContent)))
  }

  const updateCard = (cardIndex, updater) => {
    updateContent((currentContent) => {
      const cards = currentContent.section03.cards.map((card, index) =>
        index === cardIndex ? updater(card) : card,
      )

      return {
        ...currentContent,
        section03: {
          ...currentContent.section03,
          cards,
        },
      }
    })
  }

  const openCardModal = (cardIndex) => {
    setEditingCardIndex(cardIndex)
    setCardDraft(JSON.parse(JSON.stringify(content.section03.cards[cardIndex])))
  }

  const closeCardModal = () => {
    setEditingCardIndex(null)
    setCardDraft(null)
  }

  const updateCardDraft = (updater) => {
    setCardDraft((currentDraft) => updater(currentDraft))
  }

  const saveCardDraft = () => {
    updateCard(editingCardIndex, () => ({ ...cardDraft }))
    closeCardModal()
  }

  useEffect(() => {
    if (!cardDraft) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [cardDraft])

  const saveContent = async () => {
    try {
      setSaving(true)
      await mainPageContentService.saveMainPageContent(content)
      window.alert('MAIN 콘텐츠가 저장되었습니다.')
    } catch (error) {
      window.alert(`MAIN 콘텐츠 저장에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleHeroImageUpload = async (type, selection) => {
    const previews = selection?.previews || []

    if (!previews.length) {
      return
    }

    try {
      setUploading(true)
      const currentLength = imagesByType[type].length

      await Promise.all(
        previews.map(async (preview, index) => {
          const uploadResult = await imageService.uploadImage(preview.file, {
            folder: 'main',
            source: 'admin-main-hero',
          })

          await mainImageService.addMainImage({
            type,
            order: currentLength + index,
            fileName: uploadResult.fileName,
            imageUrl: uploadResult.imageUrl || uploadResult.publicUrl,
            r2Key: uploadResult.key || uploadResult.r2Key,
            originalName: uploadResult.fileName,
            fileSize: uploadResult.size || 0,
            contentType: uploadResult.contentType || 'image/jpeg',
          })
        }),
      )

      await loadMainData()
    } catch (error) {
      window.alert(`이미지 저장에 실패했습니다: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const deleteImage = async (imageData) => {
    if (!window.confirm('이미지를 삭제하시겠습니까?')) {
      return
    }

    try {
      await imageService.deleteImage(imageData.r2Key)
      await mainImageService.deleteMainImage(imageData.id)
      await loadMainData()
    } catch (error) {
      window.alert(`이미지 삭제에 실패했습니다: ${error.message}`)
    }
  }

  const addPartnerLogos = async (selection) => {
    const previews = selection?.previews || []

    if (!previews.length) {
      return
    }

    try {
      setLogoUploading(true)
      const currentLength = partnerLogos.length

      await Promise.all(
        previews.map(async (preview, index) => {
          const uploadResult = await imageService.uploadImage(preview.file, {
            folder: 'main/logos',
            source: 'admin-main-logo',
          })

          await partnerLogoService.addPartnerLogo({
            name: preview.name?.replace(/\.[^.]+$/, '') || `logo-${currentLength + index + 1}`,
            imageUrl: uploadResult.imageUrl || uploadResult.publicUrl,
            r2Key: uploadResult.key || uploadResult.r2Key,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.size || 0,
            contentType: uploadResult.contentType || 'image/png',
            order: currentLength + index,
          })
        }),
      )

      await loadMainData()
    } catch (error) {
      window.alert(`로고 추가에 실패했습니다: ${error.message}`)
    } finally {
      setLogoUploading(false)
    }
  }

  const updatePartnerLogoOrder = async (dragEvent) => {
    const { active, over } = dragEvent

    if (!over || active.id === over.id) {
      return
    }

    const currentIndex = partnerLogos.findIndex((logo) => logo.id === active.id)
    const nextIndex = partnerLogos.findIndex((logo) => logo.id === over.id)

    if (currentIndex < 0 || nextIndex < 0) {
      return
    }

    const reorderedLogos = arrayMove(partnerLogos, currentIndex, nextIndex).map((logo, index) => ({
      ...logo,
      order: index,
    }))

    setPartnerLogos(reorderedLogos)

    try {
      await Promise.all(
        reorderedLogos.map((logo, index) =>
          partnerLogoService.updatePartnerLogo(logo.id, { order: index }),
        ),
      )
    } catch (error) {
      window.alert(`로고 순서 변경에 실패했습니다: ${error.message}`)
      await loadMainData()
    }
  }

  const deletePartnerLogo = async (logo) => {
    if (!window.confirm('로고를 삭제하시겠습니까?')) {
      return
    }

    try {
      if (logo.r2Key) {
        await imageService.deleteImage(logo.r2Key)
      }

      await partnerLogoService.deletePartnerLogo(logo.id)
      await loadMainData()
    } catch (error) {
      window.alert(`로고 삭제에 실패했습니다: ${error.message}`)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-content">
        <div className="admin-page-title admin-page-title-with-actions">
          <h2>MAIN 관리</h2>
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
                  <div className="admin-pc-mo-grid">
                    {imageSections.map((section) => {
                      const images = imagesByType[section.type]
                      const deviceType = section.type === 'horizontal' ? 'pc' : 'mo'
                      const deviceLabel = section.type === 'horizontal' ? 'PC' : 'Mobile'

                      return (
                        <div className="admin-device-panel" key={section.type}>
                          <h5>{deviceLabel}</h5>
                          <div className="admin-form-row">
                            <label htmlFor={`section01-title-${deviceType}`}>
                              타이틀
                            </label>
                            <textarea
                              id={`section01-title-${deviceType}`}
                              className="admin-textarea"
                              value={content.section01.title[deviceType]}
                              onChange={(event) =>
                                updateContent((currentContent) => ({
                                  ...currentContent,
                                  section01: {
                                    ...currentContent.section01,
                                    title: {
                                      ...currentContent.section01.title,
                                      [deviceType]: event.target.value,
                                    },
                                  },
                                }))
                              }
                            />
                          </div>

                          <div className="admin-upload-section">
                            <h4>{section.description}</h4>
                            <ImageUploader
                              deferUpload
                              multiple
                              maxFiles={100}
                              showPreview={false}
                              onFilesSelected={(selection) =>
                                handleHeroImageUpload(section.type, selection)
                              }
                            />
                            {uploading && (
                              <p className="admin-save-message">저장 중...</p>
                            )}
                          </div>

                          <div className="admin-image-grid">
                            {images.length > 0 ? (
                              <div className="admin-image-grid-display">
                                {images.map((image, index) => (
                                  <div
                                    className={`admin-image-item ${section.itemClassName}`}
                                    key={image.id}
                                  >
                                    <img
                                      src={image.imageUrl}
                                      alt={`${section.title} ${index + 1}`}
                                    />
                                    <AdminMediaRemoveButton
                                      ariaLabel={`${section.title} 이미지 삭제`}
                                      onClick={() => deleteImage(image)}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="admin-no-images">{section.emptyText}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>

                <section className="admin-content-main admin-form-section">
                  <h4>Section1: 소개</h4>
                  <div className="admin-pc-mo-grid">
                    <div className="admin-device-panel">
                      <h5>PC</h5>
                      <div className="admin-form-row">
                        <label htmlFor="section02-eyebrow-pc">소제목</label>
                        <textarea
                          id="section02-eyebrow-pc"
                          className="admin-textarea admin-textarea-small"
                          value={content.section02.eyebrow.pc}
                          onChange={(event) =>
                            updateContent((currentContent) => ({
                              ...currentContent,
                              section02: {
                                ...currentContent.section02,
                                eyebrow: {
                                  ...currentContent.section02.eyebrow,
                                  pc: event.target.value,
                                },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="admin-form-row">
                        <label htmlFor="section02-title-pc">타이틀</label>
                        <textarea
                          id="section02-title-pc"
                          className="admin-textarea"
                          value={content.section02.title.pc}
                          onChange={(event) =>
                            updateContent((currentContent) => ({
                              ...currentContent,
                              section02: {
                                ...currentContent.section02,
                                title: {
                                  ...currentContent.section02.title,
                                  pc: event.target.value,
                                },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="admin-form-row">
                        <label htmlFor="section02-content-title-pc">본문 타이틀</label>
                        <textarea
                          id="section02-content-title-pc"
                          className="admin-textarea"
                          value={content.section02.content.title.pc}
                          onChange={(event) =>
                            updateContent((currentContent) => ({
                              ...currentContent,
                              section02: {
                                ...currentContent.section02,
                                content: {
                                  ...currentContent.section02.content,
                                  title: {
                                    ...currentContent.section02.content.title,
                                    pc: event.target.value,
                                  },
                                },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="admin-form-row">
                        <label htmlFor="section02-body-pc">본문 내용</label>
                        <small>*텍스트*로 강조</small>
                        <textarea
                          id="section02-body-pc"
                          className="admin-textarea admin-textarea-large"
                          value={content.section02.content.body.pc}
                          onChange={(event) =>
                            updateContent((currentContent) => ({
                              ...currentContent,
                              section02: {
                                ...currentContent.section02,
                                content: {
                                  ...currentContent.section02.content,
                                  body: {
                                    ...currentContent.section02.content.body,
                                    pc: event.target.value,
                                  },
                                },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="admin-device-panel">
                      <h5>Mobile</h5>
                      <div className="admin-form-row">
                        <label htmlFor="section02-eyebrow-mo">소제목</label>
                        <textarea
                          id="section02-eyebrow-mo"
                          className="admin-textarea admin-textarea-small"
                          value={content.section02.eyebrow.mo}
                          onChange={(event) =>
                            updateContent((currentContent) => ({
                              ...currentContent,
                              section02: {
                                ...currentContent.section02,
                                eyebrow: {
                                  ...currentContent.section02.eyebrow,
                                  mo: event.target.value,
                                },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="admin-form-row">
                        <label htmlFor="section02-title-mo">타이틀</label>
                        <textarea
                          id="section02-title-mo"
                          className="admin-textarea"
                          value={content.section02.title.mo}
                          onChange={(event) =>
                            updateContent((currentContent) => ({
                              ...currentContent,
                              section02: {
                                ...currentContent.section02,
                                title: {
                                  ...currentContent.section02.title,
                                  mo: event.target.value,
                                },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="admin-form-row">
                        <label htmlFor="section02-content-title-mo">본문 타이틀</label>
                        <textarea
                          id="section02-content-title-mo"
                          className="admin-textarea"
                          value={content.section02.content.title.mo}
                          onChange={(event) =>
                            updateContent((currentContent) => ({
                              ...currentContent,
                              section02: {
                                ...currentContent.section02,
                                content: {
                                  ...currentContent.section02.content,
                                  title: {
                                    ...currentContent.section02.content.title,
                                    mo: event.target.value,
                                  },
                                },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="admin-form-row">
                        <label htmlFor="section02-body-mo">본문 내용</label>
                        <small>*텍스트*로 강조</small>
                        <textarea
                          id="section02-body-mo"
                          className="admin-textarea admin-textarea-large"
                          value={content.section02.content.body.mo}
                          onChange={(event) =>
                            updateContent((currentContent) => ({
                              ...currentContent,
                              section02: {
                                ...currentContent.section02,
                                content: {
                                  ...currentContent.section02.content,
                                  body: {
                                    ...currentContent.section02.content.body,
                                    mo: event.target.value,
                                  },
                                },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                </section>

                <section className="admin-content-main admin-form-section">
                  <h4>Section2: 카드</h4>
                  <div className="admin-main-card-list">
                    {content.section03.cards.map((card, index) => (
                      <div className="admin-main-card-row" key={`main-card-${index}`}>
                        <div className="admin-main-card-title">
                          <strong style={{ fontSize: '20px' }}>{card.title?.pc || card.title?.mo || '제목 없음'}</strong>
                        </div>
                        <div className="admin-main-card-path">{card.path || '-'}</div>
                        <div className="admin-main-card-actions">
                          <button
                            className="admin-button"
                            type="button"
                            onClick={() => openCardModal(index)}
                          >
                            수정
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="admin-content-main admin-form-section">
                  <h4>Section3: 파트너사</h4>
                  <div className="admin-pc-mo-grid">
                    <div className="admin-device-panel">
                      <h5>PC</h5>
                      <div className="admin-form-row">
                        <label htmlFor="section04-caption-pc">소제목</label>
                        <textarea
                          id="section04-caption-pc"
                          className="admin-textarea admin-textarea-small"
                          value={content.section04.caption.pc}
                          onChange={(event) =>
                            updateContent((currentContent) => ({
                              ...currentContent,
                              section04: {
                                ...currentContent.section04,
                                caption: {
                                  ...currentContent.section04.caption,
                                  pc: event.target.value,
                                },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="admin-form-row">
                        <label htmlFor="section04-title-text-pc">타이틀</label>
                        <small>*텍스트*로 강조</small>
                        <textarea
                          id="section04-title-text-pc"
                          className="admin-textarea"
                          value={content.section04.title.text.pc}
                          onChange={(event) =>
                            updateContent((currentContent) => ({
                              ...currentContent,
                              section04: {
                                ...currentContent.section04,
                                title: {
                                  ...currentContent.section04.title,
                                  text: {
                                    ...currentContent.section04.title.text,
                                    pc: event.target.value,
                                  },
                                },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="admin-device-panel">
                      <h5>Mobile</h5>
                      <div className="admin-form-row">
                        <label htmlFor="section04-caption-mo">소제목</label>
                        <textarea
                          id="section04-caption-mo"
                          className="admin-textarea admin-textarea-small"
                          value={content.section04.caption.mo}
                          onChange={(event) =>
                            updateContent((currentContent) => ({
                              ...currentContent,
                              section04: {
                                ...currentContent.section04,
                                caption: {
                                  ...currentContent.section04.caption,
                                  mo: event.target.value,
                                },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="admin-form-row">
                        <label htmlFor="section04-title-text-mo">타이틀</label>
                        <small>*텍스트*로 강조</small>
                        <textarea
                          id="section04-title-text-mo"
                          className="admin-textarea"
                          value={content.section04.title.text.mo}
                          onChange={(event) =>
                            updateContent((currentContent) => ({
                              ...currentContent,
                              section04: {
                                ...currentContent.section04,
                                title: {
                                  ...currentContent.section04.title,
                                  text: {
                                    ...currentContent.section04.title.text,
                                    mo: event.target.value,
                                  },
                                },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="admin-logo-manager">
                    <div className="admin-logo-manager-header">
                      <div>
                        <h5>파트너사 로고</h5>
                        <p>드래그 앤 드롭으로 순서 변경</p>
                      </div>
                    </div>

                    <div className="admin-upload-section">
                      <h4>로고 추가</h4>
                      <ImageUploader
                        deferUpload
                        multiple
                        maxFiles={50}
                        showPreview={false}
                        onFilesSelected={addPartnerLogos}
                      />
                      {logoUploading && <p className="admin-save-message">로고 저장 중...</p>}
                    </div>

                    {partnerLogos.length > 0 ? (
                      <DndContext
                        sensors={logoDragSensors}
                        collisionDetection={closestCenter}
                        onDragEnd={updatePartnerLogoOrder}
                      >
                        <SortableContext
                          items={partnerLogos.map((logo) => logo.id)}
                          strategy={rectSortingStrategy}
                        >
                          <div className="admin-logo-grid">
                            {partnerLogos.map((logo) => (
                              <SortablePartnerLogoItem
                                key={logo.id}
                                logo={logo}
                                onDelete={deletePartnerLogo}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <div className="admin-logo-grid">
                        <p className="admin-no-images">등록된 로고가 없습니다.</p>
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
        open={Boolean(cardDraft)}
        title={`${content.section03.cards[editingCardIndex]?.title?.pc || '카드'} 수정`}
        onClose={closeCardModal}
        footer={
          <>
            <button className="admin-button" type="button" onClick={saveCardDraft}>
              저장
            </button>
          </>
        }
      >
        {cardDraft && (
          <>
            <div className="admin-pc-mo-grid">
              {['pc', 'mo'].map((device) => (
                <div className="admin-device-panel" key={device}>
                  <h5>{device === 'pc' ? 'PC' : 'Mobile'}</h5>
                  <div className="admin-form-row">
                    <label htmlFor={`card-modal-title-${device}`}>카드 제목</label>
                    <textarea
                      id={`card-modal-title-${device}`}
                      className="admin-textarea admin-textarea-small"
                      value={cardDraft.title[device]}
                      onChange={(event) =>
                        updateCardDraft((currentDraft) => ({
                          ...currentDraft,
                          title: { ...currentDraft.title, [device]: event.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="admin-form-row">
                    <label htmlFor={`card-modal-description-${device}`}>카드 설명</label>
                    <textarea
                      id={`card-modal-description-${device}`}
                      className="admin-textarea admin-textarea-small"
                      value={cardDraft.description[device]}
                      onChange={(event) =>
                        updateCardDraft((currentDraft) => ({
                          ...currentDraft,
                          description: {
                            ...currentDraft.description,
                            [device]: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-form-row">
              <label htmlFor="card-modal-path">링크</label>
              <input
                id="card-modal-path"
                className="admin-input"
                value={cardDraft.path || ''}
                onChange={(event) =>
                  updateCardDraft((currentDraft) => ({
                    ...currentDraft,
                    path: event.target.value,
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
