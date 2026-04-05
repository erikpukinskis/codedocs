import React from "react"

export const GlobalStyles = () => (
  <>
    <link rel="preconnect" href="https://rsms.me/" />
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    <link
      href="https://fonts.googleapis.com/css2?family=Recursive:wght,CRSV,MONO@360,0,1&display=swap"
      rel="stylesheet"
    ></link>

    <style>{`
      body {
        margin: 0;
        padding: 0;
        font-size: 16px;
        font-family: sans-serif;
        color: #222;
        line-height: 1.3em;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
      }

      input {
        font-size: 1em;
      }

      h1, h2, h3 {
        font-weight: 500;
        color: #333;
      }

      h1 {
        margin-block: 1em;
        font-size: 1.5em;
      }

      *:focus-visible {
        outline: 2px solid #434fff33;
      }

      h2 {
        font-size: 1.1em;
        font-weight: 500;
        margin-block: 1em;
      }

      h3 {
        font-size: 1em;
        margin-block: 0;
        color: #778;
      }

      li {
        list-style-type: disc;
        margin-top: 1em;
        margin-bottom: 1em;
        margin-left: 16px;
        max-width: 40em;
        color: #333;
      }

      ul {
        padding: 0;
        padding-left: 32px;
      }

      p {
        margin-top: 1em;
        margin-bottom: 1em;
        max-width: 42em;
      },

      pre {
        background: #444;
        color: white;
        padding: 12px;
        border-radius: 4px;
        font-family: 'Recursive', monospace;
        font-size: 0.9em;
        overflow-x: scroll;
      }

      a {
        text-decoration: none;
        line-height: 1em;
        font-weight: 500;
        color: black;
      }

      a:hover {
        color: var(--hover-color);
      }

      .ace_editor .ace_marker-layer .ace_bracket {
        display: none;
      }

      .ace_editor .ace_cursor-layer .ace_cursor {
        display: none !important;
      }

      .ace_editor {
        margin-left: -6px;
      }

      .ace_editor, .ace_gutter {
        background: #4d446e !important;
      }

      code {
        background: #ede8ff;
        padding: 2px 4px;
        color: #6b54c0;
        font-size: 0.85em;
        vertical-align: 0.4px;
        border-radius: 4px;
      }
`}</style>
  </>
)
