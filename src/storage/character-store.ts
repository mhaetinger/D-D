import { validateCharacters, type Backup, type CharacterRecord } from "./validation";
export const SHEET_KEY = "orbyt_characters_v1";
export const LEGACY_KEY = "dnd_sheet_public_v1";
export const NOTES_KEY = "dnd_player_private_notes_v1";
export const RECOVERY_KEY = "orbyt_recovery_v1";
type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Issue = { kind: "invalid" | "unavailable" | "write"; message: string };

/** Armazenamento local síncrono durante a migração da interface. Nunca apaga o legado. */
export class CharacterStore extends EventTarget {
  issue: Issue | null = null;
  raw: string | null = null;
  private readSucceeded = false;
  constructor(private storage: () => StoragePort) { super(); }
  private report(issue: Issue | null) {
    this.issue = issue;
    this.dispatchEvent(new Event("change"));
  }
  read(): CharacterRecord[] {
    let legacy = false;
    try {
      const storage = this.storage();
      this.raw = storage.getItem(SHEET_KEY);
      if (this.raw === null) { this.raw = storage.getItem(LEGACY_KEY); legacy = this.raw !== null; }
      this.readSucceeded = true;
    } catch {
      this.readSucceeded = false;
      this.report({ kind: "unavailable", message: "O navegador bloqueou o armazenamento. As edições ficarão em memória; baixe um backup antes de fechar." });
      return [];
    }
    if (this.raw === null) return [];
    try {
      const data = JSON.parse(this.raw);
      if (!legacy && data?.schemaVersion !== 1) throw new Error("Versão de dados não suportada");
      const characters = validateCharacters(legacy ? data : data.characters);
      if (legacy) this.write(characters);
      return characters;
    } catch {
      this.report({ kind: "invalid", message: "Não foi possível ler as fichas salvas. Os dados originais foram preservados. Baixe-os para recuperação ou importe um backup válido." });
      return [];
    }
  }
  write(characters: CharacterRecord[]): boolean {
    if (!this.readSucceeded || this.issue?.kind === "invalid") return false;
    try {
      validateCharacters(characters);
      const text = JSON.stringify({ schemaVersion: 1, characters });
      this.storage().setItem(SHEET_KEY, text);
      this.raw = text;
      this.report(null);
      return true;
    } catch {
      this.report({ kind: "write", message: "As alterações ainda não foram salvas neste navegador. Baixe um backup antes de fechar e confira o espaço disponível ou a permissão de armazenamento." });
      return false;
    }
  }
  notes(): Record<string, string> {
    const raw = this.storage().getItem(NOTES_KEY);
    if (raw === null) return {};
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data) || !Object.values(data).every((v) => typeof v === "string")) throw new Error("Não foi possível ler as anotações pessoais. Os dados foram preservados.");
    return data as Record<string, string>;
  }
  backup(characters: CharacterRecord[], includeNotes = false): Backup {
    const copy = structuredClone(validateCharacters(characters));
    const result: Backup = { format: "orbyt.character-backup", version: 1, exportedAt: new Date().toISOString(), characters: copy };
    if (includeNotes) {
      const notes = this.notes();
      result.privateNotes = Object.fromEntries(copy.filter((c) => Object.hasOwn(notes, c.id)).map((c) => [c.id, notes[c.id]]));
    }
    return result;
  }
  importCopies(backup: Backup, current: CharacterRecord[], replaceCorrupt = false): CharacterRecord[] {
    if (!this.readSucceeded) throw new Error("Reabra a página com o armazenamento permitido antes de importar. Assim podemos preservar as fichas que já estiverem neste navegador.");
    if (this.issue?.kind === "invalid" && !replaceCorrupt) throw new Error("Confirme a recuperação antes de substituir os dados que não puderam ser lidos.");
    const copies = structuredClone(validateCharacters(backup.characters));
    if (!copies.length) throw new Error("O backup não contém personagens para importar.");
    const ids = new Map(copies.map((c) => [c.id, `char_${crypto.randomUUID()}`]));
    for (const char of copies) char.id = ids.get(char.id)!;
    const combined = [...validateCharacters(current), ...copies];
    validateCharacters(combined);
    const storage = this.storage();
    const previousNotes = storage.getItem(NOTES_KEY);
    let changedNotes = false;
    try {
      if (this.issue?.kind === "invalid" && this.raw !== null) {
        const prior = storage.getItem(RECOVERY_KEY);
        // Uma segunda recuperação não apaga a cópia guardada pela primeira.
        const key = prior !== null && prior !== this.raw ? `${RECOVERY_KEY}_${crypto.randomUUID()}` : RECOVERY_KEY;
        storage.setItem(key, this.raw);
      }
      if (backup.privateNotes) {
        const notes = this.notes();
        for (const [oldId, text] of Object.entries(backup.privateNotes)) {
          const id = ids.get(oldId);
          if (id) notes[id] = text;
        }
        storage.setItem(NOTES_KEY, JSON.stringify(notes));
        changedNotes = true;
      }
      const text = JSON.stringify({ schemaVersion: 1, characters: combined });
      // A ficha é gravada por último. Erro de quota não substitui a coleção anterior.
      storage.setItem(SHEET_KEY, text);
      this.raw = text;
      this.report(null);
      return combined;
    } catch {
      if (changedNotes) {
        try { if (previousNotes === null) storage.removeItem(NOTES_KEY); else storage.setItem(NOTES_KEY, previousNotes); } catch { /* A coleção de fichas anterior continua preservada. */ }
      }
      throw new Error("Não foi possível salvar a importação. As fichas anteriores foram preservadas; confira o espaço ou a permissão de armazenamento.");
    }
  }
}
export const sheetStore = new CharacterStore(() => localStorage);
