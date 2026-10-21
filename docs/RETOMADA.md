# Retomada do CritCall em outro PC

Estado conferido em **21/10/2026**. Este documento permite continuar sem o
histórico da conversa. Leia também `AGENTS.md`, `README.md`, `CHANGELOG.md` e
`docs/ARQUITETURA.md` antes de alterar o projeto.

## Abrir a versão em desenvolvimento

Repositório: https://github.com/mhaetinger/D-D.
Branch atual: **`feature/regras-universais`**, baseada no histórico público de `develop`.
A criação guiada foi integrada pelas PRs #7/#8. A revisão atual está em
[REFATORACAO-2014.md](REFATORACAO-2014.md): regras/recursos, armas/CA,
preparação, textos, criador, zoom, moeda e migração de identificadores.
Não mesclar/publicar esta revisão sem aprovação. A branch remota `develop`
foi restaurada após a entrega na referência de integração já aprovada
`b1155fbc5d14a566f548814bd808374aa2383721`, merge da PR #7.

**Entrega anterior substituída:** o formulário separado do commit `deec8c8`
foi retirado. Os valores agora são editados na própria ficha; não retomar o
fluxo antigo de Criar/Ajustar ficha manual pelo perfil. A conexão foi recuperada:
a implementação `fe2dc66` foi enviada em 20/10 e a [PR #9](https://github.com/mhaetinger/D-D/pull/9)
foi atualizada com base `develop`. Não houve merge/publicação desta etapa.

**Ponto de retorno pedido pelo responsável:** estado aprovado em `94e44d1`,
etiqueta local `checkpoint/antes-efeitos-dado-20261021-94e44d1`. Arquivo
`~/.local/state/critcall/checkpoints/critcall-antes-efeitos-dado-20261021-94e44d1.tar.gz`
com checksum ao lado; não contém fichas privadas. A etiqueta fica local, sem
envio de tags extras. Para desfazer uma experiência, preferir reverter somente
o commit correspondente, preservando dados e o histórico compartilhado.

**Consulta no celular:** `app/feature-consult.ts` reúne regra, origem, escolhas
e livro no mesmo balão do hover. Toque/clique fixa a consulta; ×/Esc/fora fecham.
Ações de recursos continuam separadas. Atributos móveis têm margem zerada com
escopo suficiente para sobrepor `space-y`, preservando a altura da mesma linha.
Conferidos 385 testes Node, tipos/build e Chromium de consulta, regras e
tipografia, incluindo hover/toque/teclado, rolagem contida e mobile M/GG/temas.

**Nomes secundários dos recursos:** dentro das características, nomes como
Canalizar Divindade usam fonte de apoio (14px em M), peso 600 e itálico, com
menos destaque que o título. Mudança só de CSS; mantém usos, botões e ajuda.
Conferidos 385 testes Node, tipos/build e Chromium de regras: três temas,
dois layouts, 320px/GG, foco/recursos preservados e capturas desktop/celular.

**Alinhamento e separadores compactos:** no grimório, as ações de concentração
se alinham à direita, incluindo o registro manual. Níveis das características
ficam centralizados entre linhas finas via CSS, mantendo os controles e nós.
Conferidos 385 testes Node, tipos/build e Chromium de regras e quadros de
conjuração, incluindo três temas/dois layouts/320px/GG e capturas M/GG.

**Fontes, margens e dicas padronizadas:** Perfil/Personagens têm leitura 16px,
apoio 14px, botões 15px e títulos distintos em M; acompanham P/M/G/GG. A janela
tem até 36rem e o backup se reorganiza no celular. Quadros de classe, barra e
cabeçalhos dos círculos usam `--sheet-panel-inset`; ações de preparo e recursos
compartilham fonte, cor e preenchimento. Concentração separa ações/duração/testes.
Na revisão, o preparo adaptado tem margem após a lista. `app/help.ts` usa o balão
existente por hover/foco, incluindo foco no checkbox pelo teclado; clicar mantém
a seleção normal. Preservados nós, rascunhos, regras e dados.
Conferidos 385 testes Node, tipos/build e seis scripts Chromium: perfil,
cadeado/dicas, quadros de classe, concentração, revisão por setores e criação;
fontes em M, margens/ações/duração, hover/clique independentes, foco/Esc no
diálogo nativo, cópias/cancelamento, offline e 320px/GG/três temas/dois layouts.

**Quadros de conjuração por classe:** `rules/spell-class-panels.ts` reúne preparo
e recuperações de `spellbook` em quadros compactos. Paladino/Clérigo/Druida/Mago
usam o contador existente; conhecidas/subclasses têm resumos, sem contar origens
especiais como magias da classe. Respeita níveis e vínculo estruturado. Feitiçaria,
Pacto, espaços compartilhados e concentração não são duplicados. Conferidos 385
testes Node, tipos/build e Chromium de quadros, regras e concentração, com preparo,
recuperação/cancelamento, recarga offline e 320px/GG/três temas/dois layouts.

**Perfil e personagens em abas:** `app/account-panel.ts` mantém Perfil na primeira
aba e coleção na segunda, com Lista/Cartões e preferência deste navegador. Não
remonta formulários nem os cartões ao alternar visual; retratos e ações ficam
preservados. Backup, importação e revisão como cópia aparecem somente em
Personagens; armazenamento/sincronização continuam comuns. Cada abertura começa
em Perfil. Cartões quadrados ampliam altura para nomes longos/GG; uma coluna no
celular. Conferidos 385 testes Node, tipos/build e Chromium de perfil/coleção,
aplicação, autenticação e sincronização com HTTP simulado: teclado/campos,
retratos, abrir/excluir/cancelar após reordenação, dados/backup, isolamento e
falhas, offline e 320px/GG/três temas.

**Editor de armas alinhado:** controles de cálculo usam os mesmos estilos do
tema, com rótulos acima dos campos. Ajustes adicionais ficam recolhidos no próprio
editor; grade e botões de dados se adaptam à largura real da coluna. Mantidos
IDs, rascunhos, metadados e contratos do cálculo/salvamento. Não retomar o bloco
de opções sem estilo que ficava todo aberto no topo do editor. Conferidos 385
testes Node, tipos/build e seis scripts Chromium (editor, perfil/coleção,
aplicação, importação, edição na ficha e cadeado), incluindo armas manuais e
automáticas, dados/ajustes/metadados, cancelamento, recarga, cópias/notas/offline
e 320px/GG/três temas/dois layouts.

**Avisos nas janelas:** `app/notices.ts` encaminha `showToast` à região de status
da janela em uso, priorizando diálogos nativos. Criador/preparo, perfil e loja
têm regiões próprias; a ficha continua com toast. Preserva nós/foco/rolagem,
texto seguro e prioridade da falha de gravação. Fechar oculta o aviso e mensagens
novas cancelam o timer anterior. Limite de preparo tem mensagem curta. A dica de
concentração identifica o registro compartilhado das abas e distingue preparo.
Conferidos 385 testes Node, tipos/build e seis scripts Chromium: quadros/preparo,
criação, armas, concentração, setores e ataques mágicos; avisos reais de limite,
item sem nome e validação nativa, modos de dados, offline e 320px/GG/temas/layouts.

**Saída do preparo e características agrupadas:** a primeira etapa oferece
Voltar à ficha, com a confirmação existente para escolhas pendentes. Abrir/cancelar
não confirma o lembrete do descanso; aplicar confirma. Removida a introdução
genérica da etapa de magias. `rules/feature-groups.ts` organiza ganhos por
classe/origem e nível, conservando índices, controles, escolhas e descrições.
Colunas largas dividem níveis inteiros; fontes raciais/antecedente e anotações
manuais permanecem separadas. Conferidos 385 testes Node, tipos/build e Chromium
de preparo/quadros, regras, criação e edição em linha: saída/cancelamento/retorno,
foco/nós/rolagem, preparo protegido, vínculos multiclasse, controles únicos,
descrições abertas, persistência/offline e 320px/GG/três temas/dois layouts.

**Armas com layout reorganizado:** descrição usa a largura inteira, ataque/dano
têm colunas próprias e empunhadura/crítico/registro ficam no rodapé. Notas foram
preservadas; crítico mantém geometria e empunhadura conserva foco. Conferidos 385
testes Node, tipos/build e Chromium de armas, regras e edição em linha, incluindo
notas longas, offline e 320px/GG/três temas/dois layouts.

**Inspiração reposicionada:** linha própria no quadro de PV, separada da
Exaustão, sem novo cartão ou estado. Dicas explicam dano recebido, condições e
concentração. Conferidos 385 testes Node, tipos/build e Chromium de PV e
concentração, incluindo consumo/cancelamento e 320px/GG/três temas/dois layouts.

**Cabeçalho compacto e Upar com cadeado fechado:** classes têm faixa própria,
subclasse longa abre para leitura e identidade vira linhas no celular. Preferências
ficam em Visual e dados, recolhidas em tela pequena; resize conserva o foco.
Upar usa autorização de edição na abertura/confirmação, sem destravar campos.
Recusa da confirmação mantém escolhas abertas; IDs diferentes são rejeitados.
Conferidos 385 testes Node, tipos/build e Chromium de tipografia, cadeado, criação,
edição em linha e aplicação: M/GG, três temas/dois layouts, 320/390/768/1140px,
rascunhos/foco, evolução protegida, revogação, mestre/jogador e evolução offline.

**Revisão de importação mais legível e compacta:** texto/campos 16px em M,
rótulos 15px e títulos distintos. `src/import/pool-fields.ts` recolhe reservas
zeradas; Conjuração/Pacto/Feitiçaria têm aberturas independentes. Dados inválidos
não viram zero, campos recolhidos continuam validados e são revelados antes do
foco. Nós e rascunhos são preservados; aplicar máximos abre reservas novas sem
recuperar usos. Avisos diferenciam armas e ataques especiais e explicam as notas
opcionais. Conferidos 385 testes Node, tipos/build e Chromium de importação,
setores e edição em linha, inclusive offline /D-D/, 320px/GG/três temas. Um PDF
real autorizado foi aberto e cancelado em contexto isolado, sem importá-lo.

**Legibilidade e padrão visual da ficha:** cores antigas de classe recuperadas,
subclasse mantida visível e cabeçalho alinhado. `sheet-type.css` concentra a
hierarquia da ficha: M com texto principal 16px, apoio 14px, títulos Cinzel e
números de combate grandes, iguais em consulta/edição. Unidade do deslocamento
fica junto ao valor. Inventário/história e descrições foram ampliados. Em telas
pequenas, atributos clássicos usam grade acima das proficiências; P/M/G/GG e os
três temas preservados. Seletores guardam o valor confirmado, evitando classificá-los
como rascunho sem mudança. Conferidos 385 testes Node, tipos/build e 10 scripts
Chromium pertinentes, incluindo inspeção das três abas/temas em M, M/GG em 320px
nos dois layouts, campos abertos/protegidos e preservação de dados. Nada de
ficha/notas é migrado nesta etapa.

**Cadeado da ficha:** ao lado do seletor, alterna Protegida/Editando. Valores de
consulta com o cadeado fechado; classes/atributos/máximos/proficiências/cartões
editáveis quando aberto. Rolagens, combate, preparo, gastos/recuperação, equipar,
loja e histórico continuam disponíveis; notas privadas independentes. Troca de
ficha/conta e recarga fecham; ficha em branco abre para preencher. `lock.ts` não
salva estado no documento nem substitui a permissão do mestre. Campos/painéis
retêm rascunhos ao fechar/reabrir e não gravam enquanto protegidos. Dicas nativas
explicam preparo e limite; máximos numéricos de recursos foram compactados.
Conferidos 385 testes Node, tipos/build e 19 scripts Chromium (32 cenários auditados),
incluindo cadeado/rascunhos/quota, permissões, troca de ficha/conta, offline,
combate/preparo/importação/notas e 320px/GG/três temas/dois layouts. Sem SQL novo.

**Revisão de importação por setores:** cinco setores com cartões, perícias em
linhas e reservas compactas. Grimório reaproveita `spell-fields.ts` da própria
ficha e permite adicionar/remover entradas do catálogo ou personalizadas.
Observações agrupadas explicam CA, bônus fixos, itens em texto e vínculos manuais.
Comparação com o livro mostra máximos antes de aplicar, sem recuperar usos/pontos.
Remoção de classe compartilha confirmação inline: magias vinculadas são removidas
junto ou mantidas como adaptação com origem/habilidade anteriores registradas.
PV, atributos, reservas, textos e histórico preservados; requer uma classe restante.
Correção livre, sem refazer escolhas de criação/evolução. Escolhas/efeitos da
classe removida deixam de conceder bônus automáticos; histórico fica guardado.
Conferidos 382 testes Node, tipos/build e Chromium de importação/setores/edição/
criação/aplicação/32 cenários auditados, com 320px/GG/três temas. Sem SQL/migração.

**Edição diretamente na ficha implementada:** níveis/classes/subclasses no
cabeçalho; atributos/PV/CA/deslocamento/perícias nos blocos atuais; moedas e
biografia no inventário/história. Armas, itens, características e magias expandem
editores dentro do próprio bloco. + Novo → Usar ficha em branco abre a ficha
mínima sem outra revisão; criação guiada e rascunhos anteriores continuam.
Removidos os botões de modo manual do perfil e a janela de edição geral.
`src/sheet-edit/` concentra propostas, persistência, foco/rascunhos e painéis.
A atualização visual não confirma rascunhos via blur acidental, e falha de quota
mantém o valor digitado. Ajustes por campo preservam reservas/deslocamento;
recursos de classe aceitam máximo manual (vazio retoma o cálculo do livro).
A guarda de acesso recebe contexto externo pessoal/mestre/jogador e confere a
permissão novamente ao salvar. Não recebe autorização da ficha importada.
**Salas e validação no servidor ainda não foram implementadas.**
Conferidos 378 testes Node, tipos/build e Chromium de edição/importação/criação/
aplicação/continuidade local-conta/regras/armas/ataques mágicos, incluindo 32
cenários auditados, quota/foco/rascunhos/conta e 320px/GG/temas/layouts.
PDFs de mesa foram usados na etapa anterior em contextos descartáveis, com
valores provisórios nos campos ambíguos; originais e contas reais preservados.

**Importação revisada implementada:** perfil aceita PDFs preenchíveis (15 MB,
20 páginas) e backups JSON. `src/import/` lê campos por página com PDF.js local,
propõe vínculos em cópia e abre revisão comum de identidade/classes/raça,
atributos/PV, reservas, origens/preparo e armas. Campos obrigatórios ausentes e
origens ambíguas exigem escolha. Caixas de texto do PDF permanecem na ficha ou,
se incluídas, nas notas pessoais; PDF/imagens não são enviados pelo importador.
Retratos usam o fluxo de imagens existente. OCR/fotos/PDF achatado não suportados.
Valores manuais/CA são preservados; armas só mudam para catálogo por escolha.
Reservas sugeridas e usos precisam ser conferidos. A ação **Revisar ficha atual
como cópia** recupera vínculos de importações antigas sem sobrescrever originais.
Persistência continua em `CharacterStore.importCopies`, com IDs novos e guarda
de espaço após cada etapa assíncrona. Avisos manuais ficam em `rules.importReview`.
Primeira etapa da compatibilidade registrada em [AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md).
Primeira verificação: 368 testes Node, tipos/build, Chromium de importação/aplicação/auth/
sync com HTTP simulado; PDF na raiz e `/D-D/`, offline/quota/conta/cancelamento,
campos ausentes/origem ambígua/texto seguro e 320px/GG/três temas. Conferidos
dois PDFs reais com revisão cancelada, sem alterar/importar fichas pessoais.
Próxima ampliação: revisão assistida de equipamento/talentos/escolhas de classe
que os PDFs só descrevem em texto; não anunciar reconstrução integral dessas escolhas.

**Ajuste atual de magias:** Só Pool bloqueia conjuração/ritual antes de qualquer
gasto/efeito/histórico, inclusive ao retomar confirmação após trocar o modo.
Magias `atq_magico` recebem Atq +bônus no cartão em vez do indicador estático.
O d20 usa classe/habilidade da magia, vantagem/desvantagem e inspiração; repetir
ataques de raios/feixes não cobra outro espaço. Rolar ataque não conjura: o gasto
permanece em Conjurar/Truque. OFF conserva lançamento físico. Teste dedicado em
`tests/spell-attack-browser.cjs`, incluído no roteiro de navegador.
Conferidos 360 testes Node, tipos/build e Chromium do roteiro novo, concentração,
dados e 32 cenários auditados; imagens desktop/celular revisadas. Os cenários
novos incluem gasto/efeito/histórico intactos em Só Pool, confirmação pendente,
origem/habilidade, filtro, vantagem/inspiração, repetição de raios e OFF/offline.

**Ajuste anterior:** crítico/registro ocupam a linha inferior da arma e o
botão reserva largura para não deslocar conteúdo. Em Auto Ficha, cada ataque
atualiza só sua arma pela face natural após vantagem/desvantagem, respeitando
o intervalo de crítico do Campeão. O próximo ataque comum ou dano confirmado
limpa a marca. Outros roladores e modos OFF/Só Pool não alteram a preparação.
Registrar dano é exclusivamente manual, sem seletor de dados; Adicionais mantém
físico/virtual somente em Auto Ficha. Nenhuma mudança de SQL ou dados reais.
Verificado com 360 testes Node, tipos/build e Chromium de ataques, dados,
concentração e regras. Casos incluem face natural/total, vantagem/desvantagem,
inspiração, Campeão, isolamento por arma/ficha, registro sem rerrolar e geometria
estável nos dois layouts/três temas/320px/GG. Captura desktop conferida.

**Ajuste de uso após a sexta etapa:** crítico é marcado na própria arma, sem
rolagem/gasto ao marcar. O botão de dano rola no clique em Auto Ficha e a marca
sai depois de confirmar o dano. OFF/Só Pool abrem o registro do total já rolado;
cancelar mantém a preparação. **Adicionais** ou **Registrar dano** abrem o fluxo
pertinente, sem segunda checkbox de crítico. Total físico inclui bônus/crítico,
não é duplicado nem rolado de novo. Balões usam a camada superior nativa para
ficarem acima de diálogos, mantendo posição/foco/Esc e os módulos compartilhados.

Verificação do ajuste: 360 testes Node, tipos/build e Chromium de ataques,
regras, criação, PV e biblioteca aprovados. Confere marcação sem rolar/gastar,
clique direto, cancelamento/limpeza, total físico sem rerrolar e ajuda na camada
superior com Esc/foco, além dos cenários existentes. Captura da sobreposição
conferida; sem nova bateria para mudanças puramente cosméticas.

**Sexta etapa da auditoria:** a composição da própria arma monta um acerto com
Furtivo, Colossos, Destruição, Aprimorada e extras do
crítico. Duplica dados, mantém bônus fixos e gasta um único espaço existente de
Conjuração/Pacto, após confirmar resultado físico ou rolar virtual. Cancelamento
ou alteração concorrente preserva o documento. Pool, inspiração, notas e outras
fichas são preservados; gasto/resultado entram juntos no histórico/desfazer.
O botão comum de dano continua direto. Turnos, alvos, limite de ataques, outros
passivos e Forma Selvagem ainda são manuais. Contratos em `weapon-damage.ts`,
`weapon-damage-ui.ts` e `dice-formula.ts`, em `src/rules/`; testes correspondentes
em `tests/`. Não houve SQL, migração ou alteração de dados reais.

Verificação desta etapa: `npm run check`, 360 testes Node, tipos/build e 14
roteiros Chromium aprovados, incluindo 32 cenários auditados. Após o último
ajuste de compatibilidade da fórmula personalizada `0-3`, Node/build/roteiro
de ataques passaram novamente. Prévia/recursos/cancelamento/concorrência,
desfazer, modos de dado, pool/inspiração, notas/fichas/offline e dois layouts/
três temas/320 px/GG conferidos, com capturas desktop/celular e diff limpo.

**Quinta etapa, já concluída:** o dano detalhado também reconhece
Maestria em Armadura Pesada, Esquiva Sobrenatural e DES para metade/Evasão.
Usa classe/nível/escolha estruturados, origem e condições; a mesa confirma
visão/reação e a ordem de reduções/metade. Resistência/Fúria Implacável aparecem
antes de um dano elegível levar de PV positivos a 0, incluindo os atalhos −1/−5.
Uso racial recupera no longo e tentativas da Fúria elevam CD até curto/longo.
Cancelamento/alteração concorrente não aplicam; sucesso evita inconsciência
transitória e preserva Fúria/Frenesi, sem ignorar o dano para concentração.
Fonte e limites em `docs/AUDITORIA-LIVRO-2014.md`; contratos em `survival.ts`,
`damage.ts`, `combat.ts`, `damage-ui.ts` e `health-ui.ts`, dentro de `src/rules/`.
Usos opcionais pertencem ao documento/histórico por ficha; sem migração ou SQL.
Outros testes/reações, Proteção contra a Morte, outras reduções e Forma Selvagem
continuam na mesa. Não há controle de turnos. Não mesclar/publicar sem aprovação.

Verificação desta etapa: `npm run check`, 351 testes Node, tipos/build e 13
roteiros Chromium aprovados. Cobertura direcionada em `tests/damage.test.ts`
e `tests/damage-browser.cjs`, além das regressões de PV/concentração e 32 cenários
auditados. Dois layouts, três temas, 320 px/GG e capturas conferidos; diff limpo.

**Quarta etapa, já concluída:** dano detalhado ganhou modo por tipo
e origem, com até 13 tipos distintos de uma única ocorrência, prévia explicada
e ajustes transitórios da mesa. Aplica fontes verificadas de raça, classe,
Fúria/Urso, Proteção contra Lâminas e petrificação. Proteção Arcana absorve antes
das defesas próprias; tipos mistos têm ordem declarada pela mesa. O total após
imunidade/redução/resistência/vulnerabilidade usa temporários/PV e gera apenas
um evento de concentração/morte. Resistências não acumulam.
Contratos em `src/rules/damage.ts`, `combat.ts` e `damage-ui.ts`; regressões em
`tests/damage.test.ts` e `tests/damage-browser.cjs`. Modo resolvido/atalhos
mantêm o contrato antigo; a ajuda explica a parcela da proteção. Forma Selvagem
e excesso continuam manuais, com modo por tipo bloqueado. Ainda faltam outros
efeitos de itens/magias, redução de Maestria em Armadura Pesada, reações/testes
e exceções para evitar 0 PV. Não houve SQL/RLS/RPC, autenticação ou dado real
alterado. Matriz de fontes e limites em
[AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md).

Verificação final desta etapa: `npm run check`, 342 testes Node, tipos/build e
13 roteiros Chromium aprovados, incluindo 32 cenários auditados. O novo roteiro
confere prévia/fontes/defesas, mistura e ordem da proteção, ajustes/limites,
concentração/morte uma vez, nós/foco, modo resolvido/forma, notas/históricos por
ficha e offline. Três temas/320 px/GG e capturas desktop/celular conferidos.
Roteiros antigos de PV/concentração usam seletores específicos para as novas
abas internas. Diff sem whitespace; CI também testa PostgreSQL descartável.

**Terceira etapa da auditoria, já concluída:** concentração tem estado único
por ficha, troca confirmada antes de gastar recursos e fila de CON por fonte de
dano. Inclui dado físico/virtual/OFF, bônus da forma, Conjurador de Guerra,
Conjuração Focada, exaustão/inspiração e cancelamento de vantagem/desvantagem.
Há 14 condições com ajuda, incapacitação derivada, movimento 0 e falhas
automáticas de FOR/DES nos casos correspondentes. Incapacitação/morte encerram
concentração; inconsciência também encerra Fúria, processa Frenesi, reverte forma
e registra queda. Sono no longo encerra; exceções conscientes podem preservar,
com duração da mesa. Lista mantém nós/foco e não há painel duplicado.
Contratos/testes em `src/rules/concentration.ts`, `src/rules/conditions.ts`,
`tests/concentration.test.ts` e `tests/concentration-browser.cjs`.
Sem SQL/RLS/RPC ou alteração de dados reais. Notas, histórico por ficha e
persistência/offline preservados. Dano por tipo recebeu os controles da etapa
acima; outras vantagens/desvantagens de condições, sentidos/alvos, tempo de jogo
e exceções para evitar 0 PV continuam pendentes. A matriz atual está em
[AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md).

Verificação final daquela etapa: `npm run check`, com 320 testes Node, tipos/build
e 12 roteiros Chromium aprovados, incluindo os 32 cenários auditados. O novo
roteiro cobre troca/cancelamento/recursos, ritual, fila/CD, proteção/temporários/
forma, físico/virtual/OFF, talentos/inspiração, condições/Fúria/sono, ficha antiga
a 0 PV, callbacks obsoletos, nós/foco, notas/histórico, fichas isoladas e offline.
Três temas/320 px/GG e capturas desktop/celular conferidos. Diff sem whitespace.
CI também executa PostgreSQL descartável e auditoria das dependências.

**Segunda etapa da auditoria, já concluída:** Dados de Vida têm saldo/gasto por
classe, origem física/virtual, CON, mínimo de Resistente e Canção do Descanso
uma vez, se ouvida e houver cura. Em forma, exige a CON da besta e cura seus PV.
A 0 PV, controle de sucessos/falhas, 1/20 natural, estabilidade, dano
comum/crítico/maciço e cura; morto precisa de registro explícito de retorno à
vida após resolver a causa na mesa. Estável a 0 PV pode gastar Dados de Vida
após descanso curto. Inspiração é a reserva binária de 2014: preparar/cancelar
vantagem ou gastar na mesa, sem acumular/rerrolar. Tudo ocupa os campos
existentes, é salvo no histórico da ficha e preserva notas e o pool montado.
Tempo de jogo e exceções de classe que evitam 0 PV continuam pendentes;
concentração/condições receberam os controles acima. Fonte/contratos em
[AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md) e `src/rules/health.ts`;
testes puros em `tests/health.test.ts` e interação em `tests/health-browser.cjs`.
Não houve alteração de SQL/RLS/RPC ou dados reais.
Verificação local daquela etapa: 299 testes Node, tipos/build e os dez roteiros
Chromium anteriores aprovados; o novo roteiro de PV passou no build final após
o ajuste de foco. A suíte daquela etapa incluía onze roteiros. Confere cancelamento,
físico/virtual/OFF, notas/desfazer/refazer, forma, dados/morte/inspiração,
recarga/offline, isolamento e três temas/320 px/GG. Capturas de desktop/celular
conferidas. Use `npm run check` para a bateria completa; CI também testa PostgreSQL.

**Primeira etapa da auditoria, já concluída:** fórmulas mostradas/roladas
unificadas nos casos auditados, cura/modificador/aprimoramento, Explosão
Agonizante por feixe, nível racial fixo, Dominar/Assinatura, iniciativa e
componentes corrigidos. Dano usa proteção → temporários → besta → PV; o histórico
registra a absorção real. Constituição permanente ajusta PV manuais sem reviver
a 0 PV; descanso longo exige 1 PV e o curto preserva a Forma Selvagem.
Concentração, condições, PV/inspiração receberam os controles das etapas acima;
outros passivos da matriz continuam pendentes. Ver a tabela de estado
no início de [AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md).
Validação daquela etapa: 279 testes Node, tipos/build e dez roteiros Chromium, incluindo
32 cenários auditados sem divergências. O último ajuste de validação do mago
foi conferido novamente com Node/build/cenários. O comando `npm run check`
inclui o wrapper que falha se houver divergência; a CLI diagnóstica continua
apenas relatando `matches`. Sem alteração de SQL/RLS/RPC ou dados reais.

### Histórico das revisões anteriores

A revisão inicial teve 260 testes Node aprovados, tipos/build e nove roteiros Chromium;
detalhes das execuções e limites em `REFATORACAO-2014.md`.
Após teste do responsável, os controles foram incorporados aos lugares existentes,
eliminando o painel redundante sob as armas. Esta revisão tem 261 testes Node e
Chromium de regras/ficha/armazenamento; ver a tabela de localização no mesmo plano.
O incremento da evolução passou a usar a grade +/− da criação. Esta revisão tem
262 testes Node, tipos/build e Chromium de regras/evolução e criação aprovados.
Na revisão seguinte, zoom deixa de acumular porcentagens, cada ficha ganha
histórico próprio (com migração preservando o coletivo e recuperação de excluídas)
e os ajustes de defesa têm espaçamento e ajuda nos sete itens. O levantamento
amplo está em [AUDITORIA-LIVRO-2014.md](AUDITORIA-LIVRO-2014.md): há lacunas
confirmadas, inclusive iniciativa/passivos e componentes cortados, além de
concentração/morte/condições ainda manuais naquela base. As correções atuais
estão descritas acima; não tratar o levantamento histórico como estado atual.
A segunda passada da auditoria, na base `7667ae9`, reproduziu 20 divergências em
21 cenários direcionados, incluindo truque mostrado/rolado, cura/modificador e
espaço maior, invocação, magia racial, Dominar/Assinatura, PV/transformação,
descansos, proteção multiclasse e opção de talento. Ver os itens 15–27 e a matriz
dos 42 talentos no relatório. Rodar `npm run build` antes de
`node scripts/audit-phb-scenarios.cjs`; `matches: false` é achado da auditoria,
não um teste de aprovação falhando. Não tratar a passagem dos 266 testes existentes
como cobertura dessas combinações. A implementação da ficha não mudou naquela
etapa de levantamento; as correções atuais estão descritas acima.
Verificação desta revisão: `npm run check`, 266 testes Node, tipos/build e nove
roteiros Chromium aprovados, incluindo login também sob `/`. A consulta ao
Supabase real confirmou o contrato existente por leitura de metadados; nenhum
SQL/RLS/RPC ou dado pessoal foi alterado.
A versão anterior, com entrada/dado/retratos e correção do cache HTTP, foi
integrada pelas PRs #3–#6. A implantação da correção concluiu no workflow
[38954994107](https://github.com/mhaetinger/D-D/actions/runs/38954994107).
Os pedidos atuais estão em [PLANO-EXPERIENCIA.md](PLANO-EXPERIENCIA.md):
continuidade sem conta, criação orientada (incluindo escolha de PV no 1º nível,
equipamento inicial por pacotes ou riqueza/compras do Capítulo 5 com adaptação
livre, balão de consulta rolável sem bloquear clique ou reabrir na seleção,
limpeza de marcadores `U+F0B7` do PDF, recorte de bordas em modais roláveis e
cabeçalho compacto), distribuição por peças, animação do dado e tema no livro.
Esta alteração ainda depende da revisão da PR antes de integrar e publicar. Não
levar dados pessoais nem a pasta local `Bugs/` para o Git.
Cloudflare está ativa no DNS; hospedagem Pages e repositório privado continuam
dependentes da configuração descrita em [CLOUDFLARE.md](CLOUDFLARE.md).

Em uma pasta nova, com Node.js **22.12 ou superior** e Git:

```sh
git clone --branch feature/regras-universais --single-branch https://github.com/mhaetinger/D-D.git CritCall
cd CritCall
npm ci
npm run dev -- --port 5174 --strictPort
```

Abra **http://localhost:5174/**. A configuração pública do Supabase acompanha
o código; não é necessário copiar `.env.local` nem criar variables no GitHub.
Se já houver clone, preserve alterações locais, faça `git fetch origin`,
selecione a branch atual e atualize com `git pull --ff-only`.
Não usar `reset --hard` para atualizar uma pasta com trabalho pendente.

O outro PC não precisa da pasta `.public-worktree`: o clone público já é a
aplicação. Na máquina anterior, ela fica em `.public-worktree`; a raiz é um
protótipo privado separado. **Nunca enviar `prototype-local`, suas tags ou o
commit privado `e13922d`; não mesclar esse histórico ao público.**

## O que foi feito

- Login por e-mail/senha: cadastro, confirmação, reenvio, recuperação, troca
  pelo link PKCE, sessão e saída. Usuário relatou sucesso no teste local.
- Nome do jogador salvo ao digitar, com aviso se o navegador recusar a gravação.
- Sincronização por conta de fichas completas, notas privadas separadas, perfil,
  preferências persistidas, histórico/checkpoints e cópias de recuperação.
- Fila offline transacional em IndexedDB, operações idempotentes, revisões,
  calibração do relógio e confirmação de envio. Edições durante um envio ficam
  pendentes. Atualizações remotas aguardam campos/editores em uso.
- Concorrência escolhe a data mais recente e preserva ambas as versões.
  Exclusões usam tombstones. Restaurar uma ficha não restaura suas notas.
  Não existe mesclagem automática campo a campo.

Código principal no commit `8e94a9e7da6b4eec346ff1fd3a0447c94f5e58c0`.
Os commits seguintes atualizam ativação e retomada; usar a ponta da branch.
Contratos e limites: [SINCRONIZACAO.md](SINCRONIZACAO.md).

## Supabase real: migração aplicada

Usar exclusivamente **`qhrpgkpvwbztubnrdhya`**,
https://qhrpgkpvwbztubnrdhya.supabase.co. No painel, o projeto aparece como
**D-D**; o aplicativo se chama **CritCall**, com infraestrutura exclusiva.

Em 16/10/2026 a conexão administrativa funcionou. Inspeção inicial: sem tabelas
em `public`, sem migrações e sem as duas RPCs. Foi aplicado pelo conector o SQL
de `supabase/migrations/202610160001_personal_sync.sql`, com nome `personal_sync`.
O Supabase registrou a versão **`20261016101143`**. Essa é a correspondência entre
o arquivo local e a migração remota; não criar outra migração para fingir que a
anterior não foi aplicada, nem executar `db push` sem reconciliar o histórico.

Conferência real: tabelas `critcall_documents`/`critcall_versions` com RLS,
SELECT apenas do dono autenticado, nenhuma escrita direta do cliente. RPCs
`critcall_save_document`/`critcall_sync_clock` têm caminho de busca vazio e não
podem ser executadas por `anon`. API anônima das tabelas recusou com 401/42501.
Smoke SQL no PostgreSQL 17 real passou: escrita, idempotência e bloqueios de
leitura/escrita entre identidades e de dono incorreto no relógio. Usuário e
documento fictícios do teste foram revertidos em uma transação com ROLLBACK.
Não foram lidas fichas/notas reais. Isso **não comprova** o fluxo completo de
sincronização real entre navegadores ou dispositivos.

## Ao trocar de PC

**Git transporta código e documentação; fichas pessoais e filas offline não
entram no repositório.** No PC de origem, conferir no perfil
**“Salvo no Supabase · atualizado neste dispositivo.”**. Se houver pendências,
manter a origem disponível para reconectar e baixar backup com notas incluídas
antes de fechar. O backup atual exporta fichas/notas opcionais, sem todo o diário.

Entrar com a mesma conta no novo PC deve receber a versão já enviada. Uma edição
offline só chega a outro dispositivo depois do envio pela origem. Fichas do modo
sem login ficam preservadas nesse espaço. O formulário de entrada pode vincular
cópias à conta confirmada, perguntando antes se ela já tiver fichas; veja
[SINCRONIZACAO.md](SINCRONIZACAO.md). Rascunhos ficam locais até concluir a ficha.

Login normal funciona em outros navegadores. Confirmação/recuperação PKCE exige
abrir o link no mesmo navegador, dispositivo e endereço que iniciou o pedido.
Pode iniciar uma recuperação no novo PC e concluí-la nele. Nunca colar senhas,
links com tokens ou chaves secretas na conversa/Git.

## Próximos passos

1. Validar no aplicativo real: mesma conta em dois navegadores/PCs, nome,
   fichas/notas, offline/reconexão, conflito e restauração. Conferir isolamento
   com outra conta real. Não solicitar credenciais do usuário para fazer isso.
2. Configurar SMTP próprio antes de liberar cadastro aos jogadores. O envio
   padrão do Supabase ainda tem restrições. Usuário confirmou compra só do domínio,
   sem e-mail; proposta de provedor em [DOMINIO.md](DOMINIO.md). Revisar os avisos do serviço
   registrados em [SINCRONIZACAO.md](SINCRONIZACAO.md).
3. Acompanhar a entrega autorizada pelo responsável por PR para `develop` e
   depois para `main`. Não fazer push direto à `main`. Conferir o workflow e a
   entrada nova em https://criticall.art/ após a implantação.
4. Domínio **criticall.art**, comprado pelo usuário na **Hostinger**, conforme
   confirmação em 16/10/2026. Usuário informou configurações feitas e DNS em
   verificação no GitHub. Os quatro A da raiz já estão corretos no servidor DNS;
   o CNAME de `www` também foi corrigido para `mhaetinger.github.io`. Supabase
   aceita o retorno novo. Usuário criou conta Cloudflare e quer preparar a
   migração com código privado e crescimento por planos. Próximos passos em
   [CLOUDFLARE.md](CLOUDFLARE.md). DNS e HTTPS já conferidos após o usuário confirmar
   OK no GitHub/Cloudflare; a hospedagem continua GitHub Pages. Publicação nova pendente.
   Preservar/exportar dados da origem anterior antes de ativar redirecionamentos.
5. Priorizar a base individual; mesas, permissões de mestre e voz/vídeo
   são etapas seguintes. Nenhuma ficha individual depende de mesa.

Site URL atual: `https://criticall.art/`. Usuário confirmou retornos
permitidos `http://localhost:5174/` e `http://127.0.0.1:5174/`. Na máquina anterior,
5173 é de outro aplicativo. As configurações administrativas de Auth/SMTP não
foram alteradas por esta ativação do banco.

## Verificações já executadas

No commit de implementação: `npm run check` passou com **168 testes Node**,
tipos/build e cinco roteiros Chromium; `npm run test:database` passou em
PostgreSQL 16 descartável. Incluídos duas instalações simuladas da mesma conta,
outra conta, fila/recarga offline, reconexão, conflitos, restauração e notas.
Modal de versões também passou nos três temas, 320 px/fonte GG, conteúdo hostil
sem execução e rodinha contida. Auditoria de produção: zero vulnerabilidades.

CI de `8e94a9e` concluída com sucesso, tanto
[PR](https://github.com/mhaetinger/D-D/actions/runs/38856854875) quanto
[push](https://github.com/mhaetinger/D-D/actions/runs/38856851273), incluindo DB.
Essas execuções usam dados fictícios e não substituem a validação real pendente.
Os ajustes desta retomada são documentais, com revisão de diff.

Para repetir após mudanças funcionais pertinentes:

```sh
npx playwright install chromium
npm run check
npm run test:database
```

O último comando é separado de `check` e requer Docker. Não é requisito para
abrir a aplicação. Não repetir toda a bateria apenas por mudanças documentais.

### Verificação nesta máquina — 16/10/2026

Após instalação limpa com `npm ci` e correção da recuperação da fila, passou
`npm run check`: **171 testes**, tipos/build, configuração pública, cache offline
e os cinco roteiros Chromium. Login e sincronização usam HTTP controlado nos testes;
isso não substitui a conferência com contas/dispositivos reais.

A falha foi reproduzida antes da correção: uma transação recusada podia fazer a
tentativa seguinte ignorar a edição e carregar a versão anterior. A recuperação
agora parte da projeção persistida. Três regressões Node e o roteiro Chromium
cobrem a falha, inclusive uma tentativa já agendada e a preservação da atualização
remota concorrente. Não foram apagados dados nem alterado o formato da fila.

O Playwright fixado não reconheceu Ubuntu 26.04. A instalação do Chromium e os
roteiros passaram usando `PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64`
nesses comandos, sem alterar as dependências do projeto. A CI continua no Ubuntu
24.04. Docker não está instalado nesta máquina: `test:database` não foi repetido.
Não houve alteração de SQL/RLS/RPC.

Auditoria de produção sem alertas; os avisos da cadeia de desenvolvimento seguem
documentados. O projeto Supabase correto foi confirmado ativo, com os avisos do
serviço já registrados em SINCRONIZACAO.md. O destino de recuperação foi conferido
no serviço real para domínio novo e retornos locais, sem usuários/e-mails envolvidos.
Servidor de desenvolvimento iniciado em `http://localhost:5174/` para a conferência
manual. Sincronização real, SMTP, HTTPS do site e publicação seguem pendentes.

Texto para iniciar outra conversa: “Continue o CritCall na branch
feature/login-email; leia AGENTS.md e docs/RETOMADA.md e confira o estado real
antes de alterar. A migração Supabase personal_sync já foi aplicada.”

### Preparação da publicação Cloudflare

Workflow opcional implementado e ainda não ativado. Zona criada com nameservers
`noel.ns.cloudflare.com` e `raegan.ns.cloudflare.com`; ativação confirmada pelo
usuário e nameservers conferidos por consulta. Criar Pages Direct Upload com produção `main` e configurar os Secrets e
Variables listados em [CLOUDFLARE.md](CLOUDFLARE.md). Preservar revisão por PR.
Corrigida recarga offline com redirecionamentos HTML do Pages, incluindo `/book`.
Não houve publicação, mudança de visibilidade ou envio de fontes nesta preparação.

Verificação desta preparação: actionlint, diff, 171 testes Node, tipos/build,
cinco roteiros Chromium e emulador local do Pages passaram. Teste de banco não
repetido nesta máquina sem Docker; SQL/RLS/RPC permaneceram iguais.

### Entrada principal e preferências visuais

Pedido seguinte do usuário: abrir primeiro a tela de login com a marca enviada,
antes de criar/abrir fichas; deixar 2014/2024 apenas como exibição dentro da ficha
e conservar cores/texturas ao retornar. Implementação local em `src/auth/entry.ts`
e `src/styles/access.css`; reutiliza o formulário existente de login/recuperação.
`public/icons/logo.png` e `icon.png` foram enviados pelo responsável para uso aqui.
Sem conta, a página agora mostra a entrada: escolher **Continuar sem conta** para
acessar as fichas locais anteriores. Saída volta à entrada; sessão conhecida abre
a ficha diretamente. Preferências continuam por conta, e exibição por personagem.
Não houve mudança de banco, serviço de autenticação ou publicação nesta etapa.
Repositório privado continua dependente da transição da hospedagem para Pages.

Verificação da entrada: `npm run check` passou com 171 testes, tipos/build e os
cinco roteiros Chromium. Os testes de auth cobrem `/` e `/D-D/`, entrada antes da
ficha, recuperação/cancelamento e restauração visual por conta. A sincronização
com HTTP simulado conferiu tema, textura, fonte e exibição em dois navegadores.
Revisão visual da entrada em desktop/celular e ficha com textura concluída.
Servidor local em 5174 continua respondendo; janela anônima mostra a nova entrada.

### Tema escuro e DNS aprovado

Usuário pediu entrada com aspecto de grimório antigo e paleta discreta/escura.
Ajustados somente a apresentação da entrada e os registros desta retomada:
textura procedural leve, tons de carvão/couro, texto em marfim e dourado envelhecido.
Símbolo original preservado; nome CritCall em texto legível sobre fundo escuro.

Usuário confirmou DNS check OK no GitHub e Cloudflare. Consulta pública confirmou
nameservers Cloudflare; HTTPS 200 com certificado aceito em `criticall.art` e
301 → 200 de `www` para a raiz. A hospedagem ainda responde como GitHub Pages.
Criar/configurar Cloudflare Pages e concluir a transferência antes de tornar o
repositório privado. Nenhuma mudança de DNS, hospedagem ou visibilidade nesta etapa.

Verificação do tema: 171 testes Node, tipos/build e Chromium de auth em `/` e
`/D-D/` passaram. Revisão visual desktop/celular e smoke 320px/fonte GG nos três
modos de acesso, sem transbordamento. Conferidos contraste dos pares principais e
preferências da ficha preservadas. Nenhuma alteração SQL/RLS/RPC nesta etapa.

### Dado compacto e retratos — 16/10/2026

Implementados dado fechado ao abrir/logar, último total (20 inicialmente), textura,
arraste, arremesso rápido para d20 normal, clique para abrir e R/setas no teclado.
O pool existente não é alterado pelo arremesso. Posição normalizada por espaço e
limites do viewport; resultado só na aba. Código novo em `src/app/dice-dock.ts`.

Usuário escolheu enviar imagens próprias com redução. Perfil e cada personagem
aceitam JPG/PNG/WebP até 5 MB, limitados a 32 MP/8192 px. Conversão central para
WebP de até 256 px/32 KiB antes do envio. `src/media/` mantém cache/fila IndexedDB
por conta e arquivos no Storage privado; documentos guardam só referências.
O JSON de backup não embute pixels; referências não transferem fotos a outra conta.
Substituir não restaura versões binárias antigas ao recuperar histórico da ficha.

Supabase CritCall `qhrpgkpvwbztubnrdhya` confirmado antes de alterar. Aplicada
`private_avatars` (local `20261016184740_private_avatars.sql`, remota
`20261016184938`), com bucket/limites/RLS conferidos. Não reaplicar para reconciliar
os timestamps. Advisors anteriores permanecem; nenhuma mudança em outro projeto.
Teste de banco passou em PostgreSQL 18.6 local descartável, pois Docker continua
ausente. A CI mantém PostgreSQL 16/Docker. Instruções no README.

Verificação final: 175 testes Node e tipos/build passaram. Os seis roteiros
Chromium passaram (check completo com 174 testes, seguido do novo caso de arquivo
com MIME disfarçado e build/dado). Imagens testadas com SDK real e HTTP simulado:
dois navegadores, fila offline, conta B isolada, download atrasado após troca e
cópia de ficha sem sobrescrever a foto original. Banco/RLS/storage passaram em
PostgreSQL 18.6 local descartável. Revisão visual em celular/três temas/GG e dado
compacto. Configuração do bucket real conferida; upload com conta/dispositivo real
e publicação ainda aguardam validação do usuário. Servidor local segue em 5174.

### Estado em 17/10/2026 — Kael completo, aba inicial, balões da criação e ícones temáticos de magias

1. **Ficha completa do Kael (`Ficha Kael.pdf` + base HTML original):**
   - O PDF pessoal `/home/mateus/Downloads/RPG/Ficha Kael.pdf` e o backup gerado
     `/home/mateus/Downloads/critcall-kael-darkwood.json` permanecem fora do Git
     (gerador auxiliar em `/tmp/generate-kael-backup.cjs`).
   - O arquivo `/home/mateus/Downloads/critcall-kael-darkwood.json` agora contém
     100% dos dados do PDF e do HTML original:
     - **Feiticeiro (Magia Selvagem) 6 / Bruxo (O Corruptor) 1**, Meio-Elfo,
       Sábio (Astrônomo), Caótico e Bom, idade `73`, altura `1,79 m`, peso `79 kg`,
       olhos `Amarelo`, pele `Clara`, cabelos `Brancos`.
     - **18 magias completas:**
       - **Círculo 0 (7 truques):** *Toque Arrepiante*, *Amizade*, *Raio de Fogo*,
         *Raio de Gelo*, *Mensagem* (Feiticeiro), *Rajada Mística* e *Ilusão Menor*
         (Bruxo).
       - **1º Círculo (7 magias):** *Mísseis Mágicos* (`canTwin: true`), *Armadura
         Arcana*, *Disfarçar-se* (Feiticeiro), *Bruxaria (Hex)*, *Recuo Acelerado*
         (Bruxo), *Invocar Familiar (Ritual)* e *Compreender Idiomas (Ritual)*
         (via talento *Conjurador de Ritual* no nível 4 de Feiticeiro).
       - **2º Círculo (2 magias):** *Névoa de Adagas* (`bookId: "nuvem-de-adagas"`)
         e *Despedaçar*.
       - **3º Círculo (2 magias):** *Bola de Fogo* (`bookId: "bola-de-fogo"`) e
         *Relâmpago* (`bookId: "relampago"`).
     - **Metamagia:** *Magia Acelerada* e *Magia Duplicada*.
     - **Perícias, armas e história:** `customSkillBonuses` idênticos aos valores
       da ficha PDF, armas *Besta leve* (`1d8+1`, Perfurante) e *Faca pequena
       (Adaga)* (`1d4+1`, Cortante/Perfurante), aparência e história completas
       palavra por palavra.

2. **Aba inicial e painel de Truques (`src/app/sheet.js`):**
   - A ficha inicia na aba **1. Atributos & Combate** (`currentTab = "main"`),
     inclusive ao ativar o espaço de trabalho da conta (`activateAccountWorkspace`).
   - O painel **Truques (Círculo 0)** inicia aberto (`collapsedPanels = {}`).

3. **Rolagem do balão `#ruleTooltip` e fim de informações duplicadas na criação
   (`public/rules/character-wizard.css`, `public/rules/rule-tooltips.js`,
   `public/rules/character-wizard.js`):**
   - `.rule-tooltip` passou a ter `pointer-events: auto` e `data-scroll-window`:
     o balão permanece estacionário uma vez aberto para permitir levar o mouse
     até a barra de rolagem sem fechar, e a rodinha do mouse (`wheel`) rola o
     `#ruleTooltip` diretamente quando o texto excede a altura do balão.
   - Seletores (`<select>`), opções já selecionadas (`o.value === value`),
     caixas de seleção (`.cw-options`) e cabeçalhos de ganhos de classe que já
     exibem a seção `<details class="cw-source">` logo abaixo não recebem
     `data-rule-tooltip`, evitando exibir a mesma descrição duas vezes.

4. **Ícones e etiquetas temáticas nas magias (`public/rules/character-engine.js`,
   `src/app/icons.ts`, `src/styles/sheet.css`, `src/app/sheet.js`,
   `public/rules/character-wizard.js`):**
   - `CharacterEngine.spellMeta(entry)` e `toSheetSpell` classificam todas as
     361 magias do catálogo com tipo de dano/efeito (`fogo`, `frio`/`gelo`,
     `eletrico`, `energia`, `necrotico`, `trovejante`/`trovao`, `cortante`,
     `perfurante`, `concussao`, `acido`, `veneno`, `psiquico`, `radiante`,
     `cura`, `defesa`, `utilidade`), ícone SVG Lucide correspondente (`flame`,
     `snowflake`, `zap`, `sparkles`, `skull`, `cloud-lightning`, `swords`,
     `droplets`, `brain`, `sun`, `heart-pulse`, `shield`, `wand-2`), formato de
     alvo/área (`mira`, `multi`/`auto`, `esfera`, `cilindro`, `cone`, `linha`,
     `cubo`, `pessoal`/`self`, `ritual_inv`/`ritual`) e defesa/resistência
     (`atq_magico`, `tr_*`, `auto_hit`), exibindo esses indicadores tanto no
     grimório da ficha quanto na etapa de magias do criador.

5. **Apresentação Clássica/Moderna sem poluir o histórico:**
   - Os botões exibem somente **Clássica** e **Moderna** e não criam passos no
     histórico da ficha.

6. **Verificações executadas em 17/10/2026:**
   - `npm test` (**190/190** testes Node aprovados).
   - `npm run build` concluído sem erros (`tsc`, `check-auth-config`, `vite build`,
     `build-offline`).
   - Roteiros Playwright Chromium aprovados: `tests/creation-browser.cjs`,
     `tests/sheet-browser.cjs`, `tests/app-browser.cjs` e verificação dedicada
     da importação do Kael, aba inicial, rolagem do `#ruleTooltip` e ícones
     temáticos das magias.

### Como retomar em um novo terminal

- Para reabrir exatamente esta conversa no `agy`, você pode usar o seletor de
  conversas do `agy` (ou `agy --help` para ver a flag de retomada de sessão).
- Se iniciar uma conversa nova do zero, basta colar:
  > Continue o projeto CritCall na branch `feature/regras-universais`. Leia
  > `AGENTS.md`, `docs/RETOMADA.md`, `docs/REFATORACAO-2014.md` e `CHANGELOG.md`
  > para carregar o contexto e as verificações das alterações de 19/10/2026.
