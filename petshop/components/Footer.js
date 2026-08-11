import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-teal-900 text-cream-soft mt-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl mb-2">São Francisco</p>
          <p className="text-cream/80 text-sm leading-relaxed max-w-xs">
            Agropecuária e Pet Shop São Francisco. Cuidado de verdade para quem faz parte da sua família.
          </p>
        </div>

        <div>
          <p className="font-display text-lg mb-3 text-clay-400">Contato</p>
          <ul className="space-y-2 text-sm text-cream-soft/90">
            <li>
              <a href="tel:5554996541615" className="hover:text-clay-400 transition-colors">
                (54) 99654-1615
              </a>
            </li>
            <li>R. Bento Gonçalves, 1587</li>
          </ul>
        </div>

        <div>
          <p className="font-display text-lg mb-3 text-clay-400">Horário de atendimento</p>
          <ul className="space-y-1 text-sm text-cream-soft/90">
            <li>Segunda a sexta</li>
            <li>9h às 12h &nbsp;·&nbsp; 13h às 17h30</li>
          </ul>
          <Link
            href="/agendamento"
            className="inline-block mt-4 bg-clay-500 hover:bg-clay-600 text-white text-sm font-display px-5 py-2.5 rounded-full transition-colors focus-ring"
          >
            Agendar horário
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-cream-soft/60">
        © {new Date().getFullYear()} Agropecuária e Pet Shop São Francisco
        {' · '}
        <Link href="/equipe" className="hover:text-cream-soft/90 transition-colors">
          (Acesso da equipe)
        </Link>
      </div>
    </footer>
  );
}
