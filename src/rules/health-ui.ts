import { applyDamage, applyTypedDamage, concentrationSaveDetails } from './combat';
import { damageControls, readDamagePacket, setupDamageUI } from './damage-ui';
import { arcaneWardPoints, previewTypedDamage, typedDamageSummary } from './damage';
import { previewSurvival, survivalOptions, type SurvivalChoice } from './survival';
import { consumeInspiration, deathSaveBonus, deathStatus, hitDiceRemaining, hitPointMaximum, inspirationRollMode, resolveDeathSave, returnToLife, songOfRestDie, spendHitDie, stabilize, validateHitDie } from './health';
import { ability, active, escape, state, type Engine, type Sheet } from './model';
import { hasHalflingLuck } from './dice-roll';
import { luckyResource, luckRemaining } from './lucky';
import {survivorControls,useSurvivor} from './survivor-ui';

const tip=(name:string,text:string)=>`tabindex="0" data-rule-tooltip="${escape(JSON.stringify({name,text}))}"`;
const action=(id:string,label:string,disabled=false,attrs='')=>`<button type="button" data-health-action="${id}" ${disabled?'disabled':''} ${attrs}>${label}</button>`;
export function inspirationControls(c:Sheet) {
  const ready=c.heroicInspiration && c.ruleState?.inspirationReady;
  return `<span ${tip('Inspiração · regras de 2014','Você tem ou não tem inspiração; ela não acumula e não é Inspiração de Bardo. Gaste antes de um ataque, teste de habilidade ou resistência para dar vantagem. Vantagem e desvantagem se cancelam. O d20 rápido segue o modo escolhido na bandeja, sem gastar inspiração preparada. Não permite rerrolar depois de ver o resultado.')}>★ Inspiração</span><span class="rule-controls">${c.heroicInspiration?`${action('inspirationUse',ready?'✓ Preparada · cancelar':'Usar',false,`aria-pressed="${!!ready}"`)}${action('inspirationPhysical','Usar na mesa')}`:action('inspirationReceive','Receber')}</span>`;
}
export function deathControls(c:Sheet,E:Engine) {
  const d=deathStatus(c),shape=active(c,'druida:wildShape');
  const help=tip('Caindo a 0 PV','Três sucessos estabilizam e zeram as contagens; três falhas matam. 1 natural vale duas falhas; 20 natural recupera 1 PV. Dano a 0 PV causa uma falha, duas se crítico, mesmo quando absorvido por temporários. Proteção externa impede esse dano. Cura comum não revive. Estabilize somente após o efeito ou Medicina CD 10 resolvido na mesa.');
  const controls=d.dead?`<strong role="status" ${help}>Morto</strong>${action('revive','Registrar retorno à vida')}`:c.hpCurrent===0 && !shape?`<div role="status"><strong ${help}>${d.stable?'Estável · inconsciente':'Inconsciente · 0 PV'}</strong>${!d.stable?`<span> · Sucessos ${d.successes}/3 · Falhas ${d.failures}/3</span>`:''}</div>${!d.stable?`${action('deathSave','Teste contra a morte')}${action('stabilize','Registrar estabilização')}`:'<span>Não realiza testes contra a morte. Cura ou 1 PV após 1d4 horas encerra a inconsciência; registre a recuperação nos PV.</span>'}`:'';
  return `${survivorControls(c,E)}${controls?`<div class="rule-context rule-controls" data-health-status>${controls}</div>`:''}${!d.dead?damageControls(c,E):''}`;
}
export function hitDiceControls(c:Sheet,E:Engine) {
  return `<div class="rule-context space-y-1.5"><p class="font-bold t-text-muted" ${tip('Dados de Vida · descanso curto','No fim de um descanso curto de ao menos 1 hora, gaste um Dado de Vida por vez e some Constituição, mínimo 0 de cura. Você pode decidir gastar outro depois do resultado. A 0 PV, resolva a estabilização antes de registrar esse descanso. Em multiclasse, escolha a classe. Resistente aplica o mínimo do talento. Canção do Descanso exige ouvir a atuação e só acrescenta uma vez no descanso. Não conclui outro descanso nem recupera recursos de classe.')}>Dados de Vida · descanso curto</p><div class="rule-hit-dice">${c.classes.map((cls:Sheet)=>`<div class="t-inset rule-controls"><span><strong>${hitDiceRemaining(cls)}/${cls.level}d${Number(cls.hitDie)||'?'}</strong> · ${escape(E.data.classes[cls.classId]?.name || cls.classId)}</span>${action('hitDieSpend','Gastar',!hitDiceRemaining(cls) || deathStatus(c).dead || c.hpCurrent<=0 && !active(c,'druida:wildShape') && !deathStatus(c).stable,`data-class="${escape(cls.classId)}" aria-label="Gastar Dado de Vida de ${escape(E.data.classes[cls.classId]?.name || cls.classId)}"`)}</div>`).join('')}</div></div>`;
}
export function damageDescription(c:Sheet,result:Sheet,amount:number,critical=false) {
  const d=deathStatus(c);
  return `Sofreu ${amount} de dano${critical?' crítico':''} (${result.temp} absorvidos por PV temporários)${result.ward?` · proteção: ${result.ward}`:''}${result.beast?` · forma: ${result.beast}`:''} · PV: ${c.hpCurrent}/${hitPointMaximum(c)} · temporários: ${c.hpTemp}${d.dead?' · morto':c.hpCurrent===0 && !active(c,'druida:wildShape')?` · ${d.stable?'estável':`sucessos ${d.successes}/3, falhas ${d.failures}/3`}`:''}`;
}

/** O diálogo só decide a origem da rolagem. Mutação e gasto acontecem depois
 * da confirmação, revalidando a ficha e todos os resultados. */
export function dieSourceControls(sides:number,traits=true) {
  const host=window as any,c=host.getChar(),luck=traits && sides===20 && hasHalflingLuck(c),feat=traits && sides===20 && !!luckyResource(c,host.CharacterEngine);
  const pending=traits && sides===20?host.pendingRuleD20Label?.():'';
  const available=feat && luckRemaining(c,host.CharacterEngine)>0;
  return `<label>Dados <select data-health-source><option value="physical">Registrar dado físico</option><option value="virtual" ${host.ruleDiceSettings().enabled?'':'disabled'}>Rolar dado virtual</option></select></label><label data-health-face-label>Face ${luck || feat?'final ':''}do d${sides}${luck || feat?' (após Sortudo, se usado)':''} <input type="number" min="1" max="${sides}" step="1" data-health-face></label>${luck?'<label class="rule-check" data-health-luck-label><input type="checkbox" data-health-luck><span>Sortudo racial · repetir um 1, uma única vez, no dado virtual</span></label>':''}${feat?`<label data-health-lucky-feat-label>Sortudo (talento)<select data-health-lucky-feat ${available?'':'disabled'}><option value="ask" ${available?'selected':''}>Decidir após o d20</option><option value="before">Gastar 1 ponto antes de rolar</option><option value="none" ${available?'':'selected'}>Sem usar Sortudo${available?'':' · sem pontos'}</option></select></label><label class="rule-check" data-health-lucky-opposed-label hidden><input type="checkbox" data-health-lucky-opposed><span>Outra criatura também usou Sortudo nesta jogada</span></label>`:''}${pending?`<p data-lucky-pending>Escolha pendente: ${escape(pending)}. Retome o teste virtual para usar os mesmos dados, sem gastar outro ponto.</p>`:''}`;
}
export function chooseDieSource(controls:HTMLElement) {
  const host=window as any,source=controls.querySelector<HTMLSelectElement>('[data-health-source]')!;
  source.value=host.ruleDiceSettings().automatic?'virtual':'physical';
  const update=()=>{
    const virtual=source.value==='virtual',face=controls.querySelector<HTMLInputElement>('[data-health-face]')!;
    controls.querySelector<HTMLElement>('[data-health-face-label]')!.hidden=virtual;face.disabled=virtual;face.required=!virtual;
    const luck=controls.querySelector<HTMLInputElement>('[data-health-luck]');
    if(luck) {luck.disabled=!virtual;controls.querySelector<HTMLElement>('[data-health-luck-label]')!.hidden=!virtual;}
    const feat=controls.querySelector<HTMLSelectElement>('[data-health-lucky-feat]');
    if(feat) {
      feat.disabled=!virtual || luckRemaining(host.getChar(),host.CharacterEngine)<1;
      controls.querySelector<HTMLElement>('[data-health-lucky-feat-label]')!.hidden=!virtual;
      controls.querySelector<HTMLElement>('[data-health-lucky-opposed-label]')!.hidden=!virtual || feat.value!=='before';
    }
  };
  controls.addEventListener('change',update);update();
}
export function ruleD20Options(controls:HTMLElement,inspired=false) {
  const plan=controls.querySelector<HTMLSelectElement>('[data-health-lucky-feat]');
  return {repeatOne:!!controls.querySelector<HTMLInputElement>('[data-health-luck]')?.checked,lucky:plan?.value==='before' && !plan.disabled,askLucky:plan?.value==='ask' && !plan.disabled,opposed:!!controls.querySelector<HTMLInputElement>('[data-health-lucky-opposed]')?.checked,inspired};
}
async function chooseDamageSurvival(c:Sheet,received:number,form:HTMLElement,E:Engine) {
  const host=window as any,kind=form.querySelector<HTMLSelectElement>('[data-damage-survival]')?.value;
  if(!kind)return {choice:undefined as SurvivalChoice|undefined,description:'',inspired:false};
  if(kind==='endurance') {
    const choice:SurvivalChoice={kind:'endurance'};
    return {choice,description:previewSurvival(c,received,choice)!.description,inspired:false};
  }
  if(kind!=='rage')throw new Error('Escolha uma defesa disponível.');
  const options=survivalOptions(c,received);if(options.rageDC===null)throw new Error('Fúria Implacável indisponível para este dano.');
  const before=JSON.stringify(c),fields=()=>JSON.stringify([...form.querySelectorAll<HTMLInputElement|HTMLSelectElement>('input,select')].map(e=>[e.value,'checked' in e?e.checked:null])),beforeFields=fields();
  const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
  controls.innerHTML=`${dieSourceControls(20)}<label>Outros bônus recebidos <input type="number" min="-100" max="100" step="1" value="0" data-survival-extra></label><label>Modo da mesa <select data-survival-mode><option value="normal">Normal</option><option value="adv">Vantagem</option><option value="dis">Desvantagem</option></select></label>${options.endurance?'<label class="rule-check"><input type="checkbox" data-survival-fallback> Se falhar, usar Resistência Implacável</label>':''}<p data-survival-preview></p><p>1/20 natural não decide sozinho. No dado físico, registre a face escolhida no modo indicado.</p>`;
  chooseDieSource(controls);
  const mode=controls.querySelector<HTMLSelectElement>('[data-survival-mode]')!;mode.value=host.ruleDiceSettings().mode;
  // Mesmo cálculo de CON, inspiração e exaustão dos testes existentes, sem
  // Conjurador de Guerra: este teste não é para manter concentração.
  const details=()=>concentrationSaveDetails(c,E,{mode:mode.value as 'normal'|'adv'|'dis',damage:false,extra:Number(controls.querySelector<HTMLInputElement>('[data-survival-extra]')!.value)});
  const update=()=>{try {const d=details();controls.querySelector<HTMLElement>('[data-survival-preview]')!.textContent=`CON ${d.bonus>=0?'+':''}${d.bonus} · ${d.mode==='adv'?'vantagem':d.mode==='dis'?'desvantagem':'normal'}${d.inspired?' · inspiração preparada':''}${d.exhausted?' · exaustão':''}`;}catch(e){controls.querySelector<HTMLElement>('[data-survival-preview]')!.textContent=(e as Error).message;}};
  controls.addEventListener('input',update);controls.addEventListener('change',update);update();
  if(!await host.confirmDestructiveAction('Fúria Implacável',`CON CD ${options.rageDC} para ficar com 1 PV. Próxima tentativa: CD ${options.rageDC+5} até descanso curto/longo. Cancelar mantém o dano pendente, sem gastar usos.`,'Testar e aplicar',controls))return null;
  if(host.getChar()!==c || JSON.stringify(c)!==before || !form.isConnected || fields()!==beforeFields)throw new Error('A ficha ou o dano mudou durante o teste. Confira a prévia e tente novamente.');
  const d=details(),virtual=controls.querySelector<HTMLSelectElement>('[data-health-source]')!.value==='virtual';
  const choice:SurvivalChoice={kind:'rage',natural:virtual?1:Number(controls.querySelector<HTMLInputElement>('[data-health-face]')!.value),extraBonus:Number(controls.querySelector<HTMLInputElement>('[data-survival-extra]')!.value),fallbackEndurance:!!controls.querySelector<HTMLInputElement>('[data-survival-fallback]')?.checked};
  previewSurvival(c,received,choice); // Valida antes de rolar ou gastar qualquer coisa.
  const optionsD20=ruleD20Options(controls,d.inspired);
  if(virtual) {
    const natural=await host.resolveRuleD20('Fúria Implacável',d.mode,{type:'save'},{...optionsD20,key:'rage:'+received+':'+beforeFields});
    if(natural===null)return null;
    if(host.getChar()!==c || !form.isConnected || fields()!==beforeFields)throw new Error('O dano mudou durante a escolha. O resultado antigo não foi aplicado.');
    choice.natural=natural;
  }
  return {choice,description:previewSurvival(c,received,choice)!.description,inspired:d.inspired && !(virtual && (optionsD20.lucky || optionsD20.askLucky))};
}
export function setupHealthUI(E:Engine,save:(description:string)=>void) {
  const host=window as any;
  setupDamageUI(E);
  const sourceControls=dieSourceControls,chooseSource=chooseDieSource;
  document.addEventListener('click',async event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-health-action]');
    if(!button || button.disabled) return;
    const c=host.getChar();if(!c) return;
    const id=button.dataset.healthAction;
    try {
      if(id==='survivor'){await useSurvivor(c,E,button,save);return;}
      if(id==='damage') {
        const controls=button.closest<HTMLElement>('[data-damage-controls]')!;
        const typed=controls.querySelector<HTMLSelectElement>('[data-damage-mode]')!.value==='typed';
        const input=controls.querySelector<HTMLInputElement>('[data-health-damage]')!,n=Number(input.value),critical=controls.querySelector<HTMLInputElement>('[data-health-critical]')!.checked;
        if(!typed && (!Number.isInteger(n) || n<=0)) throw new Error('Informe um dano inteiro maior que zero.');
        const packet=typed?readDamagePacket(controls):null,received=packet?previewTypedDamage(c,packet,E).received:Math.max(0,n-arcaneWardPoints(c));
        const survival=await chooseDamageSurvival(c,received,controls,E);if(!survival)return;
        if(host.getChar()!==c || !controls.isConnected)return;
        let description:string;
        if(packet) {
          const result=applyTypedDamage(c,packet,E,survival.choice);
          description=`Dano por tipo · ${typedDamageSummary(result)} · ${damageDescription(c,result.absorption,result.received,result.critical)}`;
        }else description=damageDescription(c,applyDamage(c,n,{critical,survival:survival.choice}),n,critical);
        if(!c.hpTemp)c.hpTempSource='';
        if(survival.inspired)consumeInspiration(c);
        save(description+(survival.description?' · '+survival.description:'')+(survival.inspired?' · usou inspiração':''));return;
      }
      if(id==='inspirationReceive') { c.heroicInspiration=true;save('Recebeu inspiração · 2014');return; }
      if(id==='inspirationUse') {
        if(!c.heroicInspiration) return;
        const s=state(c);s.inspirationReady=!s.inspirationReady;
        save(s.inspirationReady?'Preparou inspiração para o próximo d20 da ficha/pool':'Cancelou uso preparado da inspiração');return;
      }
      if(id==='inspirationPhysical') {
        if(!c.heroicInspiration || !await host.confirmDestructiveAction('Usar inspiração na mesa?','Gaste antes da jogada: ela concede vantagem em um ataque, teste de habilidade ou resistência. Com desvantagem, role normalmente.','Gastar inspiração')) return;
        if(host.getChar()!==c || !c.heroicInspiration) return;
        c.heroicInspiration=false;state(c).inspirationReady=false;save('Usou inspiração na mesa · vantagem de 2014');return;
      }
      if(id==='hitDieSpend') {
        const classId=button.dataset.class!,cls=validateHitDie(c,classId),shape=active(c,'druida:wildShape'),ownSong=songOfRestDie(c);
        const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
        controls.innerHTML=`${sourceControls(cls.hitDie)}${shape?'<label>Modificador de CON da besta <input type="number" min="-10" max="10" step="1" required data-health-shape-con></label>':`<p>Constituição: ${ability(c,'con')>=0?'+':''}${ability(c,'con')}. PV: ${c.hpCurrent}/${hitPointMaximum(c)}.</p>`}<label>Canção do Descanso ouvida <select data-health-song ${c.ruleState?.songOfRestUsed?'disabled':''}><option value="0">Sem bônus${c.ruleState?.songOfRestUsed?' · já usado neste descanso':''}</option>${[6,8,10,12].map(n=>`<option value="${n}">d${n}${ownSong===n?' · seu dado de bardo':''}</option>`).join('')}</select></label><label data-health-song-face-label hidden>Face do dado da canção <input type="number" min="1" max="12" step="1" data-health-song-face></label>`;
        chooseSource(controls);
        const showSong=()=>{
          const sides=Number(controls.querySelector<HTMLSelectElement>('[data-health-song]')!.value),hidden=controls.querySelector<HTMLSelectElement>('[data-health-source]')!.value==='virtual' || !sides;
          const input=controls.querySelector<HTMLInputElement>('[data-health-song-face]')!;
          controls.querySelector<HTMLElement>('[data-health-song-face-label]')!.hidden=hidden;input.disabled=hidden;input.required=!hidden;input.max=String(sides || 12);
        };
        controls.addEventListener('change',showSong);showSong();
        if(!await host.confirmDestructiveAction('Gastar um Dado de Vida?',`No fim de um descanso curto de ao menos 1 hora. Gasta 1d${cls.hitDie} de ${E.data.classes[classId].name}; você decide depois se quer gastar outro.${shape?' A cura vai para a besta; informe sua Constituição.':''}`,'Gastar e aplicar cura',controls)) return;
        if(host.getChar()!==c) return;
        validateHitDie(c,classId);
        const virtual=controls.querySelector<HTMLSelectElement>('[data-health-source]')!.value==='virtual',sides=Number(controls.querySelector<HTMLSelectElement>('[data-health-song]')!.value);
        const shapeInput=controls.querySelector<HTMLInputElement>('[data-health-shape-con]'),shapeCon=shapeInput?.value.trim()?Number(shapeInput.value):undefined;
        // Valida sem alterar a ficha e sem lançar dados antes de detectar erro.
        const face=Number(controls.querySelector<HTMLInputElement>('[data-health-face]')!.value),songFace=Number(controls.querySelector<HTMLInputElement>('[data-health-song-face]')!.value);
        spendHitDie(structuredClone(c),classId,virtual?1:face,E,{shapeCon,...(sides?{song:{sides,roll:virtual?1:songFace}}:{})});
        const roll=virtual?host.rollRuleDie(cls.hitDie,'Dado de Vida · '+E.data.classes[classId].name,'normal'):face;
        const songApplies=sides && spendHitDie(structuredClone(c),classId,roll,E,{shapeCon,song:{sides,roll:1}}).song>0;
        const songRoll=songApplies?(virtual?host.rollRuleDie(sides,'Canção do Descanso','normal'):songFace):1;
        const result=spendHitDie(c,classId,roll,E,{shapeCon,...(sides?{song:{sides,roll:songRoll}}:{})});
        save(`Gastou 1d${cls.hitDie} · ${E.data.classes[classId].name}: face ${roll}, CON ${result.con}${result.song?`, canção +${result.song}`:''} · recuperou ${result.restored} PV${result.shape?' da besta':''} · ${result.remaining} dado(s) restante(s)`);
        host.showToast(`Recuperou ${result.restored} PV. Pode gastar outro Dado de Vida, se quiser.`);return;
      }
      if(id==='deathSave') {
        // O validador é puro sobre a cópia, antes de abrir e antes de rolar.
        resolveDeathSave(structuredClone(c),10);
        const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
        controls.innerHTML=`${sourceControls(20)}<label>Modo <select data-health-mode><option value="normal">Normal</option><option value="adv">Vantagem</option><option value="dis">Desvantagem</option></select></label><label title="Some somente bônus recebidos, como uma magia de um aliado. Nenhuma habilidade é somada neste teste.">Bônus recebido <input type="number" min="-100" max="100" value="0" step="1" data-health-bonus></label>${deathSaveBonus(c)?`<p>Alma de Diamante: +${deathSaveBonus(c)} já incluído.</p>`:''}<p>Use a face natural: 1 = duas falhas; 20 = recupera 1 PV.</p>`;
        chooseSource(controls);
        const modeSelect=controls.querySelector<HTMLSelectElement>('[data-health-mode]')!;
        modeSelect.value=host.ruleDiceSettings().mode;
        const modeNote=document.createElement('p');modeNote.setAttribute('data-health-effective-mode','');controls.append(modeNote);
        const showMode=()=>{modeNote.textContent='Modo efetivo: '+({normal:'normal',adv:'vantagem',dis:'desvantagem'}[inspirationRollMode(c,modeSelect.value as 'normal'|'adv'|'dis')])+(c.heroicInspiration && c.ruleState?.inspirationReady?' · usando inspiração':'')+'.';};
        modeSelect.addEventListener('change',showMode);showMode();
        if(!await host.confirmDestructiveAction('Teste contra a morte','No início do seu turno a 0 PV, se não estiver estável.','Registrar resultado',controls)) return;
        if(host.getChar()!==c) return;
        const virtual=controls.querySelector<HTMLSelectElement>('[data-health-source]')!.value==='virtual',bonus=Number(controls.querySelector<HTMLInputElement>('[data-health-bonus]')!.value),face=Number(controls.querySelector<HTMLInputElement>('[data-health-face]')!.value);
        resolveDeathSave(structuredClone(c),virtual?10:face,bonus);
        const mode=inspirationRollMode(c,controls.querySelector<HTMLSelectElement>('[data-health-mode]')!.value as 'normal'|'adv'|'dis');
        const natural=virtual?await host.resolveRuleD20('Teste contra a morte',mode,{type:'save'},{...ruleD20Options(controls,!!(c.heroicInspiration && c.ruleState?.inspirationReady)),key:'death-save'}):face;
        if(natural===null)return;
        if(host.getChar()!==c)return;
        const result=resolveDeathSave(c,natural,bonus),inspired=consumeInspiration(c);
        save(`Teste contra a morte: d20 ${natural}, total ${result.total} · ${result.outcome}${inspired?' · usou inspiração':''}`);host.showToast(result.outcome);return;
      }
      if(id==='stabilize') {
        if(!await host.confirmDestructiveAction('Registrar estabilização?','Use após primeiros socorros com Medicina CD 10 ou outro efeito já resolvido na mesa. Zera sucessos/falhas; continua inconsciente a 0 PV.','Estabilizar')) return;
        if(host.getChar()!==c) return;
        stabilize(c);save('Estabilizou · 0 PV, contagens zeradas');return;
      }
      if(id==='revive') {
        const controls=document.createElement('div');controls.className='rule-context';controls.innerHTML=`<label>PV após retornar <input type="number" min="1" max="${hitPointMaximum(c)}" value="1" data-health-return-hp></label>`;
        if(!await host.confirmDestructiveAction('Registrar retorno à vida?','Somente após uma magia ou decisão da mesa que realmente reviveu o personagem. Custos, limites e penalidades dessa magia continuam a cargo da mesa. Cura comum não basta.','Registrar retorno',controls)) return;
        if(host.getChar()!==c) return;
        returnToLife(c,Number(controls.querySelector<HTMLInputElement>('input')!.value));save('Retornou à vida · '+c.hpCurrent+' PV');
      }
    } catch(error) { host.showToast(error instanceof Error?error.message:'Não foi possível registrar a ação.'); }
  });
}
