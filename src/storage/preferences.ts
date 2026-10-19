// Preferências podem falhar sem impedir a consulta da ficha. Notas e personagens
// usam seus próprios caminhos, que informam erros de salvamento ao jogador.
import { workspaceStorage } from "./account-scope";
import { announceStorageChange, announcePreferenceResult } from "./mutations";
import { legacyKeyFor, migrateStorage } from "./legacy";
export const ACTIVE_CHARACTER_KEY = "critcall_active_character_v1";
export const PERSONAL_KEYS = [ACTIVE_CHARACTER_KEY, "dnd_public_player_name", "dnd_profile_avatar", "dnd_sheet_theme", "dnd_backdrop_style", "dnd_font_scale", "dnd_dice_mode", "dnd_dice_tray_dimensions", "dnd_dice_tray_position", "dnd_dice_tray_minimized", "dnd_history_v1"];
const personalKeys = new Set(PERSONAL_KEYS);

export function readPreference(key: string): string | null {
  try {
    const port = personalKeys.has(key) ? workspaceStorage(() => localStorage) : localStorage;
    if (key===ACTIVE_CHARACTER_KEY) {
      // Falta de espaço para copiar não impede consultar a escolha original.
      try { migrateStorage(port); } catch { /* Originais permanecem legíveis. */ }
      return port.getItem(key) ?? port.getItem(legacyKeyFor(key));
    }
    const value = port.getItem(key);
    // Preferências visuais antigas continuam como padrão, sem copiar identidade.
    return value ?? (personalKeys.has(key) && ![ACTIVE_CHARACTER_KEY, "dnd_public_player_name", "dnd_profile_avatar", "dnd_history_v1"].includes(key) ? localStorage.getItem(key) : null);
  } catch { return null; }
}
export function writePreference(key: string, value: string): boolean {
  try {
    const port = personalKeys.has(key) ? workspaceStorage(() => localStorage) : localStorage;
    if (port.getItem(key) === value) { announcePreferenceResult(key, true); return true; }
    port.setItem(key, value);
    announceStorageChange();
    announcePreferenceResult(key, true);
    return true;
  } catch { announcePreferenceResult(key, false); return false; }
}
