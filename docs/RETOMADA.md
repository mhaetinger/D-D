# Retomada do CritCall

Estado consolidado em **23/10/2026**. Leia também `AGENTS.md`, `README.md`,
`CHANGELOG.md` e [ARQUITETURA.md](ARQUITETURA.md) antes de alterar.

## Onde o trabalho parou

**Quarto recorte de R2 em `feature/rerrolagens-dano-2014`:** Atacante Bestial e
Combate com Armas Grandes usam escolhas após o dano, com conjuntos/faces
preservados ao retomar e sem repetir gastos. Limites, fontes e verificações
ficam na seção correspondente da auditoria; R2 segue parcial. Esta mudança não
antecipa importação nem interação entre fichas. Passaram 486 testes Node,
build e seis roteiros pertinentes; CI exige 38 e banco. Publicação conforme PRs e CI.

**Revisão paralela de curas integrada em `fix/curas-fixas-gemea`.** Dos oito
casos conferidos pelo Claude, reproduzidos e corrigidos dois achados delimitados:
classificação/resumo de Cura Completa/Em Massa e Gêmea indevida em Bom Fruto.
A integração cobre também fichas antigas já salvas, sem alterar seus campos.
Passaram 478 testes Node, build e dois roteiros de navegador; a CI exige os 37.
Fontes, contratos e melhorias opcionais estão somente na auditoria. Publicação
conforme o workflow da main e a descrição das PRs desta entrega. Próxima entrega
pequena de R2 está descrita acima; o restante da revisão de curas é opcional.


**Entrega de regras autorizada pelo responsável: concluir a PR #21.** Ela reúne
as correções A01–A14, Arma de Sopro e –5/+10 de Atirador Aguçado/Mestre de Armas
Grandes. A branch `feature/auditoria-profunda-2014` incorporou o modo manual e o
limite local de 25 registros; seu código em `3290de6` passou por **474 testes
Node, banco, tipos/build e os 36 roteiros completos de navegador** na CI.
Workflows aprovados:
[39973130541](https://github.com/mhaetinger/D-D/actions/runs/39973130541) e
[39973122150](https://github.com/mhaetinger/D-D/actions/runs/39973122150).
A conferência adicional desta entrega repetiu o diagnóstico puro: **3.321
verificações, zero divergências**. O estado e as limitações de cada regra ficam
somente em [AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md).

A autorização atual é verificar, integrar por PR para `develop` e publicar
por PR para `main`, preservando o que funciona. O resultado da publicação deve
ser conferido no [workflow da main](https://github.com/mhaetinger/D-D/actions/workflows/pipeline.yml?query=branch%3Amain)
e na [PR #21](https://github.com/mhaetinger/D-D/pull/21), com a referência da
entrega para main. SHA, pacote e conferência pública ficam nas descrições dessas
PRs; essa ligação evita tratar registros de entregas anteriores como estado atual.

A base pública imediatamente anterior à entrega de regras é **#26/#27**, main
`5d3861c`, pacote `778d8cff1b44f0f6`: 443 testes Node, banco, build e 33 roteiros
aprovados. Site público conferido com histórico fictício de 80 → 25 registros,
permanecendo no estado atual, tamanho de celular e recarga offline sem erros.
O localhost:5174 já recebeu a integração `3290de6`, preservando a auditoria.

## Escopo da entrega e próximos avanços

A entrega atual fecha os casos de correção registrados como A01–A14 e os dois
controles já implementados. Os critérios e limites estão na auditoria; isso não
promete automação integral de todas as regras do livro. As demais possibilidades
registradas são evoluções da ficha individual. Decisões que pertencem à mesa
podem continuar manuais, com indicação clara, sem bloquear o uso da ficha.

O recorte atual avança as rerrolagens de R2, conforme a matriz da
auditoria. Ordem mantida: **draconatos → rolagens → magias → importação**.
O ciclo com PDF real foi adiado pelo responsável. R3/R4/R6 permanecem no roteiro,
com a cobertura parcial existente, sem acrescentar controles nesta publicação.

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

Até concluir a PR #21, continuar sua branch quando indicado; depois, novas tarefas
partem de `develop`. Não publicar fontes: `npm run build` gera `dist/`, entregue
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
