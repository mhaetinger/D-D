import { armorClass, exhaustion } from './combat';
import { castingRestriction } from './spellcasting';
import { remaining, resourcesFor, spend, refund, toggleResource, useResource, type Resource } from './resources';
import { ability, active, escape, level, state, type Engine, type Sheet } from './model';
import { resourcesAt } from './placement';
import { healHitPoints, markDead, syncIncapacity, requireConscious } from './health';
import { setupHealthUI } from './health-ui';
import { CONDITIONS, derivedCondition, hasCondition, setCondition } from './conditions';
import { concentration } from './concentration';
import { concentrationControls, setupConcentrationUI } from './concentration-ui';
import { setupWeaponDamageUI } from './weapon-damage-ui';
import {sheetInput} from '../sheet-edit/ui';
import {hasFeat} from './passives';
import { luckRemaining } from './lucky';
import { setupLuckyUI } from './lucky-ui';
import {chooseResourceDice} from './resource-roll-ui';
import {applyRolledResource,finishInterventionWeek,interventionWaiting} from './resource-effects';
import {dragonbornBreathControls,setupDragonbornBreathUI} from './dragonborn-breath-ui';

export function renderResourceControls(c:Sheet,E:Engine,resources:Resource[],showNames=true) {
  const number = (n:number) => Number.isFinite(n)?n:'∞';
  const manualInvocation=(r:Resource)=>r.id.startsWith('bruxo:invocation-') && !r.action;
  const tip = (r:Resource) => {
    const ref = r.id==='race:breath'?E.reference('Arma de Sopro',null,'draconato','race'):r.id==='feat:lucky'?E.reference('Sortudo',null,null,'feat'):E.reference(r.name,r.classId);
    const text=r.note+(manualInvocation(r)?'\n\nRegistro manual: este controle desconta somente o uso diário. Resolva a magia e seus custos separadamente.':'' );
    return `data-rule-tooltip="${escape(JSON.stringify({name:r.name,text,page:ref?.page || E.data.classes[r.classId]?.page,pdfPage:ref?.pdfPage || E.data.classes[r.classId]?.page}))}"`;
  };
  return resources.map(r=>{
    const maxInput=!r.cost&&Number.isFinite(r.max)&&['counter','pool','toggle'].includes(r.kind)?sheetInput(c,`resourceMax.${r.id}`,c.rules?.resourceMaxOverrides?.[r.id]??'',`Máximo de ${r.name} (vazio = automático)`,'number',{min:0,max:100,placeholder:String(r.max)}):number(r.max);
    const value = r.id==='feat:lucky'?luckRemaining(c,E):remaining(c,r), enabled = active(c,r.id);
    const source = r.cost ? r.cost[0]==='feiticeiro:sorceryPool' ? {id:r.cost[0],max:c.sorceryPoints.max,kind:'pool'} as Resource : resourcesFor(c,E).find(x=>x.id===r.cost![0]) : null;
    const affordable = !r.cost || !!source && remaining(c,source)>=r.cost[1];
    let control = '';
    if(r.id==='race:breath')control=dragonbornBreathControls(c,E,r,maxInput);
    else if(r.id==='feat:lucky')control=`<span><span data-lucky-balance>${number(value)}</span>/${maxInput} pontos</span><button type="button" data-lucky-action="table" ${value<1?'disabled':''}>Usar na mesa</button><button type="button" data-lucky-action="incoming" ${value<1?'disabled':''}>Ataque contra mim</button><button type="button" data-rule-action="refund" data-resource="feat:lucky" ${value===r.max?'disabled':''} aria-label="Devolver um ponto de Sortudo">↶</button>`;
    else if (r.kind==='portent') control = c.ruleState?.portent?.length ? c.ruleState.portent.map((p:Sheet,i:number)=>`<button type="button" data-rule-action="portent" data-index="${i}" ${p.spent?'disabled':''} aria-label="Gastar presságio ${i+1}, resultado ${p.value}">${p.value}${p.spent?' ✓':''}</button>`).join('') : '<button type="button" data-rule-action="portentInitial">Rolar dados iniciais</button>';
    else if (r.kind==='toggle' || r.action==='rage') control = `<button type="button" data-rule-action="toggle" data-resource="${r.id}" aria-pressed="${enabled}">${enabled?'✓ Ativo · encerrar':'Ativar'}</button>${r.action==='rage'?`<span>${number(value)}/${maxInput} usos</span>`:''}`;
    else if (r.kind==='pool') control = `<label>Reserva <input type="number" min="0" max="${r.max}" step="1" data-rule-pool="${r.id}" value="${value}" aria-label="${escape(r.name)} atuais"></label><span>/ ${maxInput}</span>`;
    else if (r.kind==='counter') control = `<span>${r.cost?`Custo ${r.cost[1]} ${r.cost[0]==='monge:ki'?'Chi':r.cost[0]==='feiticeiro:sorceryPool'?'pt':'uso'}`:`${number(value)}/${maxInput} usos`}</span><button type="button" data-rule-action="use" data-resource="${r.id}" ${manualInvocation(r)?`aria-label="Registrar uso diário de ${escape(r.name)}"`:''} ${value<1 || !affordable?'disabled':''}>${manualInvocation(r)?'Registrar uso':'Usar'}</button>${!r.cost?`<button type="button" data-rule-action="refund" data-resource="${r.id}" ${value===r.max?'disabled':''} aria-label="Devolver um uso de ${escape(r.name)}">↶</button>`:''}${manualInvocation(r)?'<span class="t-text-muted">Magia e custos na mesa</span>':''}`;
    if (r.action==='wildShape') control += `<label>PV da forma <input type="number" min="0" data-rule-beast-hp value="${Number(c.ruleState?.pools?.[r.id] || 0)}"></label><label>PV máximos <input type="number" min="1" data-rule-beast-max value="${Number(c.ruleState?.beastMax || 1)}"></label>${enabled?`<button type="button" data-rule-action="toggle" data-resource="${r.id}">Encerrar forma</button>`:''}`;
    if(r.action==='intervention' && interventionWaiting(c))control+='<span>7 dias na aventura</span><button type="button" data-rule-action="interventionWeek" data-resource="clerigo:intervention">Registrar semana transcorrida</button>';
    const needsTarget = ['paladino:sacredWeapon','paladino:enmity','mago:hypnotic'].includes(r.id);
    const target = needsTarget ? r.id==='paladino:sacredWeapon' ? `<label>Arma<select data-rule-target="${r.id}"><option value="">Escolha a arma</option>${c.weapons.map((w:Sheet)=>`<option ${c.ruleState?.targets?.[r.id]===w.name?'selected':''}>${escape(w.name)}</option>`).join('')}</select></label>` : `<input data-rule-target="${r.id}" value="${escape(c.ruleState?.targets?.[r.id] || '')}" placeholder="Alvo" aria-label="Alvo de ${escape(r.name)}">` : '';
    const stone = r.id==='mago:stone'?`<label>Benefício <select data-rule-target="${r.id}">${[['darkvision','Visão no escuro'],['speed','Deslocamento +3 m'],['constitution','Proficiência em CON'],['acid','Resistência · ácido'],['cold','Resistência · frio'],['fire','Resistência · fogo'],['lightning','Resistência · elétrico'],['thunder','Resistência · trovejante']].map(([id,name])=>`<option value="${id}" ${c.ruleState?.targets?.[r.id]===id?'selected':''}>${name}</option>`).join('')}</select></label>`:'';
    const companion = r.id==='patrulheiro:companion'?`<div class="rule-controls"><label>Nome<input data-rule-companion="name" value="${escape(c.companion?.name || '')}"></label><label>PV <input type="number" min="0" data-rule-companion="hp" value="${Number(c.companion?.hp || 0)}"></label><label>PV máximos <input type="number" min="1" data-rule-companion="max" value="${Number(c.companion?.max || 1)}"></label></div>`:'';
    return `<div class="rule-inline" data-rule-control="${r.id}">${showNames?`<strong tabindex="0" ${tip(r)}>${escape(r.name)}</strong>`:''}<div class="rule-controls" ${!showNames?tip(r):''}>${control}</div>${target}${stone}${companion}</div>`;
  }).join('');
}

export function renderResourcesAt(c:Sheet,E:Engine,place:string) {
  const list=resourcesAt(c,E,place);
  return list.length?`<div class="rule-context" data-rule-place="${place}">${renderResourceControls(c,E,list)}</div>`:'';
}

export function spellcastingStatusControls(c:Sheet,E:Engine) {
  const blocked=castingRestriction(c,E);
  return `${blocked?`<p class="text-xs font-bold" role="status" data-spellcasting-block>${escape(blocked)}</p>`:''}${concentrationControls(c)}`;
}

export function defenseControls(c:Sheet,E:Engine) {
  const ac=armorClass(c,E);
  const help=(name:string,text:string)=>`tabindex="0" class="rule-help-label" data-rule-tooltip="${escape(JSON.stringify({name,text}))}"`;
  const adjustments=[
    ['armorMagicBonus','Magia da armadura','Bônus mágico da armadura vestida, por exemplo +1. Não é o valor base de CA da armadura. Deixe vazio para usar o bônus identificado no nome do equipamento; 0 ignora esse bônus.'],
    ['shieldMagicBonus','Magia do escudo','Bônus mágico adicional do escudo equipado. O +2 normal do escudo já está no cálculo. Deixe vazio para reconhecer o bônus pelo nome; 0 usa apenas o escudo comum.'],
    ['acAdjustment','Ajuste de CA','Some ou subtraia um bônus de CA que ainda não entrou no cálculo, como um item ou adaptação da mesa. Não repita aqui bônus da armadura, escudo ou efeitos marcados abaixo. Vazio equivale a 0.'],
  ];
  const effects=[
    ...(hasFeat(c,E,'Ambidestro')?[['feat:dualWielder','Duas armas empunhadas · Ambidestro +1 CA','Marque enquanto empunhar uma arma corpo a corpo em cada mão. Não basta ter duas armas no inventário. Não se aplica com escudo, inconsciente ou em Forma Selvagem. CA escrita/manual já inclui seus bônus; não soma o talento novamente. Não repita esse +1 no ajuste de CA.']]:[]),
    ['spell:shieldOfFaith','Escudo da Fé +2','Marque enquanto estiver recebendo esta magia: soma +2 à CA, por até 10 minutos e com concentração de quem a conjurou. Desmarque quando terminar. Este controle não gasta espaço de magia.'],
    ['spell:shield','Escudo Arcano +5','Marque após usar a reação da magia Escudo Arcano: soma +5 à CA até o início do seu próximo turno, inclusive contra o ataque que a desencadeou, e impede dano de Mísseis Mágicos. Desmarque ao terminar; o espaço e a reação são controlados separadamente.'],
    ['spell:bladeWard','Proteção contra Lâminas · resistência','Até o fim do seu próximo turno, esta magia dá resistência a dano de concussão, cortante e perfurante causado por ataques com armas. Não aumenta a CA. Em Dano detalhado → Calcular por tipo, escolha ataque de arma para aplicar a resistência. No modo já resolvido, aplique-a na mesa.'],
  ];
  return `<details class="rule-context" data-rule-disclosure="defense"><summary>Ajustes de defesa e efeitos recebidos</summary>
    <div class="rule-defense-field"><label for="ruleAcFormula" ${help('Fórmula de CA','CA é a Classe de Armadura, o valor que um ataque precisa alcançar para acertar. Automática escolhe a maior fórmula válida; você pode escolher outra das disponíveis. Fórmulas alternativas não se somam. Os bônus abaixo são adicionados à fórmula escolhida.')}>Fórmula de CA</label><select id="ruleAcFormula" data-rule-ac>${ac.options.map(o=>`<option value="${o.id}" ${c.acFormula===o.id?'selected':''}>${escape(o.label)} · ${o.total}</option>`).join('')}<option value="auto" ${!ac.options.some(o=>o.id===c.acFormula)?'selected':''}>Automática · maior válida</option></select></div>
    <div class="rule-defense-grid">${adjustments.map(([id,label,text])=>`<div class="rule-defense-field"><label for="ruleDefense-${id}" ${help(label,text)}>${label}</label><input id="ruleDefense-${id}" type="number" min="-100" max="100" step="1" data-rule-defense="${id}" placeholder="Auto" value="${c[id]===undefined?'':Number(c[id])}"></div>`).join('')}</div>
    <div class="rule-defense-effects">${effects.map(([id,label,text])=>`<div class="rule-effect-row"><label ${help(label,text)}><input type="checkbox" data-rule-effect="${id}" ${active(c,id)?'checked':''}><span>${label}</span></label></div>`).join('')}</div></details>`;
}

export function conditionControls(c:Sheet) {
  const fatigue=exhaustion(c);
  const count=CONDITIONS.filter(x=>hasCondition(c,x.id)).length;
  return `<div class="rule-context rule-controls"><label>Exaustão <select data-rule-exhaustion aria-label="Nível de exaustão">${[0,1,2,3,4,5,6].map(n=>`<option ${n===fatigue.level?'selected':''}>${n}</option>`).join('')}</select></label>${fatigue.level?`<span>${fatigue.penalties.map(escape).join(' · ')}</span>`:''}</div><details class="rule-context" data-rule-disclosure="conditions"><summary title="Marque estados como envenenado, caído ou paralisado. Consulte cada condição para conferir seus efeitos.">Condições${count?` · ${count} ativa(s)`:''}</summary><div class="rule-conditions">${CONDITIONS.map(x=>{const derived=derivedCondition(c,x.id);return `<label class="rule-check" tabindex="0" data-rule-tooltip="${escape(JSON.stringify({name:x.name,text:x.text+(derived?' Decorre do estado atual; encerre sua causa para remover.':'')}))}"><input type="checkbox" data-rule-condition="${x.id}" ${hasCondition(c,x.id)?'checked':''} ${derived?'disabled':''}><span>${x.name}${derived?' · decorrente':''}</span></label>`;}).join('')}</div><p>Concentração, impedimentos de agir/mover e falhas de FOR/DES são aplicados. Outros modos de rolagem, sentidos, alvos, dano e duração seguem a mesa; consulte cada nome.</p></details>`;
}

export function hitDiceRecoveryControls(c:Sheet,E:Engine) {
  return c.ruleState?.hitDiceRecovery?`<div class="rule-context rule-controls"><span>Recupere ${c.ruleState.hitDiceRecovery} Dado(s) de Vida:</span>${c.classes.filter((x:Sheet)=>x.hitDiceUsed>0).map((x:Sheet)=>`<button type="button" data-rule-action="hitDie" data-class="${x.classId}">${escape(E.data.classes[x.classId].name)} · d${x.hitDie}</button>`).join('')}</div>`:'';
}

export function saveRuleStep(description:string) {
  const host = window as any;
  const focused = document.activeElement as HTMLElement;
  const attrs = focused ? [...focused.attributes].filter(a=>a.name.startsWith('data-rule-') || a.name.startsWith('data-health-') || a.name.startsWith('data-concentration-') || ['data-resource','data-index','data-class'].includes(a.name)).map(a=>`[${a.name}="${CSS.escape(a.value)}"]`).join('') : '';
  const handler=focused?.getAttribute('onclick');
  const focusKey=attrs || (focused?.id?'#'+CSS.escape(focused.id):handler?`[onclick="${CSS.escape(handler)}"]`:'');
  const open = new Map([...document.querySelectorAll<HTMLDetailsElement>('[data-rule-disclosure]')].map(el=>[el.dataset.ruleDisclosure,el.open]));
  const previousChecks=Number(document.querySelector<HTMLElement>('[data-concentration-control]')?.dataset.concentrationCount || 0);
  host.recordStepAndSave(description,true);
  for (const el of document.querySelectorAll<HTMLDetailsElement>('[data-rule-disclosure]')) if(open.has(el.dataset.ruleDisclosure)) el.open = open.get(el.dataset.ruleDisclosure)!;
  const concentrationPanel=document.querySelector<HTMLDetailsElement>('[data-concentration-control]');
  if(!previousChecks && Number(concentrationPanel?.dataset.concentrationCount)>0)concentrationPanel!.open=true;
  if (focusKey) document.querySelector<HTMLElement>(focusKey)?.focus({preventScroll:true});
}
/** Conserva os próprios nós das opções, além de foco/rolagem, ao atualizar a
 * ficha. O fluxo de altura é remontado pelo chamador após recolocar a lista. */
export function retainConditionNodes(previous:HTMLElement|null,root:HTMLElement) {
  const next=root.querySelector<HTMLElement>('[data-rule-disclosure="conditions"]');
  if(!previous || !next)return;
  const inputs=next.querySelectorAll<HTMLInputElement>('[data-rule-condition]');
  if(inputs.length!==previous.querySelectorAll('[data-rule-condition]').length)return;
  for(const input of inputs) {
    const old=previous.querySelector<HTMLInputElement>(`[data-rule-condition="${CSS.escape(input.dataset.ruleCondition!)}"]`);if(!old)return;
    old.checked=input.checked;old.disabled=input.disabled;
    const label=old.closest('label')!,fresh=input.closest('label')!;
    label.dataset.ruleTooltip=fresh.dataset.ruleTooltip;label.querySelector('span')!.textContent=fresh.querySelector('span')!.textContent;
  }
  previous.querySelector('summary')!.textContent=next.querySelector('summary')!.textContent;
  next.replaceWith(previous);
}
export function setupRuleUI(E: Engine) {
  const host = window as any, save=saveRuleStep;
  setupHealthUI(E,save);
  setupConcentrationUI(E,save);
  setupWeaponDamageUI(E,save);
  setupLuckyUI(E,save);
  setupDragonbornBreathUI(E,save);
  document.addEventListener('change',event=>{
    const input = event.target as HTMLInputElement;
    if(!(input instanceof HTMLElement) || !input.getAttributeNames().some(name=>name.startsWith('data-rule-'))) return;
    const c = host.getChar(); if (!c) return;
    if(input.dataset.ruleCondition) {
      try {const result=setCondition(c,input.dataset.ruleCondition,input.checked);save(`Condição · ${CONDITIONS.find(x=>x.id===input.dataset.ruleCondition)?.name || ''}${input.checked?' ativada':' encerrada'}${result.ended?' · encerrou concentração em '+result.ended.name:''}`);}
      catch(error){host.showToast((error as Error).message);input.checked=hasCondition(c,input.dataset.ruleCondition);}return;
    }
    const s = state(c);
    if (input.hasAttribute('data-rule-exhaustion')) { c.exhaustion = Math.max(0,Math.min(6,Number(input.value))); c.hpCurrent = c.exhaustion===6?0:Math.min(c.hpCurrent,exhaustion(c).hpMax); if(c.exhaustion===6) markDead(c);else syncIncapacity(c); }
    else if (input.hasAttribute('data-rule-ac')) c.acFormula = input.value;
    else if (input.dataset.ruleDefense && ['armorMagicBonus','shieldMagicBonus','acAdjustment'].includes(input.dataset.ruleDefense)) {
      if (!input.value.trim()) delete c[input.dataset.ruleDefense];
      else { if (!Number.isInteger(Number(input.value)) || Math.abs(Number(input.value))>100) { host.showToast('Informe um ajuste inteiro entre -100 e 100.'); return; } c[input.dataset.ruleDefense]=Number(input.value); }
    }
    else if (input.dataset.ruleEffect) s.active[input.dataset.ruleEffect] = input.checked;
    else if (input.dataset.ruleTarget) { if (active(c,input.dataset.ruleTarget)) { host.showToast('Encerre o efeito antes de mudar sua arma ou alvo.'); host.renderAll(); return; } s.targets[input.dataset.ruleTarget] = input.value; }
    else if (input.dataset.rulePool) {
      const r = resourcesFor(c,E).find(x=>x.id===input.dataset.rulePool);
      if (!r || !Number.isInteger(Number(input.value))) return;
      s.pools[r.id] = Math.max(0,Math.min(r.max,Number(input.value)));
      if (r.id==='mago:ward') s.wardCreated = true;
    } else if (input.hasAttribute('data-rule-beast-hp')) { if (!Number.isInteger(Number(input.value))) return; s.pools['druida:wildShape']=Math.max(0,Number(input.value));if(!s.pools['druida:wildShape']){s.active['druida:wildShape']=false;syncIncapacity(c);} }
    else if (input.hasAttribute('data-rule-beast-max')) { if (!Number.isInteger(Number(input.value))) return; s.beastMax=Math.max(1,Number(input.value)); }
    else if (input.dataset.ruleCompanion) { c.companion ||= {}; c.companion[input.dataset.ruleCompanion] = input.dataset.ruleCompanion==='name'?input.value:Math.max(0,Math.floor(Number(input.value))); }
    else return;
    save('Atualizou recurso ou condição');
  });
  document.addEventListener('click',async event=>{
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-rule-action]'); if (!button) return;
    if(button.disabled)return;
    const c = host.getChar(); if (!c) return;
    let r = resourcesFor(c,E).find(x=>x.id===button.dataset.resource);
    if(r?.id==='race:breath' && !host.requireSheetEdit())return;
    try {
      const action = button.dataset.ruleAction;
      const oldConcentration=concentration(c);
      if(r && action==='toggle' && !active(c,r.id) && ['clerigo:duplicate','feiticeiro:presence'].includes(r.id) && oldConcentration){
        const before=JSON.stringify(c);
        if(!await host.confirmDestructiveAction('Ativar '+r.name+'?',`Encerra concentração em ${oldConcentration.name}. O custo só é descontado ao confirmar.`,'Ativar'))return;
        if(host.getChar()!==c || JSON.stringify(c)!==before)return;
        r=resourcesFor(c,E).find(x=>x.id===button.dataset.resource);if(!r)return;
      }
      if(r?.id==='barbaro:rage' && action==='toggle' && !active(c,r.id) && oldConcentration) {
        if(!await host.confirmDestructiveAction('Entrar em Fúria?','Encerra concentração em '+oldConcentration.name+'. O uso de Fúria só é gasto ao confirmar.','Entrar em Fúria'))return;
        if(host.getChar()!==c || concentration(c)?.id!==oldConcentration.id || active(c,r.id))return;
        r=resourcesFor(c,E).find(x=>x.id==='barbaro:rage');if(!r)return;
      }
      if (action==='prepare') { host.CharacterWizard.openPrepare(button.dataset.class); return; }
      const s=state(c);
      if(action==='interventionWeek'){
        const before=JSON.stringify(c);
        if(!await host.confirmDestructiveAction('Concluir a espera de Intervenção Divina?','Confirme somente quando sete dias tiverem passado na aventura. Um descanso isolado não libera a característica.','A semana passou'))return;
        if(host.getChar()!==c || JSON.stringify(c)!==before)return;
        finishInterventionWeek(c);save('Intervenção Divina · sete dias transcorridos na aventura');return;
      }
      if (action==='portentInitial') { if (s.portent.length) return; const n = resourcesFor(c,E).find(x=>x.kind==='portent')?.max; if (!n) return; const faces=await chooseResourceDice(c,'Presságio',20,n);if(!faces)return;s.portent=faces.map(value=>({value,spent:false})); }
      if (action==='portent') { const p = s.portent[Number(button.dataset.index)]; if (!p || p.spent) return; p.spent = true; }
      if (action==='hitDie') { const cls = c.classes.find((x:Sheet)=>x.classId===button.dataset.class); if (!s.hitDiceRecovery || !cls?.hitDiceUsed) return; cls.hitDiceUsed--; s.hitDiceRecovery--; }
      if (r && action==='refund') refund(c,r);
      if (r && action==='toggle') {
        if (['paladino:sacredWeapon','paladino:enmity','mago:hypnotic'].includes(r.id) && !s.targets[r.id]) throw new Error('Escolha primeiro a arma ou o alvo do efeito.');
        toggleResource(c,r,E);
      }
      if (r && action==='use') {
        if (r.action==='slotRecovery') {
          const max = Math.ceil(level(c,r.classId)/2);
          const html = `<p>Selecione espaços já gastos: soma até ${max}, máximo 5º nível.</p>${Object.entries(c.standardSlots).filter(([n,v]:any)=>+n<=5 && v.used>0).map(([n,v]:any)=>`<label>${n}º nível <input type="number" min="0" max="${v.used}" value="0" data-recover-circle="${n}"></label>`).join('')}`;
          const controls = document.createElement('div'); controls.innerHTML = html;
          if (!await host.confirmDestructiveAction(r.name,'Use esta ação durante um descanso curto.','Recuperar',controls)) return;
          if (host.getChar()!==c) return;
          const fields = [...controls.querySelectorAll<HTMLInputElement>('[data-recover-circle]')];
          const amounts = fields.map(i=>[Number(i.dataset.recoverCircle),Number(i.value)]);
          if (!amounts.length || amounts.some(([n,v])=>!Number.isInteger(v)||v<0||v>c.standardSlots[n].used) || amounts.reduce((sum,[n,v])=>sum+n*v,0)>max || !amounts.some(([,v])=>v>0)) throw new Error('Confira a distribuição; nenhum uso ou espaço foi alterado.');
          spend(c,r); for (const [n,v] of amounts) c.standardSlots[n].used -= v;
        } else {
          if (r.action==='wildShape' && active(c,r.id)) throw new Error('Encerre a forma atual antes de gastar outra utilização.');
          if (r.action==='wildShape' && !(s.pools[r.id]>0)) throw new Error('Registre os PV da forma de besta antes de ativar.');
          if (r.action==='moonHeal') {
            requireConscious(c);
            if (!active(c,'druida:wildShape')) throw new Error('Entre em Forma Selvagem antes de curar a besta.');
            const controls = document.createElement('div');
            controls.innerHTML = `<label>Espaço <select data-heal-slot>${Object.entries(c.standardSlots).filter(([,v]:any)=>v.used<v.total).map(([n])=>`<option value="${n}">${n}º nível</option>`).join('')}</select></label>`;
            if (!await host.confirmDestructiveAction('Curar a forma de besta?','Gasta um espaço e cura 1d8 por nível, usando ação bônus.','Curar',controls)) return;
            if (host.getChar()!==c || !active(c,'druida:wildShape')) return;
            const circle = Number(controls.querySelector<HTMLSelectElement>('select')!.value), slot = c.standardSlots[circle];
            if (!slot || slot.used>=slot.total) throw new Error('Não há espaço disponível.');
            const faces=await chooseResourceDice(c,'Curar a forma de besta',8,circle);if(!faces)return;
            if(!active(c,'druida:wildShape') || slot.used>=slot.total)throw new Error('A forma ou o espaço mudou.');
            slot.used++;
            const healed = faces.reduce((a,b)=>a+b,0);
            s.pools['druida:wildShape']=Math.min(s.beastMax,s.pools['druida:wildShape']+healed);
          } else if(r.action==='secondWind' || r.action==='intervention'){
            useResource(structuredClone(c),r,E);
            const automatic=r.action==='intervention' && level(c,'clerigo')>=20;
            const faces=automatic?[]:await chooseResourceDice(c,r.name,r.action==='secondWind'?10:100);if(!faces)return;
            const result=applyRolledResource(c,r,E,faces[0]);
            if(r.action==='intervention')host.showToast(`Intervenção: ${automatic?'sucesso automático':faces[0]}. ${result.success?'Sucesso; aguarde sete dias na aventura.':'Falhou; recupera no descanso longo.'}`);
          } else useResource(c,r,E);
          if (r.action==='wholeness') healHitPoints(c,3*level(c,'monge'));
          if (r.action==='pactRecovery') c.pactMagic.used = 0;
          if (r.action==='wildShape') { s.active[r.id] = true; host.showToast('Forma ativa. Elemental exige 2 usos no nível 10+; confira a forma no livro.'); }
        }
      }
      save('Atualizou '+(r?.name || 'recurso')+(oldConcentration && !concentration(c)?' · encerrou concentração em '+oldConcentration.name:''));
    } catch (error) { host.showToast(error instanceof Error?error.message:'Não foi possível usar esse recurso.'); }
  });
}
