
import { NextResponse } from 'next/server';
import { env } from '@/config/env';

export async function GET() {
  // TODO: добавить реальную авторизацию Whop SDK при необходимости
  const redirectUrl = `${env.APP_BASE_URL}/views/dashboard`;
  return NextResponse.redirect(redirectUrl);
}