import { NextResponse } from 'next/server';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
  }

  const { senha } = body || {};
  const senhaCorreta = process.env.ADMIN_PASSWORD;

  if (!senhaCorreta) {
    return NextResponse.json(
      { erro: 'O painel ainda não foi configurado. Defina a variável ADMIN_PASSWORD no ambiente.' },
      { status: 500 }
    );
  }

  if (senha && senha === senhaCorreta) {
    const response = NextResponse.json({ sucesso: true });
    response.cookies.set('admin_session', senhaCorreta, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 horas
    });
    return response;
  }

  return NextResponse.json({ erro: 'Senha incorreta.' }, { status: 401 });
}
