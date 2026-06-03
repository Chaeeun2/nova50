export const WORKS_FILTER_TAG_OPTIONS = [
  'Game Event',
  'Showcase',
  'Pre-launch',
  'Offline',
  'Immersive',
  'Interactive',
  'Media',
  'Influencer',
  'Corporate Event',
  'Ceremony',
  'Recognition',
  'VIP',
  'Networking',
  'Presentation',
  'Internal Engagement',
]

export function sortWorksTagsAlphabetically(tags = []) {
  return [...tags].sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' }))
}

export function normalizeWorksFilterTags(tags) {
  const fallback = WORKS_FILTER_TAG_OPTIONS
  const selected = Array.isArray(tags)
    ? tags.map((tag) => String(tag || '').trim()).filter(Boolean)
    : []

  if (selected.length === 0) {
    return sortWorksTagsAlphabetically(fallback)
  }

  const seen = new Set()
  const unique = selected.filter((tag) => {
    if (seen.has(tag)) {
      return false
    }

    seen.add(tag)
    return true
  })

  return sortWorksTagsAlphabetically(unique)
}

export function buildWorksFilterTagsForUi(tagOptions = WORKS_FILTER_TAG_OPTIONS) {
  return [
    { label: 'ALL', tone: 'white' },
    ...tagOptions.map((label) => ({ label })),
  ]
}

export const worksFilterTags = buildWorksFilterTagsForUi()
