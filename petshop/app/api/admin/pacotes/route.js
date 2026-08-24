import { NextResponse } from 'next/server';
import { garantirTabela } from '@/lib/db';
import {
  listarPacotes,
  criarPacote,
  editarPacote,
  marcarPacotePago,
  atualizarStatusPacote,
  excluirPacote,
} from '@/lib/pacotes';

export async function GET(request) {
  try {
    await garantirTabela();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const rows = await listarPacotes({ status, limit: 200 });
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
      return NextResponse.json(await marcarPacotePago(id));
    }

    if (campos) {
      const resultado = await editarPacote(id, campos);
      if (resultado.erro) {
        return NextResponse.json({ erro: resultado.erro }, { status: 400 });
      }
      return NextResponse.json(resultado);
    }

    if (status) {
      const resultado = await atualizarStatusPacote(id, status);
      if (resultado.erro) {
        return NextResponse.json({ erro: resultado.erro }, { status: 400 });
      }
      return NextResponse.json(resultado);
    }

    return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível atualizar o pacote.' }, { status: 500 });
  }
}

// Exclusão definitiva. Antes só existia no painel de produção — como agora
// a lógica é compartilhada, o admin ganha a mesma capacidade de graça.
// (A tela ainda não tem um botão "Excluir" pra pacotes; se quiser, dá pra
// adicionar em PacotesTab.js do mesmo jeito que já existe em PacotesLista.js.)
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