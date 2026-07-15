import { NextResponse } from 'next/server';
import { sql, garantirTabela } from '@/lib/db';
import { getServico, formatarPreco } from '@/lib/servicos';
import { gerarHorariosDisponiveis, diaFunciona } from '@/lib/slots';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
  }

  const { servicoId, data, horaInicio, clienteNome, clienteTelefone, petNome } = body || {};

  const servico = getServico(servicoId);
  if (
    !servico ||
    !data ||
    !horaInicio ||
    !clienteNome?.trim() ||
    !clienteTelefone?.trim() ||
    !petNome?.trim()
  ) {
    return NextResponse.json({ erro: 'Preencha todos os campos para agendar.' }, { status: 400 });
  }

  if (!diaFunciona(data)) {
    return NextResponse.json(
      { erro: 'Não atendemos nessa data. Escolha um dia de segunda a sexta.' },
      { status: 400 }
    );
  }

  try {
    await garantirTabela();

    // Revalida disponibilidade no servidor para evitar dois clientes
    // reservando o mesmo horário ao mesmo tempo.
    const rows = await sql`
      SELECT hora_inicio, hora_fim FROM agendamentos
      WHERE data = ${data} AND status != 'cancelado'
    `;

    const disponiveis = gerarHorariosDisponiveis({
      dataISO: data,
      duracaoMin: servico.duracaoMin,
      agendamentosExistentes: rows,
    });

    const slot = disponiveis.find((h) => h.inicio === horaInicio);
    if (!slot) {
      return NextResponse.json(
        { erro: 'Esse horário acabou de ficar indisponível. Escolha outro horário.' },
        { status: 409 }
      );
    }

    await sql`
      INSERT INTO agendamentos
        (servico_id, servico_nome, data, hora_inicio, hora_fim, duracao_minutos, preco, cliente_nome, cliente_telefone, pet_nome)
      VALUES
        (${servico.id}, ${servico.nome}, ${data}, ${slot.inicio}, ${slot.fim}, ${servico.duracaoMin}, ${servico.preco}, ${clienteNome.trim()}, ${clienteTelefone.trim()}, ${petNome.trim()})
    `;

    return NextResponse.json({
      sucesso: true,
      resumo: {
        servico: servico.nome,
        preco: formatarPreco(servico.preco),
        data,
        horaInicio: slot.inicio,
        horaFim: slot.fim,
      },
    });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json(
      { erro: 'Não foi possível concluir o agendamento agora. Tente novamente em instantes.' },
      { status: 500 }
    );
  }
}
