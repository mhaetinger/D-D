import {currentWorkspaceKey} from '../storage/account-scope';
import {canEditSheet} from './access';
const host=window as any;
interface Panel {node:HTMLElement;anchor:string;character:any;scope:string;}
const panels=new Map<string,Panel>();
export function canSaveSheetPanel(key:string):boolean {const p=panels.get(key);return !!p&&p.character===host.getChar()&&p.scope===currentWorkspaceKey()&&canEditSheet(p.character);}
export function mountSheetPanel(key:string,node:HTMLElement,anchor:string):void {
  const c=host.getChar();if(!canEditSheet(c))throw new Error('A edição desta ficha está bloqueada pelo mestre.');
  panels.get(key)?.node.remove();panels.set(key,{node,anchor,character:c,scope:currentWorkspaceKey()});
  const target=document.querySelector(anchor);if(!target)throw new Error('Abra o bloco correspondente da ficha para editar.');target.append(node);
}
export function closeSheetPanel(key:string):void {
  const p=panels.get(key);if(p){if(key==='homebrew'){p.node.classList.add('hidden');document.getElementById('sheetEditorParking')!.append(p.node);}else p.node.remove();}panels.delete(key);
}
export function parkSheetPanels():void {
  for(const [key,p] of panels) {
    if(p.character!==host.getChar()||p.scope!==currentWorkspaceKey())closeSheetPanel(key);
    else document.getElementById('sheetEditorParking')!.append(p.node);
  }
}
export function restoreSheetPanels():void {
  for(const p of panels.values()) {
    const target=document.querySelector(p.anchor);if(!target)continue;target.append(p.node);
    for(const el of p.node.querySelectorAll<HTMLInputElement>('input,select,textarea,button')) {
      if(el.hasAttribute('data-spell-cancel')||el.hasAttribute('data-class-removal-cancel')||el.getAttribute('onclick')?.startsWith('closeHomebrewModal'))continue;
      if(!canEditSheet(p.character)){if(!el.hasAttribute('data-access-disabled'))el.dataset.accessDisabled=String(el.disabled);el.disabled=true;}
      else if(el.hasAttribute('data-access-disabled')){el.disabled=el.dataset.accessDisabled==='true';delete el.dataset.accessDisabled;}
    }
  }
}
export function clearSheetPanels():void {for(const key of [...panels.keys()])closeSheetPanel(key);}
