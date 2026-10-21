import type {Sheet} from '../rules/model';

export type SheetAuthority={kind:'personal'}|{kind:'room';role:'gm'|'player';playerCanEdit:boolean};
type AuthorityProvider=(characterId:string)=>SheetAuthority;
let authority:AuthorityProvider=()=>({kind:'personal'});

/** O contexto virá do controlador da sala, nunca dos dados importados da ficha.
 * É uma guarda da interface. Salas precisarão aplicar a mesma autorização no
 * servidor antes de aceitar alterações; esta etapa não implementa salas. */
export function setSheetAuthorityProvider(provider:AuthorityProvider):void {
  authority=provider;
  if(typeof window!=='undefined')window.dispatchEvent(new Event('critcall-sheet-access-changed'));
}
export function canEditSheet(c:Sheet|undefined):boolean {
  if(!c)return false;
  const context=authority(c.id);
  return context.kind==='personal'||context.role==='gm'||context.playerCanEdit===true;
}
