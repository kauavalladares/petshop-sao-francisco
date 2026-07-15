import Image from 'next/image';
import Link from 'next/link';
import LacoDivider from '@/components/LacoDivider';
import { SERVICOS, formatarPreco } from '@/lib/servicos';

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 pt-12 md:pt-20 pb-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block bg-moss-200 text-moss-600 font-display text-sm px-4 py-1.5 rounded-full mb-5">
              Agropecuária e Pet Shop São Francisco
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-teal-900">
              Banho e tosa marcados em poucos cliques,
              <span className="text-clay-500"> sem telefonema.</span>
            </h1>
            <p className="mt-6 text-lg text-ink/80 max-w-lg">
              Escolha o serviço, veja os horários realmente livres naquele dia e confirme o
              agendamento do seu pet direto pelo site.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/agendamento"
                className="inline-flex items-center gap-2 bg-clay-500 hover:bg-clay-600 text-white font-display text-lg px-7 py-3.5 rounded-full shadow-soft transition-colors focus-ring"
              >
                Agendar banho e tosa
              </Link>
              <Link
                href="/servicos"
                className="inline-flex items-center gap-2 border-2 border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white font-display text-lg px-7 py-3.5 rounded-full transition-colors focus-ring"
              >
                Ver serviços
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center md:justify-end">
            <div className="bg-white rounded-xl2 shadow-soft p-6 md:p-8 rotate-1 max-w-sm">
              <Image
                src="/images/mascote.jpeg"
                alt="Ilustração de um cachorro e um gato tomando banho"
                width={268}
                height={206}
                className="w-full h-auto"
                priority
              />
              <p className="font-display text-teal-900 text-xl mt-4">
                Cuidado de verdade para quem é da família.
              </p>
            </div>
          </div>
        </div>
      </section>

      <LacoDivider />

      {/* SERVIÇOS EM DESTAQUE */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <p className="font-display text-clay-500 text-sm tracking-wide uppercase mb-2">
              Para o seu pet
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-teal-900">
              Banho e tosa sob medida
            </h2>
          </div>
          <Link href="/servicos" className="font-display text-teal-800 hover:text-clay-600 transition-colors focus-ring rounded">
            Ver todos os serviços →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SERVICOS.map((servico) => (
            <div
              key={servico.id}
              className="bg-white rounded-2xl p-6 shadow-soft flex flex-col justify-between"
            >
              <div>
                <p className="font-display text-lg text-teal-900 leading-snug mb-2">
                  {servico.nome}
                </p>
                <p className="text-sm text-ink/70">{servico.resumo}</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="font-display text-2xl text-clay-500">
                  {formatarPreco(servico.preco)}
                </span>
                <span className="text-xs text-ink/50">~{servico.duracaoMin} min</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <LacoDivider color="#D98F4E" />

      {/* COMO FUNCIONA */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 py-16">
        <h2 className="font-display text-3xl md:text-4xl text-teal-900 mb-10 text-center">
          Como funciona o agendamento
        </h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { titulo: 'Escolha o serviço', texto: 'Banho ou tosa, de acordo com o porte do seu pet.' },
            { titulo: 'Veja os horários livres', texto: 'O calendário mostra só o que está realmente disponível.' },
            { titulo: 'Confirme e pronto', texto: 'Seu horário fica reservado — é só trazer o pet.' },
          ].map((passo, i) => (
            <div key={passo.titulo} className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-teal-800 text-cream-soft font-display text-2xl flex items-center justify-center mb-4">
                {i + 1}
              </div>
              <p className="font-display text-lg text-teal-900 mb-1">{passo.titulo}</p>
              <p className="text-sm text-ink/70 max-w-xs mx-auto">{passo.texto}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/agendamento"
            className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-900 text-white font-display text-lg px-7 py-3.5 rounded-full shadow-soft transition-colors focus-ring"
          >
            Agendar agora
          </Link>
        </div>
      </section>
    </>
  );
}
