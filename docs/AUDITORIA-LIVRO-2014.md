# Auditoria de cobertura do Livro do Jogador — 19/10/2026

Há regras que ainda precisam de adaptação na ficha. Ter uma descrição, uma escolha
no criador ou um contador não significa resolver todos os efeitos daquela regra.
Este relatório distingue esses casos e serve de roteiro para as próximas entregas.

A segunda passada, na base `7667ae9`, encontrou **erros reproduzíveis além das
ausências de controles**. A prioridade passou a ser alinhar o valor mostrado com
o rolador, corrigir bônus/escalonamento e a interação entre dano, transformação e
descansos. Os itens 15–27 e a tabela de cenários abaixo detalham esses achados.
Três etapas de correções já foram implementadas na branch de trabalho,
conforme as tabelas abaixo. O restante continua identificado como pendência.

## Primeira etapa implementada — 19/10/2026

As descrições numeradas e a tabela histórica de reprodução registram o problema
encontrado na base `7667ae9`; não descrevem todas o estado atual. O diagnóstico
atual inclui regressões adicionais e é exigido na suíte de navegador.

| Itens da auditoria | Estado desta etapa |
| --- | --- |
| 1 | Iniciativa soma Versatilidade/Atleta Extraordinário sem duplicar meia proficiência e soma Alerta; vantagens situacionais seguem manuais |
| 2 | Campos longos regenerados; zero componentes com parênteses truncados nas 361 entradas |
| 3 | Armadura/escudo sem proficiência impedem lançar e usar ritual, com motivo no grimório; desvantagens em outras rolagens ainda manuais |
| 15–16 | Prévia e rolador compartilham fórmula; truques, cura/modificador e aumento explícito de dados corrigidos nos casos testados |
| 17 | Explosão Agonizante por feixe corrigida; Sorvedor de Vida/outros passivos ainda pendentes |
| 18 | Nível racial fixo do tiefling corrigido, inclusive em leitura de ficha anterior sem o campo |
| 19 | Dominar/Assinatura no seletor de origem, sem duplicar magias; preparo/usos/recuperação/aprimoramento corrigidos; troca das escolhas por tempo fora da evolução ainda sem fluxo próprio |
| 20, 22–23, 27 | Absorção real/ordem dos PV, abjuração de outra classe e Constituição permanente corrigidos; PV manuais e notas preservados |
| 21 | Requisito de 1 PV e preservação da forma no descanso curto corrigidos; duração, interrupções e limite de 24 h seguem manuais |
| 24–25 | Chicote classificado como ataque, Raio Ardente sem Gêmea e Criar Chamas no talento; classificação integral e todas as exceções do catálogo ainda precisam de revisão |
| 26 | Carga inclui moedas e informa isso no campo existente |
| 6–8 | Morte/estabilidade, Dados de Vida e inspiração receberam controles na segunda etapa abaixo |
| 5, 9 | Concentração e parte dos efeitos das condições receberam controles na terceira etapa abaixo |
| 4, 10–14 | Outros passivos e fluxos condicionais continuam pendentes |

Fórmulas personalizadas não recebem bônus automáticos adicionais. Feixes/raios
mostram a quantidade e rolam dano de um acerto; o botão contextual repete o dano
sem cobrar a magia. Regras de alvo/duração e as demais famílias de efeitos não
passam a ser automaticamente resolvidas por essa correção de fórmulas.

## Segunda etapa implementada: bloco de PV e inspiração — 19/10/2026

- Dados de Vida têm saldo e gasto por classe, um dado por vez, com origem física
  ou virtual, CON, piso zero e mínimo de Resistente. A recuperação longa continua
  com orçamento compartilhado e escolha explícita da classe; não duplica reservas.
- Canção do Descanso é opcional quando ouvida: dado de quem realizou a atuação,
  uma vez entre descansos e somente se o Dado de Vida recuperar PV. Em Forma
  Selvagem, exige a CON da besta e cura sua reserva; não cura os PV humanos.
- A 0 PV, sucessos/falhas, 1/20 natural, estabilidade, dano comum/crítico e dano
  maciço são registrados/calculados nos PV existentes. Cura positiva limpa
  contagens; morto não é revivido por cura/descanso. Retorno à vida tem registro
  explícito após resolver a magia e a causa da morte na mesa.
- Inspiração de 2014 usa uma reserva por ficha: preparar/cancelar vantagem na
  próxima jogada elegível ou gastar na mesa. Não acumula, não rerrola depois do
  resultado e não gasta em dano/arremesso rápido. Desvantagem cancela a vantagem.
- Novos estados entram no documento/histórico da ficha, preservando notas.
  Diálogos revalidam a ficha após confirmar; OFF exige face física e os dados
  virtuais não alteram o pool. Sem mudança de SQL/RLS/RPC.

Limites: horas/atividade do descanso, Medicina CD 10, origem/tempo dos bônus,
passagem de 1d4 horas para acordar, ressurreição e características que evitam
cair a 0 PV dependem da mesa. Concentração e condições foram tratadas na etapa
seguinte abaixo. Essa etapa não certifica todos os efeitos das classes/talentos.

Verificação local: 299 testes Node, tipos/build, dez roteiros Chromium existentes
e o novo roteiro de PV, este repetido no build final após ajuste de foco.
Inclui gasto físico/virtual/OFF, classe/forma/CON, canção, reserva/recuperação,
1/20/estabilidade/crítico/dano maciço, retorno à vida, inspiração, notas e
desfazer/refazer preservados, fichas isoladas, recarga/offline e três temas/320 px/GG.
Capturas de desktop/celular conferidas. A suíte daquela etapa incluía onze roteiros.

## Terceira etapa implementada: concentração e condições — 20/10/2026

- Item 5: efeito único por ficha nos PV ou no grimório; troca confirmada antes
  dos recursos, inclusive rituais/conjurações prolongadas. Reconjurar o mesmo
  efeito começa outro registro. Duração e interrupções durante uma conjuração
  prolongada continuam na mesa; o botão registra sua conclusão.
- Cada fonte de dano gera uma resistência de CON, CD 10 ou metade do dano,
  o maior. Proteção Arcana não conta como dano ao personagem; temporários e
  besta contam. Fila ordenada persiste com a ficha e não resolve outro efeito.
- Dado físico/virtual/OFF, proficiência/efeitos próprios, bônus total da forma,
  bônus recebido, Conjurador de Guerra, exaustão e inspiração. Vantagem e
  desvantagem se cancelam independentemente de sua quantidade. 1/20 natural
  não é resultado automático. Conjuração Focada protege conjurações contra
  quebra por dano, sem restringir a origem de classe da magia.
- Item 9 parcialmente: 14 condições com marcação e ajuda; incapacitação
  derivada, impedimentos de movimento e falhas automáticas de FOR/DES.
  Incapacitação/morte encerram concentração. Inconsciência também encerra
  Fúria, processa Frenesi uma vez, reverte Forma Selvagem e causa queda.
  Paralisia isolada não encerra Fúria; cura não levanta automaticamente.
- Descanso curto mantém concentração; sono no longo encerra, com opção para
  exceções conscientes. Sem cronômetro real. Dados ilegíveis, notas, histórico,
  seleção/foco e pool são preservados. Sem alteração de SQL/RLS/RPC.

Limites: outras vantagens/desvantagens de condições, sentidos especiais,
identidade de alvos/origem, danos tipados, resistências/imunidades, prazos e
economia de ações ainda exigem decisão da mesa. Não se encerram ajustes de
defesa recebidos ao terminar concentração própria: podem vir de outro conjurador.
A ficha ainda não integra blocos de estatísticas das bestas. Esta etapa não
certifica todos os efeitos das classes/talentos/magias.

Verificação final: `npm run check`, 320 testes Node, tipos/build e os 12 roteiros
Chromium aprovados, incluindo 32 cenários auditados. Novo roteiro cobre troca,
cancelamento/revalidação sem gastos, rituais, fontes/CD/fila, proteção/temporários/
forma, físico/virtual/OFF, talentos/inspiração, condições/Fúria/sono, queda de
ficha antiga a 0 PV, nós/foco, callbacks obsoletos, notas/histórico por ficha,
recarga/offline e três temas/320 px/GG. Capturas desktop/celular conferidas.

## Fonte, método e limites

- Fonte: `public/books/livro-jogador-2014.pdf`, 314 páginas físicas,
  SHA-256 `76f195f3b0fdedd1305ebf9d89893092ecb8262badb5812ca3bd41f01e592a51`.
- O exemplar contém **Patrulheiro Revisado** e seus conclaves. Essa parte é uma
  adaptação presente no arquivo, não a classe original do PHB de 2014.
- Revisão por capítulos e apêndices: índice/texto integral extraído com
  `pdftotext -layout`, regras relevantes cruzadas com criação/evolução,
  `src/app/sheet.js`, `src/rules/` e os catálogos de `public/rules/`.
- As páginas abaixo são **as páginas físicas do PDF**, usadas pelo leitor em
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
| Cap. 2, raças, 16–42 | Atributos, idiomas, opções, descrições e magias raciais | Resistências, rerrolagens e gatilhos raciais não têm resolução geral automática |
| Cap. 3, classes, 44–120 | Progressão das 12 classes/41 subclasses; várias reservas e ações contextuais | Matriz por classe abaixo; contadores não controlam alvos, turnos e todos os passivos |
| Cap. 4, personalidade/antecedentes, 122–142 | 13 antecedentes, tendências, sugestões editáveis, campos narrativos e inspiração de 2014 | Personalização completa de antecedente ainda exige adaptação manual |
| Cap. 5, equipamento, 144–160 | Compras em cobre, quantidades/peso, armadura/escudo, armas e propriedades consultáveis | Penalidades por falta de proficiência, munição, recarga, consumíveis e detalhes de carga; ver itens abaixo |
| Cap. 6, personalização, 164–171 | Pré-requisitos/escolhas de multiclasse/talentos, espaços combinados e Pacto separado | Vários talentos só registram a escolha; o efeito numérico não está aplicado |
| Cap. 7, habilidades, 174–180 | Modificadores, proficiência, especialização, perícias, resistências, modo vantagem/desvantagem e bônus auditados de iniciativa | Testes passivos/condicionais, vantagem na iniciativa e rolagens mínimas ainda incompletos |
| Cap. 8, aventuras, 182–188 | Deslocamento, inventário, descansos, exaustão e gasto/recuperação de Dados de Vida por classe | Tempo de descanso, viagem, luz, sufocamento, alimento/água e atividades entre aventuras são manuais |
| Cap. 9, combate, 189–198 | Ataques/dano, CA, PV, temporários, reservas defensivas, morte/estabilidade e alguns adicionais condicionais | Resistências, crítico completo dos ataques, cobertura, ações/reações, alvo e exceções de classe ainda exigem controle manual |
| Cap. 10, conjuração, 201–205 | Preparação, rituais elegíveis, espaços por classe/Pacto, CDs, custos de feitiçaria e concentração com fila por dano | Componentes, duração, interrupções durante conjuração prolongada e economia de ações seguem manuais |
| Cap. 11, magias, 207–288 | 361 descrições e metadados, campos longos corrigidos, fórmulas auditadas unificadas e escalonamento | Não há executor de todos os efeitos das 361 magias; consultar limitações por família |
| Apêndice A, condições, 289–291 | Exaustão e 14 condições com ajuda; incapacitação, deslocamento 0 e falhas automáticas de FOR/DES | Outros modos de rolagem, sentidos, alvos e dano tipado seguem manuais |
| Apêndice B, deuses, 292–298 | Consulta no livro | Referência narrativa; não impor divindade/domínio ao jogador |
| Apêndice C, planos, 299–302 | Consulta no livro | Referência de cenário; efeitos dependem do Mestre |
| Apêndice D, criaturas, 303–310 | Consulta e reserva manual de PV da Forma Selvagem; companheiro separado | Sem seleção de bloco de criatura para forma/companheiro/familiar nem fusão de estatísticas |
| Apêndice E, leituras, 311 | Consulta no livro | Bibliografia; sem automação necessária |
| Divisórias, páginas sem conteúdo mecânico e formulários finais, demais páginas | Exibidos no leitor | Não representam regras adicionais a automatizar |

## Problemas confirmados e ordem de correção

### P1 — cálculos ou resumos que podem induzir erro

1. **Iniciativa sem todos os bônus.** `renderCombatBlock` usa apenas o modificador
   de DES. Exemplo: bardo 2, DES 14 e proficiência +2 mostra/rola +2; Versatilidade
   exige +3. O +5 de **Alerta** também não entra. Revisar **Atleta Extraordinário**
   do Campeão sem somar duas vezes a meia proficiência. Fontes: bardo 50–54,
   guerreiro 82–87, talentos 164–171 e iniciativa 189. Implementar um cálculo
   compartilhado para exibição e rolagem, com teste dessas combinações.
2. **Componentes cortados no resumo de magias.** Em 139 das 361 entradas, o campo
   `components` abre parênteses e não fecha. Ex.: Amizade, Bordão Místico, Luz.
   O extrator usa somente a primeira linha após `Componentes:`; o corpo completo
   permanece em `text`. Isso pode esconder custos e consumos. Corrigir
   `scripts/extract-phb.py`, regenerar os catálogos e conferir materiais com
   preço/consumo e campos em várias linhas. **Não editar o catálogo à mão.**
3. **Armadura sem proficiência.** A ficha calcula a CA, mas `canCastNormally` não
   verifica a proibição de conjurar por armadura sem proficiência. Também não
   integra todas as desvantagens em FOR/DES. Fonte: PDF 145–147. Deve informar a
   causa, considerar escudo, raça/classe/talento e preservar opções adaptadas.
4. **Passivos de talentos incompletos.** Exemplos confirmados: Alerta não soma
   iniciativa; Ambidestro não soma sua CA condicional; Observador não acrescenta
   o bônus aos testes passivos. Fonte: PDF 164–171. Não resolver isso com campos
   duplicados de “bônus total”: aplicar no cálculo existente com condições claras.

### P1 — controles básicos que ainda faltam

5. **Concentração.** O cadastro identifica concentração, mas não há estado único
   da magia ativa, substituição ao lançar outra, teste de CON ao sofrer dano
   (CD 10 ou metade do dano, o maior) nem encerramento integrado por incapacidade
   ou Fúria. Fonte: PDF 203–204 e descrição de Fúria. Integrar ao grimório e ao
   fluxo atual de dano, mantendo decisão explícita quando a mesa usar dado físico.
6. **Testes contra a morte.** Não há sucessos/falhas, estabilidade, efeitos de
   1/20 natural, dano a 0 PV ou morte por dano maciço. Hoje os PV apenas param em
   zero. Fonte: PDF 197–198. Usar o bloco de PV existente; cura deve encerrar o
   estado correto e não reviver automaticamente um personagem morto.
7. **Gastar Dados de Vida.** `hitDiceUsed` existe e a recuperação longa permite
   escolher a classe, mas a ficha só mostra os dados e não oferece seu gasto no
   descanso curto. Fonte: PDF 187–188. Permitir escolher classe, gastar um dado,
   somar CON e ajustar PV sem consumir dados inexistentes; efeitos como Canção
   do Descanso precisam de decisão explícita. Nesta entrega foi corrigida a dica
   antiga que anunciava recuperação integral obrigatória: ela é uma opção da mesa.
8. **Inspiração de 2014.** Existe o campo `heroicInspiration` no modelo, sem
   controle funcional correspondente na ficha. Fonte: PDF 126. Criar marcação e
   gasto para vantagem em uma jogada; não confundir com Inspiração de Bardo nem
   aplicar o rerrolar da edição 2024 ao layout moderno.
9. **Condições além da exaustão.** Envenenado, caído, agarrado, impedido,
   paralisado, cego, surdo, amedrontado, enfeitiçado, invisível, incapacitado,
   inconsciente, atordoado e petrificado estão consultáveis, sem um registro
   integrado de estado e aplicação. Fonte: PDF 289–291. Exaustão já controla
   deslocamento/PV, mas a desvantagem exibida também precisa ser considerada
   explicitamente nas rolagens. Não somar vantagens múltiplas: presença de ambas
   as condições cancela vantagem/desvantagem conforme o capítulo 7.

### P2 — dano, ações e efeitos condicionais

10. **Resistências, vulnerabilidades e imunidades.** A marca de Proteção contra
    Lâminas registra o efeito, mas `applyDamage` recebe apenas uma quantidade,
    sem tipo/origem. Fúria, traços raciais e outras resistências não reduzem esse
    dano automaticamente. Fonte: PDF 197. Pedir tipo/origem quando necessário,
    sem aplicar duas vezes uma redução já calculada pelo jogador.
11. **Críticos e ataques extras.** Intervalo de crítico e dados adicionais são
    mostrados, mas não há resolução completa de acerto crítico/condições nem
    limite de ataques por ação. Ataque Furtivo e Destruição Divina apresentam
    condições; o clique no dano comum não executa todas elas. Fontes: PDF 193–198
    e características de classe. Preservar o cálculo comum e acrescentar escolha
    contextual, sem outro cadastro de arma.
12. **Ações/reações, cobertura e alcance.** Não existe relógio de turnos nem estado
    dos alvos. Ataque de oportunidade, combate com duas armas, agarrar/empurrar,
    combate montado/submerso, surpresa e cobertura são resolvidos na mesa.
    Conjuração com ação bônus/reação depende disso. Fontes: PDF 189–198, 201–204.
    Antes de bloquear ações, definir um modo opcional de acompanhamento de turno.
13. **Equipamento e viagem.** Munição, recarga, armas arremessadas/consumíveis,
    tempo de vestir/tirar, desvantagem de Furtividade de certas armaduras e
    variante de sobrecarga não têm resolução integral. A carga básica e algumas
    penalidades de deslocamento já são calculadas. Fontes: PDF 144–160, 182–188.
    Viagem, fome/sede, sufocamento e atividades entre aventuras podem continuar
    manuais, com consulta e auxiliares opcionais, sem lotar a ficha de campos.
14. **Bestas, familiares e companheiros.** A Forma Selvagem controla PV separados
    e dano excedente, mas não importa estatísticas completas de criatura nem
    valida todas as formas. Fonte: PDF 70–75, 114–120, 303–310. Reutilizar o bloco
    da forma/companheiro, sem substituir a ficha humana ou suas notas.

## Segunda passada: erros de cálculo e interação reproduzidos

### P1 — corrigir os resultados antes de acrescentar controles

15. **Truques mostram o escalonamento, mas nem todos o rolam.** Clérigo 5 com
    Chama Sagrada: o selo mostra `2d8`, mas o clique monta `1d8`. A apresentação
    usa `getCantripDiceCount`; o lançamento genérico usa a fórmula-base de
    `spellMeta`, sem escalonamento. As magias com tratamento próprio no
    `BOOK_SPELLS_DB` seguem outro caminho. Fonte: PDF 224 e capítulo 6 sobre nível
    total. Centralizar a fórmula resolvida, inclusive em multiclasse, para selo,
    prévia, gasto e rolador usarem o mesmo resultado. Não basta mudar o texto.
16. **Cura genérica omite o modificador e o espaço maior.** Clérigo do Conhecimento
    com SAB 16: Curar Ferimentos deve rolar `1d8+3` no 1º círculo e `3d8+3` no 3º;
    ambos enviaram `1d8`. No Domínio da Vida, o 1º círculo deveria curar `1d8+6`
    nesse cenário, incluindo Discípulo da Vida, e também enviou `1d8`. Fontes:
    PDF 234 e 69. O problema está na extração/resolução genérica da fórmula,
    que não interpreta todos os modificadores e trechos “Em Níveis Superiores”.
17. **Explosão Agonizante não entra no dano.** Bruxo 2 com CAR 16 e a invocação
    escolhida: Rajada Mística enviou `1d10`, quando deveria enviar `1d10+3` para
    aquele feixe que acertou. Fonte: PDF 60 e 273. Em níveis maiores, resolver
    cada feixe/ataque e seu bônus; somar todos os dados sem conhecer os acertos
    não equivale à resolução completa. Sorvedor de Vida e outros passivos devem
    entrar na mesma revisão de modificadores condicionais.
18. **Legado Infernal perde o nível fixo da magia racial.** O tiefling de nível 3
    recebe Repreensão Infernal de 2º círculo pelo traço, mas o seletor/resolvedor
    usa 1º círculo. O dano-base correspondente fica `2d10` em vez de `3d10`.
    Fontes: PDF 42 e 276. `refresh` concede o uso racial, mas não registra
    `castLevel: 2`. Preservar a origem racial separada da magia aprendida pela
    classe, suas cargas e sua habilidade de conjuração.
19. **Dominar Magia e Assinatura Mágica ficam só nas escolhas.** Mago 18 escolhe
    as magias, mas conjurar a magia dominada, preparada e no círculo mínimo,
    gastou um espaço normal. No nível 20, a primeira utilização da assinatura
    também gastou um espaço de 3º, sem o uso gratuito registrado. Fonte: PDF 96.
    Faltam projeção das escolhas nos controles, assinatura sempre preparada,
    usos que recuperam no descanso curto/longo e opção normal de aprimorar
    gastando espaços. Não marcar toda magia da assinatura como ilimitada.
20. **PV temporários e Forma Selvagem estão na ordem errada.** Besta com 10 PV,
    personagem com 5 PV temporários e dano 4: o resultado foi besta 6/temporários
    5; deveria ser besta 10/temporários 1. Fontes: PDF 72–73 e 198. A Proteção
    Arcana continua antecedendo o dano ao personagem; depois dela, temporários
    devem proteger os PV atuais, inclusive quando esses PV são os da forma.
    A afirmação do plano anterior de que a besta sempre antecede temporários
    precisa ser corrigida junto da implementação. O teste existente usa dano
    que esgota todas as reservas: seu resultado final não distingue a ordem;
    acrescentar regressão com dano parcial, como o cenário acima.
21. **Descansos apagam estados ou concedem benefícios sem todos os requisitos.**
    Druida 8 tem Forma Selvagem por até 4 horas; um descanso de uma hora iniciado
    logo após transformar não precisa encerrá-la, mas `resetResources` limpa
    todos os estados ativos, exceto a pedra. Já `takeRest` permite iniciar o
    descanso longo a 0 PV e voltar ao máximo, embora o livro exija pelo menos
    1 PV no início. Fontes: PDF 73 e 187. Definir duração/requisitos por efeito;
    não usar uma limpeza geral como substituto da passagem do tempo. Limite de
    um descanso longo por 24 h e interrupções também seguem manuais.
22. **Proteção Arcana ignora abjuração de outra classe.** Mago abjurador 2/clérigo
    1 com INT 16, conjurando Escudo da Fé como clérigo, deveria poder criar a
    proteção de 7 PV; a reserva ficou em 0. Fonte: PDF 96. `onSpellCast` exige
    `spell.classId === 'mago'`, condição que a característica não impõe. A
    elegibilidade deve vir do personagem e da escola/círculo da magia.
23. **Ajuste direto de Constituição não acompanha os PV.** Guerreiro 5, CON 14
    para 16 pelo botão da ficha: PV máximos ficaram 44, em vez de 49. Fonte:
    PDF 178. O motor de evolução já calcula a mudança retroativa; `changeAbility`
    não o faz. Separar ajuste permanente de atributo de transformações/bônus
    temporários e preservar danos/ajustes manuais existentes ao recalcular.
24. **Metadados de alvo/ataque não são confiáveis em todas as magias.** Raio
    Ardente aparece elegível para Gêmea, embora possa atingir mais de uma
    criatura; Chicote de Espinhos não recebe a indicação de ataque mágico.
    Fontes: PDF 79, 271 e 224. A quebra `corpo-a- corpo` no texto extraído não
    casa com a expressão de detecção. Rever normalização, múltiplos raios/alvos
    e dependência do nível de conjuração. Preservar e identificar a adaptação
    específica de Mísseis Mágicos; ela não autoriza toda magia de vários alvos.

### P2 — completude, apresentação e adaptações não identificadas

25. **Atirador de Magia omite uma opção válida.** No criador, ao escolher a lista
    de druida para esse talento, só Chicote de Espinhos é oferecido; Criar Chamas
    também envolve ataque mágico e deveria estar disponível. Fontes: PDF 166 e
    descrição da magia. A lista de seis IDs em `featRequirements` é incompleta.
    A seleção e a descrição de ataque devem compartilhar classificação validada.
26. **A carga exclui moedas sem identificar a adaptação.** Acrescentar 1.000 po
    não mudou o peso mostrado: 57,75 kg permaneceu 57,75 kg, quando incluir as
    moedas levaria a 67,75 kg. Fonte: PDF 144, aproximadamente 10 g por moeda.
    `getCurrentLoadKg` exclui moedas expressamente. Oferecer escolha ou identificar
    que o total é apenas dos itens; não anunciar carga total conforme o livro.
27. **O histórico pode atribuir absorção à reserva errada.** Com proteção de 10
    PV e 5 PV temporários, sofrer 4 de dano deixa temporários intactos, mas a
    ação salva diz “4 absorvidos por PV temporários”. O registro calcula essa
    quantidade antes de aplicar proteção/forma. Retornar de `applyDamage` a
    decomposição efetiva e usá-la na mensagem, sem recalcular por aproximação.

## Cenários executados e reprodução

O diagnóstico original executou `scripts/audit-phb-scenarios.cjs` contra o build da base `7667ae9`,
em Chromium descartável sob `/D-D/`, com fixtures sintéticas. São **21 cenários
direcionados, 20 divergências e 1 controle conforme**. Algumas divergências
compartilham a mesma causa; isso não representa 20 regras independentes nem uma
porcentagem de cobertura do livro. Não houve consulta a contas ou dados reais.
A tabela abaixo preserva os achados dessa base. Após as correções da primeira
etapa, o roteiro ampliado passou em **32 cenários, sem divergências**; agora
também integra a suíte de aprovação por `tests/audited-rules-browser.cjs`.

| Cenário | Resultado do livro no cenário | Resultado observado |
| --- | --- | --- |
| Chama Sagrada, clérigo 5 | Mostrar e rolar 2d8 | Mostra 2d8, rola 1d8 |
| Curar Ferimentos, SAB 16, círculo 1 | 1d8+3 | 1d8 |
| Mesma magia no círculo 3 | 3d8+3 | 1d8 |
| Mesma magia, Domínio da Vida, círculo 1 | 1d8+6 | 1d8 |
| Explosão Agonizante, CAR 16, bruxo 2 | 1d10+3 no feixe que acertou | 1d10 |
| CON 14 → 16, guerreiro 5 | PV máximos 44 → 49 | 44 → 44 |
| Repreensão Infernal racial do tiefling 3 | Uso como círculo 2 | Círculo 1 |
| Dominar Magia, mago 18, magia preparada | Círculo mínimo sem gastar espaço | Gastou 1 espaço |
| Assinatura Mágica, mago 20, primeiro uso | Uso gratuito próprio | Gastou espaço; sem carga própria |
| Forma 10 PV + temporários 5, dano 4 | Forma 10, temporários 1 | Forma 6, temporários 5 |
| Forma recém-ativada, druida 8, descanso 1 h | Pode continuar dentro das 4 h | Desativada incondicionalmente |
| Descanso longo iniciado a 0 PV | Sem benefícios do descanso longo | Recuperou 44 PV |
| Abjurador 2/clérigo 1, INT 16, Escudo da Fé | Pode criar proteção de 7 PV | Proteção 0 |
| Mago sem proficiência, cota/escudo, conjurar | Restrição informada/aplicada | Lançamento permitido |
| Proteção 10 + temporários 5, dano 4, registro | 0 absorvido por temporários | Histórico informa 4 |
| Bardo 2, DES 14, iniciativa | +3 com Versatilidade | +2 |
| Raio Ardente, elegibilidade de Gêmea 2014 | Não elegível | Elegível |
| Chicote de Espinhos, classificação | Ataque mágico | Nenhuma defesa/ataque indicado |
| Acrescentar 1.000 moedas à carga | +10 kg, ou adaptação identificada | Nenhuma alteração na carga |
| Atirador de Magia, lista de druida | Oferecer Criar Chamas | Opção ausente |
| Controle: guerreiro 5 → 6, PV fixos | 44 → 52 | 44 → 52, conforme |

Para repetir, com dependências e Chromium instalados:

```sh
npm run build
node scripts/audit-phb-scenarios.cjs > /tmp/critcall-auditoria.json
```

Nesta máquina foi necessário prefixar o segundo comando com
`PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64`. O script bloqueia requisições
fora do servidor local e usa armazenamento do navegador temporário. Ele relata
`matches: false` como achado; na CLI, seu código 0 indica execução concluída,
não aprovação das regras. O wrapper de navegador exige zero divergências e
falha quando qualquer cenário diverge. `sourceCommit` identifica o código da
execução; não distribuir `dist/` antigo ao auditar outro commit.

Verificação após a implementação: 279 testes Node, tipos/build e os dez
roteiros Chromium aprovados, incluindo o wrapper dos 32 cenários. No ambiente
local, a última execução completa foi seguida de uma nova passagem de Node,
build e cenários auditados após os ajustes finais de compatibilidade/validação.
Esses resultados cobrem os casos descritos, sem equivaler à automação do livro.

## Classes e subclasses: o contador não é o efeito completo

Todas as subclasses do catálogo estão nesta matriz. A coluna final registra
exemplos de trabalho restante, não uma promessa de que as outras características
estejam todas automatizadas. As descrições continuam sendo a referência.

| Classe / PDF | Subclasses conferidas | Cobertura operacional existente | Próxima revisão necessária |
| --- | --- | --- | --- |
| Bárbaro, 45–49 | Furioso; Guerreiro Totêmico | Fúria, dano com FOR, Frenesi/exaustão, CA alternativa e extras de Crítico Brutal | Resistências e vantagem; duração/gatilhos; teste/CD crescente de Fúria Implacável |
| Bardo, 50–54 | Conhecimento; Bravura | Reserva/dado de inspiração, proficiências/especialização, segredos, conjuração, iniciativa de Versatilidade e Canção do Descanso opcional | Inspiração de Bardo recebida/Palavras de Interrupção na jogada; recuperação ao iniciar combate |
| Bruxo, 55–61 | Arquifada; Corruptor; Grande Antigo | Pacto, Arcanum, usos de patrono/invocações e Bênção do Obscuro | Explosão Agonizante/Sorvedor de Vida; gastos de espaço de invocações não equivalem ao contador diário; efeitos contra alvos |
| Clérigo, 62–69 | Conhecimento; Enganação; Guerra; Luz; Natureza; Tempestade; Vida | Preparação/domínios, Canalizar compartilhado, usos e Intervenção | Efeitos de cada domínio no alvo, cura/dano condicionado e Expulsar/Destruir Mortos-Vivos por ND |
| Druida, 70–75 | Terra; Lua | Preparação/círculo, Forma Selvagem/PV, cura da Lua, Recuperação Natural e concentração mantida na transformação | Bloco de besta/estatísticas e custo de elemental; CON da forma informada no teste |
| Feiticeiro, 76–81 | Magia Selvagem; Linhagem Dracônica | Feitiçaria/metamágica compartilhada, conversão, Marés de Caos e CA dracônica | Tabela de surto/gatilhos, efeitos de Afinidade Elemental e elegibilidade completa de metamagias; adaptações devem permanecer identificadas |
| Guerreiro, 82–87 | Campeão; Mestre de Batalha; Cavaleiro Arcano | Retomar o Fôlego, Surto, Indomável, superioridade, estilos, crítico e magias | Atleta Extraordinário/iniciativa; rerrolagem de Combate com Armas Grandes; manobras/reações; Sobrevivente |
| Ladino, 88–92 | Ladrão; Assassino; Trapaceiro Arcano | Especialização, dados/condições de Ataque Furtivo, usos avançados e magias | Talento Confiável na rolagem; Esquiva Sobrenatural/Evasão; surpresa/Assassinar e Ação Ardilosa |
| Mago, 93–100 | Abjuração; Adivinhação; Conjuração; Encantamento; Evocação; Ilusão; Necromancia; Transmutação | Livro/preparo/ritual, Dominar/Assinatura, recuperação, Proteção Arcana inclusive multiclasse, Conjuração Focada, Presságio e usos/estados de escola | Efeitos por alvo, demais bônus de escola, lacaios, pedra e Sobrecarga; fluxo de troca temporal das escolhas |
| Monge, 101–106 | Mão Aberta; Sombra; Quatro Elementos | Chi compartilhado e gastos escolhidos, movimento/CA e curas/usos | Artes Marciais/dano desarmado em todas as condições, Atordoar/Evasão/Defletir Projéteis e recuperação ao iniciar combate |
| Paladino, 107–113 | Devoção; Anciões; Vingança | Cura pelas Mãos, Canalizar, Arma Sagrada, aura própria nos testes, preparação e dados de Destruição | Aplicação a aliados/consciência e condições dos juramentos; cura no alvo e consumo de espaços no fluxo de dano |
| Patrulheiro Revisado, 114–120 | Besta; Caçador; Rastreador Subterrâneo | Progressão/seleções da adaptação, conjuração, extras condicionais e PV do companheiro | Inimigo favorito, exploração, iniciativa/primeiro turno e estatísticas/comandos do companheiro; não misturar regras do patrulheiro original |

## Raças e antecedentes

As 15 opções são Anão da Colina/Montanha, Alto Elfo/Elfo da Floresta/Drow,
Halfling Pés Leves/Robusto, Humano/Humano Variante, Draconato, Gnomo da
Floresta/das Rochas, Meio-Elfo, Meio-Orc e Tiefling.

Os ajustes/seleções de criação não bastam para executar **Sortudo dos halflings**,
**Ataques Selvagens/Resistência Implacável do meio-orc**, sopro do draconato,
sensibilidade solar do drow, resistências e vantagens raciais. Esses casos
precisam de efeitos condicionais ou uso no lugar existente. Visão no escuro,
idiomas, ferramentas, transe, máscaras naturais e características sociais podem
permanecer como consulta quando não houver uma ação mecânica da ficha a resolver.

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
| Ambidestro | Registro | +1 CA condicional, armas elegíveis e sacar/guardar |
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
| Maestria em Armadura Pesada | +1 FOR | Redução 3 contra tipos/origens elegíveis |
| Matador de Conjuradores | Registro | Reação, concentração do alvo e vantagem situacional |
| Mente Afiada | +1 INT | Orientação, horário e memória consultáveis |
| Mestre de Armas | +1 FOR/DES, quatro proficiências | Demais condições do ataque usam o fluxo comum |
| Mestre de Armas Grandes | Registro | -5/+10 e ataque bônus após crítico/abate |
| Mestre de Escudo | Registro | Empurrão, bônus de resistência e reação condicionais |
| Mobilidade | +3 m no deslocamento | Terreno difícil/Disparada e oportunidade |
| Observador | +1 INT/SAB | +5 passivo; leitura labial consultável |
| Perito | Três perícias/ferramentas | Revisar escolhas já dominadas e rolagem contextual com ferramenta |
| Poliglota | +1 INT e três idiomas | Cifras consultáveis |
| Resiliente | +1 atributo e proficiência em resistência | Não concede vantagem nem bônus adicional além da proficiência |
| Robusto | +2 PV por nível, inclusive retroativo | Edição manual de atributos/efeitos segue os limites apontados acima |
| Sentinela | Registro | Oportunidade, reação e deslocamento do alvo |
| Sorrateiro | Registro | Ocultação/luz e revelação por ataque falho |
| Sortudo | Registro | Três pontos e escolha do dado no contexto da jogada |
| Resistente | +1 CON; mínimo de cura ao gastar Dados de Vida | Efeitos cobertos nos cenários testados de descanso |
| Proteção Leve | +1 FOR/DES e proficiência leve | Penalidades de armadura ainda precisam integração |
| Proteção Moderada | +1 FOR/DES, média e escudo | Mesma revisão de elegibilidade/penalidades |
| Proteção Pesada | +1 FOR e proficiência pesada | Mesma revisão de elegibilidade/penalidades |

Não há evidência suficiente para marcar todos esses efeitos como concluídos.
Cada implementação deve registrar a condição exata, o cálculo que passa a usar
e o caso de teste, em vez de um único “talentos implementados”.

## Magias e conteúdo narrativo

As 361 magias possuem consulta. `spellMeta` também infere efeitos por texto e
há tratamentos específicos; uma fórmula encontrada não equivale à execução da
magia. Área/alvos, componentes consumidos, alcance, cobertura, resistência do
alvo, duração e várias curas/transformações continuam sob decisão do jogador.

A concentração recebeu controle na terceira etapa acima. O trabalho seguinte
inclui dano tipado e organização das magias por família de efeito.
Não acrescentar 361 controles separados. Reutilizar
os campos do grimório, PV/efeitos e o rolador existentes. A Magia Gêmea adaptada
da mesa deve ser distinguida do texto de 2014, sem mudar escolhas pessoais.

Deuses, planos, interpretação e bibliografia não estão “faltando” por permanecerem
consultáveis. A ficha deve ajudar a decidir e registrar, sem tentar arbitrar toda
a aventura ou transformar consulta narrativa em campos obrigatórios.

## Entregas seguintes sugeridas

1. [x] Unificar fórmula mostrada/rolada nos casos auditados: truques, cura,
   aprimoramento, Discípulo da Vida/Explosão Agonizante, nível racial e Gêmea.
   Acrescentadas regressões. Outros passivos continuam na matriz de pendências.
2. [x] Corrigir dano/temporários/forma, Constituição permanente, descanso longo
   a 0 PV, forma no descanso curto, Proteção Arcana multiclasse e absorção real.
   Duração/interrupções da forma e limite de descansos seguem manuais.
3. [x] Corrigir bônus auditados de iniciativa, Dominar Magia/Assinatura, campos
   longos de componentes, Atirador de Magia e inclusão de moedas na carga.
4. [x] Completar o bloco de PV: Dados de Vida, morte/estabilidade e inspiração,
   nos locais existentes e com dado físico/virtual.
5. [ ] Unificar concentração/condições/dano tipado e a explicação dos efeitos;
   concentração e parte das condições já integradas. Dano tipado e os demais
   efeitos condicionais seguem pendentes; não automatizar redução sem a origem.
6. [ ] Revisar a matriz de efeitos das 12 classes/41 subclasses, raças e 42
   talentos, marcando cada efeito como calculado, uso controlado ou manual.
7. [ ] Ampliar famílias de magias e criaturas, após os contratos comuns estarem
   definidos. Viagem e atividades entre aventuras ficam como auxiliares opcionais.

Os cenários da primeira etapa foram corrigidos; os controles e exceções restantes
seguem nas listas de pendências. Zoom, históricos por ficha, ajustes de defesa e
ajudas vieram das entregas anteriores. O plano anterior de refatoração continua em
[REFATORACAO-2014.md](REFATORACAO-2014.md); seus itens concluídos não substituem
esta auditoria mais ampla.
