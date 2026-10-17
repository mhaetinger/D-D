import { currentWorkspaceKey } from "../storage/account-scope";
export const DRAFT_KEY = "critcall_creation_draft_v1";
export interface SavedDraft {
  draft: any;
  step: number;
  open?: boolean;
}
function normalizeDraft(data: any): SavedDraft | null {
  const d = data?.draft,
    s = d?.setup;
  const object = (value: any) =>
    value && typeof value === "object" && !Array.isArray(value);
  if (!d || d.mode !== "create" || d.char !== null || !object(s)) return null;
  d.answers = object(d.answers) ? d.answers : {};
  d.classId =
    typeof d.classId === "string"
      ? d.classId
      : typeof s.classId === "string"
        ? s.classId
        : "";
  s.name = typeof s.name === "string" ? s.name : "";
  s.raceId = typeof s.raceId === "string" ? s.raceId : "";
  s.backgroundId = typeof s.backgroundId === "string" ? s.backgroundId : "";
  s.abilityMethod = ["standard", "pointBuy", "rolled"].includes(s.abilityMethod)
    ? s.abilityMethod
    : "standard";
  s.baseScores = object(s.baseScores) ? s.baseScores : {};
  s.assignment = object(s.assignment) ? s.assignment : {};
  s.rolls =
    Array.isArray(s.rolls) &&
    s.rolls.every(
      (g: any) =>
        Array.isArray(g) &&
        g.length === 4 &&
        g.every((n: any) => Number.isInteger(n) && n >= 1 && n <= 6),
    )
      ? s.rolls
      : [];
  const step =
    Number.isInteger(data.step) && data.step >= 0 && data.step <= 6
      ? data.step
      : 0;
  return { draft: d, step, open: Boolean(data.open) };
}
const memory = new Map<string, SavedDraft>();
const blocked = new Set<string>();
export function loadDraft(scope = currentWorkspaceKey()): SavedDraft | null {
  if (memory.has(scope)) return structuredClone(memory.get(scope)!);
  try {
    let raw = localStorage.getItem(scope + DRAFT_KEY);
    if (!raw) {
      const queueKey = scope + "critcall_queued_creation_drafts_v1";
      const queue = JSON.parse(localStorage.getItem(queueKey) || "[]");
      if (queue.length) {
        raw = JSON.stringify(queue[0]);
        localStorage.setItem(scope + DRAFT_KEY, raw!);
        localStorage.setItem(queueKey, JSON.stringify(queue.slice(1)));
      }
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const normalized = normalizeDraft(parsed);
    if (!normalized) throw new Error("Rascunho inválido");
    memory.set(scope, normalized);
    return structuredClone(normalized);
  } catch {
    blocked.add(scope);
    return null;
  }
}
export function saveDraft(draft: any, step: number, open = true) {
  if (draft?.mode !== "create") return true;
  const scope = currentWorkspaceKey(),
    data = structuredClone({ draft, step, open });
  memory.set(scope, data);
  if (blocked.has(scope)) return false; // Nunca substitui um rascunho ilegível sem descarte explícito.
  try {
    localStorage.setItem(scope + DRAFT_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
export function clearDraft() {
  const scope = currentWorkspaceKey();
  memory.delete(scope);
  blocked.delete(scope);
  try {
    localStorage.removeItem(scope + DRAFT_KEY);
  } catch {
    /* A ficha concluída continua salva. */
  }
}
