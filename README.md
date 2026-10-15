# Fichas D&D — protótipo público

Aplicativo estático de fichas individuais. Acesse index.html ou sirva esta pasta com um servidor HTTP.

O site é acessível a qualquer pessoa com o endereço. As páginas usam noindex; isso não exige senha nem garante invisibilidade.

As fichas e anotações são salvas somente neste navegador. Ainda não há login, servidor de fichas ou sincronização. Abrir outro dispositivo/endereço não transfere seus personagens.

A edição começa vazia. Use Criar personagem e siga as etapas. As 12 classes mantêm
suas escolhas e cálculos. Magias, características e escolhas oferecem descrições
completas nos balões e nas consultas do criador.

Em **Consultar livro**, escolha o Livro do Jogador ou o Livro do Mestre, navegue
até uma página, ajuste o zoom ou abra/baixe o PDF. O leitor integrado usa PDF.js
hospedado com o aplicativo e permite selecionar o texto, sem depender de um plugin
do navegador. Os links das regras abrem diretamente na página
do Jogador correspondente. A biblioteca acompanha o tema e o tamanho de fonte da
ficha; a numeração do PDF pode diferir da impressa no livro. Os dois exemplares
foram incluídos a pedido do responsável pelo projeto. Veja [books/README.md](books/README.md).

O código próprio usa a licença MIT. Ela não se estende a livros, marcas ou materiais
de terceiros. O leitor PDF.js conserva sua licença Apache-2.0 em `vendor/pdfjs/`.

Publicação: GitHub Pages, branch main, raiz. A estrutura estática permite acrescentar autenticação/autorização posteriormente; tornar o cadastro aberto não deve expor fichas pessoais.

Desenvolvimento: mudanças entram em branches `feature/*` ou `fix/*` a partir de
`develop`. Após revisão e verificação, uma pull request integra a mudança em
`develop`; outra leva a entrega à `main`. Veja [CONTRIBUTING.md](CONTRIBUTING.md).

Para executar localmente, sirva a pasta por HTTP, por exemplo com
`python3 -m http.server 8000 --bind 127.0.0.1`, e abra
`http://127.0.0.1:8000/index.html`. O leitor integrado requer HTTP/HTTPS;
abrir o HTML diretamente por `file://` não carrega seus módulos/worker.

Verificações do motor, catálogo e links: `node --test tests/*.test.cjs`.
Os testes `node tests/library-browser.cjs` e `node tests/sheet-browser.cjs`
usam Playwright com Chromium;
`DND_PLAYWRIGHT_MODULE` permite indicar uma instalação externa. Não há etapa de
build nesta versão estática.
