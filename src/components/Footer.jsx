import { useEffect, useState } from 'react'
import { getPageContent } from '../services/mainPageService'
import { buildFooterContactText } from '../utils/footerContact'
import './Footer.css'

const logoBlack = '/logo_black.png'
const logoWhite = '/logo_white.png'

function Footer({ variant = 'dark' }) {
  const [footerContact, setFooterContact] = useState(() => buildFooterContactText())
  const isLight = variant === 'light'
  const footerClassName = `site-footer ${isLight ? 'is-light' : 'is-dark'}`
  const logoSrc = isLight ? logoBlack : logoWhite

  useEffect(() => {
    let isMounted = true

    async function loadFooterContact() {
      try {
        const data = await getPageContent('contact')

        if (!isMounted) {
          return
        }

        setFooterContact(
          buildFooterContactText({
            phone: data?.content?.phone,
            addressEn: data?.content?.address?.en,
          }),
        )
      } catch (error) {
        console.warn('Footer contact 로딩 실패:', error)
      }
    }

    loadFooterContact()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <footer className={footerClassName}>
      <img src={logoSrc} alt="NOVA50" />
      <div className="footer-info">
        <p className="footer-contact footer-contact-pc">{footerContact.pc}</p>
        <p className="footer-contact footer-contact-mo">{footerContact.mo}</p>
      </div>
    </footer>
  )
}

export default Footer
