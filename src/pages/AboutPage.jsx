/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useRevealAnimations } from '../hooks/useRevealAnimations'
import { getPageContent } from '../services/mainPageService'
import { ABOUT_SECTION_EYEBROWS } from '../data/aboutSectionEyebrows'
import { createEmptyAboutContent } from '../data/pageContentDefaults'
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
  const [pageText, setPageText] = useState(createEmptyAboutContent)
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
          setPageText(mergeAboutPageContent(createEmptyAboutContent(), data.content))
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
