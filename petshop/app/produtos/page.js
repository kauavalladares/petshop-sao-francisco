import Link from 'next/link';

export const metadata = {
  title: 'Produtos | Agropecuária e Pet Shop São Francisco',
};

const CATEGORIAS = [
  { nome: 'Ração e alimentação', descricao: 'Linhas para cães, gatos e outros animais, de filhote a idoso.' },
  { nome: 'Petiscos e suplementos', descricao: 'Para recompensar, treinar ou complementar a alimentação.' },
  { nome: 'Higiene e beleza', descricao: 'Shampoos, perfumes e produtos para cuidar do pelo em casa.' },
  { nome: 'Brinquedos', descricao: 'Para gastar energia e estimular o pet no dia a dia.' },
  { nome: 'Acessórios', descricao: 'Coleiras, guias, comedouros e itens do dia a dia.' },
  { nome: 'Camas e casinhas', descricao: 'Conforto para descansar dentro ou fora de casa.' },
  { nome: 'Linha agropecuária', descricao: 'Produtos e insumos para o campo e criação de animais.' },
];

export default function ProdutosPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-14">
      <div className="max-w-2xl mb-12">
        <p className="font-display text-clay-500 text-sm tracking-wide uppercase mb-2">
          Na loja física
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-teal-900 leading-tight">
          Produtos para o seu pet e para o campo
        </h1>
        <p className="mt-4 text-lg text-ink/80">
          Temos um mix completo de produtos disponível na loja. Confira as categorias abaixo e
          fale com a gente para saber sobre disponibilidade e preços.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CATEGORIAS.map((cat) => (
          <div key={cat.nome} className="bg-white rounded-2xl p-6 shadow-soft">
            <p className="font-display text-lg text-teal-900 mb-2">{cat.nome}</p>
            <p className="text-sm text-ink/70">{cat.descricao}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-teal-900 text-cream-soft rounded-xl2 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-display text-2xl mb-1">Quer saber se temos um produto específico?</p>
          <p className="text-cream-soft/80">Fale com a gente pelo telefone ou WhatsApp.</p>
        </div>
        <a
          href="tel:5554996541615"
          className="inline-flex items-center gap-2 bg-clay-500 hover:bg-clay-600 text-white font-display text-lg px-7 py-3.5 rounded-full shadow-soft transition-colors focus-ring whitespace-nowrap"
        >
          (54) 99654-1615
        </a>
      </div>

      <div className="mt-8 text-center">
        <Link href="/agendamento" className="font-display text-teal-800 hover:text-clay-600 transition-colors focus-ring rounded">
          Prefere agendar um banho ou tosa? Clique aqui →
        </Link>
      </div>
    </div>
  );
}
