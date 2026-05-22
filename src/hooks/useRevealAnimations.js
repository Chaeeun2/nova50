import { useEffect } from 'react'

const observerOptions = {
  rootMargin: '0px 0px -12% 0px',
  threshold: 0.05,
}

function setupScrollReveals() {
  const scrollSequences = document.querySelectorAll(
    '[data-reveal-sequence]:not([data-reveal-sequence-immediate])',
  )

  const sequenceObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return
      }

      entry.target.classList.add('is-revealed')
      sequenceObserver.unobserve(entry.target)
    })
  }, observerOptions)

  scrollSequences.forEach((element) => {
    if (!element.classList.contains('is-revealed')) {
      sequenceObserver.observe(element)
    }
  })

  const revealTargets = document.querySelectorAll('[data-reveal]')

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return
      }

      entry.target.classList.add('is-revealed')
      revealObserver.unobserve(entry.target)
    })
  }, observerOptions)

  revealTargets.forEach((target) => {
    if (!target.classList.contains('is-revealed')) {
      revealObserver.observe(target)
    }
  })

  return () => {
    sequenceObserver.disconnect()
    revealObserver.disconnect()
  }
}

export function useRevealAnimations({ refreshDeps = [] } = {}) {
  useEffect(() => {
    const runImmediateReveal = () => {
      document.querySelectorAll('[data-reveal-sequence-immediate]').forEach((element) => {
        element.classList.add('is-revealed')
      })
    }

    runImmediateReveal()
    requestAnimationFrame(runImmediateReveal)
  }, [])

  useEffect(() => setupScrollReveals(), refreshDeps)
}
