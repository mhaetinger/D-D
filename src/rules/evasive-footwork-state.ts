import {active,type Sheet} from './model';

export interface EvasiveFootwork {version:1;source:string;die:number;face:number}
/** Registro pequeno e opcional; ler não corrige nem apaga dados desconhecidos. */
export function readEvasiveFootwork(c:Sheet):EvasiveFootwork|null {
  const r=c.ruleState?.evasiveFootwork;
  return r && typeof r==='object' && !Array.isArray(r) && r.version===1 && ['guerreiro:superiority','feat:superiority'].includes(r.source) && [6,8,10,12].includes(r.die) && Number.isInteger(r.face) && r.face>=1 && r.face<=r.die?r:null;
}
export function evasiveMovementBlock(c:Sheet):string|null {
  if(c.ruleState?.death?.dead || Number(c.ruleState?.death?.failures)>=3 || Number(c.exhaustion)>=6)return 'Personagem morto';
  if(active(c,'druida:wildShape'))return 'Forma Selvagem: CA e capacidade da forma continuam na mesa';
  if(c.hpCurrent<=0 || c.conscious===false)return 'Personagem inconsciente';
  if(['agarrado','impedido','atordoado','inconsciente','paralisado','petrificado'].some(id=>c.ruleState?.conditions?.[id]===true))return 'Uma condição impede o movimento';
  if(Number(c.exhaustion)>=5)return 'Exaustão: deslocamento 0';
  const speed=Number(c.speed)+(active(c,'mago:stone') && c.ruleState?.targets?.['mago:stone']==='speed'?3:0);
  if(!Number.isFinite(speed) || speed<=0)return 'Confira o deslocamento; é preciso poder se mover';
  return null;
}
/** Encerrar um efeito válido nunca devolve o dado. Registros ilegíveis ficam
 * intactos; este helper não é um mecanismo de recuperação de dados. */
export function clearEvasiveFootwork(c:Sheet) {
  const effect=readEvasiveFootwork(c);
  if(effect)delete c.ruleState.evasiveFootwork;
  return effect;
}
export function endEvasiveFootworkIfStopped(c:Sheet) {
  return evasiveMovementBlock(c)?clearEvasiveFootwork(c):null;
}
