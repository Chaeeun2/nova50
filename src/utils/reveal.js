export const revealStagger = 120

export const revealDelay = (order = 0) => ({
  '--reveal-delay': `${order * revealStagger}ms`,
})
