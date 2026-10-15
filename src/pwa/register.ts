export function registerOffline() {
  const label = document.getElementById("offlineStatus");
  if (!label) return;
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    label.textContent = "Uso offline disponível na versão publicada em um navegador compatível.";
    return;
  }
  let ready = false;
  let waiting = false;
  const update = () => {
    label.textContent = waiting
      ? "Atualização pronta. Feche as abas do aplicativo e reabra para usá-la."
      : ready
        ? navigator.onLine ? "Ficha disponível para usar offline neste dispositivo." : "Sem conexão · ficha disponível neste dispositivo."
        : "Preparando o acesso offline…";
  };
  update();
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  const scope = new URL("./", document.baseURI);
  navigator.serviceWorker.register(new URL("sw.js", scope), { scope: scope.pathname })
    .then(async (registration) => {
      waiting = !!registration.waiting;
      const observeInstallation = (installing: ServiceWorker | null) => {
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) { waiting = true; update(); }
          if (installing.state === "redundant" && !ready) label.textContent = "O acesso offline não ficou pronto. Confira a conexão e o espaço disponível antes de tentar novamente.";
        });
      };
      observeInstallation(registration.installing);
      registration.addEventListener("updatefound", () => observeInstallation(registration.installing));
      await navigator.serviceWorker.ready;
      ready = true;
      update();
    })
    .catch(() => { label.textContent = "Não foi possível preparar o acesso offline. A ficha continua disponível enquanto esta página estiver aberta."; });
}
