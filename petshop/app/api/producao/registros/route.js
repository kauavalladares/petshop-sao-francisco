import { NextResponse } from 'next/server';
import { sql, garantirTabela } from '@/lib/db';
import { calcularComissao } from '@/lib/comissao';

export async function GET(request) {
  try {
    await garantirTabela();
    const { searchParams } = new URL(request.url);
    const inicio = searchParams.get('inicio');
    const fim = searchParams.get('fim');

    let rows;
    if (inicio && fim) {
      rows = await sql`
        SELECT * FROM producoes
        WHERE data BETWEEN ${inicio} AND ${fim}
        ORDER BY data DESC, criado_em DESC
      `;
    } else {
      rows = await sql`
        SELECT * FROM producoes
        ORDER BY data DESC, criado_em DESC
        LIMIT 500
      `;
    }

    return NextResponse.json({ registros: rows });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível carregar os registros.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { servicoNome, valorServico, data, observacao } = body || {};

    const valorServicoNumero = Number(valorServico);
    if (!servicoNome?.trim() || !data || Number.isNaN(valorServicoNumero) || valorServicoNumero < 0) {
      return NextResponse.json({ erro: 'Preencha o serviço, o valor e a data.' }, { status: 400 });
    }

    const valorComissao = calcularComissao(valorServicoNumero);

    await garantirTabela();
    await sql`
      INSERT INTO producoes (servico_nome, valor_servico, valor_comissao, data, observacao)
      VALUES (${servicoNome.trim()}, ${valorServicoNumero}, ${valorComissao}, ${data}, ${observacao?.trim() || null})
    `;

    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível salvar o registro.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
    }

    await garantirTabela();
    await sql`DELETE FROM producoes WHERE id = ${id}`;

    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível excluir o registro.' }, { status: 500 });
  }
}
