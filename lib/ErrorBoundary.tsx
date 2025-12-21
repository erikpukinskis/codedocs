import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React from "react"
import { outdentIcon } from "./Demo.css"
import * as styles from "./ErrorBoundary.css"

type ErrorBoundaryProps = { children: React.ReactNode; location?: "demo-area" }

export class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state: {
    hasError: boolean
    error?: Error
    message?: string
  }
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, message: error.message }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    if (this.props.location === "demo-area") {
      return (
        <div className={styles.demoErrorContainer}>
          <FontAwesomeIcon icon="bug" color="#ff6666" className={outdentIcon} />
          <div className={styles.demoErrorHeading}>
            Error rendering demo
            {this.state.message && `: "${this.state.message}"`}
          </div>
          <div className={styles.demoErrorDetails}>
            Check the console for details.
          </div>
        </div>
      )
    }

    return (
      <>
        <h1>
          this.state.message Something went wrong
          {this.state.message && `: ${this.state.message}`}
        </h1>
        <p>Check the console for details.</p>
      </>
    )
  }
}
