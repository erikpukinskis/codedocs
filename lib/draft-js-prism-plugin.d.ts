import { type EditorPlugin } from "@draft-js-plugins/editor"

declare module "draft-js-prism-plugin" {
  export default function createPrismPlugin(): EditorPlugin
}
