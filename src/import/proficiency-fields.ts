import {escape,norm,type Engine,type Sheet} from '../rules/model';
import {isProficient} from '../rules/combat';
import {armorProficiencies} from '../rules/spellcasting';
import {reviewCard} from './review-presentation';

const parts=(value:string)=>value.split(/[,;\n]|\s+e\s+/i).map(s=>s.trim()).filter(Boolean);
const key=(value:string)=>norm(value).replace(/^idiomas? /,'').replace(/^armas? /,'');
// Só retira a opção exata. Texto não reconhecido continua na proposta, mesmo
// quando a pessoa usa a lista para acrescentar uma opção do livro.
export function toggleRecord(value:string,name:string,checked:boolean):string {
  const all=parts(value),has=all.some(p=>key(p)===key(name));
  if(checked)return has?value:[value,name].filter(Boolean).join(', ');
  return all.filter(p=>key(p)!==key(name)).join(', ');
}

export function createProficiencyFields(c:Sheet,E:Engine) {
  const element=document.createElement('div');element.className='import-proficiency-picker';
  const checks=(id:string,names:string[])=>names.map(name=>`<label class="import-check"><input type="checkbox" data-import-record="${id}" value="${escape(name)}"><span>${escape(name)}<small data-record-source></small></span></label>`).join('');
  const toolGroups=new Map<string,string[]>();
  for(const name of E.data.tools){const group=name.startsWith('Veículos')?'Veículos':name.includes('artesão:')?'Ofícios de artesão':name.startsWith('Jogo:')?'Jogos':name.startsWith('Instrumento:')?'Instrumentos musicais':'Ferramentas e kits';if(!toolGroups.has(group))toolGroups.set(group,[]);toolGroups.get(group)!.push(name);}
  // Idiomas têm um único quadro. Só o texto fora do catálogo ganha um resumo;
  // os nomes reconhecidos já estão nas marcações, sem repetir a mesma lista.
  element.innerHTML=reviewCard('Idiomas conhecidos',`<div class="import-language-options"><p data-import-language-origin class="import-field-help"></p><button type="button" data-import-race-languages>Acrescentar idiomas da raça</button><div class="import-choice-list">${checks('languages',E.data.languages)}</div><p data-import-language-extra class="import-field-help" hidden></p><details><summary>Outro idioma / corrigir texto do arquivo</summary><label>Registro de idiomas<input data-import-field="proficiencies.languages" value="${escape(c.proficiencies.languages)}"></label></details></div>`,'languages','import-language-section')+
    reviewCard('Armas, ferramentas e armaduras',`<dl class="import-grid import-proficiency-summary">${Object.entries({weapons:'Armas',tools:'Ferramentas'}).map(([id,name])=>`<div><dt>${name}</dt><dd data-import-proficiency="${id}"></dd></div>`).join('')}</dl><details data-import-proficiency-edit><summary>Escolher armas e ferramentas / editar texto livre</summary>
      <fieldset><legend>Armas</legend><p class="import-field-help">Marcadas com “Pela ficha” já vêm das classes, raça e escolhas registradas. Marque outras somente se o personagem tiver essa proficiência.</p><div class="import-choice-list">${checks('weapons',['Armas simples','Armas marciais'])}</div>${Object.entries({simpleMelee:'Simples · corpo a corpo',simpleRanged:'Simples · à distância',martialMelee:'Marciais · corpo a corpo',martialRanged:'Marciais · à distância'}).map(([kind,label])=>`<details><summary>${label}</summary><div class="import-choice-list">${checks('weapons',E.progression.weapons.filter((w:Sheet)=>w.kind===kind).map((w:Sheet)=>w.name))}</div></details>`).join('')}</fieldset>
      <details data-import-tool-options><summary>Ferramentas, jogos e instrumentos</summary><div class="import-tool-groups">${[...toolGroups].map(([name,tools])=>`<section><h4>${name}</h4><div class="import-choice-list">${checks('tools',tools)}</div></section>`).join('')}</div></details>
      <div class="import-grid">${Object.entries({weapons:'Outras armas / texto do arquivo',tools:'Outras ferramentas / texto do arquivo'}).map(([id,label])=>`<label>${label}<input data-import-field="proficiencies.${id}" value="${escape(c.proficiencies[id])}"></label>`).join('')}</div>
      <p class="import-field-help">O texto do arquivo é mantido. As listas ajudam a completar o registro; não concedem treino novo pelas regras.</p>
    </details><fieldset><legend>Armaduras</legend><div class="import-saves">${Object.entries({leve:'Leves',media:'Médias',pesada:'Pesadas',escudo:'Escudos'}).map(([id,name])=>`<label class="import-check"><input type="checkbox" data-import-armor="${id}" ${armorProficiencies(c,E).includes(id)?'checked':''}>${name}</label>`).join('')}</div><button type="button" data-import-armor-auto>Usar proficiências da classe e escolhas</button></fieldset>`,'swords','import-proficiency-section');
  const raw=(id:string)=>element.querySelector<HTMLInputElement>(`[data-import-field="proficiencies.${id}"]`)!;
  function sync(){
    const base={...c,proficiencies:{...c.proficiencies,weapons:''}},race=E.options.races[c.rules?.raceId],bg=E.options.backgrounds[c.rules?.backgroundId];
    element.querySelector('[data-import-language-origin]')!.textContent=[race?`${race.name}: ${(race.languages||[]).join(', ')}${race.extraLanguages?'; escolha mais '+race.extraLanguages:''}.`:'Confirme a raça para ver seus idiomas.',bg?.languages?`${bg.name}: ${bg.languages} idioma(s) à escolha.`:''].filter(Boolean).join(' ');
    const extra=element.querySelector<HTMLElement>('[data-import-language-extra]')!,unknown=parts(c.proficiencies.languages).filter(p=>!E.data.languages.some((name:string)=>key(p)===key(name)));
    extra.hidden=!unknown.length;extra.textContent=unknown.length?'Outros registros do arquivo: '+unknown.join(', '):'';
    element.querySelector<HTMLButtonElement>('[data-import-race-languages]')!.disabled=!race?.languages?.length;
    for(const el of element.querySelectorAll<HTMLInputElement>('[data-import-record]')){
      const id=el.dataset.importRecord!,w=id==='weapons'?E.progression.weapons.find((w:Sheet)=>w.name===el.value):null;
      const category=id==='weapons'?({'simples':'simple','marciais':'martial'} as Record<string,string>)[key(el.value)]:null;
      const computed=!!w?isProficient(base,{},w,E):!!category&&E.progression.weapons.filter((w:Sheet)=>w.kind.startsWith(category)).every((w:Sheet)=>isProficient(base,{},w,E));
      const covered=!!w&&isProficient(c,{},w,E);
      const grouped=!!w&&parts(c.proficiencies.weapons).some(p=>['simples','marciais'].includes(key(p))&&w.kind.startsWith(key(p)==='simples'?'simple':'martial'));
      el.checked=computed||covered||parts(c.proficiencies[id]).some(p=>key(p)===key(el.value));el.disabled=computed||grouped;
      el.parentElement!.querySelector('[data-record-source]')!.textContent=computed?' · Pela ficha':grouped?' · Pelo grupo marcado':'';
    }
  }
  element.addEventListener('change',e=>{
    const input=e.target as HTMLInputElement;if(!input.dataset.importRecord)return;
    const id=input.dataset.importRecord;raw(id).value=toggleRecord(c.proficiencies[id],input.value,input.checked);raw(id).dispatchEvent(new Event('input',{bubbles:true}));
  });
  element.addEventListener('input',e=>{const input=e.target as HTMLInputElement,id=input.dataset.importField?.split('.')[1];if(id){c.proficiencies[id]=input.value;sync();}});
  element.querySelector('[data-import-race-languages]')!.addEventListener('click',()=>{let text=c.proficiencies.languages;for(const name of E.options.races[c.rules?.raceId]?.languages||[])text=toggleRecord(text,name,true);raw('languages').value=text;raw('languages').dispatchEvent(new Event('input',{bubbles:true}));});
  sync();return {element,sync};
}
