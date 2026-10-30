import {escape,state,type Engine,type Sheet} from './model';
import {COMBAT_ACTIONS,combatActionOptions,previewCombatAction,type CombatActionChoice} from './combat-actions';
import {combatActionPlan,combatActionState,finishCombatAction,holdCombatAction} from './combat-action-state';
import {beginWeaponAttack} from './weapon-attack-session';
import {refreshWeaponDamageLabel,setWeaponCriticalPrepared,setWeaponPowerAttackPrepared,weaponPowerAttackPrepared} from './weapon-damage-ui';
import {lungingPrepared} from './lunging-attack-ui';
import {feintingPrepared} from './feinting-attack-ui';
import {sheetRollDetails} from './roll-context';
import {hasFeat} from './passives';
import {readableSupportState} from './support-actions';
import {canEditSheet} from '../sheet-edit/access';
import {currentWorkspaceKey} from '../storage/account-scope';

export function combatActionTools(c:Sheet,entry:Sheet,index:number,E:Engine) {
 const a=combatActionState(c,entry);if(!combatActionOptions(c,entry,E).length && !a)return '';
 const p=combatActionPlan(c,entry,E);
 return `<button type="button" class="underline decoration-dotted" data-combat-action="${index}" ${canEditSheet(c)?'':'disabled'}>Ação / reação</button><span data-combat-action-status="${index}" class="basis-full min-w-0 break-words" ${a?'':'hidden'}>${a?.stale?'Ação anterior mudou · encerre e confira novo ataque':p?escape(p.name+' · '+p.choice.target):''}</span><button type="button" data-combat-action-end="${index}" ${a?'':'hidden'}>Errou / encerrar ação</button><output data-combat-action-result="${index}" class="basis-full min-w-0 break-words" role="status" hidden></output>`;
}
export function refreshCombatActionTools(c:Sheet,entry:Sheet,index:number,E:Engine) {
 const a=combatActionState(c,entry),p=combatActionPlan(c,entry,E),status=document.querySelector<HTMLElement>(`[data-combat-action-status="${index}"]`),end=document.querySelector<HTMLButtonElement>(`[data-combat-action-end="${index}"]`);
 if(status){status.hidden=!a;status.textContent=a?.stale?'A ficha mudou · encerre esta ação':p?p.name+' · '+p.choice.target+' · '+p.note:'';}if(end)end.hidden=!a;
}
export function discardCombatAction(c:Sheet,E:Engine) {
 const a=finishCombatAction(c);if(a){const index=c.weapons.indexOf(a.entry);(window as any).clearPendingWeaponAttack?.(a.entry);if(index>=0)refreshWeaponDamageLabel(c,index,E);}return a;
}
const pending=new WeakSet<Sheet>();
export function setupCombatActionsUI(E:Engine) {
 const host=window as any;
 document.addEventListener('click',async event=>{
  const trigger=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-combat-action],[data-combat-action-end]');if(!trigger || trigger.disabled)return;
  const c=host.getChar(),index=Number(trigger.dataset.combatAction ?? trigger.dataset.combatActionEnd),entry=c?.weapons[index];if(!entry || pending.has(c))return;pending.add(c);
  try {
   if(!canEditSheet(c))throw new Error('A edição desta ficha está bloqueada pelo mestre.');
   if(trigger.hasAttribute('data-combat-action-end')){discardCombatAction(c,E);setWeaponCriticalPrepared(c,index,E,false);setWeaponPowerAttackPrepared(c,index,E,false);return;}
   readableSupportState(c);
   if(lungingPrepared(entry) || feintingPrepared(c,entry))throw new Error('Encerre a preparação de Finta/Estendido antes de declarar esta outra ação. Manobras no acerto continuam disponíveis.');
   const before=JSON.stringify(c),scope=currentWorkspaceKey(),settings=JSON.stringify(host.ruleDiceSettings()),power=weaponPowerAttackPrepared(c,entry,E),options=combatActionOptions(c,entry,E);
   const valid=()=>host.getChar()===c && c.weapons[index]===entry && JSON.stringify(c)===before && currentWorkspaceKey()===scope && canEditSheet(c) && trigger.isConnected && JSON.stringify(host.ruleDiceSettings())===settings && weaponPowerAttackPrepared(c,entry,E)===power && !lungingPrepared(entry) && !feintingPrepared(c,entry);
   const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
   controls.innerHTML=`<label>Usar neste ataque <select data-action-kind>${options.map(k=>`<option value="${k}">${COMBAT_ACTIONS[k].name}</option>`).join('')}</select></label><label>Alvo <input type="text" maxlength="80" required data-action-target></label><p data-action-requirement></p><label class="rule-check"><input type="checkbox" required data-action-declared> Confirmo os requisitos acima e a ação/reação disponível</label><label class="rule-check" data-action-straight-label hidden><input type="checkbox" data-action-straight> Movi-me ao menos 3 m em linha reta imediatamente antes deste ataque · +5 ao dano se acertar</label><label class="rule-check" data-action-martial-label hidden><input type="checkbox" data-action-martial> Usar dado de Artes Marciais no lugar do d4</label><label class="rule-check" data-action-near-label><input type="checkbox" data-action-near> Há inimigo a até 1,5 m, capaz e que me vê · ataque à distância</label>${hasFeat(c,E,'Imobilizador')?'<label class="rule-check"><input type="checkbox" data-action-grappled> Esta criatura está agarrada por mim · Imobilizador</label>':''}<label>Dados <select data-action-source><option value="physical">Preparar ataque físico na mesa</option><option value="virtual" ${host.ruleDiceSettings().automatic?'':'disabled'}>Rolar ataque em Auto Ficha</option></select></label><output data-action-preview role="status"></output><p>Uma única ação declarada; sem controle automático de turnos. Munição, alcance, acerto e efeito no alvo são conferidos na mesa. No ataque físico, marque o crítico na arma antes de registrar o dano.</p>`;
   const field=(key:string)=>controls.querySelector<HTMLInputElement|HTMLSelectElement>(`[data-action-${key}]`)!;
   field('source').value=host.ruleDiceSettings().automatic?'virtual':'physical';
   const checked=(key:string)=>(field(key) as HTMLInputElement)?.checked || false;
   const read=():CombatActionChoice=>({kind:field('kind').value as CombatActionChoice['kind'],target:field('target').value,declared:checked('declared'),straight:checked('straight'),martial:checked('martial'),hostileNear:checked('near'),grappled:checked('grappled')});
   const update=()=>{
    const x=read(),kind=x.kind;
    controls.querySelector<HTMLElement>('[data-action-requirement]')!.textContent=COMBAT_ACTIONS[kind].requirement;
    for(const [key,enabled] of [['straight',kind==='charge'],['martial',kind==='polearmBonus' && previewMonkEligible(c,entry,E)],['near',kind==='crossbowBonus' || isRanged(c,entry,E)]] as const){const label=controls.querySelector<HTMLElement>(`[data-action-${key}-label]`)!;label.hidden=!enabled;if(!enabled)(field(key) as HTMLInputElement).checked=false;}
    try {const p=previewCombatAction(c,entry,{...read(),target:read().target || 'Alvo',declared:true},E),d=sheetRollDetails(c,{type:'attack',weapon:entry,ranged:isRanged(c,entry,E),hostileNear:checked('near'),grappledByYou:checked('grappled')},host.ruleDiceSettings().mode,E);controls.querySelector<HTMLOutputElement>('[data-action-preview]')!.textContent=`${p.cost} · ataque ${Number(p.w.bonus)-(power?5:0)>=0?'+':''}${Number(p.w.bonus)-(power?5:0)} · dano ${p.w.damage}${p.fixed?' +5 Investida':''}${power?' +10 do talento':''} · ${d.mode==='adv'?'vantagem':d.mode==='dis'?'desvantagem':'normal'}. ${p.note} ${d.notes.join(' ')}`;}
    catch(error){controls.querySelector<HTMLOutputElement>('[data-action-preview]')!.textContent=(error as Error).message;}
   };
   controls.addEventListener('change',e=>{if((e.target as HTMLElement).matches('[data-action-kind]'))(field('declared') as HTMLInputElement).checked=false;update();});controls.addEventListener('input',update);update();
   const decision=host.confirmDestructiveAction('Ação / reação · '+entry.name,'Escolha antes de rolar. O cadastro da arma fica preservado.','Declarar ataque',controls);if(controls.isConnected){field('kind').focus({preventScroll:true});controls.closest('dialog')!.scrollTop=0;}if(!await decision)return;
   if(!valid())throw new Error('A ficha, a conta, a permissão ou a preparação mudou. Nenhuma ação foi registrada ou rolada.');
   const p=previewCombatAction(c,entry,read(),E),virtual=field('source').value==='virtual';
   if(virtual && !host.ruleDiceSettings().automatic)throw new Error('Use Auto Ficha para rolar ou prepare o ataque físico.');
   discardCombatAction(c,E);state(c);host.recordStepAndSave(`Declarou ${p.name} · ${p.cost} contra ${p.choice.target}`,true,false);
   const attack=beginWeaponAttack(c,entry);holdCombatAction(c,entry,attack,p.choice,E);setWeaponCriticalPrepared(c,index,E,false);
   const context={type:'attack' as const,weapon:entry,weaponAttack:attack,ranged:isRanged(c,entry,E),hostileNear:p.choice.hostileNear,grappledByYou:p.choice.grappled};
   const details=sheetRollDetails(c,context,host.ruleDiceSettings().mode,E),bonus=Number(p.w.bonus)-(power?5:0),result=virtual?host.triggerSheetRoll('1d20'+(bonus<0?'':'+')+bonus,p.name+' · '+p.choice.target,true,context):null;
   if(result)setWeaponCriticalPrepared(c,index,E,result.d20Natural>=(p.w.critical || 20));
   const text=`${p.name} · ${p.cost} declarada contra ${p.choice.target}. ${virtual?'Ataque rolado; resolva o acerto na mesa.':`Ataque físico ${bonus>=0?'+':''}${bonus}, ${details.mode==='adv'?'vantagem':details.mode==='dis'?'desvantagem':'normal'}; inspiração preparada não foi gasta.`} ${p.note} No acerto, use Dano/Adicionais; no erro, encerre esta ação.`;
   refreshWeaponDamageLabel(c,index,E);for(const out of document.querySelectorAll<HTMLOutputElement>(`[data-combat-action-result="${index}"]`)){out.hidden=false;out.textContent=text;}host.showToast(text);
  }catch(error){host.showToast((error as Error).message);}finally{pending.delete(c);}
 });
}
// Consulta ao motor puro sem aproveitar sessão anterior na escolha de outra ação.
import {weaponStats} from './combat';
const previewMonkEligible=(c:Sheet,w:Sheet,E:Engine)=>!!weaponStats(c,w,E).monkWeapon;
const isRanged=(c:Sheet,w:Sheet,E:Engine)=>!!weaponStats(c,w,E).rangedWeapon || w.attackMode==='thrown';

export const spellAttackHasContext=(c:Sheet,E:Engine)=>hasFeat(c,E,'Especialista em Besta') || hasFeat(c,E,'Imobilizador');
/** Não deduz corpo a corpo pelo alcance da magia: efeitos como lâminas usam
 * alcance Pessoal. O jogador declara qual ataque está fazendo neste instante. */
export async function chooseSpellAttackSituation(c:Sheet,E:Engine,trigger:HTMLElement,validSpell:()=>boolean) {
 if(pending.has(c))return null;pending.add(c);
 try {
  const host=window as any,before=JSON.stringify(c),scope=currentWorkspaceKey(),settings=JSON.stringify(host.ruleDiceSettings());
  const valid=()=>host.getChar()===c && canEditSheet(c) && currentWorkspaceKey()===scope && trigger.isConnected && JSON.stringify(c)===before && JSON.stringify(host.ruleDiceSettings())===settings && validSpell();
  if(!valid())throw new Error('A magia ou a permissão mudou.');
  const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
  controls.innerHTML=`<label>Este ataque da magia <select data-spell-situation-range><option value="ranged">É à distância</option><option value="melee">É corpo a corpo</option></select></label><label class="rule-check" data-spell-situation-near-label><input type="checkbox" data-spell-situation-near> Há inimigo a até 1,5 m, que me vê e não está incapacitado</label>${hasFeat(c,E,'Imobilizador')?'<label class="rule-check"><input type="checkbox" data-spell-situation-grappled> Ataco a criatura que está agarrada por mim</label>':''}<output data-spell-situation-preview role="status"></output><p>Só rola o ataque. Registre a conjuração e seu custo no botão da magia, mesmo se errar.</p>`;
  const read=()=>({ranged:controls.querySelector<HTMLSelectElement>('[data-spell-situation-range]')!.value==='ranged',hostileNear:controls.querySelector<HTMLInputElement>('[data-spell-situation-near]')!.checked,grappledByYou:!!controls.querySelector<HTMLInputElement>('[data-spell-situation-grappled]')?.checked});
  const update=()=>{const p=read(),near=controls.querySelector<HTMLInputElement>('[data-spell-situation-near]')!;near.disabled=!p.ranged;if(near.disabled)near.checked=false;controls.querySelector<HTMLElement>('[data-spell-situation-near-label]')!.hidden=!p.ranged;const d=sheetRollDetails(c,{type:'attack',...read()},host.ruleDiceSettings().mode,E);controls.querySelector<HTMLOutputElement>('[data-spell-situation-preview]')!.textContent=`${d.mode==='adv'?'Vantagem':d.mode==='dis'?'Desvantagem':'Normal'}. ${d.advantage.join(', ')} ${d.disadvantage.join(', ')} ${d.notes.join(' ')}`;};
  controls.addEventListener('change',update);update();
  const decision=host.confirmDestructiveAction('Contexto do ataque com magia','Especialista em Besta também evita a desvantagem por inimigo próximo em ataques de magia à distância. Outras fontes continuam valendo.','Rolar ataque',controls);
  if(controls.isConnected){controls.querySelector<HTMLElement>('[data-spell-situation-range]')!.focus({preventScroll:true});controls.closest('dialog')!.scrollTop=0;}
  if(!await decision)return null;
  if(!valid())throw new Error('A magia, a ficha, a conta ou o modo mudou. Nenhum ataque foi rolado.');
  return read();
 }finally{pending.delete(c);}
}
