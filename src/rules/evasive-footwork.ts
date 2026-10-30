import {state,type Engine,type Sheet} from './model';
import {maneuverTraining,superioritySources} from './maneuvers';
import {superiorityOptions} from './superiority';
import {spend} from './resources';
import {clearEvasiveFootwork,evasiveMovementBlock,readEvasiveFootwork} from './evasive-footwork-state';

export const knowsEvasiveFootwork=(c:Sheet,E:Engine)=>maneuverTraining(c,E).known.has('passo evasivo');
export interface EvasiveChoice {source:string;face:number;moving:boolean}
export function previewEvasiveFootwork(c:Sheet,choice:EvasiveChoice,E:Engine) {
  for(const record of [c.ruleState,c.ruleState?.used])if(record!=null && (typeof record!=='object' || Array.isArray(record)))throw new Error('Registro de superioridade ilegível preservado; confira os usos.');
  if(c.ruleState?.evasiveFootwork!==undefined)throw new Error(readEvasiveFootwork(c)?'Encerre o movimento atual antes de usar outro dado.':'Registro de Passo Evasivo ilegível preservado; confira o backup.');
  if(!knowsEvasiveFootwork(c,E))throw new Error('Passo Evasivo exige a manobra conhecida atualmente.');
  const blocked=evasiveMovementBlock(c);if(blocked)throw new Error(blocked+'.');
  const source=superiorityOptions(c,E).find(s=>s.id===choice?.source);
  if(!source)throw new Error('Escolha uma origem de superioridade vigente.');
  const raw=c.ruleState?.used?.[source.id],used=raw===undefined?0:raw;
  if(!Number.isSafeInteger(used) || used<0 || !Number.isSafeInteger(source.resource.max) || source.resource.max<0 || used>source.resource.max)throw new Error('Registro de superioridade ilegível ou fora do máximo preservado; confira os usos.');
  if(source.remaining<1)throw new Error('A origem de superioridade está esgotada.');
  if(choice.moving!==true)throw new Error('Confirme que está se movendo e encerrará o bônus assim que parar.');
  if(!Number.isInteger(choice.face) || choice.face<1 || choice.face>source.die)throw new Error(`Informe a face do d${source.die}, de 1 a ${source.die}.`);
  return {source,face:choice.face};
}
export function canStartEvasiveFootwork(c:Sheet,E:Engine,source:string) {
  try{previewEvasiveFootwork(c,{source,face:1,moving:true},E);return true;}catch{return false;}
}
export function startEvasiveFootwork(c:Sheet,choice:EvasiveChoice,E:Engine) {
  const plan=previewEvasiveFootwork(c,choice,E);
  spend(c,plan.source.resource);
  state(c).evasiveFootwork={version:1,source:plan.source.id,die:plan.source.die,face:plan.face};
  return plan;
}
/** Soma somente a face já paga, inclusive à CA escrita. Sem DES, proficiência,
 * ação bônus ou nova rolagem. A mesa encerra quando parar, mesmo no mesmo turno. */
export function evasiveFootworkBonus(c:Sheet,E:Engine) {
  const effect=readEvasiveFootwork(c);
  return effect && knowsEvasiveFootwork(c,E) && !evasiveMovementBlock(c) && superioritySources(c,E).some(s=>s.id===effect.source)?effect.face:0;
}
export function finishEvasiveFootwork(c:Sheet) {
  const effect=clearEvasiveFootwork(c);
  if(!effect)throw new Error('Sem registro válido de Passo Evasivo para encerrar; dados preservados.');
  return effect;
}
