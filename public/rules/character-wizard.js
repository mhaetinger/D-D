/* Interface do criador. O rascunho não altera fichas: concluir chama o motor e só
   então entrega um novo objeto ao salvamento já existente do protótipo. */
(function (root) {
  const guide = () => root.CharacterGuide;
  let rolling = false, rollRevision = 0;
  function persistDraft(open = true) {
    if (!draft || draft.mode !== "create") return;
    const saved = guide().saveDraft(draft, step, open);
    const status = host?.querySelector("[data-draft-status]");
    if (status)
      status.textContent = saved
        ? "Rascunho salvo automaticamente neste navegador."
        : "Rascunho só nesta aba: não foi possível salvá-lo. Mantenha a página aberta.";
  }
  root.addEventListener?.("pagehide", () => {
    if (draft?.mode === "create" && host && !host.classList.contains("hidden")) {
      persistDraft(true);
    }
  });
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
          `<option value="${escape(o.value)}" ${o.value === value ? "selected" : root.RuleTooltips.attributes(o.label, o.reference || o.spell)}>${escape(o.label)}</option>`,
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
  function filterMarket() {
    if (!host) return;
    const normalize = (value) =>
      String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const searchInput = host.querySelector("[data-market-search]");
    const catSelect = host.querySelector("[data-market-category]");
    const q = normalize(searchInput?.value || "");
    const cat = catSelect?.value || "all";
    host.querySelectorAll("[data-market-row]").forEach((row) => {
      const matchCat = cat === "all" || row.dataset.marketCat === cat;
      const matchText = !q || normalize(row.textContent).includes(q);
      row.hidden = !(matchCat && matchText);
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
      "data-market-search",
      "data-market-category",
      "data-custom-item-name",
      "data-custom-item-qty",
      "data-ability",
      "data-text",
      "data-alignment",
      "data-action",
      "data-item-name",
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
      marketScroll: body.querySelector(".cw-market-list")?.scrollTop || 0,
      marketSearch: body.querySelector("[data-market-search]")?.value || "",
      marketCategory: body.querySelector("[data-market-category]")?.value || "all",
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
      if (state.open.has(detailKey(el))) el.open = true;
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
    const marketCat = body.querySelector("[data-market-category]");
    const marketSearch = body.querySelector("[data-market-search]");
    if (marketCat && state.marketCategory) marketCat.value = state.marketCategory;
    if (marketSearch && state.marketSearch) marketSearch.value = state.marketSearch;
    if (marketCat || marketSearch) filterMarket();
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
    const marketList = body.querySelector(".cw-market-list");
    if (marketList && state.marketScroll) marketList.scrollTop = state.marketScroll;
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
    guide().bindIncrements(host, E.scores(ctx()), draft.answers, persistDraft);
    persistDraft();
    restoreView(state);
    root.lucide?.createIcons();
  }
  function formatCoinsCp(cp) {
    const sign = cp < 0 ? "-" : "";
    const abs = Math.abs(Math.round(cp));
    const po = Math.floor(abs / 100);
    const pp = Math.floor((abs % 100) / 10);
    const pc = abs % 10;
    const parts = [];
    if (po || (!pp && !pc)) parts.push(`${po} po`);
    if (pp) parts.push(`${pp} pp`);
    if (pc) parts.push(`${pc} pc`);
    return sign + parts.join(", ");
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
      const suggestionPick = event.target.closest("[data-pick-suggestion]");
      if (suggestionPick) {
        const key = suggestionPick.dataset.suggestionKey;
        const input = host.querySelector(`[data-text="${key}"]`);
        const values = guide().backgroundSuggestions(draft.setup.backgroundId)[key] || [];
        const index = Number(suggestionPick.dataset.pickSuggestion);
        draft.setup.customizedFields ||= {};
        if (input && suggestionPick.dataset.pickSuggestion === "custom") {
          input.value = "";
          draft.setup.customizedFields[key] = true;
          input.readOnly = false;
        } else if (input && values[index]) {
          input.value = values[index];
          draft.setup.customizedFields[key] = false;
          input.readOnly = true;
        }
        if (input) {
          draft.setup[key] = input.value;
          persistDraft(); closePicker(); input.focus({ preventScroll: true });
        }
        return;
      }
      const suggestionTrigger = event.target.closest("[data-suggestion-trigger]");
      if (suggestionTrigger) {
        openSuggestionPicker(suggestionTrigger, suggestionTrigger.dataset.suggestionTrigger);
        return;
      }
      const customSuggestion = event.target.closest("[data-suggestion-custom]");
      if (customSuggestion) {
        const input = host.querySelector(`[data-text="${customSuggestion.dataset.suggestionCustom}"]`);
        if (input) {
          input.value = "";
          draft.setup[customSuggestion.dataset.suggestionCustom] = "";
          persistDraft(); input.focus({ preventScroll: true });
        }
        return;
      }
      const suggestion = event.target.closest("[data-suggestion-key]");
      if (suggestion) {
        const key = suggestion.dataset.suggestionKey;
        const value = guide().backgroundSuggestions(draft.setup.backgroundId)[key]?.[+suggestion.dataset.suggestionIndex];
        const input = host.querySelector(`[data-text="${key}"]`);
        if (value && input) {
          input.value = value;
          draft.setup[key] = input.value;
          persistDraft(); input.focus({ preventScroll: true });
        }
        return;
      }
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      if (action === "close") return close();
      if (action === "discardDraft") return discardDraft();
      if (action === "back") {
        step = Math.max(0, step - 1);
        render();
      }
      if (action === "next") {
        if (rolling) return;
        const errors = currentErrors();
        if (errors.length) return showErrors(errors);
        step++;
        render();
        host.querySelector("h2")?.focus();
      }
      if (action === "finish") finish();
      if (action === "rollAbilities") {
        if (rolling) return;
        if (
          draft.setup.rolls.length &&
          !(await root.confirmDestructiveAction(
            "Rolar atributos novamente?",
            "Os seis resultados atuais e sua distribuição serão substituídos.",
            "Rolar novamente",
          ))
        )
          return;
        const version = ++rollRevision, current = draft;
        rolling = true; render();
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches) await new Promise(resolve => setTimeout(resolve, 1100));
        if (version !== rollRevision || draft !== current || draft.setup.abilityMethod !== "rolled") return;
        rolling = false;
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
      if (action === "rollStartingHp") {
        const c = D.classes[draft.classId];
        if (!c) return;
        draft.setup.hpMethod = "rolled";
        draft.setup.hpRoll = 1 + Math.floor(Math.random() * c.die);
        render();
      }
      if (action === "rollWealth") {
        const res = E.rollStartingWealth(draft.classId);
        draft.setup.equipmentMethod = "wealth";
        draft.setup.wealthRolls = res.rolls;
        draft.setup.wealthGold = res.totalGold;
        render();
      }
      if (action === "avgWealth") {
        const spec = E.startingWealth[draft.classId] || { avgGold: 100 };
        draft.setup.equipmentMethod = "wealth";
        draft.setup.wealthRolls = [];
        draft.setup.wealthGold = spec.avgGold;
        render();
      }
      if (action === "buyItem" || action === "incPurchase") {
        const name = button.dataset.itemName;
        if (!name) return;
        const catalog = E.equipmentCatalog();
        const item = catalog.find((x) => x.name === name);
        const list = array(draft.setup.wealthPurchases);
        const totalCp = Math.round(Number(draft.setup.wealthGold || 0) * 100);
        const spentCp = list.reduce((sum, entry) => {
          const found = catalog.find((x) => x.name === entry.name);
          return sum + (found ? found.costCp * (entry.qty || 1) : 0);
        }, 0);
        if (item && spentCp + item.costCp > totalCp) {
          return root.showToast("Saldo de ouro insuficiente para comprar este item.");
        }
        const existing = list.find((x) => x.name === name);
        if (existing) existing.qty = (Number(existing.qty) || 1) + 1;
        else list.push({ name, qty: 1 });
        draft.setup.wealthPurchases = list;
        render();
      }
      if (action === "decPurchase") {
        const name = button.dataset.itemName;
        if (!name) return;
        const list = array(draft.setup.wealthPurchases);
        const idx = list.findIndex((x) => x.name === name);
        if (idx >= 0) {
          if ((list[idx].qty || 1) > 1) list[idx].qty--;
          else list.splice(idx, 1);
          draft.setup.wealthPurchases = list;
          render();
        }
      }
      if (action === "addCustomItem") {
        const nameInput = host.querySelector("[data-custom-item-name]");
        const qtyInput = host.querySelector("[data-custom-item-qty]");
        const name = String(nameInput?.value || "").trim();
        const qty = Math.max(1, Math.min(99, parseInt(qtyInput?.value || "1", 10) || 1));
        if (!name) return root.showToast("Informe o nome do item personalizado.");
        const list = array(draft.setup.customEquipment);
        list.push({ name, qty });
        draft.setup.customEquipment = list;
        if (nameInput) nameInput.value = "";
        if (qtyInput) qtyInput.value = "1";
        render();
      }
      if (action === "removeCustomItem") {
        const idx = Number(button.dataset.customIndex);
        const list = array(draft.setup.customEquipment);
        if (Number.isInteger(idx) && idx >= 0 && idx < list.length) {
          list.splice(idx, 1);
          draft.setup.customEquipment = list;
          render();
        }
      }
    });
    host.addEventListener("input", (event) => {
      const el = event.target;
      if (el.dataset.search) {
        filterChoices(el);
        return;
      }
      if (el.hasAttribute("data-market-search")) {
        filterMarket();
        return;
      }
      if (el.dataset.text) {
        draft.setup[el.dataset.text] = el.value;
        draft.setup.customizedFields ||= {};
        draft.setup.customizedFields[el.dataset.text] = true;
        persistDraft();
        return;
      }
      if (el.dataset.setup && ["hpRoll", "hpCustom", "wealthGold", "customGold"].includes(el.dataset.setup)) {
        const key = el.dataset.setup;
        draft.setup[key] = el.value;
        if (key === "wealthGold") draft.setup.wealthRolls = [];
        persistDraft();
        if (key === "hpRoll" || key === "hpCustom") {
          const summary = host.querySelector(".cw-hp-summary");
          if (summary) {
            const hp = E.startingHpPreview(ctx());
            const conText = `${hp.conMod >= 0 ? "+" : "−"} ${Math.abs(hp.conMod)} CON`;
            const extraParts = [
              hp.raceBonus ? `+ ${hp.raceBonus} Raça` : "",
              hp.draconicBonus ? "+ 1 Resiliência Dracônica" : "",
              hp.toughBonus ? "+ 2 Talento Robusto" : "",
            ].filter(Boolean);
            const formulaText =
              hp.method === "custom" && hp.validCustom
                ? `Valor personalizado (${hp.total} PV)`
                : `Dado ${hp.baseDie} ${conText}${extraParts.length ? " " + extraParts.join(" ") : ""} = ${hp.total} PV`;
            summary.innerHTML = `<span>PV iniciais na ficha: <strong>${hp.total} PV</strong></span><span class="cw-muted">(${escape(formulaText)})</span>`;
          }
        }
        if (key === "wealthGold") {
          const catalog = E.equipmentCatalog();
          const purchases = array(draft.setup.wealthPurchases);
          const totalCp = Math.round(Number(draft.setup.wealthGold || 0) * 100);
          const spentCp = purchases.reduce((sum, entry) => {
            const item = catalog.find((x) => x.name === entry.name);
            return sum + (item ? item.costCp * (entry.qty || 1) : 0);
          }, 0);
          const remCp = totalCp - spentCp;
          const wallet = host.querySelector(".cw-wallet-bar");
          if (wallet) {
            wallet.innerHTML = `<span>Orçamento: <strong>${formatCoinsCp(totalCp)}</strong></span><span>Gasto: <strong>${formatCoinsCp(spentCp)}</strong></span><span>Saldo restante (vai para a ficha): <strong>${formatCoinsCp(remCp)}</strong></span>`;
          }
          host.querySelectorAll('[data-action="buyItem"]').forEach((btn) => {
            const item = catalog.find((x) => x.name === btn.dataset.itemName);
            const canAfford = item ? item.costCp <= remCp : false;
            btn.disabled = !canAfford;
            btn.textContent = canAfford ? "+ Comprar" : "Sem saldo";
          });
        }
      }
    });
    host.addEventListener("change", async (event) => {
      const el = event.target,
        id = el.dataset.answer;
      if (el.dataset.suggestionSelect && el.value !== '') {
        const key = el.dataset.suggestionSelect;
        const text = guide().backgroundSuggestions(draft.setup.backgroundId)[key]?.[Number(el.value)];
        if (text) { draft.setup[key] = text; host.querySelector(`[data-text="${key}"]`).value = text; persistDraft(); }
        return;
      }
      if (el.hasAttribute("data-market-category")) {
        filterMarket();
        return;
      }
      if (el.hasAttribute("data-alignment")) {
        draft.setup.customAlignment = el.value === "custom";
        draft.setup.alignment = el.value === "custom" ? "" : el.value;
        render(); return;
      }
      if (el.dataset.setup) {
        const key = el.dataset.setup,
          next = el.type === "checkbox" ? el.checked : el.value;
        if (["hpRoll", "hpCustom", "wealthGold", "customGold"].includes(key)) {
          draft.setup[key] = next;
          persistDraft();
          return;
        }
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
        const previous = draft.setup[key];
        draft.setup[key] = next;
        if (key === "backgroundId" && previous !== next) {
          // Trocar o antecedente atualiza as sugestões, preservando a escrita.
          draft.setup.customizedFields = {};
        }
        if (key === "classId") {
          draft.classId = next;
          const die = D.classes[next]?.die;
          if (die && Number(draft.setup.hpRoll) > die) draft.setup.hpRoll = die;
        }
        if (key === "equipmentMethod" && next === "wealth" && (draft.setup.wealthGold === "" || draft.setup.wealthGold === undefined)) {
          const spec = E.startingWealth[draft.classId];
          if (spec) draft.setup.wealthGold = spec.avgGold;
        }
        if (key === "abilityMethod") {
          rollRevision++; rolling = false; draft.setup.assignment = {};
          draft.setup.baseScores =
            next === "pointBuy" || next === "adapted"
              ? Object.fromEntries(Object.keys(D.abilities).map((k) => [k, 8]))
              : {};
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
        baseScores: {},
        rolls: [],
        assignment: {},
        allowFeats: false,
        wearStartingArmor: true,
        hpMethod: "max",
        hpRoll: null,
        hpCustom: "",
        equipmentMethod: "packages",
        wealthGold: "",
        wealthRolls: [],
        wealthPurchases: [],
        customEquipment: [],
        customGold: "",
        customizedFields: {},
      },
      classId: "",
      answers: {},
      char: null,
      hpRoll: null,
    };
    const saved = guide().loadDraft();
    if (saved) {
      draft = saved.draft;
      step = saved.step;
      draft.setup.hpMethod ||= "max";
      draft.setup.equipmentMethod ||= "packages";
      draft.setup.wealthRolls ||= [];
      draft.setup.wealthPurchases ||= [];
      draft.setup.customEquipment ||= [];
      if (draft.setup.customGold === undefined) draft.setup.customGold = "";
      draft.setup.customizedFields ||= {};
    }
    initial = JSON.stringify(draft);
    render();
    host.classList.remove("hidden");
    host.querySelector("input, h2")?.focus();
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
      !force && draft.mode !== "create" &&
      JSON.stringify(draft) !== initial &&
      !(await root.confirmDestructiveAction(
        "Descartar rascunho?",
        "As escolhas ainda não foram aplicadas à ficha.",
        "Descartar rascunho",
      ))
    )
      return;
    const wasCreate = draft.mode === "create";
    persistDraft(false);
    rollRevision++; rolling = false;
    closePicker();
    root.RuleTooltips.hide();
    host.classList.add("hidden");
    draft = null;
    priorFocus?.focus();
    if (wasCreate && !force) root.renderAll?.();
  }
  async function discardDraft() {
    if (
      !(await root.confirmDestructiveAction(
        "Descartar personagem em andamento?",
        "Todo o progresso deste rascunho de criação será apagado deste navegador. Suas fichas prontas não serão alteradas.",
        "Descartar rascunho",
      ))
    )
      return false;
    guide().clearDraft();
    rollRevision++;
    rolling = false;
    closePicker();
    root.RuleTooltips?.hide();
    if (host) host.classList.add("hidden");
    draft = null;
    priorFocus?.focus();
    root.renderAll?.();
    root.showToast?.("Rascunho de personagem descartado.");
    return true;
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
    return `<details class="cw-source"><summary>Consultar ${escape(name)}</summary><p>${escape(root.RuleTooltips.formatText(ref.text))}</p><a href="book.html#page=${ref.pdfPage}" target="_blank" rel="noopener">Abrir no livro · p. ${ref.page}</a></details>`;
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
  function openSuggestionPicker(trigger, key) {
    closePicker();
    pickerSelect = trigger;
    picker = document.createElement("div");
    picker.className = "cw-picker-list";
    picker.setAttribute("data-scroll-window", "");
    picker.id = "cw-suggestion-options";
    picker.setAttribute("role", "listbox");
    picker.setAttribute("aria-label", "Sugestões do Livro do Jogador");
    const values = guide().backgroundSuggestions(draft.setup.backgroundId)[key] || [];
    picker.innerHTML = values.map((value, index) => `<button type="button" role="option" data-pick-suggestion="${index}" data-suggestion-key="${key}"><span>${index + 1}. ${escape(value)}</span></button>`).join("") + `<button type="button" role="option" class="cw-suggestion-custom" data-pick-suggestion="custom" data-suggestion-key="${key}"><span>Personalizar: escrever meu próprio texto</span></button>`;
    host.append(picker);
    const rect = trigger.getBoundingClientRect();
    picker.style.width = `${Math.min(rect.width, window.innerWidth - 24)}px`;
    picker.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - picker.offsetWidth - 12))}px`;
    const below = window.innerHeight - rect.bottom - 12,
      above = rect.top - 12;
    picker.style.maxHeight = `${Math.min(Math.max(below, above), window.innerHeight * 0.45)}px`;
    picker.style.top = `${below >= picker.offsetHeight ? rect.bottom : Math.max(12, rect.top - picker.offsetHeight)}px`;
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("aria-controls", picker.id);
    picker.querySelector("button")?.focus();
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
  const SPELL_DMG_ICONS = {
    fogo: ["flame", "Fogo", "badge-fogo"],
    gelo: ["snowflake", "Frio / Gelo", "badge-frio"],
    frio: ["snowflake", "Frio / Gelo", "badge-frio"],
    eletrico: ["zap", "Elétrico", "badge-eletrico"],
    energia: ["sparkles", "Energia (Force)", "badge-energia"],
    necrotico: ["skull", "Necrótico", "badge-necrotico"],
    trovao: ["cloud-lightning", "Trovão", "badge-trovejante"],
    trovejante: ["cloud-lightning", "Trovão", "badge-trovejante"],
    cortante: ["swords", "Cortante", "badge-cortante"],
    perfurante: ["swords", "Perfurante", "badge-cortante"],
    concussao: ["swords", "Concussão", "badge-cortante"],
    acido: ["droplets", "Ácido", "badge-acido"],
    veneno: ["skull", "Veneno", "badge-veneno"],
    psiquico: ["brain", "Psíquico", "badge-psiquico"],
    radiante: ["sun", "Radiante", "badge-radiante"],
    cura: ["heart-pulse", "Cura", "badge-utilidade"],
    defesa: ["shield", "Defesa", "badge-utilidade"],
    utilidade: ["wand-2", "Utilidade / Controle", "badge-utilidade"],
  };
  const SPELL_TARGET_ICONS = {
    mira: ["crosshair", "Mira (1 Alvo)"],
    auto: ["target", "Teleguiado"],
    multi: ["target", "Teleguiado"],
    esfera: ["circle-dot", "Área (Esfera)"],
    cilindro: ["circle-dot", "Área (Cilindro)"],
    linha: ["move-right", "Área (Linha)"],
    cubo: ["box", "Área (Cubo)"],
    cone: ["triangle", "Área (Cone)"],
    self: ["user-check", "Pessoal / Toque"],
    pessoal: ["user-check", "Pessoal / Toque"],
    ritual: ["book-open", "Ritual"],
    ritual_inv: ["book-open", "Ritual"],
  };
  const SPELL_DEF_LABELS = {
    atq_magico: "Ataque mágico contra CA",
    tr_des: "Resistência de DES",
    tr_con: "Resistência de CON",
    tr_sab: "Resistência de SAB",
    tr_for: "Resistência de FOR",
    tr_int: "Resistência de INT",
    tr_car: "Resistência de CAR",
    auto_hit: "Acerto automático",
  };
  function choice(f) {
    if (f.id === 'asi') return guide().incrementMarkup(f);
    const selected = array(draft.answers[f.id]);
    const items = f.options.map((o) => ({
      ...o,
      reference: guide().optionReference(ctx(), f, o),
    }));
    let control = "";
    if (f.count === 1) {
      const picked = items.find((o) => o.value === selected[0]);
      control = `<select data-answer="${f.id}" ${items.some((o) => o.reference?.text) ? 'data-help-picker="true"' : ""} aria-label="${escape(f.label)}">${options(items, selected[0], f.min === 0 ? "Manter / não trocar" : "Escolha…")}</select>${picked?.spell ? spellDetails(picked.spell) : picked?.reference && f.id !== 'advancement' ? `<details class="cw-source"><summary>Consultar ${escape(picked.label)}</summary><p>${escape(root.RuleTooltips.formatText(picked.reference.text))}</p><a href="book.html#page=${picked.reference.pdfPage}" target="_blank" rel="noopener">Abrir no livro · p. ${picked.reference.page}</a></details>` : ""}`;
    } else if (!f.unique)
      control = Array.from(
        { length: f.count },
        (_, i) => {
          const picked = items.find(o => o.value === selected[i]);
          return `<select data-answer="${f.id}" data-index="${i}" data-help-picker="true" aria-label="${escape(f.label)} — ponto ${i + 1}">${options(items, selected[i])}</select>${picked?.reference ? `<details class="cw-source"><summary>Como usar ${escape(picked.label)}</summary><p>${escape(root.RuleTooltips.formatText(picked.reference.text))}</p><a href="book.html#page=${picked.reference.pdfPage}" target="_blank" rel="noopener">Consultar no livro · p. ${picked.reference.page}</a></details>` : ""}`;
        },
      ).join("");
    else
      control = `${items.length > 10 ? `<input data-search="${f.id}" type="search" placeholder="Buscar nesta lista…" aria-label="Buscar ${escape(f.label)}">` : ""}<div class="cw-options">${items.map((o) => `<div data-option-row><label ${o.spell || o.reference ? "" : root.RuleTooltips.attributes(o.label, o.reference)}><input data-answer="${f.id}" type="checkbox" value="${escape(o.value)}" ${selected.includes(o.value) ? "checked" : ""}> <span>${escape(o.label)}</span></label>${o.spell ? spellDetails(o.spell) : o.reference ? `<details class="cw-source"><summary>Como usar ${escape(o.label)}</summary><p>${escape(root.RuleTooltips.formatText(o.reference.text))}</p><a href="book.html#page=${o.reference.pdfPage}" target="_blank" rel="noopener">Consultar no livro · p. ${o.reference.page}</a></details>` : ""}</div>`).join("")}</div>`;
    return `<fieldset class="cw-choice" data-choice="${escape(f.id)}"><legend>${escape(f.label)} <span class="cw-muted">${f.count > 1 ? `${selected.filter(Boolean).length}/${f.count}` : f.min === 0 ? "opcional" : ""}</span></legend>${control}</fieldset>`;
  }
  function spellDetails(s) {
    const meta = E.spellMeta ? E.spellMeta(s) : null;
    const [dmgIcon, dmgLabel, dmgCls] =
      SPELL_DMG_ICONS[meta?.dmgType] || SPELL_DMG_ICONS.utilidade;
    const targetInfo = SPELL_TARGET_ICONS[meta?.targetType];
    const defLabel = SPELL_DEF_LABELS[meta?.defType];
    const badges = meta
      ? `<div class="cw-spell-meta"><span class="spell-effect-badge ${dmgCls}"><i data-lucide="${dmgIcon}" class="w-3.5 h-3.5" aria-hidden="true"></i><strong>${escape(dmgLabel)}</strong>${meta.diceFormula ? `<span>· ${escape(meta.diceFormula)}</span>` : ""}</span>${targetInfo ? `<span class="spell-effect-badge"><i data-lucide="${targetInfo[0]}" class="w-3.5 h-3.5" aria-hidden="true"></i><span>${escape(s.range ? `${s.range} · ${targetInfo[1]}` : targetInfo[1])}</span></span>` : ""}${defLabel ? `<span class="spell-effect-badge"><span>${escape(defLabel)}</span></span>` : ""}${s.concentration ? `<span class="spell-effect-badge"><span>Concentração</span></span>` : ""}</div>`
      : "";
    return `${badges}<details class="cw-source"><summary>Descrição e consulta</summary><p>${escape(root.RuleTooltips.formatText(s.text))}</p><a href="book.html#page=${s.pdfPage}" target="_blank" rel="noopener">Abrir ${escape(s.name)} no livro</a></details>`;
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
      )}${entryRules}<p>Novos ganhos: ${gains.length ? gains.map((name) => (source(name, draft.classId) ? escape(name) : ruleName(name, draft.classId))).join(" · ") : "Progressão dos recursos e características da classe."}</p>${gains.map((name) => source(name, draft.classId)).join("")}<div class="cw-hp">PV: ${draft.hpRoll === null ? "valor fixo " + (c.die / 2 + 1) : "rolagem " + draft.hpRoll} + CON; mínimo 1 por nível.<div><button data-action="rollHp">Rolar 1d${c.die}</button> <button data-action="fixedHp">Usar valor fixo</button></div></div>${field("Regra opcional", `<span><input type="checkbox" data-setup="allowFeats" ${draft.setup.allowFeats ? "checked" : ""}> Permitir talentos no lugar de incremento de habilidade</span>`)}`;
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
    )}${field("Antecedente", `<select data-setup="backgroundId" data-help-picker="true">${setupOptions(mapOptions(O.backgrounds), s.backgroundId, "background")}</select>`)}${`<div>${guide().alignmentMarkup(s.alignment, s.customAlignment)}</div>`}${field("Regra opcional", `<span><input type="checkbox" data-setup="allowFeats" ${s.allowFeats ? "checked" : ""}> Habilitar talentos e Humano Variante</span><span class="cw-muted">Com a aprovação do Mestre, talentos podem substituir aumentos de habilidade em níveis específicos. O Humano Variante recebe +1 em duas habilidades, uma perícia e um talento no nível 1, em vez dos bônus do humano padrão. Deixe desmarcado para usar as regras sem essa opção.</span>`)}</div>${originHighlights(s)}${characterCharacteristicsSection(s)}`;
  }
  function originHighlights(s) {
    const cls = D.classes[s.classId],
      race = O.races[s.raceId],
      bg = O.backgrounds[s.backgroundId];
    const consults = `${s.classId ? source(cls.name, s.classId) : ""}${s.raceId ? source(race.name, null, "race") : ""}${s.backgroundId ? source(bg.name) : ""}`;
    if (!cls && !race && !bg) return consults;
    const raceBonuses = race
      ? Object.entries(race.bonus || {})
          .map(([k, v]) => `+${v} ${D.abilities[k]}`)
          .join(", ") || (race.abilityChoices ? `+1 em ${race.abilityChoices} habilidades` : "")
      : "";
    return `<div class="cw-origin-highlights">${
      cls
        ? `<div class="cw-origin-card"><strong>Classe · ${escape(cls.name)}</strong><span>Dado de Vida d${cls.die} · 1º nível: ${escape((cls.features?.[1] || []).join(" · ") || "Recursos de classe")}</span></div>`
        : ""
    }${
      race
        ? `<div class="cw-origin-card"><strong>Raça · ${escape(race.name)}</strong><span>${raceBonuses ? `${escape(raceBonuses)} · ` : ""}Desloc. ${race.speed} m · ${escape((race.traits || []).join(" · "))}</span></div>`
        : ""
    }${
      bg
        ? `<div class="cw-origin-card"><strong>Antecedente · ${escape(bg.name)}</strong><span>Característica: ${escape(bg.feature)} · Perícias: ${escape((bg.skills || []).map((k) => D.skills[k]).join(", "))}</span></div>`
        : ""
    }</div>${consults}`;
  }
  function characterCharacteristicsSection(s, editable = true) {
    return `<section class="cw-choice cw-characteristics-box" data-choice="characterCharacteristics">
      <div class="cw-characteristics-heading"><h3>Personalidade e história</h3><span>Livro do Jogador · Cap. 4</span></div>
      <p class="cw-characteristics-intro">${editable ? "Dê vida ao personagem desde o início. Use uma sugestão do seu antecedente como ponto de partida, adapte o texto ou escreva livremente. Você poderá revisar tudo depois." : "Confira o texto que será levado para a ficha. Para alterar, volte à etapa Identidade."}</p>
      ${!s.backgroundId ? `<p class="cw-muted">Selecione um antecedente acima para ver as sugestões de personalidade, ideais, ligações e defeitos do Livro do Jogador.</p>` : ""}
      <div class="cw-grid">${["traits", "ideals", "bonds", "flaws"]
        .map(
          (key, i) =>
            `<div data-choice="char-${key}">${field(
              ["Personalidade", "Ideais", "Ligações", "Defeitos"][i],
              editable ? `<select data-suggestion-select="${key}" aria-label="Sugestões de ${["Personalidade","Ideais","Ligações","Defeitos"][i]}"><option value="">Escrever livremente ou escolher uma sugestão…</option>${(guide().backgroundSuggestions(s.backgroundId)[key] || []).map((text,index)=>`<option value="${index}">${escape(text)}</option>`).join('')}</select><input data-text="${key}" value="${escape(s[key])}" aria-label="Editar ${["Personalidade","Ideais","Ligações","Defeitos"][i]}">` : `<div class="cw-readonly-text">${escape(s[key] || "Nenhum texto preenchido")}</div>`,
            )}</div>`,
        )
        .join("")}</div>
      ${field("História", editable ? `<textarea data-text="backstory" rows="2">${escape(s.backstory)}</textarea>` : `<div class="cw-readonly-text">${escape(s.backstory || "Nenhuma história preenchida")}</div>`)}
      <details open class="cw-physical-details" data-choice="char-physical"><summary>${editable ? "Descrição física, aliados e tesouros (opcional)" : "Descrição física, aliados e tesouros"}</summary><div class="cw-grid">${Object.entries(
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
          field(label, editable ? `<input data-text="${key}" value="${escape(s[key])}">` : `<div class="cw-readonly-text">${escape(s[key] || "Não informado")}</div>`),
        )
        .join("")}</div></details>
    </section>`;
  }
  function attributes() {
    const s = draft.setup, totals = guide().totals(s);
    const methods = [
      { value: "standard", label: "Conjunto padrão: 15, 14, 13, 12, 10, 8" },
      { value: "rolled", label: "Rolagem: 4d6, descartar o menor; repetir seis vezes" },
      { value: "pointBuy", label: "Compra de pontos: 27 pontos (opcional do livro)" },
      { value: "adapted", label: "Livre / Adaptado da mesa (não usa o orçamento de 27 pontos)" },
    ];
    return `${field("Método dos valores iniciais", `<select data-setup="abilityMethod">${options(methods, s.abilityMethod)}</select>`)}${s.abilityMethod === "rolled" ? `<button data-action="rollAbilities" ${rolling ? "disabled" : ""}>${rolling ? "Rolando…" : s.rolls.length ? "Rolar novamente" : "Rolar seis grupos de 4d6"}</button>${rolling ? '<div class="cw-rolling" role="status" aria-label="Rolando os seis grupos de dados"><span>⚄</span><span>⚂</span><span>⚅</span><span>⚃</span></div>' : `<div class="cw-rolls">${s.rolls.map((g, i) => `<div>Grupo ${i + 1}: ${g.map((n, j) => (j === g.indexOf(Math.min(...g)) ? `<s aria-label="${n}, descartado">${n}</s>` : `<strong>${n}</strong>`)).join(" + ")} = <strong>${totals[i]}</strong></div>`).join("")}</div>`}` : ""}${rolling ? "" : guide().abilityMarkup()}`;
  }
  function startingHpSection(d) {
    if (draft.mode !== "create" || !D.classes[d.classId]) return "";
    const hp = E.startingHpPreview(d);
    const conText = `${hp.conMod >= 0 ? "+" : "−"} ${Math.abs(hp.conMod)} CON`;
    const extraParts = [
      hp.raceBonus ? `+ ${hp.raceBonus} Raça` : "",
      hp.draconicBonus ? "+ 1 Resiliência Dracônica" : "",
      hp.toughBonus ? "+ 2 Talento Robusto" : "",
    ].filter(Boolean);
    const formulaText =
      hp.method === "custom" && hp.validCustom
        ? `Valor personalizado (${hp.total} PV)`
        : `Dado ${hp.baseDie} ${conText}${extraParts.length ? " " + extraParts.join(" ") : ""} = ${hp.total} PV`;
    return `<fieldset class="cw-choice cw-hp-box" data-choice="startingHp">
      <legend>Pontos de Vida no 1º Nível · Dado de Vida d${hp.die}</legend>
      <div class="cw-hp-controls">
        <label class="cw-label">Método de Pontos de Vida (p. 12 e classe)
          <select data-setup="hpMethod" aria-label="Método de Pontos de Vida no 1º nível">
            <option value="max" ${hp.method === "max" ? "selected" : ""}>Padrão do livro: máximo do dado (${hp.die}) + mod. CON</option>
            <option value="rolled" ${hp.method === "rolled" ? "selected" : ""}>Sortear no dado (1d${hp.die}) + mod. CON</option>
            <option value="fixed" ${hp.method === "fixed" ? "selected" : ""}>Média fixa do dado (${hp.fixedDie}) + mod. CON</option>
            <option value="custom" ${hp.method === "custom" ? "selected" : ""}>Personalizado / adaptação da mesa</option>
          </select>
        </label>
        ${
          hp.method === "rolled"
            ? `<div class="cw-hp-inline">
                <button type="button" data-action="rollStartingHp">Sortear 1d${hp.die}</button>
                <label class="cw-label">Resultado do d${hp.die} (1–${hp.die})
                  <input type="number" data-setup="hpRoll" min="1" max="${hp.die}" value="${escape(draft.setup.hpRoll ?? "")}" placeholder="1 a ${hp.die}" aria-label="Resultado do dado de vida 1d${hp.die}">
                </label>
              </div>`
            : hp.method === "custom"
              ? `<div class="cw-hp-inline">
                  <label class="cw-label">Total de PV iniciais
                    <input type="number" data-setup="hpCustom" min="1" max="999" value="${escape(draft.setup.hpCustom ?? "")}" placeholder="Ex.: ${hp.calculatedTotal}" aria-label="Total personalizado de Pontos de Vida">
                  </label>
                </div>`
              : ""
        }
      </div>
      <div class="cw-hp-summary" role="status">
        <span>PV iniciais na ficha: <strong>${hp.total} PV</strong></span>
        <span class="cw-muted">(${escape(formulaText)})</span>
      </div>
    </fieldset>`;
  }
  function classGains() {
    const d = ctx(),
      c = D.classes[d.classId];
    if (!c) return "";
    const names = E.classFeatures(d);
    return `${startingHpSection(d)}<p>Ganhos automáticos de ${escape(c.name)} no nível ${d.level}: <strong>${names.length ? names.map((name) => (source(name, d.classId) ? escape(name) : ruleName(name, d.classId))).join(" · ") : "Progressão dos recursos da classe"}</strong>.</p>${names.map((name) => source(name, d.classId)).join("")}${d.level < c.subLevel ? `<p>A subclasse será escolhida no nível ${c.subLevel} de ${escape(c.name)}.</p>` : ""}`;
  }
  function equipmentStep(d, fields) {
    const s = draft.setup;
    const isWealth = s.equipmentMethod === "wealth";
    const wealthSpec = E.startingWealth[d.classId] || { formula: "4d4 × 10 po", avgGold: 100 };
    const bg = O.backgrounds[s.backgroundId];
    const fixedClass = E.progression.equipment[d.classId]?.fixed || [];
    const fixedBg = bg?.items || [];
    const catalog = E.equipmentCatalog();
    const purchases = array(s.wealthPurchases);
    const totalCp = Math.round(Number(s.wealthGold || 0) * 100);
    const spentCp = purchases.reduce((sum, entry) => {
      const item = catalog.find((x) => x.name === entry.name);
      return sum + (item ? item.costCp * (entry.qty || 1) : 0);
    }, 0);
    const remCp = totalCp - spentCp;
    const customList = array(s.customEquipment);

    const modeSelector = `<fieldset class="cw-choice cw-equip-mode" data-choice="equipmentMethod">
      <legend>Como definir o equipamento inicial (Cap. 5, p. 145)</legend>
      <select data-setup="equipmentMethod" aria-label="Como definir o equipamento inicial">
        <option value="packages" ${!isWealth ? "selected" : ""}>Pacotes pré-definidos da classe e antecedente (padrão do livro)</option>
        <option value="wealth" ${isWealth ? "selected" : ""}>Riqueza inicial por classe (${escape(wealthSpec.formula)}) — ir às compras no mercado</option>
      </select>
      <p class="cw-muted" style="margin:.4rem 0 0">O Livro do Jogador permite escolher os pacotes prontos da sua classe + antecedente ou rolar sua riqueza inicial em ouro (${escape(wealthSpec.formula)}) para comprar peça por peça nas tabelas do Capítulo 5.</p>
    </fieldset>`;

    let mainContent = "";
    if (!isWealth) {
      mainContent = `<div class="cw-fields" style="display:contents">${fields.map(choice).join("")}</div>
      <div class="cw-package-summary">
        <strong>Itens adicionais garantidos pelo pacote:</strong>
        <ul>
          ${fixedClass.length ? `<li><strong>Da classe (${escape(D.classes[d.classId]?.name || "")}):</strong> ${escape(fixedClass.join(", "))}</li>` : ""}
          ${bg ? `<li><strong>Do antecedente (${escape(bg.name)}):</strong> ${escape(fixedBg.join(", "))} + <strong>${bg.gold} po</strong></li>` : ""}
        </ul>
      </div>`;
    } else {
      const rollsText = s.wealthRolls?.length
        ? `Dados sorteados: [${s.wealthRolls.join(" + ")}]${wealthSpec.mult > 1 ? ` × ${wealthSpec.mult}` : ""} = ${s.wealthGold} po`
        : "";
      const cartHtml = purchases.length
        ? `<div class="cw-cart-box">
            <strong>Mochila de compras (${purchases.reduce((n, x) => n + (x.qty || 1), 0)} item(ns) · ${formatCoinsCp(spentCp)})</strong>
            <div class="cw-cart-items">
              ${purchases
                .map((entry) => {
                  const catItem = catalog.find((x) => x.name === entry.name);
                  const costLabel = catItem ? formatCoinsCp(catItem.costCp * (entry.qty || 1)) : "";
                  return `<div class="cw-cart-row">
                    <span><strong>${entry.qty || 1}×</strong> ${escape(entry.name)} <span class="cw-muted">(${escape(costLabel)})</span></span>
                    <div class="cw-cart-actions">
                      <button type="button" data-action="decPurchase" data-item-name="${escape(entry.name)}" aria-label="Remover 1 ${escape(entry.name)}">−1</button>
                      <button type="button" data-action="incPurchase" data-item-name="${escape(entry.name)}" aria-label="Adicionar 1 ${escape(entry.name)}">+1</button>
                    </div>
                  </div>`;
                })
                .join("")}
            </div>
          </div>`
        : `<p class="cw-muted">Nenhum item comprado ainda. Escolha os itens na tabela do Capítulo 5 abaixo.</p>`;

      mainContent = `<div class="cw-fields" style="display:none"></div>
      <fieldset class="cw-choice cw-wealth-box" data-choice="wealthMarket">
        <legend>Riqueza Inicial e Mercado do Capítulo 5 · ${escape(D.classes[d.classId]?.name || "Classe")} (${escape(wealthSpec.formula)})</legend>
        <div class="cw-wealth-controls">
          <button type="button" data-action="rollWealth">Sortear ${escape(wealthSpec.formula)}</button>
          <button type="button" data-action="avgWealth">Usar média (${wealthSpec.avgGold} po)</button>
          <label class="cw-label cw-wealth-input">Ouro inicial (po)
            <input type="number" data-setup="wealthGold" min="0" max="99999" step="1" value="${escape(s.wealthGold ?? "")}" placeholder="${wealthSpec.avgGold}" aria-label="Ouro inicial disponível (po)">
          </label>
        </div>
        ${rollsText ? `<p class="cw-muted" style="margin:.25rem 0">${escape(rollsText)}</p>` : ""}
        <div class="cw-wallet-bar" role="status">
          <span>Orçamento: <strong>${formatCoinsCp(totalCp)}</strong></span>
          <span>Gasto: <strong>${formatCoinsCp(spentCp)}</strong></span>
          <span>Saldo restante (vai para a ficha): <strong>${formatCoinsCp(remCp)}</strong></span>
        </div>
        ${cartHtml}
        <div class="cw-market-filters">
          <select data-market-category aria-label="Filtrar categoria do mercado">
            <option value="all">Todas as categorias (Cap. 5)</option>
            <option value="armaduras">Armaduras e escudos (p. 147)</option>
            <option value="armas_simples">Armas simples (p. 151)</option>
            <option value="armas_marciais">Armas marciais (p. 151)</option>
            <option value="pacotes">Pacotes de equipamento (p. 153)</option>
            <option value="aventura">Equipamento de aventura e munição (p. 152)</option>
            <option value="ferramentas">Ferramentas, instrumentos e focos (p. 156)</option>
          </select>
          <input type="search" data-market-search placeholder="Buscar arma, armadura, pacote ou item…" aria-label="Buscar item no mercado">
        </div>
        <div class="cw-options cw-market-list" data-scroll-window>
          ${catalog
            .map((item) => {
              const owned = purchases.find((x) => x.name === item.name)?.qty || 0;
              const canAfford = item.costCp <= remCp;
              return `<div class="cw-market-row" data-market-row data-market-cat="${escape(item.category)}">
                <div class="cw-market-info">
                  <div><strong>${escape(item.name)}</strong> <span class="cw-market-cost">${escape(item.cost)}</span> ${owned ? `<span class="cw-market-owned">✓ ${owned} na mochila</span>` : ""}</div>
                  <div class="cw-muted">${escape(item.meta)}${item.weight ? ` · ${item.weight} kg` : ""}</div>
                </div>
                <button type="button" data-action="buyItem" data-item-name="${escape(item.name)}" ${!canAfford ? "disabled" : ""}>${canAfford ? "+ Comprar" : "Sem saldo"}</button>
              </div>`;
            })
            .join("")}
        </div>
      </fieldset>`;
    }

    const adaptSection = `<details class="cw-adapt-box" ${customList.length || (s.customGold !== "" && s.customGold !== undefined) ? "open" : ""}>
      <summary>Adaptação livre da mesa (adicionar itens extras ou ajustar ouro inicial)</summary>
      <p class="cw-muted">Precisa registrar um item combinado com o Mestre, uma herança ou ajustar as moedas iniciais? Adicione abaixo sem perder as regras do livro.</p>
      <div class="cw-custom-equip-row">
        <input type="text" data-custom-item-name placeholder="Nome do item extra (ex.: Poção de cura, Mapa antigo…)" aria-label="Nome do item personalizado">
        <input type="number" data-custom-item-qty min="1" max="99" value="1" aria-label="Quantidade do item personalizado">
        <button type="button" data-action="addCustomItem">+ Adicionar item</button>
      </div>
      ${
        customList.length
          ? `<ul class="cw-custom-equip-list">${customList
              .map(
                (item, idx) =>
                  `<li><span><strong>${item.qty || 1}×</strong> ${escape(item.name || item)}</span> <button type="button" data-action="removeCustomItem" data-custom-index="${idx}">Remover</button></li>`,
              )
              .join("")}</ul>`
          : ""
      }
      <label class="cw-label" style="margin-top:.5rem">Ajustar ouro final na ficha (po — deixe em branco para usar o valor das regras acima)
        <input type="number" data-setup="customGold" min="0" max="999999" value="${escape(s.customGold ?? "")}" placeholder="Usar ouro calculado pelas regras">
      </label>
    </details>`;

    return `${modeSelector}${mainContent}<p>${field("Usar equipamento inicial", `<span><input type="checkbox" data-setup="wearStartingArmor" ${s.wearStartingArmor !== false ? "checked" : ""}> Começar com a armadura vestida e o escudo equipado</span>`)}</p>${adaptSection}`;
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
    const hpInfo = draft.mode === "create" ? E.startingHpPreview(d) : null;
    const isWealth = draft.mode === "create" && draft.setup.equipmentMethod === "wealth";
    const wealthSummary = isWealth
      ? array(draft.setup.wealthPurchases)
          .map((x) => `${x.qty || 1}× ${x.name}`)
          .join(", ") || "Nenhum item comprado (leva o ouro integral)"
      : "";
    const customEquipSummary =
      draft.mode === "create" && array(draft.setup.customEquipment).length
        ? array(draft.setup.customEquipment)
            .map((x) => `${x.qty || 1}× ${x.name || x}`)
            .join(", ")
        : "";
    const choiceRows = rows
      .map((f) => {
        const values = array(draft.answers[f.id])
          .map((v) => {
            const option = f.options.find((o) => o.value === v) || { value: v, label: v };
            return `<li><span tabindex="0" ${root.RuleTooltips.attributes(option.label, E.optionReference(d, f, option))}>${escape(option.label)}</span></li>`;
          })
          .join("");
        return `<div class="cw-review-row"><dt>${escape(f.label)}</dt><dd>${values ? `<ul>${values}</ul>` : "<span class=\"cw-review-empty\">Nenhuma escolha</span>"}</dd></div>`;
      })
      .join("");
    const abilityRows = draft.mode === "create"
      ? Object.entries(E.finalScores(d)).map(([key, score]) => `<div><dt>${escape(D.abilities[key])}</dt><dd>${score}</dd></div>`).join("")
      : "";
    const identitySummary = draft.mode === "create"
      ? `<div class="cw-review-summary"><strong>${escape(draft.setup.name || "Personagem sem nome")}</strong><span>${escape(O.races[draft.setup.raceId]?.name || "Raça não escolhida")}</span><span>${escape(D.classes[draft.classId]?.name || "Classe não escolhida")}</span><span>${hpInfo?.total ?? "—"} PV iniciais</span></div>`
      : "";
    return `<div class="cw-review-intro"><h3>Confira seu personagem</h3><p>Revise cada parte antes de aplicar. Você pode voltar a qualquer etapa para corrigir uma escolha.</p></div>${preview ? `<section class="cw-review-section"><h4>Progressão</h4><p><strong>${preview.classes.map((c) => `${escape(D.classes[c.classId].name)} ${c.level}`).join(" / ")}</strong><span>Nível total ${preview.classes.reduce((n, c) => n + c.level, 0)} · PV máximos ${preview.hpMax}</span></p>${multiclassReview(preview)}</section>` : ""}${identitySummary}${abilityRows ? `<section class="cw-review-section"><h4>Habilidades finais</h4><dl class="cw-review-stats">${abilityRows}</dl></section>` : ""}<section class="cw-review-section"><h4>Escolhas do livro</h4><dl class="cw-review">${choiceRows}${isWealth ? `<div class="cw-review-row"><dt>Compras com riqueza inicial (${escape(draft.setup.wealthGold || 0)} po)</dt><dd><ul><li>${escape(wealthSummary)}</li></ul></dd></div>` : ""}${customEquipSummary ? `<div class="cw-review-row"><dt>Itens extras da mesa</dt><dd><ul><li>${escape(customEquipSummary)}</li></ul></dd></div>` : ""}</dl></section>${draft.mode === "create" ? `<section class="cw-review-section cw-review-character"><h4>Personalidade e história</h4>${characterCharacteristicsSection(draft.setup, false)}</section>` : ""}`;
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
    if (id === "class" && draft.mode === "create")
      errors.push(
        ...E.validate(d).filter((e) => /Pontos de Vida iniciais/.test(e)),
      );
    if (id === "equipment" && draft.mode === "create")
      errors.push(
        ...E.validate(d).filter((e) => /Riqueza inicial|compras iniciais/.test(e)),
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
            : id === "equipment"
              ? equipmentStep(d, fields)
              : id === "review"
                ? review()
                : "";
    host.innerHTML = `<section class="cw-dialog t-card-accent" data-scroll-window><header><h2 id="cw-title" tabindex="-1">${draft.mode === "create" ? "Criar personagem" : draft.mode === "prepare" ? "Preparar magias" : "Evoluir personagem"} · ${title}</h2><button data-action="close" aria-label="Fechar">×</button></header><nav aria-label="Etapas">${list.map(([, label], i) => `<span ${i === step ? 'aria-current="step"' : ""}>${i + 1}. ${label}</span>`).join("")}</nav><div class="cw-body" data-scroll-content><div id="cw-errors" role="alert" hidden></div>${guide().stepHelp[id] ? `<p class="cw-muted">${escape(guide().stepHelp[id])}</p>` : ""}${body}${id === "equipment" ? "" : `<div class="cw-fields" style="display:contents">${fields.map(choice).join("")}</div>`}${!body && !fields.length ? "<p>Nenhuma escolha adicional nesta etapa para a classe e o nível selecionados.</p>" : ""}</div><p class="cw-muted cw-draft-status" data-draft-status></p><footer><div class="cw-footer-left"><button type="button" data-action="back" ${step === 0 ? "disabled" : ""}>Voltar</button>${draft.mode === "create" ? `<button type="button" data-action="discardDraft" class="cw-btn-danger">Descartar rascunho</button>` : ""}</div><a href="book.html" target="_blank" rel="noopener">Consultar livro</a><button type="button" data-action="${step === list.length - 1 ? "finish" : "next"}" class="t-btn-primary">${step === list.length - 1 ? "Aplicar à ficha" : "Continuar"}</button></footer></section>`;
    renderedView = view;
    renderedChoices = new Map(fields.map((f) => [f.id, JSON.stringify(f)]));
    guide().bindAbilities(host, draft.setup, () => E.scores(ctx()), persistDraft);
    guide().bindIncrements(host, E.scores(ctx()), draft.answers, persistDraft);
    persistDraft();
    restoreView(state);
    root.lucide?.createIcons();
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
      const creating = draft.mode === "create";
      close(true);
      if (creating) guide().completeDraft();
    } catch (error) {
      showErrors(error.problems || [error.message]);
    }
  }
  root.CharacterWizard = { openCreate, openLevel, openPrepare, close, discardDraft };
})(globalThis);
