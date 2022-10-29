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
        font-size: 18px;
        font-family: sans-serif;
        color: #222;
        line-height: 1.3em;
      }

      h1, h2, h3, h4 {
        font-weight: normal;
      }

      pre {
        background: #444;
        color: white;
        padding: 12px;
        border-radius: 4px;
        font-family: 'Recursive', monospace;
        font-size: 0.9em;
        overflow-x: scroll;
      }

      code {
        padding: 0.2em;
        font-size: 0.9em;
        color: #9980fa;
        background: rgba(153,128,250,.1);
        border-radius: 4px;
        font-family: 'Recursive', monospace;
      }

      a {
        text-decoration: none;
        color: #449f32;
        line-height: 1em;
      }
  `}</style>
  </>
)
