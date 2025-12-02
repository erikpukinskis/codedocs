import React from "react"
import { COLORS } from "./GlobalStyles"
import * as styles from "./Footer.css"

type FooterProps = {
  copyright: string
}

export const Footer = ({ copyright }: FooterProps) => {
  const setHoverColor = (color: string) => () => {
    document.documentElement.style.setProperty("--hover-color", color)
  }

  return (
    <div className={styles.footerContainer}>
      <div className={styles.swatches}>
        {COLORS.map((color) => (
          <div
            key={color}
            className={styles.swatch}
            style={{ background: color }}
            onClick={setHoverColor(color)}
          />
        ))}
      </div>
      <div className={styles.copyright}>{copyright}</div>
    </div>
  )
}
