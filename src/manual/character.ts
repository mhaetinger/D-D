import {emptyImportedCharacter} from '../import/character-review';
import type {Sheet} from '../rules/model';

/** Livre nas escolhas do personagem, dentro do contrato técnico da ficha:
 * atributos 0–30, classes do catálogo e nível total até 20. Não cria escolhas,
 * equipamentos ou magias pelo livro e não preenche reservas pela classe. */
export function manualCharacter(playerName='',preferredLayout='classic_2014'):Sheet {
  const c=emptyImportedCharacter();
  c.id='manual_'+crypto.randomUUID();c.playerName=playerName;c.preferredLayout=preferredLayout;
  c.hpMax=c.hpCurrent=1;c.speed=9;c.acFormula='legacy';
  c.armorProficiencies=[];
  for(const a of Object.values(c.abilities) as Sheet[])a.score=10;
  c.classes=[{classId:'',level:1,subclass:'',subclassId:'',hitDie:6,hitDiceUsed:0}];
  c.rules.manualMode=true;
  return c;
}

/** Não remove escolhas anteriores ao passar a preenchimento livre. Os
 * cálculos/efeitos de jogo continuam disponíveis; evolução vira edição direta. */
export function markManual(c:Sheet):void {
  c.rules ||= {history:[]};c.rules.manualMode=true;c.rules.legacy=true;
}
