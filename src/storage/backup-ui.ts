import { sheetStore } from "./character-store";
import { MAX_BACKUP_BYTES, parseBackup, type CharacterRecord } from "./validation";
import { reviewImport } from '../import/review-ui';
import { readCharacterPdf } from '../import/pdf-reader';
import { pdfToBackup } from '../import/pdf-character';
interface SheetHost {
  characters: CharacterRecord[];
  getChar: () => CharacterRecord;
  CharacterEngine: Record<string, any>;
  applyImportedCharacters: (characters: CharacterRecord[]) => void;
  openAuthAccountModal: () => void;
  confirmDestructiveAction: (title: string, message: string, label: string) => Promise<boolean>;
}
const host = window as unknown as SheetHost;
function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function setupBackups() {
  const exportButton = document.getElementById("exportBackup") as HTMLButtonElement;
  const importButton = document.getElementById("importBackup") as HTMLButtonElement;
  const reviewButton = document.getElementById('reviewImportedCharacter') as HTMLButtonElement;
  const input = document.getElementById("backupFile") as HTMLInputElement;
  const notes = document.getElementById("backupIncludeNotes") as HTMLInputElement;
  const message = document.getElementById("backupStatus")!;
  const issue = document.getElementById("storageIssue")!;
  const recovery = document.getElementById("downloadRecovery") as HTMLButtonElement;
  const update = () => {
    issue.hidden = !sheetStore.issue;
    issue.textContent = sheetStore.issue?.message || "";
    recovery.hidden = sheetStore.issue?.kind !== "invalid";
  };
  let observedStore = sheetStore;
  observedStore.addEventListener("change", update);
  window.addEventListener("dnd-workspace-changed", () => {
    observedStore.removeEventListener("change", update);
    observedStore = sheetStore;
    observedStore.addEventListener("change", update);
    update();
  });
  update();
  if (sheetStore.issue) host.openAuthAccountModal();
  exportButton.addEventListener("click", () => {
    try {
      const backup = sheetStore.backup(host.characters, notes.checked);
      download(JSON.stringify(backup, null, 2), `critcall-fichas-${new Date().toISOString().slice(0, 10)}.json`);
      message.textContent = notes.checked ? "Backup baixado com suas anotações pessoais. Guarde-o em um lugar privado." : "Backup baixado. As anotações pessoais não foram incluídas.";
    } catch (error) { message.textContent = (error as Error).message; }
  });
  recovery.addEventListener("click", () => {
    if (sheetStore.raw !== null) download(sheetStore.raw, "critcall-dados-para-recuperacao.json");
  });
  importButton.addEventListener("click", () => input.click());
  let importing=false;
  async function importReviewed(read:()=>Promise<ReturnType<typeof parseBackup>>) {
    if(importing)return;
    importing=true;importButton.disabled=true;reviewButton.disabled=true;
    const importingStore=sheetStore;
    try {
      message.textContent='Lendo o arquivo neste navegador…';
      const backup=await read();
      if(importingStore!==sheetStore)throw new Error('A conta mudou durante a leitura. Reabra a importação no espaço desejado.');
      if((document.getElementById('confirmationDialog') as HTMLDialogElement).open)throw new Error('Feche a janela em edição antes de revisar a importação.');
      const reviewed=await reviewImport(backup,host.CharacterEngine,()=>importingStore===sheetStore);
      if(!reviewed){message.textContent='Importação cancelada. As fichas existentes foram mantidas.';return;}
      const replacing=sheetStore.issue?.kind==='invalid';
      if(replacing && !await host.confirmDestructiveAction('Recuperar fichas de um backup?','Os dados ilegíveis serão guardados separadamente antes de importar as cópias revisadas.','Importar cópias revisadas'))return;
      if(importingStore!==sheetStore)throw new Error('A conta mudou durante a revisão. Nenhuma ficha foi importada.');
      const combined=sheetStore.importCopies(reviewed,host.characters,replacing);
      host.applyImportedCharacters(combined);
      message.textContent=`${reviewed.characters.length} personagem(ns) importado(s) como cópias revisadas. Suas fichas anteriores foram mantidas.`;
    }catch(error){message.textContent=(error as Error).message;}
    finally {importing=false;importButton.disabled=false;reviewButton.disabled=false;}
  }
  reviewButton.addEventListener('click',()=>void importReviewed(async()=>{const c=host.getChar();if(!c)throw new Error('Não há uma ficha atual para revisar.');return sheetStore.backup([c],true);}));
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    await importReviewed(async()=>{
      if (file.size > MAX_BACKUP_BYTES) throw new Error("O backup deve ter até 20 MB. Nenhum dado foi alterado.");
      const pdf=file.type==='application/pdf'||/\.pdf$/i.test(file.name)||(await file.slice(0,1024).text()).includes('%PDF-');
      return pdf?pdfToBackup(await readCharacterPdf(file),host.CharacterEngine):parseBackup(await file.text());
    });
  });
}
