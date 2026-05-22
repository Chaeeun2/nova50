import { useEffect, useState } from 'react'
import logoBlack from '../assets/logo_black.png'
import logoWhite from '../assets/logo_white.png'
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

  const isDarkVariant = variant === 'dark'
  const isLightHeader =
    (variant === 'light' || isHeaderScrolled) && !isDarkHeaderActive && !isDarkVariant && !forceDark
  const headerClassName = [
    'site-header',
    isLightHeader ? 'is-scrolled' : '',
    isDarkHeaderActive || isDarkVariant || forceDark ? 'is-section04-active' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const logoSrc = isLightHeader ? logoBlack : logoWhite

  return (
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
  )
}

export default Header
