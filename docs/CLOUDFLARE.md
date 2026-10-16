# Cloudflare: migração e crescimento do CritCall

## Estado e direção

Em 16/10/2026, o usuário confirmou a criação de uma conta Cloudflare. O objetivo
é manter o código privado e ampliar os planos dos serviços conforme o uso crescer.
A zona foi criada e os nameservers atribuídos foram conferidos na captura:
`noel.ns.cloudflare.com` e `raegan.ns.cloudflare.com`. O usuário confirmou que
GitHub DNS check e Cloudflare deram OK. Consulta pública confirmou esses
nameservers, HTTPS 200 na raiz e `www` redirecionando para a raiz (301 → 200),
com certificado aceito. A resposta ainda vem do GitHub Pages; projeto Pages
Cloudflare e conexão administrativa continuam pendentes.
O workflow está preparado para os dois destinos; GitHub Pages continua o padrão.

A proposta é GitHub privado para fontes, Cloudflare para o site e DNS, Supabase
para contas/dados e SMTP separado para mensagens. O registro de `criticall.art`
continua na Hostinger. Não é necessário criar outro repositório para o código.

## Primeiro passo no painel

1. Em **Domains / Domínios**, escolher **Onboard a domain / Adicionar domínio**.
2. Informar `criticall.art`, usar a busca automática dos registros e escolher Free.
3. Conferir a importação antes de trocar os nameservers. Durante a transição,
   os apontamentos do site anterior continuam sendo os quatro A do GitHub Pages
   e `CNAME www → mhaetinger.github.io`, descritos em [DOMINIO.md](DOMINIO.md).
   Preservar também os TXT de verificação e outros registros existentes.
4. Enquanto o destino for GitHub Pages, usar **DNS only / Somente DNS** nos
   registros do site. A situação deve ser identificada pelo texto no painel,
   sem depender da cor do indicador.
5. Conferir os dois nameservers atribuídos pela Cloudflare. Eles são específicos
   da zona; não usar exemplos nem inventar os valores. Depois da conferência,
   informar esses servidores na Hostinger para transferir a gestão do DNS.

Seguir o [roteiro oficial de configuração DNS](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/),
incluindo a verificação de DNSSEC antes da troca de nameservers. Não redefinir
a zona inteira para resolver um registro divergente.

## Publicação pelo GitHub Actions

Manter `feature/*`/`fix/*` → PR para `develop` → revisão → PR para `main`.
O destino muda, mas os testes e a revisão continuam antes da produção.

Usar Pages com **Direct Upload** para receber somente o `dist/` já verificado
pelo GitHub Actions. O workflow `.github/workflows/pipeline.yml` já tem um job
Cloudflare opcional, dependente das mesmas verificações e do mesmo artefato.
Somente um destino publica por execução. Evitar ligar
publicação automática por Git em paralelo, para não haver uma segunda entrega
que ignore o resultado dos testes.

A configuração exige a identificação da conta, o nome efetivo do projeto Pages
e um token com permissão **Account → Cloudflare Pages → Edit**, restrito à conta
do CritCall. O token fica nos Secrets do GitHub, nunca no chat, no build ou em
variáveis `VITE_*`. O nome e os identificadores reais devem ser conferidos antes
de criar o destino. Referência: [Direct Upload com CI](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).

No GitHub, em **Settings → Secrets and variables → Actions**, configurar:

| Tipo | Nome | Valor |
| --- | --- | --- |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | Identificador da conta Cloudflare, não o Zone ID. |
| Secret | `CLOUDFLARE_API_TOKEN` | Token restrito à conta, com Cloudflare Pages: Edit. |
| Variable | `CLOUDFLARE_PAGES_PROJECT` | Nome real do projeto Pages criado. |
| Variable | `DEPLOY_TARGET` | `cloudflare` para ativar o destino após revisão. Vazio ou `github-pages` mantém o destino anterior. |

Criar antes o projeto Pages de Direct Upload com branch de produção `main`.
Se necessário, executar localmente com a conta correta autenticada:

```sh
npx --yes wrangler@4.151.1 login
npx --yes wrangler@4.151.1 pages project create NOME_REAL --production-branch main
```

Os comandos acima são um roteiro; nenhum projeto foi criado automaticamente.
Os Secrets ficam restritos ao job de publicação, que só roda após verificações
em push na `main`. Configurar o ambiente `cloudflare-pages` com as regras de
aprovação disponíveis na conta. O job extrai o pacote já testado e usa Wrangler
fixado, sem recompilar. Não ativar `DEPLOY_TARGET` antes de conferir esses dados.
Preparar estas alterações não publica a branch atual nem altera DNS/visibilidade.

Somente depois de conferir a hospedagem nova, associar `criticall.art` em
**Pages → Custom domains** e trocar os registros do destino anterior pelos
fornecidos para o projeto real. Não basta escrever um CNAME no código.
Conferir também `www`, HTTPS e os retornos do login. Para o domínio raiz, a
Cloudflare exige a zona com seus nameservers. Ver [domínios no Pages](https://developers.cloudflare.com/pages/configuration/custom-domains/).

## Conferência antes da mudança definitiva

- Manter backups e confirmar o envio das edições nos dispositivos de origem.
  Não limpar localStorage, IndexedDB ou chaves antigas.
- Conferir ficha, biblioteca, texto selecionável, salvamento, login, retorno de
  recuperação e sincronização real. Os dois PDFs atuais têm cerca de 17 e 20 MiB,
  abaixo do limite atual de 25 MiB por arquivo do Pages.
- Conferir service worker e edição offline no endereço definitivo, preservando
  a política de atualização sem recarga forçada. A origem muda apenas se o
  endereço público mudar; trocar a hospedagem mantendo HTTPS/domínio não exige
  apagar dados locais.
- Tornar o repositório privado depois da transição da hospedagem. No GitHub Free,
  essa mudança despublica o GitHub Pages. Não alterar licença ou visibilidade
  automaticamente apenas por preparar o novo destino.

Limites: [Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits/)
e [mudança de visibilidade no GitHub](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility).

## Crescimento sem trocar o aplicativo

Priorizar aumento de plano mantendo os mesmos projetos, contratos e domínio.
O build já separa `dist/` e permite configurar o Supabase por variáveis. O
adaptador de sincronização concentra as chamadas remotas. Não criar outro banco
nem migrar fichas somente para aumentar a capacidade do projeto existente.

Aumentar limites do mesmo provedor normalmente é uma configuração administrativa.
Trocar de provedor ou encontrar gargalos de consultas/histórico pode exigir código.
Ainda devem ser preparados ambientes de teste/produção e acompanhamento de uso,
erros e custos. A cobrança do Supabase é por organização; conferir a abrangência
do plano antes de contratar, sem afetar serviços de outros projetos por inferência.
Referência: [cobrança do Supabase](https://supabase.com/docs/guides/platform/billing-on-supabase).

## Verificações locais da preparação

O workflow passou no actionlint; na preparação inicial, o empacotamento/extração
preservou os hashes dos 272 arquivos do build, com maior arquivo de 19,85 MiB.
A entrada principal acrescenta as duas imagens de marca ao pacote. O emulador local do Pages
reproduziu os redirecionamentos automáticos de `.html` para caminhos sem extensão.
Foi corrigida a entrega offline dessas respostas, incluindo `/book` e fragmentos; os testes
mantêm também o escopo `/D-D/`. Isso não substitui a conferência no domínio real
nem valida a publicação com as credenciais Cloudflare. A navegação offline após
a correção passou também no emulador Wrangler 4.151.1. Referência sobre os
[redirecionamentos HTML do Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/).
