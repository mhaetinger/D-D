import {escape,type Engine,type Sheet} from './model';
import {canUseFeintingAttack,knowsFeintingAttack,previewFeintingAttack,applyFeintingAttack,feintingWeaponOption,commitFeintingWeaponAttack,resolveFeintingAtTable,endFeinting,feintingRollDetails,feintingRollDescription} from './feinting-attack';
import {pendingFeint,type PaidFeint} from './feinting-state';
import {currentFeintingAttack,currentWeaponAttack,type WeaponAttackSession} from './weapon-attack-session';
import {canEditSheet} from '../sheet-edit/access';
import {currentWorkspaceKey} from '../storage/account-scope';

const prepared=new WeakMap<Sheet,PaidFeint>(),pending=new WeakSet<Sheet>();
export const feintingPrepared=(c:Sheet,entry:Sheet)=>!!pendingFeint(c) && prepared.get(entry)===pendingFeint(c);
export function feintingStartControl(c:Sheet,E:Engine,source:string) {
  if(!knowsFeintingAttack(c,E))return '';
  const text='2014: ação bônus no seu turno e 1 dado para fintar uma criatura a até 1,5 m. Vantagem só no próximo ataque contra ela nesse turno; se acertar, soma o dado ao dano, dobrado no crítico. Gasta mesmo se errar ou não atacar. Outras vantagens não superam desvantagem. Distância, ação e fim do turno na mesa. Marque Finta na arma ao atacar esse alvo; outras criaturas não consomem a escolha. Magias/ataques próprios/sem dano: Resolver na mesa usa o dado já pago. Forma Selvagem continua manual.';
  return `<button type="button" data-rule-action="feintStart" data-resource="${source}" data-rule-tooltip="${escape(JSON.stringify({name:'Ataque de Finta · ação bônus',text}))}" ${!canEditSheet(c) || !canUseFeintingAttack(c,E,source)?'disabled':''}>Fintar</button>`;
}
export function feintingStatus(c:Sheet) {
  const waiting=pendingFeint(c),used=currentFeintingAttack(c)?.feinting,feint=waiting || used;
  const disabled=canEditSheet(c)?'':'disabled';
  return `<div data-feinting-status>${feint?`<div class="rule-controls text-xs p-2 min-w-0"><strong class="min-w-0 break-words">Finta · ${escape(feint.target)}</strong><span class="min-w-0 break-words">${waiting?'Próximo ataque contra esse alvo neste turno · vantagem':'Ataque feito · confirme acerto em Dano'} · d${feint.die} já pago</span>${waiting?`<button type="button" data-rule-action="feintTable" ${disabled}>Resolver na mesa</button>`:''}<button type="button" data-rule-action="feintEnd" ${disabled}>${waiting?'Terminei o turno / encerrar':'Errou / encerrar ataque'}</button></div>`:''}</div>`;
}
export function feintingWeaponTools(c:Sheet,entry:Sheet,index:number,E:Engine) {
  const feint=pendingFeint(c);
  return `<span data-feinting-tools="${index}">${feint && feintingWeaponOption(c,entry,E)?`<label class="inline-flex items-center gap-1.5 min-w-0 max-w-full" tabindex="0" data-rule-tooltip="${escape(JSON.stringify({name:'Atacar o alvo da Finta',text:'Marque apenas para o próximo ataque contra '+feint.target+' neste mesmo turno, sem outra manobra. Atq confirma antes de usar a vantagem; não cobra outro dado. Informe desvantagem no seletor do dado se houver, inclusive ataque à distância perto de inimigo: ela anula as fontes de vantagem. Ataques contra outras criaturas não usam a Finta. No acerto, Dano inclui o dado já pago. Ao acabar o turno, encerre a Finta.'}))}"><input type="checkbox" data-weapon-feinting-toggle="${index}" ${feintingPrepared(c,entry)?'checked':''} ${canEditSheet(c)?'':'disabled'}><span class="min-w-0 break-words">Finta · contra ${escape(feint.target)}</span></label>`:''}</span>`;
}
export function refreshFeintingUI(c:Sheet,E:Engine,refreshDamage?:(c:Sheet,index:number)=>void) {
  const status=document.querySelector('[data-feinting-status]');if(status)status.outerHTML=feintingStatus(c);
  for(const node of document.querySelectorAll<HTMLElement>('[data-feinting-tools]')){
    const index=Number(node.dataset.feintingTools),entry=c.weapons[index];if(entry)node.outerHTML=feintingWeaponTools(c,entry,index,E);
  }
  for(const button of document.querySelectorAll<HTMLButtonElement>('[data-rule-action="feintStart"]'))button.disabled=!canEditSheet(c) || !canUseFeintingAttack(c,E,button.dataset.resource!);
  if(refreshDamage)c.weapons.forEach((_:Sheet,index:number)=>refreshDamage(c,index));
}
export async function useFeintingAttack(c:Sheet,E:Engine,trigger:HTMLButtonElement,save:(description:string)=>void) {
  if(pending.has(c))return;pending.add(c);
  try{
    const host=window as any,scope=currentWorkspaceKey(),before=JSON.stringify(c),source=trigger.dataset.resource!,credit=pendingFeint(c),attack=currentFeintingAttack(c),settings=JSON.stringify(host.ruleDiceSettings());
    const valid=()=>host.getChar()===c && currentWorkspaceKey()===scope && trigger.isConnected && trigger.dataset.resource===source && JSON.stringify(c)===before && pendingFeint(c)===credit && currentFeintingAttack(c)===attack && JSON.stringify(host.ruleDiceSettings())===settings && canEditSheet(c);
    if(!valid() || !canUseFeintingAttack(c,E,source))throw new Error('Finta indisponível; confira reserva, ação e contexto.');
    const controls=document.createElement('div');controls.className='rule-dialog-fields';
    controls.innerHTML='<label>Alvo da Finta <input type="text" required maxlength="80" autocomplete="off" data-feinting-target placeholder="Nome ou identificação na mesa"></label><label class="rule-check"><input type="checkbox" required data-feinting-declared> É meu turno, tenho ação bônus e o alvo está a até 1,5 m ao fintar</label><p>Depois, marque Finta na arma só ao atacar esse alvo. A vantagem vale no próximo ataque contra ele, neste turno. No acerto, Dano inclui o dado já pago. Encerre ao terminar o turno. Recarregar, desfazer ou trocar ficha/modo descarta o contexto; resolva na mesa um dado ainda pago.</p>';
    if(!await host.confirmDestructiveAction('Ataque de Finta · ação bônus','Gasta 1 dado agora, mesmo se errar ou não atacar. A face só será rolada no dano se acertar. Não combina outra manobra nesse ataque.','Gastar dado e fintar',controls))return;
    if(!valid())throw new Error('A ficha, a conta ou a Finta mudou; nenhum dado foi gasto.');
    const choice={source,target:controls.querySelector<HTMLInputElement>('[data-feinting-target]')!.value,declared:controls.querySelector<HTMLInputElement>('[data-feinting-declared]')!.checked};
    previewFeintingAttack(c,choice,E);const feint=applyFeintingAttack(c,choice,E);
    save(`Ataque de Finta · ação bônus no próprio turno · alvo ${feint.target} a até 1,5 m ao fintar · gastou 1 dado de ${feint.name} (d${feint.die}), mesmo se errar/não atacar · próximo ataque contra esse alvo neste turno`);
  }finally{pending.delete(c);}
}
export async function chooseFeintingWeaponAttack(c:Sheet,entry:Sheet,index:number,E:Engine,validCaller:()=>boolean):Promise<WeaponAttackSession|null> {
  if(pending.has(c))return null;pending.add(c);
  try{
    const host=window as any,feint=pendingFeint(c),before=JSON.stringify(c),scope=currentWorkspaceKey(),dice=JSON.stringify(host.ruleDiceSettings()),attack=currentWeaponAttack(c,entry),trigger=document.querySelector(`[data-weapon-attack-label="${index}"]`);
    const valid=()=>!!feint && pendingFeint(c)===feint && feintingPrepared(c,entry) && host.getChar()===c && currentWorkspaceKey()===scope && c.weapons[index]===entry && JSON.stringify(c)===before && JSON.stringify(host.ruleDiceSettings())===dice && trigger?.isConnected && currentWeaponAttack(c,entry)===attack && canEditSheet(c) && validCaller();
    if(!valid())throw new Error('A Finta, a arma ou o contexto mudou.');
    const controls=document.createElement('div');controls.className='rule-dialog-fields';
    controls.innerHTML=`<label class="rule-check"><input type="checkbox" required data-feinting-attack><span class="min-w-0 break-words">É o próximo ataque contra ${escape(feint!.target)} neste mesmo turno, ainda não rolado/resolvido e sem outra manobra</span></label><p>O dado d${feint!.die} já foi pago. Se errar, não é devolvido. No acerto, Dano inclui o dado. Desvantagem informada no seletor anula a vantagem da Finta, mesmo com inspiração. Não altera o modo das próximas jogadas.</p>`;
    if(!await host.confirmDestructiveAction('Atacar o alvo da Finta','Use a vantagem só neste ataque. Alcance atual e desvantagens são conferidos na mesa.','Usar Finta e atacar',controls))return null;
    if(!valid())throw new Error('A Finta, o dado ou o ataque mudou; nenhum ataque foi aplicado.');
    const next=commitFeintingWeaponAttack(c,entry,controls.querySelector<HTMLInputElement>('[data-feinting-attack]')!.checked,E);prepared.delete(entry);return next;
  }finally{pending.delete(c);}
}
export async function useFeintingAtTable(c:Sheet,E:Engine,trigger:HTMLButtonElement,refreshDamage:(c:Sheet,index:number)=>void) {
  if(pending.has(c))return;pending.add(c);
  try{
    const host=window as any,feint=pendingFeint(c),scope=currentWorkspaceKey(),before=JSON.stringify(c),settings=JSON.stringify(host.ruleDiceSettings());
    const valid=()=>!!feint && pendingFeint(c)===feint && host.getChar()===c && currentWorkspaceKey()===scope && JSON.stringify(c)===before && JSON.stringify(host.ruleDiceSettings())===settings && trigger.isConnected && canEditSheet(c);
    if(!valid())throw new Error('O contexto da Finta mudou.');
    const controls=document.createElement('div');controls.className='rule-dialog-fields';controls.innerHTML=`<p class="break-words min-w-0">${escape(feint!.target)} · ${escape(feint!.name)} d${feint!.die} já pago. Pode ser arma, magia com jogada de ataque ou ataque próprio. Resistência do alvo não recebe vantagem. Se houver raios/feixes, vale só a primeira jogada contra esse alvo. Finta não conjura nem paga espaços de magia. No acerto, inclua 1d${feint!.die} do tipo do dano do ataque, ou 2d${feint!.die} em crítico. Sem jogada de dano, como Rede, não há dano extra.</p><label class="rule-check"><input type="checkbox" required data-feinting-table> Vou resolver na mesa o próximo ataque contra esse alvo neste mesmo turno, sem outra manobra</label>`;
    if(!await host.confirmDestructiveAction('Finta · resolver na mesa',feintingRollDescription(feintingRollDetails(host.ruleDiceSettings().mode)),'Usar o dado já pago',controls))return;
    if(!valid())throw new Error('A Finta ou o contexto mudou; nenhum uso adicional foi gasto.');
    resolveFeintingAtTable(c,controls.querySelector<HTMLInputElement>('[data-feinting-table]')!.checked);refreshFeintingUI(c,E,refreshDamage);host.showToast('Finta resolvida na mesa · '+feint!.target+' · d'+feint!.die+' já pago; sem novo gasto.');
  }finally{pending.delete(c);}
}
export function endFeintingUI(c:Sheet,E:Engine,refreshDamage:(c:Sheet,index:number)=>void) {
  if(!canEditSheet(c))return;const old=endFeinting(c);if(old)(window as any).clearPendingWeaponAttack?.(old.entry);refreshFeintingUI(c,E,refreshDamage);(window as any).showToast('Finta encerrada. O dado continua gasto.');
}
export function setupFeintingAttackUI(E:Engine) {
  document.addEventListener('change',event=>{
    const input=(event.target as HTMLElement).closest<HTMLInputElement>('[data-weapon-feinting-toggle]');if(!input)return;
    const host=window as any,c=host.getChar(),entry=c?.weapons[Number(input.dataset.weaponFeintingToggle)],feint=c && pendingFeint(c);if(!entry)return;
    if(!canEditSheet(c) || !feint || !feintingWeaponOption(c,entry,E)){input.checked=feintingPrepared(c,entry);host.showToast('Finta ou arma indisponível.');return;}
    if(input.checked)prepared.set(entry,feint);else prepared.delete(entry);
  });
}
