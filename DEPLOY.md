# Publicação: GitHub → Supabase, Render, Vercel e UptimeRobot

| Parte | Onde | O que roda |
|---|---|---|
| Código | GitHub | este repositório |
| Banco PostgreSQL | Supabase | dados de catálogo, lojas, pedidos e livro-razão |
| Site e APIs (Next.js) | Vercel | vitrine, admin, OAuth, checkout e webhooks |
| Fila + worker de importação | Render | `npm run worker` e Redis (Key Value) |
| Monitoramento | UptimeRobot | `/api/saude` do site e a raiz do worker |

O site **não precisa** acessar o Redis: ele grava os itens pagos no banco e o worker
os busca a cada 5 segundos. Só o worker fala com a fila, pela rede interna do Render.

## 1. Supabase (banco)
- Projeto em São Paulo (`sa-east-1`).
- O app usa um usuário próprio, `catalogo_app`, dono das tabelas. Todas as tabelas têm RLS ligado
  e nenhum acesso pelos papéis públicos (`anon`/`authenticated`), então a API REST do Supabase não expõe nada.
- Conexões (usuário `catalogo_app.<ref-do-projeto>`):
  - `DATABASE_URL`: pooler em modo transação, porta **6543**, com `?pgbouncer=true&connection_limit=1`
  - `DIRECT_URL`: pooler em modo sessão, porta **5432** (usado nas migrações)
- Novas migrações rodam sozinhas no deploy da Vercel (`prisma migrate deploy`).

## 2. Render (fila e worker)
- `catalogo-fila`: Key Value gratuito, só acesso interno.
- `catalogo-worker`: Web Service gratuito que roda `npm run worker` e responde em `/` com o tamanho da fila.
- Variáveis: `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL` (URL interna da fila), `TOKEN_ENCRYPTION_KEY`
  (a mesma da Vercel), `NUVEMSHOP_APP_NAME`, `NUVEMSHOP_CONTACT_EMAIL`, `NODE_VERSION=22`.
- Com cartão cadastrado, migre para Background Worker (starter) e Key Value starter (com persistência).

## 3. Vercel (site)
1. **Add New → Project** e importe este repositório (framework Next.js, sem mudar comandos).
2. Variáveis de ambiente (Production):
   - `DATABASE_URL`, `DIRECT_URL` (as mesmas do worker)
   - `TOKEN_ENCRYPTION_KEY` (a mesma do worker)
   - `APP_URL` (ex.: `https://seu-projeto.vercel.app`)
   - `NUVEMSHOP_CLIENT_ID`, `NUVEMSHOP_CLIENT_SECRET`, `NUVEMSHOP_APP_NAME`, `NUVEMSHOP_CONTACT_EMAIL`
   - `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`
   - Para demonstrar sem Mercado Pago: `ALLOW_FAKE_PAYMENTS=1` (remova antes de vender)
3. Primeiro administrador: crie uma conta pelo site e peça para promovê-la a `ADMIN`.

## 4. Nuvemshop (portal de parceiros)
1. Crie o aplicativo em https://partners.nuvemshop.com.br com a permissão **write_products**.
2. URL de redirecionamento: `{APP_URL}/api/nuvemshop/retorno`
3. Webhooks (desinstalação e LGPD): `{APP_URL}/api/nuvemshop/webhook?topico=app/store_redact`, `...?topico=customer/redact` e `...?topico=customers/data_request` (os eventos de LGPD não trazem o nome do evento no corpo; a desinstalação é registrada automaticamente ao conectar a loja)
4. Teste primeiro numa loja de demonstração, publicando 5 produtos com imagem e variante.

## 5. Mercado Pago
1. Em **Suas integrações**, crie uma aplicação (Checkout Pro) e copie o Access Token.
2. Em **Webhooks**, cadastre `{APP_URL}/api/pagamentos/webhook` com o evento **Pagamentos** e copie a
   assinatura secreta para `MERCADOPAGO_WEBHOOK_SECRET`.
3. Faça uma compra com credenciais de teste antes de usar as de produção.

## 6. UptimeRobot
1. **HTTP(s)** em `{APP_URL}/api/saude`, a cada 5 minutos (site + banco).
2. **HTTP(s)** em `https://catalogo-worker.onrender.com/`, a cada 5 minutos. Além de avisar se o worker
   cair, isso o mantém acordado no plano gratuito do Render.
