import {applyInitiativeRecovery,initiativeRecovery,initiativeRecoveryDescription} from './initiative-recovery';
import {remaining,resourcesFor} from './resources';
import {canEditSheet} from '../sheet-edit/access';
import type {Engine,Sheet} from './model';

/** Atualiza somente saldo/botões. Não troca selects, campos de máximo ou nós
 * de uma lista aberta; a jogada e as escolhas de Sortudo continuam vigentes. */
export function refreshInitiativeResources(c:Sheet,E:Engine,ids:readonly string[]) {
  const resources=resourcesFor(c,E);
  for(const r of resources.filter(r=>ids.includes(r.id))){
    const value=remaining(c,r);
    document.querySelectorAll(`[data-resource-balance="${r.id}"]`).forEach(el=>el.textContent=String(value));
    document.querySelectorAll<HTMLInputElement>(`[data-rule-pool="${r.id}"]`).forEach(el=>el.value=String(value));
    document.querySelectorAll<HTMLButtonElement>(`[data-rule-action][data-resource="${r.id}"]`).forEach(button=>button.disabled=button.dataset.ruleAction==='refund'?value===r.max:value<1);
    for(const dependent of resources.filter(d=>d.cost?.[0]===r.id)){
      document.querySelectorAll<HTMLButtonElement>(`[data-rule-action="use"][data-resource="${dependent.id}"]`).forEach(button=>button.disabled=remaining(c,dependent)<1 || value<dependent.cost![1]);
    }
  }
}
const pending=new WeakSet<Sheet>();
/** OFF/Só Pool não lançam um d20. O jogador declara uma nova iniciativa física
 * na mesa, revalidada antes de recuperar, sem inferir combate pelo pool livre. */
export async function recoverPhysicalInitiative(c:Sheet,E:Engine,trigger:HTMLElement|null) {
  if(pending.has(c))return;
  const host=window as any,plan=initiativeRecovery(c,E);
  if(!plan.recoveries.length){if(plan.warnings.length)host.showToast(plan.warnings.join(' '));return;}
  pending.add(c);
  try{
    const before=JSON.stringify(c),settings=host.ruleDiceSettings(),controls=document.createElement('div');
    const valid=()=>host.getChar()===c && JSON.stringify(c)===before && !!trigger?.isConnected && canEditSheet(c) && !host.ruleDiceSettings().automatic && host.ruleDiceSettings().enabled===settings.enabled && host.ruleDiceSettings().sequence===settings.sequence;
    if(!valid())throw new Error('A ficha ou o modo mudou. Confira a iniciativa na mesa.');
    controls.className='rule-context rule-dialog-fields';
    controls.innerHTML='<label class="rule-check"><input type="checkbox" required data-initiative-physical-confirm> Já rolei uma nova iniciativa na mesa; não é repetição da mesma jogada</label>';
    if(!await host.confirmDestructiveAction('Iniciativa na mesa',initiativeRecoveryDescription(plan,false)+'. Confirme somente após rolar a iniciativa física. Cancelar preserva as reservas.','Registrar iniciativa',controls))return;
    if(!valid())throw new Error('A ficha, a permissão ou a jogada mudou. Nenhum recurso foi recuperado.');
    if(!controls.querySelector<HTMLInputElement>('[data-initiative-physical-confirm]')!.checked)throw new Error('Confirme uma nova iniciativa física.');
    const applied=applyInitiativeRecovery(c,E);
    if(applied.recoveries.length){host.recordStepAndSave('Iniciativa física · '+initiativeRecoveryDescription(applied),true,false);refreshInitiativeResources(c,E,applied.recoveries.map(r=>r.id));host.showToast(initiativeRecoveryDescription(applied));}
  }catch(error){host.showToast((error as Error).message);}
  finally{pending.delete(c);}
}
