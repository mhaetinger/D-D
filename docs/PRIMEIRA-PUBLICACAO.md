# Primeira publicação · Fichas D&D 0.1.0

A branch `feature/primeira-versao` reúne biblioteca, base da aplicação e os ajustes
de última ficha aberta e alinhamento do combate. A publicação depende da revisão
e integração em `develop` e, depois, em `main`.

## Escopo e conferência

Estão preparados o criador/evolução/multiclasse, as 12 classes de 2014 com
Patrulheiro Revisado, os layouts 2014/2024, grimório, inventário, moedas, história,
anotações locais, backups, recuperação, biblioteca e acesso offline da ficha.
Login, sincronização, retratos, salas e voz/vídeo ficam para outras entregas.

As notas ficam separadas da impressão e do backup padrão, mas ainda pertencem
ao navegador: não há isolamento por conta em um dispositivo compartilhado.
Os PDFs exigem conexão no leitor integrado.

```sh
npm ci
npm audit --omit=dev --audit-level=moderate
npx playwright install chromium
npm run check
```

A verificação cobre 149 testes Node, incluindo as 41 subclasses de nível 1 a 20,
tipos, build e testes Chromium de criação/evolução, armazenamento, backup,
recuperação, livros, temas, fonte GG, tela de 320 px e uso offline sob `/D-D/`.
Os testes usam fichas fictícias. Isso registra a cobertura executada, sem prometer
que todas as combinações possíveis ou todos os navegadores foram testados.

O pacote contém apenas os dois PDFs autorizados. Fichas reais, notas, configurações
locais e o histórico privado do protótipo não fazem parte desta entrega.

## Dependências do build

PostCSS foi atualizado para 8.5.30 e o parser fixado em 7.1.6 via `overrides`,
mantendo Tailwind 3 e o CSS gerado idêntico ao anterior. A auditoria das dependências
de produção passou sem alertas na preparação desta entrega.

Em 15/10/2026, a auditoria completa ainda aponta cinco entradas na cadeia de
desenvolvimento do Tailwind relacionadas a um único aviso de `braces` 3.0.3:
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
Não há versão corrigida publicada. O problema envolve padrões de busca profundamente
aninhados; neste projeto, eles vêm da configuração do repositório, não das fichas
importadas. Essas ferramentas não são distribuídas no site. Reavaliar o aviso ao
atualizar a cadeia de CSS; não usar `npm audit fix --force` para fazer uma migração
automática de versão principal.

## Revisar o pacote no GitHub

Abra a execução de **Verificar e publicar** correspondente ao commit da branch.
Após as verificações, o artefato `github-pages` contém o site aprovado e fica
disponível por três dias. A produção só é atualizada por push em `main`; gerar
esse pacote em uma branch de trabalho não publica o site.

O download do artefato contém `artifact.tar`. Extraia seu conteúdo e sirva a pasta
por HTTP, ou gere localmente com `npm run build` e use `npm run preview`.
Não abra `index.html` diretamente por `file://`.

## Publicar quando a entrega for aprovada

1. Revisar a [comparação com develop](https://github.com/mhaetinger/D-D/compare/develop...feature/primeira-versao?expand=1)
   e integrar por pull request. As tarefas anteriores já estão incluídas nessa branch.
2. Em **Settings → Pages → Build and deployment**, configurar ou confirmar
   **Source: GitHub Actions**. Essa configuração exige acesso à conta do repositório;
   preparar o código não a altera automaticamente.
3. Abrir a pull request de `develop` para `main`, revisar a execução verde e aprovar
   a integração. Não publicar a raiz do repositório como arquivos estáticos.
4. Aguardar o job `publicar` concluir e usar o endereço informado pelo ambiente
   `github-pages`. Conferir nesse endereço: abertura sem ficha de exemplo, criação
   e recarga, download de backup e consulta dos dois livros.

O site poderá ser aberto por quem obtiver o link, conforme combinado. `noindex`
orienta buscadores; não é convite ou bloqueio de acesso.

Correções seguem em `fix/*`, com revisão para `develop` e `main`. Antes de uma
atualização, manter backups das fichas; não apagar dados locais para atualizar o site.
