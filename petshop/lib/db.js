import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL);

let tabelaGarantida = false;

export async function garantirTabela() {
  if (tabelaGarantida) return;

  await sql`
    CREATE TABLE IF NOT EXISTS agendamentos (
      id SERIAL PRIMARY KEY,
      servico_id VARCHAR(50) NOT NULL,
      servico_nome VARCHAR(120) NOT NULL,
      data DATE NOT NULL,
      hora_inicio TIME NOT NULL,
      hora_fim TIME NOT NULL,
      duracao_minutos INTEGER NOT NULL,
      preco NUMERIC(10,2) NOT NULL,
      cliente_nome VARCHAR(120) NOT NULL,
      cliente_telefone VARCHAR(30) NOT NULL,
      pet_nome VARCHAR(80) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'confirmado',
      criado_em TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  // Migração: distingue agendamentos feitos pelo cliente online dos
  // lançados manualmente pelo administrador (cliente que chega sem marcar).
  await sql`
    ALTER TABLE agendamentos
    ADD COLUMN IF NOT EXISTS origem VARCHAR(20) NOT NULL DEFAULT 'online'
  `;

  // Pacotes: cliente contrata N sessões de um serviço por um valor fechado
  // (ex: 4 banhos por R$140). O pagamento pode acontecer a qualquer momento
  // (início, fim, ou parcial) — por isso guardamos separadamente SE já foi
  // pago e EM QUE DIA, para o relatório contar o valor no dia certo.
  await sql`
    CREATE TABLE IF NOT EXISTS pacotes (
      id SERIAL PRIMARY KEY,
      cliente_nome VARCHAR(120) NOT NULL,
      cliente_telefone VARCHAR(30),
      servico_nome VARCHAR(120) NOT NULL,
      quantidade_total INTEGER NOT NULL,
      quantidade_usada INTEGER NOT NULL DEFAULT 0,
      valor_total NUMERIC(10,2) NOT NULL,
      pago BOOLEAN NOT NULL DEFAULT false,
      data_pagamento DATE,
      status VARCHAR(20) NOT NULL DEFAULT 'ativo',
      data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
      criado_em TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  // Vincula uma sessão de agendamento a um pacote (quando o cliente usa um
  // dos banhos/tosas já contratados em vez de pagar avulso).
  await sql`
    ALTER TABLE agendamentos
    ADD COLUMN IF NOT EXISTS pacote_id INTEGER REFERENCES pacotes(id)
  `;

  // Registros de produção: sistema separado, de uso pessoal de quem realiza
  // os banhos/tosas, para controlar quantos atendimentos fez e quanto tem a
  // receber de comissão. Não tem relação com os agendamentos de clientes.
  await sql`
    CREATE TABLE IF NOT EXISTS producoes (
      id SERIAL PRIMARY KEY,
      servico_nome VARCHAR(120) NOT NULL,
      valor_servico NUMERIC(10,2) NOT NULL,
      valor_comissao NUMERIC(10,2) NOT NULL,
      data DATE NOT NULL DEFAULT CURRENT_DATE,
      observacao VARCHAR(255),
      criado_em TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  tabelaGarantida = true;
}
