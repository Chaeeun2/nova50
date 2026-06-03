/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'

const MobileContext = createContext(null)

export function MobileProvider({ children }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent,
      )
      const isSmallScreen = window.innerWidth <= 768

      setIsMobile(isMobileDevice || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return <MobileContext.Provider value={{ isMobile }}>{children}</MobileContext.Provider>
}

export function useMobile() {
  const context = useContext(MobileContext)

  if (!context) {
    throw new Error('useMobile must be used within MobileProvider')
  }

  return context
}
