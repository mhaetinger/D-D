# Endereço próprio do CritCall

## Próxima hospedagem: Cloudflare

O usuário criou uma conta Cloudflare em 16/10/2026 para preparar a migração e o
crescimento. Seguir [CLOUDFLARE.md](CLOUDFLARE.md). Os apontamentos GitHub abaixo
descrevem o destino anterior, mantido durante a preparação; não são os registros
finais do futuro projeto Cloudflare. O workflow já aceita Cloudflare como destino opcional; ainda faltam o projeto
Pages, credenciais de CI e a ativação revisada.

## Domínio e HTTPS conferidos

Em 16/10/2026, o usuário confirmou a compra de **`criticall.art` na Hostinger**.
Esse é o endereço escolhido para o CritCall. O registro continua na Hostinger;
a gestão do DNS passou para Cloudflare, e o site ainda está no GitHub Pages.

Depois da configuração e da troca de nameservers, o usuário confirmou OK no
DNS check do GitHub e na Cloudflare. Em 16/10/2026, consulta pública confirmou
`noel.ns.cloudflare.com` e `raegan.ns.cloudflare.com`. O domínio respondeu por
HTTPS com certificado aceito (200); `https://www.criticall.art/` redirecionou
para a raiz (301 → 200). A resposta identifica GitHub Pages como hospedagem.
O erro de certificado observado antes da propagação não se repetiu nessa
conferência. Nenhum DNS ou serviço foi alterado pelas ferramentas.

O endpoint real do Supabase aceitou os retornos `https://criticall.art/`,
`http://localhost:5174/` e `http://127.0.0.1:5174/` (303). Um retorno não permitido
recaiu em `https://criticall.art/`, compatível com o Site URL novo. Foram usados
tokens aleatórios inválidos, sem cadastrar usuários, enviar e-mails ou trocar
senhas. Essa conferência verifica o destino, não a conclusão real do login.

O endereço anterior é `https://mhaetinger.github.io/D-D/`. Login e sincronização
permanecem na PR de tarefa; a ativação do domínio deve ser coordenada com a
validação e entrega revisada. Preparar este guia não publica a branch nem integra a PR.

## Dados antes da troca

As fichas e notas ainda ficam no armazenamento de cada navegador/origem.
`mhaetinger.github.io`, o ambiente local e `criticall.art` têm armazenamentos
diferentes. Enquanto a sincronização não estiver ativada, login não transfere
essas cópias. Após a ativação, a conta poderá baixar no novo domínio os dados já
confirmados no Supabase; alterações ainda pendentes no endereço antigo precisam
ser enviadas ou exportadas antes da transição.

Antes de ativar um redirecionamento, baixar backup no endereço antigo e conferir
o arquivo. Notas só entram com escolha explícita, em backup privado. No endereço
novo, entrar na conta desejada e importar o backup como cópia. Preservar os dados
antigos; não apagar armazenamento para forçar a mudança. Se necessário, abrir a
versão anterior offline para exportar as fichas que ficaram naquela origem.

## Configuração na Hostinger e no GitHub

1. Verificar a propriedade do domínio no GitHub, usando o TXT fornecido pela
   própria conta. O valor é específico e não deve ser inventado. Em
   [Settings → Pages do D-D](https://github.com/mhaetinger/D-D/settings/pages),
   preencher **Custom domain** com `criticall.art` e salvar antes de apontar o DNS.
2. Na Hostinger, abrir **Domínios → criticall.art → DNS / Nameservers → Registros
   de DNS**, conforme o [guia do hPanel](https://www.hostinger.com/br/support/1583249-como-gerenciar-seus-registros-dns-no-hpanel-hostinger/).
   Conferir o estado atual e substituir somente os apontamentos do site pelos
   registros abaixo: o A anterior de `@` deve dar lugar aos quatro A, e o CNAME
   de `www` deve apontar diretamente ao GitHub. Se continuar no DNS da Hostinger, manter seus nameservers,
   o TTL padrão e os registros de outros serviços/e-mail. Não configurar um curinga.

| Nome | Tipo | Destino |
| --- | --- | --- |
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |
| `www` | CNAME | `mhaetinger.github.io` |

O destino de `www` não contém `/D-D/`. Os registros seguem a
[documentação oficial do GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
O endereço principal será `https://criticall.art/`; conferir também o
redirecionamento de `https://www.criticall.art/` para ele.

3. Aguardar a validação do DNS/certificado no Pages e habilitar **Enforce HTTPS**.
   A propagação e a disponibilidade do HTTPS podem levar até 24 horas.
   A publicação usa GitHub Actions: um arquivo `CNAME` no código é ignorado nesse
   fluxo e não substitui a configuração administrativa de Custom domain.
4. No Supabase exclusivo do CritCall (`qhrpgkpvwbztubnrdhya`), acrescentar
   `https://criticall.art/` a **Authentication → URL Configuration → Redirect URLs**.
   Quando o site novo estiver disponível com HTTPS, definir também **Site URL**
   como `https://criticall.art/`. Conservar `http://localhost:5174/`,
   `http://127.0.0.1:5174/` e o endereço anterior durante a transição necessária.
   Os caminhos são relativos; não criar uma rota `/auth/callback` sem implementação no Pages.
5. Solicitar links novos de confirmação/recuperação pelo domínio novo e abri-los
   no mesmo navegador/origem em que o fluxo foi iniciado. O verificador PKCE do
   endereço antigo não é transferido para outro domínio.
6. Conferir no domínio novo: ficha e biblioteca, HTTPS, redirecionamento de `www`,
   confirmação/recuperação, sincronização entre dispositivos e uso offline real.
   Conferir também o escopo offline anterior `/D-D/` ao alterar o build.

Retornos seguem a [configuração do Supabase](https://supabase.com/docs/guides/auth/redirect-urls).
O mesmo build foi conferido sob `/D-D/` e `/`; DNS, certificado e entrega real de
e-mail só podem ser conferidos depois da configuração externa.

## E-mails das contas

O usuário ainda usa o envio padrão do Supabase, restrito a endereços autorizados
da equipe. Para cadastro/recuperação dos jogadores, preparar SMTP próprio e um
remetente autenticado. O domínio comprado pode ser usado para esse remetente após
validação no provedor; os registros SPF/DKIM dependem do serviço escolhido.
Não inventar esses valores nem colocar credenciais de SMTP no site ou no Git.
[Limites e configuração oficial de SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

O usuário confirmou que comprou somente o domínio, sem conta de e-mail. A proposta
para envio é Resend, ainda sem conta conectada ou serviço ativado nesta retomada.
Em consulta de 16/10/2026, o [plano gratuito](https://resend.com/pricing) oferece
3.000 e-mails por mês, limitados a 100 por dia; conferir os limites antes de aderir.
O roteiro é validar `criticall.art` no provedor com os registros fornecidos por
ele, escolher o remetente do CritCall e conectar o SMTP ao projeto Supabase
exclusivo. A [integração oficial](https://supabase.com/partners/resend) permite
configurar o SMTP sem copiar credenciais pela conversa. Por configuração manual,
usar os dados do [SMTP do Resend](https://resend.com/changelog/smtp-service):
`smtp.resend.com`, porta `465`, usuário `resend` e a chave gerada como senha,
guardada somente na configuração administrativa do Supabase. Após a ativação,
conferir entrega e conclusão de cadastro/confirmação/recuperação reais.
