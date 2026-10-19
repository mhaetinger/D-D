/** Os módulos de regras não dependem de DOM, rede nem armazenamento. */
export type Sheet = Record<string, any>;
export type Engine = Record<string, any>;
export const norm = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const mod = (score: number) => Math.floor((score - 10) / 2);
export const ability = (c: Sheet, key: string) => mod(Number(c.abilities?.[key]?.score ?? 10));
export const level = (c: Sheet, id: string) => Number(c.classes?.find((x: Sheet) => x.classId === id)?.level || 0);
export const proficiency = (c: Sheet) => 2 + Math.floor((c.classes.reduce((n: number, x: Sheet) => n + x.level, 0) - 1) / 4);
export function subclass(c: Sheet, id: string, E: Engine) {
  const entry = c.classes?.find((x: Sheet) => x.classId === id);
  return entry ? entry.subclassId || E.inferSubclass(entry) || '' : '';
}
export const selections = (c: Sheet, E: Engine, key: string) => E.selections(c, null, key) || [];
export function active(c: Sheet, id: string) { return !!c.ruleState?.active?.[id]; }
export function state(c: Sheet) {
  c.ruleState ||= { version:1, used:{}, active:{}, pools:{}, portent:[], targets:{} };
  for (const key of ['used','active','pools','targets']) c.ruleState[key] ||= {};
  c.ruleState.portent ||= [];
  return c.ruleState;
}
export const escape = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]!));
