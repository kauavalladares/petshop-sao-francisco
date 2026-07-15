import {
  DIAS_FUNCIONAMENTO,
  PERIODOS,
  INTERVALO_SLOT_MIN,
  ANTECEDENCIA_MIN_MESMO_DIA,
} from './horario';

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(totalMin) {
  const h = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const m = String(totalMin % 60).padStart(2, '0');
  return `${h}:${m}`;
}

// dataISO no formato "YYYY-MM-DD"
export function diaFunciona(dataISO) {
  const data = new Date(`${dataISO}T12:00:00`);
  return DIAS_FUNCIONAMENTO.includes(data.getDay());
}

export function gerarHorariosDisponiveis({ dataISO, duracaoMin, agendamentosExistentes = [] }) {
  if (!diaFunciona(dataISO)) return [];

  const ocupados = agendamentosExistentes.map((a) => ({
    inicio: toMinutes(a.hora_inicio),
    fim: toMinutes(a.hora_fim),
  }));

  const agora = new Date();
  const hojeISO = agora.toISOString().slice(0, 10);
  const isHoje = dataISO === hojeISO;
  const agoraMin = agora.getHours() * 60 + agora.getMinutes();

  const disponiveis = [];

  for (const periodo of PERIODOS) {
    const inicioPeriodo = toMinutes(periodo.inicio);
    const fimPeriodo = toMinutes(periodo.fim);

    for (
      let inicio = inicioPeriodo;
      inicio + duracaoMin <= fimPeriodo;
      inicio += INTERVALO_SLOT_MIN
    ) {
      const fim = inicio + duracaoMin;

      if (isHoje && inicio < agoraMin + ANTECEDENCIA_MIN_MESMO_DIA) continue;

      const conflita = ocupados.some((o) => inicio < o.fim && fim > o.inicio);
      if (!conflita) {
        disponiveis.push({ inicio: toHHMM(inicio), fim: toHHMM(fim) });
      }
    }
  }

  return disponiveis;
}
