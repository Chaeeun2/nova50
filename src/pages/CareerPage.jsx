/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useRevealAnimations } from '../hooks/useRevealAnimations'
import { createEmptyCareerContent } from '../data/pageContentDefaults'
import { getPageContent } from '../services/mainPageService'
import { revealDelay } from '../utils/reveal'
import './CareerPage.css'

const splitLines = (text) => text.split('\n')

const renderPointText = (text) =>
  text.split(/(\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={`${part}-${index}`}>{part.slice(1, -1)}</strong>
    }

    return <span key={`${part}-${index}`}>{part}</span>
  })


export function normalizeCareerOpening(opening) {
  if (Array.isArray(opening)) {
    return { team: opening[0] || '', role: opening[1] || '' }
  }

  return {
    team: opening?.team || '',
    role: opening?.role || '',
  }
}

export function normalizeCareerOpenings(openings = []) {
  return openings.map(normalizeCareerOpening)
}

export function normalizeCareerTeams(teams = []) {
  if (!Array.isArray(teams)) {
    return []
  }

  return teams.map((item, index) => {
    if (typeof item === 'string') {
      return { id: `team-${index}`, name: item }
    }

    return {
      id: item.id || `team-${index}`,
      name: item.name || item.team || '',
    }
  })
}

export function normalizeCareerOpeningRoles(openings = []) {
  if (!Array.isArray(openings)) {
    return []
  }

  return openings.map((item, index) => {
    if (item?.role !== undefined && item?.team === undefined && !Array.isArray(item)) {
      return {
        id: item.id || `opening-${index}`,
        role: item.role || '',
      }
    }

    const legacy = normalizeCareerOpening(item)

    return {
      id: item?.id || `opening-${index}`,
      role: legacy.role,
    }
  })
}

export function formatCareerNotesForEditor(notes) {
  if (typeof notes === 'string') {
    return notes
  }

  if (!Array.isArray(notes)) {
    return ''
  }

  if (!notes.length) {
    return ''
  }

  if (typeof notes[0] === 'string') {
    return notes.join('\n')
  }

  return notes
    .map((note) => note?.pc || note?.mo || '')
    .filter(Boolean)
    .join('\n')
}

export function normalizeCareerNotesForDisplay(notes) {
  return formatCareerNotesForEditor(notes)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function normalizeCareerCtaOpenings(openings = [], teams = []) {
  if (Array.isArray(teams) && teams.length > 0) {
    const teamList = normalizeCareerTeams(teams)
    const roleList = normalizeCareerOpeningRoles(openings)
    const rowCount = Math.max(teamList.length, roleList.length)

    return Array.from({ length: rowCount }, (_, index) => ({
      id: teamList[index]?.id || roleList[index]?.id || `opening-${index}`,
      team: teamList[index]?.name || '',
      role: roleList[index]?.role || '',
    }))
  }

  if (!Array.isArray(openings)) {
    return []
  }

  return openings.map((item, index) => {
    const row = normalizeCareerOpening(item)

    return {
      id: item?.id || `opening-${index}`,
      team: row.team,
      role: row.role,
    }
  })
}

export function getCareerApplicationFormFileNameFromUrl(url = '') {
  const trimmed = String(url || '').trim()

  if (!trimmed) {
    return ''
  }

  try {
    const pathname = trimmed.startsWith('http') ? new URL(trimmed).pathname : trimmed
    const segment = pathname.split('/').filter(Boolean).pop() || ''

    return decodeURIComponent(segment)
  } catch {
    const segment = trimmed.split('/').filter(Boolean).pop() || trimmed

    return decodeURIComponent(segment)
  }
}

export function getCareerApplicationFormDownloadName(cta = {}) {
  const stored = String(cta.applicationFormFileName || '').trim()

  if (stored) {
    return stored
  }

  return getCareerApplicationFormFileNameFromUrl(cta.applicationFormUrl)
}

export function normalizeCareerCta(cta = {}) {
  const { teams, applicationFormMedia, ...ctaWithoutTeams } = cta
  const defaults = createEmptyCareerContent().cta
  const applicationFormUrl =
    String(cta.applicationFormUrl ?? defaults.applicationFormUrl).trim() ||
    defaults.applicationFormUrl

  return {
    ...ctaWithoutTeams,
    contactEmail: String(cta.contactEmail ?? defaults.contactEmail).trim() || defaults.contactEmail,
    applicationFormUrl,
    applicationFormFileName:
      String(cta.applicationFormFileName || '').trim() ||
      getCareerApplicationFormFileNameFromUrl(applicationFormUrl) ||
      defaults.applicationFormFileName,
    applicationFormR2Key: String(cta.applicationFormR2Key || '').trim(),
    openings: normalizeCareerCtaOpenings(cta.openings, teams),
    notes: formatCareerNotesForEditor(cta.notes),
  }
}

export function getCareerCtaDisplayRows(cta = {}) {
  return normalizeCareerCta(cta).openings.map((row) => ({
    team: row.team,
    role: row.role,
    key: row.id,
  }))
}

export function mergeCareerPageContent(remote) {
  const defaults = createEmptyCareerContent()

  if (!remote) {
    return defaults
  }

  return {
    ...defaults,
    ...remote,
    hero: {
      ...defaults.hero,
      ...remote.hero,
    },
    work: Array.isArray(remote.work) ? remote.work : defaults.work,
    welfare: Array.isArray(remote.welfare) ? remote.welfare : defaults.welfare,
    cta: normalizeCareerCta({
      ...defaults.cta,
      ...remote.cta,
    }),
  }
}

function CareerPage() {
  const [pageText, setPageText] = useState(createEmptyCareerContent)
  const [isPageContentReady, setIsPageContentReady] = useState(false)
  const [activeWorkIndex, setActiveWorkIndex] = useState(null)
  const [useWorkClickInteraction, setUseWorkClickInteraction] = useState(false)
  const [isCareerDarkActive, setIsCareerDarkActive] = useState(false)
  const heroTitleLines = splitLines(pageText.hero.title)
  const workRevealKey = pageText.work
    .map((item, index) => `${index}:${item.id || item.title?.pc || ''}`)
    .join('|')
  const welfareRevealKey = pageText.welfare
    .map((item, index) => `${index}:${item.id || item.title || ''}`)
    .join('|')
  const ctaDisplayRows = getCareerCtaDisplayRows(pageText.cta)
  const ctaNoteLines = normalizeCareerNotesForDisplay(pageText.cta.notes)
  const ctaOpeningsRevealKey = ctaDisplayRows
    .map((row, index) => `${index}:${row.team}:${row.role}`)
    .join('|')
  const ctaNotesRevealKey = ctaNoteLines.join('|')

  useRevealAnimations({
    refreshDeps: [
      isPageContentReady,
      workRevealKey,
      welfareRevealKey,
      ctaOpeningsRevealKey,
      ctaNotesRevealKey,
    ],
  })

  useEffect(() => {
    let isMounted = true

    async function loadCareerContent() {
      try {
        const data = await getPageContent('career')

        if (isMounted && data?.content) {
          setPageText(mergeCareerPageContent(data.content))
        }
      } catch (error) {
        console.warn('Career 데이터 로딩 실패:', error)
      } finally {
        if (isMounted) {
          setIsPageContentReady(true)
        }
      }
    }

    loadCareerContent()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: none)')
    const updateWorkInteraction = () => {
      setUseWorkClickInteraction(mediaQuery.matches)

      if (!mediaQuery.matches) {
        setActiveWorkIndex(null)
      }
    }

    updateWorkInteraction()
    mediaQuery.addEventListener('change', updateWorkInteraction)

    return () => {
      mediaQuery.removeEventListener('change', updateWorkInteraction)
    }
  }, [])

  useEffect(() => {
    const updateCareerDarkState = () => {
      const ctaSection = document.querySelector('.career-cta-section')
      const scrollBottom = window.scrollY + window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const isCtaTopActive = Boolean(ctaSection && ctaSection.getBoundingClientRect().top < 80)
      const isPageBottomActive = documentHeight - scrollBottom <= 4

      setIsCareerDarkActive(isCtaTopActive || isPageBottomActive)
    }

    updateCareerDarkState()
    window.addEventListener('scroll', updateCareerDarkState, { passive: true })
    window.addEventListener('resize', updateCareerDarkState)

    return () => {
      window.removeEventListener('scroll', updateCareerDarkState)
      window.removeEventListener('resize', updateCareerDarkState)
    }
  }, [])

  const contactEmail = pageText.cta.contactEmail
  const applicationFormUrl = pageText.cta.applicationFormUrl
  const applicationFormDownloadName = getCareerApplicationFormDownloadName(pageText.cta)

  const copyEmail = async () => {
    const email = contactEmail

    try {
      await navigator.clipboard?.writeText(email)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = email
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    window.alert('복사되었습니다.')
  }

  return (
    <main className="career-page">
      <Header currentPage="career" forceDark={isCareerDarkActive} variant="light" />

      <section className="career-hero" data-reveal-section data-reveal-section-immediate>
        <p className="career-eyebrow" data-reveal-item style={revealDelay(0)}>
          {pageText.hero.eyebrow}
        </p>
        <h1>
          {heroTitleLines.map((line, index) => (
            <span data-reveal-item key={line} style={revealDelay(index + 1)}>
              {line}
            </span>
          ))}
        </h1>
        <span
          className="career-section-line"
          aria-hidden="true"
          data-reveal-item
          style={revealDelay(heroTitleLines.length + 1)}
        />
        <p className="career-hero-copy" data-reveal-item style={revealDelay(heroTitleLines.length + 2)}>
          {pageText.hero.copy}
        </p>
      </section>

      <section className="career-work-section" data-reveal-section>
        <p className="career-eyebrow" data-reveal-item style={revealDelay(0)}>
          How We Work
        </p>
        <div className="career-work-grid">
          {isPageContentReady &&
            pageText.work.map((item, index) => (
              <div
                className="career-work-reveal"
                data-reveal-item
                key={`work-${index}-${item.id}`}
                style={revealDelay(index + 1)}
              >
                <article
                  className={`career-work-card ${
                    useWorkClickInteraction && activeWorkIndex === index ? 'is-active' : ''
                  }`}
                  {...(useWorkClickInteraction
                    ? {
                        role: 'button',
                        tabIndex: 0,
                        'aria-expanded': activeWorkIndex === index,
                        onClick: () =>
                          setActiveWorkIndex((currentIndex) =>
                            currentIndex === index ? null : index,
                          ),
                        onKeyDown: (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setActiveWorkIndex((currentIndex) =>
                              currentIndex === index ? null : index,
                            )
                          }
                        },
                      }
                    : {})}
                >
                  <h2>
                    <span className="career-work-title-pc">{item.title.pc}</span>
                    <span className="career-work-title-mo">{item.title.mo}</span>
                  </h2>
                  <p className="career-work-copy">{item.copy}</p>
                  <div className="career-work-tags">
                    {item.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </article>
              </div>
            ))}
        </div>
      </section>

      <section
        className={`career-welfare-section ${isCareerDarkActive ? 'is-dark-active' : ''}`}
        data-reveal-section
      >
        <h2>
          <span className="career-welfare-title-line" data-reveal-item style={revealDelay(0)}>
            Our
          </span>
          <span className="career-welfare-title-line" data-reveal-item style={revealDelay(1)}>
            Welfare
          </span>
        </h2>
        <div className="career-welfare-grid">
          {isPageContentReady &&
            pageText.welfare.map((item, index) => (
              <article
                className="career-welfare-card"
                data-reveal-item
                key={`welfare-${index}-${item.id || item.title}`}
                style={revealDelay(index + 2)}
              >
                <img src={item.icon} alt="" aria-hidden="true" />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>
              </article>
            ))}
        </div>
      </section>

      <section className="career-cta-section" data-reveal-section>
        <h2 data-reveal-item style={revealDelay(0)}>
          <span className="career-cta-title-pc">{pageText.cta.title.pc}</span>
          <span className="career-cta-title-mo">{pageText.cta.title.mo}</span>
        </h2>
        <p className="career-cta-copy career-cta-copy-pc" data-reveal-item style={revealDelay(1)}>
          {renderPointText(pageText.cta.copy.pc)}
        </p>
        <p className="career-cta-copy career-cta-copy-mo" data-reveal-item style={revealDelay(1)}>
          {renderPointText(pageText.cta.copy.mo)}
        </p>
        <div className="career-openings">
          {isPageContentReady &&
            ctaDisplayRows.map((row, index) => (
              <div data-reveal-item key={row.key} style={revealDelay(2 + index)}>
                <strong>{row.team}</strong>
                <span>{row.role}</span>
              </div>
            ))}
        </div>
        <div
          className="career-cta-actions"
          data-reveal-item
          style={revealDelay(2 + ctaDisplayRows.length)}
        >
          <a href={applicationFormUrl} download={applicationFormDownloadName || undefined}>
            지원양식 다운로드
          </a>
          <button type="button" onClick={copyEmail}>
            <strong>메일 주소 복사하기</strong>
            <span>{contactEmail}</span>
          </button>
        </div>
        <ul className="career-cta-notes">
          {ctaNoteLines.map((note, index) => (
            <li
              data-reveal-item
              key={`${note}-${index}`}
              style={revealDelay(3 + ctaDisplayRows.length + index)}
            >
              <span className="member-project-dot" aria-hidden="true" />
              <span className="career-cta-note-text">{note}</span>
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </main>
  )
}

export default CareerPage
