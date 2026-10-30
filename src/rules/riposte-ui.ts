import {escape,type Engine,type Sheet} from './model';
import {riposteOption,previewRiposte,commitRiposte} from './riposte';
import {currentRiposte,currentWeaponAttack,finishRiposte,type WeaponAttackSession} from './weapon-attack-session';
import {superiorityOptions} from './superiority';
import {canEditSheet} from '../sheet-edit/access';
import {currentWorkspaceKey} from '../storage/account-scope';

const pending=new WeakSet<Sheet>();
export function riposteTools(c:Sheet,entry:Sheet,index:number,E:Engine) {
  const paid=currentWeaponAttack(c,entry)?.riposte;
  if(!riposteOption(c,entry,E) && !paid)return '';
  const text='2014: após uma criatura errar uma jogada de ataque corpo a corpo contra você, use sua reação e um dado para um ataque corpo a corpo com arma contra ela, no alcance da arma. Também pode responder a ataque de oportunidade ou ataque corpo a corpo com magia que errou; agarrão/empurrão não têm jogada de ataque e não ativam. O dado é gasto antes do seu ataque, mesmo se errar. No acerto, soma ao dano e dobra em crítico. Não combina outra manobra, não é ação Atacar nem ataque de oportunidade. Ataque Extra não concede outros ataques aqui. Reação/alcance/alvo ficam na mesa.';
  return `<span data-riposte-tools="${index}" class="min-w-0"><button type="button" data-riposte-start="${index}" class="underline decoration-dotted text-left" data-rule-tooltip="${escape(JSON.stringify({name:'Contra-Atacar',text}))}" ${!canEditSheet(c) || currentRiposte(c)?'disabled':''}>Contra-atacar</button>${paid?`<span class="block min-w-0 break-words" role="status">Contra-Atacar · ${escape(paid.target)} · d${paid.die} já pago. Confirme acerto em Dano.</span><button type="button" data-riposte-end="${index}" class="underline" ${!canEditSheet(c)?'disabled':''}>Errou / encerrar contra-ataque</button>`:''}</span>`;
}
export function refreshRiposteTools(c:Sheet,E:Engine) {
  for(const node of document.querySelectorAll<HTMLElement>('[data-riposte-tools]')){
    const index=Number(node.dataset.riposteTools),entry=c.weapons[index];if(entry)node.outerHTML=riposteTools(c,entry,index,E);
  }
}
/** Reutiliza confirmação nativa antes do único gasto. A mesa confirma a reação,
 * sem criar contador fictício por rodada ou alterar a ficha do atacante. */
export async function chooseRiposte(c:Sheet,entry:Sheet,index:number,E:Engine,save:(description:string)=>void,validCaller:()=>boolean):Promise<WeaponAttackSession|null> {
  if(pending.has(c))return null;
  pending.add(c);
  try{
    const host=window as any,workspace=currentWorkspaceKey(),before=JSON.stringify(c),dice=JSON.stringify(host.ruleDiceSettings()),attack=currentWeaponAttack(c,entry),trigger=document.querySelector(`[data-riposte-start="${index}"]`);
    const valid=()=>!!trigger?.isConnected && host.getChar()===c && currentWorkspaceKey()===workspace && c.weapons[index]===entry && JSON.stringify(c)===before && JSON.stringify(host.ruleDiceSettings())===dice && currentWeaponAttack(c,entry)===attack && canEditSheet(c) && validCaller();
    if(!valid() || !riposteOption(c,entry,E))throw new Error('A ficha ou a arma mudou. Nenhum dado foi gasto.');
    const sources=superiorityOptions(c,E),controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
    controls.innerHTML=`<label>Criatura que errou o ataque <input type="text" maxlength="80" required data-riposte-target></label><label>Origem do dado <select data-riposte-source>${sources.map(s=>`<option value="${s.id}" ${s.remaining>0?'':'disabled'}>${escape(s.name)} · d${s.die} · ${s.readable?`${s.remaining}/${s.resource.max}`:'conferir registro'}</option>`).join('')}</select></label><label class="rule-check"><input type="checkbox" required data-riposte-triggered> Essa criatura errou uma jogada corpo a corpo contra mim; tenho reação disponível e ela está no alcance desta arma</label><label class="rule-check"><input type="checkbox" required data-riposte-new> Vou atacar essa criatura agora, ainda não rolei/resolvi e não uso outra manobra neste ataque</label><p>Um ataque com reação, mesmo fora do seu turno. O dado é gasto mesmo se errar; no acerto, Dano inclui o dado já pago. Não gaste novamente em Usar na mesa. Recarregar/desfazer/trocar contexto descarta este ataque; resolva na mesa o dado já pago se necessário.</p>`;
    const source=controls.querySelector<HTMLSelectElement>('[data-riposte-source]')!;source.value=sources.find(s=>s.remaining>0)?.id || '';
    const choice=()=>({source:source.value,target:controls.querySelector<HTMLInputElement>('[data-riposte-target]')!.value,triggered:controls.querySelector<HTMLInputElement>('[data-riposte-triggered]')!.checked,newAttack:controls.querySelector<HTMLInputElement>('[data-riposte-new]')!.checked});
    if(!await host.confirmDestructiveAction('Contra-Atacar · reação','Gasta 1 dado e sua reação para um único ataque contra a criatura que errou. A face do dado entra apenas no dano de um acerto.','Gastar dado e contra-atacar',controls))return null;
    if(!valid())throw new Error('A ficha, o dado ou o ataque mudou. Nenhum uso foi aplicado.');
    const plan=previewRiposte(c,entry,choice(),E),next=commitRiposte(c,entry,choice(),E);
    save(`Contra-Atacar · ${plan.w.name} contra ${plan.target} · reação/erro corpo a corpo/alcance confirmados na mesa · gastou 1 dado de ${plan.source.name} (d${plan.source.die}), mesmo se errar; dano só no acerto`);
    return next;
  }finally{pending.delete(c);}
}
export function setupRiposteUI(E:Engine,refreshDamage:(c:Sheet,index:number)=>void) {
  const host=window as any;
  document.addEventListener('click',event=>{
    const start=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-riposte-start]');
    if(start && !start.disabled){void host.rollWeapon(Number(start.dataset.riposteStart),'riposte');return;}
    const end=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-riposte-end]');if(!end || end.disabled)return;
    const c=host.getChar(),entry=c?.weapons[Number(end.dataset.riposteEnd)];if(!entry || !canEditSheet(c) || !currentWeaponAttack(c,entry)?.riposte)return;
    finishRiposte(c);host.clearPendingWeaponAttack?.(entry);refreshRiposteTools(c,E);refreshDamage(c,Number(end.dataset.riposteEnd));host.showToast('Contra-ataque encerrado. O dado e a reação continuam gastos.');
  });
}
