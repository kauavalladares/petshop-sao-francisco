'use client';

import { useState } from 'react';
import { SERVICOS } from '@/lib/servicos';

export default function PacoteRapidoModal({ onFechar, onSalvo }) {
  const [form, setForm] = useState({
    clienteNome: '',
    clienteTelefone: '',
    servicoNome: SERVICOS[0].nome,
    quantidadeTotal: '4',
    valorTotal: '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  function alterarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function salvar(e) {
    e.preventDefault();
    setErro(null);

    if (!form.clienteNome.trim() || !form.servicoNome.trim() || form.valorTotal === '' || !form.quantidadeTotal) {
      setErro('Preencha cliente, serviço, quantidade e valor.');
      return;
    }
    const quantidade = Number(form.quantidadeTotal);
    if (!Number.isInteger(quantidade) || quantidade < 1) {
      setErro('A quantidade de sessões precisa ser um número inteiro, no mínimo 1.');
      return;
    }

    setSalvando(true);
    try {
      const resp = await fetch('/api/producao/pacotes-ativos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNome: form.clienteNome,
          clienteTelefone: form.clienteTelefone,
          servicoNome: form.servicoNome,
          quantidadeTotal: quantidade,
          valorTotal: Number(form.valorTotal),
        }),
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

  const valorPorSessao =
    form.valorTotal !== '' && Number(form.quantidadeTotal) > 0
      ? Number(form.valorTotal) / Number(form.quantidadeTotal)
      : null;

  return (
    <div className="fixed inset-0 z-[60] bg-ink/50 flex items-center justify-center p-4" onClick={onFechar}>
      <div
        className="bg-white rounded-2xl shadow-soft w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="font-display text-xl text-teal-900">Novo pacote</p>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="text-ink/50 hover:text-ink text-2xl leading-none focus-ring rounded"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-ink/60 mb-5">
          Ex: cliente contrata 4 banhos por um valor fechado e volta em dias diferentes para usar.
        </p>

        <form onSubmit={salvar} className="grid gap-4">
          <Campo
            label="Nome do cliente"
            value={form.clienteNome}
            onChange={(v) => alterarCampo('clienteNome', v)}
            required
          />
          <Campo
            label="Telefone (opcional)"
            value={form.clienteTelefone}
            onChange={(v) => alterarCampo('clienteTelefone', v)}
            type="tel"
          />

          <label className="block">
            <span className="text-sm font-display text-teal-900">Serviço incluído no pacote</span>
            <select
              value={form.servicoNome}
              onChange={(e) => alterarCampo('servicoNome', e.target.value)}
              className="mt-1.5 w-full rounded-xl border-2 border-cream-line focus:border-clay-500 outline-none px-4 py-2.5 bg-cream-soft focus-ring"
            >
              {SERVICOS.map((s) => (
                <option key={s.id} value={s.nome}>
                  {s.nome}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <Campo
              label="Quantidade de sessões"
              value={form.quantidadeTotal}
              onChange={(v) => alterarCampo('quantidadeTotal', v)}
              type="number"
              min="1"
              step="1"
              required
            />
            <Campo
              label="Valor total (R$)"
              value={form.valorTotal}
              onChange={(v) => alterarCampo('valorTotal', v)}
              type="number"
              step="0.01"
              min="0"
              required
            />
          </div>

          {valorPorSessao !== null && (
            <p className="text-xs text-ink/50 -mt-2">
              Equivale a {valorPorSessao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por sessão
            </p>
          )}

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
              disabled={salvando}
              className="flex-1 bg-clay-500 hover:bg-clay-600 disabled:opacity-60 text-white font-display py-2.5 rounded-full shadow-soft transition-colors focus-ring"
            >
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Campo({ label, value, onChange, type = 'text', required, step, min }) {
  return (
    <label className="block">
      <span className="text-sm font-display text-teal-900">{label}</span>
      <input
        type={type}
        value={value}
        step={step}
        min={min}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border-2 border-cream-line focus:border-clay-500 outline-none px-4 py-2.5 text-ink bg-cream-soft focus-ring"
      />
    </label>
  );
}
