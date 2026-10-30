import {weaponStats} from './combat';
import {active,type Engine,type Sheet} from './model';
import {incapacityReason} from './concentration';
import {maneuverTraining} from './maneuvers';
import {superiorityOptions} from './superiority';
import {attackHasManeuver,currentWeaponAttack} from './weapon-attack-session';

export interface SweepingChoice {target:string;declared:boolean;wouldHit:boolean}
export const sweepingAttackDefinition={id:'sweeping',name:'Ataque Trespassante',save:null,effect:'Outra criatura a até 1,5 m do alvo original e dentro do seu alcance. Se a mesma jogada atingiria essa criatura, ela recebe somente um dado de superioridade, do tipo da arma. Sem novo ataque, CD ou bônus de dano.'} as const;
/** O controle integrado usa uma arma reconhecida, corpo a corpo e com dano.
 * Ataques personalizados/Forma Selvagem continuam resolvidos na mesa. Isso é
 * um limite do controle, não uma restrição adicional da manobra de 2014. */
export function sweepingAttackOption(c:Sheet,entry:Sheet,E:Engine) {
  const w=weaponStats(c,entry,E);
  return maneuverTraining(c,E).known.has('ataque trespassante') && !!w.ruleWeapon && w.calculationMode!=='manual' && !!w.meleeAttack && entry.attackMode!=='thrown' && !!w.weaponDie && w.weaponDie!=='0';
}
/** PHB 2014, p. 88 / PDF 87: o segundo alvo recebe o número de UM dado,
 * separadamente do dano do alvo original, inclusive se ele sofreu crítico.
 * A mesa confere as duas criaturas, distâncias e a jogada original vs. segunda
 * CA. Não exigimos turno próprio, ação bônus ou reação que o texto não pede. */
export function previewSweepingAttack(c:Sheet,entry:Sheet,sourceId:string,choice:SweepingChoice,E:Engine) {
  if(!entry || !c.weapons?.includes(entry) || !sweepingAttackOption(c,entry,E))throw new Error('Trespassante exige manobra conhecida e ataque corpo a corpo com arma reconhecida e dano. Ataques próprios continuam na mesa.');
  if(incapacityReason(c) || active(c,'druida:wildShape'))throw new Error('Confira a capacidade de atacar; Forma Selvagem continua na mesa.');
  if(attackHasManeuver(currentWeaponAttack(c,entry)))throw new Error('Este ataque já usou uma manobra; não combine outra.');
  for(const record of [c.ruleState,c.ruleState?.used])if(record!=null && (typeof record!=='object' || Array.isArray(record)))throw new Error('Registro de superioridade ilegível preservado; confira os usos.');
  const source=superiorityOptions(c,E).find(s=>s.id===sourceId);
  if(!source)throw new Error('Escolha uma origem de superioridade vigente.');
  const used=c.ruleState?.used?.[source.id];
  if(used!==undefined && (!Number.isSafeInteger(used) || used<0 || used>source.resource.max))throw new Error('Registro de superioridade ilegível ou fora do máximo preservado; confira os usos.');
  if(source.remaining<1)throw new Error('A origem de superioridade está esgotada.');
  if(choice?.declared!==true)throw new Error('Confirme o acerto corpo a corpo em uma criatura e o segundo alvo a até 1,5 m dela, dentro do seu alcance.');
  if(typeof choice.target!=='string' || !choice.target.trim() || choice.target.trim().length>80)throw new Error('Identifique a segunda criatura em até 80 caracteres.');
  if(typeof choice.wouldHit!=='boolean')throw new Error('Informe se a mesma jogada de ataque atingiria a segunda criatura.');
  return {source,target:choice.target.trim(),wouldHit:choice.wouldHit,formula:`1d${source.die}`,type:weaponStats(c,entry,E).dmgTypeLabel,
    note:`${sweepingAttackDefinition.effect} ${choice.wouldHit?'A mesma jogada atingiria a segunda criatura.':'A mesma jogada não atingiria a segunda criatura: zero dano nela; o dado é gasto mesmo assim.'} Alvos e alcance conferidos na mesa.`};
}
export type SweepingPlan=ReturnType<typeof previewSweepingAttack>;
/** O total secundário nunca recebe crítico, modificador, Destruição ou repetição
 * da arma. Uma tentativa que não atingiria o segundo alvo não precisa de RNG. */
export function sweepingDamage(plan:SweepingPlan,face?:number) {
  if(!plan.wouldHit){if(face!==undefined)throw new Error('Sem acerto no segundo alvo, não há dado de dano para registrar.');return 0;}
  if(!Number.isInteger(face) || face!<1 || face!>plan.source.die)throw new Error(`Informe uma face de 1 a ${plan.source.die} para o Trespassante.`);
  return face!;
}
