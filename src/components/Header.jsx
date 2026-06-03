import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
const logoBlack = '/logo_black.png'
const logoWhite = '/logo_white.png'
import './Header.css'

const navItems = [
  { id: 'about', href: '/about', label: 'about' },
  { id: 'works', href: '/works', label: 'works' },
  { id: 'career', href: '/career', label: 'career' },
  { id: 'contact', href: '/contact', label: 'contact' },
]

function Header({ currentPage = 'home', forceDark = false, variant = 'transparent' }) {
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false)
  const [isDarkHeaderActive, setIsDarkHeaderActive] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false)

  const isMobileMenuVisible = isMobileMenuOpen || isMobileMenuClosing

  const finishMobileMenuClose = () => {
    setIsMobileMenuClosing(false)
    setIsMobileMenuOpen(false)
  }

  const closeMobileMenu = () => {
    if (!isMobileMenuOpen || isMobileMenuClosing) {
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishMobileMenuClose()
      return
    }

    setIsMobileMenuClosing(true)
  }

  const openMobileMenu = () => {
    setIsMobileMenuClosing(false)
    setIsMobileMenuOpen(true)
  }

  const handleMobileMenuPanelTransitionEnd = (event) => {
    if (event.propertyName !== 'transform' || !isMobileMenuClosing) {
      return
    }

    finishMobileMenuClose()
  }

  useEffect(() => {
    const updateHeaderState = () => {
      setIsHeaderScrolled(window.scrollY > 40)

      const section04 = document.getElementById('contact')
      const coreSection = document.querySelector('.about-core-section')
      const servicesSection = document.querySelector('.about-services-section')
      const isMainDarkSectionActive = Boolean(
        section04 && section04.getBoundingClientRect().top < 80,
      )
      const isAboutDarkSectionActive = Boolean(
        coreSection &&
          servicesSection &&
          coreSection.getBoundingClientRect().top <= 80 &&
          servicesSection.getBoundingClientRect().bottom > 80,
      )

      setIsDarkHeaderActive(isMainDarkSectionActive || isAboutDarkSectionActive)
    }

    updateHeaderState()
    window.addEventListener('scroll', updateHeaderState, { passive: true })
    window.addEventListener('resize', updateHeaderState)

    return () => {
      window.removeEventListener('scroll', updateHeaderState)
      window.removeEventListener('resize', updateHeaderState)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('is-mobile-menu-open', isMobileMenuVisible)
    document.body.classList.toggle('is-mobile-menu-open', isMobileMenuVisible)

    return () => {
      document.documentElement.classList.remove('is-mobile-menu-open')
      document.body.classList.remove('is-mobile-menu-open')
    }
  }, [isMobileMenuVisible])

  useEffect(() => {
    if (!isMobileMenuClosing) {
      return undefined
    }

    const closeTimeout = window.setTimeout(finishMobileMenuClose, 450)

    return () => window.clearTimeout(closeTimeout)
  }, [isMobileMenuClosing])

  useEffect(() => {
    const closeMenuOnResize = () => {
      if (window.innerWidth > 720) {
        finishMobileMenuClose()
      }
    }

    window.addEventListener('resize', closeMenuOnResize)

    return () => window.removeEventListener('resize', closeMenuOnResize)
  }, [])

  useEffect(() => {
    if (!isMobileMenuVisible) {
      return undefined
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeMobileMenu()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => window.removeEventListener('keydown', handleEscape)
  }, [isMobileMenuVisible])

  const isDarkVariant = variant === 'dark'
  const isDarkTone = isDarkHeaderActive || isDarkVariant || forceDark
  const isOnLightSurface =
    !isDarkTone && (variant === 'light' || isHeaderScrolled)
  const hasSolidHeaderBackground = isHeaderScrolled && !isDarkTone

  const headerClassName = [
    'site-header',
    isOnLightSurface ? 'is-on-light-surface' : '',
    hasSolidHeaderBackground ? 'is-scrolled' : '',
    isDarkTone ? 'is-section04-active' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const logoSrc = isOnLightSurface ? logoBlack : logoWhite

  const isMobileMenuInteractive = isMobileMenuOpen && !isMobileMenuClosing

  const mobileNavPortal = (
    <div className="mobile-nav-layer" aria-hidden={false}>
      <button
        type="button"
        className={`mobile-menu-open-btn ${isOnLightSurface ? 'is-on-light-surface' : ''}`}
        aria-expanded={isMobileMenuInteractive}
        aria-controls="mobile-main-nav"
        aria-label="메뉴 열기"
        onClick={openMobileMenu}
      >
        <span className="mobile-menu-open-icon" aria-hidden="true">
          <span className="mobile-menu-open-line" />
          <span className="mobile-menu-open-line" />
          <span className="mobile-menu-open-line" />
        </span>
      </button>

      <div
        className={[
          'mobile-menu-overlay',
          isMobileMenuOpen && !isMobileMenuClosing ? 'is-open' : '',
          isMobileMenuClosing ? 'is-closing' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden={!isMobileMenuVisible}
      >
        <button
          type="button"
          className="mobile-menu-tint"
          aria-label="메뉴 닫기"
          tabIndex={isMobileMenuInteractive ? 0 : -1}
          onClick={closeMobileMenu}
        />
        <div
          className="mobile-menu-panel"
          onTransitionEnd={handleMobileMenuPanelTransitionEnd}
        >
          <button
            type="button"
            className="mobile-menu-close-btn"
            aria-label="메뉴 닫기"
            tabIndex={isMobileMenuInteractive ? 0 : -1}
            onClick={closeMobileMenu}
          >
            <span className="mobile-menu-close-line" aria-hidden="true" />
            <span className="mobile-menu-close-line" aria-hidden="true" />
          </button>
          <nav
            className="mobile-menu-list"
            id="mobile-main-nav"
            aria-label="Mobile navigation"
          >
            {navItems.map((item) => (
              <a
                className={currentPage === item.id ? 'is-active' : undefined}
                href={item.href}
                key={item.id}
                tabIndex={isMobileMenuInteractive ? 0 : -1}
                onClick={closeMobileMenu}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <header className={headerClassName}>
        <div className="site-header-content">
          <a className="logo" href="/" aria-label="NOVA50 home">
            <img src={logoSrc} alt="NOVA50" />
          </a>
          <nav className="main-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <a
                className={currentPage === item.id ? 'is-active' : undefined}
                href={item.href}
                key={item.id}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {createPortal(mobileNavPortal, document.body)}
    </>
  )
}

export default Header
