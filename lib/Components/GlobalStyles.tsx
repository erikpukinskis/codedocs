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

      h1, h2, h3, h4 {
        font-weight: 500;
        margin-top: 1em;
        margin-bottom: 1em;
      }

      h1 {
        margin-top: 0.75em;
        font-size: 1.5em;
      }

      h2 {
        font-size: 1em;
        font-weight: 500;
        margin-top: 2em;
      }
      li {
        list-style-type: disc;
        margin-left: 1em;
        margin-top: 1em;
        margin-bottom: 1em;
      }

      p {
        margin-top: 1em;
        margin-bottom: 1em;
        max-width: 500;
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
        color: #ff87ff;
      }
  `}</style>
  </>
)
