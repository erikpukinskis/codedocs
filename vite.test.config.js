import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import macros from "vite-plugin-babel-macros"

export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./lib/test/vitest-setup.ts"],
  },

  plugins: [
    macros(),
    tsconfigPaths(),
    vanillaExtractPlugin(),
    react({
      fastRefresh: false,
      babel: {
        plugins: ["babel-plugin-macros"],
      },
    }),
  ],

  build: {
    rollupOptions: {},
  },
})
