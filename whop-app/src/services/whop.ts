import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '@/config/env'

export function verifyWebhookSignature(raw: string, sigHeader: string, secret?: string): boolean {
  const resolvedSecret = secret ?? env.WHOP_WEBHOOK_SECRET ?? ''
  if (!resolvedSecret || !sigHeader) return false

  const h = createHmac('sha256', resolvedSecret)
  h.update(raw, 'utf8')
  const digest = h.digest('hex')
  try {
    return timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(sigHeader, 'hex'))
  } catch {
    return false
  }
}

export function getBillingUpdateUrl(meta: any): string {
  if (!meta) return '#'
  return meta.billing_url || meta.renewal_url || meta.update_url || '#'
}

// Alias for compatibility
export function buildWhopBillingUrlFromMeta(meta?: any): string | null {
  if (!meta) return null
  const url = meta.billing_url || meta.renewal_url || meta.update_url
  return url || null
}

// Stub with userId signature (compat)
export async function getBillingUpdateUrlForUser(userId: string) {
  return `https://whop.com/users/${userId}/billing`
}

export async function exchangeOAuthCodeForToken(): Promise<void> {
  // Handled by template SDK / NextAuth; left as stub if needed.
}
