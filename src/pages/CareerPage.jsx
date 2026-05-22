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
import './CareerPage.css'

const revealStagger = 120
const revealDelay = (order = 0) => ({
  '--reveal-delay': `${order * revealStagger}ms`,
})

const splitLines = (text) => text.split('\n')

const renderPointText = (text) =>
  text.split(/(\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={`${part}-${index}`}>{part.slice(1, -1)}</strong>
    }

    return <span key={`${part}-${index}`}>{part}</span>
  })

const careerText = {
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
      title: `set
the stage
themselves`,
      tags: ['주도성', '빠른 실행', '아이디어 실행력'],
      copy: `스스로 무대를 만들고
빠르게 실행하는 사람`,
    },
    {
      title: `find a way
to make it
happen`,
      copy: `어떻게든
결과를 만들어내는 사람`,
      tags: ['책임감', '완성도 집착', '마감 준수'],
    },
    {
      title: `design
the whole
picture`,
      copy: `전체 흐름과 결과를
설계하는 사람`,
      tags: ['기획력', '구조 설계', '문제 정의'],
    },
    {
      title: `lift
our team
forward`,
      copy: `팀의 속도를
끌어올리는 사람`,
      tags: ['커뮤니케이션', '협업 능력', '조율 능력'],
    },
    {
      title: `disruption
into
direction`,
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
    title: 'add your 50',
    copy: `우리는 완벽한 사람을 찾지 않습니다.
하지만, 자신만의 방식으로 50을 더할 수 있는 사람을 찾습니다.
*NOVA50에서 당신의 50을 보여주세요.*`,
    openings: [
      ['Experience Design Group', 'Experience Planner'],
      ['Creative Design Lab', 'Graphic Designer'],
    ],
  },
}

function CareerPage() {
  const [activeWorkIndex, setActiveWorkIndex] = useState(null)
  const [isCareerDarkActive, setIsCareerDarkActive] = useState(false)
  const heroTitleLines = splitLines(careerText.hero.title)

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

      <section className="career-hero">
        <p className="career-eyebrow" data-reveal>
          {careerText.hero.eyebrow}
        </p>
        <h1>
          {heroTitleLines.map((line, index) => (
            <span data-reveal key={line} style={revealDelay(index + 1)}>
              {line}
            </span>
          ))}
        </h1>
        <span className="career-section-line" aria-hidden="true" data-reveal style={revealDelay(4)} />
        <p className="career-hero-copy" data-reveal style={revealDelay(5)}>
          {careerText.hero.copy}
        </p>
      </section>

      <section className="career-work-section">
        <p className="career-eyebrow" data-reveal>
          How We Work
        </p>
        <div className="career-work-grid">
          {careerText.work.map((item, index) => (
            <div
              className="career-work-reveal"
              data-reveal
              key={item.title}
              style={revealDelay(index + 1)}
            >
              <button
                className={`career-work-card ${activeWorkIndex === index ? 'is-active' : ''}`}
                type="button"
                onClick={() =>
                  setActiveWorkIndex((currentIndex) => (currentIndex === index ? null : index))
                }
              >
                <h2>{item.title}</h2>
                {activeWorkIndex === index ? (
                  <div className="career-work-tags">
                    {item.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                ) : (
                  <p>{item.copy}</p>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={`career-welfare-section ${isCareerDarkActive ? 'is-dark-active' : ''}`}>
        <h2 data-reveal>
          Our
          <br />
          Welfare
        </h2>
        <div className="career-welfare-grid">
          {careerText.welfare.map((item, index) => (
            <article className="career-welfare-card" data-reveal key={item.title} style={revealDelay(index % 4)}>
              <img src={item.icon} alt="" aria-hidden="true" />
              <div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="career-cta-section">
        <h2 data-reveal>{careerText.cta.title}</h2>
        <p className="career-cta-copy" data-reveal style={revealDelay(1)}>
          {renderPointText(careerText.cta.copy)}
        </p>
        <div className="career-openings" data-reveal style={revealDelay(2)}>
          {careerText.cta.openings.map(([team, role]) => (
            <div key={team}>
              <strong>{team}</strong>
              <span>{role}</span>
            </div>
          ))}
        </div>
        <div className="career-cta-actions" data-reveal style={revealDelay(3)}>
          <a href="../assets/career/NOVA50_지원서.docx" download>
            지원양식 다운로드
          </a>
          <button type="button" onClick={copyEmail}>
            <strong>메일 주소 복사하기</strong>
            <span>hello@nova-50.com</span>
          </button>
        </div>
        <ul className="career-cta-notes" data-reveal style={revealDelay(4)}>
          <li>지원서 양식을 다운로드 후, 작성하여 hello@nova-50.com으로 접수합니다.</li>
          <li>
            플래너(경력) 및 디자이너(신입/경력) 지원 시 경력 기술서 또는 포트폴리오(자유양식)을 첨부해야 합니다.
          </li>
        </ul>
      </section>

      <Footer />
    </main>
  )
}

export default CareerPage
