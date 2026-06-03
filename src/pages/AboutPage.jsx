/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import coreValue01 from '../assets/core_value_01.png'
import coreValue02 from '../assets/core_value_02.png'
import coreValue03 from '../assets/core_value_03.png'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useRevealAnimations } from '../hooks/useRevealAnimations'
import { getPageContent } from '../services/mainPageService'
import { ABOUT_SECTION_EYEBROWS } from '../data/aboutSectionEyebrows'
import {
  getServiceDisplayNumber,
  mergeAboutPageContent,
} from '../utils/aboutContentFirestore'
import { revealDelay } from '../utils/reveal'
import './AboutPage.css'

const memberImageModules = import.meta.glob('../assets/about/member_*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const memberImages = Object.entries(memberImageModules)
  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB, undefined, { numeric: true }))
  .map(([path, src]) => ({
    id: path.split('/').pop().replace(/\.[^.]+$/, ''),
    src,
  }))

function resolveMemberImage(member, index) {
  if (member?.image) {
    return member.image
  }

  return memberImages[index]?.src ?? memberImages[0]?.src ?? ''
}

const splitLines = (text) => text.split('\n')

const hasServiceVideo = (service) => Boolean(service?.video?.trim())

export const aboutText = {
  identity: {
    eyebrow: 'Brand Identity',
    title: {
      pc: `NOVA50 is
where change
begins`,
      mo: `NOVA50
is where
change
begins`,
    },
    introTitle: {
      pc: `노바피프티에서
변화가 시작됩니다.`,
      mo: `노바피프티에서
변화가 시작됩니다.`,
    },
    copy: {
      pc: `*노바NOVA*는 새로운 빛이며,
불현듯 나타나 가장 강렬하게 빛나는 순간입니다.
NOVA50는 그 빛으로 사람들이 이전과 이후를 구분할 수 있는 경험을 설계합니다.

*50*은 클라이언트의 니즈와 우리의 설계가 만나는 균형의 지점이며,
상상과 현실, 경험과 미래가 교차하는 최소의 단위입니다.
완전히 낯선 것이 아닌, 익숙함을 비틀어 감각을 깨우는 순간.

*NOVA50*는 변화가 시작되는 그 지점을 만듭니다.`,
      mo: `*노바NOVA*는 새로운 빛이며,
불현듯 나타나 가장 강렬하게 빛나는 순간입니다.
NOVA50는 그 빛으로 사람들이 이전과 이후를
구분할 수 있는 경험을 설계합니다.

*50*은 클라이언트의 니즈와 우리의 설계가 만나는 균형의 지점이며, 상상과 현실, 경험과 미래가 교차하는 최소의 단위입니다. 완전히 낯선 것이 아닌, 익숙함을 비틀어 감각을 깨우는 순간.

*NOVA50*는 변화가 시작되는 그 지점을 만듭니다.`,
    },
  },
  coreValues: [
    {
      title: `where
insight
begin`,
      image: coreValue01,
      hoverImage: coreValue01,
      headline: '브랜드의 경험이 시작됩니다.',
      body: `모든 브랜드의 시작은 ‘다르게 보는 순간’에서 탄생합니다. 같은 출발선 위에서도, 우리는 전혀 다른 결과를 만들어냅니다.`,
    },
    {
      title: `how
we move
people`,
      image: coreValue02,
      hoverImage: coreValue02,
      headline: '아이디어로 사람을 움직입니다.',
      body: `우리는 스치는 경험이 아닌, 마음을 흔드는 순간을 만듭니다. 그리고 그 순간은 오래도록 기억됩니다.`,
    },
    {
      title: `what
build
connection`,
      image: coreValue03,
      hoverImage: coreValue03,
      headline: '브랜드와 사람을 연결합니다.',
      body: `모든 브랜드의 시작은 ‘다르게 보는 순간’에서 탄생합니다. 같은 출발선 위에서도, 우리는 전혀 다른 결과를 만들어냅니다.`,
    },
  ],
  services: [
    {
      number: '01',
      title: { pc: `ceremony`, mo: `ceremony` },
      english: {
        pc: `We specialize in planning and managing a wide range of
ceremonies and commemorative events.
With stable, purpose-driven operations, we deliver
polished and reliable event experiences.`,
        mo: `We specialize in planning and managing a wide range of ceremonies and commemorative events.
With stable, purpose-driven operations, we deliver polished and reliable event experiences.`,
      },
      korean: {
        pc: `각종 기념식과 세리머니를 전문적으로 진행합니다.
목적에 맞는 안정적이고 완성도 높은 운영을 제공합니다.`,
        mo: `각종 기념식과 세리머니를 전문적으로 진행합니다.
목적에 맞는 안정적이고 완성도 높은 운영을 제공합니다.`,
      },
      tags: [`Awards Ceremony`, `Opening & Closing Ceremony`, `Gala-Dinner`],
    },
    {
      number: '02',
      title: { pc: `Public event`, mo: `Public event` },
      english: {
        pc: `We create moments where people gather,
        engage, and share meaningful experiences.
Through compelling events that inspire participation,
we bring every venue to life.`,
        mo: `We create moments where people gather, engage, and share meaningful experiences.
Through compelling events that inspire participation, we bring every venue to life.`,
      },
      korean: {
        pc: `사람들이 모이고, 경험하고, 공유하는 순간을 만듭니다.
참여를 이끌어내는 매력적인 이벤트로 현장을 완성합니다.`,
        mo: `사람들이 모이고, 경험하고, 공유하는 순간을 만듭니다.
참여를 이끌어내는 매력적인 이벤트로 현장을 완성합니다.`,
      },
      tags: [`Public Festival`, `Community Event`, `Government Event`],
    },
    {
      number: '03',
      title: { pc: `Product launch`, mo: `product launch` },
      english: {
        pc: `The moment to reveal not just a product, but a story.
We create impactful launch experiences that leave a lasting impression.`,
        mo: `The moment to reveal not just a product, but a story.
We create impactful launch experiences that leave
a lasting impression.`,
      },
      korean: {
        pc: `제품이 아닌 '이야기'를 세상에 공개하는 순간.
강렬한 인상으로 오래 기억되는 런칭을 만들어냅니다.`,
        mo: `제품이 아닌 '이야기'를 세상에 공개하는 순간.
강렬한 인상으로 오래 기억되는 런칭을 만들어냅니다.`,
      },
      tags: [`Launch Event`, `Brand Showcase`, `Media Event`],
    },
    {
      number: '04',
      title: { pc: `Hospitality`, mo: `Hospitality` },
      english: {
        pc: `We deliver tailored hospitality programs for VIPs
        and valued customers, strengthening brand connection.
With thoughtful details, we create truly exceptional experiences.`,
        mo: `We deliver tailored hospitality programs for VIPs and valued customers, strengthening brand connection.
With thoughtful details, we create truly exceptional experiences.`,
      },
      korean: {
        pc: `VIP 및 고객 대상 맞춤형 호스피탈리티로 브랜드를 각인시킵니다.
섬세한 디테일로 특별한 경험을 완성합니다.`,
        mo: `VIP 및 고객 대상 맞춤형 호스피탈리티로 브랜드를 각인시킵니다. 섬세한 디테일로 특별한 경험을 완성합니다.`,
      },
      tags: [`VIP Program`, `Guest Journey`, `Protocol`],
    },
    {
      number: '05',
      title: { pc: `Convention`, mo: `Convention` },
      english: {
        pc: `We plan and operate a wide range of conventions and conferences.
Our services support effective information sharing and meaningful networking.`,
        mo: `We plan and operate a wide range of conventions
        and conferences.
Our services support effective information sharing
and meaningful networking.`,
      },
      korean: {
        pc: `다양한 컨벤션과 회의를 기획하고 운영합니다.
정보 전달과 네트워킹이 효과적으로 이루어지도록 지원합니다.`,
        mo: `다양한 컨벤션과 회의를 기획하고 운영합니다.
정보 전달과 네트워킹이 효과적으로 이루어지도록 지원합니다.`,
      },
      tags: [`Conference`, `Forum`, `Business Session`],
    },
    {
      number: '06',
      title: { pc: `Exhibition`, mo: `Exhibition` },
      english: {
        pc: `We provide integrated exhibition planning and spatial direction.
By bringing content and space together, we create immersive experiences.`,
        mo: `We provide integrated exhibition planning
        and spatial direction.
By bringing content and space together,
we create immersive experiences.`,
      },
      korean: {
        pc: `전시 기획과 공간 연출을 통합적으로 제공합니다.
콘텐츠와 공간이 어우러진 몰입형 경험을 선사합니다.`,
        mo: `전시 기획과 공간 연출을 통합적으로 제공합니다.
콘텐츠와 공간이 어우러진 몰입형 경험을 선사합니다.`,
      },
      tags: [`Brand Exhibition`, `Booth Design`, `Experience Space`],
    },
    {
      number: '07',
      title: { pc: `Sports marketing`, mo: `sports marketing` },
      english: {
        pc: `We plan and execute sports-based marketing strategies.
By connecting brands and fans in authentic ways,
we expand meaningful touchpoints.`,
        mo: `We plan and execute sports-based marketing strategies.
By connecting brands and fans in authentic ways,
we expand meaningful touchpoints.`,
      },
      korean: {
        pc: `스포츠 기반 마케팅 전략을 기획·실행합니다.
브랜드와 팬을 자연스럽게 연결하는 접점을 확장합니다.`,
        mo: `스포츠 기반 마케팅 전략을 기획·실행합니다.
브랜드와 팬을 자연스럽게 연결하는 접점을 확장합니다.`,
      },
      tags: [`Sports Event`, `Fan Experience`, `Sponsorship Activation`],
    },
  ],
  organization: {
    eyebrow: 'Organization',
    items: [
      {
        id: 'nova-50',
        variant: 'title',
        title: { pc: 'nova 50', mo: 'nova 50' },
        teams: [],
      },
      {
        id: 'innovation-lab',
        variant: 'title',
        title: { pc: 'innovation lab', mo: 'innovation lab' },
        teams: [],
      },
      {
        id: 'operation-growth-office',
        variant: 'office',
        title: {
          pc: 'operation & growth office',
          mo: 'operation &\nGrowth office',
        },
        body: {
          pc: `Corporate Affairs Division
Business Support Division
NOVA50 Research Institute`,
          mo: `Corporate Affairs Division
Business Support Division
NOVA50 Research Institute`,
        },
        teams: [],
      },
      {
        id: 'experience-design-group',
        variant: 'group',
        title: {
          pc: `experience
design group`,
          mo: `experience
design group`,
        },
        body: {
          pc: `브랜드가 사람들의 일상에 깊이 스며들 수 있도록,
프로모션부터 소셜마케팅까지 — 접점 하나하나를 경험으로 설계합니다.`,
          mo: `브랜드가 사람들의 일상에 깊이 스며들 수 있도록,
프로모션부터 소셜마케팅까지
—  접점 하나하나를 경험으로 설계합니다.`,
        },
        teams: ['Team 07', 'Team 24', 'Team 25', 'Team 44', 'Team 49'],
      },
      {
        id: 'creative-design-lab',
        variant: 'group',
        title: {
          pc: `creative
design lab`,
          mo: `creative
design lab`,
        },
        body: {
          pc: `브랜드가 가진 고유한 감성과 메시지를 시각 언어로 풀어냅니다.
공간, 그래픽, 콘텐츠 전반에 걸쳐 일관된 브랜드 경험을 만들어냅니다.`,
          mo: `브랜드가 가진 고유한 감성과 메시지를 시각
언어로 풀어냅니다. 공간, 그래픽, 콘텐츠 전반에
걸쳐 일관된 브랜드 경험을 만들어냅니다.`,
        },
        teams: ['Creative Directing', 'Visual Design', 'Content Production'],
      },
    ],
  },
  members: [
    {
      id: 'member-01',
      name: '최영완',
      role: '대표이사 ㅣ CEO',
      projects: [
        'APEC 2025 KOREA 배우자 행사',
        '한・아프리카 정상회의 공식환영만찬',
        'UNICITY Global Leadership & Innovation Conference (태국)',
        '강릉 세계합창대회 총괄 대행',
        'World Cyber Games: 2020 Connected',
        'AIA 생명 100주년 기념 마라톤 대회',
        '평창 올림픽 현대자동차 호스피탈리티',
      ],
    },
        {
      id: 'member-02',
      name: '김주완',
      role: '상무 ㅣ Executive Director',
      projects: [
        '평창/토리노/북경 동계올림픽 성화봉송',
        '밴쿠버/런던 동계올림픽 한국총괄 호스피탈리티',
        'Youtube 크리에이티브 서밋 서울',
        '여수엑스포 삼성관',
        '양양 서핑 페스티벌',
        '금호타이어 맨체스터 유나이티드 스폰서십',
        'LOL 월드챔피언십',
      ],
    },
            {
      id: 'member-03',
      name: '김경열',
      role: '이사 ㅣ Director',
      projects: [
        'G-STAR 스마일게이트 B2B관',
        'CES SAMSUNG DS관',
        '서울 스마트 모빌리티 엑스포',
        '서울 모터쇼 현대자동차 관',
        'CASS BLUE PLAYGROUND',
        '한국 암웨이 25주년 페스티벌',
        '평창 동계올림픽 삼성 쇼케이스',
      ],
    },
  ],
  memberSection: {
    eyebrow: 'NOVA50 Members',
  },
}

const renderEmphasisText = (text) =>
  text.split(/(\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={`${part}-${index}`}>{part.slice(1, -1)}</strong>
    }

    return <span key={`${part}-${index}`}>{part}</span>
  })

const renderIdentityTitleLines = (lines, keyPrefix, startIndex = 0, animate = true) =>
  lines.map((line, index) => (
    <span
      className="about-identity-title-line"
      key={`${keyPrefix}-${index}`}
      {...(animate
        ? { 'data-reveal-item': true, style: revealDelay(startIndex + index) }
        : {})}
    >
      {line}
    </span>
  ))

const renderOrganizationTeamsPc = (teams) => (
  <ul className="organization-teams organization-teams-pc">
    {teams.map((team) => (
      <li key={team}>{team}</li>
    ))}
  </ul>
)

const renderOrganizationTeamsMo = (teams) => (
  <ul className="organization-teams organization-teams-mo">
    {teams.map((team) => (
      <li key={team}>{team}</li>
    ))}
  </ul>
)

const renderIdentityCopy = (copy, keyPrefix) =>
  copy.split('\n').map((line, lineIndex) =>
    line === '' ? (
      <span
        className="identity-copy-break"
        key={`${keyPrefix}-break-${lineIndex}`}
        aria-hidden="true"
      />
    ) : (
      <p key={`${keyPrefix}-${lineIndex}`}>{renderEmphasisText(line)}</p>
    ),
  )

function AboutPage() {
  const [pageText, setPageText] = useState(aboutText)
  const [isPageContentReady, setIsPageContentReady] = useState(false)
  const [activeServiceIndex, setActiveServiceIndex] = useState(null)
  const [activeMemberIndex, setActiveMemberIndex] = useState(0)
  const [displayedMemberIndex, setDisplayedMemberIndex] = useState(0)
  const [isMemberProfileVisible, setIsMemberProfileVisible] = useState(true)
  const serviceVideoRefs = useRef([])
  const isInitialMemberProfileRender = useRef(true)
  const memberDragStartX = useRef(0)
  const memberDragOffsetX = useRef(0)
  const isMemberDragging = useRef(false)
  const organizationItems = pageText.organization.items
  const members = (pageText.members ?? []).map((member, index) => ({
    ...member,
    id: member.id || memberImages[index]?.id || `member-${index + 1}`,
    image: resolveMemberImage(member, index),
  }))
  const currentMemberIndex =
    members.length === 0 ? 0 : Math.min(activeMemberIndex, members.length - 1)
  const currentDisplayedMemberIndex =
    members.length === 0 ? 0 : Math.min(displayedMemberIndex, members.length - 1)
  const activeMember = members[currentMemberIndex] ?? members[0]
  const displayedMember = members[currentDisplayedMemberIndex] ?? activeMember
  const isMobileLayout = useMediaQuery('(max-width: 720px)')
  const identityTitleLinesPc = splitLines(pageText.identity.title.pc)
  const identityTitleLinesMo = splitLines(pageText.identity.title.mo)
  const identityTitleLineCount = isMobileLayout
    ? identityTitleLinesMo.length
    : identityTitleLinesPc.length
  const identityBodyRevealOffset = 1 + identityTitleLineCount
  const servicesRevealKey = pageText.services
    .map((service, index) => `${index}:${getServiceDisplayNumber(service, index)}`)
    .join('|')

  useEffect(() => {
    serviceVideoRefs.current.forEach((video, index) => {
      if (!video) {
        return
      }

      if (index === activeServiceIndex) {
        video.play().catch(() => {})
        return
      }

      video.pause()
      video.currentTime = 0
    })
  }, [activeServiceIndex])

  useRevealAnimations({
    refreshDeps: [isPageContentReady, servicesRevealKey],
  })

  useEffect(() => {
    let isMounted = true

    async function loadAboutContent() {
      try {
        const data = await getPageContent('about')

        if (isMounted && data?.content) {
          setPageText(mergeAboutPageContent(aboutText, data.content))
          setActiveServiceIndex(null)
        }
      } catch (error) {
        console.warn('About 데이터 로딩 실패:', error)
      } finally {
        if (isMounted) {
          setIsPageContentReady(true)
        }
      }
    }

    loadAboutContent()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (members.length <= 1) {
      return undefined
    }

    const memberTimer = window.setTimeout(() => {
      setActiveMemberIndex((currentIndex) => (currentIndex + 1) % members.length)
    }, 10000)

    return () => window.clearTimeout(memberTimer)
  }, [activeMemberIndex, members.length])

  useEffect(() => {
    if (isInitialMemberProfileRender.current) {
      isInitialMemberProfileRender.current = false
      return undefined
    }

    setIsMemberProfileVisible(false)

    const profileTimer = window.setTimeout(() => {
      setDisplayedMemberIndex(activeMemberIndex)
      setIsMemberProfileVisible(true)
    }, 320)

    return () => window.clearTimeout(profileTimer)
  }, [activeMemberIndex])

  const moveMemberSlide = (direction) => {
    if (members.length <= 1) {
      return
    }

    setActiveMemberIndex((currentIndex) => {
      const nextIndex = currentIndex + direction
      return (nextIndex + members.length) % members.length
    })
  }

  const handleMemberProgressClick = (event) => {
    if (members.length <= 1) {
      return
    }

    const progressRect = event.currentTarget.getBoundingClientRect()
    const clickRatio = (event.clientX - progressRect.left) / progressRect.width
    const nextIndex = Math.min(
      members.length - 1,
      Math.max(0, Math.floor(clickRatio * members.length)),
    )

    setActiveMemberIndex(nextIndex)
  }

  const handleMemberDragStart = (event) => {
    if (members.length <= 1 || event.target.closest('.member-arrow')) {
      return
    }

    isMemberDragging.current = true
    memberDragStartX.current = event.clientX
    memberDragOffsetX.current = 0
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleMemberDragMove = (event) => {
    if (!isMemberDragging.current) {
      return
    }

    memberDragOffsetX.current = event.clientX - memberDragStartX.current
  }

  const handleMemberDragEnd = (event) => {
    if (!isMemberDragging.current) {
      return
    }

    const dragOffset = memberDragOffsetX.current
    isMemberDragging.current = false
    memberDragStartX.current = 0
    memberDragOffsetX.current = 0

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (Math.abs(dragOffset) < 60) {
      return
    }

    moveMemberSlide(dragOffset < 0 ? 1 : -1)
  }

  return (
    <main className="about-page">
      <Header currentPage="about" variant="light" />

      <section className="about-identity-section" data-reveal-section>
        <p className="about-page-eyebrow" data-reveal-item style={revealDelay(0)}>
          {ABOUT_SECTION_EYEBROWS.identity}
        </p>
        <h1 className="about-identity-title about-identity-title-pc">
          {renderIdentityTitleLines(identityTitleLinesPc, 'title-pc', 1, !isMobileLayout)}
        </h1>
        <h1 className="about-identity-title about-identity-title-mo">
          {renderIdentityTitleLines(identityTitleLinesMo, 'title-mo', 1, isMobileLayout)}
        </h1>
        <div className="about-page-body">
          <span
            className="about-page-line"
            aria-hidden="true"
            data-reveal-item
            style={revealDelay(identityBodyRevealOffset)}
          />
          <h2
            className="about-identity-intro about-identity-intro-pc"
            {...(!isMobileLayout
              ? {
                  'data-reveal-item': true,
                  style: revealDelay(identityBodyRevealOffset + 1),
                }
              : {})}
          >
            {pageText.identity.introTitle.pc}
          </h2>
          <h2
            className="about-identity-intro about-identity-intro-mo"
            {...(isMobileLayout
              ? {
                  'data-reveal-item': true,
                  style: revealDelay(identityBodyRevealOffset + 1),
                }
              : {})}
          >
            {pageText.identity.introTitle.mo}
          </h2>
          <div
            className="identity-copy identity-copy-pc"
            {...(!isMobileLayout
              ? {
                  'data-reveal-item': true,
                  style: revealDelay(identityBodyRevealOffset + 2),
                }
              : {})}
          >
            {renderIdentityCopy(pageText.identity.copy.pc, 'copy-pc')}
          </div>
          <div
            className="identity-copy identity-copy-mo"
            {...(isMobileLayout
              ? {
                  'data-reveal-item': true,
                  style: revealDelay(identityBodyRevealOffset + 2),
                }
              : {})}
          >
            {renderIdentityCopy(pageText.identity.copy.mo, 'copy-mo')}
          </div>
        </div>
      </section>

      <section className="about-core-section" data-reveal-section>
        <p className="about-page-eyebrow" data-reveal-item style={revealDelay(0)}>
          Core Values
        </p>
        <div className="core-card-grid">
          {pageText.coreValues.map((card, index) => {
            const hoverImage = card.hoverImage || card.image

            return (
            <article
              className="core-card"
              data-reveal-item
              key={card.title}
              style={revealDelay(index + 1)}
            >
              <h2>{card.title}</h2>
              <div className="core-card__image">
                <img
                  className="core-card__image-default"
                  src={card.image}
                  alt=""
                  aria-hidden="true"
                />
                <img
                  className="core-card__image-hover"
                  src={hoverImage}
                  alt=""
                  aria-hidden="true"
                />
              </div>
              <h3>{card.headline}</h3>
              <p>{card.body}</p>
            </article>
            )
          })}
        </div>
      </section>

      <section className="about-services-section" data-reveal-section>
        <p className="about-page-eyebrow" data-reveal-item style={revealDelay(0)}>
          Services
        </p>
        <div className="service-accordion">
          {isPageContentReady &&
            pageText.services.map((service, index) => {
              const serviceNumber = getServiceDisplayNumber(service, index)

              return (
            <article
              className={`service-accordion-item ${
                activeServiceIndex === index ? 'is-open' : ''
              }`}
              key={`service-${index}-${serviceNumber}`}
            >
              <button
                className="service-trigger"
                type="button"
                data-reveal-item
                aria-expanded={activeServiceIndex === index}
                style={revealDelay(index + 1)}
                onClick={() =>
                  setActiveServiceIndex((currentIndex) =>
                    currentIndex === index ? null : index,
                  )
                }
              >
                <span className="service-number">{serviceNumber}</span>
                <strong className="service-title-pc">{service.title.pc}</strong>
                <strong className="service-title-mo">{service.title.mo}</strong>
                <span className="service-toggle-icon" aria-hidden="true" />
              </button>

              <div
                className="service-panel"
                aria-hidden={activeServiceIndex !== index}
                inert={activeServiceIndex !== index ? true : undefined}
              >
                <div className="service-panel-inner">
                  <div className="service-panel-content">
                    <div
                      className={`service-preview ${
                        hasServiceVideo(service) ? '' : 'service-preview--empty'
                      }`}
                      aria-hidden={!hasServiceVideo(service)}
                    >
                      {hasServiceVideo(service) && (
                        <video
                          aria-hidden="true"
                          loop
                          muted
                          playsInline
                          preload="metadata"
                          ref={(video) => {
                            serviceVideoRefs.current[index] = video
                          }}
                        >
                          <source src={service.video} type="video/mp4" />
                        </video>
                      )}
                    </div>
                    <div className="service-copy service-copy-pc">
                      <p>{service.english.pc}</p>
                      <p>{service.korean.pc}</p>
                      <div className="service-tags">
                        {service.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="service-copy service-copy-mo">
                      <p>{service.english.mo}</p>
                      <p>{service.korean.mo}</p>
                      <div className="service-tags">
                        {service.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
              )
            })}
        </div>
      </section>

      <section className="about-organization-section" data-reveal-section>
        <p className="about-page-eyebrow" data-reveal-item style={revealDelay(0)}>
          {ABOUT_SECTION_EYEBROWS.organization}
        </p>
        <div className="organization-board">
          {organizationItems.map((item, index) => {
            const blockClassName = [
              'organization-block',
              `organization-block--${item.variant}`,
            ].join(' ')

            return (
              <article
                id={item.id}
                className={blockClassName}
                data-reveal-item
                key={item.id}
                style={revealDelay(index + 1)}
              >
                <h2 className="organization-title organization-title-pc">
                  {item.title.pc}
                </h2>
                <h2 className="organization-title organization-title-mo">
                  {item.title.mo}
                </h2>
                {item.body && (
                  <div className="organization-body">
                    <p className="organization-body-pc">{item.body.pc}</p>
                    <p className="organization-body-mo">{item.body.mo}</p>
                  </div>
                )}
                {item.teams?.length > 0 && (
                  <>
                    {renderOrganizationTeamsPc(item.teams)}
                    {renderOrganizationTeamsMo(item.teams)}
                  </>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <section className="about-member-section">
        <p className="about-page-eyebrow" data-reveal>
          {ABOUT_SECTION_EYEBROWS.members}
        </p>
        {activeMember && (
          <>
            <div className="member-visual-group" data-reveal style={revealDelay(1)}>
              <div
                className="member-slider"
                onPointerDown={handleMemberDragStart}
                onPointerMove={handleMemberDragMove}
                onPointerUp={handleMemberDragEnd}
                onPointerCancel={handleMemberDragEnd}
              >
                <div
                  className="member-track"
                  style={{ transform: `translateX(-${currentMemberIndex * 100}%)` }}
                >
                  {members.map((member) => (
                    <div className="member-slide" key={member.id}>
                      <img src={member.image} alt={member.name} draggable="false" />
                    </div>
                  ))}
                </div>
                {members.length > 1 && (
                  <>
                    <button
                      className="member-arrow member-arrow-prev"
                      type="button"
                      aria-label="Previous member"
                      onClick={() => moveMemberSlide(-1)}
                    />
                    <button
                      className="member-arrow member-arrow-next"
                      type="button"
                      aria-label="Next member"
                      onClick={() => moveMemberSlide(1)}
                    />
                  </>
                )}
              </div>
              {members.length > 1 && (
                <button
                  className="member-progress"
                  type="button"
                  aria-label="Select member slide"
                  onClick={handleMemberProgressClick}
                >
                  <span
                    style={{
                      width: `${((currentMemberIndex + 1) / members.length) * 100}%`,
                    }}
                  />
                </button>
              )}
            </div>
            <div className={`member-profile ${isMemberProfileVisible ? 'is-visible' : ''}`}>
              <div>
                <h2>{displayedMember.name}</h2>
                <p>{displayedMember.role}</p>
              </div>
              <ul>
                {displayedMember.projects.map((project) => (
                  <li key={project}>
                    <span className="member-project-dot" aria-hidden="true" />
                    <span>{project}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>

      <Footer variant="light" />
    </main>
  )
}

export default AboutPage
