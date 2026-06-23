import { SITE_NAME, SITE_URL } from '../config/seo'

function upsertMeta(attribute, key, content) {
  if (!content) {
    return
  }

  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function upsertLink(rel, href) {
  if (!href) {
    return
  }

  let element = document.head.querySelector(`link[rel="${rel}"]`)

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

export function applySeo({ title, description, image, path }) {
  const canonicalUrl = new URL(path || '/', SITE_URL).href

  document.title = title

  upsertMeta('name', 'description', description)
  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', image)

  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:image', image)
  upsertMeta('property', 'og:url', canonicalUrl)
  upsertMeta('property', 'og:locale', 'ko_KR')

  upsertLink('canonical', canonicalUrl)
}
