# Desenvolvimento

## Branches

| Branch | Uso |
| --- | --- |
| `main` | Versão pronta para publicação no destino configurado. |
| `develop` | Integração das mudanças antes da próxima entrega. |
| `feature/<nome>` ou `fix/<nome>` | Uma funcionalidade ou correção, criada a partir de `develop`. |

O fluxo é `feature/*` ou `fix/*` → pull request para `develop` → verificação da
entrega → pull request de `develop` para `main`. Não enviar mudanças diretamente
à `main` nem mesclar uma entrega sem aprovação do responsável pelo projeto.
Criar a branch `develop` não publica uma nova versão do site.

Essa é a convenção de trabalho. Proteção de branches e exigência automática de
aprovações ainda não foram configuradas no GitHub.

Para começar uma tarefa em um clone deste repositório público:

```sh
git switch develop
git pull --ff-only origin develop
git switch -c feature/nome-da-tarefa
```

Após alterar, revisar os arquivos, registrar as verificações e criar o commit:

```sh
git diff --check
git add caminho/do/arquivo
git commit -m "Descreve a mudança"
git push -u origin feature/nome-da-tarefa
```

Abrir a pull request com **base `develop`**. Para correções, usar `fix/` nos dois
comandos correspondentes. Não usar push forçado nem enviar todas as branches/tags.

## Executar e verificar

Use Node.js 22.12+ e as dependências do lockfile:

```sh
npm ci
npm run dev -- --port 5174 --strictPort
```

Para continuar esta entrega, selecionar a branch indicada em `docs/RETOMADA.md` e ler
[docs/RETOMADA.md](docs/RETOMADA.md) antes de iniciar uma nova branch. Abrir
`http://localhost:5174/`, retorno autorizado no Supabase. A configuração pública
do CritCall já acompanha o código; não é necessário copiar `.env.local`.

Para validar uma alteração funcional:

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

`npm run check` encadeia as verificações, com Chromium já instalado. Os testes de
navegador usam o build em `dist/` sob `/D-D/`. `npm run preview` permite revisão
manual do mesmo artefato. Alterações isoladas de documentação exigem revisão do
diff; testes repetidos só quando houver mudança/falha ou dúvida relevante.

Testes incluem motor, 12 classes/41 subclasses até o nível 20, migração, backup,
recuperação e recarga/evolução com rede desligada. Verifique fonte GG, temas e
telas pequenas ao mudar o visual. Registre somente verificações executadas.
`DND_PLAYWRIGHT_MODULE` aceita instalação externa; `DND_TEST_ROOT` aponta outro
build e `DND_TEST_ARTIFACTS` permite capturas opcionais.

`public/` contém apenas arquivos distribuíveis. O motor/assistentes continuam em
`public/rules/`; novos módulos ficam em `src/`. Fonte do Pages: **GitHub Actions**,
com publicação de `dist/` somente após integração aprovada na `main`. Não publicar
os fontes diretamente nem regenerar a exportação do protótipo sobre esta base.
Cloudflare Pages pode ser selecionado com `DEPLOY_TARGET=cloudflare` após configurar
o projeto e os Secrets conforme [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md). O job usa
o mesmo artefato testado; sem essa variável, mantém GitHub Pages.
PDF.js está fixado em `public/vendor/pdfjs/`; preservar seus avisos ao atualizar.

## Dados e manutenção

- Atualizar `CHANGELOG.md` em `Não lançado` junto das alterações relevantes e o
  README quando mudarem execução ou recursos disponíveis.
- Preservar as fichas e anotações já salvas. Não limpar o armazenamento para
  contornar problemas; usar dados fictícios em verificações compartilhadas.
- Manter fichas reais e credenciais privadas fora dos commits. URL e chave
  publicável do projeto são configuração pública revisada em
  `src/auth/public-project.ts`, destinada ao navegador; nunca usar chaves
  secretas/service_role nesse arquivo. Os dois livros em `public/books/`
  e os catálogos de consulta foram autorizados pelo responsável; outros PDFs não
  entram automaticamente. A licença do código não cobre os livros.
- Esta branch pública é a base do desenvolvimento. Uma cópia local de referência
  não deve ser mesclada nem enviada com seu histórico. Qualquer reaproveitamento
  de código exige revisão dos arquivos e do conteúdo antes do commit.
- O seletor 2014/2024 muda o layout. Login e sincronização pessoal estão na
  branch de tarefa; migração aplicada ao Supabase real, com validação entre
  dispositivos reais e publicação ainda pendentes.
  Salas não estão implementadas. PDFs não entram no download automático.

O teste `npm run test:database` usa Docker com PostgreSQL 16 descartável por padrão,
sem publicar portas ou consultar bancos existentes. Também aceita
`CRITCALL_TEST_POSTGRES_BIN` para criar outra instância descartável com binários
locais, conforme o README. Inclui RPCs e políticas do Storage de imagens.
Executá-lo ao alterar SQL/RLS/RPC.
A CI também o exige. Não aplicar migrações ao outro aplicativo; conferir projeto CritCall.
