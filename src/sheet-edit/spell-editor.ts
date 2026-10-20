import {type Sheet} from '../rules/model';
import {validateImport} from '../import/character-review';
import {createSpellFields} from './spell-fields';
import {sheetStore} from '../storage/character-store';
import {mountSheetPanel,closeSheetPanel} from './panels';
import {canEditSheet} from './access';
import {commitSheetEdit} from './ui';
import {fieldOverride} from './model';

const host=window as any;
/** Catálogo e adaptações compartilham origem, recursos e controles da ficha.
 * Só substitui a entrada após validar a proposta completa; não toca notas. */
export async function openSpellEditor(index:number|null=null):Promise<void> {
  const c=host.getChar(),E=host.CharacterEngine,store=sheetStore;
  if(!c||!canEditSheet(c)){host.showToast('A edição desta ficha está bloqueada pelo mestre.');return;}
  if(document.querySelector('[data-sheet-spell-editor]')){host.showToast('Conclua ou feche a edição de magia já aberta.');return;}
  host.setTab('spells');
  const existing=index===null?null:c.spells[index];if(index!==null&&!existing)return;
  host.hideBookTooltip();
  const before=JSON.stringify(existing),controls=document.createElement('form');controls.className='rule-context import-review sheet-inline-editor';
  controls.dataset.spellEditor='';controls.dataset.sheetSpellEditor='';
  const fields=createSpellFields(c,existing,E);controls.append(fields.element);
  controls.insertAdjacentHTML('beforeend',`<p data-spell-error role="alert"></p><div class="flex flex-wrap justify-end gap-2">${existing?'<button type="button" data-spell-delete>Excluir magia</button>':''}<button type="button" data-spell-cancel>Fechar</button><button type="submit" class="t-btn-primary">Salvar magia</button></div>`);
  const error=controls.querySelector<HTMLElement>('[data-spell-error]')!;
  controls.querySelector('[data-spell-cancel]')!.addEventListener('click',()=>closeSheetPanel('spell'));
  controls.querySelector('[data-spell-delete]')?.addEventListener('click',async()=>{if(!canEditSheet(c)||c!==host.getChar()||store!==sheetStore)return;closeSheetPanel('spell');await host.deleteSheetEntry('spell',index);});
  const validate=(e:SubmitEvent)=>{
    e.preventDefault();
    try {
      if(!canEditSheet(c)||c!==host.getChar()||store!==sheetStore)throw new Error('A ficha ou a permissão mudou. Nenhuma magia foi alterada.');
      if(existing&&JSON.stringify(c.spells[index!])!==before)throw new Error('Esta magia mudou durante a edição. Feche e reabra seus ajustes.');
      const s=fields.read();
      const copy=structuredClone(c);if(index===null)copy.spells.push(s);else copy.spells[index]=s;
      fieldOverride(copy,'preparation');validateImport(copy,E);
      commitSheetEdit(c,copy,`${existing?'Editou':'Adicionou'} magia: ${s.name}`);closeSheetPanel('spell');
    }catch(err){e.preventDefault();error.textContent=(err as Error).message;error.scrollIntoView({block:'nearest'});}
  };
  controls.addEventListener('submit',validate);
  mountSheetPanel('spell',controls,existing?`[data-spell-card="${index}"]`:'[data-sheet-spell-tools]');
  controls.querySelector<HTMLInputElement>('input:not([readonly])')?.focus({preventScroll:true});

}

export function setupSpellEditor():void {host.openSpellEditor=openSpellEditor;}
