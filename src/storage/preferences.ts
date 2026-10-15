// Preferências podem falhar sem impedir a consulta da ficha. Notas e personagens
// usam seus próprios caminhos, que informam erros de salvamento ao jogador.
export function readPreference(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function writePreference(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
