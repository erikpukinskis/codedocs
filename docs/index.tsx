import React from "react"
import { render } from "react-dom"
import { DocsApp } from "../lib"
import * as GettingStartedDocs from "./GettingStarted.docs"
import * as HomeDocs from "./Home.docs"

render(
  <DocsApp
    logo="Codedocs"
    icon="readme"
    docs={[HomeDocs, GettingStartedDocs]}
    githubUrl="https://github.com/ambic-js/codedocs"
  />,
  document.getElementById("root")
)
