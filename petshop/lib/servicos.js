export const SERVICOS = [
  {
    id: 'banho-pm',
    nome: 'Banho — porte pequeno/médio',
    resumo: 'Para cães e gatos de pequeno a médio porte.',
    preco: 40,
    duracaoMin: 40,
    categoria: 'banho',
  },
  {
    id: 'banho-g',
    nome: 'Banho — porte grande',
    resumo: 'Para cães de grande porte.',
    preco: 100,
    duracaoMin: 40,
    categoria: 'banho',
  },
  {
    id: 'tosa-menor',
    nome: 'Tosa — cães menores',
    resumo: 'Tosa completa para cães de porte menor.',
    preco: 80,
    duracaoMin: 90,
    categoria: 'tosa',
  },
  {
    id: 'tosa-maior',
    nome: 'Tosa — cães maiores',
    resumo: 'Tosa completa para cães de porte maior.',
    preco: 150,
    duracaoMin: 90,
    categoria: 'tosa',
  },
];

export function getServico(id) {
  return SERVICOS.find((s) => s.id === id) || null;
}

export function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
