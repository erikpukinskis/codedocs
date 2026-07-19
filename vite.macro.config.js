import path from "path"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],

  build: {
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "lib/macro.ts"),
      name: "codedocsMacro",
      fileName: () => "macro.js",
      formats: ["cjs"],
    },

    rollupOptions: {
      external: [
        "babel-plugin-macros",
        "@babel/traverse",
        "@babel/types",
        "prettier",
        "prettier/parser-typescript",
      ],
    },
  },
})
