# Auditoria inicial do código

Data: 2026-10-27. Branch analisada: `fix-producao` (commit `21a33c1`), com produção em
`https://ssas-de-catalogo-e-importa-o-de-pro.vercel.app`. Branch de trabalho: `evolucao-fase-0`.

Tudo o que aparece aqui foi verificado lendo o código, rodando os comandos e consultando o banco de
produção somente para leitura. Quando algo não pôde ser verificado, o texto diz isso.

## 1. Resumo

O protótipo é melhor do que a interface sugere. O núcleo de cobrança e importação já está pronto
para produção:

- livro-razão de créditos;
- idempotência de webhooks;
- trava de pedido;
- reconciliação por SKU;
- reprocessamento gratuito;
- cifra dos tokens.

O que falta é quase tudo ao redor desse núcleo:

- não existe o conceito de **fornecedor**, porque o catálogo é curado pela equipe interna;
- não há e-mail transacional (verificação de e-mail, recuperação de senha);
- não há preços configuráveis pelo painel;
- não há i18n;
- a interface é funcional, mas crua.

Também há três bloqueios externos: o app de parceiro da Nuvemshop, as credenciais do Mercado Pago e
um catálogo real com fotos licenciadas.

## 2. Stack encontrada

| Item | Encontrado |
|---|---|
| Linguagem | TypeScript 5.9 (strict) |
| Frontend | Next.js 15.5 (App Router, Server Components e Server Actions), React 19.1 |
| Estilo | CSS próprio em `src/app/globals.css` (92 linhas, variáveis CSS, modo escuro automático). Sem Tailwind e sem biblioteca de componentes. |
| Backend | Rotas `src/app/api/*` e Server Actions; regras de negócio em `src/lib/*` |
| Validação | Zod 4 (cadastro e formulários do admin) |
| Banco | PostgreSQL no Supabase (projeto `kmxyocrywcwxbnrowhrt`, região sa-east-1), via pooler |
| ORM | Prisma 6.19 com 4 migrations versionadas |
| Fila | BullMQ 6 + ioredis. O worker roda no Render (plano gratuito, Web Service). Em produção não há Redis: o worker busca itens pagos direto no banco a cada 5 s. |
| Autenticação | Própria: senha com scrypt e sessão em cookie httpOnly, guardando só o hash do token no banco |
| Estado no cliente | Nenhum gerenciador; o estado fica no servidor e na URL |
| Testes | Vitest 5, com 9 arquivos e 44 testes no início (unitários e de integração com Postgres real) |
| CI | GitHub Actions `ci.yml` (Postgres 16, migrate, tsc, lint, test, build) e `monitor.yml` (saúde a cada 10 min) |
| Deploy | Vercel (projeto `ssas-de-catalogo-e-importa-o-de-pro`): migrations rodam só em produção (`vercel-build`) |

## 3. Classificação das funcionalidades

Legenda:

- ✅ Funcional e validado
- 🟡 Funcional, mas precisa de melhorias
- 🟠 Parcialmente implementado
- 🎭 Interface sem backend real
- ❌ Inexistente
- 🔒 Bloqueado por configuração ou credenciais

| Funcionalidade | Situação | Evidência / arquivos |
|---|---|---|
| Cadastro e login de lojista | 🟡 | `src/app/(auth)/actions.ts`. Sem verificação de e-mail, sem recuperação de senha. Antes desta auditoria não havia limite de tentativas. |
| Sessões | ✅ | `src/lib/auth.ts`. Token aleatório de 32 bytes; o banco guarda só o SHA-256. Cookie httpOnly, secure e sameSite=lax. |
| Papéis internos (operador, revisor, suporte, financeiro, admin) | 🟡 | Enum `UserRole` e `requireRole`. Não há tela para gerir usuários nem papéis: hoje isso só se faz pelo banco. |
| Organizações e equipes | ❌ | Existe `Account` com vários `User`, mas não há convites, papéis por organização nem tipos de conta (fornecedor ou lojista). |
| Fornecedores (cadastro, painel, produtos próprios) | ❌ | Não existe entidade de fornecedor. Os produtos pertencem à plataforma. |
| Cadastro de produto pela equipe | ✅ | `src/app/admin/produtos/*` e `src/lib/catalog-admin.ts`, com versão e histórico no AuditLog. |
| Importação de catálogo por CSV (equipe) | 🟡 | `src/lib/catalog-csv.ts`. Tem prévia e validação, mas grava tudo ou nada, é síncrona e não aceita XLSX. |
| Fluxo editorial (rascunho → revisão → aprovado) | ✅ | Só o revisor aprova. Testado em `catalog-admin`. |
| Catálogo para o lojista (busca, categoria, marca, paginação) | 🟡 | `src/app/(loja)/catalogo/page.tsx`. A busca usa `contains`, sem índice de texto. Faltam filtros de fornecedor, preço e disponibilidade, além de favoritos e ordenação. |
| Produtos do catálogo em produção | 🎭 | Os 20 produtos aprovados são **fictícios** (seed de demonstração com imagens `placehold.co`). |
| Detalhe do produto | 🟡 | `src/app/(loja)/catalogo/[id]/page.tsx`. Mostra variantes e imagem, mas não mostra fornecedor nem condições comerciais. |
| Carrinho de importação | ✅ | `CartItem` e `src/lib/merchant.ts`. Itens já importados para a loja não são cobrados de novo (cenário obrigatório 2). |
| Cálculo de preço | 🟡 | `src/lib/pricing.ts`. Feito em centavos e no servidor, com preço travado no pedido. O valor vem de variável de ambiente; não há tabela configurável no painel. A faixa por volume existe no código, mas não é usada. |
| Checkout Mercado Pago (Pix e cartão) | 🔒 | `src/lib/payments.ts`, com preferência, idempotency key e assinatura `x-signature`. Nunca rodou contra o sandbox real: faltam credenciais. |
| Pagamento simulado | 🟡 | Ativo em produção com `ALLOW_FAKE_PAYMENTS=1`. **Corrigido nesta fase:** agora só ADMIN e FINANCE conseguem simular em produção. |
| Webhook de pagamento | ✅ | Consulta o provedor antes de liberar, trava o pedido com `FOR UPDATE` e confere o valor. Testes provam que webhooks repetidos e simultâneos liberam uma única vez (cenário obrigatório 5). |
| Livro-razão de créditos | ✅ | `CreditLedgerEntry` com chave idempotente única; o saldo é a soma dos lançamentos. Não há carteira pré-paga exposta ao usuário. |
| OAuth Nuvemshop | 🔒 | `api/nuvemshop/conectar` e `retorno`, com state de uso único ligado à conta e token cifrado com AES-256-GCM. Sem app de parceiro criado, nunca foi testado contra a Nuvemshop real. |
| Webhooks Nuvemshop (desinstalação, LGPD) | ✅ após correção | O HMAC já estava certo, mas os eventos de LGPD tinham nomes errados e chegam sem `event` no corpo, então um pedido de exclusão seria ignorado. Além disso, `app/uninstalled` nunca era registrado. **Corrigido nesta fase** (ver `PESQUISA_TECNICA_INTEGRACOES.md`, seção 7). |
| Instalação iniciada pela loja de apps da Nuvemshop | ❌ | O retorno do OAuth exige usuário logado e `state`. Para homologar o app na loja de apps, a instalação precisa funcionar começando pela Nuvemshop, inclusive para quem ainda não tem conta. Fica para a Fase 1. |
| Motor de importação | ✅ | `src/lib/importer.ts` e `src/worker.ts`: retry com backoff, limite de vazão, reconciliação por SKU contra resposta perdida, devolução da reserva em falha definitiva e varredura de itens parados. Testado com servidor simulado (`scripts/mock-nuvemshop.mjs`) para 50 produtos, falha parcial e resposta perdida (cenários 1 e 3, simulados). |
| Imagens e variantes na importação | 🟠 | Imagens por URL (até 9) e até 3 atributos de variante. As imagens de produção são placeholders. |
| Histórico de importações | ✅ | `/pedidos` e `/pedidos/[id]`, com atualização automática e reprocessamento grátis. |
| Painel administrativo | 🟠 | `/admin`, com contagens e produtos. Sem financeiro, sem usuários, sem aprovações de fornecedor, sem auditoria visível e sem configurações. |
| Dashboards por perfil | ❌ | — |
| i18n e multi-moeda | ❌ | Tudo em pt-BR e BRL fixo. |
| Shopify / WooCommerce | ❌ | O cliente da Nuvemshop está acoplado ao importador (não há interface de adaptador). |
| IA | ❌ | — |
| Monitoramento | 🟡 | `/api/saude` mais a verificação do GitHub a cada 10 min. Sem Sentry e sem logs estruturados nem alertas. |
| Página pública / landing | 🟠 | `src/app/page.tsx` tem 27 linhas. |
| Termos de uso e privacidade | ❌ | O cadastro exige aceitar "os termos", mas não existe página de termos. |

## 4. Segurança

| Ponto | Situação |
|---|---|
| SQL injection | OK. O acesso é só por Prisma; o único `$executeRaw` usa template parametrizado. |
| XSS | OK. React escapa tudo e não há `dangerouslySetInnerHTML`. |
| CSRF | OK. Server Actions conferem a origem, e as rotas GET não alteram estado sensível (o `conectar` só cria um state). |
| Autorização por dono | OK nas páginas e ações do lojista: todas filtram por `accountId`. Agora há teste automatizado para pedido com loja de outra conta e reprocessamento de lote alheio (cenário 4). |
| Supabase / PostgREST | OK. RLS está ativo **sem políticas** em todas as 19 tabelas (verificado pelo advisor do Supabase em 2026-10-27), o que significa que a chave anônima não lê nada. **Risco:** isso foi aplicado fora das migrations do Prisma. Toda tabela nova precisa de `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` na migration. |
| Tokens das lojas | OK. AES-256-GCM, chave em variável de ambiente, nunca enviados ao navegador. |
| Força bruta no login | **Era inexistente.** Corrigido: limite por e-mail e por IP. |
| Enumeração de e-mails | **O login respondia mais rápido para e-mail inexistente.** Corrigido com hash fictício. O cadastro ainda diz "já existe conta com esse e-mail" (aceitável por enquanto; resolver junto com a verificação de e-mail). |
| Pagamento simulado em produção | **Crítico assim que a Nuvemshop fosse ativada:** qualquer lojista importaria sem pagar. Corrigido. |
| Webhook do Mercado Pago sem segredo | Aceitava HMAC com chave vazia. Corrigido: em produção, exige o segredo. |
| Cabeçalhos HTTP | Não existiam. Adicionados HSTS, nosniff, X-Frame-Options, Referrer-Policy e Permissions-Policy. A CSP fica pendente. |
| Dependências | `npm audit`: 4 altas e 1 moderada, todas via `postcss` embutido no Next 15. A correção exige Next 16 (mudança grande); o risco prático é baixo porque o postcss roda no build e não com dados de usuário. Planejado para a Fase 1. |
| Backups | O Supabase no plano gratuito faz backup diário, mas sem restauração pontual. Não verificado se há plano pago. |
| Segredos no repositório | OK. `.env` está fora do git; só `.env.example` é versionado. |

## 5. Banco de dados em produção (somente leitura, 2026-10-27)

- 1 usuário (admin), 20 produtos aprovados (fictícios), 0 lojas, 0 pedidos e 0 pagamentos.
- Imagens: todas em `placehold.co`.

**Ação recomendada, que precisa da sua aprovação por ser em produção:** marcar os 20 produtos
fictícios como "Indisponível" antes de abrir a plataforma a lojistas reais.

## 6. Qualidade do código

- `tsc --noEmit`: 0 erros.
- `eslint`: 0 avisos.
- Testes: 44/44 no início e 54/54 depois das correções desta fase.
- O código é coeso e comentado em português, com regras de negócio fora da interface.
- Não há duplicação relevante.
- Ponto de atenção: a lógica de pós-pagamento (enfileirar itens) está repetida em
  `api/pagamentos/webhook` e em `pagamento-teste`. Pode virar uma função só.

## 7. Infraestrutura

- **Vercel:** 7 projetos ligados ao mesmo repositório (1 de produção e 6 duplicados criados por
  engano). Os duplicados geram builds a cada push. Exclusão pendente pelo dono.
- **Render:** o worker usa a branch `mvp-catalogo`, não `main`. Precisa apontar para `main` depois
  dos merges.
- **Render, plano gratuito:** dorme sem tráfego. Hoje ele é mantido acordado pelo `monitor.yml` e
  acordado pelo site ao pagar. Para operar de verdade, o recomendado é o plano pago (Starter) ou
  trocar a fila por um serviço gerenciado (ver `ARQUITETURA.md`).
- **Redis do Render (Key Value Free):** não persiste em disco, então um reinício apaga as tarefas
  pendentes. Nada se perde porque o worker reencontra os itens no banco, mas isso torna o Redis
  dispensável (ver DT-10).
- Não existe ambiente de staging separado: as previews da Vercel não têm banco.

## 8. Prioridades

| Prioridade | Item |
|---|---|
| P0 (bloqueia vender) | Credenciais da Nuvemshop e do Mercado Pago (ações do dono); retirar os produtos fictícios; termos de uso e política de privacidade. |
| P1 (segurança e base) | Verificação de e-mail e recuperação de senha (exige um provedor de e-mail); RLS nas migrations; Next 16; staging com banco próprio; Sentry. |
| P2 (rede de fornecedores) | Organizações com tipo (fornecedor, lojista, plataforma), entidade de fornecedor, painel do fornecedor, cadastro e importação de catálogo próprios e aprovação. |
| P3 (experiência do lojista) | Nova interface (design system), filtros e favoritos, preços configuráveis no admin. |
| P4 (expansão) | Interface de adaptador de plataforma, Shopify, i18n, moedas. |
