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
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "lib/index.ts"),
      name: "Codedocs",
      fileName: (format) => `lib.${format}.js`,
    },

    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        "@stitches/react",
        "highlight-words",
        "lodash",
        "minisearch",
        "react",
        "react-children-utilities",
        "react-laag",
        "stopwords-json",
        "use-keyboard-shortcut",
        "react-router-dom",
      ],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          "@stitches/react": "stitchesreact",
          "highlight-words": "highlightwords",
          "lodash": "lodash",
          "minisearch": "minisearch",
          "react": "react",
          "react-children-utilities": "reactchildrenutilities",
          "react-laag": "reactlaag",
          "stopwords-json": "stopwordsjson",
          "use-keyboard-shortcut": "usekeyboardshortcut",
          "react-router-dom": "reactrouterdom",
        },
      },
    },
  },
})
