import React from "react"
import * as styles from "./Footer.css"

type FooterProps = {
  copyright: string
}

export const Footer = ({ copyright }: FooterProps) => {
  return (
    <div className={styles.footerContainer}>
      <div className={styles.copyright}>{copyright}</div>
    </div>
  )
}
