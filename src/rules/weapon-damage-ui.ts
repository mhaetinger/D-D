import { commitWeaponDamage, previewWeaponDamage, smiteSlots, weaponDamageOptions, type WeaponDamageChoice } from './weapon-damage';
import { escape, type Engine, type Sheet } from './model';

const tip=(name:string,text:string)=>`tabindex="0" data-rule-tooltip="${escape(JSON.stringify({name,text}))}"`;
// Preparação efêmera por objeto de arma: não altera ficha, notas ou histórico,
// não vaza para outra ficha e termina depois de confirmar o dano desse acerto.
const preparedCritical=new WeakSet<Sheet>();
export const weaponCriticalPrepared=(entry:Sheet)=>preparedCritical.has(entry);
export function weaponDamageLabel(c:Sheet,entry:Sheet,E:Engine) {
  if(!weaponCriticalPrepared(entry))return 'Dano '+weaponDamageOptions(c,entry,E).w.damage;
  try {return 'Dano crítico '+previewWeaponDamage(c,entry,{critical:true},E).formula;}
  catch {return 'Dano crítico · conferir';}
}
export function renderWeaponDamageTools(c:Sheet,entry:Sheet,index:number,E:Engine) {
  const options=weaponDamageOptions(c,entry,E),additional=options.sneak || options.colossus || options.smite;
  return `<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1"><label class="inline-flex items-center gap-1.5" ${tip('Preparar dano crítico','Marque depois de confirmar um crítico no ataque. Isso só prepara a fórmula: clique em Dano para rolar. Os dados do ataque dobram, os bônus fixos entram uma vez. A marca é retirada depois de confirmar esse dano; cancelar mantém a preparação.')}><input type="checkbox" data-weapon-critical-toggle="${index}" ${weaponCriticalPrepared(entry)?'checked':''}> Crítico</label><button type="button" data-rule-weapon-damage="${index}" ${additional?'':'data-weapon-record-only'} class="underline decoration-dotted text-left" aria-label="${additional?'Adicionais':'Registrar dano'} de ${escape(options.w.name)}">${additional?'Adicionais':'Registrar dano'}</button></div>`;
}
/** O botão comum só trata aqui o crítico preparado. Em OFF/Só Pool abre o
 * registro físico existente; em Auto Ficha rola no clique, nunca na marcação. */
export function rollPreparedWeaponDamage(c:Sheet,index:number,E:Engine,save:(description:string)=>void) {
  const entry=c.weapons[index];if(!entry || !weaponCriticalPrepared(entry))return false;
  const host=window as any;
  if(!host.ruleDiceSettings().automatic) {document.querySelector<HTMLButtonElement>(`[data-rule-weapon-damage="${index}"]`)?.click();return true;}
  try {
    const plan=previewWeaponDamage(c,entry,{critical:true},E),result=host.rollWeaponFormula(plan.formula,'Crítico: '+plan.name);
    commitWeaponDamage(c,entry,{critical:true},E);preparedCritical.delete(entry);
    save(`Crítico · ${plan.name} · ${plan.summary} · total ${result.total} (virtual)`);
  }catch(error){host.showToast((error as Error).message);}
  return true;
}
/** Requisitos de alvo/turno são confirmados pela mesa, sem um contador fictício.
 * Só confirmar o acerto gasta o espaço; prévia e cancelamento são puros. */
export function setupWeaponDamageUI(E:Engine,save:(description:string)=>void) {
  const host=window as any;
  document.addEventListener('change',event=>{
    const input=(event.target as HTMLElement).closest<HTMLInputElement>('[data-weapon-critical-toggle]');if(!input)return;
    const c=host.getChar(),index=Number(input.dataset.weaponCriticalToggle),entry=c?.weapons[index];if(!entry)return;
    if(input.checked)preparedCritical.add(entry);else preparedCritical.delete(entry);
    const button=document.querySelector<HTMLButtonElement>(`[data-weapon-damage-label="${index}"]`);
    if(button)button.textContent=weaponDamageLabel(c,entry,E);
  });
  document.addEventListener('click',async event=>{
    const trigger=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-rule-weapon-damage]');
    if(!trigger || trigger.disabled)return;
    const c:Sheet=host.getChar(),index=Number(trigger.dataset.ruleWeaponDamage),entry=c?.weapons[index];
    if(!entry)return;
    try {
      const {w,automatic,sneak,colossus,smite}=weaponDamageOptions(c,entry,E);
      previewWeaponDamage(c,entry,{},E);
      const critical=weaponCriticalPrepared(entry),before=JSON.stringify(c),controls=document.createElement('div');
      controls.className='rule-context rule-dialog-fields';
      controls.innerHTML=`${critical?'<p><strong>Crítico preparado na arma · dados extras já incluídos abaixo.</strong></p>':''}
      ${sneak?`<label ${tip('Ataque Furtivo','Uma vez por turno, não por rodada, com arma de acuidade ou à distância. Ao escolher, confirme que ainda não usou neste turno: houve vantagem ou outro inimigo do alvo a até 1,5 m, não incapacitado, sem desvantagem no ataque. Vantagem e desvantagem se cancelam. A ficha não controla os turnos da mesa.')}>Ataque Furtivo <select data-weapon-sneak><option value="">Não usar</option><option value="advantage">Vantagem · uso disponível neste turno</option><option value="ally">Inimigo próximo elegível · sem desvantagem · uso disponível</option></select></label>`:''}
      ${colossus?`<label class="rule-check" ${tip('Assassino de Colossos','Uma vez por turno ao atingir uma criatura que já está abaixo dos PV máximos. Confirme o estado do alvo e o uso disponível. O dado adicional também dobra em crítico.')}><input type="checkbox" data-weapon-colossus> Alvo já ferido · Colossos disponível neste turno</label>`:''}
      ${smite?`<label ${tip('Destruição Divina','Após acertar corpo a corpo com arma, gaste um espaço de qualquer classe: 2d8 no 1º nível, +1d8 por nível até 5d8, e +1d8 contra corruptor ou morto-vivo. Pacto também serve. Não é conjuração nem ação bônus de 2024; não recebe melhorias de uma magia lançada. Arremesso e ataque desarmado não são elegíveis neste controle.')}>Destruição Divina <select data-weapon-smite><option value="">Sem gastar espaço</option>${smiteSlots(c).map(s=>`<option value="${escape(s.value)}" ${s.remaining?'':'disabled'}>${escape(s.label)}</option>`).join('')}</select></label><label class="rule-check" data-weapon-favored-label hidden ${tip('Corruptor ou morto-vivo','Acrescenta mais 1d8 à Destruição Divina, até 6d8 antes do crítico. Confirme o tipo do alvo na mesa; não é um segundo espaço.')}><input type="checkbox" data-weapon-favored> Alvo corruptor ou morto-vivo</label>`:''}
      ${!automatic?'<p>Fórmula personalizada: o crítico dobra os dados informados. Adicionais de classe/raça e exceções do alvo continuam na mesa.</p>':''}
      <output data-weapon-preview role="status" aria-live="polite"></output>
      <label>Dados <select data-weapon-source><option value="physical">Já rolei os dados · registrar total</option><option value="virtual" ${host.ruleDiceSettings().enabled?'':'disabled'}>Rolar aqui</option></select></label>
      <div data-weapon-total-label><label ${tip('Dano já rolado','Informe o total dos seus dados físicos ou de outro rolador, incluindo bônus e os dados extras do crítico quando aplicável, antes das defesas do alvo. Não há nova rolagem nem multiplicação desse número. Se escolheu Destruição, registrar desconta um único espaço.')}>Dano que você já rolou <input type="number" min="0" max="1000000" step="1" required data-weapon-total></label><p class="t-text-muted">Inclua bônus e dados do crítico. Este total será registrado sem rolar novamente.</p></div>`;
      const source=controls.querySelector<HTMLSelectElement>('[data-weapon-source]')!;
      source.value=host.ruleDiceSettings().automatic && !trigger.hasAttribute('data-weapon-record-only')?'virtual':'physical';
      const choice=():WeaponDamageChoice=>({
        critical,
        ...(controls.querySelector<HTMLSelectElement>('[data-weapon-sneak]')?.value?{sneak:controls.querySelector<HTMLSelectElement>('[data-weapon-sneak]')!.value as 'advantage'|'ally'}:{}),
        colossus:!!controls.querySelector<HTMLInputElement>('[data-weapon-colossus]')?.checked,
        smiteSlot:controls.querySelector<HTMLSelectElement>('[data-weapon-smite]')?.value || '',
        smiteFavored:!!controls.querySelector<HTMLInputElement>('[data-weapon-favored]')?.checked,
      });
      const update=()=>{
        const virtual=source.value==='virtual',total=controls.querySelector<HTMLInputElement>('[data-weapon-total]')!;
        total.required=!virtual;total.disabled=virtual;
        controls.querySelector<HTMLElement>('[data-weapon-total-label]')!.hidden=virtual;
        if(controls.isConnected)document.querySelector<HTMLButtonElement>('#confirmationAccept')!.textContent=virtual?'Rolar dano':'Registrar dano';
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
      const message=trigger.hasAttribute('data-weapon-record-only')?'Registre seu resultado ou escolha “Rolar aqui”. O crítico vem da marca na arma.':'Escolha os adicionais deste acerto. O crítico vem da marca na arma.';
      try {confirmed=await host.confirmDestructiveAction('Dano · '+w.name,message,source.value==='virtual'?'Rolar dano':'Registrar dano',controls);}
      finally {form.removeEventListener('submit',validate);}
      if(!confirmed)return;
      if(host.getChar()!==c || c.weapons[index]!==entry || JSON.stringify(c)!==before || !trigger.isConnected || weaponCriticalPrepared(entry)!==critical)throw new Error('A ficha ou a preparação mudou durante a escolha. Confira o ataque e tente novamente.');
      const selected=choice(),plan=previewWeaponDamage(c,entry,selected,E),virtual=source.value==='virtual';
      const physical=Number(controls.querySelector<HTMLInputElement>('[data-weapon-total]')!.value);
      if(!virtual && (!Number.isSafeInteger(physical) || physical<0 || physical>1000000))throw new Error('Informe um total inteiro de 0 a 1.000.000; nenhum espaço foi gasto.');
      if(virtual && !host.ruleDiceSettings().enabled)throw new Error('Dados virtuais desativados; registre o resultado físico. Nenhum espaço foi gasto.');
      // O rolador só apresenta o resultado, sem alterar o documento. Se ele
      // falhar, não houve gasto; não há await entre validar, rolar e descontar.
      const result=virtual?host.rollWeaponFormula(plan.formula,`${plan.critical?'Crítico':'Dano'}: ${plan.name}`):{total:physical};
      commitWeaponDamage(c,entry,selected,E);
      preparedCritical.delete(entry);
      save(`${plan.critical?'Crítico':'Dano'} · ${plan.name} · ${plan.summary} · total ${result.total} (${virtual?'virtual':'físico'})${plan.slot?` · gastou 1 espaço de ${plan.slot.value==='pact'?'Pacto':'Conjuração'} do ${plan.slot.level}º`:''}${selected.sneak?' · Furtivo: uso deste turno confirmado pela mesa':''}${selected.colossus?' · Colossos: alvo ferido e uso deste turno confirmados':''}`);
      host.showToast(`${plan.critical?'Crítico':'Dano'} · ${result.total} · ${plan.formula}`);
    }catch(error){host.showToast(error instanceof Error?error.message:'Não foi possível registrar o dano deste ataque.');}
  });
}
