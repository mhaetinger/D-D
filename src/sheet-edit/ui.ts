import {escape,type Sheet} from '../rules/model';
import {sheetStore} from '../storage/character-store';
import {currentWorkspaceKey} from '../storage/account-scope';
import {canEditSheet,setSheetAuthorityProvider} from './access';
import {editSheetField,changeClassList,blankCharacter} from './model';
import {canSaveSheetPanel} from './panels';
import {armorProficiencies} from '../rules/spellcasting';

const host=globalThis as any;
let rendering=0;
export function beginSheetRender():void {rendering++;}
export function endSheetRender():void {rendering=Math.max(0,rendering-1);}
const visiblePools=new Set<string>();
const poolKey=(c:Sheet,key:string)=>currentWorkspaceKey()+':'+c.id+':'+key;
export const poolEditorVisible=(c:Sheet,key:string)=>visiblePools.has(poolKey(c,key));
type FieldOptions={min?:number;max?:number;step?:string;placeholder?:string;wide?:boolean};
function attributes(c:Sheet,path:string,label:string) {
  return `data-sheet-field="${escape(path)}" data-sheet-owner="${escape(c.id)}" data-sheet-scope="${escape(currentWorkspaceKey())}" aria-label="${escape(label)}" title="${escape(label)} · ajuste direto na ficha${path.startsWith('customSkillBonuses.')?'; vazio usa o cálculo automático':''}" ${canEditSheet(c)?'':'disabled'}`;
}
export function sheetInput(c:Sheet,path:string,value:unknown,label:string,type='text',o:FieldOptions={}):string {
  return `<input ${attributes(c,path,label)} class="sheet-field ${type==='number'?'sheet-number':'sheet-text'} ${o.wide?'sheet-wide':''}" type="${type}" value="${escape(value??'')}" data-sheet-saved="${escape(value??'')}" ${o.min!==undefined?`min="${o.min}"`:''} ${o.max!==undefined?`max="${o.max}"`:''} ${type==='number'?`step="${o.step||'1'}"`:''} ${o.placeholder!==undefined?`placeholder="${escape(o.placeholder)}"`:''}>`;
}
export function sheetSelect(c:Sheet,path:string,value:unknown,label:string,values:Record<string,string>):string {
  return `<select ${attributes(c,path,label)} class="sheet-field sheet-select">${Object.entries(values).map(([id,name])=>`<option value="${escape(id)}" ${id===value?'selected':''}>${escape(name)}</option>`).join('')}</select>`;
}
export function sheetText(c:Sheet,path:string,value:unknown,label:string):string {
  return `<textarea ${attributes(c,path,label)} class="sheet-field sheet-narrative" rows="${path==='lore.backstory'?5:2}" data-sheet-saved="${escape(value??'')}" placeholder="${escape(label)}">${escape(value??'')}</textarea>`;
}
export function requireSheetEdit():boolean {
  const ok=canEditSheet(host.getChar());if(!ok)host.showToast('A edição desta ficha está bloqueada pelo mestre.');return ok;
}
export function commitSheetEdit(current:Sheet,next:Sheet,label:string):void {
  if(!canEditSheet(current)||current!==host.getChar())throw new Error('A ficha ou a permissão de edição mudou. Nenhuma alteração foi aplicada.');
  if(JSON.stringify(current)===JSON.stringify(next))return;
  const collection=host.characters.map((c:Sheet)=>c===current?next:c);
  if(!sheetStore.write(collection))throw new Error('Não foi possível salvar. O valor digitado foi mantido; confira o armazenamento ou baixe um backup.');
  Object.assign(current,next);
  host.recordStepAndSave(label,true);
}

/** Conserva os próprios controles, seus rascunhos e a posição do cursor mesmo
 * quando o renderizador anterior atualiza os cálculos ao redor. */
export function captureSheetFields() {
  const c=host.getChar(),scope=currentWorkspaceKey(),active=document.activeElement as HTMLInputElement;
  return {id:c?.id,scope,nodes:[...document.querySelectorAll<HTMLInputElement>('[data-sheet-field]')],active,
    selection:active&&['text','textarea'].includes(active.type)?[active.selectionStart,active.selectionEnd]:null,
    sections:[...document.querySelectorAll<HTMLDetailsElement>('details[data-sheet-section]')].map(e=>({key:e.dataset.sheetSection,open:e.open}))};
}
export function restoreSheetFields(saved:ReturnType<typeof captureSheetFields>):void {
  if(saved.id!==host.getChar()?.id||saved.scope!==currentWorkspaceKey())return;
  const old=new Map(saved.nodes.map(e=>[e.dataset.sheetField,e]));
  for(const fresh of document.querySelectorAll<HTMLInputElement>('[data-sheet-field]')) {
    const previous=old.get(fresh.dataset.sheetField);if(!previous||previous.tagName!==fresh.tagName||previous.type!==fresh.type)continue;
    const dirty=previous.value!==previous.dataset.sheetSaved,value=previous.value;
    if(previous.tagName==='SELECT')previous.innerHTML=fresh.innerHTML;
    for(const attr of [...previous.attributes])if(!fresh.hasAttribute(attr.name)&&attr.name!=='aria-invalid')previous.removeAttribute(attr.name);
    for(const attr of [...fresh.attributes])previous.setAttribute(attr.name,attr.value);
    previous.value=dirty?value:fresh.value;previous.disabled=fresh.disabled;
    fresh.replaceWith(previous);
  }
  for(const s of saved.sections){const e=document.querySelector<HTMLDetailsElement>(`details[data-sheet-section="${CSS.escape(s.key!)}"]`);if(e)e.open=s.open;}
  if(saved.active?.isConnected&&!saved.active.disabled){saved.active.focus({preventScroll:true});if(saved.selection)saved.active.setSelectionRange(saved.selection[0],saved.selection[1]);}
}

export function setupSheetEditing():void {
  document.getElementById('hbSaveBtn')!.addEventListener('click',event=>{if(!canSaveSheetPanel('homebrew')){event.preventDefault();event.stopImmediatePropagation();host.showToast('A ficha ou a permissão de edição mudou. Nenhuma alteração foi aplicada.');}},true);
  host.requireSheetEdit=requireSheetEdit;
  // Ponto de integração para o futuro controlador de salas; não lê autorização
  // da própria ficha e não substitui a validação de acesso no servidor.
  host.CritCallSheetAccess={setProvider:setSheetAuthorityProvider,canEdit:()=>canEditSheet(host.getChar())};
  host.createBlankCharacter=()=>{
    if(sheetStore.issue?.kind==='invalid'){host.openAuthAccountModal();return;}
    const c=blankCharacter(host.getChar()?.playerName||'Jogador',host.getChar()?.preferredLayout);
    try {const next=sheetStore.importCopies({format:'critcall.character-backup',version:1,exportedAt:'',characters:[c as any]},host.characters);host.CharacterWizard.close(true);host.closeAuthAccountModal();host.applyImportedCharacters(next,'Criou uma ficha em branco');}
    catch(e){host.showToast((e as Error).message);}
  };
  document.addEventListener('change',event=>{
    const el=event.target as HTMLInputElement;
    // Remover um input focado do DOM também dispara change no navegador. Uma
    // atualização visual não confirma esse rascunho nem inicia outro render.
    if(rendering)return;
    if(el instanceof HTMLElement&&el.closest('.rule-context,.rule-inline')&&el.getAttributeNames().some(name=>name.startsWith('data-rule-'))&&!canEditSheet(host.getChar())){event.stopImmediatePropagation();requireSheetEdit();host.renderAll();return;}
    if(el?.hasAttribute('data-sheet-armor')){if(!requireSheetEdit()){el.checked=!el.checked;return;}const c=host.getChar(),next=structuredClone(c),id=el.dataset.sheetArmor!;if(!['leve','media','pesada','escudo'].includes(id))return;next.armorProficiencies=armorProficiencies(c,host.CharacterEngine).filter(x=>x!==id);if(el.checked)next.armorProficiencies.push(id);try{commitSheetEdit(c,next,'Ajustou proficiências de armadura');}catch(e){host.showToast((e as Error).message);}return;}
    if(el?.hasAttribute('data-sheet-circle')){if(requireSheetEdit()&&el.value){visiblePools.add(poolKey(host.getChar(),'circle:'+el.value));host.renderAll();}return;}
    if(!el?.dataset?.sheetField)return;
    event.stopImmediatePropagation();const c=host.getChar();
    if(!c||c.id!==el.dataset.sheetOwner||currentWorkspaceKey()!==el.dataset.sheetScope)return;
    if(el.value===el.dataset.sheetSaved)return;
    try {const next=editSheetField(c,el.dataset.sheetField,el.value,host.CharacterEngine);el.removeAttribute('aria-invalid');el.setCustomValidity('');const saved=el.dataset.sheetSaved;el.dataset.sheetSaved=el.value;try{commitSheetEdit(c,next,`Ajustou ${el.getAttribute('aria-label')} na ficha`);}catch(e){el.dataset.sheetSaved=saved;throw e;}}
    catch(e){el.setAttribute('aria-invalid','true');el.setCustomValidity((e as Error).message);host.showToast((e as Error).message);}
  },true);
  document.addEventListener('input',event=>{const el=event.target as HTMLInputElement;if(el?.dataset?.sheetField){el.setCustomValidity('');el.removeAttribute('aria-invalid');}});
  document.addEventListener('keydown',event=>{const el=event.target as HTMLInputElement;if(!el?.dataset?.sheetField)return;if(event.key==='Escape'){event.preventDefault();el.value=el.dataset.sheetSaved||'';el.setCustomValidity('');el.removeAttribute('aria-invalid');el.blur();}else if(event.key==='Enter'&&el.tagName==='INPUT'){event.preventDefault();el.blur();}},true);
  document.addEventListener('click',event=>{
    const target=event.target as HTMLElement,pool=target.closest<HTMLElement>('[data-sheet-show-pool]'),expertise=target.closest<HTMLElement>('[data-sheet-expertise]');
    if(pool){if(requireSheetEdit()){visiblePools.add(poolKey(host.getChar(),pool.dataset.sheetShowPool!));host.renderAll();}return;}
    if(expertise){if(!requireSheetEdit())return;const c=host.getChar(),next=structuredClone(c),id=expertise.dataset.sheetExpertise!;if(!host.CharacterEngine.data.skills[id])return;next.expertise ||= [];next.expertise=next.expertise.includes(id)?next.expertise.filter((x:string)=>x!==id):[...next.expertise,id];if(next.expertise.includes(id)&&!next.skillsProf.includes(id))next.skillsProf.push(id);try{commitSheetEdit(c,next,'Ajustou especialização de perícia');}catch(e){host.showToast((e as Error).message);}return;}
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-sheet-add-class],[data-sheet-remove-class]');if(!button)return;
    const c=host.getChar();if(!c)return;
    try{commitSheetEdit(c,changeClassList(c,button.hasAttribute('data-sheet-add-class')?null:Number(button.dataset.sheetRemoveClass),host.CharacterEngine),'Ajustou as classes da ficha');}catch(e){host.showToast((e as Error).message);}
  });
  window.addEventListener('critcall-sheet-access-changed',()=>host.renderAll());
}
