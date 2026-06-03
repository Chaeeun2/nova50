import { ABOUT_SECTION_EYEBROWS } from '../data/aboutSectionEyebrows'

function mergeDeviceText(defaults = {}, remote = {}) {
  return { ...defaults, ...remote }
}

export function getServiceDisplayNumber(_service, index = 0) {
  return String(index + 1).padStart(2, '0')
}

function createServiceId(service, index) {
  if (service?.id) {
    return service.id
  }

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `service-${index}-${Date.now()}`
}

export function syncServiceNumbers(services = []) {
  return services.map((service, index) => ({
    ...service,
    id: createServiceId(service, index),
    number: getServiceDisplayNumber(service, index),
  }))
}

function createMemberId(member, index) {
  if (member?.id) {
    return member.id
  }

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `member-${String(index + 1).padStart(2, '0')}`
}

export function syncMemberIds(members = []) {
  return members.map((member, index) => ({
    ...member,
    id: createMemberId(member, index),
  }))
}

function mergeServicesList(defaultServices, remoteServices) {
  const list =
    Array.isArray(remoteServices) && remoteServices.length > 0 ? remoteServices : defaultServices

  const merged = list.map((service, index) => {
    const fallback = defaultServices[index] || {}

    return {
      ...fallback,
      ...service,
      title: mergeDeviceText(fallback.title, service.title),
      english: mergeDeviceText(fallback.english, service.english),
      korean: mergeDeviceText(fallback.korean, service.korean),
      tags: Array.isArray(service.tags) ? service.tags : fallback.tags || [],
    }
  })

  return syncServiceNumbers(merged)
}

/** Firestore/관리자 데이터를 퍼블릭 ABOUT 기본값과 병합 (services number·순서 포함) */
export function mergeAboutPageContent(defaults, remote) {
  if (!remote) {
    return defaults
  }

  const deserialized = deserializeAboutContentFromFirestore(remote)

  return {
    ...defaults,
    ...deserialized,
    identity: {
      ...defaults.identity,
      ...deserialized.identity,
      eyebrow: ABOUT_SECTION_EYEBROWS.identity,
    },
    organization: {
      ...defaults.organization,
      ...deserialized.organization,
      eyebrow: ABOUT_SECTION_EYEBROWS.organization,
      items: normalizeOrganizationItems(
        deserialized.organization?.items ?? defaults.organization.items,
      ),
    },
    memberSection: {
      ...defaults.memberSection,
      ...deserialized.memberSection,
      eyebrow: ABOUT_SECTION_EYEBROWS.members,
    },
    services: mergeServicesList(defaults.services, deserialized.services),
    coreValues: Array.isArray(deserialized.coreValues)
      ? deserialized.coreValues.map((item, index) => {
          const fallback = defaults.coreValues[index] || {}

          return {
            ...fallback,
            ...item,
            hoverImage: item.hoverImage || item.image || fallback.hoverImage || fallback.image || '',
          }
        })
      : defaults.coreValues,
    members: syncMemberIds(
      Array.isArray(deserialized.members)
        ? deserialized.members.map((item, index) => ({
            ...(defaults.members[index] || {}),
            ...item,
          }))
        : defaults.members,
    ),
  }
}

/** PC/MO 분리·2차원 배열 등 레거시 teams 데이터를 string[] 로 통일 */
export function normalizeOrganizationTeams(teams) {
  if (!teams) {
    return []
  }

  if (Array.isArray(teams)) {
    if (teams.length === 0) {
      return []
    }

    if (typeof teams[0] === 'string') {
      return teams
    }

    if (Array.isArray(teams[0])) {
      return teams.flat()
    }

    if (teams[0]?.items) {
      return teams.flatMap((column) => column.items)
    }

    return []
  }

  if (typeof teams === 'object') {
    const pcTeams = normalizeOrganizationTeams(teams.pc)
    if (pcTeams.length > 0) {
      return pcTeams
    }

    return normalizeOrganizationTeams(teams.mo)
  }

  return []
}

function normalizeOrganizationItems(items = []) {
  return items.map((item) => ({
    ...item,
    teams: normalizeOrganizationTeams(item.teams),
  }))
}

/** Firestore는 배열 안의 배열을 지원하지 않음 → organization teams 를 string[] 로 정규화 */
export function serializeAboutContentForFirestore(content) {
  if (!content?.organization?.items) {
    return content
  }

  return {
    ...content,
    organization: {
      ...content.organization,
      items: normalizeOrganizationItems(content.organization.items),
    },
  }
}

export function deserializeAboutContentFromFirestore(content) {
  if (!content?.organization?.items) {
    return content
  }

  return {
    ...content,
    organization: {
      ...content.organization,
      items: normalizeOrganizationItems(content.organization.items),
    },
  }
}
