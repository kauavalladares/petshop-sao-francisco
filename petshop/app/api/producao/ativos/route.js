import { NextResponse } from 'next/server';
import { sql, garantirTabela } from '@/lib/db';

export async function GET() {
  try {
    await garantirTabela();
    const rows = await sql`
      SELECT id, cliente_nome, servico_nome, quantidade_total, quantidade_usada, valor_total
      FROM pacotes
      WHERE status = 'ativo'
      ORDER BY criado_em DESC
    `;
    return NextResponse.json({ pacotes: rows });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível carregar os pacotes.' }, { status: 500 });
  }
}
