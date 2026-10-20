import {sheetStore} from '../storage/character-store';
import {reviewImport} from '../import/review-ui';
import {manualCharacter,markManual} from './character';
import {validateCharacters,type Backup} from '../storage/validation';
import type {Sheet} from '../rules/model';

const host=window as any;
let editing=false;
export async function openManualCharacter(edit=false):Promise<void> {
  if(editing || (document.getElementById('confirmationDialog') as HTMLDialogElement).open)return;
  editing=true;
  const store=sheetStore,original=edit?host.getChar():null;
  try {
    if(edit&&!original)return;
    if(store.issue?.kind==='invalid')throw new Error('Recupere os dados ilegíveis no perfil antes de criar ou editar uma ficha.');
    host.CharacterWizard.close(true);host.closeAuthAccountModal();
    const c:Sheet=edit?structuredClone(original):manualCharacter(host.getChar()?.playerName||document.getElementById('currentUserBadge')!.textContent||'Jogador',host.getChar()?.preferredLayout);
    markManual(c);
    const before=original?JSON.stringify(original):'',backup:Backup={format:'critcall.character-backup',version:1,exportedAt:'',characters:[c as any]};
    const isCurrent=()=>store===sheetStore&&(!edit||host.getChar()===original&&JSON.stringify(original)===before);
    const result=await reviewImport(backup,host.CharacterEngine,isCurrent,edit?'edit':'create');
    if(!result)return;
    if(!isCurrent())throw new Error('A ficha ou a conta mudou durante a edição. Reabra os ajustes; nenhuma alteração foi aplicada.');
    const next=result.characters[0];
    if(edit) {
      const collection=host.characters.map((x:Sheet)=>x===original?next:x);
      validateCharacters(collection);
      // Primeiro confirma a gravação do conjunto; quota não substitui a ficha
      // em memória. O histórico é registrado pela mesma ponte das evoluções.
      if(!store.write(collection))throw new Error('Não foi possível salvar. A ficha anterior foi preservada.');
      host.commitLeveledCharacter(next,'Ajustou a ficha manualmente · adaptação da mesa');
    } else {
      const collection=store.importCopies(result,host.characters);
      host.applyImportedCharacters(collection,'Criou uma ficha manual · adaptação da mesa');
      host.showToast('Ficha manual criada. Acrescente armas, magias e equipamentos nos cartões.');
    }
  }catch(e){host.showToast((e as Error).message);}
  finally {editing=false;}
}

export function setupManualCharacters():void {
  host.openManualCharacter=()=>openManualCharacter();
  host.editManualCharacter=()=>openManualCharacter(true);
  document.getElementById('createManualCharacter')!.addEventListener('click',()=>void openManualCharacter());
  document.getElementById('editManualCharacter')!.addEventListener('click',()=>void openManualCharacter(true));
}
