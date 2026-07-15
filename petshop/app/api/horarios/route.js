import { NextResponse } from 'next/server';
import { sql, garantirTabela } from '@/lib/db';
import { getServico } from '@/lib/servicos';
import { gerarHorariosDisponiveis, diaFunciona } from '@/lib/slots';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dataISO = searchParams.get('data');
  const servicoId = searchParams.get('servico');

  const servico = getServico(servicoId);
  if (!dataISO || !servico) {
    return NextResponse.json({ erro: 'Informe uma data e um serviço válidos.' }, { status: 400 });
  }

  if (!diaFunciona(dataISO)) {
    return NextResponse.json({ horarios: [], motivo: 'fechado' });
  }

  try {
    await garantirTabela();
    const rows = await sql`
      SELECT hora_inicio, hora_fim FROM agendamentos
      WHERE data = ${dataISO} AND status != 'cancelado'
    `;

    const horarios = gerarHorariosDisponiveis({
      dataISO,
      duracaoMin: servico.duracaoMin,
      agendamentosExistentes: rows,
    });

    return NextResponse.json({ horarios });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json(
      { erro: 'Não foi possível consultar os horários agora. Tente novamente em instantes.' },
      { status: 500 }
    );
  }
}
