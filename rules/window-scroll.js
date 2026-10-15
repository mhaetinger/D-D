/* Regra compartilhada: a rodinha pertence à janela sob o ponteiro.
 * Marcar a superfície (nunca o fundo escurecido) com data-scroll-window.
 * data-scroll-content indica o conteúdo a rolar sobre cabeçalhos/rodapés.
 * Não bloqueamos o body: fora da superfície, a página continua rolando.
 */
(function () {
  "use strict";

  function scrollInside(start, panel, delta, horizontal, mode) {
    const position = horizontal ? "scrollLeft" : "scrollTop",
      extent = horizontal ? "scrollWidth" : "scrollHeight",
      size = horizontal ? "clientWidth" : "clientHeight",
      overflow = horizontal ? "overflowX" : "overflowY";
    for (let el = start; el && panel.contains(el); el = el.parentElement) {
      const style = getComputedStyle(el),
        limit = el[extent] - el[size];
      if (!/(auto|scroll|overlay)/.test(style[overflow]) || limit <= 0)
        continue;
      if (delta < 0 ? el[position] <= 0 : el[position] >= limit) continue;
      // Rodinhas podem informar pixels, linhas ou páginas; trackpads usam pixels.
      const unit =
        mode === 1
          ? parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2
          : mode === 2
            ? el[size]
            : 1;
      el[position] += delta * unit;
      return true;
    }
    return false;
  }

  document.addEventListener(
    "wheel",
    (event) => {
      // Ctrl+rodinha (incluindo o gesto de pinça) continua controlando o zoom.
      if (event.ctrlKey || event.defaultPrevented || !event.cancelable) return;
      const target = event.target instanceof Element ? event.target : null,
        panel = target?.closest("[data-scroll-window]");
      if (!panel) return;

      // Conter também superfícies sem overflow: CSS sozinho não cobre esses casos.
      event.preventDefault();
      const content = panel.querySelector("[data-scroll-content]") || panel,
        dx = event.deltaX || (event.shiftKey ? event.deltaY : 0),
        dy = event.shiftKey && !event.deltaX ? 0 : event.deltaY;
      for (const [delta, horizontal] of [
        [dx, true],
        [dy, false],
      ]) {
        if (!delta) continue;
        // Primeiro a lista sob o mouse, depois seus pais dentro da mesma janela.
        // No limite final, o movimento termina aqui, sem alcançar a página.
        if (!scrollInside(target, panel, delta, horizontal, event.deltaMode)) {
          scrollInside(content, panel, delta, horizontal, event.deltaMode);
        }
      }
    },
    { passive: false },
  );
})();
