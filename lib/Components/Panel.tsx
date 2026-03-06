import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React from "react"
import * as styles from "./Panel.css"
import type { PanelHeaderProps, PanelProps } from "~/ComponentTypes"

export const Panel: React.FC<PanelProps> = ({
  children,
  hasNeighbors,
  ...props
}) => (
  <div className={styles.Panel({ hasNeighbors })} {...props}>
    {children}
  </div>
)

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  children,
  isOpen,
  ...props
}) => (
  <div className={styles.PanelHeader({ isOpen })} {...props}>
    {children}
    {isOpen !== undefined && (
      <FontAwesomeIcon
        icon={isOpen ? "chevron-down" : "chevron-up"}
        size="xs"
      />
    )}
  </div>
)
