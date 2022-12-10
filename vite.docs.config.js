import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const inCodespace = Boolean(process.env.GITHUB_CODESPACE_TOKEN)

export default defineConfig({
  ...(inCodespace
    ? {
        hmr: {
          port: 443,
        },
      }
    : {}),

  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./lib"),
    },
  },

  plugins: [react()],

  build: {
    outDir: "site",
    assetsDir: "./",

    rollupOptions: {
      input: path.resolve(__dirname, "docs", "index.html"),
    },
  },
})
