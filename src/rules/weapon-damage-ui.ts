import { commitWeaponDamage, previewWeaponDamage, smiteSlots, weaponDamageOptions, type WeaponDamageChoice } from './weapon-damage';
import { escape, type Engine, type Sheet } from './model';

const tip=(name:string,text:string)=>`tabindex="0" data-rule-tooltip="${escape(JSON.stringify({name,text}))}"`;
/** Requisitos de alvo/turno são confirmados pela mesa, sem um contador fictício.
 * Só confirmar o acerto gasta o espaço; prévia e cancelamento são puros. */
export function setupWeaponDamageUI(E:Engine,save:(description:string)=>void) {
  const host=window as any;
  document.addEventListener('click',async event=>{
    const trigger=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-rule-weapon-damage]');
    if(!trigger || trigger.disabled)return;
    const c:Sheet=host.getChar(),index=Number(trigger.dataset.ruleWeaponDamage),entry=c?.weapons[index];
    if(!entry)return;
    try {
      const {w,automatic,sneak,colossus,smite}=weaponDamageOptions(c,entry,E);
      previewWeaponDamage(c,entry,{},E);
      const before=JSON.stringify(c),controls=document.createElement('div');
      controls.className='rule-context rule-dialog-fields';
      controls.innerHTML=`<label class="rule-check" ${tip('Acerto crítico · 2014',`Confirme o crítico na mesa (intervalo desta arma: ${w.critical || 20}–20). Dobra os dados do ataque, inclusive Furtivo e Destruição; bônus fixos entram uma vez. Crítico Brutal e Ataques Selvagens acrescentam seus dados uma única vez. Não decide acerto nem desconta PV do alvo.`)}><input type="checkbox" data-weapon-critical> Acerto crítico</label>
      ${sneak?`<label ${tip('Ataque Furtivo','Uma vez por turno, não por rodada, com arma de acuidade ou à distância. Ao escolher, confirme que ainda não usou neste turno: houve vantagem ou outro inimigo do alvo a até 1,5 m, não incapacitado, sem desvantagem no ataque. Vantagem e desvantagem se cancelam. A ficha não controla os turnos da mesa.')}>Ataque Furtivo <select data-weapon-sneak><option value="">Não usar</option><option value="advantage">Vantagem · uso disponível neste turno</option><option value="ally">Inimigo próximo elegível · sem desvantagem · uso disponível</option></select></label>`:''}
      ${colossus?`<label class="rule-check" ${tip('Assassino de Colossos','Uma vez por turno ao atingir uma criatura que já está abaixo dos PV máximos. Confirme o estado do alvo e o uso disponível. O dado adicional também dobra em crítico.')}><input type="checkbox" data-weapon-colossus> Alvo já ferido · Colossos disponível neste turno</label>`:''}
      ${smite?`<label ${tip('Destruição Divina','Após acertar corpo a corpo com arma, gaste um espaço de qualquer classe: 2d8 no 1º nível, +1d8 por nível até 5d8, e +1d8 contra corruptor ou morto-vivo. Pacto também serve. Não é conjuração nem ação bônus de 2024; não recebe melhorias de uma magia lançada. Arremesso e ataque desarmado não são elegíveis neste controle.')}>Destruição Divina <select data-weapon-smite><option value="">Sem gastar espaço</option>${smiteSlots(c).map(s=>`<option value="${escape(s.value)}" ${s.remaining?'':'disabled'}>${escape(s.label)}</option>`).join('')}</select></label><label class="rule-check" data-weapon-favored-label hidden ${tip('Corruptor ou morto-vivo','Acrescenta mais 1d8 à Destruição Divina, até 6d8 antes do crítico. Confirme o tipo do alvo na mesa; não é um segundo espaço.')}><input type="checkbox" data-weapon-favored> Alvo corruptor ou morto-vivo</label>`:''}
      ${!automatic?'<p>Fórmula personalizada: o crítico dobra os dados informados. Adicionais de classe/raça e exceções do alvo continuam na mesa.</p>':''}
      <output data-weapon-preview role="status" aria-live="polite"></output>
      <label>Dados <select data-weapon-source><option value="physical">Registrar resultado físico</option><option value="virtual" ${host.ruleDiceSettings().enabled?'':'disabled'}>Rolar dado virtual</option></select></label>
      <label data-weapon-total-label ${tip('Resultado físico','Soma já rolada desta composição, antes das defesas do alvo, mínimo zero. Confirmar registra o resultado e, se escolhido, gasta um único espaço. Não altera os PV do alvo.')}>Dano total <input type="number" min="0" max="1000000" step="1" required data-weapon-total></label>`;
      const source=controls.querySelector<HTMLSelectElement>('[data-weapon-source]')!;
      source.value=host.ruleDiceSettings().automatic?'virtual':'physical';
      const choice=():WeaponDamageChoice=>({
        critical:controls.querySelector<HTMLInputElement>('[data-weapon-critical]')!.checked,
        ...(controls.querySelector<HTMLSelectElement>('[data-weapon-sneak]')?.value?{sneak:controls.querySelector<HTMLSelectElement>('[data-weapon-sneak]')!.value as 'advantage'|'ally'}:{}),
        colossus:!!controls.querySelector<HTMLInputElement>('[data-weapon-colossus]')?.checked,
        smiteSlot:controls.querySelector<HTMLSelectElement>('[data-weapon-smite]')?.value || '',
        smiteFavored:!!controls.querySelector<HTMLInputElement>('[data-weapon-favored]')?.checked,
      });
      const update=()=>{
        const virtual=source.value==='virtual',total=controls.querySelector<HTMLInputElement>('[data-weapon-total]')!;
        total.required=!virtual;total.disabled=virtual;
        controls.querySelector<HTMLElement>('[data-weapon-total-label]')!.hidden=virtual;
        const favored=controls.querySelector<HTMLInputElement>('[data-weapon-favored]');
        if(favored) {
          favored.disabled=!choice().smiteSlot;if(favored.disabled)favored.checked=false;
          controls.querySelector<HTMLElement>('[data-weapon-favored-label]')!.hidden=favored.disabled;
        }
        const target=controls.querySelector<HTMLOutputElement>('[data-weapon-preview]')!;
        try {
          const p=previewWeaponDamage(c,entry,choice(),E);
          target.textContent=`${p.summary}. Total: ${p.formula}${p.slot?` · gasta 1 espaço de ${p.slot.value==='pact'?'Pacto':'Conjuração'} do ${p.slot.level}º`:''}.`;
        }catch(error){target.textContent=(error as Error).message;}
      };
      controls.addEventListener('input',update);controls.addEventListener('change',update);update();
      const form=document.querySelector<HTMLFormElement>('#confirmationDialog form')!;
      const validate=(event:SubmitEvent)=>{
        if((event.submitter as HTMLButtonElement)?.value!=='confirm')return;
        try {previewWeaponDamage(c,entry,choice(),E);}catch(error){event.preventDefault();host.showToast((error as Error).message);}
      };
      form.addEventListener('submit',validate);
      let confirmed=false;
      try {confirmed=await host.confirmDestructiveAction('Dano · '+w.name,'Confirme o acerto e as condições na mesa. Cada confirmação é um único acerto; cancelar preserva espaços e ficha.','Confirmar dano',controls);}
      finally {form.removeEventListener('submit',validate);}
      if(!confirmed)return;
      if(host.getChar()!==c || c.weapons[index]!==entry || JSON.stringify(c)!==before || !trigger.isConnected)throw new Error('A ficha mudou durante a escolha. Confira o ataque e tente novamente.');
      const selected=choice(),plan=previewWeaponDamage(c,entry,selected,E),virtual=source.value==='virtual';
      const physical=Number(controls.querySelector<HTMLInputElement>('[data-weapon-total]')!.value);
      if(!virtual && (!Number.isSafeInteger(physical) || physical<0 || physical>1000000))throw new Error('Informe um total inteiro de 0 a 1.000.000; nenhum espaço foi gasto.');
      if(virtual && !host.ruleDiceSettings().enabled)throw new Error('Dados virtuais desativados; registre o resultado físico. Nenhum espaço foi gasto.');
      // O rolador só apresenta o resultado, sem alterar o documento. Se ele
      // falhar, não houve gasto; não há await entre validar, rolar e descontar.
      const result=virtual?host.rollWeaponFormula(plan.formula,`${plan.critical?'Crítico':'Dano'}: ${plan.name}`):{total:physical};
      commitWeaponDamage(c,entry,selected,E);
      save(`${plan.critical?'Crítico':'Dano'} · ${plan.name} · ${plan.summary} · total ${result.total} (${virtual?'virtual':'físico'})${plan.slot?` · gastou 1 espaço de ${plan.slot.value==='pact'?'Pacto':'Conjuração'} do ${plan.slot.level}º`:''}${selected.sneak?' · Furtivo: uso deste turno confirmado pela mesa':''}${selected.colossus?' · Colossos: alvo ferido e uso deste turno confirmados':''}`);
      host.showToast(`${plan.critical?'Crítico':'Dano'} · ${result.total} · ${plan.formula}`);
    }catch(error){host.showToast(error instanceof Error?error.message:'Não foi possível registrar o dano deste ataque.');}
  });
}
