# CritCall

Este aplicativo se chama CritCall e é dedicado às fichas de D&D, com
infraestrutura própria. O projeto Supabase exclusivo
do CritCall foi identificado e configurado localmente. A conexão com a API foi
conferida. O build já inclui a configuração pública, sem variables do GitHub;
o usuário confirmou cadastro, confirmação de e-mail e entrada no teste local.
Os retornos locais foram corrigidos e conferidos. O link de recuperação foi
aberto em outro navegador/dispositivo, incompatível com o fluxo atual. Após a
orientação, o usuário relatou sucesso na recuperação/troca no teste local em
16/10/2026. Salvamento pessoal e sincronização estão implementados/testados nesta
branch; a migração foi aplicada ao Supabase real em 16/10/2026. A validação
entre dispositivos reais e SMTP próprio ainda aguardam. A entrega foi autorizada
e publicada em **https://criticall.art/** em 16/10/2026; o estado da implantação
está nos [workflows](https://github.com/mhaetinger/D-D/actions).
Consulte [docs/LOGIN.md](docs/LOGIN.md). Para continuar em outro computador,
siga [docs/RETOMADA.md](docs/RETOMADA.md).

Aplicação de fichas individuais de D&D 5e, com criador, evolução, multiclasse,
grimório, inventário, anotações pessoais e consulta aos livros da mesa.
As regras são de 2014, com Patrulheiro Revisado; o seletor 2024 muda a apresentação.

## Executar

Use Node.js 22.12 ou superior (a série 22 está em `.nvmrc`) e npm:

```sh
npm ci
npm run dev -- --port 5174 --strictPort
```

Abra `http://localhost:5174/`, retorno já autorizado no Supabase. A porta 5173
pertence a outro aplicativo no ambiente original.
O aplicativo usa fontes, ícones e leitor locais, sem CDNs durante o uso.

Para conferir o que será publicado:

```sh
npm run build
npm run preview
```

Somente `dist/` é o artefato de publicação. Abrir `index.html` por `file://` não
executa a aplicação; use o servidor de desenvolvimento ou o build via HTTP/HTTPS.

## Entrada e aparência

Sem uma sessão, a página abre a entrada do CritCall com login, cadastro e
recuperação de senha. Depois de validar a conta, abre suas fichas ou a ação de
criar a primeira. Uma sessão já conhecida reabre o espaço correspondente,
inclusive a cópia offline validada anteriormente. A recuperação de senha usa a
tela de entrada antes de voltar às fichas. A entrada usa um tema escuro de grimório, com textura discreta, letras claras e
detalhes em dourado envelhecido. O símbolo enviado pelo responsável identifica
a entrada, a barra da ficha e o ícone do aplicativo.

**Continuar sem conta** mantém o acesso às fichas locais. A escolha dura nesta
aba; **← Tela inicial** retorna sem apagar os dados e a entrada mostra
**Voltar à sua ficha em andamento** quando houver ficha ou rascunho. Ao cadastrar
ou entrar, uma conta vazia recebe cópias das fichas, notas e imagens locais;
se já tiver fichas, pergunta se deseja acrescentar novas. A identidade precisa
estar confirmada e a coleção remota precisa ter sido consultada. Os originais
locais são preservados; o perfil informa falhas e permite retomar a cópia.

Cores, textura, tamanho de fonte e dados são preferências do usuário. No modo
local ficam neste navegador; na conta entram também na fila de sincronização.
A exibição **Clássica (2014) / Moderna (2024)** fica dentro da ficha e é salva por
personagem. As regras continuam sendo de 2014 com as adaptações da mesa. Trocar
a exibição não converte regras, classes ou escolhas.

## Dado flutuante e retratos

O dado começa recolhido ao abrir a aplicação ou trocar de conta. Mostra **20**
antes da primeira rolagem e depois o último total desta conta/aba. Clique para
abrir a bandeja; arraste para reposicionar. Um arremesso rápido do ícone rola
**um d20 normal**, sem bônus, vantagem ou alteração do pool já montado. A tecla
**R** faz a mesma rolagem; as setas movem o ícone. A bandeja também oferece
**Rolar d20 normal**. O modo OFF continua ocultando os dados.

No perfil, use **Alterar imagem do perfil**. Em cada ficha, clique no retrato ao
lado do nome, ou no retrato da lista de personagens. JPG/PNG/WebP de até **5 MB**
são recortados no centro e convertidos no navegador para WebP de até **256 × 256**
e **32 KB**; imagens acima de 32 MP/8192 px por lado são recusadas. O arquivo
original e seus metadados não são enviados. SVG/GIF não são aceitos.

As imagens usam Storage privado da conta; documentos/histórico guardam somente
referências. O navegador mantém cópias em IndexedDB por espaço e pode enviar
imagens escolhidas offline ao reconectar. Confira o envio no perfil. Uma imagem
não disponível sem rede mantém o ícone padrão. Fotos locais sem login continuam
separadas das contas. Os retratos não são embutidos no JSON do backup: as
referências funcionam na mesma conta, mas não levam os arquivos a outra conta.
A substituição usa o mesmo arquivo quando a referência não está compartilhada;
a recuperação de uma versão da ficha não restaura pixels antigos no servidor.

## Salvamento e backups

Fichas e notas mantêm uma cópia neste navegador. A branch inclui salvamento por
conta no Supabase com fila offline, perfil, preferências e versões recuperáveis;
**migração aplicada no projeto real; validação entre dispositivos reais pendente**.
Confira o estado de envio no perfil. Estar conectado não significa que tudo já
chegou à nuvem. `VITE_AUTH_ENABLED=false` permite uma edição apenas local.
Veja [docs/SINCRONIZACAO.md](docs/SINCRONIZACAO.md).
Ao reabrir a aplicação, a última ficha selecionada é restaurada. Se ela tiver
sido removida, abre a primeira ficha disponível.

Cada personagem tem sua própria linha do tempo, com desfazer/refazer e marcos.
Voltar um passo afeta somente essa ficha; notas pessoais e as outras fichas são
preservadas. A linha do tempo também permite restaurar fichas excluídas. O
histórico coletivo antigo é copiado por personagem sem apagar o original.

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
alterações ao reconectar; o banco real já recebeu a migração. Outro PC só recebe edições
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
O zoom livre mantém apenas a porcentagem atual na lista, junto dos atalhos fixos.

A [auditoria do Livro do Jogador](docs/AUDITORIA-LIVRO-2014.md) percorre todos os
capítulos/apêndices e distingue cálculo, consulta e pendências. Concentração
e vários efeitos condicionais ainda exigem controle manual.
A revisão aprofundada também reproduziu divergências de fórmulas/rolagens,
cura, transformação/descansos e recursos de alto nível. A primeira etapa de
correções unifica a fórmula mostrada/rolada, corrige os cenários de PV e usa
Dominar Magia/Assinatura no seletor de origem já existente. Componentes de
magias não ficam mais cortados na quebra de linha. O diagnóstico
`scripts/audit-phb-scenarios.cjs` usa somente personagens fictícios; o teste
`tests/audited-rules-browser.cjs` exige os resultados corrigidos na suíte.

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
o envio de fichas usa a fila própria, com migração aplicada e teste real entre
dispositivos ainda pendente.

Cada conta abre seu próprio espaço de fichas neste navegador. A cópia do espaço
sem conta depende do fluxo de entrada descrito acima, com novos identificadores
e sem substituir fichas existentes. Ao sair, as cópias são preservadas. Isso não
criptografa o dispositivo. A migração do banco foi aplicada; conferir a
confirmação de envio no perfil antes de trocar de computador. Login e
sincronização real entre dispositivos e SMTP próprio ainda precisam de validação/configuração.

## Criação guiada

A revisão de regras inclui armas importadas reconciliadas com o catálogo,
proficiência automática ou manual, bônus mágicos e seletor de mãos para armas
versáteis. O editor separa cálculo automático de valores adaptados. A CA escolhe
uma fórmula válida, permite seleção manual e explica cada parcela no balão.

Usos e estados aparecem nas respectivas **Características & escolhas**; pontos
de feitiçaria, Metamágica, Pacto e preparação usam os painéis do grimório.
Exaustão, Proteção Arcana e PV de Forma Selvagem ficam junto aos PV; ajustes
de defesa ficam junto à CA e a recuperação de Dados de Vida junto à sua lista.
Cada controle tem um único lugar e usa a reserva compartilhada correspondente.
Descansos recuperam conforme a origem; o longo
pergunta sobre alimento/bebida e a adaptação de recuperar todos os Dados de Vida.
A recuperação de metade dos Dados de Vida permite escolher a classe em multiclasse.
Dados adicionais de ataque mostram condições; alvos e duração são controlados pelo jogador.

PV temporários protegem a forma de besta antes de seus PV; Proteção Arcana é
externa a essas reservas. Ajustar Constituição pelos botões da ficha é uma
alteração permanente: muda os PV máximos por diferença de modificador e nível,
conservando o dano sofrido. Personagem a 0 PV permanece a 0. Descanso longo exige
1 PV no início; o curto preserva a Forma Selvagem, cuja duração segue manual.
A carga inclui moedas a cerca de 10 g cada, conforme o exemplar local.

Em **Dados de Vida · descanso curto**, escolha **Gastar** na classe desejada,
registre a face do dado físico ou use o virtual e aplique a cura. Gasta um dado
por vez, soma Constituição e limita aos PV máximos; o talento Resistente aplica
seu mínimo. Canção do Descanso é opcional quando ouvida e só soma uma vez entre
descansos, se o dado recuperar PV. Em Forma Selvagem, informe a Constituição da
besta: a cura vai para os PV da forma, preservando os humanos. Os dados virtuais
dessas ações não alteram o pool montado. OFF exige dado físico.
A 0 PV, resolva a estabilização antes de registrar o descanso curto e gastar.

A 0 PV aparecem sucessos/falhas e **Teste contra a morte**, com dado físico ou
virtual, bônus recebidos, 1/20 natural e estabilidade. **Dano detalhado** permite
registrar crítico; dano a 0 PV e dano maciço atualizam o estado. Temporários não
evitam falhas pelo dano recebido a 0; Proteção Arcana impede o dano absorvido.
Cura positiva limpa as contagens, mas cura comum e descanso não revivem. Após
uma ressurreição resolvida na mesa, use **Registrar retorno à vida**.

**★ Inspiração** usa a regra de 2014, com uma reserva por personagem. **Usar**
prepara vantagem para o próximo teste/ataque da ficha ou d20 do pool; desvantagem
cancela essa vantagem. **Usar na mesa** gasta após confirmação para jogar com
dado físico. Preparar pode ser cancelado; dano e arremesso rápido não gastam a
inspiração preparada. Não é a reserva de Inspiração de Bardo nem uma rerrolagem.
Tempo de descanso, Medicina, ressurreição, fontes de bônus e gatilhos de classe
que evitam cair a 0 PV continuam dependendo da resolução da mesa.

Magias que precisam de preparo só oferecem lançamento normal quando preparadas;
Domínio/Círculo/Juramento ficam **Sempre Preparadas**. Ritual de mago no grimório
continua disponível sem preparo e sem gastar espaço. Pacto mantém reserva própria.
Dominar Magia e Assinatura aparecem no seletor junto aos espaços, sem duplicar
magias: a assinatura tem um uso por magia entre descansos; aprimorar exige
escolher um espaço explicitamente. A assinatura esgotada não troca de origem
sozinha. Rajada Mística/Raio Ardente mostram o número de feixes/raios e rolam
dano por acerto; **Dano por raio** repete a rolagem sem lançar/gastar de novo.

O modo de atributos **Livre / Adaptado** é separado dos 27 pontos. Sugestões de
personalidade usam seletores compactos e continuam editáveis livremente.
No livro, Ctrl/Cmd + rodinha, +, − e 0 ajustam apenas a página do PDF.
Backups novos usam `critcall.character-backup`; os antigos continuam importáveis.

O assistente explica cada etapa, oferece as nove tendências do livro ou texto
livre, e mostra descrições de perícias, idiomas, ferramentas e escolhas. As
consultas recolhidas só abrem com clique. Personalidade, ideais, vínculos e
defeitos têm sugestões editáveis dos 13 antecedentes do livro local.

Compra de pontos usa +/−, com custos crescentes e limite imediato de 27. Conjunto
padrão e resultados de 4d6 usam peças: arraste ou selecione por clique/teclado e
escolha o destino. Mover para um destino ocupado troca as peças, sem duplicar
valores. A rolagem tem animação, respeitando movimento reduzido.

Na evolução, o Incremento no Valor de Habilidade reutiliza a grade dos seis
atributos: distribua dois pontos com +/− e confira os valores atuais/finais.
O limite de 20 é imediato; você pode devolver pontos antes de concluir.

Fechar a criação conserva o rascunho neste navegador, por espaço. **+ Novo**
retoma o rascunho; concluir remove-o somente se a ficha tiver sido salva. Se
houver outro rascunho na conta ao vincular dados locais, ele é preservado e o
recebido fica na fila para a próxima criação. Rascunhos ainda não são fichas
sincronizadas e não fazem parte do backup JSON de personagens.

O livro aberto pela ficha recebe tema, textura e tamanho de fonte no link, sem
identificadores da conta. O PDF permanece intacto. O dado abre e recolhe com
animação de expansão; a versão recolhida não tem moldura retangular.

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

`npm run test:database` usa PostgreSQL 16 descartável em Docker por padrão,
verificando RLS/RPC, concorrência e as políticas de imagens. Sem Docker,
`CRITCALL_TEST_POSTGRES_BIN=/caminho/dos/binarios npm run test:database` cria uma
instância descartável com `initdb`/`pg_ctl`, sem TCP ou banco existente. Essa
alternativa passou também com PostgreSQL 18.6. A CI mantém Docker/PostgreSQL 16.

## Desenvolvimento e publicação

Migração para Cloudflare em preparação, após o usuário criar a conta. O roteiro
está em [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md); a configuração de publicação
descrita abaixo continua sendo a atual até a transição revisada. O workflow já
aceita o destino opcional Cloudflare pelo mesmo artefato verificado; as variáveis
e os Secrets necessários estão no roteiro. Nenhuma publicação foi ativada.

Branches por tarefa seguem para `develop`; uma entrega revisada segue para
`main`. Não fazer push direto à `main`. A pipeline verifica tipos, testes,
build e navegador; somente um push na `main` pode publicar `dist/` no Pages.
Para essa nova estrutura, a fonte do Pages deve ser **GitHub Actions**. Não publicar
a raiz com os arquivos de desenvolvimento. A primeira versão já está em
[mhaetinger.github.io/D-D](https://mhaetinger.github.io/D-D/), integrada pelas
PRs #1/#2 e verificada em 15/10/2026. O login desta branch ainda aguarda ativação.

O usuário confirmou a compra de `criticall.art` na Hostinger em 16/10/2026.
Confirmou OK no DNS check do GitHub e na Cloudflare. Consulta pública confirmou
nameservers Cloudflare, HTTPS na raiz e retorno de `www`. A hospedagem ainda é
GitHub Pages; migração para Cloudflare Pages e login no domínio aguardam validação.
O retorno novo já foi aceito pelo Supabase. O procedimento está em [docs/DOMINIO.md](docs/DOMINIO.md).

Veja [CONTRIBUTING.md](CONTRIBUTING.md) e [docs/ARQUITETURA.md](docs/ARQUITETURA.md)
para os módulos, contratos, decisões e próximas etapas.
O [guia da primeira publicação](docs/PRIMEIRA-PUBLICACAO.md) reúne a entrega,
as verificações, o pacote de revisão no GitHub e os passos para ativar o site.

O site é acessível a qualquer pessoa com o endereço. `noindex` orienta mecanismos
de busca e não restringe acesso. Histórico/checkpoints da interface ainda são da
cache pessoal e entram na fila da branch; validação real entre dispositivos,
publicação e salas seguem pendentes.

Código próprio sob MIT. Fontes/ícones e demais componentes conservam suas licenças
em [public/licenses](public/licenses/README.md); PDF.js e seus avisos ficam em
`public/vendor/pdfjs/`. A licença do código não cobre os livros ou marcas.
