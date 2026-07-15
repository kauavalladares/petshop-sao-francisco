import Link from 'next/link';
import LacoDivider from '@/components/LacoDivider';
import { SERVICOS, formatarPreco } from '@/lib/servicos';

export const metadata = {
  title: 'Serviços para o seu Pet | São Francisco',
};

export default function ServicosPage() {
  const banhos = SERVICOS.filter((s) => s.categoria === 'banho');
  const tosas = SERVICOS.filter((s) => s.categoria === 'tosa');

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-14">
      <div className="max-w-2xl mb-12">
        <p className="font-display text-clay-500 text-sm tracking-wide uppercase mb-2">
          Cuidado que o seu pet merece
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-teal-900 leading-tight">
          Serviços para o seu pet
        </h1>
        <p className="mt-4 text-lg text-ink/80">
          Banho e tosa pensados para o porte e o jeito de cada bichinho. Escolha o serviço ideal
          e agende o horário que funciona pra você.
        </p>
      </div>

      <BlocoServico titulo="Banho" descricao="Higiene e conforto, com produtos adequados para a pele e o pelo do seu pet." itens={banhos} />

      <LacoDivider className="my-14" />

      <BlocoServico titulo="Tosa" descricao="Tosa completa, com acabamento caprichado — do porte pequeno ao grande." itens={tosas} />

      <div className="mt-16 bg-teal-900 text-cream-soft rounded-xl2 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-display text-2xl mb-1">Pronto para agendar?</p>
          <p className="text-cream-soft/80">Veja os horários livres e confirme em poucos minutos.</p>
        </div>
        <Link
          href="/agendamento"
          className="inline-flex items-center gap-2 bg-clay-500 hover:bg-clay-600 text-white font-display text-lg px-7 py-3.5 rounded-full shadow-soft transition-colors focus-ring whitespace-nowrap"
        >
          Agendar banho e tosa
        </Link>
      </div>
    </div>
  );
}

function BlocoServico({ titulo, descricao, itens }) {
  return (
    <div>
      <h2 className="font-display text-2xl md:text-3xl text-teal-900 mb-1">{titulo}</h2>
      <p className="text-ink/70 mb-6 max-w-xl">{descricao}</p>
      <div className="grid sm:grid-cols-2 gap-5">
        {itens.map((servico) => (
          <div key={servico.id} className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <p className="font-display text-lg text-teal-900 leading-snug">{servico.nome}</p>
              <span className="font-display text-2xl text-clay-500 whitespace-nowrap">
                {formatarPreco(servico.preco)}
              </span>
            </div>
            <p className="text-sm text-ink/70 mt-2">{servico.resumo}</p>
            <p className="text-xs text-ink/50 mt-3">Duração aproximada: {servico.duracaoMin} minutos</p>
          </div>
        ))}
      </div>
    </div>
  );
}
