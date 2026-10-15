import { defineConfig } from "vite";

// O mesmo build funciona no projeto /D-D/ do Pages e em um domínio próprio.
// Caminhos relativos também permitem testar dist/ isoladamente, sem roteador no servidor.
export default defineConfig({
  base: "./",
  build: { target: "es2022", outDir: "dist", emptyOutDir: true },
});
