export const PERCENTUAL_COMISSAO = 0.5;

export function calcularComissao(valorServico) {
  return Math.round(Number(valorServico) * PERCENTUAL_COMISSAO * 100) / 100;
}
