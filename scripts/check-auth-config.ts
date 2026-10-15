import { loadEnv } from "vite";
import { parseAuthConfig } from "../src/auth/config";
const env = loadEnv(process.argv[2] || "production", process.cwd(), "VITE_");
const config = parseAuthConfig(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
console.log(config ? "Login: configuração pública validada." : "Login: sem projeto configurado; modo local preservado.");
