import { escape, type Engine, type Sheet } from '../rules/model';
import {parseDiceFormula} from '../rules/dice-formula';
import {bladePact} from '../rules/passives';
import {helpAttributes} from '../app/help';

/** Mantém os IDs consumidos pelo editor anterior; somente estrutura e rótulos
 * mudam. Ajustes recolhidos conservam seus valores e continuam no formulário. */
export function weaponCalculationFields(original:Sheet,ruleWeapon:string|undefined,E:Engine,c?:Sheet):HTMLElement {
  const section=document.createElement('section');section.className='weapon-editor-calculation';
  const automatic=!!ruleWeapon&&original.calculationMode!=='manual';
  const explanations:Record<string,string>={'Proficiência':'Treino com esta arma: soma o bônus de proficiência ao ataque. Detectar pela ficha considera classes, raça e escolhas; não é o bônus total de ataque.','Bônus mágico':'Bônus da própria arma mágica, como +1. O modo automático soma ao ataque e ao dano. Não copie aqui o bônus total escrito no ataque.','Habilidade':'Força ou Destreza usada no ataque e no dano. Automática segue o tipo e as propriedades da arma.','Modo de ataque':'Arremessar usa as regras de arremesso da arma. Normal mantém o uso habitual.','Ajuste de ataque':'Bônus adicional combinado na mesa. Não repita atributo, proficiência ou bônus mágico já incluídos.','Ajuste de dano':'Bônus adicional no dano. Não repita os modificadores que o cálculo automático já soma.'};
  const field=(label:string,control:string)=>`<label class="weapon-editor-field" ${helpAttributes(label,explanations[label]||'')}><span>${label}</span>${control}</label>`;
  const select=(id:string,values:[string,string][],value:string)=>`<select id="${id}">${values.map(([key,label])=>`<option value="${escape(key)}" ${key===value?'selected':''}>${escape(label)}</option>`).join('')}</select>`;
  const number=(id:string,value:unknown,min:number,max:number)=>`<input id="${id}" type="number" min="${min}" max="${max}" step="1" value="${Number(value || 0)}">`;
  section.innerHTML=`<div class="weapon-editor-grid">
    ${field('Cálculo de ataque e dano',select('hbWepMode',[['auto','Calcular pela ficha'],['manual','Manter valores informados']],automatic?'auto':'manual'))}
    ${field('Arma do catálogo',select('hbWepCatalog',[['','Personalizada'],...E.progression.weapons.map((w:Sheet)=>[w.name,w.name] as [string,string])],ruleWeapon||''))}
  </div>
  <details class="weapon-editor-adjustments"><summary ${helpAttributes('Ajustes do cálculo','Confira proficiência com a arma, habilidade, bônus mágico e ajustes. Eles afetam o cálculo automático; valores manuais continuam como você informou.')}>Ajustes do cálculo</summary><p class="weapon-editor-hint">Opções avançadas do modo automático. Só altere se uma característica ou adaptação mudar o cálculo. No modo manual, use os totais escritos abaixo.</p>
    <div class="weapon-editor-grid">
      ${field('Proficiência',select('hbWepProf',[['auto','Detectar pela ficha'],['yes','Proficiente · manual'],['no','Não proficiente · manual']],typeof original.proficient!=='boolean'?'auto':original.proficient?'yes':'no'))}
      ${field('Bônus mágico',number('hbWepMagic',original.magicBonus,-10,10))}
      ${field('Habilidade',select('hbWepAbility',[['auto','Automática'],['str','Força · ajuste'],['dex','Destreza · ajuste']],original.abilityOverride||'auto'))}
      ${field('Modo de ataque',select('hbWepAttackMode',[['normal','Normal'],['thrown','Arremessar']],original.attackMode||'normal'))}
      ${field('Ajuste de ataque',number('hbWepAttackAdjust',original.attackAdjustment,-100,100))}
      ${field('Ajuste de dano',number('hbWepDamageAdjust',original.damageAdjustment,-100,100))}
    </div>
    <div class="weapon-editor-checks">
      ${c && bladePact(c,E)?`<label ${helpAttributes('Arma do pacto','Identifica a arma vinculada ao Pacto da Lâmina. Marcar transfere o vínculo desta ficha para esta arma. Sorvedor de Vida exige bruxo 12 e a invocação escolhida; seu dano necrótico entra só no cálculo automático. Valores manuais são preservados.')}><input id="hbWepPact" type="checkbox" ${original.pactWeapon===true?'checked':''}><span>Arma do pacto</span></label>`:''}
      <label><input id="hbWepDuel" type="checkbox" ${original.duelingEligible?'checked':''}><span>Única arma corpo a corpo na mão (Duelismo)</span></label>
      <label><input id="hbWepOffhand" type="checkbox" ${original.offHand?'checked':''}><span>Ataque bônus com segunda arma</span></label>
    </div>
  </details>`;
  return section;
}

/** Editor comum da ficha e da proposta de importação. Não salva, não acessa
 * a ficha global e não usa os dados da bandeja. Cada instância tem IDs próprios;
 * a ponte antiga conserva os IDs hb* somente no painel da ficha. */
export function createWeaponFields(c:Sheet,existing:Sheet|null,E:Engine,options:{legacyIds?:boolean;description?:string}={}) {
  const element=document.createElement('section');element.className='weapon-fields';
  const prefix=options.legacyIds?'':'weapon-'+crypto.randomUUID()+'-';
  const weapon=existing?E.weaponStats(c,existing):{name:'Nova Arma / Adaptação',bonus:'+0',damage:'1d6',dmgTypeLabel:'Customizado',notes:'',description:''};
  const original=existing?{magicBonus:weapon.magicBonus,...structuredClone(existing)}:{};
  const id=(name:string)=>prefix+name;
  const input=(name:string,label:string,value:unknown,extra='')=>`<label class="weapon-editor-field"><span>${label}</span><input id="${id(name)}" value="${escape(value)}" ${extra}></label>`;
  element.innerHTML=`${input('hbWepName','Nome',weapon.name,'required maxlength="120"')}
    <div data-weapon-calculation></div><p class="weapon-editor-hint" data-weapon-hint></p>
    <div class="weapon-editor-grid">${input('hbWepBonus','Bônus de ataque (se houver)',weapon.bonus,'pattern="[+\\-]?[0-9]+" placeholder="Ex.: +6; pode ficar vazio"')}${input('hbWepDamageMod','Modificador de dano',0,'type="number" required min="-10000" max="10000" step="1"')}</div>
    <fieldset class="weapon-damage-builder"><legend>Dados de dano</legend>
      <div class="weapon-editor-dice">${[4,6,8,10,12,20,100].map(sides=>`<button type="button" id="${id('hbDamageDie'+sides)}" data-weapon-die="${sides}" aria-label="Adicionar d${sides} ao dano" class="t-inset font-bold">+d${sides}</button>`).join('')}</div>
      <div class="weapon-editor-dice-heading"><span>Selecionados</span><button type="button" data-weapon-clear class="underline">Limpar dados</button></div>
      <div id="${id('hbWeaponDamageDice')}" class="weapon-selected-dice" role="group" aria-label="Dados selecionados para o dano">${[4,6,8,10,12,20,100].map(sides=>`<button type="button" data-weapon-remove-die="${sides}" aria-label="Remover um d${sides}" class="t-inset font-bold" hidden></button>`).join('')}<span data-weapon-no-dice>Nenhum dado</span></div>
      <div class="weapon-editor-formula"><span>Dano</span><output id="${id('hbWeaponDamagePreview')}" aria-label="Dano montado" aria-live="polite"></output></div><input id="${id('hbWepDmg')}" type="hidden">
    </fieldset>
    ${input('hbWepType','Tipo de dano',weapon.dmgTypeLabel||'','placeholder="Cortante, fogo…"')}
    ${input('hbWepNotes','Propriedades / resumo',weapon.notes||'')}
    <label class="weapon-editor-field"><span>Descrição ao passar o mouse ou tocar no nome</span><textarea id="${id('hbWepDescription')}" rows="3" maxlength="8000">${escape(weapon.description??options.description??weapon.notes??'')}</textarea></label>
    <p data-weapon-error role="alert" hidden></p>`;
  const calculation=weaponCalculationFields(original,weapon.ruleWeapon,E,c);
  calculation.querySelectorAll<HTMLElement>('[id]').forEach(el=>el.id=id(el.id));
  element.querySelector('[data-weapon-calculation]')!.replaceWith(calculation);
  for(const el of element.querySelectorAll<HTMLElement>('input[id],select[id],textarea[id]'))el.dataset.weaponField=el.id.slice(prefix.length);
  const field=(name:string)=>element.querySelector<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>(`[data-weapon-field="${name}"]`)!;
  const error=element.querySelector<HTMLElement>('[data-weapon-error]')!;
  let counts:Record<number,number>={},formula='',changed=false;
  const fail=(name:string,message:string):never=>{const err=new Error(message) as Error&{field:HTMLElement};err.field=field(name);throw err;};
  function renderDamage(modifierChanged=false){
    if(modifierChanged)changed=true;
    const modifier=Number(field('hbWepDamageMod').value),valid=field('hbWepDamageMod').value.trim()!==''&&Number.isSafeInteger(modifier)&&Math.abs(modifier)<=10000;
    const entries=Object.entries(counts).filter(([,n])=>n>0),dice=entries.map(([sides,n])=>`${n}d${sides}`).join('+');
    field('hbWepDmg').value=!valid?'':!changed?formula:dice?dice+(modifier>0?'+'+modifier:modifier<0?modifier:''):String(modifier);
    element.querySelector('output')!.textContent=valid?parseDiceFormula(field('hbWepDmg').value)?.formula||'Escolha os dados do dano':'Informe um modificador inteiro';
    for(const btn of element.querySelectorAll<HTMLButtonElement>('[data-weapon-remove-die]')){const sides=Number(btn.dataset.weaponRemoveDie);btn.hidden=!counts[sides];btn.textContent=`${counts[sides]||0}d${sides} −`;}
    (element.querySelector('[data-weapon-no-dice]') as HTMLElement).hidden=entries.length>0;
  }
  function setDamage(value:string){const parsed=parseDiceFormula(value);counts={...(parsed?.counts||{})};formula=value;changed=false;field('hbWepDamageMod').value=String(parsed?.modifier??0);renderDamage();}
  function sync(){
    const automatic=field('hbWepMode').value==='auto';
    element.querySelector('[data-weapon-hint]')!.textContent=automatic?'Ataque e dano calculados pela ficha. Escolha a arma do catálogo.':'Valores manuais: monte o dano e informe o bônus de ataque, se houver. Efeitos com resistência podem ficar sem bônus.';
    for(const name of ['hbWepBonus','hbWepDamageMod'])field(name).disabled=automatic;
    for(const btn of element.querySelectorAll<HTMLButtonElement>('[data-weapon-die],[data-weapon-remove-die],[data-weapon-clear]'))btn.disabled=automatic;
  }
  function changeDie(sides:number,delta:number){
    if(field('hbWepMode').value==='auto'||![4,6,8,10,12,20,100].includes(sides)||![1,-1].includes(delta))return;
    if(delta>0&&Object.values(counts).reduce((a,b)=>a+b,0)>=100){error.hidden=false;error.textContent='Use no máximo 100 dados nesta montagem.';return;}
    counts[sides]=Math.max(0,(counts[sides]||0)+delta);changed=true;renderDamage();element.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function clearDice(){if(field('hbWepMode').value==='auto')return;counts={};changed=true;renderDamage();element.dispatchEvent(new Event('input',{bubbles:true}));}
  element.addEventListener('click',e=>{const target=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!target)return;if(target.dataset.weaponDie)changeDie(Number(target.dataset.weaponDie),1);if(target.dataset.weaponRemoveDie)changeDie(Number(target.dataset.weaponRemoveDie),-1);if(target.hasAttribute('data-weapon-clear'))clearDice();});
  element.addEventListener('input',e=>{error.hidden=true;if(e.target===field('hbWepDamageMod'))renderDamage(true);});
  element.addEventListener('change',sync);
  function read(partial=false):Sheet {
    const name=field('hbWepName').value.trim(),bonus=field('hbWepBonus').value.trim(),damage=parseDiceFormula(field('hbWepDmg').value),mode=field('hbWepMode').value;
    if(!partial&&!name)fail('hbWepName','Informe o nome do ataque.');
    if(!partial&&bonus!==''&&(!/^[+-]?\d+$/.test(bonus)||!Number.isSafeInteger(Number(bonus))||Math.abs(Number(bonus))>1000))fail('hbWepBonus','Use um bônus inteiro entre -1000 e +1000, ou deixe vazio se não houver.');
    if(!partial&&!damage)fail('hbWepDamageMod','Selecione os dados e informe um modificador inteiro entre -10000 e +10000.');
    const numeric=['hbWepMagic','hbWepAttackAdjust','hbWepDamageAdjust'];
    const invalidNumber=numeric.find(key=>{const f=field(key) as HTMLInputElement,n=Number(f.value);return !Number.isInteger(n)||n<Number(f.min)||n>Number(f.max);});
    if(!partial&&invalidNumber){const f=field(invalidNumber) as HTMLInputElement;fail(invalidNumber,`Informe um ajuste inteiro entre ${f.min} e ${f.max}.`);}
    const updated:Sheet={...weapon,name,bonus:bonus===''?'':/^[+-]?\d+$/.test(bonus)?(Number(bonus)>=0?'+':'')+Number(bonus):bonus,damage:damage?.formula||field('hbWepDmg').value,
      dmgTypeLabel:field('hbWepType').value.trim(),notes:field('hbWepNotes').value.trim(),description:field('hbWepDescription').value.trim(),
      calculationMode:mode,ruleWeapon:field('hbWepCatalog').value||undefined,proficient:field('hbWepProf').value==='auto'?undefined:field('hbWepProf').value==='yes',
      magicBonus:Number(field('hbWepMagic').value),abilityOverride:field('hbWepAbility').value,attackMode:field('hbWepAttackMode').value,
      attackAdjustment:Number(field('hbWepAttackAdjust').value),damageAdjustment:Number(field('hbWepDamageAdjust').value),duelingEligible:(field('hbWepDuel') as HTMLInputElement).checked,offHand:(field('hbWepOffhand') as HTMLInputElement).checked};
    if(!partial&&mode==='auto'&&!updated.ruleWeapon)fail('hbWepCatalog','Escolha uma arma do catálogo ou mantenha os valores manuais.');
    if(mode==='auto'&&updated.bonus===''&&updated.ruleWeapon)updated.bonus=E.weaponStats(c,updated).bonus;
    const pact=field('hbWepPact') as HTMLInputElement|null;if(pact)updated.pactWeapon=pact.checked;
    return updated;
  }
  setDamage(weapon.damage);sync();
  return {element,field,read,sync,setDamage,changeDie,clearDice,renderDamage};
}
