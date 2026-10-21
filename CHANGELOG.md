# Changelog

## Não lançado

### Legibilidade do perfil e padrão dos quadros de magia — 2026-10-21

- Perfil e Personagens passam a usar texto principal de 16px, apoio de 14px,
  ações de 15px e títulos distintos em M. P/M/G/GG continuam aplicáveis. Janela
  com até 36rem e ferramentas de backup em uma coluna quando necessário.
- Quadros por classe, barra e cabeçalhos dos círculos compartilham a margem
  interna. Ações de preparo, concentração e recursos usam os mesmos tamanhos,
  pesos, cores e preenchimentos do tema. Duração e testes de concentração têm
  intervalo próprio após os botões, nas duas abas.
- Preparo adaptado ganha espaço após a lista de magias, inclusive vazia. Dicas
  de preparo usam o balão da ficha por hover/foco, sem ajuda nativa concorrente;
  clique no checkbox apenas altera sua seleção. Teclado alcança a dica pelo
  próprio controle, sem outra parada de Tab. Dados, rascunhos e regras preservados.
- Conferidos 385 testes Node, tipos/build e seis scripts Chromium: perfil,
  cadeado/dicas, quadros de classe, concentração, revisão por setores e criação.
  Incluem hover sem seleção, clique independente, foco/Esc no diálogo nativo,
  fontes em M, margens/ações/duração, cópias/cancelamento, offline e
  320px/GG/três temas/dois layouts. Capturas visuais também conferidas.

### Ferramentas em Personagens e editor de armas alinhado — 2026-10-20

- Backup, importação, revisão como cópia e inclusão de notas aparecem somente
  na aba Personagens. Trocar de aba preserva os controles e sua seleção;
  armazenamento/sincronização continuam acessíveis nas duas abas.
- Editor de arma mantém nome, cálculo, ataque e dano organizados no próprio
  bloco da ficha, com rótulos acima dos campos e controles seguindo o tema.
  Proficiência, habilidade e ajustes adicionais ficam recolhidos. Grades usam
  a largura disponível do cartão, e os botões de dados quebram em linhas.
- Preservados cálculos, dados montados, rascunhos, cancelamento e metadados
  anteriores das armas; os IDs usados pela ponte de eventos não mudaram.
- Conferidos 385 testes Node, tipos/build e seis scripts Chromium: editor de
  armas, perfil/coleção, aplicação, importação, edição na ficha e cadeado.
  Incluem cálculo manual/automático, dados/ajustes/metadados, cancelamento e
  recarga, cópias/notas/recuperação/offline e 320px/GG/três temas/dois layouts.

### Perfil separado da coleção e visualização em cartões — 2026-10-20

- Perfil e Personagens ficam em abas da mesma janela. A abertura começa em
  Perfil, com nome, imagem e acesso à conta; backup/armazenamento mantêm o rodapé
  comum. Navegação por teclado e formulários preservados durante a troca.
- Personagens oferece Lista ou Cartões, lembrando a escolha neste navegador.
  A mudança de visual conserva nós, retratos e ações; cartões se adaptam a nomes
  longos e fonte ampliada, com uma coluna no celular. Estado Ativo é identificado
  por texto, e os seletores têm marcas além da cor.
- Conferidos 385 testes Node, tipos/build e quatro scripts Chromium: perfil e
  coleção, aplicação, autenticação e sincronização com HTTP simulado. Incluem
  abrir/excluir/cancelar após mudança de índices, retratos, nome, dados, backup,
  isolamento/recuperação/falha de gravação, offline e 320px/GG/três temas.

### Avisos dentro das janelas e ajuda de concentração — 2026-10-20

- Notificações usam a janela em uso: criador/preparo, perfil, loja ou diálogo
  nativo. O aviso fica no próprio formulário/rodapé, sem roubar foco, recriar
  opções ou rolar a página até um erro distante. A ficha mantém seu toast normal.
- Limite de preparo usa texto curto, sem repetir a descrição inteira do campo.
  Avisos anteriores têm seu temporizador cancelado; fechar a janela oculta o
  aviso para não reaparecer na próxima abertura. Textos continuam como dados;
  falhas de gravação conservam prioridade sobre mensagens de sucesso.
- Dica de concentração explica que combate e grimório mostram o mesmo registro
  e que preparar magias não ativa o efeito. Regras e modos de dados preservados.
- Conferidos 385 testes Node, tipos/build e seis scripts Chromium: quadros e
  preparo, criação, dano de armas, concentração, revisão por setores e ataques
  mágicos. Incluem sétima escolha recusada sem mudar ficha/nós/foco/rolagem,
  item sem nome, validação com diálogo nativo aberto, cancelamento, modos de
  dados, persistência/offline e 320px/GG/três temas/dois layouts.

### Saída do preparo e características agrupadas — 2026-10-20

- A primeira etapa de preparo oferece Voltar à ficha. Sair com escolhas pendentes
  usa a confirmação de descarte existente; cancelar conserva opções, nós e
  rolagem. Voltar da revisão mantém a seleção. O lembrete do descanso só é
  retirado ao aplicar, e não ao abrir ou cancelar o assistente.
- Removido o parágrafo introdutório da etapa de magias para ampliar a lista;
  descrições e consultas por magia continuam disponíveis.
- Características reunidas por classe/origem e nível, sem repetir esses rótulos
  em cada habilidade. Descrições, escolhas e controles permanecem vinculados aos
  ganhos; a origem completa de subclasse/escolha fica na descrição. Na ficha
  larga, as colunas dividem níveis inteiros. Anotações manuais são preservadas.
- Conferidos 385 testes Node, tipos/build e quatro scripts Chromium: quadros e
  preparo, regras, criação e edição em linha. Incluem retorno/cancelamento/foco,
  preparo com proteção, vínculos e controles multiclasse, descrições abertas,
  persistência/offline e 320px/GG/três temas/dois layouts.

### Quadros de conjuração por classe — 2026-10-20

- Paladino, Clérigo, Druida e Mago ganham quadros compactos no grimório, com
  contador e ação de preparo. Recuperação Arcana e Recuperação Natural ficam
  junto à classe correspondente, com os mesmos usos e espaços compartilhados.
- Bardo, Patrulheiro, Cavaleiro Arcano e Trapaceiro Arcano têm resumos de sua
  conjuração. Usa classe/subclasse estruturada e nível mínimo; não infere origem
  de textos do PDF nem apresenta contagem de magias conhecidas a partir do grupo.
- Feitiçaria e Pacto mantêm seus quadros. A barra conserva filtros, ajustes,
  impedimentos e uma única Concentração. Não duplica espaços ou ações de preparo.
- Conferidos 385 testes Node, tipos/build e Chromium de quadros por classe,
  regras e concentração. Incluem preparo protegido/sempre preparadas, recuperações
  independentes/cancelamento, origem, níveis/subclasses, filtros, recarga offline
  e 320px/GG/três temas/dois layouts.

### Organização dos cartões de armas — 2026-10-20

- Nome e descrição usam a largura inteira, preservando notas longas do PDF.
  Ataque e dano ficam numa faixa própria, com colunas e alturas consistentes.
  Empunhadura, crítico e registro manual ocupam o rodapé, com quebra em telas
  pequenas; preparar crítico mantém as posições dos controles.
- Conferidos 385 testes Node, tipos/build e Chromium de armas, regras e edição
  em linha: notas extensas, alinhamento entre armas, empunhadura/foco, crítico,
  recursos/cancelamento, editor, offline e 320px/GG/três temas/dois layouts.

### Inspiração e explicações de combate — 2026-10-20

- Inspiração sai da linha de Exaustão e fica em uma linha própria no quadro de
  PV, sem criar outro cartão. Mantém receber, preparar/cancelar e usar na mesa,
  com uma única instância nos dois layouts.
- Títulos de Dano detalhado e Condições ganham dicas de finalidade; a ajuda de
  Concentração começa pela explicação do que o controle acompanha.
- Conferidos 385 testes Node, tipos/build e Chromium de PV e concentração:
  inspiração, consumo/cancelamento, isolamento/histórico/offline e linha sem
  transbordamento em 320px/GG, três temas e dois layouts.

### Cabeçalho compacto e evolução protegida — 2026-10-20

- Classes ocupam uma faixa própria e compacta, com cores e subclasse. Texto
  longo não aumenta o cartão inteiro: o resumo abre para leitura completa.
  Nome/retrato e conjuração ficam separados dos dados de identidade.
- No celular, raça/antecedente/tendência/nível usam linhas compactas. Visual e
  dados começam recolhidos; os controles permanecem acessíveis e montados.
  Redimensionar mantém aberto um controle de preferência que esteja com foco.
- Upar abre e aplica a evolução mesmo com o cadeado fechado, sem liberar os
  campos de ajuste. Confere permissão ao abrir e confirmar; recusa uma proposta
  de outra ficha. Recusa mantém o assistente e suas escolhas abertos.
- Conferidos 385 testes Node, tipos/build e cinco scripts Chromium: tipografia,
  cadeado, criação, edição em linha e aplicação. Incluem evolução com proteção,
  revogação antes da confirmação, mestre/jogador, subclasse longa, 320/390/768/1140px,
  M/GG/três temas/dois layouts, foco/rascunhos e evolução offline.

### Leitura e reservas na revisão de importação — 2026-10-20

- Revisão com texto principal e campos de 16px em M, rótulos de 15px e títulos
  Cinzel distintos. Avisos, abas, perícias e editores de magia seguem a hierarquia;
  P/M/G/GG e os três temas continuam disponíveis.
- Reservas de magia iniciam recolhidas quando zeradas. Conjuração, Pacto e
  Feitiçaria abrem separadamente conforme seus valores, sem depender apenas da
  classe. Reservas com erro ficam para conferir; a confirmação revela campos
  inválidos mesmo dentro de blocos recolhidos. A edição não fecha o grupo do
  usuário; aplicar máximos abre reservas novas, preservando nós, usos e pontos.
- Avisos distinguem armas do catálogo de ataques especiais, como sopros, e
  explicam que incluir o texto extraído depende das anotações pessoais opcionais.
- Conferidos 385 testes Node, tipos/build e três scripts Chromium de importação,
  setores e edição em linha: cópias/notas/cancelamento, preservação de campos,
  comparação de reservas, validação oculta, offline sob /D-D/ e 320px/GG/três temas.
  Um PDF real autorizado também foi aberto/cancelado em contexto isolado para
  conferir reservas zeradas e ataques manuais. Sem dados pessoais no repositório.

### Legibilidade e hierarquia visual da ficha — 2026-10-20

- Recuperadas as cores anteriores por classe, com nível e subclasse visível.
  Cartões do cabeçalho alinham rótulos/valores; nome e dados de conjuração têm
  linhas próprias, sem texto truncado em um único rótulo.
- Texto principal em M passa a 16px, apoio 14px e títulos Cinzel distintos do
  corpo. CA, deslocamento e PV recuperam destaque também com o cadeado fechado;
  a unidade m acompanha seu valor. Inventário, história e regras mais legíveis.
- Nova folha de tipografia restrita à ficha, mantendo tema D&D e escala P/M/G/GG.
  Atributos clássicos se reorganizam em grade nas telas pequenas. Botões de magia
  acomodam o texto maior, sem limitar a leitura à altura fixa anterior.
- Seletores guardam seu valor confirmado, preservando foco/nós e evitando avisos
  incorretos de rascunho ao fechar o cadeado sem ter alterado a ficha.
- Conferidos 385 testes Node, tipos/build e 10 scripts Chromium pertinentes:
  tipografia, cadeado, edição, armas, ataques mágicos, PV, regras, revisão de
  importação, aplicação e ficha. Inspeção das três abas/temas em M, M/GG em 320px
  nos dois layouts, foco/rascunhos e preservação de dados. Sem SQL/migração.


### Cadeado de edição e ajuda de preparo — 2026-10-20

- Cadeado ao lado do seletor começa fechado, com valores de consulta no lugar dos
  campos de ajuste. Abrir libera classes, atributos, máximos, proficiências e
  editores dos cartões; a ponte e a confirmação conferem a proteção novamente.
- Rolagens, combate, condições, preparo, uso/recuperação de recursos, equipamento,
  loja e histórico permanecem disponíveis. Notas pessoais independem do cadeado.
- Troca de ficha/conta e recarga protegem novamente; ficha em branco abre em edição.
  Estado transitório, separado da autorização do mestre e dos documentos/backups.
- Rascunhos e painéis são preservados ao fechar/reabrir, com confirmação bloqueada
  enquanto protegidos. Captura usa o dono do controle no DOM para não transferir
  rascunhos entre personagens durante a troca de ficha.
- Máximos numéricos compactos em recursos como Marés de Caos e indicadores de
  Pacto. Dicas ao passar o mouse explicam preparo, sempre preparada e a adaptação
  para exceder o limite, sem confundir com espaços de magia.
- Conferidos 385 testes Node, tipos/build e os 19 scripts Chromium, incluindo
  32 cenários auditados. Cadeado/ponte/rascunhos/quota, permissões, troca de ficha
  e conta, recarga/offline, combate/recursos/preparo, cópias/notas, SDK com HTTP
  simulado e 320px/GG/três temas/dois layouts. Sem SQL/migração.


### Revisão por setores e remoção de classe — 2026-10-20

- Revisão de importação separada em Identidade/classes, Atributos/combate,
  Proficiências, Grimório e Inventário/história. Cartões e linhas de perícias
  alinhados; navegação compacta no celular, rascunhos e nós mantidos por setor.
- Magias usam os mesmos campos da ficha, com catálogo/personalizada, adicionar,
  remover, origem/habilidade, preparo e usos. Sem formulários aninhados; erro de
  validação revela o setor e os detalhes antes de focar um campo oculto.
- Avisos explicados por setor: CA escrita, totais fixos, itens em texto e vínculos
  manuais. A lista textual registrada no histórico vem dessas mesmas explicações.
- Comparar máximos com o livro mostra os valores atuais e propostos. Aplicar não
  recupera espaços usados/pontos atuais e recusa toda a proposta se não couberem.
- Remoção de classe na ficha e na revisão compartilha confirmação inline. Magias
  vinculadas podem ser removidas junto ou mantidas como adaptação com origem e
  habilidade anteriores registradas. Exige classe restante; preserva atributos,
  PV, reservas, textos e histórico. Escolhas e efeitos da classe removida deixam
  de conceder bônus; escolhas raciais/antecedente continuam independentes.
- Conferidos 382 testes Node, tipos/build e Chromium de importação, setores,
  edição na ficha, criação, aplicação e 32 cenários auditados. Incluem cópias/notas,
  cancelamento/quota/conta/offline, origens, remoção/desfazer, foco/rascunhos,
  validação em setor oculto e todos os setores em 320px/GG/três temas.


### Correções e criação diretamente na ficha — 2026-10-20

- Retirados o formulário geral separado e os botões de criação/edição manual do
  perfil. Níveis, classes/subclasses, atributos, PV, CA, deslocamento, perícias,
  moedas e biografia são ajustados onde aparecem, com histórico da própria ficha.
- Armas, itens, características e magias expandem seus ajustes no próprio bloco,
  sem janela sobreposta. + Novo permite abrir uma ficha em branco para preencher
  ali mesmo; a criação guiada e seus rascunhos continuam disponíveis.
- Propostas validadas preservam ID/notas/retratos/escolhas. Campos mantêm seus
  nós, foco, cursor e textos digitados durante renders. Blur da atualização
  visual não salva rascunhos por acidente. Quota conserva o texto no campo.
- Ajustes explícitos de máximos de reservas e movimento sobrevivem ao refresh;
  descansos mantêm os máximos escolhidos. Máximos de recursos de classe aceitam
  edição (vazio retoma o livro). Alterar nível diretamente não recria escolhas.
- Contrato único para contexto de edição pessoal/mestre/jogador, conferido
  também ao salvar editores abertos e nas ações da ponte. A permissão não vem
  dos dados da ficha. Salas/autorização de gravação compartilhada no servidor
  permanecem para a próxima etapa, sem SQL/migração nesta revisão.
- Catálogo inteiro e magias próprias mantêm origem/habilidade/usos/fórmula e
  ajustes de ataque/CD. Preservadas as melhorias de PDF: níveis sem espaços,
  CA aritmética restrita, dados abreviados, deslocamento fracionário e confirmação
  de origem também possível pela raça; nenhum bônus ausente é inventado.
- Conferidos 378 testes Node, tipos/build e Chromium de edição, criação,
  importação, aplicação, continuidade local/conta, regras, armas e ataques de
  magias; 32 cenários auditados, quota/conta/foco/rascunhos/descanso/recarga,
  preservação de dados e 320px/GG/três temas/dois layouts.

### Importação de PDF e revisão de vínculos — 2026-10-20

- Perfil aceita PDF preenchível e backups JSON com revisão antes de importar.
  Leitor local recupera campos por página em formulários 2014/2024, com limites
  de tamanho/páginas/campos/tempo; fotos e PDFs achatados não têm OCR.
- A revisão reúne identidade, classes, raça/subclasse, atributos/PV, reservas,
  origem/preparo das magias e cálculo das armas. Propõe aliases inequívocos e
  exige confirmar ambiguidades; escolhas manuais ficam identificadas na cópia.
- Campos adicionais do PDF podem ser preservados nas notas pessoais. Texto é
  tratado como dado; retratos/PDF original não são embutidos. CA/ataques/perícias
  escritos são preservados, e o catálogo de armas só é ativado por escolha.
- Revisar a ficha atual também cria cópia. Cancelamento, troca de conta,
  recuperação e falha de quota preservam a coleção anterior. Sem SQL/migração.
- Conferidos 368 testes Node, tipos/build e Chromium de importação/aplicação/
  autenticação/sincronização; SDK real com HTTP simulado, raiz e `/D-D/`, PDF
  offline, quota/conta/cancelamento, texto não executável e 320px/GG/três temas.
  Leitura de dois PDFs reais conferida em contextos isolados, sem importar.

### Conferência de importações legadas — 2026-10-20

- Registrada auditoria pontual de compatibilidade e próxima prioridade em
  `docs/AUDITORIA-LIVRO-2014.md` e `docs/RETOMADA.md`: vínculos de raça/subclasse,
  origem/preparação das magias e distinção entre arma manual e automática.
  Conferidos motor e Chromium isolado com dois backups locais; dados pessoais
  preservados fora do Git. Somente documentação, sem migração ou correção
  automática de escolhas ambíguas.

### Só Pool e ataque por magia — 2026-10-20

- Só Pool bloqueia conjurações/rituais antes de gastar recursos, trocar
  concentração, aplicar passivos ou criar histórico. A guarda também cobre
  chamadas diretas e confirmação aberta antes da troca de modo.
- Magias com ataque contra CA recebem Atq +bônus por cartão, usando a habilidade
  da origem e o motor de vantagem/desvantagem/inspiração. Substitui o indicador
  estático; resistência/acerto automático/utilidade não recebem d20.
- Rolar ataque não conjura nem cobra outro espaço ao repetir raios/feixes.
  O gasto continua no lançamento explícito. OFF conserva conjuração física;
  controles de rolagem ficam desativados fora de Auto Ficha.
- Conferidos 360 testes Node, tipos/build e Chromium de ataques mágicos,
  concentração, dados e 32 cenários auditados. Casos cobrem Só Pool sem efeitos,
  confirmação pendente, bônus por classe/habilidade, filtro, vantagem/inspiração,
  raios, OFF físico e continuidade offline/layouts/temas/320px/GG.

### Crítico automático e posição dos controles — 2026-10-20

- Crítico/registro ficam na linha inferior da arma. O botão reserva espaço
  para os dois rótulos, sem deslocar descrição ou controles ao marcar.
- No Auto Ficha, cada ataque atualiza só sua arma pela face natural escolhida
  após vantagem/desvantagem, incluindo o intervalo do Campeão. Ataque comum
  desmarca; confirmar dano também limpa. Outros roladores e OFF/Só Pool não
  mudam a preparação.
- Registrar dano fica exclusivamente manual, sem seletor para rolar. Adicionais
  conserva a opção virtual no Auto Ficha; OFF/Só Pool recebem só o total físico.
- Conferidos 360 testes Node, tipos/build e Chromium de ataques, dados,
  concentração e regras. Ataques verificam face natural versus total, seleção
  com vantagem/desvantagem, consumo de inspiração, intervalo do Campeão,
  isolamento por arma/ficha e posições estáveis em dois layouts/três temas/320px.

### Uso de crítico e ajuda nas janelas — 2026-10-20

- Crítico passa para a própria arma: marcar só prepara e atualiza a fórmula.
  O botão de dano rola em Auto Ficha; OFF/Só Pool abrem o registro físico.
  Confirmar limpa a marca, cancelar mantém, sem salvar esse estado no documento.
  Adicionais/registro usam o diálogo existente sem segunda checkbox.
- Campo físico explica que recebe o total já rolado, incluindo bônus/crítico,
  sem nova rolagem ou multiplicação. A ação distingue registrar de rolar.
- Balão compartilhado usa a camada superior nativa para aparecer acima de
  diálogos, mantendo posição, foco, cliques e Esc. Sem SQL ou migração.
- Conferidos 360 testes Node, tipos/build e Chromium de ataques/regras/criação/
  PV/biblioteca. Regressões cobrem marcar sem rolar/gastar, clique/limpeza,
  cancelamento, total físico sem rerrolar e ajuda acima do diálogo com Esc/foco.

### Crítico e adicionais de armas — 2026-10-20

- A própria arma oferece composição de um acerto com prévia: crítico dobra
  dados e mantém bônus fixos, incluindo Furtivo, Colossos e Destruição.
  Crítico Brutal/Ataques Selvagens acrescentam seus dados uma vez; o d8 de
  Destruição Aprimorada já presente não é repetido.
- Destruição permite espaço de Conjuração/Pacto, teto e alvo pertinentes,
  descontando um só espaço após confirmar. Não é conjuração nem ação bônus.
  Furtivo/Colossos exigem confirmação das condições/uso neste turno pela mesa.
- Resultado físico funciona com dados OFF; virtual preserva pool/inspiração.
  Cancelar ou alterar ficha/arma durante a confirmação não gasta. Histórico e
  desfazer incluem resultado/espaço juntos; notas e outras fichas preservadas.
- Analisador de dados compartilhado com os contratos anteriores. Botão comum
  continua direto; fórmulas manuais não recebem adicionais inferidos. Limites
  e fontes na auditoria; sem SQL/RLS/RPC, migração ou dados reais alterados.
- Verificação: `npm run check`, 360 testes Node, tipos/build e 14 roteiros
  Chromium aprovados, com 32 cenários auditados. Após preservar também `0-3`
  como fórmula personalizada, Node/build/roteiro de ataques passaram novamente.
  Conferidos composição/gasto único, cancelamento/concorrência, desfazer, dados,
  notas/fichas/offline, dois layouts/três temas/320 px/GG e capturas.

### Defesas condicionais e prevenção de queda — 2026-10-20

- Maestria em Armadura Pesada reduz dano físico elegível; Esquiva Sobrenatural
  oferece reação por ataque e ordem explícita com reduções. DES para metade
  aplica Evasão conforme classe/nível/escolha e respeita falhas automáticas.
- Resistência Implacável do meio-orc e Fúria Implacável do bárbaro 11 evitam
  a queda antes de inconsciência/Frenesi. Teste físico/virtual, CD crescente
  por tentativa, usos/recuperação e alternativa racial; concentração continua
  usando o dano recebido. Atalhos de PV abrem a decisão quando pertinente.
- Campos existentes, sem painel paralelo. Cancelar ou alterar a ficha durante
  a confirmação preserva PV/usos; desfazer restaura ambos. Notas, outras fichas,
  modo já resolvido e regras manuais da forma são preservados. Sem SQL/RLS/RPC.
- Fontes, convenções de ordem/tipos mistos e limites documentados na auditoria;
  outras reações, Proteção contra a Morte e efeitos não enumerados ficam na mesa.
- Verificado com `npm run check`: 351 testes Node, tipos/build e 13 roteiros
  Chromium, incluindo 32 cenários auditados. Novas regressões cobrem ordem,
  elegibilidade, queda/usos/recuperação, cancelamento/concorrência, desfazer e
  dados físico/virtual. Dois layouts/três temas/320 px/GG e capturas conferidos.

### Alinhamento das ações de armas — 2026-10-20

- Ataque e dano ficam juntos à direita de cada arma nos dois layouts. Descrições
  longas quebram no espaço disponível; em cartões estreitos, os botões passam
  juntos para a linha de baixo e continuam alinhados à direita.
- Conferidos 342 testes Node, build, roteiro de regras no Chromium e alinhamento
  em 12 combinações dos dois layouts/três temas, desktop e 320 px com fonte GG.

### Dano por tipo e defesas reconhecidas — 2026-10-20

- O controle de dano detalhado permite escolher a origem e até 13 tipos distintos
  da mesma ocorrência. Prévia explica proteção, redução, resistência/imunidade,
  vulnerabilidade e total; crítico é informado com seus dados já rolados.
  Resistências repetidas não acumulam e vulnerabilidade dobra depois de arredondar.
- Integra fontes verificadas de Fúria/Urso, Proteção contra Lâminas, petrificação,
  resistências raciais estruturadas e algumas características/estados de classe.
  Origem de magia não equivale a toda fonte mágica; arma mágica/prata só ignora
  a Resistência Demoníaca pertinente. Matriz e limites na auditoria do livro.
- Proteção Arcana absorve antes das defesas próprias de 2014. Em dano misto, a
  ordem escolhida pela mesa determina sua alocação, com setas e prévia. Depois,
  o total usa temporários/PV e gera uma única ocorrência de concentração/morte.
  Imunidade ou redução a zero não gera teste/falhas pelo dano inexistente.
- Ajustes da mesa valem só para aquela ocorrência. Digitar/selecionar atualiza a
  prévia sem reconstruir a ficha ou gastar reservas. Controles de ordem/prata
  aparecem quando pertinentes. Resultado permanece no histórico por ficha;
  notas, outras fichas, documentos anteriores e uso offline são preservados.
- Modo já resolvido e atalhos mantêm o contrato anterior. Forma Selvagem/excesso,
  outras defesas de itens/magias, Maestria em Armadura Pesada, testes de
  resistência, reações e características para evitar 0 PV seguem na mesa.
  Sem alteração de banco, autenticação, catálogos gerados ou dados reais.
- Verificação final: `npm run check`, 342 testes Node, tipos/build e os 13
  roteiros Chromium aprovados, incluindo 32 cenários auditados. Regressões de
  fontes/limites, resistência/vulnerabilidade/imunidade, mistura/ordem/proteção,
  temporários, concentração/morte uma vez, ajustes, nós/foco, modo resolvido/
  forma, notas/histórico/fichas, recarga/offline e três temas/320 px/GG.
  Capturas desktop/celular conferidas; `git diff --check` sem problemas.
- Roteiros de PV e concentração compartilham a espera pelo evento nativo de
  fechamento e pela aplicação da confirmação. Evita conferir a ficha apenas
  porque o diálogo já ficou oculto, sem depender de um atraso fixo. Ambos
  passaram novamente no mesmo build após esse ajuste dos testes.

### Concentração e condições de 2014 — 2026-10-20

- Estado único de concentração por ficha, nos PV ou no grimório conforme a aba.
  Troca de magia/ritual prolongado confirma antes de consumir espaços/usos;
  cancelamento e escolhas alteradas preservam o efeito e os recursos anteriores.
- Cada fonte de dano enfileira sua resistência de CON, CD 10 ou metade do dano,
  o maior. Proteção Arcana não conta como dano ao personagem; temporários e
  besta contam. Dado físico/virtual/OFF, bônus da forma, proficiência, Conjurador
  de Guerra, exaustão e inspiração usam o fluxo existente, sem alterar o pool.
  1/20 natural não decide esse teste automaticamente. Conjuração Focada protege
  conjurações de quebra por dano, inclusive magias de outra classe.
- 14 condições com ajuda e marcação compacta; incapacitação é derivada sem
  segunda marca. Deslocamento 0 e falhas automáticas de FOR/DES entram nos
  casos correspondentes. Outros modos de rolagem, sentidos, alvos, durações e
  resistências a dano permanecem explícitos para a mesa.
- Incapacitação/morte encerram concentração. Inconsciência também encerra Fúria
  (processando Frenesi uma vez), reverte Forma Selvagem e registra queda;
  paralisia isolada não encerra Fúria. Dormir no descanso longo encerra
  concentração, com opção para exceções conscientes e duração manual.
- Testes e condições pertencem à ficha/histórico e persistem offline; notas
  continuam separadas. Lista conserva nós/foco e diálogos recusam callbacks de
  outra ficha ou efeito. Dados ilegíveis são preservados. Sem SQL/RLS/RPC.
- Verificação final: `npm run check`, 320 testes Node, tipos/build e os 12
  roteiros Chromium aprovados, incluindo os 32 cenários auditados. Cobertura
  nova: troca/cancelamento/recursos, ritual, fila/CD, proteção/temporários/forma,
  físico/virtual/OFF, talentos/inspiração, condições/Fúria/sono, ficha antiga
  a 0 PV, callbacks obsoletos, nós/foco, notas/histórico, isolamento e offline.
  Três temas/320 px/GG e capturas desktop/celular conferidos; diff sem whitespace.
- O roteiro de concentração aguarda o evento nativo de fechamento e sua
  continuação antes de conferir a ficha; o estado oculto do diálogo ocorre
  antes dessa conclusão e causava uma leitura prematura em uma execução da CI.
  Roteiro aprovado novamente no build final após o ajuste da espera.

### Dados de Vida, morte/estabilidade e inspiração — 2026-10-19

- Dados de Vida têm saldo e gasto por classe, um dado por vez, com resultado
  físico ou virtual, Constituição, limite de PV e mínimo de Resistente.
  Canção do Descanso ouvida acrescenta seu dado uma vez por descanso, se houver
  cura pelo Dado de Vida. A forma usa CON informada/PV da besta. Estável a 0 PV
  pode gastar após o descanso curto; morto não é revivido.
- Nos PV existentes, testes contra a morte controlam sucessos/falhas, 1/20
  natural, bônus recebidos/Alma de Diamante, estabilidade e dano maciço. Dano
  detalhado permite informar crítico; temporários a 0 não evitam as falhas pelo
  dano recebido. Cura positiva zera contagens; ressurreição exige registro
  explícito após resolução na mesa. Conjuração/ativação de recursos respeitam
  morte e inconsciência a 0 PV, sem gastar o recurso recusado.
- Inspiração usa a reserva por personagem de 2014: receber, preparar/cancelar
  vantagem no próximo teste/ataque ou gastar na mesa após confirmação. Cancela
  desvantagem e não gasta em dano/arremesso rápido. Não acumula nem rerrola.
- Estados pertencem à ficha e seu histórico; notas permanecem separadas.
  Cancelar/entrada inválida não altera a ficha. Dado virtual usa a animação
  existente e preserva o pool; OFF exige resultado físico. Diálogos e foco
  reutilizam os módulos existentes. Sem alteração de SQL/RLS/RPC.
- Concentração, condições gerais, tempo de jogo, ressurreição/Medicina e
  características que evitam cair a 0 PV continuam a cargo da mesa.
- Verificação local: 299 testes Node e tipos/build aprovados; os dez roteiros
  Chromium existentes passaram e o novo roteiro de PV passou no build final
  após o ajuste de foco. Inclui físico/virtual/OFF, gasto/recuperação por classe,
  forma/CON da besta, 1/20, estabilidade, crítico, dano maciço, retorno à vida,
  inspiração, desfazer/refazer/notas, fichas isoladas, recarga/offline e três
  temas/320 px/GG. Capturas de desktop/celular conferidas; `git diff --check` limpo.

### Cálculos e interações identificados na auditoria — 2026-10-19

- Fórmula mostrada e rolagem usam a mesma resolução: escalonamento de truques,
  cura com modificador/aprimoramento, Discípulo da Vida e Explosão Agonizante.
  Fórmulas personalizadas são preservadas. Raio/feixe pode ter o dano de outro
  acerto rolado sem novo gasto; Gêmea considera os casos de múltiplos alvos e
  mantém a adaptação existente de Mísseis Mágicos.
- Repreensão Infernal racial usa círculo 2 também nas fichas anteriores.
  Dominar Magia e Assinatura têm opções gratuitas próprias, sem trocar para
  espaços pagos ao esgotar. Assinatura não ocupa preparação e recupera no
  descanso curto/longo. Aprimoramento exige seleção explícita de espaço.
- Corrigida a ordem proteção/temporários/besta/PV e o registro da absorção real.
  Constituição permanente ajusta os PV manuais pelo nível e conserva o déficit,
  sem reviver a 0 PV. Descanso longo exige 1 PV no início; curto preserva a forma.
  Abjuração de outra classe pode criar/recuperar Proteção Arcana.
- Iniciativa inclui Alerta e meia proficiência elegível, sem duplicação.
  Armadura/escudo usados sem proficiência impedem conjurar; itens na mochila
  não impedem. Moedas entram na carga. Atirador de Magia oferece Criar Chamas.
- Extração regenerada dos 361 metadados de magia preserva os componentes
  multilinha e os custos; V/S/M não confunde letras dos materiais. Chicote de
  Espinhos é identificado como ataque mágico. Nenhum dado real de jogador ou
  contrato de SQL/RLS/RPC foi alterado.
- Verificação: 279 testes Node, tipos/build e dez roteiros Chromium aprovados,
  incluindo 32 cenários auditados sem divergências. Nova passagem de Node,
  build e cenários após os ajustes finais de compatibilidade/validação.
  Concentração, morte, gasto de Dados de Vida, inspiração, condições gerais e
  outros passivos continuam pendentes em `docs/AUDITORIA-LIVRO-2014.md`.

### Auditoria aprofundada do livro e da ficha — 2026-10-19

- Ampliado `docs/AUDITORIA-LIVRO-2014.md` com itens 15–27, cenários e a matriz
  individual dos 42 talentos. Conferidas 368 ocorrências de características das
  tabelas de 12 classes/41 subclasses, além do inventário dos capítulos/apêndices.
- Reprodução de divergências entre fórmula mostrada/rolada, cura/modificador e
  aprimoramento, Explosão Agonizante, nível racial do tiefling, Dominar/Assinatura,
  Constituição manual, absorção da forma, descansos, abjuração multiclasse,
  metadados de magias, opção de talento, carga e mensagem de dano no histórico.
- Roteiro diagnóstico `scripts/audit-phb-scenarios.cjs`: somente fixtures,
  Chromium e armazenamento descartáveis, servidor local e rede externa bloqueada.
  Na base `7667ae9`, 21 cenários direcionados resultaram em 20 divergências e um
  controle conforme. Casos podem compartilhar causas; não são um percentual de
  cobertura nem integram a suíte de aprovação. As correções continuam pendentes.
- Corrigida a descrição do contrato de absorção no plano anterior, identificando
  que a implementação ainda requer ajuste. Nenhum comportamento da ficha, banco
  ou dado de jogador foi alterado nesta auditoria.
- Verificação: execução concluída do diagnóstico no build sob `/D-D/`, 266 testes
  Node aprovados e `git diff --check`. A suíte existente não cobria os novos casos.

### Ajuda discreta nos ajustes de defesa — 2026-10-19

- Ajuda aparece ao passar o mouse sobre o nome de cada campo/efeito, usando o
  balão existente. Rótulos também aceitam foco de teclado. Botões “?” removidos;
  mantém o espaçamento entre as caixas e seus textos.
- Corrigida a troca direta entre balões: o fechamento anterior não cancela a
  abertura do próximo. Verificação: 266 testes Node, build e Chromium de regras
  e criação aprovados, incluindo as sete ajudas por mouse, foco de teclado,
  caixas preservadas e três temas/320 px/GG.

### Histórico por ficha, zoom e revisão do livro — 2026-10-19

- Cada personagem tem seu histórico/checkpoints e ponteiro de desfazer/refazer.
  Restaurar um passo altera somente a ficha ativa, preservando outras fichas,
  notas e preferências visuais. Fichas excluídas podem ser recuperadas pelo
  histórico preservado, sem reverter a coleção inteira.
- Migração copia mudanças reais do histórico coletivo por ID, sem apagar o
  original; históricos ilegíveis são preservados e não bloqueiam fichas válidas.
  A sincronização usa documentos separados por ficha, sem alteração de SQL/RLS/RPC.
- O zoom do livro mantém os atalhos fixos e só a porcentagem livre atual.
- Ajustes de defesa separam rótulos/campos e dão espaço às caixas dos efeitos.
  Sete ajudas explicam fórmula, bônus e magias por mouse/teclado ou clique/toque,
  incluindo os limites de aplicação automática. A dica dos Dados de Vida deixa
  de anunciar recuperação integral obrigatória.
- Auditoria de todos os capítulos/apêndices em `docs/AUDITORIA-LIVRO-2014.md`,
  com matriz das 12 classes/41 subclasses e inventário de raças/talentos/magias.
  Identifica iniciativa/passivos e 139 resumos de componentes cortados, além de
  concentração, morte, Dados de Vida, inspiração e condições ainda incompletos.
  As pendências estão registradas; não foram todas implementadas nesta entrega.
- Verificação: `npm run check` aprovado com 266 testes Node, tipos/build e os
  nove roteiros Chromium sob `/D-D/` (login também sob `/`). Inclui históricos
  independentes/migração, exclusão/restauração/notas, alterações concorrentes em
  documentos de fichas diferentes, zoom sem acúmulo, sete ajudas sem marcar
  efeitos e espaçamento nos três temas/320 px/GG. Capturas de defesa escura
  conferidas em desktop/celular. Testes de sync usam HTTP simulado; o projeto real
  teve apenas leitura de metadados da RPC, sem escrita em dados de jogadores.

### Contraste das listas nos temas escuros — 2026-10-19

- Seletores nativos e suas opções acompanham o tema, incluindo a lista de
  uma/duas mãos das armas. Evita texto claro sobre o menu branco do sistema.
- Verificação: 262 testes Node, build e Chromium de regras aprovados; cores do
  seletor/opções e troca de mãos conferidas nos três temas.

### Incremento de habilidades na evolução — 2026-10-19

- Os dois seletores de atributos foram substituídos pela grade visual da criação,
  com +/−, valor atual/final e pontos disponíveis. Permite +2 em um atributo ou
  +1 em dois, bloqueando o terceiro ponto e valores acima de 20.
- Dicas por ponto e consulta duplicada da opção foram retiradas; a consulta da
  regra permanece recolhível. Escolha de talento continua disponível quando
  habilitada. Redistribuir e voltar de etapa preserva as escolhas.
- Verificação: 262 testes Node, tipos/build e Chromium de regras/evolução e
  criação, com aplicação real do nível, três temas/320 px/GG e preservação dos nós.

### Controles nos campos existentes, sem painel redundante — 2026-10-19

- Removido o bloco separado de recursos abaixo das armas. Usos e estados são
  incorporados às características já listadas, aproveitando título e consulta.
- Feitiçaria/Metamágica, Pacto, Arcanum e preparação usam seus controles no
  grimório; Bênção do Obscuro fica nos PV temporários. Contadores de reserva
  deixam de se repetir em cada atalho de gasto.
- Exaustão, Proteção Arcana e PV da besta ficam junto aos PV; defesa junto à CA;
  recuperação de Dados de Vida na lista correspondente. Campos preservam valores,
  foco e consultas abertas ao usar os controles.
- Verificação: 261 testes Node, tipos/build e Chromium de regras, ficha e
  armazenamento/offline, com unicidade, persistência, layouts/temas/320 px/GG.

### Regras, recursos por classe e continuidade de dados — 2026-10-19

- Armas importadas são reconciliadas com o catálogo: habilidade, proficiência
  de classe/raça/talento ou manual, magia, empunhadura versátil, Arquearia,
  Fúria e Arma Sagrada. O editor separa cálculo automático de totais adaptados;
  dados adicionais e intervalos de crítico mostram suas condições.
- CA usa alternativas de base e bônus aditivos separados, incluindo a primeira
  Defesa sem Armadura em multiclasse, armaduras, escudo mágico, Resiliência,
  Armadura Arcana, Defesa, Escudo da Fé e Escudo Arcano. O balão explica a soma.
- Novo painel por classe/subclasse com usos, reservas, custos compartilhados,
  alvos, presságios e estados persistidos na ficha. Frenesi gera exaustão ao
  encerrar Fúria; Proteção Arcana e PV da besta absorvem dano antes de reservas
  temporárias/reais. Descansos, Dados de Vida e lembrete de preparação seguem
  suas condições. Efeitos por alvo e duração têm resolução explícita do jogador.
- Preparação por classe e magias sempre preparadas não são confundidas com
  conhecer ou lançar como ritual. Magia ritual não preparada de mago não pode
  ser lançada normalmente; preparada pode gastar espaço. Pacto permanece separado.
- Balões têm corpos justificados e tipografia/padding compactos. Personalidade
  usa seletores de sugestões + texto sempre editável, preservado ao trocar de
  antecedente. Ctrl/Cmd + rodinha/+/-/0 ajusta só a página do leitor.
- Atributos ganham modo livre identificado como adaptação. Compras validam
  quantidades, catálogo, orçamento em cobre e milhares em português: luneta
  de 1.000 po não custa mais 1 po. Valores monetários aceitam centavos exatos.
- Textos estruturados antigos tornam-se legíveis com cópia do material original;
  strings irrecuperáveis são identificadas. Exportações/chaves novas usam CritCall.
  Leitura silenciosa preserva formatos históricos, originais e operações já
  enfileiradas, sem troca de identidade, SQL ou autorização.
- Plano, contratos e verificação em `docs/REFATORACAO-2014.md`.
- Verificação: 260 testes Node, tipos/build e nove roteiros Chromium aprovados;
  regras repetidas após os últimos ajustes. Inclui login, sincronização com HTTP
  simulado, isolamento, offline e continuidade local. Sem alteração de SQL/RLS.

### PV iniciais, riqueza/mercado do Capítulo 5, balão sem bloquear clique, correções visuais e cabeçalho compacto — 2026-10-17

- **Balão de consulta (`#ruleTooltip`) na criação**: mantém a rolagem pela rodinha
  do mouse (`wheel`) com `pointer-events: none` para não interceptar cliques nas
  opções abaixo. Ao abrir uma lista (`.cw-picker-list`), o balão posiciona-se na
  lateral externa da lista aberta, e clicar em qualquer opção fecha o balão
  imediatamente sem reabri-lo sobre o item selecionado.
- **Glifos de lista do PDF (`U+F0B7`) e recorte de bordas arredondadas**:
  `RuleTooltips.formatText` converte marcadores Private Use Area (`\uf0b7`, ex.:
  tópicos de *Fúria* do Bárbaro) em `• `, eliminando os retângulos de glifo
  ausente (`▯`). Modais e listas roláveis (`.t-card-accent.overflow-y-auto`,
  `.cw-dialog`, `.cw-options`, `.cw-picker-list`) usam `clip-path: inset(0 round ...)`
  e `outline-offset: -2px` no tema `pergaminho_claro`, impedindo que botões ou
  barras de rolagem transpassem a linha interna da moldura.
- **Pontos de Vida no 1º nível (`startingHpPreview`)**: a etapa de Classe da
  criação permite escolher entre o padrão do Livro do Jogador (máximo do Dado de
  Vida + mod. CON), sortear no dado (`1dX` + mod. CON), usar a média fixa do dado
  ou definir um valor personalizado adaptado da mesa, somando automaticamente
  bônus raciais (*Tenacidade Anã*), *Resiliência Dracônica* e talento *Robusto*.
- **Equipamento Inicial por Pacotes ou Riqueza + Compras (Cap. 5, p. 145)**: a
  etapa de Equipamento permite alternar entre os pacotes pré-definidos da classe
  e antecedente ou a **Riqueza Inicial por Classe** (`Xd4 × 10 po`, ou `5d4 po`
  para Monge) com sorteio dos dados, carteira em tempo real e compra de itens no
  catálogo do Capítulo 5 (armaduras, escudos, armas simples e marciais, pacotes,
  equipamento de aventura, munições, ferramentas, instrumentos e focos), além de
  seção de adaptação livre para itens extras e ajuste de ouro inicial.
- **Cabeçalho e barra de topo compactos**: reduzidos espaçamentos, altura do
  retrato e tamanhos tipográficos de `<header>` (`.app-topbar`) e `#headerSection`,
  e integrado o seletor de apresentação `#sheetDisplay` na mesma linha das abas
  principais da ficha para liberar área vertical em celulares e telas menores.
- **Características do Personagem já na 1ª etapa (`1. Identidade`)**: os cartões
  de resumo da Classe/Raça/Antecedente (`.cw-origin-highlights`) e a seção
  completa de **Características do Personagem, Personalidade e História**
  (Personalidade, Ideais, Ligações, Defeitos com **Sugestões do antecedente** do
  Livro do Jogador, História e Descrição física/aliados/tesouros) aparecem logo na
  primeira etapa da criação para prender o jogador no conceito do personagem antes
  das escolhas mecânicas, permanecendo também editáveis na etapa final (`7. Revisão`).
- **Retomada automática do rascunho ao fechar/reabrir a aba e botão `Descartar rascunho`**:
  `draft-store.ts` normaliza rascunhos salvos sem bloquear gravações futuras e
  registra o estado aberto (`open`) inclusive em `pagehide`. Fechar ou recarregar
  a aba durante a criação reabre automaticamente o criador na etapa exata onde o
  jogador parou; quando fechado pelo botão `×`, a ficha exibe o cartão/faixa
  **Personagem em andamento** com os botões **Continuar de onde parou** e
  **Descartar rascunho** (também disponível no rodapé do criador com confirmação).
- **Janela do criador ampliada**: `.cw-dialog` passa a usar `width: min(72rem, 100%)`
  e `max-height: 96dvh` com `.cw-body` expansível, aproveitando melhor telas
  maiores sem perder responsividade em `320px`.
- Passaram 193 testes unitários Node (`npm test`), `npm run build` e os roteiros
  de navegador (`creation-browser.cjs`, `sheet-browser.cjs`, `app-browser.cjs` e
  `guest-import-browser.cjs`).

### Aba inicial, balões na criação, ícones temáticos de magias e revisão do Kael — 2026-10-17

- A ficha passa a iniciar na aba **1. Atributos & Combate** (`main`) e mantém o
  painel de **Truques (Círculo 0)** visível ao abrir o grimório.
- No criador de personagem, o balão de consulta (`#ruleTooltip`) aceita rolagem
  pela rodinha do mouse e uso direto da barra de rolagem sem fechar ao mover o
  cursor até ela. Campos e opções que já exibem a descrição logo abaixo
  (`.cw-source`) deixam de repetir o mesmo texto no balão do mouse.
- O motor de regras (`spellMeta` e `toSheetSpell`) e a ficha classificam
  automaticamente o tipo de dano/efeito, ícone temático (`flame`, `skull`,
  `snowflake`, `zap`, `sparkles`, `cloud-lightning`, `swords`, `droplets`,
  `brain`, `sun`, `heart-pulse`, `shield`, `wand-2`), formato de alvo/área e
  defesa/resistência das magias do catálogo, tanto na ficha quanto na etapa de
  magias da criação.
- O arquivo externo de backup do Kael (`critcall-kael-darkwood.json`) foi
  atualizado com todas as 18 magias da ficha e da base HTML (incluindo 3º
  círculo com *Bola de Fogo* e *Relâmpago* e os 2 rituais de *Conjurador de
  Ritual*), *Magia Duplicada*, bônus de perícias e textos integrais do PDF.

### Histórico visual e revisão da importação do Kael — 2026-10-17

- Alternar entre as apresentações **Clássica** e **Moderna** salva a preferência
  sem criar passos no histórico da ficha. Históricos antigos descartam entradas
  repetitivas de layout, e desfazer outras alterações preserva a apresentação
  escolhida.
- O plano deixa explícito que a ficha do Kael foi transcrita para um backup
  externo validado, mas a importação direta de PDF e a transferência real para
  uma conta ainda dependem de revisão e confirmação do responsável.

### Vinculação seletiva de ficha local — 2026-10-17

- A entrada de conta permite escolher quais fichas sem login serão copiadas;
  quando há uma ficha chamada Kael, ela fica pré-selecionada, sem levar outras
  fichas locais por engano. A origem continua preservada e a impressão da
  seleção mantém recargas idempotentes.
- O roteiro Chromium cobre Kael, ficha local não selecionada, conta existente,
  confirmação, cancelamento, quota, imagens, notas e recarga sem duplicação.

### Atualização preserva a versão correta do HTML — 2026-10-16

- A entrega inicial chegou a `criticall.art` pelas PRs #3/#4 e a CI da `main`
  passou. A conferência pública identificou HTML anterior no cache novo de uma
  instalação existente: o navegador reutilizava o cache HTTP válido por 600 s.
- Instalação offline agora busca os arquivos com `cache: reload`, e a revisão
  da política mudou para evitar reutilizar o cache incorreto já instalado.
  Atualizações continuam aguardando o fechamento das abas, sem recarga forçada
  ou limpeza do armazenamento de fichas/notas/imagens.
- Regressão Chromium com cache HTTP de 600 s reproduziu a falha antes do ajuste
  e passou depois. O teste exige HTML novo no cache e preservação de ficha, nota
  e aparência ao abrir a entrega nova sem rede, sem recarregar uma edição aberta.
  Passaram 175 testes Node, tipos/build e o roteiro de aplicativo em Chromium.

### Entrega autorizada — 2026-10-16

- Responsável solicitou publicar a versão com entrada, sincronização pessoal,
  dado compacto e retratos. Entrega pelo GitHub Pages existente em `criticall.art`,
  mantendo PRs para `develop` e `main` e o artefato verificado pela CI.
- Cloudflare já atende o DNS; a transferência da hospedagem e a mudança do
  repositório para privado dependem da configuração de Pages/credenciais.

### Dado arrastável e imagens de perfil/personagem — 2026-10-16

- Dado começa recolhido, mostrando 20 antes de rolar e depois o último total da
  conta/aba. Ícone com textura e facetas, arraste com limites, posição restaurada,
  arremesso rápido para d20 normal, clique/Enter para abrir e R/setas no teclado.
  O arremesso preserva o pool, modificador e vantagem/desvantagem da bandeja.
- Retratos no perfil e em cada ficha/lista de personagens. Imagens de até 5 MB são
  recortadas e reduzidas para WebP de até 256 px/32 KiB antes do envio. Originais,
  metadados, SVG e GIF não são enviados. Pixels ficam em Storage privado e cache
  IndexedDB por conta; documentos/histórico recebem só referências compactas.
- Migração de bucket/RLS aplicada ao CritCall exclusivo, remota `20261016184938`.
  Configuração conferida e advisors sem novos avisos. Teste de banco ampliado para
  políticas de imagens, com opção de PostgreSQL local descartável sem Docker.
- Passaram 175 testes Node, tipos/build e os seis roteiros Chromium, incluindo
  arremesso/teclado/posição do dado, imagens entre dois navegadores, fila offline,
  SVG recusado, cópias com retratos independentes e download atrasado na troca de
  conta. O check completo passou com 174 testes; o caso adicional de MIME
  disfarçado, build e dado foram conferidos depois. Banco/RLS passaram em
  PostgreSQL 18.6 descartável e a revisão visual cobriu celular/três temas/GG.


- Link “Esqueci a senha” aparece somente no modo Entrar, sem ocupar a tela de
  cadastro ou repetir a ação no formulário de recuperação. Conferidos build,
  171 testes Node e alternância dos três modos no Chromium.

### Entrada com tema de grimório e DNS conferido — 2026-10-16

- Entrada recebeu paleta escura de carvão/couro, textura leve, tipografia de
  livro e detalhes em dourado envelhecido. Símbolo original acompanhado do nome
  em texto para conservar contraste. Cores da ficha e lógica de acesso preservadas.
- Usuário confirmou OK no GitHub DNS check e Cloudflare. Conferidos nameservers
  Cloudflare, HTTPS 200 na raiz e `www` com 301 → 200, certificado aceito. O site
  continua servido pelo GitHub Pages; transferência para Pages Cloudflare pendente.
- Passaram `npm test` (171 testes), `npm run build` e o roteiro Chromium de auth
  em `/` e `/D-D/`. Revisados desktop/celular, 320px/fonte GG, modos de acesso
  sem transbordamento e contraste dos textos/botão/bordas. Os outros roteiros de
  navegador não foram repetidos para esta alteração de apresentação.


### Entrada principal do CritCall e exibição da ficha — 2026-10-16

- Nova entrada com logo fornecida pelo responsável, login/cadastro/recuperação,
  adaptação para celular e foco de teclado. O formulário existente é reutilizado
  entre entrada e perfil. A ficha começa oculta/inativa até escolher o espaço;
  conta validada abre suas fichas ou a ação de criar a primeira.
- Uso local preservado por escolha explícita; saída retorna à entrada. Recuperação
  de senha tem tela própria antes de voltar às fichas. Avisos e backups de dados
  ilegíveis permanecem disponíveis, sem apagar armazenamento ou adotar fichas locais.
- Seletor Clássica (2014)/Moderna (2024) movido da barra global para dentro da ficha,
  com estado acessível e indicação das regras 2014. Layout continua por personagem;
  cores/texturas/fontes continuam por conta, sem alterar os contratos da fila.
- Ícone fornecido passa a identificar a barra, favicon e manifest. Logo/ícone
  entram no build/cache; PDFs continuam fora do download offline automático.
- `npm run check` passou: **171 testes**, tipos/build e os cinco roteiros Chromium.
  Incluídas entrada antes da ficha, recuperação/cancelamento, preferências após
  recarga/contas A-B e entrega visual em dois navegadores com HTTP simulado.
  Conferidos três temas/320px/fonte GG e imagens da entrada em desktop/celular.
  Sem alteração de SQL/RLS/RPC, serviço remoto, visibilidade ou publicação.


### Publicação Cloudflare preparada e compatibilidade offline — 2026-10-16

- Workflow recebe destino opcional `DEPLOY_TARGET=cloudflare`, mantendo GitHub
  Pages como padrão. O job Cloudflare aguarda a verificação da `main`, baixa e
  extrai o mesmo artefato testado e envia com Wrangler fixado, sem recompilar.
  Configuração de projeto/Secrets documentada; nenhuma entrega foi publicada.
- Corrigida recarga offline quando o host redireciona `.html` para caminhos sem
  extensão. Respostas redirecionadas são reconstruídas ao servir o cache; `/book`
  e fragmentos são normalizados. A revisão do cache inclui a política do worker.
  Não há recarga forçada nem alteração do armazenamento de fichas/anotações.
- Regressão Chromium cobre navegação offline com redirecionamentos, persistência,
  leitor e retorno à ficha em `/` e `/D-D/`. Nameservers atribuídos à zona foram
  registrados; ativação, projeto Pages, credenciais e teste público permanecem pendentes.
- Verificados: actionlint 1.7.12, `git diff --check`, 171 testes Node, tipos/build,
  os cinco roteiros Chromium e smoke offline no emulador Wrangler 4.151.1. O teste
  de aplicativo foi repetido após ajustar as asserções de cache. Docker continua
  ausente; não houve alteração SQL/RLS/RPC nem repetição local do teste de banco.

### Roteiro de migração para Cloudflare — 2026-10-16

- Usuário confirmou conta Cloudflare criada e intenção de manter fontes privadas,
  com crescimento por planos dos serviços. Preparado `docs/CLOUDFLARE.md` com
  importação de DNS, publicação de `dist/` pelo GitHub Actions, conferência da
  transição e limites do que pode crescer sem alteração no aplicativo.
- `www` corrigido pelo usuário e conferido; HTTP respondeu, mas HTTPS ainda
  apresentou certificado incompatível durante a checagem no GitHub. Zona/projeto
  Cloudflare, mudança de nameservers e adaptação do workflow seguem pendentes.
- Mudança documental, conferida por revisão de diff e `git diff --check`.
  Sem alteração de dependências, licença, visibilidade ou serviços externos;
  testes funcionais anteriores não repetidos.

### Recuperação após falha temporária da fila offline — 2026-10-16

- Corrigida a tentativa de captura após transação recusada do IndexedDB. A edição
  salva no cache local podia ser ignorada e substituída pela cópia anterior da
  nuvem. A recuperação usa a projeção persistida, mantendo a comparação original
  durante atualizações remotas. Nenhum dado ou formato de armazenamento foi apagado.
- Regressão reproduziu o problema antes da correção. Acrescentados três casos
  Node e um cenário Chromium com falha/restabelecimento da fila. `npm run check`
  passou com **171 testes**, tipos/build e os cinco roteiros de navegador, usando
  o override de plataforma documentado nesta máquina. SQL/RLS/RPC não alterados.
- DNS autoritativo já contém os quatro A corretos; `www` ainda precisa apontar
  diretamente para `mhaetinger.github.io`. Usuário confirmou compra só do domínio.
  Registrado roteiro SMTP com proposta de Resend, sem criar conta/ativar serviço.

### Retomada local e domínio em verificação — 2026-10-16

- Usuário informou as configurações do domínio feitas, com DNS em verificação
  no GitHub. Consulta pública ainda recebeu estacionamento da Hostinger, sem
  confirmar ativação do site/HTTPS. Atualizado o estado no guia e na retomada.
- Retorno novo e os dois retornos locais aceitos pela API real do Supabase (303);
  retorno não permitido recaiu no domínio novo. Tokens aleatórios inválidos,
  sem cadastro, envio de e-mail ou alteração de senha. Isso não valida login completo.
- Após `npm ci`, passaram **168 testes Node**, tipos/build e os cinco roteiros
  Chromium. Usado o build Ubuntu 24.04 do Playwright no Ubuntu 26.04 desta máquina,
  sem alterar dependências. Auditoria de produção sem alertas. Docker ausente:
  o teste de banco não foi repetido. Nenhuma alteração em SQL/RLS/RPC.
- Projeto Supabase correto confirmado ativo; avisos do serviço anteriores
  permanecem documentados. Servidor local iniciado em 5174 para a conferência
  manual. Sincronização com contas reais, SMTP e publicação ainda pendentes.

### Domínio comprado e roteiro de ativação — 2026-10-16

- Usuário confirmou a compra de `criticall.art` na Hostinger. Atualizados guia,
  README e retomada, substituindo a proposta anterior pelo domínio comprado.
- Documentados os apontamentos para o GitHub Pages, HTTPS, retornos do Supabase
  e preservação dos dados ao trocar de origem. DNS público ainda aponta fora
  do Pages; nenhuma configuração externa foi alterada ou publicação executada.
- Verificação documental: consulta pública de DNS, documentação oficial de
  Hostinger/GitHub/Supabase e revisão do diff. Sem mudança funcional ou repetição
  dos testes de comportamento.

### Banco ativado e retomada em outro PC — 2026-10-16

- Após o usuário confirmar conexão/autorização, ferramentas Supabase ficaram
  disponíveis. Projeto exclusivo `qhrpgkpvwbztubnrdhya` conferido, sem tabelas
  públicas/migrações/RPCs de sincronização antes da alteração. Aplicado o script
  preparado como `personal_sync`, versão remota `20261016101143`, sem alterar
  outro projeto. RLS, políticas do dono, grants e execução das RPCs conferidos.
- API anônima das duas tabelas recusou acesso (401/42501). Smoke SQL real em
  PostgreSQL 17 passou escrita/idempotência, bloqueio entre identidades e dono
  incorreto no relógio. Fixtures sintéticas sem e-mail foram revertidas com
  ROLLBACK; nenhuma ficha/nota real foi lida. Fluxo real entre PCs ainda pendente.
- Criado `docs/RETOMADA.md` com branch, comandos para outro PC, contratos,
  estado remoto e próximos passos. README e demais documentos passam a refletir
  o banco aplicado. Fichas/filas locais não entram no Git: confirmar envio na
  origem ou levar backup privado. Histórico privado do protótipo fica separado.
- CI de `8e94a9e` conferida: push/PR concluídos com sucesso, incluindo o teste
  PostgreSQL. Testes locais de 168 casos/build/Chromium são da implementação
  anterior, sem repetição por esta documentação. Diff revisado. Advisories do
  serviço registrados em SINCRONIZACAO.md; revisão integral de segurança, SMTP,
  teste real entre dispositivos, merge/publicação e domínio seguem pendentes.

### Salvamento pessoal, nome automático e fila offline — 2026-10-16

- Usuário autorizou salvar dados pessoais no Supabase e receber a versão mais
  recente em outro PC. Nome passa a salvar ao digitar; falha mantém o texto,
  informa o problema e não anuncia sucesso. Falhas locais têm prioridade sobre
  uma confirmação de envio anterior. Dados existentes continuam preservados.
- Cliente sincroniza fichas completas, notas privadas separadas, nome, ficha
  ativa, preferências persistidas, histórico/checkpoints e dados de recuperação.
  A fila usa transações IndexedDB por projeto/usuário, IDs idempotentes e
  confirmação de cada documento. Edições durante o envio ficam pendentes;
  documento recusado não bloqueia os demais. Leitura remota é paginada.
- Revisões/datas e relógio calibrado definem atualização. Edições concorrentes
  mantêm a mais recente e preservam ambas no histórico; cache legado sem data
  não se apresenta como novo. Exclusões usam tombstones. Consulta/restauração
  privada de versões exige confirmação; restaurar ficha não restaura notas.
- Histórico/checkpoints sobrevivem à recarga, fora das anotações. Preservados
  bytes de histórico ilegível, cache legado, backups e dados do modo sem login.
  Atualizações aguardam editores; troca de conta encerra a projeção anterior.
  Outra máquina só recebe edições offline após reconexão/envio da origem.
- Preparada migração transacional com duas tabelas, RLS exclusiva do dono,
  escrita somente por RPC e verificação da identidade esperada. Script testado
  em PostgreSQL 16 descartável, incluindo duas identidades/anon, concorrência,
  idempotência, datas, tombstones e reaplicação sem perder dados; entrou na CI.
- Verificação: `npm run check` passou com **168 testes Node**, tipos/build e
  cinco roteiros Chromium, incluindo conta em duas instalações, conta diferente,
  nome automático/recarga/quota, edição/recarga offline, reconexão, conflitos e
  restauração sem alterar notas. Três temas em 320 px/GG e demais regressões
  passaram, sem erros JS. `npm run test:database` passou em PostgreSQL 16 real
  descartável. Auditoria de produção sem vulnerabilidades; diff conferido.
  Caso adicional do modal de versões: três temas em 320 px/GG, texto hostil
  sem execução e rodinha contida no limite passaram no Chromium.
- Supabase passou a instalado/habilitado, mas ferramentas de banco ainda não
  ficaram disponíveis. Consulta real sem dados (`limit=0`) no projeto CritCall
  retornou 404/PGRST205 para a nova tabela. **Migração ainda não aplicada e
  sincronização real ainda não validada.** Sem e-mail real, merge/publicação,
  mudança no outro aplicativo ou compra/ativação de domínio. Detalhes em SINCRONIZACAO.md.

### Recuperação local relatada como bem-sucedida — 2026-10-16

- Após a orientação de repetir no navegador/dispositivo de origem, o usuário
  relatou que a recuperação/troca, a princípio, deu certo. Atualizado o estado
  no README e na documentação, sem atribuir essa operação às ferramentas.
- Esclarecido que o retorno do link exige o navegador/dispositivo que o pediu;
  entrada normal por e-mail/senha funciona em outros navegadores. Fichas seguem
  locais, sem sincronização. Nenhum fluxo ou configuração remota foi alterado.
- CI anterior de `a09f46d` conferida: push/PR concluídos com sucesso. Alteração
  somente documental, com diff conferido e sem repetir testes de comportamento.
  Reenvio real, duas contas, SMTP próprio e ativação pública continuam pendentes.

### Recuperação: abertura em outro navegador confirmada — 2026-10-15

- Usuário confirmou retorno a `http://localhost:5174/`, abrindo o link em outro
  navegador/dispositivo. O verificador PKCE permanece no navegador de origem;
  esse cenário explica a recusa sem comprovar expiração. Solicitado novo teste
  no mesmo navegador/dispositivo/endereço, ainda sem conclusão real da troca.
- Mensagens de envio, reenvio e dica de senha agora explicitam o mesmo navegador
  **e dispositivo**, com preferência pelo e-mail mais recente. Preservados o
  fluxo, a apresentação compacta e todos os dados locais. Estado atualizado no
  README e na documentação, sem alterar templates ou configurações do Supabase.
- CI de `4de49ec` conferida: push/PR concluídos com sucesso. Os 155 testes Node
  são da etapa anterior; esta alteração apenas esclarece textos existentes.
- Verificação desta alteração: tipos/build e roteiro de login Chromium em
  `/D-D/` e `/` passaram, incluindo três temas em 320 px/GG, sem erros JS.
  Diff conferido; sem repetir os demais roteiros de navegador.
- Nenhum e-mail real enviado por ferramenta, alteração de senha remota, merge
  ou publicação. Conclusão real da recuperação e do reenvio continua pendente.

### Recuperação: causas distintas e resultado de novas tentativas — 2026-10-15

- Usuário relatou recusa do link real após autorizar localhost, com o aviso
  genérico de expiração/outro navegador. O texto antigo reunia causas distintas;
  não permite identificar a causa deste relato. Troca real continua pendente.
- Retorno agora diferencia link expirado/usado, prazo encerrado, solicitação
  indisponível no serviço, verificador incompatível e solicitação ausente neste
  navegador/endereço. Falta local do verificador não é chamada de expiração.
  Mantidas limpeza do retorno e preservação de sessões/fichas existentes.
- Corrigido aviso antigo que reaparecia ao renderizar o perfil e escondia o
  resultado de novas tentativas de entrada/envio. Falha reproduzida no roteiro
  ampliado e corrigida ao iniciar outra ação ou mudar o modo do formulário.
- Provedor simulado passa a conferir códigos emitidos, desafio SHA-256 do PKCE,
  prazo e uso único. Antes, aceitava qualquer código. Acrescentadas verificações
  de outra aba no mesmo navegador, link reaberto, solicitações sobrepostas,
  prazo encerrado e código desconhecido, preservando a conta já validada.
- Verificação desta alteração: **155 testes Node**, tipos/build e roteiro
  Chromium de login em `/D-D/` e `/` passaram, com três temas em 320 px/GG e
  sem erros JS. Diff conferido. Outros três roteiros completos de navegador
  permanecem validação anterior; não foram repetidos por esta correção de login.
- Nenhum e-mail real enviado ou senha alterada por ferramenta. Origem final e
  navegador usados no link real ainda não foram confirmados pelo usuário nesta
  investigação. Sem mudança administrativa, merge ou publicação.

### Retorno de localhost autorizado e conferido — 2026-10-15

- Usuário adicionou `http://localhost:5174/` em Redirect URLs do Supabase e
  confirmou o salvamento, preservando os endereços existentes. Não foi necessário
  mudar o código, que já solicita retorno na origem/pasta atual.
- Verificação real após o ajuste: consultas com tokens aleatórios inválidos em
  signup/recovery retornaram 303 para localhost:5174; 127.0.0.1:5174 continuou
  aceito. Sem cadastro, e-mail ou troca de senha por ferramenta; o teste confere
  o destino, sem substituir conclusão real da recuperação pelo usuário.
- Solicitado ao usuário testar um novo link de troca pelo perfil já conectado,
  no mesmo navegador/origem. Resultado ainda pendente. Alteração documental,
  com diff conferido e sem repetição dos testes funcionais anteriores.

### Retorno local do cadastro identificado — 2026-10-15

- Usuário confirmou origem `http://localhost:5174/` e destino no Pages após a
  confirmação. A conferência real anterior mostrou localhost recaindo no Site
  URL, enquanto 127.0.0.1:5174 é aceito; causa do relato identificada.
- Solicitado acrescentar o retorno exato de localhost em Redirect URLs do projeto
  exclusivo, preservando os existentes. Conector continua sem instalação; chave
  pública não permite alterar essa configuração administrativa. Não forçar troca
  de origem no cliente, preservando armazenamento e verificador PKCE.
- Alteração apenas documental: diff conferido, sem repetir testes funcionais.
  Nova consulta real confirmou localhost ainda recaindo no Pages (303), sem
  e-mails ou usuários envolvidos. Salvamento no painel continua pendente. CI da
  etapa anterior f0e2e3b conferida: push/PR concluídos com sucesso.

### Cadastro real confirmado e troca de senha no perfil — 2026-10-15

- Usuário confirmou cadastro, recebimento/abertura da confirmação e entrada no
  serviço real. Relatou retorno para outro endereço, ainda a identificar; não
  tratar o sucesso da entrada como validação desse destino ou da recuperação real.
- Acrescentado **Enviar link para trocar senha** na conta conectada, sem exigir
  saída. Usa o e-mail da identidade validada e o mesmo retorno PKCE da recuperação;
  nunca um endereço remanescente do formulário de entrada. Mantido o perfil compacto.
- Conferido retorno real com tokens aleatórios inválidos, sem cadastro/envio de
  e-mail: 127.0.0.1:5174 recebeu retorno local, enquanto localhost:5174 recaiu no
  Pages (303). Documentada a diferença de origens e a possível causa do relato,
  sem alterar o Supabase ou forçar retorno cruzado no código.
- Verificação desta alteração: tipos/build e roteiro Chromium de login sob
  `/D-D/` e `/` passaram, incluindo reenvio com PKCE, recuperação, troca na conta
  conectada, recusa da senha antiga/entrada com a nova no provedor simulado e
  três temas em 320 px/GG. Sem erros JS. Dados/fichas preservados; diff conferido.
  Os 155 testes completos são validação da etapa anterior, não repetidos aqui.
- Entrega e troca reais da recuperação/reenvio continuam pendentes. Ferramentas
  não enviaram e-mails reais nem alteraram senha de usuários. Login publicado,
  SMTP próprio e integração por PR continuam pendentes.

### Configuração do login incluída no build e domínio proposto — 2026-10-15

- URL e chave publicável do projeto exclusivo do CritCall passam a acompanhar o
  build em `src/auth/public-project.ts`, como configuração pública destinada ao
  navegador. O workflow não depende mais das variables do GitHub que o usuário
  não encontrou. Nenhuma chave administrativa ou senha entrou nesse arquivo.
- Mesmo resolvedor no preflight e no cliente: override exige o par completo,
  configuração privilegiada é recusada e `VITE_AUTH_ENABLED=false` permite uma
  edição apenas local. Dados e espaços de conta existentes permanecem preservados.
- Entrada só mostra sucesso depois da validação da identidade. Links expirados
  e códigos PKCE sem verificador exibem orientação, limpam o retorno e preservam
  uma conta válida já aberta. Restrição de envio de e-mail tem mensagem própria.
- Usuário propôs `critcall.com.br`. RDAP do Registro.br retornou 404, sem registro
  encontrado, sem reserva/compra. Preparado guia de registro, Pages/DNS/HTTPS,
  retornos e transporte de backups entre origens em `docs/DOMINIO.md`.
  Um CNAME no código não configura o domínio no fluxo de GitHub Actions.
- Verificação desta alteração: `npm run check` com URL/chave de ambiente vazias
  passou em **155 testes Node**, tipos/build e quatro roteiros Chromium; o login
  foi executado sob `/D-D/` e `/`, incluindo casos novos de retorno, validação
  recusada e envio restrito, sem erros JavaScript. Configuração pública incluída
  aceita pelo projeto real, com e-mail/cadastro ativos e confirmação obrigatória.
- Caso adicional: build recusou chave secreta fictícia mesmo com login desligado,
  antes do Vite; edição local explícita abriu sem formulário/chamadas ao Supabase
  ou erros JS. Diff conferido. Essas verificações não criaram usuários nem
  enviaram e-mails reais. SMTP próprio, configuração administrativa, teste real
  de confirmação/entrada/recuperação e ativação pública continuam pendentes.
- CI da etapa anterior `2ff912e` conferida nesta retomada: push e PR concluídos
  com sucesso. Isso não substitui a CI desta alteração. Sem merge/publicação,
  registro de domínio ou alteração em bancos remotos nesta etapa.

### Supabase do CritCall identificado e conexão local conferida — 2026-10-15

- Projeto exclusivo informado pelo usuário: `qhrpgkpvwbztubnrdhya`. URL/chave
  publicável configuradas em `.env.local`, ignorado pelo Git; a chave não foi
  adicionada ao código/documentação. API real respondeu 200 em settings/health,
  com cadastro por e-mail habilitado e confirmação obrigatória.
- Build configurado e Chromium contra a API real: tentativa de entrada com
  conta inexistente recusada com 400 e mensagem em português, sem erro JS.
  Nenhum usuário criado, e-mail enviado ou login bem-sucedido real nessa verificação.
- Usuário confirmou retornos salvos e uso do envio padrão. Porta 5173 do exemplo
  está ocupada por outro aplicativo; CritCall iniciado em 5174 com porta estrita,
  e usuário confirmou a troca do retorno local para 5174. Caminho de criação das
  variables do Actions detalhado após dificuldade para localizar; ainda sem
  confirmação da criação. Entrega de e-mail/SMTP próprio para jogadores,
  configuração administrativa e duas contas reais continuam pendentes.
- Corrigida execução de HTML por campos de recurso de backups importados:
  somente círculos de 1 a 9 viram controles; usos/custos opcionais e carteira
  antiga exibem texto escapado. Dados originais preservados, sem alteração
  de regras ou reativação da loja incompleta. A revisão integral permanece pendente.
- Verificação: regressão reproduziu a falha antes da correção; depois passaram
  **154 testes Node**, tipos/build e quatro roteiros Chromium. Regressão ampliada
  cobre campos adulterados nos dois layouts e preservação dos dados. Servidor
  local 5174 conferido no Chromium: cadastro visível, mínimo de 12 caracteres
  e nenhum erro JS. Diff sem erros de whitespace. O site publicado e bancos
  remotos não foram alterados.

### Nome confirmado: CritCall — 2026-10-15

- Usuário definiu **CritCall** como nome do aplicativo de fichas de D&D.
  Atualizados título, instalação, pacote, nomes de downloads, documentação e
  instruções de manutenção. Outros aplicativos permanecem separados.
- Chaves de armazenamento, formato dos backups e endereço publicado preservados.
  O projeto Supabase novo já foi criado pelo usuário e ainda aguarda identificação/conexão.
- Verificação: tipos/build e conferência Chromium de título, manifest, ícone,
  download `critcall-fichas` e formato de backup legado passaram. Diff sem erros
  de whitespace; os testes funcionais da etapa anterior não foram repetidos
  por esta alteração de nome. Sem merge ou publicação nesta etapa.

### Identidade correta: Fichas D&D — 2026-10-15

- Usuário esclareceu que **outro aplicativo é outro projeto** e informou que já criou o
  Supabase novo do D&D. Corrigidos título, nome de instalação, pacote, ícone,
  downloads e documentação para Fichas D&D; registrada a separação no AGENTS.md.
  Falta identificar/conectar o projeto novo; não criar outro por repetição.
- Novos espaços de autenticação/conta usam prefixos `dnd_auth_v1` e
  `dnd_account_v1`. As chaves de fichas publicadas e o formato de backup legado
  são preservados para não interromper a leitura dos dados existentes; não
  representam vínculo com outros aplicativos.
- Verificação desta correção: 18 testes de armazenamento/contas, tipos/build e
  roteiros Chromium de armazenamento e login passaram. Conferidos título,
  manifest, ícone e nome do download no navegador, com formato legado legível.
  Corrigido o relógio dos tokens fictícios no teste de login: a conta simulada
  não muda ao atravessar a virada de um segundo. Diff sem erros de whitespace.
  A validação de 154 testes e dos quatro roteiros completos é da etapa anterior.
- Site publicado e bancos remotos não foram alterados por esta correção.

### Login por e-mail/senha preparado — 2026-10-15

- Confirmados e-mail/senha e projeto Supabase exclusivo do D&D, separado do
  projeto já existente na mesma conta administrativa. Implementados cadastro,
  entrada, reenvio de confirmação, recuperação/troca de senha por PKCE e saída
  com o SDK oficial 2.118.0. Configuração ausente conserva o modo local.
- Identidade online conferida no serviço antes de carregar a ficha. Espaços
  locais separados por projeto/usuário para fichas, notas, recuperação e
  preferências pessoais. Dados anteriores continuam no espaço sem login;
  entrar não os envia nem os adota automaticamente. Backups continuam sem
  notas por padrão, e a importação cria cópias no espaço escolhido.
- Troca de conta reinicia histórico/interface e limpa rolagens. Com editor ou
  confirmação abertos, o jogador decide o fechamento e pode baixar backup;
  exclusões pendentes são canceladas. Importações assíncronas não terminam em
  outra conta. Rascunhos com falha de gravação permanecem no espaço anterior
  em memória, inclusive notas para backup explícito.
- Cópia de uma identidade previamente validada abre offline. Saída offline
  remove a sessão deste aplicativo sem declarar revogação no servidor; fichas
  e notas são preservadas. O cache não é criptografado e continua acessível a
  quem controla o navegador. Nenhuma tabela remota ou sincronização adicionada.
- Preflight de desenvolvimento/build recusa chave secreta/service_role e
  configuração incompleta. URL/chave publicável podem vir de `.env.local` ou
  das variables públicas do workflow. Licenças das novas dependências preservadas.
- Verificação: **154 testes Node**, tipos/build e os três testes anteriores de
  navegador passaram. O novo teste Chromium usa o SDK real com respostas HTTP
  controladas: erros, cadastro/confirmação, retorno PKCE/recuperação, duas contas
  e espaço local com notas distintas, histórico, recarga/offline/saída offline,
  sessão revogada com editor/exclusão pendentes e backup. Raiz e index.html
  compartilham a sessão. Três temas em 320 px/GG
  sem rolagem horizontal; rodinha no limite do perfil não alcança a página;
  capturas inspecionadas. Roteiros sem erros JavaScript. Auditoria de produção
  sem alertas. O aviso anterior da cadeia de desenvolvimento permanece documentado.
- Limites: projeto exclusivo ainda não criado/conectado nesta sessão; nenhum
  usuário real cadastrado ou e-mail real enviado nos testes. Ativação no site,
  SMTP/retornos, revisão integral de segurança e validação real ainda pendentes.
  Guia em `docs/LOGIN.md`; autenticação não significa sincronização de fichas.

### Primeira publicação concluída — etapa anterior

- Integradas as PRs #1/#2 até `8520bd4`, com deploy aprovado no GitHub Actions.
  Site e roteiro online conferidos em 15/10/2026:
  [mhaetinger.github.io/D-D](https://mhaetinger.github.io/D-D/). Essa validação é
  da entrega anterior, sem o login agora preparado nesta branch.

### Preparação da primeira publicação — 2026-10-15

- Reunidas as tarefas anteriores em `feature/primeira-versao`, com guia de
  conferência e integração `develop` → `main`, sem ativar publicação nesta etapa.
- A pipeline guarda o pacote verificado por três dias também nas branches de
  trabalho. Publicação continua restrita ao push da `main` após todas as verificações.
- PostCSS atualizado para 8.5.30 e parser de seletores fixado em 7.1.6. O CSS
  compilado permaneceu idêntico. Auditoria de produção sem alertas; aviso sem
  correção da cadeia de build documentado no guia. Sem migração automática do Tailwind.
- Conferidos artefato público, livros autorizados, ausência de fichas pessoais,
  caminhos relativos e configuração de cache; notas e dados do jogador não entram
  no pacote. A auditoria de produção passa a ser exigida pela pipeline.
- Verificação após instalação limpa: **149 testes Node**, tipos/build e os três
  testes Chromium passaram. Conferidos também integridade dos PDFs e ocultação
  das notas na impressão, sem inseri-las no objeto da ficha.

### Alinhamento do combate — 2026-10-15

- Alinhados os rótulos e valores de CA, iniciativa, deslocamento e pontos de
  feitiçaria. A ação de Armadura Arcana fica abaixo da CA sem deslocar os outros
  valores; deslocamento usa o mesmo tamanho de número dos demais quadros.
- Verificação: tipos/build e Chromium nos dois layouts, três temas, larguras
  de 320/1440 px e fontes normal/GG; ativação de Armadura Arcana e regressão da
  ficha, incluindo criação, evolução, moedas e persistência.

### Última ficha aberta — 2026-10-15

- A aplicação lembra a última ficha selecionada neste navegador pelo ID,
  preservando a seleção mesmo se a ordem mudar. Se a ficha não existir mais,
  abre a primeira disponível. Armazenamento bloqueado não impede a consulta.
- Verificação: tipos/build de produção e teste Chromium da aplicação, incluindo
  seleção/recarga, reordenação e referência a uma ficha removida.

### Base da aplicação — 2026-10-15

- Iniciada a estrutura com Vite e TypeScript, extraindo estilos e aplicação do
  HTML. Mantidos motor, assistente e visual existentes, com ponte temporária para
  os eventos da ficha. Novos módulos ficam em `src/`; arquivos distribuíveis em
  `public/`; somente `dist/` é publicado. Dependências e lockfile fixados.
- Fontes e 35 ícones usados agora são locais. Removidos Tailwind em tempo de
  execução e dependências de fontes/ícones por CDN; CSS é compilado no build.
  Licenças dos componentes acompanham a distribuição.
- Armazenamento local versionado, com migração da chave anterior sem apagá-la.
  Dados inválidos/futuros são preservados e informados; falhas de escrita não são
  tratadas como sucesso. Uma leitura bloqueada impede gravar sobre dados desconhecidos.
- Backup JSON no perfil local, sem notas por padrão. Inclusão de notas é explícita;
  importação cria cópias com novos IDs e remapeia as notas. Recuperação de conteúdo
  ilegível exige confirmação e preserva uma cópia, inclusive em recuperações sucessivas.
- Cache offline do build, manifest e ícone. Depois do preparo inicial, a ficha
  funciona sem rede, incluindo criação/evolução e salvamento local. Atualizações
  aguardam fechar as abas, sem recarregar uma edição; não há PDFs automáticos ou
  dados do jogador no cache do aplicativo.
- Pipeline com tipos, testes, build e navegador para branches/PRs. Publicação
  permitida somente no push da `main`, após verificação, via GitHub Actions e
  artefato `dist/`. A fonte do Pages precisa mudar para GitHub Actions na conta;
  a `main` não foi alterada por esta tarefa.
- Documentados módulos, execução e sequência de evolução. Contas, banco remoto,
  histórico persistente, sincronização e salas ainda não foram implementados.
  O extrator de catálogos agora está no projeto público e lê o PDF autorizado.
- Verificação: **149 testes Node passaram**, incluindo salvamento das 41
  subclasses em todos os níveis de 1 a 20; tipos e build de produção passaram.
  Chromium passou para ficha/biblioteca e para migração, downloads/importação,
  notas opcionais, dados inválidos, texto não executável, quota, storage bloqueado,
  recuperação com cancelamento/confirmação e recarga/evolução sem rede sob `/D-D/`.
  Perfil conferido nos três temas, 320 px e fonte GG, sem rolagem horizontal;
  nenhuma requisição externa de fontes/ícones/código. O extrator recebeu apenas
  verificação de sintaxe nesta etapa; não foi regenerado o catálogo.

### Biblioteca e fluxo de branches — etapa anterior

- Biblioteca com os dois livros autorizados para consulta, seleção de livro,
  navegação por página, abertura em outra aba e download. Links existentes
  `book.html#page=N` continuam abrindo a regra no Jogador. O Mestre tem paginação
  separada; o catálogo não altera as regras do motor.
- Restauradas as descrições das 361 magias e 958 referências de características,
  classes e escolhas nos balões e consultas. Os identificadores e metadados foram
  preservados. A ficha continua vazia para novos usuários e sem dados pessoais.
- Biblioteca acompanha tema/fonte da ficha e usa caminhos relativos para o Pages.
  Consulta continua disponível quando o armazenamento do navegador é bloqueado.
- Leitor integrado com PDF.js 6.4.299, hospedado junto do aplicativo, worker,
  fontes/decodificadores e licenças preservados. Renderiza a página com texto
  selecionável, zoom e navegação anterior/próxima. Trocas cancelam renderizações
  antigas; a rodinha permanece dentro do leitor. Abertura/download servem de
  alternativa quando o carregamento falha. A leitura integrada requer HTTP/HTTPS.
- Adicionados testes dos links de todas as referências, paginação por livro,
  URLs inválidas, arquivos PDF e conteúdo dos catálogos; teste de navegador cobre
  consulta sob `/D-D/`, navegação e abertura a partir do criador.
- Portados os testes do motor para a base pública. Verificação: **136 testes Node
  passaram**, incluindo as 41 subclasses do nível 1 ao 20; regressão da ficha no
  Chromium passou com criação/evolução, moedas, recarga, perfis isolados, três
  temas e 320 px/GG. Nenhuma alteração foi integrada à `main` nesta tarefa.
- No Chromium, o leitor também passou com renderização real dos dois PDFs,
  seleção de texto, zoom, rodinha contida, navegação/recarga/voltar, temas/320/GG,
  storage bloqueado e falha de rede seguida de nova tentativa. Balões e links
  foram conferidos no criador, sem erros JavaScript.
- Criada `develop` a partir da versão pública para integrar mudanças antes da
  `main`. Documentado o fluxo de branches por tarefa e pull requests, com modelo
  de descrição e orientações de manutenção. Nenhuma mudança funcional no aplicativo.
- Verificação: revisão do diff, `git diff --check` e conferência da base pública
  das branches. A proteção automática de branches ainda não está configurada.

## 2026-10-15

- Primeira edição pública com criador, evolução, multiclasse, ficha, temas e dados.
- Início sem personagem pessoal, perfil local identificado e sem senha fictícia.
- Fundos animados, características em fluxo nativo e espaço estável da barra de rolagem.
- Metadados de consulta substituem descrições integrais do livro; PDFs não incluídos.
- Páginas com noindex, sem promessa de controle de acesso.
