'use client';

import { useEffect, useState } from 'react';

const PX_POR_MIN = 1.3;
const INICIO_MIN = 9 * 60; // 09:00
const FIM_MIN = 17 * 60 + 30; // 17:30
const ALTURA_TOTAL = (FIM_MIN - INICIO_MIN) * PX_POR_MIN;
const ALMOCO_INICIO = 12 * 60;
const ALMOCO_FIM = 13 * 60;

const HORAS_LABEL = [];
for (let m = INICIO_MIN; m <= FIM_MIN; m += 60) {
  HORAS_LABEL.push(m);
}

const STATUS_COR = {
  confirmado: 'bg-teal-800 hover:bg-teal-900 text-white border-teal-900',
  concluido: 'bg-moss-500 hover:bg-moss-600 text-white border-moss-600',
  cancelado: 'bg-cream-line hover:bg-cream-line text-ink/50 border-cream-line line-through',
};

const STATUS_BADGE = {
  confirmado: { texto: 'Confirmado', cor: 'bg-teal-800 text-white' },
  concluido: { texto: 'Concluído', cor: 'bg-moss-500 text-white' },
  cancelado: { texto: 'Cancelado', cor: 'bg-cream-line text-ink/50 line-through' },
};

const STATUS_BORDA_CARD = {
  confirmado: 'border-teal-800',
  concluido: 'border-moss-500',
  cancelado: 'border-cream-line',
};

function toMinutos(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(totalMin) {
  const h = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const m = String(totalMin % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DIA_LABEL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MES_LABEL = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function AgendaSemanal({
  inicioSemana,
  agendamentos,
  carregando,
  hojeISO,
  onNavegar,
  onSelecionar,
  onNovo,
}) {
  const dias = [0, 1, 2, 3, 4].map((i) => {
    const d = new Date(inicioSemana);
    d.setDate(inicioSemana.getDate() + i);
    return d;
  });

  const porDia = dias.map((d) => {
    const iso = toISO(d);
    return {
      data: d,
      iso,
      itens: agendamentos
        .filter((a) => {
          const chave = typeof a.data === 'string' ? a.data.slice(0, 10) : toISO(new Date(a.data));
          return chave === iso;
        })
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
    };
  });

  // Visão mobile: um dia por vez. Ao trocar de semana, volta para hoje
  // (se a semana contiver hoje) ou para segunda-feira.
  const [diaSelecionadoIdx, setDiaSelecionadoIdx] = useState(0);
  useEffect(() => {
    let idx = 0;
    for (let i = 0; i < 5; i++) {
      const d = new Date(inicioSemana);
      d.setDate(inicioSemana.getDate() + i);
      if (toISO(d) === hojeISO) {
        idx = i;
        break;
      }
    }
    setDiaSelecionadoIdx(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicioSemana, hojeISO]);

  function cliqueColuna(e, iso) {
    if (e.target !== e.currentTarget) return; // clicou em um evento, não no fundo
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    let minutos = INICIO_MIN + offsetY / PX_POR_MIN;
    minutos = Math.round(minutos / 20) * 20;
    minutos = Math.min(Math.max(minutos, INICIO_MIN), FIM_MIN - 20);
    onNovo(iso, toHHMM(minutos));
  }

  const diaMobile = porDia[diaSelecionadoIdx];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => onNavegar(-1)}
          className="w-9 h-9 rounded-full border border-cream-line flex items-center justify-center hover:border-clay-500 focus-ring"
          aria-label="Semana anterior"
        >
          ‹
        </button>
        <p className="font-display text-teal-900">
          {dias[0].getDate()} {MES_LABEL[dias[0].getMonth()]} – {dias[4].getDate()} {MES_LABEL[dias[4].getMonth()]}{' '}
          {dias[4].getFullYear()}
        </p>
        <button
          type="button"
          onClick={() => onNavegar(1)}
          className="w-9 h-9 rounded-full border border-cream-line flex items-center justify-center hover:border-clay-500 focus-ring"
          aria-label="Próxima semana"
        >
          ›
        </button>
      </div>

      {/* ===== VISÃO MOBILE: um dia por vez ===== */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
          {porDia.map(({ data, iso }, i) => {
            const ativo = i === diaSelecionadoIdx;
            const ehHoje = iso === hojeISO;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setDiaSelecionadoIdx(i)}
                className={`shrink-0 flex flex-col items-center rounded-xl px-4 py-2 border-2 transition-colors focus-ring ${
                  ativo
                    ? 'bg-teal-800 border-teal-800 text-white'
                    : ehHoje
                    ? 'border-clay-500 text-teal-900'
                    : 'border-cream-line text-ink/70'
                }`}
              >
                <span className="text-[10px] uppercase font-display tracking-wide">
                  {DIA_LABEL[data.getDay()].slice(0, 3)}
                </span>
                <span className="font-display text-base leading-tight">{data.getDate()}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onNovo(diaMobile.iso, undefined)}
          className="w-full mb-4 bg-clay-500 hover:bg-clay-600 text-white font-display text-sm py-3 rounded-full shadow-soft transition-colors focus-ring"
        >
          + Novo agendamento nesse dia
        </button>

        {carregando && <p className="text-sm text-ink/50 mb-3">Atualizando…</p>}

        {!carregando && diaMobile.itens.length === 0 && (
          <p className="text-sm text-ink/60 bg-white rounded-2xl shadow-soft px-4 py-6 text-center">
            Nenhum agendamento nesse dia.
          </p>
        )}

        <div className="grid gap-2.5">
          {diaMobile.itens.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelecionar(a)}
              className={`w-full text-left bg-white rounded-xl border-l-4 shadow-soft px-4 py-3 flex items-center gap-3 transition-colors focus-ring ${STATUS_BORDA_CARD[a.status] || ''}`}
            >
              <div className="font-display text-teal-900 text-base w-14 shrink-0">
                {a.hora_inicio.slice(0, 5)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-teal-900 truncate">{a.pet_nome}</p>
                <p className="text-xs text-ink/60 truncate">{a.servico_nome}</p>
              </div>
              <span className={`text-[10px] font-display px-2 py-1 rounded-full shrink-0 ${STATUS_BADGE[a.status]?.cor || ''}`}>
                {STATUS_BADGE[a.status]?.texto || a.status}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== VISÃO DESKTOP: grade da semana inteira ===== */}
      <div className="hidden md:block bg-white rounded-2xl shadow-soft p-3 md:p-5 overflow-x-auto">
        <div className="min-w-[640px]">
          {/* cabeçalho dos dias */}
          <div className="grid grid-cols-[52px_repeat(5,1fr)] gap-1 mb-2">
            <div />
            {porDia.map(({ data, iso }) => (
              <div
                key={iso}
                className={`text-center rounded-lg py-1.5 ${iso === hojeISO ? 'bg-clay-100' : ''}`}
              >
                <p className="text-xs text-ink/50 uppercase">{DIA_LABEL[data.getDay()].slice(0, 3)}</p>
                <p className={`font-display text-lg ${iso === hojeISO ? 'text-clay-600' : 'text-teal-900'}`}>
                  {data.getDate()}
                </p>
              </div>
            ))}
          </div>

          {/* grade de horários */}
          <div className="grid grid-cols-[52px_repeat(5,1fr)] gap-1">
            {/* coluna de horas */}
            <div className="relative" style={{ height: ALTURA_TOTAL }}>
              {HORAS_LABEL.map((m) => (
                <div
                  key={m}
                  className="absolute -translate-y-1/2 text-[11px] text-ink/40 pr-1 w-full text-right"
                  style={{ top: (m - INICIO_MIN) * PX_POR_MIN }}
                >
                  {toHHMM(m)}
                </div>
              ))}
            </div>

            {/* colunas dos dias */}
            {porDia.map(({ data, iso, itens }) => (
              <div
                key={iso}
                onClick={(e) => cliqueColuna(e, iso)}
                className="relative rounded-lg bg-cream-soft/60 hover:bg-cream-soft cursor-pointer border border-cream-line"
                style={{ height: ALTURA_TOTAL }}
                title="Clique para lançar um agendamento neste horário"
              >
                {/* linhas de hora */}
                {HORAS_LABEL.map((m) => (
                  <div
                    key={m}
                    className="absolute w-full border-t border-cream-line pointer-events-none"
                    style={{ top: (m - INICIO_MIN) * PX_POR_MIN }}
                  />
                ))}

                {/* faixa do almoço */}
                <div
                  className="absolute w-full pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(40,49,46,0.04)_6px,rgba(40,49,46,0.04)_12px)]"
                  style={{
                    top: (ALMOCO_INICIO - INICIO_MIN) * PX_POR_MIN,
                    height: (ALMOCO_FIM - ALMOCO_INICIO) * PX_POR_MIN,
                  }}
                />

                {itens.map((a) => {
                  const inicio = toMinutos(a.hora_inicio.slice(0, 5));
                  const fim = toMinutos(a.hora_fim.slice(0, 5));
                  const top = (inicio - INICIO_MIN) * PX_POR_MIN;
                  const altura = Math.max((fim - inicio) * PX_POR_MIN, 20);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelecionar(a);
                      }}
                      className={`absolute left-0.5 right-0.5 rounded-md border px-1.5 py-0.5 text-left overflow-hidden focus-ring transition-colors ${STATUS_COR[a.status] || ''}`}
                      style={{ top, height: altura }}
                    >
                      <p className="text-[11px] leading-tight font-display truncate">
                        {a.hora_inicio.slice(0, 5)} · {a.pet_nome}
                      </p>
                      {altura > 30 && (
                        <p className="text-[10px] leading-tight truncate opacity-90">{a.servico_nome}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {carregando && <p className="text-sm text-ink/50 mt-3">Atualizando…</p>}
        <p className="text-xs text-ink/40 mt-3">
          Clique em um horário livre para lançar um agendamento, ou em um bloco já existente para editar.
        </p>
      </div>
    </div>
  );
}
