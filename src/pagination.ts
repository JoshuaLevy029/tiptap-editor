import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import type { PageMetrics } from "./documentPage";

export const PAGE_GAP_PX = 24;

export interface PaginationContext {
  metrics: PageMetrics;
  onPageCount?: (count: number) => void;
}

interface PageBreak {
  readonly height: number;
  readonly pos: number;
}

const paginationKey = new PluginKey<readonly PageBreak[]>("pagination");

function sameBreaks(
  a: readonly PageBreak[],
  b: readonly PageBreak[],
): boolean {
  return (
    a.length === b.length &&
    a.every(
      (item, index) =>
        item.pos === b[index]?.pos &&
        Math.abs(item.height - (b[index]?.height ?? 0)) < 1,
    )
  );
}

function createSpacer(height: number): HTMLElement {
  const element = document.createElement("div");
  element.className = "editor-page-spacer";
  element.contentEditable = "false";
  element.style.height = `${height}px`;

  return element;
}

/**
 * Paginação visual: mede os blocos de nível superior e injeta espaçadores
 * (decorations) que empurram o conteúdo para a folha seguinte quando a altura
 * útil da página estoura. As folhas em si são desenhadas pelo Editor atrás do
 * conteúdo. Limite conhecido: um bloco único mais alto que a página não é
 * fatiado — atravessa o vão.
 */
export function createPaginationExtension(context: {
  readonly current: PaginationContext;
}) {
  return Extension.create({
    name: "pagination",
    addProseMirrorPlugins() {
      return [
        new Plugin<readonly PageBreak[]>({
          key: paginationKey,
          state: {
            init: () => [],
            apply(tr, previous) {
              const meta = tr.getMeta(paginationKey) as
                | readonly PageBreak[]
                | undefined;
              return meta ?? previous;
            },
          },
          props: {
            decorations(state) {
              const breaks = paginationKey.getState(state) ?? [];

              if (breaks.length === 0) {
                return DecorationSet.empty;
              }

              return DecorationSet.create(
                state.doc,
                breaks.map((item) =>
                  Decoration.widget(
                    item.pos,
                    () => createSpacer(item.height),
                    { side: -1 },
                  ),
                ),
              );
            },
          },
          view(view) {
            let frame = 0;

            const measure = () => {
              const { metrics, onPageCount } = context.current;
              const usable = metrics.innerHeightPx;
              const dom = view.dom;

              // DOM na ordem: espaçadores (subtraídos) e blocos de nível 1.
              const blockByElement = new Map<HTMLElement, number>();
              view.state.doc.forEach((_node, offset) => {
                const element = view.nodeDOM(offset);

                if (element instanceof HTMLElement) {
                  blockByElement.set(element, offset);
                }
              });

              let spacerAbove = 0;
              const items: Array<{ pos: number; top: number; el: HTMLElement }> =
                [];

              for (const child of Array.from(dom.children)) {
                if (!(child instanceof HTMLElement)) {
                  continue;
                }

                if (child.classList.contains("editor-page-spacer")) {
                  spacerAbove += child.offsetHeight;
                  continue;
                }

                const pos = blockByElement.get(child);

                if (pos !== undefined) {
                  items.push({
                    el: child,
                    pos,
                    top: child.offsetTop - metrics.paddingPx.top - spacerAbove,
                  });
                }
              }

              const gapHeight =
                metrics.paddingPx.bottom + PAGE_GAP_PX + metrics.paddingPx.top;
              const breaks: PageBreak[] = [];
              let accumulated = 0;

              for (let index = 0; index < items.length; index += 1) {
                const current = items[index];
                const next = items[index + 1];

                if (current === undefined) {
                  continue;
                }

                const height =
                  next === undefined
                    ? current.el.offsetHeight
                    : next.top - current.top;

                if (accumulated > 0 && accumulated + height > usable) {
                  breaks.push({
                    height: usable - accumulated + gapHeight,
                    pos: current.pos,
                  });
                  accumulated = height;
                } else {
                  accumulated += height;
                }
              }

              onPageCount?.(breaks.length + 1);

              const previous = paginationKey.getState(view.state) ?? [];

              if (!sameBreaks(previous, breaks)) {
                view.dispatch(view.state.tr.setMeta(paginationKey, breaks));
              }
            };

            const schedule = () => {
              window.cancelAnimationFrame(frame);
              frame = window.requestAnimationFrame(measure);
            };

            schedule();

            return {
              destroy: () => window.cancelAnimationFrame(frame),
              update: schedule,
            };
          },
        }),
      ];
    },
  });
}

/** Reexecuta a medição (ex.: após mudar formato/margens da página). */
export function repaginate(view: EditorView): void {
  view.dispatch(view.state.tr.setMeta(paginationKey, []));
}
