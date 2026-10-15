# Changelog

## Não lançado

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
  e correção do retorno local solicitada. Variables do Actions solicitadas,
  ainda sem confirmação. Entrega de e-mail/SMTP próprio para jogadores,
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
  instruções de manutenção. Orbyt continua identificado como outro projeto.
- Chaves de armazenamento, formato dos backups e endereço publicado preservados.
  O projeto Supabase novo já foi criado pelo usuário e ainda aguarda identificação/conexão.
- Verificação: tipos/build e conferência Chromium de título, manifest, ícone,
  download `critcall-fichas` e formato de backup legado passaram. Diff sem erros
  de whitespace; os testes funcionais da etapa anterior não foram repetidos
  por esta alteração de nome. Sem merge ou publicação nesta etapa.

### Identidade correta: Fichas D&D — 2026-10-15

- Usuário esclareceu que **Orbyt é outro projeto** e informou que já criou o
  Supabase novo do D&D. Corrigidos título, nome de instalação, pacote, ícone,
  downloads e documentação para Fichas D&D; registrada a separação no AGENTS.md.
  Falta identificar/conectar o projeto novo; não criar outro por repetição.
- Novos espaços de autenticação/conta usam prefixos `dnd_auth_v1` e
  `dnd_account_v1`. As chaves de fichas publicadas e o formato de backup legado
  são preservados para não interromper a leitura dos dados existentes; não
  representam vínculo com a aplicação Orbyt.
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
