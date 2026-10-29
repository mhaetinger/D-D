import {active,type Engine,type Sheet} from './model';
import {incapacityReason} from './concentration';
import {maneuverTraining} from './maneuvers';
import {superiorityOptions} from './superiority';
import {spend} from './resources';
import {weaponStats} from './combat';
import {parseDiceFormula} from './dice-formula';
import {pendingFeint,holdFeint,clearPendingFeint} from './feinting-state';
import {beginFeintingWeaponAttack,currentFeintingAttack,finishFeintingAttack} from './weapon-attack-session';
import type {RollMode} from './dice-roll';

export const knowsFeintingAttack=(c:Sheet,E:Engine)=>maneuverTraining(c,E).known.has('ataque de finta');
export interface FeintingChoice {source:string;target:string;declared:boolean}
/** PHB 2014 p. 74 / livro local p. 88: ação bônus no próprio turno, alvo até
 * 1,5 m ao fintar. A errata limita vantagem ao próximo ataque contra ele nesse turno. */
export function previewFeintingAttack(c:Sheet,choice:FeintingChoice,E:Engine) {
  for(const record of [c.ruleState,c.ruleState?.used])if(record!=null && (typeof record!=='object' || Array.isArray(record)))throw new Error('Registro de superioridade ilegível preservado; confira os usos.');
  if(!knowsFeintingAttack(c,E) || incapacityReason(c))throw new Error('Finta exige a manobra conhecida e ação bônus disponível, sem incapacitação.');
  if(active(c,'druida:wildShape'))throw new Error('Finta em Forma Selvagem continua na mesa; confira a capacidade física da forma.');
  if(pendingFeint(c) || currentFeintingAttack(c))throw new Error('Encerre ou resolva a Finta já paga antes de preparar outra.');
  const source=superiorityOptions(c,E).find(s=>s.id===choice?.source);
  if(!source)throw new Error('Escolha uma origem de superioridade vigente.');
  const raw=c.ruleState?.used?.[source.id],used=raw===undefined?0:raw;
  if(!Number.isSafeInteger(used) || used<0 || !Number.isSafeInteger(source.resource.max) || source.resource.max<0 || used>source.resource.max)throw new Error('Registro de superioridade ilegível ou fora do máximo preservado; confira os usos.');
  if(source.remaining<1)throw new Error('A origem de superioridade está esgotada.');
  if(choice.declared!==true)throw new Error('Confirme seu turno, ação bônus disponível e alvo a até 1,5 m ao fintar.');
  if(typeof choice.target!=='string' || !choice.target.trim() || choice.target.trim().length>80)throw new Error('Identifique o alvo em até 80 caracteres.');
  return {source,target:choice.target.trim()};
}
export function canUseFeintingAttack(c:Sheet,E:Engine,source:string) {
  try{previewFeintingAttack(c,{source,target:'Alvo',declared:true},E);return true;}catch{return false;}
}
export function applyFeintingAttack(c:Sheet,choice:FeintingChoice,E:Engine) {
  const plan=previewFeintingAttack(c,choice,E);spend(c,plan.source.resource);
  return holdFeint(c,{source:plan.source.id,name:plan.source.name,die:plan.source.die,target:plan.target});
}
/** Limite deste controle: arma reconhecida com dano. A regra também admite
 * magia/ataque próprio/sem dano; Resolver na mesa usa o mesmo dado já pago. */
export function feintingWeaponOption(c:Sheet,entry:Sheet,E:Engine) {
  if(!entry || !c.weapons?.includes(entry) || active(c,'druida:wildShape'))return null;
  const w=weaponStats(c,entry,E);
  if(!w.ruleWeapon || w.calculationMode==='manual' || !w.weaponDie || w.weaponDie==='0' || !parseDiceFormula(w.damage) || !/^[+-]?\d+$/.test(String(w.bonus)) || !parseDiceFormula(`1d20${Number(w.bonus)>=0?'+':''}${Number(w.bonus)}`))return null;
  return w;
}
export function previewFeintingWeaponAttack(c:Sheet,entry:Sheet,declared:boolean,E:Engine) {
  const feint=pendingFeint(c),w=feintingWeaponOption(c,entry,E);
  if(!feint || !w || incapacityReason(c))throw new Error('Finta ou arma indisponível; resolva na mesa o dado já pago, se necessário.');
  if(declared!==true)throw new Error('Confirme o próximo ataque contra o alvo da Finta, no mesmo turno e sem outra manobra.');
  return {feint,w};
}
export function commitFeintingWeaponAttack(c:Sheet,entry:Sheet,declared:boolean,E:Engine) {
  const plan=previewFeintingWeaponAttack(c,entry,declared,E);
  const attack=beginFeintingWeaponAttack(c,entry,plan.feint);clearPendingFeint(c);return attack;
}
export function resolveFeintingAtTable(c:Sheet,declared:boolean) {
  const feint=pendingFeint(c);
  if(!feint || incapacityReason(c) || declared!==true)throw new Error('Confirme o próximo ataque no mesmo turno contra o alvo da Finta; nenhum novo uso foi gasto.');
  clearPendingFeint(c);return feint;
}
export function endFeinting(c:Sheet) {clearPendingFeint(c);return finishFeintingAttack(c);}
/** Finta e inspiração são fontes de vantagem: juntas não superam uma fonte
 * de desvantagem. O seletor continua intacto para a próxima jogada. */
export function feintingRollDetails(selected:RollMode,inspired=false) {
  if(!['normal','adv','dis'].includes(selected))throw new Error('Confira o modo do dado.');
  return {mode:(selected==='dis'?'normal':'adv') as RollMode,inspired,canceled:selected==='dis'};
}
export function feintingRollDescription(details:ReturnType<typeof feintingRollDetails>&{contextual?:boolean}) {
  return `Finta: vantagem${details.inspired?' e inspiração preparada':''}. ${details.canceled?(details.contextual?'Desvantagem da ficha anula as fontes de vantagem: 1d20.':'Desvantagem informada anula as fontes de vantagem: 1d20.'):'2d20, use o maior.'}`;
}
