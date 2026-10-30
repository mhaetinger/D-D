# Regras de 2014: cobertura e roteiro

Auditoria inicial em **19/10/2026**, implementações até **30/10/2026** e novo
check-up em **23/10/2026**. Este é o registro único de progresso das mecânicas.
Para branch, publicação e validações externas, consulte [RETOMADA.md](RETOMADA.md).
Contratos técnicos ficam em [ARQUITETURA.md](ARQUITETURA.md); entregas/testes
históricos, no [CHANGELOG.md](../CHANGELOG.md).

**A versão publicada não automatiza integralmente o livro.** Consulta, escolha
cadastrada e contador de usos não significam efeito aplicado. As matrizes abaixo
registram os limites das implementações. A entrega de 22/10/2026 reúne R1
(PR #17), o primeiro recorte de R2 (PR #18) e o talento Sortudo (PR #19),
com publicação pela PR #20. Estado da publicação em RETOMADA.md.

## Escopo desta entrega e interação entre fichas

Em 23/10/2026 o responsável autorizou concluir a entrega já implementada da
PR #21, conferindo regressões. O código em `3290de6` passou na CI completa:
474 testes Node, banco, build e 36 roteiros de navegador. Nesta conferência,
o diagnóstico puro repetiu 3.321 verificações sem divergências. A entrega reúne
A01–A14, sopro e –5/+10; não acrescenta outra família de automação.

O restante das matrizes descreve possibilidades de evolução da ficha individual.
Resolução manual da mesa pode permanecer manual; uma linha parcial não bloqueia
uma publicação nem significa necessariamente um defeito. A automação integral
do livro não é o critério para poder usar esta versão.

Interação entre fichas (alvos, dano/cura/efeitos compartilhados e mestre) fica
para outra etapa. Os módulos e a guarda de interface são reaproveitáveis;
a autorização no servidor e os contratos entre participantes ainda precisarão
ser implementados. Nenhuma chamada automática ou nova estrutura de nuvem faz
parte desta entrega. Estado da publicação e próxima ação em
[RETOMADA.md](RETOMADA.md).

## Auditoria independente de oito curas — 23/10/2026

Relatório do Claude compartilhado pelo responsável, base pública `d6258cb`.
Foram conferidas Curar Ferimentos, Palavra Curativa, Oração Curativa, Palavra
Curativa em Massa, Curar Ferimentos em Massa, Cura Completa, Cura Completa em
Massa e Bom Fruto. Os dois achados abaixo foram reproduzidos pelo agente de
integração; o patch proposto foi revisado e ampliado com compatibilidade de
fichas antigas. Os artefatos temporários não são outro roteiro permanente.

| Achado | Fonte e comportamento anterior | Correção e limite |
| --- | --- | --- |
| C1 · P2 · curas fixas | Livro local p. 236 / PDF 234: Cura Completa cura 70 PV, +10/círculo acima do 6º; Em Massa distribui até 700 PV. Apareciam como Utilidade/Instantânea | Entradas explícitas e resumo com Discípulo da Vida (p. 70 / PDF 69), mantendo distribuição/efeitos na mesa, sem fórmula ou RNG. Tipo antigo Utilidade corrigido só na apresentação automática, sem regravar a magia |
| C2 · P2 · Gêmea | Magia Duplicada exige criatura-alvo (livro p. 80 / PDF 79); Bom Fruto cria objetos (p. 224 / PDF 222), mas oferecia o botão e permitiria gastar feitiçaria indevida | Excluído dos efeitos elegíveis, inclusive quando a ficha antiga salva canTwin=true. Curar Ferimentos e Cura Completa permanecem elegíveis; fórmulas próprias conservam seu contrato |

A conferência primária complementar de Gêmea está no
[Sage Advice Compendium v2.7, p. 6](https://media.wizards.com/2020/dnd/downloads/SA-Compendium.pdf#page=6).
O bônus da Vida em Bom Fruto é esclarecido na
[p. 18 do mesmo compêndio](https://media.wizards.com/2020/dnd/downloads/SA-Compendium.pdf#page=18);
seu controle/informação e a reserva de frutos permanecem uma melhoria opcional,
sem prometer automação hoje. Indicar cada alvo nas outras curas também é opcional.
A distribuição de PV e a aplicação de condições em outras fichas ficam na mesa.

Verificados na integração: 478 testes Node, tipos/build e dois roteiros Chromium
(curas auditadas e ajudas), incluindo estado antigo salvo, consulta, slots,
Gêmea sem custo indevido, valores fixos sem RNG, pool/HP/notas/outra ficha
preservados, fonte GG/320px/temas/layouts e recarga offline sob `/D-D/`.
Sem alterações em SQL, dados pessoais, importação ou sincronização. Nova suíte
completa: 37 roteiros de navegador. Estado de publicação em RETOMADA.md.

## Como ler e atualizar o estado

- **Calculado/controle existente:** operação implementada no escopo descrito;
  não certifica todas as interações da característica.
- **Parcial/pendente:** falta aplicar um efeito ou integrá-lo à operação atual.
  Bônus ausente nos totais tem prioridade sobre novos auxiliares de consulta.
- **Mesa:** contexto ou decisão que o jogador/Mestre deve informar. Isso pode
  permanecer manual sem virar um defeito ou um novo campo obrigatório.
- **A revisar:** cobertura ainda insuficiente para afirmar completude. As matrizes
  são um levantamento de exemplos; não certificam cada efeito não mencionado.

Ao implementar um recorte, registre aqui regra/fonte, condição de elegibilidade,
cálculo afetado, limite restante, teste e commit/PR. Atualize a linha da matriz
correspondente e o changelog na mesma entrega. Só conclua uma etapa depois de
conferir seus critérios; marcar um item parcial não conclui a família inteira.
Use fichas sintéticas e preserve fórmulas manuais, dados, notas e escolhas antigas.

## Check-up profundo de 23/10/2026

**Resultado da base publicada em 22/10: 14 grupos de divergências confirmadas.**
O primeiro commit desta rodada registrou somente o diagnóstico. Após autorização
do responsável para corrigir, A01–A14 foram implementados na mesma branch; a
validação e os limites ficam abaixo. Fichas reais, dado flutuante e serviço remoto
foram preservados. A aplicação não recebe um selo de conformidade integral.

Base: entrega publicada `beed393` / `develop` `8ce0c0d`, com o mesmo conteúdo
executável e revisão offline `8c517c3c837af0c0`. O exemplar local de 314 páginas
continua sendo a fonte principal, com Patrulheiro Revisado e as adaptações já
registradas. Páginas abaixo são **do PDF**, não da numeração impressa.
O Livro do Mestre permanece consulta de 322 páginas: esta rodada não homologa
cargas/sintonização de todos os itens mágicos nem ativa suas regras opcionais.

### O que foi cruzado

- Reextração isolada do PDF em pasta temporária: magias, equipamento e
  referências ficaram idênticos byte a byte aos três catálogos existentes.
  Isso confirma a origem/reprodutibilidade, inclusive dos problemas herdados
  da fonte; não certifica cada interpretação feita pelo motor.
- 12 classes / 41 subclasses nos níveis 1–20: **820 estados** de progressão;
  espaços comparados à tabela de 2014 e às progressões próprias de classes
  únicas. **593 verificações de limites/regimes de recuperação**, **589 ciclos
  de gasto e descanso curto/longo** nas reservas finitas, **60 verificações de
  limites/círculos de Pacto** e **60 ciclos de sua recuperação** sem divergências
  nos contratos verificados. Não simula todas as ações de cada característica
  em combate.
- 368 ocorrências de características de classe/subclasse, com **693 consultas
  contextualizadas** por repetir características-base nas subclasses; 66 traços
  nas opções raciais, 13 antecedentes, 42 talentos, 361 magias e 1.073 referências
  (958 cabeçalhos + 115 parágrafos raciais). Presença de texto e metadados passou;
  a fidelidade semântica foi conferida nos casos reproduzidos abaixo.
- Diagnóstico puro: **3.321 verificações, 24 casos divergentes**, agrupados em
  A01–A12. A repetição de tabelas/presença não é percentual de cobertura do livro.
  Diagnóstico de interface: **15 casos, 11 divergentes**, incluindo A13/A14 e
  reproduções de achados do motor. Os totais não devem ser somados como se
  fossem problemas distintos.
- Nesta rodada passaram **433 testes Node, tipos/build e três roteiros
  Chromium existentes**: cenários auditados anteriores (32 cenários), ajudas e
  consulta de características. O novo diagnóstico em Chromium usou `/D-D/`,
  rede externa bloqueada, dados fictícios e captura em 390px/GG; não gerou erros
  JavaScript. A suíte completa de 32 roteiros aprovada na publicação anterior
  não foi repetida inteira nesta auditoria. Não houve SQL/RLS/RPC.

### Correções de 23/10/2026

**A01–A14 implementados e validados na entrega da PR #21.** A tabela da
seção seguinte preserva as reproduções da base publicada, para rastrear os erros.

- **A01/A02/A06:** digitação e botões compartilham o ajuste retroativo de CON,
  conservando dano sofrido, totais manuais e 0 PV; druida reconhece os nomes do
  catálogo; Atletismo Extraordinário aplica metade arredondada para cima nos
  testes físicos sem treino, sem acumular Versatilidade ou modificar resistências.
- **A03–A05:** componentes simultâneos separados em Chuva de Meteoros, Coluna de
  Chamas, Tempestade de Gelo e Onda Destrutiva; aumentos próprios de Raio de Bruxa,
  Lâmina Flamejante e Arma Espiritual; modificador de conjuração e Evocação
  Potencializada. Fórmula própria continua tendo precedência. Tipos variáveis e
  dados adicionais à escolha ficam identificados para resolução na mesa.
- **A07/A12:** Duplicidade e Presença Dracônica compartilham concentração,
  confirmação antes do custo, fila de dano e encerramento. Descansos não
  dissipam Asas de Dragão. Características de concentração encerradas também
  perdem o estado ativo, sem conceder usos de volta.
- **A08/A10/A11:** imagens/mão dos três casos deixam de oferecer Gêmea;
  Zona da Verdade termina antes do apêndice; a linha explícita de Raio Solar
  tem precedência sobre a iluminação descrita. Fichas anteriores usam o
  indicativo corrigido sem apagar os campos salvos/adaptações.
- **A09:** correção editorial explícita no extrator de **5d5 para 5d6** no
  componente trovejante de Onda Destrutiva (Destructive Wave, PHB 2014, p. 231).
  O catálogo e a consulta informam a divergência com o exemplar local; não se
  apresenta como errata oficial da tradução. O PDF permanece intacto. Apenas
  Onda Destrutiva e Zona da Verdade mudaram no catálogo de 361 magias; as outras
  359 entradas e os catálogos de equipamento/referências foram preservados.
- **A13/A14:** Retomar o Fôlego, cura da Lua, Presságio inicial/no descanso e
  Intervenção usam escolha físico/virtual e validação antes do gasto. No nível
  20, Intervenção tem sucesso sem sortear d100. Novos sucessos aguardam sete dias
  **na aventura**, com confirmação explícita da semana; descansos não liberam.
  Bloqueios antigos ficam legíveis e podem usar a mesma confirmação, preservando
  compatibilidade com o prazo anteriormente gravado.

Passaram **448 testes Node, tipos/build, 3.321 verificações puras sem
divergências e 32 casos de interface sem divergências**. Os casos de interface
incluem subtotais de dano por tipo usando as mesmas faces roladas, testes
diretos de atributos nos dois layouts, dados físicos/virtuais, Presságio no
descanso, cancelamento e 390px/GG. A suíte completa de **33 roteiros Chromium**
passou. Após o último ajuste de compatibilidade/validação, repetidos Node/build
e os cinco roteiros pertinentes (passivos, rolagens condicionais, concentração,
PV e os 32 casos desta correção), todos aprovados. Reextração isolada reproduziu
os três catálogos corrigidos byte a byte. Naquela validação não houve alteração SQL/RLS/RPC nem
publicação; a produção ainda era a entrega de 22/10. As publicações posteriores
e o estado atual ficam em RETOMADA.md.

Regressões em `tests/audit-corrections.test.ts` e
`tests/audit-corrections-browser.cjs`, este último encadeado em `test:browser`.
Os diagnósticos anteriores continuam disponíveis e passam a refletir a versão
corrigida; evidências originais ficam no histórico Git/artefatos locais, sem
transformar resultados errados em expectativas aceitas.

### Divergências e ordem de correção

P1: cálculo, gasto ou restrição que pode mudar o resultado do jogo. P2:
consulta/indicação ou duração que precisa ser corrigida, mantendo o contexto
manual da mesa. As reproduções se referem ao diagnóstico original; A01–A14 têm
correções nesta branch. Os IDs são a fila desta revisão, dentro deste documento.

| ID / prioridade | Livro e comportamento esperado | Reproduzido na aplicação | Estado da correção nesta branch |
| --- | --- | --- | --- |
| A01 · P1 | CON permanente muda os PV retroativamente, PDF 178 | Guerreiro 5, CON 14 → 16: digitar mantém 44 PV máximos; os botões +/− chegam corretamente a 49. A mesma alteração percorre contratos diferentes | **Corrigido:** `sheet-edit/model.ts` e `rules/combat.ts` compartilham ajuste retroativo e preservação do déficit. |
| A02 · P1 | Proficiências do druida, PDF 71; nomes das armas na tabela, PDF 150 | Druida criado pelo assistente fica sem proficiência automática com **Foice Curta** e **Porrete**. Texto de classe usa foices/clavas; detecção de combate não resolve os nomes do catálogo. Sem o texto de proficiências, Maça também falha | **Corrigido:** `rules/combat.ts` reconhece os dez nomes do catálogo na lista do druida; ajuste explícito continua soberano. |
| A03 · P1 | Componentes simultâneos de dano, PDFs 225, 226, 285 | **Chuva de Meteoros**: 20d6 fogo + 20d6 concussão vira só 20d6; **Coluna de Chamas**: 4d6 fogo + 4d6 radiante vira só 4d6; **Tempestade de Gelo**: 2d8 concussão + 4d6 frio vira só 2d8. Prévia e rolagem herdam o primeiro componente | **Corrigido nos casos citados:** metadados/resolvedor mantêm componentes e tipos; resultado mostra subtotais das mesmas faces, sem nova rolagem. |
| A04 · P1 | Escalonamento específico, PDFs 218, 251–252, 271 | **Raio de Bruxa** no 3º círculo mantém 1d12 no dano inicial, em vez de 3d12. **Lâmina Flamejante** no 3º/4º mostra 4d6/5d6, em vez de 3d6/4d6. **Arma Espiritual** no 3º/4º mostra 2d8/3d8, em vez de 1d8/2d8, antes do modificador. O algoritmo não distingue dano inicial nem aumentos a cada dois círculos | **Corrigido nos casos citados:** escalonamento inicial e passos de dois círculos, com regressões até o 9º. |
| A05 · P1 | Modificadores de dano, PDFs 99 e 218 | **Evocação Potencializada**, mago 10/INT 16: Bola de Fogo sai 8d6 em vez de 8d6+3. **Arma Espiritual**, SAB 16: sai 1d8 em vez de 1d8+3 | **Corrigido nos casos citados:** modificador da origem em Arma Espiritual e INT em uma rolagem reconhecida de Evocação; fórmulas próprias preservadas. |
| A06 · P1 | **Atletismo Extraordinário** arredonda metade da proficiência para cima, PDF 84 | Campeão 7/DES 14: iniciativa sai +3 em vez de +4. Acrobacia sem proficiência sai +2 em vez de +4. A iniciativa usa o arredondamento de Versatilidade e a perícia ignora o benefício | **Corrigido:** `untrainedAbilityBonus` atende iniciativa, perícias e testes diretos dos dois layouts; não acumula com Versatilidade/treino. |
| A07 · P1 | **Invocar Duplicidade** e **Presença Dracônica** exigem concentração como uma magia, PDFs 67 e 80 | Ativar mantém Bênção/Voo em concentração e deixa o recurso ativo em paralelo. O custo é descontado, mas a característica não participa da troca, dos testes e do encerramento da concentração | **Corrigido:** vínculo `resourceId` na concentração v1, confirmação antes do custo e encerramento sincronizado. |
| A08 · P1 | Magia Duplicada/Gêmea exige uma magia que tenha uma criatura como alvo elegível, PDF 79; descrições em 248, 250, 255 | **Ilusão Menor**, **Imagem Silenciosa** e **Mãos Mágicas** recebem elegibilidade; Ilusão Menor mostra efetivamente o botão Gêmea. Criar som/imagem/mão não satisfaz essa condição | **Corrigido:** os três efeitos não oferecem Gêmea; a adaptação identificada de Mísseis permanece. |
| A09 · P1 · fonte | **Onda Destrutiva**, PDF 264 | O próprio PDF, conferido visualmente, imprime **5d5** trovejante, além do componente radiante/necrótico. A extração preserva 5d5 e a fórmula do motor é inválida para o rolador. Conjurar recusa o lançamento, inclusive em OFF, sem gastar o espaço | **Corrigido editorialmente:** extrator registra `sourceNote`, substitui somente o erro 5d5 → 5d6 e preserva o PDF; consulta mostra a divergência. |
| A10 · P2 | Descrição de **Zona da Verdade** termina antes do apêndice, PDFs 288–289 | O extrator continua a última magia na página de condições. O livrinho/balão inclui **APÊNDICE A: CONDIÇÕES** e regras alheias à magia | **Corrigido:** extrator termina antes do apêndice; outras 359 entradas preservadas, com A09 como segunda alteração explícita. |
| A11 · P2 | **Raio Solar** cria uma linha de 18 m, PDF 273 | O metadado indica esfera, escolhido pelo raio de iluminação mencionado depois no texto. A área do efeito e a área da luz foram confundidas | **Corrigido:** geometria explícita prevalece no metadado e na apresentação de registros antigos não personalizados. |
| A12 · P2 | **Asas de Dragão** duram até dissipar por ação bônus, PDF 80 | O descanso curto desativa as asas automaticamente. A limpeza comum apaga um estado sem esse término previsto | **Corrigido:** descanso curto/longo preserva as asas até recolher; não recupera usos ou efeitos encerrados. |
| A13 · P1 · contrato de uso | OFF registra dados físicos, conforme o contrato do projeto no README | **Retomar o Fôlego** em OFF chama `Math.random`, gasta o uso e cura imediatamente: no teste, 10 → 16 PV, sem perguntar a face física. Intervenção, Presságio e cura da forma também merecem revisar o caminho interno de dados; não foram todos reproduzidos nesta rodada | **Corrigido:** escolha físico/virtual existente em Retomar, cura da Lua, Presságio inicial/no descanso e Intervenção; validação antes do custo. |
| A14 · P1 · tempo de jogo | Após sucesso em **Intervenção Divina**, esperar sete dias, PDF 65 | O botão grava `Date.now() + 7 dias` e a disponibilidade depende do relógio real. Não há ação para registrar que a semana transcorreu na aventura; o bloqueio não acompanha o tempo ficcional da mesa | **Corrigido:** novos sucessos aguardam confirmação da semana ficcional; prazo legado preservado e aceito pela mesma ação. |

As verificações A03 e A04 conferem os casos citados, não todas as famílias de
magia. Fome de Hadar tem momentos diferentes para frio/ácido; Escudo de Fogo
tem alternativas; Rajada/Muralha Prismática têm resultados por cor; Tempestade
da Vingança tem fases. A busca pelo primeiro dado também é insuficiente nesses
casos, mas somar todos os dados do texto não seria uma correção válida.
Sono e Regeneração não têm fórmula automática completa no fluxo atual.
Evocação Potencializada em Mísseis Mágicos também permanece em R5: a composição
legada agrega dados por míssil, enquanto a regra específica de uma rolagem
compartilhada exige revisão própria. A05 fecha Bola de Fogo/Arma Espiritual e
os danos reconhecidos pelo caminho comum; não certifica essa exceção.

### Usos e limites que continuam manuais

As matrizes abaixo continuam sendo o roteiro R2–R6. A presença de contador ou
livrinho não conclui a característica. Nesta rodada foram reinspecionados:

- Invocações de conjuração como **Armadura de Sombras**, **Vigor Abissal** e
  **Escultor de Carne**: vínculo de conjuração/custo implementado no vigésimo
  quinto recorte abaixo, reutilizando o contador existente. Não confundir
  invocação conhecida com concessão automática de magia conhecida de bruxo.
  Efeitos nos alvos, formas, prazos e Metamagia por esse controle continuam na mesa.
- Sopro do draconato: gasto, dano/metade, dado físico/virtual e recuperação
  implementados no recorte abaixo. Alvos, suas resistências e defesas são
  resolvidos na mesa. Ancestralidade racial e Linhagem Dracônica seguem
  independentes; não deduzir pela pele.
- Forma Selvagem/companheiro: PV e usos parciais existem, mas estatísticas,
  capacidades da criatura e escolha/custo de elemental seguem em R4.
- Outros gatilhos, imunidades/auras, rerrolagens, manobras, talentos e início de
  combate seguem em R2/R3. Munição, recarga, consumíveis, efeitos/cargas de itens
  mágicos e contexto de equipamento continuam em R6/mesa.
- Duração, economia de ações/reações, alcance, cobertura, alvo e benefício
  recebido de aliado exigem contexto. A ajuda deve dizer quando a resolução é
  manual; o nome **Do catálogo** comprova vínculo à fonte, não homologação de
  todo efeito. Uma indicação compacta de resolução manual é preferível a uma
  fórmula parcial apresentada como completa.

O hover com atraso, livrinho e consulta por toque/teclado passaram nos roteiros
existentes. Os problemas A08–A11 mostram que interface de ajuda funcionando e
conteúdo correto são verificações distintas. Ancestral Feérico, Versatilidade
em Perícia e Pesquisador continuam com consulta própria, sem reabrir as falhas
antigas já corrigidas.

Para esclarecer dúvidas de 2014 foi consultado o
[Sage Advice Compendium v2.4](https://media.wizards.com/2019/dnd/downloads/SA-Compendium.pdf),
particularmente Magia Gêmea e distinções de proficiência/rolagem. Não foi usado
o conjunto de 2024. A página oficial da versão antiga de Onda Destrutiva exige
acesso ao livro; não foi usada como prova acessível para alterar silenciosamente
o valor da tradução local.

### Repetir e fechar os achados

```sh
node --import tsx scripts/audit-book-consistency.cjs > /tmp/critcall-regras.json
npm run build
node --import tsx scripts/audit-book-ui.cjs > /tmp/critcall-interface.json
```

Os dois scripts são diagnósticos, usam apenas fichas fictícias e **código 0
significa execução concluída**, não regras aprovadas. Inspecionar `divergences`
e `matches`; não estão encadeados como teste verde em `npm test`. `sourceCommit`
identifica a revisão e o diagnóstico Chromium inclui `buildRevision`.
No ambiente local original, usar
`PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64` ao chamar Chromium.

Ao corrigir cada ID: guardar o comportamento esperado em regressão efetiva,
exigir prévia/rolagem/uso coerentes, conferir físico/virtual e cancelamento,
preservar ajustes e dados anteriores, atualizar esta seção e a matriz pertinente.
A01–A14 recebem regressões nesta entrega. O responsável priorizou em 23/10
draconatos, depois os recortes restantes de R2, magias e por último importação.
R3–R6 continuam parciais. Não
declarar essas famílias concluídas com a correção dos casos conhecidos.

## Roteiro de implementação

A ordem escolhida pelo responsável em **23/10/2026** é **draconatos → rolagens
(R2) → magias (R5) → importação (V1 da retomada)**. A numeração R1–R6 identifica
as famílias e preserva o progresso; não obriga executar pela ordem numérica.
R3/R4/R6 continuam no roteiro. Cada etapa deve ser dividida em entregas pequenas,
sem reescrever a ficha nem automatizar toda decisão da mesa. E-mails e uso
básico real telefone/computador já foram confirmados pelo responsável.

| Etapa | Estado desta sequência | Trabalho e critério de conclusão |
| --- | --- | --- |
| R1 — bônus nos cálculos | **Quatro passivos entregues; achados A01/A05/A06 corrigidos nesta branch** | O recorte original continua implementado. A01/A05/A06 corrigem os bônus/modificadores adicionais e a inconsistência de PV identificados no check-up; regressões nesta entrega. Tipos variáveis/efeitos posteriores seguem em R5. |
| R2 — rolagens e gastos condicionais | **Quinto ao vigésimo quarto recortes em desenvolvimento; etapa parcial** | Talento Confiável, Sortudo racial e talento Sortudo na PR #20; -5/+10 na PR #21; Atacante Bestial e Combate com Armas Grandes publicados nas PRs #31/#32. Quinto recorte: Adepto Elemental nos danos de magia reconhecidos. Sexto: Ataque Desarmante/Derrubar no dano e reservas do Adepto Marcial. Sétimo: Precisão depois do d20 com Sortudo/halfling. Oitavo: cinco outras manobras de dano, com FOR/SAB ou sem resistência. Nono: recuperação de superioridade, Inspiração de Bardo e Chi ao rolar iniciativa com a reserva vazia. Décimo: vantagem/desvantagem contextual na iniciativa. Décimo primeiro: Sobrevivente no início do turno declarado pela mesa. Décimo segundo: Aparar no dano recebido. Décimo terceiro: Inspirar com dado + CAR para PV temporários de aliado. Décimo quarto: Passo Evasivo na CA até parar de se mover. Décimo quinto: Estendido escolhido antes do ataque, alcance de um ataque e dado já pago no dano. Décimo sexto: Finta com ação bônus/alvo, vantagem contextual e dado já pago no acerto. Décimo sétimo: Trespassante com dano separado à segunda criatura pela mesma jogada. Décimo oitavo: Contra-Atacar com reação e custo antes do ataque após um erro corpo a corpo. Décimo nono: Golpe do Comandante com custo antecipado e dado adicional do ataque imediato de um aliado, resolvido na mesa. Vigésimo: lote de modos contextuais, Força Indomável, Duelista Defensivo e Líder Inspirador. Vigésimo primeiro: Curandeiro/kit e apoio do bardo. Vigésimo segundo: núcleo de combate do monge, reações e repetição de resistências. Vigésimo terceiro: resistências condicionais, imunidades/auras próprias e defesas de Mestre de Escudo. Vigésimo quarto: talentos de ataques bônus/oportunidade, contexto de magia e disputas corporais. As 16 manobras têm controles delimitados; critérios e limites abaixo. Faltam adicionais dos demais talentos/estilos e contextos de elemento/efeito ainda manuais. Turnos/alvos continuam declarados pela mesa. |
| R3 — condições, defesas e características | **Parcial: lote de imunidades/auras e testes condicionais implementado** | Modos próprios de condições, defesas do monge e vigésimo terceiro recorte: auras próprias, Fúria Inconsciente, Defesa Sedutora, Proteção Natural, fontes raciais, Sentido de Perigo, Abjuração e Mestre de Escudo. Completar as demais imunidades/auras recebidas, outras reações e prevenção de queda, passivos de escolas/domínios e origens de resistência. Conferir alvos/fontes, custo, encerramento e o que continua decidido na mesa. |
| R4 — formas e criaturas | Planejada; PV da forma/companheiro já existem | Integrar bloco de criatura e elegibilidade da forma, estatísticas/CON, custo de elemental, defesas/excesso, familiar e companheiro. Não aplicar estatísticas humanas à besta; manter a reserva humana e a consulta ao livro. |
| R5 — famílias de magias | Parcial: oito curas, quatro invocações revisadas em profundidade e 19 vínculos de conjuração | Vigésimo quinto recorte: custo conjunto com Pacto, à vontade no círculo base, concentração, Armadura Arcana e Vigor Abissal; Cárceri tem limite declarado por criatura. Não certifica todos os efeitos das 32 invocações nem das 361 magias. Demais famílias: dano/cura, bônus, áreas, alvos, transformações e efeitos persistentes. Reutilizar grimório/PV/rolador. |
| R6 — equipamento e contexto de combate | Parcial: penalidades de armadura/arma pesada, kit e loja nos lotes de combate/apoio | Munição/recarga/consumíveis, demais penalidades de equipamento, carga e ações condicionais. Definir antes qualquer acompanhamento opcional de turno; alvos, alcance, cobertura e viagem podem continuar na mesa, com essa limitação clara. |

### Draconatos — recorte de 23/10/2026

**Implementado e validado na entrega da PR #21; publicação em RETOMADA.md.** Fonte: Livro
do Jogador 2014, p. 34 impressa / PDF 33; dez ancestralidades conferidas na
tabela existente. O sopro usa uma **ação**, não um ataque de Ataque Extra.

- [x] Um uso racial por descanso curto ou longo, junto à própria característica,
  com correção de clique e histórico existentes. Não cria magia nem reserva paralela.
- [x] Dano por nível total: 2d6; 3d6 no 6; 4d6 no 11; 5d6 no 16. CD 8 + CON +
  proficiência; ancestral define elemento, cone/linha e resistência DES/CON.
- [x] Dado físico em OFF ou virtual pelo rolador existente, com total integral e
  metade arredondada para baixo. Vantagem/inspiração, Afinidade Elemental e
  Evocação Potencializada não acrescentam dados/bônus de magia ao sopro.
- [x] Escolha racial editável somente com ficha desbloqueada; remover/trocar
  preserva gasto, ancestral de feiticeiro, outros dados e foco do seletor.
- [x] Forma Selvagem exige CON da forma e confirmação de capacidade física;
  nenhum valor humano é aplicado silenciosamente à besta. Fúria permite sopro.
- [x] Cancelamento, dados inválidos, incapacitação ou ficha alterada durante a
  confirmação não gastam o uso. Resultado e contador persistem no documento.

**Limite operacional:** cada criatura na área, inclusive aliados, faz seu teste
na mesa. O controle informa área, CD, tipo e dano/metade; não decide quais alvos
estão presentes, não rola resistências de outras criaturas nem aplica PV em
outras fichas. Defesas específicas e economia de ações continuam no contexto
da mesa. Isso não certifica os demais traços raciais nem R3/R4 completos.

Verificação deste recorte: **454 testes Node**, tipos/build e **sete roteiros
Chromium pertinentes** aprovados: sopro, regras, consulta de características,
dado, cadeado, concentração e os 32 casos A01–A14. Incluídos dez ancestrais,
limiares/multiclasse, dados físicos/OFF/virtuais, cancelamento, estado/permissão
alterados, descanso, desfazer/refazer, foco, 320px/GG/três temas/dois layouts e
offline sob `/D-D/`. Diagnóstico puro repetido: **3.321 verificações, zero
divergências**. A suíte completa agora inclui o 34º roteiro de navegador para
este sopro; não foi repetida integralmente nesta rodada. Sem SQL ou teste de
banco local nesta mudança; sem teste com PDF pessoal.

### Primeiro recorte: R1

- [x] **Ambidestro:** CA condicional no cálculo existente, somente com a condição
  de equipamento confirmada; não transformar o registro do talento em bônus universal.
- [x] **Observador:** bônus nos valores passivos de Percepção e Investigação,
  distinguindo-os das rolagens ativas.
- [x] **Sorvedor de Vida:** dano da arma do pacto elegível; selecionar a invocação
  não deve aumentar todas as armas ou ser confundido com Explosão Agonizante.
- [x] **Afinidade Elemental:** bônus de dano nas condições da linhagem/elemento,
  separado da resistência já controlada e sem repetir o bônus por cada dado/raio.

R1 exige prévia/total/rolagem coerentes, casos elegíveis e inelegíveis,
multiclasse/legado e preservação de ajustes manuais. Quando houver nova escolha
na interface, conferir cancelamento, foco/rolagem, mobile/GG e persistência
sem rede. O recorte implementado e seus limites estão descritos abaixo.

### Entrega R1 — 21/10/2026

Implementação no commit `8bcab7dfcaa5750e512264a8ef43b8ebffcb6748`,
em `src/rules/passives.ts`, integrada aos cálculos e controles existentes. Fonte: Livro do Jogador local, páginas físicas do PDF **166**
(Ambidestro), **170–171** (Observador), **61** (Sorvedor de Vida) e **79**
(Afinidade Elemental), conferidas no texto extraído e referências do motor.

- Ambidestro usa a confirmação de duas armas corpo a corpo empunhadas nos
  ajustes de defesa; inventário não é equipamento em uso. Soma +1 às fórmulas
  calculadas, sem escudo, inconsciência ou Forma Selvagem. Inconsciência encerra
  a confirmação, e cura não a reativa; descanso curto a preserva. CA escrita/legada
  permanece intacta. Regras de sacar/guardar e elegibilidade de duas armas
  além desse bônus continuam na mesa/R6.
- Percepção e Investigação mostram o passivo junto à perícia, nos dois layouts:
  10 + bônus ativo + Observador. Ajustes ativos, inclusive zero, proficiência,
  especialização e Versatilidade são preservados. O modo do dado não altera o
  passivo de referência; vantagem/desvantagem por contexto continua na mesa.
- Arma do pacto é um vínculo explícito no editor de arma, somente com Pacto da
  Lâmina. Confirmar transfere o vínculo; cancelar não altera nenhuma arma.
  Sorvedor exige bruxo 12 e a invocação, soma CAR (mínimo 1) como necrótico,
  uma vez por acerto, sem duplicar o bônus no crítico. Armas manuais não recebem
  acréscimos inferidos; uma arma importada não é identificada pelo nome.
- Afinidade exige feiticeiro 6/linhagem dracônica e ancestral da classe
  estruturado. Soma CAR uma vez à fórmula da conjuração de tipo fixo reconhecido,
  depois de compor Gêmea; os outros raios não repetem o bônus. CAR negativo
  permanece na fórmula, com piso zero no resultado do dano. Não cobra
  feitiçaria nem exige ativar a resistência. Fórmulas próprias e tipos variáveis
  (como Orbe Cromática) não recebem bônus inferido; efeitos posteriores e a
  classificação integral das magias continuam em R5. A aplicação automática é
  na rolagem inicial do lançamento, não um executor de todos os acertos/alvos.

Regressões em `tests/passives.test.ts` e `tests/passives-browser.cjs`, incluindo
casos inelegíveis/multiclasse, valores manuais, crítico, cancelamento, vínculo
único, raios sem gasto repetido, Só Pool, recarga offline/notas e layouts/temas
em 320px/GG. Verificações executadas: **395 testes Node** e tipos/build
aprovados; os **25 roteiros anteriores** passaram na rodada ampla. Após os
últimos ajustes de inconsciência, foco e piso de dano, foram reexecutados no
build final **R1, PV, concentração, regras, crítico/adicionais e ataques mágicos**,
todos aprovados, incluindo CAR negativo com dano mínimo zero. A suíte completa
não foi repetida localmente após esses ajustes; é exigida na CI da PR. Capturas
desktop/celular conferidas; diff e 62 links/âncoras locais válidos.
SQL/RLS/RPC não foram alterados; teste de banco não repetido localmente.

A [PR #17](https://github.com/mhaetinger/D-D/pull/17) foi integrada em `develop`
em `445939d`, após autorização do responsável e aprovação da CI completa no
[workflow 39675036022](https://github.com/mhaetinger/D-D/actions/runs/39675036022):
395 testes Node, tipos/build, os 26 roteiros Chromium, banco/RLS/Storage
descartável e auditoria das dependências de produção. Isso complementa as
execuções locais acima; não significa publicação ou cobertura integral do livro.

### Primeiro recorte de R2 — 21/10/2026

Implementação `ba4a182`, ajustada até `7dc30eb` e integrada em `develop`
`19e4ceb` pela [PR #18](https://github.com/mhaetinger/D-D/pull/18), após
autorização e [CI completa aprovada](https://github.com/mhaetinger/D-D/actions/runs/39687594114).
Não há publicação deste recorte.

Fonte: Livro do Jogador local, páginas físicas **27** (Sortudo racial), **90**
(Talento Confiável) e **174** (um único dado rerrolado com vantagem/desvantagem).
Implementação em `src/rules/dice-roll.ts`, integrada ao rolador existente.
O [Sage Advice v2.4/2020 para as regras de 2014](https://media.wizards.com/2019/dnd/downloads/SA-Compendium.pdf)
também foi conferido: meia proficiência de Versatilidade/Atleta não habilita
Talento Confiável. Não usar a revisão de 2024 para essa combinação.

- [x] **Talento Confiável nas perícias:** exige ladino 11 e proficiência real
  naquela perícia; trata o d20 escolhido de 9 ou menos como 10 antes de somar
  bônus e outros dados. Conserva especialização e ajustes escritos, inclusive
  zero/negativos. Não infere proficiência pelo valor do bônus nem pelo nome.
  Não se aplica a ataques, resistências, testes simples de atributo, iniciativa
  ou à meia proficiência de Versatilidade/Atleta. Testes com ferramentas seguem
  na mesa, pois não existe uma ação de rolagem própria para eles nesta ficha.
- [x] **Sortudo racial contextual:** exige o vínculo de uma das duas sub-raças
  halfling. Após um 1 em ataque, perícia, atributo, iniciativa ou resistência
  em Auto Ficha, oferece repetir um único dado na bandeja. Com vantagem/desvantagem,
  mantém o outro dado e o modo original; dois 1 ainda permitem só uma repetição.
  O novo resultado é obrigatório, mesmo outro 1. Não gasta inspiração novamente,
  não rola outros dados e atualiza o crítico preparado da arma.
- [x] **Resistências com consequências imediatas:** concentração, morte e Fúria
  Implacável permitem optar por repetir um 1 na confirmação do dado virtual,
  antes de rolar/aplicar consequências. Dado físico registra a face final
  resolvida na mesa; cancelar ou usar OFF não lança dados virtuais.
- [x] **Contexto preservado:** opção transitória termina com outra rolagem ou
  troca de ficha/espaço; alteração da ficha invalida o resultado anterior.
  Dado rápido e pool livre não inferem regras de uma jogada. O desenho, auras e
  gestos do dado permanecem nos módulos existentes.

O primeiro recorte não incluiu o **talento Sortudo**, descrito no segundo
recorte abaixo. A etapa R2 continua parcial. Resultado/acerto e o momento de
usar a opção antes de resolver a jogada continuam a cargo da mesa.

Regressões: `tests/dice-roll.test.ts` e `tests/conditional-rolls-browser.cjs`.
Verificações finais: **404 testes Node**, tipos/build e os **27 roteiros
Chromium completos** aprovados no mesmo artefato, incluindo R1, desenho/gestos
do dado, PV, concentração, ataques e importação. O novo roteiro cobre opção
única/cancelamento/estado obsoleto, crítico, inspiração, resistências com
consequências, dois layouts, três temas, 320px/GG, toque e recarga offline sob
`/D-D/` com notas preservadas. Capturas desktop/celular conferidas; 62 links
locais válidos e auditoria de produção sem vulnerabilidades. Sem SQL/RLS/RPC;
banco não repetido localmente, permanecendo exigido na CI.

### Segundo recorte de R2: talento Sortudo — 22/10/2026

Implementação `c304e83`, em revisão na
[PR #19](https://github.com/mhaetinger/D-D/pull/19) para `develop`.
Conferir a CI completa antes de integrar; sem publicação deste recorte.

Fonte: Livro do Jogador local, página física **171**, e
[Sage Advice v2.4/2020, página 8](https://media.wizards.com/2019/dnd/downloads/SA-Compendium.pdf#page=8).
Na regra de 2014, o talento permite escolher qualquer um dos d20, inclusive
o que seria descartado pela desvantagem; o modo original continua valendo.
Não usa os pontos por proficiência nem os efeitos da versão de 2024.

- [x] **Reserva única:** `feat:lucky`, três pontos por descanso longo,
  independente de classe/nível e do traço racial homônimo. Usa o histórico,
  salvamento e controles de recurso existentes, junto à escolha do talento.
  Descanso curto não recupera. Máximos adaptados explicitamente permanecem
  editáveis; registros ilegíveis não viram pontos novos nem são apagados.
- [x] **Jogadas próprias:** ataque, perícia, atributo, iniciativa e resistência
  em Auto Ficha oferecem o uso após o lançamento inicial. Confirmar gasta um
  ponto e lança apenas um d20 adicional. Permite escolher inclusive a face
  original; não duplica bônus, outros dados, inspiração ou custo. Crítico
  preparado da arma e mínimo do ladino acompanham a face escolhida.
- [x] **Concentração, morte e Fúria Implacável:** escolha antes de rolar,
  decisão após ver o d20 ou resolução sem o talento. Duração/fila/PV/dano não
  são aplicados antes da decisão. Cancelar após a rolagem mantém o teste
  pendente na sessão; retomá-lo usa os mesmos dados e não cobra novamente.
  Inspiração preparada é consumida no lançamento inicial, mesmo se a escolha
  for interrompida. Mudanças na ficha invalidam a aplicação antiga.
- [x] **Ataque contra o personagem e mesa:** controle junto ao talento para
  informar a face já escolhida do atacante e escolher entre ela e seu d20
  adicional virtual/físico. Usa os bônus do atacante na mesa; não calcula
  acerto, não lança a sua arma e não aplica dano/PV automaticamente. OFF
  mantém o registro físico; **Usar na mesa** registra somente o ponto.
- [x] **Interações e apresentação:** uso declarado por outra criatura cancela
  os dados adicionais, preservando o gasto. Sortudo racial pode repetir um 1
  do conjunto, inclusive do dado adicional, uma única vez. Botões das faces
  conservam nós, foco e posição ao selecionar. Cor, texto, símbolo/contorno e
  `aria-pressed` distinguem a escolha; desenho/auras/gestos do dado continuam
  nos módulos anteriores. D20 rápido, pool livre e dano não gastam por inferência.

O controle cobre uma aplicação do talento por jogada. O anúncio dos usos de
outras criaturas e o momento anterior à resolução continuam na mesa; não há
servidor de turnos/alvos. As faces pendentes são transitórias desta página:
recarregar ou trocar de instalação não restaura o conjunto de d20; o gasto já
salvo permanece na ficha. Isso não é restauração de uma rolagem por backup.

Regressões: `tests/lucky.test.ts` e `tests/lucky-browser.cjs`. Conferidos
**417 testes Node**, tipos/build e os **28 roteiros Chromium** locais, incluindo
decisão tardia, custo/cancelamento/retomada, modificações concorrentes,
vantagem/desvantagem, críticos, inspiração, racial/mínimo, dados físicos/OFF,
dois layouts/três temas/320px/GG/toque e pontos/notas offline sob `/D-D/`.
Conferidos 62 links/âncoras locais e auditoria de produção sem vulnerabilidades.
CI completa e banco descartável são exigidos antes da integração. Banco não
repetido localmente; não houve SQL/RLS/RPC nem validação entre dispositivos reais.

Naquele recorte continuavam pendentes em R2: Atacante Bestial, Combate com Armas Grandes,
Adepto Elemental e adicionais/manobras dos demais talentos/estilos. A cobertura
de -5/+10 foi acrescentada no terceiro recorte abaixo. **R2 não está concluída.**

### Terceiro recorte de R2: –5 no ataque / +10 no dano — 23/10/2026

**Implementado e validado na entrega da PR #21; publicação em RETOMADA.md.** Fontes: Livro
do Jogador 2014, Atirador Aguçado p. 167 (PDF 166) e Mestre de Armas Grandes
p. 171 (PDF 170). A escolha ocorre antes do ataque; exige o talento estruturado
e proficiência na arma. Não se trata do estilo Combate com Armas Grandes.

- [x] Checkbox compacta junto a Crítico/Adicionais, somente em armas elegíveis.
  Atualiza bônus de ataque e prévia de dano sem remontar nós, perder foco,
  modificar os totais cadastrados ou gravar uma escolha permanente.
- [x] Atirador usa arma da categoria à distância, incluindo Dardo; Adaga/Azagaia
  arremessadas continuam armas corpo a corpo. Mestre exige ataque corpo a corpo
  e propriedade pesada; arma versátil com duas mãos ou arremesso improvisado
  de arma pesada não bastam. Dardo automático respeita acuidade (FOR/DES),
  preservando habilidade explícita. Não acumular
  os dois talentos em um ataque nem usar regras de 2024.
- [x] –5 na rolagem contextual, inclusive nas mesmas faces de Sortudo, e +10
  uma vez do tipo de dano da arma. Crítico duplica dados; não duplica +10 nem
  transforma o bônus em dano radiante de Destruição.
- [x] Dano comum/crítico e Adicionais compartilham o plano existente. OFF/Só
  Pool registram o total físico já incluindo +10, sem somar novamente. Prévia
  e cancelamento não gastam espaço; Destruição confirmada gasta só um.
- [x] Preparação por objeto de arma, sem estado no backup: confirmar dano limpa
  a marca, cancelar mantém, recarregar a descarta. Outras fichas/armas não a
  recebem. Mudança de ficha/documento/preparação/permissão invalida confirmação.

**Limites:** acerto/erro, alcance/cobertura e ataque bônus após crítico/abate
continuam na mesa. Se errou, desmarcar a preparação antes de continuar. A ficha
não controla turnos/alvos e permite correção manual da preparação; não impede
uma declaração tardia na mesa. Armas com totais manuais não recebem +10 inferido
porque podem já incluí-lo; preservar as fórmulas cadastradas. Atacante Bestial e
Combate com Armas Grandes avançam no quarto recorte abaixo; Adepto Elemental
e demais gatilhos continuam pendentes.

Verificação deste recorte: **464 testes Node**, tipos/build e **nove roteiros
Chromium pertinentes** aprovados: –5/+10, crítico/adicionais, dado, R2 inicial,
Sortudo, editor de armas, regras, passivos e cadeado. Cobertos elegíveis e
inelegíveis, arremesso, acuidade de Dardo, bônus/critério de crítico, inspiração,
Sortudo sem nova penalidade, prévia/cancelamento, físico/OFF/virtual, espaço
único, concorrência/permissão, nós/foco, 320px/GG/três temas/dois layouts,
fichas/notas e offline sob `/D-D/`. Após a exclusão explícita do arremesso
improvisado, repetidos Node/build, –5/+10, crítico/adicionais e cadeado.
Diagnóstico puro: **3.321 verificações, zero divergências**. A suíte completa
agora tem **35 roteiros**, sem repetição integral local nesta rodada; a CI exige
a execução completa. Sem SQL, teste de banco local ou PDF pessoal nesta mudança.

### Quarto recorte de R2: dados da arma — 23/10/2026

**Implementado nesta branch.** Fontes: Livro do Jogador 2014, Atacante Bestial
(p. 167 / PDF 166) e Combate com Armas Grandes (p. 85 / PDF 84);
[Sage Advice Compendium 2.7](https://media.wizards.com/2021/dnd/downloads/SA-Compendium.pdf),
pp. 4 e 10, limita as repetições aos dados da arma, excluindo dano adicional
de outras características, como Furtivo e Destruição.

- Estilo: dados 1/2 podem ser repetidos individualmente uma vez; a nova face
  é obrigatória mesmo se for baixa. Exige estilo escolhido, arma com duas mãos
  ou versátil empunhada em duas mãos, sem escudo. Não confundir com o talento
  Mestre de Armas Grandes, cuja preparação –5/+10 permanece independente.
- Bestial: repete todos os dados da parte Arma e permite escolher um dos dois
  conjuntos completos, sem combinar melhores faces. A disponibilidade de uma
  vez por turno é confirmada pela mesa; sem contador diário/turnos automáticos.
  O estilo pode repetir faces elegíveis em cada conjunto, uma vez por face.
- Inclui duplicação normal da arma no crítico. Bônus, Furtivo, Destruição,
  Colossos, Crítico Brutal/Ataques Selvagens e demais parcelas de características
  permanecem como rolados. Totais negativos são limitados a zero só ao recompor.
- Somente armas automáticas corpo a corpo; arremessos, distância, desarmados,
  valores manuais e Forma Selvagem continuam na mesa. OFF/Só Pool registram
  o total físico já resolvido, sem RNG ou alterações à fórmula cadastrada.
- Fechar e retomar mantém os conjuntos transitórios e gastos já registrados.
  Outra jogada, alteração da ficha/arma, troca de ficha ou bloqueio de permissão
  invalida a repetição antiga antes de lançar dados. Recarga descarta faces
  transitórias, sem devolver espaço. Pool livre/inspiração/notas ficam intactos.

Verificados **486 testes Node**, tipos/build e **seis roteiros Chromium**:
rerrolagens, crítico/adicionais, –5/+10, dado, ajudas e cadeado. Cobertos
retomar/gasto único, invalidação por jogada/documento/ficha/permissão,
escolha de conjunto sem RNG, físico/OFF/Só Pool, preservação de pool/inspiração,
notas/outra ficha, limite de 25 registros, 320px/GG/três temas/dois layouts e
recarga offline sob `/D-D/`. Diagnóstico puro: **3.321 verificações, zero
divergências**. CI passa a exigir os 38 roteiros e banco descartável; sem SQL,
teste de banco local, PDF pessoal ou alteração dos catálogos nesta mudança.
R2 continuava parcial; Adepto Elemental avança no quinto recorte abaixo.
Demais gatilhos/adicionais permanecem.

### Quinto recorte de R2: Adepto Elemental — 24/10/2026

**Implementado em desenvolvimento, sem publicação.** Fonte: Livro do Jogador
2014, p. 167 / PDF 166, consultável pelo livrinho do talento. A
[listagem oficial de 2014](https://www.dndbeyond.com/feats?filter-name=Elemental&filter-prereq-subtype=)
também identifica o benefício de ignorar resistência; não usar a versão 2024.

- Talento e elemento vêm do mesmo evento de escolha. Repetir com outro elemento
  é permitido; o mesmo mínimo não acumula. O criador deixa de oferecer o talento
  quando os cinco elementos já foram escolhidos, evitando uma escolha impossível.
- Na prévia aparece **Adepto: 1→2**. Auto Ficha trata cada face 1 do dano elegível
  como 2, sem repetir dados. O detalhamento conserva faces originais e discrimina
  o ajuste, o elemento de resistência ignorada e que imunidade continua valendo.
- Vale em círculo superior, truques, Gêmea e dano por raio; o raio posterior
  conserva o mínimo sem repetir Afinidade/Evocação ou gastar outro espaço.
  Bônus fixos não mudam. Leitura literal do parágrafo de 2014: em uma magia
  elegível de dano misto, o mínimo vale em qualquer dado de dano dessa magia;
  a resistência ignorada continua restrita ao elemento escolhido. A decomposição
  de Tempestade de Gelo, Coluna de Chamas e Onda Destrutiva usa os mesmos dados.
- OFF orienta resolver os dados físicos na mesa, sem RNG. Só Pool bloqueia a
  conjuração como antes. Cura, armas, sopro, d20 e bandeja livre não herdam o
  benefício. Não se trata de resistência recebida pelo conjurador, e nenhum PV
  de alvo é calculado/aplicado automaticamente.
- Fórmulas próprias e magias personalizadas continuam manuais. Não se deduzem
  elementos de notas ou nome da magia. Orbe Cromática, Glifo de Vigilância,
  Escudo de Fogo, Rajada/Muralha Prismática, Tempestade da Vingança e Fome de Hadar
  recebem **conferir na mesa**: o catálogo ainda não distingue escolha, camada,
  rodada ou parcela pertinente. Destruição Lancinante/Trovejante e Flecha
  Relampejante também exigem ligar o dano ao acerto posterior da arma, ainda
  manual. Outros efeitos posteriores/tipos não reconhecidos
  continuam no escopo parcial de R5; isso não certifica as 361 magias.

Verificados **504 testes Node**, tipos/build e **sete roteiros Chromium**:
Adepto Elemental, ataques de magia, passivos, curas auditadas, invocações, dado
e ajudas. Cobertos cancelamento/gastos, ausência de RNG extra, fórmulas próprias,
notas/outra ficha, OFF/Só Pool, 320px/GG/três temas/dois layouts e recarga offline
sob `/D-D/`. A CI passa a exigir 40 roteiros. Sem SQL, banco local, conta real,
alteração dos catálogos gerados ou do desenho/gestos do dado.
Diagnóstico puro: **3.321 verificações, zero divergências**.

### Sexto recorte de R2: manobras no acerto — 28/10/2026

**Implementado em desenvolvimento, sem publicação.** Recorte delimitado:
**Ataque Desarmante** e **Derrubar** nas armas reconhecidas pelo catálogo.
Fontes locais: Superioridade em Combate, p. 87 / PDF 86; Manobras e
Superioridade Aprimorada, p. 88 / PDF 87; Adepto Marcial, p. 167 / PDF 166.
A [errata oficial do PHB 2014](https://media.wizards.com/2021/dnd/downloads/PH-Errata.pdf)
(p. 3 do documento) esclarece que o talento concede um d6 adicional a dados
obtidos de outra origem. O PDF local anterior à errata é preservado; a consulta
na característica identifica a diferença. Superioridade Aprimorada melhora os
seus dados para d10/d12 nos níveis 10/18 de guerreiro Mestre de Batalha.

- **Adicionais** oferece apenas as duas manobras efetivamente conhecidas, com
  origem do dado, saldo, escolha FOR/DES para CD 8 + proficiência + modificador
  e confirmação de que nenhuma outra manobra foi usada nesse ataque, inclusive
  Precisão. Não há rastreamento automático de ataques/turnos da mesa.
- Após acerto com arma, a manobra acrescenta um dado do tipo de dano da arma;
  o crítico dobra esse dado sem dobrar o custo ou bônus fixos. Pode coexistir com
  Furtivo e Destruição; as repetições da arma não repetem dados da manobra.
  Arco e arremesso também servem. Ataques/fórmulas manuais continuam na mesa.
- Desarmante pede teste de FOR para largar o item escolhido aos pés do alvo.
  Derrubar pede FOR de alvos Grandes ou menores para caírem; alvos maiores
  ainda recebem o dano adicional. O histórico informa CD/efeito; nenhum alvo
  sofre aplicação automática de dano/condição ou alteração de sua ficha.
- A reserva antiga `guerreiro:superiority` mantém gastos/máximos próprios;
  `feat:superiority` registra somente o dado adicional do talento. Escolhe-se
  qual origem pagar, e qualquer uma paga uma manobra conhecida por qualquer
  origem. Sem duplicar o contador da classe. Descanso curto/longo recupera ambas.
  O controle **Usar na mesa** registra as demais manobras físicas; não clicar
  novamente depois do gasto por Adicionais. Ganhos futuros/removidos, escolhas
  órfãs e trocas da classe não concedem manobras indevidas ou apagam o talento.
- Prévia/cancelamento não gastam/rolam. Confirmar revalida documento, arma,
  permissão e Auto Ficha antes do RNG; custos de manobra/Destruição validam juntos.
  OFF/Só Pool aceitam o total físico final, sem rolar ou multiplicar esse valor.
  Histórico e gasto entram no mesmo passo e desfazer recupera ambos.

**R2 permanece parcial.** Naquele recorte, as demais 14 manobras, incluindo
Precisão, continuavam na mesa. Precisão avança no sétimo recorte abaixo;
reações, ação bônus, início de combate/Implacável e os demais talentos/estilos
continuam na matriz. Isso não exige sincronização entre fichas.

Verificados **512 testes Node**, tipos/build e **sete roteiros Chromium**:
manobras, crítico/adicionais, rerrolagens, regras/recursos, ajudas, dado e cadeado.
Incluídos esgotamento/registro ilegível, cancelamento/concorrência, desfazer,
notas/outra ficha, foco/scroll, 320px/GG/três temas/dois layouts e offline /D-D/.
A suíte completa da CI passa a exigir 41 roteiros e banco descartável. Não houve
SQL, limpeza de dados, alteração de catálogos gerados ou publicação nesta rodada.

### Sétimo recorte de R2: Ataque de Precisão — 28/10/2026

**Implementado em desenvolvimento, sem publicação.** Fonte local: Manobras,
Livro do Jogador 2014, p. 88 / PDF 87. A regra admite o uso antes/depois do d20,
antes de qualquer efeito do ataque. Este fluxo automatiza a decisão **depois do
d20** de ataque com arma do catálogo; a decisão antecipada continua na mesa.

- **Precisão · usar 1 dado** aparece no resultado de um ataque da arma em
  Auto Ficha quando a manobra é conhecida e existe saldo de superioridade.
  Oferece as mesmas origens da classe/talento, com dado, saldo e gasto único.
  Registre a face do dado físico de superioridade ou role somente esse dado;
  não relança d20, muda seu modo, altera o pool ou gasta outra inspiração.
- O adicional fica separado do d20 natural, bônus fixo e faces originais.
  1 natural continua errando; 20 e o crítico ampliado do Campeão continuam
  dependendo do natural. Acerto contra CA, alvo e momento de resolução ficam
  com a mesa. A confirmação exige ataque ainda não resolvido e nenhuma outra
  manobra usada, inclusive aquelas resolvidas fora do aplicativo.
- Pode escolher Sortudo antes/depois de Precisão e repetir um 1 pelo halfling:
  todas as recomposições conservam a mesma face de superioridade, uma vez só,
  sem novo custo. O halfling não repete o dado de superioridade. O cancelamento
  de Sortudos mantém Precisão. Botões de escolha de d20 conservam seus nós.
- A sessão transitória de cada arma impede combinar Desarmante/Derrubar com
  Precisão nesse ataque acompanhado. Furtivo/Destruição continuam elegíveis.
  Registrar dano físico ou virtual encerra a escolha do ataque; novo ataque da
  arma inicia outra. Mudar arma/documento/conta/permissão/modo ou rolar outra
  jogada invalida a confirmação antiga antes de RNG/gasto. Cancelar conserva
  o d20 e os usos; desfazer devolve o custo, invalidando a escolha antiga.
- OFF/Só Pool e ataques-base físicos, fórmulas manuais, ataques próprios e
  desarmados seguem na mesa com **Usar na mesa**; não há correção automática
  de total nesses modos. Sair de Auto Ficha encerra o vínculo automático do ataque
  anterior; o próximo ataque físico usa a confirmação da mesa. Armas do catálogo
  à distância, arremesso e Rede são
  elegíveis para o fluxo automático mesmo que não tenham dano rolável.
- Não cria turno, alvo remoto ou aplicação de dano. Sessões/resultados não
  entram no documento/backup; somente custo e descrição do uso entram no passo
  local já existente, limitado a 25 registros e sem envio do histórico à nuvem.

Naquele recorte, permaneciam manuais as outras **13 manobras** do catálogo;
cinco avançam no oitavo recorte abaixo. Contextos
pendentes de estilos/talentos e do início de combate continuam na matriz. **R2 não está concluída**;
a cobertura parcial de R5 e o ciclo de importação continuam na ordem estabelecida.

Verificados **520 testes Node**, tipos/build e **nove roteiros Chromium**:
Precisão, manobras, crítico/adicionais, rerrolagens, Sortudo, R2 inicial, dado,
ajudas e cadeado. Incluídos cancelamento/concorrência/conta/permissão, natural/
crítico ampliado, inspiração única, dado físico/virtual, manutenção de nós/foco,
notas/outra ficha, 320px/GG/três temas/dois layouts e offline /D-D/.
A CI passa a exigir 42 roteiros e banco descartável. Sem SQL, conta real,
catálogos gerados ou publicação nesta rodada.

### Oitavo recorte de R2: cinco manobras de dano e efeitos — 28/10/2026

**Implementado em desenvolvimento, sem publicação.** Fonte local: Manobras,
Livro do Jogador 2014, p. 88 / PDF 87. Reutiliza Adicionais, confirmação de
uma única manobra por ataque, origens/saldo, dado crítico, registro físico,
desfazer e as guardas já existentes. Oferece apenas manobras conhecidas na
aquisição vigente. Não aplica efeitos na ficha de outra criatura.

| Manobra | Resistência e efeito resolvidos na mesa |
| --- | --- |
| Ataque Ameaçador | SAB; na falha, amedrontado pelo atacante até o fim do próximo turno dele. |
| Ataque de Encontrão | FOR de alvo Grande ou menor; na falha, empurra até 4,5 m para longe. Alvos maiores ainda recebem o dado de dano. |
| Ataque Provocante | SAB; na falha, desvantagem ao atacar criaturas diferentes do atacante até o fim do próximo turno dele. |
| Ataque de Manobra | Sem resistência/CD. Aliado que possa ver/ouvir o atacante pode usar a própria reação para mover até metade do deslocamento, sem oportunidade apenas do alvo atingido. |
| Golpe Distrativo | Sem resistência/CD. Vantagem só no próximo ataque de outra criatura contra o alvo, antes do começo do próximo turno do atacante. |

A CD usa FOR ou DES do **atacante**, mesmo quando o alvo testa SAB. O campo
fica oculto/desabilitado nas duas manobras sem resistência, preservando nó,
foco e escolha anterior. A prévia, o resultado e o histórico informam a regra.
Cada confirmação desconta um dado da origem escolhida; crítico dobra dados,
sem dobrar custo ou bônus fixos. As repetições da arma não repetem superioridade.
Precisão no mesmo ataque acompanhado bloqueia todas as sete manobras de dano.

Cobertura atual: **sete manobras de dano + Precisão = 8/16**. Permanecem na mesa
**Aparar, Ataque Estendido, Ataque de Finta, Ataque Trespassante, Contra-Atacar,
Golpe do Comandante, Inspirar e Passo Evasivo**. Seus gatilhos de reação,
ação bônus, decisão antecipada, segundo alvo ou deslocamento não cabem no
mesmo botão de dano de um acerto. Naquele recorte, início de combate/Implacável
e os demais talentos/estilos continuavam pendentes; a recuperação na iniciativa
avança no nono recorte abaixo. **R2 permanece parcial.**

Verificados **525 testes Node**, tipos/build e **nove roteiros Chromium**:
manobras, Precisão, crítico/adicionais, rerrolagens, R2 inicial, Sortudo, ajudas,
dado e cadeado. Incluem origem/classe/talento, FOR/SAB/sem CD, crítico/gasto
único, cancelamento/concorrência, bloqueio por Precisão, registro físico,
nós/foco/scroll, 320px/GG/três temas/dois layouts e offline /D-D/.
A CI mantém 42 roteiros e banco descartável. Sem SQL, fichas reais, novos
campos de personagem, alteração dos catálogos ou publicação nesta rodada.

### Nono recorte de R2: recuperação ao rolar iniciativa — 28/10/2026

**Implementado em desenvolvimento, sem publicação.** Fontes locais do Livro
do Jogador 2014: Inspiração Superior, p. 54 / PDF 53; Implacável, p. 88 / PDF 87;
Auto Aperfeiçoamento, p. 105 / PDF 104.

| Característica | Requisito e recuperação |
| --- | --- |
| Implacável | Guerreiro Mestre de Batalha 15, sem nenhum dado de superioridade restante, incluindo o adicional do Adepto Marcial. Recupera um dado na reserva da classe, preservando o gasto do talento. |
| Inspiração Superior | Bardo 20, sem uso de Inspiração de Bardo. Recupera um uso; não é a inspiração heroica de 2014. |
| Auto Aperfeiçoamento | Monge 20, com zero Chi. Recupera quatro pontos. |

- O botão existente **Iniciativa** usa contexto explícito em Auto Ficha. Só
  recupera depois de lançar os dados; erro do RNG não altera as reservas.
  Nome da jogada, pool livre, d20 rápido, ataques e outros testes não disparam
  esse gatilho. Sortudo racial/talento não concede outra recuperação na repetição
  ou escolha de face do mesmo d20. Os modos preparados e bônus existentes permanecem.
- Em OFF/Só Pool, o mesmo botão permite registrar uma **nova iniciativa física**
  já rolada na mesa. Exige a confirmação dessa condição; cancelar conserva os
  recursos e o último resultado. Não lança dados nem gasta inspiração heroica.
- Usa nível próprio, subclasse atual e reservas já existentes. Saldo positivo
  não acumula recuperação. Máximo ajustado limita o valor; máximo zero não concede
  usos. Valores ilegíveis/negativos/fracionários/acima do máximo ficam preservados
  com aviso, sem tratar erro como reserva vazia ou zerar o histórico de gastos.
- Recuperação e inspiração preparada consumida entram no mesmo passo local;
  desfazer restaura ambos. Saldos/botões, usos dependentes de Chi e inspiração
  atualizam os trechos afetados sem reconstruir listas/selects. Confirmações
  físicas revalidam documento, modo, sequência, conta/ficha e permissão.

**R2 permanece parcial.** Naquele recorte, os contextos de vantagem na iniciativa
ainda eram manuais; avançam no décimo recorte abaixo. As outras oito manobras,
outras reações e estilos/talentos continuam na mesa. Sobrevivente avança no
décimo primeiro recorte abaixo. Não há rastreamento automático
de combate, turnos ou nova iniciativa: a mesa declara o contexto. Nenhuma
interação entre fichas ou sincronização contínua foi adicionada.

Verificados **534 testes Node**, tipos/build e **nove roteiros Chromium**:
iniciativa, Precisão, Sortudo, R2 inicial, regras/cenários auditados, dado,
cadeado e manobras.
Incluem todas as origens de superioridade, físico/virtual/OFF/Só Pool,
cancelamento/concorrência/conta/permissão, erro do RNG, recuperação/inspiração
no mesmo desfazer, nós/foco/rascunhos, 320px/GG/três temas/dois layouts,
notas e offline /D-D/. A CI passa a exigir 43 roteiros e banco descartável.
Sem SQL, dados reais, alteração dos catálogos ou publicação nesta rodada.

### Décimo recorte de R2: vantagem/desvantagem na iniciativa — 28/10/2026

**Implementado em desenvolvimento, sem publicação.** Livro local: Instinto
Selvagem, p. 49 / PDF 48; Explorador Natural do **Patrulheiro Revisado**, p. 117 /
PDF 116 (adaptação já usada no projeto); vantagem/desvantagem, p. 175 / PDF 174;
iniciativa como teste de DES, p. 191 / PDF 189; proficiência em armaduras,
p. 146 / PDF 145; envenenado/exaustão, p. 292 / PDF 290.

- Auto Ficha aplica vantagem por bárbaro de nível próprio 7 ou Patrulheiro
  Revisado 1, independentemente da subclasse. Instinto não exige Fúria ativa;
  o benefício de iniciativa não tem a restrição de armadura pesada da Fúria.
- Reúne classe, modo informado no dado, inspiração preparada, exaustão ≥1,
  envenenamento e armadura/escudo sem proficiência. Fontes não acumulam dados;
  qualquer vantagem + qualquer desvantagem resulta em **um d20**, mesmo com
  duas vantagens e uma desvantagem. Bônus numéricos permanecem iguais.
- Resultado identifica as fontes. Sortudo/halfling preservam modo e explicação
  capturados, sem reavaliar inspiração já gasta nem aplicar outra recuperação.
  Seletor global, pool e d20 rápido continuam independentes desse contexto.
- OFF/Só Pool orientam quantidade/escolha do dado físico e bônus. Não presumem
  gasto de inspiração; a orientação avisa quando ela está preparada. Recuperação
  física mantém a confirmação existente. Erro de RNG/permissão não gasta recursos.
- Medo: a mesa informa desvantagem quando a fonte está à vista. Caído/impedido/
  cego não impõem automaticamente desvantagem em iniciativa. Na Forma Selvagem,
  DES e uso/incorporação do equipamento continuam conferidos na mesa.
- Instinto não remove surpresa automaticamente nem ativa Fúria. A exceção exige
  não estar incapacitado e entrar em Fúria antes de qualquer outra coisa no
  primeiro turno. Explorador Natural não aplica vantagem automática a ataques:
  a mesa confere se o alvo ainda não agiu. Sem acompanhamento de turnos/alvos.

**R2 permanece parcial.** Outras oito manobras, reações, estilos/talentos e
demais contextos condicionais continuam na matriz. Sobrevivente avança no décimo
primeiro recorte abaixo. Este recorte
não promete aplicar as mesmas condições automaticamente em toda jogada da ficha.
Sem SQL, dados reais, alteração dos catálogos ou publicação.

Verificados **543 testes Node**, tipos/build e **sete roteiros Chromium**:
modo da iniciativa, recuperação na iniciativa, Sortudo, R2 inicial, 32 cenários
auditados, dado e ajudas. Incluem cancelamento único, preservação do perfil nas
repetições, inspiração/desfazer, RNG/permissão, OFF/Só Pool/recuperação, notas,
320px/GG/três temas/dois layouts e offline /D-D/. A CI exige 44 roteiros e
PostgreSQL descartável. Evidência da CI atual permanece na PR #35.

### Décimo primeiro recorte de R2: Sobrevivente — 29/10/2026

**Implementado em desenvolvimento, sem publicação.** Livro local do Jogador
2014, Sobrevivente do Campeão, p. 86 / PDF 85. Exige Guerreiro Campeão 18
próprio, não nível total de multiclasse.

- No começo de cada turno, recupera **5 + modificador de CON** se tiver PV
  positivos até metade do máximo vigente. A metade é requisito anterior, não
  teto da cura; a recuperação pode ultrapassá-la, limitada ao máximo. Exaustão
  4/5 considera o máximo reduzido. CON negativa reduz o valor, e CON 1 dá zero.
- Não exige ação nem consciência: sono/incapacitação com PV positivos não
  bloqueiam. Zero PV, mesmo estável, não recebe o benefício; não revive mortos.
- Controle compacto junto aos PV confirma **início de um novo turno, sem
  repetir o benefício no mesmo turno**. Não deduz turnos de iniciativa, descanso,
  recarga ou lançamentos. A mesa acompanha essa frequência; a ficha não detecta
  uma declaração deliberadamente repetida. Não cria reserva nem cronômetro.
- Usa a cura existente e um passo local de desfazer. Temporários, inspiração,
  Dados de Vida e Retomar o Fôlego não são gastos. OFF/Só Pool/Auto funcionam sem
  RNG. Cancelamento preserva tudo; documento, ficha/conta, botão e permissão são
  revalidados antes da cura. Valores ilegíveis são preservados para conferência.
- Na Forma Selvagem, PV/CON e retenção do benefício na besta ficam na mesa;
  a ficha não aplica estatísticas humanas nem cura a reserva errada.

**R2 continua parcial.** As oito manobras restantes, outras reações,
estilos/talentos e contextos de magia seguem nas matrizes; não são implementados
por este passivo. Sem SQL, dados reais, catálogos modificados ou publicação.

Verificados **552 testes Node**, tipos/build e **sete roteiros Chromium**:
Sobrevivente, PV, dano, cadeado, modo/recuperação na iniciativa e ajudas.
Incluem limites, passivo durante sono/incapacitação, cancelamento/concorrência,
revalidação de documento/ficha/conta/permissão, desfazer, condições/nós/foco/scroll,
320px/GG/três temas/dois layouts, notas e offline /D-D/. A CI exige 45 roteiros e
PostgreSQL descartável. Evidência da revisão atual permanece na PR #35.

### Décimo segundo recorte de R2: Aparar — 29/10/2026

**Implementado em desenvolvimento, sem publicação.** Livro local do Jogador
2014, Aparar, p. 88 / PDF 87. Origem do dado e tamanho seguem a mesma reserva
da classe/Adepto Marcial já auditada, incluindo Superioridade Aprimorada.

- Dano detalhado por tipo oferece Aparar para quem conhece a manobra vigente.
  Confirma ataque corpo a corpo de outra criatura, reação disponível e nenhuma
  outra manobra sua naquele ataque. Também admite ataque corpo a corpo de magia.
  Não exige ver o atacante ou empunhar uma arma; incapacitação impede a reação.
- A redução é **face + DES**, mínimo zero, sem aumentar dano. A face pode ser
  física ou virtual. Preparar a face só atualiza a prévia; cancelar não altera
  PV, dados disponíveis ou histórico. Revalida contexto antes de qualquer RNG.
- **Aplicar dano** valida tudo e gasta um dado da origem escolhida, junto do
  dano recebido em um passo local de desfazer. Crítico mantém redução/custo.
  Repetir o clique concorrente no mesmo formulário não duplica a ocorrência.
- Usa um orçamento único de redução para todos os tipos do ataque, distribuído
  pela ordem das linhas. Proteção/imunidade vêm antes; resistência/vulnerabilidade
  depois. Se as defesas já zeram o dano, não há uso. Com Maestria em Armadura
  Pesada, a mesa declara a ordem das duas reduções. Ajustes manuais por tipo
  permanecem disponíveis antes desses orçamentos.
- Aparar e Esquiva Sobrenatural são alternativas da mesma reação. Temporários,
  concentração e morte usam um único dano final. Não há rastreamento de reação
  ou turnos; ataque/contexto pertencem à mesa. Forma Selvagem continua manual.
- OFF/Só Pool/Auto Ficha mantêm dados físicos/virtuais, pool e inspiração
  independentes. O modo de dano já resolvido não reaplica a manobra. Registros
  de superioridade ilegíveis ou fora do máximo são preservados para conferência.

Cobertura: **sete manobras no dano + Precisão + Aparar = 9/16**. Permanecem
na mesa **Ataque Estendido, Ataque de Finta, Ataque Trespassante, Contra-Atacar,
Golpe do Comandante, Inspirar e Passo Evasivo**. **R2 continua parcial**; outras
reações, estilos/talentos e contextos de magia seguem nas matrizes. Sem SQL,
dados reais, catálogos modificados ou publicação.

Verificados **564 testes Node**, tipos/build e **sete roteiros Chromium**:
Aparar, dano, PV, Precisão, manobras, correções auditadas e Sobrevivente.
Incluem origens/dados/ordem, prévia sem gasto, físico/virtual/OFF, cancelamento,
contexto/permissão antes do RNG, clique duplo, custo/dano/desfazer, CON único,
nós/foco/scroll, 320px/GG/temas/layouts, notas e offline /D-D/. A CI exige
46 roteiros e PostgreSQL descartável; resultado atual na PR #35.

### Décimo terceiro recorte de R2: Inspirar — 29/10/2026

**Implementado em desenvolvimento, sem publicação.** Livro local do Jogador
2014, Inspirar, p. 88 / PDF 87. Usa **dado de superioridade + CAR**. Temporários:
[regras básicas oficiais de 2014](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/combat#TemporaryHitPoints).

- Botão compacto **Inspirar** junto de cada origem de superioridade, apenas
  para quem conhece a manobra vigente. Usa o dado daquela origem: classe ou
  Adepto Marcial, com os aprimoramentos pelo nível próprio do Mestre de Batalha.
- Um único diálogo identifica o aliado, confirma ação bônus no próprio turno e
  que ele pode ver ou ouvir o personagem. Permite face física em OFF/Só Pool/Auto
  ou rolar o dado virtual normal quando habilitado. Modo global, pool e inspiração
  ficam independentes; não duplica o dado por vantagem nem aplica crítico.
- Confirmar valida tudo antes do RNG/gasto e registra **um** dado gasto junto
  do resultado no histórico local. Cancelar, campos inválidos, documento/conta/
  permissão alterados ou cliques concorrentes não gastam. O resultado visível
  identifica aliado, total, face e CAR; o histórico conserva a descrição depois
  de recarregar. Desfazer devolve o dado; não altera a ficha do aliado.
- CAR negativo é considerado sem mínimo 1 artificial. Soma não positiva concede
  zero PV temporários e ainda gasta o dado usado. Não cura, estabiliza, soma aos
  temporários atuais nem aplica pontos ao próprio usuário. O aliado escolhe na
  mesa entre seus temporários e os novos; duram até acabar ou descanso longo.
- Incapacitação impede a ação bônus. Cegueira/surdez do usuário isoladas não
  determinam a percepção do aliado. Forma Selvagem permanece manual, com
  conferência da comunicação da forma. Registros ilegíveis/saldo fora do máximo
  são preservados. Não cria relógio, cadastro de alvos, campos persistidos ou rede.

Cobertura: **sete manobras no dano + Precisão + Aparar + Inspirar = 10/16**.
Faltam **seis**: **Ataque Estendido, Ataque de Finta, Ataque Trespassante,
Contra-Atacar, Golpe do Comandante e Passo Evasivo**. A contagem refere-se às
manobras, não à conclusão do livro. **R2 continua parcial**; R3/R4/R5/R6 mantêm
os limites das matrizes e o ciclo de importação real continua adiado por decisão
do responsável. Interação entre fichas não faz parte desta implementação.

Verificados **573 testes Node**, tipos/build e **seis roteiros Chromium**:
Inspirar, Aparar, Precisão, manobras, PV e 32 cenários das correções auditadas.
Incluem origens/dados/CAR, físico/virtual/OFF, cancelamento/concorrência, validação
antes do RNG, ficha/conta/permissão, desfazer sem alterar PV próprios ou aliados,
pool/inspiração, nós/foco/scroll, 320px/GG/temas/layouts, texto não confiável,
nomes longos, notas/histórico e offline /D-D/. A CI completa da PR #35 exige
47 roteiros e PostgreSQL descartável; resultados da revisão atual na PR.

### Décimo quarto recorte de R2: Passo Evasivo — 29/10/2026

**Implementado em desenvolvimento, sem publicação.** Livro local do Jogador
2014, p. 88 / PDF 87: gasta um dado ao se mover e soma a face à CA até parar.
Não exige ação bônus ou reação. O efeito não permanece por todo o turno nem
impede ataques de oportunidade; só aumenta a CA durante o movimento declarado.

- Botão junto de cada reserva vigente, para quem conhece a manobra. Face física
  em OFF/Só Pool/Auto ou um dado virtual normal, quando habilitado. Dados da classe
  e do Adepto Marcial usam as melhorias pelo nível próprio do Mestre de Batalha.
  Valida conhecimento, saldo/máximo, registro, face e declaração antes do RNG/gasto.
- Soma apenas a face à CA calculada ou escrita, junto dos demais bônus uma única
  vez. O controle ativo e **Terminei de me mover** aparecem junto à CA. A mesa
  declara a parada, mesmo dentro do mesmo turno; o aplicativo não infere distância,
  pausas, ataques ou turnos de uma rolagem. Não há duração automática por relógio.
- Uma ativação por vez entre as origens. Confirmar gasta um dado e registra o
  efeito num passo de desfazer. Encerrar não reembolsa; recomeçar exige novo dado.
  Cancelar/contexto inválido/cliques concorrentes não duplicam o gasto. Troca de
  ficha/conta/permissão é revalidada; pool, modo global e inspiração ficam intactos.
- Agarrado, impedido, atordoado, inconsciente, paralisado e petrificado encerram.
  Queda a 0 PV/morte, exaustão 5 e descanso também encerram. Remover a causa ou
  receber cura não retoma o bônus. Incapacitação isolada, cegueira, surdez e estar
  caído não impedem mover-se por si sós; medo/aproximação ficam com a mesa.
- A edição de CA atual desconta o bônus ao guardar o valor base, para não duplicá-lo
  nem torná-lo permanente. Edição de vida/deslocamento/classe encerra um efeito
  tornado indisponível; corrigir a causa não o retoma. Forma Selvagem continua
  manual; a ativação da forma pelo controle existente encerra o bônus humano.
- `ruleState.evasiveFootwork` é opcional e pequeno, com versão/origem/dado/face;
  preserva movimento declarado por recarga/offline e validação existente de JSON.
  Não muda contadores antigos. Registros ilegíveis/futuros ficam preservados, sem
  bônus ou nova ativação; não são descartados automaticamente em cura/descanso.

Cobertura: **11/16**. Faltam **cinco**: **Ataque Estendido, Ataque de Finta,
Ataque Trespassante, Contra-Atacar e Golpe do Comandante**. R2 e as demais etapas
permanecem parciais; alvos/turnos e interação entre fichas mantêm os limites da
matriz. Não houve SQL, nova consulta de nuvem, alteração de catálogos ou publicação.

Verificados **586 testes Node**, tipos/build e **oito roteiros Chromium**:
Passo Evasivo, regras, edição na ficha, Precisão, PV, dano, Aparar e Inspirar.
Incluem origens/dados/CA, físico/virtual/OFF, cancelamento/concorrência/contexto
antes do RNG, conta/permissão, gasto/encerrar/desfazer, quedas/condições/exaustão/
descanso sem retomada, CA escrita/deslocamento, pool/inspiração, nós/scroll,
320px/GG/três temas/dois layouts e notas/histórico/offline /D-D/. A CI da PR #35
exige 48 roteiros e PostgreSQL descartável; resultados atuais na PR.

### Décimo quinto recorte de R2: Ataque Estendido — 29/10/2026

**Implementado em desenvolvimento, sem publicação.** PHB 2014, Lunging Attack,
p. 74; livro local traduzido p. 88 / PDF 87. A tradução local diz “quando atingir”
ao introduzir o aumento de alcance e novamente condiciona o dano ao acerto;
isso torna o momento ambíguo. O controle segue o original de 2014: ao fazer um
ataque corpo a corpo com arma no próprio turno, gastar um dado para aumentar
o alcance desse ataque em 1,5 m; se acertar, somar o dado ao dano. Não usa ação
bônus, não é o Dash da revisão de 2024, nem amplia o alcance de magias.

- Marca compacta **Estendido · +1,5 m** nas armas corpo a corpo reconhecidas
  de quem conhece a manobra. Inclui armas de alcance e não exige proficiência.
  Arremesso, ataque próprio, desarmado e Forma Selvagem permanecem manuais neste
  controle; isso é limite da implementação, não proibição geral da regra.
- Marcar/cancelar não gastam, rolam ou salvam. Atq pede origem e declaração de
  ataque novo no próprio turno, ainda não rolado/resolvido e sem outra manobra.
  Gasta exatamente um dado antes do d20; o custo permanece se errar. Valida
  registros, fórmulas, contexto/conta/permissão e concorrência antes do gasto/RNG.
- No acerto confirmado, Dano soma o dado do tipo da arma e dobra os dados no
  crítico, sem novo gasto. Precisão e outra manobra ficam bloqueadas no mesmo
  ataque acompanhado, inclusive após Sortudo/halfling. Furtivo, Destruição e
  –5/+10 conservam parcelas/custos; repetições da arma preservam o dado da manobra.
- **Errou / encerrar ataque** termina o contexto sem reembolso. Outro ataque,
  mesmo com outra arma, descanso, troca de ficha/conta/modo, desfazer ou recarga
  descartam o contexto. Apenas o contador é persistido/restaurado por desfazer,
  sem recriar o ataque. A interface orienta
  resolver na mesa o dado já pago se perder o contexto. Não há turno/distância
  inferidos de uma jogada nem efeito aplicado a outro jogador.
- OFF/Só Pool não rolam o ataque/dano: registram alcance/gasto declarado e total
  físico final do acerto incluindo o dado. Usa reservas existentes da classe e
  do Adepto Marcial, com melhorias pelo nível próprio do Mestre de Batalha.

Cobertura: **12/16**. Faltam **quatro**: **Ataque de Finta, Ataque Trespassante,
Contra-Atacar e Golpe do Comandante**. R2 e as demais etapas continuam parciais.
Não houve SQL, nova consulta de nuvem, alteração de catálogos ou publicação.

Verificados **597 testes Node**, tipos/build e **oito roteiros Chromium**:
Estendido, Precisão, manobras, dano de arma, –5/+10, rerrolagens, dado e regras.
Incluem escolha antecipada, custo inclusive no erro, acerto/crítico, fonte do
talento, manobra isolada, Destruição/inspiração/Sortudos, físico/OFF/Só Pool,
cancelamento/concorrência/contexto/conta/permissão antes do gasto/RNG, outro ataque/
descanso/desfazer, nós/foco/scroll, 320px/GG/três temas/dois layouts e notas/
histórico/offline /D-D/. CI exige 49 roteiros e banco descartável; resultados
atuais na PR #35. A base `439c7cd` passou integralmente em
[PR](https://github.com/mhaetinger/D-D/actions/runs/40876232146) e
[push](https://github.com/mhaetinger/D-D/actions/runs/40876222084), sem publicação.

### Décimo sexto recorte de R2: Ataque de Finta — 29/10/2026

**Implementado em desenvolvimento, sem publicação.** Livro local do Jogador
2014, p. 88 / PDF 87, com a [errata oficial de Finta, p. 74](https://www.dndbeyond.com/sources/dnd/sae/players-handbook-2014):
ação bônus no próprio turno e um dado, escolhendo uma criatura a até 1,5 m.
Vantagem só no próximo ataque contra ela neste turno; se acertar, acrescenta o
dado à jogada de dano. Não é restrita a ataque corpo a corpo com arma.

- Fintar junto da reserva identifica o alvo e confirma turno/ação/distância;
  paga um dado sem rolar face antecipada. Mesmas reservas de classe/talento,
  máximos ajustados e melhorias por nível próprio. Erro/fim do turno sem ataque
  não devolvem o dado. Não paga outra vez em Usar na mesa.
- Em arma reconhecida com dano, marque Finta apenas ao atacar aquele alvo.
  Atq confirma o próximo ataque contra ele no mesmo turno, sem outra manobra.
  Ataques contra outras criaturas não consomem o crédito. Corpo a corpo,
  distância e arremesso não exigem proficiência para este benefício.
- Finta, modo informado e inspiração são reunidos antes de cancelar: desvantagem
  anula todas as vantagens; não produz vantagem por contar duas contra uma.
  Não muda o seletor global. A mesa informa sentidos/cobertura/proximidade de
  inimigos e confirma alvo/turno, sem inferência de uma rolagem.
- No acerto confirmado, Dano inclui o dado já pago, dobrado no crítico. Precisão
  e outra manobra ficam bloqueadas; Sortudo/halfling conservam sessão/modo.
  Furtivo, Destruição, –5/+10 e repetições restritas à arma mantêm seus contratos.
  OFF/Só Pool registram total físico, sem RNG nem gasto da inspiração preparada.
- **Resolver na mesa** usa o crédito para magia com ataque, ataque próprio/
  desarmado ou ataque sem jogada de dano. Não conjura, cobra espaço ou inventa
  dano para Rede. Resistências do alvo não recebem vantagem; em raios/feixes,
  só a primeira jogada contra ele usa Finta.
  Forma Selvagem continua manual pela capacidade física da forma. Estes são
  limites do controle, sem restringir a regra a armas corpo a corpo.
- Estado junto das armas distingue próximo ataque de ataque já feito. Encerrar/
  errar/fim do turno, outro ataque após aquele da Finta, descanso, troca de
  contexto, recarga ou desfazer descartam crédito/sessão. Apenas o contador é
  salvo/restaurado; descanso recupera normalmente. Se necessário, resolva na
  mesa um dado ainda pago. Sem relógio automático nem alteração de outro jogador.

Cobertura: **13/16**. Faltam **três**: **Ataque Trespassante, Contra-Atacar e
Golpe do Comandante**. R2 e as demais etapas continuam parciais. Sem campo novo
persistido, SQL, consulta de nuvem, edição de catálogo ou publicação.

Verificados **613 testes Node**, tipos/build e **dez roteiros Chromium**:
Finta, Estendido, Precisão, manobras, dano de arma, –5/+10, rerrolagens, dado,
modo da iniciativa e regras. Incluem origens/dados/erro/crítico, vantagem/
inspiração/desvantagem, próximo ataque por alvo, manual/OFF/Só Pool, cancelar/
concorrência/contexto/conta/permissão antes do gasto/RNG, descanso/desfazer/
recarga, texto não confiável, nós/foco/scroll, toque emulado/320px/GG/três temas/
dois layouts e notas/histórico/offline /D-D/. CI exige 50 roteiros e banco
descartável; resultados atuais na PR #35. A base `0eb3781` passou integralmente
em [PR](https://github.com/mhaetinger/D-D/actions/runs/40884267617) e
[push](https://github.com/mhaetinger/D-D/actions/runs/40884255663), sem publicação.

### Décimo sétimo recorte de R2: Ataque Trespassante — 29/10/2026

**Implementado em desenvolvimento, sem publicação.** Livro local do Jogador
2014, p. 88 / PDF 87: após acertar uma criatura corpo a corpo com arma, gasta um
dado para tentar causar dano a outra criatura a até 1,5 m da primeira e dentro
do alcance. Se a jogada original a atingiria, causa o número do dado, do tipo
do ataque original. O texto não exige turno próprio, ação bônus ou reação.

- Em **Adicionais** de arma reconhecida corpo a corpo com dano, Trespassante
  identifica a segunda criatura e pede confirmação de acerto/distâncias.
  Um seletor explícito informa se **a mesma jogada** atingiria a segunda CA;
  não faz outro ataque nem usa o último resultado da bandeja como prova.
- A segunda criatura recebe **somente um dado de superioridade**, separado do
  dano principal. Aplicamos a quantidade explícita do texto, inclusive quando
  o alvo original sofre crítico: sem dados extras de crítico, modificador,
  Furtivo, Destruição, dados raciais ou –5/+10 no segundo alvo. Não acrescenta
  o dado ao dano do primeiro. Repetições da arma não alteram o secundário.
- Uma tentativa gasta um único dado da origem escolhida, inclusive se a jogada
  não atingiria a segunda criatura; nesse caso, registra zero sem RNG secundário.
  Classe/talento conservam contadores/d6/d8/melhorias/máximos e recuperação.
- Auto Ficha permite virtual ou físico; OFF/Só Pool registram o total principal
  e, quando atingiria, a face secundária separadamente. A bandeja exibe o total
  principal com o secundário identificado na legenda; histórico local guarda
  custo e ambos os resultados num único passo. Inspiração/pool/modo não mudam.
- A escolha única de manobra bloqueia combinação com Precisão, Estendido ou
  Finta já ligados ao ataque. Revalida documento/conta/permissão/arma/nó/
  preparação e modo/sequência dos dados antes de RNG/custo. Prévia e cancelar
  são puros; usos ilegíveis/esgotados ficam preservados.
- Ataques personalizados e Forma Selvagem continuam na mesa; distância,
  arremesso e Rede sem dano não recebem este controle. São limites explícitos
  da integração. Não exige proficiência adicional nem controla o turno/alcance.
  Aplicação de dano/defesas na segunda criatura continua com a mesa, sem alterar
  outra ficha. Descanso e desfazer/refazer preservam os contratos do contador.

Cobertura: **14/16**. Faltam **duas**: **Contra-Atacar e Golpe do Comandante**.
R2 e as demais etapas continuam parciais. Sem campo persistido novo, SQL,
consulta/sincronização de nuvem, edição de catálogo ou publicação.

Verificados **624 testes Node**, tipos/build e **dez roteiros Chromium**:
Trespassante, Finta, Estendido, Precisão, manobras, dano de arma, –5/+10,
repetições, dado e regras. Cobrem dano separado/crítico/Destruição, origens/
tentativa sem atingir, físico/virtual/OFF/Só Pool, validação antes do RNG/gasto,
contexto/conta/permissão, desfazer/notas/histórico, nós/foco/XSS, toque emulado/
320px/GG/três temas/dois layouts/scroll, nome longo na legenda virtual sem
alargar a bandeja do dado e offline real sob `/D-D/`. CI exige
agora 51 roteiros e PostgreSQL descartável; resultados atuais na PR #35.
A base `5b0d48b` passou com 613 testes,
banco/build e 50 roteiros em [push](https://github.com/mhaetinger/D-D/actions/runs/40911433089)
e na [segunda tentativa da PR](https://github.com/mhaetinger/D-D/actions/runs/40911445630).
A primeira tentativa da PR apresentou timeout no leitor após PDF 404/repetição
(`tests/library-browser.cjs:114`); a reprodução local e a repetição completa
passaram. Causa não estabelecida; leitor e timeout não foram alterados.

### Décimo oitavo recorte de R2: Contra-Atacar — 29/10/2026

**Implementado em desenvolvimento, sem publicação.** Livro local do Jogador
2014, p. 88 / PDF 87. Após uma criatura errar um ataque corpo a corpo contra
você, reação e um dado concedem um ataque corpo a corpo com arma contra ela;
no acerto, o dado soma ao dano. O [Sage Advice oficial de 2014](https://www.dndbeyond.com/sources/dnd/sac/sage-advice-compendium)
confirma a resposta a um ataque de oportunidade que errou e exclui agarrão/
empurrão, pois não resultam em acerto/erro de uma jogada de ataque.

- **Contra-atacar**, junto da arma reconhecida corpo a corpo com dano, identifica
  a criatura que errou e pede confirmar gatilho, reação disponível, alcance e
  ataque novo contra ela sem outra manobra. Não exige turno próprio,
  proficiência ou ação bônus. O ataque que errou pode ser corpo a corpo com
  magia; não amplia o gatilho para ataques à distância ou resistências.
- Paga um dado antes de rolar o ataque, mesmo se errar. Não rola a face do dado
  de superioridade antes de saber o acerto. Só um contra-ataque pago pendente
  entre armas/origens; isso evita repetição de cobrança, sem inventar contador
  de reação por rodada. Gatilho/reação/alcance/identidade seguem na mesa.
- No acerto confirmado em **Dano**, inclui o dado já pago, do tipo da arma,
  dobrado no crítico e sem novo gasto. Precisão, Trespassante e outra manobra
  ficam bloqueados nesse ataque. Estendido/Finta marcados não se combinam;
  Finta pendente com mesma identificação textual também é recusada. Uma reação
  contra outra criatura não consome a Finta ainda não usada.
- É um único ataque com reação, **não ação Atacar ou ataque de oportunidade**;
  não dispara Ataque Extra. Não concede vantagem por si. Modo/inspiração e
  Sortudo/halfling preservam o contexto; Furtivo por turno, Destruição, –5/+10
  e repetições limitadas aos dados da arma mantêm seus contratos.
- Auto Ficha usa o d20 normal e o dano virtual ou físico; OFF/Só Pool registram
  ataque/total físicos, sem RNG ou gasto de inspiração preparada. Armas próprias/
  desarmado e Forma Selvagem continuam na mesa; distância, arremesso e Rede sem
  dano não recebem este controle. São limites de integração, não novas regras.
- Errou/encerrar, outro ataque, descanso, troca de contexto, recarga e desfazer
  descartam a sessão sem reembolso; somente o contador é salvo/restaurado.
  Descanso recupera normalmente. Se perdeu a sessão com dado já pago, resolva
  o restante na mesa. Remover/substituir arma não trava novas reações declaradas.
  Revalida documento/conta/permissão/arma/nó/preparação/modo/sequência antes do
  RNG/custo. Prévia/cancelamento são puros; registros ilegíveis ficam preservados.

Cobertura: **15/16**. Falta **Golpe do Comandante**. R2 e as demais etapas
continuam parciais. Sem campo persistido novo, alteração de outra ficha, SQL,
consulta/sincronização de nuvem, edição de catálogo ou publicação.

A base `a6d118a` passou com **624 testes**, banco/build e **51 roteiros** em
[push](https://github.com/mhaetinger/D-D/actions/runs/40921500531) e
[PR](https://github.com/mhaetinger/D-D/actions/runs/40921509554), sem publicação.
Verificados **637 testes Node**, tipos/build e **onze roteiros Chromium**:
Contra-Atacar, Trespassante, Finta, Estendido, Precisão, manobras, dano de arma,
–5/+10, repetições, dado e regras. Incluem custo antecipado/erro/crítico,
origens/Sortudos/modos/inspiração, físico/virtual/OFF/Só Pool, validação antes do
RNG/gasto, concorrência/contexto/conta/permissão, descanso/desfazer/recarga,
notas/histórico/XSS/nós/foco, toque emulado/320px/GG/três temas/dois layouts/
scroll e offline real sob `/D-D/`. CI exige agora 52 roteiros e PostgreSQL
descartável; resultados atuais na PR #35.

### Décimo nono recorte de R2: Golpe do Comandante — 29/10/2026

**Em desenvolvimento na PR #35, sem publicação.** Fonte: Livro do Jogador
2014, p. 88 impressa / PDF 87. Na ação Atacar do próprio turno, o comandante
cede **um ataque**, usa ação bônus e gasta um dado. Uma criatura amigável que
possa **ver OU ouvir o comandante** pode usar sua própria reação imediatamente
para **um ataque com arma**, corpo a corpo ou à distância, somando o dado ao
dano. Não exige Ataque Extra, arma/reação do comandante ou distância arbitrária.
A decisão/reação/arma/alvo/alcance/defesas e demais recursos do aliado ficam na
mesa. O custo antecede a decisão e o ataque: erro ou recusa não reembolsam.

- **Comandar ataque** junto de cada origem vigente só aparece com a manobra
  conhecida. Valida conhecimento, condição, origem, saldo inteiro legível e as
  declarações antes de gastar. Forma Selvagem permanece manual. Cancelar não
  gasta; ficha/contexto/conta/permissão/nó/modo/sequência alterados invalidam a
  confirmação antes do custo ou RNG. Uma trava evita emissões concorrentes.
- Uma ordem paga por ficha, entre todas as origens, captura aliado e tipo do
  dado vigente da classe/talento. **Registrar ataque do aliado** não rola ataque
  ou arma: registra somente o dado adicional já pago, com confirmação de reação
  imediata, acerto e dado ainda não incluído. Crítico usa duas faces do mesmo
  dado; não gasta duas vezes. Erro, recusa ou **Já resolvido na mesa / encerrar**
  descartam a ordem sem RNG/reembolso. Faces inválidas preservam a ordem paga.
- Reutiliza físico/virtual e diálogo existentes. OFF registra faces físicas;
  Só Pool começa no físico e permite escolher explicitamente o virtual normal.
  Não usa pool, vantagem/desvantagem, inspiração, arma, CAR, crítico preparado,
  –5/+10 ou adicionais do comandante. Seus ataques/Finta são independentes.
  O aliado comunica o bônus à mesa, sem aplicação automática de PV ou proibição
  inventada dos recursos próprios dele. Ataque Furtivo elegível pode ocorrer em
  outro turno; isso não é resolvido nesta ficha ([Sage Advice oficial](https://www.dndbeyond.com/sources/dnd/sac/sage-advice-compendium)).
- Ordem e faces não ganham campos no documento; só o contador e os textos de
  resultado no histórico local são salvos. Descanso e troca global de contexto
  encerram; recarga, troca de personagem/conta, desfazer/refazer não recriam a ordem. Recuperação em descanso
  segue normal. Após emitir, registrar o resultado não exige consciência contínua
  do comandante. A reação imediata é declarada na mesa: não há relógio de turno,
  nem inferência de cronologia pelas outras rolagens da interface.
- Campos conservam nós/foco; nomes são dados escapados, com quebra em 320 px/GG.
  Sem campo novo no documento, SQL, catálogo alterado ou consulta de nuvem.
  **Não há interação entre fichas**: identidade/permissões/valores do aliado não
  são buscados e nenhuma outra ficha é alterada.

Cobertura: **16/16 manobras com controles nos limites de cada recorte**: sete
no dano, Precisão, Aparar, Inspirar, Passo Evasivo, Estendido, Finta, Trespassante,
Contra-Atacar e Golpe do Comandante. Isso não conclui R2 nem automatiza combate
ou o livro inteiro. Outros talentos/estilos e contextos de elemento/efeito ainda
manuais permanecem nas matrizes de R2/R5; R3/R4/R6 continuam parciais.

A base `179514a` passou integralmente em [PR](https://github.com/mhaetinger/D-D/actions/runs/40925806801)
e [push](https://github.com/mhaetinger/D-D/actions/runs/40925797079): 637 testes
Node, dependências, PostgreSQL descartável, tipos/build e 52 roteiros de navegador.
Verificação local deste avanço: **650 testes Node**, tipos/build e **doze roteiros
Chromium**: Comandante, Inspirar, Passo Evasivo, Aparar, manobras, Precisão,
Estendido, Finta, Contra-Atacar, Trespassante, dado e regras. Cobrem prévia/custo
antecipado/origens/acerto/crítico/erro/recusa, físico/virtual/OFF/Só Pool, ausência
de bônus/preparações do comandante, cancelamento/concorrência/validação antes de
RNG, conta/permissão/contexto, descanso/desfazer/refazer/recarga, notas/histórico,
XSS/nós/foco, toque/320px/GG/três temas/dois layouts/scroll e offline real sob
`/D-D/`. CI exige agora **53 roteiros** e banco descartável; estado remoto na PR #35.
Evidências locais em `~/.local/state/critcall/audits/2026-10-29-golpe-comandante/`.

### Vigésimo recorte de R2: lote de combate e janelas — 29/10/2026

**Em desenvolvimento na PR #35, sem publicação.** Inclui avanço delimitado de
R3/R6; não cria acompanhamento de turnos, identidade de alvo ou interação entre
fichas. Fontes: Livro do Jogador 2014, Fúria p. 48/PDF 47; Força Indomável
p. 49/PDF 48; Duelista Defensivo p. 169/PDF 168; Maestria em Armadura Média e
Líder Inspirador p. 170/PDF 169; equipamento/condições no catálogo autorizado.

| Operação | Aplicação neste lote | Limite que permanece na mesa |
| --- | --- | --- |
| Fontes da jogada | Auto Ficha reúne todas as vantagens/desvantagens próprias antes de cancelar, incluindo modo informado, Finta e inspiração; resultado explica fontes, capturadas para Sortudo | Fontes do alvo, sentidos especiais, medo à vista e luz solar não são presumidos |
| Condições/exaustão | Veneno: testes/ataques, não resistências; caído/cego: ataques; impedido: ataques e resistência de DES; invisível: vantagem em ataque, com exceções informadas; exaustão conforme tipo da jogada | Ataques contra você, alcance, sentidos, falhas por depender só de visão/audição e imunidades contextuais |
| Equipamento | Armadura/escudo sem proficiência: jogadas de FOR/DES; Furtividade: metadado do catálogo; Maestria remove apenas penalidade da armadura média; arma pesada: desvantagem para raça Pequena reconhecida | Equipamento desconhecido e estatísticas da forma; arma manual sem habilidade conhecida não a recebe por adivinhação |
| Fúria e Força Indomável | Fúria sem armadura pesada: vantagem nos testes/resistências de FOR. Bárbaro 18: total de teste de FOR no mínimo igual ao valor de FOR, sem mudar natural; Sortudo recompõe com o mesmo perfil | Não transfere valores humanos à forma; não concede vantagem a ataques por estar em Fúria |
| Passivos | Percepção/Investigação usam ±5 do contexto conhecido, conservando Observador/bônus manuais | Sem modo global/inspiração; contexto do ambiente continua informado na mesa |
| Duelista Defensivo | Junto da CA, confirma reação/acerto corpo a corpo e arma de acuidade proficiente empunhada; +proficiência só neste ataque. Igualdade continua acertando; crítico não erra por CA | Reação disponível declarada; não modifica CA permanente nem resolve/aplica dano |
| Líder Inspirador | Na característica, calcula nível total + CAR para 1–6 participantes incluindo você; 10 min, 9 m, amizade/comunicação e descanso de cada destinatário confirmados. Escolha explícita de manter/substituir seus temporários | Cada criatura aplica o benefício e confere o próprio descanso desde qualquer líder; sem contador diário inventado nem alteração de outras fichas |

Os talentos validam pré-requisitos vigentes e capacidade de agir. Confirmações
usam guarda de documento/identidade/conta/permissão/nó e trava; cancelar ou ficar
obsoleto não aplica o resultado. Nomes/identificações são dados; campos conservam
nós/foco. Temp próprios substituídos podem ser desfeitos sem tocar PV, outras
fichas ou notas. Sem campo persistido novo, SQL ou consulta de nuvem.

**Falha da CI investigada:** ambos os runs de `d3e2e99`
([PR](https://github.com/mhaetinger/D-D/actions/runs/40938704050),
[push](https://github.com/mhaetinger/D-D/actions/runs/40938695433)) passaram Node,
banco e build, mas falharam na posição da página em `rally-browser.cjs:67`.
A rodinha era cancelada; a ancoragem automática movia a ficha após mudanças de
altura/fonte atrás do diálogo. Reprodução local falhou também e uma sonda de
+97 px reproduziu exatamente o deslocamento. CSS desativa a ancoragem só com
diálogo aberto. A comparação de posição continua exata, com a sonda na regressão;
body/rodinha compartilhada não foram bloqueados ou reescritos. Testes aguardam
fontes/transições reais de tema antes de medir; a sonda força a mudança posterior
com a janela aberta e ainda exige a mesma posição exata. A contraprova posterior,
com `overflow-anchor:auto !important`, falhou exatamente em 97 px mesmo após
aguardar as fontes/transições, isolando o efeito da correção.

As fixtures de Finta/Precisão usam arco curto para isolar a manobra da nova
penalidade de arma pesada no halfling. Contra-Atacar e Estendido mantêm a
alabarda e conferem os dois d20 esperados; a penalidade também tem testes
próprios neste lote. Não foi relaxado o contrato de manobras/Sortudo.

Verificados **665 testes Node**, tipos/build e **12 roteiros Chromium**: lote de
combate, Inspirar, Finta, Precisão, rolagens condicionais, passivos, iniciativa,
Contra-Atacar, Estendido, ataque de magia, Sortudo e dado. Incluem físico/virtual/
OFF/Só Pool, natural/mínimo/Sortudo, fontes antes do cancelamento, prévias,
crítico/CA/temporários, cancelamento/concorrência/conta/permissão/nós/foco,
notas/histórico/desfazer/isolamento, toque/320px/GG/três temas/dois layouts/scroll/
XSS e offline real sob `/D-D/`. Contraprova com ancoragem antiga forçada falhou
exatamente em +97 px; com a correção passou. A CI completa exige **54 roteiros**
e PostgreSQL descartável; resultado remoto na PR #35.

**Pendências:** as manobras continuam 16/16 nos limites já descritos. R2/R3/R4/R5/R6
permanecem parciais: demais talentos/reações, formas/criaturas, invocações/efeitos
de magias, equipamento e ciclo com PDFs reais seguem nas matrizes. Resoluções
narrativas ou dependentes do Mestre podem permanecer manuais; não são novos
botões obrigatórios. Próximos avanços devem agrupar operações/módulos, em vez de
exigir uma nova autorização para cada característica isolada.

### Vigésimo primeiro recorte de R2: apoio e recursos — 29/10/2026

**Em desenvolvimento na PR #35, sem publicação.** Avança Curandeiro, bardo e
kits na ficha individual. Fontes: Livro do Jogador 2014, Curandeiro p. 169/PDF
168; kit p. 154/PDF 153; Inspiração de Bardo p. 53/PDF 52; Palavras de Interrupção
e Inspiração em Combate p. 54/PDF 53. A conferência complementar no
[Sage Advice Compendium 2014](https://www.dndbeyond.com/sources/dnd/sac/sage-advice-compendium)
explicita que Interrupção pode reduzir dano rolado de magia e que o dado de
dano da Inspiração em Combate é duplicado no crítico.

| Operação | Aplicação neste lote | Limite na mesa |
| --- | --- | --- |
| Curandeiro · tratamento | Ação, 1 uso do kit, 1d6 + 4 + DV máximos do destinatário; não gasta DV. Próprio: soma níveis e aplica cura até máximo vigente; outro: informa DV, calcula sem editar ficha alheia | Acesso à criatura, ação e descanso curto/longo desde tratamento de qualquer Curandeiro |
| Curandeiro · estabilização | 1 uso do kit, fixa 1 PV para criatura viva morrendo a 0 PV; não rola d6. Exige declaração separada de elegibilidade por tratamentos/descansos | O texto limita nova cura pelo talento após tratamento. Não certifica repetição ilimitada de 1 PV; a mesa confere esse caso e ações especiais como Mãos Rápidas |
| Kit/loja | Saldo opcional de usos da pilha, não presume kit importado cheio. Compra acrescenta dez só a saldo conhecido; kit novo tem dez. Zero não remove item. Corrigidas funções ausentes de saldo/pagamento da loja; troco conserva valor | Kits escritos com outro nome/edição de quantidade exigem conferência; saldo ilegível bloqueia e permanece preservado |
| Conceder inspiração | Outro destinatário, ação bônus declarada, dado pelo nível próprio de bardo; gasta reserva existente uma vez sem rolar | Até 18 m, ouvir, não acumular, prazo de dez minutos e registro pelo destinatário |
| Palavras de Interrupção | Conhecimento 3+, reação, 1 dado físico/virtual descontado da mesma reserva. Reduz ataque, teste ou dano já rolado; dano mínimo zero; não afeta resistências nem cancela crítico natural | Ver criatura até 18 m, ouvir, não ser imune a encantamento e momento anterior à resolução/dano; não aplica efeito em outra ficha |
| Dado recebido | Um registro separado da inspiração de vantagem, com fonte/dado/Bravura. Soma dado a total de teste/ataque/resistência informado e consome mesmo sem mudar resultado | Prazo e momento declarados; sem recomposição automática do d20 da bandeja ou comunicação entre fichas |
| Bravura recebida | Também soma ao dano de arma, dois dados em crítico; ou CA só contra um ataque, reação declarada. Não muda CA permanente nem aplica dano | Confirmação da origem, tipo da jogada e reação; crítico ainda acerta |

Prévia/cancelamento não gastam nem rolam. Antes do primeiro RNG, revalida
ficha/conta/permissão/nó/modos/sequência. Origem física/virtual reutiliza controles
comuns, sem herdar vantagem, pool ou inspiração de d20. Descanso encerra apenas
registro recebido legível; não reabastece kits. Backups/histórico preservam os
campos opcionais e formatos futuros sem nova consulta de nuvem ou SQL.

**CI anterior e estabilidade:** `2409a39` passou integralmente no
[push](https://github.com/mhaetinger/D-D/actions/runs/40956324664), com 665 testes,
banco, build e 54 roteiros. Na [PR](https://github.com/mhaetinger/D-D/actions/runs/40956331369),
Inspirar passou; o último roteiro mediu 7 px de diferença com a folha ainda
encolhendo. O auxiliar esperava a fonte mas não as animações de altura iniciadas
pelo ResizeObserver. Agora espera ambas, mantendo comparação exata/sonda de
97 px e contenção de rodinha. Três repetições locais do lote de combate passaram.

**Verificação deste lote:** 690 testes Node, tipos/build e seis roteiros
Chromium: apoio, PV, recursos/regras, Inspirar, lote de combate e dado. Incluem
saldo antigo/compra/troco/DV máximos, reserva única, Interrupção, recebido/Bravura/
crítico/CA, físico/virtual/OFF/Só Pool, cancelamento/guardas antes do RNG,
documento/conta/permissão/modo/nós, desfazer/notas/isolamento, formatos futuros/
backups, 320px/GG/três temas/dois layouts/toque/scroll/XSS e recarga offline real
sob `/D-D/`. A suíte remota passa a exigir 55 roteiros e PostgreSQL descartável;
resultado remoto na PR #35. Evidências locais fora do repositório:
`~/.local/state/critcall/audits/2026-10-29-apoio-combate/`.

R2/R3/R4/R5/R6 continuam parciais. Não conclui os demais recursos de bardo,
todos os consumíveis ou a revisão de magias/importação.

### Vigésimo segundo recorte de R2: núcleo de combate do monge — 29/10/2026

**Em desenvolvimento na PR #35, sem publicação.** Fontes: Livro do Jogador
2014, Artes Marciais/Chi/Defletir/Queda Lenta p. 104/PDF 103; Atordoante,
Mente Tranquila, Pureza Corporal/Corpo Vazio e Alma de Diamante p. 105/PDF 104;
Especialista em Briga p. 169/PDF 168; tabela do
monge no catálogo de progressão. Conferência complementar no
[Sage Advice Compendium 2014](https://www.dndbeyond.com/sources/dnd/sac/sage-advice-compendium):
golpe desarmado é ataque corpo a corpo com arma para Atordoante, mas não arma
física para Destruição/Atacante Bestial. Projétil devolvido conta como arma de
monge e permite seu dano próprio ou Artes Marciais elegível.

| Operação | Cobertura deste lote | Limite na mesa |
| --- | --- | --- |
| Golpe desarmado/Artes Marciais | Vínculo explícito no editor comum; cadastro pela característica com cadeado aberto. FOR/1 normal, DES/dado de monge sem armadura/escudo, d4/d6/d8/d10 pelo nível próprio, proficiência, crítico e mínimo zero. Briga usa d4 quando aplicável. Golpes de Chi indicam propriedade mágica sem bônus numérico | Armas empunhadas, ação Atacar/ataque bônus e mãos; ataques/estatísticas da forma; nomes livres/manuais não são homologados |
| Ataque Atordoante | Monge 5, acerto corpo a corpo reconhecido, inclusive desarmado, CD 8 + SAB + proficiência e 1 Chi compartilhado. Não exige arma de monge ou ausência de armadura; não impõe limite de uma tentativa por turno de 2024 | Cada acerto só dispara sua tentativa declarada; resistência, imunidade e atordoamento do alvo até o fim do próximo turno |
| Defletir Projéteis/Queda Lenta | No dano detalhado, reação declarada, redução única por ocorrência: d10 + DES + nível ou 5 × nível. Sem Chi. Proteção antes; redução antes de resistência/vulnerabilidade. Ordem com armadura explícita. Magia de ataque não é projétil de arma | Origem à distância/queda e reação. Apanhar só se a deflexão zerar antes de resistência e com mão/tamanho adequados |
| Devolução do projétil | Operação declarada na mesma reação; 1 Chi salvo antes do ataque proficiente, mesmo no erro. Dados próprios informados do projétil ou dado de Artes Marciais elegível. Acerto/crítico físico ou virtual, modificador uma vez, sem novo custo | Captura anterior pode ter sido resolvida na mesa; não infere arma pelo dano recebido. Alcance 6/18 m, modo/alcance longo, habilidade de arremesso e acerto são conferidos. Escolhas adicionais de d20 ficam na mesa |
| Mente Tranquila/Pureza/Corpo Vazio | Ação para encerrar um efeito próprio de encanto/medo, sem Chi; só retira marca por declaração de último efeito. Pureza impede envenenado preservando registro antigo. Corpo Vazio deriva invisibilidade nas jogadas, além das defesas existentes | Efeito que controla ações pode impedir Mente Tranquila; doença não tem cadastro próprio. Fim das durações continua declarado |
| Alma de Diamante | 1 Chi para refazer resistência, nova jogada obrigatória, sem exigir ação/consciência. Proficiência já existia, inclusive na morte. Preparação opcional em concentração/morte oferece repetição só na falha e antes de aplicá-la; não duplica contagens/fila/inspiração. Cancelar mantém original sem custo | Resistências comuns informam tipo/CD/bônus/modo original antes de aplicar efeitos; outros efeitos de escolha/repetição de dados ficam na mesa |

Pendência de dano da devolução é transitória e vinculada ao snapshot: alterar,
recarregar, trocar contexto/modo, descansar ou desfazer não a recria; custo
persiste no histórico. Cancelar registro de dano mantém a pendência vigente.
Prévia/cancelamento antes da confirmação não gastam nem rolam. Guardas conferem
ficha/conta/permissão/nó/modos antes de custo/RNG. Sem SQL, nova consulta de nuvem,
edição de catálogo gerado ou fichas pessoais.

**Base anterior aprovada integralmente:** `0506cb9`, 690 testes, dependências,
banco descartável, build e 55 roteiros em ambos os runs:
[PR](https://github.com/mhaetinger/D-D/actions/runs/40962532204) e
[push](https://github.com/mhaetinger/D-D/actions/runs/40962525202).

**Verificação deste lote:** 711 testes Node, tipos/build e nove roteiros Chromium:
monge, PV, concentração, dano/defesas, editor de armas, dano de armas, Aparar,
rolagens condicionais e apoio. Incluem físico/virtual/OFF/Só Pool, custos/prévias/
cancelamento, guarda de contexto antes do RNG, repetição obrigatória sem duplicar
morte/concentração, dano mínimo/crítico, reserva única, condições preservadas,
nós/desfazer/isolamento/notas, 320px/GG/três temas/dois layouts/toque/scroll/XSS
e offline real sob `/D-D/`. Após explicitar a ordem de reduções no resumo,
monge e dano/defesas foram repetidos. A suíte completa exige 56 roteiros e banco
descartável na CI; resultado remoto na PR #35. Evidências locais fora do projeto:
`~/.local/state/critcall/audits/2026-10-29-combate-monge/`.

R2/R3/R4/R5/R6 permanecem parciais. O lote não certifica todas as subclasses do
monge, efeitos das disciplinas, economia de ações/turnos ou imunidades de todas
as classes. Rajada/Defesa Paciente/Passo do Vento mantêm a reserva comum e regras
consultáveis; efeitos condicionais não integram um controlador de turnos.

### Vigésimo terceiro recorte de R2/R3: defesas e resistências condicionais — 30/10/2026

**Em desenvolvimento na PR #35, sem publicação.** Fontes: Livro do Jogador
2014, Resiliência Anã p. 20, Ancestral Feérico pp. 23/39, Bravura/Resiliência
dos Robustos p. 28, Esperteza Gnômica p. 37, Sentido de Perigo/Fúria
Inconsciente pp. 48–49, Defesa Sedutora p. 60, Proteção Natural p. 76,
Resistência à Magia p. 98, auras pp. 111–113, Mestre de Escudo p. 171 e
Matador de Conjuradores p. 170. O [Sage Advice oficial de 2014](https://www.dndbeyond.com/sources/dnd/sac/sage-advice-compendium)
confirma que Devoção pode suspender encanto sem encerrar o efeito de origem.

| Operação | Cobertura deste lote | Limite na mesa |
| --- | --- | --- |
| Resistência com contexto | Assistente único junto das defesas de combate, com atributo, efeito e origem para uma jogada; físico/virtual, bônus base, escudo separado, ajuste e CD opcional. Reúne fontes próprias/modo/inspiração e cancela vantagem/desvantagem uma vez; 1/20 não são automáticos | Selecionar o efeito e sua fonte; face física final. Sortudo e demais rerrolagens são resolvidos na mesa neste assistente; botões de resistência comuns mantêm seu comportamento anterior |
| Fontes raciais | Anões/robustos contra veneno; halflings contra medo; elfos/meio-elfo contra encanto e sono mágico; gnomos em INT/SAB/CAR contra magia. Corrigida resistência a dano de veneno do robusto, antes ausente inclusive no teste antigo | Sono natural e inconsciência por dano não são sono mágico. Não transforma imunidade ao veneno em imunidade a todo efeito composto |
| Sentido de Perigo/Abjuração/talento | DES com efeito visto e bárbaro capaz, sem cegueira/surdez; Abjuração 14 contra magia conjurada; Matador contra magia de conjurador a até 1,5 m | Visibilidade, distância e natureza da magia declaradas. Concentração por dano não é resistência contra a magia causadora |
| Imunidades próprias | Fúria Inconsciente em Furioso 6, Coragem 10, Devoção 7, Defesa Sedutora 10 e veneno de Terra 10/Pureza 10. Impedem novas marcas e suspendem os efeitos de registros antigos sem apagá-los; ação explícita permite encerrar registro antigo, com desfazer | Duração/origem na mesa. Terra só impede encanto/medo de fada/elemental declarado no assistente; a marca geral não conhece essa fonte. Reação de Defesa Sedutora não é automática |
| Auras próprias | Proteção usa nível próprio/CAR mínimo +1 e consciência; Coragem/Devoção também exigem consciência, sem confundir incapacitação com inconsciência. Vigilância dos Anciões resiste dano de magias conjuradas e não herda requisito de consciência ausente de seu texto | Aliados, alcance e auras recebidas continuam manuais. Vigilância não resiste todo dano mágico e não divide duas vezes com outra resistência |
| Mestre de Escudo | Bônus próprio, inclusive magia do escudo, só em DES com alvo exclusivo no assistente. Reação declarada evita dano no sucesso de DES para metade, inclusive área; não absorve Proteção Arcana nem enfileira concentração com zero. Falha não ganha metade; Evasão já zera sem reação | Empunhar escudo e reação disponível. Empurrão após ação Atacar continua manual; escudo não dá seu bônus contra área e Escudo Arcano não é bônus deste equipamento |

Cancelamento, contexto vencido, perda de permissão ou dados inválidos não rolam
nem gastam. Imunidade/falha automática não consomem inspiração. A janela reutiliza
controles de dados/rolagem, guarda ficha/conta/permissão/nó/modo/sequência e conserva
pool, foco e nós ao selecionar. Forma Selvagem continua na mesa. Sem SQL,
consulta de nuvem, alteração de catálogo gerado ou dados pessoais.

**Base aprovada integralmente:** `8c71885`, 711 testes, dependências, PostgreSQL
descartável, build e 56 roteiros em ambos os runs:
[PR](https://github.com/mhaetinger/D-D/actions/runs/40969589645) e
[push](https://github.com/mhaetinger/D-D/actions/runs/40969582004).

**Verificação local:** 733 testes Node, tipos/build e nove roteiros Chromium
aprovados: defesas, monge, PV, dano, concentração, rolagens condicionais, Aparar,
lote de combate e consulta de características. Incluem fonte/alvo exclusivo/área,
imunidades sem gasto, marcas antigas/encerramento explícito/desfazer, guardas antes
do RNG, dados físicos/virtuais/OFF/Só Pool, pool/inspiração, nós/foco/rodinha,
320px/GG/três temas/dois layouts/toque e offline real sob `/D-D/`. A consulta
contextual foi repetida após ajustar foco inicial para o topo no celular.
Evidências em `~/.local/state/critcall/audits/2026-10-30-defesas/`.
A suíte remota passa a exigir 57 roteiros. R2/R3/R4/R5/R6 continuam parciais;
não certifica todas as condições, todas as auras ou decisões de alvos/turnos.

### Vigésimo quarto recorte de R2/R3/R6: ações e disputas de combate — 30/10/2026

**Em desenvolvimento na PR #35, sem publicação.** Fontes: Livro do Jogador
2014, talentos pp. 169–172 (PDFs 168–171), ataques especiais p. 195/PDF 194,
Artes Marciais p. 104/PDF 103; [errata oficial de 2014](https://media.wizards.com/2021/dnd/downloads/PH-Errata.pdf)
para Maestria em Arma de Haste e [Sage Advice Compendium 2014](https://www.dndbeyond.com/sources/dnd/sac/sage-advice-compendium)
para mão livre/munição, ataque com a própria besta, proximidade em magia,
Disparada do próprio personagem e reação de Sentinela depois do ataque.

| Operação | Cobertura deste lote | Limite na mesa |
| --- | --- | --- |
| Ação / reação | Uma preparação de arma automática por personagem/acerto. Usa o d20 comum em Auto Ficha ou prepara ataque físico; crítico, adicionais e dano usam o fluxo existente. Sem editar fórmula/tipo/ataque cadastrados | Ação bônus/reação, alcance, momento/gatilho e acerto declarados. Não implementa relógio de turnos nem permite outra reação automaticamente |
| Haste | Cabo d4 de concussão; habilidade/magia elegíveis, modificador normal em ataque bônus, crítico/Brutal/meio-orc do dado efetivo, Destruição e repetições comuns. Lança entra pela errata; lança longa só tem oportunidade. Artes Marciais pode ser escolhida quando elegível | Ataques anteriores somente com armas elegíveis, empunhar a arma e alcance de entrada. Não cria bônus numérico por arma mágica de monge |
| Besta | Ataque bônus apenas para besta de mão, depois de Atacar com arma de uma mão; não requer uma segunda besta. Escudo impede mão livre nesse fluxo. Contexto retira desvantagem exclusivamente pela proximidade com Especialista, inclusive em magia; preserva outras desvantagens | Munição/mão livre, proficiência para ignorar recarga e ataque anterior declarados. Contagem de disparos/munição continua manual |
| Investida / Armas Grandes | Ataque bônus após a própria Disparada; +5 no dano só com 3 m em linha reta, uma vez também no crítico. Armas Grandes admite bônus após gatilho declarado, sem exigir arma pesada para essa parte | Gatilho não é inferido de PV de outra criatura. Sem nova aplicação de –5/+10 ou golpe extra automático |
| Sentinela | Oportunidade na saída, mesmo com Desengajar, ou reação após ataque contra outro alvo sem o talento. Oportunidade de Sentinela/haste informa deslocamento zero até fim do turno ao acertar; ataque contra terceiro não ganha esse efeito | Visão quando exigida, movimento válido, alcance/reação. Não ignora Mobilidade ou outros meios de evitar oportunidade; aplica movimento no alvo na mesa |
| Imobilizador / disputas | Contexto de vantagem contra alvo agarrado por você, também em magia; disputa própria de Atletismo para agarrar, empurrar/derrubar ou imobilizar com ação inteira. Oponente pode informar Atletismo/Acrobacia final; empate mantém o estado. Escudo e Investida têm empurrões bônus distintos | Mão, tamanho/alcance e agarre prévio. Imobilizar informa ambos impedidos; não escreve marca sem fonte em outra ficha ou apaga impedimentos antigos. Agarrar/empurrar são testes, não ataques contra CA ou resistências |
| Teste próprio | Proficiência/especialização ou total manual, Confiável, Fúria/exaustão/inspiração e Força Indomável aplicados na ordem correta; físico/virtual. O piso de FOR vale no total após somar o bônus | Face física já escolhida pelo modo. Sortudo e outras rerrolagens são resolvidos na mesa neste assistente de disputas |

Perfil/resultado ficam fora do documento e do backup. Outro ataque, modo/conta,
encerramento ou edição encerram/invalidam o perfil; devolver o valor editado não
o restaura. Custos próprios de inspiração/Sortudo não descartam o ataque, e
Precisão/Atordoante atualizam a guarda em transação síncrona do mesmo ataque.
Dano continua limitado a uma manobra e permite físico/virtual; preparações de
Finta/Estendido usam seus fluxos próprios e não são combinadas neste assistente.
Não apaga fichas/notas, não muda dados de outra criatura, não cria SQL/consulta
de nuvem e não edita catálogos gerados.

**Base aprovada integralmente:** `008471d`, 733 testes, dependências, banco
PostgreSQL descartável, build e 57 roteiros em ambos os runs:
[PR](https://github.com/mhaetinger/D-D/actions/runs/41065238275) e
[push](https://github.com/mhaetinger/D-D/actions/runs/41065230564).

**Verificação local:** 755 testes Node, tipos/build e 13 roteiros Chromium
aprovados: ações, dano de armas, –5/+10, repetições, Precisão, monge, ataques
de magia, Estendido, Finta, Contra-Atacar, lote de combate, editor e dado.
Incluem custos/pisos/crítico/tipos/adicionais, declaração/alvos/gatilhos,
cancelamento/guardas/futuro/backup, físico/virtual/OFF/Só Pool, nós/foco/rodinha,
320px/GG/dois layouts/três temas/toque/XSS e offline real sob `/D-D/`.
Uma execução de monge não abriu a janela de Alma de Diamante; três repetições
passaram, as duas últimas sem instrumentação, sem mudar sua regra. O roteiro novo
corrigiu uma espera do próprio teste que aguardava a confirmação antes de
preenchê-la. A suíte remota completa continua exigida, agora com 58 roteiros.
Evidências em `~/.local/state/critcall/audits/2026-10-30-acoes-combate/`. R2/R3/R4/R5/R6
continuam parciais. Montaria, surpresa/ocultação, demais passivos de subclasses,
munição/recarga automática e todas as famílias de magias não estão concluídos.

### Vigésimo quinto recorte — conjuração por invocações, 30/10/2026

**Em desenvolvimento na PR #35**, sem publicação. As duas CIs da base `f1667bc`
concluíram com sucesso: 755 testes, dependências, banco descartável, tipos/build
e 58 roteiros. Este lote atende o vínculo antes manual entre invocação, magia,
uso diário e Pacto; não é uma revisão integral dos efeitos das 32 invocações.

Conferência: Livro do Jogador, pp. 61–62 (PDF 60–61), pré-requisitos e texto das
19 concessões diretas; magias correspondentes no catálogo integral autorizado.
Fonte primária de apoio: [SRD 5.1, pp. 48–50](https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf#page=48).
O requisito de Cárceri é Pacto da Corrente; a referência circular na tradução do
PDF não substitui esse requisito, já presente no seletor do motor.

| Família | Operação implementada | Limite na mesa |
| --- | --- | --- |
| Encharcar a Mente, Escultor de Carne, Lacaios do Caos, Larápio dos Cinco Destinos, Palavra Terrível, Sinal de Mau Agouro e Sussurros Sedutores | Uma confirmação cobra contador diário existente e espaço de Pacto no círculo atual. Não aceita Conjuração; curto recupera Pacto sem liberar uso diário, longo recupera ambos. Seleção/nível próprio revalidados | Componentes, ação/tempo, alcance, alvos, resistências e efeitos. Elemental exige conjuração concluída; perder concentração não o dissipa |
| Armadura de Sombras, Idioma Bestial, Máscara das Muitas Faces, Mestre das Infindáveis Formas, Passo Ascendente, Salto Transcendental, Sussurros da Sepultura, Vigor Abissal, Visão Mística, Visões de Reinos Distantes e Visões nas Brumas | À vontade no círculo base, sem espaço/contador extra/magia conhecida. Somente as exceções expressas dispensam material ou restringem a si. Armadura Arcana exige não vestir armadura e ativa a fórmula existente. Vigor físico/virtual dá 1d4+4 temporários em si, mantendo/substituindo a reserva | Durações e condições dos efeitos. Levitação/Salto por essas invocações são em si; Falar com os Mortos mantém o limite de dez dias do cadáver. Transformação/ataques de Alterar-se não são cadastrados |
| Correntes de Cárceri | Bruxo 15 e Pacto da Corrente; sem espaço/material. Confirma celestial/corruptor/elemental e ausência de uso na mesma criatura desde o último descanso longo. Sem contador global; chave antiga preservada | Identificação/repetição por criatura e resistência/condição do alvo; não infere identidade remota a partir do nome |

Concentração usa o módulo do grimório. A troca, inclusive ao reconjurar o mesmo
efeito, é informada antes do custo; cancelar mantém a anterior. Maldição no
Pacto 3/4 concentra por 1/10 minutos; no 5º dura 8 horas sem encerrar outra
concentração. Não oferece dano imediato de maldição. Conjuração à vontade
alimenta Proteção Arcana/Transposição Benigna pela consequência comum, sem
contadores duplicados. Resistência indicada usa CAR do bruxo e proficiência
total; não confunde com ataque contra CA nem rola pela outra criatura.

O controle diário antigo fica em **Já resolvi na mesa**: Registrar uso só
desconta o contador, para quem já resolveu a magia/espaço por outro caminho.
Não se clica nele após Conjurar. Magia conhecida equivalente mantém seu cartão
e custo independentes; aprender a invocação não altera a lista de conhecidas.
Metamagia não é aplicada pelo novo controle. Livro de Segredos Antigos continua
no fluxo de rituais, fora dessas 19 concessões diretas.

Snapshot de ficha/conta/permissão/nó/modo/sequência é revalidado antes de RNG e
cobrança; clique repetido não abre segunda operação. OFF aceita físico; Auto
permite físico/virtual e Só Pool bloqueia o lançamento, como no grimório.
Vigor não usa vantagem/desvantagem em d4 nem consome inspiração. Cópia prévia
impede cobrança parcial, preservando registros futuros/ilegíveis e os demais
campos. Sem SQL, nova consulta de nuvem, ficha pessoal ou catálogo gerado editado.

Verificados **776 testes Node** (21 casos novos), tipos/build e **11 roteiros
Chromium**: conjuração por invocações, auditoria anterior de invocações,
concentração, PV, ataques de magia, regras auditadas, consulta, ajudas, curas
auditadas, monge e ações de combate. Incluem custo conjunto, magia conhecida
independente, descansos, concentração 3/4/5, temporários físico/virtual,
OFF/Só Pool, guardas de documento/personagem/modo/sequência, clique repetido,
cancelamento/nós/rodinha, registros futuros/notas/outra ficha, 320px/GG/três
temas/dois layouts/toque, texto como dado e offline real sob `/D-D/`.
A chamada inicial de curas sem `--import tsx` falhou na leitura do TypeScript,
antes do navegador; a execução prevista no `package.json` passou. Os dois
roteiros de invocações foram repetidos após os últimos ajustes de texto/alcance.
Suíte remota ampliada para 59 roteiros. Evidências em
`~/.local/state/critcall/audits/2026-10-30-conjuracao-invocacoes/`.
R2/R3/R4/R5/R6 permanecem parciais, com os limites das matrizes anteriores.

### Revisão das quatro invocações — 23/10/2026

O estado manual registrado nesta seção é histórico. O vínculo de conjuração e
os custos avançaram no vigésimo quinto recorte acima, preservando os controles
de registro manual e as correções delimitadas de descrição/metadados.

**Revisão delimitada concluída em desenvolvimento**, a partir das reproduções
parciais do Claude. A conferência independente usou a base atual e o livro local
2014; fontes primárias de apoio:
[SRD 5.1, pp. 48–50](https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf#page=48).
Não se trata de revisão das 32 invocações ou de sua automação integral.

| Invocação | Livro impresso / PDF | Regra conferida | Resultado do fluxo atual |
| --- | --- | --- | --- |
| Armadura de Sombras | 61 / 60 | Armadura Arcana em si, à vontade, sem espaço ou material; base sem armadura 13 + DES, 8h, sem concentração | Descrição/referência corretas; sem contador diário ou magia conhecida automática. Conjuração/condições na mesa. |
| Vigor Abissal | 62 / 61 | Vitalidade Falsa em si, à vontade, sempre 1º círculo, sem espaço ou material: 1d4+4 PV temporários, 1h | Descrição correta. Corrigida a classificação genérica como cura; resumo agora explicita PV temporários, sem Vida/recuperação de PV. Conjuração e reserva temporária seguem na mesa. |
| Escultor de Carne | 61 / 60 | Bruxo 7; Metamorfose uma vez/descanso longo, gastando espaço de Pacto; concentração até 1h, 18m, transformação conforme ND/nível do alvo | Pré-requisito e contador único corretos. Descanso curto não libera o uso. Magia, espaço, estatísticas/limites da forma e alvo são resolvidos na mesa. |
| Sinal de Mau Agouro | 62 / 61 | Bruxo 5; Rogar Maldição uma vez/descanso longo, gastando espaço de Pacto; SAB, toque e efeito escolhido | Pré-requisito/contador corretos. Corrigidos dano imediato indevido e duração/concentração por círculo na magia genérica; conjuração pela invocação/custos seguem manuais. |

Confirmados e corrigidos:

- Característica antiga continuava visível após substituição; reaprender também
  duplicava a entrada. Agora a lista reflete somente a aquisição atual, preservando
  histórico, fichas antigas e usos já gastos. Não há migração de dados.
- Vitalidade Falsa estava rotulada como cura. Apenas os PV temporários são
  descritos: o resumo genérico aumenta 5 por círculo acima do 1º, mas a exceção
  de Vigor Abissal continua sempre no 1º. Nenhum PV é aplicado automaticamente.
- Rogar Maldição oferecia 1d8 como rolagem imediata. Esse dado pertence a uma
  opção da maldição, em dano posterior; lançamento não rola dano. No 4º círculo,
  concentração até 10min; no 5º/6º, 8h sem concentração; no 7º/8º, 24h; no 9º,
  até ser dissipada. Usar 5º+ conserva outra concentração ativa.

Esclarecimento de interface: **Registrar uso** desconta somente o contador
diário. Pode ser usado depois de registrar o espaço gasto na mesa; rejeitar por
Pacto já esgotado ou descontá-lo outra vez cobraria duas vezes. Magias concedidas
por invocação não são automaticamente magias conhecidas. À vontade não cria
contador diário. O vínculo completo de conjuração e custos permanece manual,
como já registrado em R5; esta limitação não foi tratada como regressão nova.

A comparação dos 361 metadados identificou alterações somente em Vitalidade
Falsa e Rogar Maldição; os outros 359 ficaram iguais. Catálogos gerados intactos.
Cópias salvas com tipos antigos recebem somente leitura corrigida; fórmulas,
tipos próprios identificáveis e textos preservados.

Verificados **494 testes Node**, tipos/build e **seis roteiros Chromium**:
invocações, concentração, consulta de características, ajudas, curas auditadas
e regras/recursos. Incluídos fonte/descrição das quatro entradas, troca e
reaprendizado, uso diário/Pacto/descansos, cópias salvas/fórmulas próprias,
ausência de RNG/PV indevido, cancelamento e concentração anterior, notas/outra
ficha, 320px/GG/três temas/dois layouts e recarga offline sob `/D-D/`.
Diagnóstico puro: **3.321 verificações, zero divergências**. A suíte da CI passa
a exigir 39 roteiros. Sem SQL ou teste de banco local, dados pessoais ou
publicação desta rodada. O teste antigo de curas usa `node --import tsx`.
Em 24/10, corrigida a espera do teste de recarga offline: `DOMContentLoaded`
não garante a inicialização assíncrona da ficha. O roteiro aguarda a aba renderizada
e foi conferido com CPU reduzida a um quarto, sem pausa fixa ou mudança na aplicação.

## Progresso já entregue

Correções de consulta/interface da PR #19, na entrega de 22/10 (PR #20): Ancestral Feérico
usa o próprio parágrafo racial e página; o moderno distribui origens/níveis
conforme a largura do quadro; revisão de importação começa pelos resumos e
preserva ataque manual sem bônus como não informado. A apresentação foi
reorganizada com identificação/classes distintas, dicas de treino/reservas,
narrativa aberta e editor de armas compartilhado com a ficha. Essas mudanças
facilitam conferir a cópia. As ajudas passam a se substituir com atraso de um
segundo por mouse; a descrição da magia fica no livrinho, com consulta por
clique/teclado/toque. Nenhuma dessas correções completa um efeito de classe ou
origem. A revisão também oferece antecedente/tendência por catálogo ou texto,
idiomas/armas/ferramentas por opções e moedas editáveis; truques e círculos têm
grupos por classe, sem misturar sua apresentação ou ordenar o array salvo.
As opções de treino usam o cálculo já existente; escolher um antecedente não
refaz os treinos importados. As dez ancestralidades de draconato foram cruzadas
com a tabela de 2014; a revisão preserva escolhas racial/feiticeiro separadas e
mostra elemento, área, teste, CD e dano do sopro para consulta. A entrega de
22/10 não resolvia o sopro; o recorte de 23/10 acima acrescenta dano e gasto.
A aplicação automática de outras vantagens/imunidades continua parcial; R3–R5
mantêm seus limites e pendências abaixo.

As entregas funcionais de 19 a 21/10 estão resumidas aqui e antecedem a nova
sequência R1–R6. Seus contratos completos estão na arquitetura. Os casos
corrigidos não devem voltar à lista de ausências.

| Entrega | Cobertura existente | Limite ainda relevante |
| --- | --- | --- |
| Fórmulas e cálculos auditados | Prévia/rolador unificados nos casos de truques, cura, aprimoramento, Discípulo da Vida e Explosão Agonizante; nível racial do tiefling; Dominar/Assinatura; iniciativa com Versatilidade/Atleta/Alerta; componentes longos regenerados | Outros passivos; classificação integral do catálogo; troca temporal de escolhas do mago fora da evolução; outros contextos condicionais além da iniciativa delimitada no décimo recorte |
| PV e inspiração | Ordem de Proteção Arcana/temporários/besta/PV e absorção real; CON permanente; Dados de Vida por classe e Canção do Descanso opcional; morte/estabilidade; inspiração de 2014 | Ressurreição, passagem do tempo, requisitos/limites temporais de descanso e outros gatilhos dependem da mesa |
| Concentração e condições | Registro único nas duas abas, substituição confirmada, fila de testes por dano, físico/virtual, incapacidade e encerramentos; 14 condições, movimento e falhas de FOR/DES pertinentes | Outros modos de rolagem, sentidos, fontes/alvos e imunidades; sem relógio de duração/turnos |
| Dano por tipo | Uma ocorrência com tipos/origem, prévia, proteção externa, imunidade/redução/resistência/vulnerabilidade; fontes raciais, Fúria e outras fontes explicitamente verificadas | Não abrange todas as fontes; formas usam o modo já resolvido; ajustes da mesa não viram bônus permanentes |
| Defesas e prevenção de queda | Maestria em Armadura Pesada, Esquiva Sobrenatural, Evasão, Resistência Implacável e Fúria Implacável/CD crescente | Proteção contra a Morte, outras reações/reduções e morte sem dano; reação/visibilidade/contexto são confirmados pela mesa |
| Críticos e adicionais de arma | Crítico, Ataque Furtivo, Colossos, Destruição com gasto único de Conjuração/Pacto, Aprimorada, Crítico Brutal e Ataques Selvagens; –5/+10 opcional em armas elegíveis; modos físico/virtual e histórico | Outros adicionais, rerrolagens e ataques da forma; alvo/acerto, uso no turno e limite de ataques permanecem manuais |
| Importação e evolução | Revisão por setores de PDF preenchível/JSON/ficha atual; cópias, vínculos propostos, preparação/origem, valores escritos preservados e avisos de campos manuais; consulta de magia por ID do catálogo e prévia ao trocar raça/antecedente | Troca de origem mantém totais/treinos manuais mediante aceite e aposenta escolhas antigas; não reconstrói automaticamente bônus/escolhas raciais. Não reconstrói integralmente talentos/equipamento/características em prosa; OCR/PDF achatado ausentes; ciclo com PDFs reais segue em V1 da retomada |

Armadura/escudo sem proficiência já impedem conjuração/ritual com motivo, mas
outras desvantagens ainda não estão integralmente integradas. Carga já inclui
moedas. Descanso longo exige 1 PV no início e o curto preserva a forma; duração,
interrupções e limite de um longo por 24 h seguem manuais. Não reabrir esses
casos corrigidos como se toda a funcionalidade estivesse ausente.

## Fonte, método e limites

- Fonte: `public/books/livro-jogador-2014.pdf`, 314 páginas físicas,
  SHA-256 `76f195f3b0fdedd1305ebf9d89893092ecb8262badb5812ca3bd41f01e592a51`.
- O exemplar contém **Patrulheiro Revisado** e seus conclaves. Essa parte é uma
  adaptação presente no arquivo, não a classe original do PHB de 2014.
- Revisão por capítulos e apêndices: índice/texto integral extraído com
  `pdftotext -layout`, regras relevantes cruzadas com criação/evolução,
  `src/app/sheet.js`, `src/rules/` e os catálogos de `public/rules/`.
- As referências são **as páginas físicas do PDF**, usadas pelo leitor em
  `book.html#page=N`. A numeração impressa diverge e não tem um deslocamento único.
- Foi conferida a presença de 12 classes/41 subclasses, 15 opções raciais,
  13 antecedentes, 42 talentos, 37 armas, 361 magias e 958 referências. Nas 361
  magias há nome, escola, página, tempo, alcance, componentes, duração e texto;
  isso verifica presença, não fidelidade integral dos campos nem de seus efeitos.
- As tabelas de classe/subclasse listam 368 ocorrências de características,
  incluindo repetições/aprimoramentos por nível, sem contar os incrementos de
  habilidade gerados separadamente. Todas retornaram uma referência na consulta
  do motor; isso não valida automaticamente o conteúdo ou a aplicação do efeito.
- Os testes de progressão até o nível 20 verificam os contratos cobertos pelos
  testes. **Não certificam a execução de cada característica, talento ou magia**.
  Não foi simulado um combate para cada combinação possível. O Livro do Mestre
  não tem suas mecânicas integralmente auditadas; continua uma fonte de consulta.

## Todos os capítulos e apêndices

| Parte / páginas PDF | O que já existe | Lacunas e decisões |
| --- | --- | --- |
| Capa, índice, prefácio e introdução, 1–7 | Consulta local e navegação | Explicação do jogo; sem necessidade de novos campos |
| Cap. 1, criação, 10–14 | Atributos, 27 pontos, conjunto padrão, rolagem, criação/evolução e multiclasse | Distinguir uma escolha cadastrada de seu efeito aplicado; ver passivos abaixo |
| Cap. 2, raças, 16–42 | Atributos, idiomas, opções, descrições, magias e resistências de tiefling/anão/draconato/halfling robusto no dano por tipo e assistente de resistências raciais condicionais; sopro com dano, gasto e descanso no recorte de 23/10 | Outras resistências/condições, rerrolagens e gatilhos raciais seguem pendentes |
| Cap. 3, classes, 44–120 | Progressão das 12 classes/41 subclasses; várias reservas e ações contextuais | Matriz por classe abaixo; contadores não controlam alvos, turnos e todos os passivos |
| Cap. 4, personalidade/antecedentes, 122–142 | 13 antecedentes, tendências, sugestões editáveis, campos narrativos e inspiração de 2014 | Personalização completa de antecedente ainda exige adaptação manual |
| Cap. 5, equipamento, 144–160 | Compras/troco, quantidades/peso, armadura/escudo, penalidades de treino/Furtividade, armas/propriedades consultáveis e usos de kit de Curandeiro | Munição, recarga, demais consumíveis e detalhes de carga; ver itens abaixo |
| Cap. 6, personalização, 164–171 | Pré-requisitos/escolhas de multiclasse/talentos, espaços combinados e Pacto separado | Vários talentos só registram a escolha; o efeito numérico não está aplicado |
| Cap. 7, habilidades, 174–180 | Modificadores, proficiência, especialização, perícias, resistências, modo vantagem/desvantagem e bônus auditados de iniciativa | Testes passivos/condicionais e rolagens mínimas ainda incompletos; iniciativa contextual delimitada no décimo recorte |
| Cap. 8, aventuras, 182–188 | Deslocamento, inventário, descansos, exaustão e gasto/recuperação de Dados de Vida por classe | Tempo de descanso, viagem, luz, sufocamento, alimento/água e atividades entre aventuras são manuais |
| Cap. 9, combate, 189–198 | Ataques/dano, CA, PV, reservas, morte/estabilidade e dano por tipo com fontes verificadas, prévia e ajuste da mesa | Outras defesas/reações, adicionais de ataque, cobertura, alvos e exceções de classe ainda exigem controle manual |
| Cap. 10, conjuração, 201–205 | Preparação, rituais elegíveis, espaços por classe/Pacto, CDs, custos de feitiçaria e concentração com fila por dano | Componentes, duração, interrupções durante conjuração prolongada e economia de ações seguem manuais |
| Cap. 11, magias, 207–288 | 361 descrições e metadados, campos longos corrigidos, fórmulas auditadas unificadas e escalonamento | Não há executor de todos os efeitos das 361 magias; consultar limitações por família |
| Apêndice A, condições, 289–291 | Exaustão e 14 condições com ajuda; incapacitação, movimento, falhas de FOR/DES e defesas de dano da petrificação no modo por tipo | Modos próprios integrados no lote de combate; sentidos, alvos e demais imunidades continuam manuais; imunidades próprias do vigésimo terceiro recorte são derivadas sem apagar marcas |
| Apêndice B, deuses, 292–298 | Consulta no livro | Referência narrativa; não impor divindade/domínio ao jogador |
| Apêndice C, planos, 299–302 | Consulta no livro | Referência de cenário; efeitos dependem do Mestre |
| Apêndice D, criaturas, 303–310 | Consulta e reserva manual de PV da Forma Selvagem; companheiro separado | Sem seleção de bloco de criatura para forma/companheiro/familiar nem fusão de estatísticas |
| Apêndice E, leituras, 311 | Consulta no livro | Bibliografia; sem automação necessária |
| Divisórias, páginas sem conteúdo mecânico e formulários finais, demais páginas | Exibidos no leitor | Não representam regras adicionais a automatizar |

## Classes e subclasses: o contador não é o efeito completo

Todas as subclasses do catálogo estão nesta matriz. A coluna final registra
exemplos de trabalho restante, não uma promessa de que as outras características
estejam todas automatizadas. As descrições continuam sendo a referência.

| Classe / PDF | Subclasses conferidas | Cobertura operacional existente | Próxima revisão necessária |
| --- | --- | --- | --- |
| Bárbaro, 45–49 | Furioso; Guerreiro Totêmico | Fúria, vantagem de FOR e Força Indomável no lote de combate, dano com FOR, resistências por tipo, Frenesi/exaustão, CA alternativa, Crítico Brutal, Fúria Implacável e vantagem de Instinto Selvagem na iniciativa (décimo recorte de R2) | Sentido de Perigo no assistente e Fúria Inconsciente na condição própria; demais vantagens, duração/gatilhos continuam parciais |
| Bardo, 50–54 | Conhecimento; Bravura | Reserva/dado de inspiração, proficiências/especialização, segredos, conjuração, iniciativa de Versatilidade, Canção do Descanso opcional e Inspiração Superior na iniciativa (nono recorte de R2); concessão, Interrupção e dado recebido/Bravura com calculador no lote de apoio | Alvos, prazo/reação/momento declarados; integração automática do dado recebido ao d20 e demais efeitos de bardo continuam parciais |
| Bruxo, 55–61 | Arquifada; Corruptor; Grande Antigo | Pacto, Arcanum, usos, Bênção do Obscuro, Explosão Agonizante, Sorvedor de Vida na arma vinculada e resistências de patrono registradas | Defesa Sedutora impede encanto; sua reação de devolução, troca da resistência após descanso e reflexão de psíquico continuam manuais; espaço de invocações não equivale ao contador diário; alvos |
| Clérigo, 62–69 | Conhecimento; Enganação; Guerra; Luz; Natureza; Tempestade; Vida | Preparação/domínios, Canalizar compartilhado, usos e Intervenção | Efeitos de cada domínio no alvo, cura/dano condicionado e Expulsar/Destruir Mortos-Vivos por ND |
| Druida, 70–75 | Terra; Lua | Preparação/círculo, Forma Selvagem/PV, cura da Lua, Recuperação Natural e concentração mantida na transformação | Bloco de besta/estatísticas e custo de elemental; CON da forma informada no teste. Proteção Natural integrada a veneno e ao assistente para fadas/elementais, sem adivinhar fonte das marcas antigas |
| Feiticeiro, 76–81 | Magia Selvagem; Linhagem Dracônica | Feitiçaria/metamágica, conversão, Marés, CA, resistência e bônus inicial de Afinidade Elemental nos casos reconhecidos | Surto/gatilhos, tipos variáveis/efeitos posteriores e elegibilidade completa de metamagias; adaptações identificadas |
| Guerreiro, 82–87 | Campeão; Mestre de Batalha; Cavaleiro Arcano | Retomar o Fôlego, Surto, Indomável, superioridade, estilos, crítico, magias e iniciativa parcial de Atletismo Extraordinário; repetição de Combate com Armas Grandes no quarto recorte de R2; Implacável na iniciativa no nono e Sobrevivente do Campeão no décimo primeiro | A06/A13 corrigidos: arredondamento/testes físicos e Retomar físico/virtual. Sete manobras no dano e Precisão no ataque (sexto a oitavo recortes); Aparar integrado ao dano recebido e Inspirar com resultado para o aliado no décimo terceiro recorte; Passo Evasivo integrado à CA no décimo quarto; Estendido antes do ataque no décimo quinto; Finta no próximo ataque contra o alvo no décimo sexto; Trespassante separado no segundo alvo no décimo sétimo; Contra-Atacar com reação no décimo oitavo; Golpe do Comandante com ordem/custo/dado adicional no décimo nono, ataque do aliado na mesa; início dos turnos continua declarado pela mesa |
| Ladino, 88–92 | Ladrão; Assassino; Trapaceiro Arcano | Especialização, composição de Ataque Furtivo, Esquiva/Evasão, usos avançados, magias e Talento Confiável nas perícias da ficha (R2 inicial) | Testes com ferramentas na mesa; surpresa/Assassinar e Ação Ardilosa |
| Mago, 93–100 | Abjuração; Adivinhação; Conjuração; Encantamento; Evocação; Ilusão; Necromancia; Transmutação | Livro/preparo/ritual, Dominar/Assinatura, recuperação, Proteção Arcana inclusive multiclasse, Conjuração Focada, Presságio e usos/estados de escola | Resistência à Magia da Abjuração no assistente; efeitos por alvo, demais bônus de escola, lacaios, pedra e Sobrecarga; fluxo de troca temporal das escolhas |
| Monge, 101–106 | Mão Aberta; Sombra; Quatro Elementos | Chi, movimento/CA, curas/usos, Evasão, defesas de dano e Auto Aperfeiçoamento na iniciativa; Artes Marciais/desarmado, Atordoante, Defletir/Queda/devolução, Mente Tranquila/Pureza/Corpo Vazio e Alma de Diamante no vigésimo segundo recorte | Requisitos físicos da forma, demais efeitos de subclasses/disciplinas, Rajada/Defesa Paciente/Passo do Vento e economia de ações/turnos continuam parciais |
| Paladino, 107–113 | Devoção; Anciões; Vingança | Cura pelas Mãos, Canalizar, Arma Sagrada, Aura de Proteção própria nos testes com guarda de consciência, Coragem/Devoção nas condições e Vigilância no dano de magias; preparação e Destruição com gasto de espaço | Auras recebidas/aplicação a aliados, demais condições dos juramentos e cura no alvo |
| Patrulheiro Revisado, 114–120 | Besta; Caçador; Rastreador Subterrâneo | Progressão/seleções da adaptação, conjuração, extras condicionais, PV do companheiro e vantagem de Explorador Natural na iniciativa (décimo recorte de R2) | Inimigo favorito, exploração, alvos do primeiro turno e estatísticas/comandos do companheiro; não misturar regras do patrulheiro original |

## Raças e antecedentes

As 15 opções são Anão da Colina/Montanha, Alto Elfo/Elfo da Floresta/Drow,
Halfling Pés Leves/Robusto, Humano/Humano Variante, Draconato, Gnomo da
Floresta/das Rochas, Meio-Elfo, Meio-Orc e Tiefling.

O dano por tipo já reconhece as fontes de anão/tiefling/draconato. Resistência
Implacável do meio-orc está integrada à prevenção de queda, e Ataques Selvagens
à composição de crítico corpo a corpo. Não retomar esses casos como ausentes.
A revisão permite informar/corrigir a ancestralidade do draconato e a da
Linhagem Dracônica do feiticeiro, em escolhas independentes. Elementos seguem
as dez cores válidas do livro; cor de pele e textos arbitrários não concedem
resistência. Além da consulta de área, DES/CON, CD e dados por nível total,
o recorte de 23/10 registra dano/metade, gasto e recuperação do sopro. Alvos,
seus testes e aplicação do dano/defesas continuam resolvidos na mesa.

Sortudo dos halflings foi integrado às rolagens contextuais no primeiro recorte
de R2, conforme condições e limites acima; não é o talento homônimo.
Continuam pendentes sensibilidade solar do drow e outras resistências/vantagens
e gatilhos raciais. A aplicação do sopro aos alvos exige resolução na mesa,
conforme o limite do recorte implementado acima.
Visão no escuro, idiomas, ferramentas, transe, máscaras naturais e
características sociais podem permanecer como consulta quando não houver uma
operação da ficha a resolver. Antecedentes e origens ambíguas não devem ser
inferidos a partir de texto livre nem substituir escolhas antigas.

Os 13 antecedentes são Acólito, Artesão de Guilda, Artista, Charlatão, Criminoso,
Eremita, Forasteiro, Herói do Povo, Marinheiro, Nobre, Sábio, Soldado e Órfão,
com variações no catálogo. Sugestões de personalidade/ideais/ligações/defeitos já
alimentam campos editáveis. Benefícios sociais/narrativos dependem do Mestre;
não precisam de contadores artificiais. Antecedente personalizado e substituição
de proficiências repetidas merecem um fluxo próprio, sem perder escolhas antigas.

## Os 42 talentos: escolha registrada e efeito aplicado são coisas diferentes

Pré-requisitos, consulta e registro estão no criador. A aplicação atual inclui
incrementos de atributos quando definidos, Resiliente nos testes, ganhos de
perícias/ferramentas/idiomas/armas, magias escolhidas, PV de Robusto, deslocamento
de Mobilidade, proficiências de Proteção Leve/Moderada/Pesada e teto de DES da
Maestria em Armadura Média na CA. Isso **não executa os demais efeitos** desses talentos.

Matriz dos 42 talentos, cruzada com `applyChoices`, `armorClass`, `weaponStats`,
`movementSpeed`, opções do criador e controles de recursos. “Manual” inclui
efeitos situacionais que podem continuar sendo decididos na mesa; não significa
que todos precisem ganhar um botão. Consulta/registro existem em todos.

| Talento | Aplicação identificada | Manual, ausente ou a corrigir |
| --- | --- | --- |
| Adepto Elemental | Escolha/repetição por elemento, mínimo 1→2 em dano de magia reconhecido e indicação da resistência ignorada; quinto recorte de R2 | Alvo/resistência/imunidade na mesa; escolhas de elemento, efeitos/rodadas/parcelas sem vínculo e fórmulas próprias continuam manuais |
| Adepto Marcial | Duas manobras e dado adicional pela errata 2014; sete manobras no dano e Precisão após d20, com origem/gasto/descanso; sexto a oitavo recortes de R2 | Aparar integrado ao dano recebido e Inspirar com resultado para o aliado no décimo terceiro recorte; Passo Evasivo integrado à CA no décimo quarto; Estendido antes do ataque no décimo quinto; Finta no próximo ataque contra o alvo no décimo sexto; Trespassante separado no segundo alvo no décimo sétimo; Contra-Atacar com reação no décimo oitavo; Golpe do Comandante com ordem/custo/dado adicional no décimo nono, ataque do aliado na mesa; uma manobra por ataque e efeito no alvo confirmados pela mesa |
| Alerta | +5 na iniciativa | Surpresa/atacante oculto |
| Ambidestro | +1 CA calculada com duas armas empunhadas confirmadas, sem duplicar CA escrita | Elegibilidade de duas armas, sacar/guardar e contexto da mesa |
| Atacante Bestial | Nova rolagem dos dados da arma e escolha de conjunto completo, no quarto recorte de R2 | Disponibilidade de uma vez por turno confirmada pela mesa; ataques manuais e físicos são resolvidos na mesa |
| Atirador Aguçado | -5/+10 opcional por ataque com arma à distância proficiente; integrado ao crítico/adicionais no terceiro recorte de R2 | Cobertura e alcance continuam na mesa; valores manuais não recebem bônus automático |
| Atirador de Magia | Escolha de truque de ataque, incluindo Criar Chamas | Alcance/cobertura |
| Atleta | +1 FOR/DES | Levantar, escalar e salto |
| Ator | +1 CAR | Vantagem e imitação nas condições do texto |
| Combatente Montado | Registro | Vantagem, redirecionar ataque e defesa da montaria |
| Conjurador de Guerra | Vantagem para manter concentração após dano | Componentes e magia na oportunidade |
| Conjurador de Ritual | Escolha de classe/rituais e ação ritual | Cópia/custo/tempo do livro e efeitos das magias |
| Curandeiro | Tratamento, estabilização e gasto de kit; cura própria e cálculo para destinatário, no lote de apoio | Elegibilidade por tratamentos/descansos anteriores e aplicação em outra ficha declaradas; ver limites do vigésimo primeiro recorte |
| Duelista Defensivo | Prévia e registro de reação junto da CA, arma de acuidade proficiente, bônus só contra um ataque e crítico/igualdade distintos; lote de combate | Reação/arma empunhada declaradas; dano na mesa, sem CA permanente |
| Especialista em Besta | Ataque bônus com besta de mão; contexto evita desvantagem por inimigo próximo, inclusive em ataque mágico | Munição/mão livre e Atacar anterior declarados; recarga proficiente consultada, sem contador automático de disparos |
| Especialista em Briga | +1 FOR/CON e d4 no golpe desarmado vinculado, no lote do monge | Armas improvisadas e agarrar |
| Explorador de Cavernas | Registro | Armadilhas/portas e deslocamento de procura |
| Imobilizador | Contexto de vantagem contra criatura agarrada por você; disputa para imobilizar com ação inteira | Agarre anterior e condições de ambos na mesa; não ganha vantagem só por estar fazendo disputa de agarrar |
| Iniciado em Magia | Dois truques, magia e uso limitado | Efeitos/resolução do grimório; exceções de origem precisam revisão |
| Investida Poderosa | Ataque bônus após Disparada, +5 com 3 m em linha reta sem dobrar no crítico; alternativa de empurrão por disputa | Gatilho, movimento e ação bônus declarados; condições/posição do alvo na mesa |
| Líder Inspirador | Cálculo nível total + CAR, 1–6 participantes, declaração dos requisitos e manter/substituir temporários próprios; lote de combate | Descanso desde qualquer líder e aplicação por destinatário na mesa; não altera outras fichas |
| Maestria em Arma de Haste | Cabo d4 concussão, habilidade/magia, crítico/adicionais/repetições e escolha de Artes Marciais elegível; oportunidade na entrada. Lança pela errata; lança longa sem cabo | Atacar anterior, empunhadura, reação/alcance e acerto declarados; efeitos no alvo manuais |
| Maestria em Armadura Média | Teto de DES +3 na CA e remoção da desvantagem de Furtividade da armadura média equipada; lote de combate | Outras fontes de desvantagem continuam válidas; equipamento desconhecido na mesa |
| Maestria em Armadura Pesada | +1 FOR; redução 3 no dano por tipo | Outras interações continuam na mesa |
| Matador de Conjuradores | Vantagem no assistente contra magia de conjurador a até 1,5 m, declarado | Reação e concentração do alvo permanecem manuais |
| Mente Afiada | +1 INT | Orientação, horário e memória consultáveis |
| Mestre de Armas | +1 FOR/DES, quatro proficiências | Demais condições do ataque usam o fluxo comum |
| Mestre de Armas Grandes | -5/+10 opcional por ataque corpo a corpo com arma pesada proficiente; terceiro recorte de R2 | Ataque bônus por crítico/abate no fluxo de Ação / reação; gatilho e disponibilidade da ação bônus declarados |
| Mestre de Escudo | DES com alvo exclusivo soma bônus próprio do escudo no assistente; reação evita dano de DES para metade no sucesso, inclusive área, no dano detalhado | Empurrão bônus por disputa após Atacar no vigésimo quarto recorte; reação/empunhadura, alvo exclusivo e efeito do empurrão declarados; não é Evasão na falha |
| Mobilidade | +3 m no deslocamento | Terreno difícil/Disparada e oportunidade |
| Observador | +1 INT/SAB; +5 nos passivos de Percepção/Investigação | Leitura labial consultável; contexto de vantagem/desvantagem na mesa |
| Perito | Três perícias/ferramentas | Revisar escolhas já dominadas e rolagem contextual com ferramenta |
| Poliglota | +1 INT e três idiomas | Cifras consultáveis |
| Resiliente | +1 atributo e proficiência em resistência | Não concede vantagem nem bônus adicional além da proficiência |
| Robusto | +2 PV por nível, inclusive retroativo | PV e ajustes manuais devem ser preservados ao evoluir |
| Sentinela | Oportunidade na saída mesmo com Desengajar; reação após ataque contra terceiro em fluxo distinto. Oportunidade, inclusive de haste, informa deslocamento zero no acerto | Visibilidade/alcance, alvo sem Sentinela no terceiro benefício e reação declarados; não ignora Mobilidade nem outras formas de evitar oportunidade. Movimento no alvo manual |
| Sorrateiro | Registro | Ocultação/luz e revelação por ataque falho |
| Sortudo | Reserva única de três pontos/descanso longo, escolha contextual do d20, ataques recebidos e dado físico; segundo recorte de R2 entregue na PR #20 | Acerto, momento anterior à resolução e anúncio dos usos de outras criaturas são informados pela mesa; escolhas de dados são transitórias |
| Resistente | +1 CON; mínimo de cura ao gastar Dados de Vida | Efeitos cobertos nos cenários testados de descanso |
| Proteção Leve | +1 FOR/DES e proficiência leve | Conjuração já respeita proficiência; outras penalidades de armadura seguem parciais |
| Proteção Moderada | +1 FOR/DES, média e escudo | Mesma revisão de elegibilidade/penalidades |
| Proteção Pesada | +1 FOR e proficiência pesada | Mesma revisão de elegibilidade/penalidades |

Não há evidência suficiente para marcar todos esses efeitos como concluídos.
Cada implementação deve registrar a condição exata, o cálculo que passa a usar
e o caso de teste, em vez de um único “talentos implementados”.

## Magias e decisões da mesa

As 361 magias possuem consulta. `spellMeta` infere metadados pelo texto e há
tratamentos específicos; encontrar uma fórmula não equivale a executar todos
os efeitos. A elegibilidade integral de metamagias e exceções do catálogo ainda
precisa de revisão. Mísseis Mágicos com Magia Gêmea é adaptação identificada da mesa.

Área/alvos, componentes consumidos, alcance, cobertura, resistência do alvo,
duração, interrupções de conjuração prolongada e várias curas/transformações
continuam sob controle do jogador. Concentração já tem estado/testes; não há
relógio de combate. Encerrar concentração própria não apaga automaticamente
defesas recebidas que podem ter vindo de outro conjurador.

Ações/reações, oportunidade, duas armas, agarrar/empurrar, montaria, combate
submerso, surpresa e ataques por ação exigem contexto da mesa. Antes de impor
bloqueios por turno, definir acompanhamento opcional. Tempo de vestir/tirar,
munição, recarga, demais consumíveis e sobrecarga não têm resolução integral.
Kits de Curandeiro têm saldo/consumo no lote de apoio; Furtividade usa a armadura
e Maestria no lote de combate. Isso não certifica todo equipamento. Viagem, luz, sufocamento, fome/sede e atividades entre
aventuras podem permanecer manuais ou receber auxiliares opcionais.

Deuses, planos, interpretação, benefícios sociais dos antecedentes e bibliografia
podem permanecer consultáveis. Não são tarefas de automação obrigatória.

## Evidências e histórico da auditoria

A base `7667ae9` teve 21 cenários direcionados: 20 divergências e um controle
conforme. As causas foram corrigidas nas entregas resumidas acima, com ampliação
para 32 cenários sem divergências. Os achados daquela base não descrevem a
produção atual. O relatório detalhado anterior pode ser recuperado com
`git show de3eda0:docs/AUDITORIA-LIVRO-2014.md`; changelog e arquitetura preservam
as implementações e seus contratos.

A entrega publicada em 22/10 passou 433 testes Node, tipos/build, 32 roteiros
Chromium e banco descartável na
[CI da main](https://github.com/mhaetinger/D-D/actions/runs/39861954879),
conforme [RETOMADA.md](RETOMADA.md).
Esses números não são porcentagem de cobertura do livro. A consolidação documental anterior
não repetiu a auditoria integral do PDF. As verificações específicas da entrega
R1 ficam na seção correspondente, sem certificar as etapas R2–R6.

Para repetir o diagnóstico direcionado após uma mudança funcional:

```sh
npm run build
node scripts/audit-phb-scenarios.cjs
```

O script usa Chromium e dados fictícios sob `/D-D/`, bloqueia chamadas externas
e relata `matches: false` como divergência. Seu código 0 só indica que executou;
o wrapper `tests/audited-rules-browser.cjs`, incluído em `npm run test:browser`,
exige zero divergências. Não usar build antigo ao auditar outro commit.
