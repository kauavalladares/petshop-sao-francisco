'use client';

import { useEffect, useState } from 'react';
import { SERVICOS } from '@/lib/servicos';

function toMinutos(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(totalMin) {
  const h = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const m = String(totalMin % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function estadoInicial(agendamento, dataPadrao, horaPadrao) {
  if (agendamento) {
    return {
      servicoId: SERVICOS.find((s) => s.nome === agendamento.servico_nome)?.id || 'outro',
      servicoNome: agendamento.servico_nome,
      preco: String(Number(agendamento.preco)),
      data: agendamento.data?.slice ? agendamento.data.slice(0, 10) : agendamento.data,
      horaInicio: agendamento.hora_inicio?.slice(0, 5) || '',
      horaFim: agendamento.hora_fim?.slice(0, 5) || '',
      clienteNome: agendamento.cliente_nome === 'Cliente balcão' ? '' : agendamento.cliente_nome,
      clienteTelefone: agendamento.cliente_telefone === '-' ? '' : agendamento.cliente_telefone,
      petNome: agendamento.pet_nome,
      status: agendamento.status,
      pacoteId: null,
    };
  }
  return {
    servicoId: SERVICOS[0].id,
    servicoNome: SERVICOS[0].nome,
    preco: String(SERVICOS[0].preco),
    data: dataPadrao,
    horaInicio: horaPadrao || '09:00',
    horaFim: toHHMM(toMinutos(horaPadrao || '09:00') + SERVICOS[0].duracaoMin),
    clienteNome: '',
    clienteTelefone: '',
    petNome: '',
    status: 'confirmado',
    pacoteId: null,
  };
}

export default function AgendamentoModal({ agendamento, dataPadrao, horaPadrao, onFechar, onSalvo }) {
  const modoEdicao = Boolean(agendamento);
  const vinculadoAPacote = modoEdicao && Boolean(agendamento.pacote_id);
  const [form, setForm] = useState(() => estadoInicial(agendamento, dataPadrao, horaPadrao));
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState(null);
  const [pacotesAtivos, setPacotesAtivos] = useState([]);

  useEffect(() => {
    function onEsc(e) {
      if (e.key === 'Escape') onFechar();
    }
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onFechar]);

  useEffect(() => {
    if (modoEdicao) return;
    fetch('/api/admin/pacotes?status=ativo')
      .then((r) => r.json())
      .then((data) => setPacotesAtivos(data.pacotes || []))
      .catch(() => {});
  }, [modoEdicao]);

  function alterarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function alterarServico(servicoId) {
    if (servicoId === 'outro') {
      setForm((f) => ({ ...f, servicoId, servicoNome: '' }));
      return;
    }
    const servico = SERVICOS.find((s) => s.id === servicoId);
    setForm((f) => ({
      ...f,
      servicoId,
      servicoNome: servico.nome,
      preco: String(servico.preco),
      horaFim: toHHMM(toMinutos(f.horaInicio || '09:00') + servico.duracaoMin),
    }));
  }

  function selecionarPacote(pacoteIdStr) {
    if (!pacoteIdStr) {
      const servico = SERVICOS.find((s) => s.id === form.servicoId);
      setForm((f) => ({ ...f, pacoteId: null, preco: servico ? String(servico.preco) : f.preco }));
      return;
    }
    const pacote = pacotesAtivos.find((p) => String(p.id) === pacoteIdStr);
    if (!pacote) return;
    setForm((f) => ({
      ...f,
      pacoteId: pacote.id,
      servicoNome: pacote.servico_nome,
      servicoId: SERVICOS.find((s) => s.nome === pacote.servico_nome)?.id || 'outro',
      preco: '0',
      clienteNome: f.clienteNome || pacote.cliente_nome,
      clienteTelefone: f.clienteTelefone || pacote.cliente_telefone || '',
    }));
  }

  function usarDuracaoPadrao() {
    const servico = SERVICOS.find((s) => s.id === form.servicoId);
    if (!servico) return;
    setForm((f) => ({ ...f, horaFim: toHHMM(toMinutos(f.horaInicio || '09:00') + servico.duracaoMin) }));
  }

  async function salvar(e) {
    e.preventDefault();
    setErro(null);

    if (!form.servicoNome.trim() || !form.petNome.trim() || form.preco === '') {
      setErro('Preencha serviço, valor e nome do pet.');
      return;
    }
    if (toMinutos(form.horaFim) <= toMinutos(form.horaInicio)) {
      setErro('O horário de término precisa ser depois do horário de início.');
      return;
    }

    setSalvando(true);
    try {
      const payloadCampos = {
        servicoNome: form.servicoNome,
        preco: Number(form.preco),
        data: form.data,
        horaInicio: form.horaInicio,
        horaFim: form.horaFim,
        clienteNome: form.clienteNome,
        clienteTelefone: form.clienteTelefone,
        petNome: form.petNome,
        status: form.status,
      };

      const resp = modoEdicao
        ? await fetch('/api/admin/agendamentos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: agendamento.id, campos: payloadCampos }),
          })
        : await fetch('/api/admin/agendamentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payloadCampos, pacoteId: form.pacoteId || undefined }),
          });

      const data = await resp.json();
      if (!resp.ok) {
        setErro(data.erro || 'Não foi possível salvar.');
        return;
      }
      onSalvo();
    } catch {
      setErro('Não foi possível salvar. Verifique sua conexão.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!window.confirm('Excluir este agendamento definitivamente? Essa ação não pode ser desfeita.')) {
      return;
    }
    setErro(null);
    setExcluindo(true);
    try {
      const resp = await fetch(`/api/admin/agendamentos?id=${agendamento.id}`, { method: 'DELETE' });
      const data = await resp.json();
      if (!resp.ok) {
        setErro(data.erro || 'Não foi possível excluir.');
        return;
      }
      onSalvo();
    } catch {
      setErro('Não foi possível excluir. Verifique sua conexão.');
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-ink/50 flex items-center justify-center p-4"
      onClick={onFechar}
    >
      <div
        className="bg-white rounded-2xl shadow-soft w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="font-display text-xl text-teal-900">
            {modoEdicao ? 'Editar agendamento' : 'Novo agendamento (balcão)'}
          </p>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="text-ink/50 hover:text-ink text-2xl leading-none focus-ring rounded"
          >
            ×
          </button>
        </div>

        {!modoEdicao && (
          <p className="text-sm text-ink/60 mb-5">
            Use isso para clientes que chegaram na loja sem agendar pelo site.
          </p>
        )}

        {vinculadoAPacote && (
          <p className="text-sm text-teal-800 bg-clay-100 rounded-xl px-4 py-2.5 mb-5">
            Esta sessão faz parte de um pacote — o valor fica travado em R$0,00 aqui.
          </p>
        )}

        <form onSubmit={salvar} className="grid gap-4">
          {!modoEdicao && pacotesAtivos.length > 0 && (
            <label className="block">
              <span className="text-sm font-display text-teal-900">
                Usar sessão de um pacote (opcional)
              </span>
              <select
                value={form.pacoteId || ''}
                onChange={(e) => selecionarPacote(e.target.value)}
                className="mt-1.5 w-full rounded-xl border-2 border-cream-line focus:border-clay-500 outline-none px-4 py-2.5 bg-cream-soft focus-ring"
              >
                <option value="">— Avulso (cobrar normalmente) —</option>
                {pacotesAtivos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.cliente_nome} · {p.servico_nome} ({p.quantidade_usada}/{p.quantidade_total} usadas)
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="text-sm font-display text-teal-900">Serviço</span>
            <select
              value={form.servicoId}
              onChange={(e) => alterarServico(e.target.value)}
              disabled={Boolean(form.pacoteId) || vinculadoAPacote}
              className="mt-1.5 w-full rounded-xl border-2 border-cream-line focus:border-clay-500 outline-none px-4 py-2.5 bg-cream-soft focus-ring disabled:opacity-60"
            >
              {SERVICOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
              <option value="outro">Outro (digitar nome)</option>
            </select>
          </label>

          {form.servicoId === 'outro' && (
            <Campo
              label="Nome do serviço"
              value={form.servicoNome}
              onChange={(v) => alterarCampo('servicoNome', v)}
              required
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Campo
                label="Valor (R$)"
                value={form.preco}
                onChange={(v) => alterarCampo('preco', v)}
                type="number"
                step="0.01"
                min="0"
                required
                disabled={Boolean(form.pacoteId) || vinculadoAPacote}
              />
              {(form.pacoteId || vinculadoAPacote) && (
                <p className="text-xs text-ink/50 mt-1">Incluso no pacote</p>
              )}
            </div>
            <label className="block">
              <span className="text-sm font-display text-teal-900">Status</span>
              <select
                value={form.status}
                onChange={(e) => alterarCampo('status', e.target.value)}
                className="mt-1.5 w-full rounded-xl border-2 border-cream-line focus:border-clay-500 outline-none px-4 py-2.5 bg-cream-soft focus-ring"
              >
                <option value="confirmado">Confirmado</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </label>
          </div>

          <Campo
            label="Data"
            value={form.data}
            onChange={(v) => alterarCampo('data', v)}
            type="date"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Campo
              label="Início"
              value={form.horaInicio}
              onChange={(v) => alterarCampo('horaInicio', v)}
              type="time"
              required
            />
            <Campo
              label="Fim"
              value={form.horaFim}
              onChange={(v) => alterarCampo('horaFim', v)}
              type="time"
              required
            />
          </div>
          <button
            type="button"
            onClick={usarDuracaoPadrao}
            className="text-xs text-teal-800 hover:text-clay-600 -mt-2 text-left focus-ring rounded w-fit"
          >
            Usar duração padrão do serviço
          </button>

          <Campo
            label="Nome do pet"
            value={form.petNome}
            onChange={(v) => alterarCampo('petNome', v)}
            required
          />
          <Campo
            label="Nome do tutor (opcional)"
            value={form.clienteNome}
            onChange={(v) => alterarCampo('clienteNome', v)}
          />
          <Campo
            label="Telefone (opcional)"
            value={form.clienteTelefone}
            onChange={(v) => alterarCampo('clienteTelefone', v)}
            type="tel"
          />

          {erro && <p className="text-sm text-clay-600">{erro}</p>}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 border-2 border-cream-line text-ink/70 hover:border-teal-800 font-display py-2.5 rounded-full transition-colors focus-ring"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || excluindo}
              className="flex-1 bg-clay-500 hover:bg-clay-600 disabled:opacity-60 text-white font-display py-2.5 rounded-full shadow-soft transition-colors focus-ring"
            >
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>

          {modoEdicao && (
            <button
              type="button"
              onClick={excluir}
              disabled={salvando || excluindo}
              className="text-xs text-ink/40 hover:text-clay-600 text-center focus-ring rounded mt-1 disabled:opacity-60"
            >
              {excluindo ? 'Excluindo…' : 'Excluir este agendamento definitivamente'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function Campo({ label, value, onChange, type = 'text', required, step, min, disabled }) {
  return (
    <label className="block">
      <span className="text-sm font-display text-teal-900">{label}</span>
      <input
        type={type}
        value={value}
        step={step}
        min={min}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border-2 border-cream-line focus:border-clay-500 outline-none px-4 py-2.5 text-ink bg-cream-soft focus-ring disabled:opacity-60"
      />
    </label>
  );
}
