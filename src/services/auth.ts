import { PrismaClient } from '@prisma/client'
import type { WhopOAuthToken } from './whop'


const prisma = new PrismaClient()

export async function storeUserTokens(userId: string, tokens: WhopOAuthToken) {
  // Minimal placeholder: store in Notification table not appropriate; extend schema later if needed
  // For now, stub storage as a no-op with TODO to persist securely (encrypted)
  return { userId, tokens }
}


