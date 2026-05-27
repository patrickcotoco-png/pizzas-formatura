# Pré-venda de Pizzas Artesanais de Formatura

Lojinha/cardápio online mobile-first para pré-venda de pizzas artesanais no forno a lenha, com carrinho, combos, controle de vagas por horário, Pix e painel admin simples.

## Stack

- Next.js + TypeScript
- Tailwind CSS
- Supabase
- Pronto para deploy na Vercel

## Rodar localmente

1. Instale as dependências:

```bash
npm install
```

2. Copie o arquivo de ambiente:

```bash
cp .env.example .env.local
```

3. Configure `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
ADMIN_PASSWORD=uma-senha-forte
```

4. Crie o banco no Supabase seguindo a seção abaixo.

5. Rode o projeto:

```bash
npm run dev
```

6. Abra:

- Loja: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

## Criar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Abra `SQL Editor`.
3. Cole e execute o conteúdo de `supabase/migrations/001_initial_schema.sql`.
4. Em `Project Settings > API`, copie:
   - `Project URL` para `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` para `NEXT_PUBLIC_SUPABASE_ANON_KEY`

O SQL cria:

- `products`
- `time_slots`
- `orders`
- seed do cardápio
- seed dos horários de 16/05 e 17/05
- função `create_order_safely`

## Controle de vagas

A finalização do pedido usa a função transacional `create_order_safely` no Supabase. Ela bloqueia os horários da rodada durante a operação, verifica novamente:

- limite de 5 pizzas por horário
- limite de 30 pizzas por rodada
- bebidas fora da contagem
- combos contando como 3 ou 4 pizzas

Se duas pessoas tentarem pegar a última vaga ao mesmo tempo, somente a primeira finalização válida cria pedido e atualiza `current_pizzas`.

## Admin

A rota `/admin` pede a senha definida em `ADMIN_PASSWORD`.

O painel mostra:

- lista de pedidos
- filtros por dia, rodada, horário, pagamento e status do pedido
- total vendido, pago e pendente
- pizzas por sabor
- bebidas
- vagas restantes por horário
- total de pizzas por rodada

Também permite atualizar:

- pagamento: `pendente`, `pago`, `confirmado`
- pedido: `recebido`, `em preparo`, `pronto`, `entregue`, `cancelado`

## Deploy na Vercel

1. Suba o projeto para um repositório Git.
2. Importe o repositório na Vercel.
3. Configure as variáveis de ambiente na Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
ADMIN_PASSWORD=uma-senha-forte
```

4. Faça o deploy.

## Observações

- Não há pagamento online real. A tela final mostra a chave Pix e instruções para envio/apresentação do comprovante.
- Não há login complexo. O admin usa senha simples via variável de ambiente.
- O projeto não inclui venda avulsa no dia nem pizza grande.
