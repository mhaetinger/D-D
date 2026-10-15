# Changelog

## Não lançado

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
