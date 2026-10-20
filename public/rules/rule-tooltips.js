/* Consulta local compartilhada. O texto completo fica no HTML como dado escapado,
   nunca como código. O balão acompanha o cursor e deixa os cliques passarem. */
(function (root) {
  const escape = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  let box,
    active = null,
    timer,
    hoverTimer,
    pending = null,
    pointer = null,
    followsMouse = false,
    dismissedTarget = null,
    lastPointerDownAt = 0;
  function formatText(value) {
    // Quebras de coluna do PDF não são parágrafos. Preserva parágrafos,
    // listas e rótulos de regras, deixando o navegador ajustar a largura.
    // Converte também marcadores Private Use Area (U+F0B7) extraídos do PDF para •.
    return String(value ?? "")
      .replace(/[\uf0b7\uf0a7\uf0fc]\s*/g, "• ")
      .replace(/\r\n?/g, "\n")
      .trim()
      .split(/\n[ \t]*\n+/)
      .map((paragraph) =>
        paragraph
          .split(
            /\n(?=[ \t]*(?:[•●▪]|Tempo de Conjuração:|Alcance:|Componentes:|Duração:|Pré-requisito:))/,
          )
          .map((part) => part.replace(/[ \t]*\n[ \t]*/g, " ").trim())
          .join("\n"),
      )
      .join("\n\n");
  }
  function attributes(name, ref) {
    if (!ref?.text) return "";
    return `data-rule-tooltip="${escape(JSON.stringify({ name, text: formatText(ref.text), page: ref.page, pdfPage: ref.pdfPage }))}"`;
  }
  function ensureBox() {
    if (box) return;
    box = document.createElement("div");
    box.id = "ruleTooltip";
    box.className = "rule-tooltip";
    box.hidden = true;
    box.setAttribute("role", "tooltip");
    box.setAttribute("data-scroll-window", "");
    // O diálogo nativo ocupa a camada superior do navegador; z-index sozinho
    // não faz um balão externo aparecer acima dele.
    if (typeof box.showPopover === "function") box.setAttribute("popover", "manual");
    document.body.append(box);
  }
  function hide() {
    clearTimeout(timer);
    clearTimeout(hoverTimer);
    pending = null;
    if (active) {
      const ids = (active.getAttribute("aria-describedby") || "")
        .split(/\s+/)
        .filter((id) => id && id !== "ruleTooltip");
      if (ids.length) active.setAttribute("aria-describedby", ids.join(" "));
      else active.removeAttribute("aria-describedby");
    }
    active = null;
    if (box) {
      if (typeof box.hidePopover === "function" && box.matches(":popover-open")) box.hidePopover();
      box.hidden = true;
    }
  }
  function scheduleHide() {
    clearTimeout(timer);
    timer = setTimeout(hide, 140);
  }
  function inlineDescription(target, info) {
    const scope =
      target.closest("#characterWizard, #sheetViewport") || document;
    return [
      ...scope.querySelectorAll("details[open] > summary[data-rule-tooltip]"),
    ].some((summary) => {
      if (summary.offsetParent === null) return false;
      try {
        return JSON.parse(summary.dataset.ruleTooltip).text === info.text;
      } catch {
        return false;
      }
    });
  }
  function show(target, mouse = false) {
    clearTimeout(timer);
    if (target === dismissedTarget) return;
    let info;
    try {
      info = JSON.parse(target.dataset.ruleTooltip);
    } catch {
      return;
    }
    if (!info?.text || inlineDescription(target, info)) return hide();
    if (target === active && box && !box.hidden) {
      followsMouse = mouse;
      position();
      return;
    }
    hide();
    ensureBox();
    active = target;
    followsMouse = mouse;
    const heading = document.createElement("strong"),
      text = document.createElement("p");
    heading.textContent = info.name;
    text.textContent = info.text;
    box.replaceChildren(heading, text);
    if (Number.isInteger(info.pdfPage)) {
      const page = document.createElement("small");
      page.textContent = `Livro do Jogador · p. ${info.page || info.pdfPage}`;
      box.append(page);
    }
    const ids = (target.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .filter(Boolean);
    target.setAttribute(
      "aria-describedby",
      [...new Set([...ids, "ruleTooltip"])].join(" "),
    );
    box.hidden = false;
    if (typeof box.showPopover === "function") box.showPopover();
    box.scrollTop = 0;
    position();
  }
  function position() {
    if (!active || !active.isConnected) return hide();
    const pickerList = active.closest(".cw-picker-list");
    if (pickerList && box && !box.hidden) {
      const pickerRect = pickerList.getBoundingClientRect();
      const itemRect = active.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();
      const gap = 12;
      let left = pickerRect.right + gap;
      if (left + boxRect.width > window.innerWidth - gap) {
        left = pickerRect.left - boxRect.width - gap;
      }
      if (left < gap) {
        left = Math.max(gap, window.innerWidth - boxRect.width - gap);
      }
      const top = Math.max(
        gap,
        Math.min(itemRect.top, window.innerHeight - boxRect.height - gap),
      );
      box.style.left = `${left}px`;
      box.style.top = `${top}px`;
      return;
    }
    // Mesma função das magias: mouse acompanha o cursor; teclado usa o alvo.
    root.positionTooltip(
      { ...(followsMouse ? pointer : {}), currentTarget: active },
      "ruleTooltip",
    );
  }
  function hover(target, event) {
    if (target === dismissedTarget) return;
    pointer = { clientX: event.clientX, clientY: event.clientY };
    if (target === active) {
      clearTimeout(timer);
      clearTimeout(hoverTimer);
      pending = null;
      if (box && !box.hidden) return;
      followsMouse = true;
      position();
      return;
    }
    if (target === pending) return;
    // Cancelar o balão anterior antes de agendar o novo evita que seu atraso
    // de fechamento também cancele a abertura do próximo rótulo.
    hide();
    pending = target;
    hoverTimer = setTimeout(() => show(target, true), 250);
  }
  if (typeof document !== "undefined") {
    document.addEventListener("pointerover", (event) => {
      const target = event.target.closest("[data-rule-tooltip]");
      if (target && target !== dismissedTarget) hover(target, event);
    });
    document.addEventListener("pointermove", (event) => {
      const target = event.target.closest("[data-rule-tooltip]");
      if (target && target !== dismissedTarget) hover(target, event);
    });
    document.addEventListener("pointerout", (event) => {
      const leaving = event.target.closest("[data-rule-tooltip]");
      if (leaving && !leaving.contains(event.relatedTarget)) {
        clearTimeout(hoverTimer);
        pending = null;
        if (leaving === dismissedTarget) dismissedTarget = null;
      }
      if (
        active?.contains(event.target) &&
        !active?.contains(event.relatedTarget)
      )
        scheduleHide();
    });
    document.addEventListener("focusin", (event) => {
      if (Date.now() - lastPointerDownAt < 450) return;
      const target = event.target.closest("[data-rule-tooltip]");
      if (
        target &&
        target !== dismissedTarget &&
        target.matches?.(":focus-visible")
      )
        show(target);
      else hide();
    });
    document.addEventListener("focusout", (event) => {
      if (active?.contains(event.target)) scheduleHide();
    });
    document.addEventListener(
      "pointerdown",
      (event) => {
        lastPointerDownAt = Date.now();
        const target = event.target.closest?.("[data-rule-tooltip]") || active;
        if (target) dismissedTarget = target;
        hide();
      },
      true,
    );
    document.addEventListener(
      "wheel",
      (event) => {
        if (
          event.ctrlKey ||
          event.defaultPrevented ||
          !event.cancelable ||
          !box ||
          box.hidden ||
          box.scrollHeight <= box.clientHeight
        )
          return;
        if (!box.contains(event.target) && !active?.contains(event.target))
          return;
        event.preventDefault();
        event.stopPropagation();
        const style = getComputedStyle(box),
          unit =
            event.deltaMode === 1
              ? parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2
              : event.deltaMode === 2
                ? box.clientHeight
                : 1;
        box.scrollTop += event.deltaY * unit;
      },
      { passive: false, capture: true },
    );
    // Abrir a consulta inline remove o balão equivalente, inclusive quando ele
    // veio do nome do ganho acima. Fechar os detalhes permite novo hover normal.
    document.addEventListener(
      "toggle",
      () => {
        if (active) {
          try {
            if (
              inlineDescription(active, JSON.parse(active.dataset.ruleTooltip))
            )
              hide();
          } catch {
            hide();
          }
        }
      },
      true,
    );
    document.addEventListener(
      "keydown",
      (event) => {
        if (!active || box.hidden) return;
        if (event.key === "Escape") {
          hide();
          event.preventDefault();
          event.stopImmediatePropagation();
        } else if (["PageDown", "PageUp"].includes(event.key)) {
          box.scrollBy(
            0,
            box.clientHeight * (event.key === "PageDown" ? 0.8 : -0.8),
          );
          event.preventDefault();
        }
      },
      true,
    );
    // A lista pode rolar normalmente; PageUp/PageDown leem o texto longo do balão.
    document.addEventListener(
      "scroll",
      (event) => {
        if (box && active && event.target !== box) {
          if (event.target.contains?.(active)) position();
          else hide();
        }
      },
      true,
    );
    window.addEventListener("resize", hide);
    document.addEventListener("close", (event) => {
      if (event.target instanceof HTMLDialogElement) hide();
    }, true);
  }
  const api = { attributes, hide, show, formatText };
  root.RuleTooltips = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
