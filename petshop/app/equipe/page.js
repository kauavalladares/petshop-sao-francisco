import Link from 'next/link';

export const metadata = {
  title: 'Acesso da equipe | São Francisco',
};

export default function EquipePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24">
      <p className="font-display text-clay-500 text-sm tracking-wide uppercase mb-2 text-center">
        Área restrita
      </p>
      <h1 className="font-display text-3xl text-teal-900 text-center mb-10">Acesso da equipe</h1>

      <div className="grid gap-4">
        <Link
          href="/admin"
          className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-md transition-shadow focus-ring block"
        >
          <p className="font-display text-xl text-teal-900 mb-1">Painel administrativo</p>
          <p className="text-sm text-ink/60">Agendamentos, agenda, relatório e pacotes da loja.</p>
        </Link>

        <Link
          href="/producao"
          className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-md transition-shadow focus-ring block"
        >
          <p className="font-display text-xl text-teal-900 mb-1">Controle de produção</p>
          <p className="text-sm text-ink/60">Registro de banhos, comissão e relatórios pessoais.</p>
        </Link>
      </div>
    </div>
  );
}
