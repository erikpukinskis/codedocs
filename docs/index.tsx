import React from "react"
import { render } from "react-dom"
import * as GettingStartedDocs from "./GettingStarted.docs"
import * as HomeDocs from "./HomePage.docs"
import { DocsApp } from "~/index"

render(
  <DocsApp
    logo="Codedocs"
    icon="book"
    copyright="Copyright © 2022 Outerframe, Inc"
    docs={[HomeDocs, GettingStartedDocs]}
    githubUrl="https://github.com/ambic-js/codedocs"
  />,
  document.getElementById("root")
)
