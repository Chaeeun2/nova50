import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import hero01 from '../assets/hero_01.jpg'
import hero02 from '../assets/hero_02.jpg'
import hero03 from '../assets/hero_03.jpg'
import heroMo01 from '../assets/main_mo_01.jpg'
import heroMo02 from '../assets/main_mo_02.jpg'
import heroMo03 from '../assets/main_mo_03.jpg'
import {
  defaultMainPageContent,
  getResponsiveText,
  normalizeMainPageContent,
  resolveMainCardImage,
} from '../data/mainPageContent'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useRevealAnimations } from '../hooks/useRevealAnimations'
import { getMainPageContent, getMainPageImages, getPartnerLogos } from '../services/mainPageService'
import { revealDelay } from '../utils/reveal'
import './MainPage.css'

const fallbackHeroSlides = [hero01, hero02, hero03]
const fallbackHeroSlidesMo = [heroMo01, heroMo02, heroMo03]
const heroSlideDuration = 5000
/** 17개 로고·60초 루프 기준으로 맞춘 스크롤 속도(px/s) */
const PARTNER_CAROUSEL_SPEED_PX_PER_SEC = 33
const PARTNER_CAROUSEL_MIN_DURATION_SEC = 20
const logoModules = import.meta.glob('../assets/logo/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
})
const fallbackPartnerLogos = Object.entries(logoModules)
  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB, undefined, { numeric: true }))
  .map(([path, src]) => ({
    name: path.split('/').pop().replace(/\.[^.]+$/, ''),
    src,
  }))

function renderPartnerTrack(logos, trackKey) {
  return (
    <div className="partner-track" key={trackKey}>
      {[...logos, ...logos].map((partner, index) => (
        <div
          className="partner-logo"
          key={`${trackKey}-${partner.name}-${index}`}
          aria-hidden={index >= logos.length}
        >
          <img src={partner.src || partner.imageUrl} alt={index < logos.length ? partner.name : ''} />
        </div>
      ))}
    </div>
  )
}

const splitLines = (text) => text.split('\n')

function getCardImageSources(card, index) {
  const image = resolveMainCardImage(card, index)

  return {
    pc: image.pc,
    mo: image.mo,
  }
}

const renderEmphasisText = (text, keyPrefix = 'emphasis') =>
  String(text)
    .split(/(\*[^*]+\*)/g)
    .map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={`${keyPrefix}-${part}-${index}`}>{part.slice(1, -1)}</strong>
    }

    return part
  })

const renderRichText = (text, keyPrefix) =>
  String(text)
    .split('\n')
    .flatMap((line, lineIndex) => [
      ...(lineIndex > 0 ? [<br key={`${keyPrefix}-br-${lineIndex}`} />] : []),
      ...renderEmphasisText(line, `${keyPrefix}-${lineIndex}`),
    ])

function renderHeroTitleLines(lines, keyPrefix) {
  return lines.map((line, index) => (
    <span
      className="title-line"
      data-reveal-item
      key={`${keyPrefix}-${index}`}
      style={revealDelay(index + 1)}
    >
      {renderRichText(line, `${keyPrefix}-${index}`)}
    </span>
  ))
}

function MainPage() {
  const [mainPageText, setMainPageText] = useState(defaultMainPageContent)
  const [mainImages, setMainImages] = useState({ horizontal: [], vertical: [] })
  const [dbPartnerLogos, setDbPartnerLogos] = useState([])
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const [isHeroTransitionEnabled, setIsHeroTransitionEnabled] = useState(true)
  const [isPageBottomActive, setIsPageBottomActive] = useState(false)
  const isMobile = useMediaQuery('(max-width: 720px)')
  const currentDevice = isMobile ? 'mo' : 'pc'
  const heroSlides = mainImages.horizontal.length
    ? mainImages.horizontal.map((image) => image.imageUrl)
    : fallbackHeroSlides
  const heroSlidesMo = mainImages.vertical.length
    ? mainImages.vertical.map((image) => image.imageUrl)
    : fallbackHeroSlidesMo
  const renderedHeroSlides =
    heroSlides.length > 1 ? [...heroSlides, heroSlides[0]] : heroSlides
  const heroProgress = ((activeHeroSlide % heroSlides.length) + 1) / heroSlides.length
  const heroTitleLinesPc = splitLines(mainPageText.section01.title.pc)
  const heroTitleLinesMo = splitLines(mainPageText.section01.title.mo)
  const section02TitleLines = splitLines(getResponsiveText(mainPageText.section02.title, currentDevice))
  const partnerLogos = dbPartnerLogos.length ? dbPartnerLogos : fallbackPartnerLogos
  const partnerLogoRowSplit = Math.ceil(partnerLogos.length / 2)
  const partnerLogoRows = [
    partnerLogos.slice(0, partnerLogoRowSplit),
    partnerLogos.slice(partnerLogoRowSplit),
  ]
  const partnerCarouselRef = useRef(null)

  useLayoutEffect(() => {
    const carouselWrap = partnerCarouselRef.current

    if (!carouselWrap || partnerLogos.length === 0) {
      return undefined
    }

    let frameId = 0

    const updatePartnerCarouselDurations = () => {
      cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        carouselWrap.querySelectorAll('.partner-track').forEach((track) => {
          const loopWidth = track.scrollWidth / 2

          if (!loopWidth) {
            return
          }

          const loopOffset =
            Number.parseFloat(
              getComputedStyle(track).getPropertyValue('--partner-loop-offset'),
            ) || 0
          const distance = loopWidth + loopOffset
          const duration = Math.max(
            PARTNER_CAROUSEL_MIN_DURATION_SEC,
            distance / PARTNER_CAROUSEL_SPEED_PX_PER_SEC,
          )

          track.style.setProperty('--partner-carousel-duration', `${duration.toFixed(2)}s`)
        })
      })
    }

    updatePartnerCarouselDurations()

    const resizeObserver = new ResizeObserver(updatePartnerCarouselDurations)
    carouselWrap.querySelectorAll('.partner-track').forEach((track) => {
      resizeObserver.observe(track)
    })
    carouselWrap.querySelectorAll('.partner-track img').forEach((image) => {
      if (!image.complete) {
        image.addEventListener('load', updatePartnerCarouselDurations, { once: true })
      }
    })

    window.addEventListener('resize', updatePartnerCarouselDurations)

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', updatePartnerCarouselDurations)
    }
  }, [partnerLogos, isMobile])

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return undefined
    }

    const slideTimer = window.setInterval(() => {
      if (document.hidden) {
        return
      }

      setActiveHeroSlide((currentSlide) =>
        currentSlide >= heroSlides.length ? 1 : currentSlide + 1,
      )
    }, heroSlideDuration)

    return () => window.clearInterval(slideTimer)
  }, [heroSlides.length])

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return undefined
    }

    const resetHeroPosition = () => {
      if (document.hidden) {
        return
      }

      setIsHeroTransitionEnabled(false)
      setActiveHeroSlide((currentSlide) => currentSlide % heroSlides.length)

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setIsHeroTransitionEnabled(true)
        })
      })
    }

    document.addEventListener('visibilitychange', resetHeroPosition)

    return () => {
      document.removeEventListener('visibilitychange', resetHeroPosition)
    }
  }, [heroSlides.length])

  useEffect(() => {
    let isMounted = true

    async function loadMainPageData() {
      try {
        const [content, images, logos] = await Promise.all([
          getMainPageContent(),
          getMainPageImages(),
          getPartnerLogos(),
        ])

        if (!isMounted) {
          return
        }

        if (content) {
          setMainPageText(normalizeMainPageContent(content))
        }

        setMainImages(images)
        setDbPartnerLogos(logos)
      } catch (error) {
        console.warn('메인 페이지 데이터 로딩 실패:', error)
      }
    }

    loadMainPageData()

    return () => {
      isMounted = false
    }
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
    if (event.propertyName !== 'transform' || activeHeroSlide < heroSlides.length) {
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
          {getResponsiveText(mainPageText.section02.eyebrow, currentDevice)}
        </p>
        <h2>
          {section02TitleLines.map((line, index) => (
            <span
              className="title-line"
              data-reveal-item
              key={line}
              style={revealDelay(index + 1)}
            >
              {renderRichText(line, `section02-title-${index}`)}
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
            {renderRichText(
              getResponsiveText(mainPageText.section02.content.title, currentDevice),
              'section02-content-title',
            )}
          </h3>
          <p
            className="about-copy about-copy-pc"
            data-reveal-item
            style={revealDelay(section02TitleLines.length + 3)}
          >
            {renderRichText(getResponsiveText(mainPageText.section02.content.body, 'pc'), 'section02-body-pc')}
          </p>
          <p
            className="about-copy about-copy-mo"
            data-reveal-item
            style={revealDelay(section02TitleLines.length + 4)}
          >
            {renderRichText(getResponsiveText(mainPageText.section02.content.body, 'mo'), 'section02-body-mo')}
          </p>
        </div>
      </section>

      <section
        className={`card-section ${isPageBottomActive ? 'is-page-bottom-active' : ''}`}
        id="works"
        aria-label="Featured links"
        data-reveal-section
      >
        {mainPageText.section03.cards.map((card, index) => {
          const cardImages = getCardImageSources(card, index)

          return (
          <a
            className={`feature-card ${index === 0 ? 'feature-card-wide' : ''}`}
            data-reveal-item
            href={card.path || (getResponsiveText(card.title, 'pc') === 'about' ? '/about' : '/works')}
            key={getResponsiveText(card.title, 'pc')}
            style={revealDelay(index)}
          >
            <picture>
              <source media="(max-width: 720px)" srcSet={cardImages.mo} />
              <img src={cardImages.pc} alt="" aria-hidden="true" />
            </picture>
            <span className="card-content">
              <strong>{renderRichText(getResponsiveText(card.title, currentDevice), `card-title-${index}`)}</strong>
              <span>{renderRichText(getResponsiveText(card.description, currentDevice), `card-description-${index}`)}</span>
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
          )
        })}
      </section>

      <section className="partners-section" id="contact" data-reveal-section>
        <div className="partners-title">
          <p data-reveal-item style={revealDelay(0)}>
            {renderRichText(getResponsiveText(mainPageText.section04.caption, currentDevice), 'section04-caption')}
          </p>
          <h2 data-reveal-item style={revealDelay(1)}>
            {renderRichText(getResponsiveText(mainPageText.section04.title.text, currentDevice), 'section04-title')}
          </h2>
        </div>

        <div
          ref={partnerCarouselRef}
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
