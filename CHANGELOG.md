# Changelog

## 0.1.1

- **build**: remove sourcemaps (`.js.map`/`.cjs.map`) e declaration maps
  (`.d.ts.map`) da publicação. O pacote cai de ~4,7 MB para ~2,1 MB (download)
  e de ~16,9 MB para ~5,7 MB (descompactado), sem perda de funcionalidade nem
  de tipagem — os `.d.ts` continuam publicados.

## 0.1.0

- Primeira versão publicada. Editor rich-text sobre Tiptap v3 + MUI v9:
  - 26 features ativáveis/configuráveis (formatação, listas com preview,
    colunas estilo jornal, tabela com balloon, imagem com resizer/alt/legenda,
    caracteres especiais com busca, entrelinha, cores, fontes).
  - Fórmulas matemáticas (MathLive + KaTeX, LaTeX preservado byte a byte) e
    químicas (mhchem com paleta lateral).
  - State em HTML ou Markdown (`saveAs`); modos controlado e não controlado.
  - Variantes `DocumentEditor` (folhas paginadas com zoom e formato de página)
    e `ApostilaEditor` (folha única de apostila).
  - Customização de UI por feature via prop `ui` (ícones, tooltips, menus).
  - Tema grafite opcional; herda o `ThemeProvider` do host.
