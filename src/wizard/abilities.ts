export const STANDARD = [15, 14, 13, 12, 10, 8];
export const COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const labels: Record<string, string> = { str: 'Força', dex: 'Destreza', con: 'Constituição', int: 'Inteligência', wis: 'Sabedoria', cha: 'Carisma' };
const hints: Record<string, string> = { str: 'Esforço físico, saltos e ataques corpo a corpo com muitas armas.', dex: 'Agilidade, furtividade, iniciativa e ataques à distância.', con: 'Resistência física, pontos de vida e concentração em magias.', int: 'Raciocínio, memória, investigação e magia dos magos.', wis: 'Atenção, intuição e magia de clérigos, druidas e patrulheiros.', cha: 'Presença, interação social e magia de bardos, bruxos e feiticeiros.' };
export interface AbilitySetup { abilityMethod: string; baseScores: Record<string, number>; assignment: Record<string, string>; rolls: number[][] }
export const totals = (s: AbilitySetup) => s.abilityMethod === 'rolled' ? s.rolls.map(g => g.reduce((a, b) => a + b, 0) - Math.min(...g)) : STANDARD;
export const spent = (s: AbilitySetup) => Object.values(s.baseScores).reduce((sum, n) => sum + (COST[n] ?? 0), 0);
export function adjust(s: AbilitySetup, ability: string, delta: number) {
  if (!(ability in labels) || ![1, -1].includes(delta) || !['pointBuy','adapted'].includes(s.abilityMethod)) return false;
  const value = s.baseScores[ability] ?? 8, next = value + delta;
  if (s.abilityMethod === 'adapted') { if (next<0 || next>30) return false; s.baseScores[ability]=next; return true; }
  if (COST[next] === undefined || spent(s) - COST[value] + COST[next] > 27) return false;
  s.baseScores[ability] = next;
  return true;
}
/** Os índices identificam peças, inclusive resultados rolados iguais. Trocar não duplica. */
export function assign(s: AbilitySetup, index: string, target: string) {
  if (!['standard', 'rolled'].includes(s.abilityMethod) || !(target in labels) || !/^\d+$/.test(index) || totals(s)[+index] === undefined) return false;
  const source = Object.keys(labels).find(k => s.assignment[k] === index);
  const previous = s.assignment[target];
  if (source) { if (previous !== undefined) s.assignment[source] = previous; else delete s.assignment[source]; }
  s.assignment[target] = index;
  for (const k of Object.keys(labels)) {
    const value = totals(s)[+s.assignment[k]];
    if (value === undefined) delete s.baseScores[k]; else s.baseScores[k] = value;
  }
  return true;
}
export function abilityCard(key:string,content:string,showHint=true) {
  return `<section class="cw-ability-card" data-ability-card="${key}"><strong>${labels[key]}</strong>${showHint?`<p class="cw-muted">${hints[key]}</p>`:''}${content}</section>`;
}
export function abilityMarkup() {
  return `<div id="cw-distribution"><p class="cw-ability-status" role="status"></p><div class="cw-token-pool" aria-label="Valores disponíveis"></div><div class="cw-grid">${Object.entries(labels).map(([key, name]) => abilityCard(key,`<div class="cw-stepper"><button type="button" data-adjust="-1" aria-label="Diminuir ${name}">−</button><output data-score></output><button type="button" data-adjust="1" aria-label="Aumentar ${name}">+</button></div><button type="button" class="cw-ability-slot" data-slot="${key}" aria-label="Atribuir valor a ${name}"></button><span class="cw-muted" data-final></span>`)).join('')}</div></div>`;
}
export function bindAbilities(host: HTMLElement, s: AbilitySetup, scores: () => Record<string, number>, save: () => void) {
  const panel = host.querySelector<HTMLElement>('#cw-distribution');
  if (!panel) return;
  let selected: string | null = null;
  const pointBuy = s.abilityMethod === 'pointBuy';
  const adapted = s.abilityMethod === 'adapted', stepping = pointBuy || adapted;
  // Rascunhos anteriores usavam os valores diretamente. Migra sem alterar a distribuição.
  if (!stepping && !Object.keys(s.assignment || {}).length) {
    s.assignment = {};
    const used = new Set<number>();
    for (const key of Object.keys(labels)) {
      const i = totals(s).findIndex((n, i) => n === s.baseScores[key] && !used.has(i));
      if (i >= 0) { s.assignment[key] = String(i); used.add(i); }
    }
  }
  const pool = panel.querySelector<HTMLElement>('.cw-token-pool')!;
  pool.hidden = stepping;
  const tokens = (stepping ? [] : totals(s)).map((n, i) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'cw-ability-token'; button.draggable = true;
    button.dataset.token = String(i); button.textContent = String(n);
    button.setAttribute('aria-label', `Valor ${n}, peça ${i + 1}. Selecione e escolha uma habilidade, ou arraste.`);
    return button;
  });
  function update() {
    const final = scores();
    panel!.querySelector('.cw-ability-status')!.textContent = adapted ? 'Adaptação da mesa: valores livres, sem orçamento de pontos. Confira os limites finais com o Mestre.' : pointBuy
      ? `${27 - spent(s)} pontos disponíveis · ${spent(s)} de 27 usados. De 8 a 13, cada aumento custa 1; de 13 a 15, custa 2.`
      : selected === null ? 'Arraste um valor para uma habilidade, ou clique no valor e depois no destino. Para trocar dois valores, mova um sobre o outro.' : `Peça ${+selected + 1} selecionada: ${totals(s)[+selected]}. Escolha o destino.`;
    // Nós são movidos, não recriados: foco e acessibilidade sobrevivem à distribuição.
    tokens.forEach((token, i) => {
      const owner = Object.keys(labels).find(k => s.assignment[k] === String(i));
      const destination = owner ? panel!.querySelector<HTMLElement>(`[data-ability-card="${owner}"]`)! : pool;
      if (token.parentElement !== destination) destination.insertBefore(token, owner ? destination.querySelector('[data-slot]') : null);
      token.setAttribute('aria-pressed', String(selected === String(i)));
    });
    for (const card of panel!.querySelectorAll<HTMLElement>('[data-ability-card]')) {
      const key = card.dataset.abilityCard!, n = s.baseScores[key];
      card.querySelector<HTMLElement>('.cw-stepper')!.hidden = !stepping;
      card.querySelector<HTMLElement>('[data-score]')!.textContent = String(n ?? '—');
      card.querySelector<HTMLElement>('[data-final]')!.textContent = `Após bônus raciais: ${n === undefined ? '—' : final[key]}`;
      const slot = card.querySelector<HTMLButtonElement>('[data-slot]')!;
      slot.hidden = stepping;
      slot.textContent = n === undefined ? 'Colocar valor aqui' : `Trocar valor de ${labels[key]}`;
      for (const b of card.querySelectorAll<HTMLButtonElement>('[data-adjust]')) {
        const next = n + Number(b.dataset.adjust);
        b.disabled = adapted ? next<0 || next>30 : COST[next] === undefined || spent(s) - COST[n] + COST[next] > 27;
      }
    }
  }
  let suppress = false;
  function place(index: string, target: string) { if (assign(s, index, target)) { selected = null; update(); save(); } }
  panel.addEventListener('click', event => {
    if (suppress) return;
    const el = event.target as HTMLElement, token = el.closest<HTMLElement>('[data-token]');
    if (token) { selected = selected === token.dataset.token ? null : token.dataset.token!; update(); return; }
    const button = el.closest<HTMLElement>('[data-adjust]'), slot = el.closest<HTMLElement>('[data-slot]');
    if (button && adjust(s, button.closest<HTMLElement>('[data-ability-card]')!.dataset.abilityCard!, Number(button.dataset.adjust))) { update(); save(); }
    if (slot && selected !== null) place(selected, slot.dataset.slot!);
  });
  panel.addEventListener('dragstart', event => {
    const token = (event.target as HTMLElement).closest<HTMLElement>('[data-token]');
    if (token) { selected = token.dataset.token!; event.dataTransfer?.setData('text/plain', selected); update(); }
  });
  panel.addEventListener('dragover', event => { if ((event.target as HTMLElement).closest('[data-ability-card]')) event.preventDefault(); });
  panel.addEventListener('drop', event => {
    const card = (event.target as HTMLElement).closest<HTMLElement>('[data-ability-card]');
    if (card && selected !== null) { event.preventDefault(); place(selected, card.dataset.abilityCard!); }
  });
  // Toque não depende do suporte irregular a HTML drag-and-drop em celulares.
  panel.addEventListener('pointerdown', event => {
    const token = (event.target as HTMLElement).closest<HTMLElement>('[data-token]');
    if (!token || event.pointerType === 'mouse' || !event.isPrimary) return;
    const startX = event.clientX, startY = event.clientY; let moved = false;
    token.setPointerCapture(event.pointerId);
    const move = (e: PointerEvent) => { if (Math.hypot(e.clientX - startX, e.clientY - startY) > 8) { moved = true; selected = token.dataset.token!; token.classList.add('cw-dragging'); } };
    const end = (e: PointerEvent) => {
      token.removeEventListener('pointermove', move); token.removeEventListener('pointerup', end); token.removeEventListener('pointercancel', end);
      token.classList.remove('cw-dragging');
      if (moved) {
        suppress = true; setTimeout(() => { suppress = false; }, 0);
        const card = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-ability-card]');
        if (e.type === 'pointerup' && card) place(token.dataset.token!, card.dataset.abilityCard!);
      }
    };
    token.addEventListener('pointermove', move); token.addEventListener('pointerup', end); token.addEventListener('pointercancel', end);
  });
  update();
}
