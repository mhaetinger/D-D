import type { AccountSession } from './session';
import { CharacterStore, SHEET_KEY, NOTES_KEY, sheetStore } from '../storage/character-store';
import { workspaceStorage, workspaceKey, currentWorkspaceKey } from '../storage/account-scope';
import { announceStorageChange } from '../storage/mutations';
import { validateCharacters } from '../storage/validation';
import { AvatarCache } from '../media/avatar-cache';
import { isAvatarRef } from '../media/avatar';
import { DRAFT_KEY, loadDraft } from '../wizard/draft-store';
import { SupabaseDocuments } from '../sync/supabase-port';

const INTENT = 'critcall_guest_import_intent_v1';
const RECEIPTS = 'critcall_guest_import_receipts_v1';
const DECLINED = 'critcall_guest_import_declined_v1';
const host = window as any;
interface Receipt { state: 'pending' | 'done' | 'declined'; ids: Record<string, string>; avatars?: Record<string, string> }
export function setupGuestImport(account: AccountSession) {
  const region = document.createElement('div'); region.className = 'text-sm space-y-2'; region.hidden = true;
  const status = document.createElement('p'); status.setAttribute('role', 'status'); status.id = 'guestImportStatus';
  const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'underline'; retry.textContent = 'Retomar fichas sem conta';
  region.append(status, retry); document.getElementById('workspaceDescription')!.after(region);
  let running = false;
  const report = (text: string, canRetry = false) => { region.hidden = false; status.textContent = text; retry.hidden = !canRetry; host.showToast?.(text); };
  function begin(email: string) {
    // A intenção precede a requisição de login e sobrevive ao link de confirmação.
    // Não autoriza a conta: só getUser/RLS definem a identidade de destino.
    if (!currentWorkspaceKey() && (sheetStore.issue || sheetStore.hasPendingNotes)) return 'Há alterações locais que ainda não puderam ser salvas. Volte à sua ficha e preserve um backup antes de trocar de espaço; confira a permissão e o espaço do navegador.';
    try { localStorage.setItem(INTENT, email.trim().toLowerCase()); return ''; }
    catch { return 'Não foi possível preparar a vinculação. Confira a permissão de armazenamento; suas fichas sem conta foram mantidas.'; }
  }
  async function attempt() {
    if (running || !account.identity || account.recovery || account.offline || !navigator.onLine || !account.client || currentWorkspaceKey() !== workspaceKey(account.identity)) return;
    const identity = { ...account.identity }, scope = workspaceKey(identity);
    if (localStorage.getItem(INTENT) !== identity.email?.toLowerCase()) return;
    const valid = () => !account.recovery && !account.offline && account.identity?.userId === identity.userId && currentWorkspaceKey() === scope;
    running = true;
    try {
      // A trava cobre consulta, confirmação e escrita, evitando cópias simultâneas em duas abas.
      if (!navigator.locks) throw new Error('Abra em um navegador com armazenamento e conexão segura para vincular as fichas.');
      await navigator.locks.request('critcall-guest-import:' + scope, async () => {
        if (!valid()) return;
        const port = workspaceStorage(() => localStorage, scope);
        const declined = () => {
          // Preferência por conta/navegador: editar fichas, notas ou rascunho
          // depois da recusa não deve reabrir a pergunta pelo novo fingerprint.
          port.setItem(DECLINED, '1');
          report('As fichas sem conta continuam neste navegador. Você pode retomar pelo perfil quando quiser.', true);
        };
        if (port.getItem(DECLINED) === '1') {
          region.hidden=false;status.textContent='Você optou por manter as fichas sem conta neste navegador.';retry.hidden=false;
          return; // Sem diálogo ou toast a cada recarga; só o lembrete no perfil.
        }
        const source = new CharacterStore(() => localStorage), sourceCharacters = source.read();
        if (source.issue) throw new Error(source.issue.message);
        const draft = loadDraft('');
        if (!sourceCharacters.length && !draft) return;
        const target = new CharacterStore(() => port, scope), current = target.read();
        if (target.issue) throw new Error(target.issue.message);
        if (host.hasOpenAccountEditor?.() || sheetStore.issue || sheetStore.hasPendingNotes) throw new Error('Termine ou salve a edição aberta e retome a vinculação no perfil. Os originais locais foram mantidos.');
        let backup = source.backup(sourceCharacters, true);
        let fingerprint = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ characters: sourceCharacters, notes: backup.privateNotes, draft }))))].map(n => n.toString(16).padStart(2, '0')).join('');
        const receipts: Record<string, Receipt> = JSON.parse(port.getItem(RECEIPTS) || '{}');
        let receipt = receipts[fingerprint];
        if (sourceCharacters.length === 1 && (receipt?.state === 'done' || receipt?.state === 'declined')) return;
        // O digest é assíncrono: outra edição/confirmação pode ter aberto.
        // Diálogo ocupado não é uma recusa do usuário a ser lembrada.
        if (!valid()) return;
        if (host.hasOpenAccountEditor?.()) throw new Error('Termine ou salve a edição aberta e retome a vinculação no perfil. Os originais locais foram mantidos.');
        // Uma cópia já concluída não consulta a nuvem novamente a cada login.
        const remote = await new SupabaseDocuments(account.client!, identity.userId).pull();
        if (!valid()) return;
        if (host.hasOpenAccountEditor?.()) throw new Error('Termine a edição e retome a vinculação no perfil.');
        const existing = current.length > 0 || remote.some(d => d.kind === 'character' && d.value !== null);
        let characters = sourceCharacters;
        if (sourceCharacters.length > 1) {
          const chooser = document.createElement('fieldset'); chooser.className = 'space-y-2';
          const legend = document.createElement('legend'); legend.className = 'font-bold'; legend.textContent = 'Fichas a vincular'; chooser.append(legend);
          for (const character of sourceCharacters) {
            const label = document.createElement('label'); label.className = 'flex items-center gap-2';
            const input = document.createElement('input'); input.type = 'checkbox'; input.checked = character.name === 'Kael'; input.value = character.id; input.setAttribute('data-guest-character', character.id);
            if (!sourceCharacters.some(other => other.name === 'Kael')) input.checked = true;
            const text = document.createElement('span'); text.textContent = character.name || 'Ficha sem nome';
            label.append(input, text); chooser.append(label);
          }
          const accepted = await host.confirmDestructiveAction(existing ? 'Salvar uma ficha sem conta?' : 'Escolha a ficha para sua conta', `${existing ? 'Esta conta já tem fichas. ' : ''}Selecione as fichas que devem receber cópias${draft ? ' e o rascunho em andamento' : ''}. Os originais continuam no espaço sem conta.`, existing ? 'Salvar selecionadas' : 'Vincular selecionadas', chooser, {cancelLabel:'Não quero'});
          if (!valid()) return;
          const selectedIds = [...chooser.querySelectorAll<HTMLInputElement>('[data-guest-character]:checked')].map(input => input.value);
          characters = sourceCharacters.filter(character => selectedIds.includes(character.id));
          if (!accepted || !characters.length) {
            declined(); return;
          }
        } else if (existing) {
          const accepted = await host.confirmDestructiveAction('Salvar o que você fez sem conta?', `Esta conta já tem fichas. Adicionar ${characters.length} ficha(s)${draft ? ' e o rascunho em andamento' : ''} como novas, junto das anotações e imagens? Os originais continuam no espaço sem conta.`, 'Salvar como novas', null, {cancelLabel:'Não quero'});
          if (!valid()) return;
          if (!accepted) { declined(); return; }
        }
        backup = source.backup(characters, true);
        fingerprint = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ characters, notes: backup.privateNotes, draft }))))].map(n => n.toString(16).padStart(2, '0')).join('');
        receipt = receipts[fingerprint];
        if (receipt?.state === 'done' || receipt?.state === 'declined') return;
        if (!receipt) {
          receipt = receipts[fingerprint] = { state:'pending', ids:Object.fromEntries(characters.map(c => [c.id, 'char_' + crypto.randomUUID()])) };
          // IDs duráveis antes de qualquer cópia: repetir após falha não duplica personagens.
          port.setItem(RECEIPTS, JSON.stringify(receipts));
        }
        const assets = new AvatarCache();
        const profile = JSON.parse(localStorage.getItem('dnd_profile_avatar') || 'null');
        const refs = [...characters.map(c => c.avatar), profile].filter(isAvatarRef);
        receipt.avatars ||= {};
        for (const ref of refs) receipt.avatars[`${ref.id}:${ref.revision}`] ||= crypto.randomUUID();
        port.setItem(RECEIPTS, JSON.stringify(receipts));
        for (const ref of refs) {
          const asset = await assets.get('', ref);
          if (!asset) throw new Error('Uma imagem local não está disponível. As fichas originais foram mantidas; tente novamente após recuperar a imagem.');
          const id = receipt.avatars[`${ref.id}:${ref.revision}`];
          await assets.put({ ...asset, id, scope, key:`${scope}${id}:${ref.revision}`, pending:true });
        }
        if (!valid()) return;
        if (host.hasOpenAccountEditor?.() || sheetStore.issue || sheetStore.hasPendingNotes) throw new Error('Termine ou salve a edição aberta e retome a vinculação no perfil. Os originais locais foram mantidos.');
        // Nenhum await entre releitura e escrita: a sincronização não intercala a coleção.
        const latest = target.read(); if (target.issue) throw new Error("Não foi possível reler as fichas da conta. Os originais foram preservados.");
        const copies = structuredClone(characters).filter(c => !latest.some(existing => existing.id === receipt.ids[c.id]));
        const notes = target.notes();
        for (const copy of copies) {
          const old = copy.id; copy.id = receipt.ids[old];
          if (isAvatarRef(copy.avatar)) copy.avatar = { ...copy.avatar, id:receipt.avatars[`${copy.avatar.id}:${copy.avatar.revision}`] };
          if (backup.privateNotes?.[old] !== undefined) notes[copy.id] = backup.privateNotes[old];
        }
        const combined = validateCharacters([...latest, ...copies]);
        const writes = new Map<string, string>([[NOTES_KEY, JSON.stringify(notes)]]);
        if (draft) {
          if (!port.getItem(DRAFT_KEY)) writes.set(DRAFT_KEY, JSON.stringify(draft));
          else {
            const queueKey = 'critcall_queued_creation_drafts_v1';
            const queue = JSON.parse(port.getItem(queueKey) || '[]');
            if (!queue.some((item: any) => item.fingerprint === fingerprint)) queue.push({ ...draft, fingerprint });
            writes.set(queueKey, JSON.stringify(queue));
          }
        }
        if (!latest.length && !remote.some(d => d.kind === 'character' && d.value !== null)) {
          for (const key of ['dnd_public_player_name', 'dnd_profile_avatar', 'dnd_sheet_theme', 'dnd_backdrop_style', 'dnd_font_scale']) {
            const value = key === 'dnd_profile_avatar' && isAvatarRef(profile) ? JSON.stringify({ ...profile, id:receipt.avatars[`${profile.id}:${profile.revision}`] }) : localStorage.getItem(key);
            if (value !== null && port.getItem(key) === null && !remote.some(d => d.kind === 'preference' && d.id === key && d.value !== null)) writes.set(key, value);
          }
        }
        writes.set(SHEET_KEY, JSON.stringify({schemaVersion:1, characters:combined}));
        receipts[fingerprint].state = 'done'; writes.set(RECEIPTS, JSON.stringify(receipts));
        const previous = new Map([...writes.keys()].map(key => [key, port.getItem(key)]));
        try { for (const [key, value] of writes) port.setItem(key, value); }
        catch (error) { for (const [key, value] of previous) { try { value === null ? port.removeItem(key) : port.setItem(key, value); } catch { /* Fonte e IDs da tentativa permanecem preservados. */ } } throw error; }
        host.refreshSyncedWorkspace?.(); announceStorageChange(scope);
        window.dispatchEvent(new Event('critcall-avatars-imported'));
        report(`${characters.length} ficha(s) vinculada(s) à conta${draft ? ', com o rascunho disponível em + Novo' : ''}. Use Sincronizar com a nuvem para enviar. Os originais locais foram mantidos.`);
      });
    } catch (error) { if (valid()) report(error instanceof Error ? error.message : 'Não foi possível vincular agora. As fichas locais foram mantidas.', true); }
    finally { running = false; }
  }
  retry.addEventListener('click', () => {
    if (!account.identity) return;
    try {
      const port = workspaceStorage(() => localStorage, workspaceKey(account.identity));
      port.removeItem(DECLINED); // Somente a ação explícita no perfil reabre a oferta.
      const receipts = JSON.parse(port.getItem(RECEIPTS) || '{}');
      for (const key of Object.keys(receipts)) if (receipts[key].state === 'declined') delete receipts[key];
      port.setItem(RECEIPTS, JSON.stringify(receipts));
      const issue = begin(account.identity.email || '');
      if (issue) report(issue, true); else void attempt();
    } catch { report('Não foi possível preparar a nova tentativa. O espaço sem conta foi preservado.', true); }
  });
  account.addEventListener('change', () => { region.hidden = true; void attempt(); });
  window.addEventListener('online', () => { void attempt(); });
  window.addEventListener('dnd-workspace-changed', () => { void attempt(); });
  void attempt();
  return { begin, attempt };
}
