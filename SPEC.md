# SPEC — Editor Tiptap

> Documento de especificação em construção. Seções marcadas com `[a definir]`
> serão preenchidas conforme as decisões forem tomadas.

## 1. Visão Geral

Este projeto entrega um **componente de editor rich-text** construído sobre o Tiptap, distribuído como **pacote npm instalável** para uso em outros projetos React.

O repositório contém duas partes:

1. **O pacote (biblioteca)** — o componente `<Editor />` (nome final `[a definir]`) com sua API pública (props, eventos, ref/handles), extensões Tiptap e UI em MUI. É o artefato publicado.
2. **O playground (app de demonstração)** — aplicação visualizável localmente que consome o pacote como um projeto real consumiria, servindo para desenvolvimento, testes manuais e validação visual. Não é publicado.

Princípios:
- O playground só pode usar a **API pública** do pacote — se o playground precisa de algo interno, isso indica lacuna na API do componente.
- O componente deve funcionar em qualquer projeto React que atenda as peer dependencies, sem depender de framework específico (Next.js, Vite etc.).

## 2. Stack de Pacotes

### 2.1 Editor — Tiptap (v3.x)

Docs: https://tiptap.dev/docs

| Pacote | Versão | Papel |
|---|---|---|
| `@tiptap/react` | ^3.27.3 | Bindings React (`useEditor`, `EditorContent`, menus) |
| `@tiptap/pm` | ^3.27.3 | Núcleo ProseMirror (peer dependency obrigatória) |
| `@tiptap/starter-kit` | ^3.27.3 | Conjunto base de extensões (parágrafo, headings, bold, italic, listas, blockquote, code, history/undo-redo, link, underline etc.) |

Extensões adicionais do Tiptap (ex.: `@tiptap/extension-table`, `@tiptap/extension-image`, `@tiptap/extension-text-align`, `@tiptap/extension-placeholder`) serão listadas na seção **Funcionalidades** conforme o escopo for definido.

### 2.2 UI — Material UI (v9.x)

Docs: https://mui.com/material-ui/getting-started/

| Pacote | Versão | Papel |
|---|---|---|
| `@mui/material` | ^9.2.0 | Componentes de UI (toolbar, botões, menus, dialogs, tooltips) |
| `@emotion/react` | latest | Peer dependency do MUI (engine de estilos) |
| `@emotion/styled` | latest | Peer dependency do MUI |

Convenções:
- Toda a UI do editor (toolbar, bubble menu, dialogs de link/imagem, seletores) será composta com componentes MUI — sem CSS custom fora do sistema de tema do MUI.
- Tema centralizado via `ThemeProvider` (suporte a light/dark `[a confirmar]`).

### 2.3 Ícones — Iconify

Docs: https://iconify.design/docs/

| Pacote | Versão | Papel |
|---|---|---|
| `@iconify/react` | ^6.0.2 | Componente `<Icon />` para todos os ícones das ações do editor |

Convenções:
- Ícones das ações do editor (bold, italic, listas, tabela, imagem, undo/redo…) virão exclusivamente do Iconify — não usar `@mui/icons-material`.
- Conjunto (prefixo) padrão de ícones: `[a definir]` (ex.: `material-symbols:`, `mdi:`, `lucide:`, `tabler:`).

### 2.4 Base do projeto

- Linguagem: **TypeScript** (tipos publicados junto com o pacote — `.d.ts`).
- Build da biblioteca: `[a definir]` — proposta: **Vite em library mode** (ou `tsup`), gerando ESM + CJS + tipos.
- Playground: **Vite + React**, rodando localmente (`npm run dev`) e consumindo a lib via workspace/alias.
- Organização do repositório: `[a definir]` — proposta: repositório único com `src/` (lib) + `playground/` (demo), sem monorepo formal na v1.

### 2.5 Estratégia de dependências do pacote

Para evitar duplicação de React/MUI no projeto consumidor:

| Tipo | Pacotes | Racional |
|---|---|---|
| `peerDependencies` | `react`, `react-dom`, `@mui/material`, `@emotion/react`, `@emotion/styled` | O projeto consumidor já os possui; duplicá-los quebra contexto de tema e hooks |
| `dependencies` | `@tiptap/*`, `@iconify/react` | Detalhes internos do editor; o consumidor não precisa conhecê-los |

- O componente deve respeitar o `ThemeProvider` do projeto consumidor (herda o tema MUI do host); se não houver, usa o tema default do MUI.
- Faixas de versão das peers: `[a definir]` (ex.: `@mui/material >=7 <10` para aceitar hosts em versões anteriores, ou fixar `^9`).

## 3. Propósito e Casos de Uso

[a definir]

## 4. Funcionalidades do Editor

> Catálogo da v1. Cada feature tem uma chave na prop `features` (seção 7.1.1).
> Default: **todas ativas** (`true`) — o consumidor desativa o que não quer.
>
> Todas as pendências de detalhamento (antes marcadas com ⏳) foram resolvidas
> durante o desenvolvimento — o catálogo abaixo reflete o implementado.

| # | Feature | Chave `features` | Extensão Tiptap / implementação | Observações |
|---|---------|------------------|--------------------------------|-------------|
| 1 | Tipo de texto (Parágrafo, H1–H6) | `textType` | `Heading` + `Paragraph` (StarterKit) | UI: select na toolbar. Config: `levels` (default 1–6) |
| 2 | Negrito | `bold` | `Bold` (StarterKit) | — |
| 3 | Itálico | `italic` | `Italic` (StarterKit) | — |
| 4 | Lista não ordenada (ponto e traço) | `bulletList` | `BulletList` (StarterKit) + atributo custom de estilo | Estilos: disco (`•`) e traço (`–`). Config: `styles`. Menu com preview visual dos marcadores |
| 5 | Lista ordenada (número, letra, romano) | `orderedList` | `OrderedList` (StarterKit) + atributo `type` | Tipos: `1`, `a`, `A`, `i`, `I`. Config: `types`. Menu com preview visual |
| 6 | Diminuir/Aumentar recuo | `indent` | Extensão custom (não há oficial) + `sinkListItem`/`liftListItem` para listas | Em listas: muda nível de aninhamento; em parágrafos: atributo de indentação. Config: `maxLevel`, `step` |
| 7 | Imagem | `image` | `@tiptap/extension-image` | Dois fluxos de inserção: **upload** (via `onUpload`, seção 7.1.2) e **por URL** (usuário cola o link da imagem). Ambos disponíveis no dialog de inserção |
| 8 | Tabela | `table` | `@tiptap/extension-table` (Table/Row/Header/Cell estendidos com atributos de estilo) | `resizable: true` default (colunas por arraste; tabela nasce com colunas fixas ⇒ borda direita redimensiona a tabela inteira). **Balloon flutuante** estilo CKEditor sobre a célula ativa: menus Coluna/Linha (inserir, excluir, selecionar, toggle cabeçalho), Mesclar (direcional + dividir), Propriedades da célula (borda, fundo, dimensões, alinhamentos H/V) e Propriedades da tabela (borda, fundo, largura %, alinhamento) |
| 9 | Undo/Redo | `undoRedo` | `UndoRedo` (StarterKit) | — |
| 10 | Alinhamento do texto | `textAlign` | `@tiptap/extension-text-align` | left / center / right / justify |
| 11 | Cor de fundo do texto | `backgroundColor` | `BackgroundColor` (`@tiptap/extension-text-style` / TextStyleKit) | Color picker livre (paleta + cor custom). Convive com #15: aqui qualquer cor; lá paleta fixa de marca-texto |
| 12 | Cor do texto | `textColor` | `Color` (TextStyleKit) | Color picker na toolbar |
| 13 | Font-family | `fontFamily` | `FontFamily` (TextStyleKit) | Config: `fonts` (cada item renderizado na própria fonte) |
| 14 | Tamanho do texto | `fontSize` | `FontSize` (TextStyleKit) | Config: `sizes` |
| 15 | Marcador (marca-texto) | `highlight` | `@tiptap/extension-highlight` (`multicolor: true`) | Paleta fixa de marca-texto (config `colors`), distinta da cor de fundo livre (#11) |
| 16 | Caracteres especiais | `specialCharacters` | UI própria (dialog/grid) + `insertContent` — não requer extensão | Busca + categorias com inserção contínua. Config: `sets` |
| 17 | Tachado | `strike` | `Strike` (StarterKit) | — |
| 18 | Sublinhado | `underline` | `Underline` (StarterKit no v3) | — |
| 19 | Subscrito | `subscript` | `@tiptap/extension-subscript` | Mutuamente exclusivo com #20 na mesma seleção |
| 20 | Sobrescrito | `superscript` | `@tiptap/extension-superscript` | Mutuamente exclusivo com #19 |
| 21 | Código fonte | `sourceCode` | Dialog próprio ou `CodeBlock` | Config `mode`: `"html"` (ver/editar o HTML do documento) ou `"codeBlock"` |
| 22 | Fórmulas matemáticas | `math` | `@tiptap/extension-mathematics` (^3.27.3, MIT) + `katex` (^0.17) | Extensão oficial (Plano A adotado — ver 4.2). Inline **e** bloco, com dialog MathLive (4.2.1) |
| 23 | Fórmulas químicas | `chemistry` | KaTeX + plugin **mhchem** (`\ce{...}`) sobre a mesma extensão de matemática | Compartilha o runtime KaTeX com #22; dialog próprio com paleta lateral (4.3) |
| 24 | Emoji | `emoji` | `@tiptap/extension-emoji` (https://tiptap.dev/docs/editor/extensions/nodes/emoji) | **Opcional — não obrigatório na v1.** Default: desativada. Sugestão por `:shortcode:` + picker na toolbar `[a detalhar quando priorizada]` |
| 26 | Entrelinha | `lineHeight` | `LineHeight` (TextStyleKit) | Menu: 1 / 1,15 / 1,5 / 2 / padrão |
| 25 | Colunas (estilo jornal) | `columns` | Node custom `columns` (CSS multi-column) | Menu na toolbar: 2/3 colunas + remover. Conteúdo flui entre colunas; filhos não quebram no meio (`break-inside: avoid`). Interpreta também o formato `div.cols` do pipeline de apostilas. Config: `counts` |

### 4.0 Invariante: escopo de aplicação da formatação

**Features que alteram texto surtem efeito SOMENTE sobre:**

1. **O texto selecionado** — quando há seleção, a formatação se aplica exatamente
   ao trecho selecionado; ou
2. **O próximo texto digitado** — quando o cursor está posicionado sem seleção
   (colapsado), a formatação é "armada" como marca ativa e vale para o que for
   digitado a partir dali (comportamento padrão de marks do ProseMirror).

**É PROIBIDO que qualquer ação de formatação altere o documento inteiro** quando
não há seleção do documento inteiro. Isso vale para todas as features de texto:
negrito, itálico, tachado, sublinhado, sub/sobrescrito, cor do texto, cor de
fundo, marcador, font-family, tamanho, e também para as de bloco (tipo de texto,
alinhamento, recuo, listas), que atuam apenas no(s) bloco(s) tocado(s) pela
seleção ou onde o cursor está.

Este invariante é **critério de aceite obrigatório** nos testes de toda feature
de formatação (unit + E2E).

### 4.1 Pontos do catálogo — resoluções

1. **#11 vs #15** — são duas features: #11 é cor de fundo livre (paleta + picker
   custom); #15 é marca-texto com paleta fixa configurável.
2. **#21 "Código fonte"** — as duas interpretações, via config `mode`:
   `"html"` (ver/editar o HTML do documento) ou `"codeBlock"`.
3. **#6 Recuo** — fora de listas, recua por atributo de indentação com passos
   configuráveis (`step`, `maxLevel`).
4. Defaults — **confirmado**: todas as features ativas por padrão.

### 4.2 Fórmulas matemáticas — decisão de implementação

Docs: https://tiptap.dev/docs/editor/extensions/nodes/mathematics

- **Plano A (preferido)**: usar a extensão oficial `@tiptap/extension-mathematics`.
  Verificado em 2026-07: disponível no npm como pacote **MIT** (v3.27.3, mesma
  linha de versão do restante do Tiptap), com `katex ^0.16.4 || ^0.17.0` como
  peer dependency. Fornece nodes de matemática **inline** e **em bloco** com
  render via KaTeX.
- **Plano B (fallback)**: caso a extensão oficial se mostre inadequada durante o
  desenvolvimento (limitações de edição, conflitos com outras extensões), criar
  node custom próprio que armazena o LaTeX como atributo e renderiza com KaTeX
  em NodeView — mesma dependência de runtime, sem lock-in.
- Em ambos os planos: `katex` entra como **dependency** do pacote e o **CSS do
  KaTeX** precisa ser importado/distribuído pela lib (estratégia de CSS na
  seção 7.2 `[a detalhar]`).
- A feature #23 (química) se apoia na mesma base: plugin **mhchem** do KaTeX
  habilitado sobre o mesmo node de fórmula (`\ce{...}`).

### 4.2.1 Editor de fórmulas (UI)

Clicar no botão de Fórmula Matemática (ou dar duplo clique/Enter numa fórmula
existente) abre um **editor de LaTeX** em dialog (MUI), no espírito das
referências visuais fornecidas (teclado virtual com abas de categorias).

**Base: [MathLive](https://mathlive.io)** (`mathlive`, MIT, v0.110.x — verificado
2026-07) — web component `<math-field>` de edição matemática WYSIWYG:

- Edição visual da fórmula com cursor dentro da expressão (frações, raízes,
  integrais navegáveis) e **preview em tempo real**.
- **Teclado virtual embutido** com as mesmas categorias das imagens de
  referência: numérico (`123`), símbolos/conjuntos (`∞≠∈`), alfanumérico
  (`abc`) e grego (`αβγ`) — layouts customizáveis para incluir teclas extras
  que o time usa com frequência.
- Entrada e saída em **LaTeX puro** — o que o dialog devolve para o node do
  Tiptap é a string LaTeX.

**Requisito de cobertura total de sintaxe** (motivado pelo problema atual de
"recortar fórmula como imagem" quando o editor não suporta a sintaxe):

1. O dialog SEMPRE oferece um **modo LaTeX bruto** (toggle visual ⇄ código):
   um campo de texto onde qualquer sintaxe pode ser digitada/colada, mesmo que
   não exista tecla para ela no teclado virtual. O teclado é aceleração, nunca
   limite.
2. A cobertura passa a ser limitada apenas pelo **renderizador**:
   - Renderer padrão: **KaTeX** (rápido; cobre a grande maioria dos comandos +
     `mhchem` para química). Lista de suporte: https://katex.org/docs/supported
   - Se no uso real aparecerem sintaxes fora do KaTeX, fallback documentado:
     **MathJax v4** como renderer alternativo (cobertura LaTeX maior, mais
     pesado) — decisão adiada até haver caso concreto. `[gatilho: fórmula real
     não renderizável no KaTeX]`
3. Fórmula com sintaxe não suportada pelo renderer não some nem vira imagem:
   o node exibe o **LaTeX cru com indicação de erro**, e o conteúdo permanece
   editável e persistido.

**Menu de inserção/edição avançada** (referência: imagens 5–6, que correspondem
ao menu nativo do `<math-field>` do MathLive — vem de fábrica, deve permanecer
habilitado):

- **Inserir Matriz** — submenu com seletor visual de dimensões (grade N×M).
- **Insert (templates)** — expressões prontas: valor absoluto, raiz n-ésima,
  log base a; Cálculo (derivada, derivada n-ésima, integral definida,
  somatório, produtório); Números complexos (módulo, argumento, parte
  real/imaginária, conjugado). Lista de templates customizável para incluir
  expressões frequentes do time `[a levantar]`.
- **Modo** — alternância math/texto dentro da fórmula.
- **Estilo da Fonte / Cor / Cor de Fundo** — formatação aplicada a trechos da
  fórmula (gera comandos LaTeX correspondentes, ex.: `\textcolor`).
- **Recortar / Copiar / Colar / Selecionar Tudo** — clipboard dentro da fórmula,
  com atalhos padrão (Ctrl+X/C/V/A).

**Comportamento do dialog:**

- `Confirmar` insere/atualiza o node de fórmula no documento; `Cancelar`
  descarta sem tocar no documento.
- Undo/redo **interno ao dialog** (edição da fórmula) independente do
  undo/redo do documento — confirmar a fórmula gera um único passo no
  histórico do editor.
- Suporta criar fórmula nova e **editar fórmula existente** (abre com o LaTeX
  atual carregado).
- Química (#23): **NÃO usa MathLive** (sem suporte a mhchem) — fluxo próprio na
  seção 4.3.

**Custo**: `mathlive` é dependência pesada (centenas de KB). Mitigação: import
dinâmico — o código do MathLive só é carregado quando o dialog de fórmula abre
pela primeira vez (e somente se a feature `math`/`chemistry` estiver ativa).

### 4.2.2 Problemas do editor atual (CKEditor 4 + MathLive) que a v1 DEVE resolver

Contexto: hoje o time usa CKEditor 4 com MathLive embutido como componente
customizado. Dois defeitos desse acoplamento são **motivadores diretos** deste
projeto e viram critérios de aceite:

**P1 — Edição de fórmula existente gera fórmula nova no fim do texto.**
No editor atual, abrir uma fórmula para edição e confirmar cria uma **nova**
fórmula ao final do documento em vez de atualizar a original — a equipe de
digitação precisa recortar e reposicionar manualmente.

*Critério de aceite:*
- Confirmar a edição de uma fórmula existente **atualiza o mesmo node, na mesma
  posição** do documento. NUNCA cria um segundo node, NUNCA move a fórmula.
- Cancelar deixa o node intocado.
- Inserção de fórmula **nova** ocorre na **posição do cursor** (nunca no fim do
  documento), substituindo a seleção se houver.
- Testes E2E obrigatórios: editar fórmula no início/meio/fim do documento e
  verificar posição + contagem de nodes antes/depois.

**P2 — Faltam opções de construção de fórmulas.**
O conjunto de teclas/templates do editor atual não cobre todas as sintaxes que
o time usa, forçando o recorte de fórmulas como imagem.

*Critério de aceite:*
- Modo **LaTeX bruto** sempre disponível no dialog (já especificado em 4.2.1) —
  nenhuma fórmula é impossível de construir por falta de tecla.
- Layouts do teclado virtual e lista de templates do menu Insert são
  **configuráveis pela feature** (`math.keyboardLayouts` / `math.templates`
  `[nomes a definir]`), permitindo adicionar as construções que faltam sem
  alterar o pacote.
- Levantamento com a equipe de digitação das construções ausentes hoje, para
  entrarem no layout padrão do pacote. `[pendente — insumo do time]`

**P3 — LaTeX válido quebra ao passar pelo input do MathLive.**
Algumas funções do próprio LaTeX são corrompidas quando digitadas/coladas no
`<math-field>`: o MathLive converte o LaTeX para seu modelo interno e
re-serializa ao sair, e comandos que ele não representa fielmente são alterados
ou destruídos nesse round-trip.

*Regra de arquitetura (fonte da verdade):*
- O node de fórmula do documento armazena **a string LaTeX como fonte da
  verdade** — nunca a serialização interna do MathLive.
- **Modo LaTeX bruto edita a string diretamente**, sem round-trip pelo parser
  do MathLive: confirmar a partir do modo bruto persiste o texto **verbatim**
  (a renderização no documento é do KaTeX, não do MathLive).
- O modo visual (MathLive) só re-serializa a fórmula se o usuário **de fato
  editar no modo visual**. Abrir o dialog e confirmar sem alteração devolve a
  string original intocada (comparação por igualdade antes de sobrescrever).
- Ao abrir uma fórmula existente, o dialog **valida o round-trip** (parse →
  serialize → compara): se o MathLive não reproduz o LaTeX fielmente, o dialog
  abre direto no **modo bruto** com aviso ("edição visual indisponível para
  esta fórmula sem risco de alteração"), protegendo o conteúdo.

*Critério de aceite:*
- Teste automatizado com corpus de fórmulas reais do time `[coletar]`:
  abrir → confirmar sem editar → o LaTeX persistido é byte a byte idêntico.

### 4.3 Fórmulas químicas — decisão de implementação

**Restrição (confirmada pelo time): o MathLive não funciona para química** —
não há suporte a mhchem/`\ce{...}` no `<math-field>`. Portanto a feature #23
tem fluxo de edição próprio, separado do dialog de matemática:

**Editor de fórmula química (dialog MUI dedicado):**

- **Campo de código mhchem** como entrada principal (a notação `\ce{...}` já é
  próxima da escrita química natural: `\ce{2H2 + O2 -> 2H2O}`), com
  **preview em tempo real** renderizado por KaTeX + plugin mhchem.
- **Paleta lateral por categorias** (substitui o teclado virtual do MathLive),
  disposta à esquerda do card de edição: **Setas** (`->`, `<=>`, `<-`, `<->`,
  `Δ` na seta, catalisador), **Estados** (`(s)`, `(l)`, `(g)`, `(aq)`),
  **Cargas** (`^+`, `^2+`, `^-`, `^2-`), **Partículas** (elétron, próton,
  nêutron, isótopo `^{A}_{Z}X`), **Indicadores** (gás `^`, precipitado `v`,
  hidratado `*`) e **Modelos prontos** (equações completas nomeadas). Cada
  botão insere o trecho mhchem na posição do cursor. Categorias e modelos são
  configuráveis via `chemistry.groups` / `chemistry.templates` (lista `palette`
  legada vira categoria única).
- **Card de edição no mesmo estilo do dialog de matemática** (seção 4.2.1):
  preview grande centralizado em cima, separador tracejado e linha de código
  mono embaixo — com o invólucro `\ce{` `}` exibido como moldura fixa nas
  bordas da linha, e o usuário editando apenas o conteúdo interno. Se o LaTeX
  da fórmula não for exatamente `\ce{...}`, a moldura some e edita-se a string
  completa (preservação P3 byte a byte em ambos os casos).
- Mesmo contrato do dialog de matemática: `Confirmar`/`Cancelar`, edição
  in-place do node existente (critérios P1), string mhchem como fonte da
  verdade persistida verbatim (critérios P3 — aqui nem existe round-trip, pois
  não há modo visual).
- Erro de sintaxe mhchem: preview exibe o erro sem bloquear a digitação;
  confirmar com erro mantém o LaTeX cru com indicação de erro no documento
  (consistente com 4.2.1 item 3).

**Node no documento**: a fórmula química usa o **mesmo node de fórmula** da
matemática (LaTeX é LaTeX — `\ce{}` é só um comando), diferenciando apenas o
dialog aberto na edição: se o conteúdo casa com `\ce{...}`, abre o dialog de
química; caso contrário, o de matemática. `[a validar: atributo explícito
`kind: 'math' | 'chemistry'` no node em vez de detecção por conteúdo]`

## 5. UI/UX

### 5.1 Toolbar — regras de controles

**Regra geral: a toolbar NÃO usa `Select` nem botões com borda.** Todo controle
é um `IconButton` MUI (sem borda), e controles com opções abrem **menu ao
clicar** (`Menu`/`Popover` ancorado no botão). Motivação: densidade visual
uniforme, estilo Google Docs.

Controles do tipo **IconButton + menu de opções**:

| Feature | Conteúdo do menu |
|---|---|
| Tipo de texto (#1) | Parágrafo, H1…H6 (cada item renderizado com a tipografia correspondente) |
| Lista com marcadores (#4) | Estilos de marcador: disco, traço |
| Lista numerada (#5) | Tipos de numeração: `1.` `a.` `A.` `i.` `I.` |
| Font-family (#13) | Fontes configuradas (item renderizado na própria fonte) |
| Tamanho do texto (#14) | Tamanhos configurados |
| Marca-texto (#15) | Paleta de cores — cada item com **quadradinho (swatch) mostrando a cor** |

Controles do tipo **IconButton + ColorPicker** (Popover com paleta/picker):

| Feature | Ícone (Iconify) | Comportamento |
|---|---|---|
| Cor do texto (#12) | `material-symbols:format-color-text` (letra "A" com barra de cor) | A **barra de cor do ícone reflete a cor atualmente selecionada** |
| Cor de fundo (#11) | `material-symbols:format-color-fill` (balde com barra de cor) | Idem — barra do ícone acompanha a cor selecionada |
| Marca-texto (#15) | `material-symbols:ink-highlighter` (caneta marca-texto) | Idem — indicador de cor no ícone |

Referências visuais: ícones estilo Google Docs (imagens 8–9 da conversa) — botão
compacto com seta de dropdown discreta ao lado do ícone quando há menu.

Controles simples (toggle on/off — negrito, itálico, tachado, sublinhado,
sub/sobrescrito, alinhamentos, recuo, undo/redo, imagem, tabela, fórmulas,
caracteres especiais): `IconButton` com estado ativo indicado por cor/fundo
(padrão MUI `selected`), tooltip com nome da ação e atalho.

### 5.2 Superfícies e conteúdo

- **Cantos arredondados**: dialogs, menus e popovers do editor usam
  `borderRadius: 3` (tokens do tema MUI) — nada de superfícies "quadradas".
  O container do editor (Paper) acompanha.
- **Tabela**: células sempre com **bordas visíveis** (`1px`, cor `divider` do
  tema), header com fundo `action.hover`, célula selecionada com
  `action.selected`.
- **Cor primária sugerida: grafite** (`#24292f`) — o pacote exporta
  `createEditorTheme()` / `EDITOR_THEME_OPTIONS` como tema opcional para hosts
  sem tema próprio. O componente continua **herdando o ThemeProvider do host**
  quando existir (seção 2.2); o azul default do MUI não deve aparecer nas demos.

### 5.3 Variant "document" (DocumentEditor)

Além do editor em cartão (default), o pacote exporta **`DocumentEditor`**
(atalho para `<Editor variant="document" />`): visual de folha estilo editor
de documento — página branca de 816px centralizada sobre fundo cinza com
sombra, margens internas de documento, toolbar fixa no topo com **controle de
zoom** (50%–150%) e área rolável. Pensado para editar páginas de apostila.
Inclui **painel de configuração da página** na toolbar (formato A4/Carta/Ofício,
orientação, margens em cm, cor da folha) e **paginação visual em folhas
separadas**: o documento continua contínuo no ProseMirror, mas espaçadores por
decoration empurram cada bloco que estoura a altura útil para a folha seguinte,
com as folhas desenhadas atrás do conteúdo (fundo cinza no vão). Limite
conhecido: bloco único mais alto que a página não é fatiado (atravessa o vão).
`[futuro: cabeçalho/rodapé com numeração; fatiamento de blocos gigantes]`

### 5.4 Variant "apostila" (ApostilaEditor)

Folha única no **formato exato do pipeline de conversão de apostilas**
(`article.page` do CSS de tokens): 736px (46rem) de largura, padding 40px/24px, tipografia
16px/1.6 — a altura cresce com o conteúdo, como nos arquivos HTML gerados.
Com zoom, sem paginação nem painel de formato (o formato é fixo do pipeline).
Interpreta `div.cols` como bloco de colunas (feature #25). Exportado como
`ApostilaEditor` (`<Editor variant="apostila" />`).

### 5.5 Demais definições de UI/UX

[a definir — layout geral, bubble menu, responsividade, tema]

## 6. Persistência e Formatos

### 6.1 Formato do state (`saveAs`)

O consumo previsto é `useState` no projeto host, com o valor enviado a banco de
dados e outras telas:

```tsx
const [content, setContent] = useState("");
<Editor defaultValue={content} onChange={setContent} />
```

- **`onChange` emite string serializada** a cada alteração; `defaultValue`
  aceita o mesmo formato.
- **Duas modalidades de uso**:
  - **Não controlado** — `defaultValue` só na montagem; o editor é dono do
    estado dali em diante.
  - **Controlado** — `value` + `onChange`: mudanças externas de `value`
    substituem o documento; o eco do próprio `onChange` é ignorado (comparação
    com o último valor emitido) para não resetar cursor/digitação. `value` tem
    precedência sobre `defaultValue`.
- **Formato padrão: HTML.** A prop `saveAs?: "html" | "markdown"` troca o
  formato de ambos (default `"html"`).
- Markdown usa o serializador oficial `@tiptap/markdown` (nodes de fórmula
  serializam como `$...$` / `$$...$$`).
- O JSON Tiptap continua acessível pela ref (`getJSON()`), assim como
  `getHTML()` e `getMarkdown()`, independentemente do `saveAs`.
- Fórmulas no HTML saem como `<span data-type="inline-math" data-latex="...">`
  e `<div data-type="block-math" data-latex="...">` — LaTeX verbatim no
  atributo (interoperável com MathJax mediante adaptador; ver 6.2).

### 6.2 Interoperabilidade e export

- Exibição fora do editor: componente em `readOnly` (KaTeX embutido) ou
  adaptador no host convertendo `data-latex` em delimitadores MathJax.
- **Export com botão (HTML/Markdown/PDF): adiado** — fica para versão futura,
  fora do escopo da v1.

## 7. Arquitetura de Código

[a definir — estrutura de pastas, componentização, hooks]

## 7.1 API Pública do Componente

### 7.1.1 Princípio central: features configuráveis

O componente é controlado por uma prop `features`: cada feature do editor pode ser
**ativada/desativada** individualmente e, quando aplicável, recebe **configurações
próprias**. Uma feature desativada não aparece na toolbar, não registra atalhos e
sua extensão Tiptap não é carregada.

Formato geral — cada chave aceita três formas:

```ts
type FeatureFlag<TConfig = never> =
  | boolean            // true = ativa com defaults | false = desativada
  | undefined          // usa o default da feature (definido na tabela da seção 4)
  | TConfig;           // ativa com configuração específica

interface EditorFeatures {
  bold?: FeatureFlag;
  italic?: FeatureFlag;
  heading?: FeatureFlag<{ levels?: (1 | 2 | 3 | 4 | 5 | 6)[] }>;
  table?: FeatureFlag<{ resizable?: boolean }>;
  image?: FeatureFlag<ImageFeatureConfig>;
  link?: FeatureFlag<{ openOnClick?: boolean; protocols?: string[] }>;
  // ... demais features listadas na seção 4
}
```

### 7.1.2 Exemplo de feature com configuração: imagem

A persistência da imagem é resolvida por um único callback `onUpload`, fornecido
pelo consumidor. O editor entrega o `File` e usa a string retornada como `src`
do node de imagem — pode ser uma URL (o handler fez upload para uma API/storage)
ou um data-URL base64 (o handler embutiu a imagem no documento):

```ts
type ImageFeatureConfig = {
  /**
   * Recebe o arquivo e retorna o src final da imagem (URL ou data-URL base64).
   * Se omitido, o editor converte para base64 internamente (default zero-config).
   */
  onUpload?: (file: File) => Promise<string>;
  /** Restrições de arquivo */
  accept?: string[];        // default: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  maxSizeBytes?: number;    // default: [a definir]
  /** Callback de erro (arquivo inválido ou onUpload rejeitado) */
  onUploadError?: (error: Error, file: File) => void;
};
```

- Enquanto o `onUpload` está pendente, o editor exibe estado de carregamento no
  local da imagem (placeholder/spinner); em rejeição, remove o placeholder e
  chama `onUploadError`.
- Este padrão — **um callback assíncrono que devolve o resultado final, com
  default interno zero-config** — é o modelo de referência para outras features
  que precisem de integração externa (ex.: anexos, vídeo, menções).

### 7.1.3 Demais props do componente

```ts
interface EditorProps {
  /** Conteúdo inicial (JSON Tiptap ou HTML) — modo não controlado */
  defaultValue?: EditorContentValue;
  /** Conteúdo controlado (confirmado na v1 — ver seção 6.1) */
  value?: EditorContentValue;
  /** Disparado a cada alteração do documento */
  onChange?: (value: EditorContentValue) => void;
  /** Ativação/configuração das features (seção 7.1.1) */
  features?: EditorFeatures;
  /** Somente leitura (renderiza o documento sem toolbar/edição) */
  readOnly?: boolean;
  placeholder?: string;
  /** Sobrescritas de aparência [a detalhar na seção 5] */
  // ...
}

type EditorContentValue = /* JSON Tiptap (ProseMirror doc) | string HTML — [a definir na seção 6] */;
```

- Ref imperativa (`useRef`): expõe handles como `getJSON()`, `getHTML()`, `focus()`,
  `clear()` e acesso à instância Tiptap subjacente (escape hatch). Lista final `[a definir]`.
- Defaults: **toda feature tem um default documentado** (seção 4); chamar
  `<Editor />` sem `features` resulta num editor funcional com o conjunto padrão.

### 7.1.4 Customização de UI por feature (prop `ui`)

Além de ativar/configurar comportamento via `features`, a **aparência** de cada
item da toolbar é customizável pela prop `ui`, keyed pela chave da feature:

```tsx
<Editor
  ui={{
    bold: { icon: "mdi:format-bold", tooltip: "Negrito (Ctrl+B)" },
    textType: { icon: <MeuIcone /> },            // ReactNode também
    italic: { hidden: true },                     // some da toolbar (feature segue ativa)
    orderedList: { hideOptions: ["I", "i"] },     // oculta opções do menu pelo value
  }}
/>
```

Contrato (`ToolbarItemOverride`):

| Campo | Efeito |
|---|---|
| `icon` | Substitui o ícone — nome Iconify (`string`) ou `ReactNode` |
| `tooltip` | Substitui o tooltip e o nome acessível (aria-label) |
| `hidden` | Remove o item da toolbar. **Diferente de `features.x: false`**: a extensão continua carregada (atalhos, parse e serialização funcionam) — só a UI some |
| `hideOptions` | Oculta opções de menus (`menu` items) pelo `value` |

- Implementado como função pura `applyUiOverrides(items, ui)` (exportada) sobre
  as specs da toolbar — as specs originais não são mutadas.
- Ícones em todos os tipos de item (`toggle`, `menu`, `colorPicker`, `dialog`)
  aceitam `ToolbarIcon = string | ReactNode`.
- `[futuro]` overrides para UI interna de dialogs/balloons (rótulos, seções).

## 7.2 Distribuição (pacote npm)

- Nome do pacote: **`@joshualevy029/tiptap-editor`** (repo `github.com/JoshuaLevy029/tiptap-editor`)
- Formatos de saída: ESM + CJS + declarações TypeScript
- Registro: instalação **via git** por enquanto (`prepare` builda no install); npm/GitHub Packages `[a decidir quando publicar]`
- Versionamento: SemVer; changelog `[a definir]`

## 8. Testes e Qualidade

[a definir]

## 9. Roadmap / Fora de Escopo (v1)

### 9.1 Renderer headless (sem MUI) `[roadmap v2]`

Objetivo: oferecer uma versão da UI em **HTML puro + CSS próprio**, sem
dependência de `@mui/material`, para hosts que não usam MUI.

Avaliação de viabilidade (2026-07):

- **O núcleo já é agnóstico de UI**: extensões Tiptap, comandos, serialização
  (HTML/Markdown), invariantes P1–P3 e as **specs da toolbar**
  (`ToolbarItemSpec` — dados + callbacks, sem JSX) não importam MUI.
- **O acoplamento a MUI está nos renderers**: `Toolbar`, dialogs (matemática,
  química, imagem, caracteres especiais, código-fonte), popovers de cor,
  balloon da tabela e chrome dos NodeViews (imagem, upload).
- **Caminho proposto** (3 fases):
  1. Extrair `core` (features/specs/comandos/tipos) para entrada separada do
     pacote (`@…/tiptap-editor/core`) — sem mudanças de comportamento;
  2. Renomear o renderer atual para entrada `mui` (default retrocompatível);
  3. Escrever renderer `html`: mesma árvore de decisão da `Toolbar` atual
     (switch por tipo de spec) com elementos nativos (`<button>`, `<dialog>`,
     `popover` API) e um CSS enxuto com variáveis (`--editor-*`).
- **Custo dominante**: os 5 dialogs e o balloon da tabela (~70% do esforço);
  a toolbar em si é pequena.
- A prop `ui` (7.1.4) e as specs tipadas são o contrato compartilhado entre
  renderers — qualquer renderer novo as respeita.
- **Decisão (2026-07): um único pacote com múltiplas entradas** (subpath
  exports), não dois pacotes: `.` (renderer MUI, default retrocompatível),
  `./core` e futuramente `./html`. Uma versão/um repo, núcleo compartilhado
  sem drift; o consumidor escolhe pelo import. Peers do MUI marcadas
  **opcionais** (`peerDependenciesMeta`) para quem usar só `./html` não
  precisar instalar MUI. Monorepo com pacotes separados só se a governança
  exigir no futuro.

### 9.1.1 Compatibilidade de Node

- O **runtime** do pacote é browser — sem exigência de Node nos consumidores.
- O **toolchain** exige Node ≥20.19 (Vite 7) e ≥20 (Vitest 4) para desenvolver
  e para instalar **via git** (o `prepare` roda o build na máquina de quem
  instala). Consumidor em **Node 18**: instalar de um **registro** (dist
  pré-buildado) ou repo com dist commitado; alternativa: rebaixar para Vite 6
  (suporta Node 18) se o install via git em Node 18 for requisito.

### 9.2 Demais itens fora da v1

- Colaboração em tempo real (Yjs) — descartada na v1 (seção 4).
- Paginação real com cabeçalho/rodapé e numeração (seção 5.3).
- Export com botão (HTML/Markdown/PDF) (seção 6.2).
- Emoji (#24) — opcional, default desativado.
