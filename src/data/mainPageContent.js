/** 메인 Section3 works / about 카드 배경 — 고정 URL */
export const MAIN_CARD_IMAGE_URLS = {
  works: {
    pc: 'https://pub-724687d8ff2b4ccea216d8af4ba19301.r2.dev/main/main_01.png',
    mo: 'https://pub-724687d8ff2b4ccea216d8af4ba19301.r2.dev/main/works_BG_mo.jpg',
  },
  about: {
    pc: 'https://pub-724687d8ff2b4ccea216d8af4ba19301.r2.dev/main/main_02.png',
    mo: 'https://pub-724687d8ff2b4ccea216d8af4ba19301.r2.dev/main/about_BG_mo.jpg',
  },
}

const MAIN_CARD_IMAGE_BY_PATH = {
  '/works': MAIN_CARD_IMAGE_URLS.works,
  '/about': MAIN_CARD_IMAGE_URLS.about,
}

export const MAIN_CARD_STYLES = ['works', 'about']

export function resolveMainCardStyle(card = {}, index = 0) {
  if (card.style === 'works' || card.style === 'about') {
    return card.style
  }

  const path = card.path || ''

  if (path.includes('works')) {
    return 'works'
  }

  if (path.includes('about')) {
    return 'about'
  }

  const titleKey = String(card.title?.pc || card.title?.mo || card.title || '')
    .trim()
    .toLowerCase()

  if (titleKey === 'works') {
    return 'works'
  }

  if (titleKey === 'about') {
    return 'about'
  }

  return index === 0 ? 'works' : 'about'
}

export function resolveMainCardImage(card = {}, index = 0) {
  const path = card.path || ''
  const style = resolveMainCardStyle(card, index)
  const titleKey = String(card.title?.pc || card.title?.mo || card.title || '')
    .trim()
    .toLowerCase()

  const hardcoded =
    MAIN_CARD_IMAGE_BY_PATH[path] ||
    MAIN_CARD_IMAGE_URLS[style] ||
    (titleKey === 'works' ? MAIN_CARD_IMAGE_URLS.works : null) ||
    (titleKey === 'about' ? MAIN_CARD_IMAGE_URLS.about : null)

  if (hardcoded) {
    return { pc: hardcoded.pc, mo: hardcoded.mo }
  }

  return toResponsiveText(card.image, { pc: '', mo: '' })
}

export const defaultMainPageContent = {
  section01: {
    title: { pc: '', mo: '' },
  },
  section02: {
    eyebrow: { pc: '', mo: '' },
    title: { pc: '', mo: '' },
    content: {
      title: { pc: '', mo: '' },
      body: { pc: '', mo: '' },
    },
  },
  section03: {
    cards: [],
  },
  section04: {
    caption: { pc: '', mo: '' },
    title: {
      text: { pc: '', mo: '' },
    },
  },
}

export function toResponsiveText(value, fallback = '') {
  const fallbackText =
    fallback && typeof fallback === 'object' && !Array.isArray(fallback)
      ? { pc: fallback.pc ?? fallback.mo ?? '', mo: fallback.mo ?? fallback.pc ?? '' }
      : { pc: fallback, mo: fallback }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const pc = value.pc ?? value.mo ?? fallbackText.pc
    const mo = value.mo ?? value.pc ?? fallbackText.mo
    return { pc, mo }
  }

  return { pc: value ?? fallbackText.pc, mo: value ?? fallbackText.mo }
}

export function getResponsiveText(value, device = 'pc') {
  const normalizedValue = toResponsiveText(value)
  return normalizedValue[device] ?? normalizedValue.pc ?? ''
}

function mergeLegacyHighlight(title = {}, defaultTitle) {
  const text = toResponsiveText(title.text, defaultTitle.text)
  const highlight = toResponsiveText(title.highlight, '')

  return {
    pc:
      highlight.pc && !text.pc.includes('*')
        ? `*${highlight.pc}*${text.pc}`
        : text.pc,
    mo:
      highlight.mo && !text.mo.includes('*')
        ? `*${highlight.mo}*${text.mo}`
        : text.mo,
  }
}

export function normalizeMainPageContent(content = {}) {
  const defaultContent = JSON.parse(JSON.stringify(defaultMainPageContent))

  return {
    ...defaultContent,
    ...content,
    section01: {
      ...defaultContent.section01,
      ...content.section01,
      title: {
        ...toResponsiveText(content.section01?.title, defaultContent.section01.title),
      },
    },
    section02: {
      ...defaultContent.section02,
      ...content.section02,
      eyebrow: toResponsiveText(content.section02?.eyebrow, defaultContent.section02.eyebrow),
      title: toResponsiveText(content.section02?.title, defaultContent.section02.title),
      content: {
        ...defaultContent.section02.content,
        ...content.section02?.content,
        title: toResponsiveText(
          content.section02?.content?.title,
          defaultContent.section02.content.title,
        ),
        body: toResponsiveText(
          content.section02?.content?.body,
          defaultContent.section02.content.body,
        ),
      },
    },
    section03: {
      ...defaultContent.section03,
      ...content.section03,
      cards: (content.section03?.cards || defaultContent.section03.cards).map((card, index) => {
        const defaultCard = defaultContent.section03.cards[index] || {
          title: { pc: '', mo: '' },
          description: { pc: '', mo: '' },
          path: '',
          image: { pc: '', mo: '' },
          style: index === 0 ? 'works' : 'about',
        }

        const mergedCard = {
          ...defaultCard,
          ...card,
        }
        const style = resolveMainCardStyle(mergedCard, index)

        return {
          ...mergedCard,
          style,
          title: toResponsiveText(card.title, defaultCard.title),
          description: toResponsiveText(card.description, defaultCard.description),
          image: resolveMainCardImage({ ...mergedCard, style }, index),
        }
      }),
    },
    section04: {
      ...defaultContent.section04,
      ...content.section04,
      caption: toResponsiveText(content.section04?.caption, defaultContent.section04.caption),
      title: {
        text: mergeLegacyHighlight(content.section04?.title, defaultContent.section04.title),
      },
    },
  }
}
