import {escape,type Engine,type Sheet} from '../rules/model';
import {matchOption} from '../import/character-review';
import {fieldOverride,validateSheet} from './model';
import {canEditSheet} from './access';
import {armorProficiencies} from '../rules/spellcasting';

export type OriginField='race'|'background';
/** A ficha pode ter totais importados ou adaptados sem proveniência dos bônus.
 * Trocar um vínculo não autoriza reconstruir esses números pelo criador. */
export function proposeOriginChange(original:Sheet,path:OriginField,text:string,E:Engine){
  if(!canEditSheet(original))throw new Error('A edição desta ficha está bloqueada pelo mestre.');
  if(!text.trim()||text.length>16000)throw new Error('Informe um nome para esta origem.');
  const next=structuredClone(original),key=path==='race'?'raceId':'backgroundId',catalog=path==='race'?E.options.races:E.options.backgrounds;
  const before=catalog[original.rules?.[key]],id=matchOption(text,catalog)||'',after=catalog[id];
  next.rules ||= {history:[]};next[path]=text;next.rules[key]=id;
  const changes:string[]=[],review:string[]=[];
  if(id!==original.rules?.[key]){
    changes.push(`${original[path]||'Origem livre'} → ${text}.`);
    const oldTraits=path==='race'?before?.traits:[before?.feature],newTraits=path==='race'?after?.traits:[after?.feature];
    if(oldTraits?.filter(Boolean).length)changes.push('Saem os vínculos dos traços: '+oldTraits.filter(Boolean).join('; ')+'.');
    if(newTraits?.filter(Boolean).length)changes.push('Entram os vínculos dos traços: '+newTraits.filter(Boolean).join('; ')+'.');
    // As escolhas aposentadas continuam no evento, mas fora de answers para
    // não conceder talentos raciais ou truques de uma origem anterior.
    for(const event of next.rules.history||[]){
      const retired=Object.fromEntries(Object.entries(event.answers||{}).filter(([k])=>path==='race'?/^(race|racial)/.test(k):/^background/.test(k)));
      if(Object.keys(retired).length){event.retiredOrigins ||= [];event.retiredOrigins.push({kind:path,id:original.rules?.[key]||'',answers:retired});for(const k of Object.keys(retired))delete event.answers[k];}
    }
    if(path==='race'){
      next.speed=E.movementSpeed(original);fieldOverride(next,'speed');
      next.armorProficiencies=armorProficiencies(original,E);
      const spells=next.spells.filter((s:Sheet)=>before&&[before.name,'Truque racial'].includes(s.extraSource));
      for(const s of spells){s.extraSource='Adaptação · origem anterior: '+original.race;s.automatic=false;}
      if(spells.length)changes.push('Magias da origem anterior ficam identificadas como adaptações, com seus usos gastos preservados: '+spells.map((s:Sheet)=>s.name).join(', ')+'.');
      review.push('Os totais de atributos, PV, deslocamento e tamanho são mantidos. Confira os bônus da nova raça antes de usar a ficha.');
      if(after){review.push('Bônus raciais do livro: '+Object.entries(after.bonus||{}).map(([k,v])=>`${E.data.abilities[k]} +${v}`).join(', ')+(after.abilityChoices?`; mais ${after.abilityChoices} escolha(s) de atributo`:'')+'.');
        if(after.dragonChoice||after.cantrip||after.skillChoices||after.toolChoice||after.feat)review.push('A nova raça tem escolhas próprias. Confira ancestralidade, truques, perícias, ferramentas ou talento conforme seus traços; não são escolhidos automaticamente.');}
    }
    review.push('Perícias, especializações, idiomas, ferramentas, equipamento e magias já anotados são mantidos como ajustes manuais. Revise os concedidos pela origem anterior e os que a nova origem permite.');
    next.rules.originReview ||= {};next.rules.originReview[path]={from:original[path],to:text,manualTotals:true};
  }
  return {next:validateSheet(next),changes,review};
}

export function originChangeControls(original:Sheet,path:OriginField,text:string,E:Engine,apply:(next:Sheet)=>void,cancel:()=>void){
  const {next,changes,review}=proposeOriginChange(original,path,text,E),element=document.createElement('section');element.className='sheet-inline-editor origin-change';element.dataset.sheetOriginEditor='';
  element.innerHTML=`<h3>Conferir troca de ${path==='race'?'raça / espécie':'antecedente'}</h3><ul>${changes.map(s=>`<li>${escape(s)}</li>`).join('')}</ul>${review.length?`<div class="origin-manual-review"><h4>Ajustes para conferir</h4>${review.map(s=>`<p>${escape(s)}</p>`).join('')}<label><input type="checkbox" data-origin-ack>Conferi os ajustes e aceito manter esses valores manualmente.</label></div>`:'<p>Atualiza o nome e o vínculo, mantendo os demais dados.</p>'}<p data-origin-error role="alert"></p><div class="origin-actions"><button type="button" data-origin-cancel>Cancelar</button><button type="button" data-origin-apply ${review.length?'disabled':''}>Aplicar troca</button></div>`;
  element.querySelector('[data-origin-ack]')?.addEventListener('change',e=>{element.querySelector<HTMLButtonElement>('[data-origin-apply]')!.disabled=!(e.target as HTMLInputElement).checked;});
  element.querySelector('[data-origin-cancel]')!.addEventListener('click',cancel);
  element.querySelector('[data-origin-apply]')!.addEventListener('click',()=>{if(review.length&&!element.querySelector<HTMLInputElement>('[data-origin-ack]')!.checked)return;try{apply(next);}catch(e){element.querySelector('[data-origin-error]')!.textContent=(e as Error).message;}});
  return element;
}
