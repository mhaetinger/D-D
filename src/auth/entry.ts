import type { AccountSession } from "./session";

type AccessMode = "login" | "signup" | "reset" | "password";

/** A entrada organiza a navegação; a autorização de dados continua no Supabase/RLS. */
export function setupEntryScreen(account: AccountSession, panel: HTMLElement) {
  const screen = document.getElementById("accessScreen")!;
  const app = document.getElementById("sheetApp")!;
  const title = document.getElementById("accessTitle")!;
  const local = document.getElementById("accessContinueLocal") as HTMLButtonElement;
  // Só mantém a escolha nesta aba e neste caminho. Não altera preferências da conta.
  const key = `critcall-local-access:${new URL("./", document.baseURI).pathname}`;
  let localAccess = false, previousUser = account.identity?.userId;
  let showingSheet: boolean | undefined;
  try { localAccess = sessionStorage.getItem(key) === "true"; } catch { /* A opção também funciona sem persistência. */ }
  let mode: AccessMode = "login";
  function render(next: AccessMode) {
    mode = next;
    if (previousUser && !account.identity) {
      localAccess = false;
      try { sessionStorage.removeItem(key); } catch { /* Nenhuma ficha é apagada. */ }
    }
    previousUser = account.identity?.userId;
    const enter = account.recovery || !account.identity && !localAccess && !!(account.client || account.message);
    const slot = document.getElementById(enter ? "accessFormSlot" : "accountAccessSlot")!;
    // O mesmo formulário mantém listeners, verificador PKCE e dados; não há cópias.
    if (panel.parentElement !== slot) slot.append(panel);
    document.getElementById("accessLoading")!.hidden = true;
    document.getElementById("accessLocalOption")!.hidden = account.recovery;
    title.textContent = ({ login: "Entre no CritCall", signup: "Crie sua conta", reset: "Recupere seu acesso", password: "Escolha sua nova senha" })[mode];
    document.getElementById("accessDescription")!.textContent = ({
      login: "Acesse sua conta para continuar suas aventuras.",
      signup: "Seu próximo personagem já tem um lugar à mesa.",
      reset: "Enviaremos um link para você voltar à sua conta.",
      password: "Salve a nova senha para continuar com suas fichas.",
    })[mode];
    screen.hidden = !enter;
    app.hidden = enter;
    app.inert = enter;
    document.body.dataset.access = enter ? "entry" : "sheet";
    if (showingSheet !== !enter) {
      const issue = document.getElementById("storageIssue")!;
      // A entrada não pode esconder o aviso/backup de dados ilegíveis ao abrir
      // o espaço escolhido. A recuperação continua exigindo confirmação.
      document.getElementById("authAccountModal")!.classList.toggle("hidden", enter || !!issue.hidden);
      // A troca de página é explícita para teclado/leitores, sem capturar foco em
      // atualizações de token, de sincronização ou enquanto se digita no formulário.
      const focus = enter ? title : !issue.hidden ? issue : document.getElementById("headerSection")!;
      focus.tabIndex = -1;
      focus.focus({ preventScroll: true });
      showingSheet = !enter;
    }
  }
  local.addEventListener("click", () => {
    localAccess = true;
    try { sessionStorage.setItem(key, "true"); } catch { /* A escolha vale até fechar esta página. */ }
    render(mode);
  });
  return { render, setBusy: (busy: boolean) => { local.disabled = busy; } };
}
