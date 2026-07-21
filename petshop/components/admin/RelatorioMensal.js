'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatarPreco } from '@/lib/servicos';

const MESES_LABEL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function segundaFeiraDe(date) {
  const dia = date.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const seg = new Date(date);
  seg.setDate(date.getDate() + diff);
  seg.setHours(0, 0, 0, 0);
  return seg;
}

function formatarDataCurta(iso) {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

export default function RelatorioMensal() {
  const [mesVisivel, setMesVisivel] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const [agendamentos, setAgendamentos] = useState([]);
  const [pacotes, setPacotes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const ano = mesVisivel.getFullYear();
  const mes = mesVisivel.getMonth();
  const inicioMes = useMemo(() => toISO(new Date(ano, mes, 1)), [ano, mes]);
  const fimMes = useMemo(() => toISO(new Date(ano, mes + 1, 0)), [ano, mes]);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    Promise.all([
      fetch(`/api/admin/agendamentos?inicio=${inicioMes}&fim=${fimMes}`).then((r) => r.json()),
      fetch('/api/admin/pacotes').then((r) => r.json()),
    ])
      .then(([dadosAgendamentos, dadosPacotes]) => {
        if (cancelado) return;
        if (dadosAgendamentos.erro) {
          setErro(dadosAgendamentos.erro);
          return;
        }
        setAgendamentos(dadosAgendamentos.agendamentos || []);
        setPacotes(dadosPacotes.pacotes || []);
      })
      .catch(() => {
        if (!cancelado) setErro('Não foi possível carregar o relatório.');
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [inicioMes, fimMes]);

  const dados = useMemo(() => {
    const validos = agendamentos.filter((a) => a.status !== 'cancelado');

    const pacotesVendidosNoMes = pacotes.filter((p) => {
      const dataVenda = p.data_venda?.slice ? p.data_venda.slice(0, 10) : p.data_venda;
      return dataVenda >= inicioMes && dataVenda <= fimMes && p.status !== 'cancelado';
    });

    const pacotesPagosNoMes = pacotes.filter((p) => {
      if (!p.pago || !p.data_pagamento) return false;
      const dataPag = p.data_pagamento.slice ? p.data_pagamento.slice(0, 10) : p.data_pagamento;
      return dataPag >= inicioMes && dataPag <= fimMes;
    });

    const receitaPacotes = pacotesPagosNoMes.reduce((s, p) => s + Number(p.valor_total), 0);
    const receitaAvulsa = validos.reduce((s, a) => s + Number(a.preco), 0);
    const totalMes = receitaAvulsa + receitaPacotes;

    // Por serviço
    const porServicoMap = new Map();
    for (const a of validos) {
      const atual = porServicoMap.get(a.servico_nome) || { count: 0, total: 0 };
      atual.count += 1;
      atual.total += Number(a.preco);
      porServicoMap.set(a.servico_nome, atual);
    }
    const porServico = Array.from(porServicoMap.entries())
      .map(([servico, v]) => ({ servico, ...v }))
      .sort((a, b) => b.total - a.total);

    // Por semana (agrupando pela segunda-feira da semana)
    const porSemanaMap = new Map();
    function somarNaSemana(dataStr, valor) {
      const dataObj = new Date(`${dataStr}T12:00:00`);
      const segunda = segundaFeiraDe(dataObj);
      const chave = toISO(segunda);
      const atual = porSemanaMap.get(chave) || { count: 0, total: 0 };
      atual.count += 1;
      atual.total += valor;
      porSemanaMap.set(chave, atual);
    }
    for (const a of validos) {
      const dataStr = a.data?.slice ? a.data.slice(0, 10) : a.data;
      somarNaSemana(dataStr, Number(a.preco));
    }
    for (const p of pacotesPagosNoMes) {
      const dataStr = p.data_pagamento.slice ? p.data_pagamento.slice(0, 10) : p.data_pagamento;
      somarNaSemana(dataStr, Number(p.valor_total));
    }
    const porSemana = Array.from(porSemanaMap.entries())
      .map(([segunda, v]) => ({ segunda, ...v }))
      .sort((a, b) => (a.segunda < b.segunda ? -1 : 1));

    return {
      totalMes,
      receitaAvulsa,
      receitaPacotes,
      totalAtendimentos: validos.length,
      porServico,
      porSemana,
      pacotesVendidosCount: pacotesVendidosNoMes.length,
      pacotesPagosCount: pacotesPagosNoMes.length,
    };
  }, [agendamentos, pacotes, inicioMes, fimMes]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => setMesVisivel(new Date(ano, mes - 1, 1))}
          className="w-9 h-9 rounded-full border border-cream-line flex items-center justify-center hover:border-clay-500 focus-ring"
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <p className="font-display text-lg text-teal-900">
          {MESES_LABEL[mes]} {ano}
        </p>
        <button
          type="button"
          onClick={() => setMesVisivel(new Date(ano, mes + 1, 1))}
          className="w-9 h-9 rounded-full border border-cream-line flex items-center justify-center hover:border-clay-500 focus-ring"
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      {carregando && <p className="text-ink/60">Carregando…</p>}
      {erro && <p className="text-clay-600">{erro}</p>}

      {!carregando && !erro && (
        <div className="grid gap-8">
          {/* TOTAL DO MÊS */}
          <div className="bg-teal-900 text-cream-soft rounded-2xl p-6">
            <p className="font-display text-sm uppercase tracking-wide text-cream-soft/70 mb-1">
              Faturamento do mês
            </p>
            <p className="font-display text-4xl">{formatarPreco(dados.totalMes)}</p>
            <p className="text-sm text-cream-soft/70 mt-2">
              {dados.totalAtendimentos} {dados.totalAtendimentos === 1 ? 'atendimento' : 'atendimentos'}
              {dados.receitaPacotes > 0 && (
                <> · inclui {formatarPreco(dados.receitaPacotes)} de pacotes pagos neste mês</>
              )}
            </p>
          </div>

          {/* POR SERVIÇO */}
          <div>
            <p className="font-display text-lg text-teal-900 mb-3">Por serviço</p>
            {dados.porServico.length === 0 && dados.pacotesVendidosCount === 0 ? (
              <p className="text-sm text-ink/60">Nenhum atendimento neste mês.</p>
            ) : (
              <div className="bg-white rounded-2xl shadow-soft divide-y divide-cream-line">
                {dados.porServico.map((s) => (
                  <div key={s.servico} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="font-display text-teal-900">{s.servico}</p>
                      <p className="text-xs text-ink/50">
                        {s.count} {s.count === 1 ? 'atendimento' : 'atendimentos'}
                      </p>
                    </div>
                    <p className="font-display text-clay-500">{formatarPreco(s.total)}</p>
                  </div>
                ))}
                {dados.pacotesVendidosCount > 0 && (
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="font-display text-teal-900">Pacotes</p>
                      <p className="text-xs text-ink/50">
                        {dados.pacotesVendidosCount} {dados.pacotesVendidosCount === 1 ? 'vendido' : 'vendidos'} neste mês
                        {dados.pacotesPagosCount > 0 && ` · ${dados.pacotesPagosCount} recebido(s) neste mês`}
                      </p>
                    </div>
                    <p className="font-display text-clay-500">{formatarPreco(dados.receitaPacotes)}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* POR SEMANA */}
          <div>
            <p className="font-display text-lg text-teal-900 mb-3">Por semana</p>
            {dados.porSemana.length === 0 ? (
              <p className="text-sm text-ink/60">Sem movimento neste mês.</p>
            ) : (
              <div className="bg-white rounded-2xl shadow-soft divide-y divide-cream-line">
                {dados.porSemana.map((s) => {
                  const fimSemana = new Date(`${s.segunda}T12:00:00`);
                  fimSemana.setDate(fimSemana.getDate() + 4);
                  return (
                    <div key={s.segunda} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <p className="font-display text-teal-900">
                          {formatarDataCurta(s.segunda)} a {formatarDataCurta(toISO(fimSemana))}
                        </p>
                        <p className="text-xs text-ink/50">
                          {s.count} {s.count === 1 ? 'registro' : 'registros'}
                        </p>
                      </div>
                      <p className="font-display text-clay-500">{formatarPreco(s.total)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
