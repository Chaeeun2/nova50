/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import welfare01 from '../assets/career/welfare_01.png'
import welfare02 from '../assets/career/welfare_02.png'
import welfare03 from '../assets/career/welfare_03.png'
import welfare04 from '../assets/career/welfare_04.png'
import welfare05 from '../assets/career/welfare_05.png'
import welfare06 from '../assets/career/welfare_06.png'
import welfare07 from '../assets/career/welfare_07.png'
import welfare08 from '../assets/career/welfare_08.png'
import { useRevealAnimations } from '../hooks/useRevealAnimations'
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

export const careerText = {
  hero: {
    eyebrow: 'Who We Look for',
    title: `people
who make
NOVA50`,
    copy: `NOVA50는 사람으로 완성됩니다.
스스로 시작하고, 끝까지 결과를 만들어내며,
전체를 움직이는 사람들이 우리의 기준입니다`,
  },
  work: [
    {
      id: 'set-the-stage-themselves',
      title: {
        pc: `set
the stage
themselves`,
        mo: `set the stage
themselves`,
      },
      tags: ['주도성', '빠른 실행', '아이디어 실행력'],
      copy: `스스로
      판을 만드는 사람`,
    },
    {
      id: 'find-a-way-to-make-it-happen',
      title: {
        pc: `find a way
to make it
happen`,
        mo: `find a way to
make it happen`,
      },
      copy: `어떻게든
결과를 만들어내는 사람`,
      tags: ['책임감', '완성도 집착', '마감 준수'],
    },
    {
      id: 'design-the-whole-picture',
      title: {
        pc: `design
the whole
picture`,
        mo: `design the
whole picture`,
      },
      copy: `전체 흐름과 결과를
설계하는 사람`,
      tags: ['기획력', '구조 설계', '문제 정의'],
    },
    {
      id: 'lift-our-team-forward',
      title: {
        pc: `lift
our team
forward`,
        mo: `lift our team
forward`,
      },
      copy: `팀의 속도를
끌어올리는 사람`,
      tags: ['커뮤니케이션', '협업 능력', '조율 능력'],
    },
    {
      id: 'disruption-into-direction',
      title: {
        pc: `disruption
into
direction`,
        mo: `disruption
into direction`,
      },
      copy: `변수를
기회로 바꾸는 사람`,
      tags: ['유연성', '문제 해결력', '빠른 판단력', '적응력'],
    },
  ],
  welfare: [
    {
      icon: welfare01,
      title: 'enablement',
      copy: `모니터암, T50AIR 의자,
최신형 노트북 제공`,
    },
    {
      icon: welfare02,
      title: 'Lunch',
      copy: `매일 색다른,
또는 건강한 중식 지원`,
    },
    {
      icon: welfare03,
      title: 'Incentive',
      copy: `성과는 모두 함께,
연간 성과급 지급`,
    },
    {
      icon: welfare04,
      title: 'loyalty',
      copy: `3, 5, 10, 30년
함께 한 만큼 포상`,
    },
    {
      icon: welfare05,
      title: 'support',
      copy: `기쁜 일, 슬픈 일은 함께,
경조금 지원`,
    },
    {
      icon: welfare06,
      title: 'gift',
      copy: '설/추석 명절 선물은 필수',
    },
    {
      icon: welfare07,
      title: 'recharge',
      copy: `연차 휴가, 반차 휴가
효율적 사용 가능`,
    },
    {
      icon: welfare08,
      title: 'cafe',
      copy: '풍성한 음료 및 간식 제공',
    },
  ],
  cta: {
    title: {
      pc: 'add your 50',
      mo: `add
your 50`,
    },
    copy: {
      pc: `우리는 완벽한 사람을 찾지 않습니다.
하지만, 자신만의 방식으로 50을 더할 수 있는 사람을 찾습니다.
*NOVA50에서 당신의 50을 보여주세요.*`,
      mo: `우리는 완벽한 사람을 찾지 않습니다.
하지만, 자신만의 방식으로
50을 더할 수 있는 사람을 찾습니다.
*NOVA50에서 당신의 50을 보여주세요.*`,
    },
    notes: `지원서 양식을 다운로드 후, 작성하여 hello@nova-50.com으로 접수합니다.
플래너(경력) 및 디자이너(신입/경력) 지원 시 경력 기술서 또는 포트폴리오(자유양식)을 첨부해야 합니다.`,
    openings: [
      {
        id: 'opening-experience-planner',
        team: 'Experience Design Group',
        role: 'Experience Planner',
      },
      {
        id: 'opening-graphic-designer',
        team: 'Creative Design Lab',
        role: 'Graphic Designer',
      },
    ],
  },
}

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

export function normalizeCareerCta(cta = {}) {
  const { teams, ...ctaWithoutTeams } = cta

  return {
    ...ctaWithoutTeams,
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

function CareerPage() {
  const [pageText, setPageText] = useState(careerText)
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
          setPageText({
            ...careerText,
            ...data.content,
            cta: normalizeCareerCta({
              ...careerText.cta,
              ...data.content.cta,
            }),
          })
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

  const copyEmail = async () => {
    const email = 'hello@nova-50.com'

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
          <a href="../assets/career/NOVA50_지원서.docx" download>
            지원양식 다운로드
          </a>
          <button type="button" onClick={copyEmail}>
            <strong>메일 주소 복사하기</strong>
            <span>hello@nova-50.com</span>
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
