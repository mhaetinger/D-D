# Retomada do CritCall

Estado atualizado em **21/10/2026**. Este é o ponto de entrada para continuar o
projeto sem depender da conversa. Leia também `AGENTS.md`, `README.md`,
`CHANGELOG.md` e [ARQUITETURA.md](ARQUITETURA.md) antes de alterar.

## Onde o trabalho parou

A versão funcional foi publicada em **https://criticall.art/** pelas
[PRs #14](https://github.com/mhaetinger/D-D/pull/14) e
[#15](https://github.com/mhaetinger/D-D/pull/15).

| Referência | Estado conferido em 21/10/2026 |
| --- | --- |
| Produção `main` | `27b30832bf94cd88805cdd1faced6dc00316ff67` |
| Integração `develop` | `61d8ded`, documentação integrada pela PR #16; código funcional igual à produção |
| Revisão offline publicada | `4e263eb66b70d44f` |
| Verificação/publicação | [Workflow 39638188104](https://github.com/mhaetinger/D-D/actions/runs/39638188104), concluído com sucesso |
| Trabalho seguinte | R1 implementada e verificada, em revisão; próxima implementação R2 |
| Branch da tarefa | `feature/bonus-passivos-r1`, criada de `develop` público após a PR #16 |

A organização documental anterior foi integrada em `develop`. O responsável
autorizou continuar a sequência; **R1 — bônus ausentes nos cálculos** está
implementada e verificada no recorte descrito, com limites registrados na
[AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md#roteiro-de-implementação).
A próxima implementação é **R2 — rolagens e gastos condicionais**. As matrizes
e os critérios de conclusão ficam naquele arquivo. Não
marcar uma mecânica como concluída por ter descrição, escolha ou contador.

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
`git fetch origin`. Para continuar esta entrega ainda não integrada,
use `feature/bonus-passivos-r1`. Para uma tarefa nova, parta do
`develop` público atualizado e crie `feature/*` ou `fix/*`. Entregue por PR para
`develop`; após revisão e aprovação, PR para `main`. Não fazer push direto à
`main`, enviar tags extras ou mesclar o histórico privado do protótipo.

Texto para iniciar outra conversa:

> Continue o CritCall. Leia AGENTS.md, docs/RETOMADA.md, README.md,
> CHANGELOG.md e docs/ARQUITETURA.md. Confira a branch e o estado do Git.
> O roteiro atual de regras está em docs/AUDITORIA-LIVRO-2014.md. Confira
> primeiro a entrega R1 e suas verificações/PR; a próxima implementação é R2.

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

## Evidências da última versão funcional

- 385 testes Node, tipos/build e 25 roteiros Chromium aprovados. O workflow da
  `main` também aprovou PostgreSQL descartável/RLS/Storage e a auditoria das
  dependências de produção. São verificações da entrega publicada anterior;
  a entrega R1 tem registro próprio na auditoria. Nenhuma das duas certifica
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
| V4 | Alertas do serviço registrados em 16/10/2026 | Reinspecionar a função `public.rls_auto_enable` e a proteção contra senhas vazadas antes de decidir alterações. Não há evidência de correção; detalhes em [SINCRONIZACAO.md](SINCRONIZACAO.md#alertas-do-serviço-para-revisão). |
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
