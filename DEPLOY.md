# Publicação: GitHub → Supabase, Render, Vercel e UptimeRobot

| Parte | Onde | O que roda |
|---|---|---|
| Código | GitHub | este repositório |
| Banco PostgreSQL | Supabase | dados de catálogo, lojas, pedidos e livro-razão |
| Site e APIs (Next.js) | Vercel | vitrine, admin, OAuth, checkout e webhooks |
| Fila + worker de importação | Render | `npm run worker` e Redis (Key Value) |
| Monitoramento | UptimeRobot | `GET /api/saude` |

## 1. Supabase (banco)
1. Crie um projeto (região São Paulo).
2. Em **Connect**, copie as duas strings:
   - `DATABASE_URL`: pooler em modo *transaction* (porta 6543) e acrescente `?pgbouncer=true&connection_limit=1`
   - `DIRECT_URL`: conexão direta (porta 5432), usada só nas migrações
3. As tabelas são criadas automaticamente no primeiro deploy da Vercel (`prisma migrate deploy`).
4. Primeiro administrador e catálogo de demonstração, rodando localmente com as URLs do Supabase:
   `ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed`

## 2. Render (fila e worker)
1. **New → Blueprint** e escolha este repositório; o `render.yaml` cria o worker e o Redis.
2. Preencha no worker: `DATABASE_URL`, `DIRECT_URL`, `TOKEN_ENCRYPTION_KEY` (a mesma da Vercel), `NUVEMSHOP_APP_NAME`, `NUVEMSHOP_CONTACT_EMAIL`.
3. Copie a **External URL** do Redis (`rediss://...`) para usar na Vercel.

## 3. Vercel (site)
1. **Add New → Project** e importe este repositório (framework Next.js, sem mudar comandos).
2. Variáveis de ambiente (Production):
   - `DATABASE_URL`, `DIRECT_URL` (Supabase)
   - `REDIS_URL` (URL externa do Render)
   - `TOKEN_ENCRYPTION_KEY` (gere com `openssl rand -base64 32`; a mesma do Render)
   - `APP_URL` (ex.: `https://seu-dominio.com.br`)
   - `NUVEMSHOP_CLIENT_ID`, `NUVEMSHOP_CLIENT_SECRET`, `NUVEMSHOP_APP_NAME`, `NUVEMSHOP_CONTACT_EMAIL`
   - `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`
   - `UNIT_PRICE_CENTS=125`

## 4. Nuvemshop (portal de parceiros)
1. Crie o aplicativo em https://partners.nuvemshop.com.br com a permissão **write_products**.
2. URL de redirecionamento: `{APP_URL}/api/nuvemshop/retorno`
3. Webhooks (desinstalação e LGPD): `{APP_URL}/api/nuvemshop/webhook`
4. Teste primeiro numa loja de demonstração, publicando 5 produtos com imagem e variante.

## 5. Mercado Pago
1. Em **Suas integrações**, crie uma aplicação (Checkout Pro) e copie o Access Token de produção.
2. Em **Webhooks**, cadastre `{APP_URL}/api/pagamentos/webhook` com o evento **Pagamentos** e copie a assinatura secreta para `MERCADOPAGO_WEBHOOK_SECRET`.
3. Faça uma compra de teste com credenciais de teste antes de usar as de produção.

## 6. UptimeRobot
1. **Add New Monitor → HTTP(s)** apontando para `{APP_URL}/api/saude`, intervalo de 5 minutos.
2. Responde 200 quando o site e o banco estão no ar; 503 quando o banco não responde.
3. Opcional: um monitor de palavra-chave em `{APP_URL}/` procurando "Catálogo".
