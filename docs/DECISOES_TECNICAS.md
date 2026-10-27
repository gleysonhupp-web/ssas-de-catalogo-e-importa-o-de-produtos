# Decisões técnicas

Cada decisão registra o contexto, o que foi escolhido e o porquê. Uma decisão nova só substitui uma
antiga quando explica o que mudou.

## DT-01: Evoluir o código existente, sem reescrever (2026-10-27)

**Contexto:** o briefing pede para não reconstruir sem necessidade.

**Decisão:** manter Next.js 15, Prisma, Postgres (Supabase), Vercel e o worker com BullMQ.

**Motivo:** o núcleo de cobrança e importação (livro-razão, idempotência, trava de pedido,
reconciliação por SKU) está correto e coberto por testes. Reescrever traria risco sem ganho.

## DT-02: Manter CSS próprio e criar um design system, sem adotar Tailwind agora (2026-10-27)

**Contexto:** o briefing cita Tailwind como opção. O projeto usa CSS com variáveis em 92 linhas.

**Decisão:** na Fase 3, construir os componentes sobre as variáveis CSS existentes. Tailwind só
entra se a equipe de frontend crescer.

**Motivo:** a interface é pequena. Migrar todas as telas para utilitários não melhora o produto, e
o critério "não instalar tecnologia por preferência" se aplica.

## DT-03: Manter a autenticação própria (2026-10-27)

**Contexto:** a autenticação atual não tem verificação de e-mail nem recuperação de senha.

**Decisão:** completar a autenticação própria com e-mail transacional e MFA para a equipe, em vez
de migrar para Supabase Auth ou Auth.js.

**Motivo:** as partes difíceis já estão corretas: scrypt, token de sessão com hash e cookie
httpOnly. Migrar quebraria as sessões e o modelo de papéis.

**Revisar se:** surgir a necessidade de login social ou SSO corporativo.

## DT-04: Banco como fonte da verdade e fila só para agendar (já existente)

**Decisão:** o estado de cada item de importação vive no Postgres, e a fila apenas acorda o
trabalho. O worker reencontra itens pagos e parados no banco.

**Motivo:** permite perder o Redis sem perder importações pagas e torna o retry seguro.

## DT-05: Dinheiro em centavos inteiros e moeda explícita (já existente; estender)

**Decisão:** valores em `Int` (centavos), calculados só no servidor, com preço travado no pedido.
Com a internacionalização, todo valor passa a ter `currency` ao lado.

**Motivo:** evita erro de arredondamento e conversão implícita de moeda.

## DT-06: Pagamento simulado nunca libera importação para lojista em produção (2026-10-27)

**Contexto:** com `ALLOW_FAKE_PAYMENTS=1` em produção, qualquer lojista poderia simular um Pix
aprovado.

**Decisão:** em produção, só contas ADMIN e FINANCE usam o provedor simulado. Lojistas veem
"pagamentos sendo ativados".

## DT-07: Limite de tentativas de login guardado no AuditLog (2026-10-27)

**Decisão:** contar as falhas recentes por e-mail (5 em 15 min) e por IP (20 em 15 min), gravando
apenas hashes.

**Motivo:** não precisa de Redis no site nem de migration, e o registro fica auditável.

**Revisar se:** o volume de logins tornar a contagem lenta. Nesse caso, criar uma tabela própria
com índice em `createdAt`.

## DT-08: RLS ligado e sem políticas em todas as tabelas (2026-10-27)

**Decisão:** toda tabela tem RLS ligado na própria migration, e o CI barra uma tabela nova sem RLS
(`tests/migrations-rls.test.ts`).

**Motivo:** o Supabase expõe o schema `public` pela API com a chave anônima. O app usa o Prisma
como dono das tabelas e não depende de políticas.

## DT-09: Repasse a fornecedores desligado (2026-10-27)

**Decisão:** começar pelo Modelo A, em que a plataforma recebe toda a taxa. O Modelo B fica apenas
documentado.

**Motivo:** o repasse exige PSP com split, contrato com fornecedores e análise
regulatória/tributária (ver `PESQUISA_REGULATORIA_INTERNACIONAL.md`).

## DT-10: Fila no próprio Postgres (pg-boss) em vez de Redis (proposta, aguarda o dono)

**Contexto:** o Redis gratuito do Render não é durável, e o sistema já usa o banco como fonte da
verdade (DT-04).

**Proposta:** trocar o BullMQ pelo pg-boss, que roda no Supabase e tem custo zero de fila, e manter
um worker persistente no Render (Starter, cerca de US$ 7/mês). Alternativas sem worker: Inngest ou
QStash, com throttling por loja, mas cada tarefa fica limitada à duração das funções da Vercel.
Comparação em `PESQUISA_TECNICA_INTEGRACOES.md` §6.3.

**Por que esperar:** envolve custo mensal e não bloqueia o MVP.
