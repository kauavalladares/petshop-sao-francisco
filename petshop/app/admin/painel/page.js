'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatarPreco } from '@/lib/servicos';
import AgendamentoModal from '@/components/admin/AgendamentoModal';
import AgendaSemanal from '@/components/admin/AgendaSemanal';

const STATUS_LABEL = {
  confirmado: { texto: 'Confirmado', cor: 'bg-teal-800 text-white' },
  concluido: { texto: 'Concluído', cor: 'bg-moss-500 text-white' },
  cancelado: { texto: 'Cancelado', cor: 'bg-cream-line text-ink/50 line-through' },
};

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dataChave(a) {
  return typeof a.data === 'string' ? a.data.slice(0, 10) : toISO(new Date(a.data));
}

function segundaFeiraDe(date) {
  const dia = date.getDay(); // 0 = domingo ... 6 = sábado
  const diff = dia === 0 ? -6 : 1 - dia;
  const seg = new Date(date);
  seg.setDate(date.getDate() + diff);
  seg.setHours(0, 0, 0, 0);
  return seg;
}

function sextaFeiraDe(segunda) {
  const sex = new Date(segunda);
  sex.setDate(segunda.getDate() + 4);
  return sex;
}

export default function PainelAdminPage() {
  const router = useRouter();

  const [visualizacao, setVisualizacao] = useState('lista'); // 'lista' | 'agenda'

  // --- Lista (próximos agendamentos a partir de hoje) ---
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // --- Resumo do dia / semana atual ---
  const [semana, setSemana] = useState([]);
  const [carregandoSemana, setCarregandoSemana] = useState(true);

  // --- Agenda semanal navegável ---
  const [segundaAgenda, setSegundaAgenda] = useState(() => segundaFeiraDe(new Date()));
  const [agendaSemana, setAgendaSemana] = useState([]);
  const [carregandoAgenda, setCarregandoAgenda] = useState(true);

  // --- Modal de criar/editar ---
  const [modal, setModal] = useState(null); // { agendamento?, dataPadrao?, horaPadrao? } | null

  const hoje = useMemo(() => new Date(), []);
  const hojeISO = useMemo(() => toISO(hoje), [hoje]);
  const segundaAtual = useMemo(() => segundaFeiraDe(hoje), [hoje]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resp = await fetch('/api/admin/agendamentos');
      if (resp.status === 401) {
        router.push('/admin');
        return;
      }
      const data = await resp.json();
      if (!resp.ok) {
        setErro(data.erro || 'Não foi possível carregar os agendamentos.');
        return;
      }
      setAgendamentos(data.agendamentos || []);
    } catch {
      setErro('Não foi possível carregar os agendamentos.');
    } finally {
      setCarregando(false);
    }
  }, [router]);

  const carregarSemanaResumo = useCallback(async () => {
    setCarregandoSemana(true);
    try {
      const inicio = toISO(segundaAtual);
      const fim = toISO(sextaFeiraDe(segundaAtual));
      const resp = await fetch(`/api/admin/agendamentos?inicio=${inicio}&fim=${fim}`);
      if (resp.status === 401) return;
      const data = await resp.json();
      if (resp.ok) setSemana(data.agendamentos || []);
    } catch {
      // resumo é um extra, não trava a página se falhar
    } finally {
      setCarregandoSemana(false);
    }
  }, [segundaAtual]);

  const carregarAgenda = useCallback(async (segunda) => {
    setCarregandoAgenda(true);
    try {
      const inicio = toISO(segunda);
      const fim = toISO(sextaFeiraDe(segunda));
      const resp = await fetch(`/api/admin/agendamentos?inicio=${inicio}&fim=${fim}`);
      if (resp.status === 401) return;
      const data = await resp.json();
      if (resp.ok) setAgendaSemana(data.agendamentos || []);
    } catch {
      // idem
    } finally {
      setCarregandoAgenda(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    carregarSemanaResumo();
  }, [carregar, carregarSemanaResumo]);

  useEffect(() => {
    carregarAgenda(segundaAgenda);
  }, [segundaAgenda, carregarAgenda]);

  function recarregarTudo() {
    carregar();
    carregarSemanaResumo();
    carregarAgenda(segundaAgenda);
  }

  async function atualizarStatus(id, status) {
    setAgendamentos((atual) => atual.map((a) => (a.id === id ? { ...a, status } : a)));
    setSemana((atual) => atual.map((a) => (a.id === id ? { ...a, status } : a)));
    setAgendaSemana((atual) => atual.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await fetch('/api/admin/agendamentos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
    } catch {
      recarregarTudo();
    }
  }

  async function sair() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  }

  const agrupados = agrupar(agendamentos);

  const semanaValida = semana.filter((a) => a.status !== 'cancelado');
  const hojeValidos = semanaValida.filter((a) => dataChave(a) === hojeISO);
  const totalHoje = hojeValidos.reduce((soma, a) => soma + Number(a.preco), 0);
  const totalSemana = semanaValida.reduce((soma, a) => soma + Number(a.preco), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-12">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="font-display text-clay-500 text-sm tracking-wide uppercase mb-1">
            Painel administrativo
          </p>
          <h1 className="font-display text-3xl text-teal-900">Agendamentos</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setModal({})}
            className="text-sm font-display bg-clay-500 hover:bg-clay-600 text-white px-4 py-2.5 rounded-full shadow-soft transition-colors focus-ring"
          >
            + Novo agendamento
          </button>
          <button
            type="button"
            onClick={sair}
            className="text-sm text-teal-800 hover:text-clay-600 focus-ring rounded"
          >
            Sair
          </button>
        </div>
      </div>

      {/* RESUMO DO DIA E DA SEMANA */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-teal-900 text-cream-soft rounded-2xl p-5 md:p-6">
          <p className="font-display text-sm uppercase tracking-wide text-cream-soft/70 mb-1">Hoje</p>
          {carregandoSemana ? (
            <p className="text-cream-soft/70 text-sm">Carregando…</p>
          ) : (
            <>
              <p className="font-display text-3xl">{formatarPreco(totalHoje)}</p>
              <p className="text-sm text-cream-soft/70 mt-1">
                {hojeValidos.length} {hojeValidos.length === 1 ? 'agendamento' : 'agendamentos'}
              </p>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-5 md:p-6">
          <p className="font-display text-sm uppercase tracking-wide text-ink/50 mb-1">
            Esta semana (seg. a sex.)
          </p>
          {carregandoSemana ? (
            <p className="text-ink/50 text-sm">Carregando…</p>
          ) : (
            <>
              <p className="font-display text-3xl text-clay-500">{formatarPreco(totalSemana)}</p>
              <p className="text-sm text-ink/50 mt-1">
                {semanaValida.length} {semanaValida.length === 1 ? 'agendamento' : 'agendamentos'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ABAS */}
      <div className="flex gap-2 mb-6 border-b border-cream-line">
        <button
          type="button"
          onClick={() => setVisualizacao('lista')}
          className={`font-display px-4 py-2.5 border-b-2 -mb-px transition-colors focus-ring ${
            visualizacao === 'lista' ? 'border-teal-800 text-teal-900' : 'border-transparent text-ink/50 hover:text-ink/80'
          }`}
        >
          Lista
        </button>
        <button
          type="button"
          onClick={() => setVisualizacao('agenda')}
          className={`font-display px-4 py-2.5 border-b-2 -mb-px transition-colors focus-ring ${
            visualizacao === 'agenda' ? 'border-teal-800 text-teal-900' : 'border-transparent text-ink/50 hover:text-ink/80'
          }`}
        >
          Agenda
        </button>
      </div>

      {visualizacao === 'agenda' && (
        <AgendaSemanal
          inicioSemana={segundaAgenda}
          agendamentos={agendaSemana}
          carregando={carregandoAgenda}
          hojeISO={hojeISO}
          onNavegar={(direcao) =>
            setSegundaAgenda((atual) => {
              const d = new Date(atual);
              d.setDate(atual.getDate() + direcao * 7);
              return d;
            })
          }
          onSelecionar={(a) => setModal({ agendamento: a })}
          onNovo={(dataISO, horaISO) => setModal({ dataPadrao: dataISO, horaPadrao: horaISO })}
        />
      )}

      {visualizacao === 'lista' && (
        <>
          {carregando && <p className="text-ink/60">Carregando…</p>}
          {erro && <p className="text-clay-600">{erro}</p>}

          {!carregando && !erro && agendamentos.length === 0 && (
            <p className="text-ink/60">Nenhum agendamento encontrado a partir de hoje.</p>
          )}

          <div className="grid gap-8">
            {Object.entries(agrupados).map(([data, lista]) => (
              <div key={data}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-display text-lg text-teal-900">
                    {formatarDataLonga(data)}
                    {data === hojeISO && (
                      <span className="ml-2 align-middle text-xs font-display bg-clay-100 text-clay-600 px-2.5 py-1 rounded-full">
                        Hoje
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-ink/50">
                    {formatarPreco(
                      lista.filter((a) => a.status !== 'cancelado').reduce((s, a) => s + Number(a.preco), 0)
                    )}{' '}
                    no dia
                  </p>
                </div>
                <div className="grid gap-3">
                  {lista.map((a) => (
                    <div
                      key={a.id}
                      className="bg-white rounded-2xl shadow-soft p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-6"
                    >
                      <div className="font-display text-teal-900 text-lg w-20 shrink-0">
                        {a.hora_inicio?.slice(0, 5)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <p className="font-display text-teal-900">{a.servico_nome}</p>
                          <span className="font-display text-sm text-clay-500">
                            {formatarPreco(Number(a.preco))}
                          </span>
                          {a.origem === 'manual' && (
                            <span className="text-[10px] font-display text-ink/40 border border-cream-line px-1.5 py-0.5 rounded-full">
                              balcão
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-ink/70">
                          Pet: {a.pet_nome} · Tutor: {a.cliente_nome}
                        </p>
                        <p className="text-sm text-ink/50">{a.cliente_telefone}</p>
                      </div>

                      <span className={`self-start md:self-auto text-xs font-display px-3 py-1 rounded-full shrink-0 ${STATUS_LABEL[a.status]?.cor || ''}`}>
                        {STATUS_LABEL[a.status]?.texto || a.status}
                      </span>

                      <div className="flex gap-2 shrink-0 self-start md:self-auto flex-wrap">
                        <button
                          type="button"
                          onClick={() => setModal({ agendamento: a })}
                          className="text-xs font-display border-2 border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white px-3 py-1.5 rounded-full transition-colors focus-ring"
                        >
                          Editar
                        </button>
                        {a.status !== 'concluido' && (
                          <button
                            type="button"
                            onClick={() => atualizarStatus(a.id, 'concluido')}
                            className="text-xs font-display border-2 border-moss-500 text-moss-600 hover:bg-moss-500 hover:text-white px-3 py-1.5 rounded-full transition-colors focus-ring"
                          >
                            Concluir
                          </button>
                        )}
                        {a.status !== 'cancelado' && (
                          <button
                            type="button"
                            onClick={() => atualizarStatus(a.id, 'cancelado')}
                            className="text-xs font-display border-2 border-clay-500 text-clay-600 hover:bg-clay-500 hover:text-white px-3 py-1.5 rounded-full transition-colors focus-ring"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modal && (
        <AgendamentoModal
          agendamento={modal.agendamento}
          dataPadrao={modal.dataPadrao || hojeISO}
          horaPadrao={modal.horaPadrao}
          onFechar={() => setModal(null)}
          onSalvo={() => {
            setModal(null);
            recarregarTudo();
          }}
        />
      )}
    </div>
  );
}

function agrupar(agendamentos) {
  return agendamentos.reduce((acc, a) => {
    const chave = dataChave(a);
    if (!acc[chave]) acc[chave] = [];
    acc[chave].push(a);
    return acc;
  }, {});
}

function formatarDataLonga(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}
