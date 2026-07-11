# @joshualevy029/tiptap-editor

Editor rich-text em React construído sobre [Tiptap v3](https://tiptap.dev),
com UI em [Material UI](https://mui.com) e ícones [Iconify](https://iconify.design).
Pensado para conteúdo didático: fórmulas matemáticas (MathLive + KaTeX),
fórmulas químicas (mhchem), tabelas com balloon estilo CKEditor, imagens com
resizer, colunas estilo jornal e variantes com visual de folha (documento
paginado e página de apostila).

## Sumário

- [Compatibilidade](#compatibilidade)
- [Instalação](#instalação)
- [Uso rápido](#uso-rápido)
- [Formato do conteúdo: HTML ou Markdown](#formato-do-conteúdo-html-ou-markdown)
- [Modo controlado e não controlado](#modo-controlado-e-não-controlado)
- [Ref imperativa](#ref-imperativa)
- [Features: ativar, desativar e configurar](#features-ativar-desativar-e-configurar)
- [Customização de UI (prop `ui`)](#customização-de-ui-prop-ui)
- [Variantes: DocumentEditor e ApostilaEditor](#variantes-documenteditor-e-apostilaeditor)
- [Tema](#tema)
- [Uso com Next.js](#uso-com-nextjs)
- [Exibindo o conteúdo salvo](#exibindo-o-conteúdo-salvo)
- [Desenvolvimento](#desenvolvimento)

## Compatibilidade

| Ambiente | Suporte |
|---|---|
| React | 18 ou 19 |
| MUI (peer) | v9 |
| Next.js | App Router e Pages Router (componente client-side — ver [Uso com Next.js](#uso-com-nextjs)) |
| Node no projeto consumidor | **Qualquer** (runtime é browser). Instalação **via registro**: funciona em Node 18+. Instalação **via git**: exige Node ≥ 20.19 (o build roda no install) |

## Instalação

```bash
# via registro (recomendado — dist pré-buildado, funciona em Node 18)
npm install @joshualevy029/tiptap-editor

# ou via git (o build roda no install; exige Node >= 20.19)
npm install git+ssh://git@github.com/JoshuaLevy029/tiptap-editor.git
```

Peer dependencies (o projeto host precisa tê-las instaladas):

```bash
npm install react react-dom @mui/material @emotion/react @emotion/styled
```

Tiptap, KaTeX, MathLive e Iconify são dependências internas — você não precisa
instalá-las nem conhecê-las.

## Uso rápido

```tsx
import { useState } from "react";
import { Editor } from "@joshualevy029/tiptap-editor";

export function MinhaTela() {
  const [content, setContent] = useState("");

  return <Editor defaultValue={content} onChange={setContent} />;
}
```

`<Editor />` sem nenhuma prop já funciona com **todas as features ativas**.
O valor emitido pelo `onChange` é uma string pronta para persistir no banco.

## Formato do conteúdo: HTML ou Markdown

A prop `saveAs` define o formato do `onChange` **e** de `defaultValue`/`value`:

```tsx
<Editor defaultValue="<p>Olá <strong>mundo</strong></p>" onChange={setHtml} />
<Editor defaultValue={"# Olá\n\n**mundo**"} onChange={setMd} saveAs="markdown" />
```

- Default: `"html"`.
- Markdown usa o serializador oficial `@tiptap/markdown`; fórmulas saem como
  `$...$` / `$$...$$`.
- Atenção: recursos sem sintaxe Markdown (cor, fonte, tamanho, alinhamento,
  recuo) não sobrevivem ao round-trip em Markdown — para o catálogo completo,
  persista HTML.

## Modo controlado e não controlado

```tsx
// Não controlado: defaultValue só na montagem; o editor é dono do estado
<Editor defaultValue={inicial} onChange={setContent} />

// Controlado: o documento segue a prop value
<Editor value={content} onChange={setContent} />
```

No modo controlado, o eco do próprio `onChange` é ignorado (não reseta cursor);
apenas mudanças externas de `value` substituem o documento. Para carregar
conteúdo vindo de um fetch no modo não controlado, monte o editor quando o
dado chegar: `{data && <Editor defaultValue={data} />}`.

## Ref imperativa

```tsx
const ref = useRef<EditorHandle>(null);

<Editor ref={ref} />;

ref.current?.getHTML();      // string HTML
ref.current?.getMarkdown();  // string Markdown
ref.current?.getJSON();      // JSON do Tiptap (ProseMirror doc)
ref.current?.focus();
ref.current?.clear();
ref.current?.getEditor();    // instância Tiptap (escape hatch)
```

## Features: ativar, desativar e configurar

Cada feature aceita `true` (ativa com defaults), `false` (desativada — some da
toolbar e a extensão nem carrega) ou um **objeto de configuração**:

```tsx
<Editor
  features={{
    table: false,
    textType: { levels: [1, 2, 3] },
    image: { onUpload: async (file) => minhaApi.upload(file) },
  }}
/>
```

### Catálogo

| Chave | Feature | Configuração |
|---|---|---|
| `textType` | Parágrafo/Título 1–6 | `levels: (1\|2\|...\|6)[]` |
| `bold` / `italic` / `strike` / `underline` | Formatação básica | — |
| `subscript` / `superscript` | Sub/sobrescrito | — |
| `bulletList` | Lista com marcadores | `styles: ("disc"\|"dash")[]` |
| `orderedList` | Lista numerada | `types: ("1"\|"a"\|"A"\|"i"\|"I")[]` |
| `indent` | Recuo | `maxLevel`, `step` |
| `columns` | Colunas estilo jornal | `counts: number[]` (2–4) |
| `image` | Imagem (upload/URL, resizer, alt, legenda, alinhamento) | ver abaixo |
| `table` | Tabela (balloon com linhas/colunas/mesclar/propriedades) | `resizable: boolean` |
| `undoRedo` | Desfazer/refazer | — |
| `textAlign` | Alinhamento | `alignments` |
| `lineHeight` | Entrelinha | `options: {label, value}[]` |
| `textColor` / `backgroundColor` | Cores do texto/fundo | `colors: string[]` |
| `highlight` | Marca-texto | `colors: string[]` |
| `fontFamily` | Fonte | `fonts: {label, value}[]` |
| `fontSize` | Tamanho | `sizes: {label, value}[]` |
| `specialCharacters` | Caracteres especiais (busca + categorias) | `sets` |
| `sourceCode` | Código-fonte | `mode: "html" \| "codeBlock"` |
| `math` | Fórmulas matemáticas (MathLive + KaTeX) | `templates`, `keyboardLayouts` |
| `chemistry` | Fórmulas químicas (mhchem) | `groups`, `templates` |

### Imagem: upload

O editor entrega o `File` e usa a string retornada como `src` — pode ser a URL
devolvida pela sua API ou um data-URL base64:

```tsx
image: {
  onUpload: async (file) => {
    const { url } = await api.upload(file);   // sua API
    return url;
  },
  accept: ["image/png", "image/jpeg"],
  maxSizeBytes: 5 * 1024 * 1024,
  onUploadError: (error, file) => toast.error(error.message),
}
```

Sem `onUpload`, o editor converte para **base64** (default zero-config). No
documento, a imagem selecionada ganha resizer nos cantos e toolbar flutuante
com alinhamento, texto alternativo (alt) e legenda.

### Matemática e química

```tsx
math: {
  templates: ["\\hat{#0}", "\\frac{#0}{#?}"],       // menu "Modelos personalizados"
  keyboardLayouts: ["numeric", "greek", meuLayout],  // abas do teclado virtual
},
chemistry: {
  groups: [{ label: "Setas", items: [{ label: "→", value: "->" }] }],
  templates: [{ label: "Combustão", value: "CH4 + 2O2 -> CO2 + 2H2O" }],
}
```

O dialog de matemática tem editor visual (MathLive), modo LaTeX bruto sempre
disponível e preservação byte a byte do código (fórmulas nunca são corrompidas
por round-trip). O de química usa mhchem com paleta lateral por categorias.

### Caracteres especiais

```tsx
specialCharacters: {
  sets: [{ label: "Meus símbolos", characters: ["©", { label: "seta", value: "→" }] }],
}
```

## Customização de UI (prop `ui`)

Ajuste a aparência de qualquer item da toolbar sem mexer no comportamento:

```tsx
<Editor
  ui={{
    bold: { icon: "mdi:format-bold", tooltip: "Negrito (Ctrl+B)" },
    textType: { icon: <MeuIcone /> },           // ReactNode também
    italic: { hidden: true },                    // some da toolbar (feature segue ativa)
    orderedList: { hideOptions: ["I", "i"] },    // oculta opções do menu
  }}
/>
```

| Campo | Efeito |
|---|---|
| `icon` | Nome Iconify (`string`) ou `ReactNode` |
| `tooltip` | Substitui tooltip e nome acessível |
| `hidden` | Remove o botão da toolbar; atalhos/parse continuam funcionando |
| `hideOptions` | Oculta opções de menus pelo `value` |

## Variantes: DocumentEditor e ApostilaEditor

```tsx
import { DocumentEditor, ApostilaEditor } from "@joshualevy029/tiptap-editor";
```

- **`DocumentEditor`** — folhas paginadas estilo Word/Docs: página A4 (ou
  Carta/Ofício) sobre fundo cinza, zoom 50–150%, painel de configuração
  (formato, orientação, margens em cm, cor da folha) e **paginação visual**:
  blocos que estouram a altura útil pulam para a folha seguinte.
- **`ApostilaEditor`** — folha única no formato de página de apostila
  (736px, padding 40/24, tipografia 16px/1.6). Interpreta HTML legado com
  `div.cols` como bloco de colunas editável.

Ambos aceitam todas as props do `Editor` (`features`, `saveAs`, `ui`…).

## Tema

O componente **herda o `ThemeProvider` MUI do host**. Para hosts sem tema
próprio, o pacote exporta um tema grafite:

```tsx
import { createEditorTheme } from "@joshualevy029/tiptap-editor";

<ThemeProvider theme={createEditorTheme()}>
  <App />
</ThemeProvider>;
```

`createEditorTheme(options)` aceita sobrescritas de `ThemeOptions` do MUI.

## Uso com Next.js

O editor é um componente **client-side** (usa DOM/contenteditable).

**App Router** — marque o arquivo que o usa:

```tsx
"use client";

import { Editor } from "@joshualevy029/tiptap-editor";
```

**Pages Router** (ou para evitar SSR por completo):

```tsx
import dynamic from "next/dynamic";

const Editor = dynamic(
  () => import("@joshualevy029/tiptap-editor").then((m) => m.Editor),
  { ssr: false },
);
```

O componente já monta com `immediatelyRender: false` (seguro para hidratação).
Os CSS do KaTeX são importados pela própria lib.

## Exibindo o conteúdo salvo

- **Com o próprio pacote**: `<Editor defaultValue={html} readOnly />` — render
  fiel, fórmulas via KaTeX embutido.
- **Com MathJax no host**: as fórmulas saem no HTML como
  `<span data-type="inline-math" data-latex="...">` /
  `<div data-type="block-math" data-latex="...">`. Converta `data-latex` em
  delimitadores (`\(...\)` / `$$...$$`) antes do typeset e carregue a extensão
  `mhchem` para química.

## Desenvolvimento

```bash
npm install
npm run dev        # playground (Vite) com todas as variantes
npm test           # vitest (64 testes)
npm run typecheck  # lib + playground + tests
npm run build      # dist/ (ESM + CJS + d.ts)
```

A especificação completa (decisões, invariantes P1–P3 das fórmulas, roadmap
headless) vive em [SPEC.md](./SPEC.md).
