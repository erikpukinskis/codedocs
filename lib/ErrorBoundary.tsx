import React from "react"

type ErrorBoundaryProps = { children: React.ReactNode }

export class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state: {
    hasError: boolean
    error?: Error
  }
  constructor(props: ErrorBoundaryProps) {
    super(props)
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
          <h1>Something went wrong</h1>
          <p>Check the console for details</p>
        </>
      )
    } else {
      return this.props.children
    }
  }
}
