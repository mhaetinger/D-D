import {escape,type Engine,type Sheet} from './model';
import {applySurvivor,hasSurvivor,previewSurvivor} from './survivor';
import {canEditSheet} from '../sheet-edit/access';
import {currentWorkspaceKey} from '../storage/account-scope';

export function survivorControls(c:Sheet,E:Engine) {
  if(!hasSurvivor(c,E))return '';
  let amount:number|null=null,available=false,reason='';
  try{const plan=previewSurvivor(c,E);amount=plan.amount;available=plan.restored>0;reason=available?'Início do turno':'Constituição atual: 0 PV de recuperação';}
  catch(error){reason=(error as Error).message;}
  const text='Campeão 18: no início de cada turno, recupera 5 + modificador de CON se tiver de 1 PV até metade do máximo vigente. A cura pode ultrapassar a metade, até o máximo. Não exige ação nem consciência e não funciona a 0 PV. Confirme somente uma vez por começo de turno; turnos são acompanhados pela mesa.';
  return `<div class="rule-controls" data-survivor-control tabindex="0" data-rule-tooltip="${escape(JSON.stringify({name:'Sobrevivente',text}))}"><button type="button" data-health-action="survivor" ${!available || !canEditSheet(c)?'disabled':''}>Sobrevivente${amount!==null?` · +${amount} PV`:''}</button><small class="t-text-muted">${escape(reason)}</small></div>`;
}
const pending=new WeakSet<Sheet>();
/** A confirmação usa o diálogo comum, sem dados, relógios ou nova reserva.
 * Documento/conta/botão/permissão são revalidados antes da cura e do histórico. */
export async function useSurvivor(c:Sheet,E:Engine,trigger:HTMLButtonElement,save:(description:string)=>void) {
  if(pending.has(c))return;
  pending.add(c);
  try{
    const host=window as any,workspace=currentWorkspaceKey(),before=JSON.stringify(c);
    const valid=()=>host.getChar()===c && currentWorkspaceKey()===workspace && JSON.stringify(c)===before && trigger.isConnected && canEditSheet(c);
    if(!valid())throw new Error('A ficha ou a permissão mudou. Sobrevivente não foi aplicado.');
    const plan=previewSurvivor(c,E),controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
    controls.innerHTML='<label class="rule-check"><input type="checkbox" required data-survivor-start> É o início de um novo turno meu; ainda não usei Sobrevivente neste turno</label>';
    if(!await host.confirmDestructiveAction('Sobrevivente · início do turno',`5 + CON (${plan.con>=0?'+':''}${plan.con}) = ${plan.amount} PV. Recupera ${plan.restored} PV: ${plan.before} → ${plan.after}/${plan.maximum}. Pode ultrapassar a metade. Não exige ação; a mesa acompanha os turnos. Cancelar preserva os PV.`,'Recuperar PV',controls))return;
    if(!valid())throw new Error('A ficha, a conta ou a permissão mudou. Nenhum PV foi recuperado.');
    const result=applySurvivor(c,E,controls.querySelector<HTMLInputElement>('[data-survivor-start]')!.checked);
    save(`Sobrevivente · início do turno confirmado · 5 + CON (${result.con>=0?'+':''}${result.con}) = ${result.amount} · recuperou ${result.restored} PV · ${result.before} → ${result.after}/${result.maximum}`);
    const next=document.querySelector<HTMLButtonElement>('[data-health-action="survivor"]');
    if(next?.disabled)next.closest<HTMLElement>('[data-survivor-control]')?.focus({preventScroll:true});
  }finally{pending.delete(c);}
}
