import {active,escape,type Engine,type Sheet} from './model';
import {DRAGON_ANCESTRIES,dragonAncestry,isDragonborn,racialBreathProfile,setDragonChoice} from './draconic-ancestry';
import {BREATH_ID,BREATH_TYPES,previewDragonbornBreath,useDragonbornBreath,type BreathOptions} from './dragonborn-breath';
import {remaining,type Resource} from './resources';
import {chooseDieSource,dieSourceControls} from './health-ui';
import {canConfigureSheet} from '../sheet-edit/lock';
import {canEditSheet} from '../sheet-edit/access';

export function dragonbornBreathControls(c:Sheet,E:Engine,r:Resource,maxInput:string|number) {
  const p=racialBreathProfile(c,E),value=remaining(c,r),shape=active(c,'druida:wildShape');
  const recorded=c.ruleState?.used?.[BREATH_ID],invalid=recorded!==undefined && (!Number.isSafeInteger(recorded) || recorded<0);
  const choice=p?.choice || '',editable=canConfigureSheet(c),last=c.ruleState?.lastBreath;
  const result=last?.version===1 && dragonAncestry(last.choice) && Number.isSafeInteger(last.total) && last.total>=2 && last.total<=30 && last.half===Math.floor(last.total/2)?`<output class="rule-breath-result" data-breath-result>Último: ${last.total} ${escape(BREATH_TYPES[last.type] || '')} · metade ${last.half}</output>`:'';
  return `${editable?`<label class="rule-breath-ancestry">Ancestralidade racial <select data-breath-ancestry aria-label="Ancestralidade do sopro"><option value="">Escolha o ancestral</option>${DRAGON_ANCESTRIES.map(d=>`<option value="${escape(d.choice)}" ${d.choice===choice?'selected':''}>${escape(d.choice)}</option>`).join('')}</select></label>`:''}
    <span class="rule-breath-profile" data-breath-profile>${p?`${escape(p.choice)} · ${escape(p.dice || '?')} · ${escape(p.area)} · ${p.save==='dex'?'DES':'CON'} ${shape?'CD da forma a informar':'CD '+(p.dc ?? '?')}`:editable?'Escolha o ancestral para conferir dano, área e CD.':'Desbloqueie a ficha para escolher a ancestralidade racial.'}</span>
    <span>${value}/${maxInput} usos${r.max!==1?' · adaptação':''}</span><button type="button" data-breath-action="use" ${!canEditSheet(c) || !p || !p.dice || p.dc===null || !(value>=1)?'disabled':''}>Usar sopro</button><button type="button" data-rule-action="refund" data-resource="${BREATH_ID}" ${!canEditSheet(c) || invalid || value===r.max?'disabled':''} aria-label="Devolver um uso de Arma de Sopro">↶</button>${result}`;
}

export function setupDragonbornBreathUI(E:Engine,save:(description:string)=>void) {
  const host=window as any,pending=new WeakSet<Sheet>();
  document.addEventListener('change',event=>{
    const input=(event.target as HTMLElement).closest<HTMLSelectElement>('[data-breath-ancestry]');if(!input)return;
    const c=host.getChar();if(!c)return;
    const restore=()=>{input.value=racialBreathProfile(c,E)?.choice || '';};
    try {
      if(!isDragonborn(c) || !canConfigureSheet(c))throw new Error('Desbloqueie a ficha para alterar a ancestralidade racial.');
      setDragonChoice(c,'raceDragon',input.value);
      save('Ancestralidade racial · '+(input.value || 'não escolhida')+' · usos preservados');
      // Recoloca o próprio select depois da atualização comum, conservando
      // foco/posição e sem reabrir a lista ou conceder outro uso.
      const next=document.querySelector<HTMLSelectElement>('[data-breath-ancestry]');
      if(next){next.replaceWith(input);restore();input.focus({preventScroll:true});}
    }catch(error){restore();host.showToast((error as Error).message);}
  });
  document.addEventListener('click',async event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-breath-action="use"]');if(!button || button.disabled)return;
    const c=host.getChar();if(!c || pending.has(c))return;
    pending.add(c);
    try {
      if(!canEditSheet(c))throw new Error('A edição desta ficha está bloqueada pelo mestre.');
      const shape=active(c,'druida:wildShape'),base=previewDragonbornBreath(c,E,shape?{shapeCapable:true,shapeCon:0}:{}),before=JSON.stringify(c);
      const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
      controls.innerHTML=`<p>${escape(base.choice)} · ${escape(base.area)} · ${base.save==='dex'?'DES':'CON'} <strong data-breath-dc>${shape?'informe a CON da forma':'CD '+base.dc}</strong></p><p>${escape(base.dice)} na falha; metade no sucesso, arredondada para baixo. Cada criatura na área, incluindo aliados, faz sua própria resistência na mesa; confira as defesas dos alvos.</p>${shape?'<label>Modificador de CON da forma <input type="number" min="-5" max="10" step="1" required data-breath-shape-con></label><label class="rule-check"><input type="checkbox" required data-breath-shape-capable> A forma é fisicamente capaz de usar o sopro · confirmado com a mesa</label>':''}${dieSourceControls(6,false)}`;
      const input=controls.querySelector<HTMLInputElement>('[data-health-face]')!,label=controls.querySelector<HTMLElement>('[data-health-face-label]')!;
      label.firstChild!.textContent=`Total dos ${base.dice} físicos `;input.min=String(base.count);input.max=String(base.count*6);input.setAttribute('aria-label','Total do dano do sopro');
      chooseDieSource(controls);
      const options=():BreathOptions=>shape?{shapeCon:controls.querySelector<HTMLInputElement>('[data-breath-shape-con]')!.value.trim()?Number(controls.querySelector<HTMLInputElement>('[data-breath-shape-con]')!.value):undefined,shapeCapable:controls.querySelector<HTMLInputElement>('[data-breath-shape-capable]')!.checked}:{};
      controls.addEventListener('input',()=>{
        if(!shape)return;
        try {controls.querySelector('[data-breath-dc]')!.textContent='CD '+previewDragonbornBreath(c,E,options()).dc;}
        catch(error){controls.querySelector('[data-breath-dc]')!.textContent=(error as Error).message;}
      });
      if(!await host.confirmDestructiveAction('Usar Arma de Sopro?','Ação de 2014: gasta um uso racial, recuperado em descanso curto ou longo. Não é magia, não gasta espaço e não substitui um dos ataques de Ataque Extra.','Usar e registrar dano',controls))return;
      if(host.getChar()!==c || JSON.stringify(c)!==before || !canEditSheet(c))throw new Error('A ficha ou a permissão mudou durante a escolha. Confira o sopro novamente; nenhum uso foi gasto.');
      const profile=previewDragonbornBreath(c,E,options()),virtual=controls.querySelector<HTMLSelectElement>('[data-health-source]')!.value==='virtual';
      if(virtual && !host.ruleDiceSettings().enabled)throw new Error('Dados virtuais desligados. Registre o total dos dados físicos.');
      const total=virtual?host.rollWeaponFormula(profile.dice,'Arma de Sopro · '+profile.choice).total:Number(input.value);
      const result=useDragonbornBreath(c,total,E,options(),virtual?'virtual':'physical');
      save(`Arma de Sopro · ${profile.choice} · ${profile.dice} = ${result.total}; metade ${result.half} · ${profile.area} · ${profile.save==='dex'?'DES':'CON'} CD ${result.dc} · ${virtual?'virtual':'físico'} · -1 uso racial`);
      host.showToast(`Sopro: ${result.total} ${profile.label}; sucesso na resistência: ${result.half}. Confira as defesas dos alvos.`);
    }catch(error){host.showToast((error as Error).message);}
    finally{pending.delete(c);}
  });
}
