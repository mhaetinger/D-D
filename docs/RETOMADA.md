# Retomada do CritCall

Estado consolidado em **29/10/2026**. Leia também `AGENTS.md`, `README.md`,
`CHANGELOG.md` e [ARQUITETURA.md](ARQUITETURA.md) antes de alterar.

## Onde o trabalho parou

**Em desenvolvimento: Aparar, Sobrevivente, modo/recuperação na iniciativa, Precisão, manobras no acerto,
Adepto Elemental e revisão das quatro invocações**, na branch `feature/manobras-acerto-2014`, iniciada no
develop público `9f676e0`. Tudo permanece agrupado na
[PR #35](https://github.com/mhaetinger/D-D/pull/35), sem mesclar/publicar.
O nono recorte de R2 acrescenta recuperação de reservas vazias na iniciativa:
Implacável (Mestre de Batalha 15), Inspiração Superior (bardo 20) e Auto
Aperfeiçoamento (monge 20). Auto Ficha usa contexto explícito; OFF/Só Pool
permitem confirmar uma nova iniciativa já rolada na mesa. Sortudo/halfling não
recuperam outra vez ao repetir o mesmo d20. Preserva máximos ajustados, valores
ilegíveis, outros recursos/rascunhos e nós/foco. Cobertura de manobras permanece
em sete de dano + Precisão + Aparar, **9/16**; efeitos/alvos/turnos ficam com a mesa.
O décimo recorte reúne fontes de vantagem/desvantagem na iniciativa antes de
cancelar: Instinto Selvagem (bárbaro 7), Explorador Natural (Patrulheiro Revisado
1), inspiração preparada, modo informado e desvantagens verificadas. Resultado
explica as fontes, preservadas em Sortudo/halfling; OFF/Só Pool orientam o dado
físico sem gastar inspiração. Medo/visibilidade, DES/equipamento da Forma
Selvagem, surpresa/Fúria e alvos do primeiro turno continuam na mesa.
O décimo primeiro recorte acrescenta Sobrevivente do Campeão 18 junto aos PV:
5 + CON no começo de um turno declarado, com PV positivos até metade do máximo
vigente. A cura pode ultrapassar a metade; usa máximo reduzido por exaustão.
Passivo funciona em sono/incapacitação com PV positivos, não a 0 PV ou morto;
PV/CON da besta continuam na mesa. Confirmação revalida contexto/permissão e
registra um passo de desfazer. A mesa acompanha os turnos, sem relógio automático.
O décimo segundo recorte integra Aparar ao Dano detalhado por tipo: face + DES,
orçamento único por ataque misto e gasto de um dado junto do dano aplicado.
Preparar a face física/virtual não gasta; cancelar preserva tudo. Confirma corpo
a corpo/reação, revalida contexto, mantém campos e bloqueia envio concorrente.
Aparar e Esquiva são alternativas; a mesa declara a ordem com redução de armadura.
O décimo primeiro recorte (`07cec47`) passou integralmente na CI (552 testes, banco, build
e 45 roteiros); a execução da nova revisão fica na mesma PR. As PRs #33/#34
foram substituídas pela entrega agrupada; não são trabalhos paralelos pendentes.
Nesta rodada passaram 564 testes Node, tipos/build e sete roteiros Chromium;
os detalhes ficam no décimo segundo recorte da auditoria. A CI exige 46 roteiros e PostgreSQL
descartável; resultado da revisão atual na PR #35.

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

A rodada atual reúne a revisão delimitada das quatro invocações, o quinto
recorte de R2 (Adepto Elemental), o sexto (manobras no acerto/Adepto Marcial),
o sétimo (Precisão depois do d20), o oitavo (cinco outras manobras de dano),
o nono (recuperação na iniciativa), o décimo (modo da iniciativa) e o décimo
primeiro (Sobrevivente no começo do turno declarado) e o décimo segundo (Aparar
no dano recebido).
Os critérios e limites estão na auditoria; isso não
promete automação integral de todas as regras do livro. As demais possibilidades
registradas são evoluções da ficha individual. Decisões que pertencem à mesa
podem continuar manuais, com indicação clara, sem bloquear o uso da ficha.

O quarto recorte de R2 já foi publicado; quinto a décimo segundo ficam em desenvolvimento,
junto da auditoria de invocações. Outros adicionais/manobras e os
contextos de magia ainda manuais permanecem na matriz da auditoria. Ordem mantida:
**draconatos → rolagens → magias → importação**.
O ciclo com PDF real foi adiado pelo responsável. R3/R4/R6 permanecem no roteiro,
com a cobertura parcial existente. A integração completa de conjuração por
invocações continua em R5, sem bloquear as correções delimitadas desta rodada.

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
