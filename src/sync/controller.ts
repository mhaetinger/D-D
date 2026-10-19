import type { AccountSession } from "../auth/session";
import { currentWorkspaceKey, workspaceKey, workspaceStorage } from "../storage/account-scope";
import { storageMutations, announceStorageChange } from "../storage/mutations";
import { sheetStore } from "../storage/character-store";
import { currentStorageKey, migrateStorage } from "../storage/legacy";
import { BrowserJournal } from "./journal";
import { SyncEngine } from "./engine";
import { SupabaseDocuments } from "./supabase-port";
import { readDocuments, projectDocuments, validateDocument, documentKey } from "./documents";

type Host = Window & {
  hasOpenAccountEditor?: () => boolean;
  refreshSyncedWorkspace?: () => void;
  confirmDestructiveAction: (title: string, description: string, label: string) => Promise<boolean>;
};
const host = window as unknown as Host;

export async function initializeSync(account: AccountSession) {
  let engine: SyncEngine | null = null, remote: SupabaseDocuments | null = null;
  let scope = "", timer: ReturnType<typeof setTimeout> | undefined, generation = 0, projecting = false;
  let journal: BrowserJournal;
  const failedPreferences = new Map<string, Set<string>>();
  let observedStore = sheetStore;
  const label = () => document.getElementById("syncStatus")!;
  const update = () => {
    const unsaved = ["write", "unavailable"].includes(sheetStore.issue?.kind || "") || sheetStore.hasPendingNotes || !!failedPreferences.get(currentWorkspaceKey())?.size;
    label().textContent = unsaved ? "Há alterações que não foram salvas neste dispositivo. Preserve um backup e os textos pendentes antes de fechar."
      : engine ? !navigator.onLine ? "Offline · alterações neste dispositivo, aguardando conexão." : engine.status
      : "Sem login · dados salvos somente neste navegador.";
    document.getElementById("syncNow")!.hidden = !engine;
    document.getElementById("syncVersions")!.hidden = !engine;
  };
  observedStore.addEventListener("change", update);
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const own = engine;
      if (navigator.onLine) void own?.run().then(() => {
        if (own === engine && own.pending && own.status.startsWith("Alterações salvas")) schedule();
      });
      else update();
    }, 600);
  };
  async function bind() {
    const next = workspaceKey(account.identity);
    if (currentWorkspaceKey() !== next || !account.client) return;
    if (next === scope && engine) { schedule(); return; }
    generation++;
    const versionsDialog = document.getElementById("syncVersionsDialog") as HTMLDialogElement;
    if (versionsDialog.open) versionsDialog.close();
    document.getElementById("syncVersionsList")!.replaceChildren();
    const ownGeneration = generation;
    if (engine) engine.stopped = true;
    engine = null; remote = null; scope = next;
    if (!next || !account.identity) { update(); return; }
    const identity = account.identity;
    const port = workspaceStorage(() => localStorage, next);
    const read = () => {
      const sourceKeys = Object.keys(localStorage).filter(key=>key.startsWith(next)).map(key=>key.slice(next.length));
      migrateStorage(port,sourceKeys);
      const keys = sourceKeys.map(currentStorageKey).filter(key=>key.startsWith('critcall_recovery_v1'));
      return readDocuments(port, keys);
    };
    remote = new SupabaseDocuments(account.client, identity.userId);
    const own = engine = new SyncEngine(next, journal, remote, {
      read,
      apply: docs => { projecting = true; try { projectDocuments(port, docs); host.refreshSyncedWorkspace?.(); } finally { projecting = false; } },
      canApply: () => ownGeneration === generation && currentWorkspaceKey() === next && !host.hasOpenAccountEditor?.()
        && !document.activeElement?.matches("input:focus, textarea:focus, [contenteditable=true]:focus"),
    });
    own.addEventListener("change", update);
    try {
      await own.capture(true);
      if (navigator.onLine && !account.offline) await own.run();
      else await own.applyLatest();
    } catch { /* O mecanismo mantém o aviso de armazenamento sem apagar caches. */ }
    if (ownGeneration === generation) update();
  }
  try { journal = new BrowserJournal(); await bind(); }
  catch { label().textContent = "Fila offline indisponível. Seus dados locais foram preservados; baixe um backup."; }
  storageMutations.addEventListener("write", event => {
    if ((event as CustomEvent).detail !== scope || !engine || projecting) return;
    void engine.capture().then(schedule).catch(update);
  });
  storageMutations.addEventListener("preference-write", event => {
    const { scope: changedScope, key, saved } = (event as CustomEvent).detail;
    if (!failedPreferences.has(changedScope)) failedPreferences.set(changedScope, new Set());
    if (saved) failedPreferences.get(changedScope)!.delete(key); else failedPreferences.get(changedScope)!.add(key);
    update();
  });
  account.addEventListener("change", () => { void bind(); });
  window.addEventListener("dnd-workspace-changed", () => {
    observedStore.removeEventListener("change", update); observedStore = sheetStore; observedStore.addEventListener("change", update);
    void bind();
  });
  window.addEventListener("online", schedule);
  window.addEventListener("offline", update);
  window.addEventListener("focus", schedule);
  document.addEventListener("focusout", () => { if (engine?.deferred) schedule(); });
  window.addEventListener("storage", event => {
    if (scope && event.key?.startsWith(scope)) schedule();
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) schedule(); });
  setInterval(() => { if (navigator.onLine && !document.hidden) schedule(); }, 30000);
  document.getElementById("syncNow")!.addEventListener("click", () => { void engine?.capture().then(schedule).catch(update); });

  const dialog = document.getElementById("syncVersionsDialog") as HTMLDialogElement;
  const list = document.getElementById("syncVersionsList")!;
  const status = document.getElementById("syncVersionsStatus")!;
  let offset = 0;
  document.getElementById("syncVersionsClose")!.addEventListener("click", () => dialog.close());
  async function loadVersions() {
    const selected = remote, selectedScope = scope;
    if (!selected || !navigator.onLine) { status.textContent = "Conecte-se e entre na conta para consultar as versões."; return; }
    try {
      const versions = await selected.versions(offset);
      if (selectedScope !== scope || selected !== remote) return;
      for (const version of versions) {
        const row = document.createElement("div"); row.className = "t-inset p-2 rounded text-xs space-y-1";
        row.dataset.versionId = version.version_id;
        const text = document.createElement("p"); text.className = "break-words";
        const kind = ({ character: "Ficha", note: "Anotação pessoal", preference: "Perfil/preferência/histórico", recovery: "Recuperação" } as Record<string, string>)[version.kind] || "Documento";
        const date = Date.parse(version.edited_at) === 0 ? "data original não registrada" : new Date(version.edited_at).toLocaleString();
        text.textContent = `${kind}${version.name ? `: ${version.name}` : ""} · ${date}${version.conflict ? " · edição simultânea preservada" : ""}`;
        const restore = document.createElement("button"); restore.className = "underline"; restore.textContent = "Restaurar esta versão";
        restore.addEventListener("click", async () => {
          if (selected !== remote || selectedScope !== currentWorkspaceKey()) return;
          if (host.hasOpenAccountEditor?.()) { status.textContent = "Termine a edição antes de restaurar uma versão."; return; }
          dialog.close();
          if (!await host.confirmDestructiveAction("Restaurar versão?", "A versão atual ficará no histórico da nuvem. Esta versão será registrada como uma nova alteração.", "Restaurar")) return;
          if (selected !== remote || selectedScope !== currentWorkspaceKey()) return;
          try {
            const doc = validateDocument(await selected.version(version.version_id));
            if (selected !== remote || selectedScope !== currentWorkspaceKey()) return;
            if (host.hasOpenAccountEditor?.()) throw new Error("Uma edição foi aberta durante a consulta");
            const port = workspaceStorage(() => localStorage, selectedScope);
            const docs = readDocuments(port); docs[documentKey(doc.kind, doc.id)] = doc;
            projectDocuments(port, docs); host.refreshSyncedWorkspace?.();
            announceStorageChange(selectedScope);
            schedule();
          } catch { label().textContent = "Não foi possível restaurar a versão. Os dados atuais foram preservados."; }
        });
        row.append(text, restore); list.append(row);
      }
      offset += versions.length;
      document.getElementById("syncVersionsMore")!.hidden = selected.versionsTotal !== null ? offset >= selected.versionsTotal : versions.length < 50;
      status.textContent = offset ? "Versões privadas desta conta. Anotações ficam separadas das fichas." : "Ainda não há versões salvas na nuvem.";
    } catch { status.textContent = "Não foi possível consultar as versões. Confira a conexão e a configuração do Supabase."; }
  }
  document.getElementById("syncVersions")!.addEventListener("click", () => { list.replaceChildren(); offset = 0; dialog.showModal(); void loadVersions(); });
  document.getElementById("syncVersionsMore")!.addEventListener("click", () => { void loadVersions(); });
  update();
}
