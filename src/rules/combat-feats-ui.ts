import {escape,norm,type Engine,type Sheet} from './model';
import {hasFeat} from './passives';
import {duelistWeapons,previewDefensiveDuelist,previewInspiringLeader,applyInspiringLeader,type LeaderChoice} from './combat-feats';
import {canEditSheet} from '../sheet-edit/access';
import {currentWorkspaceKey} from '../storage/account-scope';

const tip=(name:string,text:string)=>`data-rule-tooltip="${escape(JSON.stringify({name,text}))}"`;
export function duelistControls(c:Sheet,E:Engine) {
  if(!hasFeat(c,E,'Duelista Defensivo'))return '';
  return `<div class="rule-controls"><button type="button" data-combat-feat="duelist" ${!canEditSheet(c) || !duelistWeapons(c,E).length?'disabled':''} ${tip('Duelista Defensivo','Reação após outra criatura acertar você corpo a corpo. Empunhando arma de acuidade proficiente, some proficiência à CA somente contra esse ataque. Não soma permanentemente nem impede acerto crítico. Reação e arma empunhada são declaradas na mesa.')}>Duelista Defensivo · reação</button><output data-combat-feat-result="duelist" role="status" class="min-w-0 break-words basis-full" hidden></output></div>`;
}
export function featureTalentControls(c:Sheet,g:Sheet,E:Engine) {
  if(norm(g.name)!=='lider inspirador' || !hasFeat(c,E,'Líder Inspirador'))return '';
  return `<div class="rule-controls"><button type="button" data-combat-feat="leader" ${!canEditSheet(c)?'disabled':''} ${tip('Líder Inspirador','Após 10 minutos, até seis criaturas amigáveis até 9 m que possam ver ou ouvir e compreender você, incluindo você, recebem nível total + CAR em PV temporários. Cada destinatário precisa concluir descanso curto/longo antes de receber novamente deste talento, mesmo de outro líder. Temporários não somam. Participantes e descansos são conferidos na mesa.')}>Inspirar companheiros · 10 min</button><output data-combat-feat-result="leader" role="status" class="min-w-0 break-words basis-full" hidden></output></div>`;
}
const pending=new WeakSet<Sheet>();
export function setupCombatFeatsUI(E:Engine,save:(description:string)=>void) {
  const host=window as any;
  document.addEventListener('click',async event=>{
    const trigger=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-combat-feat]');if(!trigger || trigger.disabled)return;
    const c=host.getChar();if(!c || pending.has(c))return;pending.add(c);
    try{
      const before=JSON.stringify(c),scope=currentWorkspaceKey(),valid=()=>host.getChar()===c && currentWorkspaceKey()===scope && JSON.stringify(c)===before && trigger.isConnected && canEditSheet(c);
      if(!valid())throw new Error('A ficha ou a permissão mudou.');
      const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';let text:string;
      const id=trigger.dataset.combatFeat;
      if(id==='duelist'){
        controls.innerHTML=`<label>Arma de acuidade empunhada <select required data-feat-weapon>${duelistWeapons(c,E).map(({entry,index}:{entry:Sheet;index:number})=>`<option value="${index}">${escape(entry.name)}</option>`).join('')}</select></label><label>Total do ataque recebido <input type="number" required min="-1000" max="1000" step="1" data-feat-total></label><label class="rule-check"><input type="checkbox" data-feat-critical> É acerto crítico · não erra pela CA</label><label class="rule-check"><input type="checkbox" required data-feat-declared> Estou empunhando essa arma proficiente, tenho reação disponível e outra criatura me acertou corpo a corpo</label><output data-feat-preview role="status"></output>`;
        const read=()=>({weapon:Number(controls.querySelector<HTMLSelectElement>('[data-feat-weapon]')!.value),total:Number(controls.querySelector<HTMLInputElement>('[data-feat-total]')!.value),critical:controls.querySelector<HTMLInputElement>('[data-feat-critical]')!.checked,declared:controls.querySelector<HTMLInputElement>('[data-feat-declared]')!.checked});
        const update=()=>{const output=controls.querySelector<HTMLOutputElement>('[data-feat-preview]')!;try{const p=previewDefensiveDuelist(c,read(),E);output.textContent=`CA ${p.before} + proficiência ${p.bonus} = ${p.after} só neste ataque · ${p.miss?'passa a errar':p.critical?'crítico continua acertando':'continua acertando'}.`;}catch{output.textContent='Informe o ataque e confirme os requisitos para conferir a CA.';}};
        controls.addEventListener('input',update);controls.addEventListener('change',update);update();
        if(!await host.confirmDestructiveAction('Duelista Defensivo · um ataque','Usa sua reação, sem rolar dados. O bônus termina após esse ataque; não altere o ajuste permanente de CA. Não use outra reação, como Aparar, no mesmo intervalo.','Registrar reação',controls))return;
        if(!valid())throw new Error('A ficha, a conta ou a permissão mudou. Reação não registrada.');
        const p=previewDefensiveDuelist(c,read(),E);text=`Duelista Defensivo · reação declarada · CA ${p.before} + ${p.bonus} = ${p.after} só neste ataque ${p.total}: ${p.miss?'passa a errar':p.critical?'crítico continua acertando':'continua acertando'}. CA da ficha preservada; resolva o dano na mesa.`;
      }else if(id==='leader'){
        controls.innerHTML=`<label>Outros participantes · um por linha, até seis <textarea data-feat-allies rows="3" maxlength="485" placeholder="Identificação de cada criatura na mesa"></textarea></label><label>Você participa? · atuais ${escape(c.hpTemp || 0)} PV temporários <select data-feat-self><option value="none">Não · somente os participantes acima</option><option value="keep">Sim · manter meus temporários atuais</option><option value="replace">Sim · receber os novos temporários</option></select></label><label class="rule-check"><input type="checkbox" required data-feat-declared> Fiz 10 minutos de discurso; cada participante é amigável, está até 9 m, pode me ver ou ouvir e me compreender, e concluiu descanso curto/longo desde a última vez que recebeu deste talento, de qualquer líder</label><output data-feat-preview role="status"></output>`;
        const read=():LeaderChoice=>({allies:controls.querySelector<HTMLTextAreaElement>('[data-feat-allies]')!.value.split('\n').map(x=>x.trim()).filter(Boolean),self:controls.querySelector<HTMLSelectElement>('[data-feat-self]')!.value as LeaderChoice['self'],declared:controls.querySelector<HTMLInputElement>('[data-feat-declared]')!.checked});
        const update=()=>{const output=controls.querySelector<HTMLOutputElement>('[data-feat-preview]')!,names=controls.querySelector<HTMLTextAreaElement>('[data-feat-allies]')!;names.setCustomValidity('');try{const p=previewInspiringLeader(c,{...read(),declared:true},E);output.textContent=`${p.count}/6 participantes · nível ${p.totalLevel} + CAR (${p.cha>=0?'+':''}${p.cha}) = ${p.temporary} PV temporários para cada um. Não se somam nem curam.`;}catch(error){output.textContent=(error as Error).message;names.setCustomValidity((error as Error).message);}};
        controls.addEventListener('input',update);controls.addEventListener('change',update);update();
        if(!await host.confirmDestructiveAction('Líder Inspirador · companheiros','Cada destinatário confere o próprio descanso e escolhe manter seus temporários ou receber os novos. Não há limite de discursos por dia. Outras fichas são resolvidas na mesa.','Registrar discurso',controls))return;
        if(!valid())throw new Error('A ficha, a conta ou a permissão mudou. Discurso não registrado.');
        const p=applyInspiringLeader(c,read(),E);text=`Líder Inspirador · 10 min e elegibilidade/descanso dos ${p.count} participantes confirmados · ${p.totalLevel} + CAR (${p.cha>=0?'+':''}${p.cha}) = ${p.temporary} PV temporários para ${[...p.allies,...(p.self!=='none'?['você']:[])].join(', ')}. ${p.self==='replace'?'Seus temporários foram substituídos.':'Seus temporários foram mantidos.'} Demais participantes aplicam na mesa, sem somar.`;
      }else return;
      save(text);for(const output of document.querySelectorAll<HTMLOutputElement>(`[data-combat-feat-result="${id}"]`)){output.hidden=false;output.textContent=text;}host.showToast(text);
    }catch(error){host.showToast((error as Error).message);}finally{pending.delete(c);}
  });
}
