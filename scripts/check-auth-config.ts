import { loadEnv } from "vite";
import { resolveAuthConfig } from "../src/auth/config";
const env = loadEnv(process.argv[2] || "production", process.cwd(), "VITE_");
const config = resolveAuthConfig(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, env.VITE_AUTH_ENABLED);
console.log(config ? "Login: configuração pública validada." : "Login: sem projeto configurado; modo local preservado.");
