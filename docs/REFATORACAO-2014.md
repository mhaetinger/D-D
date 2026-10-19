# Revisão universal das regras — 19/10/2026

Base: Livro do Jogador local (314 páginas), capítulos 3, 5, 6, 9, 10,
descrições de magias e apêndice A. O exemplar inclui Patrulheiro Revisado,
que permanece identificado como adaptação. Extração completa consultável com
`pdftotext -layout public/books/livro-jogador-2014.pdf arquivo.txt`.

## Plano técnico e aceite

1. [x] Balões: compactar e justificar os corpos em `src/styles/` e no CSS do criador.
2. [x] Armas: reconciliar catálogo/importações e calcular proficiência, mãos,
   habilidade, magia e estados em `src/rules/combat.ts`; integrar ataques/editor.
3. [x] Recursos: modelo por classe/subclasse, preparação, descansos e exaustão
   em `src/rules/`; controles em contexto, sem recursos de classes ausentes.
4. [x] Textos: normalização de objetos legados com preservação dos dados e
   leitura compatível em `src/storage/`.
5. [x] CA: alternativas de fórmula e bônus separados; escolha automática/manual
   e explicação verificável em `src/rules/combat.ts`.
6. [x] Criador: sugestões em select + edição livre; história e descrição compactas.
7. [x] Livro: zoom local por teclado/rodinha, mantendo o zoom da interface.
8. [x] Criação: auditar 27 pontos, valores adaptados e compras/carteira do Cap. 5.
9. [x] Identidade: exportar somente CritCall e migrar nomes antigos silenciosamente,
   preservando originais, contas, filas e formatos importáveis.
10. [x] Verificar regras e casos de fronteira, sincronização/login e navegador;
    registrar somente execuções concluídas; entregar para revisão por PR.

## Contratos da revisão

- Não somar fórmulas de CA. A segunda Defesa sem Armadura não é adquirida por
  multiclasse (cap. 6). Proteção contra Lâminas concede resistência; Aparo reduz
  dano, sem bônus universal de CA. Condições não verificáveis pedem opção explícita.
- Fúria exige ataque corpo a corpo com Força para o bônus; Frenesi aplica
  exaustão ao terminar. Descanso reduz exaustão com alimento e bebida; sem isso,
  mantém o nível. Dano da besta e Proteção Arcana antecedem PV temporários/reais.
- Magias preparadas/sempre preparadas são por classe. Ritual do grimório de
  mago não permite lançamento normal sem preparo. Pacto permanece separado.
- Dados reais do jogador não entram em commits, testes, cache público ou PDFs.
  A transcrição pessoal previamente autorizada continua sendo tarefa separada.

## Como a ficha resolve condições

O motor só gera recursos para as classes, subclasses e níveis presentes. Usos,
reservas, estados, alvos e presságios ficam em `ruleState`, dentro da própria
ficha; anotações pessoais continuam fora dela. Recursos com custo compartilham
a reserva original: Chi, feitiçaria e Canalizar Divindade não são duplicados.

Ataque Furtivo, Destruição Divina e Assassino de Colossos mostram seus dados e
condições; acertar, ter vantagem, conhecer o tipo do alvo e decidir gastos são
decisões do jogador. Efeitos temporários têm encerramento explícito, sem relógio
de combate ou avanço automático de turnos. PV e estatísticas da forma de besta
são informados pelo jogador; o painel mostra os limites e controla a reserva,
sem prometer catálogo/validação completa de todas as bestas. Companheiro e
Patrulheiro Revisado continuam identificados como adaptação do exemplar local.

Intervenção Divina bem-sucedida bloqueia nova tentativa por sete dias, inclusive
após descanso. Olhar Hipnotizante encerra o uso naquele alvo até descanso longo.
Os demais efeitos por alvo devem ser resolvidos pelas condições de sua descrição;
não há automação de ações de outras criaturas ou compartilhamento de mesa.

## Auditoria de dados e moeda

- Backups novos: `critcall.character-backup`; cache de fichas e recuperações:
  `critcall_characters_v1` / `critcall_recovery_v1`. A camada `legacy.ts`
  reconhece os identificadores históricos somente para ler/copiar, preservando
  originais. Não reescreve o histórico público do Git.
- IDs/revisões de operações já enfileiradas são mantidos até confirmação. A
  projeção de preferências/recuperações antigas usa o identificador atual;
  documentos atuais, inclusive tombstones, têm precedência sobre aliases.
- Migração textual guarda o material original. Uma string já danificada não
  contém o objeto perdido: a interface informa ausência de texto recuperável.
- Mercado usa cobre inteiro e valida orçamento, quantidades e itens do catálogo.
  Separadores de milhar em português são reconhecidos (luneta: 1.000 po).
  Valores adaptados e itens livres ficam separados das compras do catálogo.

## Verificações executadas em 19/10/2026

- `npm run check`: 259 testes Node, tipos/build e os nove roteiros Chromium
  aprovados. Inclui login em `/` e `/D-D/`, sincronização/isolamento por conta,
  imagens privadas, continuidade local, offline real, criação, dado e leitor.
- Após os últimos ajustes de Proteção Arcana e Pedra do Transmutador:
  `npm test` com **260/260**, `npm run build` e `tests/rules-browser.cjs`
  aprovados novamente. Casos de Arcanum compartilhado, Totem do nível 3,
  Frenesi fatal e preservação de preferência sem espaço também estão cobertos.
- Interface de regras verificada em três temas, 320 px e fonte GG;
  texto importado legível, proficiência/mãos, estados, persistência e zoom local.
- `git diff --check` e varredura da identidade antiga no projeto/build sem achados.
  Histórico do Git e dados pessoais existentes permanecem preservados.
- Nenhum SQL/RLS/RPC foi alterado; `test:database` não foi executado localmente
  nesta revisão. Login e sincronização usam o SDK real com HTTP simulado nos
  testes de navegador; não substituem a validação entre dispositivos reais.

A entrega segue em `feature/regras-universais`, por PR para `develop`, sem
mescla/publicação desta revisão antes da aprovação do responsável.

## Revisão de apresentação após teste do responsável

O bloco independente abaixo das armas foi removido: repetia informações do
grimório e afastava controles de seus campos. `placement.ts` atribui um único
lugar a cada ação. Descrições do livro permanecem nas características existentes.

| Controle | Lugar |
| --- | --- |
| Fúria, Frenesi, Chi, inspiração e demais usos/estados | Na própria característica, com consulta recolhível |
| Feitiçaria, Metamágica e origem do feiticeiro | Painel existente de Fonte de Magia no grimório |
| Pacto e Mestre Místico | Painel existente de Magia de Pacto |
| Arcanum com magia registrada | Contador da própria magia |
| Preparação e recuperação de espaços | Barra do grimório |
| Exaustão, proteção e PV da besta | Bloco de combate/PV |
| Fórmula e bônus de defesa | Ajustes junto à CA |
| Recuperação de Dados de Vida | Junto à lista de Dados de Vida |

Reservas compartilhadas não são reexibidas em cada atalho de gasto. Bênção do
Obscuro permanece junto aos PV temporários; o botão repetido no Pacto foi retirado.
Verificação desta revisão: 261 testes Node, tipos/build, Chromium de regras,
ficha e armazenamento/offline. O roteiro de regras confere unicidade dos controles,
gastos/persistência e os dois layouts em três temas/320 px/fonte GG.
