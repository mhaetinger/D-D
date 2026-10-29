# Retomada do CritCall

Estado consolidado em **29/10/2026**. Leia também `AGENTS.md`, `README.md`,
`CHANGELOG.md` e [ARQUITETURA.md](ARQUITETURA.md) antes de alterar.

## Onde o trabalho parou

**Em desenvolvimento: lote de combate, estabilidade das janelas e avanços em
recursos e magias de 2014**, na branch `feature/manobras-acerto-2014`, iniciada
no develop público `9f676e0`. Tudo permanece agrupado na
[PR #35](https://github.com/mhaetinger/D-D/pull/35), sem mesclar/publicar.

O vigésimo recorte reúne modos contextuais de ataques/testes/resistências,
penalidades de equipamento/Maestria, Fúria/Força Indomável, Duelista Defensivo e
Líder Inspirador, com limites na auditoria. Não transfere valores humanos à forma,
CA de um ataque ao valor permanente nem temporários a outra ficha. A falha da
CI em Inspirar foi reproduzida como ancoragem da página após mudança de altura;
CSS desativa só essa ancoragem durante diálogo aberto, com regressão forçada.
O trabalho deve avançar por módulos/lotes, sem pedir autorização por botão.

Cobertura de manobras: **16/16 com controles nos limites de cada recorte**.
Isso não conclui R2 nem automatiza combate, interação entre fichas ou o livro
inteiro. A mesma PR reúne Adepto Elemental, recuperação/modo contextual na
iniciativa, Sobrevivente e a revisão delimitada das quatro invocações. Critérios,
limites e pendências ficam somente em `docs/AUDITORIA-LIVRO-2014.md`.

A base anterior (`179514a`, Contra-Atacar) passou integralmente na CI: 637 testes,
banco, build e 52 roteiros. As verificações deste avanço ficam na auditoria;
a CI exige agora 54 roteiros e PostgreSQL descartável. Os runs de `d3e2e99`
falharam na posição da página em Inspirar após Node/banco/build passarem; a causa
e a correção estão na auditoria. Resultados atuais na PR #35.
As PRs #33/#34 foram substituídas pela entrega agrupada; não são trabalhos
paralelos pendentes.

**Publicação por entregas agrupadas.** O responsável orientou não publicar cada
correção. Acumular e verificar os ajustes em desenvolvimento; uma PR para `main`
fica para a decisão de fechar uma entrega mais importante. A autorização de
publicações anteriores não deve acionar novos deploys rotineiros.

**Última versão publicada:** quarto recorte de R2, PRs
[#31](https://github.com/mhaetinger/D-D/pull/31) e
[#32](https://github.com/mhaetinger/D-D/pull/32), main `5f131e1`, pacote
`e3bb1b535f14cccb`. Atacante Bestial/Combate com Armas Grandes publicados após
486 testes Node, banco, build e 38 roteiros de navegador; site real conferido
em tela pequena/offline e no fluxo de rerrolagens. Evidências nas PRs e no
[workflow da entrega](https://github.com/mhaetinger/D-D/actions/runs/40049671291).

Entregas anteriores já integradas: A01–A14, Arma de Sopro, –5/+10 e oito curas
auditadas, além de nuvem manual e histórico local de 25 registros. Não reabrir
essas publicações como tarefas pendentes. A matriz única da auditoria mantém
os recortes ainda parciais, sem prometer automação integral do livro.

## Escopo da entrega e próximos avanços

O quarto recorte de R2 já foi publicado; quinto ao vigésimo ficam em
desenvolvimento, junto da revisão delimitada das invocações. A auditoria é a
fonte única de critérios e pendências; as decisões da mesa podem continuar
manuais, com indicação clara. A ordem permanece **draconatos → rolagens →
magias → importação**.

Outros adicionais de talentos/estilos e contextos de magia ainda manuais seguem
nas matrizes. R2/R3/R4/R5/R6 permanecem parciais; não há promessa de automação
integral do livro. O ciclo com PDF real foi adiado pelo responsável, para o fim
da prioridade atual. A integração completa de conjuração por invocações continua
em R5, sem bloquear os avanços delimitados da ficha individual.

**Interação entre fichas é uma etapa futura.** Os módulos puros e a guarda de
permissão da interface podem ser reaproveitados. Aplicar dano/cura/efeitos a
outro personagem exigirá identidade do alvo, consentimento/permissão no servidor,
regras de conflito e testes próprios. Salas, mestre no servidor e voz/vídeo não
existem nesta entrega. Um teste de permissão simulado não comprova essas funções.
Não criar polling, sincronização contínua ou novas consultas de nuvem para
preparar essa interação durante uma correção da ficha individual.

## Salvamento que deve ser preservado

- Fichas/notas salvam automaticamente **neste aparelho**. Envio e recebimento
  da conta, inclusive retratos, exigem **Sincronizar com a nuvem**. Ao trocar de
  aparelho, sincronizar na origem e depois no destino; confirmar o envio no perfil.
- Histórico de desfazer/checkpoints fica local: **até 25 registros / 256 KiB por
  ficha**, ao carregar/migrar/gravar e em memória mesmo sem quota. Um estado
  isolado maior, o original coletivo legado e arquivos ilegíveis são preservados.
- Não contratar plano pago, voltar a sincronização contínua ou limpar dados/caches
  sem nova decisão do responsável. Fichas, notas, imagens e filas existentes ficam.
- Retenção remota já aplicada somente ao CritCall: **5 versões/documento / 7 dias,
  50 versões / 2 MiB por conta**, remota `20261023115335`. Não reaplicar migrações
  para acertar timestamps. Contratos e diagnóstico em [SINCRONIZACAO.md](SINCRONIZACAO.md).
- Referência de consumo recebida às 10:49 de Brasília: **1,537 GB de PostgREST em
  23/10**. Comparar o acréscimo depois de todos atualizarem; o acumulado anterior
  não diminui. Não atribuir bytes/percentuais aos logs sem medição de resposta.

## Como continuar

Em clone novo, Node.js 22.12+ e npm. Em um clone existente, começar por
`git status` e preservar alterações antes de trocar de branch.

```sh
git switch develop
git pull --ff-only origin develop
git switch -c feature/nome-da-proxima-entrega
npm ci
npm run dev -- --port 5174 --strictPort
```

Continuar a branch da PR de desenvolvimento indicada acima ao corrigir sua entrega;
novas tarefas partem de `develop`. A PR #21 já foi concluída.
Não publicar fontes: `npm run build` gera `dist/`, entregue
por Actions após revisão de main. Não enviar tags extras nem histórico privado.

## Mapa dos documentos

| Arquivo | Responsabilidade |
| --- | --- |
| Este `RETOMADA.md` | Estado da entrega, próxima ação e validações externas |
| [AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md) | Fonte única de progresso e limites das mecânicas R1–R6 |
| [ARQUITETURA.md](ARQUITETURA.md) | Módulos, contratos e fronteira da futura interação entre fichas |
| [README.md](../README.md) / [CONTRIBUTING.md](../CONTRIBUTING.md) | Uso, execução, verificações e fluxo de contribuição |
| [CHANGELOG.md](../CHANGELOG.md) | Entregas e verificações históricas |
| [LOGIN.md](LOGIN.md) / [SINCRONIZACAO.md](SINCRONIZACAO.md) | Contas, fila, imagens e retenção |
| [DOMINIO.md](DOMINIO.md) / [CLOUDFLARE.md](CLOUDFLARE.md) | DNS, hospedagem e migração opcional |

Os planos concluídos `REFATORACAO-2014.md`, `PLANO-EXPERIENCIA.md` e
`PRIMEIRA-PUBLICACAO.md` foram retirados; seu histórico permanece no Git.
Registros de testes/entregas anteriores estão no changelog e na auditoria.
Artefatos em `~/.local/state/critcall/releases/` são evidência auxiliar local,
sem fichas privadas, e não substituem as PRs nem este ponto de retomada.

## Validações externas e trabalho posterior

Estas validações são separadas do roteiro de mecânicas. Em 23/10, o responsável
confirmou e-mails e sincronização básica real; os casos adicionais abaixo
não foram incluídos automaticamente nesse relato.

| ID | Pendente | Critério para concluir / referência |
| --- | --- | --- |
| V1 | **Adiado pelo responsável; último na prioridade atual:** ciclo com PDFs reais | Retomar após draconatos, rolagens e magias. Importar como cópia, conferir vínculos, salvar/recarregar e evoluir. Testes sintéticos não substituem o ciclo; arquivos pessoais ficam fora do Git. |
| V2 | **Uso básico anterior validado pelo responsável em 23/10; modo manual posterior testado automaticamente** | Conferir o botão manual entre aparelhos reais e, depois, os casos adicionais de offline/conflito/restauração/imagens/isolamento. O relato do modo anterior continua válido; não pedir novamente o teste básico como se nunca tivesse ocorrido. Contratos em [SINCRONIZACAO.md](SINCRONIZACAO.md). |
| V3 | **E-mails validados pelo responsável em 23/10** | SMTP próprio continua uma configuração de infraestrutura opcional, sem confirmação de ativação; não manter o teste funcional de e-mail como bloqueio. [LOGIN.md](LOGIN.md) e [DOMINIO.md](DOMINIO.md). |
| V4 | Alertas do serviço reinspecionados em 23/10/2026 | Decidir correção da função `public.rls_auto_enable` e da proteção contra senhas vazadas. Alertas anteriores continuam presentes; detalhes em [SINCRONIZACAO.md](SINCRONIZACAO.md#alertas-do-serviço-para-revisão). |
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
