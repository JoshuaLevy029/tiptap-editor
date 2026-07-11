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
    sourcemap: true,
  },
  plugins: [
    dts({
      entryRoot: "src",
      exclude: ["src/**/*.test.ts"],
      insertTypesEntry: true,
      tsconfigPath: "./tsconfig.json",
    }),
  ],
});
