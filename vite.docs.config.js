import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./lib"),
    },
  },

  plugins: [react()],

  build: {
    outDir: 'site',
    assetsDir: "./",
    rollupOptions: {
      input: path.resolve(__dirname, "docs", "index.html")
    },
  },
})
