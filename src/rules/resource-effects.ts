import {healHitPoints} from './health';
import {level,state,type Engine,type Sheet} from './model';
import {useResource,type Resource} from './resources';

export function applyRolledResource(c:Sheet,r:Resource,E:Engine,face?:number) {
  const automatic=r.action==='intervention' && level(c,'clerigo')>=20;
  const sides=r.action==='secondWind'?10:r.action==='intervention'?100:0;
  if(!sides || !automatic && (face===undefined || !Number.isInteger(face) || face<1 || face>sides))throw new Error(`Informe a face do d${sides}.`);
  // Validação de cura antes do gasto, inclusive a 0 PV/morto.
  const copy=structuredClone(c);useResource(copy,r,E);
  if(r.action==='secondWind')healHitPoints(copy,face!+level(c,'guerreiro'));
  useResource(c,r,E);
  if(r.action==='secondWind')return {healing:healHitPoints(c,face!+level(c,'guerreiro')),success:false};
  const success=automatic || face!<=level(c,'clerigo');
  if(success)state(c).interventionPending=true;
  return {success};
}

export function interventionWaiting(c:Sheet) {
  return !!c.ruleState?.interventionPending || Number(c.ruleState?.blockedUntil?.['clerigo:intervention'] || 0)>Date.now();
}
/** Confirmação explícita da semana na aventura, nunca relógio da máquina ou
 * um descanso isolado. Aceita o bloqueio antigo sem apagar o dado na leitura. */
export function finishInterventionWeek(c:Sheet) {
  if(!interventionWaiting(c))throw new Error('Não há semana de Intervenção Divina pendente.');
  const s=state(c);s.interventionPending=false;
  if(s.blockedUntil)delete s.blockedUntil['clerigo:intervention'];
  s.used['clerigo:intervention']=0;
}
