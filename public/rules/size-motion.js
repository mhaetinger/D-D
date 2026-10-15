// Contrato reutilizável: data-size-motion envolve um único data-size-content
// de altura natural. Animamos somente o invólucro, sem escala ou distorção do texto.
window.SizeMotion = (() => {
  const states = new Map();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let printing = false;
  function watch(element) {
    if (states.has(element)) return states.get(element);
    const content = [...element.children].find((child) =>
      child.hasAttribute("data-size-content"),
    );
    if (!content) return;
    let target = content.getBoundingClientRect().height,
      animation;
    element.style.height = `${target}px`;
    function update(immediate = false) {
      if (!element.isConnected) return;
      const next = content.getBoundingClientRect().height;
      if (!immediate && Math.abs(next - target) < 0.05) return;
      const from = element.getBoundingClientRect().height;
      animation?.cancel();
      animation = undefined;
      delete element.dataset.sizeAnimating;
      target = next;
      element.style.height = `${next}px`;
      // O fundo acompanha a altura intermediária do painel interno no mesmo
      // quadro; iniciar outra animação em cada medida criaria atraso acumulado.
      if (
        immediate ||
        printing ||
        reduced.matches ||
        content.querySelector("[data-size-animating]") ||
        Math.abs(next - from) < 1
      )
        return;
      element.dataset.sizeAnimating = "";
      const movement = element.animate(
        [{ height: `${from}px` }, { height: `${next}px` }],
        { duration: 220, easing: "ease-out" },
      );
      animation = movement;
      movement.finished.then(
        () => {
          if (animation === movement) {
            animation = undefined;
            delete element.dataset.sizeAnimating;
          }
        },
        () => {},
      );
    }
    const observer = new ResizeObserver(() => update());
    observer.observe(content);
    const state = {
      update,
      disconnect() {
        observer.disconnect();
        animation?.cancel();
        element.style.removeProperty("height");
        delete element.dataset.sizeAnimating;
        states.delete(element);
      },
    };
    states.set(element, state);
    return state;
  }
  function refresh() {
    for (const [element, state] of states)
      if (!element.isConnected) state.disconnect();
    // Registrar filhos primeiro permite que o fundo acompanhe a animação deles.
    [...document.querySelectorAll("[data-size-motion]")]
      .reverse()
      .forEach((element) => {
        const existing = states.get(element);
        if (existing) existing.update();
        else watch(element);
      });
  }
  reduced.addEventListener("change", () => {
    if (reduced.matches) states.forEach((state) => state.update(true));
  });
  window.addEventListener("beforeprint", () => {
    printing = true;
    states.forEach((state) => state.update(true));
  });
  window.addEventListener("afterprint", () => {
    printing = false;
    refresh();
  });
  return { watch, refresh };
})();
