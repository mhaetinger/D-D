# Arquitetura e próximas etapas

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
A validação revela o setor e os detalhes antes de focar o primeiro campo inválido.
`pool-fields.ts` monta os campos de reservas e sincroniza apenas os resumos e
aberturas. Todos permanecem no formulário. Quantidades exatamente zeradas e
válidas começam recolhidas por reserva; o círculo de Pacto também deve ser válido.
Dados ausentes/inconsistentes não são tratados como zero. Durante a edição não
recolhe o grupo do usuário; novas reservas após comparação abrem sem recriar nós.
O recolhimento considera os valores, não a classe, para preservar adaptações.
A tipografia da revisão fica restrita ao diálogo em `import-review.css`, com
16px de leitura/campos em M, rótulos de 15px e títulos Cinzel; a escala usa rem.
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
Na ficha larga, as colunas dividem níveis inteiros, em fluxo nativo, sem separar
uma habilidade de seus controles. `app/feature-consult.ts` conserva as chaves de
consulta e monta botões separados das ações de uso. Hover usa `RuleTooltips`;
clique/toque fixa o mesmo texto com origem, escolhas e livro em um popover de
consulta. Reutiliza o estilo e a rolagem dos balões. ×, Esc e clique fora fecham;
trocar ficha/aba/conta encerra a consulta antiga. O texto é inserido com
`textContent`, e o link do livro usa somente página numérica validada.
`feature-level-title` centraliza o nível entre linhas decorativas em `::before`
e `::after`, sem acrescentar nós nem aumentar a fonte ou o espaço dos grupos.
Os nomes dos recursos dentro de cada característica usam a escala de apoio,
peso 600 e itálico em `.feature-entry > .rule-inline > strong`. Isso distingue
subcontroles como Canalizar Divindade dos títulos, preservando botões, usos,
balões e os vínculos existentes.

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

`app/account-panel.ts` alterna as abas Perfil/Personagens sem remontar os
formulários. Cada abertura começa em Perfil, inclusive retornos de acesso à
conta; campos e rodapé mantêm seus próprios nós. Backup, importação, revisão como
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
estrutura os campos de cálculo e conserva os IDs usados pela ponte anterior.
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

`panels.ts` monta os editores de armas/itens/características/magias no próprio
bloco e conserva seus nós durante renders. Troca de ficha/espaço os encerra.
`spell-fields.ts` fornece os mesmos campos/leitura ao cartão da ficha e à revisão
de importação, sem acessar armazenamento/global nem criar forms aninhados.
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

## Login preparado, ativação pendente

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
sincronização real entre dispositivos, publicação, SMTP próprio e revisão dos
alertas descritos em SINCRONIZACAO.md. Contratos em [LOGIN.md](LOGIN.md) e [SINCRONIZACAO.md](SINCRONIZACAO.md).

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
com versões disponíveis, preservando o CSS gerado. O aviso remanescente da cadeia
de build e sua exposição estão registrados no guia da primeira publicação.

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

O build calcula uma revisão pelo conteúdo dos arquivos e gera `sw.js` com a lista
dos recursos da ficha e do leitor. Cache por revisão e escopo evita misturar builds
ou interferir em outros projetos no mesmo domínio. O worker normaliza a raiz do
projeto para `index.html` e `/book` para `book.html`. Respostas guardadas após
redirecionamentos HTML são reconstruídas para permitir navegação offline também
no Cloudflare Pages. A revisão inclui a política do worker além dos arquivos.
Na instalação, as requisições usam `cache: reload` para buscar o conteúdo atual
e atualizar o cache HTTP. Sem isso, o Pages pode fornecer HTML da entrega anterior
a partir do cache do navegador e prendê-lo no cache offline da revisão nova.

Uma versão ativa entrega HTML, regras e assets do seu próprio cache. A nova versão
aguarda as abas antigas fecharem; não usa `skipWaiting` ou recarga forçada. Cache
antigo do aplicativo é removido só na ativação, sem tocar em fichas/anotações.
O cache não recebe respostas de APIs, requisições privadas ou PDFs. Os livros
exigem rede no leitor integrado; baixar o PDF é uma ação separada do jogador.
O indicador no perfil informa quando o primeiro preparo offline terminou.

## Sequência de evolução

1. **Concluído nesta etapa:** estrutura de aplicação, build, dependências locais,
   backup, recuperação, migração preservando legado e funcionamento offline da ficha.
2. **Implementado na branch:** fila IndexedDB, histórico/checkpoints persistidos,
   nome automático, sincronização pessoal e versões recuperáveis.
3. **Validação de contas/dados:** migração aplicada e RLS conferida no CritCall;
   conferir sincronização com duas contas/dispositivos reais,
   SMTP próprio e publicação por PR. Conta e recuperação locais foram relatadas
   como bem-sucedidas; isso não valida a sincronização real.
4. **Depois da base individual:** retrato, salas, participantes, resumo do grupo e
   turnos do mestre; voz/vídeo por último. Não implementar permissões de mesa só
   escondendo botões nem compartilhar notas pessoais.

Os layouts 2014/2024 continuam sobre o mesmo conjunto de regras de 2014. Regras
da mesa são identificadas, incluindo recuperação integral ao dormir nesta campanha.

## Dado e imagens pessoais

O dado recolhido é transitório, sempre fechado ao abrir/trocar espaço. A posição
normalizada usa `dnd_dice_tray_position` e é limitada ao viewport/tamanho atual.
`ResizeObserver` reposiciona após sair da entrada oculta, além de rotação e resize.
O resultado fica em sessionStorage por espaço; não gera documentos remotos.
Arrastar exige mais de 8 px; arremessar exige pelo menos 48 px e velocidade final
mínima de 0,85 px/ms na janela recente. Cancelar/interromper o gesto não rola.
Clique/Enter abre a bandeja, R rola d20 normal, setas movem. O d20 rápido usa
`evaluateDicePool({20:1},0,'normal')` sem modificar pool, modificador ou modo atual.
A sequência de rolagens descarta callbacks antigos e trocas de espaço cancelam
animações. Movimento reduzido desativa o giro decorativo.

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

Escopo, decisões de automação e verificações em [REFATORACAO-2014.md](REFATORACAO-2014.md).

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
itens concluídos da refatoração não equivalem à automação de todo o livro;
o novo roteiro destaca iniciativa/passivos, componentes cortados, concentração,
morte, Dados de Vida, inspiração e condições.

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
Não houve mudança de SQL/RLS/RPC. Concentração, condições gerais, efeitos de
classe que evitam 0 PV e simulação do tempo de jogo continuam fora desta etapa.

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

Armas manuais não recebem adicionais inferidos: crítico duplica os dados da
fórmula escolhida explicitamente. O botão de dano comum mantém seu contrato.
Forma Selvagem, alvos/CA, condições para Furtivo/Colossos, turnos, munição,
limite de ataques e outros adicionais ficam na mesa. Fontes: PHB local e
[críticos de 2014](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/combat#CriticalHits),
com [Sage Advice de 2014](https://www.dndbeyond.com/sources/dnd/sac/sage-advice-compendium)
para Destruição e a distinção de arma/ataque corpo a corpo. Não aplica a ação
bônus/restrição de usos de Destruição da edição 2024. Contratos em
`tests/weapon-damage.test.ts` e `tests/weapon-damage-browser.cjs`.
