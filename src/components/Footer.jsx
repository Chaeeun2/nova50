import logoBlack from '../assets/logo_black.png'
import logoWhite from '../assets/logo_white.png'
import './Footer.css'

function Footer({ variant = 'dark' }) {
  const isLight = variant === 'light'
  const footerClassName = `site-footer ${isLight ? 'is-light' : 'is-dark'}`
  const logoSrc = isLight ? logoBlack : logoWhite

  return (
    <footer className={footerClassName}>
      <img src={logoSrc} alt="NOVA50" />
      <div className="footer-info">
        <p>
          Nova 50 Co., Ltd ㅣ 02-6949-0550 ㅣ 805, 8F, Private Tower 1, 165,
          Magokjungang-ro, Gangseo-gu, Seoul, 07788
        </p>
        <p>© 2026 NOVA50</p>
      </div>
    </footer>
  )
}

export default Footer
