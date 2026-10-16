import { publicProject } from "./public-project";

export interface AuthConfig { url: string; publishableKey: string }

/** Somente a URL e a chave pública entram no navegador; segredos abortam o build. */
export function parseAuthConfig(urlValue: unknown, keyValue: unknown): AuthConfig | null {
  const urlText = typeof urlValue === "string" ? urlValue.trim() : "";
  const key = typeof keyValue === "string" ? keyValue.trim() : "";
  if (!urlText && !key) return null;
  if (!urlText || !key) throw new Error("Configure a URL e a chave publicável do Supabase juntas.");
  let url: URL;
  try { url = new URL(urlText); } catch { throw new Error("URL pública do Supabase inválida."); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Use a origem HTTPS do projeto Supabase, sem caminhos ou credenciais.");
  }
  // Projetos anteriores também podem usar a chave anon. O payload é inspecionado
  // apenas para recusar uma configuração privilegiada, nunca para autenticar alguém.
  let anonymous = false;
  try { anonymous = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role === "anon"; } catch { /* Não é uma chave anon legada. */ }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key) && !anonymous) {
    throw new Error("Use somente a chave publicável ou anon. Chaves secretas/service_role não podem ir ao site.");
  }
  return { url: url.origin, publishableKey: key };
}

/** O projeto público acompanha o build. Um override precisa conter o par completo. */
export function resolveAuthConfig(urlValue?: unknown, keyValue?: unknown, enabledValue?: unknown): AuthConfig | null {
  const enabled = enabledValue === undefined ? "" : typeof enabledValue === "string" ? enabledValue.trim() : "invalid";
  if (!["", "true", "false"].includes(enabled)) throw new Error("VITE_AUTH_ENABLED deve ser true ou false.");
  // Validar ambos mesmo com login desligado impede um segredo de passar pelo
  // build por estar em uma configuração aparentemente inativa.
  const bundled = parseAuthConfig(publicProject.url, publicProject.publishableKey);
  const override = parseAuthConfig(urlValue, keyValue);
  return enabled === "false" ? null : override || bundled;
}
