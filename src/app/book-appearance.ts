import { readPreference } from "../storage/preferences";

/** Só a aparência viaja no link: nenhuma identidade ou dado da ficha. */
export function setupBookAppearance() {
  function update() {
    for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href*="book.html"]')) {
      const url = new URL(link.href, document.baseURI);
      if (url.origin !== location.origin || !url.pathname.endsWith("/book.html")) continue;
      url.searchParams.set("theme", readPreference("dnd_sheet_theme") || "pergaminho_claro");
      url.searchParams.set("texture", readPreference("dnd_backdrop_style") || "plain");
      url.searchParams.set("font", readPreference("dnd_font_scale") || "100");
      if (link.href !== url.href) link.href = url.href;
    }
  }
  update();
  new MutationObserver(update).observe(document.body, { childList: true, subtree: true });
  new MutationObserver(update).observe(document.body, { attributes: true, attributeFilter: ["data-theme", "data-backdrop", "style"] });
  document.addEventListener("pointerdown", update, true);
  document.addEventListener("click", update, true);
}
