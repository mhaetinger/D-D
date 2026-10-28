# Arquitetura

Este documento descreve módulos e contratos existentes. O estado da publicação
e as validações externas estão em [RETOMADA.md](RETOMADA.md); o progresso e o
roteiro de mecânicas estão em [AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md).
Seções datadas registram a implementação do módulo, sem substituir esses estados.

## Fronteira da futura interação entre fichas

As regras recebem o documento de um personagem e o motor por argumentos. Os
controles aplicam custos/resultados nesse documento, com prévia e revalidação.
Essa separação permite reaproveitar cálculo sem acoplar regras a transporte ou
identidade remota. A guarda `src/sheet-edit/access.ts` é apenas uma fronteira de
interface para um contexto futuro; não fornece autorização no servidor.

Efeitos recebidos de outro personagem ainda são registrados pelo jogador. Uma
futura mesa compartilhada precisará identificar origem/alvo, conferir permissão
no servidor, definir confirmação, idempotência e conflitos, e testar isolamento
entre participantes. A sincronização pessoal manual não é esse protocolo.
As entregas da ficha individual não criam polling nem novas chamadas para
antecipar essa etapa. Estado/limites das mecânicas ficam somente na auditoria.

## Base implementada

A interface aprovada foi preservada, com migração gradual para Vite e TypeScript.
O aplicativo continua independente de mesa, login ou serviço externo para usar as
fichas locais. Não foi adotado um novo framework de interface nesta etapa.

| Local | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura da ficha e diálogos existentes. |
| `src/main.ts` | Fontes, estilos, ícones, interface, backup e registro offline. |
| `src/app/sheet.js` | Interface anterior extraída, ainda com ponte global para eventos dos cartões/assistentes. |
| `src/styles/` | Tailwind compilado e estilos/temas preservados. |
| `src/storage/` | Formato/validação de fichas, migração local, backup, importação e recuperação. |
| `src/import/` | Leitura local de PDF, proposta de vínculos e revisão comum de PDF/backups/ficha atual antes de criar cópias. |
| `src/sheet-edit/` | Campos editáveis na ficha, painéis internos, propostas validadas, rascunhos/foco e contrato de permissão para futuras salas. |
| `src/auth/` | Configuração pública, sessão Supabase, entrada principal e interface de cadastro/recuperação/perfil. |
| `src/sync/` | Documentos pessoais, fila IndexedDB, cliente Supabase, datas e recuperação de versões. |
| `supabase/migrations/` | Tabelas/RLS/RPC de salvamento pessoal; migração aplicada ao CritCall real em 16/10/2026. |
| `src/media/` | Redução/validação de imagens, cache IndexedDB por conta e upload/download autenticado no Storage privado. |
| `src/app/dice-dock.ts` | Gestos, posição e último total do dado compacto; rolagem reutiliza o motor da bandeja. |
| `src/app/dice-dock-appearance.ts` | Aura e símbolo do modo selecionado, sem interferir em gestos ou rolagens. |
| `src/pwa/` | Registro do service worker e informação de disponibilidade offline. |
| `public/rules/` | Motor sem DOM, catálogos, assistente, balões, rolagem e animações. |
| `public/book.html`, `public/books/`, `public/vendor/pdfjs/` | Biblioteca, dois PDFs e leitor com suas licenças. |
| `scripts/build-offline.mjs` | Valida o artefato e gera cache versionado a partir dos arquivos reais do build. |
| `tests/` | Regras, 41 subclasses, armazenamento e navegador sobre o build. |
| `dist/` | Saída gerada para publicação; não é fonte de desenvolvimento. |

Os scripts clássicos de regras permanecem compatíveis com Node para seus testes.
A ponte em `sheet.js` conserva os eventos existentes durante a extração; novos
módulos devem usar APIs explícitas e listeners, reduzindo essa ponte aos poucos.
Regras não devem depender de DOM, armazenamento ou rede.

## Importação revisada

`pdf-reader.ts` usa o PDF.js local fixado do leitor, com worker/recursos relativos
ao endereço do aplicativo (raiz ou `/D-D/`). Recupera widgets por página mesmo
quando a árvore AcroForm não expõe seus campos. Não executa ações/JavaScript,
links ou anexos, não lê pixels de retratos e não envia o PDF. Limites: 15 MB,
20 páginas, 4.000 campos, nome até 512 caracteres, valor até 100.000 e texto
agregado até 2 milhões; carregamento interrompido após 25 segundos. PDF sem
campos preenchidos é recusado com orientação; OCR/PDF achatado não implementados.

`pdf-character.ts` associa nomes dos formulários comuns 2014/2024 ao contrato
atual, mantendo regras de 2014. Atributo/nível/valor obrigatório ausente exige
revisão; não vira um personagem pronto com valores inventados. Magias usam o
catálogo por ID/nome/aliases e deixam origem ambígua vazia. CA é o total manual
do arquivo; não se duplica escudo. Bônus de perícias e ataques escritos são
preservados; arma só passa a cálculo automático por escolha explícita. Reservas
são propostas por classe sem confundir Pacto com Conjuração; os usos são
conferidos na revisão. História/aparência mapeadas ficam na ficha e campos
adicionais podem ser guardados como texto em `privateNotes`, nunca pixels ou PDF.

`character-review.ts` propõe correções inequívocas em clone de `Backup`, sem
reescrever sua origem. Não infere sub-raça/juramento/preparo ausentes; confere
origem especial/habilidade, usos, preparo e recursos. `review-ui.ts` reutiliza
confirmação, foco e rolagem existentes, sem recriar linhas ao mudar opções.
Cinco setores mantêm os controles montados; navegação compacta em telas pequenas.
`review-presentation.ts` concentra identificação/narrativa e as explicações de
treino. Identidade tem um quadro com relevo discreto, do nome até Tendência;
ancestralidades ficam fora dele, antes das classes com ícone, linhas e nível
total. Observações têm faixa de atenção, símbolo, contagem e título sublinhado,
sem depender só da cor. Testes de resistência ficam logo após os atributos,
em Combate. Personalidade, história e aparência usam textareas
visíveis; inventário tem resumo, moedas têm campos numéricos e tesouros permanecem editáveis. Ícones
são decorativos do catálogo local Lucide, sem assets remotos.
Antecedente tem nome livre e vínculo opcional ao catálogo, como raça. Tendência
compartilha as nove sugestões do criador e permite texto próprio. Vínculo de
antecedente só é proposto por correspondência exata, fora do modo manual;
escolher um não reescreve os treinos ou a narrativa importados.
`ancestry-fields.ts` permite conferir as escolhas `raceDragon` e `dragon`
separadamente. `draconic-ancestry.ts` cruza as dez opções com a tabela da p. 34
impressa (PDF 33): elemento, linha/cone, DES/CON, CD por CON/proficiência e
2d6/3d6/4d6/5d6 por nível total. A consulta não resolve o sopro como ataque.
Confere também com a tabela do [SRD 5.1, p. 5](https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf#page=5).
Só o nome explícito da raça com uma cor pode propor ancestralidade, sem trocar
uma escolha prévia nem deduzir pela pele. Alterações confirmadas na proposta
mudam apenas a chave pertinente do histórico, preservando os demais dados.
Ausência/valor desconhecido gera observação; não inventa resistência.
O dano por tipo exige uma das dez escolhas válidas, com origem racial e
Afinidade Elemental independentes; a segunda conserva seu custo/ativação.
Armas, ferramentas e ataques começam com resumos dos valores lidos.
`proficiency-fields.ts` oferece checkboxes de idiomas, armas e ferramentas.
Idiomas conhecidos têm quadro próprio, separado de armas/ferramentas/armaduras.
Os idiomas reconhecidos aparecem nas marcações, sem outro resumo repetido;
somente textos fora do catálogo ganham uma linha de registros preservados.
Sua edição livre fica no próprio quadro de idiomas, em um único input.
`isProficient` marca e protege armas já concedidas pelas regras existentes.
Grupos manuais cobrem suas armas sem fingir que uma exceção individual os remove.
Idiomas raciais só são acrescentados por ação explícita. Opções não concedem
novos treinos pelas regras; o registro livre conserva dados fora do catálogo.
`toggleRecord` reconhece opções inteiras, sem remover nomes parecidos ou textos
desconhecidos. Registros livres e correção/vínculo de ataques ficam em `details`,
com os campos sempre montados. Resumos usam `textContent` e atualizam durante
a edição. Armas montam `createWeaponFields`, também usado pela ficha, com
adicionar/remover na proposta. Cada instância tem IDs próprios; a ponte da ficha
conserva IDs `hb*`. A validação revela setor e detalhes antes de focar o campo,
inclusive em outro personagem editado no mesmo arquivo.
Bônus vazio em um ataque manual representa ausência de informação, não +0:
o armazenamento preserva a string vazia e a ficha oferece somente o dano até
haver bônus informado/calculado. Isso não infere que todo ataque sem bônus seja
um efeito de resistência, nem resolve o sopro pela consulta de ancestralidade. Vincular explicitamente
ao catálogo com modo Automático ativa o cálculo; editar/cancelar mantém os contratos anteriores.
A validação revela o setor e os detalhes antes de focar o primeiro campo inválido.
`spell-groups.ts` distribui os cartões de importação por círculo e classe sem
ordenar o array salvo. Truques têm seção própria; cartões existentes começam
recolhidos, com círculo/origem visíveis e avisos preservados. Adicionar truque
começa em 0; adicionar magia começa em 1. Trocar círculo/origem atualiza o cartão
e o reagrupamento ocorre ao navegar entre setores, fora do foco do editor.
Não mover ancestrais no `focusout`: isso pode retirar o alvo entre o pressionar
e soltar do mouse e cancelar o clique. Nós/rascunhos são mantidos nas escolhas.
O editor compartilhado distingue escolher do livro de criar um efeito próprio;
fórmula e lançamentos especiais continuam opcionais. Campos numéricos e selects
alinham pela base; checkboxes de componentes ficam em faixa própria.
O círculo usa um único select (Truque ou 1º–9º círculo). Na importação,
`circleMount` move o mesmo controle ao cabeçalho do cartão, visível com a edição
recolhida. O mapa de campos preserva sua referência e a leitura numérica, sem
inputs espelhados; seu change passa pelo editor antes de atualizar a proposta.
Vazio continua indefinido: não aparece como círculo 0 na ajuda ou na validação.
Grupos têm faixa de cor, número e título, cartões em colunas quando couber e
editor aberto na largura inteira. Origens raciais têm grupo próprio, separado
de Conjuração/Pacto; a classificação visual não muda o círculo de lançamento.
Uma origem marcada pode ser desmarcada; a escolha volta a pendente, mantendo
contadores gastos e notas. Elfo/gnomo usam INT e tiefling usa CAR em seus traços
verificados. O sinônimo Raio Místico é associado a Rajada Mística na leitura,
com círculo do catálogo e a linha original preservada nas notas.
O cabeçalho de cada cartão mostra a origem escolhida imediatamente, sem mover
o editor durante a seleção. Distingue vínculo ao catálogo de efeito próprio.
`rules/spell-reference.ts` oferece o livrinho somente para ID válido do catálogo,
sem confiar no nome de uma magia personalizada. A consulta reutiliza o popover
e sua exclusão/espera; dentro da revisão modal, fica na própria janela para não
herdar a região inerte de trás. A busca identifica listas de classe e traços
raciais como origens diferentes, incluindo Taumaturgia por Tiefling.
`catalog-search.ts` substitui o datalist nativo por resultados locais no tema,
no fluxo do cartão, com círculo e classes. Não há portal fixo sobre outro campo.
Usa o padrão [combobox da WAI](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/):
setas destacam, Enter escolhe, Esc fecha sem descartar texto ou fechar a revisão;
seleção por toque é explícita. Mantém foco no input, `aria-activedescendant`,
lista rolável contida e textos como dados, sem HTML do arquivo.
`pool-fields.ts` monta os campos de reservas e sincroniza apenas os resumos e
aberturas. Todos permanecem no formulário. Quantidades exatamente zeradas e
válidas começam recolhidas por reserva; o círculo de Pacto também deve ser válido.
Dados ausentes/inconsistentes não são tratados como zero. Durante a edição não
recolhe o grupo do usuário; novas reservas após comparação abrem sem recriar nós.
O recolhimento considera os valores, não a classe, para preservar adaptações.
`syncPoolComparison` compara automaticamente uma cópia ao mudar classes, níveis,
subclasses ou reservas. Assinatura evita remontar a previsão sem mudança; o
formulário original permanece montado. Guerreiro/ladino de nível 3+ precisam da
subclasse para a previsão de Conjuração. Máximos e Pacto são apresentados com
classes/níveis e valores atuais; aplicar é explícito, sem recuperar gastos.
Rótulos distinguem máximos, espaços gastos e pontos restantes, com um exemplo
de espaços disponíveis e explicações próprias para Conjuração/Pacto/Feitiçaria.
A tipografia da revisão fica restrita ao diálogo em `import-review.css`, com
16px de valores em M, rótulos de 17px, jogador/XP em 18px e legendas/títulos
maiores, preservando a escala em rem. Checkboxes mantêm texto de leitura;
as margens de quadros internos se reduzem no celular para acomodar G/GG.
O aceite de preparo adaptado tem margem própria após a lista, mesmo vazia.
`app/help.ts` monta os atributos do balão compartilhado: preparo e adaptação
dispensam `title` nativo e botões extras. `RuleTooltips` também reconhece foco
visível no checkbox dentro do rótulo, sem acrescentar outra parada de Tab.
O clique mantém a ação normal do controle; hover/foco apresentam a explicação.
`importNotices` gera explicações por setor e a lista textual compatível gravada no
histórico. `applySuggestedPools` aplica máximos após comparação, preserva usos e
pontos atuais e recusa toda a proposta se algum valor não couber no novo máximo.
Permite manter vínculos manuais com aceite dos avisos, registrados em
`rules.importReview`. Só edita a proposta; a persistência continua exclusivamente
em `CharacterStore.importCopies`, com IDs novos e notas separadas. Notas do
arquivo são opcionais na revisão. A identidade de `sheetStore` é conferida
após leitura, revisão e recuperação; troca de espaço fecha o editor existente.
Seleção de outro personagem na revisão não recalcula suas reservas. A ação de
revisar a ficha atual também gera cópia, sem migrar a coleção em silêncio.

## Quadros de conjuração

`rules/spell-class-panels.ts` agrupa preparo e recursos de `spellbook` pela classe
de origem, sem mudar `resourcePlace`, reservas ou ações. Reutiliza `preparation`
para contagem/limite e o mesmo assistente; magias sempre preparadas seguem seu
contrato. Classes conhecidas e subclasses com conjuração usam metadados e nível
mínimo, sem inferir vínculos a partir de nomes importados. Não conta o agrupamento
como lista de magias conhecidas, pois ele pode conter origens especiais.
`spellcastingStatusControls` mantém impedimentos e concentração comuns na barra;
preparo/recuperação aparecem uma vez em cada quadro. O lembrete de descanso é único.
`--sheet-panel-inset` padroniza as margens dos quadros por classe, barra e
cabeçalhos dos círculos. Ações de recursos/concentração e preparo compartilham
fonte, peso, cor e preenchimento no tema. O conteúdo de concentração usa uma
grade com intervalo entre ações, duração e testes pendentes, nas duas abas.
Na barra do grimório, ações de concentração se alinham à direita, inclusive
o botão único de registro manual; a regra fica no escopo `data-sheet-spell-tools`.
Na primeira etapa do preparo, Voltar à ficha reutiliza `CharacterWizard.close`,
inclusive confirmação de descarte e retorno de foco. O lembrete só é confirmado
na cópia aplicada por `finish`; abrir/cancelar não altera esse estado. A etapa de
magias dispensa o parágrafo introdutório, mantendo as descrições de cada opção.

## Organização das características

`rules/feature-groups.ts` agrupa os ganhos de `featureResourceBindings` por
classe/origem e nível, preservando os índices que vinculam controles aos ganhos.
Não consolida dados nem altera história, escolhas ou recursos. Classe e nível
aparecem uma vez por grupo; a origem completa de subclasse/escolha fica dentro
da descrição. Fontes de raça/antecedente e anotações manuais continuam separadas.
No moderno, colunas CSS de largura mínima em rem mantêm cada origem/classe
inteira em quadros intermediários. Um container query a partir de 75rem no
próprio quadro conserva a leitura larga em até duas colunas de níveis, agora
balanceadas pela altura real. Fonte ampliada também participa dessa decisão.
Redimensionar não remonta nós nem depende de um breakpoint global da janela.
As colunas usam `column-rule` e cada origem termina com uma borda discreta,
separando também dois grupos que caírem na mesma coluna. Listas de ferramentas
da revisão separam veículos, kits, ofícios, jogos e instrumentos; checkboxes
mantêm seus nós e têm divisórias de leitura.
O clássico mantém seu fluxo anterior. `app/feature-consult.ts` conserva as chaves de
consulta e monta botões separados das ações de uso. Hover usa `RuleTooltips`;
clique/toque fixa o mesmo texto com origem, escolhas e livro em um popover de
consulta. Reutiliza o estilo e a rolagem dos balões. ×, Esc e clique fora fecham;
trocar ficha/aba/conta encerra a consulta antiga. O texto é inserido com
`textContent`, e o link do livro usa somente página numérica validada.
O extrator gera também parágrafos raciais em negrito, delimitados pelos demais
traços/cabeçalhos. `reference(...,'race')` limita a busca à família racial,
incluindo aliases de rótulos e os traços do humano variante. Antecedentes usam
`reference(...,'background')` com o prefixo `caracteristica-` do PDF; Membro de
Guilda corresponde a Associados da Guilda. Isso evita consultas narrativas ou
vazias. Os 958 cabeçalhos anteriores continuam no catálogo de consulta.
`feature-level-title` centraliza o nível entre linhas decorativas em `::before`
e `::after`, sem acrescentar nós nem aumentar a fonte ou o espaço dos grupos.
Os nomes dos recursos dentro de cada característica usam a escala de apoio,
peso 600 e itálico em `.feature-entry > .rule-inline > strong`. Isso distingue
subcontroles como Canalizar Divindade dos títulos, preservando botões, usos,
balões e os vínculos existentes.

`scripts/extract-phb.py` também extrai os parágrafos em linha de Ancestral
Feérico nas páginas físicas 22 e 38. Os cabeçalhos em maiúsculas não os
identificavam; no meio-elfo, o quadro lateral interrompe o bloco dos traços e
o fallback acabava na introdução narrativa. Referências específicas preservam
o texto do livro e a página de cada raça, sem alterar o catálogo manualmente.
É correção de consulta, sem nova aplicação automática de vantagem/condição.

## Avisos durante uma edição

`app/notices.ts` recebe as notificações de `showToast`. Diálogos nativos abertos
têm prioridade; nas sobreposições marcadas com `data-notice-window`, usa a janela
com foco ou a última sobreposição visível. `data-window-notice` reserva um aviso oculto no
formulário/rodapé; os demais diálogos recebem uma região criada com `textContent`.
Sem janela, mantém `#toast`. A falha de armazenamento continua prioritária no
chamador. Trocar mensagem cancela o temporizador anterior; observar somente a
visibilidade da janela e seu evento `close` evita avisos antigos na reabertura.
Não remonta listas, altera seleção nem move o foco; cada aviso local é uma região
de status com contraste e símbolo, sem depender apenas de cor.

## Perfil e coleção de personagens

`app/account-panel.ts` alterna as abas Personagens/Perfil sem remontar os
formulários. Abrir pelo nome da conta começa em Personagens, a primeira aba;
retornos de recuperação/avisos da conta abrem explicitamente Perfil, a segunda.
Home/End seguem essa ordem; campos e rodapé mantêm seus próprios nós.
Backup, importação, revisão como
cópia e a opção de incluir notas usam `data-account-only="characters"`, visível
somente na aba Personagens. Estado do armazenamento, sincronização e recuperação
de dados ilegíveis permanecem acessíveis nas duas abas. Abas usam navegação por
teclado, `aria-selected` e painéis associados. Lista/Cartões alterna somente um
atributo da coleção, conservando retratos, foco e ações dos cartões existentes.
`critcall_character_list_view_v1` é uma preferência deste navegador, fora dos
documentos pessoais/backup. `styles/account-panel.css` mantém cartões quadrados
quando o conteúdo cabe; nomes longos e fonte ampliada podem aumentar a altura
para preservar a leitura. Alterações reais na coleção continuam pelo renderizador
e pelos contratos existentes de abrir/excluir/importar.
O escopo de `account-panel.css` dá ao perfil texto principal de 1rem, apoio de
.875rem, ações de .9375rem e títulos próprios. Regras antigas `text-xs` dos
botões não reduzem essa escala. A janela tem até 36rem e as ferramentas de
backup passam a uma coluna quando necessário, preservando legibilidade em GG.

## Tipografia da ficha

`src/styles/sheet-type.css` define papéis em rem dentro do cabeçalho/área da ficha:
leitura 1rem, apoio .875rem, rótulos .8125rem e títulos 1.0625rem. Nome e números
de combate têm destaque próprio. Não altera a escala global P/M/G/GG nem o livro,
login ou diálogos independentes. Classes reutilizam `CLASS_BADGE_STYLES` e suas
cores por tema; o cartão guarda os mesmos controles e a subclasse visível.
Cabeçalho usa grade para identidade e uma faixa própria para as classes. Subclasse
longa usa resumo de uma linha, aberto para leitura completa; no celular os dados
de identidade viram linhas compactas. `app/compact-topbar.ts` recolhe preferências
no celular e as abre no desktop, preservando o controle com foco ao reduzir a
largura. Não recria nós nem grava esse estado no documento.
CA e movimento
agrupam valor/unidade para conservar as três linhas do cartão de combate; spans de
leitura e inputs recebem a mesma hierarquia. Em telas pequenas, atributos clássicos
passam a uma grade acima das proficiências. Botões de magia aceitam a altura do texto.
Cartões de arma separam nome/descrição, grade de rolagens e rodapé de controles.
As notas não são truncadas nem alteradas; os medidores invisíveis do botão de
dano continuam reservando espaço para normal/crítico, sem mudar nós ou foco.

O editor de arma permanece no bloco da ficha. `sheet-edit/weapon-fields.ts`
fornece `createWeaponFields` para ficha/importação: campos, montagem de dados,
prévia, alternância de cálculo e leitura validada. Não acessa estado global nem
persiste. A ficha confirma a permissão antes de aplicar; a importação altera
somente a proposta. Metadados anteriores e ausência de ataque são preservados.
Montagem mantém a escrita da fórmula até haver edição, limita a 100 dados e
conserva os nós dos botões. A ponte anterior delega à instância com IDs `hb*`.
Proficiência, habilidade e ajustes ficam em `details`, sem desmontar controles
ou limpar valores ao recolher. `styles/weapon-editor.css` aplica controles do
tema e grades pela largura disponível do cartão, inclusive em colunas estreitas
no desktop; os dados de dano quebram em linhas. Totais manuais e automáticos
mantêm o mesmo contrato de cálculo, validação e salvamento.

## Edição na própria ficha

`lock.ts` separa proteção contra edição acidental e autorização (`access.ts`).
O estado é transitório por ficha/espaço, fechado após troca/recarga e ausente do
documento/backup. `canConfigureSheet` exige permissão e cadeado aberto; as ações
de jogo continuam usando a autorização existente. Ficha em branco abre em edição.
Campos e painéis conservam nós/rascunhos ao proteger: controles ocultos/desativados,
valores salvos em spans de consulta, confirmação bloqueada até reabrir. O proprietário
capturado dos controles vem do DOM, impedindo transferir um rascunho ao trocar de
ficha. Fórmula/bônus de defesa são ajustes; efeitos recebidos e condições são jogo.
As guardas também cobrem a ponte antiga e confirmações após espera. Histórico,
equipar, loja, preparar e usar recursos continuam disponíveis com o cadeado fechado.
Evolução guiada também usa `canEditSheet`, independente do cadeado: abertura e
confirmação revalidam a autoridade. `commitLeveledCharacter` recusa IDs diferentes
da ficha selecionada e retorna `false` nas recusas. O assistente conserva seu
rascunho e permanece aberto nesse caso, inclusive no preparo de magias.

`sheet-edit/model.ts` cria propostas para caminhos explicitamente permitidos;
valida formato, números, classes, fórmulas e vínculos sem refazer a ficha pelo
motor. Trocar classe com magias vinculadas exige reatribuí-las primeiro.
`class-removal.ts` compartilha proposta pura e confirmação inline entre ficha e
importação: remover magias junto ou mantê-las como adaptação com origem anterior,
habilidade explícita e agrupamento numa classe restante. Conserva dados e fixa
máximos atuais para não perdê-los no refresh; não reconstrói escolhas. Confere
classes/magias novamente ao confirmar e mantém a guarda de acesso da ficha.
Efeitos ativos com prefixo da classe são desligados. `selections` ignora escolhas
de classes ausentes, mantendo o histórico armazenado;
escolhas raciais e de antecedente continuam independentes da classe inicial.
`ui.ts` confirma armazenamento antes de aplicar ao objeto em memória e registra
um passo no histórico. A ficha mantém ID, notas, retrato e escolhas anteriores.
Os controles são reaproveitados entre renders, com cursor, seleção e rascunhos.
`change` disparado ao retirar um input do DOM durante render não salva o texto
nem inicia render recursivo. Falha de quota mantém o valor digitado no campo.
`origin-change.ts` oferece prévia ao trocar raça/espécie ou antecedente, por
lista ou texto livre. O cadeado controla as listas. Tendência usa as nove opções
do criador e não altera regras de combate. Trocar origem exige aceite de totais
manuais: não reconstrói um personagem importado pelo criador. Traços do vínculo
antigo saem, os do novo entram; escolhas da origem anterior ficam aposentadas
no evento, fora de `answers`, sem continuar concedendo talentos. Magias raciais
anteriores ficam identificadas como adaptações, mantendo usos/notas. Totais,
treinos e inventário permanecem explícitos para conferência; escolhas da nova
origem ainda precisam ser registradas. Não é uma conversão racial automática.
O commit confere ficha, conteúdo, espaço e permissão novamente; alteração de
jogo enquanto a prévia está aberta exige uma nova proposta.

`panels.ts` monta os editores de armas/itens/características/magias no próprio
bloco e conserva seus nós durante renders. Troca de ficha/espaço os encerra.
`spell-fields.ts` fornece os mesmos campos/leitura ao cartão da ficha e à revisão
de importação, sem acessar armazenamento/global nem criar forms aninhados.
Os grupos Magia, Origem e Disponibilidade têm rótulos, bordas e contraste do tema.
Preparo é contextual: truques, usos da origem e classes de magias conhecidas
exibem seu estado, sem checkboxes diários. Ocultar não apaga valores importados.
Sempre preparada fica nos ajustes, aberta quando já registrada. Sugestões de
origem racial só se aplicam após clique explícito e usam os traços disponíveis
da raça/nível; classe/raça e efeitos do catálogo permanecem conferíveis. Troca de
raça/classes atualiza sugestões sem remontar campos. Notas seguem na própria
magia; anotações pessoais continuam fora desse editor.
`spell-editor.ts` valida a proposta antes de salvar, com origem/habilidade/gasto
separados. IDs `custom_*` impedem religar uma magia própria pelo nome ao catálogo.
Ataque/CD aceitam ajustes explícitos de −100 a 100; fórmulas usam o parser comum.
Características textuais não programam ações. `blankCharacter` abre uma ficha
mínima diretamente, sem apagar rascunhos guiados. A revisão de importação volta
a ter exclusivamente a responsabilidade de importar cópias.

`rules.fieldOverrides` preserva máximos de Conjuração/Pacto/Feitiçaria e
movimento editados. O refresh e `slotTable` respeitam esses campos; recursos de
classe usam `rules.resourceMaxOverrides`, consumidos pelo mesmo motor de usos.
CA escrita usa uma alternativa `written`, com equipamento/escudo já incluídos
e efeitos temporários ainda separados. Fichas da versão anterior com
`manualMode` continuam legíveis; a interface não cria nem exige esse modo.

`access.ts` recebe um provedor externo de contexto: pessoal, mestre ou jogador
com edição liberada/bloqueada. Dados da ficha não concedem acesso. A guarda é
consultada no render e novamente ao aplicar; cobre também as ações legadas
ligadas aos controles. É um contrato da interface para futura integração:
salas ainda exigirão documentos e autorização no servidor, não implementados
nesta etapa. Não tratar o bloqueio visual como segurança de um backend de sala.

O PDF reconhece somas/subtrações restritas sem `eval`, níveis sem espaço e
dados abreviados (`d6`); ambiguidade racial usa marcador transitório para impedir
que a proposta religue a magia à única classe elegível antes da confirmação.

## Entrada e apresentação

O HTML inicial mantém `sheetApp` oculto e inerte até o bootstrap selecionar o
espaço correto. `src/auth/entry.ts` alterna entrada e ficha sem reload. O mesmo
`accountAccess` é movido entre a entrada e o perfil, preservando seus eventos e
o fluxo PKCE, sem duplicar IDs/formulários. A entrada tem estilos próprios em
`src/styles/access.css`: paleta escura de grimório, textura procedural leve e
detalhes em dourado discreto. O símbolo usa o PNG original; o nome em texto
conserva contraste sobre o fundo escuro. As preferências da ficha não são sobrescritas.

Sem sessão, mostrar a entrada; com identidade validada ou cópia offline
anteriormente validada, abrir a ficha. Recuperação de senha permanece na entrada
até concluir. O uso local é uma escolha explícita, mantida em sessionStorage
por caminho/aba; sair da conta revoga essa escolha. Avisos de armazenamento e
recuperação permanecem visíveis no perfil ao abrir um espaço com falha.
A tela organiza a navegação; a autorização remota continua nas políticas RLS,
sem considerar a visibilidade do HTML como uma barreira de segurança.

`dnd_sheet_theme`, `dnd_backdrop_style` e `dnd_font_scale` já pertencem ao espaço
do usuário e entram na fila como preferências. `preferredLayout` continua dentro
da ficha. Os seletores exibem estado por texto/símbolo e `aria-pressed`.
Os arquivos `public/icons/logo.png` e `icon.png` foram fornecidos pelo responsável;
são distribuídos no build e no cache do aplicativo, sem alterar os livros.

## Dados locais e backup

`CharacterStore` lê `critcall_characters_v1`, envelope com `schemaVersion: 1` e
`characters`. Se essa chave ainda não existe, lê `dnd_sheet_public_v1` e copia os
dados validados, mantendo o conteúdo anterior para recuperação/retorno à versão
antiga. O armazenamento permanece no mesmo navegador e origem.

A validação cobre a estrutura consumida pela ficha e limites básicos; não
substitui o motor de regras nem uma futura auditoria completa de segurança.
Erros de JSON/formato/versão preservam o original e impedem gravação sobre dados
ilegíveis. A recuperação por importação pede confirmação e guarda os bytes
originais em uma chave própria. Quota/permissão não são tratadas como sucesso.
Se a leitura foi bloqueada, reabrir a página após permitir o armazenamento antes
de gravar/importar sobre dados que ainda não puderam ser conferidos.

Anotações continuam em `dnd_player_private_notes_v1`, por ID do personagem,
separadas de ficha, impressão e snapshots. Backups só incluem notas com escolha
explícita. O formato `critcall.character-backup`, versão 1, tem data e personagens,
com `privateNotes` opcional e separado. Importar cria novos IDs e remapeia as
notas correspondentes; não substitui personagens com o mesmo ID ou nome.
Arquivos de até 20 MB são aceitos; versões desconhecidas são rejeitadas.

O adaptador da interface conserva localStorage e o formato legado. A fila nova
usa transações IndexedDB por projeto/usuário, com IDs de operação idempotentes,
revisões remotas e projeção que aguarda editores. Histórico/checkpoints passam a
ser persistidos separadamente e entram na fila; seus snapshots não incluem notas.
`boundedCharacterHistory` limita históricos legíveis a 25 registros / 256 KiB
ao carregar, migrar e gravar, conservando o ponteiro e os vizinhos. O mesmo teto
vale em memória quando o armazenamento falha ou o original é ilegível. Um estado
isolado maior é preservado. O original coletivo legado e dados ilegíveis não
são sobrescritos; apenas as cópias legíveis por personagem recebem a poda.
Limites de versões remotas, recibos e ativação ficam em
[SINCRONIZACAO.md](SINCRONIZACAO.md#retenção-de-versões).

## Login, sessão e isolamento por conta

Confirmados e-mail/senha e projeto exclusivo do CritCall em 15/10/2026. O usuário
identificou o projeto novo `qhrpgkpvwbztubnrdhya`. URL/chave publicável estão na
configuração pública revisada `src/auth/public-project.ts`, incluída no build.
Os fluxos usam Supabase JS 2.118.0. Ferramentas conferiram API real e recusa de
credenciais inexistentes, sem cadastrar ou enviar e-mails. O usuário confirmou
cadastro, confirmação e entrada reais. Os dois retornos locais em 5174 foram
aceitos pelo endpoint real após o ajuste de localhost. O usuário confirmou que
abriu o link de recuperação em outro navegador/dispositivo, embora o retorno
fosse localhost. O fluxo PKCE atual exige o navegador/dispositivo de origem.
Após essa orientação, em 16/10/2026 o usuário relatou sucesso no teste local de
recuperação/troca. Isso não é validação da publicação, SMTP próprio ou duas contas.
Os demais aplicativos do responsável permanecem separados. O
aplicativo tem os identificadores públicos do CritCall incluídos; o modo local
pode ser escolhido com `VITE_AUTH_ENABLED=false`. O bootstrap valida a identidade
antes de importar `sheet.js`; chaves de armazenamento pessoais recebem prefixo por projeto/usuário.
As chaves originais permanecem no modo sem login. O fluxo explícito de entrada
pode copiar o conteúdo para a identidade confirmada; ver `src/auth/guest-import.ts`
e os contratos em `SINCRONIZACAO.md`.
O título, a instalação e os downloads usam CritCall. Identificadores legados
antigos são lidos apenas pela camada de compatibilidade silenciosa;
novos espaços de login/conta usam `dnd_auth_v1`/`dnd_account_v1`.

Sessões online passam por `getUser`; uma identidade previamente validada só
seleciona sua cópia local offline. Esse cache não é criptografado nem representa
autorização remota. Trocas limpam histórico/interface e cancelam confirmações
pendentes; editores abertos exigem decisão antes do fechamento. Rascunhos com
falha de quota são preservados por espaço em memória, sem gravar na conta nova.
Na cópia do espaço sem conta, `critcall_guest_import_declined_v1` guarda a recusa
no armazenamento isolado da conta/navegador, fora dos documentos sincronizados.
É conferida dentro da trava antes de ler/copiar a origem ou abrir confirmação.
Recarga, novo login e mudanças do conteúdo local não repetem a pergunta nem o
toast. Somente Retomar fichas sem conta remove essa preferência e permite nova
decisão. Identidade válida é rechecada após a confirmação; falha de escrita não
é anunciada como preferência salva. Nenhum original/cache é removido.

A branch implementa sincronização pessoal: fichas, notas privadas separadas,
perfil, preferências, histórico/checkpoints e recuperação. A migração define
critcall_documents/critcall_versions, RLS do dono e RPCs restritas. Em 16/10/2026,
o conector confirmou o projeto exclusivo `qhrpgkpvwbztubnrdhya`, ativo em
PostgreSQL 17.11 e identificado como D-D no painel. Antes da aplicação, não havia
tabelas públicas nem migrações. A migração `personal_sync` foi aplicada com a
versão remota `20261016101143`, a partir do arquivo
`202610160001_personal_sync.sql`. Conferidas RLS, leitura apenas do dono e
grants restritos; a API recusou anon nas duas tabelas. As RPCs negam EXECUTE
a anon, permitem authenticated e têm `search_path` vazio. Teste SQL real com
identidade sintética, integralmente revertido, confirmou escrita/idempotência
e isolamento do dono, sem dados pessoais. Cliente e SQL também foram testados
com HTTP controlado e PostgreSQL 16 descartável, respectivamente. Ainda faltam
SMTP próprio e revisão dos alertas descritos em SINCRONIZACAO.md. O responsável
confirmou envio imediato entre telefone e computador em outubro de 2026; os
roteiros externos completos continuam discriminados na retomada. A publicação
foi concluída; evidências em
[RETOMADA.md](RETOMADA.md). Contratos em [LOGIN.md](LOGIN.md) e
[SINCRONIZACAO.md](SINCRONIZACAO.md).

O modo gratuito usa sincronização manual. O controller captura alterações na fila
IndexedDB, mas chama `SyncEngine.run()` somente pelo botão. Não há polling nem
rede por foco/reconexão/edição. Na abertura, aplica apenas o diário já disponível
no aparelho. `manual-images.ts` coordena upload explícito antes das referências;
novos downloads de retratos são liberados após a ação manual. Login/renovação de
sessão continuam independentes e podem usar rede.

`cloud-policy.ts` mantém históricos e recuperações fora da sincronização normal.
`readDocuments(..., false)` não valida nem remigra históricos durante a captura
remota. `SyncEngine` aceita uma política opcional (produção: manual + conteúdo
atual), usada na captura, fila elegível, contagem e projeção. Operações/caches
antigos excluídos da política permanecem intactos no diário; não viram tombstones,
não são enviados nem substituem o histórico local. O motor genérico conserva
seu contrato anterior quando não recebe essa política.

`SupabaseDocuments.pull(knownRevisions)` sempre pagina o índice de chave, tipo,
ID e revisão, inclusive sem diário. Só busca conteúdos elegíveis novos/alterados
em lotes de 25, sob filtro do dono. Fichas/notas/preferências pequenas continuam
sincronizadas. Mesmo um primeiro acesso/cópia sem conta ignora os valores de
históricos antigos na nuvem. Ausência não apaga nada; exclusões usam tombstones.
Falhas preservam a fila. Detalhes em
[SINCRONIZACAO.md](SINCRONIZACAO.md#modo-manual-para-o-plano-gratuito).

Documentos têm revisão crescente e datas de edição/recebimento, com calibração
do relógio. Se edições simultâneas disputam a mesma revisão, vence a data mais
recente e ambas ficam no histórico; não há mesclagem automática campo a campo.
Exclusões usam tombstones, e restaurar cria nova operação após confirmação.
Outro PC só recebe edições offline depois da reconexão/envio do dispositivo
de origem. A cópia local anterior sem data não se apresenta como edição nova.
O nome passa a ser salvo ao digitar, com aviso de erro em vez de falso sucesso.

O preflight e o navegador usam o mesmo resolvedor: o projeto público é o padrão,
um override exige URL/chave completos, e chaves privilegiadas são recusadas mesmo
com login desligado. O workflow não depende de repository variables para essa
configuração. O arquivo público não contém capacidade administrativa ou dados de
usuários. Links inválidos não encerram uma conta válida já aberta; a mensagem de
entrada depende da conferência da identidade, além da resposta de token. A conta
conectada pode solicitar um link de troca de senha para seu próprio e-mail
validado; a conclusão usa o mesmo retorno PKCE da recuperação.
Erros do retorno distinguem expiração no serviço, solicitação indisponível,
verificador incompatível e ausência da solicitação no navegador/endereço. Nenhum
desses avisos expõe o código de acesso, token ou texto bruto vindo da URL.

O domínio próprio é `criticall.art`, com compra na Hostinger confirmada pelo
usuário em 16/10/2026. O usuário confirmou OK nas verificações GitHub/Cloudflare.
Consultas confirmaram nameservers Cloudflare, HTTPS 200 na raiz e redirecionamento
de `www`; hospedagem ainda no GitHub Pages. O Supabase aceitou o
retorno novo em uma consulta com token inválido, sem testar o login completo.
Caminhos relativos e retornos pela origem atual funcionam sob `/D-D/` e `/` nos
testes. Antes de mudar a origem, exportar dados locais e configurar Pages, DNS,
HTTPS e retornos no Supabase conforme [DOMINIO.md](DOMINIO.md). Não há migração
entre origens ou sincronização remota simulada nessa mudança.

## Dependências, build e publicação

O próximo destino proposto é Cloudflare com fontes privadas, mantendo verificações
e entrega pelo GitHub Actions. Usuário confirmou a criação da conta em 16/10/2026;
zona com ativação confirmada pelo usuário e nameservers conferidos; projeto
Pages Cloudflare e credenciais ainda não configurados.
O workflow novo está preparado como destino opcional. A estrutura
abaixo descreve a publicação atual no GitHub Pages. O roteiro de transição e os
limites de crescimento por planos estão em [CLOUDFLARE.md](CLOUDFLARE.md).

Dependências e lockfile fixados; fontes e ícones são compilados/hospedados com o
aplicativo. O build mantém apenas os ícones usados. Licenças acompanham os arquivos.
Tailwind 3 foi mantido para preservar as utilidades do visual existente.
PostCSS 8.5.30 e o override de `postcss-selector-parser` 7.1.6 corrigem os avisos
com versões disponíveis, preservando o CSS gerado. O aviso de `braces` 3.0.3 na
cadeia de desenvolvimento do Tailwind foi registrado na preparação de 15/10/2026
no changelog. Ele envolvia padrões de busca aninhados definidos pelo projeto,
não dados das fichas; essas ferramentas não são distribuídas. Reavaliar ao
atualizar a cadeia de CSS, sem `npm audit fix --force`. Isso é um registro
histórico, não uma auditoria atual de todas as dependências.

Vite usa caminhos relativos para permitir `/D-D/` no Pages e domínio próprio.
Somente `public/` e os assets gerados entram em `dist/`; não copiar a pasta inteira
do projeto. Os únicos PDFs permitidos no artefato são os dois livros autorizados.
O gerador confere isso e recusa arquivos de desenvolvimento inesperados.

A pipeline testa branches e pull requests, com permissões de leitura. O job de
publicação só existe para push na `main`, após o job de verificação, usando o
ambiente `github-pages` por padrão ou `cloudflare-pages` quando
`DEPLOY_TARGET=cloudflare`. Os dois destinos recebem o mesmo pacote verificado;
o job Cloudflare o extrai e envia sem novo build. Publicar no GitHub exige configurar a fonte do Pages como GitHub
Actions na conta; preparar o workflow não afirma que o site já foi ativado.
Proteção de branches/aprovações automáticas ainda dependem das configurações do
repositório; o fluxo convencionado continua em `CONTRIBUTING.md`.
Cada execução aprovada também guarda o artefato `github-pages` por três dias para
revisão, sem publicar branches de trabalho. A auditoria de dependências de produção
faz parte da verificação; somente o job da `main` tem permissão de publicação.

## Offline e atualizações

O build calcula uma revisão pelo conteúdo dos arquivos e gera `sw.js` a partir de
`src/pwa/worker.js`, com a lista
dos recursos da ficha e do leitor. Cache por revisão e escopo evita misturar builds
ou interferir em outros projetos no mesmo domínio. O worker normaliza a raiz do
projeto para `index.html` e `/book` para `book.html`. Respostas guardadas após
redirecionamentos HTML são reconstruídas para permitir navegação offline também
no Cloudflare Pages. A revisão inclui o worker e seu gerador além dos arquivos.
Na instalação, as requisições usam `cache: reload` para buscar o conteúdo atual
e atualizar o cache HTTP. Sem isso, o Pages pode fornecer HTML da entrega anterior
a partir do cache do navegador e prendê-lo no cache offline da revisão nova.
Depois de preencher a meta tag, o gerador calcula SHA-256 de cada recurso final.
As requisições de instalação levam esses valores em `Request.integrity`:
HTML/regras antigos com status 200 também fazem `addAll` falhar. O cache
incompleto é retirado, sem ativar a entrega nem misturar seus arquivos. A mesma
entrega pode ser tentada de novo quando o servidor fornecer os bytes corretos.
O servidor deve preservar os bytes do build, inclusive ao configurar outra
hospedagem. Compressão HTTP não muda o conteúdo validado.
A entrada do escopo (`/` ou `/D-D/`) também é buscada com a integridade do HTML,
além de `index.html`. As duas URLs possuem entradas HTTP diferentes: renovar só
o arquivo deixava a raiz antiga disponível quando o navegador ignorava o worker.
O teste de atualização bloqueia serviços externos por CDP; `route()` foi evitado
porque o Playwright desativa o cache HTTP ao interceptar requisições.

`index.html` recebe a revisão em uma meta tag; o hash normaliza essa marca antes
do cálculo, evitando referência circular. O registro usa `updateViaCache: none`,
verifica retomada/conexão e consulta a cada minuto com a página visível.
Depois da instalação completa, `skipWaiting`/`clients.claim` ativam o novo worker
sem recarregar documentos. Cada documento mantém a geração que abriu: um cache
de metadados por escopo associa IDs opacos de clientes a hashes, nunca a dados
de jogadores. Isso inclui abas antigas na transição do worker anterior.
Navegações comuns escolhem a geração atual e registram `resultingClientId` antes
de servir o HTML, mantendo regras sem hash e assets coerentes após F5.

A limpeza ocorre nas mensagens de versão depois da ativação. Usa
[`clients.get`](https://w3c.github.io/ServiceWorker/#clients-get) para aguardar
clientes reservados durante navegações; não roda dentro da ativação, que poderia
ficar aguardando a própria navegação. Só remove gerações anteriores à do worker
que executa a limpeza, sem clientes vivos. Assim não apaga uma instalação
concorrente mais nova. Falhas de instalação retiram só o cache incompleto.

O aviso compacto oferece recarga explícita; rascunhos de ficha/assistentes,
formulários de entrada preenchidos e falhas de salvamento impedem esse botão de
descartar trabalho. Respostas atrasadas do worker anterior são ignoradas.
Não há recarga forçada, nem limpeza de fichas/anotações.
O cache não recebe respostas de APIs, requisições privadas ou PDFs. Os livros
exigem rede no leitor integrado; baixar o PDF é uma ação separada do jogador.
O indicador no perfil informa quando o primeiro preparo offline terminou.

## Limites e evolução futura

A sequência atual de mecânicas está somente em
[AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md). Estado publicado e validações
externas estão em [RETOMADA.md](RETOMADA.md). Fila, histórico, sincronização e
retratos já estão implementados; não retomar a sequência histórica que os
tratava como próximos recursos.

A ficha individual permanece independente de sala. Participantes, resumo do
grupo, turnos do mestre e voz/vídeo exigem etapas próprias; permissões de mesa
precisarão de autorização no servidor, não só de botões ocultos. Notas pessoais
não devem passar a fazer parte dos documentos compartilhados.

Os layouts 2014/2024 continuam sobre o mesmo conjunto de regras de 2014. Regras
da mesa são identificadas, incluindo recuperação integral ao dormir nesta campanha.

## Dado e imagens pessoais

O dado recolhido é transitório, sempre fechado ao abrir/trocar espaço. A posição
normalizada usa `dnd_dice_tray_position` e é limitada ao viewport/tamanho atual.
`ResizeObserver` reposiciona após sair da entrada oculta, além de rotação e resize.
O resultado fica em sessionStorage por espaço; não gera documentos remotos.
Arrastar exige mais de 8 px; arremessar exige pelo menos 48 px e velocidade final
mínima de 0,85 px/ms na janela recente. Cancelar/interromper o gesto não rola.
Clique/Enter abre a bandeja, R faz a mesma rolagem do arremesso, setas movem.
O d20 rápido usa `evaluateDicePool({20:1},0,currentRollMode)`: um d20 no normal;
dois e escolhe o maior/menor na vantagem/desvantagem. O modo é resolvido antes
da animação. Não modifica pool, modificador, modo atual ou inspiração preparada.
A sequência de rolagens descarta callbacks antigos e trocas de espaço cancelam
animações. Movimento reduzido desativa o giro decorativo.

O realce de foco do dado serve à navegação por Tab. R oculta esse realce pelo
atributo transitório `data-keyboard-roll`, preservando o foco para repetir a
tecla; `blur` limpa o atributo. Assim, o realce retangular não aparece nas
pontas após rolar e volta ao navegar novamente. O botão também desativa o
realce nativo de toque, a seleção de texto e o menu de toque longo do WebKit.

`dice-dock-appearance.ts` reflete `currentRollMode` em `data-roll-mode` transitório,
no rótulo acessível e em duas camadas externas ao botão original. Névoa/↑ para
vantagem; chamas/↓ para desvantagem; normal oculta ambas as camadas. O CSS
`dice-mode.css` usa animações decorativas sem timers/canvas, desativadas por
movimento reduzido. As camadas têm `pointer-events:none`, não entram no fluxo
e ficam ocultas com a bandeja aberta. Não alteram o SVG, tamanho, posição,
pool, gestos, armazenamento ou sorteio. Dicas e botão de d20 rápido refletem
o modo que será usado pelo arremesso/R.

Retratos usam `avatar: {id, revision}` por personagem e `dnd_profile_avatar` por
perfil. UUIDs são validados antes de entrar em marcação/caminhos; URLs externas,
SVG e HTML de backups não viram imagens. O PNG da marca não é uma foto de usuário.
`prepareAvatar` valida entrada de até 5 MB/32 MP/8192 px, recorta no centro e
recodifica até 256 px/32 KiB em WebP, sem metadados do original. O cache privado
`critcall-avatars-v1` usa escopo + UUID + revisão; não vai para Cache Storage.

Storage `critcall-avatars` é privado, limita WebP a 32768 bytes e só permite
SELECT/INSERT/UPDATE/DELETE na pasta do `auth.uid()`. Cada imagem usa caminho
`<userId>/<id>.webp`. Substituições reutilizam o arquivo; referências compartilhadas
por cópias ganham novo UUID ao mudar, preservando o retrato original. Não existe
limpeza automática de arquivos antigos ou fichas. Históricos guardam referências,
não pixels; a substituição remota não mantém uma versão binária do arquivo.
Backups JSON não embutem imagens; outra conta não obtém acesso aos arquivos.

O envio captura o dono/espaço e só confirma depois da resposta do Storage. Falhas
mantêm a cópia local e o aviso de pendência. Download é autenticado, só para
retratos visíveis, e URLs Blob são revogadas/retiradas ao trocar de conta. Nenhuma
resposta de outra sessão é aplicada a um espaço novo. Documentos e imagens têm
filas distintas; um retrato pode aparecer depois da ficha num segundo dispositivo.

Migração `20261016184740_private_avatars.sql` aplicada ao CritCall exclusivo em
16/10/2026 como versão remota `20261016184938`. Bucket/limites/políticas conferidos.
Os avisos anteriores do advisor não mudaram. Não houve alteração das RPCs ou do
projeto de outro aplicativo.

### Criação e continuidade — 2026-10-16

`src/wizard/bridge.ts` conecta módulos TypeScript ao assistente anterior, sem
alterar o motor de regras. `abilities.ts` controla orçamento e peças por índice
(inclusive totais iguais); a interface mantém os mesmos controles ao distribuir.
`guidance.ts` acrescenta ajuda em português e interpreta as tabelas já extraídas
dos antecedentes. Os catálogos gerados não são editados. `draft-store.ts` preserva
o rascunho local por espaço, conserva dados ilegíveis e informa falhas de escrita.
A próxima criação retoma o rascunho, incluindo os recebidos na vinculação local.

`src/app/book-appearance.ts` atualiza links para o leitor com parâmetros visuais,
sem e-mail ou ID da conta. O leitor aceita apenas temas/escalas conhecidos.
A animação do dado usa os retângulos inicial/final e se cancela no arraste,
redimensionamento ou troca de espaço; movimento reduzido usa abertura imediata.

## Revisão universal de 2014 — 19/10/2026

`src/rules/` contém cálculos puros de armas/CA, preparação, recursos e descansos,
com modelo de estado independente de DOM/rede. `bridge.ts` mantém a assinatura
de `CharacterEngine.weaponStats` na interface; criação/evolução e catálogos
continuam no motor anterior. `placement.ts` define um único lugar por controle:
característica existente, PV ou painel já presente no grimório. Notas de consulta
não criam cards operacionais repetidos; Arcanum com magia registrada usa o
contador da própria magia. `ui.ts` preserva foco e expansão ao salvar.
`ruleState` viaja no documento da ficha e
nas versões existentes, sem SQL novo ou alteração de autorização.

Contratos preservados do plano de refatoração concluído: fórmulas alternativas
de CA não se somam, e a segunda Defesa sem Armadura não é adquirida por
multiclasse. Proteção contra Lâminas é resistência; Aparo é redução de dano,
sem bônus universal de CA. Intervenção Divina bem-sucedida impede nova tentativa
por sete dias na aventura, inclusive após descanso. Novos sucessos usam
`interventionPending`; a confirmação explícita da semana também aceita o prazo
real legado, preservado até a decisão. Olhar Hipnotizante registra a restrição
por alvo até descanso longo. Fontes e contextos que a ficha não conhece continuam
sob decisão explícita da mesa; usos, alvos e estados não substituem seus efeitos.

`src/wizard/increments.ts` reutiliza os cards de `abilities.ts` para o incremento
da evolução. Atualiza os nós em lugar e conserva `answers.asi` como a lista de
dois códigos já esperada pelo motor; não reaplica raça nem modifica a ficha
antes da confirmação. A interface bloqueia orçamento/limite, e o motor continua
validando a aplicação final.

`src/storage/legacy.ts` concentra a leitura de identificadores históricos e a
cópia para chaves atuais. Fichas, recuperações e ficha ativa passam a usar prefixo
CritCall; a fila mantém IDs/revisões antigos até confirmação. A projeção de
documentos reconhece aliases sem duplicar a preferência. Textos estruturados
legados ganham apresentação legível e material original para recuperação.

Cobertura atual e próximos recortes em [AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md);
as verificações históricas desta revisão estão no changelog de 19/10/2026.

## Histórico por personagem e cobertura do livro — 19/10/2026

`src/storage/character-history.ts` valida snapshots de uma única ficha, separa
o histórico coletivo legado por mudanças reais de ID e copia os documentos sem
apagar o original. `canonical.ts` mantém a comparação estável compartilhada com
a sincronização. Nome do perfil e layout não geram diferenças de conteúdo.
A interface restaura somente a ficha ativa, mantém os outros personagens/notas
e oferece recuperação dos históricos de fichas excluídas. As preferências
dinâmicas são isoladas por espaço/conta e sincronizadas separadamente. Os limites
e contratos da RPC permanecem iguais. Um histórico ilegível congela sua própria
gravação, sem impedir salvar as fichas válidas.

O leitor conserva os presets e no máximo uma opção de zoom livre. Ajustes de
defesa usam rótulos/campos separados, caixas espaçadas e ajuda sobre o próprio
rótulo de cada item. `rule-tooltips.js` reaproveita o balão por passagem do mouse
ou foco de teclado, sem botão adicional e sem marcar a caixa do efeito.

A revisão ampla em [AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md) registra
capítulos, apêndices, 12 classes/41 subclasses, raças, talentos e magias. Os
itens concluídos da refatoração não equivalem à automação de todo o livro.
Iniciativa auditada, componentes cortados, concentração, morte, Dados de Vida
e inspiração já receberam as correções descritas nas seções seguintes.
Os passivos e efeitos ainda parciais constam nas matrizes atuais da auditoria.

## Primeira etapa dos cálculos auditados — 19/10/2026

`src/rules/spell-effects.ts` resolve a fórmula e o resumo usados tanto no selo
quanto no lançamento. Preserva `customRoll`, recebe os cálculos legados normais
durante a migração e trata escalonamento de truques, aumento explícito de dados
no texto, cura/modificador, Discípulo da Vida e Explosão Agonizante. Múltiplos
raios/feixes têm dano por acerto; uma rolagem extra não conjura de novo. A
adaptação de Mísseis/Gêmea permanece explícita; elegibilidade considera alvos e
o círculo selecionado nos casos reconhecidos. Não é um executor das 361 magias.

`renderSpellCastControls` oferece `data-spell-attack` apenas para metadados
`atq_magico`, com o bônus de `getSpellcastingStats` da classe/habilidade da magia.
O botão substitui o selo estático de ataque; os selos de salvaguarda e acerto
automático continuam. `rollSpellAttack` revalida índice original, tipo e
possibilidade de conjurar, e usa `triggerSheetRoll` com contexto de ataque e
inspiração habilitada. Não gasta espaços/usos/pontos nem dispara conjuração,
concentração ou passivos; pode repetir ataques de raios/feixes. O gasto continua
no lançamento explícito, inclusive quando o ataque erra.

Só Pool bloqueia `castSpellWithUpcast` e `castRitualByIndex` antes de qualquer
efeito ou confirmação. A guarda é repetida na chamada retomada após confirmar
troca de concentração, para respeitar o modo atual. A interface desativa os
botões correspondentes; `rollSpellAttack`/`rollSpellRay` só executam em Auto Ficha.
OFF continua permitindo o registro físico de conjuração sem rolagem virtual.

`wizardPrivilege` deriva Dominar/Assinatura das escolhas por ID de magia, classe
e círculo válidos. A assinatura usa `ruleState.used['mago:signature:<id>']` por
magia, recuperado em descanso curto/longo. O seletor mantém a origem esgotada,
exige mudança explícita para gastar espaço e permite aprimorar. A preparação
do motor e da ficha exclui a assinatura do orçamento sem duplicar documentos.
O nível racial fixo é derivado também para fichas antigas sem `castLevel`.

`applyDamage` retorna absorção por proteção/temporários/besta/PV e excesso. A
mensagem do histórico usa esse resultado. Constituição permanente aplica só a
diferença aos PV manuais e conserva o déficit; não recupera personagem a 0 PV.
Proficiência de armadura considera a lista explícita ou, no legado, classe,
raça e escolhas. Nenhum SQL/RLS/RPC, chave de armazenamento ou identidade mudou.

`scripts/extract-phb.py` lê campos longos até o rótulo seguinte; catálogos são
regenerados, preservando o corpo original. Componentes V/S/M usam só o prefixo,
sem confundir letras do nome de um material com componentes.
`tests/spell-resolution.test.ts` cobre os cálculos puros, e o roteiro auditado
passa a ser cobrado por `tests/audited-rules-browser.cjs` na suíte de navegador.

## PV, Dados de Vida e inspiração — 19/10/2026

`inspirationControls` é montado uma vez no quadro de PV, independente da linha
de Exaustão em `conditionControls`. O estado e os eventos existentes permanecem;
o agrupamento de ações apenas permite reorganizar a linha em telas pequenas.

`src/rules/health.ts` concentra os contratos puros. `applyDamage` mantém o retorno
de absorção existente e informa dano recebido/excesso para morte. Proteção
externa não é dano ao personagem; temporários contam como dano a quem já está
a 0 PV. Dano absorvido pela besta não causa falhas nos PV humanos; excesso pode.
O máximo efetivo por exaustão é compartilhado pelo cálculo de PV e dano maciço.

`ruleState.death` contém sucessos, falhas, estabilidade e morte. Fichas sem o
campo são lidas sem migração destrutiva. Três sucessos ou estabilização zeram
contagens; cura positiva também as limpa. Três falhas/dano maciço marcam morte.
1/20 natural prevalece sobre bônus; Alma de Diamante usa a proficiência comum.
Cura, descanso, conjuração e ativação de recursos respeitam morte/consciência.
Exaustão fatal mantém a marca mesmo após corrigir seu nível; retorno à vida é
um registro explícito, com confirmação, após resolver a causa na mesa.

Gasto de Dados de Vida usa `classes[].hitDiceUsed`, valida a reserva e aplica
CON/mínimo de Resistente antes do bônus opcional de Canção do Descanso.
`ruleState.songOfRestUsed` impede repetir o bônus até outro descanso concluído;
ouvir a atuação e sua origem são escolhas explícitas. Na forma, exige CON da
besta e usa a reserva/máximo da besta. Não deduz tempo nem completa outro descanso.
Por leitura dos requisitos de descanso de 2014 (PDF 187–188;
[regras básicas oficiais](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/adventuring#Resting)),
não se exige vigília para o curto. O fluxo permite gastar a 0 PV após estabilizar
e confirmar o descanso; não libera cura/descanso a morto.

`src/rules/health-ui.ts` ocupa o bloco de PV e substitui a lista passiva de Dados
de Vida. Diálogos reutilizam confirmação/rolagem/rolagem contida existentes;
cancelar ou uma entrada inválida não gasta nada. Confirmar revalida a identidade
da ficha e os resultados antes da mutação. `saveRuleStep` conserva consultas
abertas e foco. `rollRuleDie` reutiliza a avaliação/animação sem alterar o pool.

`heroicInspiration` conserva o campo legado como reserva binária de 2014.
`ruleState.inspirationReady` prepara seu uso na ficha/pool sem gastar antes de
rolar. Jogadas elegíveis passam essa intenção explicitamente; dano/arremesso
rápido não consomem a reserva. A vantagem preparada cancela desvantagem e é
consumida uma vez. Dado físico tem gasto confirmado; preparação pode ser cancelada.
Tudo pertence ao documento da ficha e seu histórico; notas continuam separadas.
Não houve mudança de SQL/RLS/RPC. Concentração, condições e duas defesas de
queda foram integradas nas etapas seguintes descritas abaixo; o tempo de jogo
e os demais efeitos continuam sujeitos aos limites da auditoria atual.

## Concentração e condições — 20/10/2026

`src/rules/concentration.ts` guarda um único `ruleState.concentration` v1, com
identificador, nome, duração, origem/escola e fila de testes por fonte de dano.
Os identificadores sequenciais distinguem uma reconjuração do efeito anterior;
resolver exige a mesma ficha, efeito e primeiro teste. Dados ilegíveis não são
apagados nem substituídos silenciosamente. O estado segue o documento/histórico
existente, sem migração SQL ou alteração de notas.

`applyDamage` preserva seu retorno e acrescenta à fila o dano total recebido
após Proteção Arcana, incluindo temporários e PV da besta. A CD é
`max(10, floor(dano / 2))`. Dano que causa incapacitação encerra diretamente o
efeito. A fila registra se a forma recebeu dano para exigir o bônus total de CON
apropriado, mesmo após reversão; estatísticas de bestas ainda não são integradas.
Conjuração Focada consulta a escola e o nível/subclasse de mago, sem restringir
a origem da magia. Testes ambientais continuam disponíveis.

O teste reúne fontes de vantagem/desvantagem antes de cancelar: modo escolhido,
Conjurador de Guerra somente por dano, inspiração preparada e exaustão 3+.
1/20 naturais não substituem a comparação com a CD. `concentration-ui.ts`
reutiliza seleção de dado físico/virtual, animação e confirmação existentes;
o dado virtual não altera o pool. Revalida efeito/teste e entradas antes de rolar
ou consumir inspiração. A mesma seção é renderizada somente na aba atual.

A conjuração conserva o caminho síncrono quando não há troca. Se outra magia
exige concentração, o callback confere ficha, efeito, magia, espaço e intenção
de Gêmea, e repete as validações de recursos antes de gastar. Repetir a mesma
magia inicia outro registro após o gasto válido. Rituais e conjurações prolongadas
também interrompem concentração anterior; o controle representa a conjuração
concluída. Tempo, ações e interrupções durante sua execução permanecem manuais.
Registro de efeito da mesa não consome recursos e informa isso no diálogo.

`conditions.ts` oferece as 14 condições, explicações e estados derivados.
Incapacitação encerra concentração e bloqueia conjuração/ativação de recursos;
as condições pertinentes zeram movimento e causam falha automática de FOR/DES.
Não infere modos de ataque contra alvos desconhecidos nem aplica resistência
tipada sem conhecer o dano. Defesa recebida não é encerrada junto à concentração
própria, pois não há identificação de seu conjurador/alvo.

`syncIncapacity` centraliza a transição: morte/inconsciência revertem a forma,
encerram Fúria e marcam queda. `endRage` processa exaustão de Frenesi uma vez;
paralisia/atordoamento sem inconsciência não encerram Fúria. Cura não remove a
queda. Sono informado no descanso longo encerra concentração; exceção consciente
pode preservar o estado, mas a duração continua a cargo da mesa.

`retainConditionNodes` recoloca os mesmos nós da lista antes de remontar o fluxo
de painéis. `saveRuleStep` conserva consultas/foco e abre concentração quando
surge a primeira pendência. Testes puros e de navegador estão em
`tests/concentration.test.ts` e `tests/concentration-browser.cjs`.

## Dano por tipo — 20/10/2026

`src/rules/damage.ts` valida uma ocorrência com origem declarada e de 1 a 13
tipos distintos. `previewTypedDamage` é puro: retorna os passos por tipo, a
absorção externa e o total recebido. Não infere tipos/origem a partir de notas,
nomes de equipamentos ou fórmulas livres. Cada valor/redução é inteiro e limitado
a 1.000.000; entrada inválida ou reserva ilegível não altera a ficha.

A ordem de 2014 é proteção externa, imunidade, redução adicional, uma resistência
e uma vulnerabilidade. Arredonda depois da divisão e antes de dobrar. Fontes:
PDF físico 197, [regras básicas de 2014](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/combat#DamageResistanceandVulnerability)
e [Sage Advice Compendium de 2014](https://www.dndbeyond.com/sources/dnd/sac/sage-advice-compendium),
seção Wizard, interação da Proteção Arcana com resistências. O compêndio atual
de 2024 tem outra ordem; não usar `/sae/` para alterar este contrato.
Em tipos mistos, a mesa declara a ordem de absorção da proteção por setas;
o programa não escolhe uma distribuição favorável automaticamente.

`damageDefenses` só reconhece fontes enumeradas/testadas. Raça exige ID e
ancestral racial estruturados; ancestral de feiticeiro é independente. Fúria
básica respeita armadura pesada; Espírito do Urso usa a escolha do nível 3,
sem confundi-la com Aspecto da Besta. Estados de magias/recursos não recebem
novas reservas. Resistência Demoníaca usa a escolha registrada na evolução;
trocar após descanso ainda é decisão da mesa, com ajuste por ocorrência.
Fonte desconhecida/personalizada não é prometida como calculada.

`applyDamage` mantém assinatura e retorno `{ward,temp,beast,hp,excess}`. O novo
`applyTypedDamage` valida o plano completo, desconta a proteção e entrega o total
a `applyBodyDamage`, compartilhado com o caminho anterior. Não subtrai proteção
duas vezes nem dispara morte/concentração por cada tipo. O histórico registra
as parcelas e as fontes, sem copiar a ficha ou notas para a descrição.

`damage-ui.ts` ocupa somente o controle já existente em `health-ui.ts`. Campos
de modos distintos não aparecem juntos. Alterações atualizam texto/estado em
lugar; adicionar/remover/reordenar mantém os outros nós. Ajustes da mesa são
transitórios por ocorrência e não modificam benefícios permanentes. Campos
de ordem/prata aparecem quando interferem no cálculo. Não há persistência de
rascunho de dano entre trocas de aba; só a aplicação entra no documento/histórico.

Forma Selvagem bloqueia o modo por tipo: sem bloco de estatísticas, não é seguro
usar resistências humanas na besta nem calcular automaticamente o excedente.
O modo anterior continua para a mesa resolver as parcelas. Com proteção nesse
modo, o valor a distribuir é proteção absorvida + dano final às demais reservas,
após resolver a absorção antes das defesas. Não há gestão de alvos ou executor
geral de itens/magias. Testes:
`damage.test.ts` e `damage-browser.cjs`.

### Defesas condicionais e prevenção de queda

`DamagePacket` admite `dexteritySave` (somente DES para metade), `uncannyDodge`
e `modifierOrder`. O resultado de DES/Evasão define o dano antes da proteção;
depois entram imunidade, reduções/Esquiva e resistência/vulnerabilidade.
Esquiva exige classe/nível/escolha estruturados, ataque, visão e ausência de
incapacitação; a mesa confirma que ainda dispõe da reação. Não cria relógio de
turnos. Evasão não exige reação e respeita falhas automáticas de DES. Os valores
de cada tipo são arredondados separadamente. Maestria em Armadura Pesada usa
a errata de 2014: ataques não mágicos, inclusive sem arma, com armadura pesada.

Para tipos físicos mistos, a convenção explícita da ficha é uma reserva de 3
por ataque, alocada pela ordem das linhas. Se Esquiva e redução fixa coincidirem,
a mesa declara qual vem primeiro. Essa ordem não altera a posição posterior de
resistência/vulnerabilidade. Decisões diferentes podem usar o modo já resolvido.
Fontes: PHB local, [errata de 2014](https://media.wizards.com/2020/dnd/downloads/PH-Errata.pdf)
e [Sage Advice de 2014](https://media.wizards.com/2020/dnd/downloads/SA-Compendium.pdf),
seções Rogue, Wizard e Combat. Não importar a Evasão de 2024.

`survival.ts` faz a prévia pura de Resistência/Fúria Implacável antes de qualquer
desconto. `applyDamage` mantém seu retorno e aceita `options.survival` opcional;
`applyTypedDamage` aceita a escolha no quarto argumento. Só depois de validar o
plano completo são descontadas proteção/temporários e gravados os usos. Sucesso
substitui a queda por 1 PV antes de inconsciência/Fúria/Frenesi; concentração usa
o dano recebido normalmente. Falha continua pelo fluxo anterior. Não é cura,
ressurreição ou proteção contra morte instantânea. Forma Selvagem fica excluída.
`used['race:endurance']` recupera no longo; `used['barbaro:relentless']` conta
tentativas (inclusive falhas) e recupera no curto/longo. São chaves opcionais
do registro já existente; não há migração nem alteração de dados antigos.

`health-ui.ts` reutiliza confirmação/dados existentes. Cancelamento não aplica
dano; troca de ficha, alteração do documento ou do formulário durante o diálogo
invalida a confirmação. Teste de CON compartilha proficiência/aura, inspiração,
exaustão e modo da mesa, com `damage:false` para excluir Conjurador de Guerra.
O dado é validado antes de rolar/gastar. `offerSurvivalForDamage` encaminha os
atalhos de PV ao controle existente, sem consumir a defesa automaticamente.

### Críticos e adicionais de armas

`dice-formula.ts` extrai o analisador anterior sem mudar sua gramática, limites
ou retorno. `sheet.js` conserva a ponte global `parseDiceFormula`; prévia e
rolagem agora compartilham essa validação. Não há eval nem dependência nova.
`weaponStats` expõe dado efetivo da arma, bônus fixo e origem do d8 aprimorado,
além da fórmula já existente. Isso evita inferir o dado da arma a partir de
adicionais ou aplicar o aprimorado duas vezes.

`weapon-damage.ts` monta um plano puro de um acerto: arma, aprimorado, Furtivo,
Colossos, Destruição, Crítico Brutal e Ataques Selvagens. Crítico duplica dados
normais, mantém modificadores e acrescenta depois os dados próprios do crítico
(um dado individual da arma, não toda a expressão `2d6`). Mantém parcelas/tipos
na prévia e uma fórmula combinada para o rolador. Mínimo zero no resultado.
Furtivo usa nível próprio/acuidade/arma à distância; usar DES por Artes Marciais
não concede acuidade. Colossos exige a escolha do Caçador no nível 3.

`smiteSlots` só lê as reservas existentes de Conjuração/Pacto, incluindo espaços
esgotados como opções indisponíveis. Não cria espaços por multiclasse nem usa
usos raciais/Assinatura. `commitWeaponDamage` revalida o plano e só então gasta
um espaço; não chama efeitos de conjuração, não cria proteção e não encerra
concentração. Destruição não é magia lançada e pode ser usada em Fúria.
O teto é 5d8, mais 1d8 contra corruptor/morto-vivo, antes do crítico.

`weapon-damage-ui.ts` prepara o crítico diretamente na arma e substitui a
consulta duplicada por **Adicionais** ou **Registrar dano**. A preparação fica
em `WeakSet` por objeto de arma: não modifica documento/histórico, sobrevive ao
render do mesmo objeto e não é persistida. Marcar atualiza o próprio botão sem
rolar, gastar ou substituir os nós. Auto Ficha rola o crítico simples no clique
de dano; OFF/Só Pool encaminham à confirmação do resultado já rolado. Confirmar
retira a preparação; cancelar mantém. O diálogo informa o crítico que veio da
arma, sem segunda marcação. Reutiliza confirmação, balões, rolagem contida e
animação. Alterar opções mantém os nós e não grava/gasta. Confirmação valida
identidade, documento e arma; troca/edição concorrente invalida o envio.
Modo físico exige total e funciona com dados OFF; virtual usa `rollWeaponFormula`,
o motor/animação existentes sem alterar pool, vantagem de d20 ou inspiração.
Gasto e descrição entram juntos no histórico por ficha; desfazer restaura ambos.

`rollCurrentPool` e `triggerSheetRoll` devolvem o resultado síncrono já resolvido.
Somente `rollWeapon(..., 'attack')` usa `d20Natural` para atualizar a preparação
da própria arma em Auto Ficha, respeitando o intervalo de `weaponStats.critical`.
Ataque comum limpa a marca anterior; OFF/Só Pool, testes, pool e d20 rápido não
a atualizam. Não depende do total com bônus nem da animação atrasada. A eventual
renderização por consumo de inspiração mantém a identidade da arma e recebe a
atualização em seus controles atuais. A linha inferior guarda crítico/registro;
dois dimensionadores invisíveis e sem nome acessível reservam na mesma célula
a largura dos rótulos normal/crítico, evitando deslocamento de conteúdo.

**Registrar dano** não oferece dados virtuais. OFF/Só Pool também abrem somente
registro manual, inclusive com adicionais. Apenas **Adicionais** em Auto Ficha
mantém a escolha físico/virtual; a ausência de seletor significa físico por
contrato, sem inferir o modo pela fórmula ou pelo valor preenchido.

O campo físico registra o total já obtido, incluindo modificadores e dados do
crítico; não dobra esse número nem lança novamente. Rótulos e ação distinguem
**Registrar dano** de **Rolar dano** e explicam a entrada no próprio formulário.
O balão compartilhado `rule-tooltips.js` usa popover manual quando suportado,
na [camada superior nativa](https://html.spec.whatwg.org/multipage/popover.html),
para aparecer acima de diálogos. Mantém API, posição, teclado e eventos existentes,
sem receber foco ou interceptar cliques; fechar um diálogo também fecha o balão.
A margem/inset nativos são neutralizados no CSS compartilhado dos balões.

`hoverDelay` centraliza a espera de 1.000 ms por mouse. Trocar alvo, clicar,
sair, Esc ou remover o controle cancela a abertura pendente; o callback confere
também se o alvo ainda está sob o ponteiro. Toque não agenda hover. Foco de
teclado e consultas explícitas continuam imediatos.
`claim(owner)` publica `critcall-tooltip-request`: ajuda, leitor legado e
consulta fixada fecham/cancelam os demais antes de abrir, sem disputa de z-index.
O livrinho de cada magia usa `bookConsultButton` com os mesmos `RuleTooltips`
e popover de `feature-consult.ts`. O cartão não tem eventos de descrição.
Texto reúne os metadados, efeito atual e notas; magias próprias mantêm sua
descrição/fórmula e não recebem link de catálogo por coincidência do nome.
Clique/Enter/toque fixa a consulta e permite abrir o PDF por página. A rotina
antiga de livro/equipamento participa da exclusão e do atraso, preservando sua
API. Ações de ataque/conjuração, gastos e SVG/gestos do dado permanecem nos
módulos anteriores.

Armas manuais não recebem adicionais inferidos: crítico duplica os dados da
fórmula escolhida explicitamente. O botão de dano comum mantém seu contrato.
Forma Selvagem, alvos/CA, condições para Furtivo/Colossos, turnos, munição,
limite de ataques e outros adicionais ficam na mesa. Fontes: PHB local e
[críticos de 2014](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/combat#CriticalHits),
com [Sage Advice de 2014](https://www.dndbeyond.com/sources/dnd/sac/sage-advice-compendium)
para Destruição e a distinção de arma/ataque corpo a corpo. Não aplica a ação
bônus/restrição de usos de Destruição da edição 2024. Contratos em
`tests/weapon-damage.test.ts` e `tests/weapon-damage-browser.cjs`.


## Passivos da etapa R1 — 21/10/2026

`rules/passives.ts` concentra elegibilidade e cálculos sem DOM/rede. O bônus
ativo de perícia mantém o contrato anterior; `passiveSkill` soma 10 e o bônus
exclusivamente passivo de Observador. A interface mostra Percepção/Investigação
na linha existente, com ajuda sobre o cálculo e o contexto da mesa.

Ambidestro usa `ruleState.active['feat:dualWielder']`, sem nova reserva. Só
fórmulas de CA calculadas recebem o bônus; `legacy`/`written` não somam de novo.
Escudo, inconsciência e Forma Selvagem impedem a aplicação automática.
Inconsciência limpa a confirmação; cura não a repõe. O descanso curto preserva
a confirmação, pois não implica largar as armas. A confirmação diz respeito às mãos; não infere equipamento a partir do inventário.

`weapons[].pactWeapon` identifica o vínculo confirmado no editor. O formulário
só aparece para Pacto da Lâmina e só transfere o vínculo depois das validações;
cancelamento mantém os objetos anteriores. Sorvedor exige nível de bruxo e
invocação, sem usar o nível total. `weaponStats.damage` inclui o bônus, mas
`damageBonus` conserva a parcela da arma; `weapon-damage.ts` adiciona a parcela
necrótica separada. Crítico não duplica o número fixo e fórmulas manuais são
preservadas. Refresh, backup e histórico carregam o metadado existente sem
renomear armas ou selecionar uma arma importada pelo nome.

Afinidade usa somente ancestral dracônico estruturado do feiticeiro, nunca a
raça. `resolveSpellEffect` soma CAR depois de compor Gêmea; prévia e lançamento
usam a mesma fórmula. `rollSpellRay` solicita `elementalAffinity:false` porque a
rolagem inicial já recebeu o bônus. Não cria contador diário, nova carga ou
custo de feitiçaria. Valores negativos de CAR são conservados; somente Sorvedor
tem mínimo 1. O resultado virtual de dano com Afinidade tem piso zero, sem
alterar a fórmula ou os totais de outros testes/pool. Tipos variáveis, fórmulas próprias, dano posterior e classificação
integral do catálogo continuam sujeitos aos limites de R5 na auditoria.

Testes: `tests/passives.test.ts` e `tests/passives-browser.cjs`, integrado a
`npm run test:browser`. Estado de entrega na auditoria e na retomada.

## Rolagens contextuais de R2 — 21/10/2026

`rules/dice-roll.ts` extrai a avaliação do pool para um módulo puro, preservando
ordem/soma dos dados, escolha do primeiro d20 e o contrato público
`total`/`d20Natural`/`breakdown`/`appliedMode`. Guarda também faces, modificador e
regras da jogada para recompor uma repetição sem lançar os demais dados.
`d20Natural` conserva a face escolhida; Talento Confiável aplica o mínimo 10 ao
valor usado no teste, antes de somar o restante, sem inventar um natural 20.

`sheetD20Rules` recebe contexto explícito de ataque, resistência ou teste.
Somente uma perícia conhecida com proficiência e ladino 11 recebe o mínimo;
bônus personalizado não prova proficiência. Sortudo racial exige ID canônico
de halfling, independente do talento homônimo. Pools livres e d20 rápido não
recebem contexto, e fórmulas com vários d20 não inferem qual é a jogada.

O resultado de uma jogada automática oferece a repetição racial opcional.
Ela muda um único 1, uma vez, aceita a nova face e conserva o modo original,
mesmo se a bandeja mudar de modo depois. Um registro transitório guarda
sequência, identidade/espaço e snapshot da ficha; alteração ou outra jogada
invalida a opção. Não há nova reserva ou gravação de histórico para esta
característica sem gasto. A inspiração já foi consumida na jogada inicial e o
crítico preparado da arma acompanha a nova face.

Concentração, morte e Fúria Implacável aplicam consequências imediatamente:
o diálogo existente permite optar pela repetição antes do lançamento virtual.
`rollRuleDie` aceita contexto e intenção opcionais; argumentos antigos continuam
válidos. Dado físico registra a face final; OFF não lança, e cancelar não aplica
o teste. Desenho, gestos e aparência do dado continuam nos módulos anteriores.
Regressões puras e Chromium ficam em `tests/dice-roll.test.ts` e
`tests/conditional-rolls-browser.cjs`; a auditoria delimita o restante de R2.

## Talento Sortudo em R2 — 22/10/2026

`resourcesFor` define `feat:lucky` como contador de três pontos/descanso longo.
`lucky.ts` valida a escolha estruturada e a reserva antes de gastar, inclusive
a 0 PV. Sortudo racial não concede pontos. Máximos configurados permanecem
adaptáveis; um registro ilegível é preservado e bloqueia gasto/correção. O
vínculo em `placement.ts` usa a escolha com classe, evitando o traço homônimo;
se faltar a entrada, insere a referência em Talentos. Há um único contador.

`addLuckyDie`/`chooseLuckyDie` mantêm as faces, demais dados, modificador e modo
originais. O adicional não escolhe automaticamente o melhor resultado. A seleção
pode usar qualquer d20, conforme a exceção de 2014, e reaplica o mínimo de
Talento Confiável à face escolhida. Cancelamento por outra criatura é registrado
sem dado adicional. A repetição racial pode substituir um único 1 do conjunto;
não concede cadeia de rerrolagens nem pontos ao talento.

`lucky-ui.ts` reúne custo, escolha em diálogo e uso físico/ataque recebido.
`recordStepAndSave` conserva seus dois argumentos anteriores e aceita um
terceiro `redraw=false` para um custo já pago durante uma escolha: persiste
ficha/histórico e atualiza a barra sem remontar o formulário do dano. Saldo e
botões são atualizados nos próprios nós. Ao escolher uma face na bandeja, o
grupo de botões também é reutilizado, com `aria-pressed`, contorno e símbolo;
isso não lança outro dado nem altera a aparência/gestos do d20 flutuante.

`resolveRuleD20` é a ponte assíncrona para os testes com consequências. A ponte
síncrona `rollRuleDie` continua válida. O diálogo oferece decisão depois do d20,
gasto antecipado ou resolução sem o talento. Inspiração é consumida no lançamento
inicial e o ponto de Sortudo, antes do adicional. O `WeakMap` de escolhas pendentes
usa identidade, chave do teste e snapshot após o custo; cancelar mantém os dados
na sessão, e retomar não repete RNG/custo. PV, dano e fila de concentração só mudam
após a confirmação da face. Mudança da ficha invalida a aplicação antiga.

Faces pendentes não integram o documento nem o backup: recarga/troca de
instalação perde o conjunto transitório, preservando custos já salvos. Ataques
recebidos usam a face já escolhida pelo atacante e o d20 adicional informado,
sem usar bônus/arma/racial/inspiração do defensor nem aplicar acerto/dano.
Declaração de uso por outra criatura e o momento anterior ao resultado continuam
na mesa. Não há novo estado de turno, alvo ou serviço remoto. Regressões em
`tests/lucky.test.ts` e `tests/lucky-browser.cjs`; escopo restante na auditoria.

## Correções do check-up de 23/10/2026

`setPermanentAbility` é o contrato comum à digitação e aos botões: aplica a
variação de CON por nível aos PV já registrados, mantendo déficit, 0 PV e
exaustão. Não reconstrói máximos manuais. `untrainedAbilityBonus` distingue
Atletismo Extraordinário (FOR/DES/CON, arredondamento para cima) e Versatilidade
(para baixo), sem acumular nem afetar testes treinados ou resistências.

`spellMeta.damageComponents` identifica componentes simultâneos nos casos
auditados; `resolveSpellEffect` compõe a fórmula e o resumo sem confundir fases
ou alternativas de outras magias. `spellDamageBreakdown` atribui as mesmas faces
do pool aos componentes para mostrar subtotais, sem nova rolagem ou alteração
do total. Tempestade de Gelo aumenta só concussão;
Coluna de Chamas separa os dados adicionais cujo tipo cabe à mesa. Arma
Espiritual inclui a habilidade da origem; Evocação Potencializada entra uma
vez na rolagem inicial de dano reconhecida, depois de Gêmea. `customRoll`
continua tendo precedência. O indicativo de Raio Solar em fichas antigas usa a
geometria corrigida, sem gravar uma migração ou apagar adaptações.

A concentração v1 aceita `resourceId` opcional somente para Duplicidade e
Presença Dracônica. Encerrar/substituir/testar limpa o estado ativo associado;
a ativação valida impedimentos antes do custo e a interface confirma a troca
com revalidação da ficha. Descansos encerram essas características curtas,
preservando Asas de Dragão até o jogador recolher.

`resource-roll-ui.ts` reutiliza `dieSourceControls`/`chooseDieSource` para faces
físicas ou o rolador existente, sem alterar a aparência do dado flutuante.
Valida ficha/modo/faces antes do resultado e mantém uma escolha pendente por
ficha. `resource-effects.ts` aplica Retomar/Intervenção depois de validar custo
e efeito. Presságio admite faces explícitas em `takeRest`, evitando RNG oculto
em OFF; os consumidores puros antigos ainda podem fornecer o gerador de testes.
A semana de Intervenção não é inferida por descanso nem pelo relógio da máquina.

O extrator limita magias ao PDF 288 e registra `sourceNote` para a correção
editorial de Onda Destrutiva. Consulta da importação/ficha mostra a nota; o PDF
não muda. Regeneração preservou as outras 359 magias e os dois catálogos restantes.
Escopo e regressões ficam na seção atual de
[AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md#check-up-profundo-de-23102026).

## Arma de Sopro de draconato — 23/10/2026

`draconic-ancestry.ts` mantém a tabela única das dez cores e separa a escolha
racial `raceDragon` da origem `dragon` de feiticeiro. `dragonborn-breath.ts`
valida consciência, ancestralidade, nível, CON, uso e total antes de qualquer
mutação. `race:breath` é um recurso comum de recuperação curta/longa; o vínculo
em `placement.ts` ocupa a característica racial já existente, sem outro painel.

`dragonborn-breath-ui.ts` reutiliza o diálogo e a seleção físico/virtual de PV,
e `rollWeaponFormula` para os d6, sem pool manual, inspiração ou modo de d20.
Confirmação cancelada ou ficha modificada não consome recurso. A edição racial
exige `canConfigureSheet`, conserva o próprio select/foco e não reseta gastos.
`ruleState.lastBreath` v1 guarda ancestral, tipo, área, teste, dados, CD, total,
metade e fonte do dado; é resultado passado, sem estado de turno ou alvo.

Em Forma Selvagem, capacidade física e modificador de CON da forma são entradas
explícitas, sem preencher estatísticas de criatura nem alterar a CON humana.
Não se trata de magia: nenhum espaço, afinidade ou concentração é consumido.
Testes/defesas dos alvos e aplicação a outras criaturas permanecem na mesa.
Regressões: `tests/dragonborn-breath.test.ts` e `tests/dragonborn-breath-browser.cjs`.

## –5 no ataque / +10 no dano — terceiro recorte de R2, 23/10/2026

`weapon-power-attack.ts` valida talento, categoria/modo da arma e proficiência
sem alterar `weaponStats` ou os totais do documento. Atirador exige categoria
à distância (Dardo é elegível; Adaga/Azagaia arremessadas não); Mestre exige
ataque corpo a corpo com arma pesada. Valores manuais e Forma Selvagem não
recebem o ajuste automático. Arremesso improvisado de arma pesada é excluído.
`weaponStats` respeita acuidade do Dardo também ao escolher FOR/DES; overrides
continuam soberanos. O +10 é uma parcela fixa do tipo da arma em
`previewWeaponDamage`, inclusive no crítico e com Destruição.

`weapon-damage-ui.ts` mantém a preparação num WeakSet por objeto de arma,
como o crítico. O checkbox atualiza os próprios textos/nós sem histórico/RNG;
`sheet.js` usa o bônus transitório no d20, mantendo seu contexto/Sortudo.
Dimensionadores invisíveis reservam os rótulos com e sem crítico/+10.
Dano direto e Adicionais usam o mesmo plano; total físico já inclui o bônus e
não recebe outra soma. Confirmação limpa as marcas; cancelamento mantém.
Revalida ficha, arma, documento, preparação e autorização antes de rolar/gastar.
Recarga/novos objetos descartam a preparação; não há migração ou novo contador.

A declaração anterior ao ataque, acerto/erro, turnos, cobertura/alcance e ação
bônus de Mestre de Armas Grandes permanecem na mesa; o controle permite
corrigir uma preparação manualmente. Registros/fórmulas existentes ficam
intactos. Regressões em `weapon-power-attack.test.ts` e no roteiro de navegador.


## Curas de valor fixo e compatibilidade — 23/10/2026

O motor possui duas entradas explícitas para Cura Completa/Em Massa; não ampliar
a heurística genérica de cura, que também atingiria Simulacro. O resolvedor
produz resumo com círculo/Discípulo da Vida e `formula:null`: conjurar registra
o espaço, sem RNG, pool novo ou aplicação automática de PV/condições.
`resolveSpellMeta` apresenta Cura em cópias antigas dessas duas entradas que
salvaram Utilidade, apenas quando automáticas do catálogo; não altera os dados
armazenados e respeita fórmula/tipo próprios. Bom Fruto integra a exclusão de
Gêmea para efeitos que criam objetos. Referência/cobertura ficam na auditoria.

## Repetições dos dados de arma em R2 — 23/10/2026

`weapon-rerolls.ts` identifica talento/estilo estruturados e arma automática
corpo a corpo. O estilo exige duas mãos/versátil em duas mãos e não aceita
escudo. O plano existente mantém a parte Arma antes das demais para cada tamanho
no pool; a sessão extrai somente essas faces, inclusive sua duplicação crítica.
Adicionais de características e modificadores não são repetidos. Recompor o
resultado não lança dados: muda somente as faces elegíveis e recalcula o piso
zero no total, conservando valores negativos e componentes do pool original.

Cada conjunto guarda quais faces já receberam o estilo. Bestial cria um segundo
conjunto inteiro; escolher entre eles não usa RNG. A disponibilidade por turno
é declarada pela mesa. Não há contador diário ou estado de combate novo.

`weapon-rerolls-ui.ts` usa o diálogo e a apresentação de dados existentes. Um
WeakMap por ficha guarda faces, objeto da arma, snapshot e sequência da jogada.
Fechar/retomar não cobra outro espaço nem gera faces novas. Antes de cada escolha,
valida documento, identidade, permissão, Auto Ficha e sequência exposta por
`ruleDiceSettings`; qualquer outra rolagem invalida a sessão. Gastos já confirmados
permanecem. Resultados/repetições vão ao histórico local com `redraw=false`,
mantendo os nós do diálogo. A escolha transitória não integra documento/backup;
recarga a descarta, sem restaurar recursos. OFF/Só Pool não entram nesse caminho.

## Revisão delimitada de invocações — 23/10/2026

`features` recompõe por evento a aquisição atual das invocações do bruxo antes
de montar os ganhos visíveis. Substituições retiram a aquisição anterior e
reaprendizado mantém só o evento novo, sem editar o histórico ou zerar recursos.
Os demais tipos de escolha mantêm o contrato anterior. Os contadores sem ação
automática de invocação em `ui.ts` dizem Registrar uso e explicam a resolução
manual; `useResource` continua descontando apenas o contador, inclusive quando
o espaço já foi registrado separadamente. Não duplicar o gasto de Pacto.

Dois overrides explícitos em `spellMeta` corrigem apenas Vitalidade Falsa e
Rogar Maldição. `spell-effects.ts` produz resumos sem RNG ou aplicação de PV:
PV temporários não recebem Vida; o 1d8 da maldição pertence a um efeito escolhido
e a eventos posteriores. Fórmulas próprias permanecem no retorno prioritário.
`resolveSpellMeta` corrige somente os antigos tipos automáticos reconhecidos
dessas duas magias, sem reescrever seus campos.

`spell-duration.ts` resolve o perfil de duração/concentração da maldição pelo
círculo usado. `spellConcentration`, confirmação e aplicação aceitam um último
argumento opcional, preservando chamadas anteriores. A ficha passa o círculo
real (Conjuração/Pacto) à prévia e aplicação; a consulta usa o mesmo perfil.
Registros próprios de duração/concentração e efeitos personalizados continuam
manuais. Nenhuma tabela de criaturas ou automação completa de invocações foi
introduzida; esses limites seguem na matriz da auditoria.

## Adepto Elemental — 24/10/2026

`elemental-adept.ts` lê talento e elemento do mesmo evento estruturado, unifica
as escolhas repetidas e desconsidera campos órfãos e níveis/classes removidos.
O perfil usa a fórmula final do resolvedor, depois de Gêmea/Afinidade/Evocação.
Magias personalizadas/fórmulas próprias não ganham automação; uma lista explícita
mantém manuais os tipos/camadas/rodadas que o catálogo ainda não distingue.
O motor compartilha a lista de elementos restantes entre pré-requisito e campo
de escolha, retirando o talento da oferta quando os cinco já foram adquiridos.

`spellDamageContext` passa o mesmo perfil ao lançamento e aos raios posteriores.
`applyElementalAdept` confere dados/modificador, conserva faces e soma somente
o número de faces 1, sem RNG ou mutação. A marca transitória no `DiceResult`
impede reaplicação. A decomposição usa essas mesmas faces tratadas nos componentes;
o detalhe mostra os valores originais, o ajuste e quais resistências ignorar.
No texto de 2014, o mínimo se refere a qualquer dado de dano da magia elegível;
em dano misto, ignorar resistência continua restrito ao elemento escolhido.

Prévia e livro recebem a nota do perfil. OFF registra o lançamento normal e
orienta a resolução física; Só Pool, d20, cura, armas, sopro e bandeja livre
não herdam o contexto de magia. Nenhum alvo/PV remoto, resistência recebida ou
documento recebe o perfil, que não entra em backup/histórico ou sincronização.

## Manobras de dano — sexto recorte de R2, 28/10/2026

`maneuvers.ts` resolve aquisições vigentes por classe/nível e as duas escolhas
no mesmo evento do Adepto Marcial. Trocar manobra da classe não apaga aquela
aprendida pelo talento. Define Desarmante/Derrubar, DC e origens de superioridade;
não depende de DOM, recursos, RNG ou armazenamento. `resourcesFor` usa essas
origens mantendo o id antigo de classe e acrescentando só o id do talento,
recuperáveis pelo descanso existente. Overrides de máximo continuam explícitos.
Gastos ilegíveis não são corrigidos por um clique de usar/devolver.

`weapon-damage.ts` cruza as manobras conhecidas com arma automática, recurso
válido e escolha de habilidade. Exige confirmar a ausência de outra manobra no
ataque: não deduz esse fato pelo último d20 ou por turno inexistente. A parcela
da manobra entra depois da Arma; o crítico dobra seus dados, e o resolvedor de
rerrolagens conserva essa parcela mesmo quando ambos usam d8. Todos os custos
são validados antes do desconto síncrono de superioridade/Destruição.

A interface reutiliza Adicionais, diálogo, ajudas e registro físico/virtual.
Campos ocultos são revelados sem recriar select/foco; não prepara/gasta manobra
por marcar a opção. Mudança para OFF/Só Pool invalida uma confirmação virtual
pendente antes do RNG. Histórico registra dado/origem/CD e efeito manual do alvo
junto do custo, sem novos campos em armas, nuvem ou histórico de rolagens.
A consulta do Adepto explica a errata sem modificar o catálogo/PDF gerado.
Limites e próximos avanços permanecem na matriz única da auditoria.

## Ataque de Precisão — sétimo recorte de R2, 28/10/2026

`superiority.ts` reúne a consulta de origens, saldo e legibilidade já usada
no dano, sem inventar reservas. `precision-attack.ts` valida arma reconhecida,
conhecimento vigente, resultado de um ataque, origem/face e as confirmações
antes de somar o dado e gastar. Rede é válida: dano não é requisito de Precisão.
O fluxo implementa a decisão posterior ao d20; ataque-base físico/manual e
uso anterior ao d20 permanecem na mesa, com registro do contador existente.

`DiceResult.precision` guarda a face, tamanho e origem do dado adicional,
separados de grupos/modificador/d20 natural. `summarize` conserva o mesmo
adicional ao compor Sortudo/halfling, sem relançar, duplicar ou mudar a face
natural. Não se aplica mínimo/rerrolagem racial a esse dado de superioridade.
O resultado continua transitório; o histórico registra uma descrição do custo.

`weapon-attack-session.ts` usa WeakMap por objeto de arma e proprietário. O
ataque real cria uma identidade, independente de um d20 rápido. Precisão marca
essa sessão; Adicionais recusa outra manobra nela. Dano confirmado encerra a
sessão/opções do resultado, inclusive no registro físico sem novo lançamento.
Outra jogada da arma cria outra identidade. Trocar ficha/conta ou modo de dados
apaga as sessões, sem bloquear o próximo ataque-base físico/manual.
Esse vínculo não simula turnos, alvos ou ações resolvidas fora do aplicativo.

`precision-attack-ui.ts` reutiliza diálogo, escolha físico/virtual e avisos.
Antes do RNG/gasto, revalida sequência, snapshot, modo Auto Ficha, conta, arma,
identidade do ataque e permissão. Cancelar não cobra. O custo usa o salvamento
existente sem remontar a ficha; saldo e botões da origem atualizam seus nós.
`sheet.js` só faz a ponte do evento e mantém a apresentação já usada por
Sortudo. Ao somar Precisão, os botões de faces existentes são conservados.
Não muda a aparência/gestos do dado, armazenamento de notas, histórico de
25 registros ou a sincronização manual, nem cria chamadas de rede.
