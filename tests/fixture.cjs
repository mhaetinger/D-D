// Dados fictícios produzidos pelo mesmo contrato público do criador.
const E = require("../public/rules/character-engine.js");
function warrior() {
  return E.create({ name: "Aventureira de teste", playerName: "Jogador", classId: "guerreiro", raceId: "humano", backgroundId: "soldado", abilityMethod: "standard", baseScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }, allowFeats: false }, {
    raceLanguages: "Abissal", backgroundTools: "Jogo: dados", classSkills: ["acrobacia", "lidar_animais"], fighting: "Arquearia", equipment0: "Cota de malha", equipment1: "Arma marcial e escudo", equipmentWeapons1: "Alabarda", equipment2: "Besta leve e 20 virotes", equipment3: "Pacote de aventureiro",
  });
}
module.exports = { warrior };
