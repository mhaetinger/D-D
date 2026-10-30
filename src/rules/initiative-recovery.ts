import {level,state,subclass,type Engine,type Sheet} from './model';
import {resourcesFor,type Resource} from './resources';
import {superioritySources} from './maneuvers';

export function initiativeRecoveryFeatures(c:Sheet,E:Engine) {
  return [
    ...(level(c,'guerreiro')>=15 && subclass(c,'guerreiro',E)==='mestreBatalha'?[{id:'guerreiro:superiority',name:'Implacável',amount:1}]:[]),
    ...(level(c,'bardo')>=20?[{id:'bardo:inspiration',name:'Inspiração Superior',amount:1}]:[]),
    ...(level(c,'monge')>=20?[{id:'monge:ki',name:'Auto Aperfeiçoamento',amount:4}]:[]),
  ];
}
function balance(c:Sheet,r:Resource) {
  const raw=r.kind==='pool'?c.ruleState?.pools?.[r.id]:c.ruleState?.used?.[r.id];
  const value=raw===undefined?(r.kind==='pool'?r.max:0):raw;
  if(!Number.isSafeInteger(r.max) || r.max<0 || r.max>100 || !Number.isSafeInteger(value) || value<0 || value>r.max)return null;
  return r.kind==='pool'?value:r.max-value;
}
/** O gatilho é uma nova iniciativa, não uma repetição do d20. Usa os máximos
 * vigentes sem normalizar registros ilegíveis ou recuperar uma reserva cheia.
 * Implacável exige esgotar também o dado adicional do Adepto Marcial. */
export function initiativeRecovery(c:Sheet,E:Engine) {
  const features=initiativeRecoveryFeatures(c,E),resources=features.length?resourcesFor(c,E):[];
  const recoveries:{id:string;name:string;resource:Resource;amount:number;before:number;after:number}[]=[],warnings:string[]=[];
  for(const feature of features){
    const r=resources.find(r=>r.id===feature.id),group=feature.id==='guerreiro:superiority'?superioritySources(c,E).map(s=>resources.find(r=>r.id===s.id)): [r];
    if(!r || group.some(r=>!r || balance(c,r)===null)){
      warnings.push(`${feature.name}: registro da reserva ilegível ou fora do máximo; confira os valores. Dados preservados.`);continue;
    }
    if(!r.max || group.some(r=>balance(c,r!)!==0))continue;
    const amount=Math.min(feature.amount,r.max);
    recoveries.push({...feature,resource:r,amount,before:0,after:amount});
  }
  return {recoveries,warnings};
}
export function applyInitiativeRecovery(c:Sheet,E:Engine) {
  const plan=initiativeRecovery(c,E);
  if(plan.recoveries.length){
    const s=state(c);
    for(const r of plan.recoveries)if(r.resource.kind==='pool')s.pools[r.id]=r.after;
    else s.used[r.id]=r.resource.max-r.after;
  }
  return plan;
}
export function initiativeRecoveryDescription(plan:ReturnType<typeof initiativeRecovery>,applied=true) {
  return plan.recoveries.map(r=>`${r.name} · ${applied?'recuperou':'recupera'} ${r.amount} ${r.id==='monge:ki'?'ponto(s) de Chi':r.id==='bardo:inspiration'?'uso de Inspiração de Bardo':'dado de superioridade'} (${r.after}/${r.resource.max})`).join(' · ');
}
