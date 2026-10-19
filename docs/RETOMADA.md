# Retomada do CritCall em outro PC

Estado conferido em **19/10/2026**. Este documento permite continuar sem o
histórico da conversa. Leia também `AGENTS.md`, `README.md`, `CHANGELOG.md` e
`docs/ARQUITETURA.md` antes de alterar o projeto.

## Abrir a versão em desenvolvimento

Repositório: https://github.com/mhaetinger/D-D.
Branch atual: **`feature/regras-universais`**, baseada no histórico público de `develop`.
A criação guiada foi integrada pelas PRs #7/#8. A revisão atual está em
[REFATORACAO-2014.md](REFATORACAO-2014.md): regras/recursos, armas/CA,
preparação, textos, criador, zoom, moeda e migração de identificadores.
Não mesclar/publicar esta revisão sem aprovação. A branch remota `develop`
foi restaurada após a entrega na referência de integração já aprovada
`b1155fbc5d14a566f548814bd808374aa2383721`, merge da PR #7.
A revisão inicial teve 260 testes Node aprovados, tipos/build e nove roteiros Chromium;
detalhes das execuções e limites em `REFATORACAO-2014.md`.
Após teste do responsável, os controles foram incorporados aos lugares existentes,
eliminando o painel redundante sob as armas. Esta revisão tem 261 testes Node e
Chromium de regras/ficha/armazenamento; ver a tabela de localização no mesmo plano.
O incremento da evolução passou a usar a grade +/− da criação. Esta revisão tem
262 testes Node, tipos/build e Chromium de regras/evolução e criação aprovados.
Na revisão seguinte, zoom deixa de acumular porcentagens, cada ficha ganha
histórico próprio (com migração preservando o coletivo e recuperação de excluídas)
e os ajustes de defesa têm espaçamento e ajuda nos sete itens. O levantamento
amplo está em [AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md): há lacunas
confirmadas, inclusive iniciativa/passivos e componentes cortados, além de
concentração/morte/condições ainda manuais. Essas pendências não estão implementadas.
A segunda passada da auditoria, na base `7667ae9`, reproduziu 20 divergências em
21 cenários direcionados, incluindo truque mostrado/rolado, cura/modificador e
espaço maior, invocação, magia racial, Dominar/Assinatura, PV/transformação,
descansos, proteção multiclasse e opção de talento. Ver os itens 15–27 e a matriz
dos 42 talentos no relatório. Rodar `npm run build` antes de
`node scripts/audit-phb-scenarios.cjs`; `matches: false` é achado da auditoria,
não um teste de aprovação falhando. Não tratar a passagem dos 266 testes existentes
como cobertura dessas combinações. A implementação da ficha não mudou nesta etapa.
Verificação desta revisão: `npm run check`, 266 testes Node, tipos/build e nove
roteiros Chromium aprovados, incluindo login também sob `/`. A consulta ao
Supabase real confirmou o contrato existente por leitura de metadados; nenhum
SQL/RLS/RPC ou dado pessoal foi alterado.
A versão anterior, com entrada/dado/retratos e correção do cache HTTP, foi
integrada pelas PRs #3–#6. A implantação da correção concluiu no workflow
[38954994107](https://github.com/mhaetinger/D-D/actions/runs/38954994107).
Os pedidos atuais estão em [PLANO-EXPERIENCIA.md](PLANO-EXPERIENCIA.md):
continuidade sem conta, criação orientada (incluindo escolha de PV no 1º nível,
equipamento inicial por pacotes ou riqueza/compras do Capítulo 5 com adaptação
livre, balão de consulta rolável sem bloquear clique ou reabrir na seleção,
limpeza de marcadores `U+F0B7` do PDF, recorte de bordas em modais roláveis e
cabeçalho compacto), distribuição por peças, animação do dado e tema no livro.
Esta alteração ainda depende da revisão da PR antes de integrar e publicar. Não
levar dados pessoais nem a pasta local `Bugs/` para o Git.
Cloudflare está ativa no DNS; hospedagem Pages e repositório privado continuam
dependentes da configuração descrita em [CLOUDFLARE.md](CLOUDFLARE.md).

Em uma pasta nova, com Node.js **22.12 ou superior** e Git:

```sh
git clone --branch feature/regras-universais --single-branch https://github.com/mhaetinger/D-D.git CritCall
cd CritCall
npm ci
npm run dev -- --port 5174 --strictPort
```

Abra **http://localhost:5174/**. A configuração pública do Supabase acompanha
o código; não é necessário copiar `.env.local` nem criar variables no GitHub.
Se já houver clone, preserve alterações locais, faça `git fetch origin`,
selecione a branch atual e atualize com `git pull --ff-only`.
Não usar `reset --hard` para atualizar uma pasta com trabalho pendente.

O outro PC não precisa da pasta `.public-worktree`: o clone público já é a
aplicação. Na máquina anterior, ela fica em `.public-worktree`; a raiz é um
protótipo privado separado. **Nunca enviar `prototype-local`, suas tags ou o
commit privado `e13922d`; não mesclar esse histórico ao público.**

## O que foi feito

- Login por e-mail/senha: cadastro, confirmação, reenvio, recuperação, troca
  pelo link PKCE, sessão e saída. Usuário relatou sucesso no teste local.
- Nome do jogador salvo ao digitar, com aviso se o navegador recusar a gravação.
- Sincronização por conta de fichas completas, notas privadas separadas, perfil,
  preferências persistidas, histórico/checkpoints e cópias de recuperação.
- Fila offline transacional em IndexedDB, operações idempotentes, revisões,
  calibração do relógio e confirmação de envio. Edições durante um envio ficam
  pendentes. Atualizações remotas aguardam campos/editores em uso.
- Concorrência escolhe a data mais recente e preserva ambas as versões.
  Exclusões usam tombstones. Restaurar uma ficha não restaura suas notas.
  Não existe mesclagem automática campo a campo.

Código principal no commit `8e94a9e7da6b4eec346ff1fd3a0447c94f5e58c0`.
Os commits seguintes atualizam ativação e retomada; usar a ponta da branch.
Contratos e limites: [SINCRONIZACAO.md](SINCRONIZACAO.md).

## Supabase real: migração aplicada

Usar exclusivamente **`qhrpgkpvwbztubnrdhya`**,
https://qhrpgkpvwbztubnrdhya.supabase.co. No painel, o projeto aparece como
**D-D**; o aplicativo se chama **CritCall**, com infraestrutura exclusiva.

Em 16/10/2026 a conexão administrativa funcionou. Inspeção inicial: sem tabelas
em `public`, sem migrações e sem as duas RPCs. Foi aplicado pelo conector o SQL
de `supabase/migrations/202610160001_personal_sync.sql`, com nome `personal_sync`.
O Supabase registrou a versão **`20261016101143`**. Essa é a correspondência entre
o arquivo local e a migração remota; não criar outra migração para fingir que a
anterior não foi aplicada, nem executar `db push` sem reconciliar o histórico.

Conferência real: tabelas `critcall_documents`/`critcall_versions` com RLS,
SELECT apenas do dono autenticado, nenhuma escrita direta do cliente. RPCs
`critcall_save_document`/`critcall_sync_clock` têm caminho de busca vazio e não
podem ser executadas por `anon`. API anônima das tabelas recusou com 401/42501.
Smoke SQL no PostgreSQL 17 real passou: escrita, idempotência e bloqueios de
leitura/escrita entre identidades e de dono incorreto no relógio. Usuário e
documento fictícios do teste foram revertidos em uma transação com ROLLBACK.
Não foram lidas fichas/notas reais. Isso **não comprova** o fluxo completo de
sincronização real entre navegadores ou dispositivos.

## Ao trocar de PC

**Git transporta código e documentação; fichas pessoais e filas offline não
entram no repositório.** No PC de origem, conferir no perfil
**“Salvo no Supabase · atualizado neste dispositivo.”**. Se houver pendências,
manter a origem disponível para reconectar e baixar backup com notas incluídas
antes de fechar. O backup atual exporta fichas/notas opcionais, sem todo o diário.

Entrar com a mesma conta no novo PC deve receber a versão já enviada. Uma edição
offline só chega a outro dispositivo depois do envio pela origem. Fichas do modo
sem login ficam preservadas nesse espaço. O formulário de entrada pode vincular
cópias à conta confirmada, perguntando antes se ela já tiver fichas; veja
[SINCRONIZACAO.md](SINCRONIZACAO.md). Rascunhos ficam locais até concluir a ficha.

Login normal funciona em outros navegadores. Confirmação/recuperação PKCE exige
abrir o link no mesmo navegador, dispositivo e endereço que iniciou o pedido.
Pode iniciar uma recuperação no novo PC e concluí-la nele. Nunca colar senhas,
links com tokens ou chaves secretas na conversa/Git.

## Próximos passos

1. Validar no aplicativo real: mesma conta em dois navegadores/PCs, nome,
   fichas/notas, offline/reconexão, conflito e restauração. Conferir isolamento
   com outra conta real. Não solicitar credenciais do usuário para fazer isso.
2. Configurar SMTP próprio antes de liberar cadastro aos jogadores. O envio
   padrão do Supabase ainda tem restrições. Usuário confirmou compra só do domínio,
   sem e-mail; proposta de provedor em [DOMINIO.md](DOMINIO.md). Revisar os avisos do serviço
   registrados em [SINCRONIZACAO.md](SINCRONIZACAO.md).
3. Acompanhar a entrega autorizada pelo responsável por PR para `develop` e
   depois para `main`. Não fazer push direto à `main`. Conferir o workflow e a
   entrada nova em https://criticall.art/ após a implantação.
4. Domínio **criticall.art**, comprado pelo usuário na **Hostinger**, conforme
   confirmação em 16/10/2026. Usuário informou configurações feitas e DNS em
   verificação no GitHub. Os quatro A da raiz já estão corretos no servidor DNS;
   o CNAME de `www` também foi corrigido para `mhaetinger.github.io`. Supabase
   aceita o retorno novo. Usuário criou conta Cloudflare e quer preparar a
   migração com código privado e crescimento por planos. Próximos passos em
   [CLOUDFLARE.md](CLOUDFLARE.md). DNS e HTTPS já conferidos após o usuário confirmar
   OK no GitHub/Cloudflare; a hospedagem continua GitHub Pages. Publicação nova pendente.
   Preservar/exportar dados da origem anterior antes de ativar redirecionamentos.
5. Priorizar a base individual; mesas, permissões de mestre e voz/vídeo
   são etapas seguintes. Nenhuma ficha individual depende de mesa.

Site URL atual: `https://criticall.art/`. Usuário confirmou retornos
permitidos `http://localhost:5174/` e `http://127.0.0.1:5174/`. Na máquina anterior,
5173 é de outro aplicativo. As configurações administrativas de Auth/SMTP não
foram alteradas por esta ativação do banco.

## Verificações já executadas

No commit de implementação: `npm run check` passou com **168 testes Node**,
tipos/build e cinco roteiros Chromium; `npm run test:database` passou em
PostgreSQL 16 descartável. Incluídos duas instalações simuladas da mesma conta,
outra conta, fila/recarga offline, reconexão, conflitos, restauração e notas.
Modal de versões também passou nos três temas, 320 px/fonte GG, conteúdo hostil
sem execução e rodinha contida. Auditoria de produção: zero vulnerabilidades.

CI de `8e94a9e` concluída com sucesso, tanto
[PR](https://github.com/mhaetinger/D-D/actions/runs/38856854875) quanto
[push](https://github.com/mhaetinger/D-D/actions/runs/38856851273), incluindo DB.
Essas execuções usam dados fictícios e não substituem a validação real pendente.
Os ajustes desta retomada são documentais, com revisão de diff.

Para repetir após mudanças funcionais pertinentes:

```sh
npx playwright install chromium
npm run check
npm run test:database
```

O último comando é separado de `check` e requer Docker. Não é requisito para
abrir a aplicação. Não repetir toda a bateria apenas por mudanças documentais.

### Verificação nesta máquina — 16/10/2026

Após instalação limpa com `npm ci` e correção da recuperação da fila, passou
`npm run check`: **171 testes**, tipos/build, configuração pública, cache offline
e os cinco roteiros Chromium. Login e sincronização usam HTTP controlado nos testes;
isso não substitui a conferência com contas/dispositivos reais.

A falha foi reproduzida antes da correção: uma transação recusada podia fazer a
tentativa seguinte ignorar a edição e carregar a versão anterior. A recuperação
agora parte da projeção persistida. Três regressões Node e o roteiro Chromium
cobrem a falha, inclusive uma tentativa já agendada e a preservação da atualização
remota concorrente. Não foram apagados dados nem alterado o formato da fila.

O Playwright fixado não reconheceu Ubuntu 26.04. A instalação do Chromium e os
roteiros passaram usando `PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64`
nesses comandos, sem alterar as dependências do projeto. A CI continua no Ubuntu
24.04. Docker não está instalado nesta máquina: `test:database` não foi repetido.
Não houve alteração de SQL/RLS/RPC.

Auditoria de produção sem alertas; os avisos da cadeia de desenvolvimento seguem
documentados. O projeto Supabase correto foi confirmado ativo, com os avisos do
serviço já registrados em SINCRONIZACAO.md. O destino de recuperação foi conferido
no serviço real para domínio novo e retornos locais, sem usuários/e-mails envolvidos.
Servidor de desenvolvimento iniciado em `http://localhost:5174/` para a conferência
manual. Sincronização real, SMTP, HTTPS do site e publicação seguem pendentes.

Texto para iniciar outra conversa: “Continue o CritCall na branch
feature/login-email; leia AGENTS.md e docs/RETOMADA.md e confira o estado real
antes de alterar. A migração Supabase personal_sync já foi aplicada.”

### Preparação da publicação Cloudflare

Workflow opcional implementado e ainda não ativado. Zona criada com nameservers
`noel.ns.cloudflare.com` e `raegan.ns.cloudflare.com`; ativação confirmada pelo
usuário e nameservers conferidos por consulta. Criar Pages Direct Upload com produção `main` e configurar os Secrets e
Variables listados em [CLOUDFLARE.md](CLOUDFLARE.md). Preservar revisão por PR.
Corrigida recarga offline com redirecionamentos HTML do Pages, incluindo `/book`.
Não houve publicação, mudança de visibilidade ou envio de fontes nesta preparação.

Verificação desta preparação: actionlint, diff, 171 testes Node, tipos/build,
cinco roteiros Chromium e emulador local do Pages passaram. Teste de banco não
repetido nesta máquina sem Docker; SQL/RLS/RPC permaneceram iguais.

### Entrada principal e preferências visuais

Pedido seguinte do usuário: abrir primeiro a tela de login com a marca enviada,
antes de criar/abrir fichas; deixar 2014/2024 apenas como exibição dentro da ficha
e conservar cores/texturas ao retornar. Implementação local em `src/auth/entry.ts`
e `src/styles/access.css`; reutiliza o formulário existente de login/recuperação.
`public/icons/logo.png` e `icon.png` foram enviados pelo responsável para uso aqui.
Sem conta, a página agora mostra a entrada: escolher **Continuar sem conta** para
acessar as fichas locais anteriores. Saída volta à entrada; sessão conhecida abre
a ficha diretamente. Preferências continuam por conta, e exibição por personagem.
Não houve mudança de banco, serviço de autenticação ou publicação nesta etapa.
Repositório privado continua dependente da transição da hospedagem para Pages.

Verificação da entrada: `npm run check` passou com 171 testes, tipos/build e os
cinco roteiros Chromium. Os testes de auth cobrem `/` e `/D-D/`, entrada antes da
ficha, recuperação/cancelamento e restauração visual por conta. A sincronização
com HTTP simulado conferiu tema, textura, fonte e exibição em dois navegadores.
Revisão visual da entrada em desktop/celular e ficha com textura concluída.
Servidor local em 5174 continua respondendo; janela anônima mostra a nova entrada.

### Tema escuro e DNS aprovado

Usuário pediu entrada com aspecto de grimório antigo e paleta discreta/escura.
Ajustados somente a apresentação da entrada e os registros desta retomada:
textura procedural leve, tons de carvão/couro, texto em marfim e dourado envelhecido.
Símbolo original preservado; nome CritCall em texto legível sobre fundo escuro.

Usuário confirmou DNS check OK no GitHub e Cloudflare. Consulta pública confirmou
nameservers Cloudflare; HTTPS 200 com certificado aceito em `criticall.art` e
301 → 200 de `www` para a raiz. A hospedagem ainda responde como GitHub Pages.
Criar/configurar Cloudflare Pages e concluir a transferência antes de tornar o
repositório privado. Nenhuma mudança de DNS, hospedagem ou visibilidade nesta etapa.

Verificação do tema: 171 testes Node, tipos/build e Chromium de auth em `/` e
`/D-D/` passaram. Revisão visual desktop/celular e smoke 320px/fonte GG nos três
modos de acesso, sem transbordamento. Conferidos contraste dos pares principais e
preferências da ficha preservadas. Nenhuma alteração SQL/RLS/RPC nesta etapa.

### Dado compacto e retratos — 16/10/2026

Implementados dado fechado ao abrir/logar, último total (20 inicialmente), textura,
arraste, arremesso rápido para d20 normal, clique para abrir e R/setas no teclado.
O pool existente não é alterado pelo arremesso. Posição normalizada por espaço e
limites do viewport; resultado só na aba. Código novo em `src/app/dice-dock.ts`.

Usuário escolheu enviar imagens próprias com redução. Perfil e cada personagem
aceitam JPG/PNG/WebP até 5 MB, limitados a 32 MP/8192 px. Conversão central para
WebP de até 256 px/32 KiB antes do envio. `src/media/` mantém cache/fila IndexedDB
por conta e arquivos no Storage privado; documentos guardam só referências.
O JSON de backup não embute pixels; referências não transferem fotos a outra conta.
Substituir não restaura versões binárias antigas ao recuperar histórico da ficha.

Supabase CritCall `qhrpgkpvwbztubnrdhya` confirmado antes de alterar. Aplicada
`private_avatars` (local `20261016184740_private_avatars.sql`, remota
`20261016184938`), com bucket/limites/RLS conferidos. Não reaplicar para reconciliar
os timestamps. Advisors anteriores permanecem; nenhuma mudança em outro projeto.
Teste de banco passou em PostgreSQL 18.6 local descartável, pois Docker continua
ausente. A CI mantém PostgreSQL 16/Docker. Instruções no README.

Verificação final: 175 testes Node e tipos/build passaram. Os seis roteiros
Chromium passaram (check completo com 174 testes, seguido do novo caso de arquivo
com MIME disfarçado e build/dado). Imagens testadas com SDK real e HTTP simulado:
dois navegadores, fila offline, conta B isolada, download atrasado após troca e
cópia de ficha sem sobrescrever a foto original. Banco/RLS/storage passaram em
PostgreSQL 18.6 local descartável. Revisão visual em celular/três temas/GG e dado
compacto. Configuração do bucket real conferida; upload com conta/dispositivo real
e publicação ainda aguardam validação do usuário. Servidor local segue em 5174.

### Estado em 17/10/2026 — Kael completo, aba inicial, balões da criação e ícones temáticos de magias

1. **Ficha completa do Kael (`Ficha Kael.pdf` + base HTML original):**
   - O PDF pessoal `/home/mateus/Downloads/RPG/Ficha Kael.pdf` e o backup gerado
     `/home/mateus/Downloads/critcall-kael-darkwood.json` permanecem fora do Git
     (gerador auxiliar em `/tmp/generate-kael-backup.cjs`).
   - O arquivo `/home/mateus/Downloads/critcall-kael-darkwood.json` agora contém
     100% dos dados do PDF e do HTML original:
     - **Feiticeiro (Magia Selvagem) 6 / Bruxo (O Corruptor) 1**, Meio-Elfo,
       Sábio (Astrônomo), Caótico e Bom, idade `73`, altura `1,79 m`, peso `79 kg`,
       olhos `Amarelo`, pele `Clara`, cabelos `Brancos`.
     - **18 magias completas:**
       - **Círculo 0 (7 truques):** *Toque Arrepiante*, *Amizade*, *Raio de Fogo*,
         *Raio de Gelo*, *Mensagem* (Feiticeiro), *Rajada Mística* e *Ilusão Menor*
         (Bruxo).
       - **1º Círculo (7 magias):** *Mísseis Mágicos* (`canTwin: true`), *Armadura
         Arcana*, *Disfarçar-se* (Feiticeiro), *Bruxaria (Hex)*, *Recuo Acelerado*
         (Bruxo), *Invocar Familiar (Ritual)* e *Compreender Idiomas (Ritual)*
         (via talento *Conjurador de Ritual* no nível 4 de Feiticeiro).
       - **2º Círculo (2 magias):** *Névoa de Adagas* (`bookId: "nuvem-de-adagas"`)
         e *Despedaçar*.
       - **3º Círculo (2 magias):** *Bola de Fogo* (`bookId: "bola-de-fogo"`) e
         *Relâmpago* (`bookId: "relampago"`).
     - **Metamagia:** *Magia Acelerada* e *Magia Duplicada*.
     - **Perícias, armas e história:** `customSkillBonuses` idênticos aos valores
       da ficha PDF, armas *Besta leve* (`1d8+1`, Perfurante) e *Faca pequena
       (Adaga)* (`1d4+1`, Cortante/Perfurante), aparência e história completas
       palavra por palavra.

2. **Aba inicial e painel de Truques (`src/app/sheet.js`):**
   - A ficha inicia na aba **1. Atributos & Combate** (`currentTab = "main"`),
     inclusive ao ativar o espaço de trabalho da conta (`activateAccountWorkspace`).
   - O painel **Truques (Círculo 0)** inicia aberto (`collapsedPanels = {}`).

3. **Rolagem do balão `#ruleTooltip` e fim de informações duplicadas na criação
   (`public/rules/character-wizard.css`, `public/rules/rule-tooltips.js`,
   `public/rules/character-wizard.js`):**
   - `.rule-tooltip` passou a ter `pointer-events: auto` e `data-scroll-window`:
     o balão permanece estacionário uma vez aberto para permitir levar o mouse
     até a barra de rolagem sem fechar, e a rodinha do mouse (`wheel`) rola o
     `#ruleTooltip` diretamente quando o texto excede a altura do balão.
   - Seletores (`<select>`), opções já selecionadas (`o.value === value`),
     caixas de seleção (`.cw-options`) e cabeçalhos de ganhos de classe que já
     exibem a seção `<details class="cw-source">` logo abaixo não recebem
     `data-rule-tooltip`, evitando exibir a mesma descrição duas vezes.

4. **Ícones e etiquetas temáticas nas magias (`public/rules/character-engine.js`,
   `src/app/icons.ts`, `src/styles/sheet.css`, `src/app/sheet.js`,
   `public/rules/character-wizard.js`):**
   - `CharacterEngine.spellMeta(entry)` e `toSheetSpell` classificam todas as
     361 magias do catálogo com tipo de dano/efeito (`fogo`, `frio`/`gelo`,
     `eletrico`, `energia`, `necrotico`, `trovejante`/`trovao`, `cortante`,
     `perfurante`, `concussao`, `acido`, `veneno`, `psiquico`, `radiante`,
     `cura`, `defesa`, `utilidade`), ícone SVG Lucide correspondente (`flame`,
     `snowflake`, `zap`, `sparkles`, `skull`, `cloud-lightning`, `swords`,
     `droplets`, `brain`, `sun`, `heart-pulse`, `shield`, `wand-2`), formato de
     alvo/área (`mira`, `multi`/`auto`, `esfera`, `cilindro`, `cone`, `linha`,
     `cubo`, `pessoal`/`self`, `ritual_inv`/`ritual`) e defesa/resistência
     (`atq_magico`, `tr_*`, `auto_hit`), exibindo esses indicadores tanto no
     grimório da ficha quanto na etapa de magias do criador.

5. **Apresentação Clássica/Moderna sem poluir o histórico:**
   - Os botões exibem somente **Clássica** e **Moderna** e não criam passos no
     histórico da ficha.

6. **Verificações executadas em 17/10/2026:**
   - `npm test` (**190/190** testes Node aprovados).
   - `npm run build` concluído sem erros (`tsc`, `check-auth-config`, `vite build`,
     `build-offline`).
   - Roteiros Playwright Chromium aprovados: `tests/creation-browser.cjs`,
     `tests/sheet-browser.cjs`, `tests/app-browser.cjs` e verificação dedicada
     da importação do Kael, aba inicial, rolagem do `#ruleTooltip` e ícones
     temáticos das magias.

### Como retomar em um novo terminal

- Para reabrir exatamente esta conversa no `agy`, você pode usar o seletor de
  conversas do `agy` (ou `agy --help` para ver a flag de retomada de sessão).
- Se iniciar uma conversa nova do zero, basta colar:
  > Continue o projeto CritCall na branch `feature/regras-universais`. Leia
  > `AGENTS.md`, `docs/RETOMADA.md`, `docs/REFATORACAO-2014.md` e `CHANGELOG.md`
  > para carregar o contexto e as verificações das alterações de 19/10/2026.
