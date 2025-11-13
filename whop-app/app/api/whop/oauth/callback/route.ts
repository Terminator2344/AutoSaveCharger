import { NextRequest, NextResponse } from 'next/server'
import { exchangeOAuthCodeForToken } from '@/services/whop'
import { storeUserTokens } from '@/services/auth'

