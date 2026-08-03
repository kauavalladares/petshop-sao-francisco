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

export default function RelatorioProducao() {
  const [mesVisivel, setMesVisivel] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const [registros, setRegistros] = useState([]);
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

    fetch(`/api/producao/registros?inicio=${inicioMes}&fim=${fimMes}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelado) return;
        if (data.erro) {
          setErro(data.erro);
          return;
        }
        setRegistros(data.registros || []);
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
    const totalComissao = registros.reduce((s, r) => s + Number(r.valor_comissao), 0);
    const totalServicos = registros.reduce((s, r) => s + Number(r.valor_servico), 0);

    // Por serviço
    const porServicoMap = new Map();
    for (const r of registros) {
      const atual = porServicoMap.get(r.servico_nome) || { count: 0, comissao: 0 };
      atual.count += 1;
      atual.comissao += Number(r.valor_comissao);
      porServicoMap.set(r.servico_nome, atual);
    }
    const porServico = Array.from(porServicoMap.entries())
      .map(([servico, v]) => ({ servico, ...v }))
      .sort((a, b) => b.comissao - a.comissao);

    // Por semana (agrupando pela segunda-feira da semana)
    const porSemanaMap = new Map();
    for (const r of registros) {
      const dataStr = r.data?.slice ? r.data.slice(0, 10) : r.data;
      const dataObj = new Date(`${dataStr}T12:00:00`);
      const segunda = segundaFeiraDe(dataObj);
      const chave = toISO(segunda);
      const atual = porSemanaMap.get(chave) || { count: 0, comissao: 0 };
      atual.count += 1;
      atual.comissao += Number(r.valor_comissao);
      porSemanaMap.set(chave, atual);
    }
    const porSemana = Array.from(porSemanaMap.entries())
      .map(([segunda, v]) => ({ segunda, ...v }))
      .sort((a, b) => (a.segunda < b.segunda ? -1 : 1));

    return {
      totalComissao,
      totalServicos,
      totalAtendimentos: registros.length,
      porServico,
      porSemana,
    };
  }, [registros]);

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
              Sua parte no mês
            </p>
            <p className="font-display text-4xl">{formatarPreco(dados.totalComissao)}</p>
            <p className="text-sm text-cream-soft/70 mt-2">
              {dados.totalAtendimentos} {dados.totalAtendimentos === 1 ? 'atendimento' : 'atendimentos'} ·
              {' '}{formatarPreco(dados.totalServicos)} em serviços no total
            </p>
          </div>

          {/* POR SERVIÇO */}
          <div>
            <p className="font-display text-lg text-teal-900 mb-3">Por serviço</p>
            {dados.porServico.length === 0 ? (
              <p className="text-sm text-ink/60">Nenhum registro neste mês.</p>
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
                    <p className="font-display text-moss-600">{formatarPreco(s.comissao)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* POR SEMANA */}
          <div>
            <p className="font-display text-lg text-teal-900 mb-3">Por semana</p>
            {dados.porSemana.length === 0 ? (
              <p className="text-sm text-ink/60">Sem registros neste mês.</p>
            ) : (
              <div className="bg-white rounded-2xl shadow-soft divide-y divide-cream-line">
                {dados.porSemana.map((s) => {
                  const fimSemana = new Date(`${s.segunda}T12:00:00`);
                  fimSemana.setDate(fimSemana.getDate() + 6);
                  return (
                    <div key={s.segunda} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <p className="font-display text-teal-900">
                          {formatarDataCurta(s.segunda)} a {formatarDataCurta(toISO(fimSemana))}
                        </p>
                        <p className="text-xs text-ink/50">
                          {s.count} {s.count === 1 ? 'atendimento' : 'atendimentos'}
                        </p>
                      </div>
                      <p className="font-display text-moss-600">{formatarPreco(s.comissao)}</p>
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
