# Orientações para manutenção

- Este é o projeto **CritCall**. **Orbyt** é outro projeto do responsável:
  não usar esse nome, banco ou configuração de autenticação nesta aplicação.
  O usuário informou que já criou um projeto Supabase novo para CritCall; conferir
  sua URL/identificador antes de conectar ou alterar o serviço.
  Chaves/formato de backup publicados com `orbyt` são legados da nomeação
  equivocada; preservar compatibilidade até uma migração testada.
- Ler `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md` e `docs/ARQUITETURA.md` antes de alterar.
- Trabalhar em `feature/*` ou `fix/*` a partir de `develop`. Usar pull requests
  para `develop` e, depois de verificar a entrega, para `main`. Não fazer push
  direto à `main` nem mesclar sem aprovação do responsável.
- A base de trabalho é o histórico público. Não mesclar o histórico local com
  fichas pessoais nem enviar outras branches/tags. O usuário autorizou os dois
  livros em `public/books/` e os catálogos completos de consulta em 15/10/2026. Outros
  arquivos não entram automaticamente; fichas reais continuam excluídas.
- Preservar fichas, anotações e escolhas existentes. Anotações pessoais devem
  permanecer separadas da ficha compartilhável e da impressão.
- O usuário é daltônico. Usar texto, símbolos e contraste; manter ajustes visuais
  compactos, sem acrescentar blocos ou repetir informações sem necessidade.
- Manter a posição, foco e nós das listas ao selecionar opções. A rodinha dentro
  de uma janela não deve rolar a página de trás. Reutilizar os módulos existentes
  de rolagem, balões, fluxo dos círculos e animação de altura.
- As regras são de 2014, com Patrulheiro Revisado; o seletor 2024 é visual.
  Identificar adaptações da mesa e não prometer cobertura que não foi verificada.
- Explicar em português as regras, contratos e motivos não evidentes no código.
  Atualizar changelog e documentação junto de alterações relevantes.
- Executar verificações proporcionais à mudança e registrar apenas as executadas.
  Alterações isoladas de documentação não exigem testes de comportamento.
- A aplicação usa Vite/TypeScript. Novos módulos ficam em `src/`; a interface
  anterior está em `src/app/sheet.js`, com ponte temporária para seus eventos.
  O motor puro e os assistentes testados ficam em `public/rules/`. Preservar seus
  contratos durante a migração, sem reescrever a ficha inteira sem necessidade.
- Gerar publicação com `npm run build`; distribuir somente `dist/`, via GitHub
  Actions após revisão da main. `public/` não recebe fichas, configurações privadas
  ou arquivos de desenvolvimento. Não voltar às dependências por CDN.
- Usar `npm test`, `npm run build` e testes de navegador pertinentes. Não executar
  o exportador do protótipo local sobre esta base. Dados extraídos são gerados por
  `scripts/extract-phb.py`; não editar os catálogos gerados manualmente.
- Backups não incluem notas por padrão. Importação cria cópias, sem sobrescrever
  fichas; recuperação de dados ilegíveis exige confirmação. Não apagar chaves
  antigas ou caches de dados do jogador para resolver falhas. Manter migrações
  compatíveis e os testes de todas as classes/subclasses.
- Offline usa arquivos do build, sem PDFs automáticos ou fichas no Cache Storage.
  Não forçar atualização/reload de uma edição. Conferir offline real sob `/D-D/`.
- Não declarar autenticação, privacidade por conta ou sincronização
  enquanto esses recursos não existirem. Tratar textos inseridos como dados não
  confiáveis e manter credenciais fora do código publicado.
