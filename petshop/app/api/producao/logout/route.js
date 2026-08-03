import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ sucesso: true });
  response.cookies.set('producao_session', '', { path: '/', maxAge: 0 });
  return response;
}
