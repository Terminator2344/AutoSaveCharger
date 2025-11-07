import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: добавить реальную авторизацию Whop SDK при необходимости
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  const redirectUrl = `${baseUrl}/views/dashboard`;
  return NextResponse.redirect(redirectUrl);
}