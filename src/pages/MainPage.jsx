import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import aboutCardBg from '../assets/Main_about_BG.png'
import aboutCardBgMo from '../assets/about_BG_mo.jpg'
import worksCardBg from '../assets/Main_works_BG.png'
import worksCardBgMo from '../assets/works_BG_mo.jpg'
import hero01 from '../assets/hero_01.jpg'
import hero02 from '../assets/hero_02.jpg'
import hero03 from '../assets/hero_03.jpg'
import heroMo01 from '../assets/main_mo_01.jpg'
import heroMo02 from '../assets/main_mo_02.jpg'
import heroMo03 from '../assets/main_mo_03.jpg'
import { useRevealAnimations } from '../hooks/useRevealAnimations'
import { revealDelay } from '../utils/reveal'
import './MainPage.css'

const heroSlides = [hero01, hero02, hero03]
const heroSlidesMo = [heroMo01, heroMo02, heroMo03]
const heroSlideDuration = 5000
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
const partnerLogoRowSplit = Math.ceil(partnerLogos.length / 2)
const partnerLogoRows = [
  partnerLogos.slice(0, partnerLogoRowSplit),
  partnerLogos.slice(partnerLogoRowSplit),
]

function renderPartnerTrack(logos, trackKey) {
  return (
    <div className="partner-track" key={trackKey}>
      {[...logos, ...logos].map((partner, index) => (
        <div
          className="partner-logo"
          key={`${trackKey}-${partner.name}-${index}`}
          aria-hidden={index >= logos.length}
        >
          <img src={partner.src} alt={index < logos.length ? partner.name : ''} />
        </div>
      ))}
    </div>
  )
}

const mainPageText = {
  section01: {
    title: {
      pc: `Unique experience
designers`,
      mo: `unique
experience
designers`,
    },
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

const cardImages = [
  { pc: worksCardBg, mo: worksCardBgMo },
  { pc: aboutCardBg, mo: aboutCardBgMo },
]
const splitLines = (text) => text.split('\n')

function renderHeroTitleLines(lines, keyPrefix) {
  return lines.map((line, index) => (
    <span
      className="title-line"
      data-reveal-item
      key={`${keyPrefix}-${index}`}
      style={revealDelay(index + 1)}
    >
      {line}
    </span>
  ))
}

function MainPage() {
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const [isHeroTransitionEnabled, setIsHeroTransitionEnabled] = useState(true)
  const [isPageBottomActive, setIsPageBottomActive] = useState(false)
  const renderedHeroSlides =
    heroSlides.length > 1 ? [...heroSlides, heroSlides[0]] : heroSlides
  const heroProgress = ((activeHeroSlide % heroSlides.length) + 1) / heroSlides.length
  const heroTitleLinesPc = splitLines(mainPageText.section01.title.pc)
  const heroTitleLinesMo = splitLines(mainPageText.section01.title.mo)
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

  useRevealAnimations()

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
      <Header currentPage="home" forceDark={isPageBottomActive} />

      <section className="hero-section" aria-label="NOVA50 main visual">
        <div className="hero-frame">
          <div
            className={`hero-slider ${isHeroTransitionEnabled ? '' : 'is-resetting'}`}
            aria-hidden="true"
            onTransitionEnd={handleHeroSlideEnd}
            style={{ transform: `translateX(-${activeHeroSlide * 100}%)` }}
          >
            {renderedHeroSlides.map((slide, index) => {
              const slideIndex = index % heroSlides.length
              return (
                <span
                  className="hero-slide"
                  key={`${slide}-${index}`}
                  style={{
                    '--hero-bg-pc': `url(${slide})`,
                    '--hero-bg-mo': `url(${heroSlidesMo[slideIndex]})`,
                  }}
                />
              )
            })}
          </div>

          <div className="hero-copy" data-reveal-section data-reveal-section-immediate>
            <span
              className="progress-bar"
              aria-hidden="true"
              data-reveal-item
              style={{ '--progress-ratio': heroProgress, ...revealDelay(0) }}
            />
            <h1 className="hero-title hero-title-pc">
              {renderHeroTitleLines(heroTitleLinesPc, 'hero-pc')}
            </h1>
            <h1 className="hero-title hero-title-mo">
              {renderHeroTitleLines(heroTitleLinesMo, 'hero-mo')}
            </h1>
          </div>
        </div>
      </section>

      <section
        className={`about-section ${isPageBottomActive ? 'is-page-bottom-active' : ''}`}
        id="about"
        data-reveal-section
      >
        <p className="eyebrow" data-reveal-item style={revealDelay(0)}>
          {mainPageText.section02.eyebrow}
        </p>
        <h2>
          {section02TitleLines.map((line, index) => (
            <span
              className="title-line"
              data-reveal-item
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
            data-reveal-item
            style={revealDelay(section02TitleLines.length + 1)}
          />
          <h3 data-reveal-item style={revealDelay(section02TitleLines.length + 2)}>
            {mainPageText.section02.content.title}
          </h3>
          <p
            className="about-copy about-copy-pc"
            data-reveal-item
            style={revealDelay(section02TitleLines.length + 3)}
          >
            {mainPageText.section02.content.body.pc}
          </p>
          <p
            className="about-copy about-copy-mo"
            data-reveal-item
            style={revealDelay(section02TitleLines.length + 4)}
          >
            {mainPageText.section02.content.body.mo}
          </p>
        </div>
      </section>

      <section
        className={`card-section ${isPageBottomActive ? 'is-page-bottom-active' : ''}`}
        id="works"
        aria-label="Featured links"
        data-reveal-section
      >
        {mainPageText.section03.cards.map((card, index) => (
          <a
            className={`feature-card ${index === 0 ? 'feature-card-wide' : ''}`}
            data-reveal-item
            href={card.title === 'about' ? '/about' : '/works'}
            key={card.title}
            style={revealDelay(index)}
          >
            <picture>
              <source media="(max-width: 720px)" srcSet={cardImages[index].mo} />
              <img src={cardImages[index].pc} alt="" aria-hidden="true" />
            </picture>
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

      <section className="partners-section" id="contact" data-reveal-section>
        <div className="partners-title">
          <p data-reveal-item style={revealDelay(0)}>{mainPageText.section04.caption}</p>
          <h2 data-reveal-item style={revealDelay(1)}>
            <span>{mainPageText.section04.title.highlight}</span>
            {mainPageText.section04.title.text}
          </h2>
        </div>

        <div
          className="partner-carousel-wrap"
          aria-label="Partner logos"
          data-reveal-item
          style={revealDelay(2)}
        >
          <div className="partner-carousel partner-carousel--single">
            {renderPartnerTrack(partnerLogos, 'pc')}
          </div>
          <div className="partner-carousel partner-carousel--dual">
            {partnerLogoRows.map((rowLogos, rowIndex) =>
              renderPartnerTrack(rowLogos, `partner-track-mo-${rowIndex}`),
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default MainPage
