import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { robotsDisallowPaths, SITE_URL, sitemapEntries } from '../src/config/seo.js'

const publicDir = resolve(import.meta.dirname, '../public')
const lastmod = new Date().toISOString().slice(0, 10)

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

writeFileSync(resolve(publicDir, 'robots.txt'), buildRobotsTxt())
writeFileSync(resolve(publicDir, 'sitemap.xml'), buildSitemapXml())

console.log('Generated public/robots.txt and public/sitemap.xml')
