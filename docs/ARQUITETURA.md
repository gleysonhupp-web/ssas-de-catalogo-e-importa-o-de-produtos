# Arquitetura proposta

> **Atualização de 2026-10-30 (DT-11):** pelo Business Model Canvas 1.0, o catálogo é preparado e
> mantido internamente pela Via Estoque. Tudo o que este documento descreve sobre contas de
> fornecedor (`Account.kind = SUPPLIER`, `SupplierProfile`, painel `/fornecedor`, importação de
> catálogo pelo fornecedor, visibilidade por fornecedor e repasses) **não é adotado nesta versão**.
> O restante (lojista, administração, pagamentos, importação para a Nuvemshop) continua valendo.

Este documento mostra como fornecedores, lojistas, administração, pagamentos e integrações se
encaixam. O princípio é evoluir o que existe, sem reescrever. As escolhas e os motivos estão em
`DECISOES_TECNICAS.md`, e os fatos de API e preços em `PESQUISA_TECNICA_INTEGRACOES.md`.

## 1. Visão geral

```
                ┌────────────────────────── Vercel (Next.js 15, App Router) ──────────────────────────┐
 Fornecedor ──► │ /fornecedor/*   painel, produtos, importação de catálogo, estatísticas               │
 Lojista    ──► │ /catalogo /carrinho /checkout /lojas /pedidos                                         │
 Equipe     ──► │ /admin/*        aprovações, usuários, financeiro, integrações, auditoria, preços      │
                │ /api/*          OAuth das plataformas, webhooks (pagamento, plataformas), saúde        │
                │ src/lib/*       domínio: catálogo, preços, pedidos, livro-razão, adaptadores           │
                └───────────────┬───────────────────────────────┬──────────────────────────────────────┘
                                │ Prisma                         │ HTTPS (acordar worker)
                    ┌───────────▼───────────┐        ┌──────────▼───────────┐
                    │ Postgres (Supabase)   │◄───────┤ Worker (Render)      │──► Nuvemshop / Shopify / Woo
                    │ fonte da verdade      │        │ importação, catálogo │
                    │ RLS ligado, sem acesso│        │ de fornecedor, sync  │
                    │ público               │        └──────────┬───────────┘
                    └───────────┬───────────┘                   │ BullMQ
                    ┌───────────▼───────────┐        ┌──────────▼───────────┐
                    │ Supabase Storage      │        │ Redis (Render KV)    │
                    │ imagens de fornecedor │        │ só agenda tarefas    │
                    └───────────────────────┘        └──────────────────────┘
        Mercado Pago (BR) / Stripe (fora do BR) ──webhook──► /api/pagamentos/webhook
        E-mail transacional (Resend)   Erros (Sentry)   Saúde (GitHub Actions a cada 10 min)
```

Regra que já vale e continua valendo: **o banco é a fonte da verdade e a fila só agenda**. Se o
Redis sumir, o worker reencontra os itens pagos no banco (`pickup` e `sweep` em `src/worker.ts`).

## 2. Camadas no código

| Camada | Onde | Regra |
|---|---|---|
| Interface | `src/app/**` | Só lê dados e chama ações. Nenhuma regra de cobrança ou permissão vive aqui. |
| Ações e rotas | `actions.ts`, `src/app/api/**` | Validam a entrada com Zod, identificam o usuário e chamam o domínio. |
| Domínio | `src/lib/*` | Preço, pedido, livro-razão, catálogo, importação. Recebe `accountId` e confere a posse. |
| Adaptadores | `src/lib/platforms/*` (novo) | Uma implementação por plataforma de loja, sempre com a mesma interface. |
| Provedores de pagamento | `src/lib/payments.ts` | Interface `PaymentProvider` já existente; o Stripe entra como outra implementação. |
| Worker | `src/worker.ts` | Consome a fila e chama o domínio, sem lógica própria de negócio. |

## 3. Multi-tenant e permissões

Hoje existe `Account` (a empresa) com vários `User`, e o papel fica no próprio usuário. Proposta:

1. **Tipo de conta** em `Account`, com os valores `MERCHANT` (lojista), `SUPPLIER` (fornecedor) e
   `PLATFORM` (equipe interna).
2. **Vínculo usuário–conta** (`Membership`), com um papel por conta: `OWNER`, `ADMIN`, `EDITOR` ou
   `VIEWER`. Isso permite equipes e convites. Os papéis internos atuais (`REVIEWER`, `FINANCE` etc.)
   continuam valendo só para contas `PLATFORM`.
3. **Posse dos dados:** todo registro privado tem `accountId`, e toda consulta do domínio filtra por
   ele. Fornecedor edita apenas produtos com `supplierAccountId` igual ao seu. Lojista vê apenas as
   próprias lojas, pedidos e importações.
4. **Defesa em profundidade:** o RLS do Supabase fica ligado e sem políticas. O app usa a conexão do
   Prisma, que ignora o RLS por ser dona das tabelas, e a API pública do Supabase não alcança nada.
   Toda migration nova precisa ligar o RLS na tabela criada (há teste no CI para isso; ver roadmap).
5. **Testes de isolamento** para cada novo recurso, seguindo o padrão de
   `tests/integration/tenant-isolation.test.ts`.

Não proponho trocar a autenticação própria pelo Supabase Auth agora. A atual já é segura nos pontos
críticos (hash do token, scrypt, cookie httpOnly), e trocar quebraria as sessões existentes. Falta
e-mail: verificação de conta, recuperação de senha e convite de equipe. Isso entra com um provedor
de e-mail transacional. A autenticação multifator (TOTP) entra para contas `PLATFORM` na Fase 5.

## 4. Modelo de dados

Abaixo está como as entidades pedidas se encaixam no schema atual (`prisma/schema.prisma`).
✅ = existe; ➕ = criar; ✏️ = alterar.

| Entidade pedida | No schema | Observação |
|---|---|---|
| Users | ✅ `User` | ✏️ O papel sai do usuário e vai para `Membership`. Entra `emailVerifiedAt`. |
| Organizations | ✅ `Account` | ✏️ Entram `kind`, `country`, `legalName` e `taxId` (documento genérico, não presume CNPJ). |
| OrganizationMembers | ➕ `Membership` | `userId`, `accountId`, `role`. Único por par. |
| Suppliers / SupplierVerification | ➕ `SupplierProfile` | 1:1 com `Account` do tipo fornecedor: dados comerciais, logotipo, categorias, status de verificação (`PENDING`, `APPROVED`, `REJECTED`) e quem aprovou. |
| Stores / StoreConnections | ✅ `Store` | Já tem `platform`, token cifrado, escopos e status. Uma tabela basta. |
| Products / Variants / Images | ✅ `CatalogProduct`, `CatalogVariant`, `MediaAsset` | ✏️ `CatalogProduct` ganha `supplierAccountId` (nulo = curado pela plataforma), `currency`, `supplyPriceCents`, peso/dimensões e país de origem. |
| Categories | ✅ `CatalogCategory` | Árvore já existe. |
| Brands | Campo `brand` | Tabela só quando houver marcas verificadas (fase posterior). |
| SupplierCatalogs / CatalogPermissions | ➕ `CatalogVisibility` (fase 2) | Visibilidade por produto (`PUBLIC`, `PRIVATE`, `INVITE_ONLY`). Tabela de permissão só se o fornecedor quiser liberar para lojistas específicos. |
| ProductVersions | ✏️ `version` e AuditLog | Hoje a versão é um número e o histórico fica no AuditLog. Uma tabela de snapshots entra na sincronização (Fase 7). |
| ProductSelections | ✅ `CartItem` | ➕ `Favorite` para favoritos. |
| ImportOrders | ✅ `Order` | ✏️ Entram `currency` e `pricingRuleId`. |
| ImportJobs / ImportJobItems | ✅ `ImportBatch`, `ImportItem` | Estados, tentativas e erros já existem. |
| ImportedProductMappings | ✅ `ImportItem.externalProductId` | A chave única `(storeId, catalogProductId, mode)` já impede duplicação. |
| Payments / PaymentEvents | ✅ | ✏️ Entra `currency`. |
| CreditLedger | ✅ `CreditLedgerEntry` | Livro-razão com chave idempotente. |
| PricingRules | ➕ `PricingRule` | Faixas por quantidade, moeda, país e vigência. Só uma ativa por moeda/país. O pedido guarda qual regra usou. |
| Refunds | Via `Payment.status` e lançamento `REFUND` | Tabela própria só quando houver reembolso parcial por item. |
| SupplierPayouts | Não criar agora | Depende do Modelo B ser aprovado (ver `PESQUISA_PROFUNDA_MERCADO.md`). |
| Notifications | ➕ (Fase 3) | E-mail primeiro; notificação dentro do app depois. |
| AuditLogs | ✅ `AuditLog` | Já registra ações e, agora, falhas de login. |
| SupportTickets | Não criar agora | Usar uma ferramenta de suporte externa no MVP. |
| CountrySettings / FeatureFlags | ➕ (Fase 6) | Começar com configuração em código; tabela quando houver mais de um país. |
| Importação de catálogo do fornecedor | ➕ `SupplierImport`, `SupplierImportRow` | Arquivo, mapeamento de colunas, status e erros por linha. Uma linha inválida não bloqueia as válidas. |

Dinheiro: sempre inteiro em centavos com a moeda ao lado (`amountCents` mais `currency`), nunca
`Decimal` sem moeda. O `suggestedPrice` atual (`Decimal`) migra para `suggestedPriceCents` mais
`currency`.

## 5. Fluxos principais

### Fornecedor publica catálogo

1. O fornecedor cria a conta, que nasce com tipo fornecedor e verificação `PENDING`.
2. A equipe aprova o fornecedor.
3. O fornecedor cadastra produtos ou envia CSV/XLSX: upload, mapeamento de colunas, validação por
   linha e prévia.
4. A importação roda no worker; linhas válidas viram rascunho e as inválidas ficam com o erro.
5. O fornecedor envia os produtos para revisão. O score de qualidade aponta falta de imagem,
   descrição curta, SKU duplicado ou falta de licença das fotos.
6. O revisor da plataforma aprova, e o produto aparece no catálogo.

### Lojista importa (já existe e continua igual na essência)

Carrinho → pedido com preço travado → checkout → webhook confirma, consultando o provedor → `GRANT`
e uma reserva por item → worker cria na loja → `CONSUME` em sucesso ou `RELEASE` em falha
definitiva → reprocessamento grátis.

## 6. Adaptadores de plataforma

```ts
interface StorePlatform {
  id: "nuvemshop" | "shopify" | "woocommerce";
  authorizeUrl(state: string, shop?: string): string;
  completeAuthorization(params: URLSearchParams): Promise<{ externalStoreId: string; accessToken: string; scopes: string; name?: string }>;
  limits: { maxImages: number; maxVariantAttributes: number; requestsPerSecond: number };
  validate(p: CanonicalProduct): string[];             // problemas que impedem a criação
  findBySku(sku: string): Promise<{ id: string } | null>;
  createProduct(p: CanonicalProduct, s: ExportSettings): Promise<{ id: string }>;
  verifyWebhook(raw: string, headers: Headers): boolean;
}
```

- `CanonicalProduct` é o formato interno: o produto, as variantes e as mídias que já usamos.
- O `toNuvemshopPayload` atual vira a conversão do adaptador da Nuvemshop.
- O importador passa a chamar `platformFor(store.platform)` em vez de instanciar `NuvemshopClient`.
- O limite de vazão do worker passa a ser por plataforma.

## 7. Fila e worker

O modelo atual se mantém: BullMQ no Render, com o banco como fonte da verdade. Ele já cumpre
retry com backoff, limite de vazão, idempotência, recuperação e varredura.

- **Mudança necessária para operar:** sair do plano gratuito do Render, que dorme e reinicia, ou
  migrar a fila para um serviço gerenciado. A comparação de custos está em
  `PESQUISA_TECNICA_INTEGRACOES.md`. A decisão é do dono, porque envolve custo mensal.
- **Escala:** o gargalo real é o limite das plataformas de loja (Nuvemshop: cerca de 2
  requisições/s por loja), não o worker. O limitador deve passar a ser **por loja**, e não global,
  para que lojas diferentes rodem em paralelo.

## 8. Pagamentos

- **Brasil:** Mercado Pago (Checkout Pro com Pix e cartão), já implementado e aguardando
  credenciais.
- **Fora do Brasil:** Stripe Checkout, como segunda implementação de `PaymentProvider`, escolhida
  pela moeda do pedido.
- **Carteira de créditos pré-pagos:** o livro-razão já suporta. O que falta é a compra de créditos
  sem carrinho e o consumo de créditos no checkout. Recomendo para a Fase 4, depois de validar o
  pagamento por pedido.
- **Repasses a fornecedores (Modelo B):** não implementar sem PSP com split e contrato (ver
  `PESQUISA_REGULATORIA_INTERNACIONAL.md`).

## 9. Mídia

O fornecedor sobe imagens para o Supabase Storage, em um bucket público só de leitura, com o caminho
`supplier/{accountId}/{productId}/{arquivo}`. O upload é feito pelo servidor com validação de tipo e
tamanho. As URLs públicas vão para a plataforma da loja, que copia as imagens; não guardamos cópias
por lojista.

## 10. Observabilidade e ambientes

- **Sentry** (plano gratuito) no site e no worker.
- **Logs em JSON** com `correlationId`. O campo já existe no AuditLog.
- **Staging:** um segundo projeto Supabase gratuito ligado às previews da Vercel, para que o fluxo
  completo possa ser testado sem tocar em produção.
- **CI:** tsc, lint, testes com Postgres, build e verificação de RLS nas migrations.
- **Monitoramento:** a verificação de saúde a cada 10 min já existe.
