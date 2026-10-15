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

O adaptador atual é síncrono com localStorage para preservar os fluxos existentes.
A migração para IndexedDB, revisões atômicas entre abas, histórico por personagem e sincronização terá uma API
assíncrona própria; não foi simulada com gravações remotas fictícias. Checkpoints
atuais da interface ainda ficam somente na sessão e não incluem notas pessoais.

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
2. **Próxima etapa individual:** armazenamento assíncrono com revisões entre abas, histórico/checkpoints
   por personagem e preparação da sincronização; manter migração e exportação.
3. **Contas e sincronização:** implementar autenticação real, propriedade da ficha,
   notas exclusivas do dono, fila offline e conflitos entre dispositivos. Supabase
   Auth/PostgreSQL é a proposta técnica; não há projeto, sessão ou banco conectado.
   Confirmar os dados do serviço e opções de login antes da conexão pública.
4. **Depois da base individual:** retrato, salas, participantes, resumo do grupo e
   turnos do mestre; voz/vídeo por último. Não implementar permissões de mesa só
   escondendo botões nem compartilhar notas pessoais.

Os layouts 2014/2024 continuam sobre o mesmo conjunto de regras de 2014. Regras
da mesa são identificadas, incluindo recuperação integral ao dormir nesta campanha.
