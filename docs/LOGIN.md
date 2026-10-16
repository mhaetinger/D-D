# Login por e-mail e senha

## Estado desta branch

O responsável confirmou e-mail/senha em 15/10/2026 e pediu um projeto Supabase
exclusivo do CritCall, administrado pela mesma conta que já possui o projeto Orbyt.
O usuário criou e identificou o projeto novo: `qhrpgkpvwbztubnrdhya`, URL pública
`https://qhrpgkpvwbztubnrdhya.supabase.co`. URL e chave publicável acompanham o
build em `src/auth/public-project.ts`. São identificadores públicos feitos para
o navegador, sem privilégio administrativo; o preflight confere o tipo da chave.
Orbyt é outro aplicativo e não deve receber alterações.
Cada projeto Supabase tem seu
próprio banco e serviço de autenticação: [projetos e organizações](https://supabase.com/docs/guides/platform).

Implementados cadastro, entrada, reenvio de confirmação, recuperação de senha,
troca de senha pelo link PKCE, sessão e saída. O cliente oficial
`@supabase/supabase-js` 2.118.0 faz as requisições. O build padrão já tem a
configuração pública do CritCall, sem depender de variables do GitHub ou arquivo
local. `VITE_AUTH_ENABLED=false` desliga o login e mantém o espaço local.
Esta implementação ainda não está ativada no site publicado. A API real respondeu
HTTP 200 em settings/health, com e-mail e cadastro habilitados e confirmação
obrigatória. O Chromium enviou uma tentativa com credenciais inexistentes ao
projeto real: HTTP 400, mensagem correta e nenhum erro JavaScript. Não houve
cadastro, envio de e-mail ou entrada bem-sucedida em conta real nessa verificação.

Fichas e anotações continuam neste navegador. Autenticação e sincronização são
etapas distintas: não há tabelas remotas de personagens, fila de envio ou
políticas RLS aplicadas por esta branch. Não apresentar a separação do cache
como autorização de dados no servidor ou proteção contra quem controla o dispositivo.

## Configurar o projeto exclusivo

1. Usar somente o projeto **CritCall** identificado acima. Não criar outro por
   repetição nem reaproveitar o banco, usuários ou chaves do Orbyt. A chave pública
   permite o cliente do aplicativo; não concede acesso à administração do projeto.
2. Em Authentication, habilitar cadastro por e-mail/senha e manter confirmação
   de e-mail. Configurar senha mínima de 12 caracteres, compatível com a interface.
3. Usar `https://mhaetinger.github.io/D-D/` como Site URL e retorno permitido.
   Para desenvolvimento, acrescentar somente os endereços locais usados, por
   exemplo `http://127.0.0.1:5174/`. O retorno é sempre a raiz do aplicativo;
   nenhuma rota de callback exige configuração extra no Pages. O usuário confirmou
   Site URL/retorno do Pages e a substituição do retorno local por 5174 em
   15/10/2026. A porta 5173 pertence a outro aplicativo. A configuração
   administrativa não foi lida pelo conector nesta sessão.
4. Conferir entrega de confirmação e recuperação. O SMTP padrão do Supabase
   serve apenas a endereços pré-autorizados da equipe e tem limites restritos;
   configurar um remetente SMTP próprio antes de liberar e-mails para jogadores.
   Credenciais de SMTP ficam no serviço, nunca no Vite, Git ou documentação.
   O usuário confirmou que ainda usa o envio padrão. Para a conferência inicial,
   usar o próprio endereço autorizado da conta administrativa do Supabase;
   entrega/retorno do e-mail continuam sem validação real.
5. Conferir limites de autenticação e proteção contra abuso no serviço antes de
   ativar cadastro público. Não desabilitar confirmação para contornar falhas de entrega.

Referências: [senhas](https://supabase.com/docs/guides/auth/passwords),
[retornos permitidos](https://supabase.com/docs/guides/auth/redirect-urls),
[PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow) e
[SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## Configuração do aplicativo

O projeto público em `src/auth/public-project.ts` é a configuração padrão do
build. A chave publicável é distribuída de qualquer modo no código do navegador;
sua presença nesse arquivo não permite administrar o Supabase, ler senhas ou
ignorar autorização do serviço. Ela não substitui as futuras políticas RLS.
Não colocar chaves secretas, service_role, senhas do banco ou tokens administrativos
nesse arquivo, em arquivos Vite ou em documentação.
[Tipos de chave do Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

**Não é mais necessário criar variables no GitHub** para publicar esta configuração.
O workflow compila o projeto público revisado, sem consultar as variables que
haviam sido solicitadas anteriormente. Nenhuma configuração administrativa do
GitHub foi alterada por ferramenta.

Para testar outro projeto, copiar `.env.example` para `.env.local` e preencher o
par completo `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Um par vazio
usa o projeto incluído; um par incompleto é recusado, sem combinar URLs/chaves
de projetos diferentes. A chave precisa ser publicável (`sb_publishable_…`) ou
anon legada. A configuração é validada antes de `npm run dev` e `npm run build`,
inclusive quando o login estiver desligado. Nenhum valor é impresso no preflight.

Para gerar uma edição apenas local, definir `VITE_AUTH_ENABLED=false`. Isso
esconde o formulário, sem excluir contas, fichas ou notas do navegador. Os testes
de login sempre sobrescrevem os identificadores por um projeto fictício com HTTP
controlado; não usam a configuração real para cadastrar ou enviar e-mails.

Para usar o retorno local configurado, iniciar com
`npm run dev -- --port 5174 --strictPort`. A opção impede trocar silenciosamente
de porta e invalidar o retorno de confirmação/recuperação.

Um link expirado ou aberto sem o verificador PKCE deste navegador mostra uma
mensagem e limpa os parâmetros do retorno. A falha do link preserva uma sessão
válida que já esteja aberta. A interface só confirma entrada depois de validar
a identidade no serviço. A restrição de envio de e-mail do Supabase tem mensagem
própria, sem mostrar erros brutos ou credenciais ao jogador.

## Domínio próprio

O usuário propôs `critcall.com.br`; registro e DNS ainda não foram configurados.
O mesmo build usa caminhos relativos e é conferido tanto em `/D-D/` quanto em `/`.
O retorno acompanha a origem/pasta em que o jogador iniciou o fluxo; o Supabase
precisa autorizar a nova URL antes do teste real no domínio. A troca de origem
não transfere automaticamente as fichas locais. Procedimento e limites em
[DOMINIO.md](DOMINIO.md).

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
