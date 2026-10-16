# Arquitetura e próximas etapas

## Base implementada

A interface aprovada foi preservada, com migração gradual para Vite e TypeScript.
O aplicativo continua independente de mesa, login ou serviço externo para usar as
fichas locais. Não foi adotado um novo framework de interface nesta etapa.

| Local | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura da ficha e diálogos existentes. |
| `src/main.ts` | Fontes, estilos, ícones, interface, backup e registro offline. |
| `src/app/sheet.js` | Interface anterior extraída, ainda com ponte global para eventos dos cartões/assistentes. |
| `src/styles/` | Tailwind compilado e estilos/temas preservados. |
| `src/storage/` | Formato/validação de fichas, migração local, backup, importação e recuperação. |
| `src/auth/` | Configuração pública, sessão Supabase e interface de entrada/cadastro/recuperação. |
| `src/sync/` | Documentos pessoais, fila IndexedDB, cliente Supabase, datas e recuperação de versões. |
| `supabase/migrations/` | Tabelas/RLS/RPC de salvamento pessoal; migração aplicada ao CritCall real em 16/10/2026. |
| `src/pwa/` | Registro do service worker e informação de disponibilidade offline. |
| `public/rules/` | Motor sem DOM, catálogos, assistente, balões, rolagem e animações. |
| `public/book.html`, `public/books/`, `public/vendor/pdfjs/` | Biblioteca, dois PDFs e leitor com suas licenças. |
| `scripts/build-offline.mjs` | Valida o artefato e gera cache versionado a partir dos arquivos reais do build. |
| `tests/` | Regras, 41 subclasses, armazenamento e navegador sobre o build. |
| `dist/` | Saída gerada para publicação; não é fonte de desenvolvimento. |

Os scripts clássicos de regras permanecem compatíveis com Node para seus testes.
A ponte em `sheet.js` conserva os eventos existentes durante a extração; novos
módulos devem usar APIs explícitas e listeners, reduzindo essa ponte aos poucos.
Regras não devem depender de DOM, armazenamento ou rede.

## Dados locais e backup

`CharacterStore` lê `orbyt_characters_v1`, envelope com `schemaVersion: 1` e
`characters`. Se essa chave ainda não existe, lê `dnd_sheet_public_v1` e copia os
dados validados, mantendo o conteúdo anterior para recuperação/retorno à versão
antiga. O armazenamento permanece no mesmo navegador e origem.

A validação cobre a estrutura consumida pela ficha e limites básicos; não
substitui o motor de regras nem uma futura auditoria completa de segurança.
Erros de JSON/formato/versão preservam o original e impedem gravação sobre dados
ilegíveis. A recuperação por importação pede confirmação e guarda os bytes
originais em uma chave própria. Quota/permissão não são tratadas como sucesso.
Se a leitura foi bloqueada, reabrir a página após permitir o armazenamento antes
de gravar/importar sobre dados que ainda não puderam ser conferidos.

Anotações continuam em `dnd_player_private_notes_v1`, por ID do personagem,
separadas de ficha, impressão e snapshots. Backups só incluem notas com escolha
explícita. O formato `orbyt.character-backup`, versão 1, tem data e personagens,
com `privateNotes` opcional e separado. Importar cria novos IDs e remapeia as
notas correspondentes; não substitui personagens com o mesmo ID ou nome.
Arquivos de até 20 MB são aceitos; versões desconhecidas são rejeitadas.

O adaptador da interface conserva localStorage e o formato legado. A fila nova
usa transações IndexedDB por projeto/usuário, com IDs de operação idempotentes,
revisões remotas e projeção que aguarda editores. Histórico/checkpoints passam a
ser persistidos separadamente e entram na fila; seus snapshots não incluem notas.

## Login preparado, ativação pendente

Confirmados e-mail/senha e projeto exclusivo do CritCall em 15/10/2026. O usuário
identificou o projeto novo `qhrpgkpvwbztubnrdhya`. URL/chave publicável estão na
configuração pública revisada `src/auth/public-project.ts`, incluída no build.
Os fluxos usam Supabase JS 2.118.0. Ferramentas conferiram API real e recusa de
credenciais inexistentes, sem cadastrar ou enviar e-mails. O usuário confirmou
cadastro, confirmação e entrada reais. Os dois retornos locais em 5174 foram
aceitos pelo endpoint real após o ajuste de localhost. O usuário confirmou que
abriu o link de recuperação em outro navegador/dispositivo, embora o retorno
fosse localhost. O fluxo PKCE atual exige o navegador/dispositivo de origem.
Após essa orientação, em 16/10/2026 o usuário relatou sucesso no teste local de
recuperação/troca. Isso não é validação da publicação, SMTP próprio ou duas contas.
Orbyt é outro projeto do responsável e permanece separado. O
aplicativo tem os identificadores públicos do CritCall incluídos; o modo local
pode ser escolhido com `VITE_AUTH_ENABLED=false`. O bootstrap valida a identidade
antes de importar `sheet.js`; chaves de armazenamento pessoais recebem prefixo por projeto/usuário.
As chaves originais permanecem no modo sem login, sem adoção automática.
O título, a instalação e os downloads usam CritCall. Identificadores legados
com `orbyt` são mantidos apenas para compatibilidade de fichas/backups publicados;
novos espaços de login/conta usam `dnd_auth_v1`/`dnd_account_v1`.

Sessões online passam por `getUser`; uma identidade previamente validada só
seleciona sua cópia local offline. Esse cache não é criptografado nem representa
autorização remota. Trocas limpam histórico/interface e cancelam confirmações
pendentes; editores abertos exigem decisão antes do fechamento. Rascunhos com
falha de quota são preservados por espaço em memória, sem gravar na conta nova.

A branch implementa sincronização pessoal: fichas, notas privadas separadas,
perfil, preferências, histórico/checkpoints e recuperação. A migração define
critcall_documents/critcall_versions, RLS do dono e RPCs restritas. Em 16/10/2026,
o conector confirmou o projeto exclusivo `qhrpgkpvwbztubnrdhya`, ativo em
PostgreSQL 17.11 e identificado como D-D no painel. Antes da aplicação, não havia
tabelas públicas nem migrações. A migração `personal_sync` foi aplicada com a
versão remota `20261016101143`, a partir do arquivo
`202610160001_personal_sync.sql`. Conferidas RLS, leitura apenas do dono e
grants restritos; a API recusou anon nas duas tabelas. As RPCs negam EXECUTE
a anon, permitem authenticated e têm `search_path` vazio. Teste SQL real com
identidade sintética, integralmente revertido, confirmou escrita/idempotência
e isolamento do dono, sem dados pessoais. Cliente e SQL também foram testados
com HTTP controlado e PostgreSQL 16 descartável, respectivamente. Ainda faltam
sincronização real entre dispositivos, publicação, SMTP próprio e revisão dos
alertas descritos em SINCRONIZACAO.md. Contratos em [LOGIN.md](LOGIN.md) e [SINCRONIZACAO.md](SINCRONIZACAO.md).

Documentos têm revisão crescente e datas de edição/recebimento, com calibração
do relógio. Se edições simultâneas disputam a mesma revisão, vence a data mais
recente e ambas ficam no histórico; não há mesclagem automática campo a campo.
Exclusões usam tombstones, e restaurar cria nova operação após confirmação.
Outro PC só recebe edições offline depois da reconexão/envio do dispositivo
de origem. A cópia local anterior sem data não se apresenta como edição nova.
O nome passa a ser salvo ao digitar, com aviso de erro em vez de falso sucesso.

O preflight e o navegador usam o mesmo resolvedor: o projeto público é o padrão,
um override exige URL/chave completos, e chaves privilegiadas são recusadas mesmo
com login desligado. O workflow não depende de repository variables para essa
configuração. O arquivo público não contém capacidade administrativa ou dados de
usuários. Links inválidos não encerram uma conta válida já aberta; a mensagem de
entrada depende da conferência da identidade, além da resposta de token. A conta
conectada pode solicitar um link de troca de senha para seu próprio e-mail
validado; a conclusão usa o mesmo retorno PKCE da recuperação.
Erros do retorno distinguem expiração no serviço, solicitação indisponível,
verificador incompatível e ausência da solicitação no navegador/endereço. Nenhum
desses avisos expõe o código de acesso, token ou texto bruto vindo da URL.

O domínio próprio proposto é `critcall.com.br`, ainda sem registro/DNS configurados.
Caminhos relativos e retornos pela origem atual funcionam sob `/D-D/` e `/` nos
testes. Antes de mudar a origem, exportar dados locais e configurar Pages, DNS,
HTTPS e retornos no Supabase conforme [DOMINIO.md](DOMINIO.md). Não há migração
entre origens ou sincronização remota simulada nessa mudança.

## Dependências, build e publicação

Dependências e lockfile fixados; fontes e ícones são compilados/hospedados com o
aplicativo. O build mantém apenas os ícones usados. Licenças acompanham os arquivos.
Tailwind 3 foi mantido para preservar as utilidades do visual existente.
PostCSS 8.5.30 e o override de `postcss-selector-parser` 7.1.6 corrigem os avisos
com versões disponíveis, preservando o CSS gerado. O aviso remanescente da cadeia
de build e sua exposição estão registrados no guia da primeira publicação.

Vite usa caminhos relativos para permitir `/D-D/` no Pages e domínio próprio.
Somente `public/` e os assets gerados entram em `dist/`; não copiar a pasta inteira
do projeto. Os únicos PDFs permitidos no artefato são os dois livros autorizados.
O gerador confere isso e recusa arquivos de desenvolvimento inesperados.

A pipeline testa branches e pull requests, com permissões de leitura. O job de
publicação só existe para push na `main`, após o job de verificação, usando o
ambiente `github-pages`. Publicar exige configurar a fonte do Pages como GitHub
Actions na conta; preparar o workflow não afirma que o site já foi ativado.
Proteção de branches/aprovações automáticas ainda dependem das configurações do
repositório; o fluxo convencionado continua em `CONTRIBUTING.md`.
Cada execução aprovada também guarda o artefato `github-pages` por três dias para
revisão, sem publicar branches de trabalho. A auditoria de dependências de produção
faz parte da verificação; somente o job da `main` tem permissão de publicação.

## Offline e atualizações

O build calcula uma revisão pelo conteúdo dos arquivos e gera `sw.js` com a lista
dos recursos da ficha e do leitor. Cache por revisão e escopo evita misturar builds
ou interferir em outros projetos no mesmo domínio. O worker normaliza a raiz do
projeto para `index.html`, mantendo a entrada pelo endereço do Pages offline.

Uma versão ativa entrega HTML, regras e assets do seu próprio cache. A nova versão
aguarda as abas antigas fecharem; não usa `skipWaiting` ou recarga forçada. Cache
antigo do aplicativo é removido só na ativação, sem tocar em fichas/anotações.
O cache não recebe respostas de APIs, requisições privadas ou PDFs. Os livros
exigem rede no leitor integrado; baixar o PDF é uma ação separada do jogador.
O indicador no perfil informa quando o primeiro preparo offline terminou.

## Sequência de evolução

1. **Concluído nesta etapa:** estrutura de aplicação, build, dependências locais,
   backup, recuperação, migração preservando legado e funcionamento offline da ficha.
2. **Implementado na branch:** fila IndexedDB, histórico/checkpoints persistidos,
   nome automático, sincronização pessoal e versões recuperáveis.
3. **Validação de contas/dados:** migração aplicada e RLS conferida no CritCall;
   conferir sincronização com duas contas/dispositivos reais,
   SMTP próprio e publicação por PR. Conta e recuperação locais foram relatadas
   como bem-sucedidas; isso não valida a sincronização real.
4. **Depois da base individual:** retrato, salas, participantes, resumo do grupo e
   turnos do mestre; voz/vídeo por último. Não implementar permissões de mesa só
   escondendo botões nem compartilhar notas pessoais.

Os layouts 2014/2024 continuam sobre o mesmo conjunto de regras de 2014. Regras
da mesa são identificadas, incluindo recuperação integral ao dormir nesta campanha.
