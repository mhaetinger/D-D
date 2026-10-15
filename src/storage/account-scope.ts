export type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export interface WorkspaceIdentity { project: string; userId: string }
let identity: WorkspaceIdentity | null = null;

export function workspaceKey(value: WorkspaceIdentity | null): string {
  return value ? `orbyt_account_v1:${encodeURIComponent(value.project)}:${encodeURIComponent(value.userId)}:` : "";
}
export function currentWorkspaceKey() { return workspaceKey(identity); }
export function selectWorkspace(value: WorkspaceIdentity | null) { identity = value; }

/** Captura o espaço no momento da criação: uma operação antiga nunca grava na conta nova. */
export function workspaceStorage(storage: () => StoragePort, prefix = currentWorkspaceKey()): StoragePort {
  return {
    getItem: (key) => storage().getItem(prefix + key),
    setItem: (key, value) => storage().setItem(prefix + key, value),
    removeItem: (key) => storage().removeItem(prefix + key),
  };
}
