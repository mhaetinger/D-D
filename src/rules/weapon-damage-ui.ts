import { commitWeaponDamage, previewWeaponDamage, smiteSlots, weaponDamageOptions, type WeaponDamageChoice } from './weapon-damage';
import { escape, type Engine, type Sheet } from './model';
import {weaponPowerAttack,weaponPowerAttackOption} from './weapon-power-attack';
import {canEditSheet} from '../sheet-edit/access';
import {weaponRerollOptions} from './weapon-rerolls';
import {offerWeaponRerolls,resumeWeaponReroll} from './weapon-rerolls-ui';
import {damageManeuverResolution,maneuverDC,type DamageManeuver} from './maneuvers';
import {attackHasManeuver,currentWeaponAttack,finishWeaponAttack} from './weapon-attack-session';
import {lungingAttackTools} from './lunging-attack-ui';

const tip=(name:string,text:string)=>`tabindex="0" data-rule-tooltip="${escape(JSON.stringify({name,text}))}"`;
// Preparação efêmera por objeto de arma: não altera ficha, notas ou histórico,
// não vaza para outra ficha e termina depois de confirmar o dano desse acerto.
const preparedCritical=new WeakSet<Sheet>();
const preparedPowerAttack=new WeakSet<Sheet>();
export const weaponCriticalPrepared=(entry:Sheet)=>preparedCritical.has(entry);
export const weaponPowerAttackPrepared=(c:Sheet,entry:Sheet,E:Engine)=>preparedPowerAttack.has(entry) && !!weaponPowerAttackOption(c,entry,E);
export function weaponAttackBonus(c:Sheet,entry:Sheet,E:Engine) {
  const base=weaponDamageOptions(c,entry,E).w.bonus;
  if(!weaponPowerAttackPrepared(c,entry,E))return base;
  const bonus=Number(base)-5;return bonus>=0?'+'+bonus:String(bonus);
}
export function weaponDamageLabel(c:Sheet,entry:Sheet,E:Engine,critical=weaponCriticalPrepared(entry),powerAttack=weaponPowerAttackPrepared(c,entry,E)) {
  if(!critical && !powerAttack && !currentWeaponAttack(c,entry)?.lunging)return 'Dano '+weaponDamageOptions(c,entry,E).w.damage;
  try {return `${critical?'Dano crítico':'Dano'} `+previewWeaponDamage(c,entry,{critical,powerAttack},E).formula;}
  catch {return `${critical?'Dano crítico':'Dano'} · conferir`;}
}
export function refreshWeaponDamageLabel(c:Sheet,index:number,E:Engine) {
  const entry=c.weapons[index],card=document.querySelector(`[data-weapon-card="${index}"]`);
  const label=card?.querySelector('[data-weapon-damage-text]');if(label)label.textContent=weaponDamageLabel(c,entry,E);
  const attack=card?.querySelector('[data-weapon-attack-text]');if(attack)attack.textContent='Atq '+weaponAttackBonus(c,entry,E);
}
export function setWeaponPowerAttackPrepared(c:Sheet,index:number,E:Engine,selected:boolean) {
  const entry=c.weapons[index];if(!entry)return;
  if(!canEditSheet(c))throw new Error('A edição desta ficha está bloqueada pelo mestre.');
  weaponPowerAttack(c,entry,selected,E);
  if(selected)preparedPowerAttack.add(entry);else preparedPowerAttack.delete(entry);
  refreshWeaponDamageLabel(c,index,E);
}
/** Atualiza só os controles desta arma, sem recriar nós, mover foco ou gravar
 * um passo. O ataque automático passa a face escolhida após vantagem/desvantagem. */
export function setWeaponCriticalPrepared(c:Sheet,index:number,E:Engine,critical:boolean) {
  const entry=c.weapons[index];if(!entry)return;
  if(critical)preparedCritical.add(entry);else preparedCritical.delete(entry);
  const input=document.querySelector<HTMLInputElement>(`[data-weapon-critical-toggle="${index}"]`);
  if(input)input.checked=critical;
  refreshWeaponDamageLabel(c,index,E);
}
export function renderWeaponDamageTools(c:Sheet,entry:Sheet,index:number,E:Engine) {
  const options=weaponDamageOptions(c,entry,E),additional=options.sneak || options.colossus || options.smite || options.maneuvers.length>0 || !!currentWeaponAttack(c,entry)?.lunging;
  const power=weaponPowerAttackOption(c,entry,E);
  return `<div class="weapon-tools mt-2 flex flex-wrap items-center gap-x-3 gap-y-1"><label class="inline-flex items-center gap-1.5" ${tip('Preparar dano crítico','No Auto Ficha, cada ataque desta arma atualiza a marca pelo d20 natural escolhido, respeitando seu intervalo de crítico. Você também pode marcar manualmente. Isso só prepara a fórmula: clique em Dano para rolar. Os dados do ataque dobram, os bônus fixos entram uma vez. Confirmar o dano retira a marca; cancelar mantém a preparação.')}><input type="checkbox" data-weapon-critical-toggle="${index}" ${weaponCriticalPrepared(entry)?'checked':''}> Crítico</label><button type="button" data-rule-weapon-damage="${index}" ${additional?'':'data-weapon-record-only'} class="underline decoration-dotted text-left" aria-label="${additional?'Adicionais':'Registrar dano'} de ${escape(options.w.name)}">${additional?'Adicionais':'Registrar dano'}</button>${power?`<label class="inline-flex items-center gap-1.5" ${tip(power.name,'2014: escolha antes de cada ataque com esta arma proficiente. Aplica –5 na jogada; se acertar, +10 do tipo da arma, uma vez, inclusive no crítico. Confirme acerto/erro na mesa. A escolha termina ao confirmar o dano; se errou, desmarque antes de continuar. OFF/Só Pool permitem registrar o total físico já incluindo +10. Totais cadastrados e outras armas não mudam. Cobertura, alcance e o ataque bônus de Mestre de Armas Grandes continuam na mesa.')}><input type="checkbox" data-weapon-power-toggle="${index}" ${weaponPowerAttackPrepared(c,entry,E)?'checked':''} ${canEditSheet(c)?'':'disabled'} aria-label="${escape(power.name)}: –5 no ataque e +10 no dano"> –5 ataque / +10 dano</label>`:''}${lungingAttackTools(c,entry,index,E)}</div>`;
}
/** O botão comum trata crítico/–5/+10 preparados. Em OFF/Só Pool abre o
 * registro físico existente; em Auto Ficha rola no clique, nunca na marcação. */
export function rollPreparedWeaponDamage(c:Sheet,index:number,E:Engine,save:(description:string)=>void) {
  const entry=c.weapons[index];if(!entry)return false;
  if(resumeWeaponReroll(c,entry))return true;
  const critical=weaponCriticalPrepared(entry),powerAttack=weaponPowerAttackPrepared(c,entry,E),rerolls=weaponRerollOptions(c,entry,E);
  if(currentWeaponAttack(c,entry)?.lunging){document.querySelector<HTMLButtonElement>(`[data-rule-weapon-damage="${index}"]`)?.click();return true;}
  if(!critical && !powerAttack && !rerolls.savage && !rerolls.greatWeapon)return false;
  const host=window as any;
  if(!host.ruleDiceSettings().automatic) {document.querySelector<HTMLButtonElement>(`[data-rule-weapon-damage="${index}"]`)?.click();return true;}
  try {
    if(!canEditSheet(c))throw new Error('A edição desta ficha está bloqueada pelo mestre.');
    const plan=previewWeaponDamage(c,entry,{critical,powerAttack},E),result=host.rollWeaponFormula(plan.formula,(critical?'Crítico: ':'Dano: ')+plan.name);
    commitWeaponDamage(c,entry,{critical,powerAttack},E);finishWeaponAttack(c,entry);host.clearPendingWeaponAttack?.(entry);preparedCritical.delete(entry);preparedPowerAttack.delete(entry);
    save(`${critical?'Crítico':'Dano'} · ${plan.name} · ${plan.summary} · total ${result.total} (virtual)`);
    offerWeaponRerolls(c,entry,plan,result,E);
  }catch(error){host.showToast((error as Error).message);}
  return true;
}
/** Requisitos de alvo/turno são confirmados pela mesa, sem um contador fictício.
 * Só confirmar o acerto gasta o espaço; prévia e cancelamento são puros. */
export function setupWeaponDamageUI(E:Engine,save:(description:string)=>void) {
  const host=window as any;
  document.addEventListener('change',event=>{
    const power=(event.target as HTMLElement).closest<HTMLInputElement>('[data-weapon-power-toggle]');
    if(power){const c=host.getChar();if(!c)return;try{setWeaponPowerAttackPrepared(c,Number(power.dataset.weaponPowerToggle),E,power.checked);}catch(error){power.checked=weaponPowerAttackPrepared(c,c.weapons[Number(power.dataset.weaponPowerToggle)],E);host.showToast((error as Error).message);}return;}
    const input=(event.target as HTMLElement).closest<HTMLInputElement>('[data-weapon-critical-toggle]');if(!input)return;
    const c=host.getChar(),index=Number(input.dataset.weaponCriticalToggle),entry=c?.weapons[index];if(!entry)return;
    setWeaponCriticalPrepared(c,index,E,input.checked);
  });
  document.addEventListener('click',async event=>{
    const trigger=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-rule-weapon-damage]');
    if(!trigger || trigger.disabled)return;
    const c:Sheet=host.getChar(),index=Number(trigger.dataset.ruleWeaponDamage),entry=c?.weapons[index];
    if(!entry)return;
    if(resumeWeaponReroll(c,entry))return;
    try {
      if(!canEditSheet(c))throw new Error('A edição desta ficha está bloqueada pelo mestre.');
      const {w,automatic,sneak,colossus,smite,maneuvers,superiority}=weaponDamageOptions(c,entry,E);
      previewWeaponDamage(c,entry,{},E);
      const manualOnly=trigger.hasAttribute('data-weapon-record-only') || !host.ruleDiceSettings().automatic;
      const attack=currentWeaponAttack(c,entry),precisionUsed=!!attack?.precisionUsed,lunging=attack?.lunging,maneuverUsed=attackHasManeuver(attack);
      const critical=weaponCriticalPrepared(entry),powerAttack=weaponPowerAttackPrepared(c,entry,E),before=JSON.stringify(c),controls=document.createElement('div');
      controls.className='rule-context rule-dialog-fields';
      controls.innerHTML=`${critical?'<p><strong>Crítico preparado na arma · dados extras já incluídos abaixo.</strong></p>':''}
      ${lunging?`<p><strong>Ataque Estendido · alcance +1,5 m neste ataque · ${escape(lunging.name)} d${lunging.die} já pago.</strong> No acerto, o dado entra no dano e dobra em crítico, sem novo gasto. Não combine outra manobra.</p><label class="rule-check"><input type="checkbox" required data-lunging-hit> Acertei este ataque estendido; o alcance e o alvo foram conferidos na mesa</label>`:''}
      ${powerAttack?`<p><strong>${escape(weaponPowerAttackOption(c,entry,E)!.name)} · –5 no ataque / +10 no dano.</strong> Confirme que escolheu antes do ataque e acertou. O total físico já deve incluir +10.</p>`:''}
      ${sneak?`<label ${tip('Ataque Furtivo','Uma vez por turno, não por rodada, com arma de acuidade ou à distância. Ao escolher, confirme que ainda não usou neste turno: houve vantagem ou outro inimigo do alvo a até 1,5 m, não incapacitado, sem desvantagem no ataque. Vantagem e desvantagem se cancelam. A ficha não controla os turnos da mesa.')}>Ataque Furtivo <select data-weapon-sneak><option value="">Não usar</option><option value="advantage">Vantagem · uso disponível neste turno</option><option value="ally">Inimigo próximo elegível · sem desvantagem · uso disponível</option></select></label>`:''}
      ${colossus?`<label class="rule-check" ${tip('Assassino de Colossos','Uma vez por turno ao atingir uma criatura que já está abaixo dos PV máximos. Confirme o estado do alvo e o uso disponível. O dado adicional também dobra em crítico.')}><input type="checkbox" data-weapon-colossus> Alvo já ferido · Colossos disponível neste turno</label>`:''}
      ${maneuvers.length?`<label ${tip('Manobra no acerto','2014: após acertar uma criatura com arma, escolha uma manobra conhecida. O dado soma ao dano e dobra em crítico, custando um único uso. Apenas uma manobra por ataque: não combine com Precisão ou outra já resolvida. O teste e o efeito no alvo ficam na mesa. Precisão é escolhida no resultado; Estendido é preparado antes do ataque. Outras manobras sem controle próprio continuam em Usar na mesa na característica.')}>Manobra <select data-weapon-maneuver ${maneuverUsed?'disabled':''}><option value="">Sem manobra</option>${maneuvers.map(m=>`<option value="${m.id}">${escape(m.name)}</option>`).join('')}</select></label>
      ${precisionUsed?'<p>Precisão já usada neste ataque: não combine outra manobra. O dano da arma continua normal.</p>':''}
      <div data-weapon-maneuver-fields hidden>
      <label>Dado de superioridade <select data-weapon-superiority>${superiority.map(s=>`<option value="${s.id}" ${s.remaining>0?'':'disabled'}>${escape(s.name)} · d${s.die} · ${s.readable?`${s.remaining}/${s.resource.max}`:'conferir registro'}</option>`).join('')}</select></label>
      <label data-weapon-maneuver-ability-label>Habilidade da CD <select data-weapon-maneuver-ability><option value="str">FOR · CD ${maneuverDC(c,'str')}</option><option value="dex">DES · CD ${maneuverDC(c,'dex')}</option></select></label>
      <label class="rule-check"><input type="checkbox" data-weapon-no-other-maneuver> Nenhuma outra manobra usada neste ataque, inclusive Precisão</label>
      <p data-weapon-maneuver-effect></p></div>`:''}
      ${smite?`<label ${tip('Destruição Divina','Após acertar corpo a corpo com arma, gaste um espaço de qualquer classe: 2d8 no 1º nível, +1d8 por nível até 5d8, e +1d8 contra corruptor ou morto-vivo. Pacto também serve. Não é conjuração nem ação bônus de 2024; não recebe melhorias de uma magia lançada. Arremesso e ataque desarmado não são elegíveis neste controle.')}>Destruição Divina <select data-weapon-smite><option value="">Sem gastar espaço</option>${smiteSlots(c).map(s=>`<option value="${escape(s.value)}" ${s.remaining?'':'disabled'}>${escape(s.label)}</option>`).join('')}</select></label><label class="rule-check" data-weapon-favored-label hidden ${tip('Corruptor ou morto-vivo','Acrescenta mais 1d8 à Destruição Divina, até 6d8 antes do crítico. Confirme o tipo do alvo na mesa; não é um segundo espaço.')}><input type="checkbox" data-weapon-favored> Alvo corruptor ou morto-vivo</label>`:''}
      ${!automatic?'<p>Fórmula personalizada: o crítico dobra os dados informados. Adicionais de classe/raça e exceções do alvo continuam na mesa.</p>':''}
      ${Object.values(weaponRerollOptions(c,entry,E)).some(Boolean)?'<p class="t-text-muted">Dados físicos: resolva as repetições da arma na mesa e informe o total final. Ao rolar aqui, as opções aparecem depois do resultado.</p>':''}
      <output data-weapon-preview role="status" aria-live="polite"></output>
      ${manualOnly?'':'<label>Dados <select data-weapon-source><option value="physical">Já rolei os dados · registrar total</option><option value="virtual">Rolar aqui</option></select></label>'}
      <div data-weapon-total-label><label ${tip('Dano já rolado','Informe o total dos seus dados físicos ou de outro rolador, incluindo bônus e os dados extras do crítico quando aplicável, antes das defesas do alvo. Não há nova rolagem nem multiplicação desse número. Se escolheu Destruição, registrar desconta um único espaço.')}>Dano que você já rolou <input type="number" min="0" max="1000000" step="1" required data-weapon-total></label><p class="t-text-muted">Inclua bônus e dados do crítico. Este total será registrado sem rolar novamente.</p></div>`;
      const source=controls.querySelector<HTMLSelectElement>('[data-weapon-source]');
      if(source)source.value='virtual';
      const maneuver=controls.querySelector<HTMLSelectElement>('[data-weapon-maneuver]'),superiorityInput=controls.querySelector<HTMLSelectElement>('[data-weapon-superiority]'),abilityInput=controls.querySelector<HTMLSelectElement>('[data-weapon-maneuver-ability]');
      if(superiorityInput)superiorityInput.value=superiority.find(s=>s.remaining>0)?.id || superiority[0]?.id || '';
      if(abilityInput)abilityInput.value=maneuverDC(c,'dex')>maneuverDC(c,'str')?'dex':'str';
      const isVirtual=()=>source?.value==='virtual';
      const choice=():WeaponDamageChoice=>({
        critical,powerAttack,
        ...(controls.querySelector<HTMLSelectElement>('[data-weapon-sneak]')?.value?{sneak:controls.querySelector<HTMLSelectElement>('[data-weapon-sneak]')!.value as 'advantage'|'ally'}:{}),
        colossus:!!controls.querySelector<HTMLInputElement>('[data-weapon-colossus]')?.checked,
        smiteSlot:controls.querySelector<HTMLSelectElement>('[data-weapon-smite]')?.value || '',
        smiteFavored:!!controls.querySelector<HTMLInputElement>('[data-weapon-favored]')?.checked,
        ...(maneuver?.value?{maneuver:maneuver.value as DamageManeuver,superiority:superiorityInput!.value,...(maneuvers.find(m=>m.id===maneuver.value)?.save?{maneuverAbility:abilityInput!.value as 'str'|'dex'}:{}),noOtherManeuver:!!controls.querySelector<HTMLInputElement>('[data-weapon-no-other-maneuver]')?.checked}:{}),
      });
      const update=()=>{
        const maneuverFields=controls.querySelector<HTMLElement>('[data-weapon-maneuver-fields]');
        if(maneuverFields){
          maneuverFields.hidden=!maneuver?.value;
          const selected=maneuvers.find(m=>m.id===maneuver?.value);
          controls.querySelector<HTMLElement>('[data-weapon-maneuver-ability-label]')!.hidden=!selected?.save;
          abilityInput!.disabled=!selected?.save;
          controls.querySelector<HTMLElement>('[data-weapon-maneuver-effect]')!.textContent=selected?damageManeuverResolution(c,selected,selected.save?abilityInput!.value as 'str'|'dex':undefined).note:'';
        }
        const virtual=isVirtual(),total=controls.querySelector<HTMLInputElement>('[data-weapon-total]')!;
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
          target.textContent=`${p.summary}. Total: ${p.formula}${p.slot?` · gasta 1 espaço de ${p.slot.value==='pact'?'Pacto':'Conjuração'} do ${p.slot.level}º`:''}${p.maneuver?` · gasta 1 dado de ${p.maneuver.source.name} (d${p.maneuver.source.die})`:''}.`;
        }catch(error){target.textContent=(error as Error).message;}
      };
      controls.addEventListener('input',update);controls.addEventListener('change',update);update();
      const form=document.querySelector<HTMLFormElement>('#confirmationDialog form')!;
      const validate=(event:SubmitEvent)=>{
        if((event.submitter as HTMLButtonElement)?.value!=='confirm')return;
        try {if(lunging && !controls.querySelector<HTMLInputElement>('[data-lunging-hit]')!.checked)throw new Error('Confirme o acerto deste ataque estendido.');if(choice().maneuver && attackHasManeuver(currentWeaponAttack(c,entry)))throw new Error(precisionUsed?'Precisão já foi usada neste ataque. Não combine outra manobra.':'Este ataque já usou uma manobra. Não combine outra.');previewWeaponDamage(c,entry,choice(),E);}catch(error){event.preventDefault();host.showToast((error as Error).message);}
      };
      form.addEventListener('submit',validate);
      let confirmed=false;
      const message=manualOnly?'Registre o total que você já rolou. O crítico vem da marca na arma.':'Escolha os adicionais deste acerto. O crítico vem da marca na arma.';
      try {confirmed=await host.confirmDestructiveAction('Dano · '+w.name,message,isVirtual()?'Rolar dano':'Registrar dano',controls);}
      finally {form.removeEventListener('submit',validate);}
      if(!confirmed)return;
      if(lunging && !controls.querySelector<HTMLInputElement>('[data-lunging-hit]')!.checked)throw new Error('Confirme o acerto; nenhum dano foi registrado.');
      if(currentWeaponAttack(c,entry)!==attack || host.getChar()!==c || c.weapons[index]!==entry || JSON.stringify(c)!==before || !trigger.isConnected || weaponCriticalPrepared(entry)!==critical || weaponPowerAttackPrepared(c,entry,E)!==powerAttack || !canEditSheet(c))throw new Error('A ficha ou a preparação mudou durante a escolha. Confira o ataque e tente novamente.');
      const selected=choice(),plan=previewWeaponDamage(c,entry,selected,E),virtual=isVirtual();
      const physical=Number(controls.querySelector<HTMLInputElement>('[data-weapon-total]')!.value);
      if(!virtual && (!Number.isSafeInteger(physical) || physical<0 || physical>1000000))throw new Error('Informe um total inteiro de 0 a 1.000.000; nenhum espaço foi gasto.');
      if(virtual && !host.ruleDiceSettings().automatic)throw new Error('Auto Ficha desativado; registre o resultado físico. Nenhum recurso foi gasto.');
      // O rolador só apresenta o resultado, sem alterar o documento. Se ele
      // falhar, não houve gasto; não há await entre validar, rolar e descontar.
      const result=virtual?host.rollWeaponFormula(plan.formula,`${plan.critical?'Crítico':'Dano'}: ${plan.name}`):{total:physical};
      commitWeaponDamage(c,entry,selected,E);finishWeaponAttack(c,entry);host.clearPendingWeaponAttack?.(entry);
      preparedCritical.delete(entry);preparedPowerAttack.delete(entry);
      save(`${plan.critical?'Crítico':'Dano'} · ${plan.name} · ${plan.summary} · total ${result.total} (${virtual?'virtual':'físico'})${plan.slot?` · gastou 1 espaço de ${plan.slot.value==='pact'?'Pacto':'Conjuração'} do ${plan.slot.level}º`:''}${plan.maneuver?` · gastou 1 dado de ${plan.maneuver.source.name} (d${plan.maneuver.source.die}) · ${plan.maneuver.note}`:''}${plan.lunging?' · Estendido já pago; sem novo gasto de superioridade':''}${selected.sneak?' · Furtivo: uso deste turno confirmado pela mesa':''}${selected.colossus?' · Colossos: alvo ferido e uso deste turno confirmados':''}`);
      host.showToast(`${plan.critical?'Crítico':'Dano'} · ${result.total} · ${plan.formula}${plan.maneuver?' · '+plan.maneuver.note:''}`);
      if(virtual)offerWeaponRerolls(c,entry,plan,result,E);
    }catch(error){host.showToast(error instanceof Error?error.message:'Não foi possível registrar o dano deste ataque.');}
  });
}
