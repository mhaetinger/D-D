import { getDocument, GlobalWorkerOptions, TextLayer } from "../vendor/pdfjs/pdf.min.mjs";
import "./book-library.js";

const { selectionFromHash, hashFor, pdfURL } = globalThis.BookLibrary;
GlobalWorkerOptions.workerSrc = new URL("../vendor/pdfjs/pdf.worker.min.mjs", import.meta.url).href;
const assets = new URL("../vendor/pdfjs/", import.meta.url).href;
const form = document.getElementById("bookNavigation");
const select = document.getElementById("bookSelect");
const input = document.getElementById("bookPage");
const reader = document.getElementById("bookReader");
const open = document.getElementById("openBook");
const download = document.getElementById("downloadBook");
const status = document.getElementById("bookStatus");
const previous = document.getElementById("previousPage");
const next = document.getElementById("nextPage");
const zoom = document.getElementById("bookZoom");
let loadingTask, documentPromise, renderTask, textLayer, currentFile;
let revision = 0;
let renderedHash;

function applyPreferences() {
  try {
    const appearance = new URLSearchParams(location.search);
    const theme = appearance.get("theme") || localStorage.getItem("dnd_sheet_theme") || "pergaminho_claro";
    const scale = Number(appearance.get("font") || localStorage.getItem("dnd_font_scale") || "100");
    document.body.dataset.backdrop = (appearance.get("texture") || localStorage.getItem("dnd_backdrop_style")) === "textured" ? "textured" : "plain";
    if (["pergaminho_claro", "pergaminho_escuro", "obsidiana"].includes(theme)) document.body.dataset.theme = theme;
    if ([90, 100, 112, 125].includes(scale)) document.documentElement.style.fontSize = `${16 * scale / 100}px`;
  } catch {
    // A leitura não depende do armazenamento das preferências.
  }
}
applyPreferences();
window.addEventListener("storage", applyPreferences);

async function renderPage(selection, preserveScroll = false) {
  const version = ++revision;
  renderTask?.cancel();
  textLayer?.cancel();
  const { book, page: number } = selection;
  reader.setAttribute("aria-busy", "true");
  status.textContent = `Carregando página ${number}…`;
  delete reader.dataset.error;
  if (!preserveScroll) {
    reader.replaceChildren();
    reader.scrollTop = reader.scrollLeft = 0;
  }
  try {
    if (book.file !== currentFile) {
      // Uma troca de livro invalida o worker anterior; páginas do mesmo livro o reutilizam.
      loadingTask?.destroy().catch(() => {});
      currentFile = book.file;
      loadingTask = getDocument({
        url: new URL(book.file, document.baseURI).href,
        cMapUrl: assets + "cmaps/", standardFontDataUrl: assets + "standard_fonts/",
        wasmUrl: assets + "wasm/", iccUrl: assets + "iccs/", isEvalSupported: false,
      });
      documentPromise = loadingTask.promise;
    }
    const pdf = await documentPromise;
    if (version !== revision) return;
    const page = await pdf.getPage(number);
    if (version !== revision) return;
    const width = reader.clientWidth - parseFloat(getComputedStyle(reader).paddingLeft) * 2;
    const scale = Math.max(1, width) / page.getViewport({ scale: 1 }).width * Number(zoom.value);
    const viewport = page.getViewport({ scale });
    // Limita memória em telas grandes/zoom sem mudar as dimensões visuais da página.
    const ratio = Math.min(devicePixelRatio || 1, 2, Math.sqrt(16_000_000 / (viewport.width * viewport.height)));
    const paper = document.createElement("div");
    paper.className = "pdf-page";
    paper.style.width = `${viewport.width}px`;
    paper.style.height = `${viewport.height}px`;
    paper.style.setProperty("--total-scale-factor", scale);
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    const text = document.createElement("div");
    text.className = "textLayer";
    paper.append(canvas, text);
    const task = page.render({ canvasContext: canvas.getContext("2d"), viewport, transform: [ratio, 0, 0, ratio, 0, 0] });
    renderTask = task;
    await task.promise;
    if (version !== revision) return;
    textLayer = new TextLayer({ textContentSource: page.streamTextContent(), container: text, viewport });
    await textLayer.render();
    if (version !== revision) return;
    reader.replaceChildren(paper);
    reader.dataset.renderZoom = zoom.value;
    reader.dataset.renderedBook = book.id;
    reader.dataset.renderedPage = String(number);
    status.textContent = `Página ${number} de ${pdf.numPages}`;
  } catch (error) {
    if (version !== revision || error.name === "RenderingCancelledException" || error.name === "AbortException") return;
    console.warn("Falha ao renderizar o livro:", error);
    reader.dataset.error = "true";
    reader.textContent = "Não foi possível carregar esta página. Use Abrir PDF ou Baixar para consultar o livro.";
    status.textContent = "Leitor indisponível";
    // Permite tentar novamente a mesma URL após uma falha de conexão.
    loadingTask?.destroy().catch(() => {});
    loadingTask = documentPromise = currentFile = null;
  } finally {
    if (version === revision) reader.setAttribute("aria-busy", "false");
  }
}

function render() {
  renderedHash = location.hash;
  const selection = selectionFromHash(location.hash);
  const { book, page } = selection;
  select.value = book.id;
  input.max = String(book.pages);
  input.value = String(page);
  reader.dataset.url = pdfURL(selection);
  reader.setAttribute("aria-label", `${book.title}, página ${page}`);
  open.href = pdfURL(selection);
  download.href = book.file;
  previous.disabled = page === 1;
  next.disabled = page === book.pages;
  document.title = `${book.title} · Fichas D&D`;
  renderPage(selection);
}
function navigate(book, page) {
  const hash = hashFor(selectionFromHash(`book=${book}&page=${page}`));
  // Atualiza os campos junto da ação. Esperar hashchange podia sobrescrever uma
  // página digitada logo depois da seleção anterior. Voltar/avançar continuam válidos.
  if (location.hash !== hash) history.pushState(null, "", hash);
  render();
}
select.addEventListener("change", () => navigate(select.value, 1));
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (form.reportValidity()) navigate(select.value, input.value);
});
previous.addEventListener("click", () => {
  const { book, page } = selectionFromHash(location.hash);
  navigate(book.id, page - 1);
});
next.addEventListener("click", () => {
  const { book, page } = selectionFromHash(location.hash);
  navigate(book.id, page + 1);
});
function removeCustomZooms() {
  for (const option of zoom.querySelectorAll('[data-custom-zoom]')) option.remove();
}
zoom.addEventListener("change", () => {
  if(!zoom.selectedOptions[0]?.dataset.customZoom) removeCustomZooms();
  renderPage(selectionFromHash(location.hash));
});
let zoomTimer;
function setReaderZoom(value) {
  const next = Math.round(Math.max(.5, Math.min(3, value))*100)/100;
  // A lista guarda os atalhos fixos e, no máximo, o zoom livre atual.
  removeCustomZooms();
  if (![...zoom.options].some(o => Number(o.value) === next)) {
    const option = new Option(`${Math.round(next*100)}%`,String(next));
    option.dataset.customZoom = 'true'; zoom.append(option);
  }
  zoom.value = String(next);
  const paper = reader.querySelector('.pdf-page');
  if (paper) {
    const ratio = next / Number(reader.dataset.renderZoom || 1);
    paper.style.transformOrigin = '0 0'; paper.style.transform = `scale(${ratio})`;
  }
  clearTimeout(zoomTimer);
  zoomTimer = setTimeout(() => renderPage(selectionFromHash(location.hash),true),120);
}
reader.addEventListener('wheel', event => {
  if (!event.ctrlKey && !event.metaKey) return;
  event.preventDefault(); event.stopPropagation();
  const delta = event.deltaY * (event.deltaMode===1?16:event.deltaMode===2?reader.clientHeight:1);
  setReaderZoom(Number(zoom.value) * Math.exp(-delta*.002));
}, {passive:false});
document.addEventListener('keydown', event => {
  if ((!event.ctrlKey && !event.metaKey) || event.altKey || !['+','=','-','0'].includes(event.key)) return;
  event.preventDefault();
  setReaderZoom(event.key==='0'?1:Number(zoom.value)*(event.key==='-'?1/1.1:1.1));
});
const synchronizeHistory = () => { if (renderedHash !== location.hash) render(); };
window.addEventListener("hashchange", synchronizeHistory);
window.addEventListener("popstate", synchronizeHistory);
let resizeTimer;
let priorWidth = 0;
new ResizeObserver(([entry]) => {
  const width = Math.round(entry.contentRect.width);
  if (width === priorWidth) return;
  priorWidth = width;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => renderPage(selectionFromHash(location.hash), true), 150);
}).observe(reader);
render();
