'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SERVICOS, formatarPreco } from '@/lib/servicos';
import { calcularComissao } from '@/lib/comissao';
import RelatorioProducao from '@/components/producao/RelatorioProducao';
import PacoteRapidoModal from '@/components/producao/PacoteRapidoModal';

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dataChave(r) {
  return typeof r.data === 'string' ? r.data.slice(0, 10) : toISO(new Date(r.data));
}

function segundaFeiraDe(date) {
  const dia = date.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const seg = new Date(date);
  seg.setDate(date.getDate() + diff);
  seg.setHours(0, 0, 0, 0);
  return seg;
}

function formatarDataLonga(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

function estadoInicialForm() {
  return {
    servicoId: SERVICOS[0].id,
    servicoNome: SERVICOS[0].nome,
    valorServico: String(SERVICOS[0].preco),
    data: toISO(new Date()),
    observacao: '',
    pacoteId: null,
  };
}

export default function ProducaoPainelPage() {
  const router = useRouter();

  const [visualizacao, setVisualizacao] = useState('registrar'); // 'registrar' | 'relatorio'
  const [modalPacote, setModalPacote] = useState(false);

  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [pacotesAtivos, setPacotesAtivos] = useState([]);

  const [form, setForm] = useState(estadoInicialForm);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState(null);

  const hoje = useMemo(() => new Date(), []);
  const hojeISO = useMemo(() => toISO(hoje), [hoje]);
  const segundaAtual = useMemo(() => segundaFeiraDe(hoje), [hoje]);
  const inicioMesISO = useMemo(() => toISO(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), [hoje]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resp = await fetch('/api/producao/registros');
      if (resp.status === 401) {
        router.push('/producao');
        return;
      }
      const data = await resp.json();
      if (!resp.ok) {
        setErro(data.erro || 'Não foi possível carregar os registros.');
        return;
      }
      setRegistros(data.registros || []);
    } catch {
      setErro('Não foi possível carregar os registros.');
    } finally {
      setCarregando(false);
    }
  }, [router]);

  const carregarPacotesAtivos = useCallback(async () => {
    try {
      const resp = await fetch('/api/producao/pacotes-ativos');
      if (resp.status === 401) return;
      const data = await resp.json();
      if (resp.ok) setPacotesAtivos(data.pacotes || []);
    } catch {
      // opcional — não trava a página se falhar
    }
  }, []);

  useEffect(() => {
    carregar();
    carregarPacotesAtivos();
  }, [carregar, carregarPacotesAtivos]);

  function alterarServico(servicoId) {
    if (servicoId === 'outro') {
      setForm((f) => ({ ...f, servicoId, servicoNome: '', valorServico: '' }));
      return;
    }
    const servico = SERVICOS.find((s) => s.id === servicoId);
    setForm((f) => ({ ...f, servicoId, servicoNome: servico.nome, valorServico: String(servico.preco) }));
  }

  function selecionarPacote(pacoteIdStr) {
    if (!pacoteIdStr) {
      const servico = SERVICOS.find((s) => s.id === form.servicoId) || SERVICOS[0];
      setForm((f) => ({ ...f, pacoteId: null, servicoNome: servico.nome, valorServico: String(servico.preco) }));
      return;
    }
    const pacote = pacotesAtivos.find((p) => String(p.id) === pacoteIdStr);
    if (!pacote) return;
    const valorPorSessao = Math.round((Number(pacote.valor_total) / pacote.quantidade_total) * 100) / 100;
    setForm((f) => ({
      ...f,
      pacoteId: pacote.id,
      servicoNome: pacote.servico_nome,
      valorServico: String(valorPorSessao),
    }));
  }

  async function registrar(e) {
    e.preventDefault();
    setErroForm(null);

    if (!form.servicoNome.trim() || form.valorServico === '' || !form.data) {
      setErroForm('Preencha o serviço, o valor e a data.');
      return;
    }

    setSalvando(true);
    try {
      const resp = await fetch('/api/producao/registros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicoNome: form.servicoNome,
          valorServico: Number(form.valorServico),
          data: form.data,
          observacao: form.observacao,
          pacoteId: form.pacoteId || undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setErroForm(data.erro || 'Não foi possível salvar.');
        return;
      }
      setForm((f) => ({ ...estadoInicialForm(), data: f.data })); // mantém a data escolhida para lançar vários seguidos
      carregar();
      carregarPacotesAtivos();
    } catch {
      setErroForm('Não foi possível salvar. Verifique sua conexão.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    if (!window.confirm('Excluir este registro?')) return;
    setRegistros((atual) => atual.filter((r) => r.id !== id));
    try {
      await fetch(`/api/producao/registros?id=${id}`, { method: 'DELETE' });
      carregarPacotesAtivos();
    } catch {
      carregar();
    }
  }

  async function sair() {
    await fetch('/api/producao/logout', { method: 'POST' });
    router.push('/producao');
  }

  const comissaoPrevista = form.valorServico !== '' ? calcularComissao(Number(form.valorServico) || 0) : 0;

  const registrosHoje = registros.filter((r) => dataChave(r) === hojeISO);
  const registrosSemana = registros.filter((r) => {
    const chave = dataChave(r);
    return chave >= toISO(segundaAtual) && chave <= hojeISO;
  });
  const registrosMes = registros.filter((r) => dataChave(r) >= inicioMesISO);

  const somarComissao = (lista) => lista.reduce((s, r) => s + Number(r.valor_comissao), 0);

  const agrupados = registros.reduce((acc, r) => {
    const chave = dataChave(r);
    if (!acc[chave]) acc[chave] = [];
    acc[chave].push(r);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-12">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="font-display text-clay-500 text-sm tracking-wide uppercase mb-1">
            Controle de produção
          </p>
          <h1 className="font-display text-3xl text-teal-900">Banhos e tosas</h1>
        </div>
        <button
          type="button"
          onClick={sair}
          className="text-sm text-teal-800 hover:text-clay-600 focus-ring rounded"
        >
          Sair
        </button>
      </div>

      {/* RESUMOS */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-teal-900 text-cream-soft rounded-2xl p-5">
          <p className="font-display text-sm uppercase tracking-wide text-cream-soft/70 mb-1">Hoje</p>
          <p className="font-display text-2xl">{formatarPreco(somarComissao(registrosHoje))}</p>
          <p className="text-sm text-cream-soft/70 mt-1">
            {registrosHoje.length} {registrosHoje.length === 1 ? 'atendimento' : 'atendimentos'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <p className="font-display text-sm uppercase tracking-wide text-ink/50 mb-1">Esta semana</p>
          <p className="font-display text-2xl text-clay-500">{formatarPreco(somarComissao(registrosSemana))}</p>
          <p className="text-sm text-ink/50 mt-1">
            {registrosSemana.length} {registrosSemana.length === 1 ? 'atendimento' : 'atendimentos'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <p className="font-display text-sm uppercase tracking-wide text-ink/50 mb-1">Este mês</p>
          <p className="font-display text-2xl text-clay-500">{formatarPreco(somarComissao(registrosMes))}</p>
          <p className="text-sm text-ink/50 mt-1">
            {registrosMes.length} {registrosMes.length === 1 ? 'atendimento' : 'atendimentos'}
          </p>
        </div>
      </div>

      {/* ABAS */}
      <div className="flex gap-2 mb-6 border-b border-cream-line">
        <button
          type="button"
          onClick={() => setVisualizacao('registrar')}
          className={`font-display px-4 py-2.5 border-b-2 -mb-px transition-colors focus-ring ${
            visualizacao === 'registrar'
              ? 'border-teal-800 text-teal-900'
              : 'border-transparent text-ink/50 hover:text-ink/80'
          }`}
        >
          Registrar
        </button>
        <button
          type="button"
          onClick={() => setVisualizacao('relatorio')}
          className={`font-display px-4 py-2.5 border-b-2 -mb-px transition-colors focus-ring ${
            visualizacao === 'relatorio'
              ? 'border-teal-800 text-teal-900'
              : 'border-transparent text-ink/50 hover:text-ink/80'
          }`}
        >
          Relatório
        </button>
      </div>

      {visualizacao === 'relatorio' && <RelatorioProducao />}

      {visualizacao === 'registrar' && (
        <>
          {/* FORMULÁRIO DE REGISTRO RÁPIDO */}
          <div className="bg-white rounded-2xl shadow-soft p-5 md:p-6 mb-10">
            <p className="font-display text-lg text-teal-900 mb-4">Registrar banho ou tosa</p>
            <form onSubmit={registrar} className="grid gap-4">
              <div className="block">
                <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                  <span className="text-sm font-display text-teal-900">
                    Usar sessão de um pacote (opcional)
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalPacote(true)}
                    className="text-xs font-display text-clay-600 hover:text-clay-700 focus-ring rounded shrink-0"
                  >
                    + Novo pacote
                  </button>
                </div>
                <select
                  value={form.pacoteId || ''}
                  onChange={(e) => selecionarPacote(e.target.value)}
                  className="w-full rounded-xl border-2 border-cream-line focus:border-clay-500 outline-none px-4 py-2.5 bg-cream-soft focus-ring"
                >
                  <option value="">— Avulso —</option>
                  {pacotesAtivos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.cliente_nome} · {p.servico_nome} ({p.quantidade_usada}/{p.quantidade_total} usadas)
                    </option>
                  ))}
                </select>
                {pacotesAtivos.length === 0 && (
                  <span className="block text-xs text-ink/40 mt-1">
                    Nenhum pacote ativo no momento.
                  </span>
                )}
              </div>


              <label className="block">
                <span className="text-sm font-display text-teal-900">Serviço</span>
                <select
                  value={form.servicoId}
                  onChange={(e) => alterarServico(e.target.value)}
                  disabled={Boolean(form.pacoteId)}
                  className="mt-1.5 w-full rounded-xl border-2 border-cream-line focus:border-clay-500 outline-none px-4 py-2.5 bg-cream-soft focus-ring disabled:opacity-60"
                >
                  {SERVICOS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                  <option value="outro">Outro (digitar)</option>
                </select>
              </label>

              {form.servicoId === 'outro' && !form.pacoteId && (
                <label className="block">
                  <span className="text-sm font-display text-teal-900">Nome do serviço</span>
                  <input
                    type="text"
                    value={form.servicoNome}
                    onChange={(e) => setForm((f) => ({ ...f, servicoNome: e.target.value }))}
                    required
                    className="mt-1.5 w-full rounded-xl border-2 border-cream-line focus:border-clay-500 outline-none px-4 py-2.5 bg-cream-soft focus-ring"
                  />
                </label>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block">
                    <span className="text-sm font-display text-teal-900">Valor do serviço (R$)</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.valorServico}
                      onChange={(e) => setForm((f) => ({ ...f, valorServico: e.target.value }))}
                      required
                      disabled={Boolean(form.pacoteId)}
                      className="mt-1.5 w-full rounded-xl border-2 border-cream-line focus:border-clay-500 outline-none px-4 py-2.5 bg-cream-soft focus-ring disabled:opacity-60"
                    />
                  </label>
                  {form.pacoteId && <p className="text-xs text-ink/50 mt-1">Valor por sessão do pacote</p>}
                </div>
                <label className="block">
                  <span className="text-sm font-display text-teal-900">Data</span>
                  <input
                    type="date"
                    value={form.data}
                    onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                    required
                    className="mt-1.5 w-full rounded-xl border-2 border-cream-line focus:border-clay-500 outline-none px-4 py-2.5 bg-cream-soft focus-ring"
                  />
                </label>
              </div>

              <p className="text-sm text-moss-600 -mt-1">
                Sua parte: <strong>{formatarPreco(comissaoPrevista)}</strong> (metade do valor do serviço)
              </p>

              <label className="block">
                <span className="text-sm font-display text-teal-900">Observação (opcional)</span>
                <input
                  type="text"
                  value={form.observacao}
                  onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                  placeholder="Ex: nome do pet ou do cliente"
                  className="mt-1.5 w-full rounded-xl border-2 border-cream-line focus:border-clay-500 outline-none px-4 py-2.5 bg-cream-soft focus-ring"
                />
              </label>

              {erroForm && <p className="text-sm text-clay-600">{erroForm}</p>}

              <button
                type="submit"
                disabled={salvando}
                className="bg-clay-500 hover:bg-clay-600 disabled:opacity-60 text-white font-display text-lg py-3 rounded-full shadow-soft transition-colors focus-ring"
              >
                {salvando ? 'Registrando…' : 'Registrar'}
              </button>
            </form>
          </div>

          {/* HISTÓRICO */}
          <p className="font-display text-lg text-teal-900 mb-3">Histórico</p>

          {carregando && <p className="text-ink/60">Carregando…</p>}
          {erro && <p className="text-clay-600">{erro}</p>}
          {!carregando && !erro && registros.length === 0 && (
            <p className="text-ink/60">Nenhum registro ainda.</p>
          )}

          <div className="grid gap-8">
            {Object.entries(agrupados).map(([data, lista]) => (
              <div key={data}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-display text-teal-900">
                    {formatarDataLonga(data)}
                    {data === hojeISO && (
                      <span className="ml-2 align-middle text-xs font-display bg-clay-100 text-clay-600 px-2.5 py-1 rounded-full">
                        Hoje
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-ink/50">{formatarPreco(somarComissao(lista))} no dia</p>
                </div>
                <div className="grid gap-2.5">
                  {lista.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-2xl shadow-soft px-4 py-3.5 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-display text-teal-900 truncate">{r.servico_nome}</p>
                          {r.pacote_id && (
                            <span className="text-[10px] font-display text-teal-800 border border-teal-800/30 bg-clay-100 px-1.5 py-0.5 rounded-full shrink-0">
                              pacote
                            </span>
                          )}
                        </div>
                        {r.observacao && <p className="text-xs text-ink/50 truncate">{r.observacao}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-moss-600">{formatarPreco(Number(r.valor_comissao))}</p>
                        <p className="text-xs text-ink/40">de {formatarPreco(Number(r.valor_servico))}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => excluir(r.id)}
                        aria-label="Excluir registro"
                        className="text-ink/30 hover:text-clay-600 text-xl leading-none px-1.5 focus-ring rounded shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modalPacote && (
        <PacoteRapidoModal
          onFechar={() => setModalPacote(false)}
          onSalvo={() => {
            setModalPacote(false);
            carregarPacotesAtivos();
          }}
        />
      )}
    </div>
  );
}
