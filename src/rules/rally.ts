import {ability,active,type Engine,type Sheet} from './model';
import {incapacityReason} from './concentration';
import {maneuverTraining} from './maneuvers';
import {superiorityOptions} from './superiority';
import {spend} from './resources';

export interface RallyChoice {source:string;face:number;ally:string;declared:boolean}
export const knowsRally=(c:Sheet,E:Engine)=>maneuverTraining(c,E).known.has('inspirar');

/** Inspirar de 2014 usa CAR e ação bônus no próprio turno. O aliado e sua
 * percepção são declarados pela mesa; este módulo nunca altera outra ficha. */
export function previewRally(c:Sheet,choice:RallyChoice,E:Engine) {
  for(const record of [c.ruleState,c.ruleState?.used])if(record!=null && (typeof record!=='object' || Array.isArray(record)))throw new Error('Registro de superioridade ilegível preservado; confira os usos.');
  if(!knowsRally(c,E))throw new Error('Inspirar exige a manobra conhecida atualmente.');
  const blocked=incapacityReason(c);
  if(blocked)throw new Error(`Inspirar exige ação bônus disponível: ${blocked}.`);
  if(active(c,'druida:wildShape'))throw new Error('Inspirar em Forma Selvagem continua na mesa; confira a capacidade da forma de comunicar a manobra.');
  const source=superiorityOptions(c,E).find(s=>s.id===choice?.source);
  if(!source)throw new Error('Escolha uma origem de superioridade vigente.');
  const raw=c.ruleState?.used?.[source.id],used=raw===undefined?0:raw;
  if(!Number.isSafeInteger(used) || used<0 || !Number.isSafeInteger(source.resource.max) || source.resource.max<0 || used>source.resource.max)throw new Error('Registro de superioridade ilegível ou fora do máximo preservado; confira os usos.');
  if(source.remaining<1)throw new Error('A origem de superioridade está esgotada.');
  if(choice.declared!==true)throw new Error('Confirme seu turno, ação bônus disponível e aliado que possa ver ou ouvir você.');
  if(typeof choice.ally!=='string' || !choice.ally.trim() || choice.ally.trim().length>80)throw new Error('Identifique o aliado em até 80 caracteres.');
  if(!Number.isInteger(choice.face) || choice.face<1 || choice.face>source.die)throw new Error(`Informe a face do d${source.die}, de 1 a ${source.die}.`);
  const score=Number(c.abilities?.cha?.score),cha=ability(c,'cha');
  if(!Number.isSafeInteger(score) || score<1 || score>30)throw new Error('Confira o Carisma antes de usar Inspirar.');
  return {source,face:choice.face,ally:choice.ally.trim(),cha,temporary:Math.max(0,choice.face+cha)};
}
export function canUseRally(c:Sheet,E:Engine,source:string) {
  try{previewRally(c,{source,face:1,ally:'Aliado',declared:true},E);return true;}catch{return false;}
}
/** Toda validação precede o único gasto. Não cura nem soma temporários ao
 * usuário; o aliado escolhe na mesa entre seus temporários e o novo valor. */
export function applyRally(c:Sheet,choice:RallyChoice,E:Engine) {
  const plan=previewRally(c,choice,E);
  spend(c,plan.source.resource);
  return plan;
}
