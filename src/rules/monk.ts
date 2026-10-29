import {ability,active,level,proficiency,subclass,type Engine,type Sheet} from './model';
import {incapacityReason} from './concentration';
import {hasCondition,setCondition} from './conditions';
import {deathStatus} from './health';
import {resourcesFor,spend} from './resources';
import {weaponStats} from './combat';
import {martialArtsAvailable,martialDie} from './martial-arts';
import {readableSupportState} from './support-actions';

export function monkAction(c:Sheet,minimum:number) {
  readableSupportState(c);
  if(level(c,'monge')<minimum)throw new Error(`Exige monge de nível ${minimum} ou maior.`);
  if(incapacityReason(c))throw new Error('É preciso poder agir/reagir para usar esta característica.');
  if(active(c,'druida:wildShape'))throw new Error('Capacidade física e estatísticas da Forma Selvagem continuam na mesa.');
}
export function chiReserve(c:Sheet,E:Engine) {
  readableSupportState(c);
  const r=resourcesFor(c,E).find(r=>r.id==='monge:ki'),value=c.ruleState?.pools?.['monge:ki'];
  if(!r || !Number.isSafeInteger(r.max) || r.max<1 || value!==undefined && (!Number.isSafeInteger(value) || value<0 || value>r.max))throw new Error('Reserva de Chi ausente ou ilegível preservada.');
  const remaining=value===undefined?r.max:value;if(remaining<1)throw new Error('Sem pontos de Chi.');
  return {resource:r,remaining};
}
export function previewStunning(c:Sheet,index:number,target:string,declared:boolean,E:Engine) {
  monkAction(c,5);const reserve=chiReserve(c,E),entry=c.weapons?.[index],w=entry && weaponStats(c,entry,E);
  if(!w?.ruleWeapon || w.calculationMode==='manual' || !w.meleeAttack)throw new Error('Escolha um ataque corpo a corpo com arma ou golpe desarmado reconhecido. Ataques de magia/à distância não permitem Atordoante.');
  if(!Number.isSafeInteger(c.abilities?.wis?.score) || c.abilities.wis.score<0 || c.abilities.wis.score>30)throw new Error('Confira Sabedoria antes de calcular a CD.');
  if(typeof target!=='string' || !target.trim() || target.trim().length>80 || declared!==true)throw new Error('Confirme um acerto corpo a corpo em outra criatura e identifique o alvo.');
  return {...reserve,dc:8+proficiency(c)+ability(c,'wis'),target:target.trim(),weapon:w.name};
}
export function applyStunning(c:Sheet,index:number,target:string,declared:boolean,E:Engine) {const p=previewStunning(c,index,target,declared,E);spend(c,p.resource);return p;}
export function finishStillness(c:Sheet,condition:string,declared:boolean,clearMark:boolean) {
  monkAction(c,7);
  if(!['enfeiticado','amedrontado'].includes(condition) || !hasCondition(c,condition) || declared!==true || typeof clearMark!=='boolean')throw new Error('Confirme ação disponível para encerrar um efeito que esteja enfeitiçando ou amedrontando você.');
  if(clearMark)setCondition(c,condition,false);return {condition,cleared:clearMark};
}
export interface MonkDefenseChoice {kind:'projectile'|'fall';face:number;declared:boolean;catch:boolean}
export function previewMonkDefense(c:Sheet,choice:MonkDefenseChoice) {
  if(!choice || !['projectile','fall'].includes(choice.kind))throw new Error('Escolha Defletir Projéteis ou Queda Lenta.');
  monkAction(c,choice.kind==='projectile'?3:4);
  if(choice.declared!==true || typeof choice.catch!=='boolean')throw new Error('Confirme o gatilho e reação disponível.');
  const dex=ability(c,'dex'),n=level(c,'monge');
  if(choice.kind==='projectile' && (!Number.isSafeInteger(c.abilities?.dex?.score) || c.abilities.dex.score<0 || c.abilities.dex.score>30 || !Number.isInteger(choice.face) || choice.face<1 || choice.face>10))throw new Error('Confira Destreza e a face do d10, de 1 a 10.');
  return {...choice,dex,monk:n,reduction:choice.kind==='fall'?5*n:Math.max(0,choice.face+dex+n),name:choice.kind==='fall'?'Queda Lenta':'Defletir Projéteis'};
}
export interface ReturnChoice {name:string;die:number;count:number;type:string;strength:boolean;martial:boolean;magic:number;declared:boolean}
export function previewMonkReturn(c:Sheet,choice:ReturnChoice,E:Engine) {
  monkAction(c,3);const reserve=chiReserve(c,E);
  if(!choice || typeof choice.name!=='string' || !choice.name.trim() || choice.name.trim().length>80 || ![4,6,8,10,12].includes(choice.die) || ![1,2].includes(choice.count) || !['concussão','perfurante','cortante'].includes(choice.type) || typeof choice.strength!=='boolean' || typeof choice.martial!=='boolean' || !Number.isInteger(choice.magic) || Math.abs(choice.magic)>10 || choice.declared!==true)throw new Error('Confirme o projétil apanhado, tamanho/mão livre, mesma reação, alvo ao alcance e dados próprios do projétil.');
  if(choice.martial && !martialArtsAvailable(c))throw new Error('Artes Marciais exige ausência de armadura/escudo e arma de monge.');
  const key=choice.strength?'str':'dex';
  if(!Number.isSafeInteger(c.abilities?.[key]?.score) || c.abilities[key].score<0 || c.abilities[key].score>30)throw new Error('Confira a habilidade do ataque.');
  const modifier=ability(c,key)+choice.magic,die=choice.martial?martialDie(c):choice.die,count=choice.martial?1:choice.count;
  return {...reserve,name:choice.name.trim(),key,modifier,die,count,type:choice.type,bonus:modifier+proficiency(c),criticalAt:subclass(c,'guerreiro',E)==='campeao' && level(c,'guerreiro')>=3?level(c,'guerreiro')>=15?18:19:20};
}
export function payMonkReturn(c:Sheet,choice:ReturnChoice,E:Engine) {const p=previewMonkReturn(c,choice,E);spend(c,p.resource);return p;}
/** Repetir resistência não exige ação nem reação: pode ocorrer a 0 PV,
 * inclusive contra morte, antes de aplicar o resultado original. */
export function diamondReserve(c:Sheet,E:Engine) {
  readableSupportState(c);
  if(level(c,'monge')<14 || deathStatus(c).dead)throw new Error('Alma de Diamante exige monge 14 vivo.');
  if(active(c,'druida:wildShape'))throw new Error('Resistências da forma continuam na mesa.');
  return chiReserve(c,E);
}
export function payDiamond(c:Sheet,declared:boolean,E:Engine) {const p=diamondReserve(c,E);if(declared!==true)throw new Error('Confirme a resistência que falhou; use obrigatoriamente a nova jogada.');spend(c,p.resource);return p;}
