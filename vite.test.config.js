import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./lib/test/vitest-setup.ts"],
  },

  plugins: [
    tsconfigPaths(),
    react({
      babel: {
        plugins: ["babel-plugin-macros"],
      },
    }),
  ],

  build: {
    rollupOptions: {},
  },
})
