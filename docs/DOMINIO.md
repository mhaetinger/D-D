# Endereço próprio do CritCall

## Proposta, sem ativação

O usuário propôs `critcall.com.br` em 15/10/2026. A consulta ao
[RDAP oficial do Registro.br](https://rdap.registro.br/domain/critcall.com.br)
retornou HTTP 404, sem registro encontrado. Isso não reserva o nome nem garante
disponibilidade futura. Conferir e registrar na conta do responsável pela
[busca do Registro.br](https://registro.br/busca-dominio/?fqdn=critcall.com.br).
Registro e pagamento dependem do responsável; não foram executados nesta tarefa.

O site atual continua em `https://mhaetinger.github.io/D-D/`. Não há domínio
próprio, DNS ou certificado novo configurados. O login permanece na PR de tarefa;
preparar o domínio não publica a branch nem integra a PR.

## Dados antes da troca

As fichas e notas ainda ficam no armazenamento de cada navegador/origem.
`mhaetinger.github.io`, o ambiente local e `critcall.com.br` têm armazenamentos
diferentes. Login não transfere automaticamente essas cópias.

Antes de ativar um redirecionamento, baixar backup no endereço antigo e conferir
o arquivo. Notas só entram com escolha explícita, em backup privado. No endereço
novo, entrar na conta desejada e importar o backup como cópia. Preservar os dados
antigos; não apagar armazenamento para forçar a mudança. Se necessário, abrir a
versão anterior offline para exportar as fichas que ficaram naquela origem.

## Configuração quando o domínio pertencer ao responsável

1. Verificar a propriedade do domínio no GitHub, usando o TXT fornecido pela
   própria conta. O valor é específico e não deve ser inventado. Em
   [Settings → Pages do D-D](https://github.com/mhaetinger/D-D/settings/pages),
   preencher **Custom domain** com `critcall.com.br` e salvar antes de apontar o DNS.
2. Na zona DNS do domínio, preparar os registros abaixo. Conferir registros
   existentes antes de alterar; não substituir outros serviços ou e-mail por
   inferência. Não configurar um apontamento curinga.

| Nome | Tipo | Destino |
| --- | --- | --- |
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |
| `www` | CNAME | `mhaetinger.github.io` |

O destino de `www` não contém `/D-D/`. Os registros seguem a
[documentação oficial do GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
O domínio raiz é a proposta canônica; conferir também o redirecionamento de `www`.

3. Aguardar a validação do DNS/certificado no Pages e habilitar **Enforce HTTPS**.
   A publicação usa GitHub Actions: um arquivo `CNAME` no código é ignorado nesse
   fluxo e não substitui a configuração administrativa de Custom domain.
4. No Supabase exclusivo do CritCall, definir **Site URL** como
   `https://critcall.com.br/` e acrescentar esse retorno exato à lista permitida.
   Conservar `http://127.0.0.1:5174/` para desenvolvimento e o endereço anterior
   durante a transição necessária. Os caminhos são relativos; não criar uma
   rota `/auth/callback` sem implementação no Pages.
5. Solicitar links novos de confirmação/recuperação pelo domínio novo e abri-los
   no mesmo navegador/origem em que o fluxo foi iniciado. O verificador PKCE do
   endereço antigo não é transferido para outro domínio.

Retornos seguem a [configuração do Supabase](https://supabase.com/docs/guides/auth/redirect-urls).
O mesmo build foi conferido sob `/D-D/` e `/`; DNS, certificado e entrega real de
e-mail só podem ser conferidos depois da configuração externa.

## E-mails das contas

O usuário ainda usa o envio padrão do Supabase, restrito a endereços autorizados
da equipe. Para cadastro/recuperação dos jogadores, preparar SMTP próprio e um
remetente autenticado. O domínio pode ser usado para esse remetente após registro
e validação no provedor; os registros SPF/DKIM dependem do serviço escolhido.
Não inventar esses valores nem colocar credenciais de SMTP no site ou no Git.
[Limites e configuração oficial de SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
