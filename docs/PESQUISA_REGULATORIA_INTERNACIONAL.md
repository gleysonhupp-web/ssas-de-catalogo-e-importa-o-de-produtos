# Pesquisa regulatória e de operações internacionais

**Produto:** SaaS B2B em que fornecedores publicam catálogos (fotos e descrições) e lojistas pagam uma taxa por produto para importar esses cadastros para as próprias lojas virtuais (Nuvemshop no MVP; depois Shopify e WooCommerce). A plataforma **não vende a mercadoria**.
**Mercados:** Brasil (MVP), depois América Latina, União Europeia e Estados Unidos.
**Data de consulta de todas as fontes:** 2026-10-27, salvo indicação em contrário.
**Natureza do documento:** pesquisa para orientar decisões de produto e preparar as conversas com advogado e contador. **Não é parecer jurídico nem contábil.**

---

## 0. Como ler este documento

Cada conclusão vem marcada com uma destas etiquetas:

| Etiqueta | Significado |
|---|---|
| **[OBRIGATÓRIO]** | Decorre diretamente de lei, regulamento ou decisão vinculante citada. |
| **[RECOMENDADO]** | Boa prática, gestão de risco ou exigência contratual de terceiros (ex.: Shopify, Nuvemshop). Não é exigência legal direta. |
| **[ASSESSORIA]** | Depende de interpretação jurídica ou contábil sobre o modelo concreto. Levar ao advogado ou contador. |

**Confiança:** **Alta** (texto legal oficial lido diretamente), **Média** (fonte oficial secundária, resumo oficial ou interpretação razoável do texto), **Baixa** (fonte não oficial, ponto controverso ou não verificado na íntegra).

**Limites desta pesquisa (transparência):**
- O texto integral dos artigos do GDPR no EUR-Lex não carregou pela ferramenta de leitura, que trouxe só os considerandos. Os artigos do GDPR foram confirmados por fontes oficiais da UE (Comissão Europeia e EDPB) que os reproduzem ou resumem.
- Não consegui ler a Resolução BCB nº 80/2021 (autorização de instituições de pagamento) no site do BCB, que exige JavaScript. Os limites de volume para dispensa de autorização **não foram verificados** e estão marcados como pendência.
- A página oficial da Resolução Anatel nº 780/2025 estava em manutenção. O conteúdo vem de comunicados oficiais da AGU e de escritório de advocacia (indicado em cada caso).
- A tributação na América Latina **não foi pesquisada** nesta rodada.

---

## 1. Resumo executivo

1. **LGPD:** a empresa é **controladora** dos dados dos próprios clientes (lojistas, fornecedores e seus usuários). Para dados de consumidores finais das lojas acessados via API, tende a ser **operadora** do lojista. A melhor estratégia é **não pedir escopos de API com dados de clientes** se o produto não precisar deles. Incidentes devem ser comunicados à ANPD e aos titulares em **3 dias úteis** (prazo em dobro para agente de pequeno porte). Os webhooks LGPD da Nuvemshop são obrigatórios contratualmente.
2. **GDPR:** só passa a valer quando a empresa **visar** pessoas na UE (idioma, moeda, entrega, marketing). Nesse caso, é preciso nomear um **representante na UE (art. 27)**. Desde 26/01/2026 há **adequação mútua Brasil–UE**, o que simplifica as transferências entre Brasil e UE. Os EUA continuam sem adequação perante a ANPD, então nuvem nos EUA exige as cláusulas-padrão da ANPD.
3. **Direitos autorais e marcas:** fotos e textos são obras protegidas (Lei 9.610/98, art. 7º). Qualquer uso depende de **autorização prévia e expressa**, e os contratos são **interpretados restritivamente** (art. 4º). O fornecedor precisa conceder **licença escrita, expressa e sublicenciável aos lojistas**, que cubra todos os países e modalidades, com garantia e indenização. Quem vende ou expõe obra contrafeita responde **solidariamente** (art. 104).
4. **Responsabilidade civil:** após o STF (26/06/2025, Temas 987 e 533), a regra geral passou a ser responsabilidade **após notificação extrajudicial** (art. 21 do MCI) em ilícitos em geral. **Marketplaces respondem pelo CDC.** Uma plataforma B2B de catálogo **tende a não ser** fornecedora ao consumidor final, mas isso **depende de assessoria**. O lojista é quem responde ao consumidor.
5. **Tributação no Brasil:** o ISS deve ser enquadrado pelo contador entre os itens **1.03, 1.05 e 1.09** da LC 116/2003 (o 1.09 se ajusta bem a "disponibilização de imagem e texto pela internet"). A NFS-e de padrão nacional é obrigatória desde 01/01/2026, com destaque de IBS e CBS em 2026 (ano-teste). Em 2027 começa a CBS e o PIS/Cofins é extinto. Em 2033 o ISS é extinto.
6. **Pagamentos:** **não receber e repassar dinheiro de terceiros** com conta própria. Usar **split de um PSP autorizado pelo BCB**. Desde a Resolução BCB 522/2025, subcredenciadores têm participação obrigatória na liquidação centralizada. Pela LC 214/2025, art. 22, controlar o pagamento pode tornar a empresa "plataforma digital" responsável por IBS/CBS.
7. **Produtos regulados:** cosméticos (RDC 752/2022) e suplementos (RDC 243/2018 e IN 28/2018) exigem regularização na Anvisa. Eletrônicos de telecom exigem homologação Anatel, e a **Resolução 780/2025 tornou plataformas solidariamente responsáveis** (norma contestada judicialmente). Ficam proibidos cigarros eletrônicos (RDC 855/2024), medicamentos fora de farmácia e controlados por meio remoto.
8. **Exterior:** na UE, venda **B2B** de serviços segue a regra do local do cliente com **reverse charge** (o cliente recolhe); o OSS não-União serve para **B2C**. Nos EUA, o nexo econômico vem de *Wayfair* (2018) e a tributação de SaaS varia por estado.

---

## 2. LGPD (Lei 13.709/2018)

**Fonte principal:** Lei 13.709/2018, https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm (consulta em 2026-10-27).

### 2.1 Aplicação e papéis (controlador × operador)

- **[OBRIGATÓRIO]** A LGPD se aplica a qualquer tratamento realizado no Brasil, que tenha por objetivo ofertar bens ou serviços a indivíduos no Brasil ou que envolva dados coletados no Brasil (art. 3º). **Confiança: Alta.**
- Definições (art. 5º): o **controlador** é "a quem competem as decisões referentes ao tratamento" (VI); o **operador** realiza o tratamento "em nome do controlador" (VII); o **encarregado** é o canal de comunicação com titulares e ANPD (VIII). **Confiança: Alta.**
- **Critério da ANPD:** o controlador decide os **elementos essenciais** (finalidade, natureza dos dados e duração). O operador pode decidir elementos **não essenciais**, como medidas técnicas e escolha de software. O papel é definido pela atuação concreta, não pelo rótulo do contrato. Um provedor de nuvem contratado pelo operador é **suboperador**, e a ANPD recomenda autorização formal do controlador para essa subcontratação. Fonte: ANPD, *Guia Orientativo para Definições dos Agentes de Tratamento e do Encarregado* (2021), https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-agentes-de-tratamento-e-encarregado-versao-1-0-defeso-eleitoral.pdf/@@display-file/file. **Confiança: Alta** (guia oficial, porém não vinculante).

**Aplicação ao nosso modelo** (análise; **[ASSESSORIA]** para confirmar):

| Dados | Papel provável da plataforma | Por quê |
|---|---|---|
| Cadastro de lojistas e fornecedores (nome, e-mail, CPF/CNPJ, usuários, cobrança, logs) | **Controlador** | A plataforma define finalidade e meios para operar o próprio serviço. |
| Dados de consumidores finais das lojas (pedidos, clientes) obtidos via API Nuvemshop/Shopify | **Operador** do lojista (que é o controlador) | O tratamento é feito em nome da loja e para a finalidade dela. |
| Dados pessoais em fotos ou descrições (ex.: modelo fotografado, nome de fotógrafo) | Controlador ou cocontrolador com o fornecedor, dependendo do uso | **[ASSESSORIA]** |
| Métricas agregadas de uso para melhorar o produto | Controlador (finalidade própria) | Se usar dados de clientes das lojas para finalidade própria, deixa de ser mero operador nessa parte. |

- **[RECOMENDADO]** Princípio de minimização: o fluxo de importação de catálogo **não precisa** de dados de consumidores finais. Pedir à Nuvemshop e à Shopify **apenas escopos de produto** reduz o risco e quase elimina o papel de operador. **Confiança: Média** (inferência do modelo).
- **[OBRIGATÓRIO]** O operador deve tratar os dados "segundo as instruções fornecidas pelo controlador" (art. 39). Se descumprir a lei ou as instruções, responde **solidariamente** (art. 42, §1º, I). **Confiança: Alta.**

### 2.2 Bases legais (art. 7º)

Lista legal: consentimento (I); obrigação legal ou regulatória (II); execução de contrato (V); exercício regular de direitos (VI); legítimo interesse (IX); proteção do crédito (X), entre outras. **Confiança: Alta.**

Mapeamento sugerido **[RECOMENDADO]**, a ser validado pelo advogado **[ASSESSORIA]**:

| Finalidade | Base legal sugerida |
|---|---|
| Criar conta, prestar o serviço, cobrar | Execução de contrato (art. 7º, V) |
| Emitir NFS-e e guardar registros fiscais | Obrigação legal (art. 7º, II) |
| Guardar registros de acesso por 6 meses (MCI, art. 15) | Obrigação legal (art. 7º, II) |
| Segurança, prevenção a fraude, melhoria do produto | Legítimo interesse (art. 7º, IX), com teste de balanceamento documentado |
| E-mail marketing para quem não é cliente | Consentimento (art. 7º, I) ou legítimo interesse, conforme o caso |
| Defesa em processos | Exercício regular de direitos (art. 7º, VI) |

### 2.3 Encarregado (DPO)

- **[OBRIGATÓRIO]** O controlador deve indicar encarregado (art. 41). A ANPD pode prever dispensa conforme porte (art. 41, §3º). **Confiança: Alta.**
- **[OBRIGATÓRIO, com exceção]** Agentes de pequeno porte (ME, EPP e startups, conforme LC 123/2006 e LC 182/2021) **não são obrigados** a indicar encarregado, mas **devem manter canal de comunicação** com o titular. Indicar encarregado mesmo assim conta como boa prática (Resolução CD/ANPD nº 2/2022, art. 11). **Não pode usar o benefício** quem faz tratamento de **alto risco**, quem ultrapassa o limite de receita ou quem integra grupo que o ultrapasse (art. 3º). Fonte: https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022. **Confiança: Alta.**
- A atuação do encarregado é regulada pela Resolução CD/ANPD nº 18/2024 (publicada no DOU em 17/07/2024; não lida na íntegra nesta rodada). **Confiança: Média.**
- **[RECOMENDADO]** Mesmo dispensado, publicar um e-mail de privacidade e nomear um responsável interno. Shopify e Nuvemshop exigem atendimento a pedidos de titulares de qualquer forma (ver 2.6).

### 2.4 Segurança e incidentes

- **[OBRIGATÓRIO]** Adotar medidas de segurança técnicas e administrativas (art. 46). **Confiança: Alta.**
- **[OBRIGATÓRIO]** O controlador comunica à ANPD e aos titulares incidente que possa acarretar risco ou dano relevante (art. 48), em **3 dias úteis** (Resolução CD/ANPD nº 15/2024, arts. 6º e 9º). Fonte: https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis. **Confiança: Alta.**
- **[OBRIGATÓRIO]** Agente de pequeno porte tem **prazo em dobro** para comunicar incidentes, salvo risco à integridade física ou moral dos titulares ou à segurança nacional (Resolução 2/2022, art. 14, II, na redação dada pela Resolução 15/2024). **Confiança: Alta.**
- **[OBRIGATÓRIO/CONTRATUAL]** Quando a plataforma for **operadora**, deve informar o controlador (lojista) "sem demora injustificada"; quem comunica a ANPD é o controlador. A ANPD recomenda prever isso em contrato. Mesma fonte. **Confiança: Alta.**
- **[RECOMENDADO]** Manter um plano de resposta a incidentes, um registro interno de incidentes, logs e um contrato de DPA com os suboperadores (nuvem, e-mail, analytics).

### 2.5 Direitos dos titulares (art. 18)

**[OBRIGATÓRIO]** Os titulares têm direito a: confirmação da existência de tratamento; acesso; correção; anonimização, bloqueio ou eliminação; portabilidade; eliminação de dados tratados com consentimento; informação sobre compartilhamento; informação sobre a possibilidade de não consentir; e revogação do consentimento. **Confiança: Alta.**

### 2.6 Exigências das plataformas de e-commerce (contratuais)

- **[RECOMENDADO/CONTRATUAL] Nuvemshop:** os webhooks `store/redact`, `customers/redact` e `customers/data_request` estão na seção "Required Webhooks". A documentação diz que os parceiros "are obliged to delete data or to report what data they have, whenever requested". Fonte: https://tiendanube.github.io/api-documentation/resources/webhook. **Confiança: Alta.**
- **[RECOMENDADO/CONTRATUAL] Shopify:** `customers/data_request`, `customers/redact` e `shop/redact` são obrigatórios para **todo app na App Store**, mesmo que o app não colete dados pessoais. A ação deve ser concluída em 30 dias, e requisições com HMAC inválido devem receber 401. Fonte: https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance. **Confiança: Alta.**
- WooCommerce: não pesquisado.

### 2.7 Transferência internacional (LGPD)

- **[OBRIGATÓRIO]** Transferência internacional só nas hipóteses do art. 33: adequação, cláusulas-padrão ou específicas, normas corporativas globais, consentimento específico, entre outras. **Confiança: Alta.**
- **[OBRIGATÓRIO]** A Resolução CD/ANPD nº 19/2024 aprovou o regulamento e as **cláusulas-padrão contratuais** da ANPD. Elas devem ser incorporadas **sem modificações**, e o prazo de adaptação dos contratos foi de 12 meses após a publicação (venceu por volta de agosto de 2025). Fonte: https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados. **Confiança: Alta.**
- **[OBRIGATÓRIO]** A **UE tem decisão de adequação da ANPD** (Resolução nº 32, de 26/01/2026), e transferências para a UE dispensam mecanismos adicionais. **Não há adequação para os EUA**: hospedagem em AWS, GCP, Vercel ou Supabase nos EUA exige cláusulas-padrão da ANPD ou outra hipótese do art. 33. Mesma fonte. **Confiança: Alta** (UE); **Alta** (ausência de outros países na lista da ANPD).
- **[ASSESSORIA]** Verificar se os contratos dos provedores de nuvem já incorporam as cláusulas-padrão da ANPD. Se não incorporarem, decidir entre hospedar no Brasil ou na UE, ou celebrar cláusulas próprias.

### 2.8 Sanções

**[OBRIGATÓRIO]** As sanções vão de advertência a multa de até **2% do faturamento** no Brasil, limitada a **R$ 50 milhões por infração**, além de publicização, bloqueio, eliminação e suspensão (art. 52). **Confiança: Alta.**

---

## 3. GDPR (Regulamento UE 2016/679)

### 3.1 Aplicabilidade extraterritorial

- **[OBRIGATÓRIO quando aplicável]** O GDPR alcança responsável ou subcontratante **não estabelecido na UE** quando tratar dados de titulares que estejam na UE e a atividade estiver ligada (a) à **oferta de bens ou serviços** a esses titulares, mesmo gratuita, ou (b) ao **controle do comportamento** deles na UE (art. 3º, n.º 2). Fonte: EDPB, *Diretrizes 3/2018 sobre o âmbito territorial* (PT), https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_3_2018_territorial_scope_pt.pdf. **Confiança: Alta.**
- O critério decisivo é a **intenção de visar** pessoas na UE. Indícios: idioma ou moeda de Estado-membro, domínio `.eu` ou `.de`, campanhas dirigidas, telefone ou endereço na UE, entrega na UE. **Um site apenas acessível da UE não basta.** Mesma fonte. **Confiança: Alta.**
- **Aplicação ao modelo:** enquanto o produto for só para o Brasil (português, BRL, Nuvemshop BR), o GDPR **tende a não se aplicar**. Ao lançar para a UE (Shopify e WooCommerce com lojistas europeus), passa a se aplicar aos dados dos usuários dos lojistas e fornecedores europeus, que são pessoas físicas. A plataforma também pode ser subcontratante para dados de consumidores europeus das lojas. **[ASSESSORIA]**
- **[OBRIGATÓRIO quando aplicável]** É preciso **representante na UE** (art. 27), designado por mandato escrito e estabelecido num Estado-membro onde estejam os titulares. Há exceção para tratamento **ocasional**, sem dados sensíveis em grande escala e sem risco. Para um SaaS contínuo, a exceção tende a **não** se aplicar. Fonte: EDPB, Diretrizes 3/2018. **Confiança: Alta.**
- **[OBRIGATÓRIO quando aplicável]** Violação de dados: notificar a autoridade de controle em até 72 horas (art. 33). Fonte: EDPB, *Guidelines 9/2022 on personal data breach notification*, https://www.edpb.europa.eu/system/files/2023-04/edpb_guidelines_202209_personal_data_breach_notification_v2.0_en.pdf. **Confiança: Média** (diretriz listada na busca; o prazo de 72 horas é o texto conhecido do art. 33, mas não lido diretamente nesta rodada).
- Multas de até **€20 milhões ou 4% do faturamento anual mundial**. Fonte: Comissão Europeia, https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/enforcement-and-sanctions/sanctions/what-if-my-companyorganisation-fails-comply-data-protection-rules_en. **Confiança: Alta.**

### 3.2 Transferência internacional

- **Adequação UE → Brasil:** Decisão de Execução (UE) 2026/179, de 26/01/2026, em vigor na mesma data. Fontes: https://eur-lex.europa.eu/eli/dec_impl/2026/179/oj/eng e https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en. **Confiança: Alta.**
- **Consequência prática:** dados pessoais de europeus podem fluir da UE para o Brasil sem cláusulas-padrão (SCCs). Os EUA só têm adequação para empresas certificadas no **EU-US Data Privacy Framework** (decisão de 10/07/2023). Mesma fonte. **Confiança: Alta.**
- **[ASSESSORIA]** As SCCs da UE (Decisão 2021/914, de 04/06/2021) **não servem** quando o importador já está sujeito ao GDPR pelo art. 3º. A Comissão anunciou um conjunto próprio para esse caso. Fonte: https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/new-standard-contractual-clauses-questions-and-answers-overview_en. **Confiança: Alta.** Como a plataforma provavelmente estará sob o art. 3º(2), a forma de documentar as transferências para suboperadores fora da UE precisa ser definida com o advogado.
- **[RECOMENDADO]** DPA (art. 28) padrão para lojistas europeus, lista pública de suboperadores, registro de atividades de tratamento e avaliação de impacto quando houver risco.

---

## 4. Direitos autorais (Lei 9.610/1998) e marcas (Lei 9.279/1996)

**Fontes:** Lei 9.610/98, https://www.planalto.gov.br/ccivil_03/leis/l9610.htm. Lei 9.279/96, https://www.planalto.gov.br/ccivil_03/leis/l9279.htm. Consulta em 2026-10-27.

### 4.1 Fotos e descrições são obras protegidas

- **[OBRIGATÓRIO]** São protegidos "os textos de obras literárias, artísticas ou científicas" (art. 7º, I) e "as obras fotográficas" (art. 7º, VII). **Confiança: Alta.**
- **[ASSESSORIA]** Descrições puramente técnicas (ficha com medidas, composição, voltagem) podem ter **originalidade mínima** discutível. Ideias e "aproveitamento industrial ou comercial das ideias" não são protegidos (art. 8º, I e VII). Na dúvida, tratar todo texto como protegido. **Confiança: Média.**
- **[OBRIGATÓRIO]** Depende de **autorização prévia e expressa** do autor: reprodução (art. 29, I), distribuição por meios eletrônicos (VII), **inclusão em base de dados e armazenamento em computador** (IX) e qualquer modalidade futura (X). **Confiança: Alta.**
- **[OBRIGATÓRIO]** Os negócios sobre direitos autorais se **interpretam restritivamente** (art. 4º). Sem estipulação, o contrato vale para o **país em que foi firmado** (art. 49, IV) e só para as **modalidades existentes** na data do contrato (art. 49, V). A cessão é sempre **por escrito** e presume-se onerosa (art. 50). **Confiança: Alta.** Isso é crítico para a expansão internacional: a licença deve dizer expressamente "em todos os países".
- **[OBRIGATÓRIO]** A fotografia usada por terceiros "indicará de forma legível o nome do seu autor" (art. 79, §1º). O direito moral de ter o nome indicado é inalienável (art. 24, II). **Confiança: Alta.** **[ASSESSORIA]** Como cumprir isso em lojas de terceiros (campo de crédito no cadastro? metadado? cláusula de dispensa pelo fotógrafo?).
- **[OBRIGATÓRIO]** Quem **vende, expõe à venda, distribui ou utiliza** obra reproduzida com fraude responde **solidariamente** com o contrafator (art. 104). **Confiança: Alta.** É o principal risco para plataforma e lojista quando o fornecedor sobe foto de terceiros (ex.: copiada de outro e-commerce).
- **[OBRIGATÓRIO]** O art. 19 do Marco Civil **não se aplica** a direitos autorais, que "dependem de previsão legal específica" (art. 19, §2º). Não há "porto seguro" do MCI para fotos. **Confiança: Alta.**
- Prazo de proteção: 70 anos a partir de 1º de janeiro do ano seguinte à morte do autor (art. 41). **Confiança: Alta.**

### 4.2 Marcas

- **[OBRIGATÓRIO]** A propriedade da marca se adquire pelo registro no INPI, com uso exclusivo no território nacional (art. 129). O titular pode zelar pela integridade e reputação da marca (art. 130, III). **Confiança: Alta.**
- **[OBRIGATÓRIO]** O titular **não pode impedir** comerciantes de usar sinais próprios junto com a marca na comercialização (art. 132, I) nem a **livre circulação de produto** colocado no mercado interno por ele ou com seu consentimento (art. 132, III, exaustão nacional). **Confiança: Alta.** Revender produto original da marca é, em regra, lícito. **Usar o logotipo** da marca como se houvesse parceria, ou anunciar produto falsificado, não é.
- **[OBRIGATÓRIO]** São crimes: reproduzir ou imitar marca registrada sem autorização (art. 189); **vender, oferecer ou expor à venda** produto com marca ilicitamente reproduzida (art. 190, I); e concorrência desleal por meio fraudulento (art. 195, III). **Confiança: Alta.**
- **[RECOMENDADO]** Proibir nos termos o cadastro de réplicas ("inspired", "primeira linha", "AAA"), aplicar filtro de palavras e montar um canal de denúncia para titulares de marca.
- **[RECOMENDADO]** Registrar a **marca da própria plataforma** no INPI (classes de software e serviços) antes do lançamento e verificar a disponibilidade nos mercados-alvo. **[ASSESSORIA]**

### 4.3 Cláusulas de licença que o fornecedor deve conceder

**[RECOMENDADO]** Minuta de pontos, a ser redigida e validada por advogado **[ASSESSORIA]**:

1. **Declaração de titularidade:** o fornecedor declara ser autor ou titular, ou ter licença válida e escrita, de todas as fotos, vídeos e textos, e que obteve autorização de uso de imagem de pessoas retratadas.
2. **Licença à plataforma:** não exclusiva, gratuita (ou remunerada conforme o modelo), **mundial ("em todos os países")**, pelo prazo do contrato mais o período de retenção, para **reproduzir, armazenar em base de dados, redimensionar, comprimir, converter formato, gerar miniaturas, exibir e transmitir** o conteúdo. Citar expressamente as modalidades do art. 29 (I, VII, IX e X) por causa da interpretação restritiva.
3. **Sublicença aos lojistas:** direito de a plataforma sublicenciar a cada lojista que pagar pela importação o uso do conteúdo **para anunciar e vender o produto daquele fornecedor**, em qualquer loja virtual, marketplace, rede social e anúncio pago, inclusive com **adaptações** (tradução, ajuste de título e SEO, recorte).
4. **Sobrevivência:** a licença do lojista sobre produtos já importados continua (por exemplo, enquanto houver estoque ou por X meses) mesmo se o fornecedor sair da plataforma. Definir regra de *takedown* em caso de infração.
5. **Crédito do autor:** como será atendido o art. 79, §1º (campo de crédito) ou declaração do fotógrafo sobre a forma de indicação.
6. **Marcas:** autorização para exibir as marcas do fornecedor e declaração de que os produtos são originais e que o fornecedor tem direito de comercializá-los.
7. **Conformidade regulatória:** declaração de que cada produto está regularizado (Anvisa, Anatel, Inmetro quando houver), com os números de notificação, registro ou homologação informados no cadastro.
8. **Garantia e indenização:** o fornecedor indeniza a plataforma e os lojistas por reclamações de terceiros (direito autoral, marca, imagem, consumidor ou regulatório) decorrentes do conteúdo ou do produto.
9. **Notificação e retirada:** a plataforma pode suspender conteúdo após notificação plausível, sem responsabilidade.
10. **Lei aplicável e foro**, e cláusula de licença internacional para quando houver fornecedores ou lojistas estrangeiros.

---

## 5. Responsabilidade civil

### 5.1 Marco Civil da Internet, art. 19, após o STF

- Texto legal: o provedor de aplicações só responde por conteúdo de terceiros se, **após ordem judicial específica**, não o tornar indisponível (art. 19). Direitos autorais ficam fora dessa regra (§2º). O art. 21 trata de responsabilidade após notificação extrajudicial em casos de nudez. Fonte: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm. **Confiança: Alta.**
- **[OBRIGATÓRIO]** **STF, 26/06/2025, RE 1.037.396 (Tema 987) e RE 1.057.258 (Tema 533):** o art. 19 foi declarado **parcialmente inconstitucional**. Fontes: https://noticias.stf.jus.br/postsnoticias/stf-define-parametros-para-responsabilizacao-de-plataformas-por-conteudos-de-terceiros/ e o resumo oficial https://www.stf.jus.br/arquivo/cms/noticiaNoticiaStf/anexo/Informac807a771oa768SociedadeArt19MCI_vRev.pdf. Pontos relevantes da tese:
  - **Regra geral (item 3):** responsabilidade nos termos do **art. 21** (após notificação extrajudicial) por conteúdos de terceiros que configurem crime ou ato ilícito.
  - **Crimes contra a honra:** continua a exigência de ordem judicial.
  - **Marketplaces (item 7):** "respondem civilmente de acordo com o Código de Defesa do Consumidor".
  - **Deveres (itens 8 a 11):** autorregulação com sistema de notificações, devido processo e relatórios anuais de transparência; canais de atendimento acessíveis; publicação das regras; e **sede e representante no Brasil**.
  - **Modulação (item 14):** a tese se aplica só **prospectivamente**.
  - **Confiança: Alta** (fontes oficiais do STF).
- **[ASSESSORIA]** O enquadramento da plataforma como "provedor de aplicação" sujeito aos deveres dos itens 8 a 11 (que foram pensados para redes sociais e marketplaces) precisa de avaliação. **[RECOMENDADO]** Implementar mesmo assim: canal de denúncia, procedimento de notificação e retirada, regras publicadas e registro das decisões.
- **[OBRIGATÓRIO]** Guardar os **registros de acesso a aplicações por 6 meses**, sob sigilo (MCI, art. 15), porque a empresa é provedor de aplicação constituído como pessoa jurídica com fins econômicos. **Confiança: Alta.**

### 5.2 Responsabilidade pela publicação dos produtos

- **Fornecedor:** responde pela veracidade, pela titularidade do conteúdo e pela regularidade do produto (contrato).
- **Lojista:** é quem **oferta ao consumidor**. A oferta "obriga o fornecedor que a fizer veicular ou dela se utilizar" (CDC, art. 30), e a informação deve ser correta, clara e em português, inclusive sobre **riscos à saúde e segurança** (art. 31). O lojista também tem os deveres do Decreto 7.962/2013 (identificação, CNPJ, endereço, características do produto, arrependimento): https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm. **Confiança: Alta.**
- **Plataforma:** fornece o conteúdo ao lojista e pode responder **perante o lojista** (contrato) e **perante terceiros** (direitos autorais, art. 104 da Lei 9.610; marca, art. 190 da Lei 9.279; regras setoriais como Anatel, ver 8.2). **[ASSESSORIA]**
- **[RECOMENDADO]** Os termos devem dizer que **o lojista revisa e é responsável** pelo anúncio publicado. A plataforma deve oferecer avisos de categoria regulada e campos obrigatórios (número Anvisa ou Anatel).

### 5.3 O CDC se aplica à plataforma B2B?

- Conceitos: consumidor é quem adquire "como destinatário final" (CDC, art. 2º); fornecedor inclui quem presta serviços no mercado de consumo (art. 3º, §2º). Há solidariedade entre os fornecedores da cadeia (arts. 7º, parágrafo único; 18; 25, §1º). Cláusula que exonere ou atenue a responsabilidade é nula (art. 51, I). Fonte: https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm. **Confiança: Alta.**
- **Relação plataforma × lojista:** o STJ adota a **teoria finalista mitigada**. Para a pessoa jurídica, a vulnerabilidade **precisa ser provada** (técnica, jurídica, fática ou informacional), e ser microempresa não basta (REsp 2.001.086). Num caso análogo (empresa contra intermediadora de pagamentos), o CDC **não foi aplicado** por falta de prova de vulnerabilidade (REsp 2.020.811, 3ª Turma). Fontes: https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/2024/08092024-Consumidor-pessoa-juridica-quando-as-empresas-podem-ter-a-protecao-do-CDC.aspx e https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/2023/21032023-Falta-de-prova-de-vulnerabilidade-impede-aplicacao-do-CDC-em-contrato-de-gestao-de-pagamentos-on-line.aspx. **Confiança: Média.** A tendência é a relação ser regida pelo **Código Civil e pelo contrato**, não pelo CDC. Porém, **lojistas MEI ou pessoas físicas** podem conseguir provar vulnerabilidade. **[ASSESSORIA]**
- **Relação plataforma × consumidor final:** a plataforma não oferta nem vende ao consumidor e não aparece para ele. A tese do STF sobre **marketplaces** sob o CDC tende a **não alcançar** uma ferramenta B2B de catálogo, mas a cadeia de solidariedade do CDC é ampla. **[ASSESSORIA]** **Confiança: Baixa/Média.**
- **[RECOMENDADO]** Não usar marca, checkout ou atendimento da plataforma voltados ao consumidor final. Isso reforça a natureza B2B.

---

## 6. Termos de uso e contratos (itens mínimos)

Todos os itens abaixo são **[RECOMENDADO]**, com redação final **[ASSESSORIA]**. Os itens com base legal estão indicados.

### 6.1 Contrato com fornecedores

- Objeto, cadastro e verificação (CNPJ, responsável).
- Licença de conteúdo e marcas (seção 4.3).
- Declarações de regularidade dos produtos e campos obrigatórios por categoria (seção 8).
- Lista de produtos proibidos e consequências (suspensão, retirada, multa contratual).
- Garantia e indenização; limitação de responsabilidade da plataforma.
- Notificação e retirada; procedimento de contestação.
- Remuneração do fornecedor, se houver (atenção à seção 7.4 e à seção 9 sobre pagamentos).
- Dados pessoais: papéis LGPD e cláusulas de proteção de dados.
- Rescisão e destino do conteúdo já importado pelos lojistas.
- Lei e foro; em contratos internacionais, licença "mundial" (Lei 9.610, art. 49, IV).

### 6.2 Termos de uso (lojistas)

- Descrição do serviço e **declaração de que a plataforma não vende mercadoria** nem intermedeia a venda ao consumidor.
- Preço por produto importado, cobrança, reembolso, nota fiscal (NFS-e).
- Licença recebida (sublicença), limites e proibição de revenda do conteúdo.
- **Responsabilidade do lojista pelo anúncio** perante o consumidor (CDC, arts. 30 e 31; Decreto 7.962/2013) e pela conferência de preço, estoque e informação regulatória.
- Acesso via API: escopos solicitados, desinstalação e exclusão de dados (webhooks).
- Acordo de tratamento de dados (DPA), quando a plataforma for operadora (LGPD, arts. 39 e 42; ANPD recomenda contrato).
- Canal de denúncia, regras de conteúdo, devido processo e transparência (alinhamento à tese do STF, itens 8 a 10).
- Disponibilidade (SLA), suporte, limitação de responsabilidade (válida entre empresas; pode cair se o CDC for aplicado, art. 51, I).
- Lei e foro; aceite eletrônico com registro (data, IP, versão).

### 6.3 Política de privacidade (itens mínimos)

- Identificação do controlador e **contato do encarregado** ou canal de comunicação (LGPD, art. 41; Resolução 2/2022, art. 11).
- Dados coletados, finalidades e **bases legais** (art. 7º).
- Compartilhamento: suboperadores e plataformas de e-commerce (art. 18, VII).
- **Transferência internacional** e mecanismo usado (art. 33; Resolução 19/2024).
- Prazos de retenção (6 meses de registros de acesso pelo MCI, art. 15; prazos fiscais).
- Direitos do titular e como exercê-los (art. 18).
- Segurança e incidentes (arts. 46 e 48).
- Cookies e analytics.
- Seção GDPR quando houver oferta à UE: base legal, representante (art. 27), autoridade de controle.
- Data de vigência e histórico de versões.

---

## 7. Tributação no Brasil

### 7.1 ISS: qual item da LC 116/2003?

Fonte: LC 116/2003, https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm (consulta em 2026-10-27). **Confiança do texto: Alta.**

| Item | Texto legal | Aderência ao modelo |
|---|---|---|
| **1.03** | "Processamento, armazenamento ou hospedagem de dados, textos, imagens, vídeos, páginas eletrônicas, aplicativos e sistemas de informação, entre outros formatos, e congêneres." | Média: a plataforma hospeda e processa catálogos. |
| **1.05** | "Licenciamento ou cessão de direito de uso de programas de computação." | Média: muitos municípios enquadram SaaS aqui. |
| **1.09** | "Disponibilização, sem cessão definitiva, de conteúdos de áudio, vídeo, imagem e texto por meio da internet" (com ressalvas). | **Alta**: o lojista paga para receber fotos e textos de produtos. |
| 10.05 | "Agenciamento, corretagem ou intermediação de bens móveis ou imóveis, não abrangidos em outros itens" | Baixa hoje. Ganha relevância se a plataforma passar a intermediar a venda entre fornecedor e lojista ou repassar valores. |

- **Análise:** a cobrança **por produto importado** se parece mais com **1.09**, mas a operação também envolve software (1.05) e hospedagem (1.03). **[ASSESSORIA – contador]** O enquadramento depende da lista do **município do estabelecimento prestador** e de consulta ao fisco municipal. **Confiança: Baixa/Média.**
- **[OBRIGATÓRIO]** O ISS é devido, em regra, no **local do estabelecimento prestador** (art. 3º). A alíquota fica entre **2% (mínimo, art. 8º-A)** e **5% (máximo, art. 8º, II)**. **Confiança: Alta.**
- **[ASSESSORIA]** Regime tributário (Simples Nacional, anexo e "fator R", ou Lucro Presumido), CNAE e exportação de serviços (clientes no exterior) **não foram pesquisados** e devem ir ao contador.

### 7.2 NFS-e de padrão nacional

- **[OBRIGATÓRIO]** A LC 214/2025, art. 62, tornou obrigatória a adesão dos municípios ao **padrão nacional da NFS-e a partir de 01/01/2026**. O município deve permitir a emissão no ambiente nacional ou compartilhar os documentos com o Ambiente de Dados Nacional (ADN). Fonte: TCE-PR, https://www.tce.pr.gov.br/noticias/municipios-tem-ate-31-12-para-concluir-adesao-a-nfs-e-nacional-alerta-tce-pr.htm. **Confiança: Média** (fonte oficial secundária; o art. 62 não foi lido diretamente).
- **[OBRIGATÓRIO]** A partir de 2026, os documentos fiscais eletrônicos, **inclusive a NFS-e**, devem ser emitidos **com destaque de CBS e IBS**, conforme Notas Técnicas. Fonte: Comunicado conjunto CGIBS/RFB de 12/12/2025, https://www.cgibs.gov.br/comite-gestor-do-ibs-e-receita-federal-divulgam-orientacoes-sobre-a-entrada-em-vigor-da-cbs-e-do-ibs-em-1-de-janeiro-de-2026. **Confiança: Alta.**
- **[RECOMENDADO]** Automatizar a emissão de NFS-e por API (emissor nacional ou provedor homologado) a cada cobrança do lojista. **[ASSESSORIA – contador]** Confirmar o emissor do município da sede.

### 7.3 Reforma tributária (IBS/CBS)

Fonte: Receita Federal, *Entenda a Reforma Tributária do Consumo*, https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-tributaria-do-consumo/entenda. **Confiança: Alta.**

| Ano | O que acontece |
|---|---|
| **2026** | Ano-teste: CBS 0,9% e IBS 0,1%, compensáveis com PIS/Cofins. Contribuinte que cumpre as obrigações acessórias fica **dispensado de recolher**. |
| **2027–2028** | Cobrança da CBS; **extinção do PIS e da Cofins**; IPI zerado (exceto ZFM); Imposto Seletivo instituído. O IBS segue em alíquota reduzida. |
| **2029–2032** | Transição gradual de ICMS e ISS para o IBS (proporção IBS/ICMS-ISS: 10/90, 20/80, 30/70, 40/60). |
| **2033** | Vigência integral; **extinção do ICMS e do ISS**. |

- **[OBRIGATÓRIO] Plataformas digitais (LC 214/2025, art. 22):** plataformas digitais, "ainda que domiciliadas no exterior, são responsáveis pelo pagamento do IBS e da CBS" nas operações que intermediam. É plataforma digital quem atua **como intermediária entre fornecedores e adquirentes** e controla ao menos um elemento essencial: **cobrança, pagamento, definição de termos e condições ou entrega** (§1º). Sem controle de nenhum desses elementos, não há responsabilidade (§11). Prestadores apenas de pagamento autorizados pelo BCB, publicidade ou busca/comparação (sem cobrar com base nas vendas) ficam excluídos (§2º). Fonte: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm (redação com alterações da LC 227/2026). **Confiança: Média** (texto lido parcialmente, com redações sobrepostas).
- **Análise:** no MVP, a plataforma vende **o próprio serviço** ao lojista e não intermedeia a venda da mercadoria. Seria contribuinte normal de IBS/CBS sobre a própria receita. **Se** passar a cobrar do lojista em nome do fornecedor (licença do conteúdo do fornecedor, comissão sobre vendas ou repasse), pode virar "plataforma digital" responsável pelo tributo da operação intermediada. **[ASSESSORIA – advogado tributarista e contador]**
- **[ASSESSORIA]** O efeito da não cumulatividade (crédito para o lojista contribuinte do regime regular) pode virar argumento comercial de preço a partir de 2027.

### 7.4 Atenção à remuneração do fornecedor

Se a taxa paga pelo lojista for **dividida com o fornecedor**, mudam: o item do ISS (possível intermediação, 10.05), a base de cálculo (receita bruta total ou só a comissão), a responsabilidade do art. 22 da LC 214 e as regras de pagamento (seção 9). **[ASSESSORIA]**

---

## 8. Produtos restritos e regulamentados

### 8.1 Cosméticos e suplementos (Anvisa)

- **[OBRIGATÓRIO] Cosméticos, higiene e perfumes:** regularização pela **RDC 752/2022**. Exigem **registro** (art. 35): protetores solares, bronzeadores, antisséptico para mãos, alisantes, onduladores e tinturas capilares, repelentes e equivalentes infantis. Os demais seguem a regularização simplificada. A empresa precisa de licença sanitária local e de **AFE** para fabricar ou importar. Fonte: Anvisa, https://www.gov.br/anvisa/pt-br/acessoainformacao/perguntasfrequentes/cosmeticos/registro-de-cosmeticos (modificada em 20/01/2023). **Confiança: Média** (FAQ oficial; RDC não lida na íntegra).
- **[OBRIGATÓRIO] Suplementos alimentares:** marco regulatório da **RDC 243/2018** e da **IN 28/2018** (atualizada, entre outras, pela IN 336/2024). Regularização pela **RDC 843/2024 e IN 281/2024** (vigentes desde 01/09/2024): todos os suplementos devem ser **notificados** à Anvisa, e o rótulo traz "Alimento notificado na Anvisa: nº…". **Só podem ser usadas as alegações da lista positiva** da IN 28/2018. Alegação de tratar, curar ou prevenir doença caracteriza **medicamento**. Fonte: Anvisa, *Perguntas e Respostas – Suplementos Alimentares*, 9ª ed., 16/01/2025, https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/alimentos/perguntas-e-respostas-arquivos/suplementos-alimentares.pdf/@@display-file/file. **Confiança: Alta.**
- **[RECOMENDADO]** Nas categorias cosmético e suplemento, exigir do fornecedor o **número de notificação ou registro** e o CNPJ do titular. Bloquear termos terapêuticos ("cura", "trata", "emagrece", "anabolizante") nas descrições e exibir alerta ao lojista.

### 8.2 Eletrônicos com homologação Anatel

- **[OBRIGATÓRIO]** Produtos de telecomunicações (celulares, roteadores, rádios, dispositivos Bluetooth/Wi-Fi etc.) exigem certificação e homologação Anatel. A **Resolução Anatel nº 780, de 01/08/2025**, alterou o regulamento de conformidade e homologação e passou a prever que **plataformas de comércio eletrônico são solidariamente responsáveis** com o vendedor pela comercialização, pela informação do **código de homologação** e pela verificação de sua validade. Isso vale **mesmo para plataformas que só fazem anúncio e promoção**, com vigência dessa parte em 04/12/2025. Fontes: AGU, https://www.gov.br/agu/pt-br/comunicacao/noticias/agu-derruba-liminar-que-isentava-plataforma-de-responsabilidade-na-venda-de-produtos-irregulares e https://www.gov.br/agu/pt-br/comunicacao/noticias/trf3-mantem-obrigacao-da-amazon-de-informar-codigo-de-homologacao-da-anatel-1; detalhamento em Lefosse (escritório, fonte não oficial), https://lefosse.com/noticias/alerta/anatel-altera-regulamentacao-de-homologacao-de-produtos-para-telecomunicacoes-e-estabelece-novas-obrigacoes-para-data-centers-e-plataformas-de-marketplace/. **Confiança: Média.**
- **Contencioso:** o Mercado Livre obteve liminar contra os arts. 2º e 3º da resolução (Justiça Federal/SP, out/2025), mas o **TRF3 suspendeu essa liminar em 27/02/2026**. Também em 2026, o TRF3 manteve a obrigação da Amazon de informar o código de homologação nos anúncios. Mesmas fontes da AGU. **Confiança: Alta** (fatos); a constitucionalidade da norma segue em discussão.
- **[ASSESSORIA]** A plataforma de catálogo B2B se enquadra no conceito amplo de "plataforma" da Resolução 780? **[RECOMENDADO]** Por precaução: **campo obrigatório de código de homologação** em categorias de telecom, validação contra a base pública da Anatel quando possível, e envio do código ao anúncio do lojista.

### 8.3 Itens proibidos ou com venda restrita (lista mínima)

| Item | Regra | Fonte | Confiança |
|---|---|---|---|
| Cigarros eletrônicos (DEFs), refis e acessórios | Proibidos: fabricação, importação, **comercialização**, distribuição, armazenamento, transporte e **propaganda, inclusive pela internet** (RDC 855/2024, arts. 2º, VI, e 3º; vigência desde 02/05/2024) | https://www.gov.br/anvisa/en/rules-and-regulations/arquivos/rdc-855-2024.pdf | Alta |
| Medicamentos | Venda remota só por **farmácias e drogarias abertas ao público**, com farmacêutico e site próprio `.com.br`. **Medicamentos sujeitos a controle especial não podem ser vendidos por meio remoto** (RDC 44/2009) | SES-GO, *Perguntas e Respostas RDC 44/2009*, https://goias.gov.br/saude/wp-content/uploads/sites/34/2012/02/perguntas-e-respostas-rdc-44-de-2009-farmacias-e-drogarias-2a8.pdf | Média |
| Produtos com marca falsificada | Crime (Lei 9.279, arts. 189 e 190) | Seção 4.2 | Alta |
| Telecom sem homologação | Irregular (Resolução Anatel 780/2025) | Seção 8.2 | Média |
| Cosméticos e suplementos não regularizados | Irregulares (Anvisa) | Seção 8.1 | Média/Alta |

- **[RECOMENDADO]** Também bloquear, por política, itens que **não foram pesquisados nesta rodada** mas são sabidamente sensíveis: armas, munições e simulacros; fogos; agrotóxicos; animais e produtos da fauna; produtos de tabaco; bebidas alcoólicas (exigir maioridade); produtos com certificação Inmetro compulsória (brinquedos, eletroportáteis, capacetes); produtos médicos (Anvisa). **[ASSESSORIA]** para a lista final. **Confiança: Baixa** (não verificado individualmente).

---

## 9. Pagamentos: receber e repassar

### 9.1 Marco legal

- **[OBRIGATÓRIO]** Lei 12.865/2013. Uma **instituição de pagamento** é quem, aderindo a arranjos de pagamento, **gere conta de pagamento**, **executa ou facilita instrução de pagamento**, **credencia a aceitação** de instrumento de pagamento ou **executa remessa de fundos** (art. 6º, III). Compete ao BCB autorizar e supervisionar (art. 9º). Os recursos em conta de pagamento são **patrimônio separado**, que não se confunde com o da instituição (art. 12). Fonte: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12865.htm. **Confiança: Alta.**
- **[OBRIGATÓRIO]** **Resolução BCB nº 522/2025** (DOU de 12/11/2025), que altera o regulamento de arranjos (Resolução BCB 150/2021). O **subcredenciador** é o participante que habilita "exclusivamente, usuário final recebedor" a aceitar instrumentos de pagamento. A **participação dos subcredenciadores na liquidação centralizada passa a ser obrigatória**, inclusive como pagadores, independentemente de volume. Os instituidores de arranjo tiveram 180 dias para se adequar (até cerca de maio de 2026) e devem **suspender a captura** de subcredenciadores não aptos. Fontes: DOU, https://pesquisa.in.gov.br/imprensa/servlet/INPDFViewer?jornal=515&pagina=76&data=12%2F11%2F2025&captchafield=firstAccess; resumos em LegisWeb (https://www.legisweb.com.br/legislacao/?id=486238) e Barcellos Tucunduva (https://barcellostucunduva.com.br/2025/11/13/bcb-publica-nova-regra-sobre-arranjos-de-pagamento/). **Confiança: Média** (resumos não oficiais do texto publicado).
- **Não verificado:** os limites de volume abaixo dos quais uma instituição de pagamento pode operar sem autorização do BCB (Resolução BCB 80/2021). **[ASSESSORIA]** **Confiança: Baixa.**

### 9.2 Por que não ativar repasses sem PSP adequado

**[RECOMENDADO forte, com base nos riscos OBRIGATÓRIOS acima]:**

1. **Risco regulatório:** receber na conta da empresa o dinheiro do lojista que pertence ao fornecedor, e depois repassá-lo, pode caracterizar atividade de **instituição de pagamento** ("executar ou facilitar instrução de pagamento", "remessa de fundos") ou de **subcredenciador**, sujeita ao BCB e à liquidação centralizada. **[ASSESSORIA]**
2. **Risco patrimonial:** sem conta de pagamento regulada, o dinheiro de terceiros fica misturado ao patrimônio da empresa. O patrimônio separado do art. 12 da Lei 12.865 só existe dentro de uma instituição de pagamento.
3. **Risco tributário:** o valor bruto que transita pode ser tratado como receita própria (ISS, Simples, PIS/Cofins e IBS/CBS), além do risco do art. 22 da LC 214/2025 ("controle do pagamento" torna a empresa plataforma digital responsável).
4. **Risco de prevenção à lavagem e de chargebacks:** a empresa absorve estornos e fraudes sem a infraestrutura de um PSP (ver REsp 2.020.811 sobre disputas de chargeback).

**Arquitetura recomendada:**
- **MVP:** cobrar **apenas a taxa da própria plataforma** do lojista, via PSP (cartão, Pix, boleto), com NFS-e. Não intermediar o pagamento da mercadoria.
- Se houver remuneração de fornecedores: usar **split nativo de um PSP autorizado pelo BCB** (cada fornecedor com subconta ou recebedor cadastrado no PSP, com KYC feito pelo PSP), de modo que o valor do fornecedor **nunca transite** pela conta da empresa.
- **[ASSESSORIA]** Confirmar com o PSP e o advogado: (i) o PSP é autorizado pelo BCB e participa da liquidação centralizada; (ii) o contrato deixa claro que a plataforma **não** é subcredenciadora; (iii) os documentos fiscais saem em nome de quem é dono de cada receita.

---

## 10. Exterior (resumo curto)

### 10.1 União Europeia: IVA de serviços digitais

- **B2B (lojistas com número de IVA):** o local da prestação é onde o **cliente está estabelecido** (Diretiva 2006/112, art. 44). Fonte: https://taxation-customs.ec.europa.eu/taxation/vat/vat-directive/place-taxation_en. O **cliente é o devedor do IVA** (*reverse charge*, art. 196) quando o fornecedor não está estabelecido no país do cliente. Fonte: https://taxation-customs.ec.europa.eu/taxation/vat/vat-directive/persons-liable-vat_en. **Confiança: Alta.**
- **B2C (consumidores, não sujeitos passivos):** serviços eletrônicos são tributados onde o **cliente reside** (art. 58). O fornecedor de fora da UE pode declarar pelo **OSS, regime não-União**, que cobre "supplies of services to non-taxable persons", com registro em um único Estado-membro. Fonte: https://vat-one-stop-shop.ec.europa.eu/one-stop-shop_en. **Confiança: Alta.**
- **Conclusão para o modelo:** como o cliente é empresa, a regra é **reverse charge** e, em princípio, **não é preciso** registro de IVA nem OSS. **[RECOMENDADO]** Coletar e validar o número de IVA (VIES) e incluir na fatura a menção ao *reverse charge*. Se aceitar clientes sem número de IVA (pessoa física ou microempresa não registrada), eles podem ser tratados como B2C, e aí o OSS não-União entra em cena. **[ASSESSORIA – contador internacional]**

### 10.2 Estados Unidos: sales tax sobre SaaS

- **Nexo econômico:** desde *South Dakota v. Wayfair* (Suprema Corte dos EUA, 2018), os estados podem exigir sales tax de vendedores remotos sem presença física, com base em limites de vendas ou de transações que **variam por estado**. Fonte primária não carregada nesta rodada (supremecourt.gov retornou erro). **Confiança: Média.**
- **A tributação de SaaS varia por estado.** Exemplo, Texas: "data processing" é tributável ("Entering, storing, manipulating, or retrieving a customer's data is taxable"; 6,25% estadual mais local), com regras de rateio por local de uso. Fonte: https://comptroller.texas.gov/taxes/publications/94-127.php. Em **30/09/2026**, o Comptroller do Texas determinou propor emenda à Regra 3.330 para **excluir taxas de marketplaces e plataformas** do conceito de data processing (proposta ainda **não final**). Fonte: https://comptroller.texas.gov/about/media-center/news/20260930-comptroller-don-huffines-ends-hidden-double-tax-on-texas-families-and-small-businesses-1790708719803. **Confiança: Alta** (fonte oficial), mas a regra está em mudança.
- **[RECOMENDADO]** Antes de vender nos EUA: mapear os estados com nexo econômico, classificar o serviço por estado (SaaS, data processing ou isento), usar motor de cálculo de impostos e acompanhar os limites por estado. **[ASSESSORIA – contador nos EUA]**

### 10.3 América Latina

Não pesquisada nesta rodada. Vários países tributam serviços digitais prestados por não residentes, mas nenhum foi verificado aqui. **[ASSESSORIA]**

---

## 11. Checklist de pendências

### 11.1 Para o advogado

- [ ] Confirmar os **papéis LGPD** (controlador × operador) por tipo de dado e redigir o **DPA** para lojistas (seção 2.1).
- [ ] Verificar se a empresa se enquadra como **agente de pequeno porte** e se algum tratamento é de **alto risco** (Resolução ANPD 2/2022, art. 3º). Decidir sobre indicar encarregado.
- [ ] Rever contratos de nuvem e suboperadores: **cláusulas-padrão da ANPD** (Resolução 19/2024) para transferências aos EUA.
- [ ] Redigir **contrato de fornecedor** com a licença de conteúdo da seção 4.3 (mundial, sublicenciável, modalidades expressas, crédito do fotógrafo, indenização).
- [ ] Redigir **termos de uso**, **política de privacidade** e **política de conteúdo e produtos proibidos** (seção 6).
- [ ] Avaliar a aplicabilidade da **tese do STF (Temas 987 e 533)** e dos deveres de autorregulação, canais e transparência à plataforma B2B.
- [ ] Avaliar o risco de aplicação do **CDC** na relação com lojistas MEI ou pessoa física e a validade das limitações de responsabilidade.
- [ ] Avaliar se a plataforma é "plataforma" para fins da **Resolução Anatel 780/2025** e acompanhar o contencioso (TRF3 e STJ).
- [ ] Validar a **lista final de produtos proibidos e restritos** (Anvisa, Anatel, Inmetro, armas, fauna, tabaco, álcool).
- [ ] **Pagamentos:** confirmar que o modelo com split via PSP não torna a empresa instituição de pagamento ou subcredenciadora; verificar os limites da Resolução BCB 80/2021 e o efeito da Resolução BCB 522/2025.
- [ ] Registrar a **marca da plataforma** no INPI e fazer busca de anterioridade nos mercados-alvo.
- [ ] Antes da UE: confirmar a aplicação do **GDPR art. 3(2)**, contratar **representante (art. 27)** e definir o mecanismo de transferência para suboperadores (as SCCs não servem para importador já sujeito ao art. 3).
- [ ] Definir lei aplicável e foro nos contratos internacionais.

### 11.2 Para o contador

- [ ] Definir o **item da LC 116/2003** (1.03, 1.05 ou 1.09; 10.05 se houver intermediação) com base na lista do **município da sede**, e a alíquota de ISS (2% a 5%).
- [ ] Escolher regime tributário e CNAE (Simples Nacional, anexo e fator R, ou Lucro Presumido).
- [ ] Configurar a emissão de **NFS-e de padrão nacional**, com destaque de **IBS/CBS** em 2026 (dispensa de recolhimento condicionada às obrigações acessórias).
- [ ] Planejar 2027: entrada da **CBS**, extinção do PIS/Cofins, créditos para clientes e precificação.
- [ ] Avaliar o **art. 22 da LC 214/2025** se a plataforma passar a cobrar em nome de fornecedores ou a repassar valores.
- [ ] Definir o tratamento contábil e fiscal de eventuais repasses a fornecedores (receita bruta × comissão).
- [ ] Verificar o tratamento de **exportação de serviços** (ISS, PIS/Cofins, IBS/CBS) para clientes no exterior.
- [ ] **UE:** confirmar o *reverse charge* B2B, a validação VIES, os dizeres na fatura e se haverá clientes B2C (OSS não-União).
- [ ] **EUA:** estudo de nexo econômico por estado e classificação do SaaS (com atenção ao Texas, cuja regra está em mudança).
- [ ] **América Latina:** levantamento de IVA sobre serviços digitais de não residentes por país-alvo.

---

## 12. Fontes consultadas (todas em 2026-10-27)

**Legislação brasileira (Planalto):**
- LGPD, Lei 13.709/2018: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- Lei de Direitos Autorais, Lei 9.610/1998: https://www.planalto.gov.br/ccivil_03/leis/l9610.htm
- Lei da Propriedade Industrial, Lei 9.279/1996: https://www.planalto.gov.br/ccivil_03/leis/l9279.htm
- Marco Civil da Internet, Lei 12.965/2014: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm
- CDC, Lei 8.078/1990 (compilado): https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm
- Decreto 7.962/2013 (comércio eletrônico): https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm
- LC 116/2003 (ISS): https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm
- LC 214/2025 (IBS/CBS): https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm
- Lei 12.865/2013 (arranjos e instituições de pagamento): https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12865.htm

**ANPD:**
- Comunicação de incidente (Resolução 15/2024): https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis
- Resolução CD/ANPD nº 2/2022: https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022
- Transferência internacional (Resolução 19/2024 e Resolução 32/2026): https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados
- Guia de agentes de tratamento: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-agentes-de-tratamento-e-encarregado-versao-1-0-defeso-eleitoral.pdf/@@display-file/file

**Judiciário:**
- STF, art. 19 do MCI (notícia): https://noticias.stf.jus.br/postsnoticias/stf-define-parametros-para-responsabilizacao-de-plataformas-por-conteudos-de-terceiros/
- STF, Informação à Sociedade (Temas 987 e 533): https://www.stf.jus.br/arquivo/cms/noticiaNoticiaStf/anexo/Informac807a771oa768SociedadeArt19MCI_vRev.pdf
- STJ, consumidor pessoa jurídica (2024): https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/2024/08092024-Consumidor-pessoa-juridica-quando-as-empresas-podem-ter-a-protecao-do-CDC.aspx
- STJ, REsp 2.020.811 (2023): https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/2023/21032023-Falta-de-prova-de-vulnerabilidade-impede-aplicacao-do-CDC-em-contrato-de-gestao-de-pagamentos-on-line.aspx

**Tributação (Brasil):**
- Receita Federal, cronograma da reforma: https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-tributaria-do-consumo/entenda
- CGIBS/RFB, orientações 2026: https://www.cgibs.gov.br/comite-gestor-do-ibs-e-receita-federal-divulgam-orientacoes-sobre-a-entrada-em-vigor-da-cbs-e-do-ibs-em-1-de-janeiro-de-2026
- TCE-PR, NFS-e nacional: https://www.tce.pr.gov.br/noticias/municipios-tem-ate-31-12-para-concluir-adesao-a-nfs-e-nacional-alerta-tce-pr.htm

**Pagamentos:**
- DOU, Resolução BCB 522/2025: https://pesquisa.in.gov.br/imprensa/servlet/INPDFViewer?jornal=515&pagina=76&data=12%2F11%2F2025&captchafield=firstAccess
- LegisWeb (texto consolidado, não oficial): https://www.legisweb.com.br/legislacao/?id=486238
- Barcellos Tucunduva (análise, não oficial): https://barcellostucunduva.com.br/2025/11/13/bcb-publica-nova-regra-sobre-arranjos-de-pagamento/

**Anvisa e Anatel:**
- Anvisa, registro de cosméticos: https://www.gov.br/anvisa/pt-br/acessoainformacao/perguntasfrequentes/cosmeticos/registro-de-cosmeticos
- Anvisa, P&R Suplementos (9ª ed., 2025): https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/alimentos/perguntas-e-respostas-arquivos/suplementos-alimentares.pdf/@@display-file/file
- Anvisa, RDC 855/2024 (EN): https://www.gov.br/anvisa/en/rules-and-regulations/arquivos/rdc-855-2024.pdf
- Anvisa, cigarro eletrônico: https://www.gov.br/anvisa/pt-br/assuntos/tabaco/danos-a-saude/cigarro-eletronico
- SES-GO, P&R RDC 44/2009: https://goias.gov.br/saude/wp-content/uploads/sites/34/2012/02/perguntas-e-respostas-rdc-44-de-2009-farmacias-e-drogarias-2a8.pdf
- AGU, Resolução Anatel 780 e Mercado Livre: https://www.gov.br/agu/pt-br/comunicacao/noticias/agu-derruba-liminar-que-isentava-plataforma-de-responsabilidade-na-venda-de-produtos-irregulares
- AGU, Amazon e código de homologação: https://www.gov.br/agu/pt-br/comunicacao/noticias/trf3-mantem-obrigacao-da-amazon-de-informar-codigo-de-homologacao-da-anatel-1
- Lefosse (análise, não oficial): https://lefosse.com/noticias/alerta/anatel-altera-regulamentacao-de-homologacao-de-produtos-para-telecomunicacoes-e-estabelece-novas-obrigacoes-para-data-centers-e-plataformas-de-marketplace/
- DPL News (liminar Mercado Livre, não oficial): https://dplnews.com/?p=294346

**UE:**
- EDPB, Diretrizes 3/2018 (PT): https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_3_2018_territorial_scope_pt.pdf
- Comissão Europeia, sanções: https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/enforcement-and-sanctions/sanctions/what-if-my-companyorganisation-fails-comply-data-protection-rules_en
- Comissão Europeia, decisões de adequação: https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en
- Decisão de Execução (UE) 2026/179 (Brasil): https://eur-lex.europa.eu/eli/dec_impl/2026/179/oj/eng
- Comissão Europeia, comunicado IP/26/229: https://ec.europa.eu/commission/presscorner/detail/en/ip_26_229
- Comissão Europeia, Q&A sobre SCCs: https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/new-standard-contractual-clauses-questions-and-answers-overview_en
- EDPB, Guidelines 9/2022 (violação de dados): https://www.edpb.europa.eu/system/files/2023-04/edpb_guidelines_202209_personal_data_breach_notification_v2.0_en.pdf
- IVA, local de tributação: https://taxation-customs.ec.europa.eu/taxation/vat/vat-directive/place-taxation_en
- IVA, devedor do imposto: https://taxation-customs.ec.europa.eu/taxation/vat/vat-directive/persons-liable-vat_en
- OSS: https://vat-one-stop-shop.ec.europa.eu/one-stop-shop_en

**EUA:**
- Texas Comptroller, data processing: https://comptroller.texas.gov/taxes/publications/94-127.php
- Texas Comptroller, ordem executiva de 30/09/2026: https://comptroller.texas.gov/about/media-center/news/20260930-comptroller-don-huffines-ends-hidden-double-tax-on-texas-families-and-small-businesses-1790708719803

**Plataformas de e-commerce:**
- Nuvemshop, webhooks (inclui LGPD): https://tiendanube.github.io/api-documentation/resources/webhook
- Shopify, conformidade com leis de privacidade: https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance
