'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const LINKS = [
  { href: '/', label: 'Início' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/produtos', label: 'Produtos' },
];

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-cream-soft/95 backdrop-blur border-b border-cream-line">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex items-center justify-between h-20 md:h-24">
          <Link href="/" className="flex items-center gap-3 focus-ring rounded-lg" onClick={() => setMenuAberto(false)}>
            <Image
              src="/images/logo.png"
              alt="Agropecuária e Pet Shop São Francisco"
              width={280}
              height={51}
              priority
              className="h-10 md:h-14 w-auto"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-display text-teal-900 text-lg">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-clay-600 transition-colors focus-ring rounded">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link
              href="/agendamento"
              className="inline-flex items-center gap-2 bg-clay-500 hover:bg-clay-600 text-white font-display text-lg px-6 py-3 rounded-full shadow-soft transition-colors focus-ring"
            >
              Agendar banho e tosa
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-teal-900 focus-ring rounded"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto((v) => !v)}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              {menuAberto ? (
                <path d="M6 6 L18 18 M18 6 L6 18" />
              ) : (
                <path d="M4 7h16 M4 12h16 M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuAberto && (
        <div className="md:hidden border-t border-cream-line bg-cream-soft">
          <nav className="flex flex-col px-4 py-4 gap-1 font-display text-teal-900 text-lg">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2 focus-ring rounded"
                onClick={() => setMenuAberto(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/agendamento"
              className="mt-2 text-center bg-clay-500 hover:bg-clay-600 text-white px-6 py-3 rounded-full shadow-soft"
              onClick={() => setMenuAberto(false)}
            >
              Agendar banho e tosa
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
