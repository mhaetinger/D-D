import type { SupabaseClient } from "@supabase/supabase-js";
import type { Pending, RemoteDocument } from "./journal";
import type { PushResult, RemotePort } from "./engine";

export class SupabaseDocuments implements RemotePort {
  versionsTotal: number | null = null;
  constructor(private client: SupabaseClient, readonly owner: string) {}
  async clock() {
    const { data, error } = await this.client.rpc("critcall_sync_clock", { p_owner_id: this.owner });
    if (error) throw error;
    if (typeof data !== "string") throw new Error("Relógio remoto inválido");
    return data;
  }
  async pull(): Promise<RemoteDocument[]> {
    const result: RemoteDocument[] = [];
    // PostgREST limita a página. Uma conta com muitas fichas/notas nunca pode
    // interpretar uma resposta truncada como exclusão dos documentos restantes.
    for (let offset = 0; ;) {
      const { data, error, count } = await this.client.from("critcall_documents")
        .select("key:document_key,kind,id:document_id,value,revision,edited_at,updated_at,operation_id", { count: "exact" })
        .eq("owner_id", this.owner).order("document_key").range(offset, offset + 499);
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error("Resposta inválida");
      result.push(...data as RemoteDocument[]);
      if (count !== null && result.length >= count) return result;
      if (!data.length) { if (count !== null && result.length < count) throw new Error("Resposta incompleta"); return result; }
      if (count === null && data.length < 500) return result;
      offset += data.length;
    }
  }
  async push(op: Pending): Promise<PushResult> {
    const { data, error } = await this.client.rpc("critcall_save_document", {
      p_owner_id: this.owner, p_key: op.key, p_kind: op.kind, p_id: op.id, p_value: op.value,
      p_base_revision: op.baseRevision, p_operation_id: op.operationId, p_edited_at: op.editedAt,
    });
    if (error) throw error;
    if (!data?.document || typeof data.conflict !== "boolean") throw new Error("Confirmação inválida");
    return data as PushResult;
  }
  async versions(offset = 0) {
    const { data, error, count } = await this.client.from("critcall_versions")
      .select("version_id,kind,document_id,edited_at,received_at,conflict,name:value->>name", { count: "exact" })
      .eq("owner_id", this.owner).order("received_at", { ascending: false }).order("version_id").range(offset, offset + 49);
    if (error) throw error;
    this.versionsTotal = count;
    return data || [];
  }
  async version(id: string) {
    const { data, error } = await this.client.from("critcall_versions").select("kind,id:document_id,value")
      .eq("owner_id", this.owner).eq("version_id", id).single();
    if (error) throw error;
    return data;
  }
}
