import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: new URL("./src/index.ts", import.meta.url).pathname,
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
    },
    rollupOptions: {
      external: [
        /^react(?:\/.*)?$/,
        /^react-dom(?:\/.*)?$/,
        /^@mui\/material(?:\/.*)?$/,
        /^@emotion\/react(?:\/.*)?$/,
        /^@emotion\/styled(?:\/.*)?$/,
      ],
    },
    // Sem sourcemaps na publicação: ~65% menor, sem perda de funcionalidade
    // (os .map só servem a step-through no bundle; os .d.ts continuam saindo).
    sourcemap: false,
  },
  plugins: [
    dts({
      // Sem declaration maps: só seriam úteis com os .ts de origem, que não
      // publicamos. Os .d.ts (tipos) continuam saindo normalmente.
      compilerOptions: { declarationMap: false },
      entryRoot: "src",
      exclude: ["src/**/*.test.ts"],
      insertTypesEntry: true,
      tsconfigPath: "./tsconfig.json",
    }),
  ],
});
