import * as HomeDocs from "./Home.docs"
import * as GettingStartedDocs from "./GettingStarted.docs"
import { DocsApp } from ".."
import React from "react"
import { render } from "react-dom"

render(
  <DocsApp docs={[HomeDocs, GettingStartedDocs]} />,
  document.getElementById("root")
)
