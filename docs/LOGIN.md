# Login por e-mail e senha

Referência de configuração e comportamento. Estado publicado e validações
externas pendentes: [RETOMADA.md](RETOMADA.md). Este documento não é outro
plano de entrega.

## Tela de entrada

A página começa pela entrada principal do CritCall quando não há conta validada.
Login, cadastro e recuperação compartilham o formulário já existente. O link
**Esqueci a senha** aparece somente em **Entrar**. Ao validar
a entrada, a interface abre as fichas da conta, ou a ação de criar a primeira.
Sessão conhecida e cópia offline anteriormente validada reabrem esse espaço.
Um retorno de recuperação mostra a nova senha na entrada antes de liberar a ficha.
**Continuar sem alterar a senha** permite cancelar esse formulário sem enviar
uma alteração ao serviço.

A opção **Continuar sem conta** abre explicitamente o espaço local anterior.
Ela fica mantida só nesta aba/caminho; sair da conta retorna à tela de entrada.
Não há adoção automática de fichas sem login. Os avisos de dados ilegíveis e a
recuperação com confirmação continuam disponíveis ao abrir o espaço local.

O perfil mantém informações da conta, troca de senha, saída, personagens,
backups e estado do salvamento. A entrada não substitui RLS ou validação da
identidade, nem altera os retornos já configurados no serviço.

## Configuração e estado publicado

O serviço exclusivo é o projeto CritCall **`qhrpgkpvwbztubnrdhya`**, URL pública
`https://qhrpgkpvwbztubnrdhya.supabase.co`. URL e chave publicável acompanham o
build em `src/auth/public-project.ts`; não têm privilégio administrativo. O
preflight confere o tipo da chave. Outros aplicativos não devem receber alterações.

Cadastro, entrada, reenvio de confirmação, recuperação/troca PKCE, sessão e saída
estão implementados e publicados em **https://criticall.art/**. O cliente oficial
`@supabase/supabase-js` está fixado no lockfile. O build não depende de variables
do GitHub ou arquivo local; `VITE_AUTH_ENABLED=false` mantém a edição apenas local.

O usuário confirmou cadastro/entrada e relatou sucesso na recuperação local em
16/10/2026, após repetir o fluxo no navegador/dispositivo de origem. As consultas
automatizadas ao serviço real conferiram conexão e destinos de retorno, sem
cadastrar usuários, enviar e-mails ou trocar senhas. Isso não comprova todos os
fluxos de e-mail na produção. Validações reais e SMTP próprio estão em V2/V3 da
retomada; a publicação do código já foi concluída.

Fichas/notas mantêm cópia no navegador e fila pessoal de sincronização. As
migrações foram aplicadas ao projeto real em 16/10/2026; versões remotas,
contratos e alertas estão em [SINCRONIZACAO.md](SINCRONIZACAO.md). Separar o cache
por conta não o protege de quem controla o dispositivo.

## Configurar o projeto exclusivo

1. Usar somente o projeto **CritCall** identificado acima. Não criar outro por
   repetição nem reaproveitar o banco, usuários ou chaves do outro aplicativo. A chave pública
   permite o cliente do aplicativo; não concede acesso à administração do projeto.
2. Em Authentication, habilitar cadastro por e-mail/senha e manter confirmação
   de e-mail. Configurar senha mínima de 12 caracteres, compatível com a interface.
3. O Site URL registrado é `https://criticall.art/`, com esse retorno e os locais
   `http://127.0.0.1:5174/` e `http://localhost:5174/` já conferidos em 16/10/2026.
   A porta 5173 pertence a outro aplicativo. O retorno é a raiz/pasta da aplicação;
   não criar uma rota extra de callback. Antes de mudar domínio/serviço, conferir
   a configuração administrativa e seguir [DOMINIO.md](DOMINIO.md), preservando
   retornos antigos durante a transição necessária.
4. Conferir entrega de confirmação e recuperação. O SMTP padrão do Supabase
   serve apenas a endereços pré-autorizados da equipe e tem limites restritos;
   configurar um remetente SMTP próprio antes de liberar e-mails para jogadores.
   Credenciais de SMTP ficam no serviço, nunca no Vite, Git ou documentação.
   O usuário confirmou que ainda usa o envio padrão. Para a conferência inicial,
   usar o próprio endereço autorizado da conta administrativa do Supabase;
   o usuário confirmou a entrega da confirmação de cadastro. Entrega do reenvio,
   recuperação/troca continuam em validação. A aceitação dos dois retornos
   locais foi conferida no endpoint real após o ajuste de localhost.
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
ignorar autorização do serviço. Ela não substitui as políticas RLS já aplicadas.
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

O retorno diferencia expiração/uso do link, solicitação indisponível no serviço,
verificador incompatível e solicitação ausente neste navegador/endereço. Ausência
local não é tratada como prova de expiração. Os parâmetros são limpos, sem
exibir erros brutos, códigos de acesso ou tokens. A falha do link preserva uma sessão
válida que já esteja aberta. A interface só confirma entrada depois de validar
a identidade no serviço. A restrição de envio de e-mail do Supabase tem mensagem
própria, sem mostrar erros brutos ou credenciais ao jogador.

## Reenviar confirmação e alterar senha

- **Reenviar confirmação de e-mail** solicita outra confirmação para um cadastro
  pendente. Não reenvia senha nem um login sem senha.
- **Esqueci a senha** envia a solicitação de recuperação ao endereço informado.
  O link abre o formulário de nova senha e confirmação neste navegador/origem.
- **Enviar link para trocar senha**, na conta já conectada, usa o e-mail da
  identidade validada, independentemente do que ficou digitado no formulário.
  Não exige sair; o link abre o mesmo formulário de recuperação/troca.

Os três envios usam o retorno da origem/pasta atual. Pedir outro e-mail antes de
concluir o anterior substitui o verificador usado pelo SDK neste navegador:
usar somente o link mais recente. Não alternar localhost/127.0.0.1, dispositivo,
perfil do navegador ou janela privada durante a solicitação.
Essa exigência pertence ao retorno do link. É possível iniciar a recuperação em
qualquer navegador/dispositivo e concluí-la nele. Entrada normal com e-mail/senha
funciona em outros navegadores; o compartilhamento das fichas usa a fila descrita
em SINCRONIZACAO.md, com banco preparado e validação real entre dispositivos pendente.

O provedor simulado dos testes passou a conferir o código emitido e o desafio
PKCE, com prazo e uso único. Antes, aceitava qualquer código e não comprovava
essas recusas. Isso não substitui a conferência de entrega e troca de senha no
serviço real. Se um link recém-emitido falhar no endereço/navegador correto,
conferir o código de erro no serviço sem registrar o link: o Supabase também
documenta consumo antecipado por verificadores de e-mail em
[limitações dos templates](https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching).
Essa possibilidade não foi confirmada neste caso; não alterar templates ou
desativar confirmação com base apenas no aviso genérico.

### Diferença entre localhost e 127.0.0.1

Antes do ajuste em 15/10/2026, uma consulta ao endpoint real de verificação com token
aleatório inválido, sem e-mail/usuário e sem seguir o redirecionamento, retornou:

| Retorno solicitado | Destino efetivo (HTTP 303) |
| --- | --- |
| `http://127.0.0.1:5174/` | `http://127.0.0.1:5174/` |
| `http://localhost:5174/` | `https://mhaetinger.github.io/D-D/` |

O primeiro endereço está aceito; o segundo recai no Site URL. O usuário confirmou
que iniciou em `localhost:5174` e foi levado ao Pages, identificando a origem do
relato. O usuário acrescentou `http://localhost:5174/` em **Redirect URLs** e
confirmou o salvamento. Nova consulta com tokens aleatórios inválidos retornou
303 para localhost tanto em `signup` quanto em `recovery`; 127.0.0.1 continuou
aceito. Não houve envio de e-mail, criação de usuário ou troca real de senha
nessas consultas, que conferem o destino do retorno. Em teste posterior, o usuário
relatou sucesso na recuperação/troca após a orientação sobre navegador/dispositivo.
Não forçar um
retorno cruzado pelo código: as origens têm armazenamento e verificadores PKCE
separados. Se o usuário começou em 127.0.0.1 e também foi para o endereço público,
conferir o template do e-mail e o destino solicitado, sem registrar tokens ou
códigos da mensagem. Documentação de
[retornos e templates](https://supabase.com/docs/guides/auth/redirect-urls).

## Domínio próprio

O usuário confirmou a compra de `criticall.art` na Hostinger em 16/10/2026.
Informou configurações feitas e DNS em verificação no GitHub. A API real aceitou
o retorno `https://criticall.art/` e os dois retornos locais em 5174; um retorno
não permitido recaiu no domínio novo (303). Usados tokens aleatórios inválidos,
sem e-mails ou mudanças de senha. DNS/HTTPS foram conferidos em 16/10/2026 e a
publicação funcional no domínio em 21/10/2026. A conferência completa do login
e dos e-mails reais em produção segue nas validações da retomada.
O mesmo build usa caminhos relativos e é conferido tanto em `/D-D/` quanto em `/`.
O retorno acompanha a origem/pasta em que o jogador iniciou o fluxo; o Supabase
precisa autorizar a nova URL antes do teste real no domínio. A troca de origem
não transfere automaticamente as fichas locais. Procedimento e limites em
[DOMINIO.md](DOMINIO.md).

## Dados, sessão e troca de conta

- O nome do aplicativo é CritCall. Identificadores históricos da primeira
  publicação são reconhecidos em leitura silenciosa.
  Os originais são preservados para continuar lendo
  fichas/backups existentes; não indicam vínculo com o outro aplicativo.
  Os novos espaços de autenticação/conta usam prefixos `dnd_auth_v1` e `dnd_account_v1`.
- O bootstrap consulta a identidade antes de carregar a ficha. Online, `getUser`
  valida a sessão no Supabase. Não se usa um nome digitado ou um JWT decodificado
  pelo aplicativo como autorização de acesso ao serviço.
- As chaves originais continuam pertencendo ao espaço **sem login**. O fluxo de
  entrada pode vincular cópias das fichas locais selecionadas à identidade
  confirmada. Conta com fichas exige confirmação; a origem permanece preservada.
  Backups manuais continuam criando cópias; veja `SINCRONIZACAO.md`.
- Cada projeto/usuário tem um prefixo próprio para fichas, anotações, recuperação,
  nome do jogador, ficha ativa e preferências visuais. Tema/fundo/fonte entram
  na sincronização por conta; valores visuais antigos do navegador são apenas
  fallback local. Notas ficam separadas da ficha/snapshots e fora do backup padrão.
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
  continua pendente; os dados remotos pessoais usam RLS/RPC da migração aplicada.

## Limites da verificação de login

O teste `tests/auth-browser.cjs` compila um artefato temporário com configuração
fictícia e usa o SDK real contra respostas HTTP controladas. Não envia cadastro,
senha ou recuperação a um projeto real. Ele complementa os testes existentes;
não comprova entrega de e-mail, configuração do serviço ou proteção de dados remotos.

A publicação do código já está concluída. A validação completa com contas,
dispositivos e e-mails reais, o SMTP e a revisão dos alertas do serviço são
acompanhados na [RETOMADA.md](RETOMADA.md). Os contratos e as inspeções históricas
de RLS/RPC estão em SINCRONIZACAO.md; não declarar revisão integral de segurança
a partir dos testes existentes. Alterações seguem PR para develop e main.
