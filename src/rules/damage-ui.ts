import { arcaneWardPoints, canUncannyDodge, DAMAGE_SOURCES, DAMAGE_TYPES, fiendResistanceType, hasEvasion, hasUncannyDodge, heavyArmorReduction, isDamageAttack, previewTypedDamage, typedDamageSummary, type DamagePacket } from './damage';
import { active, escape, level, type Engine, type Sheet } from './model';
import { automaticSaveFailure } from './conditions';
import { survivalOptions } from './survival';

const help=(name:string,text:string)=>`tabindex="0" data-rule-tooltip="${escape(JSON.stringify({name,text}))}"`;
function damageRow() {
  return `<div class="rule-damage-part t-inset" data-damage-part>
  <div class="rule-damage-fields"><label ${help('Tipo de dano','Some os dados e modificadores já rolados deste tipo, incluindo os dados do crítico. Não aplique antes as defesas escolhidas neste formulário. Cada tipo aparece uma vez; outro ataque deve ser aplicado separadamente. Se a mesa já resolveu tudo, use o modo de dano já resolvido.')}>Tipo <select data-damage-type aria-label="Tipo de dano"><option value="">Escolha...</option>${DAMAGE_TYPES.map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label><label>Valor <input type="number" min="1" max="1000000" step="1" data-damage-amount aria-label="Valor do dano por tipo"></label></div>
  <div class="rule-controls"><button type="button" data-damage-row-action="up" aria-label="Mover tipo de dano para cima">↑</button><button type="button" data-damage-row-action="down" aria-label="Mover tipo de dano para baixo">↓</button><button type="button" data-damage-row-action="remove" aria-label="Remover tipo de dano">Remover</button>
  <details data-damage-adjustments><summary>Ajustes da mesa</summary><div class="rule-damage-fields"><label ${help('Defesa para esta ocorrência','Automática reconhece as fontes verificadas da ficha. As demais opções substituem resistência/imunidade somente neste dano: use para um item, magia recebida ou decisão do Mestre ainda não representados. Não ativa recursos nem grava uma defesa permanente.')}>Defesa <select data-damage-defense><option value="auto">Automática da ficha</option><option value="normal">Sem resistência/imunidade · mesa</option><option value="resistance">Resistência · mesa</option><option value="immunity">Imunidade · mesa</option></select></label><label ${help('Redução adicional','Valor definido pela mesa que ainda não entrou no dano. É subtraído após a Proteção Arcana e antes de resistência/vulnerabilidade, com mínimo zero. Não repita uma redução já aplicada aos dados.')}>Redução adicional <input type="number" min="0" max="1000000" step="1" value="0" data-damage-reduction></label></div><label class="rule-check" ${help('Vulnerabilidade','Dobra o dano depois de aplicar resistência e arredondar para baixo. Não cancela a resistência antes do arredondamento. A imunidade continua impedindo o dano.')}> <input type="checkbox" data-damage-vulnerable> Vulnerabilidade · mesa</label></details></div>
  </div>`;
}
export function damageControls(c:Sheet,E:Engine) {
  const shape=active(c,'druida:wildShape');
  const resolvedNote=arcaneWardPoints(c)>0?'Com Proteção Arcana, resolva primeiro a absorção e depois as defesas do excedente. Informe proteção absorvida + dano final às outras reservas; o modo por tipo faz esse cálculo.':'Informe o dano final, após resistências e reduções da mesa. A ficha desconta temporários e forma.';
  return `<details class="rule-context" data-rule-disclosure="healthDamage" data-damage-controls><summary title="Registre o dano recebido pelo personagem. Você pode informar o total ou calcular defesas por tipo de dano.">Dano detalhado</summary>
  <label ${help('Aplicação do dano','Já resolvido: a mesa aplicou os modificadores; a ficha desconta suas reservas. Por tipo: calcula as fontes reconhecidas, mostra a prévia e usa uma única ocorrência para concentração e morte. Não use os dois modos para o mesmo dano.')}>Como aplicar <select data-damage-mode><option value="final">Dano já resolvido pela mesa</option><option value="typed" ${shape?'disabled':''}>Calcular por tipo · 2014</option></select></label>
  <div data-damage-final class="rule-controls"><label>Dano <input type="number" min="1" step="1" data-health-damage aria-label="Dano recebido"></label></div>
  <div data-damage-typed hidden><label ${help('Origem do dano','A origem determina se Proteção contra Lâminas, Resistência à Magia e outras defesas condicionais se aplicam. Ataque de arma pode ser corpo a corpo ou à distância. Magia não é ataque de arma. Na dúvida, resolva com o Mestre ou use o modo já resolvido.')}>Origem <select data-damage-source><option value="">Escolha...</option>${DAMAGE_SOURCES.map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label><label class="rule-check" data-damage-silvered-label hidden ${help('Arma de prata','Armas de prata ignoram especificamente a Resistência Demoníaca do Corruptor. Não ignoram todas as resistências. Só se aplica à origem ataque de arma.')}> <input type="checkbox" data-damage-silvered> Arma de prata</label>
  <label data-damage-save-label hidden ${help('Resistência de DES para metade','Somente para um efeito que pede DES e causa metade do dano no sucesso. Informe os valores antes do teste e registre seu resultado aqui. Com Evasão: sucesso zera, falha divide por dois, sem gastar reação. Os tipos são arredondados separadamente. Outros testes/efeitos continuam resolvidos pela mesa; não repita uma redução já aplicada.')}>DES para metade${hasEvasion(c,E)?' · Evasão':''} <select data-damage-save><option value="">Não se aplica / já resolvido</option><option value="success">Sucesso no teste</option><option value="failure">Falha no teste</option></select></label>
  ${hasUncannyDodge(c,E)?`<label class="rule-check" data-damage-uncanny-label hidden ${help('Esquiva Sobrenatural','Ao ser atingido por um ataque, inclusive de magia, pode gastar a reação para reduzir pela metade o dano que receber. Marque somente se puder ver o atacante e sua reação estiver disponível. A ficha não acompanha os turnos; esta escolha vale para um único ataque. Não serve contra dano por teste de resistência. Os tipos são arredondados separadamente.')}> <input type="checkbox" data-damage-uncanny> Usar Esquiva Sobrenatural · vejo o atacante e tenho reação</label><label data-damage-modifier-label hidden ${help('Ordem dos modificadores','Quando a metade da Esquiva e uma redução fixa coincidem, declare com o Mestre a ordem usada. Ambas vêm depois da proteção e antes de resistência/vulnerabilidade. A prévia mostra o resultado; não repita modificadores já resolvidos.')}>Ordem definida pela mesa <select data-damage-modifier-order><option value="reduceFirst">Reduções → Esquiva</option><option value="halveFirst">Esquiva → reduções</option></select></label>`:''}
  <div data-damage-parts>${damageRow()}</div><button type="button" data-damage-row-action="add">Adicionar outro tipo</button>
  <p data-damage-order-note hidden ${help('Uma ocorrência, vários tipos','A proteção absorve na ordem acima. Maestria em Armadura Pesada usa uma reserva de 3 por ataque, distribuída entre os tipos físicos elegíveis nessa ordem, sem afetar fogo ou dano mágico. Use as setas para a ordem definida com o Mestre. Concentração e morte usam o total uma única vez.')}>A ordem dos tipos define a alocação da proteção e da redução de armadura; confira com o Mestre.</p>
  <output data-damage-preview role="status" aria-live="polite">Informe origem, tipo e valor para conferir o cálculo.</output></div>
  ${c.rules?.raceId==='meioOrc' || level(c,'barbaro')>=11?`<label data-damage-survival-label hidden ${help('Evitar a queda a 0 PV','Estas características só aparecem se este dano levar de PV positivos a 0 sem morte instantânea. Resistência Implacável deixa com 1 PV uma vez por descanso longo. Fúria Implacável pede CON em Fúria; cada tentativa eleva a próxima CD em 5, recuperada no descanso curto/longo. Escolher não gasta: o uso e os PV só mudam ao aplicar. Não cobre Forma Selvagem ou efeitos de morte sem dano.')}>Evitar cair a 0 PV <select data-damage-survival><option value="">Receber o dano normalmente</option><option value="endurance">Usar Resistência Implacável · 1 PV</option><option value="rage">Tentar Fúria Implacável</option></select></label>`:''}
  <div class="rule-controls"><label class="rule-check" ${help('Acerto crítico recebido','O valor informado já deve conter os dados extras do crítico. Esta marca não dobra o dano; a 0 PV, faz o dano recebido causar duas falhas contra a morte em vez de uma.')}> <input type="checkbox" data-health-critical> Acerto crítico</label><button type="button" data-health-action="damage">Aplicar dano</button></div>
  <p class="t-text-muted" data-damage-final-note>${resolvedNote}</p>${shape?'<p>Forma Selvagem: resolva o dano e o excesso na mesa. Resistências e estatísticas da besta ainda não estão integradas.</p>':''}</details>`;
}
export function readDamagePacket(controls:HTMLElement):DamagePacket {
  return {source:controls.querySelector<HTMLSelectElement>('[data-damage-source]')!.value as DamagePacket['source'],
    critical:controls.querySelector<HTMLInputElement>('[data-health-critical]')!.checked,
    silvered:controls.querySelector<HTMLInputElement>('[data-damage-silvered]')!.checked,
    uncannyDodge:controls.querySelector<HTMLInputElement>('[data-damage-uncanny]')?.checked || false,
    ...(controls.querySelector<HTMLSelectElement>('[data-damage-save]')!.value?{dexteritySave:controls.querySelector<HTMLSelectElement>('[data-damage-save]')!.value as 'success'|'failure'}:{}),
    modifierOrder:(controls.querySelector<HTMLSelectElement>('[data-damage-modifier-order]')?.value || 'reduceFirst') as DamagePacket['modifierOrder'],
    parts:[...controls.querySelectorAll<HTMLElement>('[data-damage-part]')].map(row=>({
      type:row.querySelector<HTMLSelectElement>('[data-damage-type]')!.value as DamagePacket['parts'][number]['type'],
      amount:Number(row.querySelector<HTMLInputElement>('[data-damage-amount]')!.value),
      defense:row.querySelector<HTMLSelectElement>('[data-damage-defense]')!.value as DamagePacket['parts'][number]['defense'],
      reduction:Number(row.querySelector<HTMLInputElement>('[data-damage-reduction]')!.value),
      vulnerable:row.querySelector<HTMLInputElement>('[data-damage-vulnerable]')!.checked,
    }))};
}
/** Atalhos de PV não podem gastar uma defesa opcional silenciosamente nem
 * derrubar o personagem antes da escolha. Abrem o controle já existente. */
export function offerSurvivalForDamage(c:Sheet,amount:number) {
  const options=survivalOptions(c,Math.max(0,amount-arcaneWardPoints(c)));
  if(!options.endurance && options.rageDC===null)return false;
  const form=document.querySelector<HTMLDetailsElement>('[data-damage-controls]');if(!form)return false;
  form.open=true;form.querySelector<HTMLSelectElement>('[data-damage-mode]')!.value='final';
  const input=form.querySelector<HTMLInputElement>('[data-health-damage]')!;input.value=String(amount);input.dispatchEvent(new Event('input',{bubbles:true}));
  form.querySelector<HTMLSelectElement>('[data-damage-survival]')?.focus();
  (window as any).showToast('Confira a defesa de queda e confirme o dano no controle aberto.');
  return true;
}
/** Altera apenas os campos da ocorrência: selecionar não reconstrói a ficha,
 * não troca seus nós nem grava histórico. A mutação dos PV fica no envio. */
export function setupDamageUI(E:Engine) {
  const host=window as any;
  const updateSurvival=(controls:HTMLElement,c:Sheet,received:number)=>{
    const select=controls.querySelector<HTMLSelectElement>('[data-damage-survival]');if(!select)return;
    const options=survivalOptions(c,received);
    select.querySelector<HTMLOptionElement>('[value="endurance"]')!.disabled=!options.endurance;
    const rage=select.querySelector<HTMLOptionElement>('[value="rage"]')!;rage.disabled=options.rageDC===null;rage.textContent=`Tentar Fúria Implacável · CON CD ${options.rageDC ?? '—'}`;
    if(select.selectedOptions[0]?.disabled)select.value='';
    controls.querySelector<HTMLElement>('[data-damage-survival-label]')!.hidden=!options.endurance && options.rageDC===null;
  };
  const update=(controls:HTMLElement)=>{
    const typed=controls.querySelector<HTMLSelectElement>('[data-damage-mode]')!.value==='typed';
    controls.querySelector<HTMLElement>('[data-damage-final]')!.hidden=typed;
    controls.querySelector<HTMLElement>('[data-damage-final-note]')!.hidden=typed;
    controls.querySelector<HTMLElement>('[data-damage-typed]')!.hidden=!typed;
    const submit=controls.querySelector<HTMLButtonElement>('[data-health-action="damage"]')!;
    const c=host.getChar();submit.disabled=false;
    if(!typed) {
      const amount=Number(controls.querySelector<HTMLInputElement>('[data-health-damage]')!.value);
      try {updateSurvival(controls,c,Math.max(0,amount-arcaneWardPoints(c)));}catch {controls.querySelector<HTMLElement>('[data-damage-survival-label]')?.setAttribute('hidden','');}
      return;
    }
    const rows=[...controls.querySelectorAll<HTMLElement>('[data-damage-part]')],chosen=rows.map(r=>r.querySelector<HTMLSelectElement>('[data-damage-type]')!.value);
    rows.forEach((row,i)=>{
      const select=row.querySelector<HTMLSelectElement>('[data-damage-type]')!;
      for(const option of select.options)option.disabled=!!option.value && option.value!==select.value && chosen.includes(option.value);
      row.querySelector<HTMLButtonElement>('[data-damage-row-action="up"]')!.disabled=i===0;
      row.querySelector<HTMLButtonElement>('[data-damage-row-action="down"]')!.disabled=i===rows.length-1;
      row.querySelector<HTMLButtonElement>('[data-damage-row-action="remove"]')!.disabled=rows.length===1;
      for(const button of row.querySelectorAll<HTMLButtonElement>('[data-damage-row-action]'))button.hidden=rows.length===1;
    });
    controls.querySelector<HTMLButtonElement>('[data-damage-row-action="add"]')!.disabled=rows.length>=13;
    const silvered=controls.querySelector<HTMLInputElement>('[data-damage-silvered]')!,source=controls.querySelector<HTMLSelectElement>('[data-damage-source]')!.value;
    silvered.disabled=!['weapon','magicWeapon'].includes(source) || !fiendResistanceType(c,E);if(silvered.disabled)silvered.checked=false;
    controls.querySelector<HTMLElement>('[data-damage-silvered-label]')!.hidden=silvered.disabled;
    const save=controls.querySelector<HTMLSelectElement>('[data-damage-save]')!;
    save.disabled=isDamageAttack(source) || !source;if(save.disabled)save.value='';
    save.querySelector<HTMLOptionElement>('[value="success"]')!.disabled=automaticSaveFailure(c,'dex');
    if(save.selectedOptions[0]?.disabled)save.value='';
    controls.querySelector<HTMLElement>('[data-damage-save-label]')!.hidden=save.disabled;
    const uncanny=controls.querySelector<HTMLInputElement>('[data-damage-uncanny]');
    if(uncanny) {
      uncanny.disabled=!canUncannyDodge(c,E,source);if(uncanny.disabled)uncanny.checked=false;
      controls.querySelector<HTMLElement>('[data-damage-uncanny-label]')!.hidden=uncanny.disabled;
      controls.querySelector<HTMLElement>('[data-damage-modifier-label]')!.hidden=!uncanny.checked || !(heavyArmorReduction(c,E,source) || rows.some(r=>Number(r.querySelector<HTMLInputElement>('[data-damage-reduction]')!.value)>0));
    }
    controls.querySelector<HTMLElement>('[data-damage-order-note]')!.hidden=rows.length<2 || !(arcaneWardPoints(c)>0 || heavyArmorReduction(c,E,source)>0);
    const target=controls.querySelector<HTMLOutputElement>('[data-damage-preview]')!;
    try {
      const plan=previewTypedDamage(c,readDamagePacket(controls),E);
      target.textContent=`${typedDamageSummary(plan)}. Total recebido: ${plan.received} · PV temporários e atuais serão descontados ao aplicar.${arcaneWardPoints(c)>0?' Proteção Arcana absorve antes das defesas do personagem.':''}`;
      updateSurvival(controls,c,plan.received);
    }catch(error){target.textContent=(error as Error).message;submit.disabled=true;controls.querySelector<HTMLElement>('[data-damage-survival-label]')?.setAttribute('hidden','');}
  };
  for(const name of ['input','change'])document.addEventListener(name,event=>{
    const controls=(event.target as HTMLElement).closest<HTMLElement>('[data-damage-controls]');if(controls)update(controls);
  });
  document.addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-damage-row-action]');if(!button || button.disabled)return;
    const controls=button.closest<HTMLElement>('[data-damage-controls]')!,list=controls.querySelector<HTMLElement>('[data-damage-parts]')!,row=button.closest<HTMLElement>('[data-damage-part]'),action=button.dataset.damageRowAction;
    if(action==='add' && list.children.length<13) {
      list.insertAdjacentHTML('beforeend',damageRow());update(controls);list.lastElementChild!.querySelector<HTMLElement>('select')!.focus();return;
    }
    if(row && action==='remove' && list.children.length>1) {const target=row.nextElementSibling || row.previousElementSibling;row.remove();update(controls);target?.querySelector<HTMLElement>('select')?.focus({preventScroll:true});return;}
    if(row && action==='up' && row.previousElementSibling)list.insertBefore(row,row.previousElementSibling);
    if(row && action==='down' && row.nextElementSibling)list.insertBefore(row.nextElementSibling,row);
    update(controls);if(button.isConnected)button.focus({preventScroll:true});
  });
}
