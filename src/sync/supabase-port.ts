import { isCloudDocument } from './cloud-policy';
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
  private async pages(columns:string,keys?:string[]):Promise<unknown[]> {
    const result: unknown[] = [];
    // PostgREST limita a página. Uma conta com muitas fichas/notas nunca pode
    // interpretar uma resposta truncada como exclusão dos documentos restantes.
    for (let offset = 0; ;) {
      let query=this.client.from("critcall_documents").select(columns,{count:"exact"}).eq("owner_id",this.owner);
      if(keys)query=query.in('document_key',keys);
      const {data,error,count}=await query.order("document_key").range(offset,offset+499);
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error("Resposta inválida");
      result.push(...data);
      if (count !== null && result.length >= count) return result;
      if (!data.length) { if (count !== null && result.length < count) throw new Error("Resposta incompleta"); return result; }
      if (count === null && data.length < 500) return result;
      offset += data.length;
    }
  }
  async pull(knownRevisions:Record<string,number> = {}): Promise<RemoteDocument[]> {
    const columns="key:document_key,kind,id:document_id,value,revision,edited_at,updated_at,operation_id";
    // Mesmo o primeiro acesso consulta o índice antes dos conteúdos: históricos
    // antigos da nuvem ficam preservados, sem baixar seus vários megabytes.
    const manifest=await this.pages('key:document_key,kind,id:document_id,revision') as {key:string;kind:RemoteDocument['kind'];id:string;revision:number}[];
    if(manifest.some(doc=>typeof doc.key!=='string' || !doc.key || !Number.isSafeInteger(doc.revision) || doc.revision<1))throw new Error('Revisões remotas inválidas; cache preservado.');
    const changed=[...new Set(manifest.filter(doc=>isCloudDocument(doc) && knownRevisions[doc.key]!==doc.revision).map(doc=>doc.key))];
    const result:RemoteDocument[]=[];
    // Lotes pequenos evitam URLs longas. Ausência no índice não é exclusão;
    // exclusões continuam sendo documentos nulos com sua própria revisão.
    for(let start=0;start<changed.length;start+=25)result.push(...await this.pages(columns,changed.slice(start,start+25)) as RemoteDocument[]);
    return result;
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
  async versionPolicy():Promise<string> {
    const {data,error}=await this.client.rpc('critcall_version_policy',{p_owner_id:this.owner});
    if(error||data?.version!==1)return 'A política de retenção limitada ainda não foi confirmada neste servidor.';
    return `Até ${data.per_document} versões por documento, por ${data.days} dias; até ${data.per_account} versões e ${data.bytes/1048576} MiB por conta. A limpeza ocorre ao sincronizar. O estado atual é preservado. O histórico de desfazer fica neste aparelho.`;
  }
}
