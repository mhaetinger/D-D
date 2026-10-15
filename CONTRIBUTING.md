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

Não há etapa de instalação ou build nesta versão estática. Com Python 3:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Abrir `http://127.0.0.1:8000/index.html`. Recursos externos ainda exigem internet.
Em mudanças funcionais, verificar o comportamento alterado no navegador,
persistência quando afetada, telas pequenas e fonte GG quando houver impacto
visual. Registrar na pull request o que foi executado e as limitações encontradas.
Documentação isolada requer revisão do diff, sem repetir testes da interface.

`node --test tests/*.test.cjs` executa os testes do motor e da biblioteca, incluindo
as 12 classes e 41 subclasses até o nível 20. Com Playwright/Chromium disponíveis,
`node tests/library-browser.cjs` verifica o leitor real sob `/D-D/`, tema/fonte,
balões e links; `node tests/sheet-browser.cjs` verifica criação/evolução,
persistência e telas pequenas. `DND_PLAYWRIGHT_MODULE` aceita uma instalação externa.
O leitor usa PDF.js fixado em `vendor/pdfjs/`, sem CDN; confira suas orientações
e licenças antes de atualizar. Abrir por `file://` não carrega os módulos do leitor.

## Dados e manutenção

- Atualizar `CHANGELOG.md` em `Não lançado` junto das alterações relevantes e o
  README quando mudarem execução ou recursos disponíveis.
- Preservar as fichas e anotações já salvas. Não limpar o armazenamento para
  contornar problemas; usar dados fictícios em verificações compartilhadas.
- Manter fichas reais e credenciais fora dos commits. Os dois livros em `books/`
  e os catálogos de consulta foram autorizados pelo responsável; outros PDFs não
  entram automaticamente. A licença do código não cobre os livros.
- Esta branch pública é a base do desenvolvimento. Uma cópia local de referência
  não deve ser mesclada nem enviada com seu histórico. Qualquer reaproveitamento
  de código exige revisão dos arquivos e do conteúdo antes do commit.
- O seletor 2014/2024 muda o layout; autenticação, sincronização, modo offline e
  salas ainda não estão implementados. Não apresentá-los como recursos disponíveis.
