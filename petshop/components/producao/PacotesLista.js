'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatarPreco } from '@/lib/servicos';
import PacoteRapidoModal from './PacoteRapidoModal';

const STATUS_LABEL = {
  ativo: { texto: 'Ativo', cor: 'bg-teal-800 text-white' },
  finalizado: { texto: 'Concluído', cor: 'bg-moss-500 text-white' },
  cancelado: { texto: 'Cancelado', cor: 'bg-cream-line text-ink/50 line-through' },
};

function formatarDataCurta(iso) {
  if (!iso) return '';
  const data = iso.slice ? iso.slice(0, 10) : iso;
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function PacotesLista() {
  const [pacotes, setPacotes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [modalPacote, setModalPacote] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resp = await fetch('/api/producao/pacotes-ativos?status=todos');
      const data = await resp.json();
      if (!resp.ok) {
        setErro(data.erro || 'Não foi possível carregar os pacotes.');
        return;
      }
      setPacotes(data.pacotes || []);
    } catch {
      setErro('Não foi possível carregar os pacotes.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function marcarPago(id) {
    setPacotes((atual) => atual.map((p) => (p.id === id ? { ...p, pago: true } : p)));
    try {
      await fetch('/api/producao/pacotes-ativos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, marcarPago: true }),
      });
      carregar();
    } catch {
      carregar();
    }
  }

  async function excluirPacote(id) {
    if (!window.confirm('Excluir este pacote definitivamente? Essa ação não pode ser desfeita.')) return;
    setPacotes((atual) => atual.filter((p) => p.id !== id));
    try {
      await fetch(`/api/producao/pacotes-ativos?id=${id}`, { method: 'DELETE' });
    } catch {
      carregar();
    }
  }

  const grupos = [
    { chave: 'ativo', titulo: 'Ativos' },
    { chave: 'finalizado', titulo: 'Concluídos' },
    { chave: 'cancelado', titulo: 'Cancelados' },
  ].map((g) => ({ ...g, itens: pacotes.filter((p) => p.status === g.chave) }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <p className="text-sm text-ink/60 max-w-sm">
          Pacotes que os clientes contrataram (ex: 4 banhos por um valor fechado).
        </p>
        <button
          type="button"
          onClick={() => setModalPacote(true)}
          className="text-sm font-display bg-clay-500 hover:bg-clay-600 text-white px-4 py-2.5 rounded-full shadow-soft transition-colors focus-ring shrink-0"
        >
          + Novo pacote
        </button>
      </div>

      {carregando && <p className="text-ink/60">Carregando…</p>}
      {erro && <p className="text-clay-600">{erro}</p>}

      {!carregando && !erro && pacotes.length === 0 && (
        <p className="text-ink/60">Nenhum pacote cadastrado ainda.</p>
      )}

      <div className="grid gap-8">
        {grupos.map(
          (g) =>
            g.itens.length > 0 && (
              <div key={g.chave}>
                <p className="font-display text-lg text-teal-900 mb-3">{g.titulo}</p>
                <div className="grid gap-3">
                  {g.itens.map((p) => {
                    const valorPorSessao = Number(p.valor_total) / p.quantidade_total;
                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-2xl shadow-soft p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-6"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <p className="font-display text-teal-900">{p.cliente_nome}</p>
                            <span className="text-xs text-ink/50">
                              {p.quantidade_usada}/{p.quantidade_total} usadas
                            </span>
                          </div>
                          <p className="text-sm text-ink/70">{p.servico_nome}</p>
                        </div>

                        <div className="text-left md:text-right shrink-0">
                          <p className="font-display text-clay-500">{formatarPreco(Number(p.valor_total))}</p>
                          <p className="text-xs text-ink/50">{formatarPreco(valorPorSessao)} por sessão</p>
                        </div>

                        <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                          <span
                            className={`text-xs font-display px-3 py-1 rounded-full ${
                              STATUS_LABEL[p.status]?.cor || ''
                            }`}
                          >
                            {STATUS_LABEL[p.status]?.texto || p.status}
                          </span>
                          <span className="text-xs text-ink/50">
                            {p.pago ? `Pago em ${formatarDataCurta(p.data_pagamento)}` : 'Pagamento pendente'}
                          </span>
                        </div>

                        <div className="flex gap-2 shrink-0 flex-wrap">
                          {!p.pago && p.status !== 'cancelado' && (
                            <button
                              type="button"
                              onClick={() => marcarPago(p.id)}
                              className="text-xs font-display border-2 border-moss-500 text-moss-600 hover:bg-moss-500 hover:text-white px-3 py-1.5 rounded-full transition-colors focus-ring"
                            >
                              Marcar como pago
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => excluirPacote(p.id)}
                            className="text-xs font-display border-2 border-red-400 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-full transition-colors focus-ring"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
        )}
      </div>

      {modalPacote && (
        <PacoteRapidoModal
          onFechar={() => setModalPacote(false)}
          onSalvo={() => {
            setModalPacote(false);
            carregar();
          }}
        />
      )}
    </div>
  );
}
