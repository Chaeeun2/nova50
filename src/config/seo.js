export const SITE_NAME = 'NOVA50 노바피프티'
export const SITE_URL = 'https://nova-50.com'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/thumbnail.png`
export const RSS_FEED_PATH = '/rss.xml'

export const robotsDisallowPaths = ['/admin/']

export const sitemapEntries = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/about', changefreq: 'monthly', priority: 0.8 },
  { path: '/works', changefreq: 'weekly', priority: 0.8 },
  { path: '/career', changefreq: 'monthly', priority: 0.7 },
  { path: '/contact', changefreq: 'monthly', priority: 0.7 },
]

const defaultDescription =
  '노바피프티는 사람과 브랜드를 직접 연결하는 순간을 만듭니다.'

export const defaultSeo = {
  title: SITE_NAME,
  description: defaultDescription,
  image: DEFAULT_OG_IMAGE,
  path: '/',
}

export const pageSeo = {
  '/': {
    title: SITE_NAME,
    description: defaultDescription,
  },
  '/about': {
    title: `About | ${SITE_NAME}`,
    description:
      '노바피프티는 사람과 브랜드를 직접 연결하는 순간을 만듭니다.',
  },
  '/works': {
    title: `Works | ${SITE_NAME}`,
    description:
      '노바피프티는 사람과 브랜드를 직접 연결하는 순간을 만듭니다.',
  },
  '/career': {
    title: `Career | ${SITE_NAME}`,
    description:
      '노바피프티는 사람과 브랜드를 직접 연결하는 순간을 만듭니다.',
  },
  '/contact': {
    title: `Contact | ${SITE_NAME}`,
    description:
      '노바피프티는 사람과 브랜드를 직접 연결하는 순간을 만듭니다.',
  },
}

export function getSeoForPath(pathname) {
  const path = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
  const page = pageSeo[path] ?? defaultSeo

  return {
    title: page.title ?? defaultSeo.title,
    description: page.description ?? defaultSeo.description,
    image: DEFAULT_OG_IMAGE,
    path: path || '/',
  }
}
