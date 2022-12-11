import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./lib"),
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
        "@fortawesome/fontawesome-free-solid",
        "@fortawesome/fontawesome-svg-core",
        "@fortawesome/free-solid-svg-icons",
        "@fortawesome/react-fontawesome",
        "@stitches/react",
        "ace-builds",
        "babel-plugin-macros",
        "copy-text-to-clipboard",
        "highlight-words",
        "lodash",
        "minisearch",
        "prettier",
        "react-ace",
        "react-helmet",
        "react-laag",
        "react-use",
        "react-use-scroll-lock",
        "short-uuid",
        "use-keyboard-shortcut",
        "react",
        "react-router-dom",
      ],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          "@fortawesome/fontawesome-free-solid":
            "fortawesomefontawesomefreesolid",
          "@fortawesome/fontawesome-svg-core": "fortawesomefontawesomesvgcore",
          "@fortawesome/free-solid-svg-icons": "fortawesomefreesolidsvgicons",
          "@fortawesome/react-fontawesome": "fortawesomereactfontawesome",
          "@stitches/react": "stitchesreact",
          "ace-builds": "acebuilds",
          "babel-plugin-macros": "babelpluginmacros",
          "copy-text-to-clipboard": "copytexttoclipboard",
          "highlight-words": "highlightwords",
          "lodash": "lodash",
          "minisearch": "minisearch",
          "prettier": "prettier",
          "react-ace": "reactace",
          "react-helmet": "reacthelmet",
          "react-laag": "reactlaag",
          "react-use": "reactuse",
          "react-use-scroll-lock": "reactusescrolllock",
          "short-uuid": "shortuuid",
          "use-keyboard-shortcut": "usekeyboardshortcut",
          "react": "react",
          "react-router-dom": "reactrouterdom",
        },
      },
    },
  },
})
