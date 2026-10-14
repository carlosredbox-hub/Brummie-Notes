import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    target: "chrome107",
    outDir: "dist",
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 8000,
  },
  worker: { format: "es" },
});
