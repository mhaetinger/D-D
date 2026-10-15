// Preferências podem falhar sem impedir a consulta da ficha. Notas e personagens
// usam seus próprios caminhos, que informam erros de salvamento ao jogador.
import { workspaceStorage } from "./account-scope";
export const ACTIVE_CHARACTER_KEY = "orbyt_active_character_v1";
const personalKeys = new Set([ACTIVE_CHARACTER_KEY, "dnd_public_player_name"]);

export function readPreference(key: string): string | null {
  try { return (personalKeys.has(key) ? workspaceStorage(() => localStorage) : localStorage).getItem(key); } catch { return null; }
}
export function writePreference(key: string, value: string): boolean {
  try { (personalKeys.has(key) ? workspaceStorage(() => localStorage) : localStorage).setItem(key, value); return true; } catch { return false; }
}
