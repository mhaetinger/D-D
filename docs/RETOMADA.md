# Retomada do CritCall em outro PC

Estado conferido em **16/10/2026**. Este documento permite continuar sem o
histórico da conversa. Leia também `AGENTS.md`, `README.md`, `CHANGELOG.md` e
`docs/ARQUITETURA.md` antes de alterar o projeto.

## Abrir a versão em desenvolvimento

Repositório: https://github.com/mhaetinger/D-D.
Branch em andamento: **`feature/login-email`**.
[PR #3](https://github.com/mhaetinger/D-D/pull/3), em rascunho, para `develop`.
`main` e `develop` ainda não contêm o login e a sincronização desta branch.

Em uma pasta nova, com Node.js **22.12 ou superior** e Git:

```sh
git clone --branch feature/login-email --single-branch https://github.com/mhaetinger/D-D.git CritCall
cd CritCall
npm ci
npm run dev -- --port 5174 --strictPort
```

Abra **http://localhost:5174/**. A configuração pública do Supabase acompanha
o código; não é necessário copiar `.env.local` nem criar variables no GitHub.
Se já houver clone, preserve alterações locais, faça `git fetch origin`,
selecione `feature/login-email` e atualize com `git pull --ff-only`.
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
**D-D**; o aplicativo se chama **CritCall**. Orbyt é outro projeto do usuário.

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
sem login ficam preservadas nesse espaço e não são adotadas automaticamente;
para levá-las à conta, exportar no modo local, entrar e importar cópias.

Login normal funciona em outros navegadores. Confirmação/recuperação PKCE exige
abrir o link no mesmo navegador, dispositivo e endereço que iniciou o pedido.
Pode iniciar uma recuperação no novo PC e concluí-la nele. Nunca colar senhas,
links com tokens ou chaves secretas na conversa/Git.

## Próximos passos

1. Validar no aplicativo real: mesma conta em dois navegadores/PCs, nome,
   fichas/notas, offline/reconexão, conflito e restauração. Conferir isolamento
   com outra conta real. Não solicitar credenciais do usuário para fazer isso.
2. Configurar SMTP próprio antes de liberar cadastro aos jogadores. O envio
   padrão do Supabase ainda tem restrições. Revisar os avisos do serviço
   registrados em [SINCRONIZACAO.md](SINCRONIZACAO.md).
3. Após revisão/aprovação, integrar PR para `develop` e depois PR para `main`.
   O pedido de salvar andamento no Git não autoriza merge/publicação. Não
   fazer push direto à `main`. O site publicado ainda é a primeira versão,
   https://mhaetinger.github.io/D-D/, sem login/sincronização desta branch.
4. Domínio sugerido pelo usuário: **critcall.com.br**, ainda **não registrado**.
   Compra, DNS, Pages e HTTPS pendentes; roteiro em [DOMINIO.md](DOMINIO.md).
   Não comprar ou configurar um domínio ainda não pertencente ao usuário.
5. Priorizar a base individual; mesas, permissões de mestre, retratos e voz/vídeo
   são etapas seguintes. Nenhuma ficha individual depende de mesa.

Site URL: `https://mhaetinger.github.io/D-D/`. Usuário confirmou retornos
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

Texto para iniciar outra conversa: “Continue o CritCall na branch
feature/login-email; leia AGENTS.md e docs/RETOMADA.md e confira o estado real
antes de alterar. A migração Supabase personal_sync já foi aplicada.”
