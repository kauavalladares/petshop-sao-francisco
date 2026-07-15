# Agropecuária e Pet Shop São Francisco — Site com Agendamento

Site em Next.js com:
- Página inicial, Serviços e Produtos com a identidade visual da logo
- Agendamento online de banho e tosa com calendário de horários realmente disponíveis
- Painel administrativo (`/admin`) para ver, concluir ou cancelar agendamentos
- Banco de dados Postgres (Vercel Postgres) para guardar os agendamentos

---

## 1. Publicar no Vercel (passo a passo)

### 1.1. Subir o projeto
1. Crie uma conta em [vercel.com](https://vercel.com) (dá pra entrar com GitHub).
2. Suba esta pasta para um repositório no GitHub (pode arrastar os arquivos direto pelo
   site do GitHub em "Add file → Upload files", não precisa saber usar Git).
3. No Vercel, clique em **Add New → Project** e importe esse repositório.
4. Não precisa mudar nenhuma configuração de build — o Vercel detecta o Next.js
   automaticamente. Clique em **Deploy**.

O primeiro deploy provavelmente vai falhar (ou funcionar parcialmente) porque ainda
faltam duas coisas: o banco de dados e a senha do painel. Vamos configurar agora.

### 1.2. Criar o banco de dados (Neon Postgres)
1. Dentro do projeto no Vercel, vá na aba **Storage**.
2. Em **Marketplace Database Providers**, clique em **Neon** ("Serverless Postgres") e
   siga os passos (pode manter tudo no padrão — plano gratuito é suficiente para começar).
3. Depois de criado, confirme a conexão com o seu projeto quando solicitado.
   Isso preenche automaticamente a variável `DATABASE_URL` — você não precisa
   copiar nada manualmente.

A tabela de agendamentos é criada sozinha automaticamente na primeira vez que
alguém acessa o site ou o painel — não é necessário rodar o `schema.sql` manualmente.

### 1.3. Definir a senha do painel administrativo
1. Vá em **Settings → Environment Variables**.
2. Adicione uma variável:
   - Nome: `ADMIN_PASSWORD`
   - Valor: a senha que vocês vão usar para entrar em `/admin`
3. Salve.

### 1.4. Reimplantar (redeploy)
Depois de conectar o banco e adicionar a senha, vá na aba **Deployments**, abra
o último deploy e clique em **Redeploy** para aplicar as novas configurações.

Pronto — o site estará no ar em um endereço como `seu-projeto.vercel.app`.
Depois, em **Settings → Domains**, dá pra apontar um domínio próprio (ex:
`petshopsaofrancisco.com.br`) se vocês tiverem um.

---

## 2. Como usar o painel administrativo

Acesse `seusite.vercel.app/admin`, entre com a senha definida em `ADMIN_PASSWORD`.
Lá é possível ver todos os agendamentos futuros, marcar como **Concluído** ou
**Cancelado**.

---

## 3. Como editar informações do site

Você não precisa saber programar para ajustar os pontos abaixo — é só abrir o
arquivo indicado, mudar o texto/número e salvar. Se o repositório estiver no
GitHub, dá pra editar direto pelo site do GitHub (ícone de lápis em cada arquivo).

- **Preços, nomes e duração dos serviços:** `lib/servicos.js`
- **Dias e horários de funcionamento:** `lib/horario.js`
- **Categorias de produtos:** `app/produtos/page.js`
- **Telefone e endereço:** `components/Footer.js`
- **Logo e ilustração:** arquivos em `public/images/`

Depois de editar qualquer arquivo pelo GitHub, o Vercel publica a mudança
automaticamente em 1 ou 2 minutos.

---

## 4. Rodar o projeto no computador (opcional, para quem for mexer no código)

Requer [Node.js](https://nodejs.org) instalado.

```bash
npm install
cp .env.example .env.local   # depois preencha ADMIN_PASSWORD
npm run dev
```

Acesse `http://localhost:3000`. Para testar o agendamento localmente também é
necessário um banco Postgres (recomendo usar o mesmo Vercel Postgres do projeto,
copiando as variáveis em Settings → Environment Variables → `.env.local`, ou
rodando `vercel env pull .env.local` com a Vercel CLI).

---

## 5. Estrutura do projeto

```
app/
  page.js                 → Página inicial
  servicos/page.js        → Página de serviços (banho e tosa)
  produtos/page.js        → Página de produtos
  agendamento/page.js     → Página de agendamento
  admin/page.js           → Login do painel
  admin/painel/page.js    → Painel administrativo
  api/                    → Rotas de backend (horários, agendamentos, admin)
components/
  Header.js, Footer.js, BookingWidget.js, LacoDivider.js
lib/
  servicos.js             → Lista de serviços, preços e duração
  horario.js               → Dias e horários de funcionamento
  slots.js                → Cálculo dos horários disponíveis
  db.js                    → Conexão com o banco de dados
```
