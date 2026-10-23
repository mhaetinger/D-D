# Regras de 2014: cobertura e roteiro

Auditoria inicial em **19/10/2026**, implementações até **23/10/2026** e novo
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
  **Escultor de Carne**: a escolha/descrição existe; não há vínculo automático
  completo entre a magia, eventual espaço de Pacto e o uso diário. Não adicionar
  um contador paralelo ao implementar a conjuração. Não confundir invocação
  conhecida com concessão automática de uma magia conhecida de bruxo.
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
| R2 — rolagens e gastos condicionais | **Terceiro recorte implementado na PR #21; etapa parcial** | Talento Confiável, Sortudo racial e talento Sortudo implementados na entrega da PR #20. -5/+10 de Atirador Aguçado/Mestre de Armas Grandes implementado no terceiro recorte da PR #21. Faltam demais rerrolagens/dados mínimos e adicionais de talentos/estilos. Integrar escolha/gasto à jogada pertinente, sem duplicar reservas ou aplicar bônus a jogadas inelegíveis. |
| R3 — condições, defesas e características | Planejada; já há cobertura parcial | Completar efeitos das condições, imunidades, auras/consciência, outras reações e prevenção de queda, passivos de escolas/domínios e origens de resistência. Conferir alvos/fontes, custo, encerramento e o que continua decidido na mesa. |
| R4 — formas e criaturas | Planejada; PV da forma/companheiro já existem | Integrar bloco de criatura e elegibilidade da forma, estatísticas/CON, custo de elemental, defesas/excesso, familiar e companheiro. Não aplicar estatísticas humanas à besta; manter a reserva humana e a consulta ao livro. |
| R5 — famílias de magias | Parcial: fórmulas anteriores e oito curas auditadas | Revisar metadados e exceções do catálogo por família: dano/cura, bônus, áreas, alvos, transformações e efeitos persistentes. Reutilizar grimório/PV/rolador, sem 361 controles separados. |
| R6 — equipamento e contexto de combate | Planejada | Munição/recarga/consumíveis, penalidades de equipamento, carga e ações condicionais. Definir antes qualquer acompanhamento opcional de turno; alvos, alcance, cobertura e viagem podem continuar na mesa, com essa limitação clara. |

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

Continuam pendentes em R2: Atacante Bestial, Combate com Armas Grandes,
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
porque podem já incluí-lo; preservar as fórmulas cadastradas. Atacante Bestial,
Combate com Armas Grandes, Adepto Elemental e demais gatilhos continuam pendentes.

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
| Fórmulas e cálculos auditados | Prévia/rolador unificados nos casos de truques, cura, aprimoramento, Discípulo da Vida e Explosão Agonizante; nível racial do tiefling; Dominar/Assinatura; iniciativa com Versatilidade/Atleta/Alerta; componentes longos regenerados | Outros passivos; classificação integral do catálogo; troca temporal de escolhas do mago fora da evolução; contexto de vantagem na iniciativa |
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
| Cap. 2, raças, 16–42 | Atributos, idiomas, opções, descrições, magias e resistências de tiefling/anão/draconato no dano por tipo; sopro com dano, gasto e descanso no recorte de 23/10 | Outras resistências/condições, rerrolagens e gatilhos raciais seguem pendentes |
| Cap. 3, classes, 44–120 | Progressão das 12 classes/41 subclasses; várias reservas e ações contextuais | Matriz por classe abaixo; contadores não controlam alvos, turnos e todos os passivos |
| Cap. 4, personalidade/antecedentes, 122–142 | 13 antecedentes, tendências, sugestões editáveis, campos narrativos e inspiração de 2014 | Personalização completa de antecedente ainda exige adaptação manual |
| Cap. 5, equipamento, 144–160 | Compras em cobre, quantidades/peso, armadura/escudo, armas e propriedades consultáveis | Penalidades por falta de proficiência, munição, recarga, consumíveis e detalhes de carga; ver itens abaixo |
| Cap. 6, personalização, 164–171 | Pré-requisitos/escolhas de multiclasse/talentos, espaços combinados e Pacto separado | Vários talentos só registram a escolha; o efeito numérico não está aplicado |
| Cap. 7, habilidades, 174–180 | Modificadores, proficiência, especialização, perícias, resistências, modo vantagem/desvantagem e bônus auditados de iniciativa | Testes passivos/condicionais, vantagem na iniciativa e rolagens mínimas ainda incompletos |
| Cap. 8, aventuras, 182–188 | Deslocamento, inventário, descansos, exaustão e gasto/recuperação de Dados de Vida por classe | Tempo de descanso, viagem, luz, sufocamento, alimento/água e atividades entre aventuras são manuais |
| Cap. 9, combate, 189–198 | Ataques/dano, CA, PV, reservas, morte/estabilidade e dano por tipo com fontes verificadas, prévia e ajuste da mesa | Outras defesas/reações, adicionais de ataque, cobertura, alvos e exceções de classe ainda exigem controle manual |
| Cap. 10, conjuração, 201–205 | Preparação, rituais elegíveis, espaços por classe/Pacto, CDs, custos de feitiçaria e concentração com fila por dano | Componentes, duração, interrupções durante conjuração prolongada e economia de ações seguem manuais |
| Cap. 11, magias, 207–288 | 361 descrições e metadados, campos longos corrigidos, fórmulas auditadas unificadas e escalonamento | Não há executor de todos os efeitos das 361 magias; consultar limitações por família |
| Apêndice A, condições, 289–291 | Exaustão e 14 condições com ajuda; incapacitação, movimento, falhas de FOR/DES e defesas de dano da petrificação no modo por tipo | Outros modos de rolagem, sentidos, alvos e imunidade a condições ainda seguem manuais |
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
| Bárbaro, 45–49 | Furioso; Guerreiro Totêmico | Fúria, dano com FOR, resistências por tipo, Frenesi/exaustão, CA alternativa, Crítico Brutal e Fúria Implacável | Vantagens situacionais e duração/gatilhos |
| Bardo, 50–54 | Conhecimento; Bravura | Reserva/dado de inspiração, proficiências/especialização, segredos, conjuração, iniciativa de Versatilidade e Canção do Descanso opcional | Inspiração de Bardo recebida/Palavras de Interrupção na jogada; recuperação ao iniciar combate |
| Bruxo, 55–61 | Arquifada; Corruptor; Grande Antigo | Pacto, Arcanum, usos, Bênção do Obscuro, Explosão Agonizante, Sorvedor de Vida na arma vinculada e resistências de patrono registradas | Troca da resistência após descanso e reflexão de psíquico; espaço de invocações não equivale ao contador diário; alvos |
| Clérigo, 62–69 | Conhecimento; Enganação; Guerra; Luz; Natureza; Tempestade; Vida | Preparação/domínios, Canalizar compartilhado, usos e Intervenção | Efeitos de cada domínio no alvo, cura/dano condicionado e Expulsar/Destruir Mortos-Vivos por ND |
| Druida, 70–75 | Terra; Lua | Preparação/círculo, Forma Selvagem/PV, cura da Lua, Recuperação Natural e concentração mantida na transformação | Bloco de besta/estatísticas e custo de elemental; CON da forma informada no teste |
| Feiticeiro, 76–81 | Magia Selvagem; Linhagem Dracônica | Feitiçaria/metamágica, conversão, Marés, CA, resistência e bônus inicial de Afinidade Elemental nos casos reconhecidos | Surto/gatilhos, tipos variáveis/efeitos posteriores e elegibilidade completa de metamagias; adaptações identificadas |
| Guerreiro, 82–87 | Campeão; Mestre de Batalha; Cavaleiro Arcano | Retomar o Fôlego, Surto, Indomável, superioridade, estilos, crítico, magias e iniciativa parcial de Atletismo Extraordinário | A06/A13 corrigidos nesta entrega: arredondamento/testes físicos e Retomar físico/virtual. Rerrolagem de Combate com Armas Grandes; manobras/reações; Sobrevivente |
| Ladino, 88–92 | Ladrão; Assassino; Trapaceiro Arcano | Especialização, composição de Ataque Furtivo, Esquiva/Evasão, usos avançados, magias e Talento Confiável nas perícias da ficha (R2 inicial) | Testes com ferramentas na mesa; surpresa/Assassinar e Ação Ardilosa |
| Mago, 93–100 | Abjuração; Adivinhação; Conjuração; Encantamento; Evocação; Ilusão; Necromancia; Transmutação | Livro/preparo/ritual, Dominar/Assinatura, recuperação, Proteção Arcana inclusive multiclasse, Conjuração Focada, Presságio e usos/estados de escola | Efeitos por alvo, demais bônus de escola, lacaios, pedra e Sobrecarga; fluxo de troca temporal das escolhas |
| Monge, 101–106 | Mão Aberta; Sombra; Quatro Elementos | Chi, movimento/CA, curas/usos, Evasão e defesas de Pureza Corporal/Corpo Vazio no dano por tipo | Imunidade a condições, Artes Marciais/dano desarmado em todas as condições, Atordoar/Defletir Projéteis e recuperação ao iniciar combate |
| Paladino, 107–113 | Devoção; Anciões; Vingança | Cura pelas Mãos, Canalizar, Arma Sagrada, aura própria nos testes, preparação e Destruição com gasto de espaço | Aplicação a aliados/consciência e condições dos juramentos; cura no alvo |
| Patrulheiro Revisado, 114–120 | Besta; Caçador; Rastreador Subterrâneo | Progressão/seleções da adaptação, conjuração, extras condicionais e PV do companheiro | Inimigo favorito, exploração, iniciativa/primeiro turno e estatísticas/comandos do companheiro; não misturar regras do patrulheiro original |

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
| Adepto Elemental | Escolha do elemento | Resistência ignorada e mínimo dos dados |
| Adepto Marcial | Escolha de duas manobras | Dado extra d6 e interação com a reserva de superioridade |
| Alerta | +5 na iniciativa | Surpresa/atacante oculto |
| Ambidestro | +1 CA calculada com duas armas empunhadas confirmadas, sem duplicar CA escrita | Elegibilidade de duas armas, sacar/guardar e contexto da mesa |
| Atacante Bestial | Registro | Nova rolagem de dano uma vez por turno |
| Atirador Aguçado | -5/+10 opcional por ataque com arma à distância proficiente; integrado ao crítico/adicionais no terceiro recorte de R2 | Cobertura e alcance continuam na mesa; valores manuais não recebem bônus automático |
| Atirador de Magia | Escolha de truque de ataque, incluindo Criar Chamas | Alcance/cobertura |
| Atleta | +1 FOR/DES | Levantar, escalar e salto |
| Ator | +1 CAR | Vantagem e imitação nas condições do texto |
| Combatente Montado | Registro | Vantagem, redirecionar ataque e defesa da montaria |
| Conjurador de Guerra | Vantagem para manter concentração após dano | Componentes e magia na oportunidade |
| Conjurador de Ritual | Escolha de classe/rituais e ação ritual | Cópia/custo/tempo do livro e efeitos das magias |
| Curandeiro | Registro | Estojo, cura e limite por criatura/descanso |
| Duelista Defensivo | Registro | Reação e CA somente contra o ataque elegível |
| Especialista em Besta | Registro | Recarga, ataque próximo e ação bônus |
| Especialista em Briga | +1 FOR/CON | Dano desarmado d4, armas improvisadas e agarrar |
| Explorador de Cavernas | Registro | Armadilhas/portas e deslocamento de procura |
| Imobilizador | Registro | Vantagem contra alvo agarrado e imobilização |
| Iniciado em Magia | Dois truques, magia e uso limitado | Efeitos/resolução do grimório; exceções de origem precisam revisão |
| Investida Poderosa | Registro | Disparada, distância mínima e ação bônus |
| Líder Inspirador | Registro | PV temporários CAR+nível e elegibilidade por destinatário |
| Maestria em Arma de Haste | Registro | Ataque bônus d4 e oportunidade ao entrar no alcance |
| Maestria em Armadura Média | Teto de DES +3 na CA | Remover desvantagem de Furtividade; não há aplicação integrada dela |
| Maestria em Armadura Pesada | +1 FOR; redução 3 no dano por tipo | Outras interações continuam na mesa |
| Matador de Conjuradores | Registro | Reação, concentração do alvo e vantagem situacional |
| Mente Afiada | +1 INT | Orientação, horário e memória consultáveis |
| Mestre de Armas | +1 FOR/DES, quatro proficiências | Demais condições do ataque usam o fluxo comum |
| Mestre de Armas Grandes | -5/+10 opcional por ataque corpo a corpo com arma pesada proficiente; terceiro recorte de R2 | Ataque bônus após crítico/abate e economia de ações continuam na mesa |
| Mestre de Escudo | Registro | Empurrão, bônus de resistência e reação condicionais |
| Mobilidade | +3 m no deslocamento | Terreno difícil/Disparada e oportunidade |
| Observador | +1 INT/SAB; +5 nos passivos de Percepção/Investigação | Leitura labial consultável; contexto de vantagem/desvantagem na mesa |
| Perito | Três perícias/ferramentas | Revisar escolhas já dominadas e rolagem contextual com ferramenta |
| Poliglota | +1 INT e três idiomas | Cifras consultáveis |
| Resiliente | +1 atributo e proficiência em resistência | Não concede vantagem nem bônus adicional além da proficiência |
| Robusto | +2 PV por nível, inclusive retroativo | PV e ajustes manuais devem ser preservados ao evoluir |
| Sentinela | Registro | Oportunidade, reação e deslocamento do alvo |
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
munição, recarga, consumíveis, penalidades de Furtividade e sobrecarga não têm
resolução integral. Viagem, luz, sufocamento, fome/sede e atividades entre
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
