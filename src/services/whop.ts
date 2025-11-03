// Helpers to interact with Whop API/SDK — placeholders referencing docs pages.
// TODO: Wire real endpoints per docs/whop files when credentials are available.

import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '@/src/config/env'

export type WhopOAuthToken = {
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  // Per docs: HMAC SHA-256 over raw body with WHOP_WEBHOOK_SECRET
  const hmac = createHmac('sha256', env.WHOP_WEBHOOK_SECRET)
  hmac.update(rawBody, 'utf8')
  const digest = hmac.digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(digest, 'hex'))
  } catch {
    return false
  }
}

export async function exchangeOAuthCodeForToken(params: { code: string; redirectUri: string }) {
  // TODO: Replace with real Whop OAuth token endpoint from docs
  // Reference: docs/whop/apps/guides/oauth
  return {} as WhopOAuthToken
}

export function buildWhopBillingUrlFromMeta(meta?: any): string | null {
  // Prefer URL provided in webhook payload metadata
  if (meta?.billing_url) return meta.billing_url as string
  if (meta?.renewal_url) return meta.renewal_url as string
  return null
}


