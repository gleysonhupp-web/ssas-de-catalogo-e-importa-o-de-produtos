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

## Fase 2: Rede de fornecedores

- `Account.kind`, `Membership` (equipes e convites) e `SupplierProfile` com verificação.
- Cadastro de fornecedor, que exige aprovação da plataforma para publicar.
- Painel do fornecedor:
  - visão geral;
  - meus produtos;
  - cadastro individual com upload de imagens (Supabase Storage);
  - envio para revisão.
- Assistente de importação CSV/XLSX: mapeamento de colunas, validação por linha, duplicatas, prévia,
  processamento no worker e relatório. Uma linha inválida não bloqueia as outras.
- Score de qualidade do cadastro e bloqueio de publicação abaixo do mínimo.
- Fila de aprovação de fornecedores e produtos no admin.
- Licença das imagens: declaração obrigatória do fornecedor no cadastro do produto.
- Testes: isolamento entre fornecedores e o cenário de 2.000 produtos com validação.

## Fase 3: Experiência do lojista

- Design system: tokens, componentes (botão, card, tabela, filtros, badges, vazio, carregando) e
  navegação lateral por perfil.
- Catálogo:
  - busca com índice (`pg_trgm`);
  - filtros por fornecedor, marca, preço de fornecimento, país e disponibilidade;
  - ordenação;
  - favoritos;
  - seleção múltipla.
- Detalhe do produto com galeria, fornecedor e condições comerciais. A tela separa a taxa de
  importação do preço da mercadoria.
- Dashboards reais do lojista, do fornecedor e do admin.
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

- Sincronização opcional de estoque e preço de fornecimento, com consentimento por campo.
- IA assistiva: sugestão de título, categoria e atributos faltantes, além de detecção de duplicatas.
  Sempre marcada como sugestão e sempre revisável.
- Análises para o fornecedor: produtos mais importados e por nicho.

## O que define o MVP pronto

São os critérios do capítulo 27 do briefing. Hoje o núcleo de lojista, cobrança e importação cumpre
a maior parte em código. Faltam:

- fornecedor com conta própria (Fase 2);
- conexão real com a Nuvemshop e checkout em sandbox (Fase 1, 👤);
- importação real em loja de teste (Fase 1);
- supervisão administrativa completa (Fases 2 e 4).
