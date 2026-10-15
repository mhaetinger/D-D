/* Links antigos #page= continuam válidos. O hash escolhe apenas livros do catálogo,
   nunca uma URL arbitrária; os caminhos relativos funcionam também sob /D-D/. */
(function (root) {
  const books = Object.freeze([
    Object.freeze({ id: "jogador", title: "Livro do Jogador · 2014", file: "books/livro-jogador-2014.pdf", pages: 314 }),
    Object.freeze({ id: "mestre", title: "Livro do Mestre · 2014", file: "books/livro-mestre-2014.pdf", pages: 322 }),
  ]);

  function selectionFromHash(hash) {
    const params = new URLSearchParams(String(hash || "").replace(/^#/, ""));
    const book = books.find((item) => item.id === params.get("book")) || books[0];
    const raw = params.get("page") || "1";
    const number = /^\d+$/.test(raw) ? Number(raw) : 1;
    const page = Number.isSafeInteger(number) ? Math.min(book.pages, Math.max(1, number)) : 1;
    return { book, page };
  }

  const hashFor = ({ book, page }) => `#book=${book.id}&page=${page}`;
  const pdfURL = ({ book, page }) => `${book.file}#page=${page}`;
  const api = { books, selectionFromHash, hashFor, pdfURL };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.BookLibrary = api;

})(globalThis);
