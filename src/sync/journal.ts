import type { DocumentValue, Documents } from "./documents";

export interface RemoteDocument extends DocumentValue { key: string; revision: number; edited_at: string; updated_at: string; operation_id: string }
export interface Pending extends DocumentValue { key: string; operationId: string; parentId: string | null; baseRevision: number; editedAt: string; clockOffset: number; uncalibrated: boolean }
export interface JournalState { version: 1; remote: Record<string, RemoteDocument>; pending: Pending[]; projected: Documents; offset: number; clockKnown: boolean }
export const emptyJournal = (): JournalState => ({ version: 1, remote: {}, pending: [], projected: {}, offset: 0, clockKnown: false });
export interface JournalPort { change<T>(scope: string, action: (state: JournalState) => T): Promise<T> }

/** Uma transação de IndexedDB serializa abas e grava estado/fila juntos. */
export class BrowserJournal implements JournalPort {
  private database: Promise<IDBDatabase>;
  constructor(factory: IDBFactory = indexedDB) {
    this.database = new Promise((resolve, reject) => {
      const request = factory.open("critcall-sync-v1", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("accounts");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Armazenamento ocupado em outra aba"));
    });
  }
  async change<T>(scope: string, action: (state: JournalState) => T): Promise<T> {
    const database = await this.database;
    return new Promise((resolve, reject) => {
      const tx = database.transaction("accounts", "readwrite");
      const store = tx.objectStore("accounts");
      let result: T, failure: unknown;
      const request = store.get(scope);
      request.onsuccess = () => {
        try {
          const state = request.result ?? emptyJournal();
          if (state.version !== 1 || !Array.isArray(state.pending) || !state.remote || !state.projected) throw new Error("Fila local ilegível; conteúdo preservado");
          result = action(state);
          store.put(state, scope);
        } catch (error) { failure = error; tx.abort(); }
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(failure || tx.error || new Error("Falha na fila offline"));
    });
  }
}
