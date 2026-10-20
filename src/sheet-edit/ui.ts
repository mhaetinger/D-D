import {escape,type Sheet} from '../rules/model';
import {sheetStore} from '../storage/character-store';
import {currentWorkspaceKey} from '../storage/account-scope';
import {canConfigureSheet,isSheetUnlocked,setSheetUnlocked,syncSheetLock} from './lock';
import {canEditSheet,setSheetAuthorityProvider} from './access';
import {editSheetField,changeClassList,blankCharacter} from './model';
import {canSaveSheetPanel} from './panels';
import {classRemovalControls} from './class-removal';
import {mountSheetPanel,closeSheetPanel} from './panels';
import {armorProficiencies} from '../rules/spellcasting';

const host=globalThis as any;
let rendering=0;
export function beginSheetRender():void {rendering++;}
export function endSheetRender():void {rendering=Math.max(0,rendering-1);}
const visiblePools=new Set<string>();
const poolKey=(c:Sheet,key:string)=>currentWorkspaceKey()+':'+c.id+':'+key;
export const poolEditorVisible=(c:Sheet,key:string)=>visiblePools.has(poolKey(c,key));
type FieldOptions={min?:number;max?:number;step?:string;placeholder?:string;wide?:boolean};
function readout(c:Sheet,path:string,value:unknown,label:string,wide=false):string {
  return `<span class="sheet-value ${wide?'sheet-wide':''} ${path.startsWith('lore.')?'sheet-narrative':''}" data-sheet-value="${escape(path)}" title="${escape(label)}" ${canConfigureSheet(c)?'hidden':''}>${escape(value===''?'—':value)}</span>`;
}
export function updateSheetLockUI(c:Sheet|undefined):void {
  syncSheetLock(c);
  const button=document.getElementById('sheetEditLock') as HTMLButtonElement|null;if(!button)return;
  const unlocked=canConfigureSheet(c),allowed=canEditSheet(c);
  button.disabled=!c||!allowed;button.setAttribute('aria-pressed',String(unlocked));
  button.setAttribute('aria-label',unlocked?'Proteger ficha contra edições':'Liberar edição da ficha');
  button.title=!allowed&&c?'A edição desta ficha está bloqueada pelo mestre.':unlocked?'Edição liberada. Feche o cadeado para proteger os ajustes. Rascunhos pendentes são preservados.':'Ficha protegida. Abra o cadeado para editar classes, atributos, máximos e outros ajustes. Rolagens e recursos continuam disponíveis.';
  button.innerHTML=`<i data-lucide="${unlocked?'lock-keyhole-open':'lock-keyhole'}" class="w-3.5 h-3.5" aria-hidden="true"></i><span>${unlocked?'Editando':'Protegida'}</span>`;
}
export function requireSheetConfiguration():boolean {
  if(!requireSheetEdit())return false;
  const ok=canConfigureSheet(host.getChar());if(!ok)host.showToast('Abra o cadeado ao lado do seletor de fichas para editar os ajustes.');return ok;
}
function attributes(c:Sheet,path:string,label:string) {
  return `data-sheet-field="${escape(path)}" data-sheet-owner="${escape(c.id)}" data-sheet-scope="${escape(currentWorkspaceKey())}" aria-label="${escape(label)}" title="${escape(label)} · ajuste direto na ficha${path.startsWith('customSkillBonuses.')?'; vazio usa o cálculo automático':''}" ${canConfigureSheet(c)?'':'disabled hidden'}`;
}
export function sheetInput(c:Sheet,path:string,value:unknown,label:string,type='text',o:FieldOptions={}):string {
  return readout(c,path,value===undefined||value===null||value===''?o.placeholder??'—':value,label,o.wide)+`<input ${attributes(c,path,label)} class="sheet-field ${type==='number'?'sheet-number':'sheet-text'} ${o.wide?'sheet-wide':''}" type="${type}" value="${escape(value??'')}" data-sheet-saved="${escape(value??'')}" ${o.min!==undefined?`min="${o.min}"`:''} ${o.max!==undefined?`max="${o.max}"`:''} ${type==='number'?`step="${o.step||'1'}"`:''} ${o.placeholder!==undefined?`placeholder="${escape(o.placeholder)}"`:''}>`;
}
export function sheetSelect(c:Sheet,path:string,value:unknown,label:string,values:Record<string,string>):string {
  return readout(c,path,values[String(value)]||'—',label)+`<select ${attributes(c,path,label)} class="sheet-field sheet-select">${Object.entries(values).map(([id,name])=>`<option value="${escape(id)}" ${id===value?'selected':''}>${escape(name)}</option>`).join('')}</select>`;
}
export function sheetText(c:Sheet,path:string,value:unknown,label:string):string {
  return readout(c,path,value||'—',label,true)+`<textarea ${attributes(c,path,label)} class="sheet-field sheet-narrative" rows="${path==='lore.backstory'?5:2}" data-sheet-saved="${escape(value??'')}" placeholder="${escape(label)}">${escape(value??'')}</textarea>`;
}
export function requireSheetEdit():boolean {
  const ok=canEditSheet(host.getChar());if(!ok)host.showToast('A edição desta ficha está bloqueada pelo mestre.');return ok;
}
export function commitSheetEdit(current:Sheet,next:Sheet,label:string):void {
  if(!canConfigureSheet(current)||current!==host.getChar())throw new Error('A ficha ou a permissão de edição mudou. Nenhuma alteração foi aplicada.');
  if(JSON.stringify(current)===JSON.stringify(next))return;
  const collection=host.characters.map((c:Sheet)=>c===current?next:c);
  if(!sheetStore.write(collection))throw new Error('Não foi possível salvar. O valor digitado foi mantido; confira o armazenamento ou baixe um backup.');
  Object.assign(current,next);
  host.recordStepAndSave(label,true);
}

/** Conserva os próprios controles, seus rascunhos e a posição do cursor mesmo
 * quando o renderizador anterior atualiza os cálculos ao redor. */
export function captureSheetFields() {
  const c=host.getChar(),active=document.activeElement as HTMLInputElement,nodes=[...document.querySelectorAll<HTMLInputElement>('[data-sheet-field]')];
  return {id:nodes[0]?.dataset.sheetOwner||c?.id,scope:nodes[0]?.dataset.sheetScope??currentWorkspaceKey(),nodes,active,
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
  host.requireSheetConfiguration=requireSheetConfiguration;
  document.getElementById('sheetEditLock')!.addEventListener('click',()=>{
    const c=host.getChar();if(!c||!canEditSheet(c))return;
    const next=!isSheetUnlocked(c),pending=!!document.querySelector('.sheet-inline-editor:not(.hidden)')||[...document.querySelectorAll<HTMLInputElement>('[data-sheet-field]')].some(el=>el.value!==el.dataset.sheetSaved);
    setSheetUnlocked(c,next);
    if(!next&&pending)host.showToast('Ficha protegida. Os ajustes pendentes ficam guardados até reabrir o cadeado.');
  });
  // Ponto de integração para o futuro controlador de salas; não lê autorização
  // da própria ficha e não substitui a validação de acesso no servidor.
  host.CritCallSheetAccess={setProvider:setSheetAuthorityProvider,canEdit:()=>canEditSheet(host.getChar()),canConfigure:()=>canConfigureSheet(host.getChar())};
  host.createBlankCharacter=()=>{
    if(sheetStore.issue?.kind==='invalid'){host.openAuthAccountModal();return;}
    const c=blankCharacter(host.getChar()?.playerName||'Jogador',host.getChar()?.preferredLayout);
    try {const next=sheetStore.importCopies({format:'critcall.character-backup',version:1,exportedAt:'',characters:[c as any]},host.characters);host.CharacterWizard.close(true);host.closeAuthAccountModal();host.applyImportedCharacters(next,'Criou uma ficha em branco');setSheetUnlocked(host.getChar(),true);}
    catch(e){host.showToast((e as Error).message);}
  };
  document.addEventListener('change',event=>{
    const el=event.target as HTMLInputElement;
    // Remover um input focado do DOM também dispara change no navegador. Uma
    // atualização visual não confirma esse rascunho nem inicia outro render.
    if(rendering)return;
    if(el instanceof HTMLElement&&el.closest('.rule-context,.rule-inline')&&el.getAttributeNames().some(name=>name.startsWith('data-rule-'))&&!canEditSheet(host.getChar())){event.stopImmediatePropagation();requireSheetEdit();host.renderAll();return;}
    if(el instanceof HTMLElement&&el.matches('[data-rule-ac],[data-rule-defense],[data-rule-companion="name"],[data-rule-companion="max"]')&&!canConfigureSheet(host.getChar())){event.stopImmediatePropagation();requireSheetConfiguration();host.renderAll();return;}
    if(el?.hasAttribute('data-sheet-armor')){if(!requireSheetConfiguration()){el.checked=!el.checked;return;}const c=host.getChar(),next=structuredClone(c),id=el.dataset.sheetArmor!;if(!['leve','media','pesada','escudo'].includes(id))return;next.armorProficiencies=armorProficiencies(c,host.CharacterEngine).filter(x=>x!==id);if(el.checked)next.armorProficiencies.push(id);try{commitSheetEdit(c,next,'Ajustou proficiências de armadura');}catch(e){host.showToast((e as Error).message);}return;}
    if(el?.hasAttribute('data-sheet-circle')){if(requireSheetConfiguration()&&el.value){visiblePools.add(poolKey(host.getChar(),'circle:'+el.value));host.renderAll();}return;}
    if(!el?.dataset?.sheetField)return;
    if(!canConfigureSheet(host.getChar())){event.stopImmediatePropagation();requireSheetConfiguration();return;}
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
    if(pool){if(requireSheetConfiguration()){visiblePools.add(poolKey(host.getChar(),pool.dataset.sheetShowPool!));host.renderAll();}return;}
    if(expertise){if(!requireSheetConfiguration())return;const c=host.getChar(),next=structuredClone(c),id=expertise.dataset.sheetExpertise!;if(!host.CharacterEngine.data.skills[id])return;next.expertise ||= [];next.expertise=next.expertise.includes(id)?next.expertise.filter((x:string)=>x!==id):[...next.expertise,id];if(next.expertise.includes(id)&&!next.skillsProf.includes(id))next.skillsProf.push(id);try{commitSheetEdit(c,next,'Ajustou especialização de perícia');}catch(e){host.showToast((e as Error).message);}return;}
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-sheet-add-class],[data-sheet-remove-class]');if(!button)return;
    const c=host.getChar();if(!c)return;
    try{
      if(!requireSheetConfiguration())return;
      if(button.hasAttribute('data-sheet-add-class'))commitSheetEdit(c,changeClassList(c,null,host.CharacterEngine),'Adicionou classe à ficha');
      else {
        const index=Number(button.dataset.sheetRemoveClass),store=sheetStore,before=JSON.stringify(c.classes);
        if(c.classes.length<2)throw new Error('Adicione outra classe antes de remover a única classe.');
        const panel=classRemovalControls(c,index,host.CharacterEngine,resolution=>{
          if(c!==host.getChar()||store!==sheetStore||JSON.stringify(c.classes)!==before)throw new Error('A ficha ou as classes mudaram. Feche e revise novamente.');
          const next=changeClassList(c,index,host.CharacterEngine,resolution);commitSheetEdit(c,next,'Removeu classe da ficha');closeSheetPanel('class-removal');
        },()=>closeSheetPanel('class-removal'));
        mountSheetPanel('class-removal',panel,'#headerSection');
      }
    }catch(e){host.showToast((e as Error).message);}
  });
  window.addEventListener('critcall-sheet-access-changed',()=>host.renderAll());
  window.addEventListener('critcall-sheet-lock-changed',()=>host.renderAll());
  updateSheetLockUI(host.getChar());host.lucide?.createIcons();
}
