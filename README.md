# CritCall

Este aplicativo se chama CritCall e é dedicado às fichas de D&D, com
infraestrutura própria. O projeto Supabase exclusivo
do CritCall foi identificado e configurado localmente. A conexão com a API foi
conferida. O build já inclui a configuração pública, sem variables do GitHub;
o usuário confirmou cadastro, confirmação de e-mail e entrada no teste local.
Os retornos locais foram corrigidos e conferidos. O link de recuperação foi
aberto em outro navegador/dispositivo, incompatível com o fluxo atual. Após a
orientação, o usuário relatou sucesso na recuperação/troca no teste local em
16/10/2026. Salvamento pessoal e sincronização estão implementados/testados nesta
branch; a migração foi aplicada ao Supabase real em 16/10/2026. A validação
entre dispositivos reais e SMTP próprio ainda aguardam. A entrega foi autorizada
e publicada em **https://criticall.art/** em 16/10/2026; o estado da implantação
está nos [workflows](https://github.com/mhaetinger/D-D/actions).
Consulte [docs/LOGIN.md](docs/LOGIN.md). Para continuar em outro computador,
siga [docs/RETOMADA.md](docs/RETOMADA.md).

Aplicação de fichas individuais de D&D 5e, com criador, evolução, multiclasse,
grimório, inventário, anotações pessoais e consulta aos livros da mesa.
As regras são de 2014, com Patrulheiro Revisado; o seletor 2024 muda a apresentação.

## Executar

Use Node.js 22.12 ou superior (a série 22 está em `.nvmrc`) e npm:

```sh
npm ci
npm run dev -- --port 5174 --strictPort
```

Abra `http://localhost:5174/`, retorno já autorizado no Supabase. A porta 5173
pertence a outro aplicativo no ambiente original.
O aplicativo usa fontes, ícones e leitor locais, sem CDNs durante o uso.

Para conferir o que será publicado:

```sh
npm run build
npm run preview
```

Somente `dist/` é o artefato de publicação. Abrir `index.html` por `file://` não
executa a aplicação; use o servidor de desenvolvimento ou o build via HTTP/HTTPS.

## Entrada e aparência

Sem uma sessão, a página abre a entrada do CritCall com login, cadastro e
recuperação de senha. Depois de validar a conta, abre suas fichas ou a ação de
criar a primeira. Uma sessão já conhecida reabre o espaço correspondente,
inclusive a cópia offline validada anteriormente. A recuperação de senha usa a
tela de entrada antes de voltar às fichas. A entrada usa um tema escuro de grimório, com textura discreta, letras claras e
detalhes em dourado envelhecido. O símbolo enviado pelo responsável identifica
a entrada, a barra da ficha e o ícone do aplicativo.

**Continuar sem conta** mantém o acesso às fichas locais. A escolha dura nesta
aba; **← Tela inicial** retorna sem apagar os dados e a entrada mostra
**Voltar à sua ficha em andamento** quando houver ficha ou rascunho. Ao cadastrar
ou entrar, uma conta vazia recebe cópias das fichas, notas e imagens locais;
se já tiver fichas, pergunta se deseja acrescentar novas. A identidade precisa
estar confirmada e a coleção remota precisa ter sido consultada. Os originais
locais são preservados; o perfil informa falhas e permite retomar a cópia.

A janela **Perfil e personagens** abre em Perfil, com nome, imagem e acesso à
conta. A aba Personagens oferece Lista ou Cartões, com os mesmos retratos e
ações de abrir/excluir ficha. A visualização é lembrada neste navegador. Backup,
importação e revisão como cópia aparecem somente em Personagens; o estado do
armazenamento e a sincronização continuam acessíveis nas duas abas.
Em M, o perfil usa texto principal de 16 px, apoio de 14 px e botões de 15 px;
os nomes dos personagens e o título da janela têm destaque próprio. A escala
P/M/G/GG também se aplica a esses textos.

A ficha mantém cores por classe, com a subclasse visível. A tipografia distingue
nome, títulos, texto de leitura, rótulos e números de combate. Em M, o texto
principal usa 16 px e o apoio 14 px; CA e deslocamento têm destaque também com o
cadeado fechado. P/G/GG continuam ampliando ou reduzindo essa mesma hierarquia.
Classes ficam numa faixa compacta; uma subclasse longa pode ser aberta para
leitura completa. No celular, os dados de identidade usam linhas e **Visual e
dados** recolhe as preferências para deixar mais espaço à ficha.

Cores, textura, tamanho de fonte e dados são preferências do usuário. No modo
local ficam neste navegador; na conta entram também na fila de sincronização.
A exibição **Clássica (2014) / Moderna (2024)** fica dentro da ficha e é salva por
personagem. As regras continuam sendo de 2014 com as adaptações da mesa. Trocar
a exibição não converte regras, classes ou escolhas.

**Características & escolhas** reúne os ganhos por origem e, nas classes, por
nível. Passe o mouse no nome para consultar a regra. Um clique ou toque fixa a
consulta com origem, escolhas e link do livro; feche no ×, fora do balão ou com
Esc. Os botões de ativar/gastar continuam separados da consulta. No preparo
de magias, **Voltar à ficha** permite sair sem aplicar; escolhas pendentes pedem
confirmação antes do descarte. O lembrete do descanso só é retirado ao aplicar.
Avisos de limite ou validação aparecem dentro da janela que estiver em uso.
As dicas de preparo aparecem no balão ao passar o mouse ou focar o controle
pelo teclado. Marcar uma checkbox continua apenas alterando sua seleção.

Concentração acompanha um efeito ativo do personagem, como Bênção. Combate e
grimório mostram o mesmo registro. Preparar uma magia só a deixa disponível;
conjurar registra o efeito, e outra concentração pede substituição. Ao registrar
dano recebido, a ficha deixa o teste de CON pendente para você resolver. Duração
e efeitos nos alvos ficam com a mesa. **Só Pool** deixa a conjuração na mesa;
**OFF** permite registrá-la sem dados virtuais. **Registrar efeito da mesa**
acompanha um efeito resolvido fora dos botões, sem gastar espaços ou usos.

## Dado flutuante e retratos

O dado começa recolhido ao abrir a aplicação ou trocar de conta. Mostra **20**
antes da primeira rolagem e depois o último total desta conta/aba. Clique para
abrir a bandeja; arraste para reposicionar. Um arremesso rápido do ícone segue o
modo selecionado: **normal** rola um d20; **vantagem**, dois e usa o maior;
**desvantagem**, dois e usa o menor. O número no dado é esse resultado, sem
bônus ou outros dados do pool. A tecla **R** e o botão **Rolar d20** na bandeja
fazem a mesma rolagem. Não gasta inspiração preparada nem altera o pool ou o
modo escolhido. As setas movem o ícone; OFF continua ocultando os dados.

O modo selecionado na bandeja também aparece ao redor do dado recolhido:
**vantagem** tem névoa suave e **↑**; **desvantagem**, pequenas chamas e **↓**.
**Normal** conserva o desenho original. Os efeitos respeitam movimento reduzido
e não mudam os gestos.

No perfil, use **Alterar imagem do perfil**. Em cada ficha, clique no retrato ao
lado do nome, ou no retrato da lista de personagens. JPG/PNG/WebP de até **5 MB**
são recortados no centro e convertidos no navegador para WebP de até **256 × 256**
e **32 KB**; imagens acima de 32 MP/8192 px por lado são recusadas. O arquivo
original e seus metadados não são enviados. SVG/GIF não são aceitos.

As imagens usam Storage privado da conta; documentos/histórico guardam somente
referências. O navegador mantém cópias em IndexedDB por espaço e pode enviar
imagens escolhidas offline ao reconectar. Confira o envio no perfil. Uma imagem
não disponível sem rede mantém o ícone padrão. Fotos locais sem login continuam
separadas das contas. Os retratos não são embutidos no JSON do backup: as
referências funcionam na mesma conta, mas não levam os arquivos a outra conta.
A substituição usa o mesmo arquivo quando a referência não está compartilhada;
a recuperação de uma versão da ficha não restaura pixels antigos no servidor.

## Salvamento e backups

Fichas e notas mantêm uma cópia neste navegador. A branch inclui salvamento por
conta no Supabase com fila offline, perfil, preferências e versões recuperáveis;
**migração aplicada no projeto real; validação entre dispositivos reais pendente**.
Confira o estado de envio no perfil. Estar conectado não significa que tudo já
chegou à nuvem. `VITE_AUTH_ENABLED=false` permite uma edição apenas local.
Veja [docs/SINCRONIZACAO.md](docs/SINCRONIZACAO.md).
Ao reabrir a aplicação, a última ficha selecionada é restaurada. Se ela tiver
sido removida, abre a primeira ficha disponível.

Cada personagem tem sua própria linha do tempo, com desfazer/refazer e marcos.
Voltar um passo afeta somente essa ficha; notas pessoais e as outras fichas são
preservadas. A linha do tempo também permite restaurar fichas excluídas. O
histórico coletivo antigo é copiado por personagem sem apagar o original.

No perfil local, **Baixar backup** salva suas fichas em JSON. As anotações pessoais
ficam fora do arquivo por padrão; marque a opção para incluí-las em um backup
privado. **Importar ficha · PDF / JSON** cria cópias com novos identificadores, mantendo as
fichas existentes e remapeando as notas incluídas. O limite do arquivo é 20 MB.

Os dados da versão anterior, no mesmo endereço, são lidos e copiados para o
formato local versionado; a chave antiga é preservada. Se os dados não puderem
ser lidos, o aplicativo informa o problema e oferece download para recuperação.
No perfil, a importação de **PDF preenchível** lê os campos localmente, inclusive
formulários cujos campos só podem ser recuperados por página. Aceita PDF até
15 MB/20 páginas e conserva a importação de backups JSON do CritCall. Fotos,
digitalizações e PDFs achatados ainda não têm leitura automática.

Antes de salvar, **Revisar importação** separa Identidade e classes, Atributos e
combate, Proficiências, Grimório e Inventário e história. Os setores mantêm seus
rascunhos; as observações explicam cada consequência no setor correspondente.
A revisão usa texto/campos de 16px em M e títulos distintos, acompanhando P/M/G/GG.
Reservas zeradas começam recolhidas; Conjuração, Pacto e Feitiçaria podem ser
abertas separadamente para conferir ou corrigir. Reservas preenchidas ou com campos
inválidos começam abertas; a confirmação revela qualquer campo obrigatório recolhido.
Magias usam o mesmo editor da ficha, com adicionar/remover, catálogo ou criação
personalizada. **Comparar máximos com o livro** mostra os valores atuais e os
calculados antes de aplicar; não recupera espaços gastos nem pontos atuais.
Vínculos inequívocos
são propostos pelo catálogo; ambiguidades exigem escolha. A origem da magia
fica separada do recurso usado para lançá-la. Raça ou subclasse personalizada
pode permanecer manual, com aviso aceito e registrado na cópia. Armas do PDF
mantêm seus valores manuais até o jogador escolher explicitamente o catálogo.
CA do PDF permanece como total manual, sem somar escudo de novo. Reservas de
PDF são sugeridas pelas classes: confira os usos atuais antes de confirmar.
Ataques especiais, como sopros, exigem conferência pela regra de sua origem;
não são convertidos em armas do catálogo automaticamente.
As opções de preparo têm dicas ao passar o mouse, distinguindo preparo, espaços
e a adaptação para exceder o limite. Perícias com bônus escritos mantêm ajustes
manuais; confira ao evoluir.
Remover classe, na revisão ou no cabeçalho da ficha, pede confirmação. Se houver
magias vinculadas, escolha remover junto ou manter como adaptação, com habilidade
e origem anterior registradas e agrupamento em outra classe. PV, atributos,
reservas, textos e histórico ficam preservados para revisão manual; a ação não
reconstrói a ficha. Escolhas e efeitos ativos da classe removida deixam de conceder
bônus automáticos. Mantenha ao menos uma classe.

Textos reconhecidos de história/aparência são mantidos na ficha. O texto dos
campos preenchidos, inclusive os não associados, pode ser incluído nas anotações
pessoais; há uma opção explícita na revisão. Retratos são enviados depois pelo
controle de imagens existente. O PDF original não é enviado nem armazenado.
**Revisar ficha atual como cópia** oferece o mesmo fluxo para fichas antigas,
preservando a original. Cancelar não importa; trocar de conta cancela a revisão.
Escolhas de talentos, equipamento e efeitos em texto não são todas reconstruídas
automaticamente: os avisos da revisão identificam essa parte manual.

Uma importação para substituir dados ilegíveis exige confirmação e guarda uma
cópia separada. Falhas de quota/permissão são informadas; alterações em memória
podem ser baixadas antes de fechar. Notas não entram nos snapshots da ficha.

## Edição diretamente na ficha

O cadeado ao lado do seletor alterna **Protegida** e **Editando**. Fechado, mostra
os valores para consulta e protege classes, atributos, máximos, proficiências e
ajustes dos cartões. Rolagens, PV pelos controles de combate, condições, preparo,
gastos/recuperação de recursos, equipamento, loja e histórico continuam disponíveis.
**Upar** também permanece disponível com o cadeado fechado: a evolução guiada
tem confirmação própria e respeita a permissão de edição, inclusive ao aplicar.
Notas pessoais permanecem editáveis. Abra o cadeado para corrigir os campos e
adicionar/editar armas, itens, características ou magias.
Inspiração tem sua própria linha no quadro de PV. Dano detalhado registra dano
recebido; Condições acompanha estados do personagem; Concentração acompanha
efeitos que precisam ser mantidos e os testes causados pelo dano.

Ao trocar ficha/conta ou recarregar, o cadeado volta fechado. Uma ficha nova em
branco abre em edição para preencher. O estado não entra em backups/histórico nem
altera permissões da sala: o cadeado nunca libera uma edição negada pelo mestre.
Fechar preserva rascunhos e painéis abertos, bloqueando sua confirmação; reabrir
permite continuar. Os valores de consulta mostram os dados atuais da ficha, separados dos
rascunhos ainda não confirmados.

Com o cadeado aberto, níveis e subclasses ficam junto às classes no cabeçalho. Nome, raça, antecedente,
tendência, atributos, PV, CA, deslocamento, moedas, perícias e biografia são
editáveis nos lugares em que aparecem. Confirme saindo do campo ou com Enter;
Escape cancela o texto ainda não salvo. Cada correção entra no histórico da
própria ficha. Notas privadas e retratos continuam separados e preservados.

Armas, itens, características e magias expandem seus ajustes dentro do próprio
bloco, sem sobrepor a página. **+ Magia** permite escolher do catálogo inteiro
ou criar uma própria, com origem, habilidade, círculo, fórmula, concentração e
usos. Adições livres são identificadas como adaptações da mesa; fórmulas próprias
não escalam automaticamente e aceitam até 100 dados. Uma magia personalizada
mantém seu vínculo mesmo quando tem o nome de outra do catálogo.

Os máximos de reservas podem ser corrigidos em seus próprios indicadores.
**+ Círculo**, **+ Pacto** e **+ Feitiçaria** mostram os controles ainda ausentes
no grimório. Ajustes de reservas/deslocamento ficam registrados por campo e
não são refeitos pelas tabelas de classe; descansos continuam recuperando os
usos. Bônus manuais de perícias substituem o total; vazio retoma o cálculo.
Os máximos dos recursos de classe também aceitam ajuste; vazio volta ao livro.
Alterar um nível diretamente não concede escolhas nem recalcula PV/equipamento.
A ação **UPAR** continua oferecendo a evolução guiada quando desejada.

Em **+ Novo**, **Usar ficha em branco** abre uma ficha mínima para preencher
ali mesmo. O rascunho guiado anterior é preservado. Não há outra janela ou modo
para editar a ficha. Os contratos técnicos continuam: atributos 0–30, classes
do catálogo e nível total até 20. A importação de PDF mantém a revisão em cópia
antes de salvar, com confirmação das origens ambíguas e dos bônus ausentes.

A guarda de edição fica em `src/sheet-edit/access.ts`. Fichas pessoais são
editáveis; um futuro controlador de sala poderá fornecer o papel e a permissão
concedida pelo mestre. Salas e autorização de gravações compartilhadas no
servidor ainda não estão implementadas. O contexto de permissão não vem do JSON
da ficha. Revogar a permissão também bloqueia a aplicação de um editor já aberto.

## Uso sem internet

Depois do primeiro carregamento completo da versão de produção, o perfil mostra
quando a ficha está disponível offline. Criar, consultar, editar e evoluir fichas
continuam funcionando sem a rede; o salvamento permanece no dispositivo.
O servidor de desenvolvimento não instala o cache offline.

O aplicativo guarda seu código, regras, estilos, fontes e ícones. Os PDFs não são
baixados automaticamente: a consulta aos livros exige conexão, ou você pode abrir
uma cópia previamente baixada fora do leitor integrado. A fila da branch envia
alterações ao reconectar; o banco real já recebeu a migração. Outro PC só recebe edições
offline depois de seu envio.

Atualizações aguardam as abas anteriores fecharem, sem recarregar uma edição em
curso. O cache do aplicativo não contém as fichas nem apaga o armazenamento do jogador.

## Livros

Em **Consultar livro**, escolha Jogador ou Mestre, navegue até uma página, ajuste
o zoom ou abra/baixe o PDF. Os links de magias e características abrem na página
do Jogador correspondente. Os dois exemplares foram incluídos a pedido do
responsável pelo projeto; veja [public/books/README.md](public/books/README.md).

O leitor PDF.js é hospedado junto do aplicativo e tem texto selecionável. Os
balões e consultas do criador também oferecem as descrições das regras.
O zoom livre mantém apenas a porcentagem atual na lista, junto dos atalhos fixos.

A [auditoria do Livro do Jogador](docs/AUDITORIA-LIVRO-2014.md) percorre todos os
capítulos/apêndices e distingue cálculo, consulta e pendências. Concentração
e condições já têm os controles descritos abaixo; duração, alvos e vários
efeitos condicionais ainda exigem decisão da mesa.
A revisão aprofundada também reproduziu divergências de fórmulas/rolagens,
cura, transformação/descansos e recursos de alto nível. A primeira etapa de
correções unifica a fórmula mostrada/rolada, corrige os cenários de PV e usa
Dominar Magia/Assinatura no seletor de origem já existente. Componentes de
magias não ficam mais cortados na quebra de linha. O diagnóstico
`scripts/audit-phb-scenarios.cjs` usa somente personagens fictícios; o teste
`tests/audited-rules-browser.cjs` exige os resultados corrigidos na suíte.

## Login em desenvolvimento

O fluxo escolhido é e-mail/senha no Supabase, em um projeto separado do outro
aplicativo do responsável. Consulte [docs/LOGIN.md](docs/LOGIN.md) para cadastro,
confirmação, recuperação, configuração pública incluída e overrides locais.
Não é necessário configurar variables no GitHub para esse build. Senhas não são
guardadas pela ficha nem incluídas em backups. **Reenviar confirmação de e-mail**
atende cadastros pendentes; **Esqueci a senha** inicia a recuperação. Quem já
entrou pode usar **Enviar link para trocar senha**, sem sair da conta.
E-mail/senha permitem entrar em outros navegadores e dispositivos. Os links de
confirmação/recuperação exigem o mesmo navegador/dispositivo que os solicitou;
o envio de fichas usa a fila própria, com migração aplicada e teste real entre
dispositivos ainda pendente.

Cada conta abre seu próprio espaço de fichas neste navegador. A cópia do espaço
sem conta depende do fluxo de entrada descrito acima, com novos identificadores
e sem substituir fichas existentes. Ao sair, as cópias são preservadas. Isso não
criptografa o dispositivo. A migração do banco foi aplicada; conferir a
confirmação de envio no perfil antes de trocar de computador. Login e
sincronização real entre dispositivos e SMTP próprio ainda precisam de validação/configuração.

## Criação guiada

A revisão de regras inclui armas importadas reconciliadas com o catálogo,
proficiência automática ou manual, bônus mágicos e seletor de mãos para armas
versáteis. O editor separa cálculo automático de valores adaptados. A CA escolhe
uma fórmula válida, permite seleção manual e explica cada parcela no balão.

Usos e estados aparecem nas respectivas **Características & escolhas**; pontos
de feitiçaria, Metamágica, Pacto e preparação usam os painéis do grimório.
Exaustão, Proteção Arcana e PV de Forma Selvagem ficam junto aos PV; ajustes
de defesa ficam junto à CA e a recuperação de Dados de Vida junto à sua lista.
Cada controle tem um único lugar e usa a reserva compartilhada correspondente.
No grimório, preparo e recuperações de magia ficam em quadros compactos por
classe. Paladino, Clérigo, Druida e Mago têm seu contador/ação de preparo; Mago e
Druida da Terra mantêm ali suas recuperações. Bardo, Patrulheiro e subclasses
conjuradoras recebem resumos do método de magias conhecidas. Feitiçaria e Pacto
conservam os quadros próprios; os espaços de Conjuração e a Concentração são comuns.
Descansos recuperam conforme a origem; o longo
pergunta sobre alimento/bebida e a adaptação de recuperar todos os Dados de Vida.
A recuperação de metade dos Dados de Vida permite escolher a classe em multiclasse.
Armas exibem nome e descrição na largura inteira, com ataque e dano alinhados
numa faixa abaixo. Empunhadura, **Crítico** e registro manual ficam no rodapé;
preparar crítico não desloca descrição ou botões.
Em Auto Ficha, cada ataque da própria arma atualiza a marca pelo d20 natural
escolhido após vantagem/desvantagem: 20, ou o intervalo ampliado do Campeão.
O ataque seguinte atualiza essa marca; testes, pool e d20 rápido não a alteram.
Você também pode marcar manualmente para preparar a fórmula e clicar no botão
de dano para rolar. Marcar não rola nem gasta; a marca sai após confirmar
esse dano e cancelar mantém a preparação. **Adicionais** reúne a composição de
um acerto com características elegíveis. Sem adicionais, **Registrar dano**
abre somente o registro de um resultado obtido por fora, sem seletor de rolagem.
Em OFF/Só Pool, o registro dos adicionais também é exclusivamente manual.
O crítico dobra dados, inclusive Furtivo/Destruição, mantendo os bônus fixos.
Crítico Brutal e Ataques Selvagens acrescentam seus dados uma vez; Destruição
Divina Aprimorada já presente na fórmula não é acrescentada de novo.
Ataque Furtivo e Colossos pedem confirmação das condições e do uso neste turno;
alvos e turnos continuam na mesa. Destruição Divina permite escolher um espaço
de Conjuração ou Pacto e indicar corruptor/morto-vivo, com prévia antes do gasto.
Registrar guarda o resultado físico ou de outro rolador, já incluindo bônus e
dados extras do crítico: não lança dados novamente nem dobra o total informado.
Em **Adicionais** no Auto Ficha, **Rolar aqui** usa os dados virtuais. Confirmar desconta um único espaço quando
escolhido. Cancelar preserva tudo; desfazer devolve o espaço. O dano virtual desse
controle preserva o pool e a inspiração. O botão **Dano** comum continua direto.
Armas manuais mantêm a fórmula; seu crítico dobra os dados informados, sem
adicionais automáticos. Não controla PV do alvo, limite de ataques ou munição.

Concentração tem um único estado por ficha, exibido nos PV ou no grimório
conforme a aba aberta. Conjurar outro efeito pede confirmação antes de gastar
recursos. Cada fonte de dano gera um teste de CON: CD 10 ou metade do dano,
o maior, com dado físico ou virtual. Proteção Arcana absorvida não entra nesse
teste; temporários e dano à besta entram. O teste considera proficiência,
Conjurador de Guerra, exaustão e inspiração; na forma, informe o bônus total
apropriado à besta. Conjuração Focada protege conjurações contra quebra por dano.
Fúria, incapacitação e morte encerram concentração. Sono no descanso longo
também encerra; há opção para exceções conscientes. Duração e interrupções de
conjurações prolongadas continuam sendo resolvidas pela mesa.

As 14 condições do apêndice têm marcação e ajuda nos PV. Incapacitação derivada,
impedimentos de movimento e falhas automáticas de FOR/DES entram no cálculo;
outras vantagens/desvantagens, sentidos e alvos são manuais. As defesas de dano
reconhecidas entram no modo por tipo descrito abaixo.
Inconsciência encerra Fúria, reverte Forma Selvagem e deixa o personagem caído;
cura não o levanta automaticamente. Efeitos de defesa recebidos continuam
independentes, pois sua origem pode ser outro conjurador.

Em **Dano detalhado → Calcular por tipo**, escolha a origem e informe os valores
de uma única ocorrência: por exemplo, cortante e fogo do mesmo ataque.
A prévia mostra as defesas reconhecidas e o total recebido. Resistências não
acumulam; resistência arredonda para baixo antes de vulnerabilidade dobrar.
**Ajustes da mesa** permite substituir a defesa deste dano, informar redução
adicional ou vulnerabilidade, sem criar uma defesa permanente na ficha.
Crítico já deve estar incluído no valor rolado; a marca altera as falhas a 0 PV.

Maestria em Armadura Pesada reduz até 3 de dano físico por ataque não mágico,
somente vestindo armadura pesada. Esquiva Sobrenatural aparece para quem tem a
característica: marque se vê o atacante e tem reação disponível, inclusive contra
ataques de magia. A reação vale só para esse ataque; os turnos continuam na mesa.
Se houver redução fixa, a mesa escolhe sua ordem em relação à Esquiva.
Para um efeito que exige **DES para metade**, informe o dano antes do teste e
registre sucesso/falha. Evasão reconhecida zera no sucesso e divide na falha,
sem gastar reação. Resistência/vulnerabilidade entram depois desses modificadores.

São reconhecidas fontes verificadas de Fúria/Urso, Proteção contra Lâminas,
petrificação, raça e classe, detalhadas na auditoria. A Proteção Arcana absorve
antes das defesas próprias; havendo tipos mistos, a mesa escolhe sua ordem pelas
setas. O total após as defesas passa aos temporários/PV e gera um só teste de
concentração ou evento contra a morte. Ex.: 21 de fogo, proteção 10 e resistência
a fogo deixam **5** de dano recebido. Só os 5 entram na concentração.

O modo **Dano já resolvido pela mesa** e os atalhos de PV mantêm o cálculo
anterior, sem reaplicar resistências. Com Proteção Arcana, resolva a absorção
primeiro e as defesas do excedente depois; informe a soma da proteção absorvida
com o dano final que restou para as outras reservas. Na Forma Selvagem, o modo
por tipo fica indisponível: resistências/estatísticas da besta e excesso entre
formas continuam na mesa. Itens personalizados e outras magias/reduções,
testes e reações não enumerados na auditoria continuam na mesa.

Se o dano levar de PV positivos a 0 sem morte instantânea, o controle oferece
**Resistência Implacável** do meio-orc (uma vez por descanso longo) e/ou
**Fúria Implacável** do bárbaro 11 em Fúria (CON, CD crescente por tentativa,
restaurada no descanso curto/longo). O teste usa dado físico ou virtual, bônus,
exaustão e inspiração preparada. No meio-orc bárbaro, pode escolher o uso racial
como alternativa se o teste falhar. Um sucesso deixa com 1 PV antes de aplicar
inconsciência; o dano ainda conta para concentração. Os atalhos −1/−5 abrem essa
escolha antes de descontar um dano elegível. Cancelar preserva os usos e os PV.
Forma Selvagem, Proteção contra a Morte e outros gatilhos ainda são manuais.

PV temporários protegem a forma de besta antes de seus PV; Proteção Arcana é
externa a essas reservas. Ajustar Constituição pelos botões da ficha é uma
alteração permanente: muda os PV máximos por diferença de modificador e nível,
conservando o dano sofrido. Personagem a 0 PV permanece a 0. Descanso longo exige
1 PV no início; o curto preserva a Forma Selvagem, cuja duração segue manual.
A carga inclui moedas a cerca de 10 g cada, conforme o exemplar local.

Em **Dados de Vida · descanso curto**, escolha **Gastar** na classe desejada,
registre a face do dado físico ou use o virtual e aplique a cura. Gasta um dado
por vez, soma Constituição e limita aos PV máximos; o talento Resistente aplica
seu mínimo. Canção do Descanso é opcional quando ouvida e só soma uma vez entre
descansos, se o dado recuperar PV. Em Forma Selvagem, informe a Constituição da
besta: a cura vai para os PV da forma, preservando os humanos. Os dados virtuais
dessas ações não alteram o pool montado. OFF exige dado físico.
A 0 PV, resolva a estabilização antes de registrar o descanso curto e gastar.

A 0 PV aparecem sucessos/falhas e **Teste contra a morte**, com dado físico ou
virtual, bônus recebidos, 1/20 natural e estabilidade. **Dano detalhado** permite
registrar crítico; dano a 0 PV e dano maciço atualizam o estado. Temporários não
evitam falhas pelo dano recebido a 0; Proteção Arcana impede o dano absorvido.
Cura positiva limpa as contagens, mas cura comum e descanso não revivem. Após
uma ressurreição resolvida na mesa, use **Registrar retorno à vida**.

**★ Inspiração** usa a regra de 2014, com uma reserva por personagem. **Usar**
prepara vantagem para o próximo teste/ataque da ficha ou d20 do pool; desvantagem
cancela essa vantagem. **Usar na mesa** gasta após confirmação para jogar com
dado físico. Preparar pode ser cancelado; dano e arremesso rápido não gastam a
inspiração preparada. Não é a reserva de Inspiração de Bardo nem uma rerrolagem.
Tempo de descanso, Medicina, ressurreição, fontes de bônus e gatilhos de classe
que evitam cair a 0 PV continuam dependendo da resolução da mesa.

Magias que precisam de preparo só oferecem lançamento normal quando preparadas;
Domínio/Círculo/Juramento ficam **Sempre Preparadas**. Ritual de mago no grimório
continua disponível sem preparo e sem gastar espaço. Pacto mantém reserva própria.
Dominar Magia e Assinatura aparecem no seletor junto aos espaços, sem duplicar
magias: a assinatura tem um uso por magia entre descansos; aprimorar exige
escolher um espaço explicitamente. A assinatura esgotada não troca de origem
sozinha. Rajada Mística/Raio Ardente mostram o número de feixes/raios e rolam
dano por acerto; **Dano por raio** repete a rolagem sem lançar/gastar de novo.

Cada magia que exige ataque contra CA tem seu próprio **Atq +bônus**, no lugar
do indicador estático de ataque. Em Auto Ficha, rola o d20 com a habilidade da
origem da magia, vantagem/desvantagem e inspiração preparada. Repetir ataques
dos raios/feixes não gasta outro espaço. O ataque não conjura: **Conjurar/Truque**
continua registrando o lançamento e seu gasto, mesmo se o ataque errar. Magias
de resistência, acerto automático e utilidade não recebem esse botão.
**Só Pool** desativa conjurações, rituais e rolagens dos cartões de magia, antes
de gastar espaços/usos/feitiçaria, trocar concentração ou gravar no histórico.
**OFF** conserva o registro explícito de conjuração com dados físicos.

O modo de atributos **Livre / Adaptado** é separado dos 27 pontos. Sugestões de
personalidade usam seletores compactos e continuam editáveis livremente.
No livro, Ctrl/Cmd + rodinha, +, − e 0 ajustam apenas a página do PDF.
Backups novos usam `critcall.character-backup`; os antigos continuam importáveis.

O assistente explica cada etapa, oferece as nove tendências do livro ou texto
livre, e mostra descrições de perícias, idiomas, ferramentas e escolhas. As
consultas recolhidas só abrem com clique. Personalidade, ideais, vínculos e
defeitos têm sugestões editáveis dos 13 antecedentes do livro local.

Compra de pontos usa +/−, com custos crescentes e limite imediato de 27. Conjunto
padrão e resultados de 4d6 usam peças: arraste ou selecione por clique/teclado e
escolha o destino. Mover para um destino ocupado troca as peças, sem duplicar
valores. A rolagem tem animação, respeitando movimento reduzido.

Na evolução, o Incremento no Valor de Habilidade reutiliza a grade dos seis
atributos: distribua dois pontos com +/− e confira os valores atuais/finais.
O limite de 20 é imediato; você pode devolver pontos antes de concluir.

Fechar a criação conserva o rascunho neste navegador, por espaço. **+ Novo**
retoma o rascunho; concluir remove-o somente se a ficha tiver sido salva. Se
houver outro rascunho na conta ao vincular dados locais, ele é preservado e o
recebido fica na fila para a próxima criação. Rascunhos ainda não são fichas
sincronizadas e não fazem parte do backup JSON de personagens.

O livro aberto pela ficha recebe tema, textura e tamanho de fonte no link, sem
identificadores da conta. O PDF permanece intacto. O dado abre e recolhe com
animação de expansão; a versão recolhida não tem moldura retangular.

## Verificar

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

`npm run check` executa testes, build e navegador em sequência. O Playwright também
aceita instalação externa por `DND_PLAYWRIGHT_MODULE`. Os testes de navegador usam
`dist/` sob `/D-D/`; `DND_TEST_ROOT` permite indicar outro artefato e
`DND_TEST_ARTIFACTS` ativa capturas opcionais.
O teste de login compila um artefato temporário com projeto fictício e respostas
HTTP controladas, sem criar usuários reais ou depender das credenciais do ambiente.

`npm run test:database` usa PostgreSQL 16 descartável em Docker por padrão,
verificando RLS/RPC, concorrência e as políticas de imagens. Sem Docker,
`CRITCALL_TEST_POSTGRES_BIN=/caminho/dos/binarios npm run test:database` cria uma
instância descartável com `initdb`/`pg_ctl`, sem TCP ou banco existente. Essa
alternativa passou também com PostgreSQL 18.6. A CI mantém Docker/PostgreSQL 16.

## Desenvolvimento e publicação

Migração para Cloudflare em preparação, após o usuário criar a conta. O roteiro
está em [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md); a configuração de publicação
descrita abaixo continua sendo a atual até a transição revisada. O workflow já
aceita o destino opcional Cloudflare pelo mesmo artefato verificado; as variáveis
e os Secrets necessários estão no roteiro. Nenhuma publicação foi ativada.

Branches por tarefa seguem para `develop`; uma entrega revisada segue para
`main`. Não fazer push direto à `main`. A pipeline verifica tipos, testes,
build e navegador; somente um push na `main` pode publicar `dist/` no Pages.
Para essa nova estrutura, a fonte do Pages deve ser **GitHub Actions**. Não publicar
a raiz com os arquivos de desenvolvimento. A primeira versão já está em
[mhaetinger.github.io/D-D](https://mhaetinger.github.io/D-D/), integrada pelas
PRs #1/#2 e verificada em 15/10/2026. O login desta branch ainda aguarda ativação.

O usuário confirmou a compra de `criticall.art` na Hostinger em 16/10/2026.
Confirmou OK no DNS check do GitHub e na Cloudflare. Consulta pública confirmou
nameservers Cloudflare, HTTPS na raiz e retorno de `www`. A hospedagem ainda é
GitHub Pages; migração para Cloudflare Pages e login no domínio aguardam validação.
O retorno novo já foi aceito pelo Supabase. O procedimento está em [docs/DOMINIO.md](docs/DOMINIO.md).

Veja [CONTRIBUTING.md](CONTRIBUTING.md) e [docs/ARQUITETURA.md](docs/ARQUITETURA.md)
para os módulos, contratos, decisões e próximas etapas.
O [guia da primeira publicação](docs/PRIMEIRA-PUBLICACAO.md) reúne a entrega,
as verificações, o pacote de revisão no GitHub e os passos para ativar o site.

O site é acessível a qualquer pessoa com o endereço. `noindex` orienta mecanismos
de busca e não restringe acesso. Histórico/checkpoints da interface ainda são da
cache pessoal e entram na fila da branch; validação real entre dispositivos,
publicação e salas seguem pendentes.

Código próprio sob MIT. Fontes/ícones e demais componentes conservam suas licenças
em [public/licenses](public/licenses/README.md); PDF.js e seus avisos ficam em
`public/vendor/pdfjs/`. A licença do código não cobre os livros ou marcas.
