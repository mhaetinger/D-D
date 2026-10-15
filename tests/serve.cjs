// Servidor só de testes, com prefixo de projeto e MIME de PDF iguais ao site.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
async function serve(base, prefix = "/D-D/") {
  base = path.resolve(base);
  const server = http.createServer((req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      if (!pathname.startsWith(prefix)) { res.writeHead(404); return res.end(); }
      const file = path.resolve(base, pathname.slice(prefix.length) || "index.html");
      if (!file.startsWith(base + path.sep)) { res.writeHead(403); return res.end(); }
      const stat = fs.statSync(file);
      if (!stat.isFile()) { res.writeHead(404); return res.end(); }
      const type = { ".js": "application/javascript", ".mjs": "application/javascript", ".wasm": "application/wasm", ".css": "text/css", ".pdf": "application/pdf", ".html": "text/html; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff" };
      res.writeHead(200, { "Content-Type": type[path.extname(file)] || "application/octet-stream", "Content-Length": stat.size });
      fs.createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}${prefix}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
module.exports = { serve };
