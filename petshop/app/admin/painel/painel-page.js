'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_LABEL = {
  confirmado: { texto: 'Confirmado', cor: 'bg-teal-800 text-white' },
  concluido: { texto: 'Concluído', cor: 'bg-moss-500 text-white' },
  cancelado: { texto: 'Cancelado', cor: 'bg-cream-line text-ink/50 line-through' },
};

export default function PainelAdminPage() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const router = useRouter();

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

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function atualizarStatus(id, status) {
    setAgendamentos((atual) => atual.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await fetch('/api/admin/agendamentos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
    } catch {
      carregar();
    }
  }

  async function sair() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  }

  const agrupados = agrupar(agendamentos);

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-display text-clay-500 text-sm tracking-wide uppercase mb-1">
            Painel administrativo
          </p>
          <h1 className="font-display text-3xl text-teal-900">Agendamentos</h1>
        </div>
        <button
          type="button"
          onClick={sair}
          className="text-sm text-teal-800 hover:text-clay-600 focus-ring rounded"
        >
          Sair
        </button>
      </div>

      {carregando && <p className="text-ink/60">Carregando…</p>}
      {erro && <p className="text-clay-600">{erro}</p>}

      {!carregando && !erro && agendamentos.length === 0 && (
        <p className="text-ink/60">Nenhum agendamento encontrado a partir de hoje.</p>
      )}

      <div className="grid gap-8">
        {Object.entries(agrupados).map(([data, lista]) => (
          <div key={data}>
            <p className="font-display text-lg text-teal-900 mb-3">{formatarDataLonga(data)}</p>
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
                    <p className="font-display text-teal-900">{a.servico_nome}</p>
                    <p className="text-sm text-ink/70">
                      Pet: {a.pet_nome} · Tutor: {a.cliente_nome}
                    </p>
                    <p className="text-sm text-ink/50">{a.cliente_telefone}</p>
                  </div>

                  <span className={`self-start md:self-auto text-xs font-display px-3 py-1 rounded-full shrink-0 ${STATUS_LABEL[a.status]?.cor || ''}`}>
                    {STATUS_LABEL[a.status]?.texto || a.status}
                  </span>

                  <div className="flex gap-2 shrink-0 self-start md:self-auto">
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
    </div>
  );
}

function agrupar(agendamentos) {
  return agendamentos.reduce((acc, a) => {
    const chave = typeof a.data === 'string' ? a.data.slice(0, 10) : a.data;
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
