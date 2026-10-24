import { sheetStore, selectCharacterWorkspace } from "../storage/character-store";
import { showNotice } from './notices';
import { selectAccountTab, refreshAccountView } from './account-panel';
import { currentWorkspaceKey, workspaceStorage } from "../storage/account-scope";
import { ACTIVE_CHARACTER_KEY, readPreference, writePreference } from "../storage/preferences";
import { armorClass, applyDamage, exhaustion, savingThrow, initiativeBonus, changePermanentAbility } from "../rules/combat";
import { readableText } from "../rules/text";
import { renderResourceControls, renderResourcesAt, spellcastingStatusControls, defenseControls, conditionControls, hitDiceRecoveryControls, saveRuleStep, retainConditionNodes } from "../rules/ui";
import { spellClassPanels } from '../rules/spell-class-panels';
import { resourcesAt } from "../rules/placement";
import { featureGroups } from '../rules/feature-groups';
import { canCastNormally, canRitual, preparation, wizardPrivilege, castingRestriction, armorProficiencies } from "../rules/spellcasting";
import { resolveSpellEffect, innateCastLevel, twinEligible, spellDamageBreakdown } from "../rules/spell-effects";
import {weaponPowerAttackOption} from '../rules/weapon-power-attack';
import {skillBonus,passiveSkill,untrainedAbilityBonus} from '../rules/passives';
import { consumeInspiration, deathStatus, healHitPoints, inspirationRollMode } from '../rules/health';
import { damageDescription, deathControls, hitDiceControls, inspirationControls } from '../rules/health-ui';
import { offerSurvivalForDamage } from '../rules/damage-ui';
import { parseDiceFormula } from '../rules/dice-formula';
import {spellDuration} from '../rules/spell-duration';
import { evaluateDicePool, sheetD20Rules, canRerollHalfling, rerollHalfling, addLuckyDie, chooseLuckyDie, luckyFaces } from '../rules/dice-roll';
import { luckRemaining } from '../rules/lucky';
import { askToUseLucky, chooseLuckyFace, payLuckyPoint } from '../rules/lucky-ui';
import { renderWeaponDamageTools, rollPreparedWeaponDamage, setWeaponCriticalPrepared, weaponDamageLabel, weaponAttackBonus, weaponPowerAttackPrepared } from '../rules/weapon-damage-ui';
import { applyCastConcentration, concentration, concentrationBlock, incapacityReason, needsConcentrationConfirmation, spellConcentration, validateConcentrationStart } from '../rules/concentration';
import { concentrationControls } from '../rules/concentration-ui';
import { automaticSaveFailure } from '../rules/conditions';
import { takeRest } from "../rules/rest";
import { onSpellCast, resourcesFor } from "../rules/resources";
import {chooseResourceDice} from '../rules/resource-roll-ui';
import { characterSnapshot, historyComparable as characterHistoryComparable, historyKey, HISTORY_PREFIX, HISTORY_MAX_STEPS, isCharacterHistoryKey, migrateCharacterHistories, splitLegacyHistory, validateCharacterHistory, boundedCharacterHistory } from '../storage/character-history';
import { setupDiceDock } from "./dice-dock";
import { avatarMarkup } from "../media/avatar";
import {sheetInput,sheetSelect,sheetText,sheetIdentity,captureSheetFields,restoreSheetFields,requireSheetEdit,requireSheetConfiguration,updateSheetLockUI,poolEditorVisible,beginSheetRender,endSheetRender} from '../sheet-edit/ui';
import {parkSheetPanels,restoreSheetPanels,clearSheetPanels,mountSheetPanel,closeSheetPanel,canSaveSheetPanel} from '../sheet-edit/panels';
import {canEditSheet} from '../sheet-edit/access';
import {canConfigureSheet} from '../sheet-edit/lock';
import {createWeaponFields} from '../sheet-edit/weapon-fields';
import {featureConsultButton,bookConsultButton} from './feature-consult';
import {updateDiceDockAppearance} from './dice-dock-appearance';

// =========================================================================
// 1. METADADOS E CATÁLOGOS
// =========================================================================
const DAMAGE_TYPES_META = {
  misto: {label:'Dano de tipos diferentes',icon:'layers',cls:'badge-utilidade'},
  livro: { label: "Efeito no livro", icon: "book-open", cls: "badge-utilidade" },
  fogo: { label: "Fogo", icon: "flame", cls: "badge-fogo" },
  eletrico: { label: "Elétrico", icon: "zap", cls: "badge-eletrico" },
  frio: { label: "Frio/Gelo", icon: "snowflake", cls: "badge-frio" },
  gelo: { label: "Frio/Gelo", icon: "snowflake", cls: "badge-frio" },
  necrotico: {
    label: "Necrótico",
    icon: "skull",
    cls: "badge-necrotico",
  },
  energia: { label: "Energia", icon: "sparkles", cls: "badge-energia" },
  trovejante: {
    label: "Trovejante",
    icon: "cloud-lightning",
    cls: "badge-trovejante",
  },
  trovao: {
    label: "Trovejante",
    icon: "cloud-lightning",
    cls: "badge-trovejante",
  },
  acido: { label: "Ácido", icon: "droplets", cls: "badge-acido" },
  veneno: { label: "Veneno", icon: "skull", cls: "badge-veneno" },
  psiquico: { label: "Psíquico", icon: "brain", cls: "badge-psiquico" },
  radiante: { label: "Radiante", icon: "sun", cls: "badge-radiante" },
  cortante: { label: "Cortante", icon: "swords", cls: "badge-cortante" },
  perfurante: { label: "Perfurante", icon: "swords", cls: "badge-cortante" },
  concussao: { label: "Concussão", icon: "swords", cls: "badge-cortante" },
  cura: { label: "Cura", icon: "heart-pulse", cls: "badge-utilidade" },
  defesa: { label: "Defesa/Proteção", icon: "shield", cls: "badge-utilidade" },
  utilidade: {
    label: "Utilidade",
    icon: "wand-2",
    cls: "badge-utilidade",
  },
};

const TARGET_TYPES_META = {
  mira: { label: "Mira", icon: "crosshair" },
  toque: { label: "Toque", icon: "user-check" },
  multi: { label: "Teleguiado", icon: "target" },
  auto: { label: "Teleguiado", icon: "target" },
  esfera: { label: "Área: Esfera", icon: "circle-dot" },
  cone: { label: "Área: Cone", icon: "triangle" },
  linha: { label: "Área: Linha", icon: "move-right" },
  cubo: { label: "Área: Cubo", icon: "box" },
  cilindro: { label: "Área: Cilindro", icon: "circle-dot" },
  pessoal: { label: "Pessoal/Buff", icon: "user-check" },
  self: { label: "Pessoal/Toque", icon: "user-check" },
  ritual_inv: { label: "Ritual", icon: "book-open" },
  ritual: { label: "Ritual", icon: "book-open" },
};

const DEFENSE_TYPES_META = {
  atq_magico: { label: "Ataque mágico", icon: "crosshair" },
  tr_for: { label: "Resistência de FOR", icon: "shield-alert" },
  tr_des: { label: "Resistência de DES", icon: "shield-alert" },
  tr_con: { label: "Resistência de CON", icon: "shield-alert" },
  tr_int: { label: "Resistência de INT", icon: "shield-alert" },
  tr_sab: { label: "Resistência de SAB", icon: "shield-alert" },
  tr_car: { label: "Resistência de CAR", icon: "shield-alert" },
  auto_hit: { label: "Acerto Auto", icon: "check-circle-2" },
  nenhuma: null,
};

const BOOK_SPELLS_DB = {
  "Toque Arrepiante": {
    school: "Necromancia (Truque)",
    duration: "1 rodada",
    materialDesc: "V, S",
    bookDesc:
      "Ataque mágico à distância, alcance de 36m. O dano necrótico aumenta nos níveis 5, 11 e 17 do personagem e o alvo atingido não pode recuperar PV até o início do seu próximo turno.",
    upcastRule: "Truques aumentam com o nível total do personagem, sem gastar espaços.",
    calcEffect: (lvl, twinned, char) => `${twinned ? "2 alvos × " : ""}${getCantripDiceCount(char)}d8 Necrótico`,
    diceFormula: (lvl, twinned, char) => `${getCantripDiceCount(char) * (twinned ? 2 : 1)}d8`,
  },
  Amizade: {
    school: "Encantamento (Truque)",
    duration: "Concentração, 1 min",
    materialDesc: "V, M",
    bookDesc:
      "Vantagem em testes de Carisma contra 1 criatura não-hostil por 1 minuto.",
    upcastRule: "Truque social.",
    calcEffect: () => "Vantagem em Carisma (1 min)",
    diceFormula: null,
  },
  "Raio de Fogo": {
    school: "Evocação (Truque)",
    duration: "Instantânea",
    materialDesc: "V, S",
    bookDesc:
      "Ataque mágico à distância, alcance de 36m. O dano de fogo aumenta nos níveis 5, 11 e 17 do personagem.",
    upcastRule: "Truques aumentam com o nível total do personagem, sem gastar espaços.",
    calcEffect: (lvl, twinned, char) => `${twinned ? "2 alvos × " : ""}${getCantripDiceCount(char)}d10 Fogo`,
    diceFormula: (lvl, twinned, char) => `${getCantripDiceCount(char) * (twinned ? 2 : 1)}d10`,
  },
  "Raio de Gelo": {
    school: "Evocação (Truque)",
    duration: "Instantânea",
    materialDesc: "V, S",
    bookDesc:
      "Ataque mágico à distância, alcance de 18m. O dano de frio aumenta nos níveis 5, 11 e 17; ao acertar, reduz o deslocamento em 3m até o início do seu próximo turno.",
    upcastRule: "Truques aumentam com o nível total do personagem, sem gastar espaços.",
    calcEffect: (lvl, twinned, char) => `${twinned ? "2 alvos × " : ""}${getCantripDiceCount(char)}d8 Frio (-3m)`,
    diceFormula: (lvl, twinned, char) => `${getCantripDiceCount(char) * (twinned ? 2 : 1)}d8`,
  },
  Mensagem: {
    school: "Transmutação (Truque)",
    duration: "1 rodada",
    materialDesc: "V, S, M",
    bookDesc: "Sussurro mágico a até 36m com resposta privada.",
    upcastRule: "Truque utilitário.",
    calcEffect: () => "Sussurro a 36m",
    diceFormula: null,
  },
  "Rajada Mística": {
    school: "Evocação (Truque de Bruxo)",
    duration: "Instantânea",
    materialDesc: "V, S",
    bookDesc:
      "Cada feixe exige um ataque mágico e causa 1d10 de energia, com alcance de 36m. A quantidade de feixes aumenta nos níveis 5, 11 e 17 do personagem.",
    upcastRule: "1 feixe no nível 1; 2 no nível 5; 3 no nível 11; 4 no nível 17. Duplicar por Magia Gêmea depende da elegibilidade e de eventuais regras da mesa.",
    calcEffect: (lvl, twinned, char) => `${getCantripDiceCount(char) * (twinned ? 2 : 1)} feixe(s) × 1d10 Energia`,
    diceFormula: (lvl, twinned, char) => `${getCantripDiceCount(char) * (twinned ? 2 : 1)}d10`,
  },
  "Ilusão Menor": {
    school: "Ilusão (Truque de Bruxo)",
    duration: "1 minuto",
    materialDesc: "S, M",
    bookDesc:
      "Cria som ou imagem estática a até 9m por 1 minuto. Investigar a ilusão usa a CD de magia do conjurador.",
    upcastRule: "Truque de ilusão.",
    calcEffect: (lvl, twinned, char, spell) => `Som/Imagem (Investigação CD ${getSpellcastingStats(char, spell?.classId)?.dc ?? "—"})`,
    diceFormula: null,
  },
  "Mísseis Mágicos": {
    school: "Evocação (1º Círculo — Regra da Mesa c/ Magia Gêmea)",
    duration: "Instantânea",
    materialDesc: "V, S",
    bookDesc:
      "Dardos de energia de acerto automático (1d4+1 por míssil). Com a adaptação da sua mesa, Magia Gêmea dobra todos os mísseis gastando Pontos de Feitiçaria = Nível do Slot!",
    upcastRule:
      "Normal: 3 mísseis (1º), 4 (2º), 5 (3º). Com Magia Gêmea: 6 mísseis (1º Nv - 1 pt), 8 mísseis (2º Nv - 2 pts), 10 mísseis (3º Nv - 3 pts)!",
    calcEffect: (castLvl, twinned) => {
      const baseMissiles = 2 + castLvl;
      const total = twinned ? baseMissiles * 2 : baseMissiles;
      return `${total} mísseis (${total}d4+${total})${twinned ? " ⚡ GÊMEA!" : ""}`;
    },
    diceFormula: (castLvl, twinned) => {
      const total = (2 + castLvl) * (twinned ? 2 : 1);
      return `${total}d4+${total}`;
    },
  },
  "Armadura Arcana": {
    school: "Abjuração (1º Círculo)",
    duration: "8 horas",
    materialDesc: "V, S, M",
    bookDesc:
      "A CA base do alvo passa a ser 13 + seu modificador de Destreza por 8 horas. O alvo não pode vestir armadura. Não se soma a outra fórmula de CA; escudo é tratado separadamente.",
    upcastRule: "Duração de 8h.",
    calcEffect: (lvl, twinned, char) => `CA 13 + DES (${fmtMod(getMod(char.abilities.dex.score))})${char.shieldEquipped ? " + escudo (2)" : ""} = ${getMageArmorAC(char)} · 8h`,
    diceFormula: null,
  },
  "Disfarçar-se": {
    school: "Ilusão (1º Círculo)",
    duration: "1 hora",
    materialDesc: "V, S",
    bookDesc:
      "Muda aparência física e roupas por 1 hora. Investigar o disfarce usa a CD de magia do conjurador.",
    upcastRule: "Duração de 1h.",
    calcEffect: () => "Disfarce (1h)",
    diceFormula: null,
  },
  "Bruxaria (Hex)": {
    school: "Encantamento (1º Círculo — Bruxo)",
    duration: "Concentração",
    materialDesc: "V, S, M",
    bookDesc:
      "Ação Bônus: Causa +1d6 necrótico extra por acerto e impõe desvantagem em testes de 1 atributo.",
    upcastRule: "Espaço de 3º/4º círculo: até 8h; 5º ou superior: até 24h, mantendo concentração.",
    calcEffect: (castLvl) =>
      `+1d6 Necrótico (${castLvl >= 5 ? "24h" : castLvl >= 3 ? "8h" : "1h"})`,
    diceFormula: () => "1d6",
  },
  "Recuo Acelerado": {
    school: "Transmutação (1º Círculo — Bruxo)",
    duration: "Concentração, 10 min",
    materialDesc: "V, S",
    bookDesc:
      "Permite usar Disparada como Ação Bônus em todos os seus turnos.",
    upcastRule: "Até 10 min.",
    calcEffect: () => "Disparada Bônus",
    diceFormula: null,
  },
  "Névoa de Adagas": {
    school: "Conjuração (2º Círculo)",
    duration: "Concentração, 1 min",
    materialDesc: "V, S, M",
    bookDesc:
      "Cubo de 1,5m de adagas giratórias a até 18m. Dano cortante automático.",
    upcastRule: "+2d4 para cada nível acima do 2º (6d4 no 3º Nível!).",
    calcEffect: (castLvl) =>
      `${4 + Math.max(0, (castLvl - 2) * 2)}d4 Cortante Auto`,
    diceFormula: (castLvl) => `${4 + Math.max(0, (castLvl - 2) * 2)}d4`,
  },
  Despedaçar: {
    school: "Evocação (2º Círculo)",
    duration: "Instantânea",
    materialDesc: "V, S, M",
    bookDesc:
      "Explosão sonora em esfera de 3m a até 18m. O alvo faz resistência de Constituição contra a CD de magia do conjurador.",
    upcastRule: "+1d8 para cada nível acima do 2º (4d8 no 3º Nível!).",
    calcEffect: (castLvl) =>
      `${3 + Math.max(0, castLvl - 2)}d8 Trovejante`,
    diceFormula: (castLvl) => `${3 + Math.max(0, castLvl - 2)}d8`,
  },
  "Bola de Fogo": {
    school: "Evocação (3º Círculo)",
    duration: "Instantânea",
    materialDesc: "V, S, M",
    bookDesc:
      "Esfera de 6m de raio a até 45m. Resistência de Destreza contra a CD de magia do conjurador: metade do dano em sucesso.",
    upcastRule: "+1d6 para cada nível acima do 3º.",
    calcEffect: (castLvl) =>
      `${8 + Math.max(0, castLvl - 3)}d6 Fogo (Esfera 6m)`,
    diceFormula: (castLvl) => `${8 + Math.max(0, castLvl - 3)}d6`,
  },
  Relâmpago: {
    school: "Evocação (3º Círculo)",
    duration: "Instantânea",
    materialDesc: "V, S, M",
    bookDesc:
      "Linha de 30m x 1,5m. Resistência de Destreza contra a CD de magia do conjurador: metade do dano em sucesso.",
    upcastRule: "+1d6 para cada nível acima do 3º.",
    calcEffect: (castLvl) =>
      `${8 + Math.max(0, castLvl - 3)}d6 Elétrico (Linha 30m)`,
    diceFormula: (castLvl) => `${8 + Math.max(0, castLvl - 3)}d6`,
  },
  "Invocar Familiar (Ritual)": {
    school: "Conjuração (1º Círculo — Ritual)",
    duration: "Instantânea",
    materialDesc: "V, S, M",
    bookDesc: "Invoca familiar espiritual sem gastar espaço de magia.",
    upcastRule: "Ritual.",
    calcEffect: () => "Familiar (Sem custo)",
    diceFormula: null,
  },
  "Compreender Idiomas (Ritual)": {
    school: "Adivinhação (1º Círculo — Ritual)",
    duration: "1 hora",
    materialDesc: "V, S, M",
    bookDesc: "Compreende qualquer idioma falado ou escrito por 1 hora.",
    upcastRule: "Ritual.",
    calcEffect: () => "Entende idiomas (1h)",
    diceFormula: null,
  },
};
BOOK_SPELLS_DB["Bruxaria"] = BOOK_SPELLS_DB["Bruxaria (Hex)"];
BOOK_SPELLS_DB["Nuvem de Adagas"] = BOOK_SPELLS_DB["Névoa de Adagas"];
BOOK_SPELLS_DB["Convocar Familiar"] = BOOK_SPELLS_DB["Invocar Familiar (Ritual)"];
BOOK_SPELLS_DB["Compreender Idiomas"] = BOOK_SPELLS_DB["Compreender Idiomas (Ritual)"];

const BOOK_ITEMS_DB = {
  "Besta leve": {
    type: "Arma Simples à Distância",
    cost: "25 PO",
    weight: "2,5 kg",
    dmgOrAc: "1d8 Perfurante (Atq +6)",
    props: "Munição (24/96m), Recarga, Duas Mãos",
    bookDesc: "Arma de ataque à distância registrada na ficha do personagem de referência.",
  },
  "Faca pequena (Adaga)": {
    type: "Arma Simples Corpo-a-Corpo",
    cost: "2 PO",
    weight: "0,5 kg",
    dmgOrAc: "1d4+1 Cortante/Perfurante",
    props: "Acuidade, Leve, Arremesso (6/18m)",
    bookDesc: 'Anotada na ficha do personagem de referência como "Faca peq f/2 (1d4 c,p)".',
  },
};

const SHOP_CATALOG = [
  {
    id: "item_pocao_cura",
    name: "Poção de Cura (2d4+2 PV)",
    category: "Aventura",
    costQty: 50,
    costCoin: "po",
    weightKg: 0.25,
  },
  {
    id: "item_virotes_20",
    name: "Virotes de Besta (20x)",
    category: "Arma",
    costQty: 1,
    costCoin: "po",
    weightKg: 0.75,
  },
  {
    id: "item_incenso_familiar",
    name: "Insumos p/ Invocar Familiar",
    category: "Ferramenta",
    costQty: 10,
    costCoin: "po",
    weightKg: 0.2,
  },
  {
    id: "item_pergaminho_1",
    name: "Pergaminho de Escudo Arcano",
    category: "Ferramenta",
    costQty: 50,
    costCoin: "po",
    weightKg: 0.1,
  },
  {
    id: "item_racoes",
    name: "Rações de Viagem (5 dias)",
    category: "Aventura",
    costQty: 25,
    costCoin: "pp",
    weightKg: 5.0,
  },
];

const RULES_DB = {
  abilities: {
    str: { name: "Força", short: "FOR" },
    dex: { name: "Destreza", short: "DES" },
    con: { name: "Constituição", short: "CON" },
    int: { name: "Inteligência", short: "INT" },
    wis: { name: "Sabedoria", short: "SAB" },
    cha: { name: "Carisma", short: "CAR" },
  },
  skills: [
    {
      id: "acrobacia",
      name2014: "Acrobacia",
      name2024: "Acrobacia",
      ability: "dex",
      referenceBonus: 2,
    },
    {
      id: "arcanismo",
      name2014: "Arcanismo",
      name2024: "Arcanismo",
      ability: "int",
      referenceBonus: 6,
    },
    {
      id: "atletismo",
      name2014: "Atletismo",
      name2024: "Atletismo",
      ability: "str",
      referenceBonus: 1,
    },
    {
      id: "atuacao",
      name2014: "Atuação",
      name2024: "Atuação",
      ability: "cha",
      referenceBonus: 5,
    },
    {
      id: "enganacao",
      name2014: "Blefar",
      name2024: "Enganação",
      ability: "cha",
      referenceBonus: 5,
    },
    {
      id: "furtividade",
      name2014: "Furtividade",
      name2024: "Furtividade",
      ability: "dex",
      referenceBonus: 1,
    },
    {
      id: "historia",
      name2014: "História",
      name2024: "História",
      ability: "int",
      referenceBonus: 6,
    },
    {
      id: "intimidacao",
      name2014: "Intimidação",
      name2024: "Intimidação",
      ability: "cha",
      referenceBonus: 5,
    },
    {
      id: "intuicao",
      name2014: "Intuição",
      name2024: "Intuição",
      ability: "wis",
      referenceBonus: 5,
    },
    {
      id: "investigacao",
      name2014: "Investigação",
      name2024: "Investigação",
      ability: "int",
      referenceBonus: 1,
    },
    {
      id: "lidar_animais",
      name2014: "Lidar com Animais",
      name2024: "Lidar com Animais",
      ability: "wis",
      referenceBonus: 2,
    },
    {
      id: "medicina",
      name2014: "Medicina",
      name2024: "Medicina",
      ability: "wis",
      referenceBonus: 2,
    },
    {
      id: "natureza",
      name2014: "Natureza",
      name2024: "Natureza",
      ability: "int",
      referenceBonus: 4,
    },
    {
      id: "percepcao",
      name2014: "Percepção",
      name2024: "Percepção",
      ability: "wis",
      referenceBonus: 6,
    },
    {
      id: "persuasao",
      name2014: "Persuasão",
      name2024: "Persuasão",
      ability: "cha",
      referenceBonus: 5,
    },
    {
      id: "prestidigitacao",
      name2014: "Prestidigitação",
      name2024: "Prestidigitação",
      ability: "dex",
      referenceBonus: 1,
    },
    {
      id: "religiao",
      name2014: "Religião",
      name2024: "Religião",
      ability: "int",
      referenceBonus: 1,
    },
    {
      id: "sobrevivencia",
      name2014: "Sobrevivência",
      name2024: "Sobrevivência",
      ability: "wis",
      referenceBonus: 2,
    },
  ],
  classes: {},
};
const CLASS_BADGE_STYLES = { feiticeiro:'badge-feiticeiro', bruxo:'badge-bruxo', guerreiro:'badge-cortante', barbaro:'badge-fogo', bardo:'badge-energia', druida:'badge-utilidade', clerigo:'badge-utilidade', ladino:'badge-cortante', mago:'badge-frio', paladino:'badge-feiticeiro', monge:'badge-cortante', patrulheiro:'badge-utilidade' };
for (const [id, cls] of Object.entries(PHB_DATA.classes)) {
  RULES_DB.classes[id] = { name: cls.name, hitDie: cls.die,
    fixedHp: cls.die / 2 + 1,
    spellAbility: cls.ability || (id === 'ladino' || id === 'guerreiro' ? 'int' : null),
    badgeColor: CLASS_BADGE_STYLES[id] };
}



// =========================================================================
// 4. ESTADO GLOBAL + 3 MODOS DE DADOS + POOL COMBINADO (1d20 + 1d4...)
// =========================================================================
let characters = sheetStore.read();
// O ID continua válido mesmo quando a ordem das fichas muda.
const rememberedCharacterId = readPreference(ACTIVE_CHARACTER_KEY);
let activeCharIndex = Math.max(0, characters.findIndex(char => char.id === rememberedCharacterId));
let currentTab = "main";
let currentTheme =
  readPreference("dnd_sheet_theme") || "pergaminho_claro";
let currentBackdrop = readPreference("dnd_backdrop_style") === "textured" ? "textured" : "clean";
let currentFontScale = parseInt(
  readPreference("dnd_font_scale") || "100",
  10,
);
// Uma única apresentação: cartões compactos, sem o seletor de densidade.

// Os 3 modos de dado pedidos: 'off' | 'manual' (só bandeja/pool) | 'auto' (bandeja + cliques na ficha)
let diceMode = readPreference("dnd_dice_mode") || "auto";
let currentRollMode = "normal"; // 'normal' | 'adv' | 'dis'
let diceRollSequence = 0; // Impede uma animação antiga de sobrescrever o último lançamento.
let pendingD20Roll = null;
const pendingResolvedD20 = new WeakMap();
// Migra somente a preferência visual antiga; fichas e resultados não mudam.
let diceTrayDimensions = readDiceTrayDimensions();
let diceTrayMinimized = true;
let diceDock;
// Pool combinado de dados: ex: { 20: 1, 4: 1 } = 1d20 + 1d4
let dicePoolCounts = { 20: 1, 4: 1 };

let spellFilterClass = "all";
let collapsedPanels = {};
let expandedSingleSpells = {};
let selectedCastLevelBySpell = {};
let twinnedActiveBySpell = { "Mísseis Mágicos": true };
let homebrewInitialState = "";
let bookTooltipTimer;
let weaponEditor = null; // Instância compartilhada com a revisão da importação.
const COIN_LABELS = { pc: "Cobre", pp: "Prata", pe: "Electro", po: "Ouro", pl: "Platina" };
const LORE_LABELS = { traits: "Personalidade", ideals: "Ideais", bonds: "Ligações", flaws: "Defeitos", backstory: "História do personagem", appearance: "Aparência", allies: "Aliados", treasure: "Tesouros narrativos" };
const PHYSICAL_LABELS = { age: "Idade", height: "Altura", weight: "Peso", eyes: "Olhos", skin: "Pele", hair: "Cabelo" };

// Histórico pessoal persistido separadamente; preferências visuais não são passos.
function historySnapshot() {
  return getChar()?characterSnapshot(getChar()):'[]';
}
function historyComparable(value) {
  return characterHistoryComparable(value);
}
let historyStack = [
  {
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    action: "Marco Zero (Abriu a Ficha na Sessão)",
    isCheckpoint: true,
    stateJson: historySnapshot(),
  },
];
let historyPointer = 0;
let historyWritable = true;
let historyOwnerId = null;
function restoreSavedHistory() {
  historyWritable = true;
  const char=getChar();historyOwnerId=char?.id || null;historyPointer=0;
  historyStack=char?[{timestamp:new Date().toISOString(),action:'Marco inicial desta ficha',isCheckpoint:true,stateJson:historySnapshot()}]:[];
  if(!char) return;
  let raw=readPreference(historyKey(char.id));
  if(raw===null) {
    const port=workspaceStorage(()=>localStorage);let legacy;
    try { legacy=port.getItem('dnd_history_v1'); } catch { historyWritable=false;return; }
    if(legacy) try { migrateCharacterHistories(port);raw=port.getItem(historyKey(char.id)); }
    catch {
      try { const h=splitLegacyHistory(legacy).get(char.id);if(h) raw=JSON.stringify(h); }
      catch { showToast('O histórico antigo foi preservado; não foi possível separar seus passos.'); }
    }
  }
  if (!raw) return;
  try {
    const saved = validateCharacterHistory(raw,char.id);
    const current = saved.stack[saved.pointer];
    historyStack = saved.stack.filter((item) => !/^Alternou layout para /.test(item.action));
    historyPointer = historyStack.indexOf(current);
    if (historyPointer < 0) historyPointer = Math.min(saved.pointer, historyStack.length - 1);
    if (!historyStack.length || historyComparable(historyStack[historyPointer].stateJson) !== historyComparable(historySnapshot())) {
      historyStack.push({ timestamp: new Date().toISOString(), action: 'Estado mais recente carregado', isCheckpoint: true, stateJson: historySnapshot() });
      historyPointer = historyStack.length - 1;
    }
    // Históricos de versões anteriores também recebem o teto ao abrir a ficha.
    persistHistory();
  } catch {
    historyWritable = false;
    showToast('O histórico desta ficha não pôde ser lido. O original foi preservado; novos passos ficam só nesta aba.');
  }
}
function persistHistory() {
  if(!getChar() || historyOwnerId!==getChar().id) return;
  const bounded=boundedCharacterHistory({version:2,characterId:historyOwnerId,stack:historyStack,pointer:historyPointer});
  // O teto vale na memória mesmo se a escrita falhar ou o original for ilegível.
  historyStack=bounded.stack;historyPointer=bounded.pointer;
  if (!historyWritable) { showToast('O histórico anterior está ilegível e foi preservado. Baixe um backup antes de fechar.'); return; }
  if (!writePreference(historyKey(historyOwnerId),JSON.stringify(bounded))) showToast('O histórico não pôde ser salvo. Baixe um backup antes de fechar.');
}

const COIN_RATES_IN_PC = { pc: 1, pp: 10, pe: 50, po: 100, pl: 1000 };

// Codificação para texto/atributos HTML. Eventos novos usam índices numéricos,
// sem interpolar nomes ou descrições do usuário em código JavaScript.
function escapeHTML(value) {
  return readableText(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function confirmDestructiveAction(title, message, label = "Excluir", extra = null, options = {}) {
  const dialog = document.getElementById("confirmationDialog");
  if (dialog.open) return Promise.resolve(false);
  document.getElementById("confirmationTitle").textContent = title;
  document.getElementById("confirmationMessage").textContent = message;
  document.getElementById("confirmationAccept").textContent = label;
  dialog.querySelector('button[value="cancel"]').textContent = options.cancelLabel || 'Cancelar';
  const extraHost = document.getElementById("confirmationExtra");
  extraHost.replaceChildren();
  extraHost.hidden = !extra;
  if (extra) extraHost.append(extra);
  dialog.returnValue = "cancel";
  return new Promise((resolve) => {
    dialog.addEventListener("close", () => {
      extraHost.replaceChildren();
      extraHost.hidden = true;
      resolve(dialog.returnValue === "confirm");
    }, { once: true });
    dialog.showModal();
  });
}

function getChar() {
  return characters[activeCharIndex];
}

function loadHistoryState(index) {
  const current=getChar();if(!current || current.id!==historyOwnerId) return;
  const [saved]=JSON.parse(historyStack[index].stateJson);
  if(saved?.id!==current.id) return;
  // Desfazer só substitui a ficha ativa; identidade do perfil e exibição seguem atuais.
  characters[activeCharIndex]={...saved,preferredLayout:current.preferredLayout,playerName:current.playerName};
}

// Cálculos usados pelos três painéis e pelo cabeçalho da ficha.
function getMod(score) {
  // Arredondar para baixo também nos resultados negativos (9 resulta em -1).
  return Math.floor((score - 10) / 2);
}

function fmtMod(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function getTotalLevel(char) {
  return char.classes.reduce((total, cls) => total + cls.level, 0);
}

function getProfBonus(char) {
  // Em multiclasse, a proficiência usa o nível total do personagem.
  return 2 + Math.floor((getTotalLevel(char) - 1) / 4);
}

function getCantripDiceCount(char) {
  // Livro: truques aumentam nos níveis totais 5, 11 e 17, inclusive em multiclasse.
  const level = getTotalLevel(char);
  return level >= 17 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1;
}

function getSpellcastingStats(char, classId, spell = null) {
  const cls = char.classes.find(c => c.classId === classId);
  if (!spell?.castingAbility && ['guerreiro', 'ladino'].includes(classId) && !PHB_DATA.classes[classId].subclasses[cls?.subclassId]?.casting) return null;
  const ability = spell?.castingAbility || RULES_DB.classes[classId]?.spellAbility;
  if (!ability || !char.abilities[ability]) return null;
  const modifier = getMod(char.abilities[ability].score);
  const adjust=key=>Number.isInteger(spell?.[key])&&Math.abs(spell[key])<=100?spell[key]:0;
  return { ability, modifier, attack: getProfBonus(char) + modifier + adjust('attackAdjustment'), dc: 8 + getProfBonus(char) + modifier + adjust('dcAdjustment') };
}

function getSpellcastingHeader(char) {
  return [...new Set(char.spells.map((spell) => spell.classId))].map((classId) => {
    const stats = getSpellcastingStats(char, classId);
    return stats ? `${escapeHTML(RULES_DB.classes[classId].name)}: CD ${stats.dc} · ataque ${fmtMod(stats.attack)}` : "";
  }).filter(Boolean).join(" • ");
}

function getMageArmorAC(char) {
  // Livro, Armadura Arcana: 13 + DES é uma fórmula alternativa, não um bônus.
  return 13 + getMod(char.abilities.dex.score) + (char.shieldEquipped ? 2 : 0);
}

function resolveSpellMeta(spell) {
  const catalog = CharacterEngine.spell?.(spell?.bookId || spell?.name);
  const catalogMeta = CharacterEngine.spellMeta?.(catalog || spell) || {};
  const automatic=catalog && !spell.customSpell && !spell.customRoll;
  // Cópias antigas dessas curas guardaram "utilidade". Corrige só a leitura
  // automática reconhecida, sem regravar escolhas ou fórmulas personalizadas.
  const oldFixedHealing=automatic && spell.dmgType==='utilidade' && ['cura-completa','cura-completa-em-massa'].includes(catalog.id);
  const oldInvocationSpell=automatic && (catalog.id==='vitalidade-falsa' && spell.dmgType==='cura' || catalog.id==='rogar-maldicao' && spell.dmgType==='necrotico');
  const dmgType = automatic && catalogMeta.damageComponents ? 'misto' : oldFixedHealing ? 'cura' : oldInvocationSpell ? catalogMeta.dmgType : spell?.dmgType && spell.dmgType !== "livro" ? spell.dmgType : (catalogMeta.dmgType || "utilidade");
  const targetType = automatic && catalog.id==='raio-solar' && spell.range===catalog.range ? catalogMeta.targetType : spell?.targetType || catalogMeta.targetType || null;
  const defType = spell?.defType && spell.defType !== "nenhuma" ? spell.defType : (catalogMeta.defType || "nenhuma");
  const canTwin = spell?.canTwin !== undefined && spell?.dmgType && spell.dmgType !== "livro" ? !!spell.canTwin : !!(spell?.canTwin || catalogMeta.canTwin);
  const effectSummary = spell?.effectSummary && spell.effectSummary !== "Consultar descrição" && (!catalog || spell.effectSummary !== catalog.duration)
    ? spell.effectSummary
    : (catalogMeta.effectSummary || spell?.effectSummary || "Consultar descrição");
  return { dmgType, targetType, defType, canTwin, effectSummary, diceFormula: catalogMeta.diceFormula || null };
}

function getSpellDefenseMeta(char, spell) {
  const meta = resolveSpellMeta(spell);
  const stats = getSpellcastingStats(char, spell.classId, spell);
  if (meta.defType === "atq_magico") return stats ? { icon: "crosshair", label: `Ataque ${fmtMod(stats.attack)} contra CA` } : null;
  if (meta.defType?.startsWith("tr_")) {
    const key = meta.defType.slice(3);
    const ability = RULES_DB.abilities[({ for: "str", des: "dex", con: "con", int: "int", sab: "wis", car: "cha" })[key] || key];
    return stats && ability ? { icon: "shield-alert", label: `Resistência de ${ability.short} · CD ${stats.dc}` } : null;
  }
  return DEFENSE_TYPES_META[meta.defType] || null;
}

function getSpellNotes(char, spell) {
  if(spell.customSpell)return spell.notes || '';
  // Fichas antigas podem conter uma fotografia da CA nas notas. Atualiza apenas
  // esse trecho conhecido na exibição, preservando o texto armazenado do usuário.
  if (spell.name === "Armadura Arcana") return String(spell.notes || "").replace(/\(CA\s+\d+\)/gi, `(CA ${getMageArmorAC(char)})`);
  const dice = getCantripDiceCount(char);
  const knownNotes = {
    "Rajada Mística": ["2 feixes de 1d10 de dano de energia", `${dice} feixe(s) de 1d10 de dano de energia`],
    "Raio de Fogo": ["2d10 de dano de fogo", `${dice}d10 de dano de fogo`],
    "Raio de Gelo": ["2d8 de frio e reduz deslocamento em 3m", `${dice}d8 de frio e reduz deslocamento em 3m`],
    "Toque Arrepiante": ["2d8 necrótico e impede alvo de curar PV", `${dice}d8 necrótico e impede alvo de curar PV`],
  };
  const known = knownNotes[spell.name];
  if (known && spell.notes === known[0]) return known[1];
  return spell.notes || "";
}

function getSkillBonus(char, skill) {
  return skillBonus(char,skill);
}

function getCalculatedAC(char) {
  return armorClass(char,CharacterEngine).total;
}
function getArmorExplanation(char) {
  // A origem do valor legado fica explícita, sem inventar equipamento
  // ou alterar atributos para coincidir com uma CA esperada.
  return armorClass(char,CharacterEngine).explanation;
}

function getCurrentLoadKg(char) {
  // O livro local usa cerca de 10 g por moeda, independentemente do metal.
  return char.inventoryItems.reduce(
    (total, item) => total + item.qty * item.weightKg,
    0,
  ) + Object.values(char.coins).reduce((total, count) => total + Number(count), 0) * .01;
}

function recordStepAndSave(
  actionDescription,
  isManualCheckpoint = false,
  redraw = true,
) {
  if(historyOwnerId!==(getChar()?.id || null)) restoreSavedHistory();
  if(!getChar()) { saveStateQuiet();return; }
  // Uma edição após desfazer abre um novo caminho e descarta o antigo refazer.
  if (historyPointer < historyStack.length - 1) {
    historyStack = historyStack.slice(0, historyPointer + 1);
  }
  historyStack.push({
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    action: actionDescription,
    isCheckpoint: isManualCheckpoint,
    stateJson: historySnapshot(),
  });
  historyPointer = historyStack.length - 1;
  if (!sheetStore.write(characters)) showToast(sheetStore.issue?.message || "Não foi possível salvar. Baixe um backup antes de fechar.");
  persistHistory();
  // Um custo já pago durante a escolha de um dado precisa sobreviver a
  // cancelamento/reload sem desmontar o formulário que receberá o resultado.
  if(redraw)renderAll();else refreshHistoryControls();
}

function refreshHistoryControls() {
  document.getElementById('btnUndo').disabled=historyPointer<=0;
  document.getElementById('btnRedo').disabled=historyPointer>=historyStack.length-1;
  document.getElementById('historyCountBadge').textContent=`${historyPointer}/${Math.max(0,historyStack.length-1)}`;
  renderHistoryDrawerList();
}

function saveStateQuiet() {
  if (!sheetStore.write(characters)) showToast(sheetStore.issue?.message || "Não foi possível salvar. Baixe um backup antes de fechar.");
  persistHistory();
  renderAll();
}

function undoStep() {
  if(!requireSheetEdit())return;
  if(document.querySelector('#sheetViewport .sheet-inline-editor')){showToast('Conclua ou feche a edição aberta antes de usar o histórico.');return;}
  if (historyPointer <= 0) {
    showToast("Você já está no primeiro registro disponível desta ficha.");
    return;
  }
  historyPointer -= 1;
  loadHistoryState(historyPointer);
  saveStateQuiet();
  showToast(`↩ Desfez: "${historyStack[historyPointer].action}"`);
}

function redoStep() {
  if(!requireSheetEdit())return;
  if(document.querySelector('#sheetViewport .sheet-inline-editor')){showToast('Conclua ou feche a edição aberta antes de usar o histórico.');return;}
  if (historyPointer >= historyStack.length - 1) return;
  historyPointer += 1;
  loadHistoryState(historyPointer);
  saveStateQuiet();
  showToast(`↪ Refez: "${historyStack[historyPointer].action}"`);
}

function jumpToHistoryStep(index) {
  if (index < 0 || index >= historyStack.length) return;
  historyPointer = index;
  loadHistoryState(historyPointer);
  saveStateQuiet();
  showToast(
    `🕒 Voltou para o passo #${index}: "${historyStack[historyPointer].action}"`,
  );
}

function saveNamedCheckpoint() {
  const label = prompt(
    "Nome do Save / Checkpoint:",
    `Save (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
  );
  if (!label) return;
  recordStepAndSave(`💾 CHECKPOINT: ${label}`, true);
  showToast(`💾 Checkpoint "${label}" salvo!`);
}

async function restoreToSessionStart() {
  if(!requireSheetEdit())return;
  if(document.querySelector('#sheetViewport .sheet-inline-editor')){showToast('Conclua ou feche a edição aberta antes de usar o histórico.');return;}
  const ownId=getChar()?.id;if(!ownId) return;
  if (!await confirmDestructiveAction("Voltar ao início disponível?", "Somente esta ficha voltará ao primeiro registro ainda disponível no histórico local. As outras fichas e as anotações pessoais serão preservadas.", "Voltar ao início disponível")) return;
  if(getChar()?.id!==ownId) return;
  jumpToHistoryStep(0);
}



function toggleHistoryDrawer() {
  document
    .getElementById("historyDrawer")
    .classList.toggle("translate-x-full");
  renderHistoryDrawerList();
}

function renderHistoryDrawerList() {
  const listEl = document.getElementById("historyTimelineList");
  if (!listEl) return;
  document.getElementById('historyCharacterName').textContent=getChar()?`${getChar().name} · até ${HISTORY_MAX_STEPS} registros locais`:'Abra uma ficha';
  listEl.innerHTML = historyStack
    .map((item, idx) => {
      const isCurrent = idx === historyPointer;
      return `
    <div onclick="jumpToHistoryStep(${idx})" class="p-2.5 rounded-lg border cursor-pointer transition flex items-center justify-between gap-2 ${isCurrent ? "t-btn-primary font-extrabold shadow" : item.isCheckpoint ? "badge-feiticeiro font-semibold" : "t-inset t-hover"}">
      <div>
        <div class="flex items-center gap-1.5">
          <span class="text-[10px] opacity-75">#${idx} • ${escapeHTML(item.timestamp)}</span>
          ${isCurrent ? '<span class="px-1.5 py-0.2 bg-black/20 rounded text-[9px] uppercase">Atual</span>' : ""}
        </div>
        <div class="mt-0.5">${escapeHTML(item.action)}</div>
      </div>
      <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 shrink-0 opacity-70"></i>
    </div>
  `;
    })
    .reverse()
    .join("");
  renderDeletedHistories();
  if (window.lucide) window.lucide.createIcons();
}

let deletedHistories=[];
function renderDeletedHistories() {
  const host=document.getElementById('deletedCharacterHistories');if(!host) return;
  deletedHistories=[];
  try {
    const scope=currentWorkspaceKey(),port=workspaceStorage(()=>localStorage);
    for(const key of Object.keys(localStorage).filter(k=>k.startsWith(scope)).map(k=>k.slice(scope.length)).filter(isCharacterHistoryKey)) {
      const id=key.slice(HISTORY_PREFIX.length);if(characters.some(c=>c.id===id)) continue;
      try { const h=validateCharacterHistory(port.getItem(key),id),[c]=JSON.parse(h.stack[h.pointer].stateJson);deletedHistories.push(c); } catch { /* Arquivos ilegíveis permanecem intactos. */ }
    }
  } catch { /* Armazenamento bloqueado não impede a ficha em memória. */ }
  host.hidden=!deletedHistories.length;
  host.innerHTML=deletedHistories.length?`<summary>Fichas excluídas (${deletedHistories.length})</summary>${deletedHistories.map((c,i)=>`<button type="button" onclick="restoreDeletedCharacter(${i})" class="block underline py-1">Restaurar ${escapeHTML(c.name)}</button>`).join('')}`:'';
}
function restoreDeletedCharacter(index) {
  const recovered=deletedHistories[index];if(!recovered || characters.some(c=>c.id===recovered.id)) return;
  const c=structuredClone(recovered),profile=readPreference('dnd_public_player_name');if(profile!==null) c.playerName=profile;
  const next=[...characters,c];if(!sheetStore.write(next)) return showToast('Não foi possível restaurar. O histórico foi preservado.');
  characters=next;activeCharIndex=characters.length-1;restoreSavedHistory();
  recordStepAndSave('Restaurou ficha excluída',true);renderAccountCharactersList();
}

// =========================================================================
// 5. MOTOR DOS 3 MODOS DE DADOS & POOL COMBINADO (1d20 + 1d4 + Bônus)
// =========================================================================
function setDiceMode(mode) {
  if(mode!==diceMode)clearPendingD20();
  diceMode = mode;
  writePreference("dnd_dice_mode", mode);
  renderAll();
  const labels = {
    off: "Dados Desativados (Modo Dados Físicos na Mesa).",
    manual:
      "Modo Só Pool: monte seus dados na bandeja. Ataques e conjurações dos cartões não são executados.",
    auto: "Modo Auto + Ficha: Clicar em perícias, ataques e magias rola os dados automaticamente!",
  };
  showToast(labels[mode]);
}

function setRollMode(mode) {
  if (!["normal", "adv", "dis"].includes(mode)) return;
  currentRollMode = mode;
  updatePoolDisplay();
}

function readDiceTrayDimensions() {
  try {
    const size = JSON.parse(readPreference("dnd_dice_tray_dimensions"));
    if (Number.isFinite(size?.width) && size.width > 0 && (size.height === null || Number.isFinite(size.height) && size.height > 0)) return size;
  } catch { /* Preferência inválida usa o tamanho padrão, sem apagar fichas. */ }
  return { width: readPreference("dnd_dice_tray_size") === "wide" ? 640 : 460, height: null };
}
function boundDiceTrayDimensions(size) {
  return {
    width: Math.min(Math.max(280, size.width), (window.innerWidth || 1024) - 32),
    height: size.height === null ? null : Math.min(Math.max(180, size.height), (window.innerHeight || 768) - 32),
  };
}
function setDiceTrayDimensions(width, height) {
  if (!Number.isFinite(width) || width <= 0 || height !== null && (!Number.isFinite(height) || height <= 0)) return;
  diceTrayDimensions = boundDiceTrayDimensions({width, height});
  writePreference("dnd_dice_tray_dimensions", JSON.stringify(diceTrayDimensions));
  renderDiceTrayState();
}
function toggleDiceTrayMinimized() {
  diceDock.transition(() => {
    diceTrayMinimized = !diceTrayMinimized;
    renderDiceTrayState();
  });
  document.getElementById(diceTrayMinimized ? "diceDock" : "diceTrayMinimizeButton").focus({preventScroll: true});
}
// A bandeja fica ancorada embaixo à esquerda: arrastar para cima/direita
// aumenta altura/largura, mantendo o último resultado e a montagem do pool.
function startDiceTrayResize(event) {
  if (event.button !== 0 || diceTrayMinimized) return;
  event.preventDefault();
  const handle = event.currentTarget, start = document.getElementById("dice3dTray").getBoundingClientRect();
  const x = event.clientX, y = event.clientY;
  handle.setPointerCapture(event.pointerId);
  document.body.classList.add("dice-tray-resizing");
  const move = e => {
    if (e.pointerId !== event.pointerId) return;
    diceTrayDimensions = boundDiceTrayDimensions({width: start.width + e.clientX - x, height: start.height + y - e.clientY});
    renderDiceTrayState();
  };
  const finish = e => {
    if (e.pointerId !== event.pointerId) return;
    handle.removeEventListener("pointermove", move);
    handle.removeEventListener("pointerup", finish);
    handle.removeEventListener("pointercancel", finish);
    handle.removeEventListener("lostpointercapture", finish);
    document.body.classList.remove("dice-tray-resizing");
    setDiceTrayDimensions(diceTrayDimensions.width, diceTrayDimensions.height);
  };
  handle.addEventListener("pointermove", move);
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) handle.addEventListener(type, finish);
}
function resizeDiceTrayByKeyboard(event) {
  if (diceTrayMinimized || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  const rect = document.getElementById("dice3dTray").getBoundingClientRect();
  setDiceTrayDimensions(rect.width + (event.key === "ArrowRight" ? 20 : event.key === "ArrowLeft" ? -20 : 0), rect.height + (event.key === "ArrowUp" ? 20 : event.key === "ArrowDown" ? -20 : 0));
}
function renderDiceTrayState() {
  const tray = document.getElementById("dice3dTray");
  if (!tray) return;
  const dimensions = boundDiceTrayDimensions(diceTrayDimensions);
  tray.style.setProperty("--tray-width", `${dimensions.width}px`);
  tray.style.setProperty("--tray-height", dimensions.height === null ? "auto" : `${dimensions.height}px`);
  tray.dataset.minimized = String(diceTrayMinimized);
  const body = document.getElementById("diceTrayBody");
  if (body) body.hidden = diceTrayMinimized;
  const minimizeButton = document.getElementById("diceTrayMinimizeButton");
  if (minimizeButton) {
    minimizeButton.textContent = diceTrayMinimized ? "↗" : "−";
    minimizeButton.setAttribute("aria-label", diceTrayMinimized ? "Abrir bandeja de dados" : "Minimizar bandeja de dados");
    minimizeButton.title = diceTrayMinimized ? "Abrir bandeja de dados" : "Minimizar bandeja de dados";
    minimizeButton.setAttribute("aria-expanded", String(!diceTrayMinimized));
  }
  document.getElementById("diceDock").hidden = !diceTrayMinimized;
  document.getElementById("diceDock").setAttribute("aria-expanded", String(!diceTrayMinimized));
  diceDock?.reflow();
}

function addDieToPool(sides) {
  dicePoolCounts[sides] = (dicePoolCounts[sides] || 0) + 1;
  updatePoolDisplay();
}

function clearDicePool() {
  // Exceção solicitada: limpar esta montagem transitória não exclui dados da ficha.
  dicePoolCounts = {};
  const modEl = document.getElementById("dicePoolModInput");
  if (modEl) modEl.value = 0;
  updatePoolDisplay();
}

function updatePoolDisplay() {
  const disp = document.getElementById("dicePoolDisplay");
  if (!disp) return;
  const parts = [];
  [20, 12, 10, 8, 6, 4, 100].forEach((s) => {
    if (dicePoolCounts[s] > 0) {
      if (
        s === 20 &&
        currentRollMode !== "normal"
      ) {
        parts.push(
          `d20 (${currentRollMode === "adv" ? "vantagem" : "desvantagem"})`,
        );
        if (dicePoolCounts[s] > 1) parts.push(`${dicePoolCounts[s] - 1}d20 extra`);
      } else {
        parts.push(`${dicePoolCounts[s]}d${s}`);
      }
    }
  });
  const modVal = parseInt(
    document.getElementById("dicePoolModInput")?.value || "0",
    10,
  ) || 0;
  let formula=parts.join(' + ');
  if(modVal) formula+=parts.length?` ${modVal<0?'-':'+'} ${Math.abs(modVal)}`:String(modVal);
  disp.textContent = formula || 'Pool vazio (clique nos dados)';
  disp.title = disp.textContent;
  ["normal", "adv", "dis"].forEach(mode => {
    document.getElementById(`rollMode-${mode}`)?.setAttribute("aria-pressed", String(currentRollMode === mode));
  });
  updateDiceDockAppearance(currentRollMode);
  const hint = document.getElementById("dicePoolModeHint");
  if (hint) {
    hint.textContent = currentRollMode === "normal"
      ? "Normal: soma os dados e o modificador."
      : !(dicePoolCounts[20] > 0)
        ? "Sem d20 no pool: vantagem e desvantagem não alteram estes dados."
        : `${currentRollMode === "adv" ? "Vantagem: usa o maior" : "Desvantagem: usa o menor"} de dois d20. Outros dados não mudam.${dicePoolCounts[20] > 1 ? " Aplica-se só ao primeiro d20." : ""}`;
  }
}

function rollCurrentPool(customLabel = "", allowFixed = false, inspirationEligible = true, minimumZero = false, context = null) {
  const cube = document.getElementById("dice3dCube");
  const resultBox = document.getElementById("dice3dResultText");
  if (!cube || !resultBox) return;

  const entries = Object.entries(dicePoolCounts).filter(
    ([_, count]) => count > 0,
  );
  if (entries.length === 0 && !allowFixed) {
    showToast("Adicione pelo menos um dado no Pool (ex: +d20 e +d4)!");
    return;
  }

  const modVal = parseInt(
    document.getElementById("dicePoolModInput")?.value || "0",
    10,
  ) || 0;
  // Resolve tudo no clique. Trocar modo, limpar ou editar a bandeja durante a
  // animação só vale para o próximo lançamento, nunca para o que já foi feito.
  const c=getChar(),inspired=inspirationEligible && !!c && dicePoolCounts[20]===1 && c.heroicInspiration && c.ruleState?.inspirationReady;
  const mode=inspired?inspirationRollMode(c,currentRollMode):currentRollMode;
  let result = evaluateDicePool(dicePoolCounts, modVal, mode,c?sheetD20Rules(c,context,CharacterEngine):{});
  if(context?.spellComponents)result=spellDamageBreakdown(result,context.spellComponents);
  if(minimumZero)result.total=Math.max(0,result.total);
  if(inspired && consumeInspiration(c)) saveRuleStep('Usou inspiração no d20 · '+(customLabel || 'pool'));
  presentDiceResult(result, customLabel,context?{c,context}:null);
  if(canRerollHalfling(result) && diceTrayMinimized)showToast('Sortudo racial disponível: abra o dado para repetir um 1.');
  return result;
}
// Ações com resultado aplicado aos PV usam o mesmo motor/animação, sem alterar
// o pool manual. OFF sempre exige registrar a face do dado físico.
function ruleDiceSettings() { return {enabled:diceMode!=='off',automatic:diceMode==='auto',mode:currentRollMode,sequence:diceRollSequence}; }
function rollRuleDie(sides,label,mode='normal',context=null,repeatOne=false) {
  if(diceMode==='off') throw new Error('Dados virtuais desativados: registre o resultado do dado físico.');
  let result=evaluateDicePool({[sides]:1},0,mode,sheetD20Rules(getChar(),context,CharacterEngine));
  // Estes testes aplicam o resultado imediatamente aos PV/concentração. A
  // escolha é confirmada no diálogo antes da rolagem, nunca após a mutação.
  if(repeatOne && canRerollHalfling(result))result=rerollHalfling(result);
  presentDiceResult(result,label);return result.total;
}
async function resolveRuleD20(label,mode,context,options={}) {
  const c=getChar(),previous=pendingResolvedD20.get(c);
  const resumable=previous && previous.key===options.key && previous.snapshot===JSON.stringify(c);
  if(previous && !resumable)pendingResolvedD20.delete(c);
  if(!options.lucky && !options.askLucky && !resumable)return window.rollRuleDie(20,label,mode,context,!!options.repeatOne);
  if(diceMode==='off')throw new Error('Dados virtuais desativados: registre o resultado físico.');
  let result,snapshot;
  if(resumable) {result=previous.result;snapshot=previous.snapshot;}
  else {
    if(options.lucky)payLuckyPoint(c,CharacterEngine,label,!!options.inspired);
    else if(options.inspired && consumeInspiration(c))recordStepAndSave('Usou inspiração no d20 · '+label,true,false);
    snapshot=JSON.stringify(c);
    result=evaluateDicePool({20:1},0,mode,sheetD20Rules(c,context,CharacterEngine));
    if(options.repeatOne && canRerollHalfling(result))result=rerollHalfling(result);
    if(options.lucky) {
      result=addLuckyDie(result,options.opposed?null:evaluateDicePool({20:1},0,'normal').total);
      if(options.repeatOne && canRerollHalfling(result))result=rerollHalfling(result);
    }
    pendingResolvedD20.set(c,{key:options.key,snapshot,result,label});
  }
  if(resumable && options.repeatOne && canRerollHalfling(result)) {
    result=rerollHalfling(result);pendingResolvedD20.set(c,{key:options.key,snapshot,result,label});
  }
  presentDiceResult(result,label);
  if(!result.luck) {
    const decision=await askToUseLucky(result,label);
    if(!decision) {showToast('Teste pendente: retome para usar o mesmo d20. Nenhum ponto de Sortudo foi gasto.');return null;}
    if(getChar()!==c || JSON.stringify(c)!==snapshot) {pendingResolvedD20.delete(c);throw new Error('A ficha mudou; o teste antigo não foi aplicado.');}
    if(decision.use) {
      payLuckyPoint(c,CharacterEngine,label);
      snapshot=JSON.stringify(c);
      result=addLuckyDie(result,decision.opposed?null:evaluateDicePool({20:1},0,'normal').total);
      if(options.repeatOne && canRerollHalfling(result))result=rerollHalfling(result);
      pendingResolvedD20.set(c,{key:options.key,snapshot,result,label});
      presentDiceResult(result,label);
    }
  }
  const chosen=await chooseLuckyFace(result,label);
  if(!chosen) {showToast('Escolha de Sortudo pendente: retome este teste para usar os mesmos dados. O ponto já foi gasto.');return null;}
  if(getChar()!==c || JSON.stringify(c)!==snapshot) {
    pendingResolvedD20.delete(c);throw new Error('A ficha mudou. O teste antigo não foi aplicado; o ponto lançado continua gasto.');
  }
  pendingResolvedD20.delete(c);
  presentDiceResult(chosen,label,null,false);
  return chosen.d20Natural;
}
function pendingRuleD20Label() {
  const c=getChar(),pending=c && pendingResolvedD20.get(c);
  return pending && pending.snapshot===JSON.stringify(c)?pending.label:'';
}
// Dano contextual usa a bandeja/animação, preservando o pool manual e sem
// aplicar vantagem de d20 ou gastar inspiração em uma jogada de dano.
function rollWeaponFormula(formula,label) {
  if(diceMode==='off')throw new Error('Dados virtuais desativados: registre o resultado físico.');
  const parsed=parseDiceFormula(formula);if(!parsed)throw new Error('Fórmula de dano inválida; nenhum espaço foi gasto.');
  const result=evaluateDicePool(parsed.counts,parsed.modifier,'normal');
  result.total=Math.max(0,result.total);presentDiceResult(result,label);return result;
}
function rollQuickD20() {
  if (diceMode === "off") return;
  // Só o d20 usa o modo escolhido; pool, bônus e inspiração ficam preservados.
  presentDiceResult(evaluateDicePool({20: 1}, 0, currentRollMode), "d20 rápido");
}
function presentDiceResult(result, customLabel, rerollContext = null, animate = true) {
  const cube = document.getElementById("dice3dCube");
  const resultBox = document.getElementById("dice3dResultText");
  const rollSequence = ++diceRollSequence;
  pendingD20Roll = rerollContext && (canRerollHalfling(result) || luckyFaces(result).length || result.rules.luckyFeat && !result.luck && luckRemaining(rerollContext.c,CharacterEngine)>0)?{
    c:rerollContext.c,context:rerollContext.context,result,label:customLabel,sequence:rollSequence,busy:false,
    workspace:currentWorkspaceKey(),snapshot:JSON.stringify(rerollContext.c),
  }:null;
  if(animate)document.querySelector('[data-dice-context-actions]')?.remove();
  const display=() => {
    if (rollSequence !== diceRollSequence) return;
    cube.classList.remove("dice-3d-rolling");
    document.getElementById("diceDock").classList.remove("dice-dock-rolling");
    if(rerollContext && getChar()!==rerollContext.c)return;
    cube.textContent = result.total;
    diceDock?.result(result.total);
    const trayTotal = document.getElementById("diceTrayTotal");
    if (trayTotal) {
      trayTotal.textContent = result.total;
      trayTotal.title = `${customLabel ? `${customLabel} · ` : ""}Último total: ${result.total}`;
    }
    const isCrit = result.d20Natural === 20;
    const isFumble = result.d20Natural === 1 && !result.rules?.reliableTalent;
    const modeLabel = { normal: "Normal", adv: "Vantagem", dis: "Desvantagem" }[result.appliedMode];
    const pending=pendingD20Roll?.sequence===rollSequence?pendingD20Roll:null,faces=luckyFaces(result);

    resultBox.innerHTML = `
    ${customLabel ? `<div class="font-bold text-xs t-text-main">${escapeHTML(customLabel)}</div>` : ""}
    <div class="text-[11px] font-bold t-text-muted">${modeLabel}</div>
    <div class="text-xl font-extrabold t-text-main">
      Total: <span class="t-text-accent">${result.total}</span>
      ${isCrit ? '<span class="ml-1 px-1.5 py-0.5 rounded badge-fogo text-[10px]">20 NATURAL!</span>' : ""}
      ${isFumble ? '<span class="ml-1 px-1.5 py-0.5 rounded bg-rose-900 text-white text-[10px]">1 NATURAL!</span>' : ""}
    </div>
    <div class="text-[11px] t-text-muted leading-tight">${result.breakdown.join(" + ")}</div>
  `;
    const stage=resultBox.parentElement,previous=stage.querySelector('[data-dice-context-actions]');
    stage.classList.toggle('dice-result-with-actions',!!pending);
    if(!pending)previous?.remove();
    else {
      const selected=i=>!!result.luck && !result.luck.canceled && result.luck.selected===i;
      const faceLabel=(face,i)=>`${face}${i===faces.length-1?' +':''}${selected(i)?' ✓':''}`;
      if(!animate && faces.length && previous?.dataset.faces===faces.join(',')) {
        for(const button of previous.querySelectorAll('[data-dice-lucky-choice]')) {
          const i=Number(button.dataset.diceLuckyChoice);button.setAttribute('aria-pressed',String(selected(i)));button.textContent=faceLabel(faces[i],i);
        }
      }else {
        previous?.remove();
        const actions=document.createElement('div');actions.dataset.diceContextActions='';actions.dataset.faces=faces.join(',');
        actions.innerHTML=`
      ${canRerollHalfling(result)?'<button type="button" class="dice-context-action t-btn-primary px-2 py-1 rounded" data-dice-halfling-luck onclick="rerollHalflingD20()">Sortudo racial · repetir um 1</button>':''}
      ${result.rules.luckyFeat && !result.luck && luckRemaining(pending.c,CharacterEngine)>0?`<button type="button" class="dice-context-action t-btn-primary px-2 py-1 rounded" data-dice-lucky-feat onclick="useLuckyD20()">Sortudo (talento) · usar 1 ponto (${luckRemaining(pending.c,CharacterEngine)} disponíveis)</button>`:''}
      ${faces.length?`<div class="dice-context-choices" role="group" aria-label="Escolher d20 de Sortudo"><span>Sortudo · escolha o d20</span>${faces.map((face,i)=>`<button type="button" data-dice-lucky-choice="${i}" onclick="chooseLuckyD20(${i})" aria-pressed="${selected(i)}" ${i===faces.length-1?'title="D20 adicional de Sortudo"':''} aria-label="${i===faces.length-1?'D20 adicional de Sortudo':'D20 inicial'} ${i+1}, usar face ${face}">${faceLabel(face,i)}</button>`).join('')}</div>`:''}`;
        stage.append(actions);
      }
    }
  };
  if(animate) {
    cube.classList.add('dice-3d-rolling');document.getElementById('diceDock').classList.add('dice-dock-rolling');
    setTimeout(display,380);
  }else display();
}

function clearPendingD20() {
  pendingD20Roll=null;
  const actions=document.querySelector('[data-dice-context-actions]');
  actions?.parentElement.classList.remove('dice-result-with-actions');actions?.remove();
}
function validPendingD20(pending=pendingD20Roll,allowBusy=false) {
  if(!pending || pending!==pendingD20Roll || pending.busy && !allowBusy)return null;
  if(diceMode!=='auto' || pending.sequence!==diceRollSequence || currentWorkspaceKey()!==pending.workspace || getChar()!==pending.c || JSON.stringify(pending.c)!==pending.snapshot) {
    clearPendingD20();showToast('A ficha ou a jogada mudou. Sortudo não foi aplicado ao resultado antigo.');return null;
  }
  return pending;
}
function updateContextCritical(pending,result) {
  const weapon=pending.context.weapon;
  if(weapon) {
    const index=pending.c.weapons.indexOf(weapon),stats=CharacterEngine.weaponStats(pending.c,weapon);
    if(index>=0 && stats)setWeaponCriticalPrepared(pending.c,index,CharacterEngine,result.d20Natural>=(stats.critical || 20));
  }
}
function rerollHalflingD20() {
  const pending=validPendingD20();if(!pending)return;
  pendingD20Roll=null; // Um duplo clique nunca repete a nova face.
  const result=rerollHalfling(pending.result);
  updateContextCritical(pending,result);presentDiceResult(result,pending.label,pending);
}
async function useLuckyD20() {
  const pending=validPendingD20();if(!pending || pending.result.luck)return;
  pending.busy=true;
  try {
    const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
    controls.innerHTML='<label class="rule-check"><input type="checkbox" data-lucky-opposed><span>Outra criatura também usou Sortudo nesta jogada</span></label>';
    if(!await confirmDestructiveAction('Usar Sortudo?','Gasta 1 ponto para lançar um d20 adicional e escolher a face antes de resolver a jogada. O modo original continua valendo. Pontos de criaturas diferentes se cancelam sem dado adicional.','Gastar 1 ponto',controls))return;
    if(!validPendingD20(pending,true))return;
    payLuckyPoint(pending.c,CharacterEngine,pending.label);
    const result=addLuckyDie(pending.result,controls.querySelector('[data-lucky-opposed]').checked?null:evaluateDicePool({20:1},0,'normal').total);
    presentDiceResult(result,pending.label,pending);
    if(result.luck.canceled)showToast('Sortudos cancelados: ponto gasto, sem d20 adicional.');
  }catch(error){showToast(error.message || 'Não foi possível usar Sortudo.');}
  finally{pending.busy=false;}
}
function chooseLuckyD20(index) {
  const pending=validPendingD20();if(!pending)return;
  const result=chooseLuckyDie(pending.result,index);
  updateContextCritical(pending,result);presentDiceResult(result,pending.label,pending,false);
  document.querySelector(`[data-dice-lucky-choice="${index}"]`)?.focus({preventScroll:true});
}

// Disparo automático vindo da ficha (só executa se diceMode === 'auto'!)
function triggerSheetRoll(formula, label, inspirationEligible = false, context = null) {
  if(context?.type==='save' && automaticSaveFailure(getChar(),context.ability))return showToast('Falha automática nessa resistência de FOR/DES pela condição atual; não precisa rolar.');
  if(context?.type==='attack' && incapacityReason(getChar()))return showToast(incapacityReason(getChar())+': não pode realizar esse ataque.');
  if (diceMode !== "auto") {
    if (diceMode === "manual") {
      showToast(
        `Modo "Só Pool" ativo: monte seus dados na bandeja ou mude para "Auto Ficha" no topo.`,
      );
    }
    return;
  }

  const parsed = parseDiceFormula(formula);
  if (!parsed) {
    showToast("Fórmula inválida. Edite o ataque e use, por exemplo, 2d6+4 ou 1d8+1d6+3.");
    return;
  }

  dicePoolCounts = parsed.counts;
  const modEl = document.getElementById("dicePoolModInput");
  if (modEl) modEl.value = parsed.modifier;
  updatePoolDisplay();
  return rollCurrentPool(label, true, inspirationEligible,context?.type==='damage',context);
}

// =========================================================================
// 6. CONTA DE USUÁRIO & CRIADOR DE NOVO PERSONAGEM
// =========================================================================
function openAuthAccountModal(tab = 'characters') {
  renderAccountCharactersList();
  selectAccountTab(tab);
  document.getElementById("authAccountModal").classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}
function closeAuthAccountModal() {
  document.getElementById("authAccountModal").classList.add("hidden");
}

const workspaceDrafts = new Map();
function hasOpenAccountEditor() {
  if (document.getElementById('avatarDialog')?.open) return true;
  if (document.getElementById('confirmationDialog').open) return true;
  if (document.getElementById('accPlayerName').value !== (readPreference('dnd_public_player_name') || 'Jogador')) return true;
  return ['characterWizard', 'homebrewModal'].some(id => {
    const el = document.getElementById(id);
    return el && !el.hidden && !el.classList.contains('hidden');
  });
}
function activateAccountWorkspace(identity) {
  clearSheetPanels();
  // Um erro de quota não joga fora a ficha em memória ao trocar de conta.
  // Ela só poderá reaparecer ao voltar ao mesmo espaço, nesta aba.
  if (sheetStore.issue?.kind === 'write' || sheetStore.issue?.kind === 'unavailable') workspaceDrafts.set(currentWorkspaceKey(), characters);
  else workspaceDrafts.delete(currentWorkspaceKey());
  hideBookTooltip();
  const confirmation = document.getElementById('confirmationDialog');
  if (confirmation.open) confirmation.close('cancel');
  CharacterWizard.close(true);
  closeHomebrewModal(true);
  closeShopModal();
  document.getElementById('characterWizard')?.replaceChildren();
  document.getElementById('hbModalBody').replaceChildren();
  document.getElementById('historyDrawer').classList.add('translate-x-full');
  diceRollSequence++;
  clearPendingD20();
  document.getElementById('dice3dCube').classList.remove('dice-3d-rolling');
  document.getElementById('diceDock').classList.remove('dice-dock-rolling');
  clearDicePool();
  document.getElementById('dice3dResultText').textContent = '';
  document.getElementById('dice3dCube').textContent = '20';
  document.getElementById('diceTrayTotal').textContent = '—';
  diceTrayMinimized = true;
  selectCharacterWorkspace(identity);
  const saved = sheetStore.read();
  characters = workspaceDrafts.get(currentWorkspaceKey()) || saved;
  activeCharIndex = Math.max(0, characters.findIndex(char => char.id === readPreference(ACTIVE_CHARACTER_KEY)));
  historyStack = [{ timestamp: new Date().toLocaleTimeString(), action: 'Abriu este espaço de fichas', isCheckpoint: true, stateJson: JSON.stringify(characters) }];
  historyPointer = 0;
  restoreSavedHistory();
  currentTab = 'main';
  spellFilterClass = 'all';
  selectedCastLevelBySpell = {};
  twinnedActiveBySpell = {};
  expandedSingleSpells = {};
  const player = readPreference('dnd_public_player_name') || 'Jogador';
  document.getElementById('accPlayerName').value = player;
  document.getElementById('currentUserBadge').textContent = player;
  document.getElementById('backupIncludeNotes').checked = false;
  document.getElementById('backupStatus').textContent = '';
  restoreDisplayPreferences();
  renderAll();
  renderAccountCharactersList();
  window.dispatchEvent(new Event('dnd-workspace-changed'));
}

function saveAccountProfile(quiet = false) {
  const newName =
    document.getElementById("accPlayerName").value || "Jogador";
  if (!writePreference("dnd_public_player_name",newName)) {
    showToast('O nome não pôde ser salvo. O texto digitado foi mantido; confira o armazenamento.');
    return;
  }
  document.getElementById("currentUserBadge").textContent = newName;
  characters.forEach((c) => {
    c.playerName = newName;
  });
  saveStateQuiet();
  if (!quiet) showToast(`Nome salvo neste dispositivo. Confira o estado da sincronização no perfil.`);
}

function refreshSyncedWorkspace() {
  characters = sheetStore.read();
  activeCharIndex = Math.max(0, characters.findIndex(char => char.id === readPreference(ACTIVE_CHARACTER_KEY)));
  const player = readPreference('dnd_public_player_name') || 'Jogador';
  document.getElementById('accPlayerName').value = player;
  document.getElementById('currentUserBadge').textContent = player;
  restoreDisplayPreferences();
  restoreSavedHistory();
  renderAll(); renderAccountCharactersList();
}
function restoreDisplayPreferences() {
  currentTheme = readPreference('dnd_sheet_theme') || 'pergaminho_claro';
  currentBackdrop = readPreference('dnd_backdrop_style') === 'textured' ? 'textured' : 'clean';
  currentFontScale = parseInt(readPreference('dnd_font_scale') || '100', 10);
  diceMode = readPreference('dnd_dice_mode') || 'auto';
  diceTrayDimensions = readDiceTrayDimensions();

}
window.refreshSyncedWorkspace = refreshSyncedWorkspace;

function renderAccountCharactersList() {
  const container = document.getElementById("accountCharactersList");
  if (!container) return;
  container.innerHTML = characters
    .map((c, idx) => {
      const clsStr = c.classes
        .map((cl) => `${RULES_DB.classes[cl.classId]?.name} ${cl.level}`)
        .join(" | ");
      const isCurrent = idx === activeCharIndex;
      return `
    <div class="account-character t-inset p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2" data-account-character="${escapeHTML(c.id)}">
      <div class="account-character-person min-w-0 flex-1 flex items-center gap-2">
      <button type="button" class="portrait-edit account-character-avatar shrink-0" data-avatar-edit="${escapeHTML(c.id)}" aria-label="Alterar imagem de ${escapeHTML(c.name)}">${avatarMarkup(c.avatar)}</button>
      <div class="min-w-0">
        <div class="account-character-name font-rpg font-bold t-text-main break-words">${escapeHTML(c.name)} ${isCurrent ? '<span class="account-character-active px-1.5 py-0.5 rounded badge-utilidade text-[9px] ml-1">Ativo</span>' : ""}</div>
        <div class="account-character-meta t-text-muted"><span>${escapeHTML(c.race)}</span><span>${escapeHTML(clsStr)}</span><span>PV: ${c.hpCurrent}/${c.hpMax}</span></div>
      </div>
      </div>
      <div class="account-character-actions flex items-center justify-end gap-1.5 shrink-0">
        <button onclick="switchCharacter(${idx}); closeAuthAccountModal();" class="account-character-open t-btn-primary px-3 py-1 rounded-lg font-bold text-xs">Abrir Ficha</button>
        ${characters.length > 1 ? `<button onclick="deleteCharacter(${idx})" class="t-card px-2 py-1 rounded text-rose-500 font-bold" title="Excluir personagem" aria-label="Excluir ${escapeHTML(c.name)}">&times;</button>` : ""}
      </div>
    </div>
  `;
    })
    .join("");
  refreshAccountView();
}

async function deleteCharacter(idx) {
  if (characters.length <= 1 || !characters[idx]) return;
  const target=characters[idx],scope=currentWorkspaceKey();
  if (!await confirmDestructiveAction("Excluir personagem?", `A ficha de “${target.name}” será excluída. Você poderá restaurá-la em Fichas excluídas, na linha do tempo.`, "Excluir personagem")) return;
  if(scope!==currentWorkspaceKey() || !characters.includes(target)) return;
  // Guarde a última edição antes de excluir; outro personagem não recebe este passo.
  try {
    const key=historyKey(target.id),raw=readPreference(key);
    const h=raw?validateCharacterHistory(raw,target.id):{version:2,characterId:target.id,stack:[],pointer:0};
    const snapshot=characterSnapshot(target);
    if(!h.stack.length || historyComparable(h.stack[h.pointer].stateJson)!==historyComparable(snapshot)) { h.stack=h.stack.slice(0,h.pointer+1);h.stack.push({timestamp:new Date().toISOString(),action:'Último estado antes de excluir',isCheckpoint:true,stateJson:snapshot});h.pointer=h.stack.length-1; }
    if(!writePreference(key,JSON.stringify(h))) throw new Error();
  } catch { return showToast('Não foi possível preservar o histórico; a ficha continua aqui.'); }
  const activeId=getChar()?.id,next=characters.filter(c=>c.id!==target.id);
  if(!sheetStore.write(next)) return showToast('Não foi possível excluir; a ficha foi preservada.');
  characters=next;activeCharIndex=Math.max(0,characters.findIndex(c=>c.id===activeId));restoreSavedHistory();renderAll();
  renderAccountCharactersList();
}

function openNewCharacterModal() {
  if (sheetStore.issue?.kind === 'invalid') { openAuthAccountModal(); return; }
  CharacterWizard.openCreate();
}
function applyImportedCharacters(next, action = "Importou cópias de um backup") {
  characters = next;
  activeCharIndex = Math.max(0, characters.length - 1);
  recordStepAndSave(action, true);
  renderAccountCharactersList();
}
function closeNewCharacterModal() { return CharacterWizard.close(); }
function commitCreatedCharacter(char) {
  characters.push(char);
  activeCharIndex = characters.length - 1;
  spellFilterClass = "all";
  selectedCastLevelBySpell = {};
  twinnedActiveBySpell = {};
  recordStepAndSave(`Criou ${char.name} pelas escolhas do livro`, true);
  showToast(`Personagem ${char.name} criado!`);
}
function commitLeveledCharacter(char, action) {
  // Evolução é uma ação confirmada do jogo; o cadeado protege ajustes livres.
  if(!requireSheetEdit())return false;
  if(char.id!==getChar()?.id){showToast('A ficha selecionada mudou. Reabra a evolução na ficha desejada.');return false;}
  characters[activeCharIndex] = char;
  recordStepAndSave(action, true);
  showToast(action);
  return true;
}

// =========================================================================
// 7. RENDERIZADOR DE MAGIAS COM COLUNAS INDEPENDENTES (SEM BURACO!)
// =========================================================================
function standardSlotEntries(char) {
  // As chaves do backup também são dados não confiáveis. Só círculos de 1 a 9
  // viram controles; entradas desconhecidas continuam preservadas no armazenamento.
  return Object.entries(char.standardSlots).filter(([level]) => /^[1-9]$/.test(level));
}
function getSpellSlotOptions(char, spell) {
  if (spell.circle === 0 || spell.ritual || spell.limitedUse || spell.atWill) return [];
  const options = standardSlotEntries(char)
    .filter(([level, slot]) => Number(level) >= spell.circle && slot.total > 0)
    .map(([level, slot]) => ({ value: Number(level), level: Number(level), remaining: slot.total - slot.used, total: slot.total, source: "Conjuração" }));
  if (char.pactMagic.total > 0 && char.pactMagic.level >= spell.circle) {
    options.push({ value: "pact", level: char.pactMagic.level, remaining: char.pactMagic.total - char.pactMagic.used, total: char.pactMagic.total, source: "Pacto" });
  }
  const privilege=wizardPrivilege(char,spell,CharacterEngine);
  if (privilege) options.unshift(privilege);
  return options.sort((a, b) => a.level - b.level);
}

function getSelectedSpellCastLevel(char, spell, index) {
  if (spell.circle === 0 || spell.ritual || spell.limitedUse || spell.atWill) return innateCastLevel(char,spell,CharacterEngine);
  const options = getSpellSlotOptions(char, spell);
  const saved = selectedCastLevelBySpell[`${char.id}:${index}`];
  if (options.some((option) => option.value === saved)) return saved;
  // Livro, p. 166: as origens são intercambiáveis. A classe só define a
  // preferência inicial; esgotar um recurso nunca seleciona outro escondido.
  return (options.find(option=>['mastery','signature'].includes(option.value)) || (spell.classId === "bruxo" ? options.find((option) => option.value === "pact") : options.find((option) => option.value !== "pact")))?.value ?? options[0]?.value ?? null;
}

function renderSpellCastControls(char, spell, index) {
  const meta = resolveSpellMeta(spell);
  const attackStats=meta.defType==='atq_magico'?getSpellcastingStats(char,spell.classId,spell):null;
  const poolOnly=diceMode==='manual';
  const chosen = getSelectedSpellCastLevel(char, spell, index);
  const detail = getSpellEffectDetails(char, spell, index);
  const options = getSpellSlotOptions(char, spell);
  const selected = options.find((option) => option.value === chosen);
  const usesSlot = spell.circle > 0 && !spell.ritual && !spell.limitedUse && !spell.atWill;
  const unavailable = (usesSlot && (!selected || selected.remaining <= 0)) || (spell.limitedUse && (spell.usesUsed || 0) >= spell.limitedUse);
  const canNormal = canCastNormally(char,spell,CharacterEngine);
  return `
    ${detail.canTwin && characterHasTwinned(char) ? `<button type="button" onclick="toggleSpellTwinnedByIndex(${index})" class="spell-action-button spell-twin-control" aria-label="${detail.twin ? "Desativar" : "Ativar"} Magia Gêmea para ${escapeHTML(spell.name)}" aria-pressed="${detail.twin}">Gêmea (${escapeHTML(detail.cost ?? spell.circle)}pt)</button>` : ""}
    ${usesSlot && canNormal ? `<select data-spell-slot="${index}" aria-label="Espaço para ${escapeHTML(spell.name)}" onchange="setSpellCastLevelByIndex(${index}, this.value)" class="spell-slot-select">
      ${options.length ? options.map((option) => `<option value="${option.value}" ${option.value === chosen ? "selected" : ""}>${option.source} · ${option.level}º · ${Number.isFinite(option.remaining)?Math.max(0, option.remaining):'∞'}/${Number.isFinite(option.total)?option.total:'∞'}${option.remaining <= 0 ? " (esgotado)" : ""}</option>`).join("") : '<option value="">Sem espaços compatíveis</option>'}
    </select>` : ""}
    ${spell.limitedUse ? `<span class="text-[11px]">Usos: ${Math.max(0, spell.limitedUse - (spell.usesUsed || 0))}/${escapeHTML(spell.limitedUse)}</span>` : ''}
    ${canNormal && attackStats?`<button type="button" data-spell-attack="${index}" onclick="rollSpellAttack(${index})" ${diceMode!=='auto'?'disabled':''} class="spell-action-button badge-feiticeiro" aria-label="Ataque de ${escapeHTML(spell.name)} ${fmtMod(attackStats.attack)}" ${RuleTooltips.attributes('Ataque com magia',{text:`Role 1d20 ${fmtMod(attackStats.attack)} contra a CA do alvo em Auto Ficha. Usa o bônus da classe desta magia, com vantagem/desvantagem e inspiração quando preparadas. Só rola o ataque: use Conjurar/Truque para registrar o lançamento e gastar o espaço, mesmo se errar. ${detail.perRay?'Cada raio/feixe exige uma jogada de ataque separada; repetir este botão não gasta outro espaço.':''}`})}>Atq ${fmtMod(attackStats.attack)}</button>`:''}
    ${canNormal ? `<button data-cast-spell="${index}" onclick="castSpellByIndex(${index})" ${poolOnly || unavailable ? "disabled" : ""} class="spell-action-button spell-cast-button t-btn-primary" title="${poolOnly?'Só Pool: use a bandeja. Para conjurar pela ficha, escolha Auto Ficha ou OFF para dados físicos.':['mastery','signature'].includes(chosen) ? 'Usa a característica sem gastar espaço. Para aprimorar, escolha um espaço no seletor.' : usesSlot ? "Gasta apenas o espaço selecionado. Para trocar a origem, use o seletor." : "Não gasta espaços de magia."}">${spell.ritual ? "Ritual" : spell.circle === 0 ? "Truque" : unavailable ? "Esgotado" : "Conjurar"}</button>` : ''}
    ${canCastRitual(char, spell) ? `<button data-cast-ritual="${index}" onclick="castRitualByIndex(${index})" ${poolOnly?'disabled':''} class="spell-action-button spell-cast-button t-inset" title="${poolOnly?'Só Pool: conjuração pela ficha desativada.':'Acrescenta 10 minutos ao tempo de conjuração e não gasta espaço.'}">Ritual</button>` : ''}
    ${detail.perRay?`<button type="button" class="spell-action-button t-inset" data-spell-ray="${index}" onclick="rollSpellRay(${index})" ${diceMode!=='auto'?'disabled':''} ${RuleTooltips.attributes('Dano de um raio/feixe',{text:detail.explanation})}>Dano por raio</button>`:''}
  `;
}

function getSpellEffectDetails(char, spell, index, elementalAffinity=true) {
  const meta = resolveSpellMeta(spell);
  const chosen = getSelectedSpellCastLevel(char, spell, index);
  const level = getSpellSlotOptions(char,spell).find(option=>option.value===chosen)?.level ?? innateCastLevel(char,spell,CharacterEngine);
  const book = spell.customSpell ? null : BOOK_SPELLS_DB[spell.name];
  const canTwin=twinEligible(char,spell,level,CharacterEngine,meta.canTwin);
  const twin = !!twinnedActiveBySpell[spell.name] && canTwin && characterHasTwinned(char);
  const options={legacyFormula:book?.diceFormula?.(level,false,char,spell),legacySummary:book?.calcEffect?.(level,false,char,spell),canTwin:meta.canTwin,elementalAffinity};
  const base=resolveSpellEffect(char,spell,level,CharacterEngine,options);
  const resolved=twin?resolveSpellEffect(char,spell,level,CharacterEngine,{...options,twinned:true}):base;
  return {...resolved,base:base.summary,enhanced:twin?resolved.summary:null,twin,canTwin,level,cost:spell.circle === 0 ? 1 : level};
}
function rollSpellRay(index) {
  if(diceMode!=='auto')return;
  const spell=getChar().spells[index];if(!spell) return;
  const detail=getSpellEffectDetails(getChar(),spell,index,false);
  if(detail.perRay && detail.formula) triggerSheetRoll(detail.formula,`${spell.name} · dano de um raio/feixe que acertou (sem novo lançamento)`);
}
// O índice continua sendo o original da ficha, mesmo após filtrar por classe.
// Repetir ataques (raios/feixes, por exemplo) não conjura nem cobra outro espaço.
function rollSpellAttack(index) {
  if(diceMode!=='auto')return;
  const char=getChar(),spell=char.spells[index];
  if(!spell || resolveSpellMeta(spell).defType!=='atq_magico' || !canCastNormally(char,spell,CharacterEngine))return;
  const stats=getSpellcastingStats(char,spell.classId,spell);
  if(!stats || !Number.isFinite(stats.attack))return;
  return triggerSheetRoll(`1d20${fmtMod(stats.attack)}`,`Ataque: ${spell.name}`,true,{type:'attack'});
}

function renderSpellEffectDetails(char, spell, index) {
  const meta = resolveSpellMeta(spell);
  const detail = getSpellEffectDetails(char, spell, index);
  const damage = DAMAGE_TYPES_META[meta.dmgType] || DAMAGE_TYPES_META.utilidade;
  return `<span class="spell-effect-badge ${damage.cls || ""}" data-spell-effect="${index}" title="${escapeHTML(damage.label)}">
    <i data-lucide="${damage.icon}" class="w-3.5 h-3.5" aria-hidden="true"></i>
    ${escapeHTML(detail.twin ? detail.enhanced : detail.base)}
  </span>`;
}

function setSpellCastLevelByIndex(index, value) {
  const char = getChar();
  const spell = char.spells[index];
  const parsed = ["pact","mastery","signature"].includes(value) ? value : Number(value);
  if (!spell || !getSpellSlotOptions(char, spell).some((option) => option.value === parsed)) return;
  selectedCastLevelBySpell[`${char.id}:${index}`] = parsed;
  hideBookTooltip();
  renderAll();
}

function castSpellByIndex(index) {
  const spell = getChar().spells[index];
  if (spell) return castSpellWithUpcast(spell.name, spell.circle, spell.classId, index);
}
function canCastRitual(char, spell) {
  return canRitual(char,spell,CharacterEngine);
}
function castRitualByIndex(index, confirmedId = null) {
  if(diceMode==='manual')return;
  const char=getChar(),spell = char.spells[index];
  if (!spell || !canCastRitual(char, spell)) return;
  if(deferConcentrationReplacement(char,spell,index,true,confirmedId,id=>castRitualByIndex(index,id)))return;
  applyCastConcentration(char,spell,CharacterEngine,true);
  onSpellCast(char,spell,spell.circle,CharacterEngine);
  recordStepAndSave(`Conjurou ${spell.name} como ritual (+10 minutos, sem espaço)`);
  showToast('Ritual: acrescente 10 minutos ao tempo da magia. Nenhum espaço gasto.');
}
function toggleSpellTwinnedByIndex(index) {
  toggleSpellTwinned(getChar().spells[index].name);
}
function toggleSingleSpellExpandByIndex(index) {
  toggleSingleSpellExpand(getChar().spells[index].name);
}
function showSpellTooltipByIndex(event, index) {
  if(document.querySelector(`[data-spell-card="${index}"] [data-sheet-spell-editor]`))return;
  const spell = getChar().spells[index];
  if (spell) showSpellTooltip(event, spell.name, spell.classId, spell.circle, index);
}

function renderExpandedSpellCard(char, sp, globalSpellIdx) {
  const meta = resolveSpellMeta(sp);
  const prep = preparation(char, sp.classId, CharacterEngine);
  const preparationLabel = prep.always(sp) ? 'Sempre Preparada' : !prep.prepares ? 'Conhecida' : sp.prepared ? 'Preparada' : canRitual(char, sp, CharacterEngine) ? 'Não preparada · ritual disponível' : 'Não preparada';
  const clsMeta =
    RULES_DB.classes[sp.classId] || RULES_DB.classes.feiticeiro;
  const targetMeta =
    TARGET_TYPES_META[meta.targetType] || TARGET_TYPES_META.mira;
  const defMeta = getSpellDefenseMeta(char, sp);
  return `
  <div class="spell-card" data-spell-card="${globalSpellIdx}">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-rpg font-bold text-sm t-text-main">${escapeHTML(sp.name)}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold ${clsMeta.badgeColor}">${clsMeta.name.toUpperCase()}</span>
            <button onclick="openHomebrewModal('spell', ${globalSpellIdx})" class="t-text-main" aria-label="Editar ${escapeHTML(sp.name)}"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
            ${bookConsultButton(sp.name,spellConsultReference(char,sp,globalSpellIdx),'spell:'+globalSpellIdx)}
            ${sp.extraSource ? `<span class="text-[11px] t-text-muted">${escapeHTML(sp.extraSource)}</span>` : ''}
            ${sp.circle>0?`<span class="text-[11px] font-bold">${preparationLabel}</span>`:''}
          </div>
          <div class="text-[11px] t-text-muted">Tempo: <strong>${escapeHTML(sp.time)}</strong> • Alcance: <strong>${escapeHTML(sp.range)}</strong></div>
      <div class="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
        ${renderSpellEffectDetails(char, sp, globalSpellIdx)}
        ${meta.targetType ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded t-card"><i data-lucide="${targetMeta.icon}" class="w-3.5 h-3.5 t-text-accent" aria-hidden="true"></i> ${escapeHTML(sp.range)} · ${escapeHTML(targetMeta.label)}</span>` : ''}
        ${defMeta && meta.defType!=='atq_magico' ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded t-card"><i data-lucide="${defMeta.icon}" class="w-3.5 h-3.5 t-text-accent" aria-hidden="true"></i> ${escapeHTML(defMeta.label)}</span>` : ""}
      </div>
      <p class="text-xs t-text-muted">${escapeHTML(getSpellNotes(char, sp))}</p>
    <div class="spell-cast-footer">${renderSpellCastControls(char, sp, globalSpellIdx)}</div>
  </div>
`;
}

// Constrói 1 painel de círculo individual
function renderSpellSlotButton(kind, level, index, spent) {
  const source = kind === "pact" ? "Pacto" : "Conjuração";
  const label = `${spent ? "Recuperar" : "Gastar"} espaço ${index + 1} de ${source}, ${level}º círculo (${spent ? "gasto" : "disponível"})`;
  const handler = kind === "pact" ? `togglePactSlot(${index})` : `toggleStandardSlot(${level}, ${index})`;
  return `<button type="button" onclick="${handler}" class="spell-slot" aria-pressed="${spent}" aria-label="${label}" title="${label}"><span class="spell-slot-gem" aria-hidden="true"></span></button>`;
}

function buildSingleCirclePanelHtml(char, lvl, isClassicTwoCol) {
  const panelKey = `circle_${lvl}`;
  const isCollapsed = !!collapsedPanels[panelKey];
  const spellsInCircle = char.spells
    // Preserva o índice original para editar/conjurar a magia após o filtro.
    .map((sp, idx) => ({ sp, idx }))
    .filter(
      ({ sp }) =>
        sp.circle === lvl && isSpellVisible(sp) &&
        (spellFilterClass === "all" || sp.classId === spellFilterClass),
    );

  const stdSlot = char.standardSlots[lvl] || { total: 0, used: 0 };
  const stdFree = Math.max(0, stdSlot.total - stdSlot.used);

  let slotHeaderControls = "";
  if (lvl === 0) {
    slotHeaderControls = `<span class="px-2.5 py-0.5 rounded badge-utilidade text-[11px] font-bold">${spellsInCircle.length} Truques (À Vontade)</span>`;
  } else {
    const diamonds = Array.from({ length: stdSlot.total })
      .map((_, i) => {
        const spent = i >= stdFree;
        return renderSpellSlotButton("standard", lvl, i, spent);
      })
      .join("");

    slotHeaderControls = `
    <div class="flex flex-wrap items-center gap-2" onclick="event.stopPropagation()">
      <div class="slot-resource t-inset px-2.5 py-1 rounded-lg text-xs">
        <span class="text-[11px] font-semibold">Conjuração:</span>
        <div class="slot-track">${diamonds}</div>
        ${sheetInput(char,`standardSlots.${lvl}.remaining`,stdFree,`Espaços disponíveis do ${lvl}º círculo`,'number',{min:0,max:100})} / ${sheetInput(char,`standardSlots.${lvl}.total`,stdSlot.total,`Total de espaços do ${lvl}º círculo`,'number',{min:0,max:100})}
      </div>
    </div>
  `;
  }

  const spellsBodyHtml = `<div class="grid grid-cols-1 ${isClassicTwoCol ? "" : "md:grid-cols-2"} gap-3">${spellsInCircle.map(({ sp, idx }) => renderExpandedSpellCard(char, sp, idx)).join("")}</div>`;

  return `
  <div class="t-card overflow-hidden" data-flow-key="${panelKey}">
    <div onclick="togglePanel('${panelKey}')" class="spell-circle-heading flex flex-wrap items-center justify-between gap-2 cursor-pointer t-hover ${!isCollapsed ? "border-b t-border" : ""}">
      <div class="flex items-center gap-2">
        <i data-lucide="${isCollapsed ? "chevron-right" : "chevron-down"}" class="w-4 h-4 t-text-accent"></i>
        <span style="--circle-level:${lvl}" class="spell-circle-number w-6 h-6 rounded flex items-center justify-center font-rpg font-extrabold text-xs">${lvl}</span>
        <h4 class="font-rpg font-bold text-xs sm:text-sm uppercase t-text-main">
          ${lvl === 0 ? "Truques (Círculo 0)" : `${lvl}º Círculo de Magia`}
        </h4>
        <span class="text-[11px] t-text-muted">(${spellsInCircle.length})</span>
      </div>
      ${slotHeaderControls}
    </div>
    ${!isCollapsed ? `<div class="p-2.5">${spellsBodyHtml}</div>` : ""}
  </div>
`;
}

// Círculos em ordem numérica; PanelFlow acomoda cada um na coluna mais
// curta, sem prender permanentemente níveis pares/ímpares ao mesmo lado.
function isSpellVisible(spell) { return canCastNormally(getChar(),spell,CharacterEngine) || canCastRitual(getChar(), spell); }
function renderSpellsSection(char, isClassicTwoCol) {
  const circles = Array.from({ length: 10 }, (_, level) => level).filter(
    (level) => level === 0 || char.standardSlots[level]?.total > 0 || char.spells.some((spell) => spell.circle === level) || poolEditorVisible(char,'circle:'+level),
  );

  let layoutContainerHtml = "";
  if (isClassicTwoCol && currentFontScale <= 115) {
    layoutContainerHtml = `
    <div data-panel-flow="pack" data-flow-id="spell-circles">
      ${circles.map((lvl) => buildSingleCirclePanelHtml(char, lvl, true)).join("")}
    </div>
  `;
  } else {
    layoutContainerHtml = `
    <div class="space-y-3.5">
      ${circles.map((lvl) => buildSingleCirclePanelHtml(char, lvl, false)).join("")}
    </div>
  `;
  }

  return `
  <div class="space-y-4">
    ${renderSorceryCollapsiblePanel(char)}
    ${renderPactMagicPanel(char)}
    ${spellClassPanels(char,CharacterEngine)}
    ${renderSpellsToolbar(char)}
    ${layoutContainerHtml}
  </div>
`;
}

function selectedMetamagic(char) {
  const choices=CharacterEngine.selections(char, 'feiticeiro', 'metamagic');
  if(choices.length || char.rules && !char.rules.legacy) return choices;
  return [...new Set((char.features || []).map(f=>typeof f==='string'?f:`${f.title || f.name || ''} ${f.description || ''}`).filter(f=>/Metamágica|Magia Gêmea|Magia Duplicada/i.test(f)).map(f=>/Acelerada/i.test(f)?'Magia Acelerada':/Gêmea|Duplicada/i.test(f)?'Magia Duplicada':'').filter(Boolean))];
}
function characterHasTwinned(char) { return selectedMetamagic(char).includes('Magia Duplicada'); }
function renderSorceryCollapsiblePanel(char) {
  const extraResources=resourcesAt(char,CharacterEngine,'sorcery');
  const managedNames=new Set(extraResources.map(r=>r.name));
  if (char.sorceryPoints.max <= 0 && !extraResources.length && !poolEditorVisible(char,'sorcery') && !char.classes.some(c=>c.classId==='feiticeiro')) return "";
  const isCollapsed = !!collapsedPanels["sorcery_top"];
  const spCur = char.sorceryPoints.current;
  const spMax = char.sorceryPoints.max;

  const spGems = Array.from({ length: spMax })
    .map((_, i) => {
      const active = i < spCur;
      return `<button onclick="changeSorceryPoints(${active ? -1 : 1})" class="w-4 h-4 rune-slot border ${active ? "bg-amber-500 border-amber-200" : "t-inset"}"></button>`;
    })
    .join("");

  return `
  <div class="t-card-accent overflow-hidden" data-spell-class="feiticeiro">
    <div onclick="togglePanel('sorcery_top')" class="p-3.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer t-hover">
      <div class="flex items-center gap-2">
        <i data-lucide="${isCollapsed ? "chevron-right" : "chevron-down"}" class="w-4 h-4 t-text-accent"></i>
        <i data-lucide="sparkles" class="w-4 h-4 t-text-accent"></i>
        <h3 class="font-rpg text-xs sm:text-sm font-bold uppercase t-text-accent">
          Feiticeiro · ${spMax>0?'Fonte de Magia & Metamágica':'Origem de Feitiçaria'}
        </h3>
      </div>
      ${true?`<div class="flex items-center gap-3 text-xs" onclick="event.stopPropagation()">
        <div class="flex flex-wrap items-center gap-2 t-inset px-2.5 py-1 rounded-lg max-w-full">
          <span class="font-bold text-[11px]">Pts Feitiçaria:</span>
          <div class="flex flex-wrap items-center gap-1.5 px-1" style="max-width:min(24rem,65vw)">${spGems}</div>
          ${sheetInput(char,'sorceryPoints.current',spCur,'Pontos de feitiçaria atuais','number',{min:0,max:100})} / ${sheetInput(char,'sorceryPoints.max',spMax,'Máximo de pontos de feitiçaria','number',{min:0,max:100})}
        </div>
      </div>`:''}
    </div>

    ${
      !isCollapsed
        ? `
      <div class="p-4 pt-2 border-t t-border space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          ${selectedMetamagic(char).filter(name=>!managedNames.has(name)).map(name => name === 'Magia Acelerada' ? `<button ${RuleTooltips.attributes(name, CharacterEngine.reference(name, "feiticeiro"))} onclick="useMetamagicOrWild('Magia Acelerada', 2)" class="t-inset p-2.5 rounded-lg text-left"><strong class="t-text-accent">Magia Acelerada · 2 pts</strong><p class="text-[11px] mt-1">Magia de 1 ação passa a usar ação bônus.</p></button>` : `<div tabindex="0" ${RuleTooltips.attributes(name, CharacterEngine.reference(name, "feiticeiro"))} class="t-inset p-2.5 rounded-lg"><strong class="t-text-accent">${escapeHTML(name === 'Magia Duplicada' ? 'Magia Gêmea (Duplicada)' : name)}</strong><p class="text-[11px] mt-1">${name === 'Magia Duplicada' ? 'Use Gêmea nas magias elegíveis; custo igual ao círculo, mínimo 1 ponto.' : 'Consulte o efeito em Características & escolhas.'}</p></div>`).join('')}
          ${char.classes.some(c => c.classId === 'feiticeiro' && c.level >= 6 && (c.subclassId === 'selvagem' || /selvagem/i.test(c.subclass))) ? `<button ${RuleTooltips.attributes("Dobrar a Sorte", CharacterEngine.reference("Dobrar a Sorte", "feiticeiro", "selvagem"))} onclick="if(useMetamagicOrWild('Dobrar a Sorte (1d4)', 2)) addDieToPool(4)" class="t-inset p-2.5 rounded-lg text-left"><strong class="t-text-accent">Dobrar a Sorte (+1d4) · 2 pts</strong></button>` : ''}
        </div>
        ${extraResources.length?`<div class="rule-context rule-resource-grid" data-rule-place="sorcery">${renderResourceControls(char,CharacterEngine,extraResources)}</div>`:''}

        ${spMax>0?`<div class="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1">
          <span class="t-text-muted font-semibold">Conjuração Flexível (Converter Slots ⇄ Pontos):</span>
          <div class="flex flex-wrap gap-1.5">
            ${standardSlotEntries(char).filter(([, slot]) => slot.total > 0).map(([level]) => `<button onclick="convertSlotToSorceryPoints(${Number(level)})" class="px-2 py-1 t-inset rounded font-semibold">Converter ${Number(level)}º (+${Number(level)} pt)</button>`).join('')}
            ${[2,3,5,6,7].map((cost,index) => `<button onclick="createSlotWithSorceryPoints(${index+1}, ${cost})" class="px-2 py-1 t-inset rounded font-semibold">Criar ${index+1}º (-${cost} pt)</button>`).join('')}
          </div>
        </div>`:''}
      </div>
    `
        : ""
    }
  </div>
`;
}

function renderPactMagicPanel(char) {
  const pact = char.pactMagic;
  if (pact.total <= 0 && !poolEditorVisible(char,'pact') && !char.classes.some(c=>c.classId==='bruxo')) return "";
  return `<section class="t-card-accent p-4 space-y-2" data-spell-class="bruxo" aria-label="Magia de Pacto do bruxo">
    <div class="flex flex-wrap justify-between items-center gap-2">
      <h3 tabindex="0" ${RuleTooltips.attributes("Magia de Pacto", CharacterEngine.reference("Magia de Pacto", "bruxo"))} class="font-rpg font-bold text-sm t-text-accent">Bruxo · Magia de Pacto</h3>
      <div class="slot-resource t-inset px-3 py-1 rounded-lg">
        ${Array.from({ length: pact.total }, (_, index) => renderSpellSlotButton("pact", pact.level, index, index >= pact.total - pact.used)).join("")}
        ${sheetInput(char,'pactMagic.remaining',pact.total-pact.used,'Espaços disponíveis de Pacto','number',{min:0,max:100})} / ${sheetInput(char,'pactMagic.total',pact.total,'Total de espaços de Pacto','number',{min:0,max:100})} · <span>${sheetInput(char,'pactMagic.level',pact.level,'Círculo dos espaços de Pacto','number',{min:1,max:5})}º círculo</span>
      </div>
    </div>
    <p class="sheet-pact-description t-text-muted">Espaços de magia do Bruxo. Recuperam no descanso curto ou ao dormir.</p>
    ${renderResourcesAt(char,CharacterEngine,'pact')}
  </section>`;
}

function renderSpellsToolbar(char) {
  const ids = [...new Set(char.spells.map(sp => sp.classId))].filter(id => Object.hasOwn(PHB_DATA.classes, id));
  return `<div class="t-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs" data-sheet-spell-tools>
    <div class="flex flex-wrap items-center gap-1.5">
      <span class="font-bold t-text-muted mr-1">Classe:</span>
      <button onclick="setSpellClassFilter('all')" class="px-2.5 py-1 rounded font-bold ${spellFilterClass === 'all' ? 't-btn-primary' : 't-inset'}">Todas</button>
      ${ids.map(id => `<button onclick="setSpellClassFilter('${id}')" class="px-2.5 py-1 rounded font-bold ${spellFilterClass === id ? 't-btn-primary' : 't-inset'}">${escapeHTML(RULES_DB.classes[id]?.name || id)}</button>`).join('')}
    </div>
    <div class="flex flex-wrap items-center gap-2"><button type="button" class="t-inset px-2.5 py-1 rounded font-bold" onclick="openSpellEditor()">+ Magia</button><select class="sheet-field sheet-select" data-sheet-circle aria-label="Adicionar círculo de espaços" ${canConfigureSheet(char)?'':'disabled'}><option value="">+ Círculo</option>${Array.from({length:9},(_,i)=>`<option value="${i+1}">${i+1}º círculo</option>`).join('')}</select>${char.pactMagic.total<=0&&!poolEditorVisible(char,'pact')?'<button type="button" data-sheet-show-pool="pact">+ Pacto</button>':''}${char.sorceryPoints.max<=0&&!poolEditorVisible(char,'sorcery')?'<button type="button" data-sheet-show-pool="sorcery">+ Feitiçaria</button>':''}${spellcastingStatusControls(char,CharacterEngine)}</div>
  </div>`;
}

// =========================================================================
// 8. ABA 1 & ABA 3
// =========================================================================
function renderSkillAdjustment(char,sk,val,label) {
  return `<div class="sheet-skill-value">${sheetInput(char,`customSkillBonuses.${sk.id}`,char.customSkillBonuses?.[sk.id]??'',`Bônus total de ${label}`,'number',{min:-1000,max:1000,placeholder:fmtMod(val)})}<button onclick="triggerSheetRoll('1d20${fmtMod(val)}', 'Perícia: ${label}', true, {type:'check',skill:'${sk.id}'})" aria-label="Rolar ${label}" class="t-text-accent"><i data-lucide="dices" class="w-3 h-3" aria-hidden="true"></i></button><button type="button" data-sheet-expertise="${sk.id}" aria-pressed="${char.expertise?.includes(sk.id)}" title="Especialização: proficiência dobrada" aria-label="Especialização em ${label}" ${canConfigureSheet(char)?'':'disabled'}>${char.expertise?.includes(sk.id)?'×2':'×1'}</button></div>`;
}
function renderPassiveSkill(char,sk) {
  if(!['percepcao','investigacao'].includes(sk.id))return '';
  const p=passiveSkill(char,sk,CharacterEngine);
  const text=`10 + bônus de perícia ${p.bonus}${p.observer?' + Observador 5':''} = ${p.total}. Observador só afeta o valor passivo, não a rolagem ativa. Vantagem/desvantagem situacional altera o passivo em +5/−5, conforme a mesa; o modo do dado não altera este valor de referência.`;
  return `<span class="sheet-skill-passive t-text-muted" tabindex="0" onclick="event.stopPropagation()" data-skill-passive="${sk.id}" ${RuleTooltips.attributes('Valor passivo',{text})}>Passiva ${p.total}</span>`;
}
function renderMainClassic2014(char) {
  const pb = getProfBonus(char);
  const abilitiesHtml = Object.entries(RULES_DB.abilities)
    .map(([key, meta]) => {
      const score = char.abilities[key].score;
      const mod = getMod(score);
      return `
    <div class="sheet-ability-card t-card-accent p-2.5 text-center flex flex-col items-center justify-center">
      <span class="text-[10px] font-bold uppercase tracking-wider t-text-muted">${meta.name}</span>
      <button onclick="triggerSheetRoll('1d20${fmtMod(mod+untrainedAbilityBonus(char,key))}', 'Teste de ${meta.name}', true, {type:'check'})" class="text-2xl font-extrabold t-text-main my-0.5 hover:scale-110 transition">
        ${fmtMod(mod)}
      </button>
      <div class="flex items-center gap-1 t-inset px-2 py-0.5 rounded-full text-xs">
        <button onclick="changeAbility('${key}', -1)" class="t-text-muted font-bold">-</button>
        ${sheetInput(char,`abilities.${key}.score`,score,meta.name,'number',{min:0,max:30})}
        <button onclick="changeAbility('${key}', 1)" class="t-text-muted font-bold">+</button>
      </div>
    </div>
  `;
    })
    .join("");

  const savesHtml = Object.entries(RULES_DB.abilities)
    .map(([key, meta]) => {
      const isProf = char.abilities[key].saveProf;
      const val = savingThrow(char,key,CharacterEngine);
      return `
    <div class="flex items-center justify-between py-1 px-2 rounded t-hover text-xs">
      <div onclick="toggleSave('${key}')" class="flex items-center gap-2 cursor-pointer">
        <span class="w-3 h-3 rounded-full border ${isProf ? "t-btn-primary" : "t-border"}"></span>
        <span>${meta.name}</span>
      </div>
      <button onclick="triggerSheetRoll('1d20${fmtMod(val)}', 'Salvaguarda de ${meta.name}', true, {type:'save',ability:'${key}'})" aria-label="Rolar salvaguarda de ${meta.name}" class="sheet-save-roll font-bold ${isProf ? "t-text-accent" : ""} hover:underline">
        ${fmtMod(val)}<i data-lucide="dices" class="w-3 h-3 t-text-accent" aria-hidden="true"></i>
      </button>
    </div>
  `;
    })
    .join("");

  const skillsHtml = RULES_DB.skills
    .map((sk) => {
      const isProf = char.skillsProf.includes(sk.id);
      const val = getSkillBonus(char, sk);
      return `
    <div class="flex items-center justify-between py-1 px-2 rounded t-hover text-xs">
      <div onclick="toggleSkill('${sk.id}')" class="flex items-center gap-2 cursor-pointer">
        <span class="w-3 h-3 rounded-full border ${isProf ? "t-btn-primary" : "t-border"}"></span>
        <span>${sk.name2014} <span class="t-text-muted">(${RULES_DB.abilities[sk.ability].short})</span>${renderPassiveSkill(char,sk)}</span>
      </div>
      ${renderSkillAdjustment(char,sk,val,sk.name2014)}
    </div>
  `;
    })
    .join("");

  return `
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
    <div class="sheet-classic-sidebar lg:col-span-4 grid grid-cols-12 gap-3">
      <div class="sheet-abilities col-span-4 space-y-2.5">${abilitiesHtml}</div>
      <div class="sheet-proficiencies col-span-8 space-y-3">
        <div class="t-card p-3">
          <h3 class="text-[11px] font-rpg font-bold uppercase text-center t-text-accent border-b t-border pb-1 mb-2">Testes de Resistência</h3>
          <div class="space-y-0.5">${savesHtml}</div>
        </div>
        <div class="t-card p-3">
          <h3 class="text-[11px] font-rpg font-bold uppercase text-center t-text-accent border-b t-border pb-1 mb-2">Perícias</h3>
          <div class="space-y-0.5">${skillsHtml}</div>
        </div>
      </div>
    </div>
    <div class="lg:col-span-5 space-y-4">
      ${renderCombatBlock(char)}
      ${renderAttacksBlock(char)}
    </div>
    <div class="lg:col-span-3 space-y-3">
      ${renderFeaturesCollapsible(char)}
    </div>
  </div>
`;
}

function renderMainModern2024(char) {
  const pb = getProfBonus(char);
  const groupedCardsHtml = Object.entries(RULES_DB.abilities)
    .map(([key, meta]) => {
      const score = char.abilities[key].score;
      const mod = getMod(score);
      const saveProf = char.abilities[key].saveProf;
      const saveVal = savingThrow(char,key,CharacterEngine);
      const childSkills = RULES_DB.skills.filter(
        (s) => s.ability === key,
      );

      return `
    <div class="t-card-accent p-3.5 space-y-2">
      <div class="flex items-center justify-between border-b t-border pb-2">
        <div>
          <h3 class="font-rpg font-bold t-text-accent text-sm">${meta.name}</h3>
          <div class="flex items-center gap-1 mt-1 text-xs">
            <span class="t-text-muted text-[10px]">VALOR:</span>
            <button onclick="changeAbility('${key}', -1)" class="px-1.5 t-inset rounded font-bold">-</button>
            ${sheetInput(char,`abilities.${key}.score`,score,meta.name,'number',{min:0,max:30})}
            <button onclick="changeAbility('${key}', 1)" class="px-1.5 t-inset rounded font-bold">+</button>
          </div>
        </div>
        <button onclick="triggerSheetRoll('1d20${fmtMod(mod+untrainedAbilityBonus(char,key))}', 'Teste de ${meta.name}', true, {type:'check'})" class="t-inset rounded-lg px-3 py-1 text-center hover:scale-105 transition">
          <span class="text-[9px] uppercase t-text-muted block">Mod</span>
          <span class="text-xl font-extrabold t-text-accent">${fmtMod(mod)}</span>
        </button>
      </div>

      <div class="flex items-center justify-between t-inset px-2.5 py-1 rounded text-xs">
        <div onclick="toggleSave('${key}')" class="flex items-center gap-2 cursor-pointer">
          <span class="w-3 h-3 rune-slot border ${saveProf ? "t-btn-primary" : "t-border"}"></span>
          <span class="font-semibold">Salvaguarda</span>
        </div>
        <button onclick="triggerSheetRoll('1d20${fmtMod(saveVal)}', 'Salvaguarda de ${meta.name}', true, {type:'save',ability:'${key}'})" aria-label="Rolar salvaguarda de ${meta.name}" class="sheet-save-roll font-bold hover:underline">${fmtMod(saveVal)}<i data-lucide="dices" class="w-3 h-3 t-text-accent" aria-hidden="true"></i></button>
      </div>

      <div class="space-y-0.5 pt-0.5">
        ${childSkills.length === 0 ? `<div class="text-[11px] t-text-muted italic px-1">Sem perícias associadas</div>` : ""}
        ${childSkills
          .map((sk) => {
            const isProf = char.skillsProf.includes(sk.id);
            const val = getSkillBonus(char, sk);
            return `
            <div class="flex items-center justify-between px-2 py-1 rounded t-hover text-xs">
              <div onclick="toggleSkill('${sk.id}')" class="flex items-center gap-2 cursor-pointer">
                <span class="w-2.5 h-2.5 rounded-full border ${isProf ? "t-btn-primary" : "t-border"}"></span>
                <span>${sk.name2024}${renderPassiveSkill(char,sk)}</span>
              </div>
              ${renderSkillAdjustment(char,sk,val,sk.name2024)}
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
  `;
    })
    .join("");

  return `
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
    <div class="lg:col-span-6 grid grid-cols-1 ${currentFontScale >= 120 ? "" : "sm:grid-cols-2"} gap-3.5 content-start">
      ${groupedCardsHtml}
    </div>
    <div class="lg:col-span-6 space-y-4">
      ${renderCombatBlock(char)}
      ${renderAttacksBlock(char)}
    </div>
    <div class="lg:col-span-12 min-w-0">
      ${renderFeaturesCollapsible(char, true)}
    </div>
  </div>
`;
}

function renderCombatBlock(char) {
  const isCollapsed = !!collapsedPanels["combat_box"];
  const ac = getCalculatedAC(char);
  const dexMod = initiativeBonus(char,CharacterEngine);
  const effective = exhaustion({...char,speed:CharacterEngine.movementSpeed(char)});

  // Referência sem consumo/cura automática, conforme a campanha do usuário.

  return `
  <div class="t-card-accent overflow-hidden">
    <div onclick="togglePanel('combat_box')" class="p-3 border-b t-border flex items-center justify-between cursor-pointer t-hover">
      <div class="flex items-center gap-2">
        <i data-lucide="${isCollapsed ? "chevron-right" : "chevron-down"}" class="w-4 h-4 t-text-accent"></i>
        <h3 class="font-rpg text-xs font-bold uppercase t-text-accent">Status de Combate & Pontos de Vida</h3>
      </div>
      <span class="sheet-combat-summary font-bold">PV: ${char.hpCurrent}/${effective.hpMax} | CA: ${ac}</span>
    </div>

    ${
      !isCollapsed
        ? `
      <div class="p-4 space-y-3.5">
        <div class="grid grid-cols-3 gap-2.5 text-center">
          <div class="combat-stat t-inset p-2 rounded-lg">
            <span tabindex="0" ${RuleTooltips.attributes('Cálculo da CA', { text: getArmorExplanation(char) })} class="text-[10px] uppercase t-text-muted block cursor-help">CA</span>
            <div class="combat-stat-value">${sheetInput(char,'armorTotal',ac,'CA atual (equipamento, escudo e efeitos inclusos)','number',{min:0})}</div>
            ${char.spells.some(s => s.name === 'Armadura Arcana' || s.bookId === 'armadura-arcana') ? `<button onclick="toggleMageArmor()" class="text-[10px] underline block mx-auto mt-0.5">
              ${char.mageArmorActive ? `Arcana: CA ${getMageArmorAC(char)}` : "Ativar Arcana"}
            </button>` : ''}
          </div>
          <button onclick="triggerSheetRoll('1d20${fmtMod(dexMod)}', 'Iniciativa', true, {type:'check'})" class="combat-stat t-inset p-2 rounded-lg hover:scale-105 transition">
            <span class="text-[10px] uppercase t-text-muted block">Iniciativa</span>
            <span class="combat-stat-value">${fmtMod(dexMod)}</span>
          </button>
          <div class="combat-stat t-inset p-2 rounded-lg">
            <span class="text-[10px] uppercase t-text-muted block">Desloc.</span>
            <div class="combat-stat-value">${sheetInput(char,'speed',char.speed,'Deslocamento base em metros','number',{min:0,step:'any'})}<span class="combat-stat-unit">m</span></div>${effective.speed!==char.speed?`<small class="block">Em jogo: ${effective.speed} m</small>`:''}
          </div>
        </div>
        ${defenseControls(char,CharacterEngine)}

        <div class="t-inset p-3 rounded-lg flex flex-wrap items-center justify-between gap-2">
          <div>
            <span class="text-[10px] uppercase t-text-muted block">Pontos de Vida Atuais / Máximos</span>
            <div class="sheet-hp-values flex flex-wrap items-center gap-1.5 mt-1">
              <button onclick="changeHp(-1)" title="Dano já resolvido pela mesa. Para resistências automáticas, use Dano detalhado → Calcular por tipo." class="px-2 py-0.5 t-card rounded font-bold text-xs">-1</button>
              <button onclick="changeHp(-5)" title="Dano já resolvido pela mesa. Para resistências automáticas, use Dano detalhado → Calcular por tipo." class="px-2 py-0.5 t-card rounded font-bold text-xs">-5</button>
              ${sheetInput(char,'hpCurrent',char.hpCurrent,'PV atuais','number',{min:0})} / ${sheetInput(char,'hpMax',char.hpMax,'PV máximos base','number',{min:1})}${effective.hpMax!==char.hpMax?`<small>Limite atual: ${effective.hpMax}</small>`:''}
              <button onclick="changeHp(1)" class="px-2 py-0.5 t-card rounded font-bold text-xs">+1</button>
              <button onclick="changeHp(5)" class="px-2 py-0.5 t-card rounded font-bold text-xs">+5</button>
            </div>
          </div>
          <div class="sheet-inspiration rule-context rule-controls" data-inspiration-control>${inspirationControls(char)}</div>
        </div>

        ${deathControls(char,CharacterEngine)}
        ${conditionControls(char)}
        ${concentrationControls(char)}
        ${renderResourcesAt(char,CharacterEngine,'health')}
        <div class="t-inset p-3 rounded-lg space-y-2">
          <div class="flex flex-wrap justify-between items-center gap-2">
            <span class="font-bold t-text-accent">PV temporários: <span id="temporaryHpValue">${sheetInput(char,'hpTemp',char.hpTemp,'PV temporários atuais','number',{min:0})}</span></span>
            <button onclick="clearTemporaryHp()" ${char.hpTemp <= 0 ? "disabled" : ""} class="text-xs underline disabled:opacity-40">Remover PV temporários</button>
          </div>
          ${char.hpTempSource ? `<p class="text-[11px] t-text-muted">Origem: ${escapeHTML(char.hpTempSource)}</p>` : ""}
          <div class="flex flex-wrap gap-2 items-center">
            <label class="text-xs" for="temporaryHpInput">Novo valor:</label>
            <input id="temporaryHpInput" type="number" min="1" step="1" value="${getFiendBlessingAmount(char) || 1}" class="t-card px-2 py-1 rounded w-20" />
            <button onclick="receiveTemporaryHpFromInput()" class="badge-utilidade px-3 py-1 rounded text-xs font-bold">Receber PV temporários</button>
            ${getFiendBlessingAmount(char) ? `<button ${RuleTooltips.attributes("Bênção do Obscuro", CharacterEngine.reference("Bênção do Obscuro", "bruxo", "corruptor"))} onclick="triggerBencaoChamasNegras()" class="badge-bruxo px-3 py-1 rounded text-xs font-bold">Bênção: ${getFiendBlessingAmount(char)} PV</button>` : ""}
          </div>
          <p class="text-[11px] t-text-muted">Não se somam: escolha manter os atuais ou receber o novo valor. Absorvem dano antes dos PV normais; cura não os recupera.</p>
        </div>

        <div class="space-y-1.5">${hitDiceControls(char,CharacterEngine)}${hitDiceRecoveryControls(char,CharacterEngine)}</div>
      </div>
    `
        : ""
    }
  </div>
`;
}

function renderAttacksBlock(char) {
  const isCollapsed = !!collapsedPanels["weapons_box"];
  return `
  <div class="t-card overflow-hidden" data-sheet-weapons>
    <div onclick="togglePanel('weapons_box')" class="p-3 border-b t-border flex items-center justify-between cursor-pointer t-hover">
      <div class="flex items-center gap-2">
        <i data-lucide="${isCollapsed ? "chevron-right" : "chevron-down"}" class="w-4 h-4 t-text-accent"></i>
        <h3 class="font-rpg text-xs font-bold uppercase t-text-accent">Armas & Ataques</h3>
      </div>
      <button onclick="event.stopPropagation(); openHomebrewModal('weapon')" class="text-[11px] font-bold t-text-accent hover:underline">+ Nova Arma</button>
    </div>
    ${
      !isCollapsed
        ? `
      <div class="p-3 space-y-2">
        ${char.weapons
          .map((storedWeapon, idx) => {
            const w = CharacterEngine.weaponStats(char, storedWeapon), attackBonus=weaponAttackBonus(char,storedWeapon,CharacterEngine);
            const validDamage = !!parseDiceFormula(w.damage);
            return `
            <div class="weapon-card t-inset p-2.5 rounded-lg text-xs" data-weapon-card="${idx}">
                <div class="weapon-heading">
                  <button class="min-w-0 font-bold underline decoration-dotted text-left" onmouseenter="showEquipmentTooltip(event, 'weapon', ${idx})" onmousemove="positionTooltip(event)" onmouseleave="hideBookTooltip()" onfocus="showEquipmentTooltip(event, 'weapon', ${idx})" onblur="hideBookTooltip()" onclick="showEquipmentTooltip(event, 'weapon', ${idx})" aria-label="Descrição de ${escapeHTML(w.name)}">${escapeHTML(w.name)}</button>
                  <button onclick="openHomebrewModal('weapon', ${idx})" class="shrink-0 t-text-muted hover:opacity-100" aria-label="Editar ataque ${escapeHTML(w.name)}"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
                </div>
                <p class="weapon-description t-text-muted">${escapeHTML(w.notes)}${w.critical?`${w.notes?' · ':''}Crítico ${w.critical===20?'20':`${w.critical}–20`}`:''}</p>

              <div class="weapon-rolls">
                ${attackBonus===''?'<span class="t-text-muted">Ataque não informado</span>':`<button onclick="rollWeapon(${idx}, 'attack')" data-weapon-attack-label="${idx}" class="px-2 py-1 badge-feiticeiro rounded font-bold">
                  <span data-weapon-attack-text>Atq ${escapeHTML(attackBonus)}</span>
                </button>`}
                <button onclick="rollWeapon(${idx}, 'damage')" data-weapon-damage-label="${idx}" class="weapon-damage-button px-2.5 py-1 t-btn-primary rounded font-extrabold shadow-sm">
                  <span aria-hidden="true" class="weapon-damage-sizer">${validDamage?escapeHTML(weaponDamageLabel(char,storedWeapon,CharacterEngine,false)):''}</span>
                  <span aria-hidden="true" class="weapon-damage-sizer">${validDamage?escapeHTML(weaponDamageLabel(char,storedWeapon,CharacterEngine,true)):''}</span>
                  ${weaponPowerAttackOption(char,storedWeapon,CharacterEngine)?[false,true].map(critical=>`<span aria-hidden="true" class="weapon-damage-sizer">${escapeHTML(weaponDamageLabel(char,storedWeapon,CharacterEngine,critical,true))}</span>`).join(''):''}
                  <span data-weapon-damage-text>${validDamage ? escapeHTML(weaponDamageLabel(char,storedWeapon,CharacterEngine)) : "Corrigir dano"}</span>
                </button>
              </div>
              <div class="weapon-secondary">
                ${w.ruleWeapon && /vers[aá]til/i.test(w.properties || '') ? `<label class="weapon-grip">Mãos <select data-weapon-hands="${idx}" onchange="setWeaponHands(${idx},this.value)" aria-label="Mãos para ${escapeHTML(w.name)}"><option value="1" ${storedWeapon.hands!==2?'selected':''}>1 mão</option><option value="2" ${storedWeapon.hands===2?'selected':''}>2 mãos</option></select></label>`:''}
                ${validDamage && w.damage!=='0'?renderWeaponDamageTools(char,storedWeapon,idx,CharacterEngine):''}
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    `
        : ""
    }
  </div>
`;
}

function renderFeaturesCollapsible(char, wide = false) {
  // Cada origem fica inteira. CSS distribui as colunas pela largura disponível,
  // sem dividir níveis pela quantidade de itens nem remontar nós ao redimensionar.
  const isCollapsed = !!collapsedPanels.features_box;
  const entries = featureGroups(char,CharacterEngine).map(group => {
    const levels=group.levels.map(level=>{
      const items=level.entries.map(({gain:g,index,controls})=>{
        const disclosure=`feature:${g.classId || g.source}:${g.level}:${index}`;
        return `<section class="feature-entry">${featureConsultButton(g,disclosure,group.label,controls[0]?.note)}${renderResourceControls(char,CharacterEngine,controls,controls.length>1 || g.name==='Juramento Sagrado')}</section>`;
      });
      return `<section class="feature-level" data-feature-level="${level.level}">${group.classId?`<h5 class="feature-level-title">Nível ${level.level}</h5>`:''}${items.join('')}</section>`;
    });
    return `<section class="feature-group" data-feature-group="${escapeHTML(group.key)}"><h4 class="feature-group-title t-text-accent">${escapeHTML(group.label)}</h4>${wide?`<div class="feature-levels">${levels.join('')}</div>`:levels.join('')}</section>`;
  });
  if (char.features?.length) entries.push(`<details><summary class="cursor-pointer font-bold">Anotações e adaptações já presentes nesta ficha</summary><ul class="list-disc pl-4 space-y-2 mt-2">${char.features.map((text,i) => `<li data-sheet-feature-row="${i}"><span>${escapeHTML(readableText(text))}</span> <button type="button" class="underline" onclick="openHomebrewModal('feature',${i})">Editar</button></li>`).join('')}</ul></details>`);
  const multiclass = CharacterEngine.multiclassNotes(char);
  if (multiclass.length) entries.push(`<details><summary class="cursor-pointer font-bold">Interações de multiclasse</summary><ul class="list-disc pl-4 space-y-2 mt-2">${multiclass.map(note => `<li><strong>${escapeHTML(note.name)}</strong>: ${escapeHTML(note.text)} <a class="underline" href="book.html#page=${note.pdfPage}" target="_blank" rel="noopener">Livro · p. ${note.page}</a></li>`).join('')}</ul></details>`);
  entries.push(`<details data-sheet-section="proficiencies"><summary class="cursor-pointer font-bold">Proficiências e idiomas</summary><div class="flex flex-wrap gap-2">${Object.entries({leve:'Leves',media:'Médias',pesada:'Pesadas',escudo:'Escudos'}).map(([id,label])=>`<label class="flex items-center gap-1"><input type="checkbox" data-sheet-armor="${id}" ${armorProficiencies(char,CharacterEngine).includes(id)?'checked':''} ${canConfigureSheet(char)?'':'disabled'}> ${label}</label>`).join('')}</div><label>Armas: ${sheetInput(char,'proficiencies.weapons',char.proficiencies.weapons,'Proficiências · Armas','text',{wide:true})}</label><label>Ferramentas: ${sheetInput(char,'proficiencies.tools',char.proficiencies.tools,'Proficiências · Ferramentas','text',{wide:true})}</label><label>Idiomas: ${sheetInput(char,'proficiencies.languages',char.proficiencies.languages,'Proficiências · Idiomas','text',{wide:true})}</label></details>`);
  const content = entries.join('');
  return `<div class="t-card overflow-hidden" data-sheet-features>
    <div onclick="togglePanel('features_box')" class="p-3 border-b t-border flex items-center gap-2 cursor-pointer t-hover">
      <i data-lucide="${isCollapsed ? 'chevron-right' : 'chevron-down'}" class="w-4 h-4 t-text-accent"></i>
      <h3 class="font-rpg text-xs font-bold uppercase t-text-accent">Características & escolhas</h3><button type="button" class="ml-auto text-[10px] font-bold t-text-accent" onclick="event.stopPropagation();openHomebrewModal('feature')">+ Característica</button>
    </div>${isCollapsed ? '' : `<div data-size-motion><div data-size-content class="p-3 feature-list feature-list-grouped${wide ? ' feature-list-wide' : ''} text-xs">${content}</div></div>`}</div>`;
}

// Notas ficam fora da ficha/snapshots, no mesmo espaço local da conta atual.
// O cache não é criptografado. O sincronizador usa documentos privados separados.
function readPrivateNotes(id) {
  return sheetStore.note(id);
}
function savePrivateNotes(value) {
  const saved = sheetStore.writeNote(getChar().id, String(value));
  document.getElementById('privateNotesStatus').textContent = saved ? 'Salvas neste navegador' : 'Não foi possível salvar; baixe um backup com notas antes de fechar.';
}
async function clearPrivateNotes() {
  if (!readPrivateNotes(getChar().id)) return;
  if (!await confirmDestructiveAction('Apagar anotações pessoais?', 'O texto pessoal deste personagem será apagado. Essa ação não entra no histórico da ficha.', 'Apagar anotações')) return;
  savePrivateNotes(''); renderAll();
}
function renderPrivateNotes(char) {
  return `<section class="player-private-notes t-card-accent p-4 space-y-2 text-xs"><div class="flex justify-between items-center gap-2"><h3 class="font-rpg font-bold uppercase t-text-accent">Anotações pessoais do jogador</h3><button class="underline" onclick="clearPrivateNotes()">Apagar</button></div><p class="t-text-muted">Privadas e separadas da ficha. Salvam neste aparelho; com login, use Sincronizar com a nuvem no perfil para enviar.</p><textarea aria-label="Anotações pessoais do jogador" rows="7" class="w-full t-inset p-3 rounded-lg" oninput="savePrivateNotes(this.value)">${escapeHTML(readPrivateNotes(char.id))}</textarea><p id="privateNotesStatus" class="t-text-muted" aria-live="polite">Salvas neste navegador</p></section>`;
}

function toggleWornArmor(index) {
  if(!requireSheetEdit())return;
  const char = getChar(), item = char.inventoryItems[index];
  const armor = CharacterEngine.armorInfo(item?.name);
  if (!armor) return;
  if (armor.type === 'shield') {
    const same = char.shieldName ? char.shieldName===item.name : item.name==='Escudo';
    char.shieldEquipped = !(same && char.shieldEquipped); char.shieldName = item.name;
  }
  else char.armorEquipped = char.armorEquipped === item.name ? null : item.name;
  recordStepAndSave(`Alterou equipamento vestido: ${item.name}`);
}

function renderLoreSection(char) {
  const maxLoadKg = char.abilities.str.score * 7.5;
  const curLoadKg = getCurrentLoadKg(char);
  return `
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
    <div class="lg:col-span-6 t-card-accent p-4 space-y-4 text-xs self-start" data-sheet-inventory>
      <div class="flex justify-between items-center border-b t-border pb-2">
        <h3 class="font-rpg font-bold uppercase t-text-accent">Equipamento, Tesouros & Moedas</h3>
        <button onclick="openHomebrewModal('item')" class="font-bold t-text-accent underline">+ Novo item</button>
      </div>
      <p class="sheet-inventory-load t-text-muted">${char.inventoryItems.some(item => item.weightUnreviewed) ? "Carga conhecida" : "Carga"}: ${curLoadKg.toFixed(1)} / ${maxLoadKg} kg (inclui moedas) · Passe o mouse ou toque no nome para ver a descrição.</p>
      <div class="sheet-coins grid grid-cols-5 gap-2 text-center">
        ${Object.entries(char.coins)
          .map(
            ([coin, val]) => `
          <label class="t-inset p-2 rounded-lg"><span class="uppercase text-[10px] t-text-muted font-bold block">${escapeHTML(coin)}</span>${sheetInput(char,`coins.${coin}`,val,`Moedas ${coin.toUpperCase()}`,'number',{min:0})}</label>
        `,
          )
          .join("")}
      </div>
      <div class="space-y-1.5">
        ${char.inventoryItems
          .map(
            (item, idx) => `
          <div class="flex flex-wrap items-center justify-between gap-2 t-inset px-3 py-1.5 rounded" data-sheet-item="${idx}">
            <button class="text-left underline decoration-dotted" onmouseenter="showEquipmentTooltip(event, 'item', ${idx})" onmousemove="positionTooltip(event)" onmouseleave="hideBookTooltip()" onfocus="showEquipmentTooltip(event, 'item', ${idx})" onblur="hideBookTooltip()" onclick="showEquipmentTooltip(event, 'item', ${idx})"><strong>${item.qty}x</strong> ${escapeHTML(item.name)}</button>
            <div class="flex flex-wrap justify-end items-center gap-2 shrink-0">${CharacterEngine.armorInfo(item.name) ? `<button class="underline" onclick="toggleWornArmor(${idx})">${(CharacterEngine.armorInfo(item.name).type === 'shield' ? char.shieldEquipped : char.armorEquipped === item.name) ? 'Retirar' : 'Equipar'}</button>` : ''}<span class="text-[10px] t-text-muted">${item.weightUnreviewed ? "Peso a conferir" : (item.weightKg * item.qty).toFixed(1) + " kg"}</span><button onclick="openHomebrewModal('item', ${idx})" aria-label="Editar item ${escapeHTML(item.name)}"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button></div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>

    <div class="lg:col-span-6 t-card-accent p-4 space-y-3 text-xs self-start" data-sheet-lore>
      <div class="flex justify-between items-center border-b t-border pb-2 gap-2"><h3 class="font-rpg font-bold uppercase t-text-accent">Crônica & Personalidade</h3></div>
      <div class="t-inset p-3 rounded-lg space-y-1.5">
        <div><strong class="t-text-accent">Personalidade:</strong> ${sheetText(char,'lore.traits',char.lore.traits,'Personalidade')}</div>
        <div><strong class="t-text-accent">Ideais:</strong> ${sheetText(char,'lore.ideals',char.lore.ideals,'Ideais')}</div>
        <div><strong class="t-text-accent">Ligações:</strong> ${sheetText(char,'lore.bonds',char.lore.bonds,'Ligações')}</div>
        <div><strong class="t-text-accent">Defeitos:</strong> ${sheetText(char,'lore.flaws',char.lore.flaws,'Defeitos')}</div>
      </div>
      <div class="sheet-backstory t-inset p-3 rounded-lg">
        <strong class="t-text-accent block mb-1 uppercase text-[10px]">História do Personagem</strong>
        ${sheetText(char,'lore.backstory',char.lore.backstory,'História do personagem')}
      </div>
      <details class="t-inset p-3 rounded-lg" data-sheet-section="appearance"><summary class="cursor-pointer font-bold">Aparência, aliados e tesouros</summary><div class="space-y-1.5 mt-2">${Object.entries({age:'Idade',height:'Altura',weight:'Peso',eyes:'Olhos',skin:'Pele',hair:'Cabelo'}).map(([key,label]) => `<label><strong>${label}:</strong> ${sheetInput(char,`physical.${key}`,char.physical?.[key]||'',label,'text',{wide:true})}</label>`).join('')}${['appearance','allies','treasure'].map(key=>`<label><strong>${{appearance:'Aparência',allies:'Aliados',treasure:'Tesouros'}[key]}:</strong> ${sheetText(char,`lore.${key}`,char.lore[key],{appearance:'Aparência',allies:'Aliados',treasure:'Tesouros'}[key])}</label>`).join('')}</div></details>
      ${renderPrivateNotes(char)}
    </div>
  </div>
`;
}

// =========================================================================
// 9. RENDERALL & EVENTOS GERAIS
// =========================================================================
function renderAll() {
  const inlineFields=captureSheetFields();
  beginSheetRender();
  try {
  parkSheetPanels();
  if(historyOwnerId!==(getChar()?.id || null)) restoreSavedHistory();
  const panelPositions = window.PanelFlow?.capture(document.getElementById("sheetViewport"));
  window.PanelFlow?.dispose();
  RuleTooltips.hide();
  hideBookTooltip();
  document.body.setAttribute("data-theme", currentTheme);
  document.body.setAttribute("data-backdrop", currentBackdrop);
  ["clean", "textured"].forEach((style) => {
    const button = document.getElementById(`backdropBtn-${style}`);
    button.setAttribute("aria-pressed", String(currentBackdrop === style));
    button.className = `px-1.5 py-0.5 rounded font-bold ${currentBackdrop === style ? "t-btn-primary" : "t-text-muted"}`;
  });
  document.documentElement.style.fontSize = `${(16 * currentFontScale) / 100}px`;

  const char = getChar();
  updateSheetLockUI(char);
  document.getElementById("charSelect").innerHTML = characters
    .map((c, idx) => {
      const clsStr = c.classes
        .map((cl) => `${RULES_DB.classes[cl.classId]?.name} ${cl.level}`)
        .join(" | ");
      return `<option value="${idx}" ${idx === activeCharIndex ? "selected" : ""}>${escapeHTML(c.name)} (${escapeHTML(clsStr)})</option>`;
    })
    .join("");

  if (char && readPreference(ACTIVE_CHARACTER_KEY) !== char.id) {
    writePreference(ACTIVE_CHARACTER_KEY, char.id);
  }

  refreshHistoryControls();

  ["pergaminho_claro", "pergaminho_escuro", "obsidiana"].forEach((th) => {
    const btn = document.getElementById(`themeBtn-${th}`);
    if (btn) {
      btn.setAttribute("aria-pressed", String(currentTheme === th));
      btn.className =
        currentTheme === th
          ? "display-choice px-1.5 py-0.5 rounded font-bold t-btn-primary shadow-sm"
          : "display-choice px-1.5 py-0.5 rounded font-semibold t-text-muted";
    }
  });

  [90, 100, 112, 125].forEach((sz) => {
    const btn = document.getElementById(`fontBtn-${sz}`);
    if (btn)
      btn.className =
        currentFontScale === sz
          ? "px-1.5 py-0.5 rounded font-extrabold t-btn-primary"
          : "px-1.5 py-0.5 rounded font-semibold t-text-muted";
  });

  // Atualiza os 3 Modos de Dados (OFF | Só Pool | Auto Ficha)
  ["off", "manual", "auto"].forEach((m) => {
    const btn = document.getElementById(`diceModeBtn-${m}`);
    if (btn)
      btn.className =
        diceMode === m
          ? "px-1.5 py-0.5 rounded font-extrabold t-btn-primary shadow-sm"
          : "px-1.5 py-0.5 rounded font-semibold t-text-muted";
  });

  const diceTray = document.getElementById("dice3dTray");
  if (diceTray) diceTray.classList.toggle("hidden", diceMode === "off");
  renderDiceTrayState();
  updatePoolDisplay();

  // A edição pública começa vazia. Não fabricar uma ficha nem habilitar
  // ações de combate/evolução antes da primeira criação pelo assistente.
  document.querySelectorAll('[onclick="shortRest()"], [onclick="longRest()"], [onclick="openLevelUpModal()"], [onclick="openShopModal()"], #btnClassic, #btnModern').forEach(button => button.disabled = !char);
  document.getElementById('charSelect').disabled = !char;
  document.getElementById('sheetDisplay').hidden = !char;
  if (!char) {
    const header = document.getElementById('headerSection');
    const draftInfo = getSavedDraftInfo();
    header.className = 't-card p-4 space-y-2.5';
    if (draftInfo) {
      header.innerHTML = `<h1 class="font-rpg text-xl font-bold t-text-accent">Personagem em andamento</h1><p>Continue a criação de <strong>${escapeHTML(draftInfo.name)}</strong>${draftInfo.summary ? ` (${escapeHTML(draftInfo.summary)})` : ''} na <strong>Etapa ${draftInfo.stepIndex + 1} de 7 · ${escapeHTML(draftInfo.stepLabel)}</strong>, ou descarte o rascunho para começar outro.</p><div class="flex flex-wrap gap-2"><button type="button" class="t-btn-primary px-4 py-2 rounded font-bold" onclick="openNewCharacterModal()">Continuar de onde parou</button><button type="button" class="t-card px-4 py-2 rounded font-bold text-rose-500 border t-border" onclick="CharacterWizard.discardDraft()">Descartar rascunho</button></div>`;
    } else {
      header.innerHTML = '<h1 class="font-rpg text-xl font-bold t-text-accent">Crie sua primeira ficha</h1><p>Comece pelo personagem que vai levar para a mesa. Confira o estado do salvamento no perfil.</p><button class="t-btn-primary px-4 py-2 rounded font-bold" onclick="openNewCharacterModal()">Criar personagem</button>';
    }
    document.getElementById('sheetViewport').innerHTML = '';
    window.SizeMotion?.refresh();
    return;
  }
  const isModern = char.preferredLayout === "modern_2024";
  document.getElementById("btnClassic").setAttribute("aria-pressed", String(!isModern));
  document.getElementById("btnModern").setAttribute("aria-pressed", String(isModern));
  document.getElementById("btnClassic").className = !isModern
    ? "display-choice px-1.5 py-0.5 rounded font-bold t-btn-primary"
    : "display-choice px-1.5 py-0.5 rounded font-semibold t-text-muted";
  document.getElementById("btnModern").className = isModern
    ? "display-choice px-1.5 py-0.5 rounded font-bold t-btn-primary"
    : "display-choice px-1.5 py-0.5 rounded font-semibold t-text-muted";

  const tabConfigs = [
    { id: "main", label: "1. Atributos & Combate", icon: "shield" },
    { id: "spells", label: "2. Grimório & Feitiçaria", icon: "flame" },
    { id: "lore", label: "3. Inventário & História", icon: "book-open" },
  ];

  tabConfigs.forEach((t) => {
    const el = document.getElementById(`tab-${t.id}`);
    el.innerHTML = `<i data-lucide="${t.icon}" class="w-4 h-4"></i> <span>${t.label}</span>`;
    el.className = currentTab === t.id
      ? "sheet-tab flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs sm:text-sm font-bold t-card-accent border-b-0 t-text-accent"
      : "sheet-tab flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs sm:text-sm font-semibold t-text-main";
    el.setAttribute("aria-pressed", String(currentTab === t.id));
  });

  renderHeader(char, isModern);

  const viewport = document.getElementById("sheetViewport");
  const sameCharacter=viewport.dataset.character===char.id && viewport.dataset.workspace===currentWorkspaceKey();
  const previousConditions=sameCharacter?viewport.querySelector('[data-rule-disclosure="conditions"]'):null;
  if (currentTab === "main") {
    viewport.innerHTML = isModern
      ? renderMainModern2024(char)
      : renderMainClassic2014(char);
  } else if (currentTab === "spells") {
    viewport.innerHTML = renderSpellsSection(char, !isModern);
  } else {
    viewport.innerHTML = renderLoreSection(char);
  }
  viewport.dataset.character=char.id;viewport.dataset.workspace=currentWorkspaceKey();
  retainConditionNodes(previousConditions,viewport);
  restoreSheetPanels();
  restoreSheetFields(inlineFields);
  document.querySelectorAll('.rule-context input,.rule-context select,.rule-inline input,.rule-inline select,[data-sheet-show-pool]').forEach(el=>{if(!canEditSheet(char))el.disabled=true;});
  document.querySelectorAll('[data-sheet-add-class],[data-sheet-remove-class],[data-sheet-circle],[data-sheet-show-pool]').forEach(el=>{el.hidden=!canConfigureSheet(char);el.disabled=!canConfigureSheet(char);});
  document.querySelectorAll('[data-sheet-armor],[data-sheet-expertise],[data-rule-ac],[data-rule-defense],[data-rule-companion="name"],[data-rule-companion="max"]').forEach(el=>el.disabled=!canConfigureSheet(char));
  document.querySelectorAll('[onclick]').forEach(el=>{
    const action=el.getAttribute('onclick')||'',configuration=/\b(?:changeAbility|toggleSave|toggleSkill|openHomebrewModal|openSpellEditor)\(/.test(action);
    if(configuration||/\b(?:toggleWornArmor|undoStep|redoStep|restoreToSessionStart|openLevelUpModal)\(/.test(action)){
      const allowed=configuration?canConfigureSheet(char):canEditSheet(char);
      if('disabled' in el)el.disabled=!allowed;el.setAttribute('aria-disabled',String(!allowed));
      if(configuration&&el.tagName==='BUTTON')el.hidden=!allowed;
      if(action.includes('openLevelUpModal'))el.title=allowed?'Evoluir personagem':'Edição bloqueada pelo mestre.';
      if(configuration&&!allowed)el.title=canEditSheet(char)?'Abra o cadeado para editar a ficha.':'Edição bloqueada pelo mestre.';
    }
  });

  if (window.lucide) window.lucide.createIcons();
  window.PanelFlow?.mount(viewport, panelPositions);
  window.SizeMotion?.refresh();
  } finally {endSheetRender();}
}

const WIZARD_STEP_LABELS = [
  "Identidade",
  "Habilidades",
  "Proficiências",
  "Classe",
  "Magias",
  "Equipamento",
  "Revisão",
];
function getSavedDraftInfo() {
  const saved = window.CharacterGuide?.loadDraft?.();
  if (!saved?.draft?.setup) return null;
  const s = saved.draft.setup;
  const name = String(s.name || "").trim() || "Personagem sem nome";
  const stepIndex = Number.isInteger(saved.step) ? Math.max(0, Math.min(6, saved.step)) : 0;
  const stepLabel = WIZARD_STEP_LABELS[stepIndex] || "Identidade";
  const className = PHB_DATA.classes[s.classId]?.name || "";
  const raceName = CharacterEngine.options?.races?.[s.raceId]?.name || "";
  const summary = [className, raceName].filter(Boolean).join(" · ");
  return { saved, name, stepIndex, stepLabel, summary, open: saved.open === true };
}
function resumeSavedDraftIfNeeded() {
  if (sheetStore.issue?.kind === "invalid" || document.body.dataset.access === "entry") return;
  const wizardEl = document.getElementById("characterWizard");
  if (wizardEl && !wizardEl.classList.contains("hidden") && !wizardEl.hidden) return;
  const info = getSavedDraftInfo();
  if (info?.open) openNewCharacterModal();
}

function renderHeader(char, isModern) {
  const totalLvl = getTotalLevel(char);
  const pb = getProfBonus(char);
  const classChips = char.classes.map((c,i)=>`<div class="sheet-class-chip ${RULES_DB.classes[c.classId]?.badgeColor||'t-inset'}"><div class="sheet-class-main">${sheetSelect(char,`classes.${i}.classId`,c.classId,`Classe ${i+1}`,Object.fromEntries(Object.entries(PHB_DATA.classes).map(([id,v])=>[id,v.name])))}<span class="sheet-class-level">Nv. ${sheetInput(char,`classes.${i}.level`,c.level,`Nível de ${RULES_DB.classes[c.classId]?.name}`,'number',{min:1,max:20})}</span><button type="button" data-sheet-remove-class="${i}" aria-label="Remover ${RULES_DB.classes[c.classId]?.name}" ${char.classes.length<2||!canConfigureSheet(char)?'disabled':''}>×</button></div><details class="sheet-class-subclass" data-sheet-section="subclass-${i}"><summary title="${escapeHTML(c.subclass||'Subclasse a escolher')}">${escapeHTML(c.subclass||'Subclasse a escolher')}</summary>${sheetSelect(char,`classes.${i}.subclassId`,c.subclassId||'',`Subclasse de ${RULES_DB.classes[c.classId]?.name}`,{'':'Livre / a escolher',...Object.fromEntries(Object.entries(PHB_DATA.classes[c.classId]?.subclasses||{}).map(([id,v])=>[id,v.name]))})}${!c.subclassId?sheetInput(char,`classes.${i}.subclass`,c.subclass,'Subclasse escrita','text',{wide:true}):''}</details></div>`).join('')+`<button type="button" data-sheet-add-class ${canConfigureSheet(char)?'':'disabled'} class="text-xs underline">+ Classe</button>`;
  const draftInfo = getSavedDraftInfo();
  const draftBanner = draftInfo
    ? `<div class="t-inset px-2.5 py-1.5 rounded-lg mb-2 flex flex-wrap items-center justify-between gap-2 text-xs" data-draft-banner><span><strong>Criação em andamento:</strong> ${escapeHTML(draftInfo.name)}${draftInfo.summary ? ` (${escapeHTML(draftInfo.summary)})` : ''} · Etapa ${draftInfo.stepIndex + 1} de 7 (${escapeHTML(draftInfo.stepLabel)})</span><div class="flex flex-wrap items-center gap-1.5"><button type="button" class="t-btn-primary px-2.5 py-1 rounded font-bold" onclick="openNewCharacterModal()">Continuar de onde parou</button><button type="button" class="t-card px-2.5 py-1 rounded font-bold text-rose-500 border t-border" onclick="CharacterWizard.discardDraft()">Descartar rascunho</button></div></div>`
    : "";

  const headerEl = document.getElementById("headerSection");
  headerEl.className = "px-3 py-2 t-card-accent";
  headerEl.dataset.editing=String(canConfigureSheet(char));
  headerEl.innerHTML = `${draftBanner}
  <div class="sheet-header-layout">
    <div class="sheet-header-person">
      <button type="button" class="portrait-edit shrink-0" data-avatar-edit="${escapeHTML(char.id)}" aria-label="Alterar imagem de ${escapeHTML(char.name)}" title="Alterar imagem do personagem">${avatarMarkup(char.avatar)}</button>
      <div class="w-full min-w-0">
        <div class="sheet-header-meta t-text-muted">D&D 5e · Jogador: ${sheetInput(char,'playerName',char.playerName,'Jogador')}${canEditSheet(char)?'':' · Edição bloqueada pelo mestre'}</div>
        <div class="sheet-header-name">
          ${sheetInput(char,'name',char.name,'Nome do personagem','text',{wide:true})}
        </div>
      </div>
      ${getSpellcastingHeader(char)?`<div class="sheet-casting-summary t-text-muted">${getSpellcastingHeader(char)}</div>`:""}
    </div>
    <div class="sheet-header-facts">
      <div class="sheet-identity-card t-inset">
        <div class="sheet-identity-label t-text-muted">${isModern ? "Espécie" : "Raça"}</div>
        <div class="sheet-identity-value">${sheetIdentity(char,'race','Raça / espécie')}</div>
      </div>
      <div class="sheet-identity-card t-inset">
        <div class="sheet-identity-label t-text-muted">Antecedente</div>
        <div class="sheet-identity-value">${sheetIdentity(char,'background','Antecedente')}</div>
      </div>
      <div class="sheet-identity-card t-inset">
        <div class="sheet-identity-label t-text-muted">Tendência</div>
        <div class="sheet-identity-value">${sheetIdentity(char,'alignment','Tendência')}</div>
      </div>
      <div class="sheet-identity-card sheet-level-card t-inset">
        <div>
          <div class="sheet-identity-label t-text-muted">Nível</div>
          <div class="sheet-identity-value t-text-accent">Nv. ${totalLvl}</div><label class="sheet-xp t-text-muted">XP ${sheetInput(char,'xp',char.xp||0,'Pontos de experiência','number',{min:0})}</label>
        </div>
        <div class="text-right">
          <div class="sheet-identity-label t-text-muted">Prof.</div>
          <div class="sheet-proficiency-value t-text-accent">+${pb}</div>
        </div>
      </div>
    </div>
    <div class="sheet-header-classes">${classChips}</div>
  </div>
`;
}

function showHomebrewError(inputId, message) {
  const error = document.getElementById("hbFormError");
  error.textContent = message;
  error.classList.remove("hidden");
  const input = document.getElementById(inputId);
  if (input) {
    input.setAttribute("aria-invalid", "true");
    input.focus();
  }
}

function getHomebrewFormState() {
  return JSON.stringify([...document.querySelectorAll("#hbModalBody input, #hbModalBody select, #hbModalBody textarea")]
    .map((input) => [input.id, input.value, input.checked]));
}

// Ponte temporária para integrações anteriores; os campos são do módulo comum.
function initWeaponDamageBuilder(formula) { weaponEditor?.setDamage(formula); }
function changeWeaponDamageDie(sides, delta) { weaponEditor?.changeDie(sides, delta); }
function clearWeaponDamageDice() { weaponEditor?.clearDice(); }
function renderWeaponDamageBuilder(modifierChanged = false) { weaponEditor?.renderDamage(modifierChanged); }

function saveCharacterCoins(values) {
  if(!requireSheetConfiguration())return;
  // Validar o conjunto inteiro antes de alterar qualquer moeda. Não converte unidades.
  const next = {};
  for (const key of Object.keys(COIN_LABELS)) {
    const raw = values[key], value = Number(raw);
    if ((typeof raw !== "string" && typeof raw !== "number") || String(raw).trim() === "" || !Number.isSafeInteger(value) || value < 0) {
      const error = new Error(`${COIN_LABELS[key]}: informe uma quantidade inteira, igual ou maior que zero.`);
      error.field = `hbCoin-${key}`; throw error;
    }
    next[key] = value;
  }
  const char = getChar();
  char.coins = { ...char.coins, ...next };
  closeHomebrewModal(true);
  recordStepAndSave("Editou as quantidades de moedas");
}
async function saveCharacterLore(values, physical = {}) {
  if(!requireSheetConfiguration())return false;
  const char = getChar(), lore = { ...char.lore }, body = { ...char.physical }, cleared = [];
  for (const [group,labels,target,previous] of [[values,LORE_LABELS,lore,char.lore || {}],[physical,PHYSICAL_LABELS,body,char.physical || {}]]) {
    for (const [key,label] of Object.entries(labels)) {
      if (!Object.hasOwn(group,key)) continue;
      if (typeof group[key] !== "string") throw new Error(`Texto inválido em ${label}.`);
      if (String(previous[key] || "").trim() && !group[key].trim()) cleared.push(label);
      target[key] = group[key];
    }
  }
  if (cleared.length && !await confirmDestructiveAction("Apagar textos preenchidos?", `Estes campos ficarão vazios: ${cleared.join(", ")}. Você poderá desfazer nesta sessão.`, "Apagar e salvar")) return false;
  if(char!==getChar()||!canConfigureSheet(char))return false;
  // Biografia pertence à ficha; nunca modifica o armazenamento das notas privadas.
  char.lore = lore; char.physical = body;
  closeHomebrewModal(true);
  recordStepAndSave("Editou crônica, personalidade e detalhes do personagem");
  return true;
}

function openHomebrewModal(type, index = null) {
  if(!requireSheetConfiguration())return;
  if (type === 'spell') return window.openSpellEditor(index);
  if(!document.getElementById('homebrewModal').classList.contains('hidden')&&homebrewInitialState!==getHomebrewFormState()){showToast('Conclua ou feche a edição já aberta na ficha.');return;}
  closeSheetPanel('homebrew');
  if(['item','coins','lore'].includes(type)&&currentTab!=='lore')setTab('lore');
  if(['weapon','feature'].includes(type)&&currentTab!=='main')setTab('main');
  const char = getChar();
  const modal = document.getElementById("homebrewModal");
  modal.dataset.editorType = type;
  const title = document.getElementById("hbModalTitle");
  const body = document.getElementById("hbModalBody");
  const saveBtn = document.getElementById("hbSaveBtn");
  const deleteBtn = document.getElementById("hbDeleteBtn");
  const e = escapeHTML;
  weaponEditor = null;
  document.getElementById("hbFormError").classList.add("hidden");
  hideBookTooltip();
  deleteBtn.classList.toggle("hidden", index === null);
  deleteBtn.onclick = () => deleteSheetEntry(type, index);
  body.oninput = (event) => {
    document.getElementById("hbFormError").classList.add("hidden");
    event.target.removeAttribute("aria-invalid");
  };

  if (type === "weapon") {
    const weapon = index !== null ? CharacterEngine.weaponStats(char, char.weapons[index]) : {
      name: "Nova Arma / Adaptação", bonus: "+0", damage: "1d6",
      dmgTypeLabel: "Customizado", notes: "", description: "",
    };
    if (!weapon) return;
    title.textContent = index !== null ? `Editar ataque: ${weapon.name}` : "Criar arma / ataque";
    weaponEditor = createWeaponFields(char,index!==null?char.weapons[index]:null,CharacterEngine,{legacyIds:true,description:BOOK_ITEMS_DB[weapon.name]?.bookDesc});
    body.replaceChildren(weaponEditor.element);
    saveBtn.onclick = () => {
      try {
        const updated=weaponEditor.read();
        if(weaponEditor.field('hbWepPact')&&updated.pactWeapon)for(const other of char.weapons)other.pactWeapon=false;
        if(index===null)char.weapons.push(updated);else char.weapons[index]=updated;
        closeHomebrewModal(true);
        recordStepAndSave(`${index===null?"Criou":"Editou"} ataque: ${updated.name} (${updated.damage})`);
      } catch(error) { showHomebrewError(error.field?.id || 'hbWepName',error.message); }
    };
  } else if (type === "item") {
    const item = index !== null ? char.inventoryItems[index] : { name: "", qty: 1, weightKg: 0, description: "" };
    if (!item) return;
    title.textContent = index !== null ? `Editar item: ${item.name}` : "Adicionar item ao inventário";
    body.innerHTML = `
      <div><label for="hbItemName" class="block font-bold mb-1">Nome do item</label><input id="hbItemName" maxlength="120" value="${e(item.name)}" class="w-full t-inset p-2 rounded-lg" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label for="hbItemQty" class="block font-bold mb-1">Quantidade</label><input id="hbItemQty" type="number" min="1" step="1" value="${e(item.qty)}" class="w-full t-inset p-2 rounded-lg" /></div>
        <div><label for="hbItemWeight" class="block font-bold mb-1">Peso unitário (kg)</label><input id="hbItemWeight" type="number" min="0" step="any" value="${e(item.weightKg)}" class="w-full t-inset p-2 rounded-lg" /></div>
      </div>
      <div><label for="hbItemDescription" class="block font-bold mb-1">Descrição ao passar o mouse ou tocar no nome</label><textarea id="hbItemDescription" rows="5" maxlength="8000" class="w-full t-inset p-2 rounded-lg">${e(item.description ?? BOOK_ITEMS_DB[item.name]?.bookDesc ?? item.notes ?? "")}</textarea></div>`;
    saveBtn.onclick = () => {
      const name = document.getElementById("hbItemName").value.trim();
      const qty = Number(document.getElementById("hbItemQty").value);
      const weightInput = document.getElementById("hbItemWeight");
      const weightKg = Number(weightInput.value);
      if (!name) return showHomebrewError("hbItemName", "Informe o nome do item.");
      if (!Number.isSafeInteger(qty) || qty < 1) return showHomebrewError("hbItemQty", "A quantidade deve ser um inteiro positivo. Para remover o item, use Excluir.");
      if (!weightInput.value.trim() || !Number.isFinite(weightKg) || weightKg < 0 || !Number.isFinite(weightKg * qty)) return showHomebrewError("hbItemWeight", "Informe um peso válido em kg, igual ou maior que zero.");
      const updated = { ...item, name, qty, weightKg, weightUnreviewed: false, description: document.getElementById("hbItemDescription").value.trim() };
      if (index === null) char.inventoryItems.push(updated);
      else char.inventoryItems[index] = updated;
      closeHomebrewModal(true);
      recordStepAndSave(`${index === null ? "Adicionou" : "Editou"} item: ${name} (${qty}x)`);
    };
  } else if (type === 'feature') {
    title.textContent=index===null?'Adicionar característica / adaptação':'Editar característica / adaptação';
    body.innerHTML=`<p>Texto livre da ficha. Os efeitos descritos aqui são controlados pela mesa; escrever uma regra não programa seu efeito.</p><label class="block font-bold">Característica<textarea id="hbFeatureText" rows="6" maxlength="16000" class="w-full t-inset p-2 rounded-lg">${e(index===null?'':readableText(char.features[index]))}</textarea></label>`;
    saveBtn.onclick=()=>{const text=document.getElementById('hbFeatureText').value.trim();if(!text)return showHomebrewError('hbFeatureText','Escreva a característica.');if(index===null)char.features.push(text);else char.features[index]=text;closeHomebrewModal(true);recordStepAndSave('Editou característica manual');};
  } else if (type === "coins") {
    title.textContent = "Editar moedas";
    body.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${Object.entries(COIN_LABELS).map(([key,label]) => `<div><label for="hbCoin-${key}" class="block font-bold mb-1">${key.toUpperCase()} · ${label}</label><input id="hbCoin-${key}" type="number" min="0" max="${Number.MAX_SAFE_INTEGER}" step="1" required value="${e(char.coins?.[key] ?? 0)}" class="w-full t-inset p-2 rounded-lg"></div>`).join("")}</div>`;
    saveBtn.onclick = () => {
      try { saveCharacterCoins(Object.fromEntries(Object.keys(COIN_LABELS).map(key => [key,document.getElementById(`hbCoin-${key}`).value]))); }
      catch (error) { showHomebrewError(error.field || "hbCoin-po",error.message); }
    };
  } else if (type === "lore") {
    title.textContent = "Editar crônica e personalidade";
    const narrative = (key,label) => `<div><label for="hbLore-${key}" class="block font-bold mb-1">${label}</label><textarea id="hbLore-${key}" rows="${key === 'backstory' ? 6 : 2}" class="w-full t-inset p-2 rounded-lg">${e(char.lore?.[key] || '')}</textarea></div>`;
    body.innerHTML = `<p class="t-text-muted">Estes textos fazem parte da ficha. Para notas só suas, use Anotações pessoais.</p>${Object.entries(LORE_LABELS).slice(0,5).map(([key,label]) => narrative(key,label)).join("")}<details><summary class="cursor-pointer font-bold">Aparência e outros detalhes</summary><div class="space-y-3 mt-3">${Object.entries(LORE_LABELS).slice(5).map(([key,label]) => narrative(key,label)).join("")}<div class="grid grid-cols-2 gap-3">${Object.entries(PHYSICAL_LABELS).map(([key,label]) => `<div><label for="hbPhysical-${key}" class="block font-bold mb-1">${label}</label><input id="hbPhysical-${key}" value="${e(char.physical?.[key] || '')}" class="w-full t-inset p-2 rounded-lg"></div>`).join("")}</div></div></details>`;
    saveBtn.onclick = async () => {
      try { await saveCharacterLore(Object.fromEntries(Object.keys(LORE_LABELS).map(key => [key,document.getElementById(`hbLore-${key}`).value])),Object.fromEntries(Object.keys(PHYSICAL_LABELS).map(key => [key,document.getElementById(`hbPhysical-${key}`).value]))); }
      catch (error) { showHomebrewError(error.field || "hbLore-backstory",error.message); }
    };
  } else return;
  const saveAction=saveBtn.onclick;
  saveBtn.onclick=event=>{if(!requireSheetConfiguration()||getChar()!==char||!canSaveSheetPanel('homebrew'))return;return saveAction?.call(saveBtn,event);};
  homebrewInitialState = getHomebrewFormState();
  modal.classList.remove("hidden");
  const parent=type==='weapon'?'[data-sheet-weapons]':type==='feature'?'[data-sheet-features]':type==='lore'?'[data-sheet-lore]':'[data-sheet-inventory]';
  const target=index===null?parent:type==='weapon'?`[data-weapon-card="${index}"]`:type==='item'?`[data-sheet-item="${index}"]`:type==='feature'?`[data-sheet-feature-row="${index}"]`:parent;
  mountSheetPanel('homebrew',modal,document.querySelector(target)?target:parent);
  if (window.lucide) window.lucide.createIcons();
}

async function deleteSheetEntry(type, index) {
  if(!requireSheetConfiguration())return;
  const char = getChar();
  const entries = type === "weapon" ? char.weapons : type === "item" ? char.inventoryItems : type === "spell" ? char.spells : type==='feature'?char.features:null;
  const entry = entries?.[index];
  if (!entry) return;
  const noun = type === "weapon" ? "ataque" : type === "item" ? "item" : type==='feature'?'característica':"magia";
  if (!await confirmDestructiveAction(`Excluir ${noun}?`, `“${entry.name || readableText(entry).slice(0,120)}” será removido desta ficha${type === "item" ? ` com toda a quantidade (${entry.qty}x)` : ""}. Você poderá desfazer nesta sessão.`, `Excluir ${noun}`)) return;
  if(getChar()!==char || entries[index]!==entry||!canConfigureSheet(char))return;
  entries.splice(index, 1);
  if (type === "spell") {
    // Remover uma magia desloca índices; descarta somente escolhas visuais de espaços.
    selectedCastLevelBySpell = {};
  }
  closeHomebrewModal(true);
  hideBookTooltip();
  recordStepAndSave(`Excluiu ${noun}: ${entry.name}`);
}

async function closeHomebrewModal(force = false) {
  if (!force && homebrewInitialState !== getHomebrewFormState() && !await confirmDestructiveAction("Descartar alterações?", "As alterações feitas neste formulário ainda não foram salvas. Descartar mantém o cadastro anterior.", "Descartar alterações")) return;
  document.getElementById("homebrewModal").classList.add("hidden");
  closeSheetPanel('homebrew');
}

function rollWeapon(index, kind) {
  if(kind==='damage' && rollPreparedWeaponDamage(getChar(),index,CharacterEngine,saveRuleStep))return;
  const c=getChar(),entry=c.weapons[index];
  const weapon = CharacterEngine.weaponStats(c, entry);
  if (!weapon) return;
  const bonus = String(weaponAttackBonus(c,entry,CharacterEngine)).trim();
  if(kind==='attack' && bonus==='')return showToast('Ataque não informado. Confira o bônus da origem; efeitos com resistência são resolvidos na mesa.');
  if (kind === "attack" && !/^[+-]?\d+$/.test(bonus)) {
    showToast("Bônus de ataque inválido. Corrija o cadastro.");
    return;
  }
  const formula = kind === "attack" ? `1d20${fmtMod(Number(bonus))}` : weapon.damage;
  if (!parseDiceFormula(formula)) {
    showToast("Fórmula inválida. Corrija o ataque antes de rolar.");
    return;
  }
  const result=triggerSheetRoll(formula, `${kind === "attack" ? "Ataque" : "Dano"}: ${weapon.name}${kind==='attack' && weaponPowerAttackPrepared(c,entry,CharacterEngine)?' · '+weaponPowerAttackOption(c,entry,CharacterEngine).name+' (–5 ataque / +10 dano)':''}`,kind==='attack',kind==='attack'?{type:'attack',weapon:entry}:null);
  // Usa o resultado resolvido neste clique, nunca o texto da animação ou o
  // total com bônus. Só ataques reais em Auto Ficha atualizam esta preparação.
  if(kind==='attack' && result && c===getChar() && c.weapons[index]===entry)
    setWeaponCriticalPrepared(c,index,CharacterEngine,result.d20Natural>=(weapon.critical || 20));
}
function setWeaponHands(index,value) {
  const entry = getChar().weapons[index]; if (!entry || !['1','2'].includes(String(value))) return;
  entry.hands = Number(value); recordStepAndSave('Mudou empunhadura da arma',true);
  document.querySelector(`[data-weapon-hands="${index}"]`)?.focus({preventScroll:true});
}

function showEquipmentTooltip(event, type, index) {
  queueBookTooltip(event,()=>{
  const stored = (type === "weapon" ? getChar().weapons : getChar().inventoryItems)[index];
  const item = type === "weapon" ? CharacterEngine.weaponStats(getChar(), stored) : stored;
  if (!item) return;
  const book = BOOK_ITEMS_DB[item.name];
  const container = document.getElementById("bookTooltipContent");
  // Conteúdo livre é texto: descrições nunca são interpretadas como HTML.
  container.replaceChildren();
  const heading = document.createElement("h3");
  heading.className = "font-rpg font-bold text-sm t-text-accent";
  heading.textContent = item.name;
  const details = document.createElement("p");
  details.className = "text-[11px] t-text-muted my-2";
  details.textContent = type === "weapon" ? `${item.damage} · ${item.dmgTypeLabel || "Dano"} · ${item.notes || book?.props || ""}` : `${item.qty}x · ${item.weightKg} kg por unidade`;
  if (type==='weapon' && item.explanation) details.textContent += '\n'+item.explanation;
  const description = document.createElement("p");
  description.className = "whitespace-pre-wrap leading-relaxed";
  description.textContent = item.description ?? book?.bookDesc ?? item.notes ?? "Sem descrição. Use o lápis para adicionar uma descrição.";
  if (!description.textContent.trim()) description.textContent = "Sem descrição. Use o lápis para adicionar uma descrição.";
  container.append(heading, details, description);
  document.getElementById("bookTooltip").classList.remove("hidden");
  positionTooltip(event);
  });
}

function spellTooltipDetails(char, spellName, classId, baseCircle, index) {
  const clsMeta =
    RULES_DB.classes[classId] || RULES_DB.classes.feiticeiro;
  const spellIndex = index ?? char.spells.findIndex((spell) => spell.name === spellName);
  const spell = char.spells[spellIndex];
  const chosenLvl = spell ? getSelectedSpellCastLevel(char, spell, spellIndex) : baseCircle;
  const numericCastLvl =
    chosenLvl === "pact" ? char.pactMagic.level : chosenLvl ?? baseCircle;
  const catalogEntry = CharacterEngine.spell(spell?.bookId || spellName);
  const cleanCatalogText = catalogEntry ? RuleTooltips.formatText(catalogEntry.text) : '';
  let bookEntry = (spell?.bookId && catalogEntry ? {
    ...BOOK_SPELLS_DB[spellName], school: catalogEntry.school,
    duration: catalogEntry.duration, materialDesc: catalogEntry.components,
    bookDesc: cleanCatalogText, upcastRule: '',
  } : spell?.customSpell ? null : BOOK_SPELLS_DB[spellName]) || (catalogEntry ? {
    school: catalogEntry.school, duration: catalogEntry.duration, materialDesc: catalogEntry.components,
    bookDesc: cleanCatalogText, upcastRule: '', calcEffect: null
  } : {
    school: `Magia de ${baseCircle}º Círculo`,
    duration: spell?.conc ? 'Concentração · conferir descrição' : 'Conferir descrição',
    materialDesc: [spell?.v?'V':'',spell?.s?'S':'',spell?.m?'M':''].filter(Boolean).join(', ') || 'Conferir descrição',
    bookDesc: spell?.notes || "Consulte a descrição desta magia.",
    upcastRule: "",
    calcEffect: null,
  });
  const detail = spell ? getSpellEffectDetails(char, spell, spellIndex) : null;
  if(spell && catalogEntry?.id==='rogar-maldicao' && !spell.customSpell && !spell.customRoll)
    bookEntry={...bookEntry,duration:spellDuration(spell,CharacterEngine,detail.level).duration};
  const scaledEffect = (detail?.twin ? detail.enhanced : detail?.base) ?? (bookEntry.calcEffect
    ? bookEntry.calcEffect(numericCastLvl, false, char, spell)
    : null);
  const defense = spell ? getSpellDefenseMeta(char, spell) : null;
  const spellStats = getSpellcastingStats(char, classId, spell);

  return {clsMeta,spell,bookEntry,scaledEffect,defense,spellStats};
}
function spellConsultReference(char,spell,index) {
  if(spell.customSpell)return {text:[
    'Magia personalizada · adaptação da mesa',
    `Tempo de conjuração: ${spell.time||'Conferir descrição'}\nAlcance: ${spell.range||'Conferir descrição'}`,
    'Duração: '+(spell.duration||(spell.conc?'Concentração · conferir duração':'Conferir descrição')),
    'Componentes: '+([spell.v?'V':'',spell.s?'S':'',spell.m?'M':''].filter(Boolean).join(', ')||'Não informados'),
    spell.customRoll?'Fórmula informada: '+spell.customRoll:'',
    spell.notes||'Sem descrição. Abra o lápis para registrar os efeitos combinados na mesa.',
  ].filter(Boolean).join('\n\n')};
  const {bookEntry,scaledEffect,defense}=spellTooltipDetails(char,spell.name,spell.classId,spell.circle,index);
  const entry=CharacterEngine.spell(spell.bookId||spell.name);
  const text=[
    bookEntry.school+(defense?' · '+defense.label:''),
    `Tempo de conjuração: ${spell.time||'Conferir descrição'}
Alcance: ${spell.range||'Conferir descrição'}`,
    `Duração: ${bookEntry.duration}
Componentes: ${bookEntry.materialDesc}`,
    scaledEffect?'Efeito atual: '+scaledEffect:'',
    entry?.sourceNote || '',
    RuleTooltips.formatText(spell.bookId||BOOK_SPELLS_DB[spell.name]?bookEntry.bookDesc:spell.notes||bookEntry.bookDesc),
    BOOK_SPELLS_DB[spell.name]&&spell.notes?'Notas da ficha: '+getSpellNotes(char,spell):'',
    bookEntry.upcastRule?'Escalonamento / Metamágica: '+bookEntry.upcastRule:'',
  ].filter(Boolean).join('\n\n');
  return {text,page:entry?.page,pdfPage:Number.isInteger(spell.pdfPage)?spell.pdfPage:entry?.pdfPage};
}
function showSpellTooltip(event, spellName, classId, baseCircle, index) {
  queueBookTooltip(event,()=>{
  const char=getChar(),{clsMeta,spell,bookEntry,scaledEffect,defense,spellStats}=spellTooltipDetails(char,spellName,classId,baseCircle,index);
  const tooltipEl = document.getElementById("bookTooltip");
  document.getElementById("bookTooltipContent").innerHTML = `
  <div class="border-b t-border pb-2">
    <div class="flex items-center justify-between gap-2">
      <span class="font-rpg font-bold text-sm t-text-accent">${escapeHTML(spellName)}</span>
      <span class="px-2 py-0.5 rounded text-[10px] font-extrabold ${clsMeta.badgeColor}">${clsMeta.name.toUpperCase()}</span>
    </div>
    <span class="text-[10px] italic t-text-muted block mt-0.5">${escapeHTML(bookEntry.school)}${defense ? ` • ${escapeHTML(defense.label)}` : spellStats && ["Ilusão Menor", "Disfarçar-se"].includes(spellName) ? ` • Investigação CD ${spellStats.dc}` : ""}</span>
  </div>
  <div class="grid grid-cols-2 gap-1.5 text-[11px] t-inset p-2 rounded">
    <div><span class="t-text-muted">Duração:</span> <strong>${escapeHTML(bookEntry.duration)}</strong></div>
    <div><span class="t-text-muted">Comp.:</span> <strong>${escapeHTML(bookEntry.materialDesc)}</strong></div>
  </div>
  ${scaledEffect ? `<div class="t-inset p-2 rounded text-[11px]"><strong class="t-text-main">Efeito Atual:</strong> ${escapeHTML(scaledEffect)}</div>` : ""}
  <p class="leading-relaxed text-[11px] whitespace-pre-wrap">${escapeHTML(spell?.bookId || BOOK_SPELLS_DB[spellName] ? bookEntry.bookDesc : spell?.notes || bookEntry.bookDesc)}</p>
  ${BOOK_SPELLS_DB[spellName] && spell?.notes ? `<p class="border-t t-border pt-2 whitespace-pre-wrap"><strong>Notas da ficha:</strong> ${escapeHTML(getSpellNotes(char, spell))}</p>` : ""}
  ${bookEntry.upcastRule ? `<div class="border-t t-border pt-1.5 text-[10px] t-text-muted"><strong>Escalonamento / Metamágica:</strong> ${escapeHTML(bookEntry.upcastRule)}</div>` : ""}
`;
  tooltipEl.classList.remove("hidden");
  positionTooltip(event);
  });
}

function positionTooltip(event, tooltipId = "bookTooltip") {
  const tooltipEl = document.getElementById(tooltipId);
  if (!tooltipEl || tooltipEl.hidden || tooltipEl.classList.contains("hidden")) return;
  const offset = 16;
  const rect = tooltipEl.getBoundingClientRect();
  const origin = event.currentTarget?.getBoundingClientRect?.();
  const x = Number.isFinite(event.clientX) ? event.clientX : origin?.left ?? 12;
  const y = Number.isFinite(event.clientY) ? event.clientY : origin?.bottom ?? 12;
  let left = x + offset;
  let top = y + offset;
  if (left + rect.width > window.innerWidth - 12)
    left = x - rect.width - offset;
  if (top + rect.height > window.innerHeight - 12)
    top = Math.max(12, window.innerHeight - rect.height - 12);
  tooltipEl.style.left = `${Math.max(12, left)}px`;
  tooltipEl.style.top = `${Math.max(12, top)}px`;
}
function queueBookTooltip(event,render) {
  clearTimeout(bookTooltipTimer);
  if(event.type==='focus'&&!event.currentTarget?.matches(':focus-visible'))return;
  hideBookTooltip();RuleTooltips.claim('bookTooltip');
  const char=getChar(),target=event.currentTarget;
  const show=()=>{if(char!==getChar()||target&&!target.isConnected)return;render();};
  if(['mouseenter','pointerenter'].includes(event.type))bookTooltipTimer=setTimeout(show,RuleTooltips.hoverDelay);
  else show();
}
function hideBookTooltip() {
  clearTimeout(bookTooltipTimer);
  document.getElementById("bookTooltip").classList.add("hidden");
}
window.addEventListener('critcall-tooltip-request',event=>{if(event.detail?.owner!=='bookTooltip')hideBookTooltip();});

function showToast(msg) {
  // Um sucesso de combate/cadastro não pode esconder a falha de gravação anterior.
  showNotice(["write", "unavailable"].includes(sheetStore.issue?.kind)
    ? "As alterações estão em memória e não foram salvas neste navegador. Baixe um backup antes de fechar."
    : msg);
}

function setSpellClassFilter(cls) {
  spellFilterClass = cls;
  renderAll();
}
function setTheme(theme) {
  currentTheme = theme;
  writePreference("dnd_sheet_theme", theme);
  renderAll();
}
function setBackdropStyle(style) {
  if (!["clean", "textured"].includes(style)) return;
  currentBackdrop = style;
  writePreference("dnd_backdrop_style", style);
  renderAll();
}
function setFontScale(scale) {
  currentFontScale = scale;
  writePreference("dnd_font_scale", String(scale));
  renderAll();
}
function togglePanel(key) {
  // Recolher um painel altera apenas a apresentação, sem modificar a ficha.
  collapsedPanels[key] = !collapsedPanels[key];
  renderAll();
}
function toggleAllPanels(collapsed) {
  const keys = [
    "sorcery_top", "combat_box", "weapons_box", "features_box",
    ...Array.from({ length: 10 }, (_, lvl) => `circle_${lvl}`),
    ...Object.keys(collapsedPanels),
  ];
  keys.forEach((key) => (collapsedPanels[key] = collapsed));
  renderAll();
}
function toggleSingleSpellExpand(name) {
  expandedSingleSpells[name] = !expandedSingleSpells[name];
  renderAll();
}
function toggleSpellTwinned(name) {
  twinnedActiveBySpell[name] = !twinnedActiveBySpell[name];
  renderAll();
}
function setLayout(mode) {
  // A preferência visual é salva, mas não cria um passo no histórico da ficha.
  if (!["classic_2014", "modern_2024"].includes(mode) || !getChar() || getChar().preferredLayout === mode) return;
  getChar().preferredLayout = mode;
  saveStateQuiet();
}
function setTab(tab) {
  hideBookTooltip();
  currentTab = tab;
  renderAll();
}
function switchCharacter(idx) {
  hideBookTooltip();
  clearPendingD20();
  activeCharIndex = parseInt(idx, 10);
  restoreSavedHistory();
  renderAll();
}
function updateField(field, value) {
  if(!requireSheetConfiguration())return;
  getChar()[field] = value;
  recordStepAndSave(`Alterou ${field} para "${value}"`);
}
function changeAbility(key, delta) {
  if(!requireSheetConfiguration())return;
  const char = getChar();
  changePermanentAbility(char,key,delta);
  recordStepAndSave(
    `Atributo ${RULES_DB.abilities[key].name}: ${char.abilities[key].score}`,
  );
}
function toggleSave(key) {
  if(!requireSheetConfiguration())return;
  getChar().abilities[key].saveProf = !getChar().abilities[key].saveProf;
  recordStepAndSave(`Salvaguarda de ${RULES_DB.abilities[key].name}`);
}
function toggleSkill(id) {
  if(!requireSheetConfiguration())return;
  const char = getChar();
  const idx = char.skillsProf.indexOf(id);
  if (idx === -1) char.skillsProf.push(id);
  else char.skillsProf.splice(idx, 1);
  recordStepAndSave(`Perícia ${id}`);
}
function changeHp(delta) {
  const char = getChar();
  // Livro, p. 200: dano consome PV temporários antes dos PV reais.
  // Cura altera somente PV reais; não recompõe a reserva temporária.
  let result;
  try {
    if(delta<0) {if(offerSurvivalForDamage(char,-delta))return;result=applyDamage(char,-delta);}
    else healHitPoints(char,delta);
  }
  catch(error) { showToast(error.message);return; }
  if (char.hpTemp === 0) char.hpTempSource = "";
  saveRuleStep(delta<0?damageDescription(char,result,-delta):`Recebeu ${delta} de cura · PV: ${char.hpCurrent}/${exhaustion(char).hpMax} · temporários: ${char.hpTemp}`);
}

function getFiendBlessingAmount(char) {
  const warlock = char.classes.find((cls) => cls.classId === "bruxo" && /corruptor|fiend/i.test(cls.subclass));
  // Livro, p. 60: Bênção do Obscuro = CAR + nível de bruxo, mínimo 1.
  return warlock ? Math.max(1, getMod(char.abilities.cha.score) + warlock.level) : 0;
}

async function grantTemporaryHp(amount, source = "Valor informado") {
  if (!Number.isSafeInteger(amount) || amount < 1) {
    showToast("Informe uma quantidade inteira e positiva de PV temporários.");
    return false;
  }
  const char = getChar();
  // Não há teto baseado nos PV máximos. Cada efeito define a quantidade.
  // Mesmo uma oferta menor pode ser escolhida: fontes/durações podem diferir.
  if (char.hpTemp > 0 && !await confirmDestructiveAction("Escolher PV temporários", `Você tem ${char.hpTemp} PV temporários${char.hpTempSource ? ` de ${char.hpTempSource}` : ""}.\nReceber ${amount} de ${source} substitui a reserva atual, sem somar. Cancelar mantém os atuais.`, `Receber ${amount} PV temporários`)) return false;
  char.hpTemp = amount;
  char.hpTempSource = source;
  recordStepAndSave(`Recebeu ${amount} PV temporários · ${source}`);
  return true;
}

function receiveTemporaryHpFromInput() {
  const input = document.getElementById("temporaryHpInput");
  if (input && input.reportValidity()) return grantTemporaryHp(Number(input.value));
}

async function clearTemporaryHp() {
  const char = getChar();
  if (char.hpTemp <= 0 || !await confirmDestructiveAction("Remover PV temporários?", `A reserva de ${char.hpTemp} PV temporários será zerada. Seus PV normais não serão alterados.`, "Remover reserva")) return;
  char.hpTemp = 0;
  char.hpTempSource = "";
  recordStepAndSave("Removeu a reserva de PV temporários");
}
function togglePactSlot(index = 0) {
  const pm = getChar().pactMagic;
  if (!Number.isInteger(index) || index < 0 || index >= pm.total) return;
  // Os disponíveis ficam à esquerda. Um clique gasta/recupera só um espaço,
  // mesmo depois de os losangos se agruparem novamente nessa direção.
  const available = pm.total - pm.used;
  pm.used += index < available ? 1 : -1;
  recordStepAndSave(`Slot de Pacto: ${pm.total - pm.used}/${pm.total}`);
}
function toggleStandardSlot(lvl, idx) {
  const sl = getChar().standardSlots[lvl];
  if (!sl || !Number.isInteger(idx) || idx < 0 || idx >= sl.total) return;
  const available = sl.total - sl.used;
  sl.used += idx < available ? 1 : -1;
  recordStepAndSave(`Slot ${lvl}º Círculo (${sl.used}/${sl.total})`);
}
function changeSorceryPoints(delta) {
  const char = getChar();
  char.sorceryPoints.current = Math.max(
    0,
    Math.min(char.sorceryPoints.max, char.sorceryPoints.current + delta),
  );
  recordStepAndSave(
    `Pontos de Feitiçaria: ${char.sorceryPoints.current}/${char.sorceryPoints.max}`,
  );
}
function useMetamagicOrWild(name, cost) {
  const char = getChar();
  if (char.sorceryPoints.current < cost) {
    showToast(`Pontos de Feitiçaria insuficientes.`);
    return;
  }
  char.sorceryPoints.current -= cost;
  recordStepAndSave(`Usou ${name} (-${cost} pt)`);
  showToast(`${name} ativada!`);
  return true;
}
function convertSlotToSorceryPoints(circle) {
  const char = getChar();
  const slot = char.standardSlots[circle];
  if (!slot || slot.used >= slot.total) {
    showToast(`Sem espaços livres de ${circle}º Círculo.`);
    return;
  }
  if (char.sorceryPoints.current + circle > char.sorceryPoints.max) return showToast('Use pontos antes de converter: a reserva não pode ultrapassar o máximo.');
  slot.used += 1;
  char.sorceryPoints.current = Math.min(
    char.sorceryPoints.max,
    char.sorceryPoints.current + circle,
  );
  recordStepAndSave(`Quebrou Slot ${circle}º Nv em +${circle} pt`);
}
function createSlotWithSorceryPoints(circle, cost) {
  const char = getChar();
  if (cost !== [0,2,3,5,6,7][circle] || circle < 1 || circle > 5) return;
  if (char.sorceryPoints.current < cost) {
    showToast(`Precisa de ${cost} pts.`);
    return;
  }
  char.sorceryPoints.current -= cost;
  // Fonte de Magia cria um espaço adicional; não transforma um espaço
  // gasto em permanente. Os criados desaparecem ao terminar descanso longo.
  const slot = char.standardSlots[circle] ||= {total:0,used:0};
  slot.total += 1;
  slot.created = (slot.created || 0) + 1;
  recordStepAndSave(`Criou Slot ${circle}º Nv (-${cost} pts)`);
}
function triggerBencaoChamasNegras() {
  const amount = getFiendBlessingAmount(getChar());
  if (amount) return grantTemporaryHp(amount, "Bênção do Obscuro");
}
function toggleMageArmor() {
  const char = getChar();
  char.mageArmorActive = !char.mageArmorActive;
  recordStepAndSave(
    `Armadura Arcana: ${char.mageArmorActive ? "Ativa" : "Inativa"}`,
  );
}
function setSpellCastLevel(spellName, levelValue) {
  const index = getChar().spells.findIndex((spell) => spell.name === spellName);
  if (index >= 0) setSpellCastLevelByIndex(index, levelValue);
}

// A recursão após confirmar refaz todas as validações de recursos. O caminho
// sem troca continua síncrono para preservar os eventos da ficha anterior.
function deferConcentrationReplacement(char,spell,index,ritual,confirmedId,resume) {
  const castLevel=ritual?spell.circle:getSpellEffectDetails(char,spell,index).level;
  const info=spellConcentration(char,spell,CharacterEngine,ritual,castLevel);
  if(!(info.held || info.prolonged))return false;
  const blocked=concentrationBlock(char);if(blocked){showToast(blocked);return true;}
  if(info.held)try{validateConcentrationStart(char,info);}catch(error){showToast(error.message);return true;}
  const old=concentration(char);
  if(!needsConcentrationConfirmation(char,spell,CharacterEngine,ritual,castLevel) || old.id===confirmedId)return false;
  const snapshot=JSON.stringify(spell),choice=getSelectedSpellCastLevel(char,spell,index),twinned=characterHasTwinned(char) && !!twinnedActiveBySpell[spell.name];
  void confirmDestructiveAction('Trocar concentração?',`${spell.name}${ritual?' como ritual':''} exige concentração${!info.held?' durante a conjuração':''} e encerra ${old.name}. Recursos só serão gastos após confirmar.`,'Conjurar e substituir').then(ok=>{
    if(!ok || getChar()!==char || char.spells[index]!==spell || concentration(char)?.id!==old.id)return;
    if(JSON.stringify(spell)!==snapshot || getSelectedSpellCastLevel(char,spell,index)!==choice || (characterHasTwinned(char) && !!twinnedActiveBySpell[spell.name])!==twinned)return showToast('As escolhas mudaram. Confira a magia e tente novamente; nenhum recurso foi gasto.');
    resume(old.id);
  });
  return true;
}
function castSpellWithUpcast(
  spellName,
  baseCircle,
  classId,
  globalSpellIdx,
  confirmedId = null,
) {
  // Só Pool deixa a resolução na bandeja/mesa. O bloqueio antecede qualquer
  // validação com diálogo, gasto, concentração, passivo ou registro no histórico,
  // inclusive quando uma confirmação antiga retorna após a troca de modo.
  if(diceMode==='manual')return;
  const char = getChar();
  const spObj = char.spells[globalSpellIdx];
  if (!spObj) return;
  if (!canCastNormally(char,spObj,CharacterEngine)) return showToast(castingRestriction(char,CharacterEngine,spObj) || 'Prepare esta magia antes de conjurá-la com espaço; rituais usam a ação Ritual.');
  if (spObj.limitedUse && (spObj.usesUsed || 0) >= spObj.limitedUse) return showToast('Os usos desta habilidade estão esgotados.');
  const chosen = getSelectedSpellCastLevel(char, spObj, globalSpellIdx);
  const effect = getSpellEffectDetails(char,spObj,globalSpellIdx);
  const numericCastLvl = effect.level;
  const isTwinned = effect.twin;
  const twinPtCost = isTwinned
    ? baseCircle === 0
      ? 1
      : numericCastLvl
    : 0;

  if (isTwinned && char.sorceryPoints.current < twinPtCost) {
    showToast(
      `Precisa de ${twinPtCost} Ponto(s) de Feitiçaria para usar Magia Gêmea!`,
    );
    return;
  }

  if (effect.formula && !parseDiceFormula(effect.formula)) {
    showToast(spObj.customRoll?"A fórmula personalizada desta magia é inválida. Corrija-a antes de conjurar; nenhum recurso foi gasto.":"Não foi possível montar uma rolagem válida para esta magia. Nenhum recurso foi gasto; confira a descrição.");
    return;
  }

  if(baseCircle>0 && !spObj.ritual && !spObj.limitedUse && !spObj.atWill) {
    const available=getSpellSlotOptions(char,spObj).find(x=>x.value===chosen);
    if(!available || available.remaining<=0)return showToast('O espaço selecionado está indisponível; nenhum recurso foi gasto.');
  }
  if(deferConcentrationReplacement(char,spObj,globalSpellIdx,false,confirmedId,id=>castSpellWithUpcast(spellName,baseCircle,classId,globalSpellIdx,id)))return;

  if (baseCircle > 0 && !spObj.ritual && !spObj.limitedUse && !spObj.atWill) {
    const option = getSpellSlotOptions(char, spObj).find((entry) => entry.value === chosen);
    if (!option || option.remaining <= 0) {
      showToast("O espaço selecionado está indisponível. Escolha outra origem ou nível no seletor; nenhum recurso foi gasto.");
      return;
    }
    if (chosen === 'signature') {
      char.ruleState ||= {};char.ruleState.used ||= {};
      char.ruleState.used['mago:signature:'+wizardPrivilege(char,spObj,CharacterEngine).id]=1;
    } else if(chosen === 'mastery') {
      // O círculo mínimo é gratuito; espaços superiores continuam sendo opções.
    } else if (chosen === "pact") {
      if (char.pactMagic.used >= char.pactMagic.total) {
        showToast("Slot de Pacto já usado!");
        return;
      }
      char.pactMagic.used += 1;
    } else {
      const slotObj = char.standardSlots[numericCastLvl];
      if (!slotObj || slotObj.used >= slotObj.total) {
        showToast(`Sem espaços livres de ${numericCastLvl}º Círculo!`);
        return;
      }
      slotObj.used += 1;
    }
  }

  if (isTwinned) char.sorceryPoints.current -= twinPtCost;
  if (spObj.limitedUse) spObj.usesUsed = (spObj.usesUsed || 0) + 1;
  if (!spObj.customSpell && spellName === "Armadura Arcana") char.mageArmorActive = true;
  applyCastConcentration(char,spObj,CharacterEngine,false,numericCastLvl);
  onSpellCast(char,spObj,numericCastLvl,CharacterEngine);

  const formulaToRoll = effect.formula;
  if (formulaToRoll) {
    triggerSheetRoll(
      formulaToRoll,
      `${spellName}${effect.perRay?' · dano de um raio/feixe':''}${isTwinned ? " (⚡ Gêmea)" : ""}`,
      false,
      effect.affinity || effect.evocation || effect.components?.length?{type:'damage',spellComponents:effect.components}:null,
    );
  }

  const eff = effect.summary;
  const source = baseCircle === 0 ? "truque, sem espaço" : spObj.ritual ? "ritual, sem espaço" : spObj.limitedUse ? '-1 uso da habilidade, sem espaço' : spObj.atWill ? 'habilidade, sem espaço' : chosen==='mastery'?'Dominar Magia, sem espaço':chosen==='signature'?'Assinatura Mágica · -1 uso, sem espaço':`-1 espaço de ${chosen === "pact" ? "Pacto" : "Conjuração"} do ${numericCastLvl}º círculo`;
  const actionMsg = `Conjurou ${spellName} (${source})${isTwinned ? ` + Gêmea (-${twinPtCost} pt de feitiçaria)` : ""}`;
  recordStepAndSave(actionMsg);
  showToast(`✨ ${actionMsg}! ${eff ? `➔ ${eff}` : ""}`);
}

function shortRest() {
  if (Number(getChar().exhaustion)>=6) return showToast('Exaustão 6 significa morte; um descanso não revive o personagem.');
  if (deathStatus(getChar()).dead) return showToast('Um descanso não revive o personagem.');
  if (!takeRest(getChar(),'short',CharacterEngine)) { recordStepAndSave('Frenesi terminou com exaustão 6',true); return showToast('Frenesi levou à exaustão 6. O personagem morreu antes de concluir o descanso.'); }
  recordStepAndSave("⛺ Descanso Curto");
  showToast("Descanso Curto concluído!");
}

async function longRest() {
  // A recuperação integral dos Dados de Vida exige escolha explícita da mesa.
  const char = getChar();
  const before=JSON.stringify(char);
  if (Number(char.exhaustion)>=6) return showToast('Exaustão 6 significa morte; um descanso não revive o personagem.');
  if (deathStatus(char).dead) return showToast('Um descanso não revive o personagem.');
  if(char.hpCurrent<1) return showToast('O descanso longo exige pelo menos 1 PV no início.');
  const choices = document.createElement('div');
  choices.innerHTML = '<label><input type="checkbox" data-rest-food checked> Teve alimento e bebida (reduz 1 exaustão)</label><br><label><input type="checkbox" data-rest-table> Recuperar todos os Dados de Vida (adaptação da mesa)</label>';
  if(concentration(char))choices.insertAdjacentHTML('beforeend','<br><label><input type="checkbox" data-rest-sleep checked> Dormiu ou ficou inconsciente (encerra concentração)</label><p>Se permaneceu consciente por uma exceção, desmarque e confira a duração do efeito na mesa.</p>');
  if (!await confirmDestructiveAction('Concluir descanso longo?', 'Recupera PV e recursos conforme o livro. Dados de Vida: até metade do nível total; escolha quais recuperar depois. PV temporários serão removidos.', 'Concluir descanso', choices)) return;
  if (getChar() !== char) return;
  const count=resourcesFor(char,CharacterEngine).find(r=>r.kind==='portent')?.max;
  const portent=count?await chooseResourceDice(char,'Presságio · descanso longo',20,count):undefined;
  if(count && !portent)return;
  if(getChar()!==char || JSON.stringify(char)!==before)return showToast('A ficha mudou. Confira antes de concluir o descanso.');
  if (!takeRest(char,'long',CharacterEngine,{foodAndWater:choices.querySelector('[data-rest-food]').checked,tableHitDice:choices.querySelector('[data-rest-table]').checked,slept:choices.querySelector('[data-rest-sleep]')?.checked ?? true,portent})) { recordStepAndSave('Frenesi terminou com exaustão 6',true); return showToast('Frenesi levou à exaustão 6. O personagem morreu antes de concluir o descanso.'); }
  recordStepAndSave('Descanso longo · PV, recursos e preparação',true);
  showToast('Descanso concluído. Preparação no grimório; recuperação de Dados de Vida junto aos PV.');
}

function openShopModal() {
  if(!requireSheetEdit())return;
  renderShopItems();
  document.getElementById("shopModal").classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}
function closeShopModal() {
  document.getElementById("shopModal").classList.add("hidden");
}

function renderShopItems() {
  const char = getChar();
  const cat = document.getElementById("shopCategoryFilter").value;
  const query = document
    .getElementById("shopSearchInput")
    .value.toLowerCase();

  document.getElementById("shopWalletDisplay").innerHTML = Object.entries(
    char.coins,
  )
    .map(
      ([k, v]) =>
        `<span class="px-2 py-0.5 rounded t-card t-text-accent">${escapeHTML(v)} ${escapeHTML(k.toUpperCase())}</span>`,
    )
    .join("");

  const filtered = SHOP_CATALOG.filter(
    (item) =>
      (cat === "all" || item.category === cat) &&
      item.name.toLowerCase().includes(query),
  );
  const totalPC = getTotalWealthInPC(char.coins);

  document.getElementById("shopItemsContainer").innerHTML = filtered
    .map((item) => {
      const itemCostPC = item.costQty * COIN_RATES_IN_PC[item.costCoin];
      const canAfford = totalPC >= itemCostPC;
      return `
    <div class="t-inset p-3 rounded-xl flex items-center justify-between gap-3">
      <div>
        <span class="font-bold text-sm block">${item.name}</span>
        <span class="text-[11px] t-text-muted">${item.category} • ${item.weightKg} kg</span>
      </div>
      <div class="text-right shrink-0">
        <div class="text-xs font-extrabold t-text-accent mb-1">${item.costQty} ${item.costCoin.toUpperCase()}</div>
        <button onclick="buyItem('${item.id}')" ${!canAfford ? "disabled" : ""} class="px-3 py-1 rounded text-xs font-extrabold ${canAfford ? "t-btn-primary" : "t-card opacity-50"}">
          ${canAfford ? "Comprar" : "Sem Saldo"}
        </button>
      </div>
    </div>
  `;
    })
    .join("");
}

function buyItem(itemId) {
  if(!requireSheetEdit())return;
  const char = getChar();
  const item = SHOP_CATALOG.find((i) => i.id === itemId);
  if (!item || !deductCoinsSmart(char.coins, item.costQty, item.costCoin))
    return;
  const existing = char.inventoryItems.find((i) => i.name === item.name);
  if (existing) existing.qty += 1;
  else
    char.inventoryItems.push({
      name: item.name,
      qty: 1,
      weightKg: item.weightKg,
    });
  recordStepAndSave(`Comprou ${item.name}`);
  renderShopItems();
}

function openLevelUpModal() {
  if(!requireSheetEdit())return;
  CharacterWizard.openLevel();
}
function closeLevelUpModal() { return CharacterWizard.close(); }

// Compatibilidade temporária com os eventos dos cartões e assistentes existentes.
// A interface migra por módulos; os cálculos permanecem no motor testado.
Object.assign(window, {
  applyImportedCharacters,
  escapeHTML,
  confirmDestructiveAction,
  ruleDiceSettings,
  rollRuleDie,
  resolveRuleD20,
  pendingRuleD20Label,
  presentRuleDiceResult:presentDiceResult,
  rollWeaponFormula,
  parseDiceFormula,
  getChar,
  loadHistoryState,
  getMod,
  fmtMod,
  getTotalLevel,
  getProfBonus,
  getCantripDiceCount,
  getSpellcastingStats,
  getSpellcastingHeader,
  getMageArmorAC,
  getSpellDefenseMeta,
  getSpellNotes,
  getSkillBonus,
  getCalculatedAC,
  getArmorExplanation,
  getCurrentLoadKg,
  recordStepAndSave,
  saveStateQuiet,
  undoStep,
  redoStep,
  jumpToHistoryStep,
  saveNamedCheckpoint,
  restoreToSessionStart,
  toggleHistoryDrawer,
  renderHistoryDrawerList,
  restoreDeletedCharacter,
  setDiceMode,
  setRollMode,
  readDiceTrayDimensions,
  boundDiceTrayDimensions,
  setDiceTrayDimensions,
  toggleDiceTrayMinimized,
  startDiceTrayResize,
  resizeDiceTrayByKeyboard,
  renderDiceTrayState,
  addDieToPool,
  clearDicePool,
  updatePoolDisplay,
  evaluateDicePool,
  rollCurrentPool,
  rerollHalflingD20,
  useLuckyD20,
  chooseLuckyD20,
  rollQuickD20,
  triggerSheetRoll,
  openAuthAccountModal,
  closeAuthAccountModal,
  hasOpenAccountEditor,
  activateAccountWorkspace,
  saveAccountProfile,
  renderAccountCharactersList,
  deleteCharacter,
  openNewCharacterModal,
  closeNewCharacterModal,
  commitCreatedCharacter,
  commitLeveledCharacter,
  getSpellSlotOptions,
  getSelectedSpellCastLevel,
  renderSpellCastControls,
  getSpellEffectDetails,
  renderSpellEffectDetails,
  rollSpellAttack,
  setSpellCastLevelByIndex,
  castSpellByIndex,
  rollSpellRay,
  canCastRitual,
  castRitualByIndex,
  toggleSpellTwinnedByIndex,
  toggleSingleSpellExpandByIndex,
  showSpellTooltipByIndex,
  renderExpandedSpellCard,
  renderSpellSlotButton,
  buildSingleCirclePanelHtml,
  isSpellVisible,
  renderSpellsSection,
  selectedMetamagic,
  characterHasTwinned,
  renderSorceryCollapsiblePanel,
  renderPactMagicPanel,
  renderSpellsToolbar,
  renderMainClassic2014,
  renderMainModern2024,
  renderCombatBlock,
  renderAttacksBlock,
  renderFeaturesCollapsible,
  readPrivateNotes,
  savePrivateNotes,
  clearPrivateNotes,
  renderPrivateNotes,
  toggleWornArmor,
  renderLoreSection,
  renderAll,
  setWeaponHands,
  renderHeader,
  showHomebrewError,
  getHomebrewFormState,
  initWeaponDamageBuilder,
  changeWeaponDamageDie,
  clearWeaponDamageDice,
  renderWeaponDamageBuilder,
  saveCharacterCoins,
  saveCharacterLore,
  openHomebrewModal,
  deleteSheetEntry,
  closeHomebrewModal,
  rollWeapon,
  showEquipmentTooltip,
  showSpellTooltip,
  positionTooltip,
  hideBookTooltip,
  showToast,
  setSpellClassFilter,
  setTheme,
  setBackdropStyle,
  setFontScale,
  togglePanel,
  toggleAllPanels,
  toggleSingleSpellExpand,
  toggleSpellTwinned,
  setLayout,
  setTab,
  switchCharacter,
  updateField,
  changeAbility,
  toggleSave,
  toggleSkill,
  changeHp,
  getFiendBlessingAmount,
  grantTemporaryHp,
  receiveTemporaryHpFromInput,
  clearTemporaryHp,
  togglePactSlot,
  toggleStandardSlot,
  changeSorceryPoints,
  useMetamagicOrWild,
  convertSlotToSorceryPoints,
  createSlotWithSorceryPoints,
  triggerBencaoChamasNegras,
  toggleMageArmor,
  setSpellCastLevel,
  castSpellWithUpcast,
  shortRest,
  longRest,
  openShopModal,
  closeShopModal,
  renderShopItems,
  buyItem,
  openLevelUpModal,
  closeLevelUpModal,
  getSavedDraftInfo,
  resumeSavedDraftIfNeeded
});
Object.defineProperty(window, 'characters', { get: () => characters, configurable: true });

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || event.defaultPrevented || document.getElementById("confirmationDialog").open) return;
  hideBookTooltip();
  if (!document.getElementById("homebrewModal").classList.contains("hidden")) closeHomebrewModal();
});

diceDock = setupDiceDock(rollQuickD20, toggleDiceTrayMinimized);
window.addEventListener("resize", renderDiceTrayState);
const savedPlayer = readPreference('dnd_public_player_name') || 'Jogador';
document.getElementById('currentUserBadge').textContent = savedPlayer;
document.getElementById('accPlayerName').value = savedPlayer;
document.getElementById('accPlayerName').addEventListener('input', () => saveAccountProfile(true));
restoreSavedHistory();
renderAll();
