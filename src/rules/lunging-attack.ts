import {active,type Engine,type Sheet} from './model';
import {weaponStats} from './combat';
import {incapacityReason} from './concentration';
import {maneuverTraining} from './maneuvers';
import {superiorityOptions} from './superiority';
import {spend} from './resources';
import {beginWeaponAttack} from './weapon-attack-session';
import {parseDiceFormula} from './dice-formula';

export function lungingAttackOption(c:Sheet,entry:Sheet,E:Engine) {
  if(!entry || !c.weapons?.includes(entry) || active(c,'druida:wildShape') || !maneuverTraining(c,E).known.has('ataque estendido'))return null;
  const w=weaponStats(c,entry,E);
  if(!w.ruleWeapon || w.calculationMode==='manual' || !w.meleeAttack || entry.attackMode==='thrown' || !w.weaponDie || w.weaponDie==='0')return null;
  return {w,reachBonus:1.5};
}
export interface LungingChoice {source:string;ownTurn:boolean;newAttack:boolean}
/** PHB 2014, Lunging Attack, p. 74: declarado ao fazer o ataque no próprio
 * turno. O custo vem antes de saber o acerto; a face só entra no dano se atingir. */
export function previewLungingAttack(c:Sheet,entry:Sheet,choice:LungingChoice,E:Engine) {
  for(const record of [c.ruleState,c.ruleState?.used])if(record!=null && (typeof record!=='object' || Array.isArray(record)))throw new Error('Registro de superioridade ilegível preservado; confira os usos.');
  const option=lungingAttackOption(c,entry,E);
  if(!option || incapacityReason(c))throw new Error('Ataque Estendido exige a manobra conhecida e poder atacar corpo a corpo com esta arma reconhecida.');
  const bonus=String(option.w.bonus);
  if(!/^[+-]?\d+$/.test(bonus) || !parseDiceFormula(`1d20${Number(bonus)>=0?'+':''}${Number(bonus)}`) || !parseDiceFormula(option.w.damage))throw new Error('Confira bônus e dano da arma antes de gastar o dado.');
  if(choice.ownTurn!==true || choice.newAttack!==true)throw new Error('Confirme um novo ataque no seu turno, ainda não rolado/resolvido e sem outra manobra.');
  const source=superiorityOptions(c,E).find(s=>s.id===choice.source);
  if(!source)throw new Error('Escolha uma origem de superioridade vigente.');
  const raw=c.ruleState?.used?.[source.id],used=raw===undefined?0:raw;
  if(!Number.isSafeInteger(used) || used<0 || !Number.isSafeInteger(source.resource.max) || source.resource.max<0 || used>source.resource.max)throw new Error('Registro de superioridade ilegível ou fora do máximo preservado; confira os usos.');
  if(source.remaining<1)throw new Error('A origem de superioridade está esgotada.');
  return {...option,source};
}
export function commitLungingAttack(c:Sheet,entry:Sheet,choice:LungingChoice,E:Engine) {
  const plan=previewLungingAttack(c,entry,choice,E);
  spend(c,plan.source.resource);
  return beginWeaponAttack(c,entry,{source:plan.source.id,name:plan.source.name,die:plan.source.die});
}
