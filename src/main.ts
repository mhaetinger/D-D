import "@fontsource/cinzel/latin-600.css";
import "@fontsource/cinzel/latin-700.css";
import "@fontsource/cinzel/latin-800.css";
import "@fontsource/crimson-pro/latin-400.css";
import "@fontsource/crimson-pro/latin-600.css";
import "@fontsource/crimson-pro/latin-700.css";
import "@fontsource/crimson-pro/latin-400-italic.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "./styles/tailwind.css";
import "./styles/sheet.css";
import "./app/icons";
import { setupBackups } from "./storage/backup-ui";
import { registerOffline } from "./pwa/register";
import { initializeAccount } from "./auth/session";
import { setupAccountUI } from "./auth/ui";

// A identidade define o armazenamento antes da primeira leitura da ficha.
async function start() {
  const account = await initializeAccount();
  await import("./app/sheet.js");
  setupBackups();
  setupAccountUI(account);
  registerOffline();
}
void start();
