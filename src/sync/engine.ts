import { canonical, compatibleDocuments, documentKey, validateDocument, type Documents, type DocumentValue } from "./documents";
import type { JournalPort, Pending, RemoteDocument } from "./journal";

export interface PushResult { document: RemoteDocument; conflict: boolean; server_time: string }
export interface RemotePort {
  clock?(): Promise<string>;
  pull(knownRevisions?: Record<string,number>): Promise<RemoteDocument[]>;
  push(operation: Pending): Promise<PushResult>;
}
export interface SyncView {
  read(): Documents;
  apply(documents: Documents): void;
  canApply(): boolean;
}
export interface SyncOptions {
  manual?: boolean;
  shouldSync?: (document: DocumentValue) => boolean;
}
/** A fila é persistida antes da rede. Respostas não removem operações posteriores. */
export class SyncEngine extends EventTarget {
  status = "Preparando salvamento…";
  conflicts = 0;
  pending = 0;
  deferred = false;
  stopped = false;
  private queue: Promise<unknown> = Promise.resolve();
  private running: Promise<void> | null = null;
  private observed: Documents | null = null;
  private recaptureAfterFailure = false;
  constructor(readonly scope: string, private journal: JournalPort, private remote: RemotePort, private view: SyncView, private options: SyncOptions = {}) { super(); }
  private includes = (doc: DocumentValue) => this.options.shouldSync?.(doc) ?? true;
  private visible(docs: Documents): Documents { return Object.fromEntries(Object.entries(docs).filter(([, doc]) => this.includes(doc))); }
  private countPending(operations: Pending[]) { return operations.filter(this.includes).length; }
  private pendingStatus() { return this.options.manual ? "Salvo neste aparelho · há alterações para sincronizar com a nuvem pelo botão." : "Alterações salvas neste dispositivo, aguardando envio."; }
  private emit() { this.dispatchEvent(new Event("change")); }
  capture(initial = false) {
    let snapshot: Documents;
    try { snapshot = this.visible(this.view.read()); }
    catch { this.status = "Há dados locais ilegíveis. Foram preservados; confira o backup antes de sincronizar."; this.emit(); return Promise.resolve(); }
    const before = this.observed;
    this.observed = snapshot;
    const capturedAt = Date.now();
    const work = this.queue.catch(() => {}).then(() => this.journal.change(this.scope, state => {
      // Uma transação recusada não pode virar referência da próxima tentativa.
      // Fora da recuperação, mantém a observação feita no instante da captura
      // para não interpretar uma projeção remota posterior como edição local.
      const baseline = this.recaptureAfterFailure ? state.projected : before ?? state.projected;
      const keys = new Set([...Object.keys(snapshot), ...(!initial ? Object.keys(baseline) : [])]);
      for (const key of keys) {
        const previous = baseline[key];
        if (previous && !this.includes(previous)) continue;
        const doc = snapshot[key] ?? (previous && { ...previous, value: null });
        if (!doc || canonical(doc) === canonical(previous)) continue;
        const latest = state.pending.filter(op => op.key === key).at(-1);
        if (canonical(doc.value) === canonical(latest ? latest.value : state.remote[key]?.value)) continue;
        state.pending.push({ ...doc, key, operationId: crypto.randomUUID(), parentId: latest?.operationId ?? state.remote[key]?.operation_id ?? null,
          baseRevision: state.remote[key]?.revision ?? 0,
          clockOffset: state.offset, uncalibrated: !state.clockKnown && !(initial && !previous && !state.remote[key]),
          // O cache anterior à sincronização não tem data de edição confiável.
          // Preserva-o no histórico sem fazê-lo vencer uma versão remota datada.
          editedAt: initial && !previous && !state.remote[key] ? "1970-01-01T00:00:00.000Z" : new Date(capturedAt + state.offset).toISOString() });
      }
      // A projeção antiga pode conter a única cópia de um histórico. Conservá-la
      // não o torna elegível para upload nem para substituir o histórico local.
      state.projected = { ...Object.fromEntries(Object.entries(state.projected).filter(([, doc]) => !this.includes(doc))), ...snapshot };
      this.pending = this.countPending(state.pending);
      if (this.pending) this.status = this.pendingStatus();
      else if (this.options.manual) this.status = "Salvo neste aparelho · nuvem manual. Use o botão para carregar ou enviar suas fichas.";
      this.emit();
    })).then(() => { this.recaptureAfterFailure = false; })
      .catch(() => { this.recaptureAfterFailure = true; this.status = "A fila offline não pôde ser salva. Os dados locais foram mantidos; baixe um backup antes de fechar."; this.emit(); throw new Error("Fila indisponível"); });
    this.queue = work;
    return work;
  }
  async run() {
    if (this.stopped) return;
    if (this.running) return this.running;
    this.running = this.synchronize().finally(() => { this.running = null; });
    return this.running;
  }
  private async synchronize() {
    try {
      await this.queue;
      if (this.stopped) return;
      this.status = "Sincronizando…"; this.emit();
      if (this.remote.clock) {
        const clock = Date.parse(await this.remote.clock());
        if (!Number.isFinite(clock)) throw new Error("Relógio remoto inválido");
        await this.journal.change(this.scope, state => {
          state.offset = clock - Date.now(); state.clockKnown = true;
          for (const op of state.pending) if (op.uncalibrated && this.includes(op)) {
            op.editedAt = new Date(Date.parse(op.editedAt) + state.offset - op.clockOffset).toISOString();
            op.clockOffset = state.offset; op.uncalibrated = false;
          }
        });
      }
      const operations = await this.journal.change(this.scope, state => structuredClone(state.pending.filter(this.includes)));
      // Consolida somente as operações já capturadas, por documento. Alterações
      // que chegarem durante a requisição continuam na fila, com sua própria data.
      const keys = [...new Set(operations.map(op => op.key))];
      let rejected: unknown = null;
      for (const key of keys) {
        if (this.stopped) return;
        try {
          const group = operations.filter(op => op.key === key);
          const latest = { ...group.at(-1)!, baseRevision: group[0].baseRevision };
          const response = await this.remote.push(latest);
          const doc = this.checkRemote(response.document);
          if (doc.key !== key) throw new Error("Resposta de outro documento");
          await this.journal.change(this.scope, state => {
            const sent = new Set(group.map(op => op.operationId));
            state.pending = state.pending.filter(op => !sent.has(op.operationId));
            for (const op of state.pending) if (op.key === key && op.parentId && sent.has(op.parentId)) op.baseRevision = doc.revision;
            if (!state.remote[key] || state.remote[key].revision <= doc.revision) state.remote[key] = doc;
            const serverNow = Date.parse(response.server_time);
            if (Number.isFinite(serverNow)) state.offset = serverNow - Date.now();
            this.pending = this.countPending(state.pending);
          });
          if (response.conflict) this.conflicts++;
        } catch (error) {
          if ((error as { code?: string }).code === "42501") throw error;
          // Um histórico grande ou item recusado não impede salvar as demais
          // fichas/notas. A operação problemática continua integralmente na fila.
          rejected ??= error;
        }
      }
      if (this.stopped) return;
      // O diário já conserva os conteúdos. Consultas periódicas só precisam
      // baixar valores cuja revisão mudou, inclusive exclusões por tombstone.
      const knownRevisions=await this.journal.change(this.scope,state=>Object.fromEntries(Object.entries(state.remote).map(([key,doc])=>[key,doc.revision])));
      const received = (await this.remote.pull(knownRevisions)).filter(this.includes).map(doc => this.checkRemote(doc));
      await this.journal.change(this.scope, state => {
        for (const doc of received) if (!state.remote[doc.key] || state.remote[doc.key].revision <= doc.revision) state.remote[doc.key] = doc;
      });
      await this.queue;
      await this.applyLatest();
      if (rejected) throw rejected;
      this.status = this.deferred ? "Atualizações recebidas. Termine a edição para carregá-las."
        : this.pending ? this.pendingStatus()
        : this.conflicts ? "Sincronizado. Versões simultâneas preservadas no histórico da nuvem." : "Salvo no Supabase · atualizado neste dispositivo.";
    } catch (error) {
      const code = (error as { code?: string }).code;
      this.status = code === "PGRST202" || code === "42P01" || code === "PGRST205"
        ? "Nuvem ainda não configurada. Alterações mantidas neste dispositivo, aguardando envio."
        : code === "22008" ? "Confira a data e a hora do dispositivo. A fila local foi preservada."
        : code === "42501" || code === "P0001" ? "Não foi possível autorizar o salvamento. Entre novamente; a fila local foi preservada."
        : this.options.manual ? "Sem confirmação da nuvem. Alterações locais preservadas; tente novamente pelo botão." : "Sem confirmação do Supabase. Alterações locais preservadas; o envio será tentado novamente.";
    }
    this.emit();
  }
  private checkRemote(doc: RemoteDocument) {
    validateDocument(doc);
    if (doc.key !== documentKey(doc.kind, doc.id) || !Number.isSafeInteger(doc.revision) || doc.revision < 1 || !Number.isFinite(Date.parse(doc.edited_at))) throw new Error("Versão remota inválida");
    return doc;
  }
  async applyLatest() {
    if (this.stopped) return;
    await this.journal.change(this.scope, state => {
      const docs: Documents = Object.fromEntries(Object.values(state.remote).filter(this.includes).map(d => [d.key, { kind: d.kind, id: d.id, value: d.value }]));
      for (const op of state.pending.filter(this.includes)) docs[op.key] = { kind: op.kind, id: op.id, value: op.value };
      // Se a interface escreveu enquanto aguardávamos o IndexedDB, primeiro
      // captura essa edição. Nunca projeta uma resposta sobre uma escrita nova.
      const current = this.visible(this.view.read());
      const visible = Object.fromEntries(Object.entries(compatibleDocuments(docs)).filter(([, doc]) => doc.value !== null));
      if (canonical(current) !== canonical(this.visible(state.projected)) || canonical(visible) !== canonical(current) && !this.view.canApply()) { this.deferred = true; return; }
      if (canonical(visible) !== canonical(current)) this.view.apply(docs);
      state.projected = { ...Object.fromEntries(Object.entries(state.projected).filter(([, doc]) => !this.includes(doc))), ...this.visible(this.view.read()) };
      this.observed = this.visible(state.projected);
      this.pending = this.countPending(state.pending);
      this.deferred = false;
    });
  }
}
