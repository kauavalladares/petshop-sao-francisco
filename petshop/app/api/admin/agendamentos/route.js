import { NextResponse } from 'next/server';
import { garantirTabela } from '@/lib/db';
import { listarPacotes, criarPacote, marcarPacotePago, excluirPacote } from '@/lib/pacotes';

export async function GET(request) {
  try {
    await garantirTabela();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ativo';

    const rows = status === 'todos' ? await listarPacotes({}) : await listarPacotes({ status });
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
    await garantirTabela();

    const resultado = await criarPacote(body || {});
    if (resultado.erro) {
      return NextResponse.json({ erro: resultado.erro }, { status: 400 });
    }
    return NextResponse.json(resultado);
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

    await garantirTabela();
    return NextResponse.json(await marcarPacotePago(id));
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível atualizar o pacote.' }, { status: 500 });
  }
}

// Exclui um pacote definitivamente. Registros de produção que já usaram uma
// sessão desse pacote são mantidos (o histórico de comissão dela não some),
// só perdem o vínculo com o pacote apagado.
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
    }

    await garantirTabela();
    return NextResponse.json(await excluirPacote(id));
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível excluir o pacote.' }, { status: 500 });
  }
}
