import fs from 'node:fs/promises'
import path from 'node:path'
import TurndownService from 'turndown'

const OUT_DIR = path.join(process.cwd(), 'docs', 'whop')
const PAGES = [
  'https://docs.whop.com/apps/getting-started#create-your-whop-app',
  'https://docs.whop.com/apps/introduction',
  'https://docs.whop.com/apps/guides/permissions',
  'https://docs.whop.com/apps/guides/app-views',
  'https://docs.whop.com/apps/guides/payins',
  'https://docs.whop.com/apps/guides/payouts',
  'https://docs.whop.com/apps/guides/webhooks',
  'https://docs.whop.com/apps/guides/oauth',
  'https://docs.whop.com/apps/guides/dev-proxy',
  'https://docs.whop.com/apps/guides/iframe',
  'https://docs.whop.com/apps/guides/notifications',
  'https://docs.whop.com/apps/guides/forums',
  'https://docs.whop.com/apps/guides/chat',
  'https://docs.whop.com/apps/guides/frosted_ui',
  'https://docs.whop.com/apps/guides/react-native'
]

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })

function safeFileNameFromUrl(url) {
  const u = new URL(url)
  const base = u.pathname.replace(/\/+/, '/').replace(/^\//, '').replace(/\//g, '_') || 'index'
  return `${base}.md`
}

async function fetchAndSave(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'AutoChargeSaver/1.0' } })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const html = await res.text()
  const md = turndown.turndown(html)
  const withHeader = `Original URL: ${url}\n\n` + md
  const file = safeFileNameFromUrl(url)
  await fs.writeFile(path.join(OUT_DIR, file), withHeader, 'utf8')
  return { url, file }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function main() {
  await ensureDir(OUT_DIR)
  const results = []
  for (const url of PAGES) {
    try {
      const r = await fetchAndSave(url)
      results.push(r)
      console.log(`Saved ${r.file}`)
    } catch (err) {
      console.error(`Error saving ${url}:`, err.message)
    }
  }
  // Create a minimal INDEX placeholder; manual curation can be added later
  const indexPath = path.join(OUT_DIR, 'INDEX.md')
  const lines = [
    '# Whop Apps Knowledge Map (extracted)\n',
    '- This file aggregates key requirements from downloaded docs.\n',
    '\n',
    '## Files\n',
    ...results.map(r => `- ${r.file} — ${r.url}`),
    '\n',
    '## Key Areas\n',
    '- OAuth: endpoints, scopes, state, token exchange\n',
    '- Webhooks: signature verification, idempotency, event types\n',
    '- App Views: iframe headers, frosted UI conventions\n',
    '- Permissions: minimal scopes and enforcement\n',
    '- Notifications: channels and payload expectations\n',
    '- Payins/Payouts: SDK/API surface and constraints\n',
    '- Dev Proxy: local development routing\n'
  ]
  await fs.writeFile(indexPath, lines.join('\n'), 'utf8')
  console.log('Generated docs/whop/INDEX.md')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


