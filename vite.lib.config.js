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
        "@draft-js-plugins/editor",
        "@fortawesome/fontawesome-free-solid",
        "@fortawesome/fontawesome-svg-core",
        "@fortawesome/free-solid-svg-icons",
        "@fortawesome/react-fontawesome",
        "@stitches/react",
        "draft-js",
        "draft-js-prism-plugin",
        "highlight-words",
        "lodash",
        "minisearch",
        "prismjs",
        "react",
        "react-laag",
        "short-uuid",
        "use-keyboard-shortcut",
        "react-router-dom",
      ],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          "@draft-js-plugins/editor": "draftjspluginseditor",
          "@fortawesome/fontawesome-free-solid":
            "fortawesomefontawesomefreesolid",
          "@fortawesome/fontawesome-svg-core": "fortawesomefontawesomesvgcore",
          "@fortawesome/free-solid-svg-icons": "fortawesomefreesolidsvgicons",
          "@fortawesome/react-fontawesome": "fortawesomereactfontawesome",
          "@stitches/react": "stitchesreact",
          "draft-js": "draftjs",
          "draft-js-prism-plugin": "draftjsprismplugin",
          "highlight-words": "highlightwords",
          "lodash": "lodash",
          "minisearch": "minisearch",
          "prismjs": "prismjs",
          "react": "react",
          "react-laag": "reactlaag",
          "short-uuid": "shortuuid",
          "use-keyboard-shortcut": "usekeyboardshortcut",
          "react-router-dom": "reactrouterdom",
        },
      },
    },
  },
})
