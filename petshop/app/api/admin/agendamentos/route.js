import { NextResponse } from 'next/server';
import { sql, garantirTabela } from '@/lib/db';

export async function GET(request) {
  try {
    await garantirTabela();
    const { searchParams } = new URL(request.url);
    const inicio = searchParams.get('inicio');
    const fim = searchParams.get('fim');

    let rows;
    if (inicio && fim) {
      rows = await sql`
        SELECT * FROM agendamentos
        WHERE data BETWEEN ${inicio} AND ${fim}
        ORDER BY data ASC, hora_inicio ASC
      `;
    } else {
      rows = await sql`
        SELECT * FROM agendamentos
        WHERE data >= CURRENT_DATE - INTERVAL '1 day'
        ORDER BY data ASC, hora_inicio ASC
        LIMIT 300
      `;
    }

    return NextResponse.json({ agendamentos: rows });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível carregar os agendamentos.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, status } = await request.json();
    if (!id || !['confirmado', 'concluido', 'cancelado'].includes(status)) {
      return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
    }
    await garantirTabela();
    await sql`UPDATE agendamentos SET status = ${status} WHERE id = ${id}`;
    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível atualizar o agendamento.' }, { status: 500 });
  }
}
