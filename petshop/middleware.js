import { NextResponse } from 'next/server';

export function middleware(request) {
  const cookie = request.cookies.get('admin_session');
  const autenticado = cookie && cookie.value && cookie.value === process.env.ADMIN_PASSWORD;

  if (!autenticado) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/painel/:path*', '/api/admin/agendamentos/:path*'],
};
