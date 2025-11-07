import { NextResponse } from 'next/server';
import { env } from '@/src/config/env';

export async function GET() {
  // TODO: добавить реальную авторизацию Whop SDK при необходимости
  const baseUrl = env.APP_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000';
  const redirectUrl = `${baseUrl}/views/dashboard`;
  return NextResponse.redirect(redirectUrl);
}