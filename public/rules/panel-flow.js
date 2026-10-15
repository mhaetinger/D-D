// Distribuição dos círculos de alturas variáveis. Os nós permanecem na
// ordem do HTML, preservando leitura e Tab mesmo quando a posição visual muda.
window.PanelFlow = (() => {
  let cleanups = [];
  const animations = new WeakMap();
  const keyOf = (item, index) => item.dataset.flowKey || String(index);
  function positions(container) {
    return new Map(
      [...container.children].map((item, index) => {
        const rect = item.getBoundingClientRect();
        return [
          keyOf(item, index),
          { x: rect.left + scrollX, y: rect.top + scrollY },
        ];
      }),
    );
  }
  function capture(root) {
    return new Map(
      [...root.querySelectorAll("[data-panel-flow]")].map((container) => [
        container.dataset.flowId,
        {
          items: positions(container),
          height: container.getBoundingClientRect().height,
        },
      ]),
    );
  }
  function dispose() {
    cleanups.forEach((cleanup) => cleanup());
    cleanups = [];
  }
  function mount(root, previous = new Map()) {
    dispose();
    root.querySelectorAll("[data-panel-flow]").forEach((container) => {
      const items = [...container.children];
      let frame = 0,
        signature = "",
        revision = 0,
        alive = true;
      function layout(oldLayout) {
        frame = 0;
        if (!container.isConnected) return;
        const style = getComputedStyle(container);
        const columns = Number(style.getPropertyValue("--panel-columns")) || 1;
        const gapX = parseFloat(style.columnGap) || 0,
          gapY = parseFloat(style.rowGap) || 0;
        const left = parseFloat(style.paddingLeft) || 0,
          right = parseFloat(style.paddingRight) || 0;
        const top = parseFloat(style.paddingTop) || 0,
          bottom = parseFloat(style.paddingBottom) || 0;
        const width =
          (container.clientWidth - left - right - gapX * (columns - 1)) /
          columns;
        const before = oldLayout?.items || positions(container);
        const oldHeight =
          oldLayout?.height ?? container.getBoundingClientRect().height;
        container.dataset.flowReady = "";
        items.forEach((item) => {
          item.style.width = `${width}px`;
        });
        const heights = items.map((item) => item.offsetHeight);
        const nextSignature = [
          columns,
          width,
          gapX,
          gapY,
          left,
          top,
          bottom,
          ...heights,
        ].join(",");
        // Observar a própria altura também gera notificações. Ignorar medidas
        // idênticas evita um ciclo de ResizeObserver e animações repetidas.
        if (signature === nextSignature) return;
        signature = nextSignature;
        const currentRevision = ++revision;
        const heightsByColumn = Array(columns).fill(top);
        items.forEach((item, index) => {
          const column = heightsByColumn.indexOf(Math.min(...heightsByColumn));
          animations.get(item)?.cancel();
          item.style.left = `${left + column * (width + gapX)}px`;
          item.style.top = `${heightsByColumn[column]}px`;
          heightsByColumn[column] += heights[index] + gapY;
        });
        const finalHeight =
          Math.max(top, ...heightsByColumn) -
          (items.length ? gapY : 0) +
          bottom;
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
          container.style.height = `${finalHeight}px`;
          return;
        }
        // Preservar também a altura anterior na reconstrução do HTML: o papel
        // precisa cobrir todo o trajeto, inclusive se houver outro clique no meio.
        const containerTop = container.getBoundingClientRect().top + scrollY;
        const movingHeight = Math.max(
          oldHeight,
          finalHeight,
          ...items.map(
            (item, index) =>
              (before.get(keyOf(item, index))?.y ?? containerTop) -
              containerTop +
              heights[index] +
              bottom,
          ),
        );
        container.style.height = `${movingHeight}px`;
        const moves = [];
        items.forEach((item, index) => {
          const from = before.get(keyOf(item, index));
          if (!from) return;
          const rect = item.getBoundingClientRect();
          const dx = from.x - rect.left - scrollX,
            dy = from.y - rect.top - scrollY;
          if (Math.abs(dx) + Math.abs(dy) < 1) return;
          const movement = item.animate(
            [
              { transform: `translate(${dx}px, ${dy}px)` },
              { transform: "translate(0, 0)" },
            ],
            { duration: 180, easing: "ease-out" },
          );
          animations.set(item, movement);
          moves.push(movement.finished);
        });
        if (!moves.length) container.style.height = `${finalHeight}px`;
        else
          Promise.allSettled(moves).then(() => {
            // Uma transição cancelada/antiga nunca pode encolher o painel novo.
            if (alive && revision === currentRevision && container.isConnected)
              container.style.height = `${finalHeight}px`;
          });
      }
      function schedule() {
        if (!frame) frame = requestAnimationFrame(() => layout());
      }
      // A primeira montagem não anima a disposição provisória do CSS. Somente
      // mudanças de altura/largura ou uma renderização posterior fazem transição.
      layout(
        previous.get(container.dataset.flowId) || {
          items: new Map(),
          height: 0,
        },
      );
      const observer = new ResizeObserver(schedule);
      observer.observe(container);
      items.forEach((item) => observer.observe(item));
      window.addEventListener("resize", schedule);
      cleanups.push(() => {
        alive = false;
        observer.disconnect();
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", schedule);
      });
    });
  }
  return { capture, mount, dispose };
})();
