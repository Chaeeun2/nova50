import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import aboutCardBg from '../assets/Main_about_BG.png'
import worksCardBg from '../assets/Main_works_BG.png'
import hero01 from '../assets/hero_01.jpg'
import hero02 from '../assets/hero_02.jpg'
import hero03 from '../assets/hero_03.jpg'
import './MainPage.css'

const heroSlides = [hero01, hero02, hero03]
const heroSlideDuration = 3000
const revealStagger = 120
const logoModules = import.meta.glob('../assets/logo/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
})
const partnerLogos = Object.entries(logoModules)
  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB, undefined, { numeric: true }))
  .map(([path, src]) => ({
    name: path.split('/').pop().replace(/\.[^.]+$/, ''),
    src,
  }))

const mainPageText = {
  section01: {
    title: `Unique experience
designers`,
  },
  section02: {
    eyebrow: 'NOVA50 — Unique Experience Designers',
    title: `We design
the moment
things
feel different.`,
    content: {
      title: `변화가 느껴지는 순간,
그 시작에 NOVA50가 있습니다.`,
      body: {
        pc: `새로운 경험은 기억에 남고, 특별한 경험은 사람을 변화시킵니다.
우리는 넓은 시야와 깊은 통찰로 문제의 본질을 이해하고,
단순한 솔루션을 넘어 사람들의 마음을 움직이는 경험을 만듭니다.

예상을 뛰어넘는 순간, 오래도록 기억에 남는 경험.
그 경험이 노바피프티가 존재하는 이유입니다.`,
        mo: `새로운 경험은 기억에 남고,
특별한 경험은 사람을 변화시킵니다.
우리는 넓은 시야와 깊은 통찰로
문제의 본질을 이해하고,
단순한 솔루션을 넘어 사람들의 마음을
움직이는 경험을 만듭니다.

예상을 뛰어넘는 순간,
오래도록 기억에 남는 경험.
그 경험이 노바피프티가 존재하는 이유입니다.`,
      },
    },
  },
  section03: {
    cards: [
      {
        title: 'works',
        description: 'Beyond solutions, create a mind-moving experience.',
      },
      {
        title: 'about',
        description: 'Change begins in NOVA50.',
      },
    ],
  },
  section04: {
    caption: 'NOVA50 is where change begins.',
    title: {
      highlight: '변화',
      text: `가 시작되는 지점을
함께 만들어갑니다.`,
    },
  },
}

const cardImages = [worksCardBg, aboutCardBg]
const revealDelay = (order = 0) => ({
  '--reveal-delay': `${order * revealStagger}ms`,
})
const splitLines = (text) => text.split('\n')

function MainPage() {
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const [isHeroTransitionEnabled, setIsHeroTransitionEnabled] = useState(true)
  const [isPageBottomActive, setIsPageBottomActive] = useState(false)
  const renderedHeroSlides =
    heroSlides.length > 1 ? [...heroSlides, heroSlides[0]] : heroSlides
  const heroProgress = ((activeHeroSlide % heroSlides.length) + 1) / heroSlides.length
  const heroTitleLines = splitLines(mainPageText.section01.title)
  const section02TitleLines = splitLines(mainPageText.section02.title)

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return undefined
    }

    const slideTimer = window.setInterval(() => {
      setActiveHeroSlide((currentSlide) => currentSlide + 1)
    }, heroSlideDuration)

    return () => window.clearInterval(slideTimer)
  }, [])

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
    const updatePageBottomState = () => {
      const scrollBottom = window.scrollY + window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      setIsPageBottomActive(documentHeight - scrollBottom <= 4)
    }

    updatePageBottomState()
    window.addEventListener('scroll', updatePageBottomState, { passive: true })
    window.addEventListener('resize', updatePageBottomState)

    return () => {
      window.removeEventListener('scroll', updatePageBottomState)
      window.removeEventListener('resize', updatePageBottomState)
    }
  }, [])

  const handleHeroSlideEnd = (event) => {
    if (event.propertyName !== 'transform' || activeHeroSlide !== heroSlides.length) {
      return
    }

    setIsHeroTransitionEnabled(false)
    setActiveHeroSlide(0)

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setIsHeroTransitionEnabled(true)
      })
    })
  }

  return (
    <main className="site">
      <Header forceDark={isPageBottomActive} />

      <section className="hero-section" aria-label="NOVA50 main visual">
        <div
          className={`hero-slider ${isHeroTransitionEnabled ? '' : 'is-resetting'}`}
          aria-hidden="true"
          onTransitionEnd={handleHeroSlideEnd}
          style={{ transform: `translateX(-${activeHeroSlide * 100}%)` }}
        >
          {renderedHeroSlides.map((slide, index) => (
            <span
              className="hero-slide"
              key={`${slide}-${index}`}
              style={{ backgroundImage: `url(${slide})` }}
            />
          ))}
        </div>

        <div className="hero-copy">
          <span
            className="progress-bar"
            aria-hidden="true"
            data-reveal
            style={{ '--progress-ratio': heroProgress }}
          />
          <h1>
            {heroTitleLines.map((line, index) => (
              <span
                className="title-line"
                data-reveal
                key={line}
                style={revealDelay(index + 1)}
              >
                {line}
              </span>
            ))}
          </h1>
        </div>
      </section>

      <section
        className={`about-section ${isPageBottomActive ? 'is-page-bottom-active' : ''}`}
        id="about"
      >
        <p className="eyebrow" data-reveal>
          {mainPageText.section02.eyebrow}
        </p>
        <h2>
          {section02TitleLines.map((line, index) => (
            <span
              className="title-line"
              data-reveal
              key={line}
              style={revealDelay(index + 1)}
            >
              {line}
            </span>
          ))}
        </h2>

        <div className="about-body">
          <span
            className="section-rule"
            aria-hidden="true"
            data-reveal
            style={revealDelay(section02TitleLines.length + 1)}
          />
          <h3 data-reveal style={revealDelay(section02TitleLines.length + 2)}>
            {mainPageText.section02.content.title}
          </h3>
          <p
            className="about-copy about-copy-pc"
            data-reveal
            style={revealDelay(section02TitleLines.length + 3)}
          >
            {mainPageText.section02.content.body.pc}
          </p>
          <p
            className="about-copy about-copy-mo"
            data-reveal
            style={revealDelay(section02TitleLines.length + 3)}
          >
            {mainPageText.section02.content.body.mo}
          </p>
        </div>
      </section>

      <section
        className={`card-section ${isPageBottomActive ? 'is-page-bottom-active' : ''}`}
        id="works"
        aria-label="Featured links"
      >
        {mainPageText.section03.cards.map((card, index) => (
          <a
            className={`feature-card ${index === 0 ? 'feature-card-wide' : ''}`}
            data-reveal
            href={card.title === 'about' ? '/about' : '/works'}
            key={card.title}
            style={revealDelay(index)}
          >
            <img src={cardImages[index]} alt="" aria-hidden="true" />
            <span className="card-content">
              <strong>{card.title}</strong>
              <span>{card.description}</span>
            </span>
            <span className="card-arrow" aria-hidden="true">
              <svg
                className="card-arrow-icon"
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M30 14.9922L15.0078 29.9843L12.1616 27.1381L24.3076 14.9922L12.1616 2.84619L15.0078 0L30 14.9922Z"
                  fill="currentColor"
                />
                <path
                  d="M9.91821e-05 17.1018L9.9534e-05 13.0767L27.1697 13.0767L27.1697 17.1018L9.91821e-05 17.1018Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </a>
        ))}
      </section>

      <section className="partners-section" id="contact">
        <div className="partners-title">
          <p data-reveal>{mainPageText.section04.caption}</p>
          <h2 data-reveal style={revealDelay(1)}>
            <span>{mainPageText.section04.title.highlight}</span>
            {mainPageText.section04.title.text}
          </h2>
        </div>

        <div
          className="partner-carousel"
          aria-label="Partner logos"
          data-reveal
          style={revealDelay(2)}
        >
          <div className="partner-track">
            {[...partnerLogos, ...partnerLogos].map((partner, index) => (
              <div
                className="partner-logo"
                key={`${partner.name}-${index}`}
                aria-hidden={index >= partnerLogos.length}
              >
                <img src={partner.src} alt={index < partnerLogos.length ? partner.name : ''} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default MainPage
