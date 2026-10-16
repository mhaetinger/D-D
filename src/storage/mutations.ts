import { currentWorkspaceKey } from "./account-scope";

/** O espaço é capturado na escrita; uma resposta antiga nunca migra de conta. */
export const storageMutations = new EventTarget();
export function announceStorageChange(scope = currentWorkspaceKey()) {
  storageMutations.dispatchEvent(new CustomEvent("write", { detail: scope }));
}
export function announcePreferenceResult(key: string, saved: boolean) {
  storageMutations.dispatchEvent(new CustomEvent("preference-write", { detail: { scope: currentWorkspaceKey(), key, saved } }));
}
