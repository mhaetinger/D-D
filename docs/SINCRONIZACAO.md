# Salvamento pessoal e sincronização

## Estado

Solicitado em 16/10/2026: dados do jogador no Supabase, incluindo nome, uso
offline e atualização em outro PC. Cliente, migração e testes estão implementados
nesta branch. **Migração aplicada ao projeto real em 16/10/2026; validação de
sincronização entre dispositivos reais e publicação ainda pendentes.** As
ferramentas do Supabase ficaram disponíveis e confirmaram o projeto exclusivo
`qhrpgkpvwbztubnrdhya`, ativo em PostgreSQL 17.11, com nome D-D no painel e URL
`https://qhrpgkpvwbztubnrdhya.supabase.co`. Antes da aplicação não havia tabelas
públicas nem migrações. Orbyt é outro projeto e não recebeu alterações.

## Dados e fila

Sincronizam-se fichas completas, anotações pessoais separadas, nome, ficha ativa,
tema/fundo/fonte, preferências de dados/bandeja, histórico/checkpoints e cópias
de recuperação. A lista de preferências fica em `src/storage/preferences.ts`.
Nome é salvo ao digitar; falha mantém o texto e não anuncia sucesso. Senhas e
tokens não são documentos nem backups. Editores ainda não confirmados mantêm
seu fluxo de salvar/descartar; pool temporário, buscas, animações e painéis
abertos não são registros da ficha.

localStorage conserva o cache legado. IndexedDB `critcall-sync-v1`, separado por
projeto/usuário, registra fila e versões em transações entre abas. Respostas
removem somente operações confirmadas. IDs tornam repetições idempotentes,
inclusive quando o commit ocorreu e sua resposta caiu. Uma recusa não bloqueia
o envio dos demais documentos; o item recusado permanece na fila.

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

Dados sem login continuam preservados no modo local, sem adoção automática por
qualquer conta de um dispositivo compartilhado. Para levar fichas, exportar no
modo local, entrar e importar cópias; incluir notas somente por escolha própria.

## Datas e recuperação

Cada documento tem revisão crescente, data de edição e recebimento no servidor.
O relógio é calibrado no Supabase; datas mais de cinco minutos no futuro são
recusadas sem apagar a fila. Uma atualização da revisão atual é causal e não
faz a data retroceder. Se outra edição mudou a revisão, vence a data mais recente;
**ambas as versões ficam no histórico**, inclusive a candidata que não venceu.
Empates usam o ID da operação. Não há mesclagem campo a campo da mesma ficha.

Exclusões são tombstones. **Versões salvas** permite restaurar após confirmação,
gerando nova operação e preservando o estado anterior. Restaurar ficha não altera
notas. Não há expurgo automático: acompanhar a quota do projeto é necessário.
Cache anterior sem data confiável tem marca de data desconhecida, exibida como
tal; não se apresenta como edição nova para substituir uma versão remota datada.

## Banco e ativação

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

A inspeção do projeto real encontrou a função preexistente
`public.rls_auto_enable` executável por anon/authenticated. Revisar sua origem,
necessidade e privilégios antes de alterar; ela não foi criada pela migração
pessoal. Orientação do [linter de funções expostas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

A proteção contra senhas vazadas está desabilitada e precisa de revisão na
configuração de autenticação: [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

`critcall_save_document` usa SECURITY DEFINER de forma intencional para a
escrita transacional por RPC. EXECUTE é restrito a authenticated, a função
confere `auth.uid()` e o dono esperado e fixa `search_path` vazio. Essa decisão
não dispensa a validação da autoria nem concede escrita direta nas tabelas.
Nenhum desses alertas foi apresentado como corrigido nesta etapa.

## Testes

`npm test` cobre fila IndexedDB simulada, repetição, escrita durante envio, duas
abas, contas, tombstones, editor, relógio, rollback, dados inválidos e paginação.
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
