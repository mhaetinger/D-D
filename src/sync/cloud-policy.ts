import type { DocumentValue, Documents } from './documents';
import { currentStorageKey } from '../storage/legacy';
import { HISTORY_PREFIX } from '../storage/character-history';

/** A nuvem gratuita guarda o estado atual. Desfazer e recuperações permanecem
 * neste aparelho; a política não apaga seus originais nem filas já existentes. */
export function isCloudDocument(doc: Pick<DocumentValue, 'kind' | 'id'>): boolean {
  if (doc.kind === 'recovery') return false;
  if (doc.kind !== 'preference' || typeof doc.id !== 'string') return true;
  const id = currentStorageKey(doc.id);
  return id !== 'dnd_history_v1' && !id.startsWith(HISTORY_PREFIX);
}
export function cloudDocuments(docs: Documents): Documents {
  return Object.fromEntries(Object.entries(docs).filter(([, doc]) => isCloudDocument(doc)));
}
