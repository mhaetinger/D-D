const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
/** Objetos de importações são dados, nunca marcação. Campos repetidos saem uma vez. */
export function readableText(value: unknown, depth = 0): string {
  if (depth > 12 || value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(x => readableText(x, depth + 1)).filter(Boolean).join('\n');
  if (!object(value)) return String(value).replace(/\[object Object\]/g, '').trim();
  const names = ['title','name','label'], bodies = ['text','description','notes','value'];
  const title = names.map(k => readableText(value[k], depth + 1)).find(Boolean);
  const body = [...new Set(bodies.map(k => readableText(value[k], depth + 1)).filter(x => x && x !== title))].join('\n');
  if (title || body) return [title,body].filter(Boolean).join(': ');
  return Object.entries(value).map(([k,v]) => `${k}: ${readableText(v,depth + 1)}`).join('\n');
}
export function normalizeCharacterText<T extends Record<string, any>>(c: T): T {
  let changed = false;
  const result = {...c};
  const fields = ['features'];
  for (const field of fields) if (Array.isArray(c[field])) {
    const values = c[field].map((x: unknown) => readableText(x) || 'Anotação antiga sem texto recuperável; consulte a cópia original.');
    if (JSON.stringify(values) !== JSON.stringify(c[field])) {
      (result as any)[field] = values; changed = true;
    }
  }
  // Uma string já perdida não contém o objeto original: preservar o material
  // de entrada permite recuperação externa sem inventar uma descrição.
  if (changed) (result as any).textRecovery = c.textRecovery || { features:c.features };
  return changed ? result : c;
}
