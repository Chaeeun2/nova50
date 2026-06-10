import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  defaultSeo,
  pageSeo,
  robotsDisallowPaths,
  RSS_FEED_PATH,
  SITE_NAME,
  SITE_URL,
  sitemapEntries,
} from '../src/config/seo.js'

const publicDir = resolve(import.meta.dirname, '../public')
const lastmod = new Date().toISOString().slice(0, 10)
const buildDate = new Date()

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatRssDate(date) {
  return date.toUTCString()
}

function buildRobotsTxt() {
  const disallowLines = robotsDisallowPaths.map((path) => `Disallow: ${path}`)

  return [
    'User-agent: *',
    'Allow: /',
    '',
    ...disallowLines,
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n')
}

function buildSitemapXml() {
  const urls = sitemapEntries
    .map(({ path, changefreq, priority }) => {
      const loc = new URL(path, SITE_URL).href

      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority.toFixed(1)}</priority>`,
        '  </url>',
      ].join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n')
}

function buildRssXml() {
  const feedUrl = new URL(RSS_FEED_PATH, SITE_URL).href
  const channelLink = new URL('/', SITE_URL).href
  const channelDescription = pageSeo['/']?.description ?? defaultSeo.description

  const items = sitemapEntries
    .map(({ path }) => {
      const page = pageSeo[path] ?? defaultSeo
      const link = new URL(path, SITE_URL).href
      const title = page.title ?? defaultSeo.title
      const description = page.description ?? defaultSeo.description

      return [
        '    <item>',
        `      <title>${escapeXml(title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <description>${escapeXml(description)}</description>`,
        `      <pubDate>${formatRssDate(buildDate)}</pubDate>`,
        '    </item>',
      ].join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(SITE_NAME)}</title>`,
    `    <link>${escapeXml(channelLink)}</link>`,
    `    <description>${escapeXml(channelDescription)}</description>`,
    '    <language>ko</language>',
    `    <lastBuildDate>${formatRssDate(buildDate)}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}

writeFileSync(resolve(publicDir, 'robots.txt'), buildRobotsTxt())
writeFileSync(resolve(publicDir, 'sitemap.xml'), buildSitemapXml())
writeFileSync(resolve(publicDir, 'rss.xml'), buildRssXml())

console.log('Generated public/robots.txt, public/sitemap.xml, and public/rss.xml')
