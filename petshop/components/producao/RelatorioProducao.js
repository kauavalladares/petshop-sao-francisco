'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatarPreco } from '@/lib/servicos';

const MESES_LABEL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DIA_SEMANA_LABEL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

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

function fimDaSemana(segundaISO) {
  const d = new Date(`${segundaISO}T12:00:00`);
  d.setDate(d.getDate() + 6);
  return toISO(d);
}

function formatarDataCurta(iso) {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

function formatarDataLonga(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

function formatarDiaComSemana(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  return `${DIA_SEMANA_LABEL[data.getDay()]} ${formatarDataCurta(iso)}`;
}

const PERIODOS = [
  { chave: 'dia', label: 'Diário' },
  { chave: 'semana', label: 'Semanal' },
  { chave: 'mes', label: 'Mensal' },
];

export default function RelatorioProducao() {
  const [periodo, setPeriodo] = useState('mes'); // 'dia' | 'semana' | 'mes'

  const [diaVisivel, setDiaVisivel] = useState(() => toISO(new Date()));
  const [segundaVisivel, setSegundaVisivel] = useState(() => segundaFeiraDe(new Date()));
  const [mesVisivel, setMesVisivel] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });

  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const ano = mesVisivel.getFullYear();
  const mes = mesVisivel.getMonth();

  const range = useMemo(() => {
    if (periodo === 'dia') return { inicio: diaVisivel, fim: diaVisivel };
    if (periodo === 'semana') {
      const ini = toISO(segundaVisivel);
      return { inicio: ini, fim: fimDaSemana(ini) };
    }
    return {
      inicio: toISO(new Date(ano, mes, 1)),
      fim: toISO(new Date(ano, mes + 1, 0)),
    };
  }, [periodo, diaVisivel, segundaVisivel, ano, mes]);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    fetch(`/api/producao/registros?inicio=${range.inicio}&fim=${range.fim}`)
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
  }, [range.inicio, range.fim]);

  const dados = useMemo(() => {
    const totalComissao = registros.reduce((s, r) => s + Number(r.valor_comissao), 0);
    const totalServicos = registros.reduce((s, r) => s + Number(r.valor_servico), 0);

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

    // Quebra por subperíodo: por dia dentro da semana, ou por semana dentro do mês
    let porSubperiodo = [];
    if (periodo === 'semana' || periodo === 'mes') {
      const map = new Map();
      for (const r of registros) {
        const dataStr = r.data?.slice ? r.data.slice(0, 10) : r.data;
        const chave = periodo === 'semana' ? dataStr : toISO(segundaFeiraDe(new Date(`${dataStr}T12:00:00`)));
        const atual = map.get(chave) || { count: 0, comissao: 0 };
        atual.count += 1;
        atual.comissao += Number(r.valor_comissao);
        map.set(chave, atual);
      }
      porSubperiodo = Array.from(map.entries())
        .map(([chave, v]) => ({ chave, ...v }))
        .sort((a, b) => (a.chave < b.chave ? -1 : 1));
    }

    // Ordena os registros do dia por horário de lançamento, mais recente primeiro
    const registrosOrdenados = [...registros].sort((a, b) =>
      a.criado_em < b.criado_em ? 1 : -1
    );

    return {
      totalComissao,
      totalServicos,
      totalAtendimentos: registros.length,
      porServico,
      porSubperiodo,
      registrosOrdenados,
    };
  }, [registros, periodo]);

  const labelPeriodoAtual =
    periodo === 'dia'
      ? formatarDataLonga(diaVisivel)
      : periodo === 'semana'
      ? `${formatarDataCurta(range.inicio)} a ${formatarDataCurta(range.fim)}`
      : `${MESES_LABEL[mes]} ${ano}`;

  function voltarPeriodo() {
    if (periodo === 'dia') {
      const d = new Date(`${diaVisivel}T12:00:00`);
      d.setDate(d.getDate() - 1);
      setDiaVisivel(toISO(d));
    } else if (periodo === 'semana') {
      const d = new Date(segundaVisivel);
      d.setDate(d.getDate() - 7);
      setSegundaVisivel(d);
    } else {
      setMesVisivel(new Date(ano, mes - 1, 1));
    }
  }

  function avancarPeriodo() {
    if (periodo === 'dia') {
      const d = new Date(`${diaVisivel}T12:00:00`);
      d.setDate(d.getDate() + 1);
      setDiaVisivel(toISO(d));
    } else if (periodo === 'semana') {
      const d = new Date(segundaVisivel);
      d.setDate(d.getDate() + 7);
      setSegundaVisivel(d);
    } else {
      setMesVisivel(new Date(ano, mes + 1, 1));
    }
  }

  function gerarTextoResumo() {
    const linhas = [`Relatório de produção — ${labelPeriodoAtual}`, ''];

    if (periodo === 'dia') {
      if (dados.registrosOrdenados.length === 0) {
        linhas.push('Sem registros neste dia.');
      } else {
        for (const r of dados.registrosOrdenados) {
          const obs = r.observacao ? ` (${r.observacao})` : '';
          linhas.push(`${r.servico_nome}${obs}: ${formatarPreco(Number(r.valor_comissao))}`);
        }
      }
    } else {
      linhas.push(periodo === 'semana' ? 'Por dia:' : 'Por semana:');
      if (dados.porSubperiodo.length === 0) {
        linhas.push('Sem registros no período.');
      } else {
        for (const s of dados.porSubperiodo) {
          const label = periodo === 'semana' ? formatarDiaComSemana(s.chave) : `${formatarDataCurta(s.chave)} a ${formatarDataCurta(fimDaSemana(s.chave))}`;
          linhas.push(`${label}: ${s.count} ${s.count === 1 ? 'atendimento' : 'atendimentos'} — ${formatarPreco(s.comissao)}`);
        }
      }

      linhas.push('', 'Por serviço:');
      if (dados.porServico.length === 0) {
        linhas.push('Sem registros no período.');
      } else {
        for (const s of dados.porServico) {
          linhas.push(`${s.servico}: ${s.count} ${s.count === 1 ? 'atendimento' : 'atendimentos'} — ${formatarPreco(s.comissao)}`);
        }
      }
    }

    linhas.push(
      '',
      `Total: ${dados.totalAtendimentos} ${dados.totalAtendimentos === 1 ? 'atendimento' : 'atendimentos'} — ${formatarPreco(dados.totalComissao)}`
    );

    return linhas.join('\n');
  }

  async function compartilharResumo() {
    const texto = gerarTextoResumo();
    const titulo = `Relatório de produção — ${labelPeriodoAtual}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto });
        return;
      } catch {
        return; // cancelado pelo usuário
      }
    }

    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt('Copie o texto abaixo:', texto);
    }
  }

  async function baixarPdf() {
    setGerandoPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF();
      const titulo = `Relatório de produção — ${labelPeriodoAtual}`;
      const totalLabel = `Total: ${dados.totalAtendimentos} ${
        dados.totalAtendimentos === 1 ? 'atendimento' : 'atendimentos'
      } — ${formatarPreco(dados.totalComissao)}`;

      doc.setFontSize(16);
      doc.text(titulo, 14, 18);
      doc.setFontSize(11);
      doc.text(totalLabel, 14, 27);

      let y = 34;

      if (periodo === 'dia') {
        doc.autoTable({
          startY: y,
          head: [['Serviço', 'Observação', 'Valor']],
          body:
            dados.registrosOrdenados.length > 0
              ? dados.registrosOrdenados.map((r) => [
                  r.servico_nome,
                  r.observacao || '—',
                  formatarPreco(Number(r.valor_comissao)),
                ])
              : [['Sem registros neste dia.', '', '']],
          headStyles: { fillColor: [21, 69, 72] },
        });
      } else {
        doc.setFontSize(13);
        doc.text(periodo === 'semana' ? 'Por dia' : 'Por semana', 14, y);
        doc.autoTable({
          startY: y + 5,
          head: [[periodo === 'semana' ? 'Dia' : 'Semana', 'Atendimentos', 'Valor']],
          body:
            dados.porSubperiodo.length > 0
              ? dados.porSubperiodo.map((s) => [
                  periodo === 'semana'
                    ? formatarDiaComSemana(s.chave)
                    : `${formatarDataCurta(s.chave)} a ${formatarDataCurta(fimDaSemana(s.chave))}`,
                  String(s.count),
                  formatarPreco(s.comissao),
                ])
              : [['Sem registros no período.', '', '']],
          headStyles: { fillColor: [21, 69, 72] },
        });

        const proximaY = doc.lastAutoTable.finalY + 12;
        doc.setFontSize(13);
        doc.text('Por serviço', 14, proximaY);
        doc.autoTable({
          startY: proximaY + 5,
          head: [['Serviço', 'Atendimentos', 'Valor']],
          body:
            dados.porServico.length > 0
              ? dados.porServico.map((s) => [s.servico, String(s.count), formatarPreco(s.comissao)])
              : [['Sem registros no período.', '', '']],
          headStyles: { fillColor: [21, 69, 72] },
        });
      }

      const sufixo =
        periodo === 'dia' ? diaVisivel : periodo === 'semana' ? `semana-${range.inicio}` : `${MESES_LABEL[mes].toLowerCase()}-${ano}`;
      doc.save(`producao-${sufixo}.pdf`);
    } catch (erro) {
      console.error(erro);
      window.alert('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setGerandoPdf(false);
    }
  }

  return (
    <div>
      {/* SELETOR DE PERÍODO */}
      <div className="flex gap-2 mb-6">
        {PERIODOS.map((p) => (
          <button
            key={p.chave}
            type="button"
            onClick={() => setPeriodo(p.chave)}
            className={`text-sm font-display px-4 py-2 rounded-full border-2 transition-colors focus-ring ${
              periodo === p.chave
                ? 'bg-teal-800 border-teal-800 text-white'
                : 'border-cream-line text-ink/60 hover:border-clay-500'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* NAVEGAÇÃO */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={voltarPeriodo}
          className="w-9 h-9 rounded-full border border-cream-line flex items-center justify-center hover:border-clay-500 focus-ring shrink-0"
          aria-label="Período anterior"
        >
          ‹
        </button>
        <p className="font-display text-lg text-teal-900 text-center capitalize">{labelPeriodoAtual}</p>
        <button
          type="button"
          onClick={avancarPeriodo}
          className="w-9 h-9 rounded-full border border-cream-line flex items-center justify-center hover:border-clay-500 focus-ring shrink-0"
          aria-label="Próximo período"
        >
          ›
        </button>
      </div>

      {!carregando && !erro && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={compartilharResumo}
            className="text-sm font-display border-2 border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white px-4 py-2 rounded-full transition-colors focus-ring"
          >
            {copiado ? 'Copiado!' : 'Compartilhar resumo'}
          </button>
          <button
            type="button"
            onClick={baixarPdf}
            disabled={gerandoPdf}
            className="text-sm font-display bg-clay-500 hover:bg-clay-600 disabled:opacity-60 text-white px-4 py-2 rounded-full shadow-soft transition-colors focus-ring"
          >
            {gerandoPdf ? 'Gerando PDF…' : 'Baixar PDF'}
          </button>
        </div>
      )}

      {carregando && <p className="text-ink/60">Carregando…</p>}
      {erro && <p className="text-clay-600">{erro}</p>}

      {!carregando && !erro && (
        <div className="grid gap-8">
          {/* TOTAL DO PERÍODO */}
          <div className="bg-teal-900 text-cream-soft rounded-2xl p-6">
            <p className="font-display text-sm uppercase tracking-wide text-cream-soft/70 mb-1">
              Sua parte no período
            </p>
            <p className="font-display text-4xl">{formatarPreco(dados.totalComissao)}</p>
            <p className="text-sm text-cream-soft/70 mt-2">
              {dados.totalAtendimentos} {dados.totalAtendimentos === 1 ? 'atendimento' : 'atendimentos'} ·{' '}
              {formatarPreco(dados.totalServicos)} em serviços no total
            </p>
          </div>

          {periodo === 'dia' ? (
            /* LISTA DO DIA */
            <div>
              <p className="font-display text-lg text-teal-900 mb-3">Atendimentos do dia</p>
              {dados.registrosOrdenados.length === 0 ? (
                <p className="text-sm text-ink/60">Nenhum registro neste dia.</p>
              ) : (
                <div className="grid gap-2.5">
                  {dados.registrosOrdenados.map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl shadow-soft px-4 py-3.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-teal-900 truncate">{r.servico_nome}</p>
                        {r.observacao && <p className="text-xs text-ink/50 truncate">{r.observacao}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-moss-600">{formatarPreco(Number(r.valor_comissao))}</p>
                        <p className="text-xs text-ink/40">de {formatarPreco(Number(r.valor_servico))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* POR SERVIÇO */}
              <div>
                <p className="font-display text-lg text-teal-900 mb-3">Por serviço</p>
                {dados.porServico.length === 0 ? (
                  <p className="text-sm text-ink/60">Nenhum registro no período.</p>
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

              {/* POR SUBPERÍODO (dia dentro da semana, ou semana dentro do mês) */}
              <div>
                <p className="font-display text-lg text-teal-900 mb-3">
                  {periodo === 'semana' ? 'Por dia' : 'Por semana'}
                </p>
                {dados.porSubperiodo.length === 0 ? (
                  <p className="text-sm text-ink/60">Sem registros no período.</p>
                ) : (
                  <div className="bg-white rounded-2xl shadow-soft divide-y divide-cream-line">
                    {dados.porSubperiodo.map((s) => (
                      <div key={s.chave} className="flex items-center justify-between px-5 py-3.5">
                        <div>
                          <p className="font-display text-teal-900">
                            {periodo === 'semana'
                              ? formatarDiaComSemana(s.chave)
                              : `${formatarDataCurta(s.chave)} a ${formatarDataCurta(fimDaSemana(s.chave))}`}
                          </p>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
