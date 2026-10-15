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
    followsMouse = false;
  function formatText(value) {
    // Quebras de coluna do PDF não são parágrafos. Preserva parágrafos,
    // listas e rótulos de regras, deixando o navegador ajustar a largura.
    return String(value ?? "")
      .replace(/\r\n?/g, "\n")
      .trim()
      .split(/\n[ \t]*\n+/)
      .map((paragraph) =>
        paragraph
          .split(
            /\n(?=[ \t]*(?:[•●▪]|Tempo de Conjuração:|Alcance:|Componentes:|Duração:|Pré-requisito:))/,
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
    if (box) box.hidden = true;
  }
  function scheduleHide() {
    clearTimeout(timer);
    timer = setTimeout(hide, 180);
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
    box.scrollTop = 0;
    position();
  }
  function position() {
    if (!active || !active.isConnected) return hide();
    // Mesma função das magias: mouse acompanha o cursor; teclado usa o alvo.
    root.positionTooltip(
      { ...(followsMouse ? pointer : {}), currentTarget: active },
      "ruleTooltip",
    );
  }
  function hover(target, event) {
    pointer = { clientX: event.clientX, clientY: event.clientY };
    if (target === active) {
      followsMouse = true;
      position();
      return;
    }
    if (target === pending) return;
    hide();
    pending = target;
    hoverTimer = setTimeout(() => show(target, true), 250);
  }
  document.addEventListener("pointerover", (event) => {
    const target = event.target.closest("[data-rule-tooltip]");
    if (target) hover(target, event);
  });
  document.addEventListener("pointermove", (event) => {
    const target = event.target.closest("[data-rule-tooltip]");
    if (target) hover(target, event);
  });
  document.addEventListener("pointerout", (event) => {
    const leaving = event.target.closest("[data-rule-tooltip]");
    if (leaving && !leaving.contains(event.relatedTarget)) {
      clearTimeout(hoverTimer);
      pending = null;
    }
    if (
      active?.contains(event.target) &&
      !active.contains(event.relatedTarget) &&
      !box?.contains(event.relatedTarget)
    )
      scheduleHide();
  });
  document.addEventListener("focusin", (event) => {
    const target = event.target.closest("[data-rule-tooltip]");
    if (target) show(target);
    else hide();
  });
  document.addEventListener("focusout", (event) => {
    if (active?.contains(event.target)) scheduleHide();
  });
  document.addEventListener("pointerdown", (event) => {
    if (
      active &&
      !active.contains(event.target) &&
      !box?.contains(event.target)
    )
      hide();
  });
  // Abrir a consulta inline remove o balão equivalente, inclusive quando ele
  // veio do nome do ganho acima. Fechar os detalhes permite novo hover normal.
  document.addEventListener(
    "toggle",
    () => {
      if (active) {
        try {
          if (inlineDescription(active, JSON.parse(active.dataset.ruleTooltip)))
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
  root.RuleTooltips = { attributes, hide, show, formatText };
})(globalThis);
