import React from "react"
import { createRoot } from "react-dom/client"
// eslint-disable-next-line no-restricted-imports
import { DocsApp } from "../macro"
import { ComponentDocs } from "./Component.docs"
import { DemoDocs } from "./Demo.docs"
import { DocDocs } from "./Doc.docs"
import { GettingStartedDocs } from "./GettingStarted.docs"
import { HomePageDocs } from "./HomePage.docs"
import { MockupDocs } from "./Mockup.docs"
import { TestDocs } from "./Test.docs"
import { ToolbarDocs } from "~/Components/Toolbar.docs"

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
      GettingStartedDocs,
      DocDocs,
      DemoDocs,
      ComponentDocs,
      MockupDocs,
      HomePageDocs,
      TestDocs,
      ToolbarDocs,
    ]}
    githubUrl="https://github.com/ambic-js/codedocs"
  />
)
