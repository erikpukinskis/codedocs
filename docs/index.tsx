import React from "react"
import { render } from "react-dom"
// eslint-disable-next-line no-restricted-imports
import { DocsApp } from "../macro"
import { DemoDocs } from "./Demo.docs"
import { DocDocs } from "./Doc.docs"
import { VeryLongDocumentPathDocs } from "./DocWithAVeryLongTitle.docs"
import { EditorDocs } from "./Editor.docs"
import { GettingStartedDocs } from "./GettingStarted.docs"
import { HomePageDocs } from "./HomePage.docs"

render(
  <DocsApp
    logo="Codedocs"
    icon="book"
    copyright="Copyright © 2022 Outerframe, Inc"
    docs={[
      DemoDocs,
      DocDocs,
      EditorDocs,
      GettingStartedDocs,
      HomePageDocs,
      VeryLongDocumentPathDocs,
    ]}
    githubUrl="https://github.com/ambic-js/codedocs"
  />,
  document.getElementById("root")
)
