import { NextResponse } from 'next/server';
import { sql, garantirTabela } from '@/lib/db';
import { calcularComissao } from '@/lib/comissao';

// Ajusta quantas sessões de um pacote já foram usadas (delta +1 ou -1) e
// mantém o status do pacote em dia ('ativo' <-> 'finalizado').
async function ajustarUsoPacote(pacoteId, delta) {
  const rows = await sql`SELECT quantidade_total, quantidade_usada, status FROM pacotes WHERE id = ${pacoteId}`;
  const pacote = rows[0];
  if (!pacote || pacote.status === 'cancelado') return;
  const novaUsada = Math.max(0, pacote.quantidade_usada + delta);
  const novoStatus = novaUsada >= pacote.quantidade_total ? 'finalizado' : 'ativo';
  await sql`UPDATE pacotes SET quantidade_usada = ${novaUsada}, status = ${novoStatus} WHERE id = ${pacoteId}`;
}

export async function GET(request) {
  try {
    await garantirTabela();
    const { searchParams } = new URL(request.url);
    const inicio = searchParams.get('inicio');
    const fim = searchParams.get('fim');

    const limiteParam = Number(searchParams.get('limite'));
    const limite = [10, 50, 100].includes(limiteParam) ? limiteParam : 50;

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
        LIMIT ${limite}
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
    const { servicoNome, valorServico, data, observacao, pacoteId } = body || {};

    const valorServicoNumero = Number(valorServico);
    if (!servicoNome?.trim() || !data || Number.isNaN(valorServicoNumero) || valorServicoNumero < 0) {
      return NextResponse.json({ erro: 'Preencha o serviço, o valor e a data.' }, { status: 400 });
    }

    const valorComissao = calcularComissao(valorServicoNumero);

    await garantirTabela();
    await sql`
      INSERT INTO producoes (servico_nome, valor_servico, valor_comissao, data, observacao, pacote_id)
      VALUES (${servicoNome.trim()}, ${valorServicoNumero}, ${valorComissao}, ${data}, ${observacao?.trim() || null}, ${pacoteId || null})
    `;

    if (pacoteId) {
      await ajustarUsoPacote(pacoteId, 1);
    }

    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível salvar o registro.' }, { status: 500 });
  }
}

// Edita um registro já lançado. Se ele estiver vinculado a um pacote, o
// serviço e o valor ficam travados (já foram definidos ao usar a sessão do
// pacote) — só data e observação podem ser corrigidas nesse caso.
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, servicoNome, valorServico, data, observacao } = body || {};

    if (!id || !data) {
      return NextResponse.json({ erro: 'Informe a data.' }, { status: 400 });
    }

    await garantirTabela();

    const atuais = await sql`SELECT pacote_id FROM producoes WHERE id = ${id}`;
    const atual = atuais[0];
    if (!atual) {
      return NextResponse.json({ erro: 'Registro não encontrado.' }, { status: 404 });
    }

    if (atual.pacote_id) {
      await sql`
        UPDATE producoes SET data = ${data}, observacao = ${observacao?.trim() || null}
        WHERE id = ${id}
      `;
      return NextResponse.json({ sucesso: true });
    }

    const valorServicoNumero = Number(valorServico);
    if (!servicoNome?.trim() || Number.isNaN(valorServicoNumero) || valorServicoNumero < 0) {
      return NextResponse.json({ erro: 'Preencha o serviço e o valor.' }, { status: 400 });
    }
    const valorComissao = calcularComissao(valorServicoNumero);

    await sql`
      UPDATE producoes SET
        servico_nome = ${servicoNome.trim()},
        valor_servico = ${valorServicoNumero},
        valor_comissao = ${valorComissao},
        data = ${data},
        observacao = ${observacao?.trim() || null}
      WHERE id = ${id}
    `;

    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível atualizar o registro.' }, { status: 500 });
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

    const atuais = await sql`SELECT pacote_id FROM producoes WHERE id = ${id}`;
    const atual = atuais[0];

    await sql`DELETE FROM producoes WHERE id = ${id}`;

    if (atual?.pacote_id) {
      await ajustarUsoPacote(atual.pacote_id, -1);
    }

    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível excluir o registro.' }, { status: 500 });
  }
}