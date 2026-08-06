import { NextResponse } from 'next/server';
import { sql, garantirTabela } from '@/lib/db';

export async function GET(request) {
  try {
    await garantirTabela();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ativo';

    let rows;
    if (status === 'todos') {
      rows = await sql`
        SELECT id, cliente_nome, servico_nome, quantidade_total, quantidade_usada, valor_total, status, pago, data_pagamento
        FROM pacotes
        ORDER BY criado_em DESC
      `;
    } else {
      rows = await sql`
        SELECT id, cliente_nome, servico_nome, quantidade_total, quantidade_usada, valor_total, status, pago, data_pagamento
        FROM pacotes
        WHERE status = ${status}
        ORDER BY criado_em DESC
      `;
    }

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
    const { clienteNome, clienteTelefone, servicoNome, quantidadeTotal, valorTotal, pago } = body || {};

    const quantidade = Number(quantidadeTotal);
    const valor = Number(valorTotal);

    if (!clienteNome?.trim() || !servicoNome?.trim() || !Number.isInteger(quantidade) || quantidade < 1) {
      return NextResponse.json({ erro: 'Preencha cliente, serviço e quantidade.' }, { status: 400 });
    }
    if (Number.isNaN(valor) || valor < 0) {
      return NextResponse.json({ erro: 'Valor inválido.' }, { status: 400 });
    }

    const hojeISO = new Date().toISOString().slice(0, 10);

    await garantirTabela();
    await sql`
      INSERT INTO pacotes (cliente_nome, cliente_telefone, servico_nome, quantidade_total, valor_total, pago, data_pagamento)
      VALUES (${clienteNome.trim()}, ${clienteTelefone?.trim() || null}, ${servicoNome.trim()}, ${quantidade}, ${valor},
              ${Boolean(pago)}, ${pago ? hojeISO : null})
    `;

    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível registrar o pacote.' }, { status: 500 });
  }
}

// Marca um pacote como pago na data de hoje.
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, marcarPago } = body || {};

    if (!id || !marcarPago) {
      return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
    }

    const hojeISO = new Date().toISOString().slice(0, 10);

    await garantirTabela();
    await sql`UPDATE pacotes SET pago = true, data_pagamento = ${hojeISO} WHERE id = ${id}`;

    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível atualizar o pacote.' }, { status: 500 });
  }
}

