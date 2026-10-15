import { sheetStore } from "./character-store";
import { MAX_BACKUP_BYTES, parseBackup, type CharacterRecord } from "./validation";
interface SheetHost {
  characters: CharacterRecord[];
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
      download(JSON.stringify(backup, null, 2), `dnd-fichas-${new Date().toISOString().slice(0, 10)}.json`);
      message.textContent = notes.checked ? "Backup baixado com suas anotações pessoais. Guarde-o em um lugar privado." : "Backup baixado. As anotações pessoais não foram incluídas.";
    } catch (error) { message.textContent = (error as Error).message; }
  });
  recovery.addEventListener("click", () => {
    if (sheetStore.raw !== null) download(sheetStore.raw, "dnd-dados-para-recuperacao.json");
  });
  importButton.addEventListener("click", () => input.click());
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const importingStore = sheetStore;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("O backup deve ter até 20 MB. Nenhum dado foi alterado.");
      const backup = parseBackup(await file.text());
      if (importingStore !== sheetStore) throw new Error("A conta mudou durante a leitura. Importe novamente no espaço desejado.");
      const replacing = sheetStore.issue?.kind === "invalid";
      if (replacing && !await host.confirmDestructiveAction("Recuperar fichas de um backup?", "Os dados que não puderam ser lidos serão guardados separadamente neste navegador. Depois, as fichas deste backup serão importadas. Você também pode baixar os dados originais antes de continuar.", "Importar backup")) return;
      if (importingStore !== sheetStore) throw new Error("A conta mudou durante a confirmação. Nenhuma ficha foi importada.");
      const combined = sheetStore.importCopies(backup, host.characters, replacing);
      host.applyImportedCharacters(combined);
      message.textContent = `${backup.characters.length} personagem(ns) importado(s) como cópias. Suas fichas anteriores foram mantidas.`;
    } catch (error) { message.textContent = (error as Error).message; }
  });
}
