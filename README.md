# SaaS de catálogo e importação de produtos (Nuvemshop)

O lojista escolhe produtos num catálogo curado, conecta a loja Nuvemshop e paga só pelos produtos que importa
(R$ 1,25 por produto, variantes inclusas, sem mensalidade).

## Rodando localmente

```bash
cp .env.example .env            # gere TOKEN_ENCRYPTION_KEY com: openssl rand -base64 32
docker compose up -d            # Postgres e Redis
npm install
npm run db:migrate              # cria as tabelas
npm run db:seed                 # catálogo de demonstração (20 produtos fictícios)
npm run dev                     # http://localhost:3000
npm test                        # testes de preço, créditos e criptografia
```

## Estrutura

- `prisma/schema.prisma` — modelo de dados (contas, lojas, catálogo, pedidos, livro-razão, importações, auditoria)
- `src/lib/pricing.ts` — preço fixo (Opção A) e progressivo (Opção B), sempre em centavos
- `src/lib/credits.ts` — saldo calculado a partir dos lançamentos do livro-razão
- `src/lib/crypto.ts` — cifra AES-256-GCM dos tokens das lojas

## Roadmap do MVP

1. Base do projeto ✅
2. Catálogo e painel administrativo
3. Vitrine, busca e carrinho do lojista
4. Conexão Nuvemshop (OAuth)
5. Pagamento Pix/cartão e livro-razão de créditos
6. Motor de importação com fila, idempotência e reprocessamento
