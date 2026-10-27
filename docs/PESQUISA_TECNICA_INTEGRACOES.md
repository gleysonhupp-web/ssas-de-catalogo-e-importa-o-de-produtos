# Pesquisa técnica de integrações

**Data de consulta de todas as fontes:** 2026-10-27
**Escopo:** Nuvemshop/Tiendanube, Shopify, WooCommerce, Mercado Pago, Stripe, Vercel, Supabase Storage e opções de fila durável.
**Código comparado:** `src/lib/nuvemshop.ts`, `src/lib/payments.ts`, além de `src/app/api/nuvemshop/{conectar,retorno,webhook}/route.ts`, `src/app/api/pagamentos/webhook/route.ts`, `src/lib/queue.ts`, `src/worker.ts`, `render.yaml` e `DEPLOY.md`, lidos para dar contexto às discrepâncias.

## Como ler este documento

- **Confiança alta:** o texto foi lido na documentação oficial ou no código-fonte oficial do fornecedor.
- **Confiança média:** a informação é oficial mas indireta (exemplo de payload, SDK, página com conteúdo contraditório) ou depende de interpretação.
- **Confiança baixa:** veio de fonte não oficial ou de inferência.
- **Não verificado:** não consegui confirmar em fonte oficial nesta pesquisa. Não use como fato.

A ferramenta de leitura resumiu páginas longas. Por isso, as citações abaixo são fiéis ao sentido, mas podem não ser literais. Antes de decisões irreversíveis, como publicar o app ou ativar a cobrança, confirme os pontos críticos direto na página.

---

## 1. Nuvemshop / Tiendanube

> A documentação foi movida de `tiendanube.github.io/api-documentation` para **`nuvemshop.dev`**. A página antiga avisa: "has moved to nuvemshop.dev/en-US/api/getting-started". Os links `dev.nuvemshop.com.br/...` redirecionam (302) para `nuvemshop.dev`.

### 1.1 Versão da API e URL base

| Conclusão | Fonte | Confiança |
|---|---|---|
| A versão atual é baseada em data: **`2025-03`**. As URLs começam com `https://api.tiendanube.com/2025-03/{store_id}` ou `https://api.nuvemshop.com.br/2025-03/{store_id}`. Só SSL. | [nuvemshop.dev – Getting started](https://nuvemshop.dev/en-US/api/getting-started), [intro antiga](https://tiendanube.github.io/api-documentation/intro) | Alta |
| Política de versão: mudanças incompatíveis geram nova versão e as URLs antigas continuam com suporte estável. Não há datas de descontinuação publicadas. | Mesma página | Alta |
| Existe uma versão "unstable" com recursos extras, como Store Media (`store_media_uuid`). | [Product 2025-03](https://nuvemshop.dev/en-US/api/resources/2025-03/product) | Média |

**Código:** `API_VERSION = "2025-03"` e `API_BASE = https://api.nuvemshop.com.br` estão **de acordo** com a documentação.

### 1.2 Fluxo OAuth

| Etapa | O que a documentação diz | Confiança |
|---|---|---|
| Authorize | `https://www.tiendanube.com/apps/{app_id}/authorize`. O domínio `nuvemshop.com.br` pode substituir `tiendanube.com`. | Alta |
| `state` | "add a state parameter for CSRF protection (e.g. a hash of the session cookie)" e conferir o valor depois do redirecionamento. | Alta |
| Código de autorização | Expira em **5 minutos**. | Alta |
| Token | `POST https://www.tiendanube.com/apps/authorize/token` com corpo **JSON**, nunca na URL: `client_id`, `client_secret`, `grant_type=authorization_code`, `code`. | Alta |
| Resposta | `access_token`, `token_type` (`bearer`), `scope` e `user_id` (ID da loja). Algumas respostas trazem `store_id` com o mesmo valor. | Alta |
| Uso | Header `Authorization: Bearer {access_token}`. | Alta |
| Instalação pela loja de apps | O guia de instalação descreve `GET /redirect_url?code` e **não menciona** o retorno do `state` quando a instalação começa na loja de apps ou no admin. | Média |
| Reinstalação | "the only thing to do is regenerate the access_token". Não crie recursos duplicados; faça GET antes de criar. | Alta |
| Desinstalação | A Nuvemshop apaga automaticamente os recursos criados pelo app: webhooks, scripts, transportadoras e meios de pagamento. | Alta |
| Novos escopos | Exigem reinstalar o app em cada loja para obter um token com os escopos novos. | Alta |

Fontes: [nuvemshop.dev – Authentication](https://nuvemshop.dev/en-US/api/authentication), [authentication antiga](https://tiendanube.github.io/api-documentation/authentication), [Installation flow](https://nuvemshop.dev/en-US/api/guides/installation).

#### Ponto crucial: o token expira?

**Confirmado: o access_token da Nuvemshop não expira.** A documentação diz: "Our access tokens don't expire." Ele "become[s] invalid only after you get a new one for the same app and store, or if the user uninstalls that app". Não há `refresh_token` nem `expires_in`, e a página não traz prazo de migração.
Fonte: [nuvemshop.dev – Authentication](https://nuvemshop.dev/en-US/api/authentication). **Confiança: alta.**

**Código:** `exchangeCode` guarda o `access_token` cifrado e o usa direto, sem renovação. Isso **está correto** para a Nuvemshop. A diferença importa para a Shopify (seção 2), que passou a exigir tokens que expiram.

### 1.3 Escopos

Lista atual: `read/write_content`, `read/write_products`, `read/write_customers`, `read/write_orders`, `read/write_fulfillment_orders`, `read/write_draft_orders`, `read/write_locations`, `read/write_shipping_quotation`, `read/write_coupons`, `read/write_discounts`, `write_scripts`, `read/write_shipping`, `read/write_payments`, `read_payment_options`, `read/write_email_templates`, `read/write_subscriptions`, `write_charges` e `write_plans`. "If you ask for any write scope, the read scope is implied."
Fonte: [Authentication](https://nuvemshop.dev/en-US/api/authentication). **Confiança: alta.**

**Código:** `DEPLOY.md` pede só `write_products`, que também concede `read_products`. É suficiente para criar produtos e para `GET /products/sku/{sku}`. As boas práticas de homologação pedem escopos mínimos e coerentes com o diagrama enviado ([Guidelines](https://nuvemshop.dev/en-US/apps/publish/homologation/guidelines)).

### 1.4 User-Agent e limite de requisições

| Conclusão | Confiança |
|---|---|
| **User-Agent obrigatório** com o nome do app e um link ou e-mail de contato. Sem ele, a API responde **400 Bad Request**. | Alta |
| **Leaky bucket:** balde de **40 requisições**, vazão de **2 req/s**, contado **por loja e por app**. | Alta |
| Lojas nos planos **Next ou Evolution** têm o limite **multiplicado por 10**. | Alta |
| Headers: `x-rate-limit-limit`, `x-rate-limit-remaining` e `x-rate-limit-reset` (**milissegundos** até o balde esvaziar). O excesso recebe **429**. | Alta |
| Escritas em lote de variantes usam um *token bucket* ponderado: payloads mais pesados custam mais. | Média |

Fontes: [Getting started](https://nuvemshop.dev/en-US/api/getting-started), [Guidelines](https://nuvemshop.dev/en-US/apps/publish/homologation/guidelines), [Product Variant](https://nuvemshop.dev/en-US/api/resources/2025-03/product-variant).

**Código:** o header `User-Agent: "{APP_NAME} ({CONTACT_EMAIL})"` e a leitura de `x-rate-limit-reset` em ms **estão de acordo**. Ressalvas:

- o fallback `suporte@exemplo.com` iria para produção se a variável faltar;
- o worker usa `limiter: { max: 1, duration: 1000 }` **global**, mas o limite da Nuvemshop é **por loja**. Isso não viola a documentação, mas desperdiça vazão quando várias lojas importam ao mesmo tempo.

### 1.5 Produtos, variantes e imagens

| Conclusão | Confiança |
|---|---|
| Endpoints: `GET/POST /products`, `GET/PUT/DELETE /products/{id}`, `GET /products/sku/{sku}` ("Returns the first Product found where one of its variants has the given SKU") e `PATCH /products/stock-price` (até 50 variantes por requisição). | Alta |
| **Até 3 atributos** por produto, sem nomes repetidos. A quantidade de `values` da variante deve bater com a de `attributes`. | Alta |
| **Até 1.000 variantes** por produto. Acima disso, a API responde 422. | Alta |
| Imagens: recomenda **no máximo 9** no `POST /products`. Para mais, use o endpoint de imagens. O limite rígido é **250 imagens** por produto (422). | Alta |
| **Imagem por URL é aceita:** `images[].src` no produto e em `POST /products/{id}/images`, que aceita exatamente um entre `src`, `attachment` (base64), `image_id` ou `store_media_uuid`. | Alta |
| Formatos de imagem: GIF, JPG, PNG e WebP (AVIF só via Store Media). Cada imagem deve ter **menos de 20 MB e até 100 megapixels**. | Alta |
| A documentação **não diz** como a Nuvemshop baixa a URL (timeout, redirecionamentos, autenticação). A resposta devolve uma URL do CDN dela, o que indica que ela copia a imagem. A URL precisa ser pública. | Não verificado (comportamento de download) |
| As imagens podem ser servidas em WebP depois da otimização, sem opção de desligar. | Alta |
| Estoque infinito: `"stock": ""`. `stock_management` é somente leitura. Em lojas com **várias localizações**, `stock` está obsoleto para atualização e o certo é usar `inventory_levels`. | Alta |
| `published` e `visibility` são mutuamente exclusivos: enviar os dois retorna 422. | Alta |
| Preço: string decimal nos exemplos (`"19.00"`). | Média |
| Limite por loja: o exemplo de erro mostra **100.000 produtos**. | Média |
| Textos (`name`, `description`) são objetos por idioma (`{"pt": "..."}`), com uma entrada por idioma da loja. | Alta |

Fontes: [Product](https://nuvemshop.dev/en-US/api/resources/2025-03/product), [Product Image](https://nuvemshop.dev/en-US/api/resources/2025-03/product-image), [Product Variant](https://nuvemshop.dev/en-US/api/resources/2025-03/product-variant).

**Código:** `MAX_ATTRIBUTES = 3`, `MAX_IMAGES_ON_CREATE = 9`, `stock: ""` para ilimitado e o uso de `/products/sku/{sku}` na reconciliação **estão de acordo**. Pontos fora da documentação:

- não há checagem do limite de 1.000 variantes;
- imagens além da 9ª são **descartadas** (`slice(0, 9)`) em vez de enviadas por `POST /products/{id}/images`;
- não há tratamento de `inventory_levels` para lojas com várias localizações;
- só o idioma principal é preenchido, mas a documentação diz que os textos têm uma entrada por idioma da loja. Para lojas multilíngues, a confiança nesse ponto é média.

### 1.6 Webhooks: assinatura, LGPD e `app/uninstalled`

| Conclusão | Confiança |
|---|---|
| Header **`x-linkedstore-hmac-sha256`**: HMAC-SHA256 do **corpo bruto** com o **`client_secret` do app**, em **hex** (implícito no exemplo PHP com `hash_hmac`). | Alta (hex: média) |
| É preciso responder **2xx em até 3 segundos**. Depois de falha, a Nuvemshop faz 4 tentativas (logo após o timeout, ~5, ~10 e ~15 min) e depois recuo ×1,4 por até **48 h**, com no máximo 16 tentativas. | Alta |
| As mensagens podem chegar fora de ordem e repetidas. O processamento deve ser idempotente. | Alta |
| A URL do webhook deve ser HTTPS, sem localhost nem domínio da Nuvemshop. | Alta |
| **`app/uninstalled`** é um evento comum (família `app: uninstalled, suspended, resumed`). Ele é criado via **`POST /webhooks`** pela API. A página **não diz** que é configurado no portal. | Média |
| **Os webhooks de LGPD são configurados no Portal de Parceiros**, não pela API: "Configure app/store_redact, customer/redact and customers/data_request in the Partners Portal." | Alta |
| Nomes dos tópicos de LGPD na documentação atual: **`app/store_redact`**, **`customer/redact`** (singular) e **`customers/data_request`** (plural). A página **não menciona `store/redact`**. | Alta |
| `app/store_redact`: enviado depois da desinstalação. Payload: `store_id`. | Alta |
| `customer/redact`: payload `store_id`, `customer {id, email, phone, identification}` e `orders_to_redact`. Enviado 5 dias depois se o cliente não comprou nos últimos 6 meses; caso contrário, espera completar os 6 meses. | Alta |
| `customers/data_request`: payload `store_id`, `customer`, `orders_requested`, `checkouts_requested`, `drafts_orders_requested` e `data_request {id}`. "It is the application's responsibility to send the information directly to the merchant." | Alta |
| **Campo `event`:** a lista geral diz que todo webhook envia `store_id` e `event`, mas **os exemplos de payload de LGPD não trazem `event`**. A documentação se contradiz nesse ponto. | Média |
| A documentação não informa prazo para atender pedidos de LGPD. | Não verificado |

Fonte: [Webhook 2025-03](https://nuvemshop.dev/en-US/api/resources/2025-03/webhook).

**Código (`api/nuvemshop/webhook/route.ts`):** a verificação do HMAC está **de acordo** (header, `client_secret`, hex, corpo bruto e comparação em tempo constante). Divergências:

1. O `switch` depende de `body.event` e espera `"store/redact"` e `"customers/redact"`. A documentação atual usa `app/store_redact` e `customer/redact`, e os exemplos de LGPD **nem trazem `event`**. Na prática, esses webhooks podem cair no caso padrão: o handler responde 200, grava `nuvemshop.desconhecido` e **não revoga nem apaga nada**.
2. Nenhum código registra `app/uninstalled` via `POST /webhooks`. `DEPLOY.md` manda apontar "desinstalação e LGPD" para o portal, que segundo a documentação só configura os três tópicos de privacidade. Sem `app/uninstalled`, a loja continua `CONNECTED` depois da desinstalação até chegar o `app/store_redact`, e esse caso também falha pelo item 1.
3. `customers/data_request` não faz nada. Mesmo sem guardar dados de clientes, o app deveria responder ao lojista, por exemplo com um registro auditável e um e-mail dizendo "nenhum dado mantido".
4. Não há deduplicação de eventos repetidos: o `auditLog` grava todas as entregas. Os efeitos são idempotentes (`updateMany`), então o risco é baixo.

### 1.7 Criar app de parceiro e publicar na loja de apps

| Conclusão | Confiança |
|---|---|
| Fluxo: cadastrar-se como parceiro em `nuvemshop.com.br/parceiros`, criar o app em "Apps" no [Portal de Parceiros](https://partners.tiendanube.com), fazer o OAuth e desenvolver. | Alta |
| A URL de redirecionamento é definida na criação do app. Troque a URL padrão do portal (`partners.tiendanube.com/applications/authentication/{app_id}`), que exige login de parceiro. | Alta |
| **Requisitos de homologação:** (a) **diagrama de sequência** das interações com a Admin API (preferir webhooks a polling); (b) **vídeo de demonstração** com instalação iniciada **pela Nuvemshop** (`/apps/{app_id}/authorize`, não pelo painel do app), **cadastro de usuário novo e login de existente**, **reinstalação** e comportamento depois de remover e reinstalar, e todas as funções principais; (c) uma **conta de demonstração** que já tenha passado por assinaturas e esperas. | Alta |
| A equipe responde em até **30 dias úteis** por ciclo. Apps de ERP, pagamento e frete têm revisão mais completa. | Alta |
| **NubeSDK:** desde **5 jun. 2026**, apps que injetam scripts na loja ou no checkout precisam usar o NubeSDK. Apps só de API ou de admin estão isentos. Apps privados com scripts legados começam a ser removidos em **30 out. 2026**. Este produto é só de API e não é afetado. | Alta |
| Apps privados distribuídos a clientes não passam por homologação. | Alta |
| **Cobrança:** o modelo é escolhido por país. Existe a cobrança da Nuvemshop (única ou mensal) e o modelo **"Free"**, em que "billing is handled externally by the partner". **A cobrança externa (Mercado Pago) é permitida** nesse modelo. A página não traz percentual de comissão e diz que publicar não gera comissão automática sobre o GMV. | Média (a página foi resumida; confirmar com o suporte de parceiros) |
| Requisitos de design (Nimbus) valem para apps **embutidos** no admin. | Média |

Fontes: [Getting started de apps](https://nuvemshop.dev/en-US/apps/getting-started), [Homologation overview](https://nuvemshop.dev/en-US/apps/publish/homologation/overview), [Homologation requirements](https://nuvemshop.dev/en-US/apps/publish/homologation/requirements), [Pricing & Billing](https://nuvemshop.dev/en-US/apps/publish/pricing-billing), [Guidelines](https://nuvemshop.dev/en-US/apps/publish/homologation/guidelines).

**Código:** `api/nuvemshop/retorno` exige **usuário logado** e **`state` válido**. Se a instalação começar na loja de apps, que é o que a homologação exige no vídeo, o lojista chega sem `state`, e talvez sem conta, e é recusado com "Autorização cancelada ou incompleta". É preciso um caminho de instalação iniciada pela Nuvemshop: aceitar `code` sem `state`, trocar pelo token, criar ou vincular a conta e só então pedir login ou cadastro.

---

## 2. Shopify

| Conclusão | Fonte | Confiança |
|---|---|---|
| **Versão estável mais recente da Admin API: `2026-10`.** `2027-01` é release candidate. `2026-07`, `2026-04` e `2026-01` são estáveis. `2025-10` e anteriores estão sem suporte. Novas versões saem a cada trimestre e cada uma tem pelo menos 12 meses de suporte. | [API versioning](https://shopify.dev/docs/api/usage/versioning) | Alta |
| **GraphQL é obrigatório** para novos apps públicos enviados à App Store desde **1 abr. 2025**. A REST Admin é "legacy". | [Changelog](https://shopify.dev/changelog/starting-april-2025-new-public-apps-submitted-to-shopify-app-store-must-use-graphql), [API limits](https://shopify.dev/docs/api/usage/limits) | Alta |
| **`productSet`:** cria ou atualiza um produto inteiro numa chamada, indicado para sincronizar catálogos externos. Listas (`variants`, `metafields`, `collections`) são sincronizadas: o que faltar é **apagado**. Tem modo síncrono (padrão) e assíncrono (`synchronous: false`, que devolve um `ProductSetOperation` consultável via `productOperation`). Até **2048 variantes** por produto. Mídia vai em `files[]` com `originalSource` (URL). Escopo `write_products`. | [productSet](https://shopify.dev/docs/api/admin-graphql/latest/mutations/productSet) | Alta |
| **`productCreate`:** cria **só a variante inicial**; as demais vão por `productVariantsBulkCreate`. Mídia em `media: [CreateMediaInput]` com `originalSource` e `mediaContentType`, associada de forma **assíncrona**. Escopo `write_products`. | [productCreate](https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate) | Alta |
| Número máximo de opções por produto. | — | Não verificado (não estava na página do `productSet`) |
| **Rate limit GraphQL** (custo calculado, leaky bucket): restauração de **100 pts/s** (Standard), **200** (Advanced), **1.000** (Plus) e **2.000** (Enterprise). Uma consulta custa no máximo **1.000 pontos** e uma mutation custa 10 por padrão. | [GraphQL rate limits](https://shopify.dev/docs/apps/build/apis/graphql-admin/rate-limits) | Alta |
| Argumentos do tipo array aceitam no máximo **250 itens**. A paginação para em 25.000 objetos. | [API limits](https://shopify.dev/docs/api/usage/limits) | Alta |
| Lojas com **500.000 variantes ou mais** (fora do Plus) podem criar no máximo **10.000 variantes novas por dia** (429). | [GraphQL rate limits](https://shopify.dev/docs/apps/build/apis/graphql-admin/rate-limits) | Alta |
| **OAuth com tokens offline que expiram:** `expires_in` = 3600 s e `refresh_token`. Exigido para **novos apps públicos desde 1 abr. 2026** e para **todos os apps públicos a partir de 1 jan. 2027**. Depois disso, tokens que não expiram recebem erro de autenticação. | [Changelog dez./2025](https://shopify.dev/changelog/offline-access-tokens-now-support-expiry-and-refresh), [Changelog mai./2026](https://shopify.dev/changelog/expiring-offline-access-tokens-required-for-all-public-apps-as-of-january-1-2027) | Alta |
| **Requisitos da App Store:** autorizar via OAuth **imediatamente** na instalação e na reinstalação; usar **session tokens** em apps embutidos; cobrar **pela Shopify Billing API ou managed pricing** (requisito 1.2); pedir escopos mínimos; não depender de pop-ups; não usar APIs que serão descontinuadas em menos de 90 dias. | [App requirements checklist](https://shopify.dev/docs/apps/launch/app-requirements-checklist) | Alta |
| **Webhooks de compliance obrigatórios:** `customers/data_request`, `customers/redact` e `shop/redact`, configurados em `shopify.app.toml` (`compliance_topics`). Responder 2xx, e **401 se o HMAC for inválido**. Prazo de 30 dias para cumprir. `shop/redact` chega 48 h depois da desinstalação. | [Privacy law compliance](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance) | Alta |
| Header do HMAC (`X-Shopify-Hmac-Sha256`, base64). | — | Não verificado nesta pesquisa (a página de compliance só remete a "Verifying webhook deliveries") |

**Impacto no produto:**

- uma integração Shopify **não pode reaproveitar** o modelo de token permanente da Nuvemshop: precisa de `refresh_token` e renovação;
- a **cobrança por produto via Mercado Pago não é aceita na App Store da Shopify** (requisito 1.2). O caminho seria uma *usage charge* na Billing API.

---

## 3. WooCommerce

| Conclusão | Fonte | Confiança |
|---|---|---|
| A API atual é a **REST v3** em `/wp-json/wc/v3`. Requer WooCommerce 3.5+ e WordPress 4.4+. | [WooCommerce REST API docs](https://woocommerce.github.io/woocommerce-rest-api-docs/) | Alta |
| Autenticação: em **HTTPS**, Basic Auth com `consumer_key` e `consumer_secret` (ou por query string se o servidor não repassar o header Authorization). Em **HTTP**, OAuth 1.0a "one-legged" (HMAC-SHA1/256), com timestamp numa janela de 15 min. | Mesma | Alta |
| **Fluxo `/wc-auth/v1/authorize`:** parâmetros `app_name`, `scope` (`read`, `write` ou `read_write`), `user_id` (ID **do seu app**), `return_url` e `callback_url` (**precisa ser HTTPS**). As chaves chegam por **POST JSON no `callback_url`** com `key_id`, `user_id`, `consumer_key`, `consumer_secret` e `key_permissions`. O `return_url` recebe `success=1/0` e `user_id`. | Mesma | Alta |
| As chaves não expiram; elas valem até o lojista revogá-las no admin do WordPress. | — | Não verificado (a documentação não fala de expiração) |
| **Batch:** `POST /products/batch` aceita "up to 100 objects" por padrão. O limite é configurável pelo filtro `woocommerce_rest_batch_items_limit`. | [Products v3](https://developer.woocommerce.com/docs/apis/rest-api/v3/products/), [wp-kama (código)](https://wp-kama.com/plugin/woocommerce/hook/woocommerce_rest_batch_items_limit) | Alta (documentação) / Média (filtro) |
| Paginação: `per_page` padrão de 10. A documentação consultada **não informa o máximo** (o valor 100 é comum no WordPress). | REST API docs | Não verificado (máximo) |
| Imagens: `images[].src` ("Image URL"). Pelos exemplos, o WooCommerce **baixa a imagem para a Media Library** (`wp-content/uploads`). Também aceita `images[].id` de mídia existente. | [Products v3](https://developer.woocommerce.com/docs/apis/rest-api/v3/products/) | Média |
| Produto variável: `type: "variable"` + `attributes[]` com `variation: true`, e as variações criadas depois no endpoint de variações (que tem batch). | Mesma | Alta |
| **Rate limit:** a REST v3 **não tem limite nativo documentado**. O rate limiting oficial é da **Store API**, opcional e desligado por padrão. Na prática, o limite depende da hospedagem e de WAFs do lojista. | [Store API rate limiting](https://developer.woocommerce.com/docs/apis/store-api/rate-limiting/) | Alta (Store API) / Média (ausência na v3) |

---

## 4. Mercado Pago

### 4.1 Checkout Pro e Pix

| Conclusão | Fonte | Confiança |
|---|---|---|
| O Checkout Pro tem dois caminhos: **via Orders API** (`POST /v1/orders`, devolve `checkout_url`), que é o **recomendado**, e **via Preferences API** (`/checkout/preferences`, `init_point`), marcado como **"Legacy / not recommended"**. As preferências "will continue to be supported, but new features will only be available in the Orders API". Não há data de descontinuação. | [Checkout Pro (Orders) – referência](https://www.mercadopago.com.br/developers/en/reference/online-payments/checkout-pro-orders/overview.md) | Alta |
| No fluxo Orders, as notificações são do tópico **`order`** (ex.: `action: "order.processed"`) e a consulta é `GET /v1/orders/{id}`. | [Notificações Checkout Pro Orders](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/notifications) | Média |
| Pix pela API de pagamentos: expira em **24 h por padrão**. `date_of_expiration` aceita de **30 min a 30 dias**. O status inicial é `pending` / `pending_waiting_transfer`. | [Integrar Pix](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/integration-configuration/integrate-pix) | Alta |
| No objeto de pagamento, Pix aparece como `payment_type_id = "bank_transfer"` e `payment_method_id = "pix"`. | — | Não verificado nesta pesquisa |
| Valor mínimo de cobrança via Pix ou Checkout Pro. | — | Não verificado |

### 4.2 Assinatura do webhook (`x-signature`)

| Conclusão | Fonte | Confiança |
|---|---|---|
| Header `x-signature: ts=...,v1=...`. O segredo vem de "Suas integrações". | [Webhooks](https://mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks), [Notificações Checkout Pro Preferences](https://www.mercadopago.com.br/developers/es/docs/checkout-pro-preferences/payment-notifications) | Alta |
| **Manifest:** `id:{data.id};request-id:{x-request-id};ts:{ts};`, com HMAC-SHA256 em hex. O `data.id` vem do **query param `data.id`**. **Se `x-request-id` (ou `data.id`) faltar, o par é omitido do manifest.** Hoje as páginas públicas não mostram o template e remetem aos SDKs; esta regra foi lida no **código dos SDKs oficiais** (`sdk-nodejs/src/utils/webhook/index.ts` → `buildManifest`; também em `sdk-python`, `sdk-php`, `sdk-go`, `sdk-java`, `sdk-dotnet` e `sdk-ruby`). | GitHub `mercadopago/sdk-*` (busca de código) | Alta (via SDK oficial) |
| O SDK Node valida a **janela de tempo** do `ts` (erro `TimestampOutOfTolerance`; o teste usa tolerância de 60 s). | Mesmo SDK (spec) | Média |
| O SDK converte `data.id` alfanumérico para minúsculas antes do HMAC (os testes usam `DATA_ID_LOWER`). | Mesmo SDK | Média |
| É preciso responder **200/201 em até 22 s**. Os reenvios acontecem a cada 15 min; depois da 3ª tentativa o intervalo aumenta (6 h, 48 h, 96 h). | Páginas de notificação | Alta |
| Uma `notification_url` enviada na criação **tem prioridade** sobre a URL configurada no painel. | Notificações Preferences | Alta |

### 4.3 Idempotência, sandbox e usuários de teste

| Conclusão | Fonte | Confiança |
|---|---|---|
| **`X-Idempotency-Key` é obrigatório** nas chamadas da API de pagamentos do guia de Pix (`POST /v1/payments`) e permite repetir a chamada sem duplicar pagamentos. | [Integrar Pix](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/integration-configuration/integrate-pix) | Alta |
| Se `X-Idempotency-Key` é exigido ou respeitado em `POST /checkout/preferences` e `POST /v1/orders`. | — | Não verificado |
| **Contas de teste:** um vendedor criado automaticamente com o app (token de teste com prefixo `APP_USR`) e compradores criados manualmente. São **no máximo 15 usuários de teste**, que não podem ser excluídos. País fixo, e comprador e vendedor precisam ser do mesmo país. É possível dar saldo fictício e usar cartões de teste. | [Contas de teste (Checkout Pro Preferences)](https://www.mercadopago.com.mx/developers/pt/docs/checkout-pro-preferences/test-accounts.md) | Alta |
| Uso de `sandbox_init_point` e como testar Pix no Brasil. | — | Não verificado (a página consultada não menciona) |

**Código (`payments.ts`):**

- `createCheckout` usa a Preferences API (legado). Ela funciona e tem suporte, mas os recursos novos só chegam pela Orders API.
- `X-Idempotency-Key: preference-{orderId}` é uma boa prática, mas não verifiquei se a Preferences API respeita esse header.
- `parseWebhook` monta `request-id:` **mesmo quando o header falta** (`?? ""`). O SDK oficial **omite o par**, então a assinatura falha nesse caso.
- `parseWebhook` aceita `data.id` vindo do **corpo** quando não está na URL. O SDK usa o query param.
- `parseWebhook` **não verifica a idade do `ts`**: não há proteção contra replay.
- Se `MERCADOPAGO_WEBHOOK_SECRET` estiver vazio, o provedor sobe assim mesmo, com HMAC de chave vazia. Todo webhook vai falhar com 400 sem nenhum aviso.

---

## 5. Stripe

| Conclusão | Fonte | Confiança |
|---|---|---|
| **Pix na Stripe:** contas Stripe no **Brasil** aceitam Pix **avulso** com liquidação em BRL. Contas nos EUA, no Canadá, na Europa, no Reino Unido, na Suíça, na Austrália e em Singapura aceitam Pix de clientes brasileiros (*cross-border*, com IOF de 3,5% e parceiro Ebanx). **Pix Automático** (recorrente) **não está disponível para empresas no Brasil**. A ativação é imediata ("Instant provisional access"). | [docs.stripe.com/payments/pix](https://docs.stripe.com/payments/pix) | Alta |
| Moeda de apresentação **BRL**, só para clientes no Brasil. Mínimo de **R$ 0,50**. Máximo padrão por pagamento equivalente a **US$ 3.000**, inclusive para empresas no Brasil. Liquidação em até T+2. Reembolso em até 90 dias. Disputas (MED) não podem ser contestadas. MCCs proibidos incluem farmácia, apostas e cripto. | Mesma | Alta |
| Integrações: **Checkout Sessions (recomendado)**, Payment Element, Payment Links, Payment Intents e Billing. Não funciona com Express Checkout Element nem Terminal. Descritor de fatura personalizado não é suportado: aparece "Ebanx" no extrato. | Mesma | Alta |
| **Assinatura de webhook:** header `Stripe-Signature: t=...,v1=...`. `signed_payload = t + "." + corpo bruto`, HMAC-SHA256 com o segredo `whsec_` do endpoint, ignorando esquemas que não sejam `v1`. Tolerância padrão das bibliotecas: **5 min**. É obrigatório usar o **corpo bruto**. Os reenvios duram até **3 dias** em produção. Não há garantia de ordem, e as duplicatas devem ser deduplicadas pelo `event.id`. Responder 2xx rápido e processar de forma assíncrona. Apenas TLS 1.2+. | [docs.stripe.com/webhooks](https://docs.stripe.com/webhooks) | Alta |
| Lista completa de moedas aceitas e taxa do Pix no Brasil. | [Preços Pix](https://stripe.com/pt-br/pricing/local-payment-methods#pix) (link da documentação, não aberto) | Não verificado |

**Impacto:** a Stripe é uma alternativa viável ao Mercado Pago para Pix com uma conta brasileira. O valor de R$ 1,25 por produto fica acima do mínimo de R$ 0,50, mas um pedido de 1 produto paga taxa sobre um valor muito baixo (a taxa não foi verificada). A interface `PaymentProvider` já permite um `StripeProvider`.

---

## 6. Infraestrutura

### 6.1 Vercel: duração das funções

| Conclusão | Fonte | Confiança |
|---|---|---|
| Com **Fluid compute** (padrão em projetos novos): o **Hobby** tem **300 s** de padrão e de máximo. O **Pro/Enterprise** tem 300 s de padrão, **800 s** de máximo e **1800 s** de máximo estendido (beta, configurado por função). | [Functions limits](https://vercel.com/docs/functions/limitations) (atualizada em 2026-08-24) | Alta |
| Memória: Hobby 2 GB / 1 vCPU; Pro até 4 GB / 2 vCPU. Corpo de requisição ou resposta de no máximo **4,5 MB** (413). | Mesma | Alta |
| Cron: 100 por projeto. No **Hobby, só 1 vez por dia** e com precisão de ±59 min (expressões mais frequentes falham no deploy). No Pro, a cada minuto. | [Cron usage & pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) | Alta |
| **Vercel Queues:** cobrado por operação (blocos de 4 KiB). O Hobby inclui **1.000.000 de operações**. Retenção de até 7 dias, visibility timeout de até 60 min e mensagens de até 100 MB. | [Queues pricing](https://vercel.com/docs/queues/pricing) | Alta |
| Vercel Workflows existe para execuções longas e duráveis. | Functions limits | Alta (existência) |

**Código:** nenhuma rota define `maxDuration`, então vale o padrão de 300 s, que é suficiente para os webhooks. A importação roda no worker, fora da Vercel, o que está correto. Se a importação um dia rodar na Vercel, cada produto da Nuvemshop leva no mínimo ~0,5 s pelo rate limit, então um lote grande não cabe em 300 s.

### 6.2 Supabase Storage para imagens

| Conclusão | Fonte | Confiança |
|---|---|---|
| Tamanho máximo de arquivo: **Free 50 MB**; **Pro e Team até 500 GB**, configurável por limite global e por bucket. | [File limits](https://supabase.com/docs/guides/storage/uploads/file-limits) | Alta |
| **Free:** 1 GB de armazenamento, 5 GB de egress e 5 GB de egress em cache. **O projeto é pausado após 1 semana de inatividade.** | [Pricing](https://supabase.com/pricing) | Alta |
| **Pro (a partir de US$ 25/mês):** 100 GB de armazenamento (excedente a US$ 0,0213/GB), 250 GB de egress (excedente a US$ 0,09/GB) e 250 GB de egress em cache (excedente a US$ 0,03/GB). Projetos pagos não são pausados. | Mesma | Alta |
| **Transformação de imagens:** só no Pro ou acima. 100 imagens de origem incluídas, depois **US$ 5 por 1.000**. Até 25 MB e 50 MP por imagem. URL `.../storage/v1/render/image/public/{bucket}/{path}?width=&height=`. | [Image transformations](https://supabase.com/docs/guides/storage/serving/image-transformations) | Alta |
| Conexão ao Postgres: em ambiente **serverless (Vercel)**, usar o pooler em **modo transação (porta 6543)**, que não suporta *prepared statements*. Em **servidor persistente (worker)**, usar a conexão direta (IPv6 ou add-on IPv4) ou o pooler em **modo sessão (5432)**. | [Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres) | Alta |

**Recomendação:** guardar as imagens do catálogo num bucket **público** do Supabase e mandar a URL pública em `images[].src` para a Nuvemshop, já que a URL precisa ser acessível. Converter para JPG, PNG ou WebP com menos de 20 MB antes do upload, porque esse é o limite da Nuvemshop.

### 6.3 Filas duráveis comparadas

| Opção | Durabilidade e modelo | Custo atual (consultado em 2026-10-27) | Encaixe na stack | Fonte | Confiança |
|---|---|---|---|---|---|
| **BullMQ + Redis (Render Key Value)**, o que existe hoje | Exige `maxmemory-policy noeviction` e **AOF recomendado**. Workers com ioredis precisam de `maxRetriesPerRequest: null` e devem tratar SIGINT/SIGTERM. | **Key Value Free: 25 MB, US$ 0, sem persistência em disco: o estado se perde em reinício ou upgrade.** O pago parte de **US$ 10/mês** (256 MB, persistência em disco). Worker: web service Free (dorme após 15 min sem tráfego; 750 h/mês por workspace) ou instância paga a partir de **US$ 7/mês** (512 MB). **Background worker não tem plano Free.** | Já implementado. Precisa de um processo sempre ligado. | [BullMQ – production](https://docs.bullmq.io/guide/going-to-production), [Render pricing](https://render.com/pricing), [Render free](https://render.com/docs/free) | Alta |
| BullMQ + **Upstash Redis** | Redis gerenciado e persistente. | Free com 500 mil comandos/mês e 250 MB; PAYG a **US$ 0,20 por 100 mil comandos**; fixo a partir de US$ 10/mês. A página não fala do BullMQ, e o worker do BullMQ faz polling e bloqueios que consomem comandos de forma contínua. | Troca só a `REDIS_URL`. | [Upstash Redis pricing](https://upstash.com/pricing/redis) | Alta (preço) / Não verificado (consumo do BullMQ) |
| **Upstash QStash** | Fila HTTP com push: chama uma rota da Vercel, com retries, atraso e DLQ. Não precisa de worker. | Free com **1.000 mensagens/dia** (resposta HTTP de até 15 min, paralelismo 10, DLQ de 3 dias); PAYG a **US$ 1 por 100 mil mensagens** (paralelismo 100); fixo 1M a US$ 180/mês. **Cada tentativa conta como mensagem.** | Elimina o Render, mas cada tarefa fica limitada à duração da função Vercel (300 s no Hobby). | [QStash pricing](https://upstash.com/pricing/qstash) | Alta |
| **Inngest** | Funções duráveis em etapas, com retries, concorrência por chave e throttling. | Free com **50 mil execuções/mês** e 5 etapas simultâneas (pausa ao atingir a cota); Pro a partir de **US$ 99/mês** com 1M de execuções e 100 etapas simultâneas. Excedente de ~US$ 50 a US$ 15 por milhão. | Roda dentro das rotas da Vercel. O throttling por chave (`store_id`) combina com o rate limit por loja da Nuvemshop. | [Inngest pricing](https://www.inngest.com/pricing) | Alta (preço) / Média (excedente) |
| **pg-boss (Postgres)** | Fila no próprio Postgres com `SKIP LOCKED`, retries com recuo, DLQ, cron e "exactly-once delivery". Requer **Node 22.12+ e Postgres 13+**. | **Sem custo extra**: usa o Supabase que já existe. Ainda precisa de um worker persistente (Render a partir de US$ 7/mês ou Free com as limitações acima). | Precisa de conexão de sessão (direta ou pooler 5432), não do pooler de transação. Remove o Redis e garante consistência transacional com as tabelas de pedido e importação. | [pg-boss README](https://raw.githubusercontent.com/timgit/pg-boss/master/README.md), [Supabase connecting](https://supabase.com/docs/guides/database/connecting-to-postgres) | Alta (recursos) / Média (encaixe com o pooler) |
| **Vercel Queues** | Fila gerenciada com push ou pull. | Hobby com 1M de operações incluídas; Pro cobrado por uso. | Nativa da Vercel e sem Render, mas também limitada pela duração das funções. | [Queues pricing](https://vercel.com/docs/queues/pricing) | Alta |

**Leitura:** com o plano atual (Render Key Value **Free**), a fila **não é durável**: um reinício apaga as tarefas pendentes, apesar do comentário "a fila não pode descartar tarefas" no `render.yaml`. O sistema se recupera porque o worker "encontra os itens novos direto no banco" (comentário em `queue.ts`). Na prática, o Postgres já é a fonte de verdade, e isso favorece o **pg-boss** (custo zero de fila) ou o **Inngest/QStash** (sem worker), em vez de pagar Redis persistente.

---

## 7. Discrepâncias entre o código atual e a documentação

| # | Gravidade | Onde | Discrepância | Documentação | Confiança |
|---|---|---|---|---|---|
| 1 | **Alta** | `api/nuvemshop/webhook/route.ts` | O handler espera `event` = `"store/redact"` e `"customers/redact"`. A documentação usa **`app/store_redact`** e **`customer/redact`**, e os exemplos de payload de LGPD **não trazem `event`**. Os pedidos de LGPD podem cair no caso padrão e responder 200 sem revogar nem apagar nada. | [Webhook](https://nuvemshop.dev/en-US/api/resources/2025-03/webhook) | Média-alta |
| 2 | **Alta** | OAuth e `DEPLOY.md` | `app/uninstalled` **nunca é registrado** via `POST /webhooks`. O portal só configura os 3 tópicos de privacidade. Depois de uma desinstalação, a loja continua `CONNECTED` com um token inválido. | Webhook, Installation | Média |
| 3 | **Alta** | `api/nuvemshop/retorno/route.ts` | Exige `state` e usuário logado. A homologação exige instalação **iniciada pela Nuvemshop** e cadastro de usuário novo, e o guia de instalação não prevê `state` nesse caminho. A instalação pela loja de apps seria recusada. | [Homologation requirements](https://nuvemshop.dev/en-US/apps/publish/homologation/requirements), [Installation](https://nuvemshop.dev/en-US/api/guides/installation) | Média-alta |
| 4 | **Alta** | `render.yaml` | Key Value **Free** com `noeviction`, apresentado como fila que "não pode descartar tarefas". O Free do Render **não persiste em disco**, e o BullMQ recomenda AOF. | [Render free](https://render.com/docs/free), [BullMQ](https://docs.bullmq.io/guide/going-to-production) | Alta |
| 5 | Média | `payments.ts` `parseWebhook` | Monta `request-id:` vazio quando falta o header `x-request-id`. Os SDKs oficiais **omitem o par**, então a assinatura falha nesse caso. | SDKs `mercadopago/sdk-*` | Alta |
| 6 | Média | `payments.ts` `parseWebhook` | Não valida a idade do `ts` (o SDK tem tolerância): fica aberto a replay. Também lê `data.id` do corpo quando não está na URL, e o SDK usa o query param. | SDK Node (spec) | Média |
| 7 | Média | `payments.ts` `paymentProvider()` | `MERCADOPAGO_WEBHOOK_SECRET ?? ""`: sem o segredo, o HMAC usa chave vazia e todo webhook é recusado com 400 sem aviso. O Mercado Pago reenvia por dias. | Notificações MP | Alta (comportamento do código) |
| 8 | Baixa-média | `payments.ts` `createCheckout` | Usa a **Preferences API**, marcada como legado e não recomendada. Os recursos novos só saem na Orders API (`POST /v1/orders`, `checkout_url`, tópico `order`). | [Checkout Pro Orders](https://www.mercadopago.com.br/developers/en/reference/online-payments/checkout-pro-orders/overview.md) | Alta |
| 9 | Baixa-média | `nuvemshop.ts` `toNuvemshopPayload` | Descarta as imagens além da 9ª (`slice(0, 9)`). A documentação manda enviar o restante por `POST /products/{id}/images`, até 250. | [Product](https://nuvemshop.dev/en-US/api/resources/2025-03/product) | Alta |
| 10 | Baixa-média | `nuvemshop.ts` | Não valida o limite de **1.000 variantes**. Não trata `inventory_levels` em lojas com várias localizações, onde `stock` está obsoleto. Preenche só um idioma, mas os textos têm uma entrada por idioma da loja. | Product, Product Variant | Alta / Média (idiomas) |
| 11 | Baixa | `api/nuvemshop/webhook/route.ts` | `customers/data_request` não faz nada. A documentação diz que é responsabilidade do app enviar os dados ao lojista. Mesmo sem dados guardados, convém registrar o pedido e responder ao lojista. | Webhook | Alta |
| 12 | Baixa | `worker.ts` | `limiter` global de 1 req/s. O limite da Nuvemshop é de 2 req/s **por loja e por app** (×10 nos planos Next e Evolution). Não viola a documentação, mas limita a vazão com várias lojas. | [Getting started](https://nuvemshop.dev/en-US/api/getting-started) | Alta |
| 13 | Baixa | `nuvemshop.ts` | O User-Agent cai em `suporte@exemplo.com` se a variável faltar. A documentação exige um contato real. | Getting started | Alta |
| 14 | Info | `nuvemshop.ts` (comentário) | O link `tiendanube.github.io/api-documentation/intro` está **desatualizado**. A documentação foi para `nuvemshop.dev`. | Página antiga | Alta |
| 15 | Info | `nuvemshop.ts` | `exchangeCode` usa `www.nuvemshop.com.br/apps/authorize/token`. A documentação mostra `www.tiendanube.com/...` e diz que o domínio `nuvemshop.com.br` pode substituí-lo no link de autorização; não está explícito para o endpoint de token. | Authentication | Não verificado |

**Itens conferidos e de acordo com a documentação:**

- versão `2025-03`;
- token sem expiração, usado direto;
- troca do código por JSON no corpo;
- campos da resposta (`access_token`, `scope`, `user_id`);
- header `User-Agent`;
- leitura de `x-rate-limit-reset` em ms e retentativa no 429;
- HMAC do webhook (`x-linkedstore-hmac-sha256`, `client_secret`, hex, corpo bruto);
- até 3 atributos e até 9 imagens na criação;
- `stock: ""` para estoque ilimitado;
- `GET /products/sku/{sku}`;
- `X-Idempotency-Key` enviado ao Mercado Pago;
- formato do manifest `id;request-id;ts` quando todos os campos estão presentes;
- worker com `maxRetriesPerRequest: null` e tratamento de SIGINT/SIGTERM (requisitos do BullMQ).
