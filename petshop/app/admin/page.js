'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function entrar(e) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);

    try {
      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setErro(data.erro || 'Senha incorreta.');
        return;
      }
      router.push('/admin/painel');
      router.refresh();
    } catch {
      setErro('Não foi possível entrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <p className="font-display text-clay-500 text-sm tracking-wide uppercase mb-2 text-center">
        Área restrita
      </p>
      <h1 className="font-display text-3xl text-teal-900 text-center mb-8">Painel administrativo</h1>

      <form onSubmit={entrar} className="bg-white rounded-2xl shadow-soft p-6 grid gap-4">
        <label className="block">
          <span className="text-sm font-display text-teal-900">Senha</span>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoFocus
            className="mt-1.5 w-full rounded-xl border-2 border-cream-line focus:border-clay-500 outline-none px-4 py-2.5 bg-cream-soft focus-ring"
          />
        </label>

        {erro && <p className="text-sm text-clay-600">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="bg-teal-800 hover:bg-teal-900 disabled:opacity-60 text-white font-display text-lg py-3 rounded-full shadow-soft transition-colors focus-ring"
        >
          {carregando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
