import {type Engine,type Sheet} from './model';
import {PHYSICAL_CONTESTS,physicalContestOptions,previewPhysicalContest,physicalContestResult,physicalContestTotal,type PhysicalContestChoice} from './physical-contests';
import {chooseDieSource,dieSourceControls} from './health-ui';
import {consumeInspiration} from './health';
import {readableSupportState} from './support-actions';
import {canEditSheet} from '../sheet-edit/access';
import {currentWorkspaceKey} from '../storage/account-scope';
import {discardCombatAction} from './combat-actions-ui';

export const physicalContestControls=()=>'<div class="rule-controls"><button type="button" data-physical-contest>Agarrar / empurrar</button><output data-physical-contest-result role="status" class="basis-full min-w-0 break-words" hidden></output></div>';
const pending=new WeakSet<Sheet>();
export function setupPhysicalContestsUI(E:Engine,save:(description:string)=>void) {
 const host=window as any;
 document.addEventListener('click',async e=>{
  const trigger=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-physical-contest]');if(!trigger || trigger.disabled)return;
  const c=host.getChar();if(!c || pending.has(c))return;pending.add(c);
  try {
   readableSupportState(c);if(!canEditSheet(c))throw new Error('A edição desta ficha está bloqueada pelo mestre.');
   const before=JSON.stringify(c),scope=currentWorkspaceKey(),settings=JSON.stringify(host.ruleDiceSettings()),valid=()=>host.getChar()===c && canEditSheet(c) && currentWorkspaceKey()===scope && trigger.isConnected && JSON.stringify(c)===before && JSON.stringify(host.ruleDiceSettings())===settings;
   const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
   controls.innerHTML=`<label>Ação <select data-contest-kind>${physicalContestOptions(c,E).map(k=>`<option value="${k}">${PHYSICAL_CONTESTS[k].name}</option>`).join('')}</select></label><label>Alvo <input maxlength="80" required data-contest-target></label><p data-contest-requirement></p><label class="rule-check"><input type="checkbox" required data-contest-declared> Confirmo os requisitos e a ação disponível</label><label class="rule-check" data-contest-straight-label hidden><input type="checkbox" data-contest-straight> Movi-me pelo menos 3 m em linha reta imediatamente antes · empurrar até 3 m</label><label data-contest-prone-label hidden>Resultado pretendido <select data-contest-prone><option value="push">Afastar</option><option value="prone">Derrubar</option></select></label><label>Total final de Atletismo ou Acrobacia do alvo · opcional <input type="number" min="-1000" max="1000" step="1" data-contest-opposed></label>${dieSourceControls(20,false)}<output data-contest-preview role="status"></output><p>É disputa de habilidade, não ataque contra CA nem resistência. O alvo escolhe FOR (Atletismo) ou DES (Acrobacia). Empate mantém a situação anterior. No dado físico, informe a face escolhida após vantagem/desvantagem. Sortudo e outras repetições: resolva na mesa neste assistente.</p>`;
   chooseDieSource(controls);
   const f=(key:string)=>controls.querySelector<HTMLInputElement|HTMLSelectElement>(`[data-contest-${key}]`)!;
   const read=():PhysicalContestChoice=>({kind:f('kind').value as PhysicalContestChoice['kind'],target:f('target').value,declared:(f('declared') as HTMLInputElement).checked,straight:(f('straight') as HTMLInputElement).checked,prone:f('prone').value==='prone',opposed:f('opposed').value.trim()?Number(f('opposed').value):null});
   const update=()=>{const k=read().kind;controls.querySelector<HTMLElement>('[data-contest-requirement]')!.textContent=PHYSICAL_CONTESTS[k].cost+' · '+PHYSICAL_CONTESTS[k].requirement;controls.querySelector<HTMLElement>('[data-contest-straight-label]')!.hidden=k!=='charge';if(k!=='charge')(f('straight') as HTMLInputElement).checked=false;controls.querySelector<HTMLElement>('[data-contest-prone-label]')!.hidden=['grapple','pin'].includes(k);if(['grapple','pin'].includes(k))f('prone').value='push';try{const p=previewPhysicalContest(c,{...read(),target:read().target || 'Alvo',declared:true},host.ruleDiceSettings().mode,E);controls.querySelector<HTMLOutputElement>('[data-contest-preview]')!.textContent=`Atletismo ${p.bonus>=0?'+':''}${p.bonus} · ${p.mode==='adv'?'vantagem':p.mode==='dis'?'desvantagem':'normal'}. ${p.rules.reliableTalent?'Talento Confiável. ':''}${p.rules.indomitableMight?'Força Indomável: total mínimo '+p.rules.indomitableMight+'. ':''}Se vencer: ${p.effect}`;}catch(error){controls.querySelector<HTMLOutputElement>('[data-contest-preview]')!.textContent=(error as Error).message;}};
   controls.addEventListener('input',update);controls.addEventListener('change',e=>{if((e.target as HTMLElement).matches('[data-contest-kind]'))(f('declared') as HTMLInputElement).checked=false;update();});update();
   const decision=host.confirmDestructiveAction('Agarrar / empurrar · 2014','A ficha calcula seu teste; o alvo e as condições são resolvidos na mesa.','Registrar disputa',controls);if(controls.isConnected){f('kind').focus({preventScroll:true});controls.closest('dialog')!.scrollTop=0;}if(!await decision)return;
   if(!valid())throw new Error('A ficha, a conta, a permissão ou o dado mudou. Nenhuma disputa foi registrada.');
   const p=previewPhysicalContest(c,read(),host.ruleDiceSettings().mode,E),virtual=controls.querySelector<HTMLSelectElement>('[data-health-source]')!.value==='virtual',face=Number(controls.querySelector<HTMLInputElement>('[data-health-face]')!.value);
   if(virtual && !host.ruleDiceSettings().enabled)throw new Error('Dados virtuais desligados.');
   if(!virtual)physicalContestResult(p,face);
   discardCombatAction(c,E);
   const r=virtual?physicalContestTotal(p,host.rollRuleCheck(p.name,p.mode,{type:'check',skill:'atletismo',ability:'str'},p.bonus).total):physicalContestResult(p,face),inspired=p.inspired && consumeInspiration(c);
   const text=`${p.name} · ${p.cost} contra ${p.target}: Atletismo total ${r.total}${p.opposed!==null?' / oponente '+p.opposed:''} · ${r.success===null?'compare os totais na mesa':r.tie?'empate: situação anterior mantida':r.success?'venceu: '+p.effect:'não superou o alvo; situação anterior mantida'}${inspired?' · inspiração usada':''}. Condições/posição no alvo são manuais.`;
   save(text);for(const out of document.querySelectorAll<HTMLOutputElement>('[data-physical-contest-result]')){out.hidden=false;out.textContent=text;}host.showToast(text);
  }catch(error){host.showToast((error as Error).message);}finally{pending.delete(c);}
 });
}
