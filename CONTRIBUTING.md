# Desenvolvimento

## Branches

| Branch | Uso |
| --- | --- |
| `main` | Versão pronta para publicação no GitHub Pages. |
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
npm run dev
```

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
PDF.js está fixado em `public/vendor/pdfjs/`; preservar seus avisos ao atualizar.

## Dados e manutenção

- Atualizar `CHANGELOG.md` em `Não lançado` junto das alterações relevantes e o
  README quando mudarem execução ou recursos disponíveis.
- Preservar as fichas e anotações já salvas. Não limpar o armazenamento para
  contornar problemas; usar dados fictícios em verificações compartilhadas.
- Manter fichas reais e credenciais fora dos commits. Os dois livros em `public/books/`
  e os catálogos de consulta foram autorizados pelo responsável; outros PDFs não
  entram automaticamente. A licença do código não cobre os livros.
- Esta branch pública é a base do desenvolvimento. Uma cópia local de referência
  não deve ser mesclada nem enviada com seu histórico. Qualquer reaproveitamento
  de código exige revisão dos arquivos e do conteúdo antes do commit.
- O seletor 2014/2024 muda o layout; autenticação, sincronização e salas ainda
  não estão implementadas. O modo offline é local, após preparo do cache; PDFs
  não entram no download automático.
