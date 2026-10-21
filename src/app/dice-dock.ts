import { currentWorkspaceKey } from "../storage/account-scope";
import { readPreference, writePreference } from "../storage/preferences";
import {updateDiceDockAppearance} from './dice-dock-appearance';

export function setupDiceDock(roll: () => void, toggle: () => void) {
  const tray = document.getElementById("dice3dTray")!;
  const dock = document.getElementById("diceDock") as HTMLButtonElement;
  const value = document.getElementById("diceDockValue")!;
  let position: { x: number; y: number } | null = null;
  let suppressClick = false, endDrag = () => {};
  let motion: Animation | undefined;
  const stopMotion = () => { motion?.cancel(); motion = undefined; };
  function transition(update: () => void) {
    const before = tray.getBoundingClientRect();
    stopMotion();
    update();
    const after = tray.getBoundingClientRect();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !after.width || !before.width) return;
    const closed = tray.dataset.minimized === "true";
    const hex = "polygon(50% 0%, 96% 24%, 96% 76%, 50% 100%, 4% 76%, 4% 24%)";
    const box = "polygon(0% 0%, 100% 0%, 100% 100%, 50% 100%, 0% 100%, 0% 0%)";
    // O retângulo anterior vira a nova forma sem mover a posição salva do dado.
    // Cancelar antes de uma nova transição permite inverter cliques rápidos.
    motion = tray.animate([
      { transform: `translate(${before.x - after.x}px, ${before.y - after.y}px) scale(${before.width / after.width}, ${before.height / after.height})`, clipPath: closed ? box : hex },
      { transform: "none", clipPath: closed ? hex : box },
    ], { duration: 260, easing: "cubic-bezier(.2,.75,.25,1)" });
    tray.style.transformOrigin = "0 0";
  }
  const resultKey = () => `critcall-dice-result:${currentWorkspaceKey()}`;
  function restore() {
    stopMotion();
    endDrag();
    position = null;
    try {
      const saved = JSON.parse(readPreference("dnd_dice_tray_position") || "null");
      if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) position = { x: Math.max(0, Math.min(1, saved.x)), y: Math.max(0, Math.min(1, saved.y)) };
    } catch { /* Um posicionamento ilegível não afeta a ficha. */ }
    let result = "20";
    try { const saved = sessionStorage.getItem(resultKey()); if (saved !== null && /^-?\d{1,10}$/.test(saved)) result = saved; } catch { /* A rolagem funciona sem persistência. */ }
    display(result);
  }
  function display(result: string) {
    value.textContent = result;
    value.style.fontSize = result.length > 6 ? ".6rem" : result.length > 4 ? ".9rem" : "1.45rem";
    document.getElementById("diceTrayTotal")!.textContent = result;
    updateDiceDockAppearance();
  }
  function reflow() {
    if (!tray.offsetWidth || !tray.offsetHeight) return;
    const x = position?.x ?? 0, y = position?.y ?? 1;
    tray.style.left = `${12 + x * Math.max(0, innerWidth - tray.offsetWidth - 24)}px`;
    tray.style.top = `${12 + y * Math.max(0, innerHeight - tray.offsetHeight - 24)}px`;
    tray.style.bottom = "auto";
  }
  function moveTo(x: number, y: number) {
    position = {
      x: Math.max(0, Math.min(1, (x - 12) / Math.max(1, innerWidth - tray.offsetWidth - 24))),
      y: Math.max(0, Math.min(1, (y - 12) / Math.max(1, innerHeight - tray.offsetHeight - 24))),
    };
    reflow();
  }
  function persist() { if (position) writePreference("dnd_dice_tray_position", JSON.stringify(position)); }
  dock.addEventListener("click", () => { if (!suppressClick) toggle(); });
  dock.addEventListener("keydown", event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.toLowerCase() === "r" && !event.repeat) { event.preventDefault(); roll(); }
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const rect = tray.getBoundingClientRect();
    moveTo(rect.x + (event.key === "ArrowRight" ? 20 : event.key === "ArrowLeft" ? -20 : 0), rect.y + (event.key === "ArrowDown" ? 20 : event.key === "ArrowUp" ? -20 : 0));
    persist();
  });
  for (const handle of [dock, document.getElementById("diceTrayDrag")!]) handle.addEventListener("pointerdown", event => {
    const first = event as PointerEvent;
    if (first.button !== 0 || !first.isPrimary) return;
    stopMotion();
    endDrag();
    const rect = tray.getBoundingClientRect();
    const samples = [{ x: first.clientX, y: first.clientY, time: first.timeStamp }];
    let moved = false;
    handle.setPointerCapture(first.pointerId);
    const move = (event: Event) => {
      const e = event as PointerEvent;
      if (e.pointerId !== first.pointerId) return;
      if (Math.hypot(e.clientX - first.clientX, e.clientY - first.clientY) > 8) moved = true;
      if (!moved) return;
      tray.dataset.dragging = "true";
      moveTo(rect.x + e.clientX - first.clientX, rect.y + e.clientY - first.clientY);
      samples.push({ x: e.clientX, y: e.clientY, time: e.timeStamp });
      while (samples.length > 2 && e.timeStamp - samples[0].time > 120) samples.shift();
    };
    const cleanup = () => {
      handle.removeEventListener("pointermove", move);
      for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) handle.removeEventListener(type, finish);
      delete tray.dataset.dragging;
      if (handle.hasPointerCapture(first.pointerId)) handle.releasePointerCapture(first.pointerId);
      endDrag = () => {};
    };
    const finish = (event: Event) => {
      const e = event as PointerEvent;
      if (e.pointerId !== first.pointerId) return;
      cleanup();
      if (!moved) return;
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
      persist();
      const sample = samples[0], elapsed = Math.max(1, e.timeStamp - sample.time);
      const speed = Math.hypot(e.clientX - sample.x, e.clientY - sample.y) / elapsed;
      // Distância e velocidade juntas distinguem arremesso de clique/arraste.
      if (handle === dock && e.type === "pointerup" && Math.hypot(e.clientX - first.clientX, e.clientY - first.clientY) >= 48 && speed >= .85) roll();
    };
    endDrag = cleanup;
    handle.addEventListener("pointermove", move);
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) handle.addEventListener(type, finish);
  });
  restore();
  window.addEventListener("dnd-workspace-changed", () => { restore(); reflow(); });
  window.addEventListener("resize", () => { stopMotion(); reflow(); });
  new ResizeObserver(reflow).observe(tray);
  return { reflow, transition, result: (total: number) => {
    display(String(total));
    try { sessionStorage.setItem(resultKey(), String(total)); } catch { /* O resultado continua visível. */ }
  } };
}
