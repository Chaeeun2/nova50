import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import projectData from '../data/ProjectData'
import {
  buildWorksFilterTagsForUi,
  normalizeWorksFilterTags,
  worksFilterTags as defaultWorksFilterTags,
} from '../data/worksFilterTags'
import '../styles/ProjectModal.css'
import { useRevealAnimations } from '../hooks/useRevealAnimations'
import { getWorks, getWorksFilterTags } from '../services/mainPageService'
import { revealDelay } from '../utils/reveal'
import './WorksPage.css'

const worksHeroTitle = {
  pc: 'What we did',
  mo: 'WHAT\nWE DID',
}

const getEnglishTitle = (title) => {
  if (typeof title === 'string') {
    return title
  }

  if (title && typeof title === 'object') {
    return title.pc || title.mo || ''
  }

  return ''
}

function WorksPage() {
  const [projects, setProjects] = useState(projectData)
  const [filterTags, setFilterTags] = useState(defaultWorksFilterTags)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [activeDetailImageIndex, setActiveDetailImageIndex] = useState(0)
  const detailDragStartX = useRef(0)
  const detailDragOffsetX = useRef(0)
  const isDetailDragging = useRef(false)
  const filteredProjects =
    activeFilters.length === 0
      ? projects
      : projects.filter((project) => project.tags.some((tag) => activeFilters.includes(tag)))

  useRevealAnimations()

  useEffect(() => {
    let isMounted = true

    async function loadWorks() {
      try {
        const [works, remoteFilterTags] = await Promise.all([getWorks(), getWorksFilterTags()])

        if (!isMounted) {
          return
        }

        if (remoteFilterTags) {
          setFilterTags(buildWorksFilterTagsForUi(normalizeWorksFilterTags(remoteFilterTags)))
        }

        if (works.length > 0) {
          setProjects(works)
        }
      } catch (error) {
        console.warn('Works 데이터 로딩 실패:', error)
      }
    }

    loadWorks()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedProject) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedProject(null)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedProject])

  useEffect(() => {
    if (!selectedProject || selectedProject.detailImages.length <= 1) {
      return undefined
    }

    const detailSlideTimer = window.setTimeout(() => {
      setActiveDetailImageIndex((currentIndex) => (currentIndex + 1) % selectedProject.detailImages.length)
    }, 5000)

    return () => window.clearTimeout(detailSlideTimer)
  }, [activeDetailImageIndex, selectedProject])

  const handleFilterClick = (label) => {
    if (label === 'ALL') {
      setActiveFilters([])
      return
    }

    setActiveFilters((currentFilters) =>
      currentFilters.includes(label)
        ? currentFilters.filter((filter) => filter !== label)
        : [...currentFilters, label],
    )
  }

  const openProjectModal = (project) => {
    setSelectedProject(project)
    setActiveDetailImageIndex(0)
  }

  const moveDetailSlide = (direction) => {
    if (!selectedProject || selectedProject.detailImages.length <= 1) {
      return
    }

    setActiveDetailImageIndex((currentIndex) => {
      const nextIndex = currentIndex + direction
      return (nextIndex + selectedProject.detailImages.length) % selectedProject.detailImages.length
    })
  }

  const handleDetailDragStart = (event) => {
    if (!selectedProject || selectedProject.detailImages.length <= 1) {
      return
    }

    isDetailDragging.current = true
    detailDragStartX.current = event.clientX
    detailDragOffsetX.current = 0
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleDetailDragMove = (event) => {
    if (!isDetailDragging.current) {
      return
    }

    detailDragOffsetX.current = event.clientX - detailDragStartX.current
  }

  const handleDetailDragEnd = (event) => {
    if (!isDetailDragging.current) {
      return
    }

    const dragOffset = detailDragOffsetX.current
    isDetailDragging.current = false
    detailDragStartX.current = 0
    detailDragOffsetX.current = 0

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (Math.abs(dragOffset) < 60) {
      return
    }

    moveDetailSlide(dragOffset < 0 ? 1 : -1)
  }

  return (
    <main className="works-page">
      <Header currentPage="works" variant="dark" />

      <section className="works-hero" data-reveal-section>
        <p className="works-eyebrow" data-reveal-item style={revealDelay(0)}>
          Works
        </p>
        <h1
          className="works-hero-title works-hero-title-pc"
          data-reveal-item
          style={revealDelay(1)}
        >
          {worksHeroTitle.pc}
        </h1>
        <h1
          className="works-hero-title works-hero-title-mo"
          data-reveal-item
          style={revealDelay(1)}
        >
          {worksHeroTitle.mo}
        </h1>
      </section>

      <section className="works-filter-section" aria-label="Works filters" data-reveal-section>
        <div data-reveal-item style={revealDelay(0)}>
          <button
            className={`works-filter-title ${isFilterOpen ? 'is-open' : ''}`}
            type="button"
            aria-expanded={isFilterOpen}
            aria-controls="works-filter-list"
            onClick={() => setIsFilterOpen((currentState) => !currentState)}
          >
            <svg
              className="works-filter-arrow"
              width="19"
              height="12"
              viewBox="0 0 19 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M17.0605 10.1213L9.06055 2.12134L1.06055 10.1213" stroke="white" strokeWidth="3" />
            </svg>
            <p>filter</p>
          </button>
        </div>
        <div data-reveal-item style={revealDelay(1)}>
          <div className={`works-filter-panel ${isFilterOpen ? 'is-open' : ''}`} id="works-filter-list">
            <div className="works-filter-list">
              {filterTags.map((tag) => (
                <button
                  className={[
                    'works-filter-chip',
                    tag.tone ? `is-${tag.tone}` : '',
                    activeFilters.includes(tag.label) ? 'is-active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={tag.label}
                  type="button"
                  aria-pressed={tag.label === 'ALL' ? activeFilters.length === 0 : activeFilters.includes(tag.label)}
                  onClick={() => handleFilterClick(tag.label)}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="works-grid" aria-label="Works list" data-reveal-section>
        {filteredProjects.map((project, index) => (
          <article className="work-card" data-reveal-item key={project.id} style={revealDelay(index)}>
            <button
              className="work-card-thumbnail"
              type="button"
              onClick={() => openProjectModal(project)}
              aria-label={`${getEnglishTitle(project.englishTitle)} detail`}
            >
              <img src={project.thumbnail} alt={getEnglishTitle(project.englishTitle)} />
            </button>
            <p>{project.koreanTitle}</p>
            <h2 className="work-card-title">{getEnglishTitle(project.englishTitle)}</h2>
            <div className="work-card-tags">
              {(project.cardTags?.length ? project.cardTags : project.tags || []).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </section>

      {selectedProject && (
        <div
          className="project-modal-overlay"
          role="presentation"
          onClick={() => setSelectedProject(null)}
        >
          <article
            className="project-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="project-modal-close"
              type="button"
              aria-label="Close project detail"
              onClick={() => setSelectedProject(null)}
            />
            <div
              className="project-modal-media"
              onPointerDown={handleDetailDragStart}
              onPointerMove={handleDetailDragMove}
              onPointerUp={handleDetailDragEnd}
              onPointerCancel={handleDetailDragEnd}
            >
              <div
                className="project-modal-track"
                style={{ transform: `translateX(-${activeDetailImageIndex * 100}%)` }}
              >
                {selectedProject.detailImages.map((image, index) => (
                  <div className="project-modal-slide" key={image}>
                    <img
                      src={image}
                      alt={`${getEnglishTitle(selectedProject.englishTitle)} ${index + 1}`}
                      draggable="false"
                    />
                  </div>
                ))}
              </div>
              {selectedProject.detailImages.length > 1 && (
                <div
                  className="project-modal-dots"
                  aria-label="Project image slides"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => event.stopPropagation()}
                >
                  {selectedProject.detailImages.map((image, index) => (
                    <button
                      className={activeDetailImageIndex === index ? 'is-active' : undefined}
                      type="button"
                      key={image}
                      aria-label={`Show image ${index + 1}`}
                      onClick={() => setActiveDetailImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="project-modal-content">
              <div className="project-modal-title">
                <p>{selectedProject.modalKoreanTitle ?? selectedProject.koreanTitle}</p>
                <h2 id="project-modal-title">{getEnglishTitle(selectedProject.englishTitle)}</h2>
              </div>
              <dl className="project-modal-info">
                <div>
                  <dt>DATE</dt>
                  <dd>{selectedProject.date}</dd>
                </div>
                <div>
                  <dt>CLIENT</dt>
                  <dd>{selectedProject.client}</dd>
                </div>
                <div>
                  <dt>LOCATION</dt>
                  <dd>{selectedProject.location}</dd>
                </div>
              </dl>
              <div className="project-modal-description">
                <h3>WHAT WE DID</h3>
                <p>{selectedProject.whatWeDid}</p>
              </div>
              <div className="project-modal-tags">
                {selectedProject.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </article>
        </div>
      )}

      <Footer />
    </main>
  )
}

export default WorksPage
