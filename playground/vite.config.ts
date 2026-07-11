import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: new URL(".", import.meta.url).pathname,
  plugins: [react()],
  resolve: {
    alias: {
      "@joshualevy029/tiptap-editor": new URL("../src/index.ts", import.meta.url)
        .pathname,
    },
  },
});
