import { NextResponse } from 'next/server';
import { sql, garantirTabela } from '@/lib/db';

export async function GET(request) {
  try {
    await garantirTabela();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let rows;
    if (status) {
      rows = await sql`
        SELECT * FROM pacotes WHERE status = ${status} ORDER BY criado_em DESC
      `;
    } else {
      rows = await sql`
        SELECT * FROM pacotes ORDER BY criado_em DESC LIMIT 200
      `;
    }

    return NextResponse.json({ pacotes: rows });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível carregar os pacotes.' }, { status: 500 });
  }
}

// Venda de um novo pacote
export async function POST(request) {
  try {
    const body = await request.json();
    const { clienteNome, clienteTelefone, servicoNome, quantidadeTotal, valorTotal, dataVenda, pago } = body || {};

    const quantidade = Number(quantidadeTotal);
    const valor = Number(valorTotal);

    if (!clienteNome?.trim() || !servicoNome?.trim() || !dataVenda || !Number.isInteger(quantidade) || quantidade < 1) {
      return NextResponse.json({ erro: 'Preencha cliente, serviço, quantidade e a data da venda.' }, { status: 400 });
    }
    if (Number.isNaN(valor) || valor < 0) {
      return NextResponse.json({ erro: 'Valor inválido.' }, { status: 400 });
    }

    await garantirTabela();
    await sql`
      INSERT INTO pacotes
        (cliente_nome, cliente_telefone, servico_nome, quantidade_total, valor_total, pago, data_pagamento, data_venda)
      VALUES
        (${clienteNome.trim()}, ${clienteTelefone?.trim() || null}, ${servicoNome.trim()}, ${quantidade}, ${valor},
         ${Boolean(pago)}, ${pago ? dataVenda : null}, ${dataVenda})
    `;

    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível registrar o pacote.' }, { status: 500 });
  }
}

// Suporta:
// { id, marcarPago: true }         -> marca como pago hoje
// { id, status: 'cancelado' }      -> cancela o pacote
// { id, campos: {...} }            -> edição completa
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, marcarPago, status, campos } = body || {};

    if (!id) {
      return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
    }

    await garantirTabela();

    if (marcarPago) {
      const hojeISO = new Date().toISOString().slice(0, 10);
      await sql`UPDATE pacotes SET pago = true, data_pagamento = ${hojeISO} WHERE id = ${id}`;
      return NextResponse.json({ sucesso: true });
    }

    if (campos) {
      const { clienteNome, clienteTelefone, servicoNome, quantidadeTotal, valorTotal, dataVenda } = campos;
      const quantidade = Number(quantidadeTotal);
      const valor = Number(valorTotal);

      if (!clienteNome?.trim() || !servicoNome?.trim() || !dataVenda || !Number.isInteger(quantidade) || quantidade < 1) {
        return NextResponse.json({ erro: 'Preencha cliente, serviço, quantidade e a data da venda.' }, { status: 400 });
      }
      if (Number.isNaN(valor) || valor < 0) {
        return NextResponse.json({ erro: 'Valor inválido.' }, { status: 400 });
      }

      await sql`
        UPDATE pacotes SET
          cliente_nome = ${clienteNome.trim()},
          cliente_telefone = ${clienteTelefone?.trim() || null},
          servico_nome = ${servicoNome.trim()},
          quantidade_total = ${quantidade},
          valor_total = ${valor},
          data_venda = ${dataVenda}
        WHERE id = ${id}
      `;
      return NextResponse.json({ sucesso: true });
    }

    if (status && ['ativo', 'finalizado', 'cancelado'].includes(status)) {
      await sql`UPDATE pacotes SET status = ${status} WHERE id = ${id}`;
      return NextResponse.json({ sucesso: true });
    }

    return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível atualizar o pacote.' }, { status: 500 });
  }
}
