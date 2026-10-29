import {escape,type Engine,type Sheet} from './model';
import {knowsParry,parryOptions} from './parry';
import {heavyArmorReduction,isDamageAttack,previewTypedDamage,type DamagePacket} from './damage';
import {chooseResourceDice} from './resource-roll-ui';
import {canEditSheet} from '../sheet-edit/access';
import {currentWorkspaceKey} from '../storage/account-scope';

export function parryControls(c:Sheet,E:Engine) {
  if(!knowsParry(c,E))return '';
  const sources=parryOptions(c,E),initial=sources.find(s=>s.readable && s.remaining>0);
  return `<details class="rule-context" data-parry-controls hidden><summary>Aparar · reação</summary>
  <label class="rule-check"><input type="checkbox" data-parry-use ${!initial?'disabled':''}> Ataque corpo a corpo de outra criatura; tenho reação e não usei outra manobra minha neste ataque</label>
  <div class="rule-dialog-fields" data-parry-fields hidden>
  <label>Origem do dado <select data-parry-source>${sources.map(s=>`<option value="${s.id}" ${s===initial?'selected':''} ${!s.readable || s.remaining<1?'disabled':''}>${escape(s.name)} · d${s.die} · ${s.remaining}/${s.resource.max}${!s.readable?' · conferir usos':''}</option>`).join('')}</select></label>
  <label data-parry-face-label>Face do dado <input type="number" min="1" max="12" step="1" data-parry-face></label><button type="button" data-parry-roll>Rolar ou informar face</button>
  <label data-parry-order-label hidden>Ordem definida pela mesa <select data-parry-order><option value="armorFirst">Armadura → Aparar</option><option value="parryFirst">Aparar → armadura</option></select></label>
  <p class="t-text-muted">Redução: face + DES, antes de resistência/vulnerabilidade. Em dano misto, confira a ordem das linhas. Preparar a face não gasta; o dado só é gasto ao Aplicar dano. Não gaste novamente no contador.</p></div>
  <small data-parry-unavailable ${initial?'hidden':''}>Sem dado disponível ou condição impede a reação; confira a reserva e a ficha.</small></details>`;
}
export function readParry(controls:HTMLElement):Pick<DamagePacket,'parry'|'parryOrder'> {
  if(!controls.querySelector<HTMLInputElement>('[data-parry-use]')?.checked)return {};
  return {parry:{source:controls.querySelector<HTMLSelectElement>('[data-parry-source]')!.value,face:Number(controls.querySelector<HTMLInputElement>('[data-parry-face]')!.value),melee:true,reaction:true,noOtherManeuver:true},parryOrder:controls.querySelector<HTMLSelectElement>('[data-parry-order]')!.value as DamagePacket['parryOrder']};
}
/** Só altera propriedades dos campos existentes; conserva seleção, foco e nós. */
export function updateParry(controls:HTMLElement,c:Sheet,E:Engine) {
  const root=controls.querySelector<HTMLElement>('[data-parry-controls]');if(!root)return;
  const attack=isDamageAttack(controls.querySelector<HTMLSelectElement>('[data-damage-source]')!.value),sources=parryOptions(c,E);
  root.hidden=!attack;
  const use=root.querySelector<HTMLInputElement>('[data-parry-use]')!,select=root.querySelector<HTMLSelectElement>('[data-parry-source]')!;
  for(const option of select.options){const s=sources.find(s=>s.id===option.value);option.disabled=!s?.readable || s.remaining<1;if(s)option.textContent=`${s.name} · d${s.die} · ${s.remaining}/${s.resource.max}${!s.readable?' · conferir usos':''}`;}
  use.disabled=!attack || !sources.some(s=>s.readable && s.remaining>0);if(use.disabled)use.checked=false;
  root.querySelector<HTMLElement>('[data-parry-unavailable]')!.hidden=!use.disabled;
  root.querySelector<HTMLElement>('[data-parry-fields]')!.hidden=!use.checked;
  const selected=sources.find(s=>s.id===select.value),input=root.querySelector<HTMLInputElement>('[data-parry-face]')!;
  input.max=String(selected?.die || 12);
  root.querySelector('[data-parry-face-label]')!.firstChild!.textContent=`Face do d${selected?.die || '—'} `;
  root.querySelector<HTMLElement>('[data-parry-order-label]')!.hidden=!heavyArmorReduction(c,E,controls.querySelector<HTMLSelectElement>('[data-damage-source]')!.value);
}
const pending=new WeakSet<HTMLElement>();
export async function prepareParryFace(controls:HTMLElement,E:Engine,packet:()=>DamagePacket) {
  if(pending.has(controls))return;
  pending.add(controls);
  try{
    const host=window as any,c=host.getChar(),workspace=currentWorkspaceKey(),before=JSON.stringify(c);
    const fields=()=>JSON.stringify([...controls.querySelectorAll<HTMLInputElement|HTMLSelectElement>('input,select')].map(e=>[e.value,'checked' in e?e.checked:null])),beforeFields=fields();
    const valid=()=>controls.isConnected && canEditSheet(c) && host.getChar()===c && currentWorkspaceKey()===workspace && JSON.stringify(c)===before && fields()===beforeFields && controls.querySelector<HTMLSelectElement>('[data-damage-mode]')!.value==='typed';
    if(!valid())throw new Error('A ficha ou a permissão mudou. Confira Aparar.');
    const choice=packet();if(!choice.parry)throw new Error('Confirme as condições de Aparar antes de preparar o dado.');
    const plan=previewTypedDamage(c,{...choice,parry:{...choice.parry,face:1}},E);
    const faces=await chooseResourceDice(c,'Aparar · preparar face, sem gasto',plan.parry!.source.die,1,{valid,message:`Role ou informe a face do d${plan.parry!.source.die}. Isto só preenche a prévia; PV e usos não mudam. O dado será gasto ao Aplicar dano no formulário.`,acceptLabel:'Preencher face'});
    if(!faces)return;
    if(!valid())throw new Error('A ficha ou o dano mudou; a face não foi aplicada. Nenhum dado foi gasto.');
    controls.querySelector<HTMLInputElement>('[data-parry-face]')!.value=String(faces[0]);
    controls.dispatchEvent(new Event('input',{bubbles:true}));
  }finally{pending.delete(controls);}
}
