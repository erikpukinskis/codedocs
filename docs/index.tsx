import React from "react"
import { render } from "react-dom"
import * as Demo from "./Demo.docs"
import * as GettingStarted from "./GettingStarted.docs"
import * as Home from "./HomePage.docs"
import { DocsApp } from "~/index"

render(
  <DocsApp
    logo="Codedocs"
    icon="book"
    copyright="Copyright © 2022 Outerframe, Inc"
    docs={[Home, GettingStarted, Demo]}
    githubUrl="https://github.com/ambic-js/codedocs"
  />,
  document.getElementById("root")
)
