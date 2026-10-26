# SaaS de catálogo e importação de produtos (Nuvemshop)

O lojista escolhe produtos num catálogo curado, conecta a loja Nuvemshop e paga só pelos produtos que importa
(R$ 1,25 por produto, variantes inclusas, sem mensalidade).

## Rodando localmente

```bash
cp .env.example .env            # gere TOKEN_ENCRYPTION_KEY com: openssl rand -base64 32
docker compose up -d            # Postgres e Redis
npm install
npm run db:migrate              # cria as tabelas
ADMIN_EMAIL=voce@exemplo.com ADMIN_PASSWORD=troque-esta-senha npm run db:seed   # catálogo demo + 1º admin
npm run dev                     # http://localhost:3000
npm run worker                  # processa a fila de importação (outro terminal)
npm test                        # testes de unidade e de integração (usam o Postgres do .env)
```

## Estrutura

- `prisma/schema.prisma` — modelo de dados (contas, lojas, catálogo, pedidos, livro-razão, importações, auditoria)
- `src/lib/pricing.ts` — preço fixo (Opção A) e progressivo (Opção B), sempre em centavos
- `src/lib/credits.ts` — saldo calculado a partir dos lançamentos do livro-razão
- `src/lib/crypto.ts` — cifra AES-256-GCM dos tokens das lojas

## Roadmap do MVP

1. Base do projeto ✅
2. Catálogo e painel administrativo ✅
3. Vitrine, busca e carrinho do lojista ✅
4. Conexão Nuvemshop (OAuth) ✅
5. Pagamento Pix/cartão (Mercado Pago) e livro-razão de créditos ✅
6. Motor de importação com fila, idempotência e reprocessamento ✅

## Publicação

Passo a passo em [DEPLOY.md](DEPLOY.md): Supabase (banco), Vercel (site), Render (fila e worker) e UptimeRobot.

## Testando sem uma loja real

`scripts/mock-nuvemshop.mjs` imita o OAuth e a API de produtos da Nuvemshop (incluindo limite 429, erro 422 e resposta perdida).

```bash
APP_URL=http://localhost:3000 node scripts/mock-nuvemshop.mjs
# no .env:
# NUVEMSHOP_AUTH_BASE="http://localhost:4010"  NUVEMSHOP_API_BASE="http://localhost:4010"
# NUVEMSHOP_CLIENT_ID="123"  NUVEMSHOP_CLIENT_SECRET="segredo"
```
