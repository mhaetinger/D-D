import { isAvatarRef } from "../media/avatar";
import { SHEET_KEY, LEGACY_KEY, NOTES_KEY, RECOVERY_KEY } from "../storage/character-store";
import { PERSONAL_KEYS } from "../storage/preferences";
import { validateCharacters } from "../storage/validation";
import type { StoragePort } from "../storage/account-scope";
import { currentStorageKey, migrateStorage } from "../storage/legacy";
import { historyKey, HISTORY_PREFIX, isCharacterHistoryKey, migrateCharacterHistories, validateCharacterHistory } from '../storage/character-history';
export { canonical } from '../storage/canonical';

export type Kind = "character" | "note" | "preference" | "recovery";
export interface DocumentValue { kind: Kind; id: string; value: unknown }
export type Documents = Record<string, DocumentValue>;
export const documentKey = (kind: Kind, id: string) => `${kind}:${encodeURIComponent(id)}`;
export function validateDocument(doc: DocumentValue): DocumentValue {
  if (!doc || !["character", "note", "preference", "recovery"].includes(doc.kind) || typeof doc.id !== "string" || !doc.id || doc.id.length > 300) throw new Error("Documento inválido");
  if (doc.value === null) return doc;
  if (doc.kind === "character") {
    const [char] = validateCharacters([doc.value]);
    if (char.id !== doc.id) throw new Error("Identificador de ficha incompatível");
    return {...doc,value:char};
  } else if (doc.kind === "note") {
    if (typeof doc.value !== "string" || doc.value.length > 2_000_000) throw new Error("Anotação inválida");
  } else if (doc.kind === "preference") {
    if ((!PERSONAL_KEYS.includes(currentStorageKey(doc.id)) && !isCharacterHistoryKey(doc.id)) || typeof doc.value !== "string" || doc.value.length > 15_000_000) throw new Error("Preferência inválida");
    if(isCharacterHistoryKey(doc.id)) validateCharacterHistory(doc.value,doc.id.slice(HISTORY_PREFIX.length));
    if (doc.id === "dnd_profile_avatar" && doc.value !== "null" && !isAvatarRef(JSON.parse(doc.value))) throw new Error("Imagem de perfil inválida");
    if (doc.id === "dnd_history_v1") {
      const history = JSON.parse(doc.value);
      if (!Array.isArray(history.stack) || !Number.isInteger(history.pointer) || history.pointer < 0 || history.pointer >= history.stack.length) throw new Error("Histórico inválido");
      for (const step of history.stack) {
        if (typeof step.action !== "string" || typeof step.timestamp !== "string" || typeof step.stateJson !== "string") throw new Error("Passo inválido");
        validateCharacters(JSON.parse(step.stateJson));
      }
    }
  } else if (doc.kind === "recovery") {
    if (!currentStorageKey(doc.id).startsWith(RECOVERY_KEY) || typeof doc.value !== "string" || doc.value.length > 20_000_000) throw new Error("Recuperação inválida");
  } else throw new Error("Tipo desconhecido");
  return doc;
}

export function readDocuments(port: StoragePort, recoveryKeys: string[] = []): Documents {
  migrateStorage(port);
  const docs: Documents = {};
  const put = (kind: Kind, id: string, value: unknown) => { docs[documentKey(kind, id)] = validateDocument({ kind, id, value }); };
  const raw = port.getItem(SHEET_KEY), legacy = port.getItem(LEGACY_KEY);
  const chars = raw !== null ? validateCharacters(JSON.parse(raw).characters) : legacy !== null ? validateCharacters(JSON.parse(legacy)) : [];
  let migratedKeys:string[]=[];
  try { migratedKeys=migrateCharacterHistories(port); } catch { /* O original continua disponível; fichas válidas seguem sincronizando. */ }
  for (const char of chars) put("character", char.id, char);
  const notes = JSON.parse(port.getItem(NOTES_KEY) || "{}");
  if (!notes || typeof notes !== "object" || Array.isArray(notes)) throw new Error("Anotações ilegíveis");
  for (const [id, text] of Object.entries(notes)) put("note", id, text);
  const historyKeys=[...new Set([...chars.map(c=>historyKey(c.id)),...migratedKeys,...recoveryKeys.filter(isCharacterHistoryKey)])];
  for (const id of [...PERSONAL_KEYS,...historyKeys]) {
    const value = port.getItem(id);
    if (value !== null) {
      try { put("preference", id, value); }
      catch (error) {
        if (id !== "dnd_history_v1" && !isCharacterHistoryKey(id)) throw error;
        // Histórico ilegível não impede enviar as fichas válidas. Os bytes
        // originais viram um documento privado de recuperação, sem executá-los.
        put("recovery", RECOVERY_KEY + "_history_invalid"+(isCharacterHistoryKey(id)?'_'+id.slice(HISTORY_PREFIX.length):''), value);
      }
    }
  }
  for (const id of recoveryKeys.filter(key=>!isCharacterHistoryKey(key))) { const value = port.getItem(id); if (value !== null) put("recovery", id, value); }
  return docs;
}

/** As notas são projetadas em outra chave, nunca dentro da ficha ou de seus snapshots. */
export function projectDocuments(port: StoragePort, docs: Documents) {
  const valid = Object.values(compatibleDocuments(docs)).map(validateDocument);
  const characters = valid.filter(d => d.kind === "character" && d.value !== null).map(d => d.value);
  validateCharacters(characters);
  const notes = Object.fromEntries(valid.filter(d => d.kind === "note" && d.value !== null).map(d => [d.id, d.value]));
  const writes: [string, string | null][] = [[SHEET_KEY, JSON.stringify({ schemaVersion: 1, characters })], [NOTES_KEY, JSON.stringify(notes)]];
  for (const doc of valid.filter(d => ["preference", "recovery"].includes(d.kind))) {
    writes.push([doc.id, doc.value as string | null]);
  }
  const prior = new Map(writes.map(([key]) => [key, port.getItem(key)]));
  const written: string[] = [];
  try {
    for (const [key, value] of writes) { if (value === null) port.removeItem(key); else port.setItem(key, value); written.push(key); }
  } catch (error) {
    for (const key of written.reverse()) {
      try { const value = prior.get(key)!; if (value === null) port.removeItem(key); else port.setItem(key, value); }
      catch { /* O IndexedDB e as versões remotas continuam preservados para repetição. */ }
    }
    throw error;
  }
}

/** Mantém IDs/revisões da fila remota; só a projeção local usa o nome atual.
 * Um documento atual, inclusive excluído, tem precedência sobre o alias antigo. */
export function compatibleDocuments(docs:Documents):Documents {
  const output:Documents = {};
  const all = Object.values(docs);
  for (const doc of all) {
    const id = ['preference','recovery'].includes(doc.kind) ? currentStorageKey(doc.id) : doc.id;
    if (id!==doc.id && all.some(d=>d.kind===doc.kind && d.id===id)) continue;
    const projected = {...doc,id}; output[documentKey(doc.kind,id)] = projected;
  }
  return output;
}
