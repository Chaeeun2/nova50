export const SITE_NAME = 'NOVA50'
export const SITE_URL = 'https://nova-50.com'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/thumbnail.png`

export const robotsDisallowPaths = ['/admin/']

export const sitemapEntries = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/about', changefreq: 'monthly', priority: 0.8 },
  { path: '/works', changefreq: 'weekly', priority: 0.8 },
  { path: '/career', changefreq: 'monthly', priority: 0.7 },
  { path: '/contact', changefreq: 'monthly', priority: 0.7 },
]

const defaultDescription =
  '노바피프티는 사람과 브랜드를 직접 연결하는 순간을 만듭니다. 새로운 아이디어, 감각적인 실행, 차별화된 경험으로 브랜드가 빛나는 현장을 함께 완성합니다.'

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
      'NOVA50은 변화가 시작되는 지점을 만듭니다. 브랜드 아이덴티티, 서비스, 조직과 함께하는 사람들을 소개합니다.',
  },
  '/works': {
    title: `Works | ${SITE_NAME}`,
    description:
      '영리빙, 게임 쇼케이스 등 NOVA50이 기획·운영한 프로젝트를 확인하세요. 브랜드 경험을 설계하는 우리의 결과물입니다.',
  },
  '/career': {
    title: `Career | ${SITE_NAME}`,
    description:
      'NOVA50과 함께할 인재를 찾습니다. 우리가 일하는 방식, 복지, 채용 공고를 확인하고 지원해 주세요.',
  },
  '/contact': {
    title: `Contact | ${SITE_NAME}`,
    description:
      '프로젝트 문의와 협업 제안을 환영합니다. 전화 02-6949-0550, 이메일 hello@nova-50.com 또는 문의 폼으로 연락해 주세요.',
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
