import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"

const inCodespace = Boolean(process.env.GITHUB_CODESPACE_TOKEN)

export default defineConfig({
  ...(inCodespace
    ? {
        hmr: {
          port: 443,
        },
      }
    : {}),

  plugins: [
    tsconfigPaths(),
    vanillaExtractPlugin(),
    react({
      babel: {
        plugins: ["babel-plugin-macros"],
      },
    }),
  ],

  build: {
    outDir: "site",
    assetsDir: "./",

    rollupOptions: {
      input: path.resolve(__dirname, "docs", "index.html"),
    },
  },
})
