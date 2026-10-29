import {ability,active,type Engine,type Sheet} from './model';
import {incapacityReason} from './concentration';
import {maneuverTraining} from './maneuvers';
import {superiorityOptions} from './superiority';

export interface ParryChoice {source:string;face:number;melee:boolean;reaction:boolean;noOtherManeuver:boolean}
export const knowsParry=(c:Sheet,E:Engine)=>maneuverTraining(c,E).known.has('aparar');
export function parryOptions(c:Sheet,E:Engine) {
  if(!knowsParry(c,E) || incapacityReason(c) || active(c,'druida:wildShape'))return [];
  return superiorityOptions(c,E).map(s=>{
    const raw=c.ruleState?.used?.[s.id],used=raw===undefined?0:raw;
    const readable=Number.isSafeInteger(used) && used>=0 && Number.isSafeInteger(s.resource.max) && s.resource.max>=0 && used<=s.resource.max;
    return {...s,readable,remaining:readable?s.resource.max-used:0};
  });
}
/** O chamador valida a origem do ataque. Aparar usa DES, não a habilidade
 * da arma nem a CD das manobras; cegueira sozinha não impede esta reação. */
export function previewParry(c:Sheet,choice:ParryChoice,E:Engine) {
  for(const record of [c.ruleState,c.ruleState?.used])if(record!=null && (typeof record!=='object' || Array.isArray(record)))throw new Error('Registro de superioridade ilegível preservado; confira os usos.');
  const source=parryOptions(c,E).find(s=>s.id===choice?.source);
  if(!source)throw new Error('Aparar exige a manobra conhecida, uma origem de superioridade vigente e capacidade de usar reação. Forma Selvagem continua na mesa.');
  if(!source.readable)throw new Error('Registro de superioridade ilegível ou fora do máximo preservado; confira os usos.');
  if(source.remaining<1)throw new Error('A origem de superioridade está esgotada.');
  if(choice.melee!==true || choice.reaction!==true || choice.noOtherManeuver!==true)throw new Error('Confirme o ataque corpo a corpo de outra criatura, reação disponível e nenhuma outra manobra sua neste ataque.');
  if(!Number.isInteger(choice.face) || choice.face<1 || choice.face>source.die)throw new Error(`Informe a face do d${source.die}, de 1 a ${source.die}.`);
  const score=Number(c.abilities?.dex?.score),dex=ability(c,'dex');
  if(!Number.isSafeInteger(score) || score<1 || score>30)throw new Error('Confira a Destreza antes de usar Aparar.');
  return {source,face:choice.face,dex,reduction:Math.max(0,choice.face+dex)};
}
