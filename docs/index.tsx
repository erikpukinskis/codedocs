import React from "react"
import { createRoot } from "react-dom/client"
// eslint-disable-next-line no-restricted-imports
import { DocsApp } from "../macro"
import { CanvasDocs } from "./Canvas.docs"
import { DemoDocs } from "./Demo.docs"
import { DocDocs } from "./Doc.docs"
import { VeryLongDocumentPathDocs } from "./DocWithAVeryLongTitle.docs"
import { GettingStartedDocs } from "./GettingStarted.docs"
import { HomePageDocs } from "./HomePage.docs"
import { MockupDocs } from "./Mockup.docs"

const root = document.getElementById("root")

if (!root) {
  throw new Error("#root element not found in index.html")
}

createRoot(root).render(
  <DocsApp
    logo="Codedocs"
    icon="book"
    copyright="Copyright © 2022 Outerframe, Inc"
    docs={[
      CanvasDocs,
      DemoDocs,
      DocDocs,
      MockupDocs,
      GettingStartedDocs,
      HomePageDocs,
      VeryLongDocumentPathDocs,
    ]}
    githubUrl="https://github.com/ambic-js/codedocs"
  />
)
