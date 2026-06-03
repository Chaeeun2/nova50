export function sortWorksTagsAlphabetically(tags = []) {
  return [...tags].sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' }))
}

export function normalizeWorksFilterTags(tags) {
  const selected = Array.isArray(tags)
    ? tags.map((tag) => String(tag || '').trim()).filter(Boolean)
    : []

  const seen = new Set()

  return sortWorksTagsAlphabetically(
    selected.filter((tag) => {
      if (seen.has(tag)) {
        return false
      }

      seen.add(tag)
      return true
    }),
  )
}

export function buildWorksFilterTagsForUi(tagOptions = []) {
  return [
    { label: 'ALL', tone: 'white' },
    ...tagOptions.map((label) => ({ label })),
  ]
}
