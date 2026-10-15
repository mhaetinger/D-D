# Orbyt · Fichas D&D

Aplicação de fichas individuais de D&D 5e, com criador, evolução, multiclasse,
grimório, inventário, anotações pessoais e consulta aos livros da mesa.
As regras são de 2014, com Patrulheiro Revisado; o seletor 2024 muda a apresentação.

## Executar

Use Node.js 22.12 ou superior (a série 22 está em `.nvmrc`) e npm:

```sh
npm ci
npm run dev
```

Abra o endereço local mostrado pelo Vite, normalmente `http://127.0.0.1:5173`.
O aplicativo usa fontes, ícones e leitor locais, sem CDNs durante o uso.

Para conferir o que será publicado:

```sh
npm run build
npm run preview
```

Somente `dist/` é o artefato de publicação. Abrir `index.html` por `file://` não
executa a aplicação; use o servidor de desenvolvimento ou o build via HTTP/HTTPS.

## Salvamento e backups

As fichas e notas ficam neste navegador. Ainda não há login, banco remoto ou
sincronização. Abrir outro dispositivo/endereço não transfere seus dados.
Ao reabrir a aplicação, a última ficha selecionada é restaurada. Se ela tiver
sido removida, abre a primeira ficha disponível.

No perfil local, **Baixar backup** salva suas fichas em JSON. As anotações pessoais
ficam fora do arquivo por padrão; marque a opção para incluí-las em um backup
privado. **Importar backup** cria cópias com novos identificadores, mantendo as
fichas existentes e remapeando as notas incluídas. O limite do arquivo é 20 MB.

Os dados da versão anterior, no mesmo endereço, são lidos e copiados para o
formato local versionado; a chave antiga é preservada. Se os dados não puderem
ser lidos, o aplicativo informa o problema e oferece download para recuperação.
Uma importação para substituir dados ilegíveis exige confirmação e guarda uma
cópia separada. Falhas de quota/permissão são informadas; alterações em memória
podem ser baixadas antes de fechar. Notas não entram nos snapshots da ficha.

## Uso sem internet

Depois do primeiro carregamento completo da versão de produção, o perfil mostra
quando a ficha está disponível offline. Criar, consultar, editar e evoluir fichas
continuam funcionando sem a rede; o salvamento permanece no dispositivo.
O servidor de desenvolvimento não instala o cache offline.

O aplicativo guarda seu código, regras, estilos, fontes e ícones. Os PDFs não são
baixados automaticamente: a consulta aos livros exige conexão, ou você pode abrir
uma cópia previamente baixada fora do leitor integrado. Não há sincronização com
outros dispositivos nesta etapa.

Atualizações aguardam as abas anteriores fecharem, sem recarregar uma edição em
curso. O cache do aplicativo não contém as fichas nem apaga o armazenamento do jogador.

## Livros

Em **Consultar livro**, escolha Jogador ou Mestre, navegue até uma página, ajuste
o zoom ou abra/baixe o PDF. Os links de magias e características abrem na página
do Jogador correspondente. Os dois exemplares foram incluídos a pedido do
responsável pelo projeto; veja [public/books/README.md](public/books/README.md).

O leitor PDF.js é hospedado junto do aplicativo e tem texto selecionável. Os
balões e consultas do criador também oferecem as descrições das regras.

## Verificar

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

`npm run check` executa testes, build e navegador em sequência. O Playwright também
aceita instalação externa por `DND_PLAYWRIGHT_MODULE`. Os testes de navegador usam
`dist/` sob `/D-D/`; `DND_TEST_ROOT` permite indicar outro artefato e
`DND_TEST_ARTIFACTS` ativa capturas opcionais.

## Desenvolvimento e publicação

Branches por tarefa seguem para `develop`; uma entrega revisada segue para
`main`. Não fazer push direto à `main`. A pipeline verifica tipos, testes,
build e navegador; somente um push na `main` pode publicar `dist/` no Pages.
Para essa nova estrutura, a fonte do Pages deve ser **GitHub Actions**. Não publicar
a raiz com os arquivos de desenvolvimento. A configuração e o site ativo ainda
precisam ser conferidos na conta antes da primeira entrega dessa estrutura.

Veja [CONTRIBUTING.md](CONTRIBUTING.md) e [docs/ARQUITETURA.md](docs/ARQUITETURA.md)
para os módulos, contratos, decisões e próximas etapas.

O site é acessível a qualquer pessoa com o endereço. `noindex` orienta mecanismos
de busca e não restringe acesso. Histórico/checkpoints da interface ainda são da
sessão atual; contas, sincronização e salas continuam nas próximas etapas.

Código próprio sob MIT. Fontes/ícones e demais componentes conservam suas licenças
em [public/licenses](public/licenses/README.md); PDF.js e seus avisos ficam em
`public/vendor/pdfjs/`. A licença do código não cobre os livros ou marcas.
