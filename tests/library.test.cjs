const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { books, selectionFromHash, pdfURL, hashFor } = require("../rules/book-library.js");
const spells = require("../rules/phb2014-spells.js");
const references = require("../rules/phb2014-references.js");

test("links existentes das regras continuam abrindo o Jogador na página indicada", () => {
  for (const reference of [...spells, ...references]) {
    const selection = selectionFromHash(`#page=${reference.pdfPage}`);
    assert.equal(selection.book.id, "jogador");
    assert.equal(selection.page, reference.pdfPage);
    assert.equal(pdfURL(selection), `books/livro-jogador-2014.pdf#page=${reference.pdfPage}`);
  }
});

test("cada livro mantém sua própria paginação, incluindo a última página do Mestre", () => {
  const selection = selectionFromHash("#book=mestre&page=322");
  assert.equal(selection.page, 322);
  assert.equal(pdfURL(selection), "books/livro-mestre-2014.pdf#page=322");
  assert.deepEqual(selectionFromHash(hashFor(selection)), selection);
  assert.equal(selectionFromHash("#book=jogador&page=322").page, 314);
  assert.equal(selectionFromHash("#book=mestre&page=999").page, 322);
});

test("links inválidos não navegam a arquivos externos nem quebram o leitor", () => {
  for (const id of ["__proto__", "https://example.com/teste.pdf", "../../ficha.pdf"]) {
    const selection = selectionFromHash(`#book=${encodeURIComponent(id)}&page=58`);
    assert.equal(selection.book.id, "jogador");
    assert.equal(pdfURL(selection), "books/livro-jogador-2014.pdf#page=58");
  }
  for (const page of ["-1", "0", "1.5", "1e2", "Infinity", "NaN", "99999999999999999999", "<script>"]) {
    assert.equal(selectionFromHash(`#page=${page}`).page, 1);
  }
  assert.equal(selectionFromHash().page, 1);
});

test("os dois arquivos reais do catálogo são PDFs e nenhuma ficha entra na biblioteca", () => {
  assert.deepEqual(
    fs.readdirSync(path.join(__dirname, "../books")).filter((name) => name.endsWith(".pdf")).sort(),
    books.map((book) => path.basename(book.file)).sort(),
  );
  for (const book of books) {
    const fd = fs.openSync(path.join(__dirname, "..", book.file), "r");
    try {
      const header = Buffer.alloc(5);
      fs.readSync(fd, header, 0, 5, 0);
      assert.equal(header.toString(), "%PDF-");
    } finally {
      fs.closeSync(fd);
    }
  }
});

test("magias e escolhas têm descrições reais para consulta, sem alterar seus identificadores", () => {
  assert.equal(spells.length, 361);
  assert.equal(references.length, 958);
  for (const item of [...spells, ...references]) {
    assert.doesNotMatch(item.text, /Descrição completa não incluída/);
    assert.ok(Number.isInteger(item.pdfPage) && item.pdfPage >= 1 && item.pdfPage <= 314);
  }
  assert.ok(spells.every((spell) => spell.text.length > 50));
  assert.ok(references.find((ref) => ref.id === "invocacoes-misticas").text.includes("invocações"));
});
