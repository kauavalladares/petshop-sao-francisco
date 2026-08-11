'use client';

import { useState } from 'react';
import { SERVICOS, formatarPreco } from '@/lib/servicos';
import { calcularComissao } from '@/lib/comissao';

export default function EditarRegistroModal({ registro, onFechar, onSalvo }) {
  const vinculadoAPacote = Boolean(registro.pacote_id);

  const [form, setForm] = useState({
    servicoId: SERVICOS.find((s) => s.nome === registro.servico_nome)?.id || 'outro',
    servicoNome: registro.servico_nome,
    valorServico: String(Number(registro.valor_servico)),
    data: registro.data?.slice ? registro.data.slice(0, 10) : registro.data,
    observacao: registro.observacao || '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  function alterarServico(servicoId) {
    if (servicoId === 'outro') {
      setForm((f) => ({ ...f, servicoId, servicoNome: '' }));
      return;
    }
    const servico = SERVICOS.find((s) => s.id === servicoId);
    setForm((f) => ({ ...f, servicoId, servicoNome: servico.nome, valorServico: String(servico.preco) }));
  }

  async function salvar(e) {
    e.preventDefault();
    setErro(null);

    if (!form.servicoNome.trim() || form.valorServico === '' || !form.data) {
      setErro('Preencha o serviço, o valor e a data.');
      return;
    }

    setSalvando(true);
    try {
      const resp = await fetch('/api/producao/registros', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: registro.id,
          servicoNome: form.servicoNome,
          valorServico: Number(form.valorServico),
          data: form.data,
          observacao: form.observacao,
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

  const comissaoPrevista = form.valorServico !== '' ? calcularComissao(Number(form.valorServico) || 0) : 0;

  return (
    <div className="fixed inset-0 z-[60] bg-ink/50 flex items-center justify-center p-4" onClick={onFechar}>
      <div
        className="bg-white rounded-2xl shadow-soft w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="font-display text-xl text-teal-900">Editar registro</p>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="text-ink/50 hover:text-ink text-2xl leading-none focus-ring rounded"
          >
            ×
          </button>
        </div>

        {vinculadoAPacote && (
          <p className="text-sm text-teal-800 bg-clay-100 rounded-xl px-4 py-2.5 mb-5">
            Este registro faz parte de um pacote — serviço e valor ficam travados aqui.
          </p>
        )}

        <form onSubmit={salvar} className="grid gap-4">
          <label className="block">
            <span className="text-sm font-display text-teal-900">Serviço</span>
            <select
              value={form.servicoId}
              onChange={(e) => alterarServico(e.target.value)}
              disabled={vinculadoAPacote}
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

          {form.servicoId === 'outro' && !vinculadoAPacote && (
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
            <label className="block">
              <span className="text-sm font-display text-teal-900">Valor do serviço (R$)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.valorServico}
                onChange={(e) => setForm((f) => ({ ...f, valorServico: e.target.value }))}
                required
                disabled={vinculadoAPacote}
                className="mt-1.5 w-full rounded-xl border-2 border-cream-line focus:border-clay-500 outline-none px-4 py-2.5 bg-cream-soft focus-ring disabled:opacity-60"
              />
            </label>
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
            Sua parte: <strong>{formatarPreco(comissaoPrevista)}</strong>
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
