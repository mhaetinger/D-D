# PDF.js 6.4.299

Arquivos de `pdfjs-dist@6.4.299` (Mozilla), hospedados com o aplicativo para o
leitor não depender de CDNs ou de um plugin nativo do navegador.

Origem: https://registry.npmjs.org/pdfjs-dist/-/pdfjs-dist-6.4.299.tgz
Documentação: https://mozilla.github.io/pdf.js/examples/
Licença principal: Apache-2.0, preservada em `LICENSE`. Fontes, CMaps,
decodificadores e perfis também mantêm seus avisos nas próprias pastas.

Foram copiados os dois módulos de `legacy/build/`, `cmaps/`, `standard_fonts/`, `wasm/`
e `iccs/`. `text-layer.css` contém a seção `.textLayer` de `web/pdf_viewer.css`,
com seu aviso de licença; a interface do visualizador completo não é usada.
O build `legacy` inclui as adaptações oficiais para navegadores sem APIs recentes
como `Map.getOrInsertComputed`, sem acrescentar polyfills próprios ao aplicativo.
Não editar os módulos de terceiros manualmente. Ao atualizar, manter a versão
do módulo e do worker iguais, conferir licenças e executar os testes do leitor.
