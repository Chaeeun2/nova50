import { useEffect } from 'react'

const observerOptions = {
  rootMargin: '0px 0px -12% 0px',
  threshold: 0.15,
}

const scrollSectionSelector =
  '[data-reveal-section]:not([data-reveal-section-immediate]), [data-reveal-sequence]:not([data-reveal-sequence-immediate])'

const immediateSectionSelector =
  '[data-reveal-section-immediate], [data-reveal-sequence-immediate]'

function setupScrollReveals() {
  const sections = document.querySelectorAll(scrollSectionSelector)

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return
      }

      entry.target.classList.add('is-revealed')
      sectionObserver.unobserve(entry.target)
    })
  }, observerOptions)

  sections.forEach((section) => {
    if (!section.classList.contains('is-revealed')) {
      sectionObserver.observe(section)
    }
  })

  return () => {
    sectionObserver.disconnect()
  }
}

export function useRevealAnimations({ refreshDeps = [] } = {}) {
  useEffect(() => {
    const runImmediateReveal = () => {
      document.querySelectorAll(immediateSectionSelector).forEach((section) => {
        section.classList.add('is-revealed')
      })
    }

    runImmediateReveal()
    requestAnimationFrame(runImmediateReveal)
  }, [])

  useEffect(() => setupScrollReveals(), refreshDeps)
}
