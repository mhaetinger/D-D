# Experiência de criação e continuidade — 16/10/2026

Pedido do responsável: orientar quem nunca jogou e preservar todo o trabalho ao
transitar entre uso local, entrada, cadastro e conta existente. Este documento
acompanha a implementação na branch `feature/criacao-guiada`.

## Dado e leitura

- [x] Remover a moldura quadrada do dado recolhido, mantendo foco acessível.
- [x] Animar a abertura/fechamento como expansão do dado; respeitar movimento
  reduzido, cliques rápidos, arraste e limites da tela.
- [x] O livro deve herdar tema, textura e fonte do espaço da ficha que o abriu,
  incluindo contas autenticadas. Preservar zoom, navegação e texto do PDF.

## Entrada e continuidade

- [x] Permitir voltar à entrada a partir do espaço sem conta.
- [x] Mostrar “Voltar à sua ficha em andamento” quando houver dados locais.
- [x] Conservar fichas, notas, imagens e rascunho de criação ao navegar/retornar.
- [x] Ao cadastrar com dados locais, vincular cópias à identidade confirmada;
  confirmação de e-mail, recarga e falta de conexão não podem perder a origem.
- [x] Ao entrar numa conta que já tem fichas, perguntar se deseja salvar o
  trabalho local como novas fichas. Nunca sobrescrever a coleção da conta.
- [x] Impedir cópias repetidas em recargas, reconexões e autenticações duplicadas.
  Manter a origem local; só anunciar sincronização após confirmação do serviço.
- [ ] Importar uma ficha existente a partir de PDF, preservando os campos
  preenchidos, escolhas manuais, história, magias e anotações antes de oferecer
  sua cópia à conta confirmada. O PDF do Kael continua fora do Git.
- [x] A ficha pessoal solicitada já foi encontrada na conta indicada em consulta
  pontual de 19/10/2026; a cópia existente foi preservada, sem nova importação ou
  sobrescrita. Dados reais e endereços da conta ficam fora do Git.

## Criador orientado

- [x] Tendência: nove opções do livro, explicações e alternativa personalizada.
- [x] “Consultar classe/raça/antecedente”: conteúdo apenas ao expandir; não
  repetir o mesmo conteúdo num balão sobre o cabeçalho fechado.
- [x] Explicar “Padrão” e cada variação de antecedente, com fonte quando houver.
- [x] Explicar talentos/Humano Variante e o papel da autorização do mestre.
- [x] Compra de pontos: controles +/−, valores 8–15, custo crescente e teto 27;
  impedir a operação que excede o orçamento. Mostrar pontos restantes em texto.
- [x] Conjunto padrão: valores únicos arrastáveis para as seis habilidades;
  permitir também toque/clique/teclado, sem exigir arraste de todo usuário.
- [x] Rolagem: suspense/animação, mostrar os dados e descarte do menor; distribuir
  os seis resultados pelo mesmo mecanismo. Resultados iguais são fichas distintas.
- [x] Ajudar a entender cada habilidade e os bônus aplicados depois da distribuição.
- [x] Proficiências: explicar perícias, idiomas, ferramentas e demais escolhas.
- [x] Conferir todas as etapas: classe, magias, equipamento e revisão; explicar
  alternativas com informação útil, preservando foco, rolagem e linhas selecionadas.
- [x] Pontos de Vida no 1º nível: escolher entre máximo do Dado de Vida + CON
  (padrão do livro), rolagem `1dX` + CON, média fixa ou valor adaptado da mesa.
- [x] Equipamento inicial (Cap. 5, p. 145): escolher entre pacotes pré-definidos
  (classe + antecedente) ou riqueza inicial por classe (`Xd4 × 10 po` / `5d4 po`)
  com mercado completo do Capítulo 5 e adaptação livre de itens/ouro.
- [x] Balão de consulta (`#ruleTooltip`): manter rolagem por rodinha do mouse sem
  bloquear o clique nas opções nem reabrir após selecionar; converter marcadores
  privados do PDF (`\uf0b7`) para `•` e recortar bordas de modais roláveis.
- [x] Compactar barra superior (`<header>`), `#headerSection` e linha de abas +
  apresentação (`#sheetDisplay`) para economizar altura em celulares e monitores.
- [x] Personalidade, ideais, vínculos e defeitos: apresentar sugestões do
  antecedente, permitir texto próprio e conservar escolhas ao trocar de etapa.
  Consultar os catálogos/livros autorizados; não editar catálogos gerados à mão.

## Conferência da entrega

- [x] Testes de isolamento/continuidade, duplicação, falhas de armazenamento e
  login/cadastro com dados locais, incluindo notas e imagens.
- [x] Testes das regras de pontos/distribuição, PV inicial, riqueza/compras do
  Capítulo 5 e de todas as classes existentes.
- [x] Navegador: início/retorno, livro, dado, criação e persistência; teclado,
  toque, movimento reduzido, três temas e largura de celular.
- [x] `npm test` (193 testes), `npm run build` e roteiros pertinentes
  (`creation-browser.cjs`, `sheet-browser.cjs`, `app-browser.cjs`). Se SQL/RLS/RPC
  mudar, executar também `npm run test:database`. Registrar somente verificações feitas.
- [x] Atualizar changelog, contratos e retomada; entregar por PR para `develop`.

As regras permanecem de 2014 com Patrulheiro Revisado; 2024 continua visual.
Uma transferência de conta só começa após validar a identidade e consultar a
coleção remota, para não confundir “ainda não carregou” com “conta vazia”.
