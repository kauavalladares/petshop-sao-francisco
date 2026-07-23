import { NextResponse } from 'next/server';
import { sql, garantirTabela } from '@/lib/db';

function toMinutos(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

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

// Cadastro manual: cliente que chega na loja sem ter agendado pelo site,
// ou usando uma sessão de um pacote já contratado (pacoteId).
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      servicoNome,
      preco,
      data,
      horaInicio,
      horaFim,
      clienteNome,
      clienteTelefone,
      petNome,
      status,
      pacoteId,
    } = body || {};

    if (!servicoNome?.trim() || !data || !horaInicio || !horaFim || !petNome?.trim()) {
      return NextResponse.json({ erro: 'Preencha serviço, data, horário e o nome do pet.' }, { status: 400 });
    }

    let precoNumero = 0;
    if (!pacoteId) {
      precoNumero = Number(preco);
      if (preco === undefined || preco === null || Number.isNaN(precoNumero) || precoNumero < 0) {
        return NextResponse.json({ erro: 'Valor inválido.' }, { status: 400 });
      }
    }

    const duracaoMinutos = Math.max(1, toMinutos(horaFim) - toMinutos(horaInicio));
    const origem = pacoteId ? 'pacote' : 'manual';

    await garantirTabela();
    await sql`
      INSERT INTO agendamentos
        (servico_id, servico_nome, data, hora_inicio, hora_fim, duracao_minutos, preco, cliente_nome, cliente_telefone, pet_nome, status, origem, pacote_id)
      VALUES
        ('manual', ${servicoNome.trim()}, ${data}, ${horaInicio}, ${horaFim}, ${duracaoMinutos}, ${precoNumero},
         ${clienteNome?.trim() || 'Cliente balcão'}, ${clienteTelefone?.trim() || '-'}, ${petNome.trim()},
         ${status || 'concluido'}, ${origem}, ${pacoteId || null})
    `;

    if (pacoteId) {
      await ajustarUsoPacote(pacoteId, 1);
    }

    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível salvar o agendamento.' }, { status: 500 });
  }
}

// Suporta dois formatos:
// { id, status }                  -> troca rápida de status (botões Concluir/Cancelar)
// { id, campos: {...} }           -> edição completa (valores, horário, dados do cliente etc.)
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, campos, status } = body || {};

    if (!id) {
      return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
    }

    await garantirTabela();

    if (campos) {
      const {
        servicoNome,
        preco,
        data,
        horaInicio,
        horaFim,
        clienteNome,
        clienteTelefone,
        petNome,
        status: statusCampo,
      } = campos;

      if (
        !servicoNome?.trim() ||
        !data ||
        !horaInicio ||
        !horaFim ||
        !petNome?.trim() ||
        preco === undefined ||
        preco === null ||
        !['confirmado', 'concluido', 'cancelado'].includes(statusCampo)
      ) {
        return NextResponse.json({ erro: 'Preencha todos os campos obrigatórios.' }, { status: 400 });
      }

      const precoNumero = Number(preco);
      if (Number.isNaN(precoNumero) || precoNumero < 0) {
        return NextResponse.json({ erro: 'Valor inválido.' }, { status: 400 });
      }

      const duracaoMinutos = Math.max(1, toMinutos(horaFim) - toMinutos(horaInicio));

      const atuais = await sql`SELECT status, pacote_id FROM agendamentos WHERE id = ${id}`;
      const atual = atuais[0];

      await sql`
        UPDATE agendamentos SET
          servico_nome = ${servicoNome.trim()},
          preco = ${precoNumero},
          data = ${data},
          hora_inicio = ${horaInicio},
          hora_fim = ${horaFim},
          duracao_minutos = ${duracaoMinutos},
          cliente_nome = ${clienteNome?.trim() || 'Cliente balcão'},
          cliente_telefone = ${clienteTelefone?.trim() || '-'},
          pet_nome = ${petNome.trim()},
          status = ${statusCampo}
        WHERE id = ${id}
      `;

      if (atual?.pacote_id) {
        const eraCancelado = atual.status === 'cancelado';
        const vaiCancelar = statusCampo === 'cancelado';
        if (!eraCancelado && vaiCancelar) await ajustarUsoPacote(atual.pacote_id, -1);
        if (eraCancelado && !vaiCancelar) await ajustarUsoPacote(atual.pacote_id, 1);
      }

      return NextResponse.json({ sucesso: true });
    }

    if (!status || !['confirmado', 'concluido', 'cancelado'].includes(status)) {
      return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
    }

    const atuais = await sql`SELECT status, pacote_id FROM agendamentos WHERE id = ${id}`;
    const atual = atuais[0];

    await sql`UPDATE agendamentos SET status = ${status} WHERE id = ${id}`;

    if (atual?.pacote_id) {
      const eraCancelado = atual.status === 'cancelado';
      const vaiCancelar = status === 'cancelado';
      if (!eraCancelado && vaiCancelar) await ajustarUsoPacote(atual.pacote_id, -1);
      if (eraCancelado && !vaiCancelar) await ajustarUsoPacote(atual.pacote_id, 1);
    }

    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível atualizar o agendamento.' }, { status: 500 });
  }
}

// Exclusão definitiva (some da lista e dos relatórios). Se a sessão fazia
// parte de um pacote e ainda não estava cancelada, devolve o crédito.
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
    }

    await garantirTabela();

    const atuais = await sql`SELECT status, pacote_id FROM agendamentos WHERE id = ${id}`;
    const atual = atuais[0];

    await sql`DELETE FROM agendamentos WHERE id = ${id}`;

    if (atual?.pacote_id && atual.status !== 'cancelado') {
      await ajustarUsoPacote(atual.pacote_id, -1);
    }

    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível excluir o agendamento.' }, { status: 500 });
  }
}
