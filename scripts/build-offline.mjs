import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const directory = path.resolve(process.argv[2] || "dist");
const walk = (folder) => fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(folder, entry.name)) : [path.join(folder, entry.name)]);
const all = walk(directory).map((file) => path.relative(directory, file).split(path.sep).join("/"));
// PDFs são consultas online/downloads explícitos, não uma transferência automática
// de quase 40 MB. O aplicativo e o leitor ficam disponíveis sem a rede.
const core = all.filter((file) => file === "index.html" || file === "book.html" || file === "manifest.webmanifest" || file.startsWith("assets/") || file.startsWith("icons/") || file.startsWith("licenses/") || /^rules\/[^/]+\.(?:js|mjs|css)$/.test(file) || /^vendor\/pdfjs\/(?:pdf\.min\.mjs|pdf\.worker\.min\.mjs|text-layer\.css|LICENSE)$/.test(file)).sort();
const pdfs = all.filter((name) => name.toLowerCase().endsWith(".pdf")).sort();
if (JSON.stringify(pdfs) !== JSON.stringify(["books/livro-jogador-2014.pdf", "books/livro-mestre-2014.pdf"])) throw new Error("A saída deve conter somente os dois livros autorizados.");
if (all.some((name) => /(?:^|\/)(?:\.env(?:\.|$)|node_modules|tests|src|AGENTS\.md)/.test(name))) throw new Error("Arquivo de desenvolvimento na saída pública.");
const hash = crypto.createHash("sha256");
const worker = fs.readFileSync(new URL('../src/pwa/worker.js', import.meta.url), 'utf8');
const indexPath = path.join(directory, 'index.html');
const marker = /(<meta name="critcall-build" content=")(?:__CRITCALL_BUILD__|[a-f0-9]{16})(")/;
const html = fs.readFileSync(indexPath, 'utf8');
if (!marker.test(html)) throw new Error('Identificador do build ausente no HTML.');
// Normalizar evita uma referência circular entre o hash e o HTML que o exibe.
const canonical = html.replace(marker, '$1__CRITCALL_BUILD__$2');
hash.update('offline-policy-v5').update(fs.readFileSync(new URL(import.meta.url))).update(worker);
for (const file of core) hash.update(file).update(file === 'index.html' ? canonical : fs.readFileSync(path.join(directory, file)));
const version = hash.digest("hex").slice(0, 16);
fs.writeFileSync(indexPath, canonical.replace('__CRITCALL_BUILD__', version));
// O servidor pode devolver conteúdo antigo com 200 durante a propagação de uma
// entrega. A integridade valida os bytes finais, incluindo a revisão no HTML.
const integrity = Object.fromEntries(core.map(file => [file, 'sha256-' + crypto.createHash('sha256').update(fs.readFileSync(path.join(directory, file))).digest('base64')]));
const source = `/* Gerado pelo build: somente aplicativo público, nunca fichas/notas. */\nconst VERSION = '${version}';\nconst FILES = ${JSON.stringify(core)};\nconst INTEGRITY = ${JSON.stringify(integrity)};\n${worker}`;
fs.writeFileSync(path.join(directory, "sw.js"), source);
fs.writeFileSync(path.join(directory, "offline-manifest.json"), JSON.stringify({ version, files: core }, null, 2));
console.log(`Offline: ${core.length} arquivos do aplicativo; PDFs fora do cache automático.`);
