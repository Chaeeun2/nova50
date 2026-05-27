import { useEffect, useLayoutEffect, useRef } from 'react'

const observerOptions = {
  rootMargin: '0px 0px -12% 0px',
  threshold: 0.15,
}

const scrollSectionSelector =
  '[data-reveal-section]:not([data-reveal-section-immediate]), [data-reveal-sequence]:not([data-reveal-sequence-immediate])'

const immediateSectionSelector =
  '[data-reveal-section-immediate], [data-reveal-sequence-immediate]'

function markSectionRevealed(section, revealedSections) {
  revealedSections.add(section)
  section.classList.add('is-revealed')
}

function restoreRevealedSections(revealedSections) {
  revealedSections.forEach((section) => {
    if (document.contains(section)) {
      section.classList.add('is-revealed')
      return
    }

    revealedSections.delete(section)
  })
}

function setupScrollReveals(revealedSections) {
  const sections = document.querySelectorAll(scrollSectionSelector)

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return
      }

      markSectionRevealed(entry.target, revealedSections)
      sectionObserver.unobserve(entry.target)
    })
  }, observerOptions)

  sections.forEach((section) => {
    if (revealedSections.has(section) || section.classList.contains('is-revealed')) {
      markSectionRevealed(section, revealedSections)
      return
    }

    sectionObserver.observe(section)
  })

  return () => {
    sectionObserver.disconnect()
  }
}

export function useRevealAnimations({ refreshDeps = [] } = {}) {
  const revealedSectionsRef = useRef(new Set())

  useEffect(() => {
    const runImmediateReveal = () => {
      document.querySelectorAll(immediateSectionSelector).forEach((section) => {
        markSectionRevealed(section, revealedSectionsRef.current)
      })
    }

    runImmediateReveal()
    requestAnimationFrame(runImmediateReveal)
  }, [])

  useEffect(() => setupScrollReveals(revealedSectionsRef.current), refreshDeps)

  useLayoutEffect(() => {
    restoreRevealedSections(revealedSectionsRef.current)
  })
}
