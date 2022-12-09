import React from "react"

export const COLORS = [
  "#5ac0d0",
  "#9FC4C6",
  "#B3E4E8",
  "#75d9c3",
  "#7dcf7d",
  "#F6A3A9",
  "#FBB39D",
  "#F7C6B8",
  "#d4a87f",
  "#9a7248",
  "#BD9D96",
  "#d06d9c",
  "#d8aa85",
  "#b7d38c",
]

function randomInt(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const hoverColorIndex = randomInt(0, COLORS.length - 1)
const hoverColor = COLORS[hoverColorIndex]

export const GlobalStyles = () => (
  <>
    <link rel="preconnect" href="https://rsms.me/" />
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    <link
      href="https://fonts.googleapis.com/css2?family=Recursive:wght,CRSV,MONO@360,0,1&display=swap"
      rel="stylesheet"
    ></link>

    <style>{`
      :root {
        --hover-color: ${hoverColor};
      }

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
        color: #333;
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
        margin-top: 1em;
        margin-bottom: 1em;
        margin-left: 16px;
        max-width: 40em;
        color: #333;
        font-weight: 500;
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
  `}</style>
  </>
)
