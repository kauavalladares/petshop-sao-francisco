import { NextResponse } from 'next/server';
import { sql, garantirTabela } from '@/lib/db';

function toMinutos(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
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

// Cadastro manual: cliente que chega na loja sem ter agendado pelo site.
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
    } = body || {};

    if (!servicoNome?.trim() || !data || !horaInicio || !horaFim || !petNome?.trim() || preco === undefined || preco === null) {
      return NextResponse.json({ erro: 'Preencha serviço, valor, data, horário e o nome do pet.' }, { status: 400 });
    }

    const precoNumero = Number(preco);
    if (Number.isNaN(precoNumero) || precoNumero < 0) {
      return NextResponse.json({ erro: 'Valor inválido.' }, { status: 400 });
    }

    const duracaoMinutos = Math.max(1, toMinutos(horaFim) - toMinutos(horaInicio));

    await garantirTabela();
    await sql`
      INSERT INTO agendamentos
        (servico_id, servico_nome, data, hora_inicio, hora_fim, duracao_minutos, preco, cliente_nome, cliente_telefone, pet_nome, status, origem)
      VALUES
        ('manual', ${servicoNome.trim()}, ${data}, ${horaInicio}, ${horaFim}, ${duracaoMinutos}, ${precoNumero},
         ${clienteNome?.trim() || 'Cliente balcão'}, ${clienteTelefone?.trim() || '-'}, ${petNome.trim()},
         ${status || 'concluido'}, 'manual')
    `;

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

      return NextResponse.json({ sucesso: true });
    }

    if (!status || !['confirmado', 'concluido', 'cancelado'].includes(status)) {
      return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
    }
    await sql`UPDATE agendamentos SET status = ${status} WHERE id = ${id}`;
    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Não foi possível atualizar o agendamento.' }, { status: 500 });
  }
}
