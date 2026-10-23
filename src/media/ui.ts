import { registerManualImages } from '../sync/manual-images';
import type { AccountSession } from "../auth/session";
import { currentWorkspaceKey, workspaceKey } from "../storage/account-scope";
import { readPreference, writePreference } from "../storage/preferences";
import { storageMutations } from "../storage/mutations";
import { sheetStore } from "../storage/character-store";
import type { CharacterRecord } from "../storage/validation";
import { AVATAR_BUCKET, AVATAR_BYTES, isAvatarRef, prepareAvatar, type AvatarRef } from "./avatar";
import { AvatarCache, type AvatarAsset } from "./avatar-cache";

type Host = Window & { characters: CharacterRecord[]; recordStepAndSave: (label: string) => void };
const host = window as unknown as Host;
export function setupAvatars(account: AccountSession) {
  const cache = new AvatarCache();
  const dialog = document.getElementById("avatarDialog") as HTMLDialogElement;
  const file = document.getElementById("avatarFile") as HTMLInputElement;
  const status = document.getElementById("avatarStatus")!;
  const profileStatus = document.getElementById("avatarSyncStatus")!;
  const urls = new Map<string, string>(), loading = new Set<string>(), uploads = new Set<string>();
  const failures = new Set<string>();
  let target: { scope: string; characterId: string | null } | null = null, busy = false;
  const profile = (): AvatarRef | null => {
    try { const ref = JSON.parse(readPreference("dnd_profile_avatar") || "null"); return isAvatarRef(ref) ? ref : null; }
    catch { return null; }
  };
  const references = () => [profile(), ...host.characters.map(char => char.avatar)].filter(isAvatarRef);
  const assetKey = (scope: string, ref: AvatarRef) => `${scope}${ref.id}:${ref.revision}`;
  const downloadKeys = new Set<string>(), flushing = new Map<string, Promise<void>>();
  async function flush() {
    const identity = account.identity, scope = currentWorkspaceKey(), client = account.client;
    if (!identity || scope !== workspaceKey(identity) || !client || account.offline || !navigator.onLine) return;
    if (sheetStore.issue) return;
    if (flushing.has(scope)) return flushing.get(scope);
    if (!references().length) return;
    const task = (async () => {
      const selected = new Set(references().map(ref => assetKey(scope, ref)));
      try {
        const pending = (await cache.list(scope)).filter(asset => asset.pending && selected.has(asset.key));
        if (pending.length) profileStatus.textContent = "Enviando imagens…";
        for (const asset of pending) {
          if (currentWorkspaceKey() !== scope || uploads.has(asset.key)) continue;
          uploads.add(asset.key);
          try {
            const { data, error } = await client.storage.from(AVATAR_BUCKET).upload(`${identity.userId}/${asset.id}.webp`, asset.blob, { upsert: true, contentType: "image/webp", cacheControl: "0" });
            if (error || !data?.path) throw error || new Error("Envio não confirmado");
            await cache.put({ ...asset, pending: false });
          } finally { uploads.delete(asset.key); }
        }
        if (currentWorkspaceKey() === scope && pending.length) {
          const assets = await cache.list(scope);
          const live = new Set(references().map(ref => assetKey(scope, ref)));
          const remaining = assets.some(asset => asset.pending && live.has(asset.key));
          if (currentWorkspaceKey() === scope) profileStatus.textContent = remaining ? "Imagem salva neste dispositivo; use Sincronizar com a nuvem." : "Imagens enviadas ao armazenamento privado.";
          if (remaining) throw new Error("Há uma nova imagem pendente. Sincronize novamente pelo botão.");
        }
      } catch (error) {
        if (currentWorkspaceKey() === scope) profileStatus.textContent = "Imagem salva neste dispositivo; envio pendente. Confira a conexão e sincronize pelo botão.";
        throw error;
      }
    })();
    flushing.set(scope, task);
    try { await task; } finally { if (flushing.get(scope) === task) flushing.delete(scope); }
  }
  function refFor(node: HTMLElement): AvatarRef | null {
    if (node.hasAttribute("data-avatar-profile")) return profile();
    const ref = { id: node.dataset.avatarId, revision: node.dataset.avatarRevision };
    return isAvatarRef(ref) ? ref : null;
  }
  async function paint(node: HTMLElement) {
    const scope = currentWorkspaceKey(), ref = refFor(node);
    const identity = account.identity, client = account.client;
    const key = ref ? assetKey(scope, ref) : "";
    if (node.dataset.avatarResolved === key) return;
    if (!ref) {
      node.dataset.avatarResolved = "";
      node.querySelector("img")?.remove();
      node.querySelector("svg")?.removeAttribute("hidden");
      return;
    }
    const apply = (url: string) => {
      if (!node.isConnected || scope !== currentWorkspaceKey() || JSON.stringify(refFor(node)) !== JSON.stringify(ref)) return;
      const img = document.createElement("img"); img.src = url; img.alt = ""; img.width = img.height = 48; img.decoding = "async";
      node.querySelector("img")?.remove();
      node.querySelector("svg")?.setAttribute("hidden", "");
      node.append(img); node.dataset.avatarResolved = key;
    };
    if (urls.has(key)) { apply(urls.get(key)!); return; }
    if (loading.has(key) || failures.has(key)) return;
    loading.add(key);
    try {
      let asset = await cache.get(scope, ref);
      if (scope !== currentWorkspaceKey()) return;
      if (!asset && downloadKeys.has(key) && identity && client && scope === workspaceKey(identity) && navigator.onLine && !account.offline) {
        const { data, error } = await client.storage.from(AVATAR_BUCKET).download(`${identity.userId}/${ref.id}.webp`);
        if (error || !data || data.type !== "image/webp" || data.size > AVATAR_BYTES) throw new Error("Imagem indisponível");
        if (scope !== currentWorkspaceKey()) return;
        asset = { ...ref, key, scope, blob: data, pending: false };
        await cache.put(asset);
      }
      if (asset && scope === currentWorkspaceKey()) { const url = URL.createObjectURL(asset.blob); urls.set(key, url); apply(url); }
      else failures.add(key);
    } catch { failures.add(key); }
    finally { loading.delete(key); }
    refresh();
  }
  const observed = new WeakSet<HTMLElement>();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) void paint(entry.target as HTMLElement);
  });
  let frame = 0;
  function refresh() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      for (const node of document.querySelectorAll<HTMLElement>(".portrait")) {
        if (!observed.has(node)) { observed.add(node); observer.observe(node); }
        const rect = node.getBoundingClientRect();
        if (rect.width && rect.height && rect.bottom > 0 && rect.top < innerHeight) void paint(node);
      }
      document.getElementById("avatarRetry")!.hidden = !account.identity || !references().length;
    });
  }
  const mutations = new MutationObserver(records => {
    for (const record of records) for (const node of record.removedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.matches(".portrait") && !node.isConnected) observer.unobserve(node);
      for (const portrait of node.querySelectorAll(".portrait")) if (!portrait.isConnected) observer.unobserve(portrait);
    }
    if (records.some(record => [...record.addedNodes].some(node => node instanceof HTMLElement && (node.matches(".portrait") || node.querySelector(".portrait"))))) refresh();
  });
  mutations.observe(document.getElementById("sheetApp")!, { subtree: true, childList: true });
  document.addEventListener("click", event => {
    const button = (event.target as Element).closest<HTMLElement>("[data-avatar-edit]");
    if (!button || busy) return;
    target = { scope: currentWorkspaceKey(), characterId: button.dataset.avatarEdit || null };
    document.getElementById("avatarTitle")!.textContent = target.characterId ? "Imagem do personagem" : "Imagem do perfil";
    file.value = ""; status.textContent = ""; dialog.showModal();
  });
  const setBusy = (value: boolean) => {
    busy = value;
    for (const control of dialog.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input,button")) control.disabled = value;
  };
  dialog.addEventListener("cancel", event => { if (busy) event.preventDefault(); });
  document.getElementById("avatarClose")!.addEventListener("click", () => dialog.close());
  document.getElementById("avatarRetry")!.addEventListener("click", () => { (document.getElementById("syncNow") as HTMLButtonElement).click(); });
  file.addEventListener("change", () => {
    const image = file.files?.[0], selection = target;
    if (!image || !selection || busy) return;
    void (async () => {
      setBusy(true); status.textContent = "Reduzindo a imagem…";
      try {
        const blob = await prepareAvatar(image);
        if (currentWorkspaceKey() !== selection.scope) throw new Error("A conta mudou. Escolha a imagem novamente no espaço correto.");
        const char = selection.characterId ? host.characters.find(char => char.id === selection.characterId) : null;
        if (selection.characterId && !char) throw new Error("Esta ficha não está mais disponível.");
        const previous = char ? char.avatar : profile();
        // Cópias importadas podem apontar à mesma imagem. A primeira substituição
        // ganha outro arquivo para não alterar o retrato da ficha original.
        const shared = isAvatarRef(previous) && references().filter(ref => ref.id === previous.id).length > 1;
        const ref = { id: isAvatarRef(previous) && !shared ? previous.id : crypto.randomUUID(), revision: crypto.randomUUID() };
        const asset: AvatarAsset = { ...ref, scope: selection.scope, key: assetKey(selection.scope, ref), blob, pending: !!account.identity };
        await cache.put(asset);
        if (currentWorkspaceKey() !== selection.scope) throw new Error("A conta mudou. A imagem não foi aplicada à outra conta.");
        if (char) {
          char.avatar = ref;
          host.recordStepAndSave("Alterou a imagem do personagem");
          if (sheetStore.issue) throw new Error("A ficha não foi salva neste navegador. Preserve um backup antes de fechar.");
        } else if (!writePreference("dnd_profile_avatar", JSON.stringify(ref))) throw new Error("A imagem não pôde ser associada ao perfil. A anterior foi mantida.");
        status.textContent = `Imagem reduzida para ${Math.ceil(blob.size / 1024)} KB e salva neste dispositivo.${account.identity ? " Confira o envio no perfil." : ""}`;
        profileStatus.textContent = account.identity ? "Imagem salva neste dispositivo; use Sincronizar com a nuvem." : "Imagens salvas somente neste navegador.";
        failures.clear(); refresh();
      } catch (error) { status.textContent = (error as Error).message; }
      finally { setBusy(false); file.value = ""; }
    })();
  });
  window.addEventListener("dnd-workspace-changed", () => {
    dialog.close(); target = null;
    for (const url of urls.values()) URL.revokeObjectURL(url);
    for (const node of document.querySelectorAll<HTMLElement>(".portrait")) {
      node.querySelector("img")?.remove(); delete node.dataset.avatarResolved;
      node.querySelector("svg")?.removeAttribute("hidden");
    }
    urls.clear(); failures.clear(); profileStatus.textContent = "";
    downloadKeys.clear(); refresh();
  });
  storageMutations.addEventListener("write", refresh);
  window.addEventListener("critcall-avatars-imported", () => { failures.clear(); refresh(); });
  account.addEventListener("change", refresh);
  window.addEventListener("online", refresh);
  registerManualImages({
    prepare: async scope => { if (scope === currentWorkspaceKey()) await flush(); },
    complete: scope => {
      if (scope !== currentWorkspaceKey()) return;
      for (const ref of references()) downloadKeys.add(assetKey(scope, ref));
      failures.clear(); refresh();
    },
  });
  refresh();
}
