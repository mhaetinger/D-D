import { active, level, savingThrowBonus, state, type Sheet } from './model';
import { deathStatus, hitPointMaximum } from './health';
import { incapacityReason } from './concentration';

export type SurvivalChoice={kind:'endurance'} | {kind:'rage';natural:number;extraBonus?:number;fallbackEndurance?:boolean};
function used(c:Sheet,id:string) {
  const n=c.ruleState?.used?.[id] ?? 0;
  if(!Number.isSafeInteger(n) || n<0 || n>100000)throw new Error('Registro de uso da defesa ilegível preservado; confira a ficha.');
  return n;
}
export const relentlessDC=(c:Sheet)=>10+5*used(c,'barbaro:relentless');
/** Não derruba a ficha para descobrir o gatilho: isso encerraria Fúria e
 * concentração antes da escolha que pode justamente impedir a queda. */
export function survivalOptions(c:Sheet,received:number) {
  const body=Math.max(0,received-Number(c.hpTemp || 0)),reason=incapacityReason(c);
  const dropping=c.hpCurrent>0 && body>=c.hpCurrent && body-c.hpCurrent<hitPointMaximum(c) && !deathStatus(c).dead && !active(c,'druida:wildShape');
  return {endurance:dropping && c.rules?.raceId==='meioOrc' && used(c,'race:endurance')===0,
    rageDC:dropping && level(c,'barbaro')>=11 && active(c,'barbaro:rage') && !reason?.startsWith('Inconsciente')?relentlessDC(c):null};
}
export function previewSurvival(c:Sheet,received:number,choice?:SurvivalChoice) {
  if(choice===undefined)return null;
  const options=survivalOptions(c,received);
  if(choice?.kind==='endurance' && options.endurance)return {saved:true,endurance:true,rage:null,description:'Resistência Implacável · gastou o uso até descanso longo · ficou com 1 PV'};
  if(choice?.kind!=='rage' || options.rageDC===null)throw new Error('Esta defesa não está disponível para este dano.');
  const extra=choice.extraBonus ?? 0;
  if(!Number.isInteger(choice.natural) || choice.natural<1 || choice.natural>20 || !Number.isInteger(extra) || Math.abs(extra)>100 || choice.fallbackEndurance!==undefined && typeof choice.fallbackEndurance!=='boolean')throw new Error('Confira a face do d20 e o bônus recebido no teste de CON.');
  if(choice.fallbackEndurance && !options.endurance)throw new Error('Resistência Implacável não está disponível como alternativa.');
  const total=choice.natural+savingThrowBonus(c,'con')+extra,success=total>=options.rageDC;
  const endurance=!success && !!choice.fallbackEndurance;
  return {saved:success || endurance,endurance,rage:{natural:choice.natural,total,dc:options.rageDC,success},
    description:`Fúria Implacável · d20 ${choice.natural}, total ${total}/CD ${options.rageDC} · ${success?'ficou com 1 PV':'falhou'}${endurance?' · Resistência Implacável usada como alternativa: 1 PV':''}`};
}
export type SurvivalPlan=ReturnType<typeof previewSurvival>;
export function commitSurvival(c:Sheet,plan:SurvivalPlan) {
  if(!plan)return;
  const s=state(c);
  if(plan.rage)s.used['barbaro:relentless']=used(c,'barbaro:relentless')+1;
  if(plan.endurance)s.used['race:endurance']=1;
}
