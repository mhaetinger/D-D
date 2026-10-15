# Login por e-mail e senha

## Estado desta branch

O responsável confirmou e-mail/senha em 15/10/2026 e pediu um projeto Supabase
exclusivo do CritCall, administrado pela mesma conta que já possui o projeto Orbyt.
O usuário informou que criou o projeto novo. Falta conferir sua URL/identificador
e conectá-lo. Orbyt é outro aplicativo e não deve receber alterações.
Cada projeto Supabase tem seu
próprio banco e serviço de autenticação: [projetos e organizações](https://supabase.com/docs/guides/platform).

Implementados cadastro, entrada, reenvio de confirmação, recuperação de senha,
troca de senha pelo link PKCE, sessão e saída. O cliente oficial
`@supabase/supabase-js` 2.118.0 faz as requisições. Sem URL/chave configuradas, a
aplicação continua local e não oferece um formulário de login fictício.
Esta implementação ainda não está ativada no site publicado: identificação e
conexão do projeto já criado e validação com o serviço real estão pendentes.

Fichas e anotações continuam neste navegador. Autenticação e sincronização são
etapas distintas: não há tabelas remotas de personagens, fila de envio ou
políticas RLS aplicadas por esta branch. Não apresentar a separação do cache
como autorização de dados no servidor ou proteção contra quem controla o dispositivo.

## Configurar o projeto exclusivo

1. Identificar e conferir o **projeto novo do CritCall que o usuário já criou**, com
   sua própria URL e identificador. Não criar outro projeto por repetição nem
   reaproveitar o banco, usuários ou chaves do Orbyt.
2. Em Authentication, habilitar cadastro por e-mail/senha e manter confirmação
   de e-mail. Configurar senha mínima de 12 caracteres, compatível com a interface.
3. Usar `https://mhaetinger.github.io/D-D/` como Site URL e retorno permitido.
   Para desenvolvimento, acrescentar somente os endereços locais usados, por
   exemplo `http://127.0.0.1:5173/`. O retorno é sempre a raiz do aplicativo;
   nenhuma rota de callback exige configuração extra no Pages.
4. Conferir entrega de confirmação e recuperação. O SMTP padrão do Supabase
   serve apenas a endereços pré-autorizados da equipe e tem limites restritos;
   configurar um remetente SMTP próprio antes de liberar e-mails para jogadores.
   Credenciais de SMTP ficam no serviço, nunca no Vite, Git ou documentação.
5. Conferir limites de autenticação e proteção contra abuso no serviço antes de
   ativar cadastro público. Não desabilitar confirmação para contornar falhas de entrega.

Referências: [senhas](https://supabase.com/docs/guides/auth/passwords),
[retornos permitidos](https://supabase.com/docs/guides/auth/redirect-urls),
[PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow) e
[SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## Configuração do aplicativo

Copiar `.env.example` para `.env.local` e preencher apenas:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

A URL é a origem HTTPS do novo projeto, e a chave é a publicável
(`sb_publishable_…`) ou a chave `anon` legada. Essas informações identificam o
projeto no navegador. `sb_secret_…`, `service_role`, senhas do banco e tokens de
administração são proibidos no cliente. O preflight de `npm run dev` e
`npm run build` recusa configurações incompletas, URLs com credenciais/caminhos
e chaves privilegiadas antes de compilar.
[Chaves públicas e secretas](https://supabase.com/docs/guides/getting-started/api-keys).

No GitHub Actions, configurar as **variables** do repositório `SUPABASE_URL` e
`SUPABASE_PUBLISHABLE_KEY` com os valores públicos do projeto exclusivo. A etapa
de build já as encaminha ao Vite. A falta das duas mantém o modo local; preencher
somente uma causa falha de build. Não inserir uma chave secreta nessas variables.

## Dados, sessão e troca de conta

- O nome do aplicativo é CritCall. Algumas chaves e o formato
  `orbyt.character-backup` são identificadores legados da primeira publicação,
  que recebeu esse nome por engano. Eles são preservados para continuar lendo
  fichas/backups existentes; não indicam vínculo com o outro aplicativo.
  Os novos espaços de autenticação/conta usam prefixos `dnd_auth_v1` e `dnd_account_v1`.
- O bootstrap consulta a identidade antes de carregar a ficha. Online, `getUser`
  valida a sessão no Supabase. Não se usa um nome digitado ou um JWT decodificado
  pelo aplicativo como autorização de acesso ao serviço.
- As chaves originais continuam pertencendo ao espaço **sem login**. Entrar não
  copia nem vincula automaticamente fichas anteriores. Para levar uma ficha ao
  espaço da conta, exportar no modo local, entrar e importar o backup como cópia.
- Cada projeto/usuário tem um prefixo próprio para fichas, anotações, recuperação,
  nome do jogador e ficha ativa. Temas/fonte continuam preferências do navegador.
  Notas ficam separadas da ficha/snapshots e fora do backup padrão.
- Ao trocar de identidade, a lista e o histórico da sessão são reconstruídos
  para o espaço correto. Rolagens antigas e formulários fechados são limpos.
  Uma importação assíncrona não pode terminar em uma conta diferente da original.
- Se a sessão mudar com um editor ou confirmação aberto, um diálogo cobre a
  aplicação. O jogador pode baixar um backup antes de autorizar o fechamento.
  Confirmações destrutivas pendentes são canceladas, sem agir sobre a conta nova.
- Rascunhos de fichas/notas com erro de gravação ficam associados ao espaço
  anterior em memória, nesta aba, para recuperação/backup. Fechar a aba ainda
  exige salvar ou baixar esses dados; memória não substitui armazenamento persistente.
- Offline, uma identidade já validada permite abrir sua cópia local. Isso não
  valida novamente a sessão no servidor. Ao reconectar, a identidade é conferida.
  Entrar/cadastrar/recuperar senha exigem rede. Sair offline remove a sessão deste
  aplicativo sem alegar revogação remota; fichas/notas não são apagadas.
- Ao sair, a cópia local é mantida. Ela não aparece no espaço de outra conta,
  mas continua acessível a quem controla o navegador. Não há criptografia do cache
  nem isolamento do sistema operacional. Um fluxo de remoção/exportação do cache
  e a autorização dos futuros dados remotos pertencem à etapa de persistência.

## Conferência antes de ativar

O teste `tests/auth-browser.cjs` compila um artefato temporário com configuração
fictícia e usa o SDK real contra respostas HTTP controladas. Não envia cadastro,
senha ou recuperação a um projeto real. Ele complementa os testes existentes;
não comprova entrega de e-mail, configuração do serviço ou proteção de dados remotos.

Antes de ativar na publicação: conferir o projeto exclusivo, SMTP/retornos,
cadastro/confirmação/recuperação reais, duas contas distintas e os caminhos de
renderização de dados não confiáveis. A revisão integral de segurança e as
políticas dos futuros personagens/notas remotos continuam pendentes. Integrar
por PR em develop e depois em main; não habilitar o projeto anterior por engano.
