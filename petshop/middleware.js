import { NextResponse } from 'next/server';

function autenticado(request, cookieName, senhaEnv) {
  const cookie = request.cookies.get(cookieName);
  const senhaCorreta = process.env[senhaEnv];
  return Boolean(cookie && cookie.value && senhaCorreta && cookie.value === senhaCorreta);
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const ehProducao = pathname.startsWith('/producao') || pathname.startsWith('/api/producao');

  const ok = ehProducao
    ? autenticado(request, 'producao_session', 'FUNCIONARIO_PASSWORD')
    : autenticado(request, 'admin_session', 'ADMIN_PASSWORD');

  if (!ok) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL(ehProducao ? '/producao' : '/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/painel/:path*',
    '/api/admin/agendamentos/:path*',
    '/api/admin/pacotes/:path*',
    '/producao/painel/:path*',
    '/api/producao/registros/:path*',
    '/api/producao/pacotes-ativos/:path*',
  ],
};
