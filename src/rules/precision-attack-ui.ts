import {escape,type Engine,type Sheet} from './model';
import type {DiceResult} from './dice-roll';
import {chooseDieSource,dieSourceControls} from './health-ui';
import {commitPrecisionAttack,precisionAttackOptions,previewPrecisionAttack,type PrecisionChoice} from './precision-attack';
import {superiorityOptions} from './superiority';
import {canEditSheet} from '../sheet-edit/access';
import {canUseRally} from './rally';
import {isCurrentWeaponAttack,markAttackPrecision,type WeaponAttackSession} from './weapon-attack-session';

export function refreshSuperiorityControls(c:Sheet,E:Engine) {
  for(const source of superiorityOptions(c,E)){
    document.querySelectorAll(`[data-superiority-balance="${source.id}"]`).forEach(el=>el.textContent=String(source.remaining));
    document.querySelectorAll<HTMLButtonElement>(`[data-rule-action][data-resource="${source.id}"]`).forEach(button=>{
      button.disabled=button.dataset.ruleAction==='rally'?!canEditSheet(c) || !canUseRally(c,E,source.id):button.dataset.ruleAction==='refund'?!source.readable || source.remaining===source.resource.max:source.remaining<1;
    });
  }
}
/** O d20 já é o ataque em andamento. Este diálogo escolhe apenas o dado de
 * superioridade; nunca relança d20, gasta inspiração ou modifica o pool livre. */
export async function choosePrecisionAttack(c:Sheet,entry:Sheet,result:DiceResult,attack:WeaponAttackSession,E:Engine,valid:()=>boolean):Promise<DiceResult|null> {
  const host=window as any;
  const requireCurrent=()=>{
    if(!valid() || !canEditSheet(c) || !isCurrentWeaponAttack(attack) || attack.precisionUsed)throw new Error('A ficha ou o ataque mudou. Precisão não foi aplicada; nenhum dado foi gasto.');
  };
  requireCurrent();
  const sources=precisionAttackOptions(c,entry,result,E),initial=sources.find(s=>s.remaining>0);
  if(!initial)throw new Error('Sem dados de superioridade disponíveis para Precisão.');
  const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
  controls.innerHTML=`<label>Origem do dado <select data-precision-source>${sources.map(s=>`<option value="${s.id}" ${s.remaining<1?'disabled':''}>${escape(s.name)} · d${s.die} · ${s.remaining}/${s.resource.max}</option>`).join('')}</select></label>
    ${dieSourceControls(initial.die,false)}
    <label class="rule-check"><input type="checkbox" data-precision-unresolved> O ataque ainda não foi resolvido e não usou outra manobra</label>
    <output data-precision-preview role="status" aria-live="polite"></output>`;
  const source=controls.querySelector<HTMLSelectElement>('[data-precision-source]')!;source.value=initial.id;
  chooseDieSource(controls);
  const choice=():PrecisionChoice=>({source:source.value,unresolved:controls.querySelector<HTMLInputElement>('[data-precision-unresolved]')!.checked,noOtherManeuver:controls.querySelector<HTMLInputElement>('[data-precision-unresolved]')!.checked});
  const update=()=>{
    const selected=sources.find(s=>s.id===source.value)!;
    const field=controls.querySelector<HTMLInputElement>('[data-health-face]')!;field.max=String(selected.die);
    controls.querySelector('[data-health-face-label]')!.firstChild!.textContent=`Face do d${selected.die} `;
    controls.querySelector<HTMLOutputElement>('[data-precision-preview]')!.textContent=`Ataque atual: ${result.total} · d20 natural ${result.d20Natural}. Soma 1d${selected.die}; gasta 1 dado de ${selected.name}. Acerto/erro na mesa; 1 natural continua errando e o intervalo de crítico não muda.`;
  };
  controls.addEventListener('change',update);update();
  const form=document.querySelector<HTMLFormElement>('#confirmationDialog form')!;
  const validate=(event:SubmitEvent)=>{
    if((event.submitter as HTMLButtonElement)?.value!=='confirm')return;
    try{requireCurrent();previewPrecisionAttack(c,entry,result,choice(),E);}catch(error){event.preventDefault();host.showToast((error as Error).message);}
  };
  form.addEventListener('submit',validate);
  let confirmed=false;
  try{confirmed=await host.confirmDestructiveAction('Ataque de Precisão','Depois do d20, antes de resolver o ataque. Cancelar mantém os dados e os usos. Uma única manobra por ataque.','Aplicar Precisão',controls);}
  finally{form.removeEventListener('submit',validate);}
  if(!confirmed)return null;
  requireCurrent();
  const selected=previewPrecisionAttack(c,entry,result,choice(),E),virtual=controls.querySelector<HTMLSelectElement>('[data-health-source]')!.value==='virtual';
  if(!host.ruleDiceSettings().automatic)throw new Error('Auto Ficha desativado. Resolva Precisão na mesa; nenhum dado foi gasto.');
  const face=virtual?Math.floor(Math.random()*selected.die)+1:Number(controls.querySelector<HTMLInputElement>('[data-health-face]')!.value);
  const next=commitPrecisionAttack(c,entry,result,choice(),face,E);
  markAttackPrecision(attack);
  host.recordStepAndSave(`Ataque de Precisão · ${entry.name} · ${selected.name} d${selected.die}[${face}] (${virtual?'virtual':'físico'}) · d20 natural ${next.d20Natural} · ataque ${result.total} → ${next.total} · gastou 1 dado; acerto/erro na mesa`,true,false);
  refreshSuperiorityControls(c,E);return next;
}
