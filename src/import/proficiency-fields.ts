import {escape,norm,type Engine,type Sheet} from '../rules/model';
import {isProficient} from '../rules/combat';

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
  element.innerHTML=`<fieldset class="import-language-options"><legend>Idiomas que o personagem conhece</legend><p data-import-language-origin class="import-field-help"></p><button type="button" data-import-race-languages>Acrescentar idiomas da raça</button><div class="import-choice-list">${checks('languages',E.data.languages)}</div></fieldset>
    <details data-import-proficiency-edit><summary>Escolher armas e ferramentas / editar texto livre</summary>
      <fieldset><legend>Armas</legend><p class="import-field-help">Marcadas com “Pela ficha” já vêm das classes, raça e escolhas registradas. Marque outras somente se o personagem tiver essa proficiência.</p><div class="import-choice-list">${checks('weapons',['Armas simples','Armas marciais'])}</div>${Object.entries({simpleMelee:'Simples · corpo a corpo',simpleRanged:'Simples · à distância',martialMelee:'Marciais · corpo a corpo',martialRanged:'Marciais · à distância'}).map(([kind,label])=>`<details><summary>${label}</summary><div class="import-choice-list">${checks('weapons',E.progression.weapons.filter((w:Sheet)=>w.kind===kind).map((w:Sheet)=>w.name))}</div></details>`).join('')}</fieldset>
      <details><summary>Ferramentas, jogos e instrumentos</summary><div class="import-choice-list">${checks('tools',E.data.tools)}</div></details>
      <div class="import-grid">${Object.entries({weapons:'Outras armas / texto do arquivo',tools:'Outras ferramentas / texto do arquivo',languages:'Outros idiomas / texto do arquivo'}).map(([id,label])=>`<label>${label}<input data-import-field="proficiencies.${id}" value="${escape(c.proficiencies[id])}"></label>`).join('')}</div>
      <p class="import-field-help">O texto do arquivo é mantido. As listas ajudam a completar o registro; não concedem treino ou idiomas novos pelas regras.</p>
    </details>`;
  const raw=(id:string)=>element.querySelector<HTMLInputElement>(`[data-import-field="proficiencies.${id}"]`)!;
  function sync(){
    const base={...c,proficiencies:{...c.proficiencies,weapons:''}},race=E.options.races[c.rules?.raceId],bg=E.options.backgrounds[c.rules?.backgroundId];
    element.querySelector('[data-import-language-origin]')!.textContent=[race?`${race.name}: ${(race.languages||[]).join(', ')}${race.extraLanguages?'; escolha mais '+race.extraLanguages:''}.`:'Confirme a raça para ver seus idiomas.',bg?.languages?`${bg.name}: ${bg.languages} idioma(s) à escolha.`:''].filter(Boolean).join(' ');
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
