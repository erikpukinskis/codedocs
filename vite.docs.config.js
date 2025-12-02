import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import macros from "vite-plugin-babel-macros"

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
      "codedocs/macro": path.resolve(__dirname, "macro"),
      codedocs: path.resolve(__dirname, "lib"),
    },
  },

  plugins: [
    macros(),
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
