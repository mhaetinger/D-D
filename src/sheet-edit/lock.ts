import type {Sheet} from '../rules/model';
import {currentWorkspaceKey} from '../storage/account-scope';
import {canEditSheet} from './access';

let selected='',opened=false;
const key=(c:Sheet|undefined)=>c?JSON.stringify([currentWorkspaceKey(),c.id]):'';
/** Proteção contra alterações acidentais, separada da autorização do mestre.
 * Não pertence ao documento/backup e começa fechada a cada troca de ficha ou
 * espaço. Renderizar, rolar e desfazer na mesma ficha não muda o cadeado. */
export function syncSheetLock(c:Sheet|undefined):void {const next=key(c);if(next!==selected){selected=next;opened=false;}}
export function isSheetUnlocked(c:Sheet|undefined):boolean{return !!c&&selected===key(c)&&opened;}
export function canConfigureSheet(c:Sheet|undefined):boolean{return canEditSheet(c)&&isSheetUnlocked(c);}
export function setSheetUnlocked(c:Sheet|undefined,value:boolean):boolean {
  if(!c||value&&!canEditSheet(c))return false;
  syncSheetLock(c);opened=value;
  if(typeof window!=='undefined')window.dispatchEvent(new Event('critcall-sheet-lock-changed'));
  return true;
}
