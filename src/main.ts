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
import "./styles/access.css";
import "./app/icons";
import "./wizard/bridge";
import "./styles/wizard-guide.css";
import "./styles/rules.css";
import "./styles/import-review.css";
import { initializeRules } from "./rules/bridge";
import { setupBackups } from "./storage/backup-ui";
import { registerOffline } from "./pwa/register";
import { initializeAccount } from "./auth/session";
import { setupAccountUI } from "./auth/ui";
import { initializeSync } from "./sync/controller";
import { setupAvatars } from "./media/ui";
import { setupBookAppearance } from "./app/book-appearance";

// A identidade define o armazenamento antes da primeira leitura da ficha.
async function start() {
  const account = await initializeAccount();
  await initializeSync(account);
  initializeRules();
  await import("./app/sheet.js");
  setupBackups();
  setupAccountUI(account);
  setupAvatars(account);
  setupBookAppearance();
  registerOffline();
}
void start();
