import { arcaneWardPoints, DAMAGE_SOURCES, DAMAGE_TYPES, fiendResistanceType, previewTypedDamage, typedDamageSummary, type DamagePacket } from './damage';
import { active, escape, type Engine, type Sheet } from './model';

const help=(name:string,text:string)=>`tabindex="0" data-rule-tooltip="${escape(JSON.stringify({name,text}))}"`;
function damageRow() {
  return `<div class="rule-damage-part t-inset" data-damage-part>
  <div class="rule-damage-fields"><label ${help('Tipo de dano','Some os dados e modificadores já rolados deste tipo, incluindo o crítico e o resultado de resistências/reações resolvidos na mesa. Cada tipo aparece uma vez nesta ocorrência. Outro ataque deve ser aplicado separadamente.')}>Tipo <select data-damage-type aria-label="Tipo de dano"><option value="">Escolha...</option>${DAMAGE_TYPES.map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label><label>Valor <input type="number" min="1" max="1000000" step="1" data-damage-amount aria-label="Valor do dano por tipo"></label></div>
  <div class="rule-controls"><button type="button" data-damage-row-action="up" aria-label="Mover tipo de dano para cima">↑</button><button type="button" data-damage-row-action="down" aria-label="Mover tipo de dano para baixo">↓</button><button type="button" data-damage-row-action="remove" aria-label="Remover tipo de dano">Remover</button>
  <details data-damage-adjustments><summary>Ajustes da mesa</summary><div class="rule-damage-fields"><label ${help('Defesa para esta ocorrência','Automática reconhece as fontes verificadas da ficha. As demais opções substituem resistência/imunidade somente neste dano: use para um item, magia recebida ou decisão do Mestre ainda não representados. Não ativa recursos nem grava uma defesa permanente.')}>Defesa <select data-damage-defense><option value="auto">Automática da ficha</option><option value="normal">Sem resistência/imunidade · mesa</option><option value="resistance">Resistência · mesa</option><option value="immunity">Imunidade · mesa</option></select></label><label ${help('Redução adicional','Valor definido pela mesa que ainda não entrou no dano. É subtraído após a Proteção Arcana e antes de resistência/vulnerabilidade, com mínimo zero. Não repita uma redução já aplicada aos dados.')}>Redução adicional <input type="number" min="0" max="1000000" step="1" value="0" data-damage-reduction></label></div><label class="rule-check" ${help('Vulnerabilidade','Dobra o dano depois de aplicar resistência e arredondar para baixo. Não cancela a resistência antes do arredondamento. A imunidade continua impedindo o dano.')}> <input type="checkbox" data-damage-vulnerable> Vulnerabilidade · mesa</label></details></div>
  </div>`;
}
export function damageControls(c:Sheet) {
  const shape=active(c,'druida:wildShape');
  const resolvedNote=arcaneWardPoints(c)>0?'Com Proteção Arcana, resolva primeiro a absorção e depois as defesas do excedente. Informe proteção absorvida + dano final às outras reservas; o modo por tipo faz esse cálculo.':'Informe o dano final, após resistências e reduções da mesa. A ficha desconta temporários e forma.';
  return `<details class="rule-context" data-rule-disclosure="healthDamage" data-damage-controls><summary>Dano detalhado</summary>
  <label ${help('Aplicação do dano','Já resolvido: a mesa aplicou os modificadores; a ficha desconta suas reservas. Por tipo: calcula as fontes reconhecidas, mostra a prévia e usa uma única ocorrência para concentração e morte. Não use os dois modos para o mesmo dano.')}>Como aplicar <select data-damage-mode><option value="final">Dano já resolvido pela mesa</option><option value="typed" ${shape?'disabled':''}>Calcular por tipo · 2014</option></select></label>
  <div data-damage-final class="rule-controls"><label>Dano <input type="number" min="1" step="1" data-health-damage aria-label="Dano recebido"></label></div>
  <div data-damage-typed hidden><label ${help('Origem do dano','A origem determina se Proteção contra Lâminas, Resistência à Magia e outras defesas condicionais se aplicam. Ataque de arma pode ser corpo a corpo ou à distância. Magia não é ataque de arma. Na dúvida, resolva com o Mestre ou use o modo já resolvido.')}>Origem <select data-damage-source><option value="">Escolha...</option>${DAMAGE_SOURCES.map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label><label class="rule-check" data-damage-silvered-label hidden ${help('Arma de prata','Armas de prata ignoram especificamente a Resistência Demoníaca do Corruptor. Não ignoram todas as resistências. Só se aplica à origem ataque de arma.')}> <input type="checkbox" data-damage-silvered> Arma de prata</label>
  <div data-damage-parts>${damageRow()}</div><button type="button" data-damage-row-action="add">Adicionar outro tipo</button>
  <p data-damage-order-note hidden ${help('Uma ocorrência, vários tipos','Um ataque pode causar, por exemplo, cortante e fogo: informe ambos antes de aplicar. A Proteção Arcana absorve na ordem dos tipos acima, escolhida pela mesa; use as setas para mudar. Concentração e falhas de morte usam o total recebido uma única vez.')}>A Proteção Arcana absorve os tipos na ordem acima; a mesa pode mudar essa ordem pelas setas.</p>
  <output data-damage-preview role="status" aria-live="polite">Informe origem, tipo e valor para conferir o cálculo.</output></div>
  <div class="rule-controls"><label class="rule-check" ${help('Acerto crítico recebido','O valor informado já deve conter os dados extras do crítico. Esta marca não dobra o dano; a 0 PV, faz o dano recebido causar duas falhas contra a morte em vez de uma.')}> <input type="checkbox" data-health-critical> Acerto crítico</label><button type="button" data-health-action="damage">Aplicar dano</button></div>
  <p class="t-text-muted" data-damage-final-note>${resolvedNote}</p>${shape?'<p>Forma Selvagem: resolva o dano e o excesso na mesa. Resistências e estatísticas da besta ainda não estão integradas.</p>':''}</details>`;
}
export function readDamagePacket(controls:HTMLElement):DamagePacket {
  return {source:controls.querySelector<HTMLSelectElement>('[data-damage-source]')!.value as DamagePacket['source'],
    critical:controls.querySelector<HTMLInputElement>('[data-health-critical]')!.checked,
    silvered:controls.querySelector<HTMLInputElement>('[data-damage-silvered]')!.checked,
    parts:[...controls.querySelectorAll<HTMLElement>('[data-damage-part]')].map(row=>({
      type:row.querySelector<HTMLSelectElement>('[data-damage-type]')!.value as DamagePacket['parts'][number]['type'],
      amount:Number(row.querySelector<HTMLInputElement>('[data-damage-amount]')!.value),
      defense:row.querySelector<HTMLSelectElement>('[data-damage-defense]')!.value as DamagePacket['parts'][number]['defense'],
      reduction:Number(row.querySelector<HTMLInputElement>('[data-damage-reduction]')!.value),
      vulnerable:row.querySelector<HTMLInputElement>('[data-damage-vulnerable]')!.checked,
    }))};
}
/** Altera apenas os campos da ocorrência: selecionar não reconstrói a ficha,
 * não troca seus nós nem grava histórico. A mutação dos PV fica no envio. */
export function setupDamageUI(E:Engine) {
  const host=window as any;
  const update=(controls:HTMLElement)=>{
    const typed=controls.querySelector<HTMLSelectElement>('[data-damage-mode]')!.value==='typed';
    controls.querySelector<HTMLElement>('[data-damage-final]')!.hidden=typed;
    controls.querySelector<HTMLElement>('[data-damage-final-note]')!.hidden=typed;
    controls.querySelector<HTMLElement>('[data-damage-typed]')!.hidden=!typed;
    const submit=controls.querySelector<HTMLButtonElement>('[data-health-action="damage"]')!;
    submit.disabled=false;if(!typed)return;
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
    const c=host.getChar();
    silvered.disabled=!['weapon','magicWeapon'].includes(source) || !fiendResistanceType(c,E);if(silvered.disabled)silvered.checked=false;
    controls.querySelector<HTMLElement>('[data-damage-silvered-label]')!.hidden=silvered.disabled;
    controls.querySelector<HTMLElement>('[data-damage-order-note]')!.hidden=rows.length<2 || !(arcaneWardPoints(c)>0);
    const target=controls.querySelector<HTMLOutputElement>('[data-damage-preview]')!;
    try {
      const plan=previewTypedDamage(c,readDamagePacket(controls),E);
      target.textContent=`${typedDamageSummary(plan)}. Total recebido: ${plan.received} · PV temporários e atuais serão descontados ao aplicar.${arcaneWardPoints(c)>0?' Proteção Arcana absorve antes das defesas do personagem.':''}`;
    }catch(error){target.textContent=(error as Error).message;submit.disabled=true;}
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
