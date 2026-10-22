# Regras de 2014: cobertura e roteiro

Auditoria inicial em **19/10/2026**, implementações até **21/10/2026** e estado
consolidado em **21/10/2026**. Este é o registro único de progresso das mecânicas.
Para branch, publicação e validações externas, consulte [RETOMADA.md](RETOMADA.md).
Contratos técnicos ficam em [ARQUITETURA.md](ARQUITETURA.md); entregas/testes
históricos, no [CHANGELOG.md](../CHANGELOG.md).

**A versão publicada não automatiza integralmente o livro.** Consulta, escolha
cadastrada e contador de usos não significam efeito aplicado. As matrizes abaixo
distinguem a produção das implementações seguintes: R1 foi integrada em
`develop` pela PR #17; o primeiro recorte de R2 está em
`feature/rolagens-condicionais-r2`. Essas entregas ainda não foram publicadas.

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

## Roteiro de implementação

A ordem começa pelos números que o jogador pode presumir já calculados. Cada
etapa deve ser dividida em entregas pequenas; as listas abaixo não autorizam
reescrever a ficha nem automatizar toda decisão da mesa.

| Etapa | Estado desta sequência | Trabalho e critério de conclusão |
| --- | --- | --- |
| R1 — bônus nos cálculos | **Integrada em `develop`; não publicada** | Quatro passivos integrados com elegibilidade e preservação de valores manuais. Tipos variáveis/efeitos posteriores seguem em R5. |
| R2 — rolagens e gastos condicionais | **Primeiro recorte implementado; etapa parcial** | Talento Confiável em perícias e Sortudo racial nos d20 contextuais. Faltam o talento Sortudo, demais rerrolagens/dados mínimos, -5/+10 e adicionais de talentos/estilos. Integrar escolha/gasto à jogada pertinente, sem duplicar reservas ou aplicar bônus a jogadas inelegíveis. |
| R3 — condições, defesas e características | Planejada; já há cobertura parcial | Completar efeitos das condições, imunidades, auras/consciência, outras reações e prevenção de queda, passivos de escolas/domínios e origens de resistência. Conferir alvos/fontes, custo, encerramento e o que continua decidido na mesa. |
| R4 — formas e criaturas | Planejada; PV da forma/companheiro já existem | Integrar bloco de criatura e elegibilidade da forma, estatísticas/CON, custo de elemental, defesas/excesso, familiar e companheiro. Não aplicar estatísticas humanas à besta; manter a reserva humana e a consulta ao livro. |
| R5 — famílias de magias | Planejada; fórmulas auditadas já corrigidas | Revisar metadados e exceções do catálogo por família: dano/cura, bônus, áreas, alvos, transformações e efeitos persistentes. Reutilizar grimório/PV/rolador, sem 361 controles separados. |
| R6 — equipamento e contexto de combate | Planejada | Munição/recarga/consumíveis, penalidades de equipamento, carga e ações condicionais. Definir antes qualquer acompanhamento opcional de turno; alvos, alcance, cobertura e viagem podem continuar na mesa, com essa limitação clara. |

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

Implementação `ba4a182`, em revisão na
[PR #18](https://github.com/mhaetinger/D-D/pull/18) para `develop`.
As verificações locais abaixo estão concluídas; conferir o resultado da CI
antes de integrar. Não há publicação deste recorte.

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

O **talento Sortudo** não foi implementado neste recorte: seus três pontos,
escolha do d20 e ataques contra o personagem são outra regra. Também continuam
pendentes Atacante Bestial, Combate com Armas Grandes, Adepto Elemental,
Atirador Aguçado/Mestre de Armas Grandes (-5/+10) e adicionais/manobras dos
demais talentos/estilos. Este recorte **não conclui R2**. Resultado/acerto e o
momento de usar a opção antes de resolver a jogada continuam a cargo da mesa.

Regressões: `tests/dice-roll.test.ts` e `tests/conditional-rolls-browser.cjs`.
Verificações finais: **404 testes Node**, tipos/build e os **27 roteiros
Chromium completos** aprovados no mesmo artefato, incluindo R1, desenho/gestos
do dado, PV, concentração, ataques e importação. O novo roteiro cobre opção
única/cancelamento/estado obsoleto, crítico, inspiração, resistências com
consequências, dois layouts, três temas, 320px/GG, toque e recarga offline sob
`/D-D/` com notas preservadas. Capturas desktop/celular conferidas; 62 links
locais válidos e auditoria de produção sem vulnerabilidades. Sem SQL/RLS/RPC;
banco não repetido localmente, permanecendo exigido na CI.

## Progresso já entregue

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
| Críticos e adicionais de arma | Crítico, Ataque Furtivo, Colossos, Destruição com gasto único de Conjuração/Pacto, Aprimorada, Crítico Brutal e Ataques Selvagens; modos físico/virtual e histórico | Outros adicionais, rerrolagens e ataques da forma; alvo/acerto, uso no turno e limite de ataques permanecem manuais |
| Importação e evolução | Revisão por setores de PDF preenchível/JSON/ficha atual; cópias, vínculos propostos, preparação/origem, valores escritos preservados e avisos de campos manuais | Não reconstrói integralmente talentos/equipamento/características em prosa; OCR/PDF achatado ausentes; ciclo com PDFs reais segue em V1 da retomada |

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
  não faz parte desta auditoria.

## Todos os capítulos e apêndices

| Parte / páginas PDF | O que já existe | Lacunas e decisões |
| --- | --- | --- |
| Capa, índice, prefácio e introdução, 1–7 | Consulta local e navegação | Explicação do jogo; sem necessidade de novos campos |
| Cap. 1, criação, 10–14 | Atributos, 27 pontos, conjunto padrão, rolagem, criação/evolução e multiclasse | Distinguir uma escolha cadastrada de seu efeito aplicado; ver passivos abaixo |
| Cap. 2, raças, 16–42 | Atributos, idiomas, opções, descrições, magias e resistências de tiefling/anão/draconato no dano por tipo | Outras resistências/condições, rerrolagens e gatilhos raciais seguem pendentes |
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
| Guerreiro, 82–87 | Campeão; Mestre de Batalha; Cavaleiro Arcano | Retomar o Fôlego, Surto, Indomável, superioridade, estilos, crítico, magias e iniciativa de Atleta Extraordinário | Outros testes de Atleta; rerrolagem de Combate com Armas Grandes; manobras/reações; Sobrevivente |
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

Sortudo dos halflings foi integrado às rolagens contextuais no primeiro recorte
de R2, conforme condições e limites acima; não é o talento homônimo.
Continuam pendentes a resolução completa do sopro do draconato, sensibilidade
solar do drow e outras resistências/vantagens e gatilhos raciais.
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
| Atirador Aguçado | Registro | -5/+10 por ataque, cobertura e alcance |
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
| Mestre de Armas Grandes | Registro | -5/+10 e ataque bônus após crítico/abate |
| Mestre de Escudo | Registro | Empurrão, bônus de resistência e reação condicionais |
| Mobilidade | +3 m no deslocamento | Terreno difícil/Disparada e oportunidade |
| Observador | +1 INT/SAB; +5 nos passivos de Percepção/Investigação | Leitura labial consultável; contexto de vantagem/desvantagem na mesa |
| Perito | Três perícias/ferramentas | Revisar escolhas já dominadas e rolagem contextual com ferramenta |
| Poliglota | +1 INT e três idiomas | Cifras consultáveis |
| Resiliente | +1 atributo e proficiência em resistência | Não concede vantagem nem bônus adicional além da proficiência |
| Robusto | +2 PV por nível, inclusive retroativo | PV e ajustes manuais devem ser preservados ao evoluir |
| Sentinela | Registro | Oportunidade, reação e deslocamento do alvo |
| Sorrateiro | Registro | Ocultação/luz e revelação por ataque falho |
| Sortudo | Registro | Três pontos e escolha do dado no contexto da jogada |
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

A última versão publicada passou 385 testes Node, tipos/build, 25 roteiros
Chromium e banco descartável na CI, conforme [RETOMADA.md](RETOMADA.md).
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
