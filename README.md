# CritCall

Este aplicativo se chama CritCall e é dedicado às fichas de D&D. Orbyt é outro
projeto do responsável e usa infraestrutura separada. O projeto Supabase novo
do CritCall foi identificado e configurado localmente. A conexão com a API foi
conferida. O build já inclui a configuração pública, sem variables do GitHub;
o usuário confirmou cadastro, confirmação de e-mail e entrada no teste local.
Os retornos locais foram corrigidos e conferidos. O link de recuperação foi
aberto em outro navegador/dispositivo, incompatível com o fluxo atual. Após a
orientação, o usuário relatou sucesso na recuperação/troca no teste local em
16/10/2026. Salvamento pessoal e sincronização estão implementados/testados nesta
branch; falta aplicar a migração no Supabase real e validar entre dispositivos
reais. Ativação pública e SMTP próprio também aguardam.
Consulte [docs/LOGIN.md](docs/LOGIN.md).

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

Fichas e notas mantêm uma cópia neste navegador. A branch inclui salvamento por
conta no Supabase com fila offline, perfil, preferências e versões recuperáveis;
**falta aplicar a migração no projeto real e validar a sincronização real**.
Confira o estado de envio no perfil. Estar conectado não significa que tudo já
chegou à nuvem. `VITE_AUTH_ENABLED=false` permite uma edição apenas local.
Veja [docs/SINCRONIZACAO.md](docs/SINCRONIZACAO.md).
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
uma cópia previamente baixada fora do leitor integrado. A fila da branch envia
alterações ao reconectar, após ativação do banco. Outro PC só recebe edições
offline depois de seu envio.

Atualizações aguardam as abas anteriores fecharem, sem recarregar uma edição em
curso. O cache do aplicativo não contém as fichas nem apaga o armazenamento do jogador.

## Livros

Em **Consultar livro**, escolha Jogador ou Mestre, navegue até uma página, ajuste
o zoom ou abra/baixe o PDF. Os links de magias e características abrem na página
do Jogador correspondente. Os dois exemplares foram incluídos a pedido do
responsável pelo projeto; veja [public/books/README.md](public/books/README.md).

O leitor PDF.js é hospedado junto do aplicativo e tem texto selecionável. Os
balões e consultas do criador também oferecem as descrições das regras.

## Login em desenvolvimento

O fluxo escolhido é e-mail/senha no Supabase, em um projeto separado do outro
aplicativo do responsável. Consulte [docs/LOGIN.md](docs/LOGIN.md) para cadastro,
confirmação, recuperação, configuração pública incluída e overrides locais.
Não é necessário configurar variables no GitHub para esse build. Senhas não são
guardadas pela ficha nem incluídas em backups. **Reenviar confirmação de e-mail**
atende cadastros pendentes; **Esqueci a senha** inicia a recuperação. Quem já
entrou pode usar **Enviar link para trocar senha**, sem sair da conta.
E-mail/senha permitem entrar em outros navegadores e dispositivos. Os links de
confirmação/recuperação exigem o mesmo navegador/dispositivo que os solicitou;
o envio de fichas usa a fila própria, que ainda aguarda ativação real.

Cada conta abre seu próprio espaço de fichas neste navegador; entrar não adota
as fichas anteriores do modo local. Ao sair, as cópias são preservadas. Isso não
criptografa o dispositivo. O cliente envia os dados da conta após a migração;
até aplicá-la, o perfil informa que a nuvem não está configurada. Login e
sincronização publicados e SMTP próprio ainda não foram ativados.

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
O teste de login compila um artefato temporário com projeto fictício e respostas
HTTP controladas, sem criar usuários reais ou depender das credenciais do ambiente.

`npm run test:database` requer Docker e usa PostgreSQL 16 descartável para
verificar RLS, RPC e concorrência. A CI executa essa verificação adicional.

## Desenvolvimento e publicação

Branches por tarefa seguem para `develop`; uma entrega revisada segue para
`main`. Não fazer push direto à `main`. A pipeline verifica tipos, testes,
build e navegador; somente um push na `main` pode publicar `dist/` no Pages.
Para essa nova estrutura, a fonte do Pages deve ser **GitHub Actions**. Não publicar
a raiz com os arquivos de desenvolvimento. A primeira versão já está em
[mhaetinger.github.io/D-D](https://mhaetinger.github.io/D-D/), integrada pelas
PRs #1/#2 e verificada em 15/10/2026. O login desta branch ainda aguarda ativação.

O usuário propôs `critcall.com.br` para o acesso. Registro, DNS e ativação ainda
estão pendentes; o procedimento está em [docs/DOMINIO.md](docs/DOMINIO.md).

Veja [CONTRIBUTING.md](CONTRIBUTING.md) e [docs/ARQUITETURA.md](docs/ARQUITETURA.md)
para os módulos, contratos, decisões e próximas etapas.
O [guia da primeira publicação](docs/PRIMEIRA-PUBLICACAO.md) reúne a entrega,
as verificações, o pacote de revisão no GitHub e os passos para ativar o site.

O site é acessível a qualquer pessoa com o endereço. `noindex` orienta mecanismos
de busca e não restringe acesso. Histórico/checkpoints da interface ainda são da
cache pessoal e entram na fila da branch; ativação remota e salas seguem pendentes.

Código próprio sob MIT. Fontes/ícones e demais componentes conservam suas licenças
em [public/licenses](public/licenses/README.md); PDF.js e seus avisos ficam em
`public/vendor/pdfjs/`. A licença do código não cobre os livros ou marcas.
