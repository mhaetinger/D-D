# Retomada do CritCall

Estado atualizado em **23/10/2026**. Este é o ponto de entrada para continuar o
projeto sem depender da conversa. Leia também `AGENTS.md`, `README.md`,
`CHANGELOG.md` e [ARQUITETURA.md](ARQUITETURA.md) antes de alterar.

## Onde o trabalho parou

**Prioridade imediata: egress da sincronização.** O responsável confirmou que
11,78 GB do ciclo vieram do CritCall e autorizou diminuir históricos/versões.
A branch isolada `fix/sync-egress`, baseada no `develop` público, corrige downloads
repetidos por índice de revisões. O histórico passa a 10 estados/256 KiB ao
gravar. A retenção remota já foi reduzida em 23/10 para 5 versões/documento,
7 dias, 50 versões/2 MiB por conta (migração remota `20261023115335`). Os 45
documentos atuais mantiveram a assinatura agregada; apenas versões antigas saíram.
Detalhes, medições e limites em [SINCRONIZACAO.md](SINCRONIZACAO.md#incidente-de-egress-em-23102026).
A correção do cliente segue por PR para `develop`, com revisão e autorização
de publicação pendentes. Verificados localmente 438 testes Node, tipos/build,
PostgreSQL 18 descartável e cinco roteiros Chromium: sincronização, autenticação,
cópia sem conta, abas da conta e atualização offline. A CI exige os 32 completos.
Não misturar a entrega urgente com a auditoria de regras da **PR #21**, preservada
em `feature/auditoria-profunda-2014`, commit `9725f92`. Aquela PR contém correções
A01–A14, sopro de draconato e -5/+10; retomar seus gastos/rerrolagens, magias e
por último importação após resolver o tráfego. O responsável já confirmou e-mails
e envio imediato entre telefone/computador; não repetir essa pendência básica.

A entrega de **22/10/2026** reúne as melhorias da ficha, revisão da importação,
conta e histórico, além de R1 e dois recortes de R2. Integração pela
[PR #19](https://github.com/mhaetinger/D-D/pull/19) e publicação em
**https://criticall.art/** pela [PR #20](https://github.com/mhaetinger/D-D/pull/20).
O responsável autorizou a publicação após a conferência. O resultado e o SHA da
`main` ficam no [workflow de publicação](https://github.com/mhaetinger/D-D/actions/workflows/pipeline.yml?query=branch%3Amain).

| Referência | Estado da entrega de 22/10/2026 |
| --- | --- |
| Produção `main` | Entrega da PR #20; conferir SHA e resultado no workflow acima |
| Integração `develop` | Entrega da PR #19, com R1 e os dois recortes implementados de R2 |
| Revisão offline do artefato preparado | `8c517c3c837af0c0`; conferir `offline-manifest.json` no site após a publicação |
| Conferência da entrega | 433 testes Node, tipos/build e quatro roteiros Chromium do ajuste de abas aprovados localmente; CI exige também banco descartável, auditoria e os 32 roteiros completos |
| Próxima tarefa | Continuar os gastos/rerrolagens restantes de R2, conforme a auditoria; não repetir a implementação de Sortudo |
| Branch encerrada por esta entrega | `feature/talento-sortudo-r2`; criar a próxima a partir de `develop` atualizado |
| R1 | PR #17, com testes/limites na auditoria |
| Primeiro recorte de R2 | PR #18, com Talento Confiável e Sortudo racial |
| Segundo recorte de R2 e interface | PR #19, com talento Sortudo e correções descritas abaixo |

A organização documental e **R1 — bônus ausentes nos cálculos** foram integradas
em `develop`, junto do primeiro recorte de **R2 — rolagens e gastos condicionais**
(Talento Confiável nas perícias e Sortudo racial nos d20 contextuais).
O segundo recorte implementou o **talento Sortudo**, com uma reserva de três
pontos e escolha do d20 nos controles existentes. Escopo e limites estão na
[AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md#roteiro-de-implementação).
Os próximos recortes de R2 cobrem as demais rerrolagens/dados mínimos,
-5/+10 e adicionais de talentos/estilos. As matrizes e os critérios ficam naquele arquivo. Não
marcar uma mecânica como concluída por ter descrição, escolha ou contador.

A PR #19 reúne também as correções de interface desta entrega. O moderno distribui
origens/níveis pela largura e fonte sem remontar seus controles. A consulta usa
os parágrafos dos traços raciais e as características dos 13 antecedentes,
incluindo Ancestral Feérico, Versatilidade em Perícia e Pesquisador.

Abrir a conta pelo nome começa em **Personagens**, a primeira aba. **Perfil**
fica em segundo; avisos/retornos de senha continuam abrindo o perfil. A troca
passou por 433 testes Node, tipos/build e pelos roteiros Chromium de abas,
autenticação, sincronização e cópia sem conta, incluindo mobile/teclado/offline.
O responsável autorizou publicar a entrega acumulada após conferir a CI.

A revisão de PDF destaca observações e distingue identificação/classes, com
relevo até Tendência e ancestralidades em quadros separados. Antecedente/tendência
permitem catálogo ou escrita livre. Idiomas têm um único quadro, separado de
armas/ferramentas/armaduras, com opções para marcar, treino já reconhecido pela
ficha e textos desconhecidos preservados. Testes de resistência ficam após os
atributos, em Combate; suas marcações continuam editáveis e persistentes.
Moedas são editáveis; personalidade/história começam abertas. `createWeaponFields`
atende ficha/importação, com dados, ajustes opcionais e leitura validada; a
proposta permite adicionar/remover ataques. Bônus manual ausente continua não
informado. Validação alcança rascunhos de outra pessoa do mesmo arquivo. Rótulos,
legendas e jogador/XP têm hierarquia acima dos valores. A previsão de reservas
aparece automaticamente, com aplicação explícita que preserva os gastos.
Draconato e Linhagem Dracônica têm ancestralidades independentes na revisão;
as dez cores foram conferidas com o livro, sem deduzir pela pele. A consulta
mostra CD/área/dano do sopro; sua resolução completa continua pendente.

O grimório separa truques/círculos e grupos de classe, mantendo o array salvo.
Escolher do livro e criar efeito próprio são caminhos explícitos. O editor
compartilhado conserva preparo contextual e escolha da origem racial com
habilidade/usos/círculo, agora reversível sem recuperar gastos. Grupos têm
cor, número e título; efeitos sem círculo oferecem uma única lista visível
para escolher Truque ou 1º–9º círculo. Raio Místico é associado a Rajada Mística,
conservando a linha do PDF. A busca local no tema substitui o datalist nativo;
setas/Enter/Esc/toque não confirmam a revisão inteira. Reagrupamento ocorre ao
navegar entre setores, fora do foco do editor, sem cancelar cliques. Cópias,
metadados, textos desconhecidos e usos gastos permanecem preservados.

A recusa **Não quero** de copiar fichas sem conta é lembrada por conta/navegador;
retomar fica no Perfil. Ajudas por mouse esperam um segundo e se substituem.
A descrição da magia fica no livrinho, com clique/Enter/toque para fixar consulta
e acessar o PDF. Essas correções não alteram o dado nem avançam R2–R5.

A última etapa acrescenta divisórias nas características/ferramentas, origem
imediata e livrinho de catálogo nos cartões de magia. Listas de classe não
excluem traços raciais. O cabeçalho da ficha oferece sugestões do livro somente
em edição; trocar raça/antecedente tem prévia e aceite dos valores manuais.
Escolhas antigas deixam de conceder efeitos e ficam aposentadas no evento.
Isso não reconstrói automaticamente bônus e escolhas de uma nova raça.

Conferência local anterior ao ajuste das abas: **433 testes Node, tipos/build, PostgreSQL 18 descartável
e 11 roteiros Chromium**: origens, revisão clara/guiada/setores, PDF/JSON, edição
em linha, cadeado, ajudas, características, sincronização e aplicativo/offline.
A suíte completa tem **32 roteiros** e é exigida na CI desta entrega.
Incluídos 320px/GG/três temas, fonte dos dados e livrinho em modal, nós/rascunhos,
proposta antiga, recarga e limites de retenção/conflitos em duas contas.
Após o ajuste visual final, repetidos origens, revisão clara e setores.
O PDF pessoal foi conferido na etapa anterior, sem alterar o original ou incluir
dados pessoais no repositório. Conferir a CI do último commit da PR #19 antes
de publicar; verificações anteriores ficam no changelog.

**Retenção remota ativa:** a política de 22/10 foi substituída pela migração
local `20261023114717_reduced_sync_retention.sql`, remota `20261023115335`, em
23/10. Limites atuais: 5 versões/documento, 7 dias, 50 versões/2 MiB por conta.
A migração também podou versões antigas de contas inativas; documentos atuais,
notas e imagens não foram alterados. O cliente novo limita gravações legíveis a
10 estados/256 KiB. Não reaplicar migrações para igualar timestamps. Detalhes em
[SINCRONIZACAO.md](SINCRONIZACAO.md).

## Como continuar

Em um clone novo, com Node.js 22.12+:

```sh
git clone --branch develop https://github.com/mhaetinger/D-D.git CritCall
cd CritCall
npm ci
npm run dev -- --port 5174 --strictPort
```

Abra **http://localhost:5174/**. A configuração pública do CritCall acompanha o
build; não precisa copiar `.env.local`. A porta 5173 pertence a outro aplicativo
na máquina original.

Em um clone existente, confira `git status`, preserve trabalho pendente e faça
`git fetch origin`. Esta entrega encerra
`feature/talento-sortudo-r2`. Para a próxima tarefa, parta do `develop` público
atualizado e crie `feature/*` ou `fix/*`. Entregue por PR para
`develop`; após revisão e aprovação, PR para `main`. Não fazer push direto à
`main`, enviar tags extras ou mesclar o histórico privado do protótipo.

Texto para iniciar outra conversa:

> Continue o CritCall. Leia AGENTS.md, docs/RETOMADA.md, README.md,
> CHANGELOG.md e docs/ARQUITETURA.md. Confira a branch e o estado do Git.
> O roteiro atual de regras está em docs/AUDITORIA-LIVRO-2014.md. Confira
> a entrega urgente fix/sync-egress e sua publicação antes de retomar a PR #21.
> A retenção reduzida já está ativa; o cliente precisa ser publicado. Preserve
> a auditoria em feature/auditoria-profunda-2014; não misture as duas entregas.

## Mapa dos documentos

| Arquivo | Responsabilidade |
| --- | --- |
| Este `RETOMADA.md` | Estado publicado, próxima etapa, referências e validações externas pendentes |
| [AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md) | Fonte única do progresso e das pendências de mecânicas; etapas R1–R6 e matrizes |
| [ARQUITETURA.md](ARQUITETURA.md) | Módulos e contratos técnicos existentes |
| [README.md](../README.md) / [CONTRIBUTING.md](../CONTRIBUTING.md) | Uso, execução, verificações e fluxo de contribuição |
| [CHANGELOG.md](../CHANGELOG.md) | Entregas e verificações históricas; não é uma lista de tarefas atuais |
| [LOGIN.md](LOGIN.md) / [SINCRONIZACAO.md](SINCRONIZACAO.md) | Configuração, contratos e limites de contas, fila e imagens privadas |
| [DOMINIO.md](DOMINIO.md) / [CLOUDFLARE.md](CLOUDFLARE.md) | Origem, DNS e procedimento de migração de hospedagem |

Os planos concluídos `REFATORACAO-2014.md`, `PLANO-EXPERIENCIA.md` e
`PRIMEIRA-PUBLICACAO.md` foram retirados nesta consolidação. Seus contratos
vigentes estão nas referências acima; os registros anteriores permanecem no
changelog e no Git. Para consultar os arquivos antes da consolidação:
`git show de3eda0:docs/NOME-DO-ARQUIVO.md`.

Ao concluir uma tarefa, atualize o estado na auditoria se houver mudança de
regra, registre no changelog o que foi feito e testado e atualize este arquivo
somente quando mudar a próxima etapa, a publicação ou uma pendência externa.
Não criar outro plano com uma cópia dessas listas.

## Evidências da entrega anterior — 21/10/2026

- 385 testes Node, tipos/build e 25 roteiros Chromium aprovados. O workflow da
  `main` também aprovou PostgreSQL descartável/RLS/Storage e a auditoria das
  dependências de produção. São verificações da entrega publicada anterior;
  as entregas R1/R2 têm registros próprios na auditoria. Nenhuma das duas certifica
  todas as regras do livro.
- Após a publicação, atualização real com cache HTTP nativo, duas abas e rascunho
  preservado; F5 comum recebeu a versão nova. Conferidos ícones das resistências,
  foco do dado após teclado/minimizar, 390px/GG e ficha/notas offline.
- Também foi conferida a atualização de um artefato antigo real em ambiente
  local, com aba congelada, e o artefato no emulador Cloudflare. Isso não equivale
  a publicação na Cloudflare nem a teste de sincronização entre contas reais.

Evidências locais adicionais estão em
`~/.local/state/critcall/releases/2026-10-21-atualizacao/`. Essa pasta é auxiliar,
fica fora do Git e não é necessária para abrir o projeto em outro computador.
Os links de PR/workflow acima registram a entrega compartilhável.

## Validações externas e trabalho posterior

Estas pendências são separadas do roteiro de mecânicas. Nenhuma delas foi
marcada como concluída nesta revisão de documentos.

| ID | Pendente | Critério para concluir / referência |
| --- | --- | --- |
| V1 | Ciclo completo com os PDFs reais de importação solicitados | Importar como cópia, conferir dados/vínculos, salvar/recarregar e evoluir. Leitura/cancelamento e testes sintéticos já feitos não substituem esse ciclo. Arquivos pessoais continuam fora do Git. |
| V2 | Mesma conta em dispositivos reais e isolamento de outra conta | Conferir fichas, notas, perfil, imagens, offline/reconexão, conflito e restauração, sem pedir credenciais. Contratos em [SINCRONIZACAO.md](SINCRONIZACAO.md). |
| V3 | SMTP próprio e fluxo real de e-mails | Configurar remetente no serviço e conferir cadastro, confirmação, reenvio e recuperação no site. O sucesso local relatado pelo usuário não certifica todos esses fluxos. [LOGIN.md](LOGIN.md) e [DOMINIO.md](DOMINIO.md). |
| V4 | Alertas do serviço reinspecionados em 22/10/2026 | Decidir correção da função `public.rls_auto_enable` e da proteção contra senhas vazadas. Alertas anteriores continuam presentes; detalhes em [SINCRONIZACAO.md](SINCRONIZACAO.md#alertas-do-serviço-para-revisão). |
| V5 | Hospedagem Cloudflare | Conectar administração, criar projeto Pages e configurar credenciais/destino; depois validar domínio e offline. O DNS já usa Cloudflare, mas a hospedagem é GitHub Pages. Seguir [CLOUDFLARE.md](CLOUDFLARE.md). |
| V6 | Remoção voluntária do cache de uma conta em dispositivo compartilhado | Definir exportação/confirmação e comportamento offline; não apagar dados automaticamente. Limites em [LOGIN.md](LOGIN.md#dados-sessão-e-troca-de-conta). |
| V7 | Ambientes, acompanhamento e proteção do repositório | Preparar separação teste/produção, acompanhamento de uso/erros/custos e proteção de branches/aprovações. Não são garantias da configuração atual. |

Salas, autorização de mestre no servidor e voz/vídeo permanecem **fora da base
individual entregue**, para etapas futuras. O contrato de permissão na interface
não significa que salas já existam. OCR/PDF achatado também não está implementado.

## Dados e ponto de retorno

Git transporta código/documentação, não fichas nem filas offline. Antes de trocar
de PC, confira a confirmação de envio no perfil; preserve a origem e mantenha
backup privado se houver pendências. Notas são opcionais no backup. Retratos
usam referências e não levam os arquivos a outra conta.

O serviço exclusivo é **CritCall `qhrpgkpvwbztubnrdhya`**. As migrações já
aplicadas e suas correspondências remotas estão em [SINCRONIZACAO.md](SINCRONIZACAO.md).
Não reaplicar migrações para acertar timestamps nem tocar em outro projeto.

O dado aprovado antes das experiências visuais tem o ponto de retorno pedido
pelo responsável: **`94e44d1da62899dfffabc1ca214c07e4fadfa32d`**, etiqueta local
`checkpoint/antes-efeitos-dado-20261021-94e44d1`. Arquivo auxiliar:
`~/.local/state/critcall/checkpoints/critcall-antes-efeitos-dado-20261021-94e44d1.tar.gz`,
com checksum ao lado, sem fichas privadas. Não enviar a etiqueta por engano.
Para desfazer uma experiência, preferir reverter seu commit e preservar as
correções posteriores, os dados e o histórico público.

## Verificações proporcionais à próxima mudança

Mudança funcional: `npm test`, `npm run build` e navegador pertinente, com dados
fictícios; verificar offline sob `/D-D/`, temas, mobile/GG e foco quando afetados.
`npm run check` executa testes/build e todos os roteiros Chromium. Instalar
Chromium se necessário. Se o Playwright não reconhecer o sistema desta máquina,
o override `PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64` já foi usado;
a CI usa Ubuntu 24.04.

SQL/RLS/RPC: também `npm run test:database`, com PostgreSQL descartável, conforme
README. Não consultar dados pessoais para testar. Documentação isolada: revisar
diff, links locais e coerência dos estados; não repetir testes de comportamento.
