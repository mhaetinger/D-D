import {escape,type Engine,type Sheet} from './model';
import {lungingAttackOption,previewLungingAttack,commitLungingAttack} from './lunging-attack';
import {currentWeaponAttack,finishWeaponAttack,type WeaponAttackSession} from './weapon-attack-session';
import {superiorityOptions} from './superiority';
import {canEditSheet} from '../sheet-edit/access';
import {currentWorkspaceKey} from '../storage/account-scope';

const prepared=new WeakSet<Sheet>(),pending=new WeakSet<Sheet>();
export const lungingPrepared=(entry:Sheet)=>prepared.has(entry);
export function lungingAttackTools(c:Sheet,entry:Sheet,index:number,E:Engine) {
  const paid=currentWeaponAttack(c,entry)?.lunging;
  if(!lungingAttackOption(c,entry,E) && !paid)return '';
  const text='2014: marque antes de um novo ataque corpo a corpo no seu turno. Ao clicar em Atq, escolha a origem e confirme o gasto, mesmo se errar. Aumenta o alcance desse ataque em 1,5 m; no acerto, soma o dado ao dano (dobra em crítico). Não exige ação bônus, não muda o alcance de magias e não combina outra manobra neste ataque. Alcance e acerto são conferidos na mesa.';
  return `<span data-lunging-tools="${index}"><label class="inline-flex items-center gap-1.5" tabindex="0" data-rule-tooltip="${escape(JSON.stringify({name:'Ataque Estendido',text}))}"><input type="checkbox" data-weapon-lunging-toggle="${index}" ${prepared.has(entry)?'checked':''} ${!canEditSheet(c)?'disabled':''}> Estendido · +1,5 m</label>${paid?`<span class="block" role="status">Estendido: +1,5 m neste ataque · d${paid.die} já pago. Confirme acerto em Dano.</span><button type="button" class="underline" data-lunging-end="${index}" ${!canEditSheet(c)?'disabled':''}>Errou / encerrar ataque</button>`:''}</span>`;
}
export function refreshLungingTools(c:Sheet,E:Engine) {
  for(const node of document.querySelectorAll<HTMLElement>('[data-lunging-tools]')){
    const index=Number(node.dataset.lungingTools),entry=c.weapons[index];
    if(entry)node.outerHTML=lungingAttackTools(c,entry,index,E);
  }
}
/** Escolha e gasto antes do d20, sem rolar a face do dano. Revalida também o
 * contexto transitório, pois outro ataque pode mudar sem alterar o documento. */
export async function chooseLungingAttack(c:Sheet,entry:Sheet,index:number,E:Engine,save:(description:string)=>void,validCaller:()=>boolean):Promise<WeaponAttackSession|null> {
  if(pending.has(c))return null;
  pending.add(c);
  try{
    const host=window as any,workspace=currentWorkspaceKey(),before=JSON.stringify(c),dice=JSON.stringify(host.ruleDiceSettings()),attack=currentWeaponAttack(c,entry),trigger=document.querySelector(`[data-weapon-attack-label="${index}"]`);
    const valid=()=>!!trigger?.isConnected && host.getChar()===c && currentWorkspaceKey()===workspace && c.weapons[index]===entry && JSON.stringify(c)===before && JSON.stringify(host.ruleDiceSettings())===dice && currentWeaponAttack(c,entry)===attack && prepared.has(entry) && canEditSheet(c) && validCaller();
    if(!valid() || !lungingAttackOption(c,entry,E))throw new Error('A ficha, a arma ou a preparação mudou. Nenhum dado foi gasto.');
    const sources=superiorityOptions(c,E),controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
    controls.innerHTML=`<label>Origem do dado <select data-lunging-source>${sources.map(s=>`<option value="${s.id}" ${s.remaining>0?'':'disabled'}>${escape(s.name)} · d${s.die} · ${s.remaining}/${s.resource.max}</option>`).join('')}</select></label><label class="rule-check"><input type="checkbox" required data-lunging-declared> É um novo ataque corpo a corpo no meu turno, ainda não rolado/resolvido e sem outra manobra</label><p>Se errar, o dado continua gasto. No acerto, Dano inclui o dado sem cobrar outra vez. Alcance do alvo na mesa. Recarregar, desfazer ou trocar ficha/modo descarta este contexto; resolva na mesa o dado já pago se necessário.</p>`;
    const source=controls.querySelector<HTMLSelectElement>('[data-lunging-source]')!;source.value=sources.find(s=>s.remaining>0)?.id || '';
    const choice=()=>({source:source.value,ownTurn:controls.querySelector<HTMLInputElement>('[data-lunging-declared]')!.checked,newAttack:controls.querySelector<HTMLInputElement>('[data-lunging-declared]')!.checked});
    if(!await host.confirmDestructiveAction('Ataque Estendido · antes do ataque','Gasta 1 dado para alcance +1,5 m apenas neste ataque. O dado do dano será rolado só se acertar. Não exige ação bônus.','Gastar dado e atacar',controls))return null;
    if(!valid())throw new Error('A ficha, o dado ou o ataque mudou. Nenhum uso foi aplicado.');
    const plan=previewLungingAttack(c,entry,choice(),E),next=commitLungingAttack(c,entry,choice(),E);
    prepared.delete(entry);
    save(`Ataque Estendido · ${plan.w.name} · alcance +1,5 m neste ataque no próprio turno · gastou 1 dado de ${plan.source.name} (d${plan.source.die}), mesmo se errar; dano só no acerto`);
    return next;
  }finally{pending.delete(c);}
}
export function setupLungingAttackUI(E:Engine,refreshDamage:(c:Sheet,index:number)=>void) {
  const host=window as any;
  document.addEventListener('change',event=>{
    const input=(event.target as HTMLElement).closest<HTMLInputElement>('[data-weapon-lunging-toggle]');if(!input)return;
    const c=host.getChar(),entry=c?.weapons[Number(input.dataset.weaponLungingToggle)];if(!entry)return;
    if(!canEditSheet(c) || !lungingAttackOption(c,entry,E)){input.checked=prepared.has(entry);host.showToast('Esta ficha ou arma não permite preparar Ataque Estendido.');return;}
    if(input.checked)prepared.add(entry);else prepared.delete(entry);
  });
  document.addEventListener('click',event=>{
    const trigger=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-lunging-end]');if(!trigger || trigger.disabled)return;
    const c=host.getChar(),entry=c?.weapons[Number(trigger.dataset.lungingEnd)];if(!entry || !canEditSheet(c))return;
    if(currentWeaponAttack(c,entry)?.lunging){finishWeaponAttack(c,entry);host.clearPendingWeaponAttack?.(entry);refreshLungingTools(c,E);refreshDamage(c,Number(trigger.dataset.lungingEnd));host.showToast('Ataque Estendido encerrado. O dado continua gasto.');}
  });
}
