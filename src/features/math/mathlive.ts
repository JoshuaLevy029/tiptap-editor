import type { DetailedHTMLProps, HTMLAttributes } from "react";

export type MathFieldElementProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
>;

// Augmentação global do JSX declarada aqui (módulo importado pelo dialog) para
// valer em todos os programas TypeScript que compilam o editor via imports —
// um .d.ts ambiente fora do grafo de imports não alcança playground e tests.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": MathFieldElementProps;
    }
  }
}

export interface MathfieldLike extends HTMLElement {
  value: string;
  defaultMode: "inline-math" | "math" | "text";
  readonly menuItems: readonly unknown[];
  mathVirtualKeyboardPolicy: "auto" | "manual";
  executeCommand(command: string): boolean;
  focus(options?: FocusOptions): void;
  getValue(format?: "latex"): string;
  insert(value: string): boolean;
}

interface MathVirtualKeyboardLike {
  layouts: readonly (string | Record<string, unknown>)[];
  hide(): void;
  show(): void;
}

interface MathLiveWindow {
  readonly mathVirtualKeyboard?: MathVirtualKeyboardLike;
}

export function getMathVirtualKeyboard(): MathVirtualKeyboardLike | undefined {
  return (window as unknown as MathLiveWindow).mathVirtualKeyboard;
}

export function getMathfield(
  element: HTMLElement | null,
): MathfieldLike | null {
  if (element === null || !("getValue" in element)) {
    return null;
  }

  return element as MathfieldLike;
}
