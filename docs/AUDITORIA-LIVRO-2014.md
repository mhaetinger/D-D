# Auditoria de cobertura do Livro do Jogador — 19/10/2026

Há regras que ainda precisam de adaptação na ficha. Ter uma descrição, uma escolha
no criador ou um contador não significa resolver todos os efeitos daquela regra.
Este relatório distingue esses casos e serve de roteiro para as próximas entregas.

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
| Cap. 4, personalidade/antecedentes, 122–142 | 13 antecedentes, tendências, sugestões editáveis e campos narrativos | Inspiração de 2014 sem controle utilizável; personalização completa de antecedente ainda exige adaptação manual |
| Cap. 5, equipamento, 144–160 | Compras em cobre, quantidades/peso, armadura/escudo, armas e propriedades consultáveis | Penalidades por falta de proficiência, munição, recarga, consumíveis e detalhes de carga; ver itens abaixo |
| Cap. 6, personalização, 164–171 | Pré-requisitos/escolhas de multiclasse/talentos, espaços combinados e Pacto separado | Vários talentos só registram a escolha; o efeito numérico não está aplicado |
| Cap. 7, habilidades, 174–180 | Modificadores, proficiência, especialização, perícias, resistências e modo vantagem/desvantagem | Iniciativa não incorpora todos os bônus; testes passivos/condicionais e rolagens mínimas ainda incompletos |
| Cap. 8, aventuras, 182–188 | Deslocamento, inventário, descansos e exaustão | Gasto de Dados de Vida sem interface; viagem, luz, sufocamento, alimento/água e atividades entre aventuras são manuais |
| Cap. 9, combate, 189–198 | Ataques/dano, CA, PV, temporários, reservas defensivas e alguns adicionais condicionais | Morte/estabilidade, resistências, crítico completo, cobertura, ações/reações e alvo ainda exigem controle manual |
| Cap. 10, conjuração, 201–204 | Preparação, rituais elegíveis, espaços por classe/Pacto, CDs e custos de feitiçaria | Concentração, componentes, duração e economia de ações não são um sistema integrado |
| Cap. 11, magias, 207–288 | 361 descrições e metadados; várias fórmulas de rolagem e escalonamento | 139 resumos de componentes truncados; não há executor de todos os efeitos das 361 magias |
| Apêndice A, condições, 289–291 | Consulta e controle próprio de exaustão | Demais condições não possuem estado/efeitos integrados |
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

## Classes e subclasses: o contador não é o efeito completo

Todas as subclasses do catálogo estão nesta matriz. A coluna final registra
exemplos de trabalho restante, não uma promessa de que as outras características
estejam todas automatizadas. As descrições continuam sendo a referência.

| Classe / PDF | Subclasses conferidas | Cobertura operacional existente | Próxima revisão necessária |
| --- | --- | --- | --- |
| Bárbaro, 45–49 | Furioso; Guerreiro Totêmico | Fúria, dano com FOR, Frenesi/exaustão, CA alternativa e extras de Crítico Brutal | Resistências e vantagem; duração/gatilhos; teste/CD crescente de Fúria Implacável |
| Bardo, 50–54 | Conhecimento; Bravura | Reserva/dado de inspiração, proficiências/especialização, segredos e conjuração | Iniciativa de Versatilidade; Canção do Descanso; inspiração recebida/Palavras de Interrupção na jogada; recuperação ao iniciar combate |
| Bruxo, 55–61 | Arquifada; Corruptor; Grande Antigo | Pacto, Arcanum, usos de patrono/invocações e Bênção do Obscuro | Gastos de espaço exigidos por invocações não equivalem a seu contador diário; efeitos contra alvos e bônus condicionais de invocações |
| Clérigo, 62–69 | Conhecimento; Enganação; Guerra; Luz; Natureza; Tempestade; Vida | Preparação/domínios, Canalizar compartilhado, usos e Intervenção | Efeitos de cada domínio no alvo, cura/dano condicionado e Expulsar/Destruir Mortos-Vivos por ND |
| Druida, 70–75 | Terra; Lua | Preparação/círculo, Forma Selvagem/PV, cura da Lua e Recuperação Natural | Bloco de besta/estatísticas, custo de elemental e concentração mantida na transformação |
| Feiticeiro, 76–81 | Magia Selvagem; Linhagem Dracônica | Feitiçaria/metamágica compartilhada, conversão, Marés de Caos e CA dracônica | Tabela de surto/gatilhos, efeitos de Afinidade Elemental e elegibilidade completa de metamagias; adaptações devem permanecer identificadas |
| Guerreiro, 82–87 | Campeão; Mestre de Batalha; Cavaleiro Arcano | Retomar o Fôlego, Surto, Indomável, superioridade, estilos, crítico e magias | Atleta Extraordinário/iniciativa; rerrolagem de Combate com Armas Grandes; manobras/reações; Sobrevivente |
| Ladino, 88–92 | Ladrão; Assassino; Trapaceiro Arcano | Especialização, dados/condições de Ataque Furtivo, usos avançados e magias | Talento Confiável na rolagem; Esquiva Sobrenatural/Evasão; surpresa/Assassinar e Ação Ardilosa |
| Mago, 93–100 | Abjuração; Adivinhação; Conjuração; Encantamento; Evocação; Ilusão; Necromancia; Transmutação | Livro/preparo/ritual, recuperação, Proteção Arcana, Presságio e vários usos/estados de escola | Efeitos por alvo, bônus de dano/escola, invocações e lacaios; custos e troca da Pedra do Transmutador; resolução de Sobrecarga |
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

A lista completa para não esquecer nenhum na revisão de efeitos:

| Grupo de trabalho | Talentos e efeitos que precisam de conferência/integração |
| --- | --- |
| Rolagens, passivos e defesa | Alerta; Ambidestro; Atleta; Ator; Duelista Defensivo; Explorador de Cavernas; Mente Afiada; Observador; Resiliente; Sortudo; Sorrateiro |
| Dano, ataques e reações | Adepto Elemental; Adepto Marcial; Atacante Bestial; Atirador Aguçado; Combatente Montado; Especialista em Besta; Especialista em Briga; Imobilizador; Investida Poderosa; Maestria em Arma de Haste; Matador de Conjuradores; Mestre de Armas; Mestre de Armas Grandes; Mestre de Escudo; Sentinela |
| Magias e concentração | Atirador de Magia; Conjurador de Guerra; Conjurador de Ritual; Iniciado em Magia |
| Cura, PV, movimento e equipamento | Curandeiro; Líder Inspirador; Maestria em Armadura Média; Maestria em Armadura Pesada; Mobilidade; Resistente; Robusto; Proteção Leve; Proteção Moderada; Proteção Pesada |
| Proficiências/idiomas e benefícios relacionados | Perito; Poliglota |

Não há evidência suficiente para marcar todos esses efeitos como concluídos.
Cada implementação deve registrar a condição exata, o cálculo que passa a usar
e o caso de teste, em vez de um único “talentos implementados”.

## Magias e conteúdo narrativo

As 361 magias possuem consulta. `spellMeta` também infere efeitos por texto e
há tratamentos específicos; uma fórmula encontrada não equivale à execução da
magia. Área/alvos, componentes consumidos, alcance, cobertura, resistência do
alvo, duração e várias curas/transformações continuam sob decisão do jogador.

A próxima etapa é corrigir o extrator e a concentração e, depois, organizar as
magias por família de efeito. Não acrescentar 361 controles separados. Reutilizar
os campos do grimório, PV/efeitos e o rolador existentes. A Magia Gêmea adaptada
da mesa deve ser distinguida do texto de 2014, sem mudar escolhas pessoais.

Deuses, planos, interpretação e bibliografia não estão “faltando” por permanecerem
consultáveis. A ficha deve ajudar a decidir e registrar, sem tentar arbitrar toda
a aventura ou transformar consulta narrativa em campos obrigatórios.

## Entregas seguintes sugeridas

1. [ ] Corrigir iniciativa/passivos confirmados e extração dos componentes, com
   regressões para classe/talento e campos multilinha.
2. [ ] Completar o bloco de PV: Dados de Vida, morte/estabilidade e inspiração,
   nos locais existentes e com dado físico/virtual.
3. [ ] Unificar concentração/condições/dano tipado e a explicação dos efeitos;
   não automatizar uma redução sem conhecer sua origem.
4. [ ] Revisar a matriz de efeitos das 12 classes/41 subclasses, raças e 42
   talentos, marcando cada efeito como calculado, uso controlado ou manual.
5. [ ] Ampliar famílias de magias e criaturas, após os contratos comuns estarem
   definidos. Viagem e atividades entre aventuras ficam como auxiliares opcionais.

Estas pendências não foram implementadas nesta entrega. A entrega atual corrige
zoom, separa históricos por ficha, melhora os ajustes de defesa/ajudas e corrige
a descrição dos Dados de Vida. O plano anterior de refatoração continua em
[REFATORACAO-2014.md](REFATORACAO-2014.md); seus itens concluídos não substituem
esta auditoria mais ampla.
