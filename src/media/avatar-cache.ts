import type { AvatarRef } from "./avatar";

export interface AvatarAsset extends AvatarRef { key: string; scope: string; blob: Blob; pending: boolean }
export class AvatarCache {
  private database: Promise<IDBDatabase>;
  constructor() {
    this.database = new Promise((resolve, reject) => {
      const request = indexedDB.open("critcall-avatars-v1", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("assets", { keyPath: "key" }).createIndex("scope", "scope");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("O armazenamento das imagens está indisponível."));
      request.onblocked = () => reject(new Error("Feche outras abas antigas para preparar as imagens."));
    });
    void this.database.catch(() => {});
  }
  private async transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.database;
    return new Promise((resolve, reject) => {
      const tx = db.transaction("assets", mode);
      const request = operation(tx.objectStore("assets"));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = tx.onabort = () => reject(new Error("Não foi possível salvar a imagem neste navegador. A imagem anterior foi mantida."));
    });
  }
  get(scope: string, ref: AvatarRef) { return this.transaction<AvatarAsset | undefined>("readonly", store => store.get(`${scope}${ref.id}:${ref.revision}`)); }
  put(asset: AvatarAsset) { return this.transaction("readwrite", store => store.put(asset)); }
  list(scope: string) { return this.transaction<AvatarAsset[]>("readonly", store => store.index("scope").getAll(scope)); }
}
