# Salvamento pessoal e sincronização

## Estado

Cliente, fila e migrações estão implementados e publicados no CritCall.
O projeto exclusivo é **`qhrpgkpvwbztubnrdhya`**, URL pública
`https://qhrpgkpvwbztubnrdhya.supabase.co`, identificado como D-D no painel na
inspeção de 16/10/2026. Nesse dia foram aplicadas as migrações descritas abaixo,
sem alterações em outros projetos. A publicação atual e as validações externas
pendentes estão somente na [RETOMADA.md](RETOMADA.md). O responsável confirmou
e-mails e envio imediato entre telefone/computador. Os testes controlados não
certificam os cenários adicionais de conflito/offline e isolamento com contas reais.

## Dados e fila

Sincronizam-se fichas completas, anotações pessoais separadas, nome, ficha ativa,
tema/fundo/fonte, preferências de dados/bandeja, histórico/checkpoints e cópias
de recuperação. A lista de preferências fica em `src/storage/preferences.ts`.
Nome é salvo ao digitar; falha mantém o texto e não anuncia sucesso. Senhas e
tokens não são documentos nem backups. Editores ainda não confirmados mantêm
seu fluxo de salvar/descartar; pool temporário, buscas, animações e painéis
abertos não são registros da ficha.

O histórico de edição usa um documento `preference` independente por personagem,
`dnd_character_history_v2:<id>`. Cada passo contém somente essa ficha. A migração
separa mudanças reais do antigo `dnd_history_v1`, preservando o documento original;
checkpoints antigos sem autor identificável ficam no original. Os ponteiros de
desfazer/refazer são independentes. Históricos de fichas excluídas permanecem
disponíveis para restaurá-las, sem recuperar/substituir as outras fichas ou notas.
Histórico ilegível não é sobrescrito e vira uma cópia privada de recuperação na
fila. A RPC aceita esses IDs de preferência.
Isso separa edições de personagens diferentes; edições simultâneas do mesmo
histórico continuam sujeitas à resolução de versões/conflitos existente.

Ao gravar um histórico legível, o cliente mantém até **10 estados / 256 KiB**,
com o ponteiro atual e seus vizinhos. Um único estado maior que esse teto é
preservado inteiro. A leitura não trunca o histórico e dados ilegíveis continuam
preservados. Checkpoints participam do limite; não são um arquivo permanente.

localStorage conserva o cache legado. IndexedDB `critcall-sync-v1`, separado por
projeto/usuário, registra fila e versões em transações entre abas. Respostas
removem somente operações confirmadas. IDs tornam repetições idempotentes,
inclusive quando o commit ocorreu e sua resposta caiu. Uma recusa não bloqueia
o envio dos demais documentos; o item recusado permanece na fila.

Se o cache local foi salvo, mas uma transação da fila falhou, a tentativa seguinte
compara a edição com a última projeção persistida. Ter observado o texto na tela
não significa que ele entrou na fila. Essa recuperação também cobre tentativas
já agendadas, impedindo que a cópia anterior da nuvem substitua a edição local.
No fluxo normal, a comparação conserva o estado observado no instante da captura
para não transformar uma projeção remota posterior em uma edição local antiga.

O bootstrap busca dados antes da ficha; há tentativas após edições, reconexão,
foco/visibilidade e periodicamente com a página visível. Atualizações aguardam
campos/editores abertos. Troca de conta cancela a projeção anterior e fecha a
consulta de versões. A RPC compara o dono esperado com `auth.uid()`, impedindo
enviar uma fila antiga com token que passou a pertencer a outra conta.

**Outro PC só recebe uma edição offline depois que o dispositivo que a fez
reconectar e confirmar o envio.** Antes, usa a última versão recebida na nuvem.
Primeiro login exige rede. O perfil distingue fila, falta de configuração/rede
e confirmação remota. Quota/armazenamento bloqueado são informados; não existe
garantia de persistência se o navegador recusa escrever. Manter backups é necessário.
O backup atual contém fichas e notas opcionais, não todo o diário interno.

Dados sem login continuam preservados no modo local. O formulário de entrada
registra a intenção para o e-mail digitado antes de autenticar; somente a
identidade validada correspondente pode receber as cópias. Uma consulta remota
precisa confirmar se já há fichas: conta vazia recebe automaticamente; com
várias fichas locais, a entrada permite selecionar quais serão copiadas e
pré-seleciona uma ficha chamada Kael quando ela existe; conta existente exige
escolher “Salvar como novas”. **Não quero** mantém a origem e registra a recusa
para aquela conta/navegador. Não volta a perguntar em recargas, novos logins ou
edições das fichas sem conta. **Retomar fichas sem conta**, no Perfil, remove a
recusa e oferece a decisão novamente. Outra conta tem sua própria escolha.

`src/auth/guest-import.ts` usa uma trava Web Locks por destino, impressão SHA-256
do conteúdo e recibos com IDs preparados antes das escritas. Recargas e
repetições usam os mesmos IDs. Fichas, notas e retratos são copiados, sem exclusão
dos originais. A recusa usa `critcall_guest_import_declined_v1` no armazenamento
isolado local, sem RPC ou documento remoto. Fichas novas/alteradas não anulam
essa preferência; somente a retomada explícita no perfil.
Cada retrato recebe outro arquivo para não alterar uma cópia
anterior. Preferências/perfil só preenchem espaços ainda vazios. A fila de
sincronização existente confirma o envio; concluir a cópia local não anuncia
salvamento remoto. Erros de leitura, quota, imagens ausentes ou edição aberta
mantêm a origem e oferecem nova tentativa no perfil. Notas ficam separadas.

O rascunho de criação também é copiado para o espaço local da conta. Havendo
outro rascunho, o recebido fica numa fila; não substitui o trabalho em andamento.
Rascunhos não são documentos remotos nem integram o backup de personagens.
O fluxo novo não muda SQL, RLS ou RPC. A importação manual de backups permanece
independente e continua sem notas por padrão.

## Datas e recuperação

Na revisão de 19/10/2026, chaves e metadados novos usam CritCall. A migração
copia dados por espaço e conserva a origem; a fila IndexedDB mantém operações
e identificadores já existentes. Aliases históricos de preferências e
recuperações são aceitos na entrada e projetados para a chave atual. Havendo
ambos, a versão com identificador atual prevalece, inclusive numa exclusão.
Um teste envia uma operação antiga pendente e verifica confirmação, projeção e
repetição sem duplicação. Nenhuma RPC/RLS/tabela ou identidade foi alterada.

Cada documento tem revisão crescente, data de edição e recebimento no servidor.
O relógio é calibrado no Supabase; datas mais de cinco minutos no futuro são
recusadas sem apagar a fila. Uma atualização da revisão atual é causal e não
faz a data retroceder. Se outra edição mudou a revisão, vence a data mais recente;
**ambas as versões ficam no histórico disponível**, inclusive a candidata que não venceu,
sujeitas à política de retenção instalada no servidor.
Empates usam o ID da operação. Não há mesclagem campo a campo da mesma ficha.

Exclusões são tombstones. **Versões salvas** permite restaurar após confirmação,
gerando nova operação e preservando o estado anterior. Restaurar ficha não altera
notas. A política de versões abaixo está ativa no CritCall desde 22/10/2026.
Acompanhar a quota do projeto continua necessário: o teto de conteúdo das
versões não inclui documentos atuais, índices, recibos e outras tabelas.
Cache anterior sem data confiável tem marca de data desconhecida, exibida como
tal; não se apresenta como edição nova para substituir uma versão remota datada.

## Banco e ativação

### Retenção de versões

A primeira política foi ativada em 22/10/2026 por
`20261022212048_bounded_sync_versions.sql` (remota `20261022213804`). Os antigos
20/documento, 30 dias, 200/conta e 8 MiB foram substituídos em **23/10/2026**, após
nova autorização explícita para reduzir o histórico devido ao egress.

`20261023114717_reduced_sync_retention.sql`, versão remota **`20261023115335`**,
foi aplicada somente ao CritCall `qhrpgkpvwbztubnrdhya`. Não reaplicar para igualar
os timestamps. A poda de versões é irreversível e foi autorizada pelo responsável.

- Até **5 versões por documento**, com **7 dias** desde o recebimento.
- Até **50 versões e 2 MiB de conteúdo por conta**, prevalecendo o limite
  atingido primeiro. Uma versão maior que o teto pode não ficar restaurável.
- A limpeza ocorre ao salvar nessa conta, sob lock transacional. A migração de
  23/10 também podou versões existentes das contas inativas; depois disso,
  versões vencidas saem na próxima sincronização.
- `critcall_documents`, fichas atuais, notas atuais e retratos ficam fora da
  limpeza. Versões de histórico e recuperação deixam de ser duplicadas em cada
  envio normal; o documento atual continua sincronizado. Conflitos conservam
  as candidatas dentro dos mesmos limites. Conflito grande demais é recusado,
  mantendo a operação na fila local para revisão.
- Recibos privados pequenos guardam hash/resultado de até 2.000 operações por
  conta, por 30 dias. Permitem repetir uma operação após podar seu snapshot sem
  duplicar estado. A operação do documento atual é conferida mesmo sem recibo;
  depois da janela, operações antigas seguem a resolução causal de conflitos.
- A RPC mantém os oito argumentos e o formato da resposta para clientes já
  publicados. O proprietário continua vindo de `auth.uid()`. A tabela de
  recibos fica em schema privado, sem grant ao navegador; índices começam pelo
  dono; cada gravação limpa somente a própria conta. A migração administrativa
  percorre as contas existentes sob o mesmo lock.

A política instalada foi consultada pela RPC e conferida com os limites acima.
Inspecionados grants, RLS dos recibos e `search_path`. Na ativação inicial de
22/10, um teste transacional no PostgreSQL 17 real, com identidade fictícia sem
e-mail e role authenticated,
confirmou escrita/repetição com revisão única. Todo o teste foi revertido; nenhum
usuário/documento de teste permaneceu. A quantidade e a assinatura agregada dos
documentos atuais ficaram iguais antes/depois da migração e do teste, sem expor
seus conteúdos. Testes de quantidade/prazo/bytes/conflitos rodam também no banco
descartável. O responsável confirmou e-mails e sincronização imediata entre telefone e
computador. Os cenários adicionais de conflito/offline da V2 continuam registrados
separadamente, sem exigir repetir esse teste básico.

O diálogo de versões consulta `critcall_version_policy` e só mostra os limites
quando confirmados pelo servidor. Uma implantação ainda sem essa RPC informa
que a retenção limitada não foi confirmada. Backup privado continua sendo o
caminho para guardar um estado por prazo maior; a restauração não promete
retenção permanente da versão substituída.

### Incidente de egress em 23/10/2026

O responsável confirmou que os **11,78 GB** mostrados no ciclo 17/10–17/11 eram
do projeto CritCall. O serviço permanecia `ACTIVE_HEALTHY`; não foi contratado
plano pago. O código publicado baixava todos os documentos a cada 30 segundos
com a aba visível, além das tentativas após edição/foco. Nos logs das 24 horas
anteriores a 23/10 11:38 UTC havia **2.502 GETs** de `critcall_documents` e
2.501 chamadas de relógio; não havia tamanho de resposta nesses logs para
atribuir uma quantidade exata de bytes a cada chamada.

A consulta agregada encontrou aproximadamente **6,3 MB de históricos** e apenas
**66 kB de fichas atuais**. A correção usa índice de revisões e diário persistido:
sem mudanças, a resposta não contém os valores; após salvar, a revisão confirmada
já evita baixar novamente o próprio envio. Só uma instalação sem esse diário
precisa receber todos os conteúdos. Bootstrap/cópia sem conta conserva seu fluxo.
Índice e conteúdos mantêm paginação, filtro de dono e tombstones. Nenhuma chave,
cache de dados ou conteúdo ilegível foi apagado para reduzir tráfego.

No teste sintético com um histórico de 2 MiB, 100 consultas sem mudança receberam
**7.300 bytes de JSON**, contra **209.756.800 bytes** ao repetir a leitura completa.
A conta real varia por número de documentos/edições; a medição não inclui headers
nem estima o próximo ciclo. Não é uma medição da produção após publicação.

A redução remota deixou **58 de 211 versões**, com conteúdo de **4.555.053 para
190.636 bytes**. Os **45 documentos atuais** conservaram a mesma assinatura
agregada antes/depois, sem baixar ou expor seu conteúdo. A RPC confirmou 5/7/50/2 MiB,
grants permaneceram restritos e os advisors não acrescentaram alertas aos já
registrados. A migração passou antes pelo PostgreSQL 18 descartável, incluindo
limites, contas inativas, conflito grande sem perda da operação e repetição.

A retenção menor já está ativa no servidor. O limite de 10 estados/256 KiB se
aplica a gravações legíveis feitas pelo cliente novo; leituras e o documento
legado não são truncados. A correção dos downloads depende de integrar/publicar
`fix/sync-egress`; abas abertas com o build antigo seguem o comportamento antigo.
Até receber a atualização, fechar abas do CritCall sem uso reduz consultas.
O consumo do ciclo não diminui com a poda: a otimização vale para novas
transferências. Não forçar reload de uma edição em andamento.

Fontes oficiais: [egress e quotas](https://supabase.com/docs/guides/platform/manage-your-usage/egress)
e [excedentes no plano gratuito](https://supabase.com/docs/guides/platform/billing-faq).

### Migrações já aplicadas

Arquivo único: `supabase/migrations/202610160001_personal_sync.sql`.
Tabelas `critcall_documents` (estado atual) e `critcall_versions` (versões/conflitos).
RPCs `critcall_save_document` (autoria, transação, revisão, data, idempotência)
e `critcall_sync_clock` (relógio para a identidade autenticada esperada).

RLS nas duas tabelas: anon sem acesso; authenticated só lê suas linhas e não
recebe escrita direta. A RPC de escrita deriva autoria de `auth.uid()`, fixa
`search_path` vazio, qualifica objetos e restringe execução. Não há acesso de
mestre, mesa ou outro participante. Futuras permissões não devem ampliar notas.

O conector aplicou `personal_sync` com sucesso, na versão remota
`20261016101143`, usando o arquivo `202610160001_personal_sync.sql`. Não
renomear o arquivo nem aplicar novamente apenas porque a versão remota difere:
essa diferença foi produzida pelo registro do conector. As duas RPCs foram
inspecionadas: anon não tem EXECUTE, authenticated tem EXECUTE e o `search_path`
está vazio. RLS está habilitada nas duas tabelas, com políticas SELECT
authenticated restritas a `auth.uid() = owner_id`; authenticated só tem SELECT
e anon não tem grants. A API real recusou anon nas duas tabelas com HTTP
401/42501. Um teste SQL transacional no PostgreSQL 17 real, usando identidade
auth sintética sem e-mail, confirmou escrita por RPC, idempotência (uma versão
após repetição), proteção do dono no relógio, leitura de outro dono sem linhas
e recusa 42501 ao informar outro dono. Identidade e documento de teste foram
integralmente revertidos por ROLLBACK; nenhum dado pessoal foi consultado.

Ainda é necessário validar com duas contas reais, dois navegadores,
offline/reconexão, conflitos e restauração. O teste SQL não comprova esse fluxo
real no navegador. Publicação permanece pelo fluxo de PRs aprovado.

Antes de qualquer alteração futura, conferir o identificador do projeto e os
objetos já existentes. Não pedir senha/chave secreta na conversa. O script não
contém dados pessoais ou exclusões e pode ser reaplicado sem apagar registros.

## Alertas do serviço para revisão

A inspeção de **16/10/2026**, repetida em **22 e 23/10/2026**, do projeto real encontrou a função preexistente
`public.rls_auto_enable` executável por anon/authenticated. Revisar sua origem,
necessidade e privilégios antes de alterar; ela não foi criada pela migração
pessoal. Orientação do [linter de funções expostas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

A proteção contra senhas vazadas está desabilitada e precisa de revisão na
configuração de autenticação: [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

`critcall_save_document` usa SECURITY DEFINER de forma intencional para a
escrita transacional por RPC. EXECUTE é restrito a authenticated, a função
confere `auth.uid()` e o dono esperado e fixa `search_path` vazio. Essa decisão
não dispensa a validação da autoria nem concede escrita direta nas tabelas.
Nenhum desses alertas anteriores foi corrigido nesta entrega; a decisão de
correção continua em V4 da [RETOMADA.md](RETOMADA.md).

Na retenção, o linter informa RLS sem policies em
`critcall_private.sync_receipts`. É bloqueio intencional: não há USAGE/grants
ao navegador nem leitura direta, só a RPC autorizada usa recibos. Não criar
uma policy permissiva para apagar o aviso. [Explicação do linter](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
Os índices recém-criados de retenção também apareceram como ainda sem uso;
não foram removidos, pois atendem as consultas de limpeza após as sincronizações.

## Testes

`npm test` cobre fila IndexedDB simulada, repetição, escrita durante envio, duas
abas, contas, tombstones, editor, relógio, rollback, dados inválidos e paginação.
Inclui recuperação de transação recusada, nova tentativa já agendada e captura
sem edição durante a projeção remota. O Chromium também recusa temporariamente
as transações da fila e confere a preservação/envio do perfil após restabelecê-las.
`fake-indexeddb` é somente desenvolvimento e não entra no site.
`npm run test:database` usa PostgreSQL 16 descartável em Docker, sem publicar
portas nem consultar bancos existentes. Confere migração/reaplicação, RLS/grants
de anon/duas identidades, RPC, concorrência, datas, conflitos e notas. Roda na CI.
`tests/sync-browser.cjs` usa SDK real com HTTP controlado: duas instalações na
mesma conta e outra isolada. Perfil automático/recarga/quota, fichas/notas,
edição/recarga offline, reconexão, versão mais recente e restauração sem alterar
notas. Não usa usuários/senhas reais nem envia e-mails reais.

Referências: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
e [funções/privilégios](https://supabase.com/docs/guides/database/functions).

## Retratos privados

A migração `20261016184740_private_avatars.sql` foi aplicada ao projeto CritCall
`qhrpgkpvwbztubnrdhya` em 16/10/2026 (remota `20261016184938`). Bucket privado
`critcall-avatars`, WebP de até 32768 bytes, pasta por dono e políticas separadas
para leitura, inserção, atualização e exclusão. Metadados/configuração conferidos
sem consultar arquivos pessoais. Advisors mantêm somente os avisos já registrados.

Perfil e ficha sincronizam referências UUID/revisão. Os pixels ficam no Storage,
sem duplicação no histórico do banco. Upload tem fila própria em IndexedDB; o
estado de envio das imagens aparece separado do estado da ficha. Imagens já
abertas podem ser vistas offline; arquivos ainda não recebidos mostram o ícone
padrão. O backup JSON conserva referências e não transfere arquivos entre contas.

O teste de banco agora inclui a estrutura mínima do Storage e as políticas reais.
Além do Docker/PostgreSQL 16 da CI, é possível usar binários locais com
`CRITCALL_TEST_POSTGRES_BIN`: o teste cria outra instância temporária, sem TCP,
e a remove no final; nunca usa uma URL/banco existente. Nesta máquina passou com
PostgreSQL 18.6 extraído em `/tmp`, sem instalar serviço global.
