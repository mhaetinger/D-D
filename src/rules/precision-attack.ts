import {active,type Engine,type Sheet} from './model';
import {weaponStats} from './combat';
import {incapacityReason} from './concentration';
import {maneuverTraining} from './maneuvers';
import {superiorityOptions} from './superiority';
import {addPrecisionDie,type DiceResult} from './dice-roll';
import {spend} from './resources';

export interface PrecisionChoice {source:string;unresolved:boolean;noOtherManeuver:boolean}
export function precisionAttackOptions(c:Sheet,entry:Sheet,result:DiceResult,E:Engine) {
  if(!entry || !c.weapons?.includes(entry) || incapacityReason(c) || active(c,'druida:wildShape') || result.precision ||
    result.d20Natural===null || result.groups.length!==1 || result.groups[0].sides!==20 || result.groups[0].faces.length!==(result.appliedMode==='normal'?1:2) ||
    !maneuverTraining(c,E).known.has('ataque de precisao'))return [];
  const weapon=weaponStats(c,entry,E);
  if(!weapon.ruleWeapon || weapon.calculationMode==='manual')return [];
  return superiorityOptions(c,E);
}
export function previewPrecisionAttack(c:Sheet,entry:Sheet,result:DiceResult,choice:PrecisionChoice,E:Engine) {
  const source=precisionAttackOptions(c,entry,result,E).find(s=>s.id===choice?.source);
  if(!source)throw new Error('Precisão exige um ataque de arma reconhecido, manobra conhecida e origem de superioridade disponível.');
  if(!source.readable)throw new Error('Registro de superioridade ilegível preservado. Confira seus usos.');
  if(source.remaining<1)throw new Error('A origem de superioridade está esgotada. Nenhum dado foi gasto.');
  if(choice.unresolved!==true || choice.noOtherManeuver!==true)throw new Error('Confirme que o ataque ainda não foi resolvido e nenhuma outra manobra foi usada nele.');
  return source;
}
/** Valida a face antes do gasto. Não decide acerto/erro: 1/20 naturais e o
 * intervalo de crítico da arma continuam usando o d20, nunca o total aumentado. */
export function commitPrecisionAttack(c:Sheet,entry:Sheet,result:DiceResult,choice:PrecisionChoice,face:number,E:Engine) {
  const source=previewPrecisionAttack(c,entry,result,choice,E);
  const next=addPrecisionDie(result,{face,sides:source.die,source:source.name});
  spend(c,source.resource);return next;
}
