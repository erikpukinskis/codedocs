import * as HomeDocs from "./Home.docs"
import * as GettingStartedDocs from "./GettingStarted.docs"
import { DocsApp } from "../lib"
import React from "react"
import { render } from "react-dom"

render(
  <DocsApp
    logo="Code Docs"
    docs={[HomeDocs, GettingStartedDocs]}
    githubUrl="https://github.com/ambic-js/codedocs"
  />,
  document.getElementById("root")
)
