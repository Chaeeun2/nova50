import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import projectData from '../data/ProjectData'
import '../styles/ProjectModal.css'
import './WorksPage.css'

const revealStagger = 120
const revealDelay = (order = 0) => ({
  '--reveal-delay': `${order * revealStagger}ms`,
})

const filterTags = [
  { label: 'ALL', tone: 'white' },
  { label: 'Game Event' },
  { label: 'Showcase' },
  { label: 'Pre-launch' },
  { label: 'Offline' },
  { label: 'Immersive' },
  { label: 'Interactive' },
  { label: 'Media' },
  { label: 'Influencer' },
  { label: 'Corporate Event' },
  { label: 'Ceremony' },
  { label: 'Recognition' },
  { label: 'VIP' },
  { label: 'Networking' },
  { label: 'Presentation' },
  { label: 'Internal Engagement' },
]

function WorksPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [activeDetailImageIndex, setActiveDetailImageIndex] = useState(0)
  const detailDragStartX = useRef(0)
  const detailDragOffsetX = useRef(0)
  const isDetailDragging = useRef(false)
  const filteredProjects =
    activeFilters.length === 0
      ? projectData
      : projectData.filter((project) => project.tags.some((tag) => activeFilters.includes(tag)))

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
  }, [activeFilters])

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

      <section className="works-hero">
        <p className="works-eyebrow" data-reveal>
          Works
        </p>
        <h1 data-reveal style={revealDelay(1)}>
          What we did
        </h1>
      </section>

      <section className="works-filter-section" aria-label="Works filters">
        <div data-reveal>
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
        <div data-reveal style={revealDelay(1)}>
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

      <section
        className="works-grid"
        aria-label="Works list"
        data-reveal
        style={{ '--reveal-delay': '200ms' }}
      >
        {filteredProjects.map((project) => (
          <article className="work-card" key={project.id}>
            <button
              className="work-card-thumbnail"
              type="button"
              onClick={() => openProjectModal(project)}
              aria-label={`${project.englishTitle} detail`}
            >
              <img src={project.thumbnail} alt={project.englishTitle} />
            </button>
            <p>{project.koreanTitle}</p>
            <h2>{project.englishTitle}</h2>
            <div className="work-card-tags">
              {project.tags.slice(0, 3).map((tag) => (
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
                      alt={`${selectedProject.englishTitle} ${index + 1}`}
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
                <p>{selectedProject.koreanTitle}</p>
                <h2 id="project-modal-title">{selectedProject.englishTitle}</h2>
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
