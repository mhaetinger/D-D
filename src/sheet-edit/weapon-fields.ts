import { escape, type Engine, type Sheet } from '../rules/model';
import {bladePact} from '../rules/passives';
import {helpAttributes} from '../app/help';

/** Mantém os IDs consumidos pelo editor anterior; somente estrutura e rótulos
 * mudam. Ajustes recolhidos conservam seus valores e continuam no formulário. */
export function weaponCalculationFields(original:Sheet,ruleWeapon:string|undefined,E:Engine,c?:Sheet):HTMLElement {
  const section=document.createElement('section');section.className='weapon-editor-calculation';
  const automatic=!!ruleWeapon&&original.calculationMode!=='manual';
  const field=(label:string,control:string)=>`<label class="weapon-editor-field"><span>${label}</span>${control}</label>`;
  const select=(id:string,values:[string,string][],value:string)=>`<select id="${id}">${values.map(([key,label])=>`<option value="${escape(key)}" ${key===value?'selected':''}>${escape(label)}</option>`).join('')}</select>`;
  const number=(id:string,value:unknown,min:number,max:number)=>`<input id="${id}" type="number" min="${min}" max="${max}" step="1" value="${Number(value || 0)}">`;
  section.innerHTML=`<div class="weapon-editor-grid">
    ${field('Cálculo',select('hbWepMode',[['auto','Automático'],['manual','Valores manuais']],automatic?'auto':'manual'))}
    ${field('Arma do catálogo',select('hbWepCatalog',[['','Personalizada'],...E.progression.weapons.map((w:Sheet)=>[w.name,w.name] as [string,string])],ruleWeapon||''))}
  </div>
  <details class="weapon-editor-adjustments"><summary title="Proficiência, habilidade, bônus mágico e ajustes do ataque.">Ajustes do cálculo</summary>
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
