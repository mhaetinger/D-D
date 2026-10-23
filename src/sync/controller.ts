import { isCloudDocument } from './cloud-policy';
import { prepareManualImages, completeManualImages } from './manual-images';
import type { AccountSession } from "../auth/session";
import { currentWorkspaceKey, workspaceKey, workspaceStorage } from "../storage/account-scope";
import { storageMutations, announceStorageChange } from "../storage/mutations";
import { sheetStore } from "../storage/character-store";
import { currentStorageKey, migrateStorage } from "../storage/legacy";
import { isCharacterHistoryKey } from '../storage/character-history';
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
  let scope = "", generation = 0, projecting = false, manualBusy = false;
  let journal: BrowserJournal;
  const failedPreferences = new Map<string, Set<string>>();
  let observedStore = sheetStore;
  const label = () => document.getElementById("syncStatus")!;
  const update = () => {
    const unsaved = ["write", "unavailable"].includes(sheetStore.issue?.kind || "") || sheetStore.hasPendingNotes || !!failedPreferences.get(currentWorkspaceKey())?.size;
    label().textContent = unsaved ? "Há alterações que não foram salvas neste dispositivo. Preserve um backup e os textos pendentes antes de fechar."
      : engine ? !navigator.onLine ? "Offline · dados neste aparelho. Sincronize pelo botão quando conectar." : engine.status
      : "Sem login · dados salvos somente neste navegador.";
    document.getElementById("syncNow")!.hidden = !engine;
    document.getElementById("syncManualHelp")!.hidden = !engine;
    document.getElementById("syncVersions")!.hidden = !engine;
  };
  observedStore.addEventListener("change", update);
  // Foco, reconexão e alterações só atualizam o armazenamento local. A rede
  // depende exclusivamente do botão; nenhuma tentativa fica agendada depois.
  const applyLocal = () => {
    const own = engine;
    if (!own) return;
    void own.capture().then(() => own.applyLatest()).then(() => {
      if (!own.deferred && own.status.startsWith('Atualizações recebidas.')) own.status = 'Atualização da nuvem carregada neste aparelho.';
      update();
    }).catch(update);
  };
  async function bind() {
    const next = workspaceKey(account.identity);
    if (currentWorkspaceKey() !== next || !account.client) return;
    if (next === scope && engine) { update(); return; }
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
      const keys = sourceKeys.map(currentStorageKey).filter(key=>key.startsWith('critcall_recovery_v1') || isCharacterHistoryKey(key));
      return readDocuments(port, keys, false);
    };
    remote = new SupabaseDocuments(account.client, identity.userId);
    const own = engine = new SyncEngine(next, journal, remote, {
      read,
      apply: docs => { projecting = true; try { projectDocuments(port, docs); host.refreshSyncedWorkspace?.(); } finally { projecting = false; } },
      canApply: () => ownGeneration === generation && currentWorkspaceKey() === next && !host.hasOpenAccountEditor?.()
        && !document.activeElement?.matches("input:focus, textarea:focus, [contenteditable=true]:focus"),
    }, {manual:true,shouldSync:isCloudDocument});
    own.addEventListener("change", update);
    try {
      await own.capture(true);
      await own.applyLatest();
    } catch { /* O mecanismo mantém o aviso de armazenamento sem apagar caches. */ }
    if (ownGeneration === generation) update();
  }
  try { journal = new BrowserJournal(); await bind(); }
  catch { label().textContent = "Fila offline indisponível. Seus dados locais foram preservados; baixe um backup."; }
  storageMutations.addEventListener("write", event => {
    if ((event as CustomEvent).detail !== scope || !engine || projecting) return;
    void engine.capture().then(update).catch(update);
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
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  document.addEventListener("focusout", () => { if (engine?.deferred) applyLocal(); });
  window.addEventListener("storage", event => { if (scope && event.key?.startsWith(scope)) applyLocal(); });
  const syncButton = document.getElementById("syncNow") as HTMLButtonElement;
  syncButton.addEventListener("click", () => {
    const own = engine, selectedScope = scope;
    if (!own || manualBusy) return;
    if (!navigator.onLine || account.offline) { label().textContent = 'Sem conexão. Os dados continuam neste aparelho; conecte-se e use o botão para sincronizar.'; return; }
    manualBusy = true; syncButton.disabled = true; syncButton.textContent = 'Sincronizando…';
    void (async () => {
      try {
        await prepareManualImages(selectedScope);
        if (own !== engine || selectedScope !== currentWorkspaceKey()) return;
        await own.capture(); await own.run();
        if (own === engine && selectedScope === currentWorkspaceKey()) completeManualImages(selectedScope);
      } catch {
        if (own === engine) own.status = 'Não foi possível concluir a sincronização. Dados e imagens locais preservados; tente novamente pelo botão.';
      } finally {
        manualBusy = false; syncButton.disabled = false; syncButton.textContent = 'Sincronizar com a nuvem'; update();
      }
    })();
  });

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
          if (!await host.confirmDestructiveAction("Restaurar versão?", "Esta versão será registrada como uma nova alteração. Baixe um backup antes se precisar conservar o estado atual por prazo indeterminado.", "Restaurar")) return;
          if (selected !== remote || selectedScope !== currentWorkspaceKey()) return;
          try {
            const doc = validateDocument(await selected.version(version.version_id));
            if (selected !== remote || selectedScope !== currentWorkspaceKey()) return;
            if (host.hasOpenAccountEditor?.()) throw new Error("Uma edição foi aberta durante a consulta");
            const port = workspaceStorage(() => localStorage, selectedScope);
            const docs = readDocuments(port); docs[documentKey(doc.kind, doc.id)] = doc;
            projectDocuments(port, docs); host.refreshSyncedWorkspace?.();
            announceStorageChange(selectedScope);
            applyLocal();
          } catch { label().textContent = "Não foi possível restaurar a versão. Os dados atuais foram preservados."; }
        });
        row.append(text, restore); list.append(row);
      }
      offset += versions.length;
      document.getElementById("syncVersionsMore")!.hidden = selected.versionsTotal !== null ? offset >= selected.versionsTotal : versions.length < 50;
      status.textContent = offset ? "Versões privadas desta conta. Anotações ficam separadas das fichas." : "Ainda não há versões salvas na nuvem.";
    } catch { status.textContent = "Não foi possível consultar as versões. Confira a conexão e a configuração do Supabase."; }
  }
  document.getElementById("syncVersions")!.addEventListener("click", () => {
    list.replaceChildren();offset=0;dialog.showModal();void loadVersions();
    const selected=remote,selectedScope=scope,policy=document.getElementById('syncVersionsPolicy')!;policy.textContent='Conferindo limite de versões…';
    void selected?.versionPolicy().then(text=>{if(selected===remote&&selectedScope===scope)policy.textContent=text;}).catch(()=>{if(selected===remote&&selectedScope===scope)policy.textContent='Não foi possível conferir o limite de versões.';});
  });
  document.getElementById("syncVersionsMore")!.addEventListener("click", () => { void loadVersions(); });
  update();
}
