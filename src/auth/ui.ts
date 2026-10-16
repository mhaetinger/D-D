import { AccountSession, authErrorMessage } from "./session";
import { currentWorkspaceKey, workspaceKey } from "../storage/account-scope";
import { sheetStore } from "../storage/character-store";
import type { CharacterRecord } from "../storage/validation";

interface SheetHost {
  characters: CharacterRecord[];
  activateAccountWorkspace: (identity: AccountSession["identity"]) => void;
  hasOpenAccountEditor: () => boolean;
  openAuthAccountModal: () => void;
}
type AccessMode = "login" | "signup" | "reset" | "password";
const host = window as unknown as SheetHost;

export function setupAccountUI(account: AccountSession) {
  const panel = document.getElementById("accountAccess")!;
  const form = document.getElementById("accountForm") as HTMLFormElement;
  const email = document.getElementById("accountEmail") as HTMLInputElement;
  const password = document.getElementById("accountPassword") as HTMLInputElement;
  const confirm = document.getElementById("accountPasswordConfirm") as HTMLInputElement;
  const status = document.getElementById("accountAccessStatus")!;
  const submit = document.getElementById("accountSubmit") as HTMLButtonElement;
  const switchDialog = document.getElementById("accountWorkspaceChanged") as HTMLDialogElement;
  const signedOut = document.getElementById("accountSignedOut")!;
  const signedIn = document.getElementById("accountSignedIn")!;
  let mode: AccessMode = account.recovery ? "password" : "login";
  let busy = false;
  const message = (text: string, error = false) => {
    status.textContent = text;
    status.setAttribute("role", error ? "alert" : "status");
  };
  function setMode(next: AccessMode) {
    mode = next;
    password.value = ""; confirm.value = "";
    const changing = mode === "password", needsPassword = mode !== "reset", newPassword = mode === "signup" || changing;
    document.getElementById("accountEmailField")!.hidden = changing;
    document.getElementById("accountPasswordField")!.hidden = !needsPassword;
    document.getElementById("accountPasswordConfirmField")!.hidden = !newPassword;
    document.getElementById("accountPasswordHint")!.hidden = !newPassword;
    email.required = !changing;
    password.required = needsPassword;
    password.minLength = newPassword ? 12 : 1;
    password.autocomplete = newPassword ? "new-password" : "current-password";
    confirm.required = newPassword;
    submit.textContent = ({ login: "Entrar", signup: "Criar conta", reset: "Enviar recuperação", password: "Salvar nova senha" })[mode];
    for (const button of panel.querySelectorAll<HTMLButtonElement>("[data-auth-mode]")) {
      button.hidden = changing;
      button.setAttribute("aria-pressed", String(button.dataset.authMode === mode));
    }
    (document.getElementById("accountResend") as HTMLButtonElement).hidden = changing;
    render();
  }
  function render() {
    panel.hidden = !account.client && !account.message;
    const user = account.identity;
    document.getElementById("accountIdentity")!.textContent = account.client
      ? user ? `${account.offline ? "Cópia offline de" : "Conectado como"} ${user.email || "sua conta"}` : "Entre ou crie sua conta"
      : "Login indisponível neste build";
    signedOut.hidden = !account.client || !!user && !account.recovery;
    signedIn.hidden = !user || account.recovery;
    document.getElementById("workspaceDescription")!.textContent = user
      ? "Fichas deste espaço da conta, salvas neste navegador. Ainda não há sincronização entre dispositivos. Fichas feitas sem login continuam no espaço local."
      : "Suas fichas e anotações ficam neste navegador. Use um backup para levá-las a outro dispositivo.";
    const badge = document.getElementById("currentUserBadge")!;
    badge.title = user ? `Conta: ${user.email}. Fichas salvas neste navegador.` : "Espaço local deste navegador";
    if (account.message) message(account.message, true);
    else if (!account.persistent && account.client) message("A sessão fica somente nesta aba porque o navegador bloqueou o armazenamento.");
    else if (account.offline) message("Sem conexão. A cópia já disponível continua neste navegador; entrar, cadastrar e recuperar senha exigem internet.");
    for (const control of panel.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input, button")) control.disabled = busy;
    panel.setAttribute("aria-busy", String(busy));
  }
  function adoptIdentity() {
    host.activateAccountWorkspace(account.identity);
    form.reset();
    account.recovery = !!account.recovery && !!account.identity;
    setMode(account.recovery ? "password" : "login");
  }
  function changed() {
    if (currentWorkspaceKey() !== workspaceKey(account.identity)) {
      if (host.hasOpenAccountEditor()) {
        // Uma mudança em outra aba não pode exibir a conta nova sobre dados da
        // anterior nem descartar um formulário sem uma decisão do jogador.
        if (!switchDialog.open) {
          (document.getElementById("accountSwitchNotes") as HTMLInputElement).checked = false;
          document.getElementById("accountSwitchStatus")!.textContent = "";
          switchDialog.showModal();
        }
        return;
      }
      adoptIdentity();
    }
    if (switchDialog.open) switchDialog.close();
    if (account.recovery && account.identity && mode !== "password") { setMode("password"); host.openAuthAccountModal(); }
    render();
  }
  switchDialog.addEventListener("cancel", (event) => event.preventDefault());
  document.getElementById("accountSwitchContinue")!.addEventListener("click", () => {
    adoptIdentity(); switchDialog.close(); render();
  });
  document.getElementById("accountSwitchBackup")!.addEventListener("click", () => {
    const result = document.getElementById("accountSwitchStatus")!;
    try {
      const notes = (document.getElementById("accountSwitchNotes") as HTMLInputElement).checked;
      const value = sheetStore.backup(host.characters, notes);
      const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = "critcall-sessao-anterior.json"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      result.textContent = notes ? "Backup baixado com as anotações pessoais." : "Backup baixado sem anotações pessoais.";
    } catch { result.textContent = "Não foi possível gerar o backup. Os dados anteriores continuam preservados nesta aba."; }
  });
  for (const button of panel.querySelectorAll<HTMLButtonElement>("[data-auth-mode]")) button.addEventListener("click", () => {
    if (!busy) { account.message = ""; message(""); setMode(button.dataset.authMode as AccessMode); }
  });
  const redirectTo = () => new URL("./", document.baseURI).href;
  async function run(action: () => Promise<void>, allowOffline = false) {
    if (busy || !account.client) return;
    if (!navigator.onLine && !allowOffline) { message("Conecte-se à internet para continuar.", true); return; }
    // O erro do retorno já foi apresentado. Uma nova tentativa deve mostrar
    // seu próprio resultado, sem o render restaurar o aviso do link anterior.
    account.message = "";
    busy = true; render(); message("");
    try { await action(); }
    catch (error) { message(authErrorMessage(error), true); }
    finally { busy = false; render(); }
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if ((mode === "signup" || mode === "password") && password.value !== confirm.value) { message("As senhas precisam ser iguais.", true); confirm.focus(); return; }
    void run(async () => {
      const auth = account.client!.auth;
      if (mode === "login") {
        const { error } = await auth.signInWithPassword({ email: email.value.trim(), password: password.value });
        if (error) throw error;
        password.value = "";
        await account.validate();
        if (!account.identity || account.offline) throw new Error("Identidade não validada no serviço");
        message("Você entrou. As fichas deste espaço continuam salvas neste navegador.");
      } else if (mode === "signup") {
        const { data, error } = await auth.signUp({ email: email.value.trim(), password: password.value, options: { emailRedirectTo: redirectTo() } });
        if (error) throw error;
        password.value = ""; confirm.value = "";
        if (data.session) await account.validate();
        message("Confira seu e-mail para confirmar o cadastro, se uma confirmação for necessária. Abra o link neste mesmo navegador e dispositivo.");
      } else if (mode === "reset") {
        const { error } = await auth.resetPasswordForEmail(email.value.trim(), { redirectTo: redirectTo() });
        if (error) throw error;
        message("Se o endereço puder receber a recuperação, você receberá um e-mail. Abra o link mais recente neste mesmo navegador e dispositivo.");
      } else {
        if (!account.identity || !account.recovery) throw new Error("Sessão de recuperação ausente");
        const { error } = await auth.updateUser({ password: password.value });
        if (error) throw error;
        account.recovery = false; setMode("login"); message("Senha atualizada.");
      }
    });
  });
  document.getElementById("accountResend")!.addEventListener("click", () => {
    if (!email.reportValidity() || !email.value.trim()) { email.focus(); return; }
    void run(async () => {
      const { error } = await account.client!.auth.resend({ type: "signup", email: email.value.trim(), options: { emailRedirectTo: redirectTo() } });
      if (error) throw error;
      message("Se o cadastro precisar de confirmação, você receberá outra mensagem. Abra o link mais recente neste mesmo navegador e dispositivo.");
    });
  });
  document.getElementById("accountChangePassword")!.addEventListener("click", () => {
    void run(async () => {
      const address = account.identity?.email;
      if (!address) throw new Error("Conta sem endereço validado");
      // A troca usa o e-mail da identidade validada, sem depender do campo
      // de entrada nem enviar o link para um endereço digitado em outro modo.
      const { error } = await account.client!.auth.resetPasswordForEmail(address, { redirectTo: redirectTo() });
      if (error) throw error;
      message("Confira seu e-mail para trocar a senha. Abra o link mais recente neste mesmo navegador e dispositivo.");
    });
  });
  document.getElementById("accountSignOut")!.addEventListener("click", () => {
    void run(async () => {
      await account.signOut();
      message("Você saiu desta conta. As fichas e notas dela foram preservadas no espaço local da conta.");
    }, true);
  });
  account.addEventListener("change", changed);
  setMode(mode);
  if (account.recovery || account.message) host.openAuthAccountModal();
}
