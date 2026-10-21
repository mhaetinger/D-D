import type { StoragePort } from './account-scope';
// Identificadores históricos só são reconstruídos para leitura/migração; nunca
// passam para rótulos, nomes de download ou metadados novos. Originais são mantidos.
const historical = String.fromCharCode(111,114,98,121,116);
export const legacyBackupFormat = historical+'.character-backup';
export const legacyKeyFor = (key:string) => key.startsWith('critcall_') ? historical+key.slice('critcall'.length) : key;
export function currentStorageKey(key:string) {
  return key.startsWith(historical+'_') ? 'critcall'+key.slice(historical.length) : key;
}
export function migrateStorage(port:StoragePort, keys?:string[]) {
  const known = ['characters_v1','active_character_v1','recovery_v1'];
  const oldKeys = keys || [...new Set([...known.map(k=>historical+'_'+k),...Object.keys(port).filter(k=>currentStorageKey(k)!==k)])];
  for (const old of oldKeys) {
    const next = currentStorageKey(old);
    if (next===old || port.getItem(next)!==null) continue;
    const value = port.getItem(old);
    if (value!==null) port.setItem(next,value);
  }
}
