/** 메인 Section2 카드 배경 — 절대 경로(또는 https:// 전체 URL)로 교체 */
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

export const defaultMainPageContent = {
  section01: {
    title: {
      pc: `Unique experience
designers`,
      mo: `unique
experience
designers`,
    },
  },
  section02: {
    eyebrow: {
      pc: 'NOVA50 — Unique Experience Designers',
      mo: 'NOVA50 — Unique Experience Designers',
    },
    title: {
      pc: `We design
the moment
things
feel different.`,
      mo: `We design
the moment
things
feel different.`,
    },
    content: {
      title: {
        pc: `변화가 느껴지는 순간,
그 시작에 NOVA50가 있습니다.`,
        mo: `변화가 느껴지는 순간,
그 시작에 NOVA50가 있습니다.`,
      },
      body: {
        pc: `새로운 경험은 기억에 남고, 특별한 경험은 사람을 변화시킵니다.
우리는 넓은 시야와 깊은 통찰로 문제의 본질을 이해하고,
단순한 솔루션을 넘어 사람들의 마음을 움직이는 경험을 만듭니다.

예상을 뛰어넘는 순간, 오래도록 기억에 남는 경험.
그 경험이 노바피프티가 존재하는 이유입니다.`,
        mo: `새로운 경험은 기억에 남고,
특별한 경험은 사람을 변화시킵니다.
우리는 넓은 시야와 깊은 통찰로
문제의 본질을 이해하고,
단순한 솔루션을 넘어 사람들의 마음을
움직이는 경험을 만듭니다.

예상을 뛰어넘는 순간,
오래도록 기억에 남는 경험.
그 경험이 노바피프티가 존재하는 이유입니다.`,
      },
    },
  },
  section03: {
    cards: [
      {
        title: { pc: 'works', mo: 'works' },
        description: {
          pc: 'Beyond solutions, create a mind-moving experience.',
          mo: 'Beyond solutions, create a mind-moving experience.',
        },
        path: '/works',
        image: { ...MAIN_CARD_IMAGE_URLS.works },
      },
      {
        title: { pc: 'about', mo: 'about' },
        description: { pc: 'Change begins in NOVA50.', mo: 'Change begins in NOVA50.' },
        path: '/about',
        image: { ...MAIN_CARD_IMAGE_URLS.about },
      },
    ],
  },
  section04: {
    caption: {
      pc: 'NOVA50 is where change begins.',
      mo: 'NOVA50 is where change begins.',
    },
    title: {
      text: {
        pc: `*변화*가 시작되는 지점을
함께 만들어갑니다.`,
        mo: `*변화*가 시작되는 지점을
함께 만들어갑니다.`,
      },
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
        const defaultCard = defaultContent.section03.cards[index] || defaultContent.section03.cards[0]

        return {
          ...defaultCard,
          ...card,
          title: toResponsiveText(card.title, defaultCard.title),
          description: toResponsiveText(card.description, defaultCard.description),
          image: toResponsiveText(card.image, defaultCard.image),
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
