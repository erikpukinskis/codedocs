import React from "react"
console.log("ErrorBoundary!")
export class ErrorBoundary extends React.Component {
  state: {
    hasError: boolean
    error?: Error
  }
  constructor() {
    super({})
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <>
          <h2>Something went wrong.</h2>
          <p>Check the console for details.</p>
        </>
      )
    } else {
      return this.props.children
    }
  }
}
