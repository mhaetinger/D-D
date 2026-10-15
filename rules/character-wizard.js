/* Interface do criador. O rascunho não altera fichas: concluir chama o motor e só
   então entrega um novo objeto ao salvamento já existente do protótipo. */
(function (root) {
  const E = root.CharacterEngine,
    D = E.data,
    O = E.options;
  const escape = (s) =>
    String(s ?? "").replace(
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
  const array = (x) =>
    Array.isArray(x) ? x : x === undefined || x === "" ? [] : [x];
  const steps = [
    ["identity", "Identidade"],
    ["attributes", "Habilidades"],
    ["proficiencies", "Proficiências"],
    ["class", "Classe"],
    ["magic", "Magias"],
    ["equipment", "Equipamento"],
    ["review", "Revisão"],
  ];
  let draft = null,
    step = 0,
    host = null,
    priorFocus = null,
    initial = "",
    picker = null,
    pickerSelect = null,
    renderedView = null,
    renderedChoices = new Map();
  const options = (items, value, empty = "Escolha…") =>
    `<option value="">${empty}</option>` +
    items
      .map(
        (o) =>
          `<option value="${escape(o.value)}" ${o.value === value ? "selected" : ""} ${root.RuleTooltips.attributes(o.label, o.reference || o.spell)}>${escape(o.label)}</option>`,
      )
      .join("");
  const mapOptions = (obj) =>
    Object.entries(obj).map(([value, o]) => ({ value, label: o.name }));
  const field = (label, body) =>
    `<label class="cw-label">${escape(label)}${body}</label>`;
  function ctx() {
    const d = E.context(draft.setup, draft.answers, draft.char, draft.classId);
    if (draft.mode === "prepare") {
      d.level = draft.char.classes.find(
        (c) => c.classId === draft.classId,
      ).level;
    }
    return d;
  }
  function visibleSteps() {
    return steps.filter(([id]) =>
      draft.mode === "create" || draft.mode === "prepare"
        ? draft.mode === "create" || ["magic", "review"].includes(id)
        : !["attributes", "equipment"].includes(id),
    );
  }
  function filterChoices(input) {
    const normalize = (value) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const filter = normalize(input.value);
    input
      .closest(".cw-choice")
      .querySelectorAll("[data-option-row]")
      .forEach((row) => {
        row.hidden = !normalize(row.textContent).includes(filter);
      });
  }
  function controlKey(el) {
    if (!el) return null;
    if (el.id) return "id:" + el.id;
    if (el.tagName === "SUMMARY")
      return "detail:" + detailKey(el.parentElement);
    const keys = [
      "data-answer",
      "data-index",
      "data-setup",
      "data-search",
      "data-ability",
      "data-text",
      "data-action",
      "data-level-class",
      "data-level-mode",
    ];
    if (!keys.some((key) => el.hasAttribute(key))) return null;
    return JSON.stringify([
      el.tagName,
      ...keys.map((key) => el.getAttribute(key)),
      el.type === "checkbox" ? el.value : null,
    ]);
  }
  function detailKey(el) {
    const summary = el.querySelector(":scope > summary");
    return JSON.stringify([
      el.closest("[data-choice]")?.dataset.choice,
      summary?.dataset.ruleTooltip || summary?.textContent,
    ]);
  }
  function captureView() {
    const body = host.querySelector(".cw-body");
    if (!body) return null;
    const active = document.activeElement;
    return {
      bodyTop: body.scrollTop,
      choices: [...body.querySelectorAll("[data-choice]")].map((field) => ({
        id: field.dataset.choice,
        top: field.querySelector(".cw-options")?.scrollTop || 0,
        search: field.querySelector("[data-search]")?.value || "",
      })),
      open: new Set([...body.querySelectorAll("details[open]")].map(detailKey)),
      focus: host.contains(active) ? controlKey(active) : null,
      start: active?.selectionStart,
      end: active?.selectionEnd,
    };
  }
  function restoreView(state) {
    if (!state) return;
    const body = host.querySelector(".cw-body");
    body.querySelectorAll("details").forEach((el) => {
      el.open = state.open.has(detailKey(el));
    });
    const fields = new Map(
      [...body.querySelectorAll("[data-choice]")].map((el) => [
        el.dataset.choice,
        el,
      ]),
    );
    for (const saved of state.choices) {
      const input = fields.get(saved.id)?.querySelector("[data-search]");
      if (input) {
        input.value = saved.search;
        filterChoices(input);
      }
    }
    const focus =
      state.focus &&
      [...host.querySelectorAll("input,select,textarea,button,summary")].find(
        (el) => controlKey(el) === state.focus,
      );
    if (focus && !focus.closest("[hidden]")) {
      if (document.activeElement !== focus)
        focus.focus({ preventScroll: true });
      if (Number.isInteger(state.start))
        focus.setSelectionRange(state.start, state.end);
    }
    // Filtrar e reabrir descrições altera a altura. Restaure cada rolagem só
    // depois disso e do foco: o assistente e cada lista têm rolagens distintas.
    for (const saved of state.choices) {
      const list = fields.get(saved.id)?.querySelector(".cw-options");
      if (list) list.scrollTop = saved.top;
    }
    body.scrollTop = state.bodyTop;
  }
  function visibleChoices(d = ctx()) {
    const id = visibleSteps()[step][0];
    return E.requirements(d).filter(
      (f) => f.step === id && (draft.mode !== "prepare" || f.id === "prepared"),
    );
  }
  // O navegador ainda está executando a ativação do label durante change.
  // Não remova a lista nem o checkbox clicado nesse evento: restaurar scroll
  // depois de destruir o controle não preserva essa interação nativa.
  function refreshChoices() {
    const state = captureView(),
      fields = visibleChoices(),
      container = host.querySelector(".cw-fields"),
      existing = new Map(
        [...container.children].map((el) => [el.dataset.choice, el]),
      );
    const wanted = new Set(fields.map((f) => f.id));
    for (const [id, el] of existing) if (!wanted.has(id)) el.remove();
    let cursor = container.firstElementChild;
    const nextSignatures = new Map();
    for (const f of fields) {
      const signature = JSON.stringify(f);
      let field = existing.get(f.id);
      if (!field || renderedChoices.get(f.id) !== signature) {
        const template = document.createElement("template");
        template.innerHTML = choice(f);
        const fresh = template.content.firstElementChild;
        const oldList = field?.querySelector(".cw-options"),
          newList = fresh.querySelector(".cw-options");
        if (oldList && newList) {
          // Opções podem mudar em campos irmãos. Preserve também as linhas
          // ainda disponíveis, seus detalhes e a própria área de rolagem.
          field
            .querySelector("legend")
            .replaceChildren(...fresh.querySelector("legend").childNodes);
          const oldSearch = field.querySelector("[data-search]"),
            newSearch = fresh.querySelector("[data-search]");
          if (oldSearch && !newSearch) oldSearch.remove();
          else if (!oldSearch && newSearch) oldList.before(newSearch);
          const rows = new Map(
            [...oldList.children].map((row) => [
              row.querySelector("input").value,
              row,
            ]),
          );
          const freshRows = [...newList.children],
            values = new Set(
              freshRows.map((row) => row.querySelector("input").value),
            );
          for (const [value, row] of rows) if (!values.has(value)) row.remove();
          let at = oldList.firstElementChild;
          for (const freshRow of freshRows) {
            const value = freshRow.querySelector("input").value,
              row = rows.get(value) || freshRow;
            if (rows.has(value)) {
              row.querySelector("label span").textContent =
                freshRow.querySelector("label span").textContent;
              const data = freshRow
                .querySelector("label")
                .getAttribute("data-rule-tooltip");
              if (data)
                row
                  .querySelector("label")
                  .setAttribute("data-rule-tooltip", data);
              else
                row.querySelector("label").removeAttribute("data-rule-tooltip");
            }
            if (row !== at) oldList.insertBefore(row, at);
            at = row.nextElementSibling;
          }
        } else {
          if (field) {
            field.replaceWith(fresh);
            if (cursor === field) cursor = fresh;
          }
          field = fresh;
        }
      }
      const selected = array(draft.answers[f.id]);
      field.querySelector("legend .cw-muted").textContent =
        f.count > 1
          ? `${selected.filter(Boolean).length}/${f.count}`
          : f.min === 0
            ? "opcional"
            : "";
      for (const input of field.querySelectorAll(
        'input[type="checkbox"][data-answer]',
      ))
        input.checked = selected.includes(input.value);
      if (field !== cursor) container.insertBefore(field, cursor);
      cursor = field.nextElementSibling;
      nextSignatures.set(f.id, signature);
    }
    renderedChoices = nextSignatures;
    restoreView(state);
  }
  function ensureHost() {
    if (host) return;
    host = document.createElement("div");
    host.id = "characterWizard";
    host.className = "cw-overlay hidden";
    host.setAttribute("role", "dialog");
    host.setAttribute("aria-modal", "true");
    host.setAttribute("aria-labelledby", "cw-title");
    document.body.append(host);
    // As opções nativas de <select> não recebem hover de forma consistente.
    // Mantemos o select como valor/acesso sem JS e abrimos uma lista equivalente
    // apenas onde há texto do livro, com navegação por setas, Enter e Escape.
    host.addEventListener("pointerdown", (event) => {
      const select = event.target.closest("select[data-help-picker]");
      if (select && event.button === 0) {
        event.preventDefault();
        if (pickerSelect === select) closePicker();
        else openPicker(select);
      } else if (picker && !picker.contains(event.target)) closePicker();
    });
    host.addEventListener("click", async (event) => {
      const pick = event.target.closest("[data-pick-value]");
      if (pick) {
        const select = pickerSelect;
        select.value = pick.dataset.pickValue;
        closePicker();
        select.focus({ preventScroll: true });
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      if (action === "close") return close();
      if (action === "back") {
        step = Math.max(0, step - 1);
        render();
      }
      if (action === "next") {
        const errors = currentErrors();
        if (errors.length) return showErrors(errors);
        step++;
        render();
        host.querySelector("h2")?.focus();
      }
      if (action === "finish") finish();
      if (action === "rollAbilities") {
        if (
          draft.setup.rolls.length &&
          !(await root.confirmDestructiveAction(
            "Rolar atributos novamente?",
            "Os seis resultados atuais e sua distribuição serão substituídos.",
            "Rolar novamente",
          ))
        )
          return;
        draft.setup.rolls = E.rollAbilities();
        draft.setup.assignment = {};
        draft.setup.baseScores = {};
        render();
      }
      if (action === "rollHp") {
        const c = D.classes[draft.classId];
        draft.hpRoll = 1 + Math.floor(Math.random() * c.die);
        render();
      }
      if (action === "fixedHp") {
        draft.hpRoll = null;
        render();
      }
    });
    host.addEventListener("input", (event) => {
      const el = event.target;
      if (el.dataset.search) {
        filterChoices(el);
        return;
      }
      if (el.dataset.text) draft.setup[el.dataset.text] = el.value;
    });
    host.addEventListener("change", async (event) => {
      const el = event.target,
        id = el.dataset.answer;
      if (el.dataset.setup) {
        const key = el.dataset.setup,
          next = el.type === "checkbox" ? el.checked : el.value;
        if (
          ["classId", "raceId", "backgroundId"].includes(key) &&
          Object.keys(draft.answers).length &&
          draft.setup[key] !== next
        ) {
          if (
            !(await root.confirmDestructiveAction(
              "Refazer escolhas do rascunho?",
              "Mudar classe, raça ou antecedente exige conferir novamente as escolhas dependentes. O nome, os atributos e os textos serão mantidos.",
              "Refazer escolhas",
            ))
          ) {
            render();
            return;
          }
          draft.answers = {};
        }
        draft.setup[key] = next;
        if (key === "classId") draft.classId = next;
        if (key === "abilityMethod") {
          draft.setup.baseScores =
            next === "pointBuy"
              ? Object.fromEntries(Object.keys(D.abilities).map((k) => [k, 8]))
              : { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };
        }
        if (key === "allowFeats" && draft.char) {
          draft.char.rules = draft.char.rules || {
            history: [],
            legacy: true,
            hpRolls: [],
          };
          draft.char.rules.allowFeats = next;
        }
        render();
        return;
      }
      if (el.dataset.levelClass || el.dataset.levelMode) {
        const mode = el.dataset.levelMode ? el.value : draft.levelMode,
          choices = Object.keys(D.classes).filter((id) =>
            mode === "new"
              ? !draft.char.classes.some((c) => c.classId === id)
              : draft.char.classes.some((c) => c.classId === id),
          ),
          next = el.dataset.levelClass
            ? el.value
            : choices.find(
                (id) => E.multiclassEligibility(draft.char, id).allowed,
              ) || choices[0];
        if (!choices.includes(next)) {
          render();
          return;
        }
        if (
          (Object.keys(draft.answers).length || draft.hpRoll !== null) &&
          !(await root.confirmDestructiveAction(
            "Refazer escolhas deste nível?",
            "Trocar a classe descarta as escolhas e a rolagem de PV deste rascunho. Sua ficha atual será mantida.",
            "Trocar classe",
          ))
        ) {
          render();
          return;
        }
        draft.levelMode = mode;
        draft.classId = next;
        draft.answers = {};
        draft.hpRoll = null;
        render();
        return;
      }
      if (el.dataset.ability) {
        const key = el.dataset.ability;
        if (draft.setup.abilityMethod === "rolled") {
          draft.setup.assignment[key] = el.value;
          const group = draft.setup.rolls[+el.value];
          draft.setup.baseScores[key] = group
            ? group.reduce((s, n) => s + n, 0) - Math.min(...group)
            : 0;
        } else draft.setup.baseScores[key] = +el.value;
        render();
        return;
      }
      if (id) {
        const spec = E.requirements(ctx()).find((f) => f.id === id);
        if (!spec) return;
        if (el.type === "checkbox") {
          const selected = array(draft.answers[id]).filter(
            (v) => v !== el.value,
          );
          if (el.checked) selected.push(el.value);
          if (selected.length > spec.count) {
            el.checked = false;
            // Aviso sem rolar a tela para um erro distante da lista.
            return root.showToast(
              `Escolha no máximo ${spec.count} para “${spec.label}”.`,
            );
          }
          draft.answers[id] = selected;
        } else if (el.dataset.index !== undefined) {
          const selected = array(draft.answers[id]);
          selected[+el.dataset.index] = el.value;
          draft.answers[id] = selected;
        } else draft.answers[id] = el.value;
        // Remove respostas de campos condicionais que deixaram de existir; não
        // escolhe automaticamente uma alternativa no lugar de uma opção inválida.
        const allowed = new Set(E.requirements(ctx()).map((f) => f.id));
        for (const key of Object.keys(draft.answers))
          if (!allowed.has(key)) delete draft.answers[key];
        if (el.type === "checkbox") refreshChoices();
        else render();
      }
    });
    host.addEventListener("keydown", (event) => {
      if (picker) {
        const buttons = [...picker.querySelectorAll("button")],
          index = buttons.indexOf(document.activeElement);
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? buttons.length - 1
                : (index +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    buttons.length) %
                  buttons.length;
          buttons[next]?.focus();
          return;
        }
        if (["Escape", "Tab"].includes(event.key)) {
          const select = pickerSelect;
          closePicker();
          select.focus();
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
          }
          return;
        }
      } else if (
        event.target.matches("select[data-help-picker]") &&
        ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)
      ) {
        event.preventDefault();
        openPicker(event.target);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
      if (event.key === "Tab") {
        const focusable = [
            ...host.querySelectorAll("button,a,input,select,textarea,summary"),
          ].filter((x) => !x.disabled && x.offsetParent !== null),
          first = focusable[0],
          last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });
  }
  function openCreate() {
    ensureHost();
    renderedView = null;
    priorFocus = document.activeElement;
    step = 0;
    draft = {
      mode: "create",
      setup: {
        name: "",
        playerName:
          root.getChar()?.playerName ||
          root.document?.getElementById("currentUserBadge")?.textContent ||
          "Jogador",
        preferredLayout: root.getChar()?.preferredLayout || "classic_2014",
        classId: "",
        raceId: "",
        backgroundId: "",
        abilityMethod: "standard",
        baseScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
        rolls: [],
        assignment: {},
        allowFeats: false,
        wearStartingArmor: true,
      },
      classId: "",
      answers: {},
      char: null,
      hpRoll: null,
    };
    initial = JSON.stringify(draft);
    render();
    host.classList.remove("hidden");
    host.querySelector("input")?.focus();
  }
  function openLevel() {
    if (root.getTotalLevel(root.getChar()) >= 20)
      return root.showToast("O personagem já está no nível máximo (20).");
    ensureHost();
    renderedView = null;
    priorFocus = document.activeElement;
    step = 0;
    const char = JSON.parse(JSON.stringify(root.getChar()));
    for (const cls of char.classes)
      if (!cls.subclassId) cls.subclassId = E.inferSubclass(cls);
    draft = {
      mode: "level",
      levelMode: "existing",
      setup: { allowFeats: !!char.rules?.allowFeats },
      classId: char.classes[0].classId,
      char,
      answers: {},
      hpRoll: null,
    };
    initial = JSON.stringify(draft);
    render();
    host.classList.remove("hidden");
    host.querySelector("h2")?.focus();
  }
  function openPrepare(classId) {
    ensureHost();
    renderedView = null;
    priorFocus = document.activeElement;
    step = 0;
    const char = JSON.parse(JSON.stringify(root.getChar()));
    draft = {
      mode: "prepare",
      setup: {},
      classId,
      char,
      answers: {},
      hpRoll: null,
    };
    draft.answers.prepared = char.spells
      .filter(
        (s) =>
          s.classId === classId && s.prepared && !s.automatic && !s.extraSource,
      )
      .map((s) => s.bookId || E.spell(s.name)?.id)
      .filter(Boolean);
    initial = JSON.stringify(draft);
    render();
    host.classList.remove("hidden");
  }
  async function close(force = false) {
    if (!draft) return;
    if (
      !force &&
      JSON.stringify(draft) !== initial &&
      !(await root.confirmDestructiveAction(
        "Descartar rascunho?",
        "As escolhas ainda não foram aplicadas à ficha.",
        "Descartar rascunho",
      ))
    )
      return;
    closePicker();
    root.RuleTooltips.hide();
    host.classList.add("hidden");
    draft = null;
    priorFocus?.focus();
  }
  function source(name, classId, kind = "feature") {
    const sid =
      draft.answers.subclass ||
      draft.char?.classes.find((c) => c.classId === draft.classId)?.subclassId;
    const ref = E.reference(
      name,
      classId,
      kind === "race" ? draft.setup.raceId : sid,
      kind,
    );
    if (!ref) return "";
    return `<details class="cw-source"><summary ${root.RuleTooltips.attributes(name, ref)}>Consultar ${escape(name)}</summary><p>${escape(root.RuleTooltips.formatText(ref.text))}</p><a href="book.html#page=${ref.pdfPage}" target="_blank" rel="noopener">Abrir no livro · p. ${ref.page}</a></details>`;
  }
  function closePicker() {
    if (pickerSelect) {
      pickerSelect.setAttribute("aria-expanded", "false");
      pickerSelect.removeAttribute("aria-controls");
    }
    picker?.remove();
    picker = null;
    pickerSelect = null;
    root.RuleTooltips.hide();
  }
  function openPicker(select) {
    closePicker();
    pickerSelect = select;
    picker = document.createElement("div");
    picker.className = "cw-picker-list";
    picker.setAttribute("data-scroll-window", "");
    picker.id = "cw-picker-options";
    picker.setAttribute("role", "listbox");
    picker.setAttribute(
      "aria-label",
      select.getAttribute("aria-label") || "Escolhas do livro",
    );
    picker.innerHTML = [...select.options]
      .map(
        (o) =>
          `<button type="button" role="option" data-pick-value="${escape(o.value)}" aria-selected="${o.selected}" ${o.dataset.ruleTooltip ? `data-rule-tooltip="${escape(o.dataset.ruleTooltip)}"` : ""}><span>${escape(o.textContent)}</span></button>`,
      )
      .join("");
    host.append(picker);
    const rect = select.getBoundingClientRect();
    picker.style.width = `${Math.min(rect.width, window.innerWidth - 24)}px`;
    picker.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - picker.offsetWidth - 12))}px`;
    const below = window.innerHeight - rect.bottom - 12,
      above = rect.top - 12;
    picker.style.maxHeight = `${Math.min(Math.max(below, above), window.innerHeight * 0.45)}px`;
    picker.style.top = `${below >= picker.offsetHeight ? rect.bottom : Math.max(12, rect.top - picker.offsetHeight)}px`;
    select.setAttribute("aria-expanded", "true");
    select.setAttribute("aria-controls", picker.id);
    picker.querySelector('[aria-selected="true"]')?.focus();
  }
  function setupOptions(items, value, kind) {
    return options(
      items.map((o) => ({
        ...o,
        reference: E.reference(
          o.label,
          kind === "class" ? o.value : null,
          kind === "race" ? o.value : null,
          kind === "race" ? "race" : "feature",
        ),
      })),
      value,
    );
  }
  function ruleName(name, classId) {
    const sid =
      draft.answers.subclass ||
      draft.char?.classes.find((c) => c.classId === classId)?.subclassId;
    return `<span tabindex="0" ${root.RuleTooltips.attributes(name, E.reference(name, classId, sid))}>${escape(name)}</span>`;
  }
  function choice(f) {
    const selected = array(draft.answers[f.id]);
    const items = f.options.map((o) => ({
      ...o,
      reference: E.optionReference(ctx(), f, o),
    }));
    let control = "";
    if (f.count === 1) {
      const picked = items.find((o) => o.value === selected[0]);
      control = `<select data-answer="${f.id}" ${items.some((o) => o.reference?.text) ? 'data-help-picker="true"' : ""} ${root.RuleTooltips.attributes(picked?.label, picked?.reference)} aria-label="${escape(f.label)}">${options(items, selected[0], f.min === 0 ? "Manter / não trocar" : "Escolha…")}</select>${picked?.spell ? spellDetails(picked.spell) : picked?.reference ? `<details class="cw-source"><summary ${root.RuleTooltips.attributes(picked.label, picked.reference)}>Consultar ${escape(picked.label)}</summary><p>${escape(root.RuleTooltips.formatText(picked.reference.text))}</p><a href="book.html#page=${picked.reference.pdfPage}" target="_blank" rel="noopener">Abrir no livro · p. ${picked.reference.page}</a></details>` : ""}`;
    } else if (!f.unique)
      control = Array.from(
        { length: f.count },
        (_, i) =>
          `<select data-answer="${f.id}" data-index="${i}" aria-label="${escape(f.label)} — ponto ${i + 1}">${options(items, selected[i])}</select>`,
      ).join("");
    else
      control = `${items.length > 10 ? `<input data-search="${f.id}" type="search" placeholder="Buscar nesta lista…" aria-label="Buscar ${escape(f.label)}">` : ""}<div class="cw-options">${items.map((o) => `<div data-option-row><label ${root.RuleTooltips.attributes(o.label, o.reference)}><input data-answer="${f.id}" type="checkbox" value="${escape(o.value)}" ${selected.includes(o.value) ? "checked" : ""}> <span>${escape(o.label)}</span></label>${o.spell ? spellDetails(o.spell) : ""}</div>`).join("")}</div>`;
    return `<fieldset class="cw-choice" data-choice="${escape(f.id)}"><legend>${escape(f.label)} <span class="cw-muted">${f.count > 1 ? `${selected.filter(Boolean).length}/${f.count}` : f.min === 0 ? "opcional" : ""}</span></legend>${control}</fieldset>`;
  }
  function spellDetails(s) {
    return `<details class="cw-source"><summary ${root.RuleTooltips.attributes(s.name, s)}>Descrição e consulta</summary><p>${escape(root.RuleTooltips.formatText(s.text))}</p><a href="book.html#page=${s.pdfPage}" target="_blank" rel="noopener">Abrir ${escape(s.name)} no livro</a></details>`;
  }
  function multiclassProficiencies(classId) {
    const gains = E.multiclass[classId];
    return (
      [
        ...gains.armor.map(
          (a) =>
            ({
              leve: "armadura leve",
              media: "armadura média",
              escudo: "escudos",
            })[a],
        ),
        gains.weapons,
        ...(gains.tools || []),
        gains.skill
          ? "uma perícia " +
            (gains.skill === "any" ? "à escolha" : "da lista da classe")
          : "",
        gains.instrument ? "um instrumento musical" : "",
      ]
        .filter(Boolean)
        .join("; ") || "nenhuma adicional"
    );
  }
  function multiclassReview(char) {
    const notes = E.multiclassNotes(char);
    return notes.length
      ? `<details><summary>Interações de multiclasse · ${notes.length}</summary><ul class="space-y-2 mt-2">${notes.map((note) => `<li><strong>${escape(note.name)}</strong>: ${escape(note.text)}</li>`).join("")}</ul></details>`
      : "";
  }
  function identity() {
    if (draft.mode === "prepare") return "";
    if (draft.mode === "level") {
      const c = D.classes[draft.classId],
        d = ctx(),
        gains = E.classFeatures(d),
        eligibility = E.multiclassEligibility(draft.char, draft.classId),
        classes =
          draft.levelMode === "new"
            ? Object.keys(D.classes)
                .filter(
                  (id) => !draft.char.classes.some((c) => c.classId === id),
                )
                .map((id) => ({ classId: id, level: 0 }))
            : draft.char.classes;
      const entryRules = eligibility.adding
        ? `<p>Multiclasse é uma regra opcional do livro. Este nível entra em ${escape(c.name)}; o nível total passa para ${draft.char.classes.reduce((n, c) => n + c.level, 0) + 1}.</p><ul class="space-y-1">${eligibility.checks.map((check) => `<li>${check.met ? "✓" : "✕"} ${escape(D.classes[check.classId].name)}: ${escape(check.required)}. Atual: ${escape(check.actual)}.</li>`).join("")}</ul><p>Recebe apenas as proficiências de multiclasse, sem equipamento inicial nem novas proficiências em resistências.</p><p>Proficiências: ${escape(multiclassProficiencies(draft.classId))}.</p><a href="book.html#page=164" target="_blank" rel="noopener">Consultar multiclasse · pp. 165–167</a>`
        : "";
      return `${field("Neste nível", `<select data-level-mode="true"><option value="existing" ${draft.levelMode !== "new" ? "selected" : ""}>Evoluir classe atual</option><option value="new" ${draft.levelMode === "new" ? "selected" : ""} ${draft.char.classes.length === 12 ? "disabled" : ""}>Adicionar outra classe · multiclasse</option></select>`)}${field(
        draft.levelMode === "new" ? "Nova classe" : "Classe a evoluir",
        `<select data-level-class="true">${options(
          classes.map((entry) => ({
            value: entry.classId,
            label: entry.level
              ? `${D.classes[entry.classId].name}: ${entry.level} → ${entry.level + 1}`
              : `${D.classes[entry.classId].name}: 1º nível${E.multiclassEligibility(draft.char, entry.classId).allowed ? "" : " · pré-requisito não atendido"}`,
          })),
          draft.classId,
        )}</select>`,
      )}${entryRules}<p>Novos ganhos: ${gains.length ? gains.map((name) => ruleName(name, draft.classId)).join(" · ") : "Progressão dos recursos e características da classe."}</p>${gains.map((name) => source(name, draft.classId)).join("")}<div class="cw-hp">PV: ${draft.hpRoll === null ? "valor fixo " + (c.die / 2 + 1) : "rolagem " + draft.hpRoll} + CON; mínimo 1 por nível.<div><button data-action="rollHp">Rolar 1d${c.die}</button> <button data-action="fixedHp">Usar valor fixo</button></div></div>${field("Regra opcional", `<span><input type="checkbox" data-setup="allowFeats" ${draft.setup.allowFeats ? "checked" : ""}> Permitir talentos no lugar de incremento de habilidade</span>`)}`;
    }
    const s = draft.setup;
    return `<div class="cw-grid">${field("Nome do personagem", `<input data-text="name" value="${escape(s.name)}" maxlength="120" autocomplete="off">`)}${field("Classe inicial", `<select data-setup="classId" data-help-picker="true">${setupOptions(mapOptions(D.classes), draft.classId, "class")}</select>`)}${field(
      "Raça e sub-raça",
      `<select data-setup="raceId" data-help-picker="true">${setupOptions(
        mapOptions(O.races).filter(
          (o) => s.allowFeats || !O.races[o.value].optional,
        ),
        s.raceId,
        "race",
      )}</select>`,
    )}${field("Antecedente", `<select data-setup="backgroundId" data-help-picker="true">${setupOptions(mapOptions(O.backgrounds), s.backgroundId, "background")}</select>`)}${field("Tendência", `<input data-text="alignment" value="${escape(s.alignment || "")}" placeholder="Escolha do jogador">`)}${field("Regra opcional", `<span><input type="checkbox" data-setup="allowFeats" ${s.allowFeats ? "checked" : ""}> Habilitar talentos e Humano Variante</span>`)}</div>${s.classId ? source(D.classes[s.classId].name, s.classId) : ""}${s.raceId ? source(O.races[s.raceId].name, null, "race") : ""}${s.backgroundId ? source(O.backgrounds[s.backgroundId].name) : ""}`;
  }
  function attributes() {
    const s = draft.setup,
      totals = s.rolls.map(
        (g) => g.reduce((a, b) => a + b, 0) - Math.min(...g),
      );
    const methods = [
      { value: "standard", label: "Conjunto padrão: 15, 14, 13, 12, 10, 8" },
      {
        value: "rolled",
        label: "Rolagem: 4d6, descartar o menor; repetir seis vezes",
      },
      {
        value: "pointBuy",
        label: "Compra de pontos: 27 pontos (opcional do livro)",
      },
    ];
    return `${field("Método dos valores iniciais", `<select data-setup="abilityMethod">${options(methods, s.abilityMethod)}</select>`)}${s.abilityMethod === "rolled" ? `<button data-action="rollAbilities">${s.rolls.length ? "Rolar novamente" : "Rolar seis grupos de 4d6"}</button><div class="cw-rolls">${s.rolls.map((g, i) => `<div>Grupo ${i + 1}: ${g.map((n, j) => (j === g.indexOf(Math.min(...g)) ? `<s>${n}</s>` : `<strong>${n}</strong>`)).join(" + ")} = <strong>${totals[i]}</strong></div>`).join("")}</div>` : ""}<div class="cw-grid">${Object.entries(
      D.abilities,
    )
      .map(([key, name]) =>
        field(
          name,
          `<select data-ability="${key}">${
            s.abilityMethod === "rolled"
              ? options(
                  totals.map((n, i) => ({
                    value: String(i),
                    label: `Grupo ${i + 1} → ${n}`,
                  })),
                  s.assignment[key],
                )
              : options(
                  (s.abilityMethod === "standard"
                    ? [15, 14, 13, 12, 10, 8]
                    : [8, 9, 10, 11, 12, 13, 14, 15]
                  ).map((n) => ({ value: String(n), label: String(n) })),
                  String(s.baseScores[key]),
                )
          }</select><span class="cw-muted">Após bônus raciais: ${E.scores(ctx())[key] || "—"}</span>`,
        ),
      )
      .join(
        "",
      )}</div><p>Primeiro distribua os valores. Os bônus da raça são aplicados uma única vez, depois da distribuição.</p>${s.abilityMethod === "pointBuy" ? `<p>Pontos usados: ${Object.values(s.baseScores).reduce((sum, n) => sum + ({ 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }[n] || 0), 0)} / 27</p>` : ""}`;
  }
  function classGains() {
    const d = ctx(),
      c = D.classes[d.classId];
    if (!c) return "";
    const sid =
      d.answers.subclass ||
      draft.char?.classes.find((c) => c.classId === draft.classId)?.subclassId;
    const names = E.classFeatures(d);
    return `<p>Ganhos automáticos de ${escape(c.name)} no nível ${d.level}: <strong>${names.length ? names.map((name) => ruleName(name, d.classId)).join(" · ") : "Progressão dos recursos da classe"}</strong>.</p>${names.map((name) => source(name, d.classId)).join("")}${d.level < c.subLevel ? `<p>A subclasse será escolhida no nível ${c.subLevel} de ${escape(c.name)}.</p>` : ""}`;
  }
  function review() {
    const d = ctx(),
      rows = E.requirements(d).filter(
        (f) => draft.mode !== "prepare" || f.id === "prepared",
      );
    const preview =
      draft.mode === "level"
        ? E.levelUp(draft.char, draft.classId, draft.answers, draft.hpRoll)
        : null;
    return `${preview ? `<p><strong>${preview.classes.map((c) => `${escape(D.classes[c.classId].name)} ${c.level}`).join(" / ")}</strong> · Nível total ${preview.classes.reduce((n, c) => n + c.level, 0)} · PV máximos ${preview.hpMax}</p>${multiclassReview(preview)}` : ""}<p>Confira antes de aplicar. Apenas suas escolhas e os ganhos correspondentes do livro serão adicionados.</p>${
      draft.mode === "create"
        ? `<p><strong>${escape(draft.setup.name)}</strong> · ${escape(O.races[draft.setup.raceId]?.name)} · ${escape(D.classes[draft.classId]?.name)}</p><p>${Object.entries(
            E.finalScores(d),
          )
            .map(([k, n]) => `${D.abilities[k]} ${n}`)
            .join(" · ")}</p>`
        : ""
    }<dl class="cw-review">${rows
      .map(
        (f) =>
          `<div><dt>${escape(f.label)}</dt><dd>${
            array(draft.answers[f.id])
              .map(
                (v) =>
                  `<span tabindex="0" ${root.RuleTooltips.attributes(f.options.find((o) => o.value === v)?.label || v, E.optionReference(d, f, f.options.find((o) => o.value === v) || { value: v, label: v }))}>${escape(f.options.find((o) => o.value === v)?.label || v)}</span>`,
              )
              .join(", ") || "Nenhuma"
          }</dd></div>`,
      )
      .join("")}</dl>${
      draft.mode === "create"
        ? ["traits", "ideals", "bonds", "flaws", "backstory"]
            .map((key, i) =>
              field(
                ["Personalidade", "Ideais", "Ligações", "Defeitos", "História"][
                  i
                ],
                `<textarea data-text="${key}" rows="2">${escape(draft.setup[key])}</textarea>`,
              ),
            )
            .join("") +
          `<details><summary>Descrição física, aliados e tesouros (opcional)</summary><div class="cw-grid">${Object.entries(
            {
              age: "Idade",
              height: "Altura",
              weight: "Peso",
              eyes: "Olhos",
              skin: "Pele",
              hair: "Cabelo",
              appearance: "Aparência",
              allies: "Aliados e organizações",
              treasure: "Tesouros e lembranças",
            },
          )
            .map(([key, label]) =>
              field(
                label,
                `<input data-text="${key}" value="${escape(draft.setup[key])}">`,
              ),
            )
            .join("")}</div></details>`
        : ""
    }`;
  }
  function currentErrors() {
    const id = visibleSteps()[step][0],
      d = ctx(),
      errors = [];
    if (id === "identity" && draft.mode === "level")
      errors.push(...E.multiclassEligibility(draft.char, draft.classId).errors);
    if (id === "identity" && draft.mode === "create") {
      if (!draft.setup.name.trim())
        errors.push("Informe o nome do personagem.");
      if (!D.classes[draft.classId]) errors.push("Escolha a classe.");
      if (!O.races[draft.setup.raceId])
        errors.push("Escolha a raça e sub-raça.");
      if (!O.backgrounds[draft.setup.backgroundId])
        errors.push("Escolha o antecedente.");
    }
    for (const f of E.requirements(d).filter(
      (f) => f.step === id && (draft.mode !== "prepare" || f.id === "prepared"),
    )) {
      const vals = array(draft.answers[f.id]).filter((v) => v !== "");
      if (
        vals.length < f.min ||
        vals.length > f.count ||
        (f.unique && new Set(vals).size !== vals.length) ||
        vals.some((v) => !f.options.some((o) => o.value === v))
      )
        errors.push(`Confira “${f.label}”.`);
    }
    if (id === "attributes")
      errors.push(
        ...E.validate(d).filter((e) =>
          /Atributos iniciais|conjunto padrão|Compra de pontos|grupos de 4d6|totais rolados/.test(
            e,
          ),
        ),
      );
    return errors;
  }
  function render() {
    const list = visibleSteps(),
      [id, title] = list[step],
      d = ctx();
    const view = `${draft.mode}:${draft.classId}:${d.level}:${id}`;
    // Trocas completas de tela também conservam o contexto da mesma etapa.
    // Checkboxes usam refreshChoices e mantêm seus controles conectados.
    const state = view === renderedView ? captureView() : null;
    closePicker();
    root.RuleTooltips.hide();
    const fields = visibleChoices(d);
    const body =
      id === "identity"
        ? identity()
        : id === "attributes"
          ? attributes()
          : id === "class"
            ? classGains()
            : id === "review"
              ? review()
              : "";
    host.innerHTML = `<section class="cw-dialog t-card-accent" data-scroll-window><header><h2 id="cw-title" tabindex="-1">${draft.mode === "create" ? "Criar personagem" : draft.mode === "prepare" ? "Preparar magias" : "Evoluir personagem"} · ${title}</h2><button data-action="close" aria-label="Fechar">×</button></header><nav aria-label="Etapas">${list.map(([, label], i) => `<span ${i === step ? 'aria-current="step"' : ""}>${i + 1}. ${label}</span>`).join("")}</nav><div class="cw-body" data-scroll-content><div id="cw-errors" role="alert" hidden></div>${body}<div class="cw-fields" style="display:contents">${fields.map(choice).join("")}</div>${!body && !fields.length ? "<p>Nenhuma escolha adicional nesta etapa para a classe e o nível selecionados.</p>" : ""}${id === "equipment" ? `<p>${field("Usar equipamento inicial", `<span><input type="checkbox" data-setup="wearStartingArmor" ${draft.setup.wearStartingArmor !== false ? "checked" : ""}> Começar com a armadura vestida e o escudo equipado</span>`)}Também recebe: ${escape((E.progression.equipment[draft.classId]?.fixed || []).join(", "))} e equipamento do antecedente. As moedas são as do antecedente; nenhum item de exemplo do personagem de referência é copiado.</p>` : ""}</div><footer><button data-action="back" ${step === 0 ? "disabled" : ""}>Voltar</button><a href="book.html" target="_blank" rel="noopener">Consultar livro</a><button data-action="${step === list.length - 1 ? "finish" : "next"}" class="t-btn-primary">${step === list.length - 1 ? "Aplicar à ficha" : "Continuar"}</button></footer></section>`;
    renderedView = view;
    renderedChoices = new Map(fields.map((f) => [f.id, JSON.stringify(f)]));
    restoreView(state);
  }
  function showErrors(errors) {
    const box = host.querySelector("#cw-errors");
    box.hidden = false;
    box.textContent = errors.join("\n");
    box.scrollIntoView({ block: "nearest" });
  }
  async function finish() {
    try {
      if (draft.mode === "prepare") {
        const char = draft.char,
          field = E.requirements(ctx()).find((f) => f.id === "prepared"),
          values = array(draft.answers.prepared);
        if (
          !field ||
          values.length > field.count ||
          values.some((v) => !field.options.some((o) => o.value === v))
        )
          throw new Error("Seleção de magias preparadas inválida.");
        for (const id of values)
          if (
            !char.spells.some(
              (s) =>
                s.classId === draft.classId &&
                (s.bookId || E.spell(s.name)?.id) === id,
            )
          )
            char.spells.push(
              E.toSheetSpell(E.spell(id), draft.classId, { prepared: true }),
            );
        char.spells.forEach((s) => {
          if (
            s.circle > 0 &&
            s.classId === draft.classId &&
            !s.automatic &&
            !s.extraSource
          )
            s.prepared = values.includes(s.bookId || E.spell(s.name)?.id);
        });
        root.commitLeveledCharacter(char, "Atualizou magias preparadas");
      } else if (draft.mode === "create")
        root.commitCreatedCharacter(E.create(draft.setup, draft.answers));
      else
        root.commitLeveledCharacter(
          E.levelUp(draft.char, draft.classId, draft.answers, draft.hpRoll),
          `${E.multiclassEligibility(draft.char, draft.classId).adding ? "Adicionou" : "Evoluiu"} ${D.classes[draft.classId].name}`,
        );
      close(true);
    } catch (error) {
      showErrors(error.problems || [error.message]);
    }
  }
  root.CharacterWizard = { openCreate, openLevel, openPrepare, close };
})(globalThis);
