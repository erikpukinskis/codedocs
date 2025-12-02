import React from "react"

export type DocProps = {
  path: string
  order?: number
  children?: React.ReactNode
}

/**
 * Register a documentation page. You should render this component and export it
 * as your default export from your documentation files.
 *
 * Ex:
 *
 *       export default (
 *         <Doc path="/Layout/Page">
 *           <p>Add introductory documentation here.</p>
 *           <img src="/and/images/etc.png" />
 *         </Doc>
 *       )
 *
 * Then you can add the page to a Codedocs site like this:
 *
 *       import * as MyDocs from "~/path/to/MyDocs.docs.tsx"
 *       import { Docs } from "codedocs"
 *       import { render } from "react-dom"
 *
 *       render(
 *         <Docs
 *           docs={[MyDocs]}
 *           ...
 *         />
 *       )
 *
 * See the <Docs> component documentation for more details.
 *
 * Note: This component doesn't do anything with its props (other than its
 * children which it renders out). The props are only used by the macros, which
 * registers the demos, the doc path, etc.
 */
export const Doc = ({ children }: DocProps) => <>{children}</>
