# Domínio e origem do CritCall

Referência de configuração. Estado publicado e validações externas ficam em
[RETOMADA.md](RETOMADA.md); o procedimento de transferência de hospedagem está
em [CLOUDFLARE.md](CLOUDFLARE.md).

## Configuração registrada

| Parte | Estado |
| --- | --- |
| Endereço principal | **https://criticall.art/** |
| `www` | Redireciona para a raiz; 301 → 200 conferido em 16/10/2026 |
| Registro do domínio | Hostinger, compra confirmada em 16/10/2026 |
| Gestão do DNS | Cloudflare; nameservers `noel.ns.cloudflare.com` e `raegan.ns.cloudflare.com` conferidos em 16/10/2026 |
| Hospedagem atual | GitHub Pages, fonte GitHub Actions; publicação mais recente registrada na retomada |
| Hospedagem proposta | Cloudflare Pages; projeto/credenciais/ativação ainda pendentes |
| Site URL do CritCall | `https://criticall.art/`, retorno aceito pelo Supabase em 16/10/2026 |

HTTPS com certificado aceito e DNS foram conferidos em 16/10/2026. Em 21/10/2026,
a versão funcional publicada foi conferida no domínio. Isso não equivale à
validação completa de cadastro/recuperação por e-mail ou sincronização entre
contas/dispositivos reais. Conferir o estado administrativo antes de qualquer mudança.

## DNS da hospedagem atual

Os registros abaixo documentam o destino GitHub Pages já configurado. Não são
os registros do futuro Cloudflare Pages. Como os nameservers estão na Cloudflare,
a gestão ativa da zona é feita lá, não no editor DNS antigo da Hostinger.

| Nome | Tipo | Destino |
| --- | --- | --- |
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |
| `www` | CNAME | `mhaetinger.github.io` |

Preservar TXT de verificação, registros de e-mail e outros serviços. O domínio
personalizado e HTTPS são configurações administrativas do GitHub Pages; um
`CNAME` no código não substitui essa configuração no fluxo por Actions.
Referência: [domínio personalizado no GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

Ao migrar, associar o domínio ao projeto Cloudflare real e usar os registros que
o serviço fornecer. Seguir o procedimento e a conferência de [CLOUDFLARE.md](CLOUDFLARE.md).
Manter HTTPS/domínio conserva a origem do navegador; não mudar o endereço nem
apagar dados locais apenas por trocar a hospedagem.

## Dados e mudança de origem

`mhaetinger.github.io`, localhost, `127.0.0.1` e `criticall.art` são origens
diferentes, com armazenamento e verificadores PKCE separados. A conta recebe no
novo endereço somente os dados cujo envio foi confirmado. Edições offline ainda
pendentes precisam ser enviadas pelo dispositivo de origem ou exportadas antes
da transição. Notas só entram no backup com escolha explícita; referências de
retratos não transferem os arquivos para outra conta.

Antes de redirecionar uma origem antiga, preservar/exportar seus dados e conferir
o backup. Importar gera cópias, sem substituir fichas existentes. Não limpar
localStorage, IndexedDB ou caches privados para forçar a mudança. Git transporta
código, não fichas pessoais nem filas.

## Retornos de autenticação

Projeto exclusivo CritCall: **`qhrpgkpvwbztubnrdhya`**. Os retornos registrados e
conferidos são `https://criticall.art/`, `http://localhost:5174/` e
`http://127.0.0.1:5174/`. Conservar um retorno anterior enquanto a transição
precisar dele. O endpoint real foi consultado com tokens aleatórios inválidos,
sem enviar e-mails ou alterar usuários/senhas; isso verifica o destino do retorno.

Os caminhos do build são relativos, testados em `/` e `/D-D/`. Não criar uma rota
de callback sem implementação. Confirmação/recuperação PKCE deve começar e
terminar no mesmo navegador, dispositivo e origem; pedir links novos após trocar
de endereço. Comportamento e limites em [LOGIN.md](LOGIN.md).

## E-mails das contas

SMTP próprio continua pendente em V3 da retomada. O usuário confirmou somente a
compra do domínio, sem conta de e-mail; a proposta anterior foi Resend, sem
ativação registrada. Antes de contratar/configurar, conferir os limites e dados
atuais do provedor. SPF/DKIM vêm do serviço escolhido e não devem ser inventados.
Credenciais ficam na administração do Supabase, fora do site, Git e conversa.
Referência: [configuração de SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

Depois da configuração, conferir entrega e conclusão de cadastro, confirmação,
reenvio e recuperação no site. Os contratos de dados e as migrações já aplicadas
permanecem em [SINCRONIZACAO.md](SINCRONIZACAO.md).
