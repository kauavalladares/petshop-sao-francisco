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

// Permite cadastrar um novo pacote direto pelo painel de produção, sem
// precisar acessar o painel da loja.
export async function POST(request) {
  try {
    const body = await request.json();
    const { clienteNome, clienteTelefone, servicoNome, quantidadeTotal, valorTotal } = body || {};

    const quantidade = Number(quantidadeTotal);
    const valor = Number(valorTotal);

    if (!clienteNome?.trim() || !servicoNome?.trim() || !Number.isInteger(quantidade) || quantidade < 1) {
      return NextResponse.json({ erro: 'Preencha cliente, serviço e quantidade.' }, { status: 400 });
    }
    if (Number.isNaN(valor) || valor < 0) {
      return NextResponse.json({ erro: 'Valor inválido.' }, { status: 400 });
    }

    await garantirTabela();
    await sql`
      INSERT INTO pacotes (cliente_nome, cliente_telefone, servico_nome, quantidade_total, valor_total)
      VALUES (${clienteNome.trim()}, ${clienteTelefone?.trim() || null}, ${servicoNome.trim()}, ${quantidade}, ${valor})
    `;

    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível registrar o pacote.' }, { status: 500 });
  }
}

