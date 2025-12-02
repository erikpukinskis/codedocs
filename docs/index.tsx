import React from "react"
import { render } from "react-dom"
// eslint-disable-next-line no-restricted-imports
import { DocsApp } from "../macro"
import * as Demo from "./Demo.docs"
import * as GettingStarted from "./GettingStarted.docs"
import * as Home from "./HomePage.docs"

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
