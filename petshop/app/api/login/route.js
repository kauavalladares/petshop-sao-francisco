import { NextResponse } from 'next/server';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
  }

  const { senha } = body || {};
  const senhaCorreta = process.env.FUNCIONARIO_PASSWORD;

  if (!senhaCorreta) {
    return NextResponse.json(
      { erro: 'Essa área ainda não foi configurada. Defina a variável FUNCIONARIO_PASSWORD no ambiente.' },
      { status: 500 }
    );
  }

  if (senha && senha === senhaCorreta) {
    const response = NextResponse.json({ sucesso: true });
    response.cookies.set('producao_session', senhaCorreta, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 dias — uso pessoal e frequente
    });
    return response;
  }

  return NextResponse.json({ erro: 'Senha incorreta.' }, { status: 401 });
}
