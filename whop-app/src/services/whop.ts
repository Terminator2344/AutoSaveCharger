import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyWebhookSignature(raw: string, sigHeader: string, secret: string): boolean {
  // TODO: Confirm header format in docs. If header includes scheme (e.g., t=..., v1=...), parse accordingly.
  const h = createHmac('sha256', secret)
  h.update(raw)
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

export async function exchangeOAuthCodeForToken(): Promise<void> {
  // Handled by template SDK / NextAuth; left as stub if needed.
}


