import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { parseAuthConfig, type AuthConfig } from "./config";
import { selectCharacterWorkspace } from "../storage/character-store";
import type { WorkspaceIdentity, StoragePort } from "../storage/account-scope";

export interface AccountIdentity extends WorkspaceIdentity { email: string }
export class AccountSession extends EventTarget {
  client: SupabaseClient | null = null;
  identity: AccountIdentity | null = null;
  offline = false;
  recovery = false;
  persistent = true;
  message = "";
  private revision = 0;
  private verificationKey = "";
  private starting = true;
  private storage: StoragePort | null = null;
  private storageKey = "";
  constructor(readonly config: AuthConfig | null) { super(); }
  private emit() { this.dispatchEvent(new Event("change")); }
  private accept(user: User | null, offline = false) {
    this.identity = user && this.config ? { project: this.config.url, userId: user.id, email: user.email || "" } : null;
    this.offline = offline;
    this.emit();
  }
  async start() {
    if (!this.config) return;
    // A raiz e index.html precisam compartilhar o verificador PKCE e a sessão.
    const scope = new URL("./", document.baseURI).pathname;
    const storageKey = this.storageKey = `dnd_auth_v1:${encodeURIComponent(this.config.url)}:${encodeURIComponent(scope)}`;
    this.verificationKey = storageKey + ":verified";
    const memory = new Map<string, string>();
    try {
      const probe = storageKey + ":probe";
      localStorage.setItem(probe, "1"); localStorage.removeItem(probe);
    } catch { this.persistent = false; }
    this.storage = {
      getItem: (key) => this.persistent ? localStorage.getItem(key) : memory.get(key) ?? null,
      setItem: (key, value) => { if (this.persistent) localStorage.setItem(key, value); else memory.set(key, value); },
      removeItem: (key) => { if (this.persistent) localStorage.removeItem(key); else memory.delete(key); },
    };
    this.client = createClient(this.config.url, this.config.publishableKey, {
      auth: {
        flowType: "pkce", storageKey, persistSession: true, autoRefreshToken: navigator.onLine,
        storage: this.storage,
      },
      global: { fetch: (input, options) => fetch(input, {
        ...options,
        signal: options?.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
      }) },
    });
    // A consulta assíncrona fica fora do callback do SDK: ele mantém seu lock
    // durante os eventos. A revisão descarta respostas de uma sessão já trocada.
    this.client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") this.recovery = true;
      if (event === "SIGNED_OUT") {
        this.revision++;
        this.recovery = false;
        try { localStorage.removeItem(this.verificationKey); } catch { /* A sessão em memória também é encerrada. */ }
        this.accept(null);
      } else if (event !== "INITIAL_SESSION" && !this.starting) {
        setTimeout(() => { void this.validate(); }, 0);
      }
    });
    if (navigator.onLine) { await this.client.auth.initialize(); await this.validate(); }
    else this.restoreOffline();
    this.starting = false;
    window.addEventListener("online", () => { void this.client!.auth.startAutoRefresh(); void this.validate(); });
    window.addEventListener("offline", () => { void this.client!.auth.stopAutoRefresh(); this.offline = true; this.emit(); });
  }
  private restoreOffline() {
    try {
      const saved = JSON.parse(this.storage!.getItem(this.verificationKey) || "null");
      if (saved && typeof saved.userId === "string" && typeof saved.email === "string" && this.storage!.getItem(this.storageKey)) {
        // Este registro só escolhe a cópia local previamente validada. Não é
        // autorização para consultar o serviço; o servidor exige uma sessão válida.
        this.identity = { project: this.config!.url, userId: saved.userId, email: saved.email };
        this.offline = true; this.emit(); return;
      }
    } catch { /* Sem cópia conhecida, mantém o modo local sem tocar nas contas. */ }
    this.accept(null, true);
  }
  async validate() {
    if (!this.client) return;
    if (!navigator.onLine) { this.restoreOffline(); return; }
    const revision = ++this.revision;
    const { data: cached, error: sessionError } = await this.client.auth.getSession();
    if (revision !== this.revision) return;
    if (!cached.session) {
      if (sessionError) this.message = "O link de acesso não pôde ser validado. Solicite um novo link ou entre novamente.";
      this.accept(null);
      return;
    }
    const { data, error } = await this.client.auth.getUser();
    if (revision !== this.revision) return;
    if (data.user) {
      this.message = "";
      try { this.storage!.setItem(this.verificationKey, JSON.stringify({ userId: data.user.id, email: data.user.email || "" })); } catch { /* Sem persistência, a conta fica apenas nesta aba. */ }
      this.accept(data.user);
    } else if (!navigator.onLine || error && (!error.status || error.status >= 500)) {
      let verified = false;
      try { verified = JSON.parse(this.storage!.getItem(this.verificationKey) || "null")?.userId === cached.session.user.id; } catch { /* Não reabre outra identidade sem validação. */ }
      if (verified) this.accept(cached.session.user, true);
      else { this.message = "Conecte-se à internet para validar sua conta. Suas fichas locais foram preservadas."; this.accept(null); }
    } else {
      await this.client.auth.signOut({ scope: "local" });
      if (revision === this.revision) this.accept(null);
    }
  }
  async signOut() {
    if (!this.client || !this.storage) return;
    if (navigator.onLine) {
      const { error } = await this.client.auth.signOut({ scope: "local" });
      if (error) throw error;
    } else {
      // Sem rede não há revogação remota. Remove apenas a sessão deste app e
      // usa a saída pública do SDK sem token, preservando fichas e demais apps.
      await this.client.auth.stopAutoRefresh();
      this.storage.removeItem(this.storageKey);
      this.storage.removeItem(this.storageKey + "-code-verifier");
      const { error } = await this.client.auth.signOut({ scope: "local" });
      if (error) throw error;
    }
    this.storage.removeItem(this.verificationKey);
    this.revision++;
    this.recovery = false;
    this.accept(null);
  }
}

export async function initializeAccount() {
  let account: AccountSession;
  try { account = new AccountSession(parseAuthConfig(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)); }
  catch { account = new AccountSession(null); account.message = "O login ainda não foi configurado corretamente. O modo local continua disponível."; }
  try { await account.start(); }
  catch { account.message = "Não foi possível iniciar o login. O modo local continua disponível."; }
  selectCharacterWorkspace(account.identity);
  return account;
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === "invalid_credentials") return "E-mail ou senha inválidos.";
  if (code === "email_not_confirmed") return "Confirme seu e-mail antes de entrar. Você pode solicitar outra mensagem abaixo.";
  if (code === "weak_password") return "A senha não atende aos requisitos. Use uma senha longa e diferente de outras contas.";
  if (["over_request_rate_limit", "over_email_send_rate_limit", "email_rate_limit_exceeded"].includes(code || "")) return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
  if (code === "otp_expired" || code === "flow_state_expired" || code === "bad_code_verifier") return "O link expirou ou foi aberto em outro navegador. Solicite um novo link e abra-o neste navegador.";
  return "Não foi possível concluir. Confira a conexão e os dados informados e tente novamente.";
}
