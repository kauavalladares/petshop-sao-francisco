import { sql } from './db';

// Fonte única da lógica de pacotes (sessões pré-pagas). Antes, o painel
// administrativo (/api/admin/pacotes) e o painel de produção
// (/api/producao/pacotes-ativos) tinham cada um sua própria versão quase
// idêntica dessas regras, lendo e escrevendo na mesma tabela `pacotes`.
// Agora as duas rotas só validam a origem da chamada e delegam pra cá.

export async function listarPacotes({ status, limit } = {}) {
  if (status) {
    return sql`SELECT * FROM pacotes WHERE status = ${status} ORDER BY criado_em DESC`;
  }
  if (limit) {
    return sql`SELECT * FROM pacotes ORDER BY criado_em DESC LIMIT ${limit}`;
  }
  return sql`SELECT * FROM pacotes ORDER BY criado_em DESC`;
}

// dataVenda é opcional: quando não informada (fluxo rápido da produção),
// assume hoje. Quando informada (fluxo do admin, que permite registrar uma
// venda com data retroativa), usa a data enviada.
export async function criarPacote({
  clienteNome,
  clienteTelefone,
  servicoNome,
  quantidadeTotal,
  valorTotal,
  pago,
  dataVenda,
}) {
  const quantidade = Number(quantidadeTotal);
  const valor = Number(valorTotal);

  if (!clienteNome?.trim() || !servicoNome?.trim() || !Number.isInteger(quantidade) || quantidade < 1) {
    return { erro: 'Preencha cliente, serviço e quantidade.' };
  }
  if (Number.isNaN(valor) || valor < 0) {
    return { erro: 'Valor inválido.' };
  }

  const hojeISO = new Date().toISOString().slice(0, 10);
  const dataVendaFinal = dataVenda || hojeISO;
  const dataPagamento = pago ? dataVendaFinal : null;

  await sql`
    INSERT INTO pacotes
      (cliente_nome, cliente_telefone, servico_nome, quantidade_total, valor_total, pago, data_pagamento, data_venda)
    VALUES
      (${clienteNome.trim()}, ${clienteTelefone?.trim() || null}, ${servicoNome.trim()}, ${quantidade}, ${valor},
       ${Boolean(pago)}, ${dataPagamento}, ${dataVendaFinal})
  `;

  return { sucesso: true };
}

// Edição completa (só usada hoje pelo admin, mas fica disponível para os
// dois lados).
export async function editarPacote(id, campos) {
  const { clienteNome, clienteTelefone, servicoNome, quantidadeTotal, valorTotal, dataVenda } = campos || {};
  const quantidade = Number(quantidadeTotal);
  const valor = Number(valorTotal);

  if (!clienteNome?.trim() || !servicoNome?.trim() || !dataVenda || !Number.isInteger(quantidade) || quantidade < 1) {
    return { erro: 'Preencha cliente, serviço, quantidade e a data da venda.' };
  }
  if (Number.isNaN(valor) || valor < 0) {
    return { erro: 'Valor inválido.' };
  }

  await sql`
    UPDATE pacotes SET
      cliente_nome = ${clienteNome.trim()},
      cliente_telefone = ${clienteTelefone?.trim() || null},
      servico_nome = ${servicoNome.trim()},
      quantidade_total = ${quantidade},
      valor_total = ${valor},
      data_venda = ${dataVenda}
    WHERE id = ${id}
  `;

  return { sucesso: true };
}

export async function marcarPacotePago(id) {
  const hojeISO = new Date().toISOString().slice(0, 10);
  await sql`UPDATE pacotes SET pago = true, data_pagamento = ${hojeISO} WHERE id = ${id}`;
  return { sucesso: true };
}

export async function atualizarStatusPacote(id, status) {
  if (!['ativo', 'finalizado', 'cancelado'].includes(status)) {
    return { erro: 'Dados inválidos.' };
  }
  await sql`UPDATE pacotes SET status = ${status} WHERE id = ${id}`;
  return { sucesso: true };
}

// Exclusão definitiva. Registros de produção e agendamentos que já usaram
// uma sessão desse pacote são mantidos — só perdem o vínculo com o pacote
// apagado (o histórico de comissão/faturamento deles não some).
export async function excluirPacote(id) {
  await sql`UPDATE producoes SET pacote_id = NULL WHERE pacote_id = ${id}`;
  await sql`UPDATE agendamentos SET pacote_id = NULL WHERE pacote_id = ${id}`;
  await sql`DELETE FROM pacotes WHERE id = ${id}`;
  return { sucesso: true };
}

// Ajusta quantas sessões de um pacote já foram usadas (delta +1 ou -1) e
// mantém o status do pacote em dia ('ativo' <-> 'finalizado'). Chamado tanto
// ao lançar/excluir um agendamento vinculado a um pacote (painel admin)
// quanto um registro de produção vinculado a um pacote (painel produção) —
// antes essa função também estava duplicada nos dois arquivos de rota.
export async function ajustarUsoPacote(pacoteId, delta) {
  const rows = await sql`SELECT quantidade_total, quantidade_usada, status FROM pacotes WHERE id = ${pacoteId}`;
  const pacote = rows[0];
  if (!pacote || pacote.status === 'cancelado') return;
  const novaUsada = Math.max(0, pacote.quantidade_usada + delta);
  const novoStatus = novaUsada >= pacote.quantidade_total ? 'finalizado' : 'ativo';
  await sql`UPDATE pacotes SET quantidade_usada = ${novaUsada}, status = ${novoStatus} WHERE id = ${pacoteId}`;
}
