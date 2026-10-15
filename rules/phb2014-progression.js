/* Tabelas e escolhas de equipamento. Um nível de classe nunca usa o nível global
   para decidir quais magias pode aprender; multiclasse só combina os espaços. */
(function (root) {
  const fullSlots = [
    [],
    [2],
    [3],
    [4, 2],
    [4, 3],
    [4, 3, 2],
    [4, 3, 3],
    [4, 3, 3, 1],
    [4, 3, 3, 2],
    [4, 3, 3, 3, 1],
    [4, 3, 3, 3, 2],
    [4, 3, 3, 3, 2, 1],
    [4, 3, 3, 3, 2, 1],
    [4, 3, 3, 3, 2, 1, 1],
    [4, 3, 3, 3, 2, 1, 1],
    [4, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 2, 1, 1, 1, 1],
    [4, 3, 3, 3, 3, 1, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 2, 1, 1],
  ];
  const counts = {
    bardo: {
      known: [
        0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22,
        22,
      ],
      cantrips: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    },
    bruxo: {
      known: [
        0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15,
        15,
      ],
      cantrips: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    },
    feiticeiro: {
      known: [
        0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15,
        15,
      ],
      cantrips: [0, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    },
    patrulheiro: {
      known: [
        0, 0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11,
      ],
      cantrips: Array(21).fill(0),
    },
    clerigo: {
      cantrips: [0, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    },
    druida: {
      cantrips: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    },
    mago: {
      cantrips: [0, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    },
    third: {
      known: [
        0, 0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13,
      ],
      cantrips: [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    },
  };
  function pairs(levels, rows) {
    return Object.fromEntries(levels.map((lv, i) => [lv, rows[i].split("|")]));
  }
  const subclassSpells = {
    "bruxo:arquifada": pairs(
      [1, 3, 5, 7, 9],
      [
        "fogo das fadas|sono",
        "acalmar emoções|força fantasmagórica",
        "piscar|ampliar plantas",
        "dominar besta|invisibilidade maior",
        "dominar pessoa|similaridade",
      ],
    ),
    "bruxo:corruptor": pairs(
      [1, 3, 5, 7, 9],
      [
        "mãos flamejantes|comando",
        "cegueira/surdez|raio ardente",
        "bola de fogo|névoa fétida",
        "escudo de fogo|muralha de fogo",
        "coluna de chamas|consagrar",
      ],
    ),
    "bruxo:grandeAntigo": pairs(
      [1, 3, 5, 7, 9],
      [
        "sussurros dissonantes|riso histérico de Tasha",
        "detectar pensamentos|força fantasmagórica",
        "clarividência|enviar mensagem",
        "dominar besta|tentáculos negros de Evard",
        "dominar pessoa|telecinésia",
      ],
    ),
    "clerigo:conhecimento": pairs(
      [1, 3, 5, 7, 9],
      [
        "comando|identificação",
        "augúrio|sugestão",
        "dificultar detecção|falar com os mortos",
        "olho arcano|confusão",
        "conhecimento lendário|vidência",
      ],
    ),
    "clerigo:enganacao": pairs(
      [1, 3, 5, 7, 9],
      [
        "enfeitiçar pessoa|disfarçar-se",
        "reflexos|passos sem pegadas",
        "piscar|dissipar magia",
        "porta dimensional|metamorfose",
        "dominar pessoa|modificar memória",
      ],
    ),
    "clerigo:guerra": pairs(
      [1, 3, 5, 7, 9],
      [
        "auxílio divino|escudo da fé",
        "arma mágica|arma espiritual",
        "manto do cruzado|espíritos guardiões",
        "movimentação livre|pele de pedra",
        "coluna de chamas|imobilizar monstro",
      ],
    ),
    "clerigo:luz": pairs(
      [1, 3, 5, 7, 9],
      [
        "mãos flamejantes|fogo das fadas",
        "esfera flamejante|raio ardente",
        "luz do dia|bola de fogo",
        "guardião da fé|muralha de fogo",
        "coluna de chamas|vidência",
      ],
    ),
    "clerigo:natureza": pairs(
      [1, 3, 5, 7, 9],
      [
        "amizade animal|falar com animais",
        "pele de árvore|crescer espinhos",
        "ampliar plantas|muralha de vento",
        "dominar besta|vinha esmagadora",
        "praga de insetos|caminhar em árvores",
      ],
    ),
    "clerigo:tempestade": pairs(
      [1, 3, 5, 7, 9],
      [
        "névoa obscurecente|onda trovejante",
        "lufada de vento|despedaçar",
        "convocar relâmpagos|nevasca",
        "controlar a água|tempestade de gelo",
        "onda destrutiva|praga de insetos",
      ],
    ),
    "clerigo:vida": pairs(
      [1, 3, 5, 7, 9],
      [
        "bênção|curar ferimentos",
        "restauração menor|arma espiritual",
        "sinal de esperança|revivificar",
        "proteção contra a morte|guardião da fé",
        "curar ferimentos em massa|reviver os mortos",
      ],
    ),
    "paladino:devocao": pairs(
      [3, 5, 9, 13, 17],
      [
        "proteção contra o bem e mal|santuário",
        "restauração menor|zona da verdade",
        "sinal de esperança|dissipar magia",
        "movimentação livre|guardião da fé",
        "comunhão|coluna de chamas",
      ],
    ),
    "paladino:ancioes": pairs(
      [3, 5, 9, 13, 17],
      [
        "golpe constritor|falar com animais",
        "raio lunar|passo nebuloso",
        "ampliar plantas|proteção contra energia",
        "tempestade de gelo|pele de pedra",
        "comunhão com a natureza|caminhar em árvores",
      ],
    ),
    "paladino:vinganca": pairs(
      [3, 5, 9, 13, 17],
      [
        "perdição|marca do caçador",
        "imobilizar pessoa|passo nebuloso",
        "velocidade|proteção contra energia",
        "banimento|porta dimensional",
        "imobilizar monstro|vidência",
      ],
    ),
    "patrulheiro:subterraneo": pairs(
      [3, 5, 9, 13, 17],
      [
        "disfarçar-se",
        "truque de corda",
        "glifo de vigilância",
        "invisibilidade maior",
        "similaridade",
      ],
    ),
    "terra:Ártico": pairs(
      [3, 5, 7, 9],
      [
        "imobilizar pessoa|crescer espinhos",
        "nevasca|lentidão",
        "movimentação livre|tempestade de gelo",
        "comunhão com a natureza|cone de frio",
      ],
    ),
    "terra:Costa": pairs(
      [3, 5, 7, 9],
      [
        "reflexos|passo nebuloso",
        "respirar na água|andar na água",
        "controlar a água|movimentação livre",
        "conjurar elemental|vidência",
      ],
    ),
    "terra:Deserto": pairs(
      [3, 5, 7, 9],
      [
        "nublar|silêncio",
        "criar alimentos|proteção contra energia",
        "praga|terreno alucinógeno",
        "praga de insetos|muralha de pedra",
      ],
    ),
    "terra:Floresta": pairs(
      [3, 5, 7, 9],
      [
        "pele de árvore|patas de aranha",
        "convocar relâmpagos|ampliar plantas",
        "adivinhação|movimentação livre",
        "comunhão com a natureza|passo de árvore",
      ],
    ),
    "terra:Montanha": pairs(
      [3, 5, 7, 9],
      [
        "patas de aranha|crescer espinhos",
        "relâmpago|mesclar-se às rochas",
        "moldar rochas|pele de pedra",
        "criar passagem|muralha de pedra",
      ],
    ),
    "terra:Pântano": pairs(
      [3, 5, 7, 9],
      [
        "flecha ácida de Melf|escuridão",
        "andar na água|névoa fétida",
        "movimentação livre|localizar criatura",
        "praga de insetos|vidência",
      ],
    ),
    "terra:Planície": pairs(
      [3, 5, 7, 9],
      [
        "invisibilidade|passos sem pegadas",
        "luz do dia|velocidade",
        "adivinhação|movimentação livre",
        "sonho|praga de insetos",
      ],
    ),
    "terra:Subterrâneo": pairs(
      [3, 5, 7, 9],
      [
        "patas de aranha|teia",
        "forma gasosa|névoa fétida",
        "invisibilidade maior|moldar rochas",
        "névoa mortal|praga de insetos",
      ],
    ),
  };
  const localEquipment =
    typeof module !== "undefined"
      ? require("./phb2014-equipment")
      : root.PHB_EQUIPMENT;
  const weapons = localEquipment.weapons;
  // @... indica escolha de uma arma da categoria; duas escolhas permanecem independentes.
  const equipment = {
    barbaro: {
      groups: [
        ["Machado grande", "@martialMelee"],
        ["2 Machadinhas", "@simple"],
      ],
      fixed: ["Pacote de explorador", "4 Azagaias"],
    },
    bardo: {
      groups: [
        ["Rapieira", "Espada longa", "@simple"],
        ["Pacote de diplomata", "Pacote de artista"],
        ["Alaúde", "@instrument"],
      ],
      fixed: ["Armadura de couro", "Adaga"],
    },
    bruxo: {
      groups: [
        ["Besta leve e 20 virotes", "@simple"],
        ["Bolsa de componentes", "Foco arcano"],
        ["Pacote de estudioso", "Pacote de aventureiro"],
        ["@simple"],
      ],
      fixed: ["Armadura de couro", "2 Adagas"],
    },
    clerigo: {
      groups: [
        ["Maça", "Martelo de guerra"],
        ["Brunea", "Armadura de couro", "Cota de malha"],
        ["Besta leve e 20 virotes", "@simple"],
        ["Pacote de sacerdote", "Pacote de explorador"],
      ],
      fixed: ["Escudo", "Símbolo sagrado"],
    },
    druida: {
      groups: [
        ["Escudo de madeira", "@simple"],
        ["Cimitarra", "@simpleMelee"],
      ],
      fixed: ["Armadura de couro", "Pacote de explorador", "Foco druídico"],
    },
    feiticeiro: {
      groups: [
        ["Besta leve e 20 virotes", "@simple"],
        ["Bolsa de componentes", "Foco arcano"],
        ["Pacote de aventureiro", "Pacote de explorador"],
      ],
      fixed: ["2 Adagas"],
    },
    guerreiro: {
      groups: [
        ["Cota de malha", "Armadura de couro, arco longo e 20 flechas"],
        ["Arma marcial e escudo", "Duas armas marciais"],
        ["Besta leve e 20 virotes", "2 Machadinhas"],
        ["Pacote de aventureiro", "Pacote de explorador"],
      ],
      fixed: [],
    },
    ladino: {
      groups: [
        ["Rapieira", "Espada curta"],
        ["Arco curto e 20 flechas", "Espada curta"],
        [
          "Pacote de assaltante",
          "Pacote de aventureiro",
          "Pacote de explorador",
        ],
      ],
      fixed: ["Armadura de couro", "2 Adagas", "Ferramentas de ladrão"],
    },
    mago: {
      groups: [
        ["Bordão", "Adaga"],
        ["Bolsa de componentes", "Foco arcano"],
        ["Pacote de estudioso", "Pacote de explorador"],
      ],
      fixed: ["Grimório"],
    },
    monge: {
      groups: [
        ["Espada curta", "@simple"],
        ["Pacote de aventureiro", "Pacote de explorador"],
      ],
      fixed: ["10 Dardos"],
    },
    paladino: {
      groups: [
        ["Arma marcial e escudo", "Duas armas marciais"],
        ["5 Azagaias", "@simpleMelee"],
        ["Pacote de sacerdote", "Pacote de explorador"],
      ],
      fixed: ["Cota de malha", "Símbolo sagrado"],
    },
    patrulheiro: {
      groups: [
        ["Brunea", "Armadura de couro"],
        ["2 Espadas curtas", "Duas armas simples corpo a corpo"],
        ["Pacote de aventureiro", "Pacote de explorador"],
      ],
      fixed: ["Arco longo e 20 flechas"],
    },
  };
  const data = {
    fullSlots,
    counts,
    subclassSpells,
    weapons,
    equipment,
    gear: localEquipment.gear,
  };
  if (typeof module !== "undefined") module.exports = data;
  else root.PHB_PROGRESSION = data;
})(globalThis);
