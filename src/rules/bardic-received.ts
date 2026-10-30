import {state,type Sheet} from './model';
export interface BardicInspiration {version:1;source:string;die:number;combat:boolean}
export function receivedBardic(c:Sheet):BardicInspiration|null {
  const x=c.ruleState?.bardicInspiration;
  return x && typeof x==='object' && !Array.isArray(x) && x.version===1 && typeof x.source==='string' && !!x.source.trim() && x.source.length<=80 && [6,8,10,12].includes(x.die) && typeof x.combat==='boolean'?x:null;
}
export const invalidBardic=(c:Sheet)=>c.ruleState?.bardicInspiration!=null && !receivedBardic(c);
/** O tempo é de jogo, declarado na mesa. Descanso dura mais de 10 minutos;
 * registros futuros/ilegíveis são preservados, nunca apagados para corrigir. */
export function endReceivedBardic(c:Sheet) {
  const old=receivedBardic(c);if(old)state(c).bardicInspiration=null;return old;
}
