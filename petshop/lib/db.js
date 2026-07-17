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

  tabelaGarantida = true;
}
