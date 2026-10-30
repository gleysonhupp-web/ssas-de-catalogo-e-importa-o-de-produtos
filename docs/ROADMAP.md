# Roadmap por fases

Cada fase termina com um PR revisado pelo dono, testes verdes no CI e um resumo com o que mudou,
os arquivos alterados, os testes, as pendências, os riscos e as dependências externas. Nada vai para
produção sem o merge feito pelo dono.

Legenda das dependências: 👤 depende de ação do dono, 💰 tem custo mensal, ⚖️ depende de advogado
ou contador.

## Fase 0: Diagnóstico ✅ (este PR)

- Auditoria do código (`AUDITORIA_INICIAL.md`).
- Pesquisas de mercado, técnica e regulatória (`PESQUISA_*.md`).
- Arquitetura e modelo de dados (`ARQUITETURA.md`) e decisões (`DECISOES_TECNICAS.md`).
- Correções de baixo risco: limite de login, pagamento simulado bloqueado para lojistas em produção,
  segredo de webhook obrigatório, cabeçalhos de segurança, limpeza de sessões e RLS nas migrations
  com teste.

## Fase 1: Estabilização (próxima)

Inclui a parte do MVP que precisa do dono.

| # | Tarefa | Depende de |
|---|---|---|
| 1.1 | Criar o app de parceiro na Nuvemshop e colocar `NUVEMSHOP_CLIENT_ID` e `NUVEMSHOP_CLIENT_SECRET` na Vercel | 👤 |
| 1.2 | Credenciais **de teste** do Mercado Pago (sandbox) num ambiente de staging, e só depois as de produção | 👤 |
| 1.3 | Retirar do catálogo os 20 produtos fictícios em produção | 👤 aprovação |
| 1.4 | Ambiente de staging: segundo projeto Supabase ligado às previews da Vercel | 👤 (criar o projeto) |
| 1.5 | E-mail transacional (Resend): verificação de e-mail, recuperação de senha | 👤 conta e domínio |
| 1.6 | Páginas de Termos de Uso e Política de Privacidade (rascunho técnico, revisão jurídica) | ⚖️ |
| 1.7 | Sentry no site e no worker, e logs JSON com correlationId | 👤 conta gratuita |
| 1.8 | Atualizar para Next 16 (resolve os alertas do `npm audit`) | — |
| 1.9 | Worker no Render apontando para `main` e fora do plano gratuito (ou fila gerenciada) | 👤💰 |
| 1.9b | Instalação começando pela loja de apps da Nuvemshop (cria a conta do lojista na volta do OAuth), exigida na homologação | 1.1 |
| 1.9c | Fila: decidir entre pg-boss e Redis pago (DT-10); limitador por loja | 👤💰 |
| 1.10 | **Teste ponta a ponta real:** loja de teste Nuvemshop, pagamento sandbox e importação de 50 produtos (cenários 1, 2 e 3 contra serviços reais) | 1.1, 1.2, 1.4 |

## Fase 2: Catálogo curado e piloto

Substitui a antiga "Rede de fornecedores" (ver DT-11). O catálogo é preparado e mantido pela equipe
da Via Estoque, sem contas de fornecedor.

- Campos no produto: "onde comprar (referência)" (marca ou distribuidor oficial) e a autorização do
  conteúdo (quem autorizou, quando, por qual meio). Publicação bloqueada sem eles.
- Checklist de revisão no painel interno antes de mudar o status para Aprovado.
- Revisão periódica: produto sem revisão há mais de 90 dias aparece numa lista no admin.
- Página de apresentação com lista de espera e teste de dois preços.
- Assistente de importação CSV/XLSX do painel interno com validação por linha e prévia (uso da
  equipe, não de fornecedores).
- Testes: bloqueio de publicação sem autorização e sem "onde comprar".

## Fase 3: Experiência do lojista

- Design system: tokens, componentes (botão, card, tabela, filtros, badges, vazio, carregando) e
  navegação lateral por perfil.
- Catálogo:
  - busca com índice (`pg_trgm`);
  - filtros por marca, categoria e disponibilidade;
  - ordenação;
  - favoritos;
  - seleção múltipla.
- Detalhe do produto com galeria e "onde comprar (referência)". A tela separa a taxa de
  importação do preço da mercadoria.
- Dashboards reais do lojista e do admin.
- Onboarding guiado: criar conta, conectar loja e escolher os primeiros produtos.

## Fase 4: Pagamentos e importação em escala

- `PricingRule` configurável no admin, com faixas por volume, moeda e vigência; o pedido guarda a
  regra usada.
- Carteira de créditos pré-pagos sobre o livro-razão existente (decisão do dono).
- Limitador de vazão **por loja** no worker.
- Interface `StorePlatform` (adaptador) com a Nuvemshop migrada para ela.
- Painel financeiro: receitas, pagamentos pendentes, divergências e estornos.
- Política de reembolso e falhas documentada em `REGRAS_DE_COBRANCA.md`.

## Fase 5: Qualidade de produção

- Testes end-to-end com Playwright no staging.
- Testes de acessibilidade (axe) e responsividade.
- MFA (TOTP) para contas da equipe.
- CSP.
- Alertas de falha de importação e de pagamento.
- Teste de carga do catálogo com 100 mil produtos sintéticos no staging.
- Procedimento de backup e restauração testado.

## Fase 6: Expansão internacional

- i18n (pt-BR, es, en) com `next-intl`; produtos com tradução separada da interface.
- Moedas BRL, USD e EUR; Stripe para fora do Brasil.
- Adaptadores Shopify e WooCommerce.
- Regras por país: documento empresarial, impostos e disponibilidade. Exige ⚖️.

## Fase 7: Recursos avançados

- Atualização opcional das fichas já importadas quando o conteúdo da marca mudar, com consentimento
  do lojista por campo. Estoque e preço continuam com o lojista.
- IA assistiva: sugestão de título, categoria e atributos faltantes, além de detecção de duplicatas.
  Sempre marcada como sugestão e sempre revisável.
- Análises internas: produtos mais importados e por nicho, para orientar a curadoria.

## O que define o MVP pronto

São os critérios do capítulo 27 do briefing. Hoje o núcleo de lojista, cobrança e importação cumpre
a maior parte em código. Faltam:

- catálogo real autorizado e piloto pago (Fase 2);
- conexão real com a Nuvemshop e checkout em sandbox (Fase 1, 👤);
- importação real em loja de teste (Fase 1);
- supervisão administrativa completa (Fases 2 e 4).
